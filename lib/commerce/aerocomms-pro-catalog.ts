/**
 * Closed catalog contract for the future AeroComms Pro subscription.
 * This module deliberately contains no Stripe identifiers or checkout logic.
 */
export const AEROCOMMS_PRO_CATALOG = {
  productKey: "aerocomms_pro",
  productName: "AeroComms Pro",
  priceKey: "aerocomms_pro_monthly_eur_599",
  entitlementKey: "aerocomms_pro",
  currency: "EUR",
  unitAmount: 599,
  billingType: "recurring",
  billingInterval: "month",
  intervalCount: 1,
  gracePeriodDays: 2,
  // Stripe Test identifier bound in the immutable server-side price catalog.
  stripePriceId: "price_1Tw6JqKuujVRKb0Pr4jCc5oQ",
} as const;

/**
 * The original monthly price remains valid only for subscriptions already
 * created through the closed 7.37 EUR catalog. It is never used for a new
 * Checkout Session.
 */
export const AEROCOMMS_PRO_LEGACY_CATALOG = {
  priceKey: "aerocomms_pro_monthly_eur",
  currency: "EUR",
  unitAmount: 737,
  billingType: "recurring",
  billingInterval: "month",
  intervalCount: 1,
  stripePriceId: "price_1TvgG4KuujVRKb0PkofwZMz7",
} as const;

export function isAeroCommsProStripePriceId(value: unknown): value is string {
  return value === AEROCOMMS_PRO_CATALOG.stripePriceId
    || value === AEROCOMMS_PRO_LEGACY_CATALOG.stripePriceId;
}

export function isAeroCommsProCatalogPrice(value: {
  priceKey: string;
  stripePriceId: string | null;
}): boolean {
  return (
    (value.priceKey === AEROCOMMS_PRO_CATALOG.priceKey
      && value.stripePriceId === AEROCOMMS_PRO_CATALOG.stripePriceId)
    || (value.priceKey === AEROCOMMS_PRO_LEGACY_CATALOG.priceKey
      && value.stripePriceId === AEROCOMMS_PRO_LEGACY_CATALOG.stripePriceId)
  );
}
