import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireWarhomeAdmin, type WarhomeAdmin } from "@/lib/warhome/auth";
import { ContentOsDataError } from "@/lib/warhome/content-os";
import { loadContentOsBrandProfile } from "@/lib/warhome/content-os-brand";
import { analyzeContentOsTikTokVideos } from "@/lib/warhome/content-os-tiktok-ai";
import { getContentOsTikTokConfiguration } from "@/lib/warhome/content-os-tiktok-config";
import {
  extractTikTokHashtags,
  CONTENT_OS_TIKTOK_LIMITS,
  mapContentOsTikTokConnection,
  mapContentOsTikTokVideo,
  type ContentOsTikTokAnalysis,
  type ContentOsTikTokManualImportInput,
  type ContentOsTikTokProviderVideo,
  type ContentOsTikTokReviewInput,
  type ContentOsTikTokVideo,
  type ContentOsTikTokWorkspace,
} from "@/lib/warhome/content-os-tiktok-contract";
import {
  decryptContentOsTikTokToken,
  encryptContentOsTikTokToken,
} from "@/lib/warhome/content-os-tiktok-crypto";
import {
  exchangeContentOsTikTokCode,
  getContentOsTikTokUser,
  listContentOsTikTokVideos,
  refreshContentOsTikTokTokens,
  revokeContentOsTikTokAccess,
  type ContentOsTikTokTokens,
} from "@/lib/warhome/content-os-tiktok-provider";

const CONTENT_OS_WORKSPACE_KEY = "pilotfeliu";
const CONNECTION_PUBLIC_SELECT =
  "display_name,scopes,connected_at,last_synced_at,last_sync_status";
const CONNECTION_PRIVATE_SELECT =
  "tiktok_open_id,tiktok_union_id,display_name,avatar_url,scopes,access_token_ciphertext,refresh_token_ciphertext,access_token_expires_at,refresh_token_expires_at,sync_lock_id,sync_lock_until,token_refresh_lock_id,token_refresh_lock_until";
const VIDEO_SELECT =
  "id,tiktok_video_id,share_url,caption,hashtags,duration_seconds,published_at,views,likes,comments,shares,saves,import_source,analysis_status,analysis_title,analysis_summary,analysis_hook,analysis_pillar,analysis_objective,analysis_related_product_key,content_item_id";

type RawRecord = Record<string, unknown>;

export type ContentOsTikTokSyncResult = {
  imported: number;
  analyzed: number;
  awaitingReview: number;
  analysisFailed: number;
};

