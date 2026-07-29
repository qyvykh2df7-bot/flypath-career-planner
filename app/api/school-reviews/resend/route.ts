import { resendSchoolReviewVerification, SchoolReviewDataError } from "@/lib/school-reviews/service";
import {
  getRequestOrigin,
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";
import {
  authorizePublicFormSubmission,
  isJsonRequest,
  PublicFormSecurityError,
} from "@/lib/security/public-form-security";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 1_024;

function parseResendPayload(value: unknown): { reviewId: string; email: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 2 || typeof body.reviewId !== "string" || typeof body.email !== "string") return null;
  return { reviewId: body.reviewId, email: body.email };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ status: "invalid" }, { status: 403 });
  if (!isJsonRequest(request)) return Response.json({ status: "invalid" }, { status: 415 });
  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, MAX_BODY_SIZE);
  } catch (error) {
    return Response.json({ status: "invalid" }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  const payload = parseResendPayload(body);
  if (!payload) return Response.json({ status: "invalid" }, { status: 400 });
  try {
    await authorizePublicFormSubmission(request, {
      ipScope: "school_review_resend_ip",
      identityScope: "school_review_identity",
      identitySubject: `review:${payload.reviewId}:email:${payload.email.trim().toLowerCase()}`,
    });
  } catch (error) {
    const status = error instanceof PublicFormSecurityError && error.kind === "unavailable" ? 503
      : error instanceof PublicFormSecurityError && error.kind === "rate_limited" ? 429 : 400;
    return Response.json({ status: "invalid" }, { status });
  }
  try {
    const status = await resendSchoolReviewVerification({ ...payload, publicOrigin: getRequestOrigin(request) });
    return Response.json({ status });
  } catch (error) {
    return Response.json({ status: "invalid" }, { status: error instanceof SchoolReviewDataError ? 503 : 500 });
  }
}
