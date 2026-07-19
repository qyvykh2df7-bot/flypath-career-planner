import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getWarhomeAuthorization, type WarhomeAdmin } from "@/lib/warhome/auth";
import { isSchoolReviewUuid } from "@/lib/school-reviews/validation";

export const WARHOME_REVIEWS_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;
const MAX_SEARCH_LENGTH = 80;

export const WARHOME_REVIEW_STATUSES = ["pending", "approved", "rejected", "hidden", "deletion_requested"] as const;
export const WARHOME_REVIEW_TARGET_STATUSES = ["pending", "approved", "rejected", "hidden", "deleted"] as const;
export const WARHOME_REVIEW_MODERATION_REASONS = ["approved", "insufficient_detail", "not_relevant", "policy_violation", "personal_data", "spam", "duplicate", "author_request", "other"] as const;

export type WarhomeReviewStatus = (typeof WARHOME_REVIEW_STATUSES)[number];
export type WarhomeReviewTargetStatus = (typeof WARHOME_REVIEW_TARGET_STATUSES)[number];
export type WarhomeReviewModerationReason = (typeof WARHOME_REVIEW_MODERATION_REASONS)[number];

export type WarhomeReviewFilters = { query: string; status: WarhomeReviewStatus | null; page: number };
export type WarhomeReviewListItem = {
  reviewId: string;
  schoolId: string;
  schoolName: string;
  schoolSlug: string | null;
  authorEmail: string;
  hasLinkedAccount: boolean;
  isAnonymous: boolean;
  ratingGeneral: number;
  status: WarhomeReviewStatus;
  createdAt: string;
  emailVerifiedAt: string | null;
};
export type WarhomeReviewsDirectory = { items: WarhomeReviewListItem[]; filters: WarhomeReviewFilters; total: number; totalPages: number };
export type WarhomeReviewDetail = {
  review: Omit<WarhomeReviewListItem, "schoolName" | "schoolSlug"> & {
    schoolName: string;
    schoolSlug: string | null;
    relationship: string;
    programPhase: string | null;
    approximateYear: number | null;
    ratings: Record<"general" | "costs" | "availability" | "organization" | "instructors" | "support" | "contract", number>;
    answers: Record<"finalCost" | "contractBeforePayment" | "refundClarity" | "wouldChooseAgain", string>;
    bestPart: string;
    improvements: string;
    advice: string;
    moderationReason: WarhomeReviewModerationReason | null;
    moderationNote: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    hiddenAt: string | null;
    deletionRequestedAt: string | null;
    deletedAt: string | null;
  };
  linkedProfile: { fullName: string | null } | null;
  versions: Array<{ versionNumber: number; action: string; createdAt: string }>;
  moderationEvents: Array<{ fromStatus: string | null; toStatus: string; reason: string; internalNote: string | null; createdAt: string }>;
};

export class WarhomeReviewsAuthorizationError extends Error { constructor() { super("Warhome review authorization failed"); } }
export class WarhomeReviewsDataError extends Error { constructor() { super("Warhome review data failed"); } }
export class WarhomeReviewNotFoundError extends Error { constructor() { super("Warhome review not found"); } }
export class WarhomeReviewTransitionError extends Error { constructor() { super("Warhome review transition failed"); } }

export const WARHOME_REVIEW_LIST_SELECT = "review_id,school_id,user_id,author_email,status,is_anonymous,rating_general,created_at,email_verified_at";
export const WARHOME_REVIEW_DETAIL_SELECT = "review_id,school_id,user_id,author_email,status,is_anonymous,rating_general,rating_costs,rating_availability,rating_organization,rating_instructors,rating_support,rating_contract,final_cost_answer,contract_before_payment_answer,refund_clarity_answer,would_choose_again_answer,relationship,program_phase,approximate_year,best_part,improvements,advice,moderation_reason,moderation_note,created_at,email_verified_at,approved_at,rejected_at,hidden_at,deletion_requested_at,deleted_at";

type SearchParams = Record<string, string | string[] | undefined>;
type Raw = Record<string, unknown>;

