import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";

export const WARHOME_EMAILS_PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 80;
const MAX_PAGE_NUMBER = 10_000;
export const WARHOME_EMAILS_LOAD_ERROR_MESSAGE =
  "Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.";

export const WARHOME_EMAIL_TEMPLATE_KEYS = [
  "career_planner_confirmation",
  "preppl_waitlist_confirmation",
  "mentorship_request_confirmation",
  "mentorship_internal_alert",
] as const;

export const WARHOME_EMAIL_JOB_STATUSES = [
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
] as const;

export const WARHOME_EMAIL_DELIVERY_STATUSES = [
  "pending",
  "accepted",
  "delivered",
  "bounced",
  "failed",
] as const;

export const WARHOME_EMAIL_ACTIVITY_FILTERS = [
  "opened",
  "clicked",
  "complained",
  "suppressed",
] as const;

export type WarhomeEmailTemplateKey = (typeof WARHOME_EMAIL_TEMPLATE_KEYS)[number];
export type WarhomeEmailJobStatus = (typeof WARHOME_EMAIL_JOB_STATUSES)[number];
export type WarhomeEmailDeliveryStatus = (typeof WARHOME_EMAIL_DELIVERY_STATUSES)[number];
export type WarhomeEmailActivityFilter = (typeof WARHOME_EMAIL_ACTIVITY_FILTERS)[number];

export const WARHOME_EMAIL_TEMPLATE_LABELS: Record<WarhomeEmailTemplateKey, string> = {
  career_planner_confirmation: "Career Planner",
  preppl_waitlist_confirmation: "Pre-PPL",
  mentorship_request_confirmation: "Confirmación acompañamiento",
  mentorship_internal_alert: "Aviso interno acompañamiento",
};

export const WARHOME_EMAIL_JOB_STATUS_LABELS: Record<WarhomeEmailJobStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  sent: "Enviado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

export const WARHOME_EMAIL_DELIVERY_STATUS_LABELS: Record<WarhomeEmailDeliveryStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  delivered: "Entregado",
  bounced: "Rebotado",
  failed: "Fallido",
};

export const WARHOME_EMAIL_ACTIVITY_FILTER_LABELS: Record<WarhomeEmailActivityFilter, string> = {
  opened: "Abiertos",
  clicked: "Con clic",
  complained: "Con queja",
  suppressed: "Suprimidos",
};

const WARHOME_EMAIL_ERROR_LABELS: Record<string, string> = {
  email_provider_send_failed: "Error del proveedor",
  email_delivery_persistence_failed: "Error al registrar la entrega",
  email_delivery_acceptance_persistence_failed: "Aceptación pendiente de confirmar",
};

export type WarhomeEmailFilters = {
  query: string;
  templateKey: WarhomeEmailTemplateKey | null;
  jobStatus: WarhomeEmailJobStatus | null;
  deliveryStatus: WarhomeEmailDeliveryStatus | null;
  activity: WarhomeEmailActivityFilter | null;
  page: number;
};

export type WarhomeEmailDelivery = {
  provider: string;
  status: WarhomeEmailDeliveryStatus;
  attemptNumber: number;
  recipientEmail: string;
  subject: string;
  fromEmail: string | null;
  attemptedAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
  bouncedAt: string | null;
  failedAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  clickCount: number;
  complainedAt: string | null;
  suppressedAt: string | null;
  hasProviderMessageId: boolean;
};

export type WarhomeEmailListRow = {
  templateKey: WarhomeEmailTemplateKey;
  jobStatus: WarhomeEmailJobStatus;
  attemptCount: number;
  maxAttempts: number;
  scheduledFor: string;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
  lastError: string | null;
  leadName: string | null;
  leadEmail: string;
  delivery: WarhomeEmailDelivery | null;
};

export type WarhomeEmailMetrics = {
  totalJobs: number;
  sentJobs: number;
  pendingJobs: number;
  failedJobs: number;
};

export type WarhomeEmailsDashboard = {
  filters: WarhomeEmailFilters;
  rows: WarhomeEmailListRow[];
  totalResults: number;
  totalPages: number;
  metrics: WarhomeEmailMetrics;
};

export class WarhomeEmailsAuthorizationError extends Error {
  constructor() {
    super("Warhome email authorization failed");
    this.name = "WarhomeEmailsAuthorizationError";
  }
}

export class WarhomeEmailsDataError extends Error {
  constructor() {
    super("Warhome email data failed");
    this.name = "WarhomeEmailsDataError";
  }
}

