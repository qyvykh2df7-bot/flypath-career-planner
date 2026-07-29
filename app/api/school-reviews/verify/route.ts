import { verifySchoolReviewEmail, SchoolReviewDataError } from "@/lib/school-reviews/service";
import {
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

function getToken(value: unknown): string | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).length === 1 && typeof (value as Record<string, unknown>).token === "string"
    ? (value as Record<string, string>).token
    : null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ status: "invalid_or_expired" }, { status: 403 });
  if (!isJsonRequest(request)) return Response.json({ status: "invalid_or_expired" }, { status: 415 });
  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, MAX_BODY_SIZE);
  } catch (error) {
    return Response.json({ status: "invalid_or_expired" }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  const token = getToken(body);
  if (!token) return Response.json({ status: "invalid_or_expired" }, { status: 400 });
  try {
    await authorizePublicFormSubmission(request, {
      ipScope: "school_review_verify_ip",
      identityScope: "school_review_verify_token",
      identitySubject: `token:${token}`,
    });
  } catch (error) {
    const status = error instanceof PublicFormSecurityError && error.kind === "unavailable" ? 503
      : error instanceof PublicFormSecurityError && error.kind === "rate_limited" ? 429 : 400;
    return Response.json({ status: "invalid_or_expired" }, { status });
  }
  try {
    const status = await verifySchoolReviewEmail(token);
    return Response.json({ status });
  } catch (error) {
    const status = error instanceof SchoolReviewDataError ? 503 : 500;
    return Response.json({ status: "invalid_or_expired" }, { status });
  }
}
