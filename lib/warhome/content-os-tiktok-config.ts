import "server-only";

import { CONTENT_OS_TIKTOK_LIMITS } from "@/lib/warhome/content-os-tiktok-contract";

export type ContentOsTikTokConfiguration = {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  encryptionKey: Buffer;
  syncMaxVideos: number;
};

export class ContentOsTikTokConfigurationError extends Error {
  readonly issue:
    | "missing"
    | "redirect_uri"
    | "encryption_key"
    | "sync_limit";

  constructor(issue: ContentOsTikTokConfigurationError["issue"]) {
    super(`Content OS TikTok configuration unavailable: ${issue}`);
    this.name = "ContentOsTikTokConfigurationError";
    this.issue = issue;
  }
}

export function parseContentOsTikTokConfiguration(
  environment: NodeJS.ProcessEnv,
): ContentOsTikTokConfiguration {
  const clientKey = environment.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = environment.TIKTOK_CLIENT_SECRET?.trim();
  const redirectUri = environment.TIKTOK_REDIRECT_URI?.trim();
  const encryptionKeyValue =
    environment.CONTENT_OS_TIKTOK_TOKEN_ENCRYPTION_KEY?.trim();
  if (!clientKey || !clientSecret || !redirectUri || !encryptionKeyValue) {
    throw new ContentOsTikTokConfigurationError("missing");
  }

  let parsedRedirect: URL;
  try {
    parsedRedirect = new URL(redirectUri);
  } catch {
    throw new ContentOsTikTokConfigurationError("redirect_uri");
  }
  if (
    parsedRedirect.protocol !== "https:" ||
    parsedRedirect.search ||
    parsedRedirect.hash
  ) {
    throw new ContentOsTikTokConfigurationError("redirect_uri");
  }

  const canonicalOrigin = environment.FLYPATH_CANONICAL_ORIGIN?.trim();
  if (canonicalOrigin) {
    try {
      if (new URL(canonicalOrigin).origin !== parsedRedirect.origin) {
        throw new ContentOsTikTokConfigurationError("redirect_uri");
      }
    } catch (error) {
      if (error instanceof ContentOsTikTokConfigurationError) throw error;
      throw new ContentOsTikTokConfigurationError("redirect_uri");
    }
  }

  let encryptionKey: Buffer;
  try {
    encryptionKey = Buffer.from(encryptionKeyValue, "base64");
  } catch {
    throw new ContentOsTikTokConfigurationError("encryption_key");
  }
  if (encryptionKey.length !== 32) {
    throw new ContentOsTikTokConfigurationError("encryption_key");
  }

  const rawLimit =
    environment.CONTENT_OS_TIKTOK_SYNC_MAX_VIDEOS?.trim() ??
    String(CONTENT_OS_TIKTOK_LIMITS.syncVideosDefault);
  const syncMaxVideos = Number(rawLimit);
  if (
    !Number.isSafeInteger(syncMaxVideos) ||
    syncMaxVideos < 1 ||
    syncMaxVideos > CONTENT_OS_TIKTOK_LIMITS.syncVideosMax
  ) {
    throw new ContentOsTikTokConfigurationError("sync_limit");
  }

  return {
    clientKey,
    clientSecret,
    redirectUri: parsedRedirect.toString(),
    encryptionKey,
    syncMaxVideos,
  };
}

export function getContentOsTikTokConfiguration(): ContentOsTikTokConfiguration {
  return parseContentOsTikTokConfiguration(process.env);
}
