import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AEROCOMMS_PROGRESS_SYNC_MAX_BODY_SIZE,
  AeroCommsPersistencePayloadError,
  AeroCommsPersistenceUnavailableError,
  persistAeroCommsProgress,
} from "@/lib/aerocomms/persistence-server";
import {
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
  TrackingPayloadError,
  isSameOriginRequest,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const INVALID_REQUEST_MESSAGE = "No hemos podido sincronizar el progreso.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, AEROCOMMS_PROGRESS_SYNC_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 401 });
  }

  try {
    const snapshot = await persistAeroCommsProgress(user.id, body);
    return Response.json({ ok: true, snapshot }, { status: 200 });
  } catch (error) {
    if (error instanceof AeroCommsPersistencePayloadError || error instanceof TrackingPayloadError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
    }
    if (error instanceof AeroCommsPersistenceUnavailableError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 503 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 503 });
  }
}
