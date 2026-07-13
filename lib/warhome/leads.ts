import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";

export const WARHOME_LEADS_PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 80;
const MAX_PAGE_NUMBER = 10_000;
export const WARHOME_LEADS_LOAD_ERROR_MESSAGE =
  "Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.";

export const WARHOME_LEAD_SOURCES = [
  "newsletter",
  "home_newsletter",
  "career_planner",
  "preppl",
  "aerocomms",
  "mentoring",
  "flypath_accompaniment",
  "guide",
  "school_comparator",
  "contact_form",
  "registration",
  "manual",
  "other",
] as const;

export const WARHOME_LEAD_FUNNEL_STAGES = [
  "new",
  "interested",
  "engaged",
  "qualified",
  "customer",
  "inactive",
] as const;

export const WARHOME_LEAD_STATUSES = [
  "active",
  "unsubscribed",
  "bounced",
  "blocked",
  "archived",
] as const;

export type WarhomeLeadSource = (typeof WARHOME_LEAD_SOURCES)[number];
export type WarhomeLeadFunnelStage = (typeof WARHOME_LEAD_FUNNEL_STAGES)[number];
export type WarhomeLeadStatus = (typeof WARHOME_LEAD_STATUSES)[number];
export type WarhomeEmailSubscriptionStatus =
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "blocked"
  | null;

export const WARHOME_LEAD_SOURCE_LABELS: Record<WarhomeLeadSource, string> = {
  newsletter: "Newsletter",
  home_newsletter: "Newsletter Home",
  career_planner: "Career Planner",
  preppl: "Pre-PPL",
  aerocomms: "AeroComms",
  mentoring: "Mentorías",
  flypath_accompaniment: "Acompañamiento",
  guide: "Guía",
  school_comparator: "Comparador",
  contact_form: "Contacto",
  registration: "Registro",
  manual: "Manual",
  other: "Otro",
};

export const WARHOME_LEAD_STAGE_LABELS: Record<WarhomeLeadFunnelStage, string> = {
  new: "Nuevo",
  interested: "Interesado",
  engaged: "Activo",
  qualified: "Cualificado",
  customer: "Cliente",
  inactive: "Inactivo",
};

export const WARHOME_LEAD_STATUS_LABELS: Record<WarhomeLeadStatus, string> = {
  active: "Activo",
  unsubscribed: "No suscrito",
  bounced: "Rebotado",
  blocked: "Bloqueado",
  archived: "Archivado",
};

export const WARHOME_EMAIL_SUBSCRIPTION_LABELS: Record<
  Exclude<WarhomeEmailSubscriptionStatus, null>,
  string
> = {
  subscribed: "Suscrito",
  unsubscribed: "Dado de baja",
  bounced: "Rebotado",
  complained: "Queja",
  blocked: "Bloqueado",
};

export type WarhomeLeadFilters = {
  query: string;
  source: WarhomeLeadSource | null;
  funnelStage: WarhomeLeadFunnelStage | null;
  status: WarhomeLeadStatus | null;
  page: number;
};

export type WarhomeLeadListRow = {
  id: string;
  fullName: string | null;
  email: string;
  latestSource: WarhomeLeadSource;
  funnelStage: WarhomeLeadFunnelStage;
  status: WarhomeLeadStatus;
  createdAt: string;
  primaryInterest: string | null;
  emailSubscriptionStatus: WarhomeEmailSubscriptionStatus;
};

export type WarhomeLeadMetrics = {
  totalLeads: number;
  activeLeads: number;
  leadsByStage: Record<WarhomeLeadFunnelStage, number>;
  distinctSources: number;
};

export type WarhomeLeadsDashboard = {
  filters: WarhomeLeadFilters;
  rows: WarhomeLeadListRow[];
  totalResults: number;
  totalPages: number;
  metrics: WarhomeLeadMetrics;
};

export class WarhomeLeadsAuthorizationError extends Error {
  constructor() {
    super("Warhome lead authorization failed");
    this.name = "WarhomeLeadsAuthorizationError";
  }
}

export class WarhomeLeadsDataError extends Error {
  constructor() {
    super("Warhome leads data failed");
    this.name = "WarhomeLeadsDataError";
  }
}

// Deliberately restricted to fields rendered by the internal list.
export const WARHOME_LEADS_SELECT =
  "id,full_name,email,latest_source,funnel_stage,status,created_at,lead_product_interests(status,last_seen_at,products(name)),email_subscriptions(status)";

