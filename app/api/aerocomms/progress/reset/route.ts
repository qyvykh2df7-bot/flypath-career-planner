import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AEROCOMMS_PROGRESS_SYNC_MAX_BODY_SIZE,
  AeroCommsPersistencePayloadError,
  AeroCommsPersistenceUnavailableError,
  resetAeroCommsProgress,
} from "@/lib/aerocomms/persistence-server";
import {
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";
import { isAeroCommsUuid } from "@/lib/aerocomms/persistence-contract";

export const runtime = "nodejs";

const INVALID_REQUEST_MESSAGE = "No hemos podido restablecer el progreso.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, AEROCOMMS_PROGRESS_SYNC_MAX_BODY_SIZE);
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body) ||
    Object.keys(body).length !== 1 || !isAeroCommsUuid((body as { operationId?: unknown }).operationId)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 401 });
  }

  try {
    const snapshot = await resetAeroCommsProgress(user.id, (body as { operationId: string }).operationId);
    return Response.json({ ok: true, snapshot });
  } catch (error) {
    const status = error instanceof AeroCommsPersistencePayloadError
      ? 400
      : error instanceof AeroCommsPersistenceUnavailableError
        ? 503
        : 503;
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status });
  }
}
