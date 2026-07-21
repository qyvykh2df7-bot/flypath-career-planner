import { NextResponse } from "next/server";
import { StripeWebhookError, processCareerPlannerStripeWebhook, verifyStripeWebhook } from "@/lib/commerce/stripe-webhooks";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Invalid signature", { status: 400 });

  const rawPayload = await request.text();
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
    await processCareerPlannerStripeWebhook(event, rawPayload);
    return NextResponse.json({ received: true });
  } catch {
    // A non-2xx response makes Stripe retry only failures that were not safely
    // recorded as ignored/processed by the transactional RPCs.
    return new NextResponse("Webhook unavailable", { status: 503 });
  }
}

export const runtime = "nodejs";
