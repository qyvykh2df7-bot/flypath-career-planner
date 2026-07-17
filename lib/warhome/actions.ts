"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getWarhomeAuthorizationForAuthenticatedUser,
  type AuthenticatedWarhomeUser,
} from "@/lib/warhome/auth";
import { WARHOME_HOME_PATH, WARHOME_LOGIN_PATH } from "@/lib/warhome/access";

const GENERIC_LOGIN_ERROR = "No hemos podido acceder. Comprueba tus credenciales.";

export type WarhomeLoginState = {
  error: string | null;
};

function getCredentials(formData: FormData): { email: string; password: string } | null {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password ||
    email.length > 320 ||
    password.length > 1024
  ) {
    return null;
  }

  return { email: email.trim(), password };
}

async function signOutLocally(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
}

export async function loginWarhome(
  _previousState: WarhomeLoginState,
  formData: FormData,
): Promise<WarhomeLoginState> {
  const credentials = getCredentials(formData);
  if (!credentials) return { error: GENERIC_LOGIN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) return { error: GENERIC_LOGIN_ERROR };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    const authorization = await getWarhomeAuthorizationForAuthenticatedUser({
      userId: user.id,
    } satisfies AuthenticatedWarhomeUser);

    if (authorization.status !== "authorized") {
      return { error: GENERIC_LOGIN_ERROR };
    }
  } catch {
    console.error("[Warhome] Login authorization check failed");
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect(WARHOME_HOME_PATH);
}

export async function logoutWarhome(): Promise<never> {
  await signOutLocally();
  redirect(WARHOME_LOGIN_PATH);
}