type SearchParams = Record<string, string | string[] | undefined>;

type RawInterest = {
  status?: unknown;
  last_seen_at?: unknown;
  products?: unknown;
};

type RawSubscription = {
  status?: unknown;
};

type RawLead = {
  [key: string]: unknown;
  id?: unknown;
  full_name?: unknown;
  email?: unknown;
  latest_source?: unknown;
  funnel_stage?: unknown;
  status?: unknown;
  created_at?: unknown;
  lead_product_interests?: unknown;
  email_subscriptions?: unknown;
};

function getSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

export function sanitizeWarhomeLeadSearch(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}@.+\-\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}

function parsePage(value: string): number {
  if (!/^\d+$/.test(value)) return 1;

  const page = Number(value);
  if (!Number.isSafeInteger(page) || page < 1) return 1;
  return Math.min(page, MAX_PAGE_NUMBER);
}

export function parseWarhomeLeadFilters(searchParams: SearchParams): WarhomeLeadFilters {
  const sourceValue = getSingleSearchParam(searchParams.source);
  const funnelStageValue = getSingleSearchParam(searchParams.stage);
  const statusValue = getSingleSearchParam(searchParams.status);

  return {
    query: sanitizeWarhomeLeadSearch(getSingleSearchParam(searchParams.q)),
    source: includesValue(WARHOME_LEAD_SOURCES, sourceValue) ? sourceValue : null,
    funnelStage: includesValue(WARHOME_LEAD_FUNNEL_STAGES, funnelStageValue)
      ? funnelStageValue
      : null,
    status: includesValue(WARHOME_LEAD_STATUSES, statusValue) ? statusValue : null,
    page: parsePage(getSingleSearchParam(searchParams.page)),
  };
}

