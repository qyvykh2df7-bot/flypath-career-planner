import "server-only";

import { createHash } from "node:crypto";
import Stripe from "stripe";
import { isCommerceUuid } from "./contracts";
import { AEROCOMMS_PRO_CATALOG } from "./aerocomms-pro-catalog";
import { getStripeClient } from "./stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const AEROCOMMS_PRO_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
] as const;

type AeroCommsProEventType = (typeof AEROCOMMS_PRO_EVENT_TYPES)[number];
type ProcessingResult = "processed" | "ignored" | "not_aerocomms";
type SubscriptionAction = "subscription_sync" | "invoice_paid" | "invoice_payment_failed" | "revoke_refund" | "revoke_dispute";

type AeroCommsReferences = {
  checkoutAttemptId: string;
  orderId: string;
  productPriceId: string;
  userId: string;
};

type AeroCommsSubscriptionSnapshot = {
  subscriptionId: string;
  customerId: string;
  status: "incomplete" | "trialing" | "active" | "past_due" | "canceling" | "cancelled" | "unpaid" | "paused";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string;
  references: AeroCommsReferences;
};

export class AeroCommsProWebhookUnavailableError extends Error {
  constructor() {
    super("AeroComms Pro subscription webhook could not be processed");
    this.name = "AeroCommsProWebhookUnavailableError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadHash(rawPayload: string): string {
  return createHash("sha256").update(rawPayload).digest("hex");
}

function occurredAt(event: Stripe.Event): string {
  return new Date(event.created * 1_000).toISOString();
}

function objectId(value: unknown): string | null {
  return isRecord(value) && typeof value.id === "string" ? value.id : null;
}

function resourceId(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return objectId(value);
}

function integerTimestampToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return null;
  const date = new Date(value * 1_000);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function asReferences(value: unknown): AeroCommsReferences | null {
  if (!isRecord(value) || value.flypath_product_key !== AEROCOMMS_PRO_CATALOG.productKey) return null;
  const checkoutAttemptId = value.checkout_attempt_id;
  const orderId = value.order_id;
  const productPriceId = value.product_price_id;
  const userId = value.flypath_user_id;
  if (
    !isCommerceUuid(checkoutAttemptId)
    || !isCommerceUuid(orderId)
    || !isCommerceUuid(productPriceId)
    || !isCommerceUuid(userId)
  ) return null;
  return { checkoutAttemptId, orderId, productPriceId, userId };
}

function normalizeSubscriptionStatus(value: unknown): AeroCommsSubscriptionSnapshot["status"] | null {
  if (value === "canceled" || value === "incomplete_expired") return "cancelled";
  return value === "incomplete"
    || value === "trialing"
    || value === "active"
    || value === "past_due"
    || value === "unpaid"
    || value === "paused"
    ? value
    : null;
}

function asSubscriptionSnapshot(value: unknown): AeroCommsSubscriptionSnapshot | null {
  if (!isRecord(value)) return null;
  const subscriptionId = objectId(value);
  const customerId = resourceId(value.customer);
  const rawStatus = normalizeSubscriptionStatus(value.status);
  const references = asReferences(value.metadata);
  const items = isRecord(value.items) && Array.isArray(value.items.data) ? value.items.data : null;
  if (!subscriptionId || !customerId || !rawStatus || !references || !items || items.length !== 1 || !isRecord(items[0])) return null;

  const item = items[0];
  const stripePriceId = resourceId(item.price);
  const currentPeriodStart = integerTimestampToIso(item.current_period_start);
  const currentPeriodEnd = integerTimestampToIso(item.current_period_end);
  if (!stripePriceId || stripePriceId !== AEROCOMMS_PRO_CATALOG.stripePriceId || !currentPeriodEnd) return null;

  return {
    subscriptionId,
    customerId,
    status: rawStatus === "active" && value.cancel_at_period_end === true ? "canceling" : rawStatus,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: value.cancel_at_period_end === true,
    stripePriceId,
    references,
  };
}

function asInvoiceSubscriptionId(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const parent = isRecord(value.parent) ? value.parent : null;
  const subscriptionDetails = parent && isRecord(parent.subscription_details) ? parent.subscription_details : null;
  return resourceId(subscriptionDetails?.subscription ?? value.subscription);
}

function isSupportedAeroCommsEvent(event: Stripe.Event): event is Stripe.Event & { type: AeroCommsProEventType } {
  return (AEROCOMMS_PRO_EVENT_TYPES as readonly string[]).includes(event.type);
}

async function recordIgnored(event: Stripe.Event, rawPayload: string, code: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("record_career_planner_stripe_webhook_ignored", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: objectId(event.data.object),
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_error_code: code,
  });
  if (error) throw new AeroCommsProWebhookUnavailableError();
}

