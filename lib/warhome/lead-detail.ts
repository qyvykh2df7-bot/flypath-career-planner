import "server-only";

import { hasSensitiveAnalyticValue, isSafeTrackingPath } from "@/lib/tracking/events";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";
import {
  getWarhomeLeadsUrl,
  parseWarhomeLeadFilters,
  WARHOME_EMAIL_SUBSCRIPTION_LABELS,
  WARHOME_LEAD_FUNNEL_STAGES,
  WARHOME_LEAD_SOURCES,
  WARHOME_LEAD_STATUSES,
  type WarhomeEmailSubscriptionStatus,
  type WarhomeLeadFunnelStage,
  type WarhomeLeadSource,
  type WarhomeLeadStatus,
} from "@/lib/warhome/leads";

export const WARHOME_LEAD_ACTIVITY_PAGE_SIZE = 20;
const MAX_ACTIVITY_PAGE = 1_000;

export const WARHOME_LEAD_DETAIL_SELECT =
  "id,full_name,email,latest_source,funnel_stage,status,created_at,updated_at";
export const WARHOME_LEAD_INTERESTS_SELECT =
  "product_id,status,first_seen_at,last_seen_at,products(name)";
export const WARHOME_LEAD_SUBSCRIPTIONS_SELECT =
  "list_key,status,source,consented_at,unsubscribed_at";

export const WARHOME_ACTIVITY_METADATA_KEYS = [
  "form_id",
  "popup_id",
  "page_id",
  "cta_id",
  "target",
  "source_context",
  "download_type",
  "interest_intent",
  "product_key",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "landing_page",
] as const;

const BLOCKED_ACTIVITY_METADATA_KEYS = new Set([
  "full_name",
  "email",
  "phone",
  "help_text",
  "situation",
  "contact_consent",
  "contact_consent_text",
  "consent_text",
]);

export const WARHOME_LEAD_ACTIVITY_SELECT = [
  "event_name",
  "event_category",
  "source",
  "occurred_at",
  "page_path",
  "referrer",
  ...WARHOME_ACTIVITY_METADATA_KEYS.map((key) => `${key}:metadata->>${key}`),
].join(",");

export type WarhomeLeadInterestStatus =
  | "interested"
  | "waitlist"
  | "qualified"
  | "customer"
  | "not_interested"
  | "archived";

export type WarhomeLeadInterest = {
  productId: string;
  productName: string | null;
  status: WarhomeLeadInterestStatus;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type WarhomeLeadSubscription = {
  listKey: string;
  status: Exclude<WarhomeEmailSubscriptionStatus, null>;
  source: WarhomeLeadSource;
  consentedAt: string | null;
  unsubscribedAt: string | null;
};

export type WarhomeLeadActivity = {
  eventName: string;
  eventCategory: string;
  source: string | null;
  occurredAt: string;
  pagePath: string | null;
  referrer: string | null;
  metadata: Partial<Record<(typeof WARHOME_ACTIVITY_METADATA_KEYS)[number], string>>;
};

export type WarhomeLeadDetail = {
  id: string;
  fullName: string | null;
  email: string;
  latestSource: WarhomeLeadSource;
  funnelStage: WarhomeLeadFunnelStage;
  status: WarhomeLeadStatus;
  createdAt: string;
  updatedAt: string;
  interests: WarhomeLeadInterest[];
  subscriptions: WarhomeLeadSubscription[];
  activity: WarhomeLeadActivity[];
  activityPage: number;
  activityTotal: number;
  activityTotalPages: number;
};

export class WarhomeLeadDetailAuthorizationError extends Error {
  constructor() {
    super("Warhome lead detail authorization failed");
    this.name = "WarhomeLeadDetailAuthorizationError";
  }
}

export class WarhomeLeadNotFoundError extends Error {
  constructor() {
    super("Warhome lead not found");
    this.name = "WarhomeLeadNotFoundError";
  }
}

export class WarhomeLeadDetailDataError extends Error {
  constructor() {
    super("Warhome lead detail data failed");
    this.name = "WarhomeLeadDetailDataError";
  }
}

type SearchParams = Record<string, string | string[] | undefined>;
type MetadataKey = (typeof WARHOME_ACTIVITY_METADATA_KEYS)[number];

type RawLead = Record<string, unknown>;
type RawInterest = Record<string, unknown>;
type RawSubscription = Record<string, unknown>;
type RawActivity = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEREST_STATUSES: readonly WarhomeLeadInterestStatus[] = [
  "interested",
  "waitlist",
  "qualified",
  "customer",
  "not_interested",
  "archived",
];
const EMAIL_SUBSCRIPTION_STATUSES: readonly Exclude<WarhomeEmailSubscriptionStatus, null>[] = [
  "subscribed",
  "unsubscribed",
  "bounced",
  "complained",
  "blocked",
];

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function getSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export function isWarhomeLeadId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseWarhomeActivityPage(value: string | string[] | undefined): number {
  const rawValue = getSingleSearchParam(value);
  if (!/^\d+$/.test(rawValue)) return 1;

  const page = Number(rawValue);
  if (!Number.isSafeInteger(page) || page < 1) return 1;
  return Math.min(page, MAX_ACTIVITY_PAGE);
}

export function getWarhomeActivityRange(page: number): { from: number; to: number } {
  const normalizedPage = Math.min(Math.max(page, 1), MAX_ACTIVITY_PAGE);
  const from = (normalizedPage - 1) * WARHOME_LEAD_ACTIVITY_PAGE_SIZE;
  return { from, to: from + WARHOME_LEAD_ACTIVITY_PAGE_SIZE - 1 };
}

export function getSafeWarhomeLeadsReturn(value: string | string[] | undefined): string {
  const rawValue = getSingleSearchParam(value);
  if (!rawValue) return "/warhome/leads";

  try {
    const baseUrl = new URL("https://warhome.invalid");
    const parsedUrl = new URL(rawValue, baseUrl);
    if (parsedUrl.origin !== baseUrl.origin || parsedUrl.pathname !== "/warhome/leads") {
      return "/warhome/leads";
    }

    const searchParams: SearchParams = {};
    for (const key of ["q", "source", "stage", "status", "page"]) {
      const parameter = parsedUrl.searchParams.get(key);
      if (parameter !== null) searchParams[key] = parameter;
    }

    const filters = parseWarhomeLeadFilters(searchParams);
    return getWarhomeLeadsUrl(filters, filters.page);
  } catch {
    return "/warhome/leads";
  }
}

export function getWarhomeLeadActivityUrl(
  leadId: string,
  returnTo: string,
  activityPage: number,
): string {
  const params = new URLSearchParams({ return: returnTo });
  if (activityPage > 1) params.set("activity_page", String(activityPage));
  return `/warhome/leads/${leadId}?${params.toString()}`;
}

export function sanitizeWarhomeActivityReferrer(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || hasSensitiveAnalyticValue(value)) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname || null;
  } catch {
    const path = value.split("?", 1)[0] ?? "";
    return isSafeTrackingPath(path) ? path : null;
  }
}

function sanitizeWarhomeActivityPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split("?", 1)[0] ?? "";
  return isSafeTrackingPath(path) ? path : null;
}

function isSafeMetadataValue(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 160 &&
    !hasSensitiveAnalyticValue(value)
  );
}

export function sanitizeWarhomeActivityMetadata(
  value: unknown,
): Partial<Record<MetadataKey, string>> {
  if (!isRecord(value)) return {};

  const metadata: Partial<Record<MetadataKey, string>> = {};
  for (const key of Object.keys(value)) {
    if (BLOCKED_ACTIVITY_METADATA_KEYS.has(key)) continue;
    if (!includesValue(WARHOME_ACTIVITY_METADATA_KEYS, key)) continue;

    const metadataValue = value[key];
    if (!isSafeMetadataValue(metadataValue)) continue;
    metadata[key] =
      key === "landing_page" ? sanitizeWarhomeActivityPath(metadataValue) ?? "" : metadataValue;
    if (!metadata[key]) delete metadata[key];
  }

  return metadata;
}

function mapLead(value: RawLead): Omit<WarhomeLeadDetail, "interests" | "subscriptions" | "activity" | "activityPage" | "activityTotal" | "activityTotalPages"> | null {
  const source = typeof value.latest_source === "string" ? value.latest_source : "";
  const stage = typeof value.funnel_stage === "string" ? value.funnel_stage : "";
  const status = typeof value.status === "string" ? value.status : "";

  if (
    typeof value.id !== "string" ||
    typeof value.email !== "string" ||
    !includesValue(WARHOME_LEAD_SOURCES, source) ||
    !includesValue(WARHOME_LEAD_FUNNEL_STAGES, stage) ||
    !includesValue(WARHOME_LEAD_STATUSES, status) ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    fullName: typeof value.full_name === "string" && value.full_name.trim() ? value.full_name : null,
    email: value.email,
    latestSource: source,
    funnelStage: stage,
    status,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function mapInterest(value: RawInterest): WarhomeLeadInterest | null {
  const status = typeof value.status === "string" ? value.status : "";
  const product = asRecords(value.products)[0] ?? null;

  if (
    typeof value.product_id !== "string" ||
    !includesValue(INTEREST_STATUSES, status) ||
    typeof value.first_seen_at !== "string" ||
    typeof value.last_seen_at !== "string"
  ) {
    return null;
  }

  return {
    productId: value.product_id,
    productName: typeof product?.name === "string" && product.name.trim() ? product.name : null,
    status,
    firstSeenAt: value.first_seen_at,
    lastSeenAt: value.last_seen_at,
  };
}

function mapSubscription(value: RawSubscription): WarhomeLeadSubscription | null {
  const status = typeof value.status === "string" ? value.status : "";
  const source = typeof value.source === "string" ? value.source : "";

  if (
    typeof value.list_key !== "string" ||
    !includesValue(EMAIL_SUBSCRIPTION_STATUSES, status) ||
    !includesValue(WARHOME_LEAD_SOURCES, source)
  ) {
    return null;
  }

  return {
    listKey: value.list_key,
    status,
    source,
    consentedAt: typeof value.consented_at === "string" ? value.consented_at : null,
    unsubscribedAt: typeof value.unsubscribed_at === "string" ? value.unsubscribed_at : null,
  };
}

function mapActivity(value: RawActivity): WarhomeLeadActivity | null {
  if (
    typeof value.event_name !== "string" ||
    !/^[a-z][a-z0-9_]*$/.test(value.event_name) ||
    typeof value.event_category !== "string" ||
    typeof value.occurred_at !== "string"
  ) {
    return null;
  }

  const metadataValues = Object.fromEntries(
    WARHOME_ACTIVITY_METADATA_KEYS.map((key) => [key, value[key]]),
  );

  return {
    eventName: value.event_name,
    eventCategory: value.event_category,
    source: typeof value.source === "string" && value.source.length <= 80 ? value.source : null,
    occurredAt: value.occurred_at,
    pagePath: sanitizeWarhomeActivityPath(value.page_path),
    referrer: sanitizeWarhomeActivityReferrer(value.referrer),
    metadata: sanitizeWarhomeActivityMetadata(metadataValues),
  };
}

async function getLeadActivity(leadId: string, activityPage: number): Promise<{
  activity: WarhomeLeadActivity[];
  total: number;
}> {
  const range = getWarhomeActivityRange(activityPage);
  const { data, error, count } = await getSupabaseAdmin()
    .from("user_events")
    .select(WARHOME_LEAD_ACTIVITY_SELECT, { count: "exact" })
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: false })
    .range(range.from, range.to);

  if (error || !data) throw new WarhomeLeadDetailDataError();

  return {
    activity: (data as unknown as RawActivity[])
      .map(mapActivity)
      .filter((event): event is WarhomeLeadActivity => event !== null),
    total: count ?? 0,
  };
}

