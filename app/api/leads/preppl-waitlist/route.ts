import {
  capturePrepplWaitlistJoin,
  PrepplWaitlistLeadCaptureError,
} from "@/lib/leads/capture-preppl-waitlist";
import { normalizeLeadEmail } from "@/lib/leads/normalize-email";
import { isTrackingUuid } from "@/lib/tracking/events";
import {
  getRequestOrigin,
  PREPPL_WAITLIST_REQUEST_MAX_BODY_SIZE,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
  sanitizeTrackingContext,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const INVALID_REQUEST_MESSAGE = "Solicitud inválida.";
const INVALID_EMAIL_MESSAGE = "Introduce un email válido.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

type PrepplWaitlistPayload = {
  email?: unknown;
  tracking?: unknown;
  idempotency_key?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await readJsonBodyWithinLimit(request, PREPPL_WAITLIST_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const payload = body as PrepplWaitlistPayload;

  if (typeof payload.email !== "string") {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
  }

  const normalizedEmail = normalizeLeadEmail(payload.email);
  if (!normalizedEmail) {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
  }

  if (!isTrackingUuid(payload.idempotency_key)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const trackingContext =
    payload.tracking === undefined
      ? null
      : sanitizeTrackingContext(payload.tracking, getRequestOrigin(request));
  if (payload.tracking !== undefined && !trackingContext) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  try {
    await capturePrepplWaitlistJoin(normalizedEmail, payload.idempotency_key, trackingContext);
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[FlyPath] Pre-PPL waitlist lead capture failed:",
        error instanceof PrepplWaitlistLeadCaptureError ? error.name : "UnknownError",
      );
    }

    return Response.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
