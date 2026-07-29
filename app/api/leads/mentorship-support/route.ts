import {
  captureMentorshipSupportRequest,
  MentorshipSupportLeadCaptureError,
} from "@/lib/leads/capture-mentorship-support";
import {
  isMentorshipSupportSituation,
} from "@/lib/leads/mentorship-support-consent";
import { normalizeLeadEmail } from "@/lib/leads/normalize-email";
import { isTrackingUuid } from "@/lib/tracking/events";
import {
  getRequestOrigin,
  MENTORSHIP_SUPPORT_REQUEST_MAX_BODY_SIZE,
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

export const runtime = "nodejs";

const INVALID_REQUEST_MESSAGE = "Solicitud inválida.";
const INVALID_NAME_MESSAGE = "Introduce tu nombre.";
const INVALID_EMAIL_MESSAGE = "Introduce un email válido.";
const INVALID_SITUATION_MESSAGE = "Selecciona tu situación actual.";
const INVALID_HELP_MESSAGE = "Cuéntanos en qué necesitas ayuda.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

type MentorshipSupportPayload = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  situation?: unknown;
  helpText?: unknown;
  tracking?: unknown;
  idempotency_key?: unknown;
  honeypot?: unknown;
  form_started_at?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeOptionalPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 415 });
  let body: unknown;

  try {
    body = await readJsonBodyWithinLimit(request, MENTORSHIP_SUPPORT_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const payload = body as MentorshipSupportPayload;
  if (!hasOnlyPublicFormKeys(payload, ["fullName", "email", "phone", "situation", "helpText", "tracking", "idempotency_key", "honeypot", "form_started_at"])) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (typeof payload.fullName !== "string" || !payload.fullName.trim() || payload.fullName.trim().length > 120) {
    return Response.json({ error: INVALID_NAME_MESSAGE }, { status: 400 });
  }

  if (typeof payload.email !== "string") {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
  }

  const normalizedEmail = normalizeLeadEmail(payload.email);
  if (!normalizedEmail) {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
  }

  if (
    typeof payload.situation !== "string" ||
    !isMentorshipSupportSituation(payload.situation)
  ) {
    return Response.json({ error: INVALID_SITUATION_MESSAGE }, { status: 400 });
  }

  if (typeof payload.helpText !== "string" || !payload.helpText.trim() || payload.helpText.trim().length > 3000) {
    return Response.json({ error: INVALID_HELP_MESSAGE }, { status: 400 });
  }

  const phone = normalizeOptionalPhone(payload.phone);
  if (
    payload.phone != null &&
    payload.phone !== "" &&
    typeof payload.phone !== "string"
  ) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }
  if (phone && phone.length > 40) return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });

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
    validatePublicFormProof(request, { honeypot: payload.honeypot, formStartedAt: payload.form_started_at });
    await authorizePublicFormSubmission(request, {
      ipScope: "mentorship_ip",
      identityScope: "mentorship_email",
      identitySubject: `email:${normalizedEmail}`,
    });
  } catch (error) {
    if (error instanceof PublicFormSecurityError) return publicFormSecurityErrorResponse(error);
    return publicFormSecurityErrorResponse(new PublicFormSecurityError("unavailable"));
  }

  try {
    await captureMentorshipSupportRequest(
      {
        fullName: payload.fullName.trim(),
        normalizedEmail,
        phone,
        situation: payload.situation,
        helpText: payload.helpText.trim(),
      },
      payload.idempotency_key,
      trackingContext,
    );
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[FlyPath] Mentorship support lead capture failed:",
        error instanceof MentorshipSupportLeadCaptureError ? error.name : "UnknownError",
      );
    }

    return Response.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
