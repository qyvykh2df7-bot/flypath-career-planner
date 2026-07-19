import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";

export const WARHOME_USERS_PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 80;
const MAX_PAGE_NUMBER = 10_000;
export const WARHOME_USERS_LOAD_ERROR_MESSAGE =
  "Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.";
export const WARHOME_USERS_RPC_NAME = "get_warhome_user_directory";

export const WARHOME_AEROCOMMS_STATUSES = ["not_synced", "no_activity", "active"] as const;
export const WARHOME_MARKETING_STATUSES = [
  "subscribed",
  "not_subscribed",
  "not_applicable",
] as const;
export const WARHOME_USER_LEAD_FILTERS = ["linked", "no_lead"] as const;
export const WARHOME_USER_CONFIRMATION_FILTERS = ["confirmed", "unconfirmed"] as const;
export const WARHOME_USER_PROFILE_FILTERS = ["incomplete", "complete"] as const;
export const WARHOME_USER_SORT_FIELDS = [
  "created_at",
  "last_sign_in_at",
  "last_aerocomms_activity_at",
] as const;
export const WARHOME_USER_SORT_DIRECTIONS = ["asc", "desc"] as const;

export type WarhomeAeroCommsStatus = (typeof WARHOME_AEROCOMMS_STATUSES)[number];
export type WarhomeMarketingStatus = (typeof WARHOME_MARKETING_STATUSES)[number];
export type WarhomeUserLeadFilter = (typeof WARHOME_USER_LEAD_FILTERS)[number];
export type WarhomeUserConfirmationFilter = (typeof WARHOME_USER_CONFIRMATION_FILTERS)[number];
export type WarhomeUserProfileFilter = (typeof WARHOME_USER_PROFILE_FILTERS)[number];
export type WarhomeUserSortField = (typeof WARHOME_USER_SORT_FIELDS)[number];
export type WarhomeUserSortDirection = (typeof WARHOME_USER_SORT_DIRECTIONS)[number];
export type WarhomeUserSearchParams = Record<string, string | string[] | undefined>;

export type WarhomeUserFilters = {
  query: string;
  aerocommsStatus: WarhomeAeroCommsStatus | null;
  lead: WarhomeUserLeadFilter | null;
  marketingStatus: WarhomeMarketingStatus | null;
  emailConfirmation: WarhomeUserConfirmationFilter | null;
  profile: WarhomeUserProfileFilter | null;
};

export type WarhomeUserSort = {
  field: WarhomeUserSortField;
  direction: WarhomeUserSortDirection;
};

export type WarhomeUserListParameters = {
  filters: WarhomeUserFilters;
  sort: WarhomeUserSort;
  page: number;
};

export type WarhomeUserDirectoryItem = {
  userId: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  fullName: string | null;
  profileIncomplete: boolean;
  hasAeroCommsProgress: boolean;
  sessionCount: number;
  scoredSessionCount: number;
  lastAeroCommsActivityAt: string | null;
  lastAeroCommsActivityDate: string | null;
  streakDays: number;
  legacyImportedAt: string | null;
  resetAt: string | null;
  completedExerciseCount: number;
  completedMissionCount: number;
  hasLead: boolean;
  leadId: string | null;
  marketingStatus: WarhomeMarketingStatus;
  aerocommsStatus: WarhomeAeroCommsStatus;
};

export type WarhomeUsersDirectory = {
  items: WarhomeUserDirectoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: WarhomeUserFilters;
  sort: WarhomeUserSort;
};

export class WarhomeUsersAuthorizationError extends Error {
  constructor() {
    super("Warhome user authorization failed");
    this.name = "WarhomeUsersAuthorizationError";
  }
}

export class WarhomeUsersDataError extends Error {
  constructor() {
    super("Warhome users data failed");
    this.name = "WarhomeUsersDataError";
  }
}

type RawRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(new Date(value).getTime());
}

function isNullableTimestamp(value: unknown): value is string | null {
  return value === null || isTimestamp(value);
}

function isNullableDate(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function parsePage(value: string): number {
  if (!/^\d+$/.test(value)) return 1;
  const page = Number(value);
  if (!Number.isSafeInteger(page) || page < 1) return 1;
  return Math.min(page, MAX_PAGE_NUMBER);
}

export function isWarhomeUserId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function sanitizeWarhomeUserSearch(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}@.+\-\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}

