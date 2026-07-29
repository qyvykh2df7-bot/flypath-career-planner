import { NextResponse } from "next/server";
import { StripeWebhookError, processStripeWebhook, verifyStripeWebhook } from "@/lib/commerce/stripe-webhooks";
import { hasJsonContentType, readWebhookBodyWithinLimit, WebhookBodyError } from "@/lib/security/webhook-body";

const STRIPE_WEBHOOK_MAX_BYTES = 1_048_576;

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Invalid signature", { status: 400 });
  if (!hasJsonContentType(request)) return new NextResponse("Invalid content type", { status: 415 });

  let rawPayload: string;
  try {
    rawPayload = await readWebhookBodyWithinLimit(request, STRIPE_WEBHOOK_MAX_BYTES);
  } catch (error) {
    return new NextResponse(error instanceof WebhookBodyError && error.kind === "too_large" ? "Payload too large" : "Invalid payload", {
      status: error instanceof WebhookBodyError && error.kind === "too_large" ? 413 : 400,
    });
  }
  let event;
  try {
    event = verifyStripeWebhook(rawPayload, signature);
  } catch (error) {
    if (error instanceof StripeWebhookError && error.kind === "signature") {
      return new NextResponse("Invalid signature", { status: 400 });
    }
    return new NextResponse("Webhook unavailable", { status: 503 });
  }

  try {
    await processStripeWebhook(event, rawPayload);
    return NextResponse.json({ received: true });
  } catch {
    // A non-2xx response makes Stripe retry only failures that were not safely
    // recorded as ignored/processed by the transactional RPCs.
    return new NextResponse("Webhook unavailable", { status: 503 });
  }
}

export const runtime = "nodejs";
