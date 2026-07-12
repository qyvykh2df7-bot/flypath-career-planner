import type { TrackingContext } from "@/lib/tracking/events";
import { trackFormCompleted } from "@/lib/tracking/client";

export type MentorshipSupportFormInput = {
  fullName: string;
  email: string;
  phone?: string;
  situation: string;
  helpText: string;
};

type CaptureMentorshipSupportResult =
  | { ok: true }
  | { ok: false; message: string };

const GENERIC_ERROR_MESSAGE =
  "No se pudo procesar la solicitud. Inténtalo más tarde.";

export async function captureMentorshipSupportLead(
  input: MentorshipSupportFormInput,
  trackingContext: TrackingContext | null,
  idempotencyKey: string,
): Promise<CaptureMentorshipSupportResult> {
  let response: Response;

  try {
    response = await fetch("/api/leads/mentorship-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        idempotency_key: idempotencyKey,
        ...(trackingContext ? { tracking: trackingContext } : {}),
      }),
    });
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }

  if (response.ok) {
    trackFormCompleted("mentorship_support");
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
