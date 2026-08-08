import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireWarhomeAdmin, type WarhomeAdmin } from "@/lib/warhome/auth";
import {
  CONTENT_OS_CATEGORIES,
  CONTENT_OS_EVENT_TYPES,
  CONTENT_OS_IDEA_STATUSES,
  CONTENT_OS_ITEM_STATUSES,
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
  CONTENT_OS_EMPTY_METRICS,
  getLatestContentOsMetrics,
  isContentOsDate,
  isContentOsUuid,
  type ContentOsCalendarEvent,
  type ContentOsCalendarEventInput,
  type ContentOsCalendarParameters,
  type ContentOsCategory,
  type ContentOsEventType,
  type ContentOsIdea,
  type ContentOsIdeaInput,
  type ContentOsIdeaStatus,
  type ContentOsItem,
  type ContentOsItemDetail,
  type ContentOsItemInput,
  type ContentOsItemStatus,
  type ContentOsMetricInput,
  type ContentOsMetricSnapshot,
  type ContentOsObjective,
  type ContentOsPlatform,
  type ContentOsProposalSource,
  type ContentOsProposalStatus,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_LIBRARY_PLATFORMS,
  type ContentOsLibraryPlatform,
} from "@/lib/warhome/content-os-history-contract";

const CONTENT_ITEM_SELECT =
  "id,source_idea_id,title,summary,platform,objective,category,hook,script,cta,notes,status,planned_recording_on,planned_publish_on,published_at,content_origin,source_url,content_pillar,related_product_key,proposal_source,proposal_status,created_at,updated_at";
const CONTENT_IDEA_SELECT =
  "id,title,description,category,platform,objective,status,proposal_source,proposal_status,strategy_idea,strategy_hook,strategy_platforms,strategy_format,strategy_duration_seconds,strategy_product_key,strategy_cta,strategy_priority,strategy_pillar,created_at,updated_at";
const CONTENT_EVENT_SELECT =
  "id,content_item_id,title,event_type,starts_at,ends_at,timezone,notes,proposal_source,proposal_status,created_at,updated_at";
const CONTENT_METRIC_SELECT =
  "id,content_item_id,recorded_on,views,likes,comments,shares,saves,followers_gained,leads_generated,sales_attributed,created_at,updated_at";
const CONTENT_OS_WORKSPACE_KEY = "pilotfeliu";

type RawRecord = Record<string, unknown>;

export class ContentOsDataError extends Error {
  constructor() {
    super("Content OS data operation failed");
    this.name = "ContentOsDataError";
  }
}

export class ContentOsNotFoundError extends Error {
  constructor() {
    super("Content OS record not found");
    this.name = "ContentOsNotFoundError";
  }
}

export class ContentOsIdeaPromotionError extends Error {
  constructor() {
    super("Content OS idea cannot be promoted");
    this.name = "ContentOsIdeaPromotionError";
  }
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return Number.isFinite(new Date(value).getTime()) ? value : null;
}

function madridDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function nonnegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function nullableNonnegativeInteger(value: unknown): number | null | undefined {
  if (value === null) return null;
  return nonnegativeInteger(value) ?? undefined;
}

function proposalSource(value: unknown): ContentOsProposalSource | null {
  return value === "manual" || value === "ai" ? value : null;
}

function proposalStatus(value: unknown): ContentOsProposalStatus | null {
  return value === "proposed" || value === "approved" || value === "rejected" ? value : null;
}

function mapMetric(value: unknown): ContentOsMetricSnapshot | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const contentItemId = text(row.content_item_id);
  const recordedOn = text(row.recorded_on);
  const createdAt = timestamp(row.created_at);
  const updatedAt = timestamp(row.updated_at);
  const values = {
    views: nullableNonnegativeInteger(row.views),
    likes: nullableNonnegativeInteger(row.likes),
    comments: nullableNonnegativeInteger(row.comments),
    shares: nullableNonnegativeInteger(row.shares),
    saves: nullableNonnegativeInteger(row.saves),
    followersGained: nullableNonnegativeInteger(row.followers_gained),
    leadsGenerated: nullableNonnegativeInteger(row.leads_generated),
    salesAttributed: nullableNonnegativeInteger(row.sales_attributed),
  };

  if (
    !id ||
    !contentItemId ||
    !isContentOsDate(recordedOn ?? "") ||
    !createdAt ||
    !updatedAt ||
    Object.values(values).some((entry) => entry === undefined)
  ) {
    return null;
  }

  return {
    id,
    contentItemId,
    recordedOn: recordedOn as string,
    views: values.views as number | null,
    likes: values.likes as number | null,
    comments: values.comments as number | null,
    shares: values.shares as number | null,
    saves: values.saves as number | null,
    followersGained: values.followersGained as number | null,
    leadsGenerated: values.leadsGenerated as number | null,
    salesAttributed: values.salesAttributed as number | null,
    createdAt,
    updatedAt,
  };
}

