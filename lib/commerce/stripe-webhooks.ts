import "server-only";

import { createHash } from "node:crypto";
import Stripe from "stripe";
import { isCommerceUuid } from "./contracts";
import { COMO_SER_PILOTO_GUIDE_UNIT_AMOUNT, PRE_PPL_GUIDE_UNIT_AMOUNT } from "./checkout";
import { getStripeClient, getStripeConfiguration, StripeConfigurationError } from "./stripe";
import {
  AeroCommsProWebhookUnavailableError,
  processAeroCommsProStripeWebhook,
} from "./aerocomms-pro-stripe-webhooks";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { recordAndQueuePrePplPurchaseEmail } from "./pre-ppl-guide-purchase-email";

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

function getCheckoutPurchaserEmail(session: Stripe.Checkout.Session): string | null {
  const email = session.customer_details?.email ?? session.customer_email;
  return typeof email === "string" && email.trim() ? email : null;
}

type OneTimeCheckoutProduct = "career_planner" | "como_ser_piloto_guide" | "preppl_guide";

function getOneTimeCheckoutProduct(metadata: Stripe.Metadata | null | undefined): OneTimeCheckoutProduct | null {
  const product = stringMetadata(metadata, "flypath_checkout_product");
  if (product === "como_ser_piloto_guide" || product === "preppl_guide") return product;
  // Career Planner predates the shared product marker. Its internal references
  // are still required and the database boundary validates the closed catalog.
  return product === null ? "career_planner" : null;
}

function getExpectedOneTimeAmount(product: OneTimeCheckoutProduct): number {
  if (product === "como_ser_piloto_guide") return COMO_SER_PILOTO_GUIDE_UNIT_AMOUNT;
  if (product === "preppl_guide") return PRE_PPL_GUIDE_UNIT_AMOUNT;
  return 595;
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
  const product = getOneTimeCheckoutProduct(session.metadata);
  const expectedAmount = product ? getExpectedOneTimeAmount(product) : null;
  if (
    !references ||
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.amount_total !== expectedAmount ||
    session.currency !== "eur" ||
    !paymentIntentId ||
    !stripePriceId
  ) {
    await recordIgnoredEvent(event, rawPayload, "checkout_validation_failed");
    return;
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.rpc("settle_stripe_catalog_checkout_v2", {
    p_event_id: event.id,
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_stripe_mode: getStripeConfiguration().mode,
    p_product_key: product,
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

  if (product === "preppl_guide") {
    const purchaserEmail = getCheckoutPurchaserEmail(session);
    if (!purchaserEmail) throw new StripeWebhookError("unavailable");
    const deliveryResult = await recordAndQueuePrePplPurchaseEmail(admin, {
      stripeMode: getStripeConfiguration().mode,
      stripeSessionId: session.id,
      checkoutAttemptId: references.checkoutAttemptId,
      orderId: references.orderId,
      purchaserEmail,
    });
    // The purchase is already settled. Returning a retryable webhook failure
    // only retries the idempotent delivery job; it never rolls back payment.
    if (deliveryResult === "pending") throw new StripeWebhookError("unavailable");
  }
}

async function processExpiredEvent(event: Stripe.Event, rawPayload: string): Promise<void> {
  const sessionId = stripeObjectId(event.data.object);
  if (typeof sessionId !== "string") {
    await recordIgnoredEvent(event, rawPayload, "checkout_not_found");
    return;
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const product = getOneTimeCheckoutProduct(session.metadata);
  const rpcName = product === "como_ser_piloto_guide"
    ? "process_como_ser_piloto_guide_checkout_expired"
    : product === "preppl_guide"
      ? "process_preppl_guide_checkout_expired"
      : product === "career_planner"
        ? "process_career_planner_checkout_expired"
        : null;
  if (!rpcName) {
    await recordIgnoredEvent(event, rawPayload, "checkout_validation_failed");
    return;
  }
  const { error } = await getSupabaseAdmin().rpc(rpcName, {
    p_event_id: event.id,
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_stripe_session_id: sessionId,
    ...(product === "preppl_guide" ? { p_stripe_mode: getStripeConfiguration().mode } : {}),
  });
  if (error) throw new StripeWebhookError("unavailable");
}

async function processFailedPaymentEvent(event: Stripe.Event, rawPayload: string): Promise<void> {
  const intent = event.data.object as Stripe.PaymentIntent;
  const references = asPaymentReferences(intent);
  const product = getOneTimeCheckoutProduct(intent.metadata);
  const expectedAmount = product ? getExpectedOneTimeAmount(product) : null;
  if (!references || typeof intent.id !== "string" || intent.amount !== expectedAmount || intent.currency !== "eur") {
    await recordIgnoredEvent(event, rawPayload, "payment_failure_unlinked");
    return;
  }
  const { error } = await getSupabaseAdmin().rpc(
    product === "como_ser_piloto_guide"
      ? "process_como_ser_piloto_guide_payment_failed"
      : product === "preppl_guide"
        ? "process_preppl_guide_payment_failed"
        : "process_career_planner_payment_failed",
    {
      p_event_id: event.id,
      p_payload_hash: payloadHash(rawPayload),
      p_provider_created_at: occurredAt(event),
      p_stripe_payment_intent_id: intent.id,
      p_checkout_attempt_id: references.checkoutAttemptId,
      p_order_id: references.orderId,
      p_amount: intent.amount,
      p_currency: intent.currency,
      ...(product === "preppl_guide" ? { p_stripe_mode: getStripeConfiguration().mode } : {}),
    },
  );
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

/** Shared signed webhook dispatcher for all enabled FlyPath Stripe products. */
export async function processStripeWebhook(event: Stripe.Event, rawPayload: string): Promise<"processed" | "ignored"> {
  try {
    const aeroCommsResult = await processAeroCommsProStripeWebhook(event, rawPayload);
    if (aeroCommsResult !== "not_aerocomms") return aeroCommsResult;
  } catch (error) {
    if (error instanceof AeroCommsProWebhookUnavailableError) throw new StripeWebhookError("unavailable");
    throw error;
  }

  if (
    event.type === "customer.subscription.created"
    || event.type === "customer.subscription.updated"
    || event.type === "customer.subscription.deleted"
    || event.type === "invoice.paid"
    || event.type === "invoice.payment_failed"
    || event.type === "charge.refunded"
    || event.type === "charge.dispute.created"
  ) {
    await recordIgnoredEvent(event, rawPayload, "unlinked_subscription_event");
    return "ignored";
  }

  return processCareerPlannerStripeWebhook(event, rawPayload);
}
