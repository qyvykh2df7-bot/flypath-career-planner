import {
  captureCareerPlannerReportDownload,
  CareerPlannerLeadCaptureError,
} from "@/lib/leads/capture-career-planner-report";
import { normalizeLeadEmail } from "@/lib/leads/normalize-email";
import { isTrackingUuid } from "@/lib/tracking/events";
import {
  CAREER_PLANNER_REPORT_REQUEST_MAX_BODY_SIZE,
  getRequestOrigin,
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
const INVALID_EMAIL_MESSAGE = "Introduce un email válido.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

type CareerPlannerReportPayload = {
  email?: unknown;
  downloadType?: unknown;
  marketingConsent?: unknown;
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
    body = await readJsonBodyWithinLimit(request, CAREER_PLANNER_REPORT_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const payload = body as CareerPlannerReportPayload;
  if (!hasOnlyPublicFormKeys(payload, ["email", "downloadType", "marketingConsent", "tracking", "idempotency_key", "honeypot", "form_started_at"])) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (payload.downloadType !== "free_report") {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (typeof payload.marketingConsent !== "boolean") return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });

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
    validatePublicFormProof(request, { honeypot: payload.honeypot, formStartedAt: payload.form_started_at });
    await authorizePublicFormSubmission(request, {
      ipScope: "career_planner_ip",
      identityScope: "career_planner_email",
      identitySubject: `email:${normalizedEmail}`,
    });
  } catch (error) {
    if (error instanceof PublicFormSecurityError) return publicFormSecurityErrorResponse(error);
    return publicFormSecurityErrorResponse(new PublicFormSecurityError("unavailable"));
  }

  try {
    await captureCareerPlannerReportDownload(
      normalizedEmail,
      payload.idempotency_key,
      trackingContext,
      { marketingConsent: payload.marketingConsent, publicOrigin: getRequestOrigin(request) },
    );
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[FlyPath] Career Planner lead capture failed:",
        error instanceof CareerPlannerLeadCaptureError ? error.name : "UnknownError",
      );
    }

    return Response.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