function mapItem(
  value: unknown,
  metrics: readonly ContentOsMetricSnapshot[] = [],
): ContentOsItem | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;

  const id = text(row.id);
  const platform = text(row.platform);
  const objective = text(row.objective);
  const category = text(row.category);
  const status = text(row.status);
  const source = proposalSource(row.proposal_source);
  const approval = proposalStatus(row.proposal_status);
  const createdAt = timestamp(row.created_at);
  const updatedAt = timestamp(row.updated_at);
  const publishedAt = row.published_at === null ? null : timestamp(row.published_at);
  const plannedRecordingOn = row.planned_recording_on === null ? null : text(row.planned_recording_on);
  const plannedPublishOn = row.planned_publish_on === null ? null : text(row.planned_publish_on);
  const contentOrigin = text(row.content_origin);

  if (
    !id ||
    !isContentOsUuid(id) ||
    !includesValue(CONTENT_OS_LIBRARY_PLATFORMS, platform ?? "") ||
    (objective !== null &&
      !includesValue(CONTENT_OS_OBJECTIVES, objective)) ||
    (category !== null && !includesValue(CONTENT_OS_CATEGORIES, category)) ||
    !includesValue(CONTENT_OS_ITEM_STATUSES, status ?? "") ||
    !source ||
    !approval ||
    !createdAt ||
    !updatedAt ||
    (contentOrigin !== "planned" && contentOrigin !== "historical") ||
    (contentOrigin === "planned" &&
      (!includesValue(CONTENT_OS_PLATFORMS, platform ?? "") ||
        objective === null)) ||
    (row.published_at !== null && !publishedAt) ||
    (plannedRecordingOn !== null && !isContentOsDate(plannedRecordingOn)) ||
    (plannedPublishOn !== null && !isContentOsDate(plannedPublishOn))
  ) {
    return null;
  }

  const title = text(row.title);
  const hook = text(row.hook) ?? "";
  const script = text(row.script) ?? "";
  const cta = text(row.cta) ?? "";
  if (
    !title?.trim() ||
    (contentOrigin === "planned" &&
      (!hook.trim() || !script.trim() || !cta.trim()))
  ) {
    return null;
  }

  return {
    id,
    sourceIdeaId: optionalText(row.source_idea_id),
    title,
    summary: optionalText(row.summary),
    platform: platform as ContentOsLibraryPlatform,
    objective: objective as ContentOsObjective | null,
    category: category as ContentOsCategory | null,
    hook,
    script,
    cta,
    notes: optionalText(row.notes),
    contentOrigin,
    sourceUrl: optionalText(row.source_url),
    contentPillar: optionalText(row.content_pillar),
    relatedProductKey: optionalText(row.related_product_key),
    status: status as ContentOsItemStatus,
    plannedRecordingOn,
    plannedPublishOn,
    publishedAt,
    proposalSource: source,
    proposalStatus: approval,
    createdAt,
    updatedAt,
    metricTotals: metrics.length
      ? getLatestContentOsMetrics(metrics)
      : { ...CONTENT_OS_EMPTY_METRICS },
  };
}

