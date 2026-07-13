import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { unsubscribeByOpaqueToken } from "@/lib/email/unsubscribe";
import {
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const UNSUBSCRIBE_REQUEST_MAX_BODY_SIZE = 1_024;
const GENERIC_RESPONSE = { ok: true };

function isTokenPayload(value: unknown): value is { token: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    Object.prototype.hasOwnProperty.call(value, "token")
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await readJsonBodyWithinLimit(request, UNSUBSCRIBE_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json(GENERIC_RESPONSE, { status: 413 });
    }
    return Response.json(GENERIC_RESPONSE, { status: 400 });
  }

  if (!isTokenPayload(body)) return Response.json(GENERIC_RESPONSE);

  try {
    await unsubscribeByOpaqueToken(getSupabaseAdmin(), body.token);
  } catch {
    // La respuesta no revela si un token existe ni ningún dato de suscripción.
    return Response.json(GENERIC_RESPONSE, { status: 503 });
  }

  return Response.json(GENERIC_RESPONSE);
}