export async function getWarhomeLeadDetail(
  leadId: string,
  options: { activityPage: number },
): Promise<WarhomeLeadDetail> {
  const authorization = await getWarhomeAuthorization();
  if (authorization.status !== "authorized") throw new WarhomeLeadDetailAuthorizationError();
  if (!isWarhomeLeadId(leadId)) throw new WarhomeLeadNotFoundError();

  const { data: rawLead, error: leadError } = await getSupabaseAdmin()
    .from("leads")
    .select(WARHOME_LEAD_DETAIL_SELECT)
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) throw new WarhomeLeadDetailDataError();
  const lead = rawLead && isRecord(rawLead) ? mapLead(rawLead) : null;
  if (!lead) throw new WarhomeLeadNotFoundError();

  const requestedActivityPage = Math.min(
    Math.max(options.activityPage, 1),
    MAX_ACTIVITY_PAGE,
  );
  const [interestsResult, subscriptionsResult, initialActivity] = await Promise.all([
    getSupabaseAdmin()
      .from("lead_product_interests")
      .select(WARHOME_LEAD_INTERESTS_SELECT)
      .eq("lead_id", leadId)
      .order("last_seen_at", { ascending: false }),
    getSupabaseAdmin()
      .from("email_subscriptions")
      .select(WARHOME_LEAD_SUBSCRIPTIONS_SELECT)
      .eq("lead_id", leadId)
      .order("consented_at", { ascending: false }),
    getLeadActivity(leadId, requestedActivityPage),
  ]);

  if (interestsResult.error || subscriptionsResult.error) {
    throw new WarhomeLeadDetailDataError();
  }

  const activityTotalPages = Math.max(
    1,
    Math.ceil(initialActivity.total / WARHOME_LEAD_ACTIVITY_PAGE_SIZE),
  );
  const activityPage = Math.min(requestedActivityPage, activityTotalPages);
  const activity =
    activityPage === requestedActivityPage
      ? initialActivity
      : await getLeadActivity(leadId, activityPage);

  return {
    ...lead,
    interests: asRecords(interestsResult.data)
      .map(mapInterest)
      .filter((interest): interest is WarhomeLeadInterest => interest !== null),
    subscriptions: asRecords(subscriptionsResult.data)
      .map(mapSubscription)
      .filter((subscription): subscription is WarhomeLeadSubscription => subscription !== null),
    activity: activity.activity,
    activityPage,
    activityTotal: activity.total,
    activityTotalPages,
  };
}

export const WARHOME_EMAIL_SUBSCRIPTION_STATUS_LABELS = WARHOME_EMAIL_SUBSCRIPTION_LABELS;
