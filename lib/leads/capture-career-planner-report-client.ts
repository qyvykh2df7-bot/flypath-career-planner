import { CAREER_PLANNER_MARKETING_CONSENT_REQUIRED_MESSAGE } from "@/lib/leads/career-planner-consent";
import type { TrackingContext } from "@/lib/tracking/events";
import { trackFormCompleted } from "@/lib/tracking/client";

type CaptureCareerPlannerReportResult =
  | { ok: true }
  | { ok: false; message: string };

const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

export async function captureCareerPlannerReportLead(
  email: string,
  marketingConsent: boolean,
  trackingContext: TrackingContext | null,
  idempotencyKey: string,
): Promise<CaptureCareerPlannerReportResult> {
  let response: Response;

  try {
    response = await fetch("/api/leads/career-planner-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        downloadType: "free_report",
        marketingConsent,
        idempotency_key: idempotencyKey,
        ...(trackingContext ? { tracking: trackingContext } : {}),
      }),
    });
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }

  if (response.ok) {
    trackFormCompleted("career_planner_report");
    return { ok: true };
  }

  let message = GENERIC_ERROR_MESSAGE;

  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      message = body.error;
    }
  } catch {
    // Mantener mensaje genérico si la respuesta no es JSON.
  }

  return { ok: false, message };
}