export class ContentOsTikTokConnectionRequiredError extends Error {
  constructor() {
    super("Content OS TikTok connection required");
    this.name = "ContentOsTikTokConnectionRequiredError";
  }
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function textArray(value: unknown): string[] | null {
  return Array.isArray(value) &&
    value.every((entry) => typeof entry === "string")
    ? value
    : null;
}

function manualTikTokVideoId(url: string): string {
  const match = new URL(url).pathname.match(/\/video\/(\d+)/);
  if (match?.[1]) return match[1];
  return `manual_${createHash("sha256").update(url).digest("hex")}`;
}

function rawConnection(value: unknown) {
  const row = isRecord(value) ? value : null;
  const openId = text(row?.tiktok_open_id);
  const displayName = text(row?.display_name);
  const scopes = textArray(row?.scopes);
  const accessTokenCiphertext = text(row?.access_token_ciphertext);
  const refreshTokenCiphertext = text(row?.refresh_token_ciphertext);
  const accessTokenExpiresAt = text(row?.access_token_expires_at);
  const refreshTokenExpiresAt = text(row?.refresh_token_expires_at);
  if (
    !row ||
    !openId ||
    !displayName ||
    !scopes ||
    !accessTokenCiphertext ||
    !refreshTokenCiphertext ||
    !accessTokenExpiresAt ||
    !refreshTokenExpiresAt ||
    !Number.isFinite(Date.parse(accessTokenExpiresAt)) ||
    !Number.isFinite(Date.parse(refreshTokenExpiresAt))
  ) {
    throw new ContentOsDataError();
  }
  return {
    openId,
    unionId: text(row.tiktok_union_id),
    displayName,
    avatarUrl: text(row.avatar_url),
    scopes,
    accessTokenCiphertext,
    refreshTokenCiphertext,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    syncLockId: text(row?.sync_lock_id),
    syncLockUntil: text(row?.sync_lock_until),
    tokenRefreshLockId: text(row?.token_refresh_lock_id),
    tokenRefreshLockUntil: text(row?.token_refresh_lock_until),
  };
}

async function upsertConnection(
  admin: WarhomeAdmin,
  tokens: ContentOsTikTokTokens,
): Promise<void> {
  const configuration = getContentOsTikTokConfiguration();
  const user = await getContentOsTikTokUser(tokens.accessToken);
  if (user.openId !== tokens.openId) throw new ContentOsDataError();
  const { data, error } = await getSupabaseAdmin().rpc(
    "upsert_content_os_tiktok_connection",
    {
      p_admin_user_id: admin.userId,
      p_tiktok_open_id: tokens.openId,
      p_tiktok_union_id: user.unionId,
      p_display_name: user.displayName,
      p_avatar_url: user.avatarUrl,
      p_scopes: tokens.scopes,
      p_access_token_ciphertext: encryptContentOsTikTokToken(
        tokens.accessToken,
        configuration.encryptionKey,
      ),
      p_refresh_token_ciphertext: encryptContentOsTikTokToken(
        tokens.refreshToken,
        configuration.encryptionKey,
      ),
      p_access_token_expires_at: tokens.accessTokenExpiresAt,
      p_refresh_token_expires_at: tokens.refreshTokenExpiresAt,
    },
  );
  if (error || data !== CONTENT_OS_WORKSPACE_KEY) throw new ContentOsDataError();
}

async function loadPrivateConnection() {
  const { data, error } = await getSupabaseAdmin()
    .from("content_tiktok_connections")
    .select(CONNECTION_PRIVATE_SELECT)
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsTikTokConnectionRequiredError();
  return rawConnection(data);
}

async function claimContentOsTikTokSync(
  admin: WarhomeAdmin,
  lockId: string,
): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_content_os_tiktok_sync",
    {
      p_admin_user_id: admin.userId,
      p_lock_id: lockId,
      p_lock_until: new Date(Date.now() + 10 * 60_000).toISOString(),
    },
  );
  if (error || typeof data !== "boolean") throw new ContentOsDataError();
  return data;
}

async function releaseContentOsTikTokSync(
  admin: WarhomeAdmin,
  lockId: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "release_content_os_tiktok_sync",
    { p_admin_user_id: admin.userId, p_lock_id: lockId },
  );
  if (error) throw new ContentOsDataError();
}

async function claimContentOsTikTokTokenRefresh(
  admin: WarhomeAdmin,
  lockId: string,
): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_content_os_tiktok_token_refresh",
    {
      p_admin_user_id: admin.userId,
      p_lock_id: lockId,
      p_lock_until: new Date(Date.now() + 60_000).toISOString(),
    },
  );
  if (error || typeof data !== "boolean") throw new ContentOsDataError();
  return data;
}

async function releaseContentOsTikTokTokenRefresh(
  admin: WarhomeAdmin,
  lockId: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "release_content_os_tiktok_token_refresh",
    { p_admin_user_id: admin.userId, p_lock_id: lockId },
  );
  if (error) throw new ContentOsDataError();
}

async function persistRefreshedTokens(
  admin: WarhomeAdmin,
  lockId: string,
  expectedOpenId: string,
  tokens: ContentOsTikTokTokens,
): Promise<boolean> {
  if (tokens.openId !== expectedOpenId) throw new ContentOsDataError();
  const configuration = getContentOsTikTokConfiguration();
  const { data, error } = await getSupabaseAdmin().rpc(
    "save_content_os_tiktok_refreshed_tokens",
    {
      p_admin_user_id: admin.userId,
      p_lock_id: lockId,
      p_scopes: tokens.scopes,
      p_access_token_ciphertext: encryptContentOsTikTokToken(
        tokens.accessToken,
        configuration.encryptionKey,
      ),
      p_refresh_token_ciphertext: encryptContentOsTikTokToken(
        tokens.refreshToken,
        configuration.encryptionKey,
      ),
      p_access_token_expires_at: tokens.accessTokenExpiresAt,
      p_refresh_token_expires_at: tokens.refreshTokenExpiresAt,
    },
  );
  if (error || typeof data !== "boolean") throw new ContentOsDataError();
  return data;
}