export function getWarhomeLeadsUrl(filters: WarhomeLeadFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.source) params.set("source", filters.source);
  if (filters.funnelStage) params.set("stage", filters.funnelStage);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/warhome/leads?${query}` : "/warhome/leads";
}

export function getWarhomeLeadDetailUrl(leadId: string, filters: WarhomeLeadFilters): string {
  const returnTo = getWarhomeLeadsUrl(filters, filters.page);
  return `/warhome/leads/${leadId}?return=${encodeURIComponent(returnTo)}`;
}

export function getWarhomeLeadsRange(page: number): { from: number; to: number } {
  const normalizedPage = Math.min(Math.max(page, 1), MAX_PAGE_NUMBER);
  const from = (normalizedPage - 1) * WARHOME_LEADS_PAGE_SIZE;
  return { from, to: from + WARHOME_LEADS_PAGE_SIZE - 1 };
}

export function getWarhomeLeadsDisplayState(rows: readonly WarhomeLeadListRow[]): "empty" | "table" {
  return rows.length ? "table" : "empty";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(asRecord);
  const record = asRecord(value);
  return record ? [record] : [];
}

function productName(value: unknown): string | null {
  const product = asRecord(value) ?? asRecords(value)[0] ?? null;
  return typeof product?.name === "string" && product.name.trim() ? product.name : null;
}

function derivePrimaryInterest(value: unknown): string | null {
  const interests = asRecords(value)
    .map((interest) => ({
      status: typeof interest.status === "string" ? interest.status : "",
      lastSeenAt: typeof interest.last_seen_at === "string" ? interest.last_seen_at : "",
      productName: productName(interest.products),
    }))
    .filter((interest) => interest.productName);

  const actionable = interests.filter(
    (interest) => interest.status !== "archived" && interest.status !== "not_interested",
  );
  const candidates = actionable.length ? actionable : interests;

  candidates.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  return candidates[0]?.productName ?? null;
}

function deriveEmailSubscriptionStatus(value: unknown): WarhomeEmailSubscriptionStatus {
  const statuses = new Set(
    asRecords(value)
      .map((subscription) => subscription.status)
      .filter((status): status is Exclude<WarhomeEmailSubscriptionStatus, null> =>
        ["subscribed", "unsubscribed", "bounced", "complained", "blocked"].includes(
          String(status),
        ),
      ),
  );

  if (statuses.has("subscribed")) return "subscribed";
  if (statuses.has("blocked")) return "blocked";
  if (statuses.has("complained")) return "complained";
  if (statuses.has("bounced")) return "bounced";
  if (statuses.has("unsubscribed")) return "unsubscribed";
  return null;
}

export function toWarhomeLeadListRow(value: RawLead): WarhomeLeadListRow | null {
  const latestSource = typeof value.latest_source === "string" ? value.latest_source : "";
  const funnelStage = typeof value.funnel_stage === "string" ? value.funnel_stage : "";
  const status = typeof value.status === "string" ? value.status : "";

  if (
    typeof value.id !== "string" ||
    typeof value.email !== "string" ||
    !includesValue(WARHOME_LEAD_SOURCES, latestSource) ||
    !includesValue(WARHOME_LEAD_FUNNEL_STAGES, funnelStage) ||
    !includesValue(WARHOME_LEAD_STATUSES, status) ||
    typeof value.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    fullName: typeof value.full_name === "string" && value.full_name.trim() ? value.full_name : null,
    email: value.email,
    latestSource,
    funnelStage,
    status,
    createdAt: value.created_at,
    primaryInterest: derivePrimaryInterest(value.lead_product_interests),
    emailSubscriptionStatus: deriveEmailSubscriptionStatus(value.email_subscriptions),
  };
}

function countLeads(filters: { source?: WarhomeLeadSource; stage?: WarhomeLeadFunnelStage; status?: WarhomeLeadStatus } = {}) {
  let query = getSupabaseAdmin().from("leads").select("id", { count: "exact", head: true });
  if (filters.source) query = query.eq("latest_source", filters.source);
  if (filters.stage) query = query.eq("funnel_stage", filters.stage);
  if (filters.status) query = query.eq("status", filters.status);
  return query;
}

async function getWarhomeLeadMetrics(): Promise<WarhomeLeadMetrics> {
  const [totalResult, activeResult, stageResults, sourceResults] = await Promise.all([
    countLeads(),
    countLeads({ status: "active" }),
    Promise.all(
      WARHOME_LEAD_FUNNEL_STAGES.map((stage) => countLeads({ stage })),
    ),
    Promise.all(
      WARHOME_LEAD_SOURCES.map((source) => countLeads({ source })),
    ),
  ]);

  const allResults = [totalResult, activeResult, ...stageResults, ...sourceResults];
  if (allResults.some((result) => result.error)) throw new WarhomeLeadsDataError();

  const leadsByStage = Object.fromEntries(
    WARHOME_LEAD_FUNNEL_STAGES.map((stage, index) => [stage, stageResults[index].count ?? 0]),
  ) as Record<WarhomeLeadFunnelStage, number>;

  return {
    totalLeads: totalResult.count ?? 0,
    activeLeads: activeResult.count ?? 0,
    leadsByStage,
    distinctSources: sourceResults.filter((result) => (result.count ?? 0) > 0).length,
  };
}

async function getWarhomeLeadPage(filters: WarhomeLeadFilters): Promise<{
  rows: WarhomeLeadListRow[];
  totalResults: number;
}> {
  const from = getSupabaseAdmin().from("leads");
  const range = getWarhomeLeadsRange(filters.page);
  let query = from
    .select(WARHOME_LEADS_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(range.from, range.to);

  if (filters.query) {
    query = query.or(
      `full_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`,
    );
  }
  if (filters.source) query = query.eq("latest_source", filters.source);
  if (filters.funnelStage) query = query.eq("funnel_stage", filters.funnelStage);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query;
  if (error || !data) throw new WarhomeLeadsDataError();

  return {
    rows: (data as RawLead[])
      .map(toWarhomeLeadListRow)
      .filter((row): row is WarhomeLeadListRow => row !== null),
    totalResults: count ?? 0,
  };
}

export async function getWarhomeLeadsDashboard(
  searchParams: SearchParams,
): Promise<WarhomeLeadsDashboard> {
  const authorization = await getWarhomeAuthorization();
  if (authorization.status !== "authorized") throw new WarhomeLeadsAuthorizationError();

  const filters = parseWarhomeLeadFilters(searchParams);
  const [initialLeadPage, metrics] = await Promise.all([
    getWarhomeLeadPage(filters),
    getWarhomeLeadMetrics(),
  ]);
  const totalPages = Math.max(1, Math.ceil(initialLeadPage.totalResults / WARHOME_LEADS_PAGE_SIZE));
  const resolvedFilters =
    filters.page > totalPages ? { ...filters, page: totalPages } : filters;
  const leadPage =
    resolvedFilters.page === filters.page
      ? initialLeadPage
      : await getWarhomeLeadPage(resolvedFilters);

  return {
    filters: resolvedFilters,
    rows: leadPage.rows,
    totalResults: leadPage.totalResults,
    totalPages,
    metrics,
  };
}