function mapIdea(value: unknown, itemId: string | null): ContentOsIdea | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const title = text(row.title);
  const description = text(row.description);
  const category = text(row.category);
  const platform = text(row.platform);
  const objective = text(row.objective);
  const status = text(row.status);
  const source = proposalSource(row.proposal_source);
  const approval = proposalStatus(row.proposal_status);
  const createdAt = timestamp(row.created_at);
  const updatedAt = timestamp(row.updated_at);
  const strategyPlatforms = Array.isArray(row.strategy_platforms)
    ? row.strategy_platforms
    : [];
  const strategyDurationSeconds =
    row.strategy_duration_seconds === null ||
    row.strategy_duration_seconds === undefined
      ? null
      : nonnegativeInteger(row.strategy_duration_seconds);

  if (
    !id ||
    !isContentOsUuid(id) ||
    !title?.trim() ||
    !description?.trim() ||
    !includesValue(CONTENT_OS_CATEGORIES, category ?? "") ||
    !includesValue(CONTENT_OS_PLATFORMS, platform ?? "") ||
    !includesValue(CONTENT_OS_OBJECTIVES, objective ?? "") ||
    !includesValue(CONTENT_OS_IDEA_STATUSES, status ?? "") ||
    !source ||
    !approval ||
    !createdAt ||
    !updatedAt ||
    strategyPlatforms.some(
      (entry) =>
        typeof entry !== "string" ||
        !includesValue(CONTENT_OS_PLATFORMS, entry),
    ) ||
    (row.strategy_duration_seconds !== null &&
      row.strategy_duration_seconds !== undefined &&
      strategyDurationSeconds === null)
  ) {
    return null;
  }

  return {
    id,
    title,
    description,
    category: category as ContentOsCategory,
    platform: platform as ContentOsPlatform,
    objective: objective as ContentOsObjective,
    status: status as ContentOsIdeaStatus,
    proposalSource: source,
    proposalStatus: approval,
    strategyIdea: optionalText(row.strategy_idea),
    strategyHook: optionalText(row.strategy_hook),
    strategyPlatforms: strategyPlatforms as ContentOsPlatform[],
    strategyFormat: optionalText(row.strategy_format),
    strategyDurationSeconds,
    strategyProductKey: optionalText(row.strategy_product_key),
    strategyCta: optionalText(row.strategy_cta),
    strategyPriority: optionalText(row.strategy_priority),
    strategyPillar: optionalText(row.strategy_pillar),
    createdAt,
    updatedAt,
    contentItemId: itemId,
  };
}

function mapCalendarEvent(
  value: unknown,
  itemTitles: ReadonlyMap<string, string>,
): ContentOsCalendarEvent | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const contentItemId = optionalText(row.content_item_id);
  const title = text(row.title);
  const eventType = text(row.event_type);
  const startsAt = timestamp(row.starts_at);
  const endsAt = timestamp(row.ends_at);
  const timezone = text(row.timezone);
  const source = proposalSource(row.proposal_source);
  const approval = proposalStatus(row.proposal_status);
  const createdAt = timestamp(row.created_at);
  const updatedAt = timestamp(row.updated_at);

  if (
    !id ||
    !isContentOsUuid(id) ||
    !title?.trim() ||
    !includesValue(CONTENT_OS_EVENT_TYPES, eventType ?? "") ||
    !startsAt ||
    !endsAt ||
    new Date(endsAt).getTime() <= new Date(startsAt).getTime() ||
    !timezone?.trim() ||
    !source ||
    !approval ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    contentItemId,
    contentTitle: contentItemId ? itemTitles.get(contentItemId) ?? null : null,
    title,
    eventType: eventType as ContentOsEventType,
    startsAt,
    endsAt,
    timezone,
    notes: optionalText(row.notes),
    proposalSource: source,
    proposalStatus: approval,
    createdAt,
    updatedAt,
  };
}

async function requireContentOsAdmin(): Promise<WarhomeAdmin> {
  return requireWarhomeAdmin();
}

async function assertContentOsItem(contentItemId: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("content_items")
    .select("id")
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", contentItemId)
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

async function getExistingContentOsItemIdForIdea(ideaId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("content_items")
    .select("id")
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("source_idea_id", ideaId)
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) return null;
  const id = isRecord(data) ? text(data.id) : null;
  if (!id || !isContentOsUuid(id)) throw new ContentOsDataError();
  return id;
}

async function assertContentOsIdeaPromotable(ideaId: string): Promise<string | null> {
  const [existingItemId, ideaResult] = await Promise.all([
    getExistingContentOsItemIdForIdea(ideaId),
    getSupabaseAdmin()
      .from("content_ideas")
      .select("status,proposal_status")
      .eq("id", ideaId)
      .maybeSingle(),
  ]);
  if (ideaResult.error) throw new ContentOsDataError();

  // A previous successful promotion remains idempotent even if the idea was later discarded.
  if (existingItemId) return existingItemId;
  if (!ideaResult.data) throw new ContentOsNotFoundError();
  if (
    !isRecord(ideaResult.data) ||
    text(ideaResult.data.status) === "discarded" ||
    text(ideaResult.data.proposal_status) !== "approved"
  ) {
    throw new ContentOsIdeaPromotionError();
  }
  return null;
}

