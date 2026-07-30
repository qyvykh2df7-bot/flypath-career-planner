import {
  CONTENT_OS_LIMITS,
  CONTENT_OS_OBJECTIVES,
  isContentOsDate,
  isContentOsUuid,
  type ContentOsObjective,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_STRATEGY_PRODUCTS,
  type ContentOsStrategyPillar,
  type ContentOsStrategyProduct,
} from "@/lib/warhome/content-os-strategy-contract";

export const CONTENT_OS_TIKTOK_REQUIRED_SCOPES = [
  "user.info.basic",
  "video.list",
] as const;

export const CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE =
  "flypath_content_os_tiktok_oauth_state";

export const CONTENT_OS_TIKTOK_ANALYSIS_PILLARS = [
  "pilot_life",
  "aviation_career",
  "training",
  "personal_stories",
  "aviation_english",
  "product_sales",
] as const satisfies readonly ContentOsStrategyPillar[];

export const CONTENT_OS_TIKTOK_ANALYSIS_STATUSES = [
  "pending_analysis",
  "pending_review",
  "confirmed",
  "rejected",
  "failed",
] as const;

export const CONTENT_OS_TIKTOK_LIMITS = {
  caption: 5_000,
  hashtag: 100,
  hashtags: 50,
  displayName: 255,
  providerId: 255,
  modelName: 100,
  syncVideosDefault: 20,
  syncVideosMax: 100,
  analysisBatch: 20,
  analysisMaxAttempts: 3,
  analysisRetryCooldownMinutes: 15,
} as const;

export type ContentOsTikTokAnalysisStatus =
  (typeof CONTENT_OS_TIKTOK_ANALYSIS_STATUSES)[number];

export type ContentOsTikTokConnection = {
  connected: true;
  displayName: string;
  scopes: string[];
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncStatus: "never" | "succeeded" | "partial" | "failed";
};

export type ContentOsTikTokVideo = {
  id: string;
  providerVideoId: string;
  shareUrl: string;
  caption: string;
  hashtags: string[];
  durationSeconds: number | null;
  publishedAt: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  importSource: "api" | "manual_url";
  analysisStatus: ContentOsTikTokAnalysisStatus;
  analysisTitle: string | null;
  analysisSummary: string | null;
  analysisHook: string | null;
  analysisPillar: ContentOsStrategyPillar | null;
  analysisObjective: ContentOsObjective | null;
  analysisRelatedProduct: ContentOsStrategyProduct | null;
  contentItemId: string | null;
};

export type ContentOsTikTokWorkspace = {
  connection: ContentOsTikTokConnection | null;
  videos: ContentOsTikTokVideo[];
};

