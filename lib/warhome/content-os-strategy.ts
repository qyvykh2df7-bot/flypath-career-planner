import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";
import {
  ContentOsDataError,
  ContentOsNotFoundError,
} from "@/lib/warhome/content-os";
import {
  CONTENT_OS_CATEGORIES,
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
  isContentOsUuid,
  type ContentOsCategory,
  type ContentOsObjective,
  type ContentOsPlatform,
  type ContentOsProposalStatus,
} from "@/lib/warhome/content-os-contract";
import { generateContentOsStrategy } from "@/lib/warhome/content-os-ai-strategist";
import { loadContentOsBrandProfile } from "@/lib/warhome/content-os-brand";
import {
  CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
  CONTENT_OS_STRATEGY_FORMATS,
  CONTENT_OS_STRATEGY_PILLARS,
  CONTENT_OS_STRATEGY_PRIORITIES,
  CONTENT_OS_STRATEGY_PRODUCTS,
  isContentOsStrategyDecision,
  type ContentOsStrategistWorkspace,
  type ContentOsStrategyContext,
  type ContentOsStrategyDecision,
  type ContentOsStrategyFormat,
  type ContentOsStrategyObjectiveBalance,
  type ContentOsStrategyPillar,
  type ContentOsStrategyPriority,
  type ContentOsStrategyProduct,
  type ContentOsStrategyProposal,
} from "@/lib/warhome/content-os-strategy-contract";

const CONTENT_OS_WORKSPACE_KEY = "pilotfeliu";
const DEFAULT_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS = 60;
const MIN_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS = 15;
const MAX_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS = 3_600;
const STRATEGY_PROPOSAL_SELECT = [
  "id",
  "title",
  "description",
  "objective",
  "proposal_status",
  "strategy_idea",
  "strategy_hook",
  "strategy_platforms",
  "strategy_format",
  "strategy_duration_seconds",
  "strategy_product_key",
  "strategy_cta",
  "strategy_priority",
  "strategy_pillar",
  "strategy_model_name",
  "strategy_reviewed_at",
  "created_at",
].join(",");

type RawRecord = Record<string, unknown>;

export class ContentOsStrategistRateLimitError extends Error {
  constructor() {
    super("Content OS strategist rate limit reached");
    this.name = "ContentOsStrategistRateLimitError";
  }
}

export class ContentOsStrategyReviewError extends Error {
  constructor() {
    super("Content OS strategy proposal cannot be reviewed");
    this.name = "ContentOsStrategyReviewError";
  }
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return Number.isFinite(new Date(value).getTime()) ? value : null;
}

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

function normalizedTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

function proposalStatus(value: unknown): ContentOsProposalStatus | null {
  return value === "proposed" ||
    value === "approved" ||
    value === "rejected"
    ? value
    : null;
}

function mapStrategyProposal(value: unknown): ContentOsStrategyProposal | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;

  const id = text(row.id);
  const title = text(row.title);
  const idea = text(row.strategy_idea);
  const hook = text(row.strategy_hook);
  const explanation = text(row.description);
  const format = text(row.strategy_format);
  const objective = text(row.objective);
  const relatedProduct =
    row.strategy_product_key === null ? null : text(row.strategy_product_key);
  const cta = text(row.strategy_cta);
  const priority = text(row.strategy_priority);
  const pillar = text(row.strategy_pillar);
  const modelName = text(row.strategy_model_name);
  const status = proposalStatus(row.proposal_status);
  const createdAt = timestamp(row.created_at);
  const reviewedAt =
    row.strategy_reviewed_at === null
      ? null
      : timestamp(row.strategy_reviewed_at);
  const durationSeconds = row.strategy_duration_seconds;
  const platforms = row.strategy_platforms;

  if (
    !id ||
    !isContentOsUuid(id) ||
    !title ||
    !idea ||
    !hook ||
    !explanation ||
    !format ||
    !includesValue(CONTENT_OS_STRATEGY_FORMATS, format) ||
    !objective ||
    !includesValue(CONTENT_OS_OBJECTIVES, objective) ||
    (relatedProduct !== null &&
      !includesValue(CONTENT_OS_STRATEGY_PRODUCTS, relatedProduct)) ||
    !cta ||
    !priority ||
    !includesValue(CONTENT_OS_STRATEGY_PRIORITIES, priority) ||
    !pillar ||
    !includesValue(CONTENT_OS_STRATEGY_PILLARS, pillar) ||
    !modelName ||
    !status ||
    !createdAt ||
    (row.strategy_reviewed_at !== null && !reviewedAt) ||
    typeof durationSeconds !== "number" ||
    !Number.isSafeInteger(durationSeconds) ||
    !Array.isArray(platforms) ||
    platforms.length < 1 ||
    platforms.some(
      (platform) =>
        typeof platform !== "string" ||
        !includesValue(CONTENT_OS_PLATFORMS, platform),
    )
  ) {
    return null;
  }

  return {
    id,
    title,
    idea,
    hook,
    explanation,
    platforms: platforms as ContentOsPlatform[],
    format: format as ContentOsStrategyFormat,
    durationSeconds,
    objective: objective as ContentOsObjective,
    relatedProduct: relatedProduct as ContentOsStrategyProduct | null,
    cta,
    priority: priority as ContentOsStrategyPriority,
    pillar: pillar as ContentOsStrategyPillar,
    proposalStatus: status,
    modelName,
    createdAt,
    reviewedAt,
  };
}