async function waitForContentOsTikTokRefresh(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function getAccessToken(admin: WarhomeAdmin): Promise<string> {
  const configuration = getContentOsTikTokConfiguration();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const connection = await loadPrivateConnection();
    if (Date.parse(connection.refreshTokenExpiresAt) <= Date.now()) {
      throw new ContentOsTikTokConnectionRequiredError();
    }
    if (Date.parse(connection.accessTokenExpiresAt) > Date.now() + 5 * 60_000) {
      return decryptContentOsTikTokToken(
        connection.accessTokenCiphertext,
        configuration.encryptionKey,
      );
    }

    const lockId = randomUUID();
    if (!(await claimContentOsTikTokTokenRefresh(admin, lockId))) {
      await waitForContentOsTikTokRefresh();
      continue;
    }

    try {
      const refreshToken = decryptContentOsTikTokToken(
        connection.refreshTokenCiphertext,
        configuration.encryptionKey,
      );
      const tokens = await refreshContentOsTikTokTokens(
        refreshToken,
        configuration,
      );
      if (
        await persistRefreshedTokens(
          admin,
          lockId,
          connection.openId,
          tokens,
        )
      ) {
        return tokens.accessToken;
      }
    } catch (error) {
      try {
        await releaseContentOsTikTokTokenRefresh(admin, lockId);
      } catch {
        // The lease expires automatically if the release cannot be persisted.
      }
      throw error;
    }
    try {
      await releaseContentOsTikTokTokenRefresh(admin, lockId);
    } catch {
      // The lease expires automatically if another worker completed the refresh.
    }
    await waitForContentOsTikTokRefresh();
  }
  throw new ContentOsTikTokConnectionRequiredError();
}

async function upsertVideo(
  admin: WarhomeAdmin,
  video: ContentOsTikTokProviderVideo,
  importSource: "api" | "manual_url",
  saves: number | null = null,
): Promise<string> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "upsert_content_os_tiktok_video",
    {
      p_admin_user_id: admin.userId,
      p_tiktok_video_id: video.providerVideoId,
      p_share_url: video.shareUrl,
      p_caption: video.caption,
      p_hashtags: video.hashtags,
      p_duration_seconds: video.durationSeconds,
      p_published_at: video.publishedAt,
      p_views: video.views,
      p_likes: video.likes,
      p_comments: video.comments,
      p_shares: video.shares,
      p_saves: saves,
      p_import_source: importSource,
      p_metrics_source: importSource === "api" ? "api" : "manual",
    },
  );
  if (error || typeof data !== "string") throw new ContentOsDataError();
  return data;
}

async function saveAnalysis(
  admin: WarhomeAdmin,
  videoId: string,
  model: string,
  analysis: ContentOsTikTokAnalysis,
): Promise<void> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "save_content_os_tiktok_analysis",
    {
      p_admin_user_id: admin.userId,
      p_video_id: videoId,
      p_title: analysis.title,
      p_summary: analysis.summary,
      p_hook: analysis.hook,
      p_pillar: analysis.pillar,
      p_objective: analysis.objective,
      p_related_product_key: analysis.relatedProduct,
      p_model_name: model,
    },
  );
  if (error || data !== videoId) throw new ContentOsDataError();
}

async function markAnalysisFailed(
  admin: WarhomeAdmin,
  videoIds: string[],
): Promise<void> {
  if (!videoIds.length) return;
  const { error } = await getSupabaseAdmin().rpc(
    "mark_content_os_tiktok_analysis_failed",
    { p_admin_user_id: admin.userId, p_video_ids: videoIds },
  );
  if (error) throw new ContentOsDataError();
}

