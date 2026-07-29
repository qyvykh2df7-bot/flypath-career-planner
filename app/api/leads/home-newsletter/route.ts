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
import {
  authorizePublicFormSubmission,
  hasOnlyPublicFormKeys,
  isJsonRequest,
  PublicFormSecurityError,
  publicFormSecurityErrorResponse,
  validatePublicFormProof,
} from "@/lib/security/public-form-security";

const INVALID_REQUEST_MESSAGE = "Solicitud inválida.";
const INVALID_EMAIL_MESSAGE = "Introduce un email válido.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la suscripción. Inténtalo más tarde.";

type HomeNewsletterPayload = {
  email?: unknown;
  tracking?: unknown;
  idempotency_key?: unknown;
  honeypot?: unknown;
  form_started_at?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 415 });
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
  if (!hasOnlyPublicFormKeys(payload, ["email", "tracking", "idempotency_key", "honeypot", "form_started_at"])) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

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
    validatePublicFormProof(request, { honeypot: payload.honeypot, formStartedAt: payload.form_started_at });
    await authorizePublicFormSubmission(request, {
      ipScope: "newsletter_ip",
      identityScope: "newsletter_email",
      identitySubject: `email:${normalizedEmail}`,
    });
  } catch (error) {
    if (error instanceof PublicFormSecurityError) return publicFormSecurityErrorResponse(error);
    return publicFormSecurityErrorResponse(new PublicFormSecurityError("unavailable"));
  }

  try {
    await captureHomeNewsletterSubscription(
      normalizedEmail,
      payload.idempotency_key,
      sanitizeTrackingContext(payload.tracking, getRequestOrigin(request)),
      getRequestOrigin(request),
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
