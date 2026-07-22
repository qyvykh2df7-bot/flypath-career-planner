import { NextResponse } from "next/server";

import {
  applyCalcomMentorshipWebhook,
  CalcomWebhookError,
  parseCalcomMentorshipWebhook,
  verifyCalcomWebhookSignature,
} from "@/lib/mentorias/calcom-webhooks";

export const runtime = "nodejs";

const INVALID_WEBHOOK_MESSAGE = "Solicitud de webhook inválida.";
const UNAVAILABLE_WEBHOOK_MESSAGE = "Webhook no disponible.";

export async function POST(request: Request) {
  const signature = request.headers.get("x-cal-signature-256");
  if (!signature) return new NextResponse(INVALID_WEBHOOK_MESSAGE, { status: 400 });

  let rawPayload: string;
  try {
    rawPayload = await request.text();
  } catch {
    return new NextResponse(INVALID_WEBHOOK_MESSAGE, { status: 400 });
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
