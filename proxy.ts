import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getWarhomeAccessDecision,
  WARHOME_HOME_PATH,
  WARHOME_LOGIN_PATH,
  WARHOME_PUBLIC_EXIT_PATH,
} from "@/lib/warhome/access";
import { getWarhomeAuthorizationForAuthenticatedUser } from "@/lib/warhome/auth";

function getSupabaseProxyConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) throw new Error("Missing Supabase proxy configuration");
  return { url, anonKey };
}

function redirectWithSessionCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string,
): NextResponse {
  const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseProxyConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return request.nextUrl.pathname === WARHOME_LOGIN_PATH
      ? response
      : redirectWithSessionCookies(request, response, WARHOME_LOGIN_PATH);
  }

  try {
    const decision = getWarhomeAccessDecision(
      await getWarhomeAuthorizationForAuthenticatedUser({ userId: user.id }),
    );

    if (decision.type === "allow") {
      return request.nextUrl.pathname === WARHOME_LOGIN_PATH
        ? redirectWithSessionCookies(request, response, WARHOME_HOME_PATH)
        : response;
    }

    if (decision.type === "redirect_to_public_home") {
      return redirectWithSessionCookies(request, response, WARHOME_PUBLIC_EXIT_PATH);
    }
  } catch {
    // No cerramos la sesión general si no se puede verificar la autorización administrativa.
    return redirectWithSessionCookies(request, response, WARHOME_PUBLIC_EXIT_PATH);
  }

  return redirectWithSessionCookies(request, response, WARHOME_LOGIN_PATH);
}

export const config = {
  matcher: ["/warhome/:path*"],
};
