import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAeroCommsProCatalogPrice } from "./aerocomms-pro-catalog";
import { getStripeClient, resolveStripeAppUrl, toStripeProviderError } from "./stripe";

const PORTAL_ELIGIBLE_SUBSCRIPTION_STATUSES = ["active", "past_due", "canceling", "unpaid"] as const;
const AEROCOMMS_PRO_PORTAL_RETURN_PATH = "/aerocomms/app/profile";

export class AeroCommsProCustomerPortalError extends Error {
  constructor(public readonly kind: "authentication_required" | "session" | "subscription" | "persistence" | "provider") {
    super("AeroComms Pro subscription management is unavailable");
    this.name = "AeroCommsProCustomerPortalError";
  }
}

type SubscriptionRow = {
  product_price_id: string;
  stripe_customer_record_id: string | null;
};

type ProductPriceRow = {
  price_key: string;
  stripe_price_id: string | null;
};

type CustomerRow = {
  user_id: string | null;
  stripe_customer_id: string | null;
};

function isHostedStripePortalUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "billing.stripe.com";
  } catch {
    return false;
  }
}

async function getCustomerIdForAccount(userId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("product_price_id, stripe_customer_record_id")
    .eq("user_id", userId)
    .in("status", PORTAL_ELIGIBLE_SUBSCRIPTION_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (subscriptionError) throw new AeroCommsProCustomerPortalError("persistence");
  if (!subscription?.product_price_id || !subscription.stripe_customer_record_id) {
    throw new AeroCommsProCustomerPortalError("subscription");
  }

  const { data: price, error: priceError } = await admin
    .from("product_prices")
    .select("price_key, stripe_price_id")
    .eq("id", subscription.product_price_id)
    .maybeSingle<ProductPriceRow>();

  if (priceError) throw new AeroCommsProCustomerPortalError("persistence");
  if (!price || !isAeroCommsProCatalogPrice({
    priceKey: price.price_key,
    stripePriceId: price.stripe_price_id,
  })) {
    throw new AeroCommsProCustomerPortalError("subscription");
  }

  const { data: customer, error: customerError } = await admin
    .from("stripe_customers")
    .select("user_id, stripe_customer_id")
    .eq("id", subscription.stripe_customer_record_id)
    .maybeSingle<CustomerRow>();

  if (customerError) throw new AeroCommsProCustomerPortalError("persistence");
  if (!customer?.stripe_customer_id || customer.user_id !== userId) {
    throw new AeroCommsProCustomerPortalError("subscription");
  }

  return customer.stripe_customer_id;
}

/**
 * Creates a hosted Stripe Test Customer Portal Session for the authenticated
 * account's own current AeroComms Pro subscription. The browser never chooses
 * a Stripe customer or return destination.
 */
export async function createAeroCommsProCustomerPortal(input: {
  requestOrigin: string;
}): Promise<{ url: string }> {
  const session = await getFlyPathSessionState();
  if (session.status === "unavailable") throw new AeroCommsProCustomerPortalError("session");
  if (session.status !== "authenticated") throw new AeroCommsProCustomerPortalError("authentication_required");

  const customerId = await getCustomerIdForAccount(session.account.id);

  try {
    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${resolveStripeAppUrl(input.requestOrigin)}${AEROCOMMS_PRO_PORTAL_RETURN_PATH}`,
    });

    if (!isHostedStripePortalUrl(session.url)) {
      throw new AeroCommsProCustomerPortalError("provider");
    }
    return { url: session.url };
  } catch (error) {
    if (error instanceof AeroCommsProCustomerPortalError) throw error;
    throw toStripeProviderError(error);
  }
}