async function loadMetricsByItem(itemIds: readonly string[]): Promise<Map<string, ContentOsMetricSnapshot[]>> {
  if (!itemIds.length) return new Map();
  const { data, error } = await getSupabaseAdmin()
    .from("content_metrics")
    .select(CONTENT_METRIC_SELECT)
    .in("content_item_id", [...new Set(itemIds)])
    .order("recorded_on", { ascending: false });
  if (error || !Array.isArray(data)) throw new ContentOsDataError();

  const result = new Map<string, ContentOsMetricSnapshot[]>();
  for (const row of data) {
    const metric = mapMetric(row);
    if (!metric) throw new ContentOsDataError();
    result.set(metric.contentItemId, [...(result.get(metric.contentItemId) ?? []), metric]);
  }
  return result;
}

export async function getContentOsIdeas(): Promise<ContentOsIdea[]> {
  await requireContentOsAdmin();
  const admin = getSupabaseAdmin();
  const [ideasResult, itemsResult] = await Promise.all([
    admin
      .from("content_ideas")
      .select(CONTENT_IDEA_SELECT)
      .eq("proposal_status", "approved")
      .order("updated_at", { ascending: false })
      .limit(300),
    admin
      .from("content_items")
      .select("id,source_idea_id")
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .not("source_idea_id", "is", null),
  ]);
  if (
    ideasResult.error ||
    itemsResult.error ||
    !Array.isArray(ideasResult.data) ||
    !Array.isArray(itemsResult.data)
  ) {
    throw new ContentOsDataError();
  }

  const itemByIdea = new Map(
    itemsResult.data.flatMap((value) => {
      const row = isRecord(value) ? value : null;
      const ideaId = row ? text(row.source_idea_id) : null;
      const itemId = row ? text(row.id) : null;
      return ideaId && itemId ? [[ideaId, itemId] as const] : [];
    }),
  );

  return ideasResult.data
    .map((row) => {
      const rowId = isRecord(row) ? text(row.id) : null;
      const idea = mapIdea(row, rowId ? itemByIdea.get(rowId) ?? null : null);
      if (!idea) throw new ContentOsDataError();
      return idea;
    })
    .filter((idea) => idea.proposalStatus === "approved");
}

export async function getContentOsLibrary(): Promise<ContentOsItem[]> {
  await requireContentOsAdmin();
  const { data, error } = await getSupabaseAdmin()
    .from("content_items")
    .select(CONTENT_ITEM_SELECT)
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error || !Array.isArray(data)) throw new ContentOsDataError();

  const ids = data.flatMap((row) => {
    const record = isRecord(row) ? row : null;
    return record && typeof record.id === "string" ? [record.id] : [];
  });
  const metrics = await loadMetricsByItem(ids);

  return data.map((row) => {
    const rowId = isRecord(row) ? text(row.id) : null;
    const item = mapItem(row, rowId ? metrics.get(rowId) ?? [] : []);
    if (!item) throw new ContentOsDataError();
    return item;
  });
}

export async function getContentOsItemDetail(contentItemId: string): Promise<ContentOsItemDetail> {
  await requireContentOsAdmin();
  if (!isContentOsUuid(contentItemId)) throw new ContentOsNotFoundError();
  const admin = getSupabaseAdmin();
  const [itemResult, metricsResult, eventsResult] = await Promise.all([
    admin
      .from("content_items")
      .select(CONTENT_ITEM_SELECT)
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .eq("id", contentItemId)
      .maybeSingle(),
    admin
      .from("content_metrics")
      .select(CONTENT_METRIC_SELECT)
      .eq("content_item_id", contentItemId)
      .order("recorded_on", { ascending: false }),
    admin
      .from("content_calendar_events")
      .select(CONTENT_EVENT_SELECT)
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .eq("content_item_id", contentItemId)
      .order("starts_at", { ascending: true }),
  ]);
  if (itemResult.error || metricsResult.error || eventsResult.error) throw new ContentOsDataError();
  if (!itemResult.data) throw new ContentOsNotFoundError();
  if (!Array.isArray(metricsResult.data) || !Array.isArray(eventsResult.data)) {
    throw new ContentOsDataError();
  }

  const metrics = metricsResult.data.map((row) => {
    const metric = mapMetric(row);
    if (!metric) throw new ContentOsDataError();
    return metric;
  });
  const item = mapItem(itemResult.data, metrics);
  if (!item) throw new ContentOsDataError();
  const titles = new Map([[item.id, item.title]]);
  const calendarEvents = eventsResult.data.map((row) => {
    const event = mapCalendarEvent(row, titles);
    if (!event) throw new ContentOsDataError();
    return event;
  });

  return { item, metrics, calendarEvents };
}

