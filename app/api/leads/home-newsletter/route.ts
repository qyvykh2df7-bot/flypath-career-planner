import {
  captureHomeNewsletterSubscription,
  HomeNewsletterLeadCaptureError,
} from "@/lib/leads/capture-home-newsletter";
import { normalizeLeadEmail } from "@/lib/leads/normalize-email";
import { isTrackingUuid } from "@/lib/tracking/events";
import {
  getRequestOrigin,
  HOME_NEWSLETTER_REQUEST_MAX_BODY_SIZE,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
  sanitizeTrackingContext,
} from "@/lib/tracking/server";

const INVALID_REQUEST_MESSAGE = "Solicitud inválida.";
const INVALID_EMAIL_MESSAGE = "Introduce un email válido.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la suscripción. Inténtalo más tarde.";

type HomeNewsletterPayload = {
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
    body = await readJsonBodyWithinLimit(request, HOME_NEWSLETTER_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const payload = body as HomeNewsletterPayload;

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

  try {
    await captureHomeNewsletterSubscription(
      normalizedEmail,
      payload.idempotency_key,
      sanitizeTrackingContext(payload.tracking, getRequestOrigin(request)),
    );
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[FlyPath] Home newsletter lead capture failed:",
        error instanceof HomeNewsletterLeadCaptureError ? error.name : "UnknownError",
      );
    }

    return Response.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
