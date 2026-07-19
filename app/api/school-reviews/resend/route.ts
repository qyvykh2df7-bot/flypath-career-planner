import { resendSchoolReviewVerification, SchoolReviewDataError } from "@/lib/school-reviews/service";
import {
  getRequestOrigin,
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";
import { isSchoolReviewRateLimited } from "@/lib/school-reviews/rate-limit";

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
  if (isSchoolReviewRateLimited(request, "resend")) return Response.json({ status: "invalid" }, { status: 429 });
  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, MAX_BODY_SIZE);
  } catch (error) {
    return Response.json({ status: "invalid" }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  const payload = parseResendPayload(body);
  if (!payload) return Response.json({ status: "invalid" }, { status: 400 });
  try {
    const status = await resendSchoolReviewVerification({ ...payload, publicOrigin: getRequestOrigin(request) });
    return Response.json({ status });
  } catch (error) {
    return Response.json({ status: "invalid" }, { status: error instanceof SchoolReviewDataError ? 503 : 500 });
  }
}