export async function getContentOsCalendarWorkspace(
  parameters: ContentOsCalendarParameters,
): Promise<{ events: ContentOsCalendarEvent[]; items: ContentOsItem[] }> {
  await requireContentOsAdmin();
  const admin = getSupabaseAdmin();
  const paddedStart = new Date(`${parameters.rangeStart}T00:00:00.000Z`);
  paddedStart.setUTCDate(paddedStart.getUTCDate() - 1);
  const paddedEnd = new Date(`${parameters.rangeEnd}T00:00:00.000Z`);
  paddedEnd.setUTCDate(paddedEnd.getUTCDate() + 1);
  const [eventsResult, itemsResult] = await Promise.all([
    admin
      .from("content_calendar_events")
      .select(CONTENT_EVENT_SELECT)
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .gte("starts_at", paddedStart.toISOString())
      .lt("starts_at", paddedEnd.toISOString())
      .order("starts_at", { ascending: true }),
    admin
      .from("content_items")
      .select(CONTENT_ITEM_SELECT)
      .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
      .eq("content_origin", "planned")
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);
  if (
    eventsResult.error ||
    itemsResult.error ||
    !Array.isArray(eventsResult.data) ||
    !Array.isArray(itemsResult.data)
  ) {
    throw new ContentOsDataError();
  }

  const items = itemsResult.data.map((row) => {
    const item = mapItem(row);
    if (!item) throw new ContentOsDataError();
    return item;
  });
  const titles = new Map(items.map((item) => [item.id, item.title]));
  const events = eventsResult.data
    .map((row) => {
      const event = mapCalendarEvent(row, titles);
      if (!event) throw new ContentOsDataError();
      return event;
    })
    .filter((event) => {
      const eventDate = madridDate(event.startsAt);
      return eventDate >= parameters.rangeStart && eventDate < parameters.rangeEnd;
    });

  return { events, items };
}

export async function createContentOsIdea(input: ContentOsIdeaInput): Promise<string> {
  const adminUser = await requireContentOsAdmin();
  const { data, error } = await getSupabaseAdmin()
    .from("content_ideas")
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      platform: input.platform,
      objective: input.objective,
      status: input.status,
      proposal_source: "manual",
      proposal_status: "approved",
      created_by: adminUser.userId,
      updated_by: adminUser.userId,
    })
    .select("id")
    .single();
  if (error || !isRecord(data) || !isContentOsUuid(String(data.id))) {
    throw new ContentOsDataError();
  }
  return String(data.id);
}

