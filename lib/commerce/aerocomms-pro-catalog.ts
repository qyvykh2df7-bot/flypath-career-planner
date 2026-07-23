/**
 * Closed catalog contract for the future AeroComms Pro subscription.
 * This client-safe module deliberately contains no Stripe identifiers or
 * checkout logic. Provider bindings live in the server-only stripe catalog.
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
} as const;
