import "server-only";

import { createHash } from "node:crypto";
import Stripe from "stripe";
import { isCommerceUuid } from "./contracts";
import { getStripeClient, StripeConfigurationError } from "./stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const CAREER_PLANNER_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
] as const;

type CareerPlannerStripeEventType = (typeof CAREER_PLANNER_STRIPE_EVENTS)[number];

export class StripeWebhookError extends Error {
  constructor(public readonly kind: "configuration" | "signature" | "unavailable") {
    super("Stripe webhook could not be processed");
    this.name = "StripeWebhookError";
  }
}

type StripeWebhookEnvironment = {
  STRIPE_WEBHOOK_SECRET?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedStripeWebhookEvent(value: string): value is CareerPlannerStripeEventType {
  return (CAREER_PLANNER_STRIPE_EVENTS as readonly string[]).includes(value);
}

function getWebhookSecret(environment: StripeWebhookEnvironment = process.env as StripeWebhookEnvironment): string {
  const secret = environment.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !secret.startsWith("whsec_")) throw new StripeWebhookError("configuration");
  return secret;
}

function payloadHash(rawPayload: string): string {
  return createHash("sha256").update(rawPayload).digest("hex");
}

function occurredAt(event: Stripe.Event): string {
  return new Date(event.created * 1_000).toISOString();
}

function stringMetadata(metadata: Stripe.Metadata | null | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stripeObjectId(value: unknown): string | null {
  return isRecord(value) && typeof value.id === "string" ? value.id : null;
}

function asCheckoutReferences(session: Stripe.Checkout.Session): {
  checkoutAttemptId: string;
  orderId: string;
  productPriceId: string;
} | null {
  const checkoutAttemptId = stringMetadata(session.metadata, "checkout_attempt_id");
  const orderId = stringMetadata(session.metadata, "order_id");
  const productPriceId = stringMetadata(session.metadata, "product_price_id");
  if (
    !isCommerceUuid(checkoutAttemptId) ||
    !isCommerceUuid(orderId) ||
    !isCommerceUuid(productPriceId) ||
    session.client_reference_id !== checkoutAttemptId
  ) {
    return null;
  }
  return { checkoutAttemptId, orderId, productPriceId };
}

function asPaymentReferences(intent: Stripe.PaymentIntent): {
  checkoutAttemptId: string;
  orderId: string;
} | null {
  const checkoutAttemptId = stringMetadata(intent.metadata, "checkout_attempt_id");
  const orderId = stringMetadata(intent.metadata, "order_id");
  if (!isCommerceUuid(checkoutAttemptId) || !isCommerceUuid(orderId)) return null;
  return { checkoutAttemptId, orderId };
}

function getLineItemPriceId(session: Stripe.Checkout.Session): string | null {
  const lines = session.line_items?.data;
  if (!lines || lines.length !== 1) return null;
  const price = lines[0]?.price;
  if (typeof price === "string") return price;
  return typeof price?.id === "string" ? price.id : null;
}

async function recordIgnoredEvent(event: Stripe.Event, rawPayload: string, code: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("record_career_planner_stripe_webhook_ignored", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: stripeObjectId(event.data.object),
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_error_code: code,
  });
  if (error) throw new StripeWebhookError("unavailable");
}

async function processCompletedEvent(event: Stripe.Event, rawPayload: string): Promise<void> {
  const sessionId = stripeObjectId(event.data.object);
  if (typeof sessionId !== "string") {
    await recordIgnoredEvent(event, rawPayload, "checkout_validation_failed");
    return;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripeClient().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });
  } catch {
    throw new StripeWebhookError("unavailable");
  }

  const references = asCheckoutReferences(session);
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const stripePriceId = getLineItemPriceId(session);
  if (
    !references ||
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.amount_total !== 595 ||
    session.currency !== "eur" ||
    !paymentIntentId ||
    !stripePriceId
  ) {
    await recordIgnoredEvent(event, rawPayload, "checkout_validation_failed");
    return;
  }

  const { error } = await getSupabaseAdmin().rpc("process_career_planner_checkout_completed", {
    p_event_id: event.id,
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId,
    p_checkout_attempt_id: references.checkoutAttemptId,
    p_order_id: references.orderId,
    p_product_price_id: references.productPriceId,
    p_stripe_price_id: stripePriceId,
    p_amount: session.amount_total,
    p_currency: session.currency,
  });
  if (error) throw new StripeWebhookError("unavailable");
}

async function processExpiredEvent(event: Stripe.Event, rawPayload: string): Promise<void> {
  const sessionId = stripeObjectId(event.data.object);
  if (typeof sessionId !== "string") {
    await recordIgnoredEvent(event, rawPayload, "checkout_not_found");
    return;
  }
  const { error } = await getSupabaseAdmin().rpc("process_career_planner_checkout_expired", {
    p_event_id: event.id,
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_stripe_session_id: sessionId,
  });
  if (error) throw new StripeWebhookError("unavailable");
}

async function processFailedPaymentEvent(event: Stripe.Event, rawPayload: string): Promise<void> {
  const intent = event.data.object as Stripe.PaymentIntent;
  const references = asPaymentReferences(intent);
  if (!references || typeof intent.id !== "string" || intent.amount !== 595 || intent.currency !== "eur") {
    await recordIgnoredEvent(event, rawPayload, "payment_failure_unlinked");
    return;
  }
  const { error } = await getSupabaseAdmin().rpc("process_career_planner_payment_failed", {
    p_event_id: event.id,
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_stripe_payment_intent_id: intent.id,
    p_checkout_attempt_id: references.checkoutAttemptId,
    p_order_id: references.orderId,
    p_amount: intent.amount,
    p_currency: intent.currency,
  });
  if (error) throw new StripeWebhookError("unavailable");
}

export function verifyStripeWebhook(rawPayload: string, signature: string): Stripe.Event {
  try {
    return getStripeClient().webhooks.constructEvent(rawPayload, signature, getWebhookSecret());
  } catch (error) {
    if (error instanceof StripeConfigurationError) throw new StripeWebhookError("configuration");
    throw new StripeWebhookError("signature");
  }
}

export async function processCareerPlannerStripeWebhook(event: Stripe.Event, rawPayload: string): Promise<"processed" | "ignored"> {
  if (!isSupportedStripeWebhookEvent(event.type)) return "ignored";

  if (event.type === "checkout.session.completed") {
    await processCompletedEvent(event, rawPayload);
    return "processed";
  }
  if (event.type === "checkout.session.expired") {
    await processExpiredEvent(event, rawPayload);
    return "processed";
  }
  if (event.type === "payment_intent.payment_failed") {
    await processFailedPaymentEvent(event, rawPayload);
    return "processed";
  }

  // The Checkout completion event is the single commercial source of truth.
  // PaymentIntent success is retained only as a deduplicated audit event.
  await recordIgnoredEvent(event, rawPayload, "redundant_payment_intent_succeeded");
  return "ignored";
}
