import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  CAREER_PLANNER_PREMIUM_CURRENCY,
  CAREER_PLANNER_PREMIUM_PRICE_KEY,
  CAREER_PLANNER_PREMIUM_UNIT_AMOUNT,
  isStripeCheckoutUrl,
} from "./checkout";
import { getStripeCatalogBinding } from "./stripe-catalog";
import { getStripeClient, getStripeConfiguration, resolveStripeAppUrl, toStripeProviderError } from "./stripe";

export class CommerceCheckoutError extends Error {
  constructor(public readonly kind: "catalog" | "persistence" | "provider" | "session" | "intent_conflict") {
    super("Checkout could not be created");
    this.name = "CommerceCheckoutError";
  }
}

type PreparedCheckoutAttempt = {
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

function asPreparedCheckoutAttempt(value: unknown): PreparedCheckoutAttempt | null {
  if (!isRecord(value)) return null;
  const attemptId = value.checkout_attempt_id;
  const orderId = value.order_id;
  const productPriceId = value.product_price_id;
  const stripePriceId = value.stripe_price_id;
  const stripeCheckoutSessionId = value.stripe_checkout_session_id;
  const checkoutStatus = value.checkout_status;

  if (
    typeof attemptId !== "string" ||
    typeof orderId !== "string" ||
    typeof productPriceId !== "string" ||
    typeof stripePriceId !== "string" ||
    (stripeCheckoutSessionId !== null && typeof stripeCheckoutSessionId !== "string") ||
    typeof checkoutStatus !== "string"
  ) {
    return null;
  }

  return {
    checkoutAttemptId: attemptId,
    orderId,
    productPriceId,
    stripePriceId,
    stripeCheckoutSessionId,
    checkoutStatus,
  };
}

async function prepareCheckoutAttempt(
  idempotencyKey: string,
  userId: string | null,
  stripeMode: "test" | "live",
  expectedStripePriceId: string,
): Promise<PreparedCheckoutAttempt> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("prepare_stripe_catalog_checkout", {
    p_product_key: "career_planner",
    p_price_key: CAREER_PLANNER_PREMIUM_PRICE_KEY,
    p_stripe_mode: stripeMode,
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
  }).single();

  const prepared = asPreparedCheckoutAttempt(data);
  if (error || !prepared || prepared.stripePriceId !== expectedStripePriceId) {
    throw new CommerceCheckoutError("catalog");
  }

  return prepared;
}

async function persistStripeSession(
  attemptId: string,
  stripeSessionId: string,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("checkout_attempts")
    .update({
      stripe_checkout_session_id: stripeSessionId,
      status: "session_created",
      expires_at: null,
    })
    .eq("id", attemptId)
    .or(`stripe_checkout_session_id.is.null,stripe_checkout_session_id.eq.${stripeSessionId}`)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new CommerceCheckoutError("persistence");
}

async function getCheckoutAttemptOwner(attemptId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("checkout_attempts")
    .select("user_id")
    .eq("id", attemptId)
    .maybeSingle();

  if (error || !data || (data.user_id !== null && typeof data.user_id !== "string")) {
    throw new CommerceCheckoutError("persistence");
  }

  return data.user_id;
}

async function getExistingStripeCheckoutUrl(sessionId: string): Promise<string> {
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.status === "complete" || session.status === "expired") {
      throw new CommerceCheckoutError("intent_conflict");
    }
    if (!isStripeCheckoutUrl(session.url)) throw new CommerceCheckoutError("provider");
    return session.url;
  } catch (error) {
    if (error instanceof CommerceCheckoutError) throw error;
    throw toStripeProviderError(error);
  }
}

export async function createCareerPlannerPremiumCheckout(input: {
  idempotencyKey: string;
  requestOrigin: string;
}): Promise<{ url: string }> {
  const sessionState = await getFlyPathSessionState();
  if (sessionState.status === "unavailable") throw new CommerceCheckoutError("session");
  const currentUserId = sessionState.status === "authenticated" ? sessionState.account.id : null;
  const stripeConfiguration = getStripeConfiguration();
  const expectedStripePriceId = getStripeCatalogBinding("career_planner", stripeConfiguration.mode).stripePriceId;

  const prepared = await prepareCheckoutAttempt(
    input.idempotencyKey,
    currentUserId,
    stripeConfiguration.mode,
    expectedStripePriceId,
  );

  const attemptOwner = await getCheckoutAttemptOwner(prepared.checkoutAttemptId);
  if (attemptOwner !== currentUserId) {
    throw new CommerceCheckoutError("intent_conflict");
  }

  if (prepared.stripeCheckoutSessionId) {
    return { url: await getExistingStripeCheckoutUrl(prepared.stripeCheckoutSessionId) };
  }

  const appUrl = resolveStripeAppUrl(input.requestOrigin);
  let checkoutSession;
  try {
    checkoutSession = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: prepared.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/career-planner/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/career-planner/checkout/cancel`,
      client_reference_id: prepared.checkoutAttemptId,
      metadata: {
        checkout_attempt_id: prepared.checkoutAttemptId,
        order_id: prepared.orderId,
        product_price_id: prepared.productPriceId,
        ...(sessionState.status === "authenticated" ? { flypath_user_id: sessionState.account.id } : {}),
      },
      // PaymentIntent failures do not carry Checkout Session metadata. Keep
      // only server-generated references there so a failed payment can be
      // safely associated without accepting any browser commercial input.
      payment_intent_data: {
        metadata: {
          checkout_attempt_id: prepared.checkoutAttemptId,
          order_id: prepared.orderId,
        },
      },
    }, {
      idempotencyKey: prepared.checkoutAttemptId,
    });
  } catch (error) {
    throw toStripeProviderError(error);
  }

  if (!checkoutSession.id || !isStripeCheckoutUrl(checkoutSession.url)) {
    throw new CommerceCheckoutError("provider");
  }

  try {
    await persistStripeSession(prepared.checkoutAttemptId, checkoutSession.id);
  } catch (error) {
    // Stripe's idempotency key is the stored attempt id, so a retry can safely
    // recover the same hosted session instead of creating another order.
    if (error instanceof CommerceCheckoutError) throw error;
    throw new CommerceCheckoutError("persistence");
  }

  return { url: checkoutSession.url };
}

/** Keeps expected commercial constants visible beside the server-side session creator. */
export const CAREER_PLANNER_PREMIUM_CHECKOUT_EXPECTED_VALUES = {
  currency: CAREER_PLANNER_PREMIUM_CURRENCY,
  priceKey: CAREER_PLANNER_PREMIUM_PRICE_KEY,
  unitAmount: CAREER_PLANNER_PREMIUM_UNIT_AMOUNT,
} as const;