export function parseWarhomeUserListParameters(
  searchParams: WarhomeUserSearchParams,
): WarhomeUserListParameters {
  const aerocommsStatus = getSingleSearchParam(searchParams.aerocomms);
  const lead = getSingleSearchParam(searchParams.lead);
  const marketingStatus = getSingleSearchParam(searchParams.marketing);
  const emailConfirmation = getSingleSearchParam(searchParams.confirmed);
  const profile = getSingleSearchParam(searchParams.profile);
  const sortField = getSingleSearchParam(searchParams.sort);
  const sortDirection = getSingleSearchParam(searchParams.direction);

  return {
    filters: {
      query: sanitizeWarhomeUserSearch(getSingleSearchParam(searchParams.q)),
      aerocommsStatus: includesValue(WARHOME_AEROCOMMS_STATUSES, aerocommsStatus)
        ? aerocommsStatus
        : null,
      lead: includesValue(WARHOME_USER_LEAD_FILTERS, lead) ? lead : null,
      marketingStatus: includesValue(WARHOME_MARKETING_STATUSES, marketingStatus)
        ? marketingStatus
        : null,
      emailConfirmation: includesValue(WARHOME_USER_CONFIRMATION_FILTERS, emailConfirmation)
        ? emailConfirmation
        : null,
      profile: includesValue(WARHOME_USER_PROFILE_FILTERS, profile) ? profile : null,
    },
    sort: {
      field: includesValue(WARHOME_USER_SORT_FIELDS, sortField) ? sortField : "created_at",
      direction: includesValue(WARHOME_USER_SORT_DIRECTIONS, sortDirection)
        ? sortDirection
        : "desc",
    },
    page: parsePage(getSingleSearchParam(searchParams.page)),
  };
}

export function getWarhomeUsersOffset(page: number): number {
  const normalizedPage = Math.min(Math.max(page, 1), MAX_PAGE_NUMBER);
  return (normalizedPage - 1) * WARHOME_USERS_PAGE_SIZE;
}

