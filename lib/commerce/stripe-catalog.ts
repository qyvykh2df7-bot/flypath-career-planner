import "server-only";

import type { StripeMode } from "./stripe";

export type StripeCatalogProductKey = "aerocomms_pro" | "career_planner" | "como_ser_piloto_guide" | "preppl_guide";

export type StripeCatalogBinding = {
  stripeProductId: string;
  stripePriceId: string;
};

type StripeCatalog = Record<StripeCatalogProductKey, Partial<Record<StripeMode, StripeCatalogBinding>>>;

/**
 * Provider identifiers are server-only and selected exclusively from the mode
 * derived from STRIPE_SECRET_KEY. A future Supabase migration must mirror the
 * same binding before a Live Checkout can be created.
 */
const STRIPE_CATALOG: StripeCatalog = {
  aerocomms_pro: {
    test: {
      stripeProductId: "prod_UvXKn9mQPp3G17",
      stripePriceId: "price_1Tw6JqKuujVRKb0Pr4jCc5oQ",
    },
    live: {
      stripeProductId: "prod_UwBTbbxIuxOWFo",
      stripePriceId: "price_1TwJ6VKuujVRKb0PexWeKrvD",
    },
  },
  career_planner: {
    test: {
      stripeProductId: "prod_UvEWxfYGo03A6l",
      stripePriceId: "price_1TvO3TKuujVRKb0PLb2gr8tI",
    },
    live: {
      stripeProductId: "prod_UwBTzck12AoM3X",
      stripePriceId: "price_1TwJ6gKuujVRKb0PzHL9PjjN",
    },
  },
  como_ser_piloto_guide: {
    test: {
      stripeProductId: "prod_UvTMErmtpIu0CF",
      stripePriceId: "price_1TvcPrKuujVRKb0P6Z8XGp7v",
    },
    live: {
      stripeProductId: "prod_UwBTIYeQ69e225",
      stripePriceId: "price_1TwJ6cKuujVRKb0PPKY1Y8El",
    },
  },
  preppl_guide: {
    // Pre-PPL has no Test catalog binding yet. It fails closed there instead of
    // ever accepting a Live price from a Test runtime.
    live: {
      stripeProductId: "prod_V2HDiunAEOVO9p",
      stripePriceId: "price_1U2Cf6KuujVRKb0PVULrzLEY",
    },
  },
};

const AEROCOMMS_PRO_TEST_LEGACY_PRICE_ID = "price_1TvgG4KuujVRKb0PkofwZMz7";

export function getStripeCatalogBinding(
  productKey: StripeCatalogProductKey,
  mode: StripeMode,
): StripeCatalogBinding {
  const binding = STRIPE_CATALOG[productKey][mode];
  if (!binding) {
    throw new Error("Stripe catalog binding unavailable for this mode");
  }
  return binding;
}

export function isStripeCatalogPriceId(
  productKey: StripeCatalogProductKey,
  mode: StripeMode,
  value: unknown,
): value is string {
  return value === getStripeCatalogBinding(productKey, mode).stripePriceId;
}

/** Test-only historical subscriptions remain processable until their end. */
export function isAeroCommsProStripePriceId(mode: StripeMode, value: unknown): value is string {
  return isStripeCatalogPriceId("aerocomms_pro", mode, value)
    || (mode === "test" && value === AEROCOMMS_PRO_TEST_LEGACY_PRICE_ID);
}

export function isAeroCommsProCatalogPrice(
  mode: StripeMode,
  value: { stripePriceId: string | null },
): boolean {
  return isAeroCommsProStripePriceId(mode, value.stripePriceId);
}
