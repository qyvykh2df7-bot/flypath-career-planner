import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AEROCOMMS_PRO_CATALOG } from "./aerocomms-pro-catalog";
import { isStripeCheckoutUrl } from "./checkout";
import { getStripeClient, resolveStripeAppUrl, toStripeProviderError } from "./stripe";
import { AEROCOMMS_PRO_CHECKOUT_RETURN_PATH } from "@/lib/aerocomms/pro-checkout-return";

export class AeroCommsProCheckoutError extends Error {
  constructor(public readonly kind: "authentication_required" | "catalog" | "persistence" | "provider" | "session" | "intent_conflict") {
    super("AeroComms Pro Checkout could not be created");
    this.name = "AeroCommsProCheckoutError";
  }
}

type PreparedAeroCommsProCheckout = {
  checkoutAttemptId: string;
  orderId: string;
  productPriceId: string;
  stripePriceId: string;
  stripeCheckoutSessionId: string | null;
  checkoutStatus: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asPreparedAeroCommsProCheckout(value: unknown): PreparedAeroCommsProCheckout | null {
  if (!isRecord(value)) return null;
  const required = ["checkout_attempt_id", "order_id", "product_price_id", "stripe_price_id", "checkout_status"] as const;
  if (required.some((field) => typeof value[field] !== "string")) return null;
  if (value.stripe_checkout_session_id !== null && typeof value.stripe_checkout_session_id !== "string") return null;

  return {
    checkoutAttemptId: value.checkout_attempt_id as string,
    orderId: value.order_id as string,
    productPriceId: value.product_price_id as string,
    stripePriceId: value.stripe_price_id as string,
    stripeCheckoutSessionId: value.stripe_checkout_session_id as string | null,
    checkoutStatus: value.checkout_status as string,
  };
}

async function prepareCheckoutAttempt(
  idempotencyKey: string,
  userId: string,
): Promise<PreparedAeroCommsProCheckout> {
  const { data, error } = await getSupabaseAdmin().rpc("prepare_aerocomms_pro_subscription_checkout", {
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
  }).single();

  const prepared = asPreparedAeroCommsProCheckout(data);
  if (error || !prepared) throw new AeroCommsProCheckoutError("catalog");
  return prepared;
}

async function getCheckoutAttemptOwner(attemptId: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .from("checkout_attempts")
    .select("user_id")
    .eq("id", attemptId)
    .maybeSingle();

  if (error || !data || typeof data.user_id !== "string") {
    throw new AeroCommsProCheckoutError("persistence");
  }
  return data.user_id;
}

async function persistStripeSession(attemptId: string, stripeSessionId: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("checkout_attempts")
    .update({ stripe_checkout_session_id: stripeSessionId, status: "session_created", expires_at: null })
    .eq("id", attemptId)
    .or(`stripe_checkout_session_id.is.null,stripe_checkout_session_id.eq.${stripeSessionId}`)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new AeroCommsProCheckoutError("persistence");
}

async function getExistingStripeCheckoutUrl(sessionId: string): Promise<string> {
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.status === "complete" || session.status === "expired") {
      throw new AeroCommsProCheckoutError("intent_conflict");
    }
    if (!isStripeCheckoutUrl(session.url)) throw new AeroCommsProCheckoutError("provider");
    return session.url;
  } catch (error) {
    if (error instanceof AeroCommsProCheckoutError) throw error;
    throw toStripeProviderError(error);
  }
}

/**
 * Starts a hosted Stripe Test subscription Checkout for the validated account.
 * It intentionally creates neither a subscription record nor an entitlement.
 */
export async function createAeroCommsProSubscriptionCheckout(input: {
  idempotencyKey: string;
  requestOrigin: string;
}): Promise<{ url: string }> {
  const sessionState = await getFlyPathSessionState();
  if (sessionState.status === "unavailable") throw new AeroCommsProCheckoutError("session");
  if (sessionState.status !== "authenticated") throw new AeroCommsProCheckoutError("authentication_required");

  const prepared = await prepareCheckoutAttempt(input.idempotencyKey, sessionState.account.id);
  if (await getCheckoutAttemptOwner(prepared.checkoutAttemptId) !== sessionState.account.id) {
    throw new AeroCommsProCheckoutError("intent_conflict");
  }
  if (prepared.stripeCheckoutSessionId) {
    return { url: await getExistingStripeCheckoutUrl(prepared.stripeCheckoutSessionId) };
  }

  let checkoutSession;
  try {
    const appUrl = resolveStripeAppUrl(input.requestOrigin);
    const metadata = {
      flypath_product_key: AEROCOMMS_PRO_CATALOG.productKey,
      flypath_user_id: sessionState.account.id,
      checkout_attempt_id: prepared.checkoutAttemptId,
      order_id: prepared.orderId,
      product_price_id: prepared.productPriceId,
    };
    checkoutSession = await getStripeClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: prepared.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}${AEROCOMMS_PRO_CHECKOUT_RETURN_PATH}?checkout=processing`,
      cancel_url: `${appUrl}/aerocomms/app/paywall?checkout=cancelled`,
      client_reference_id: prepared.checkoutAttemptId,
      metadata,
      subscription_data: { metadata },
    }, { idempotencyKey: prepared.checkoutAttemptId });
  } catch (error) {
    throw toStripeProviderError(error);
  }

  if (!checkoutSession.id || !isStripeCheckoutUrl(checkoutSession.url)) {
    throw new AeroCommsProCheckoutError("provider");
  }

  await persistStripeSession(prepared.checkoutAttemptId, checkoutSession.id);
  return { url: checkoutSession.url };
}