export function getWarhomeUsersUrl(parameters: WarhomeUserListParameters, page: number): string {
  const { filters, sort } = parameters;
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.aerocommsStatus) params.set("aerocomms", filters.aerocommsStatus);
  if (filters.lead) params.set("lead", filters.lead);
  if (filters.marketingStatus) params.set("marketing", filters.marketingStatus);
  if (filters.emailConfirmation) params.set("confirmed", filters.emailConfirmation);
  if (filters.profile) params.set("profile", filters.profile);
  if (sort.field !== "created_at") params.set("sort", sort.field);
  if (sort.direction !== "desc") params.set("direction", sort.direction);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/warhome/users?${query}` : "/warhome/users";
}

export function getWarhomeUsersDisplayState(
  items: readonly WarhomeUserDirectoryItem[],
): "empty" | "table" {
  return items.length ? "table" : "empty";
}

export function deriveWarhomeAeroCommsStatus(input: {
  hasProgress: boolean;
  sessionCount: number;
  lastActivityAt: string | null;
  lastActivityDate: string | null;
}): WarhomeAeroCommsStatus {
  if (!input.hasProgress) return "not_synced";
  if (input.sessionCount > 0 || input.lastActivityAt || input.lastActivityDate) return "active";
  return "no_activity";
}

export function deriveWarhomeMarketingStatus(input: {
  hasLead: boolean;
  hasActiveSubscription: boolean;
}): WarhomeMarketingStatus {
  if (!input.hasLead) return "not_applicable";
  return input.hasActiveSubscription ? "subscribed" : "not_subscribed";
}

export function toWarhomeUserDirectoryItem(value: unknown): WarhomeUserDirectoryItem | null {
  if (!isRecord(value)) return null;

  const fullName = typeof value.fullName === "string" && value.fullName.trim() ? value.fullName : null;
  const leadId = value.leadId === null ? null : isWarhomeUserId(String(value.leadId)) ? String(value.leadId) : undefined;
  const marketingStatus = includesValue(WARHOME_MARKETING_STATUSES, String(value.marketingStatus))
    ? (String(value.marketingStatus) as WarhomeMarketingStatus)
    : null;
  const aerocommsStatus = includesValue(WARHOME_AEROCOMMS_STATUSES, String(value.aerocommsStatus))
    ? (String(value.aerocommsStatus) as WarhomeAeroCommsStatus)
    : null;

  if (
    !isWarhomeUserId(String(value.userId)) ||
    typeof value.email !== "string" ||
    !value.email.trim() ||
    typeof value.emailConfirmed !== "boolean" ||
    !isTimestamp(value.createdAt) ||
    !isNullableTimestamp(value.lastSignInAt) ||
    typeof value.profileIncomplete !== "boolean" ||
    typeof value.hasAeroCommsProgress !== "boolean" ||
    !isNonnegativeInteger(value.sessionCount) ||
    !isNonnegativeInteger(value.scoredSessionCount) ||
    value.scoredSessionCount > value.sessionCount ||
    !isNullableTimestamp(value.lastAeroCommsActivityAt) ||
    !isNullableDate(value.lastAeroCommsActivityDate) ||
    !isNonnegativeInteger(value.streakDays) ||
    !isNullableTimestamp(value.legacyImportedAt) ||
    !isNullableTimestamp(value.resetAt) ||
    !isNonnegativeInteger(value.completedExerciseCount) ||
    !isNonnegativeInteger(value.completedMissionCount) ||
    typeof value.hasLead !== "boolean" ||
    leadId === undefined ||
    value.hasLead !== (leadId !== null) ||
    !marketingStatus ||
    !aerocommsStatus
  ) {
    return null;
  }

  if (
    marketingStatus !== deriveWarhomeMarketingStatus({
      hasLead: value.hasLead,
      hasActiveSubscription: marketingStatus === "subscribed",
    }) ||
    aerocommsStatus !==
      deriveWarhomeAeroCommsStatus({
        hasProgress: value.hasAeroCommsProgress,
        sessionCount: value.sessionCount,
        lastActivityAt: value.lastAeroCommsActivityAt,
        lastActivityDate: value.lastAeroCommsActivityDate,
      })
  ) {
    return null;
  }

  return {
    userId: String(value.userId),
    email: value.email.trim(),
    emailConfirmed: value.emailConfirmed,
    createdAt: value.createdAt,
    lastSignInAt: value.lastSignInAt,
    fullName,
    profileIncomplete: value.profileIncomplete,
    hasAeroCommsProgress: value.hasAeroCommsProgress,
    sessionCount: value.sessionCount,
    scoredSessionCount: value.scoredSessionCount,
    lastAeroCommsActivityAt: value.lastAeroCommsActivityAt,
    lastAeroCommsActivityDate: value.lastAeroCommsActivityDate,
    streakDays: value.streakDays,
    legacyImportedAt: value.legacyImportedAt,
    resetAt: value.resetAt,
    completedExerciseCount: value.completedExerciseCount,
    completedMissionCount: value.completedMissionCount,
    hasLead: value.hasLead,
    leadId,
    marketingStatus,
    aerocommsStatus,
  };
}

function parseWarhomeUsersRpcResponse(value: unknown): {
  items: WarhomeUserDirectoryItem[];
  total: number;
} | null {
  if (!isRecord(value) || !isNonnegativeInteger(value.total) || !Array.isArray(value.rows)) return null;

  const items = value.rows.map(toWarhomeUserDirectoryItem);
  if (items.some((item) => item === null)) return null;
  return {
    items: items.filter((item): item is WarhomeUserDirectoryItem => item !== null),
    total: value.total,
  };
}

function getRpcParams(parameters: WarhomeUserListParameters) {
  const { filters, sort } = parameters;
  return {
    p_query: filters.query || null,
    p_aerocomms_status: filters.aerocommsStatus,
    p_has_lead: filters.lead === null ? null : filters.lead === "linked",
    p_marketing_status: filters.marketingStatus,
    p_email_confirmed:
      filters.emailConfirmation === null ? null : filters.emailConfirmation === "confirmed",
    p_profile_incomplete: filters.profile === null ? null : filters.profile === "incomplete",
    p_sort_by: sort.field,
    p_sort_direction: sort.direction,
    p_limit: WARHOME_USERS_PAGE_SIZE,
    p_offset: getWarhomeUsersOffset(parameters.page),
  };
}

async function getWarhomeUserPage(parameters: WarhomeUserListParameters): Promise<{
  items: WarhomeUserDirectoryItem[];
  total: number;
}> {
  const { data, error } = await getSupabaseAdmin().rpc(WARHOME_USERS_RPC_NAME, getRpcParams(parameters));
  const parsed = error ? null : parseWarhomeUsersRpcResponse(data);
  if (!parsed) throw new WarhomeUsersDataError();
  return parsed;
}

export async function getWarhomeUsersDirectory(
  searchParams: WarhomeUserSearchParams,
): Promise<WarhomeUsersDirectory> {
  const authorization = await getWarhomeAuthorization();
  if (authorization.status !== "authorized") throw new WarhomeUsersAuthorizationError();

  const parameters = parseWarhomeUserListParameters(searchParams);
  const initialPage = await getWarhomeUserPage(parameters);
  const totalPages = Math.max(1, Math.ceil(initialPage.total / WARHOME_USERS_PAGE_SIZE));
  const resolvedParameters =
    parameters.page > totalPages ? { ...parameters, page: totalPages } : parameters;
  const page =
    resolvedParameters.page === parameters.page
      ? initialPage
      : await getWarhomeUserPage(resolvedParameters);

  return {
    items: page.items,
    page: resolvedParameters.page,
    pageSize: WARHOME_USERS_PAGE_SIZE,
    total: page.total,
    totalPages,
    filters: resolvedParameters.filters,
    sort: resolvedParameters.sort,
  };
}
