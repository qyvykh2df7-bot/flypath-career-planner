import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  isStripeCheckoutUrl,
  PRE_PPL_GUIDE_CURRENCY,
  PRE_PPL_GUIDE_PRICE_KEY,
  PRE_PPL_GUIDE_UNIT_AMOUNT,
} from "./checkout";
import { CommerceCheckoutError } from "./career-planner-checkout";
import { getStripeCatalogBinding } from "./stripe-catalog";
import { getStripeClient, getStripeConfiguration, resolveStripeAppUrl, toStripeProviderError } from "./stripe";

type PreparedPrePplCheckoutAttempt = {
  checkout_attempt_id: string;
  order_id: string;
  product_price_id: string;
  stripe_price_id: string;
  stripe_checkout_session_id: string | null;
  checkout_status: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asPreparedPrePplCheckoutAttempt(value: unknown): PreparedPrePplCheckoutAttempt | null {
  if (!isRecord(value)) return null;
  const fields = ["checkout_attempt_id", "order_id", "product_price_id", "stripe_price_id", "checkout_status"] as const;
  if (fields.some((field) => typeof value[field] !== "string")) return null;
  if (value.stripe_checkout_session_id !== null && typeof value.stripe_checkout_session_id !== "string") return null;
  return value as PreparedPrePplCheckoutAttempt;
}

async function prepareCheckoutAttempt(
  idempotencyKey: string,
  userId: string | null,
  stripeMode: "test" | "live",
  expectedStripePriceId: string,
): Promise<PreparedPrePplCheckoutAttempt> {
  const { data, error } = await getSupabaseAdmin().rpc("prepare_stripe_catalog_checkout", {
    p_product_key: "preppl_guide",
    p_price_key: PRE_PPL_GUIDE_PRICE_KEY,
    p_stripe_mode: stripeMode,
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
  }).single();
  const prepared = asPreparedPrePplCheckoutAttempt(data);
  if (error || !prepared || prepared.stripe_price_id !== expectedStripePriceId) {
    throw new CommerceCheckoutError("catalog");
  }
  return prepared;
}

async function getCheckoutAttemptOwner(attemptId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("checkout_attempts")
    .select("user_id")
    .eq("id", attemptId)
    .maybeSingle();
  if (error || !data || (data.user_id !== null && typeof data.user_id !== "string")) {
    throw new CommerceCheckoutError("persistence");
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
  if (error || !data) throw new CommerceCheckoutError("persistence");
}

async function getExistingStripeCheckoutUrl(sessionId: string): Promise<string> {
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.status === "complete" || session.status === "expired") throw new CommerceCheckoutError("intent_conflict");
    if (!isStripeCheckoutUrl(session.url)) throw new CommerceCheckoutError("provider");
    return session.url;
  } catch (error) {
    if (error instanceof CommerceCheckoutError) throw error;
    throw toStripeProviderError(error);
  }
}

/** Creates a guest or authenticated Checkout from the closed Pre-PPL catalog only. */
export async function createPrePplGuideCheckout(input: { idempotencyKey: string; requestOrigin: string }): Promise<{ url: string }> {
  const sessionState = await getFlyPathSessionState();
  if (sessionState.status === "unavailable") throw new CommerceCheckoutError("session");
  const currentUserId = sessionState.status === "authenticated" ? sessionState.account.id : null;
  const stripeConfiguration = getStripeConfiguration();
  let expectedStripePriceId: string;
  try {
    expectedStripePriceId = getStripeCatalogBinding("preppl_guide", stripeConfiguration.mode).stripePriceId;
  } catch {
    throw new CommerceCheckoutError("catalog");
  }
  const prepared = await prepareCheckoutAttempt(input.idempotencyKey, currentUserId, stripeConfiguration.mode, expectedStripePriceId);
  if (await getCheckoutAttemptOwner(prepared.checkout_attempt_id) !== currentUserId) {
    throw new CommerceCheckoutError("intent_conflict");
  }
  if (prepared.stripe_checkout_session_id) {
    return { url: await getExistingStripeCheckoutUrl(prepared.stripe_checkout_session_id) };
  }

  let checkoutSession;
  try {
    const appUrl = resolveStripeAppUrl();
    checkoutSession = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: prepared.stripe_price_id, quantity: 1 }],
      success_url: `${appUrl}/pre-ppl/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pre-ppl/checkout/cancel`,
      client_reference_id: prepared.checkout_attempt_id,
      metadata: {
        checkout_attempt_id: prepared.checkout_attempt_id,
        order_id: prepared.order_id,
        product_price_id: prepared.product_price_id,
        flypath_checkout_product: "preppl_guide",
        ...(sessionState.status === "authenticated" ? { flypath_user_id: sessionState.account.id } : {}),
      },
      payment_intent_data: {
        metadata: {
          checkout_attempt_id: prepared.checkout_attempt_id,
          order_id: prepared.order_id,
          flypath_checkout_product: "preppl_guide",
        },
      },
    }, { idempotencyKey: prepared.checkout_attempt_id });
  } catch (error) {
    throw toStripeProviderError(error);
  }
  if (!checkoutSession.id || !isStripeCheckoutUrl(checkoutSession.url)) throw new CommerceCheckoutError("provider");
  await persistStripeSession(prepared.checkout_attempt_id, checkoutSession.id);
  return { url: checkoutSession.url };
}

export const PRE_PPL_GUIDE_CHECKOUT_EXPECTED_VALUES = {
  currency: PRE_PPL_GUIDE_CURRENCY,
  priceKey: PRE_PPL_GUIDE_PRICE_KEY,
  unitAmount: PRE_PPL_GUIDE_UNIT_AMOUNT,
} as const;