export type ContentOsTikTokProviderVideo = {
  providerVideoId: string;
  shareUrl: string;
  caption: string;
  hashtags: string[];
  durationSeconds: number | null;
  publishedAt: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

export type ContentOsTikTokAnalysisInput = Pick<
  ContentOsTikTokProviderVideo,
  | "providerVideoId"
  | "shareUrl"
  | "caption"
  | "hashtags"
  | "durationSeconds"
  | "views"
  | "likes"
  | "comments"
  | "shares"
>;

export type ContentOsTikTokAnalysis = {
  providerVideoId: string;
  title: string;
  summary: string;
  hook: string;
  pillar: (typeof CONTENT_OS_TIKTOK_ANALYSIS_PILLARS)[number];
  objective: ContentOsObjective;
  relatedProduct: ContentOsStrategyProduct | null;
};

export type ContentOsTikTokManualImportInput = {
  shareUrl: string;
  caption: string;
  publishedOn: string;
  durationSeconds: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
};

export type ContentOsTikTokReviewInput = {
  title: string;
  summary: string;
  hook: string;
  pillar: (typeof CONTENT_OS_TIKTOK_ANALYSIS_PILLARS)[number];
  objective: ContentOsObjective;
  relatedProduct: ContentOsStrategyProduct | null;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function optionalText(value: unknown): string | null {
  return value === null || value === undefined ? null : text(value);
}

function timestamp(value: unknown): string | null {
  const candidate = text(value);
  return candidate && !Number.isNaN(Date.parse(candidate)) ? candidate : null;
}

function nonnegativeInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= CONTENT_OS_LIMITS.metricValue
    ? value
    : null;
}

function nullableMetric(value: unknown): number | null | undefined {
  return value === null ? null : nonnegativeInteger(value) ?? undefined;
}

function includes<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

export function extractTikTokHashtags(caption: string): string[] {
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [
    ...new Set(
      matches
        .map((entry) => entry.slice(1).toLocaleLowerCase("es"))
        .filter(
          (entry) =>
            entry.length > 0 &&
            entry.length <= CONTENT_OS_TIKTOK_LIMITS.hashtag,
        ),
    ),
  ].slice(0, CONTENT_OS_TIKTOK_LIMITS.hashtags);
}

export function normalizeTikTokUrl(value: string): string | null {
  if (value.length > CONTENT_OS_LIMITS.itemSourceUrl) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      !(
        hostname === "tiktok.com" ||
        hostname.endsWith(".tiktok.com")
      )
    ) {
      return null;
    }
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalMetric(
  formData: FormData,
  key: string,
): number | null | undefined {
  const value = formString(formData, key);
  if (!value) return null;
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return nonnegativeInteger(parsed) ?? undefined;
}

export function parseContentOsTikTokManualImportForm(
  formData: FormData,
): ContentOsTikTokManualImportInput | null {
  const shareUrl = normalizeTikTokUrl(formString(formData, "shareUrl"));
  const caption = formString(formData, "caption").replace(/\r\n/g, "\n");
  const publishedOn = formString(formData, "publishedOn");
  const durationValue = formString(formData, "durationSeconds");
  const durationSeconds = durationValue
    ? /^\d+$/.test(durationValue)
      ? Number(durationValue)
      : undefined
    : null;
  const metrics = {
    views: optionalMetric(formData, "views"),
    likes: optionalMetric(formData, "likes"),
    comments: optionalMetric(formData, "comments"),
    shares: optionalMetric(formData, "shares"),
    saves: optionalMetric(formData, "saves"),
  };

  if (
    !shareUrl ||
    !isContentOsDate(publishedOn) ||
    caption.length > CONTENT_OS_TIKTOK_LIMITS.caption ||
    durationSeconds === undefined ||
    (durationSeconds !== null &&
      (!Number.isSafeInteger(durationSeconds) ||
        durationSeconds < 1 ||
        durationSeconds > 36_000)) ||
    Object.values(metrics).some((value) => value === undefined)
  ) {
    return null;
  }

  return {
    shareUrl,
    caption,
    publishedOn,
    durationSeconds,
    views: metrics.views as number | null,
    likes: metrics.likes as number | null,
    comments: metrics.comments as number | null,
    shares: metrics.shares as number | null,
    saves: metrics.saves as number | null,
  };
}

export function parseContentOsTikTokReviewForm(
  formData: FormData,
): ContentOsTikTokReviewInput | null {
  const title = formString(formData, "title");
  const summary = formString(formData, "summary").replace(/\r\n/g, "\n");
  const hook = formString(formData, "hook").replace(/\r\n/g, "\n");
  const pillar = formString(formData, "pillar");
  const objective = formString(formData, "objective");
  const relatedProduct = formString(formData, "relatedProduct");

  if (
    !title ||
    title.length > CONTENT_OS_LIMITS.itemTitle ||
    !summary ||
    summary.length > CONTENT_OS_LIMITS.itemSummary ||
    !hook ||
    hook.length > CONTENT_OS_LIMITS.itemHook ||
    !includes(CONTENT_OS_TIKTOK_ANALYSIS_PILLARS, pillar) ||
    !includes(CONTENT_OS_OBJECTIVES, objective) ||
    (relatedProduct !== "" &&
      !includes(CONTENT_OS_STRATEGY_PRODUCTS, relatedProduct))
  ) {
    return null;
  }

  return {
    title,
    summary,
    hook,
    pillar,
    objective,
    relatedProduct: relatedProduct || null,
  };
}

export function parseContentOsTikTokAnalysisOutput(
  value: unknown,
  expectedIds: readonly string[],
): ContentOsTikTokAnalysis[] | null {
  if (!isRecord(value) || !Array.isArray(value.videos)) return null;
  const expected = new Set(expectedIds);
  const seen = new Set<string>();
  const parsed: ContentOsTikTokAnalysis[] = [];

  for (const entry of value.videos) {
    if (!isRecord(entry)) return null;
    const providerVideoId = text(entry.providerVideoId);
    const title = text(entry.title)?.trim() ?? "";
    const summary = text(entry.summary)?.trim() ?? "";
    const hook = text(entry.hook)?.trim() ?? "";
    const pillar = text(entry.pillar);
    const objective = text(entry.objective);
    const relatedProduct =
      entry.relatedProduct === null ? null : text(entry.relatedProduct);
    if (
      !providerVideoId ||
      !expected.has(providerVideoId) ||
      seen.has(providerVideoId) ||
      !title ||
      title.length > CONTENT_OS_LIMITS.itemTitle ||
      !summary ||
      summary.length > CONTENT_OS_LIMITS.itemSummary ||
      !hook ||
      hook.length > CONTENT_OS_LIMITS.itemHook ||
      !pillar ||
      !includes(CONTENT_OS_TIKTOK_ANALYSIS_PILLARS, pillar) ||
      !objective ||
      !includes(CONTENT_OS_OBJECTIVES, objective) ||
      (relatedProduct !== null &&
        !includes(CONTENT_OS_STRATEGY_PRODUCTS, relatedProduct))
    ) {
      return null;
    }
    seen.add(providerVideoId);
    parsed.push({
      providerVideoId,
      title,
      summary,
      hook,
      pillar,
      objective,
      relatedProduct,
    });
  }

  return parsed.length === expected.size && seen.size === expected.size
    ? parsed
    : null;
}

export function mapContentOsTikTokConnection(
  value: unknown,
): ContentOsTikTokConnection | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const displayName = text(row.display_name);
  const connectedAt = timestamp(row.connected_at);
  const lastSyncedAt =
    row.last_synced_at === null ? null : timestamp(row.last_synced_at);
  const lastSyncStatus = text(row.last_sync_status);
  const scopes = Array.isArray(row.scopes)
    ? row.scopes.filter((scope): scope is string => typeof scope === "string")
    : [];
  if (
    !displayName ||
    !connectedAt ||
    (row.last_synced_at !== null && !lastSyncedAt) ||
    !lastSyncStatus ||
    !includes(
      ["never", "succeeded", "partial", "failed"] as const,
      lastSyncStatus,
    ) ||
    !CONTENT_OS_TIKTOK_REQUIRED_SCOPES.every((scope) =>
      scopes.includes(scope),
    )
  ) {
    return null;
  }
  return {
    connected: true,
    displayName,
    scopes,
    connectedAt,
    lastSyncedAt,
    lastSyncStatus,
  };
}

