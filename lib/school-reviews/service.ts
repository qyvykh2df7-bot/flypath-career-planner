import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { EmailConfigurationError } from "@/lib/email/config";
import { queueSchoolReviewVerification } from "@/lib/email/send-transactional-email";
import { resolveSupabaseSlugForLocal } from "@/lib/schools/schoolSlugAliases";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import type {
  SchoolReviewAggregates,
  SchoolReviewPublicDto,
  SchoolReviewSubmissionInput,
} from "./contracts";
import { isSchoolReviewUuid, normalizeSchoolReviewEmail } from "./validation";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 48;
const MAX_VERIFICATION_SENDS = 3;

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type SchoolReviewActor =
  | { kind: "authenticated"; userId: string; email: string }
  | { kind: "anonymous" };

export type SchoolReviewSubmissionResult =
  | { status: "pending_moderation"; reviewId: string }
  | { status: "awaiting_email_verification"; reviewId: string }
  | { status: "duplicate"; reviewId: string };

export type SchoolReviewEmailVerificationResult =
  | "verified"
  | "already_verified"
  | "invalid_or_expired";

export class SchoolReviewDataError extends Error {
  constructor() {
    super("School review persistence is unavailable");
    this.name = "SchoolReviewDataError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueViolation(error: unknown): boolean {
  return isRecord(error) && error.code === "23505";
}

function logSchoolReviewVerificationEmailFailure(error: unknown): void {
  const stage = error instanceof EmailConfigurationError
    ? "email_configuration_unavailable"
    : error instanceof Error
      ? "dispatch_unavailable"
      : "unknown_email_error";

  console.error("[FlyPath] School review verification email failed:", stage);
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

function createOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createVerificationLink(publicOrigin: string, token: string): string {
  const origin = new URL(publicOrigin);
  if (origin.protocol !== "https:" && origin.protocol !== "http:") throw new SchoolReviewDataError();
  const url = new URL("/opiniones-escuelas/verificar", origin.origin);
  url.searchParams.set("token", token);
  return url.toString();
}

function createSnapshot(input: SchoolReviewSubmissionInput): Record<string, unknown> {
  return {
    schoolSlug: input.schoolSlug,
    isAnonymous: input.isAnonymous,
    relationship: input.relationship,
    programPhase: input.programPhase,
    approximateYear: input.approximateYear,
    ratings: input.ratings,
    answers: input.answers,
    bestPart: input.bestPart,
    improvements: input.improvements,
    advice: input.advice,
  };
}

async function resolveSchoolId(admin: AdminClient, localSlug: string): Promise<string> {
  const slug = resolveSupabaseSlugForLocal(localSlug);
  const { data, error } = await admin
    .from("schools")
    .select("school_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !isRecord(data) || typeof data.school_id !== "string") throw new SchoolReviewDataError();
  return data.school_id;
}

async function findDuplicateReview(
  admin: AdminClient,
  schoolId: string,
  authorEmailHash: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("school_reviews")
    .select("review_id")
    .eq("school_id", schoolId)
    .eq("author_email_hash", authorEmailHash)
    .neq("status", "deleted")
    .maybeSingle();
  if (error) throw new SchoolReviewDataError();
  return isRecord(data) && typeof data.review_id === "string" ? data.review_id : null;
}

async function createVerificationToken(
  admin: AdminClient,
  reviewId: string,
  now: Date,
  sentCount = 1,
): Promise<{ tokenId: string; token: string; expiresAt: string }> {
  const token = createOpaqueToken();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
  const { data, error } = await admin
    .from("school_review_tokens")
    .insert({
      review_id: reviewId,
      purpose: "verify_email",
      token_hash: hashToken(token),
      expires_at: expiresAt,
      sent_count: sentCount,
      last_sent_at: now.toISOString(),
    })
    .select("token_id")
    .single();
  if (error || !isRecord(data) || typeof data.token_id !== "string") throw new SchoolReviewDataError();
  return { tokenId: data.token_id, token, expiresAt };
}

async function appendReviewVersion(
  admin: AdminClient,
  reviewId: string,
  action: "created" | "edited" | "status_changed" | "deletion_requested",
  snapshot: Record<string, unknown>,
  changedByUserId: string | null,
): Promise<void> {
  const { data, error } = await admin
    .from("school_review_versions")
    .select("version_number")
    .eq("review_id", reviewId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new SchoolReviewDataError();
  const versionNumber = isRecord(data) && typeof data.version_number === "number" ? data.version_number + 1 : 1;
  const { error: insertError } = await admin.from("school_review_versions").insert({
    review_id: reviewId,
    version_number: versionNumber,
    action,
    snapshot,
    changed_by_user_id: changedByUserId,
  });
  if (insertError) throw new SchoolReviewDataError();
}

async function appendModerationEvent(
  admin: AdminClient,
  reviewId: string,
  toStatus: "awaiting_email_verification" | "pending" | "deletion_requested",
  reason: "other" | "author_request",
  moderatorUserId: string | null = null,
): Promise<void> {
  const { error } = await admin.from("school_review_moderation_events").insert({
    review_id: reviewId,
    from_status: null,
    to_status: toStatus,
    reason,
    moderator_user_id: moderatorUserId,
  });
  if (error) throw new SchoolReviewDataError();
}

export async function linkVerifiedSchoolReviewsToAccount(
  admin: AdminClient,
  input: { userId: string; normalizedEmail: string },
): Promise<void> {
  if (!isSchoolReviewUuid(input.userId)) throw new SchoolReviewDataError();
  const emailHash = hashEmail(input.normalizedEmail);
  const { data, error } = await admin
    .from("school_reviews")
    .select("review_id")
    .eq("author_email_hash", emailHash)
    .is("user_id", null)
    .not("email_verified_at", "is", null)
    .neq("status", "deleted");
  if (error || !Array.isArray(data)) throw new SchoolReviewDataError();

  for (const row of data) {
    if (!isRecord(row) || typeof row.review_id !== "string") continue;
    const { error: updateError } = await admin
      .from("school_reviews")
      .update({ user_id: input.userId })
      .eq("review_id", row.review_id)
      .is("user_id", null);
    // Una colisión de la regla por usuario no debe reasignar ni borrar la opinión original.
    if (updateError && !isUniqueViolation(updateError)) throw new SchoolReviewDataError();
  }
}

export async function createSchoolReview(
  input: SchoolReviewSubmissionInput,
  actor: SchoolReviewActor,
  publicOrigin: string,
  dependencies: { admin?: AdminClient; now?: () => Date } = {},
): Promise<SchoolReviewSubmissionResult> {
  const admin = dependencies.admin ?? getSupabaseAdmin();
  const now = dependencies.now?.() ?? new Date();
  const email = actor.kind === "authenticated" ? normalizeSchoolReviewEmail(actor.email) : input.email;
  if (!email) throw new SchoolReviewDataError();

  if (actor.kind === "authenticated") {
    await linkVerifiedSchoolReviewsToAccount(admin, { userId: actor.userId, normalizedEmail: email });
  }

  const schoolId = await resolveSchoolId(admin, input.schoolSlug);
  const authorEmailHash = hashEmail(email);
  const status = actor.kind === "authenticated" ? "pending" : "awaiting_email_verification";
  const verifiedAt = actor.kind === "authenticated" ? now.toISOString() : null;

  const { data, error } = await admin
    .from("school_reviews")
    .insert({
      submission_id: input.submissionId,
      school_id: schoolId,
      user_id: actor.kind === "authenticated" ? actor.userId : null,
      author_email: email,
      author_email_hash: authorEmailHash,
      status,
      is_anonymous: input.isAnonymous,
      rating_general: input.ratings.general,
      rating_costs: input.ratings.costs,
      rating_availability: input.ratings.availability,
      rating_organization: input.ratings.organization,
      rating_instructors: input.ratings.instructors,
      rating_support: input.ratings.support,
      rating_contract: input.ratings.contract,
      final_cost_answer: input.answers.finalCost,
      contract_before_payment_answer: input.answers.contractBeforePayment,
      refund_clarity_answer: input.answers.refundClarity,
      would_choose_again_answer: input.answers.wouldChooseAgain,
      relationship: input.relationship,
      program_phase: input.programPhase,
      approximate_year: input.approximateYear,
      best_part: input.bestPart,
      improvements: input.improvements,
      advice: input.advice,
      consent_at: now.toISOString(),
      email_verified_at: verifiedAt,
    })
    .select("review_id")
    .single();

  if (error || !isRecord(data) || typeof data.review_id !== "string") {
    if (!isUniqueViolation(error)) throw new SchoolReviewDataError();
    const duplicateReviewId = await findDuplicateReview(admin, schoolId, authorEmailHash);
    if (!duplicateReviewId) throw new SchoolReviewDataError();
    return { status: "duplicate", reviewId: duplicateReviewId };
  }

  const reviewId = data.review_id;
  try {
    await appendReviewVersion(admin, reviewId, "created", createSnapshot(input), actor.kind === "authenticated" ? actor.userId : null);
    await appendModerationEvent(admin, reviewId, status, "other");
  } catch {
    // La opinión sigue disponible para recuperación operativa; no se expone el error al cliente.
  }

  if (actor.kind === "authenticated") return { status: "pending_moderation", reviewId };

  try {
    const verification = await createVerificationToken(admin, reviewId, now);
    await queueSchoolReviewVerification(admin, {
      reviewId,
      idempotencyKey: verification.tokenId,
      recipientEmail: email,
      verificationLink: createVerificationLink(publicOrigin, verification.token),
      expiresAt: verification.expiresAt,
    });
  } catch (error) {
    logSchoolReviewVerificationEmailFailure(error);
    // El registro permanece pendiente y se puede solicitar el reenvío sin crear otra opinión.
  }

  return { status: "awaiting_email_verification", reviewId };
}

export async function verifySchoolReviewEmail(
  token: unknown,
  dependencies: { admin?: AdminClient; now?: () => Date } = {},
): Promise<SchoolReviewEmailVerificationResult> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return "invalid_or_expired";
  const admin = dependencies.admin ?? getSupabaseAdmin();
  const now = dependencies.now?.() ?? new Date().toISOString();
  const tokenHash = hashToken(token);

  const { data: tokenRow, error } = await admin
    .from("school_review_tokens")
    .select("token_id,review_id,purpose,expires_at,consumed_at,revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !isRecord(tokenRow) || tokenRow.purpose !== "verify_email" || typeof tokenRow.review_id !== "string") {
    return "invalid_or_expired";
  }
  if (tokenRow.consumed_at) return "already_verified";
  if (tokenRow.revoked_at || typeof tokenRow.expires_at !== "string" || new Date(tokenRow.expires_at) <= new Date(now)) {
    return "invalid_or_expired";
  }

  const { data: consumed, error: consumeError } = await admin
    .from("school_review_tokens")
    .update({ consumed_at: now })
    .eq("token_id", tokenRow.token_id)
    .is("consumed_at", null)
    .is("revoked_at", null)
    .select("review_id")
    .maybeSingle();
  if (consumeError) throw new SchoolReviewDataError();
  if (!isRecord(consumed) || typeof consumed.review_id !== "string") return "already_verified";

  const { data: verifiedReview, error: reviewError } = await admin
    .from("school_reviews")
    .update({ status: "pending", email_verified_at: now })
    .eq("review_id", consumed.review_id)
    .eq("status", "awaiting_email_verification")
    .select("review_id")
    .maybeSingle();
  if (reviewError) throw new SchoolReviewDataError();
  if (!isRecord(verifiedReview) || typeof verifiedReview.review_id !== "string") return "already_verified";

  try {
    await appendModerationEvent(admin, consumed.review_id, "pending", "other");
  } catch {
    // La transición de la opinión es la fuente de verdad; el evento es auditivo.
  }
  return "verified";
}

export async function resendSchoolReviewVerification(
  input: { reviewId: string; email: string; publicOrigin: string },
  dependencies: { admin?: AdminClient; now?: () => Date } = {},
): Promise<"sent" | "limited" | "invalid"> {
  if (!isSchoolReviewUuid(input.reviewId)) return "invalid";
  const email = normalizeSchoolReviewEmail(input.email);
  if (!email) return "invalid";
  const admin = dependencies.admin ?? getSupabaseAdmin();
  const now = dependencies.now?.() ?? new Date();
  const emailHash = hashEmail(email);
  const { data: review, error } = await admin
    .from("school_reviews")
    .select("review_id,author_email,status")
    .eq("review_id", input.reviewId)
    .eq("author_email_hash", emailHash)
    .maybeSingle();
  if (error || !isRecord(review) || review.status !== "awaiting_email_verification" || typeof review.author_email !== "string") return "invalid";

  const { data: previous, error: tokenError } = await admin
    .from("school_review_tokens")
    .select("token_id,sent_count")
    .eq("review_id", input.reviewId)
    .eq("purpose", "verify_email")
    .is("consumed_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (tokenError) throw new SchoolReviewDataError();
  const nextSendCount = isRecord(previous) && typeof previous.sent_count === "number" ? previous.sent_count + 1 : 1;
  if (nextSendCount > MAX_VERIFICATION_SENDS) return "limited";
  if (isRecord(previous) && typeof previous.token_id === "string") {
    const { error: revokeError } = await admin.from("school_review_tokens")
      .update({ revoked_at: now.toISOString() }).eq("token_id", previous.token_id).is("consumed_at", null);
    if (revokeError) throw new SchoolReviewDataError();
  }
  const verification = await createVerificationToken(admin, input.reviewId, now, nextSendCount);
  try {
    await queueSchoolReviewVerification(admin, {
      reviewId: input.reviewId,
      idempotencyKey: verification.tokenId,
      recipientEmail: review.author_email,
      verificationLink: createVerificationLink(input.publicOrigin, verification.token),
      expiresAt: verification.expiresAt,
    });
  } catch (error) {
    logSchoolReviewVerificationEmailFailure(error);
    // El token queda vigente y se puede usar si el proveedor aceptó el envío antes del fallo local.
  }
  return "sent";
}

export async function requestSchoolReviewDeletion(
  admin: AdminClient,
  input: { reviewId: string; normalizedEmail: string },
): Promise<boolean> {
  if (!isSchoolReviewUuid(input.reviewId)) return false;
  const { data, error } = await admin.from("school_reviews")
    .update({ status: "deletion_requested", deletion_requested_at: new Date().toISOString() })
    .eq("review_id", input.reviewId)
    .eq("author_email_hash", hashEmail(input.normalizedEmail))
    .neq("status", "deleted")
    .select("review_id")
    .maybeSingle();
  if (error) throw new SchoolReviewDataError();
  if (!isRecord(data) || typeof data.review_id !== "string") return false;
  await appendModerationEvent(admin, data.review_id, "deletion_requested", "author_request");
  return true;
}

export async function editSchoolReview(
  admin: AdminClient,
  input: {
    reviewId: string;
    normalizedEmail: string;
    submission: SchoolReviewSubmissionInput;
    userId?: string | null;
  },
): Promise<boolean> {
  if (!isSchoolReviewUuid(input.reviewId)) return false;
  if (input.userId !== undefined && input.userId !== null && !isSchoolReviewUuid(input.userId)) return false;
  const schoolId = await resolveSchoolId(admin, input.submission.schoolSlug);
  const filters = admin.from("school_reviews")
    .update({
      school_id: schoolId,
      is_anonymous: input.submission.isAnonymous,
      rating_general: input.submission.ratings.general,
      rating_costs: input.submission.ratings.costs,
      rating_availability: input.submission.ratings.availability,
      rating_organization: input.submission.ratings.organization,
      rating_instructors: input.submission.ratings.instructors,
      rating_support: input.submission.ratings.support,
      rating_contract: input.submission.ratings.contract,
      final_cost_answer: input.submission.answers.finalCost,
      contract_before_payment_answer: input.submission.answers.contractBeforePayment,
      refund_clarity_answer: input.submission.answers.refundClarity,
      would_choose_again_answer: input.submission.answers.wouldChooseAgain,
      relationship: input.submission.relationship,
      program_phase: input.submission.programPhase,
      approximate_year: input.submission.approximateYear,
      best_part: input.submission.bestPart,
      improvements: input.submission.improvements,
      advice: input.submission.advice,
      status: "pending",
      approved_at: null,
      rejected_at: null,
      hidden_at: null,
      moderation_reason: null,
      moderation_note: null,
    })
    .eq("review_id", input.reviewId)
    .eq("author_email_hash", hashEmail(input.normalizedEmail));
  const { data, error } = input.userId
    ? await filters.or(`user_id.is.null,user_id.eq.${input.userId}`).select("review_id").maybeSingle()
    : await filters.select("review_id").maybeSingle();
  if (error) {
    if (isUniqueViolation(error)) return false;
    throw new SchoolReviewDataError();
  }
  if (!isRecord(data) || typeof data.review_id !== "string") return false;
  await appendReviewVersion(admin, data.review_id, "edited", createSnapshot(input.submission), input.userId ?? null);
  await appendModerationEvent(admin, data.review_id, "pending", "other");
  return true;
}

export async function createSchoolReviewManagementLink(
  admin: AdminClient,
  input: { reviewId: string; normalizedEmail: string; publicOrigin: string },
): Promise<string | null> {
  if (!isSchoolReviewUuid(input.reviewId)) return null;
  const { data, error } = await admin.from("school_reviews")
    .select("review_id")
    .eq("review_id", input.reviewId)
    .eq("author_email_hash", hashEmail(input.normalizedEmail))
    .neq("status", "deleted")
    .maybeSingle();
  if (error) throw new SchoolReviewDataError();
  if (!isRecord(data) || typeof data.review_id !== "string") return null;

  const { error: revokeError } = await admin.from("school_review_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("review_id", input.reviewId)
    .eq("purpose", "manage_review")
    .is("consumed_at", null)
    .is("revoked_at", null);
  if (revokeError) throw new SchoolReviewDataError();
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const { error: insertError } = await admin.from("school_review_tokens").insert({
    review_id: input.reviewId,
    purpose: "manage_review",
    token_hash: hashToken(token),
    expires_at: expiresAt,
  });
  if (insertError) throw new SchoolReviewDataError();
  const origin = new URL(input.publicOrigin);
  const url = new URL("/opiniones-escuelas/gestionar", origin.origin);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function getOwnSchoolReview(
  admin: AdminClient,
  input: { reviewId: string; normalizedEmail: string },
): Promise<{ reviewId: string; status: string } | null> {
  if (!isSchoolReviewUuid(input.reviewId)) return null;
  const { data, error } = await admin.from("school_reviews")
    .select("review_id,status")
    .eq("review_id", input.reviewId)
    .eq("author_email_hash", hashEmail(input.normalizedEmail))
    .maybeSingle();
  if (error) throw new SchoolReviewDataError();
  return isRecord(data) && typeof data.review_id === "string" && typeof data.status === "string"
    ? { reviewId: data.review_id, status: data.status }
    : null;
}

/**
 * Converts the deliberately closed approved-review select into the only DTO that
 * may cross the public boundary. Keep private authorship and moderation fields
 * out of this mapper.
 */
export function toPublicSchoolReview(value: unknown): SchoolReviewPublicDto | null {
  if (!isRecord(value) || typeof value.review_id !== "string" || typeof value.school_id !== "string" || typeof value.approved_at !== "string") return null;
  const ratingKeys = ["general", "costs", "availability", "organization", "instructors", "support", "contract"] as const;
  const ratings = {} as SchoolReviewPublicDto["ratings"];
  for (const key of ratingKeys) {
    const dbKey = `rating_${key}`;
    if (typeof value[dbKey] !== "number") return null;
    ratings[key] = value[dbKey] as number;
  }
  if (
    typeof value.is_anonymous !== "boolean" || typeof value.relationship !== "string"
    || typeof value.best_part !== "string" || typeof value.improvements !== "string" || typeof value.advice !== "string"
  ) return null;
  return {
    reviewId: value.review_id,
    schoolId: value.school_id,
    displayAuthor: value.is_anonymous ? "Opinión anónima verificada" : "Alumno verificado",
    relationship: value.relationship as SchoolReviewPublicDto["relationship"],
    programPhase: typeof value.program_phase === "string" ? value.program_phase : null,
    approximateYear: typeof value.approximate_year === "number" ? value.approximate_year : null,
    ratings,
    answers: {
      finalCost: value.final_cost_answer as SchoolReviewPublicDto["answers"]["finalCost"],
      contractBeforePayment: value.contract_before_payment_answer as SchoolReviewPublicDto["answers"]["contractBeforePayment"],
      refundClarity: value.refund_clarity_answer as SchoolReviewPublicDto["answers"]["refundClarity"],
      wouldChooseAgain: value.would_choose_again_answer as SchoolReviewPublicDto["answers"]["wouldChooseAgain"],
    },
    bestPart: value.best_part,
    improvements: value.improvements,
    advice: value.advice,
    approvedAt: value.approved_at,
  };
}

export async function getApprovedSchoolReviews(
  admin: AdminClient,
  schoolId: string,
): Promise<SchoolReviewPublicDto[]> {
  const { data, error } = await admin.from("school_reviews").select(
    "review_id,school_id,is_anonymous,relationship,program_phase,approximate_year,rating_general,rating_costs,rating_availability,rating_organization,rating_instructors,rating_support,rating_contract,final_cost_answer,contract_before_payment_answer,refund_clarity_answer,would_choose_again_answer,best_part,improvements,advice,approved_at",
  ).eq("school_id", schoolId).eq("status", "approved").order("approved_at", { ascending: false });
  if (error || !Array.isArray(data)) throw new SchoolReviewDataError();
  return data.map(toPublicSchoolReview).filter((review): review is SchoolReviewPublicDto => review !== null);
}

export function calculateSchoolReviewAggregates(reviews: readonly SchoolReviewPublicDto[]): SchoolReviewAggregates {
  const distribution = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, 0])) as Record<number, number>;
  if (reviews.length === 0) return { total: 0, averageOverall: null, averages: {}, distribution, wouldChooseAgainPercent: null };
  const sums: Partial<Record<keyof SchoolReviewPublicDto["ratings"], number>> = {};
  let wouldChooseAgain = 0;
  for (const review of reviews) {
    distribution[review.ratings.general] += 1;
    for (const [key, value] of Object.entries(review.ratings) as [keyof SchoolReviewPublicDto["ratings"], number][]) {
      sums[key] = (sums[key] ?? 0) + value;
    }
    if (review.answers.wouldChooseAgain === "yes") wouldChooseAgain += 1;
  }
  const averages = Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, Number((value / reviews.length).toFixed(2))])) as Partial<SchoolReviewPublicDto["ratings"]>;
  return {
    total: reviews.length,
    averageOverall: averages.general ?? null,
    averages,
    distribution,
    wouldChooseAgainPercent: Number(((wouldChooseAgain / reviews.length) * 100).toFixed(1)),
  };
}