export async function updateContentOsIdea(
  ideaId: string,
  input: ContentOsIdeaInput,
): Promise<void> {
  const adminUser = await requireContentOsAdmin();
  if (!isContentOsUuid(ideaId)) throw new ContentOsNotFoundError();
  const { data, error } = await getSupabaseAdmin()
    .from("content_ideas")
    .update({
      title: input.title,
      description: input.description,
      category: input.category,
      platform: input.platform,
      objective: input.objective,
      status: input.status,
      updated_by: adminUser.userId,
    })
    .eq("id", ideaId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function promoteContentOsIdea(ideaId: string): Promise<string> {
  const adminUser = await requireContentOsAdmin();
  if (!isContentOsUuid(ideaId)) throw new ContentOsNotFoundError();
  const existingItemId = await assertContentOsIdeaPromotable(ideaId);
  if (existingItemId) return existingItemId;
  const { data, error } = await getSupabaseAdmin().rpc("promote_content_os_idea", {
    p_idea_id: ideaId,
    p_admin_user_id: adminUser.userId,
  });
  if (error || !isContentOsUuid(String(data))) throw new ContentOsDataError();
  return String(data);
}

export async function createContentOsItem(input: ContentOsItemInput): Promise<string> {
  const adminUser = await requireContentOsAdmin();
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("content_items")
    .insert({
      content_type: "video",
      title: input.title,
      status: input.status,
      visibility: "internal",
      language_code: "es",
      workspace_key: CONTENT_OS_WORKSPACE_KEY,
      content_origin: "planned",
      platform: input.platform,
      objective: input.objective,
      category: input.category,
      hook: input.hook,
      script: input.script,
      cta: input.cta,
      notes: input.notes,
      planned_recording_on: input.plannedRecordingOn,
      planned_publish_on: input.plannedPublishOn,
      published_at: input.status === "published" ? now : null,
      archived_at: input.status === "archived" ? now : null,
      proposal_source: "manual",
      proposal_status: "approved",
      created_by: adminUser.userId,
      updated_by: adminUser.userId,
    })
    .select("id")
    .single();
  if (error || !isRecord(data) || !isContentOsUuid(String(data.id))) {
    throw new ContentOsDataError();
  }
  return String(data.id);
}

export async function updateContentOsItem(
  contentItemId: string,
  input: ContentOsItemInput,
): Promise<void> {
  const adminUser = await requireContentOsAdmin();
  if (!isContentOsUuid(contentItemId)) throw new ContentOsNotFoundError();
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("content_items")
    .update({
      title: input.title,
      platform: input.platform,
      objective: input.objective,
      category: input.category,
      hook: input.hook,
      script: input.script,
      cta: input.cta,
      notes: input.notes,
      status: input.status,
      planned_recording_on: input.plannedRecordingOn,
      planned_publish_on: input.plannedPublishOn,
      published_at: input.status === "published" ? now : null,
      archived_at: input.status === "archived" ? now : null,
      proposal_status: "approved",
      updated_by: adminUser.userId,
    })
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", contentItemId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function createContentOsCalendarEvent(
  input: ContentOsCalendarEventInput,
): Promise<string> {
  const adminUser = await requireContentOsAdmin();
  if (input.contentItemId) await assertContentOsItem(input.contentItemId);
  const { data, error } = await getSupabaseAdmin()
    .from("content_calendar_events")
    .insert({
      workspace_key: CONTENT_OS_WORKSPACE_KEY,
      content_item_id: input.contentItemId,
      title: input.title,
      event_type: input.eventType,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone,
      notes: input.notes,
      proposal_source: "manual",
      proposal_status: "approved",
      created_by: adminUser.userId,
      updated_by: adminUser.userId,
    })
    .select("id")
    .single();
  if (error || !isRecord(data) || !isContentOsUuid(String(data.id))) {
    throw new ContentOsDataError();
  }
  return String(data.id);
}

export async function updateContentOsCalendarEvent(
  eventId: string,
  input: ContentOsCalendarEventInput,
): Promise<void> {
  const adminUser = await requireContentOsAdmin();
  if (!isContentOsUuid(eventId)) throw new ContentOsNotFoundError();
  if (input.contentItemId) await assertContentOsItem(input.contentItemId);
  const { data, error } = await getSupabaseAdmin()
    .from("content_calendar_events")
    .update({
      content_item_id: input.contentItemId,
      title: input.title,
      event_type: input.eventType,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone,
      notes: input.notes,
      proposal_status: "approved",
      updated_by: adminUser.userId,
    })
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function moveContentOsCalendarEvent(
  eventId: string,
  startsAt: string,
  endsAt: string,
): Promise<void> {
  const adminUser = await requireContentOsAdmin();
  if (!isContentOsUuid(eventId)) throw new ContentOsNotFoundError();
  const startTime = new Date(startsAt).getTime();
  const endTime = new Date(endsAt).getTime();
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime ||
    endTime - startTime > 24 * 60 * 60 * 1000
  ) {
    throw new ContentOsDataError();
  }
  const { data, error } = await getSupabaseAdmin()
    .from("content_calendar_events")
    .update({
      starts_at: new Date(startTime).toISOString(),
      ends_at: new Date(endTime).toISOString(),
      proposal_status: "approved",
      updated_by: adminUser.userId,
    })
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function deleteContentOsCalendarEvent(eventId: string): Promise<void> {
  await requireContentOsAdmin();
  if (!isContentOsUuid(eventId)) throw new ContentOsNotFoundError();
  const { data, error } = await getSupabaseAdmin()
    .from("content_calendar_events")
    .delete()
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function upsertContentOsMetric(
  contentItemId: string,
  input: ContentOsMetricInput,
): Promise<void> {
  const adminUser = await requireContentOsAdmin();
  if (!isContentOsUuid(contentItemId)) throw new ContentOsNotFoundError();
  await assertContentOsItem(contentItemId);
  const { error } = await getSupabaseAdmin().from("content_metrics").upsert(
    {
      content_item_id: contentItemId,
      recorded_on: input.recordedOn,
      views: input.views,
      likes: input.likes,
      comments: input.comments,
      shares: input.shares,
      saves: input.saves,
      followers_gained: input.followersGained,
      leads_generated: input.leadsGenerated,
      sales_attributed: input.salesAttributed,
      created_by: adminUser.userId,
      updated_by: adminUser.userId,
    },
    { onConflict: "content_item_id,recorded_on" },
  );
  if (error) throw new ContentOsDataError();
}
