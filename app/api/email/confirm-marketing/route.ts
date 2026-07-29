import { confirmMarketingSubscription } from "@/lib/leads/marketing-confirmation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { readJsonBodyWithinLimit, RequestBodyTooLargeError } from "@/lib/tracking/server";
import { isJsonRequest } from "@/lib/security/public-form-security";

export const runtime = "nodejs";

const RESPONSE = { ok: true };

function isTokenPayload(value: unknown): value is { token: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).length === 1 && Object.hasOwn(value, "token");
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) return Response.json(RESPONSE, { status: 415 });
  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, 1024);
  } catch (error) {
    return Response.json(RESPONSE, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  if (!isTokenPayload(body)) return Response.json(RESPONSE, { status: 400 });
  try {
    await confirmMarketingSubscription(getSupabaseAdmin(), body.token);
  } catch {
    // The response intentionally never reveals whether an email/token exists.
    return Response.json(RESPONSE, { status: 503 });
  }
  return Response.json(RESPONSE);
}
