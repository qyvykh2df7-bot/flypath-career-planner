import "server-only";

import {
  CONTENT_OS_TIKTOK_LIMITS,
  CONTENT_OS_TIKTOK_REQUIRED_SCOPES,
  extractTikTokHashtags,
  normalizeTikTokUrl,
  type ContentOsTikTokProviderVideo,
} from "@/lib/warhome/content-os-tiktok-contract";
import type { ContentOsTikTokConfiguration } from "@/lib/warhome/content-os-tiktok-config";

const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_REVOKE_URL = "https://open.tiktokapis.com/v2/oauth/revoke/";
const TIKTOK_USER_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url";
const TIKTOK_VIDEO_FIELDS = [
  "id",
  "create_time",
  "share_url",
  "video_description",
  "duration",
  "title",
  "like_count",
  "comment_count",
  "share_count",
  "view_count",
].join(",");
const TIKTOK_VIDEO_LIST_URL =
  `https://open.tiktokapis.com/v2/video/list/?fields=${TIKTOK_VIDEO_FIELDS}`;

type Fetcher = typeof fetch;
type UnknownRecord = Record<string, unknown>;

export type ContentOsTikTokTokens = {
  openId: string;
  scopes: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export type ContentOsTikTokUser = {
  openId: string;
  unionId: string | null;
  displayName: string;
  avatarUrl: string | null;
};

export class ContentOsTikTokProviderError extends Error {
  readonly issue:
    | "connection"
    | "authentication"
    | "scope"
    | "response"
    | "rate_limit";

  constructor(issue: ContentOsTikTokProviderError["issue"]) {
    super(`Content OS TikTok provider unavailable: ${issue}`);
    this.name = "ContentOsTikTokProviderError";
    this.issue = issue;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ContentOsTikTokProviderError("response");
  }
}

function providerIssue(response: Response): ContentOsTikTokProviderError {
  if (response.status === 401 || response.status === 403) {
    return new ContentOsTikTokProviderError("authentication");
  }
  if (response.status === 429) {
    return new ContentOsTikTokProviderError("rate_limit");
  }
  return new ContentOsTikTokProviderError("response");
}

async function providerFetch(
  fetcher: Fetcher,
  input: string,
  init: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(input, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ContentOsTikTokProviderError("connection");
  }
  if (!response.ok) throw providerIssue(response);
  const body = await safeJson(response);
  if (
    isRecord(body) &&
    isRecord(body.error) &&
    body.error.code !== undefined &&
    body.error.code !== "ok"
  ) {
    throw new ContentOsTikTokProviderError("response");
  }
  return body;
}

function tokenPayload(value: unknown): Omit<
  ContentOsTikTokTokens,
  "accessTokenExpiresAt" | "refreshTokenExpiresAt"
> & {
  expiresIn: number;
  refreshExpiresIn: number;
} {
  const row = isRecord(value) ? value : null;
  const accessToken = row?.access_token;
  const refreshToken = row?.refresh_token;
  const openId = row?.open_id;
  const scope = row?.scope;
  const expiresIn = row?.expires_in;
  const refreshExpiresIn = row?.refresh_expires_in;
  if (
    typeof accessToken !== "string" ||
    !accessToken ||
    typeof refreshToken !== "string" ||
    !refreshToken ||
    typeof openId !== "string" ||
    !openId ||
    typeof scope !== "string" ||
    typeof expiresIn !== "number" ||
    !Number.isSafeInteger(expiresIn) ||
    expiresIn < 60 ||
    typeof refreshExpiresIn !== "number" ||
    !Number.isSafeInteger(refreshExpiresIn) ||
    refreshExpiresIn < 60
  ) {
    throw new ContentOsTikTokProviderError("response");
  }
  const scopes = scope
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (
    !CONTENT_OS_TIKTOK_REQUIRED_SCOPES.every((required) =>
      scopes.includes(required),
    )
  ) {
    throw new ContentOsTikTokProviderError("scope");
  }
  return {
    accessToken,
    refreshToken,
    openId,
    scopes,
    expiresIn,
    refreshExpiresIn,
  };
}

function withExpirations(
  value: ReturnType<typeof tokenPayload>,
  now: Date,
): ContentOsTikTokTokens {
  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    openId: value.openId,
    scopes: value.scopes,
    accessTokenExpiresAt: new Date(
      now.getTime() + value.expiresIn * 1_000,
    ).toISOString(),
    refreshTokenExpiresAt: new Date(
      now.getTime() + value.refreshExpiresIn * 1_000,
    ).toISOString(),
  };
}