async function updateSyncStatus(
  status: "succeeded" | "partial" | "failed",
  errorCode: string | null,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("content_tiktok_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_error_code: errorCode,
    })
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY);
  if (error) throw new ContentOsDataError();
}

async function analyzeVideos(
  admin: WarhomeAdmin,
  videosById: Map<string, ContentOsTikTokProviderVideo>,
): Promise<{ analyzed: number; failed: number }> {
  if (!videosById.size) return { analyzed: 0, failed: 0 };
  const { data, error } = await getSupabaseAdmin()
    .from("content_tiktok_videos")
    .select(
      `id,tiktok_video_id,analysis_status,content_item_id,analysis_attempt_count,analysis_next_retry_at`,
    )
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .in("tiktok_video_id", [...videosById.keys()]);
  if (error || !Array.isArray(data)) throw new ContentOsDataError();
  const now = Date.now();
  const candidates = data.filter((row) => {
    const attemptCount =
      typeof row.analysis_attempt_count === "number" &&
      Number.isSafeInteger(row.analysis_attempt_count)
        ? row.analysis_attempt_count
        : 0;
    const nextRetryAt =
      row.analysis_next_retry_at === null ||
      row.analysis_next_retry_at === undefined
        ? null
        : Date.parse(String(row.analysis_next_retry_at));
    const retryable =
      row.analysis_status === "pending_analysis" ||
      (row.analysis_status === "failed" &&
        attemptCount < CONTENT_OS_TIKTOK_LIMITS.analysisMaxAttempts &&
        (nextRetryAt === null ||
          (Number.isFinite(nextRetryAt) && nextRetryAt <= now)));
    return (
      row.content_item_id === null &&
      retryable &&
      typeof row.id === "string" &&
      typeof row.tiktok_video_id === "string" &&
      videosById.has(row.tiktok_video_id)
    );
  });
  if (!candidates.length) return { analyzed: 0, failed: 0 };

  const brand = await loadContentOsBrandProfile();
  let analyzed = 0;
  let failed = 0;
  for (let index = 0; index < candidates.length; index += 20) {
    const batch = candidates.slice(index, index + 20);
    const inputs = batch.map((row) => videosById.get(row.tiktok_video_id)!);
    try {
      const result = await analyzeContentOsTikTokVideos(brand, inputs);
      const databaseIds = new Map(
        batch.map((row) => [row.tiktok_video_id, row.id]),
      );
      for (const analysis of result.analyses) {
        await saveAnalysis(
          admin,
          databaseIds.get(analysis.providerVideoId)!,
          result.model,
          analysis,
        );
        analyzed += 1;
      }
    } catch {
      await markAnalysisFailed(
        admin,
        batch.map((row) => row.id),
      );
      failed += batch.length;
    }
  }
  return { analyzed, failed };
}

export async function getContentOsTikTokWorkspace(): Promise<ContentOsTikTokWorkspace> {
  await requireWarhomeAdmin();
  const admin = getSupabaseAdmin();
  const [connectionResult, videosResult] = await Promise.all([
    admin
      .from("content_tiktok_connections")
      .select(CONNECTION_PUBLIC_SELECT)
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .maybeSingle(),
    admin
      .from("content_tiktok_videos")
      .select(VIDEO_SELECT)
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .order("published_at", { ascending: false })
      .limit(200),
  ]);
  if (
    connectionResult.error ||
    videosResult.error ||
    !Array.isArray(videosResult.data)
  ) {
    throw new ContentOsDataError();
  }
  const connection = connectionResult.data
    ? mapContentOsTikTokConnection(connectionResult.data)
    : null;
  const videos = videosResult.data.map(mapContentOsTikTokVideo);
  if ((connectionResult.data && !connection) || videos.some((video) => !video)) {
    throw new ContentOsDataError();
  }
  return {
    connection,
    videos: videos as ContentOsTikTokVideo[],
  };
}