export function mapContentOsTikTokVideo(
  value: unknown,
): ContentOsTikTokVideo | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const providerVideoId = text(row.tiktok_video_id);
  const shareUrl = text(row.share_url);
  const caption = text(row.caption);
  const publishedAt = timestamp(row.published_at);
  const importSource = text(row.import_source);
  const analysisStatus = text(row.analysis_status);
  const durationSeconds =
    row.duration_seconds === null
      ? null
      : typeof row.duration_seconds === "number" &&
          Number.isSafeInteger(row.duration_seconds)
        ? row.duration_seconds
        : undefined;
  const metrics = {
    views: nullableMetric(row.views),
    likes: nullableMetric(row.likes),
    comments: nullableMetric(row.comments),
    shares: nullableMetric(row.shares),
    saves: nullableMetric(row.saves),
  };
  const pillar = optionalText(row.analysis_pillar);
  const objective = optionalText(row.analysis_objective);
  const product = optionalText(row.analysis_related_product_key);
  const contentItemId = optionalText(row.content_item_id);

  if (
    !id ||
    !isContentOsUuid(id) ||
    !providerVideoId ||
    !shareUrl ||
    !normalizeTikTokUrl(shareUrl) ||
    caption === null ||
    !publishedAt ||
    durationSeconds === undefined ||
    Object.values(metrics).some((metric) => metric === undefined) ||
    !importSource ||
    !includes(["api", "manual_url"] as const, importSource) ||
    !analysisStatus ||
    !includes(CONTENT_OS_TIKTOK_ANALYSIS_STATUSES, analysisStatus) ||
    (pillar !== null &&
      !includes(CONTENT_OS_TIKTOK_ANALYSIS_PILLARS, pillar)) ||
    (objective !== null && !includes(CONTENT_OS_OBJECTIVES, objective)) ||
    (product !== null &&
      !includes(CONTENT_OS_STRATEGY_PRODUCTS, product)) ||
    (contentItemId !== null && !isContentOsUuid(contentItemId)) ||
    !Array.isArray(row.hashtags) ||
    row.hashtags.some((hashtag) => typeof hashtag !== "string")
  ) {
    return null;
  }

  return {
    id,
    providerVideoId,
    shareUrl,
    caption,
    hashtags: row.hashtags as string[],
    durationSeconds,
    publishedAt,
    views: metrics.views as number | null,
    likes: metrics.likes as number | null,
    comments: metrics.comments as number | null,
    shares: metrics.shares as number | null,
    saves: metrics.saves as number | null,
    importSource,
    analysisStatus,
    analysisTitle: optionalText(row.analysis_title),
    analysisSummary: optionalText(row.analysis_summary),
    analysisHook: optionalText(row.analysis_hook),
    analysisPillar: pillar as ContentOsStrategyPillar | null,
    analysisObjective: objective as ContentOsObjective | null,
    analysisRelatedProduct: product as ContentOsStrategyProduct | null,
    contentItemId,
  };
}