async function applySnapshot(
  event: Stripe.Event,
  rawPayload: string,
  snapshot: AeroCommsSubscriptionSnapshot,
  action: SubscriptionAction,
  stripeObjectId: string,
  amount: number | null = null,
  currency: string | null = null,
): Promise<"processed" | "ignored"> {
  const { data, error } = await getSupabaseAdmin().rpc("apply_aerocomms_pro_subscription_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_payload_hash: payloadHash(rawPayload),
    p_provider_created_at: occurredAt(event),
    p_stripe_object_id: stripeObjectId,
    p_action: action,
    p_stripe_subscription_id: snapshot.subscriptionId,
    p_stripe_customer_id: snapshot.customerId,
    p_checkout_attempt_id: action === "subscription_sync" ? snapshot.references.checkoutAttemptId : null,
    p_order_id: action === "subscription_sync" ? snapshot.references.orderId : null,
    p_user_id: action === "subscription_sync" ? snapshot.references.userId : null,
    p_product_price_id: action === "subscription_sync" ? snapshot.references.productPriceId : null,
    // Invoice and charge events are linked to the current Subscription fetched
    // from Stripe. The RPC uses this to prevent an old invoice from reviving a
    // subscription Stripe has already ended or revoked.
    p_subscription_status: snapshot.status,
    p_current_period_start: snapshot.currentPeriodStart,
    p_current_period_end: snapshot.currentPeriodEnd,
    p_cancel_at_period_end: snapshot.cancelAtPeriodEnd,
    p_amount: amount,
    p_currency: currency,
  });

  if (error || (data !== "processed" && data !== "ignored" && data !== "duplicate")) {
    throw new AeroCommsProWebhookUnavailableError();
  }
  return data === "ignored" ? "ignored" : "processed";
}

async function retrieveSubscription(subscriptionId: string): Promise<AeroCommsSubscriptionSnapshot | null> {
  try {
    return asSubscriptionSnapshot(await getStripeClient().subscriptions.retrieve(subscriptionId));
  } catch {
    throw new AeroCommsProWebhookUnavailableError();
  }
}

async function processCheckoutCompleted(event: Stripe.Event, rawPayload: string): Promise<ProcessingResult> {
  const sessionId = objectId(event.data.object);
  if (!sessionId) return "not_aerocomms";

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripeClient().checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price"] });
  } catch {
    throw new AeroCommsProWebhookUnavailableError();
  }

  const sessionMetadata = asReferences(session.metadata);
  if (!sessionMetadata) return "not_aerocomms";
  const subscriptionId = resourceId(session.subscription);
  const lineItems = session.line_items?.data;
  const stripePriceId = lineItems?.length === 1 ? resourceId(lineItems[0]?.price) : null;
  const snapshot = subscriptionId ? await retrieveSubscription(subscriptionId) : null;
  if (
    session.mode !== "subscription"
    || session.status !== "complete"
    || session.payment_status !== "paid"
    || !subscriptionId
    || !snapshot
    || stripePriceId !== AEROCOMMS_PRO_CATALOG.stripePriceId
    || snapshot.references.checkoutAttemptId !== sessionMetadata.checkoutAttemptId
    || snapshot.references.orderId !== sessionMetadata.orderId
    || snapshot.references.productPriceId !== sessionMetadata.productPriceId
    || snapshot.references.userId !== sessionMetadata.userId
    || session.client_reference_id !== snapshot.references.checkoutAttemptId
  ) {
    await recordIgnored(event, rawPayload, "subscription_checkout_validation_failed");
    return "ignored";
  }
  return applySnapshot(event, rawPayload, snapshot, "subscription_sync", session.id);
}

