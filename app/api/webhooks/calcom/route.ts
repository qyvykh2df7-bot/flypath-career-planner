import { NextResponse } from "next/server";

import {
  applyCalcomMentorshipWebhook,
  CalcomWebhookError,
  parseCalcomMentorshipWebhook,
  verifyCalcomWebhookSignature,
} from "@/lib/mentorias/calcom-webhooks";
import { hasJsonContentType, readWebhookBodyWithinLimit, WebhookBodyError } from "@/lib/security/webhook-body";

export const runtime = "nodejs";

const INVALID_WEBHOOK_MESSAGE = "Solicitud de webhook inválida.";
const UNAVAILABLE_WEBHOOK_MESSAGE = "Webhook no disponible.";
const CALCOM_WEBHOOK_MAX_BYTES = 262_144;

export async function POST(request: Request) {
  const signature = request.headers.get("x-cal-signature-256");
  if (!signature) return new NextResponse(INVALID_WEBHOOK_MESSAGE, { status: 400 });
  if (!hasJsonContentType(request)) return new NextResponse(INVALID_WEBHOOK_MESSAGE, { status: 415 });

  let rawPayload: string;
  try {
    rawPayload = await readWebhookBodyWithinLimit(request, CALCOM_WEBHOOK_MAX_BYTES);
  } catch (error) {
    return new NextResponse(
      error instanceof WebhookBodyError && error.kind === "too_large" ? "Payload demasiado grande." : INVALID_WEBHOOK_MESSAGE,
      { status: error instanceof WebhookBodyError && error.kind === "too_large" ? 413 : 400 },
    );
  }

  let event;
  try {
    verifyCalcomWebhookSignature(rawPayload, signature);
    event = parseCalcomMentorshipWebhook(rawPayload);
  } catch (error) {
    if (error instanceof CalcomWebhookError && error.kind === "configuration") {
      return new NextResponse(UNAVAILABLE_WEBHOOK_MESSAGE, { status: 503 });
    }
    return new NextResponse(INVALID_WEBHOOK_MESSAGE, { status: 400 });
  }

  try {
    await applyCalcomMentorshipWebhook(event);
    return NextResponse.json({ received: true });
  } catch {
    // Returning a retryable response prevents a verified event from being lost
    // when the server-only operational projection is temporarily unavailable.
    console.error("[FlyPath] Cal.com webhook processing failed.");
    return new NextResponse(UNAVAILABLE_WEBHOOK_MESSAGE, { status: 503 });
  }
}
