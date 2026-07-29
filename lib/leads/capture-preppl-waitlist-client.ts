import type { TrackingContext } from "@/lib/tracking/events";
import { trackFormCompleted } from "@/lib/tracking/client";

type CapturePrepplWaitlistResult =
  | { ok: true }
  | { ok: false; message: string };

const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

export async function capturePrepplWaitlistLead(
  email: string,
  trackingContext: TrackingContext | null,
  idempotencyKey: string,
  formStartedAt?: number,
  honeypot = "",
): Promise<CapturePrepplWaitlistResult> {
  let response: Response;

  try {
    response = await fetch("/api/leads/preppl-waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        idempotency_key: idempotencyKey,
        form_started_at: formStartedAt,
        honeypot,
        ...(trackingContext ? { tracking: trackingContext } : {}),
      }),
    });
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }

  if (response.ok) {
    trackFormCompleted("preppl_waitlist");
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
