import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSchoolReview,
  SchoolReviewDataError,
  type SchoolReviewActor,
} from "@/lib/school-reviews/service";
import {
  parseSchoolReviewSubmission,
  SCHOOL_REVIEW_REQUEST_MAX_BODY_SIZE,
  SchoolReviewValidationError,
} from "@/lib/school-reviews/validation";
import {
  getRequestOrigin,
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";
import {
  authorizePublicFormSubmission,
  hasOnlyPublicFormKeys,
  isJsonRequest,
  PublicFormSecurityError,
  publicFormSecurityErrorResponse,
  validatePublicFormProof,
} from "@/lib/security/public-form-security";

export const runtime = "nodejs";

const GENERIC_ERROR = { error: "No hemos podido registrar tu opinión. Inténtalo de nuevo." };

class SchoolReviewAuthUnavailableError extends Error {}

function validationError(field: string) {
  if (process.env.NODE_ENV === "development") {
    console.error("[FlyPath] School review validation failed:", field);
    return Response.json({ ...GENERIC_ERROR, validationField: field }, { status: 400 });
  }
  return Response.json(GENERIC_ERROR, { status: 400 });
}

async function getReviewActor(): Promise<SchoolReviewActor> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new SchoolReviewAuthUnavailableError();
  if (!user?.email || !user.email_confirmed_at) return { kind: "anonymous" };
  return { kind: "authenticated", userId: user.id, email: user.email };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json(GENERIC_ERROR, { status: 403 });
  if (!isJsonRequest(request)) return Response.json(GENERIC_ERROR, { status: 415 });
  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, SCHOOL_REVIEW_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    return Response.json(GENERIC_ERROR, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }

  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) return validationError("payload");
    const record = body as Record<string, unknown>;
    if (!hasOnlyPublicFormKeys(record, [
      "submissionId", "schoolSlug", "email", "isAnonymous", "relationship", "programPhase",
      "approximateYear", "ratings", "answers", "bestPart", "improvements", "advice", "consent",
      "honeypot", "form_started_at",
    ])) return validationError("payload");
    const input = parseSchoolReviewSubmission(body);
    const actor = await getReviewActor();
    if (actor.kind === "authenticated" && input.email !== undefined) {
      return validationError("email.authenticated_payload");
    }
    if (actor.kind === "anonymous" && !input.email) {
      return validationError("email.anonymous_required");
    }

    try {
      validatePublicFormProof(request, { honeypot: record.honeypot, formStartedAt: record.form_started_at });
      await authorizePublicFormSubmission(request, {
        ipScope: "school_review_ip",
        identityScope: "school_review_identity",
        identitySubject: actor.kind === "authenticated"
          ? `user:${actor.userId}`
          : `school:${input.schoolSlug}:email:${input.email}`,
      });
    } catch (error) {
      if (error instanceof PublicFormSecurityError) return publicFormSecurityErrorResponse(error);
      return publicFormSecurityErrorResponse(new PublicFormSecurityError("unavailable"));
    }

    const result = await createSchoolReview(input, actor, getRequestOrigin(request));
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof SchoolReviewValidationError) return validationError(error.field);
    if (error instanceof SchoolReviewAuthUnavailableError) return Response.json(GENERIC_ERROR, { status: 503 });
    if (error instanceof SchoolReviewDataError) return Response.json(GENERIC_ERROR, { status: 503 });
    return Response.json(GENERIC_ERROR, { status: 500 });
  }
}