export const WARHOME_EMAILS_SELECT =
  "id,lead_id,template_key,status,attempt_count,max_attempts,scheduled_for,sent_at,failed_at,last_error,created_at,leads!inner(full_name,email),email_deliveries(job_id,provider,status,attempt_number,provider_message_id,recipient_email,subject,from_email,attempted_at,accepted_at,delivered_at,bounced_at,failed_at,first_opened_at,last_opened_at,open_count,first_clicked_at,last_clicked_at,click_count,complained_at,suppressed_at)";

type SearchParams = Record<string, string | string[] | undefined>;
type RawRecord = Record<string, unknown>;

function getSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : null;
}

function asRecords(value: unknown): RawRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is RawRecord => asRecord(item) !== null);
  const record = asRecord(value);
  return record ? [record] : [];
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function sanitizeWarhomeEmailSearch(value: string): string {
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

export function parseWarhomeEmailFilters(searchParams: SearchParams): WarhomeEmailFilters {
  const templateKey = getSingleSearchParam(searchParams.template);
  const jobStatus = getSingleSearchParam(searchParams.job_status);
  const deliveryStatus = getSingleSearchParam(searchParams.delivery_status);
  const activity = getSingleSearchParam(searchParams.activity);

  return {
    query: sanitizeWarhomeEmailSearch(getSingleSearchParam(searchParams.q)),
    templateKey: includesValue(WARHOME_EMAIL_TEMPLATE_KEYS, templateKey) ? templateKey : null,
    jobStatus: includesValue(WARHOME_EMAIL_JOB_STATUSES, jobStatus) ? jobStatus : null,
    deliveryStatus: includesValue(WARHOME_EMAIL_DELIVERY_STATUSES, deliveryStatus)
      ? deliveryStatus
      : null,
    activity: includesValue(WARHOME_EMAIL_ACTIVITY_FILTERS, activity) ? activity : null,
    page: parsePage(getSingleSearchParam(searchParams.page)),
  };
}

export function getWarhomeEmailsUrl(filters: WarhomeEmailFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.templateKey) params.set("template", filters.templateKey);
  if (filters.jobStatus) params.set("job_status", filters.jobStatus);
  if (filters.deliveryStatus) params.set("delivery_status", filters.deliveryStatus);
  if (filters.activity) params.set("activity", filters.activity);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/warhome/emails?${query}` : "/warhome/emails";
}

export function getWarhomeEmailsRange(page: number): { from: number; to: number } {
  const normalizedPage = Math.min(Math.max(page, 1), MAX_PAGE_NUMBER);
  const from = (normalizedPage - 1) * WARHOME_EMAILS_PAGE_SIZE;
  return { from, to: from + WARHOME_EMAILS_PAGE_SIZE - 1 };
}

export function sanitizeWarhomeEmailLastError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return WARHOME_EMAIL_ERROR_LABELS[value] ?? "Error de procesamiento";
}

function toDelivery(value: RawRecord): WarhomeEmailDelivery | null {
  const status = typeof value.status === "string" ? value.status : "";
  if (
    !includesValue(WARHOME_EMAIL_DELIVERY_STATUSES, status) ||
    typeof value.provider !== "string" ||
    typeof value.attempt_number !== "number" ||
    typeof value.recipient_email !== "string" ||
    typeof value.subject !== "string" ||
    !isIsoTimestamp(value.attempted_at)
  ) {
    return null;
  }

  return {
    provider: value.provider,
    status,
    attemptNumber: value.attempt_number,
    recipientEmail: value.recipient_email,
    subject: value.subject,
    fromEmail: typeof value.from_email === "string" ? value.from_email : null,
    attemptedAt: value.attempted_at,
    acceptedAt: isIsoTimestamp(value.accepted_at) ? value.accepted_at : null,
    deliveredAt: isIsoTimestamp(value.delivered_at) ? value.delivered_at : null,
    bouncedAt: isIsoTimestamp(value.bounced_at) ? value.bounced_at : null,
    failedAt: isIsoTimestamp(value.failed_at) ? value.failed_at : null,
    firstOpenedAt: isIsoTimestamp(value.first_opened_at) ? value.first_opened_at : null,
    lastOpenedAt: isIsoTimestamp(value.last_opened_at) ? value.last_opened_at : null,
    openCount: isNonnegativeInteger(value.open_count) ? value.open_count : 0,
    firstClickedAt: isIsoTimestamp(value.first_clicked_at) ? value.first_clicked_at : null,
    lastClickedAt: isIsoTimestamp(value.last_clicked_at) ? value.last_clicked_at : null,
    clickCount: isNonnegativeInteger(value.click_count) ? value.click_count : 0,
    complainedAt: isIsoTimestamp(value.complained_at) ? value.complained_at : null,
    suppressedAt: isIsoTimestamp(value.suppressed_at) ? value.suppressed_at : null,
    hasProviderMessageId: typeof value.provider_message_id === "string" && Boolean(value.provider_message_id),
  };
}

export function getWarhomeEmailActivitySummary(
  delivery: Pick<WarhomeEmailDelivery, "openCount" | "clickCount"> | null,
): string {
  if (!delivery || (delivery.openCount === 0 && delivery.clickCount === 0)) return "Sin actividad";

  const activity: string[] = [];
  if (delivery.openCount > 0) activity.push(`Abierto ${delivery.openCount}`);
  if (delivery.clickCount > 0) activity.push(`Clic ${delivery.clickCount}`);
  return activity.join(" · ");
}

export type WarhomeEmailActivityDateLine = {
  label: "Apertura" | "Primera apertura" | "Última apertura" | "Clic" | "Primer clic" | "Último clic";
  value: string;
};

export function getWarhomeEmailActivityDateLines(
  delivery: Pick<
    WarhomeEmailDelivery,
    "openCount" | "clickCount" | "firstOpenedAt" | "lastOpenedAt" | "firstClickedAt" | "lastClickedAt"
  > | null,
): WarhomeEmailActivityDateLine[] {
  if (!delivery) return [];

  const lines: WarhomeEmailActivityDateLine[] = [];

  if (delivery.openCount > 0) {
    if (delivery.firstOpenedAt && delivery.firstOpenedAt === delivery.lastOpenedAt) {
      lines.push({ label: "Apertura", value: delivery.firstOpenedAt });
    } else {
      if (delivery.firstOpenedAt) lines.push({ label: "Primera apertura", value: delivery.firstOpenedAt });
      if (delivery.lastOpenedAt) lines.push({ label: "Última apertura", value: delivery.lastOpenedAt });
    }
  }

  if (delivery.clickCount > 0) {
    if (delivery.firstClickedAt && delivery.firstClickedAt === delivery.lastClickedAt) {
      lines.push({ label: "Clic", value: delivery.firstClickedAt });
    } else {
      if (delivery.firstClickedAt) lines.push({ label: "Primer clic", value: delivery.firstClickedAt });
      if (delivery.lastClickedAt) lines.push({ label: "Último clic", value: delivery.lastClickedAt });
    }
  }

  return lines;
}

function selectLatestDelivery(value: unknown): WarhomeEmailDelivery | null {
  const deliveries = asRecords(value)
    .map(toDelivery)
    .filter((delivery): delivery is WarhomeEmailDelivery => delivery !== null);

  deliveries.sort(
    (a, b) => b.attemptedAt.localeCompare(a.attemptedAt) || b.attemptNumber - a.attemptNumber,
  );
  return deliveries[0] ?? null;
}

export function toWarhomeEmailListRow(value: RawRecord): WarhomeEmailListRow | null {
  const templateKey = typeof value.template_key === "string" ? value.template_key : "";
  const jobStatus = typeof value.status === "string" ? value.status : "";
  const lead = asRecord(value.leads) ?? asRecords(value.leads)[0] ?? null;

  if (
    !includesValue(WARHOME_EMAIL_TEMPLATE_KEYS, templateKey) ||
    !includesValue(WARHOME_EMAIL_JOB_STATUSES, jobStatus) ||
    typeof value.attempt_count !== "number" ||
    typeof value.max_attempts !== "number" ||
    !isIsoTimestamp(value.scheduled_for) ||
    !isIsoTimestamp(value.created_at) ||
    !lead ||
    typeof lead.email !== "string"
  ) {
    return null;
  }

  return {
    templateKey,
    jobStatus,
    attemptCount: value.attempt_count,
    maxAttempts: value.max_attempts,
    scheduledFor: value.scheduled_for,
    sentAt: isIsoTimestamp(value.sent_at) ? value.sent_at : null,
    failedAt: isIsoTimestamp(value.failed_at) ? value.failed_at : null,
    createdAt: value.created_at,
    lastError: sanitizeWarhomeEmailLastError(value.last_error),
    leadName: typeof lead.full_name === "string" && lead.full_name.trim() ? lead.full_name : null,
    leadEmail: lead.email,
    delivery: selectLatestDelivery(value.email_deliveries),
  };
}

function getWarhomeEmailsSelect(filters: WarhomeEmailFilters): string {
  if (!filters.deliveryStatus && !filters.activity) return WARHOME_EMAILS_SELECT;

  return WARHOME_EMAILS_SELECT.replace("email_deliveries(", "email_deliveries!inner(");
}

function applyWarhomeEmailFilters<T extends {
  eq: (column: string, value: string) => T;
  gt: (column: string, value: number) => T;
  not: (column: string, operator: string, value: string) => T;
  or: (filters: string, options?: { foreignTable?: string }) => T;
}>(query: T, filters: WarhomeEmailFilters): T {
  let filteredQuery = query.eq("job_type", "transactional");
  if (filters.query) {
    filteredQuery = filteredQuery.or(
      `full_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`,
      { foreignTable: "leads" },
    );
  }
  if (filters.templateKey) filteredQuery = filteredQuery.eq("template_key", filters.templateKey);
  if (filters.jobStatus) filteredQuery = filteredQuery.eq("status", filters.jobStatus);
  if (filters.deliveryStatus) {
    filteredQuery = filteredQuery.eq("email_deliveries.status", filters.deliveryStatus);
  }
  if (filters.activity === "opened") filteredQuery = filteredQuery.gt("email_deliveries.open_count", 0);
  if (filters.activity === "clicked") filteredQuery = filteredQuery.gt("email_deliveries.click_count", 0);
  if (filters.activity === "complained") {
    filteredQuery = filteredQuery.not("email_deliveries.complained_at", "is", "null");
  }
  if (filters.activity === "suppressed") {
    filteredQuery = filteredQuery.not("email_deliveries.suppressed_at", "is", "null");
  }
  return filteredQuery;
}

function countEmailJobs(admin: ReturnType<typeof getSupabaseAdmin>, status?: WarhomeEmailJobStatus) {
  let query = admin
    .from("email_jobs")
    .select("id", { count: "exact", head: true })
    .eq("job_type", "transactional");
  if (status) query = query.eq("status", status);
  return query;
}

async function getWarhomeEmailMetrics(
  admin: ReturnType<typeof getSupabaseAdmin>,
): Promise<WarhomeEmailMetrics> {
  const [totalResult, sentResult, pendingResult, failedResult] = await Promise.all([
    countEmailJobs(admin),
    countEmailJobs(admin, "sent"),
    countEmailJobs(admin, "pending"),
    countEmailJobs(admin, "failed"),
  ]);

  if ([totalResult, sentResult, pendingResult, failedResult].some((result) => result.error)) {
    throw new WarhomeEmailsDataError();
  }

  return {
    totalJobs: totalResult.count ?? 0,
    sentJobs: sentResult.count ?? 0,
    pendingJobs: pendingResult.count ?? 0,
    failedJobs: failedResult.count ?? 0,
  };
}

async function getWarhomeEmailPage(
  admin: ReturnType<typeof getSupabaseAdmin>,
  filters: WarhomeEmailFilters,
): Promise<{ rows: WarhomeEmailListRow[]; totalResults: number }> {
  const range = getWarhomeEmailsRange(filters.page);
  const baseQuery = admin
    .from("email_jobs")
    .select(getWarhomeEmailsSelect(filters), { count: "exact" })
    .order("created_at", { ascending: false })
    .range(range.from, range.to);
  const query = applyWarhomeEmailFilters(baseQuery, filters);
  const { data, error, count } = await query;

  if (error || !data) throw new WarhomeEmailsDataError();

  return {
    rows: (data as unknown as RawRecord[])
      .map(toWarhomeEmailListRow)
      .filter((row): row is WarhomeEmailListRow => row !== null),
    totalResults: count ?? 0,
  };
}

export function getWarhomeEmailsDisplayState(
  rows: readonly WarhomeEmailListRow[],
  filters: WarhomeEmailFilters,
): "empty" | "filtered_empty" | "table" {
  if (rows.length) return "table";
  return filters.query || filters.templateKey || filters.jobStatus || filters.deliveryStatus || filters.activity
    ? "filtered_empty"
    : "empty";
}

export async function getWarhomeEmailsDashboard(
  searchParams: SearchParams,
): Promise<WarhomeEmailsDashboard> {
  const authorization = await getWarhomeAuthorization();
  if (authorization.status !== "authorized") throw new WarhomeEmailsAuthorizationError();

  const admin = getSupabaseAdmin();
  const filters = parseWarhomeEmailFilters(searchParams);
  const [initialPage, metrics] = await Promise.all([
    getWarhomeEmailPage(admin, filters),
    getWarhomeEmailMetrics(admin),
  ]);
  const totalPages = Math.max(1, Math.ceil(initialPage.totalResults / WARHOME_EMAILS_PAGE_SIZE));
  const resolvedFilters = filters.page > totalPages ? { ...filters, page: totalPages } : filters;
  const page =
    resolvedFilters.page === filters.page
      ? initialPage
      : await getWarhomeEmailPage(admin, resolvedFilters);

  return {
    filters: resolvedFilters,
    rows: page.rows,
    totalResults: page.totalResults,
    totalPages,
    metrics,
  };
}