async function processSubscriptionEvent(event: Stripe.Event, rawPayload: string): Promise<ProcessingResult> {
  const snapshot = asSubscriptionSnapshot(event.data.object);
  if (!snapshot) {
    const metadata = isRecord(event.data.object) ? event.data.object.metadata : null;
    if (!asReferences(metadata)) return "not_aerocomms";
    await recordIgnored(event, rawPayload, "subscription_validation_failed");
    return "ignored";
  }
  return applySnapshot(event, rawPayload, snapshot, "subscription_sync", snapshot.subscriptionId);
}

async function processInvoiceEvent(event: Stripe.Event, rawPayload: string, action: "invoice_paid" | "invoice_payment_failed"): Promise<ProcessingResult> {
  const invoice = event.data.object;
  const invoiceId = objectId(invoice);
  const subscriptionId = asInvoiceSubscriptionId(invoice);
  if (!invoiceId || !subscriptionId) return "not_aerocomms";

  const snapshot = await retrieveSubscription(subscriptionId);
  if (!snapshot) return "not_aerocomms";
  const invoiceData: Record<string, unknown> = isRecord(invoice) ? invoice : {};
  const amount = action === "invoice_paid" ? invoiceData.amount_paid : invoiceData.amount_due;
  const currency = invoiceData.currency;
  if (typeof amount !== "number" || !Number.isInteger(amount) || typeof currency !== "string") {
    await recordIgnored(event, rawPayload, "invoice_validation_failed");
    return "ignored";
  }
  return applySnapshot(event, rawPayload, snapshot, action, invoiceId, amount, currency);
}

async function processChargeEvent(event: Stripe.Event, rawPayload: string, action: "revoke_refund" | "revoke_dispute"): Promise<ProcessingResult> {
  const charge = event.data.object;
  const chargeId = objectId(charge);
  const invoiceId = isRecord(charge) ? resourceId(charge.invoice) : null;
  if (!chargeId || !invoiceId) return "not_aerocomms";

  let invoice: Stripe.Invoice;
  try {
    invoice = await getStripeClient().invoices.retrieve(invoiceId);
  } catch {
    throw new AeroCommsProWebhookUnavailableError();
  }
  const subscriptionId = asInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return "not_aerocomms";
  const snapshot = await retrieveSubscription(subscriptionId);
  if (!snapshot) return "not_aerocomms";
  return applySnapshot(event, rawPayload, snapshot, action, chargeId);
}

/**
 * Handles only the closed AeroComms Pro subscription event set. A return value
 * of `not_aerocomms` lets the shared Stripe boundary continue with digital
 * product handling or safely record an unrelated supported event as ignored.
 */
export async function processAeroCommsProStripeWebhook(event: Stripe.Event, rawPayload: string): Promise<ProcessingResult> {
  if (!isSupportedAeroCommsEvent(event)) return "not_aerocomms";
  if (event.type === "checkout.session.completed") return processCheckoutCompleted(event, rawPayload);
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    return processSubscriptionEvent(event, rawPayload);
  }
  if (event.type === "invoice.paid") return processInvoiceEvent(event, rawPayload, "invoice_paid");
  if (event.type === "invoice.payment_failed") return processInvoiceEvent(event, rawPayload, "invoice_payment_failed");
  if (event.type === "charge.refunded") return processChargeEvent(event, rawPayload, "revoke_refund");
  return processChargeEvent(event, rawPayload, "revoke_dispute");
}