function mapHistoryEntry(
  value: unknown,
  metricsByItem: ReadonlyMap<
    string,
    ContentOsStrategyContext["history"][number]["metrics"]
  > = new Map(),
): ContentOsStrategyContext["history"][number] | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const title = text(row.title);
  const objective = text(row.objective);
  const category =
    row.category === null || row.category === undefined
      ? null
      : text(row.category);
  const status = text(row.status);
  const id = text(row.id);
  const platform = row.platform == null ? null : text(row.platform);
  const hook = row.hook == null ? null : text(row.hook);
  const contentPillar =
    row.content_pillar == null ? null : text(row.content_pillar);
  const relatedProductKey =
    row.related_product_key == null ? null : text(row.related_product_key);
  const origin =
    row.content_origin === "historical" || row.content_origin === "planned"
      ? row.content_origin
      : "idea";
  if (
    !title ||
    (objective !== null &&
      !includesValue(CONTENT_OS_OBJECTIVES, objective)) ||
    (category !== null && !includesValue(CONTENT_OS_CATEGORIES, category)) ||
    !status
  ) {
    return null;
  }
  return {
    title,
    objective: objective as ContentOsObjective | null,
    category: category as ContentOsCategory | null,
    platform:
      platform === "other" ||
      (platform !== null && includesValue(CONTENT_OS_PLATFORMS, platform))
        ? platform
        : null,
    hook,
    contentPillar,
    relatedProductKey:
      relatedProductKey !== null &&
      includesValue(CONTENT_OS_STRATEGY_PRODUCTS, relatedProductKey)
        ? relatedProductKey
        : null,
    contentOrigin: origin,
    status,
    published: status === "published",
    metrics: id ? metricsByItem.get(id) ?? null : null,
  };
}

function mapStrategyMetric(
  value: unknown,
): [
  string,
  NonNullable<ContentOsStrategyContext["history"][number]["metrics"]>,
] | null {
  const row = isRecord(value) ? value : null;
  const contentItemId = row ? text(row.content_item_id) : null;
  const fields = row
    ? {
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        saves: row.saves,
        followersGained: row.followers_gained,
        leadsGenerated: row.leads_generated,
        salesAttributed: row.sales_attributed,
      }
    : null;
  if (
    !contentItemId ||
    !fields ||
    Object.values(fields).some(
      (entry) =>
        typeof entry !== "number" ||
        !Number.isSafeInteger(entry) ||
        entry < 0,
    )
  ) {
    return null;
  }
  return [
    contentItemId,
    fields as NonNullable<
      ContentOsStrategyContext["history"][number]["metrics"]
    >,
  ];
}

async function loadStrategyContext(
  balance: ContentOsStrategyObjectiveBalance,
): Promise<ContentOsStrategyContext> {
  const admin = getSupabaseAdmin();
  const [ideasResult, itemsResult, metricsResult, brand] = await Promise.all([
    admin
      .from("content_ideas")
      .select("title,objective,category,status")
      .order("updated_at", { ascending: false })
      .limit(300),
    admin
      .from("content_items")
      .select(
        "id,title,objective,category,status,platform,hook,content_origin,content_pillar,related_product_key",
      )
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .order("updated_at", { ascending: false })
      .limit(300),
    admin
      .from("content_metrics")
      .select(
        "content_item_id,recorded_on,views,likes,comments,shares,saves,followers_gained,leads_generated,sales_attributed",
      )
      .order("recorded_on", { ascending: false })
      .limit(1_000),
    loadContentOsBrandProfile(),
  ]);
  if (
    ideasResult.error ||
    itemsResult.error ||
    metricsResult.error ||
    !Array.isArray(ideasResult.data) ||
    !Array.isArray(itemsResult.data) ||
    !Array.isArray(metricsResult.data)
  ) {
    throw new ContentOsDataError();
  }

  const metricsByItem = new Map<
    string,
    ContentOsStrategyContext["history"][number]["metrics"]
  >();
  for (const row of metricsResult.data) {
    const metric = mapStrategyMetric(row);
    if (!metric) throw new ContentOsDataError();
    if (!metricsByItem.has(metric[0])) metricsByItem.set(metric[0], metric[1]);
  }

  const history = [
    ...ideasResult.data.map((row) => mapHistoryEntry(row)),
    ...itemsResult.data.map((row) => mapHistoryEntry(row, metricsByItem)),
  ];
  if (history.some((entry) => entry === null)) throw new ContentOsDataError();

  const uniqueHistory = new Map<
    string,
    ContentOsStrategyContext["history"][number]
  >();
  for (const entry of history) {
    if (entry) uniqueHistory.set(normalizedTitle(entry.title), entry);
  }
  return { brand, balance, history: [...uniqueHistory.values()] };
}

