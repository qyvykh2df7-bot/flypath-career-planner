import {
  captureCareerPlannerReportDownload,
  CareerPlannerLeadCaptureError,
} from "@/lib/leads/capture-career-planner-report";
import { CAREER_PLANNER_MARKETING_CONSENT_REQUIRED_MESSAGE } from "@/lib/leads/career-planner-consent";
import { normalizeLeadEmail } from "@/lib/leads/normalize-email";

const INVALID_REQUEST_MESSAGE = "Solicitud inválida.";
const INVALID_EMAIL_MESSAGE = "Introduce un email válido.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

type CareerPlannerReportPayload = {
  email?: unknown;
  downloadType?: unknown;
  marketingConsent?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  const payload = body as CareerPlannerReportPayload;

  if (payload.downloadType !== "free_report") {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  if (payload.marketingConsent !== true) {
    return Response.json(
      { error: CAREER_PLANNER_MARKETING_CONSENT_REQUIRED_MESSAGE },
      { status: 400 },
    );
  }

  if (typeof payload.email !== "string") {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
  }

  const normalizedEmail = normalizeLeadEmail(payload.email);
  if (!normalizedEmail) {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
  }

  try {
    await captureCareerPlannerReportDownload(normalizedEmail);
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
