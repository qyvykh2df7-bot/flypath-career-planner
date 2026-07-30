import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";
import { getContentOsTikTokConfiguration } from "@/lib/warhome/content-os-tiktok-config";
import {
  CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE,
  CONTENT_OS_TIKTOK_REQUIRED_SCOPES,
} from "@/lib/warhome/content-os-tiktok-contract";

export const runtime = "nodejs";

const COOKIE_PATH = "/api/warhome/content/integrations/tiktok";

export async function GET() {
  try {
    await requireWarhomeAdmin();
    console.log({
      TIKTOK_CLIENT_KEY: Boolean(process.env.TIKTOK_CLIENT_KEY),
      TIKTOK_CLIENT_SECRET: Boolean(process.env.TIKTOK_CLIENT_SECRET),
      TIKTOK_REDIRECT_URI: Boolean(process.env.TIKTOK_REDIRECT_URI),
      CONTENT_OS_TIKTOK_TOKEN_ENCRYPTION_KEY: Boolean(
        process.env.CONTENT_OS_TIKTOK_TOKEN_ENCRYPTION_KEY,
      ),
    });
    const configuration = getContentOsTikTokConfiguration();
    const state = randomBytes(32).toString("base64url");
    const authorizeUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
    authorizeUrl.searchParams.set("client_key", configuration.clientKey);
    authorizeUrl.searchParams.set(
      "scope",
      CONTENT_OS_TIKTOK_REQUIRED_SCOPES.join(","),
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("redirect_uri", configuration.redirectUri);
    authorizeUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: COOKIE_PATH,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: "TikTok connection is unavailable.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