export async function exchangeContentOsTikTokCode(
  code: string,
  configuration: ContentOsTikTokConfiguration,
  options: { fetcher?: Fetcher; now?: Date } = {},
): Promise<ContentOsTikTokTokens> {
  if (!code || code.length > 2_000) {
    throw new ContentOsTikTokProviderError("authentication");
  }
  const body = new URLSearchParams({
    client_key: configuration.clientKey,
    client_secret: configuration.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: configuration.redirectUri,
  });
  const response = await providerFetch(
    options.fetcher ?? fetch,
    TIKTOK_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  return withExpirations(tokenPayload(response), options.now ?? new Date());
}

export async function refreshContentOsTikTokTokens(
  refreshToken: string,
  configuration: ContentOsTikTokConfiguration,
  options: { fetcher?: Fetcher; now?: Date } = {},
): Promise<ContentOsTikTokTokens> {
  if (!refreshToken) {
    throw new ContentOsTikTokProviderError("authentication");
  }
  const body = new URLSearchParams({
    client_key: configuration.clientKey,
    client_secret: configuration.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const response = await providerFetch(
    options.fetcher ?? fetch,
    TIKTOK_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  return withExpirations(tokenPayload(response), options.now ?? new Date());
}

export async function revokeContentOsTikTokAccess(
  accessToken: string,
  configuration: ContentOsTikTokConfiguration,
  options: { fetcher?: Fetcher } = {},
): Promise<void> {
  if (!accessToken) {
    throw new ContentOsTikTokProviderError("authentication");
  }
  const fetcher = options.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(TIKTOK_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: configuration.clientKey,
        client_secret: configuration.clientSecret,
        token: accessToken,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ContentOsTikTokProviderError("connection");
  }
  if (!response.ok) throw providerIssue(response);
}

export async function getContentOsTikTokUser(
  accessToken: string,
  options: { fetcher?: Fetcher } = {},
): Promise<ContentOsTikTokUser> {
  const response = await providerFetch(
    options.fetcher ?? fetch,
    TIKTOK_USER_URL,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const user =
    isRecord(response) && isRecord(response.data) && isRecord(response.data.user)
      ? response.data.user
      : null;
  if (
    !user ||
    typeof user.open_id !== "string" ||
    !user.open_id ||
    typeof user.display_name !== "string" ||
    !user.display_name
  ) {
    throw new ContentOsTikTokProviderError("response");
  }
  return {
    openId: user.open_id,
    unionId:
      typeof user.union_id === "string" && user.union_id
        ? user.union_id
        : null,
    displayName: user.display_name.slice(
      0,
      CONTENT_OS_TIKTOK_LIMITS.displayName,
    ),
    avatarUrl:
      typeof user.avatar_url === "string" &&
      normalizeTikTokUrl(user.avatar_url)
        ? user.avatar_url
        : null,
  };
}

function optionalMetric(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 1_000_000_000
    ? value
    : null;
}

function mapProviderVideo(value: unknown): ContentOsTikTokProviderVideo | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const providerVideoId = row.id;
  const shareUrl = row.share_url;
  const caption =
    typeof row.video_description === "string"
      ? row.video_description
      : typeof row.title === "string"
        ? row.title
        : "";
  const createTime = row.create_time;
  const duration = row.duration;
  if (
    typeof providerVideoId !== "string" ||
    !providerVideoId ||
    typeof shareUrl !== "string" ||
    !normalizeTikTokUrl(shareUrl) ||
    typeof createTime !== "number" ||
    !Number.isSafeInteger(createTime) ||
    createTime <= 0 ||
    caption.length > CONTENT_OS_TIKTOK_LIMITS.caption ||
    (duration !== undefined &&
      (typeof duration !== "number" ||
        !Number.isSafeInteger(duration) ||
        duration < 1 ||
        duration > 36_000))
  ) {
    return null;
  }
  return {
    providerVideoId,
    shareUrl,
    caption,
    hashtags: extractTikTokHashtags(caption),
    durationSeconds: typeof duration === "number" ? duration : null,
    publishedAt: new Date(createTime * 1_000).toISOString(),
    views: optionalMetric(row.view_count),
    likes: optionalMetric(row.like_count),
    comments: optionalMetric(row.comment_count),
    shares: optionalMetric(row.share_count),
  };
}

export async function listContentOsTikTokVideos(
  accessToken: string,
  maxVideos: number,
  options: { fetcher?: Fetcher } = {},
): Promise<ContentOsTikTokProviderVideo[]> {
  const fetcher = options.fetcher ?? fetch;
  const result: ContentOsTikTokProviderVideo[] = [];
  let cursor: number | undefined;

  while (result.length < maxVideos) {
    const pageSize = Math.min(20, maxVideos - result.length);
    const body: { max_count: number; cursor?: number } = {
      max_count: pageSize,
    };
    if (cursor !== undefined) body.cursor = cursor;
    const response = await providerFetch(fetcher, TIKTOK_VIDEO_LIST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data =
      isRecord(response) && isRecord(response.data) ? response.data : null;
    if (!data || !Array.isArray(data.videos)) {
      throw new ContentOsTikTokProviderError("response");
    }
    for (const rawVideo of data.videos) {
      const video = mapProviderVideo(rawVideo);
      if (!video) throw new ContentOsTikTokProviderError("response");
      result.push(video);
    }
    if (data.has_more !== true || typeof data.cursor !== "number") break;
    if (cursor === data.cursor || data.videos.length === 0) break;
    cursor = data.cursor;
  }

  return result.slice(0, maxVideos);
}
