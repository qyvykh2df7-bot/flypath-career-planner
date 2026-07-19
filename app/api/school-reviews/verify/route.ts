import { verifySchoolReviewEmail, SchoolReviewDataError } from "@/lib/school-reviews/service";
import {
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";
import { isSchoolReviewRateLimited } from "@/lib/school-reviews/rate-limit";

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
  if (isSchoolReviewRateLimited(request, "verify")) return Response.json({ status: "invalid_or_expired" }, { status: 429 });
  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, MAX_BODY_SIZE);
  } catch (error) {
    return Response.json({ status: "invalid_or_expired" }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  const token = getToken(body);
  if (!token) return Response.json({ status: "invalid_or_expired" }, { status: 400 });
  try {
    const status = await verifySchoolReviewEmail(token);
    return Response.json({ status });
  } catch (error) {
    const status = error instanceof SchoolReviewDataError ? 503 : 500;
    return Response.json({ status: "invalid_or_expired" }, { status });
  }
}