export async function connectContentOsTikTokAccount(code: string): Promise<void> {
  const admin = await requireWarhomeAdmin();
  const configuration = getContentOsTikTokConfiguration();
  const tokens = await exchangeContentOsTikTokCode(code, configuration);
  await upsertConnection(admin, tokens);
}

export async function disconnectContentOsTikTokAccount(): Promise<void> {
  const admin = await requireWarhomeAdmin();
  const configuration = getContentOsTikTokConfiguration();
  const accessToken = await getAccessToken(admin);
  await revokeContentOsTikTokAccess(accessToken, configuration);
  const { error } = await getSupabaseAdmin()
    .from("content_tiktok_connections")
    .delete()
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY);
  if (error) throw new ContentOsDataError();
}

export async function syncContentOsTikTok(): Promise<ContentOsTikTokSyncResult> {
  const admin = await requireWarhomeAdmin();
  const configuration = getContentOsTikTokConfiguration();
  const syncLockId = randomUUID();
  if (!(await claimContentOsTikTokSync(admin, syncLockId))) {
    throw new ContentOsDataError();
  }
  try {
    const accessToken = await getAccessToken(admin);
    const providerVideos = await listContentOsTikTokVideos(
      accessToken,
      configuration.syncMaxVideos,
    );
    const videosById = new Map(
      providerVideos.map((video) => [video.providerVideoId, video]),
    );
    for (const video of providerVideos) {
      await upsertVideo(admin, video, "api");
    }
    const analysis = await analyzeVideos(admin, videosById);
    await updateSyncStatus(
      analysis.failed ? "partial" : "succeeded",
      analysis.failed ? "analysis_unavailable" : null,
    );
    return {
      imported: providerVideos.length,
      analyzed: analysis.analyzed,
      awaitingReview: analysis.analyzed,
      analysisFailed: analysis.failed,
    };
  } catch (error) {
    try {
      await updateSyncStatus("failed", "provider_unavailable");
    } catch {
      // Preserve the original failure and never expose provider details.
    }
    throw error;
  } finally {
    try {
      await releaseContentOsTikTokSync(admin, syncLockId);
    } catch {
      // The lease expires automatically if the release cannot be persisted.
    }
  }
}

export async function importContentOsTikTokUrl(
  input: ContentOsTikTokManualImportInput,
): Promise<ContentOsTikTokSyncResult> {
  const admin = await requireWarhomeAdmin();
  const providerVideo: ContentOsTikTokProviderVideo = {
    providerVideoId: manualTikTokVideoId(input.shareUrl),
    shareUrl: input.shareUrl,
    caption: input.caption,
    hashtags: extractTikTokHashtags(input.caption),
    durationSeconds: input.durationSeconds,
    publishedAt: `${input.publishedOn}T12:00:00.000Z`,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
  };
  await upsertVideo(admin, providerVideo, "manual_url", input.saves);
  const analysis = await analyzeVideos(
    admin,
    new Map([[providerVideo.providerVideoId, providerVideo]]),
  );
  return {
    imported: 1,
    analyzed: analysis.analyzed,
    awaitingReview: analysis.analyzed,
    analysisFailed: analysis.failed,
  };
}

export async function reviewContentOsTikTokVideo(
  videoId: string,
  decision: "confirmed" | "rejected",
  input: ContentOsTikTokReviewInput,
): Promise<string | null> {
  const admin = await requireWarhomeAdmin();
  const { data, error } = await getSupabaseAdmin().rpc(
    "review_content_os_tiktok_analysis",
    {
      p_admin_user_id: admin.userId,
      p_video_id: videoId,
      p_decision: decision,
      p_title: input.title,
      p_summary: input.summary,
      p_hook: input.hook,
      p_pillar: input.pillar,
      p_objective: input.objective,
      p_related_product_key: input.relatedProduct,
    },
  );
  if (error) throw new ContentOsDataError();
  if (decision === "confirmed" && typeof data !== "string") {
    throw new ContentOsDataError();
  }
  if (decision === "rejected" && data !== null) throw new ContentOsDataError();
  return typeof data === "string" ? data : null;
}