function record(value: unknown): Raw | null { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Raw : null; }
function param(value: string | string[] | undefined): string { return typeof value === "string" ? value : ""; }
function includes<T extends readonly string[]>(values: T, value: string): value is T[number] { return values.includes(value); }
function text(value: unknown): string | null { return typeof value === "string" ? value : null; }
function number(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }

export function sanitizeWarhomeReviewSearch(value: string): string {
  return value.replace(/[^\p{L}\p{N}@._+\-\s]/gu, "").replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
}

export function parseWarhomeReviewFilters(searchParams: SearchParams): WarhomeReviewFilters {
  const status = param(searchParams.status);
  const rawPage = param(searchParams.page);
  const parsedPage = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    query: sanitizeWarhomeReviewSearch(param(searchParams.q)),
    status: includes(WARHOME_REVIEW_STATUSES, status) ? status : null,
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, MAX_PAGE) : 1,
  };
}

export function getWarhomeReviewsUrl(filters: WarhomeReviewFilters, page = filters.page): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/warhome/reviews?${query}` : "/warhome/reviews";
}

async function requireReviewsAdmin(): Promise<WarhomeAdmin> {
  const authorization = await getWarhomeAuthorization();
  if (authorization.status !== "authorized") throw new WarhomeReviewsAuthorizationError();
  return authorization.admin;
}

function mapListRow(value: unknown, schools: Map<string, { name: string; slug: string | null }>): WarhomeReviewListItem | null {
  const row = record(value);
  if (!row) return null;
  const reviewId = text(row.review_id); const schoolId = text(row.school_id); const authorEmail = text(row.author_email); const statusValue = text(row.status); const createdAt = text(row.created_at); const rating = number(row.rating_general);
  if (!reviewId || !schoolId || !authorEmail || !createdAt || rating === null || !statusValue || !includes(WARHOME_REVIEW_STATUSES, statusValue)) return null;
  const school = schools.get(schoolId);
  return { reviewId, schoolId, schoolName: school?.name ?? "Escuela no disponible", schoolSlug: school?.slug ?? null, authorEmail, hasLinkedAccount: Boolean(text(row.user_id)), isAnonymous: row.is_anonymous === true, ratingGeneral: rating, status: statusValue, createdAt, emailVerifiedAt: text(row.email_verified_at) };
}

async function getSchoolMap(ids: readonly string[]): Promise<Map<string, { name: string; slug: string | null }>> {
  if (!ids.length) return new Map();
  const { data, error } = await getSupabaseAdmin().from("schools").select("school_id,name,slug").in("school_id", [...new Set(ids)]);
  if (error || !Array.isArray(data)) throw new WarhomeReviewsDataError();
  return new Map(data.map(record).flatMap((row) => row && typeof row.school_id === "string" ? [[row.school_id, { name: typeof row.name === "string" ? row.name : "Escuela sin nombre", slug: typeof row.slug === "string" ? row.slug : null }] as const] : []));
}

async function matchingSchoolIds(query: string): Promise<string[]> {
  if (!query) return [];
  const { data, error } = await getSupabaseAdmin().from("schools").select("school_id").ilike("name", `%${query}%`).limit(100);
  if (error || !Array.isArray(data)) throw new WarhomeReviewsDataError();
  return data.map(record).flatMap((row) => row && typeof row.school_id === "string" ? [row.school_id] : []);
}

export async function getWarhomeReviewsDirectory(searchParams: SearchParams): Promise<WarhomeReviewsDirectory> {
  await requireReviewsAdmin();
  const filters = parseWarhomeReviewFilters(searchParams);
  let query = getSupabaseAdmin().from("school_reviews").select(WARHOME_REVIEW_LIST_SELECT, { count: "exact" }).order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.query) {
    const ids = await matchingSchoolIds(filters.query);
    const emailFilter = `author_email.ilike.%${filters.query}%`;
    query = ids.length ? query.or(`${emailFilter},school_id.in.(${ids.join(",")})`) : query.ilike("author_email", `%${filters.query}%`);
  }
  const from = (filters.page - 1) * WARHOME_REVIEWS_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + WARHOME_REVIEWS_PAGE_SIZE - 1);
  if (error || !Array.isArray(data) || typeof count !== "number") throw new WarhomeReviewsDataError();
  const schools = await getSchoolMap(data.map(record).flatMap((row) => row && typeof row.school_id === "string" ? [row.school_id] : []));
  return { items: data.map((row) => mapListRow(row, schools)).filter((row): row is WarhomeReviewListItem => row !== null), filters, total: count, totalPages: Math.max(1, Math.ceil(count / WARHOME_REVIEWS_PAGE_SIZE)) };
}

export async function getWarhomeReviewDetail(reviewId: string): Promise<WarhomeReviewDetail> {
  await requireReviewsAdmin();
  if (!isSchoolReviewUuid(reviewId)) throw new WarhomeReviewNotFoundError();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("school_reviews").select(WARHOME_REVIEW_DETAIL_SELECT).eq("review_id", reviewId).maybeSingle();
  const row = record(data);
  if (error) throw new WarhomeReviewsDataError();
  if (!row) throw new WarhomeReviewNotFoundError();
  const schoolId = text(row.school_id); const authorEmail = text(row.author_email); const status = text(row.status); const createdAt = text(row.created_at); const ratingGeneral = number(row.rating_general);
  if (!schoolId || !authorEmail || !createdAt || ratingGeneral === null || !includes(["awaiting_email_verification", ...WARHOME_REVIEW_STATUSES, "deleted"] as const, status ?? "")) throw new WarhomeReviewsDataError();
  const [schools, versionsResult, eventsResult, profileResult] = await Promise.all([
    getSchoolMap([schoolId]),
    admin.from("school_review_versions").select("version_number,action,created_at").eq("review_id", reviewId).order("version_number", { ascending: false }),
    admin.from("school_review_moderation_events").select("from_status,to_status,reason,internal_note,created_at").eq("review_id", reviewId).order("created_at", { ascending: false }),
    typeof row.user_id === "string" ? admin.from("profiles").select("full_name").eq("user_id", row.user_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (versionsResult.error || eventsResult.error || profileResult.error || !Array.isArray(versionsResult.data) || !Array.isArray(eventsResult.data)) throw new WarhomeReviewsDataError();
  const school = schools.get(schoolId);
  const asRating = (key: string) => number(row[`rating_${key}`]) ?? 0;
  const detail: WarhomeReviewDetail["review"] = {
    reviewId, schoolId, schoolName: school?.name ?? "Escuela no disponible", schoolSlug: school?.slug ?? null, authorEmail, hasLinkedAccount: typeof row.user_id === "string", isAnonymous: row.is_anonymous === true, ratingGeneral, status: status as WarhomeReviewStatus, createdAt, emailVerifiedAt: text(row.email_verified_at), relationship: text(row.relationship) ?? "", programPhase: text(row.program_phase), approximateYear: number(row.approximate_year), ratings: { general: asRating("general"), costs: asRating("costs"), availability: asRating("availability"), organization: asRating("organization"), instructors: asRating("instructors"), support: asRating("support"), contract: asRating("contract") }, answers: { finalCost: text(row.final_cost_answer) ?? "", contractBeforePayment: text(row.contract_before_payment_answer) ?? "", refundClarity: text(row.refund_clarity_answer) ?? "", wouldChooseAgain: text(row.would_choose_again_answer) ?? "" }, bestPart: text(row.best_part) ?? "", improvements: text(row.improvements) ?? "", advice: text(row.advice) ?? "", moderationReason: includes(WARHOME_REVIEW_MODERATION_REASONS, text(row.moderation_reason) ?? "") ? text(row.moderation_reason) as WarhomeReviewModerationReason : null, moderationNote: text(row.moderation_note), approvedAt: text(row.approved_at), rejectedAt: text(row.rejected_at), hiddenAt: text(row.hidden_at), deletionRequestedAt: text(row.deletion_requested_at), deletedAt: text(row.deleted_at),
  };
  return { review: detail, linkedProfile: record(profileResult.data) ? { fullName: text(record(profileResult.data)?.full_name) } : null, versions: versionsResult.data.map(record).flatMap((value) => value && typeof value.version_number === "number" && typeof value.action === "string" && typeof value.created_at === "string" ? [{ versionNumber: value.version_number, action: value.action, createdAt: value.created_at }] : []), moderationEvents: eventsResult.data.map(record).flatMap((value) => value && typeof value.to_status === "string" && typeof value.reason === "string" && typeof value.created_at === "string" ? [{ fromStatus: text(value.from_status), toStatus: value.to_status, reason: value.reason, internalNote: text(value.internal_note), createdAt: value.created_at }] : []) };
}

const ALLOWED_TRANSITIONS: Record<string, readonly WarhomeReviewTargetStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["hidden"],
  rejected: ["pending"],
  hidden: ["pending"],
  deletion_requested: ["deleted"],
};

export function validateWarhomeReviewModerationInput(input: { expectedStatus: unknown; targetStatus: unknown; reason: unknown; internalNote: unknown }): { expectedStatus: WarhomeReviewStatus; targetStatus: WarhomeReviewTargetStatus; reason: WarhomeReviewModerationReason; internalNote: string | null } | null {
  const expectedStatus = typeof input.expectedStatus === "string" ? input.expectedStatus : "";
  const targetStatus = typeof input.targetStatus === "string" ? input.targetStatus : "";
  const reason = typeof input.reason === "string" ? input.reason : "";
  if (!includes(WARHOME_REVIEW_STATUSES, expectedStatus)) return null;
  if (!includes(WARHOME_REVIEW_TARGET_STATUSES, targetStatus)) return null;
  if (!includes(WARHOME_REVIEW_MODERATION_REASONS, reason)) return null;
  if (!ALLOWED_TRANSITIONS[expectedStatus]?.includes(targetStatus)) return null;
  const note = typeof input.internalNote === "string" ? input.internalNote.trim().replace(/\s+/g, " ").slice(0, 1000) : "";
  if (targetStatus === "approved" && reason !== "approved") return null;
  if (targetStatus !== "approved" && reason === "approved") return null;
  return { expectedStatus, targetStatus, reason, internalNote: note || null };
}

type AtomicModerationResult = "applied" | "already_applied" | "not_found" | "state_conflict" | "invalid_transition";

function parseAtomicModerationResult(value: unknown): { result: AtomicModerationResult; status: string | null } | null {
  const row = Array.isArray(value) ? record(value[0]) : record(value);
  const result = row ? text(row.result) : null;
  if (!result || !(["applied", "already_applied", "not_found", "state_conflict", "invalid_transition"] as const).includes(result as AtomicModerationResult)) return null;
  return { result: result as AtomicModerationResult, status: text(row?.status) };
}

export async function moderateWarhomeReview(reviewId: string, input: { expectedStatus: unknown; targetStatus: unknown; reason: unknown; internalNote: unknown }): Promise<{ changed: boolean }> {
  const adminUser = await requireReviewsAdmin();
  if (!isSchoolReviewUuid(reviewId)) throw new WarhomeReviewNotFoundError();
  const moderated = validateWarhomeReviewModerationInput(input);
  if (!moderated) throw new WarhomeReviewTransitionError();
  const { data, error } = await getSupabaseAdmin().rpc("moderate_school_review_atomically", {
    p_review_id: reviewId,
    p_expected_status: moderated.expectedStatus,
    p_target_status: moderated.targetStatus,
    p_reason: moderated.reason,
    p_internal_note: moderated.internalNote,
    p_moderator_user_id: adminUser.userId,
  });
  if (error) throw new WarhomeReviewsDataError();
  const result = parseAtomicModerationResult(data);
  if (!result) throw new WarhomeReviewsDataError();
  if (result.result === "applied") return { changed: true };
  if (result.result === "already_applied") return { changed: false };
  if (result.result === "not_found") throw new WarhomeReviewNotFoundError();
  throw new WarhomeReviewTransitionError();
}
