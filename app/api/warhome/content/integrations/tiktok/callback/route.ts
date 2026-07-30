import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";
import { connectContentOsTikTokAccount } from "@/lib/warhome/content-os-tiktok";
import { getContentOsTikTokConfiguration } from "@/lib/warhome/content-os-tiktok-config";
import { CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE } from "@/lib/warhome/content-os-tiktok-contract";

export const runtime = "nodejs";

const CONTENT_OS_TIKTOK_PATH =
  "/warhome/content/integrations/tiktok";
const COOKIE_PATH = "/api/warhome/content/integrations/tiktok";

function sameState(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function redirectWithStatus(
  origin: string,
  status: "connected" | "cancelled" | "error",
) {
  const destination = new URL(CONTENT_OS_TIKTOK_PATH, origin);
  destination.searchParams.set("tiktok", status);
  const response = NextResponse.redirect(destination);
  response.cookies.set(CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: COOKIE_PATH,
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    await requireWarhomeAdmin();
    const origin = new URL(
      getContentOsTikTokConfiguration().redirectUri,
    ).origin;
    const error = request.nextUrl.searchParams.get("error");
    if (error) return redirectWithStatus(origin, "cancelled");
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const expectedState = request.cookies.get(
      CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE,
    )?.value;
    if (
      !code ||
      code.length > 2_000 ||
      !state ||
      !expectedState ||
      !sameState(expectedState, state)
    ) {
      return redirectWithStatus(origin, "error");
    }
    await connectContentOsTikTokAccount(code);
    return redirectWithStatus(origin, "connected");
  } catch {
    return NextResponse.json(
      { error: "TikTok connection could not be completed." },
      { status: 400 },
    );
  }
}
