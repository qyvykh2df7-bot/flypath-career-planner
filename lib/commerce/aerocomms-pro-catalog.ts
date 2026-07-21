/**
 * Closed catalog contract for the future AeroComms Pro subscription.
 * This module deliberately contains no Stripe identifiers or checkout logic.
 */
export const AEROCOMMS_PRO_CATALOG = {
  productKey: "aerocomms_pro",
  productName: "AeroComms Pro",
  priceKey: "aerocomms_pro_monthly_eur",
  entitlementKey: "aerocomms_pro",
  currency: "EUR",
  unitAmount: 737,
  billingType: "recurring",
  billingInterval: "month",
  intervalCount: 1,
  gracePeriodDays: 2,
  // Stripe Test identifier bound in the immutable server-side price catalog.
  stripePriceId: "price_1TvgG4KuujVRKb0PkofwZMz7",
} as const;
