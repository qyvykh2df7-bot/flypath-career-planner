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
import { isSchoolReviewRateLimited } from "@/lib/school-reviews/rate-limit";

export const runtime = "nodejs";

const GENERIC_ERROR = { error: "No hemos podido registrar tu opinión. Inténtalo de nuevo." };

async function getReviewActor(): Promise<SchoolReviewActor> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) return { kind: "anonymous" };
  return { kind: "authenticated", userId: user.id, email: user.email };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json(GENERIC_ERROR, { status: 403 });
  if (isSchoolReviewRateLimited(request, "create")) return Response.json(GENERIC_ERROR, { status: 429 });

  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, SCHOOL_REVIEW_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    return Response.json(GENERIC_ERROR, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }

  try {
    const input = parseSchoolReviewSubmission(body);
    const actor = await getReviewActor();
    if (actor.kind === "authenticated" && input.email !== undefined) {
      return Response.json(GENERIC_ERROR, { status: 400 });
    }
    if (actor.kind === "anonymous" && !input.email) return Response.json(GENERIC_ERROR, { status: 400 });

    const result = await createSchoolReview(input, actor, getRequestOrigin(request));
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof SchoolReviewValidationError) return Response.json(GENERIC_ERROR, { status: 400 });
    if (error instanceof SchoolReviewDataError) return Response.json(GENERIC_ERROR, { status: 503 });
    return Response.json(GENERIC_ERROR, { status: 500 });
  }
}