async function loadStrategyProposals(): Promise<ContentOsStrategyProposal[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("content_ideas")
    .select(STRATEGY_PROPOSAL_SELECT)
    .eq("proposal_source", "ai")
    .not("strategy_model_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !Array.isArray(data)) throw new ContentOsDataError();
  return data.map((row) => {
    const proposal = mapStrategyProposal(row);
    if (!proposal) throw new ContentOsDataError();
    return proposal;
  });
}

async function claimStrategistGeneration(adminUserId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "claim_content_os_strategy_generation",
    {
      p_admin_user_id: adminUserId,
      p_min_interval_seconds: getContentOsStrategistMinIntervalSeconds(),
    },
  );
  if (!error) return;
  if (error.message.includes("content_os_strategist_rate_limited")) {
    throw new ContentOsStrategistRateLimitError();
  }
  throw new ContentOsDataError();
}

export function getContentOsStrategistMinIntervalSeconds(
  value = process.env.CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS,
): number {
  if (!value || !/^\d+$/.test(value)) {
    return DEFAULT_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return DEFAULT_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS;
  }
  return Math.min(
    MAX_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS,
    Math.max(MIN_CONTENT_OS_STRATEGIST_MIN_INTERVAL_SECONDS, parsed),
  );
}

export async function getContentOsStrategistWorkspace(): Promise<ContentOsStrategistWorkspace> {
  await requireWarhomeAdmin();
  const [proposals, context] = await Promise.all([
    loadStrategyProposals(),
    loadStrategyContext(CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE),
  ]);
  return {
    proposals,
    historyCount: context.history.length,
    publishedCount: context.history.filter((entry) => entry.published).length,
    defaultBalance: CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
  };
}

export async function createContentOsStrategyProposals(
  balance: ContentOsStrategyObjectiveBalance,
): Promise<string[]> {
  const adminUser = await requireWarhomeAdmin();
  const context = await loadStrategyContext(balance);
  await claimStrategistGeneration(adminUser.userId);
  const { model, output } = await generateContentOsStrategy(context);
  const inputHash = createHash("sha256")
    .update(JSON.stringify(context))
    .digest("hex");

  const { data, error } = await getSupabaseAdmin().rpc(
    "create_content_os_strategy_proposals",
    {
      p_admin_user_id: adminUser.userId,
      p_model_name: model,
      p_input_hash: inputHash,
      p_suggestions: output.suggestions.map((suggestion) => ({
        title: suggestion.title,
        idea: suggestion.idea,
        hook: suggestion.hook,
        explanation: suggestion.explanation,
        platforms: suggestion.platforms,
        format: suggestion.format,
        duration_seconds: suggestion.durationSeconds,
        objective: suggestion.objective,
        product_key: suggestion.relatedProduct,
        cta: suggestion.cta,
        priority: suggestion.priority,
        pillar: suggestion.pillar,
        fingerprint: createHash("sha256")
          .update(normalizedTitle(suggestion.title))
          .digest("hex"),
      })),
    },
  );
  if (
    error ||
    !Array.isArray(data) ||
    data.some((id) => typeof id !== "string" || !isContentOsUuid(id))
  ) {
    throw new ContentOsDataError();
  }
  return data;
}

export async function reviewContentOsStrategyProposal(
  proposalId: string,
  decision: ContentOsStrategyDecision,
): Promise<void> {
  const adminUser = await requireWarhomeAdmin();
  if (
    !isContentOsUuid(proposalId) ||
    !isContentOsStrategyDecision(decision)
  ) {
    throw new ContentOsNotFoundError();
  }
  const { data, error } = await getSupabaseAdmin().rpc(
    "review_content_os_strategy_proposal",
    {
      p_idea_id: proposalId,
      p_admin_user_id: adminUser.userId,
      p_decision: decision,
    },
  );
  if (error) {
    if (error.message.includes("content_os_strategy_review_invalid")) {
      throw new ContentOsStrategyReviewError();
    }
    throw new ContentOsDataError();
  }
  if (typeof data !== "string" || !isContentOsUuid(data)) {
    throw new ContentOsDataError();
  }
}
