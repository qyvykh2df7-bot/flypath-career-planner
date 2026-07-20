export const COMMERCE_CURRENCIES = ["EUR"] as const;
export const PRODUCT_PRICE_BILLING_TYPES = ["one_time", "recurring"] as const;
export const PRODUCT_PRICE_INTERVALS = ["month", "year"] as const;
export const PRODUCT_PRICE_TAX_BEHAVIORS = ["inclusive", "exclusive", "unspecified"] as const;
export const ENTITLEMENT_GRANT_STATUSES = ["pending_claim", "active", "revoked", "expired"] as const;

export type CommerceCurrency = (typeof COMMERCE_CURRENCIES)[number];
export type ProductPriceBillingType = (typeof PRODUCT_PRICE_BILLING_TYPES)[number];
export type ProductPriceInterval = (typeof PRODUCT_PRICE_INTERVALS)[number];
export type ProductPriceTaxBehavior = (typeof PRODUCT_PRICE_TAX_BEHAVIORS)[number];
export type EntitlementGrantStatus = (typeof ENTITLEMENT_GRANT_STATUSES)[number];

export type CommercialPriceDraft = {
  productId: string;
  priceKey: string;
  currency: CommerceCurrency;
  unitAmount: number;
  billingType: ProductPriceBillingType;
  billingInterval: ProductPriceInterval | null;
  intervalCount: number | null;
  taxBehavior: ProductPriceTaxBehavior;
};

/** Closed, client-safe representation of a future effective access grant. */
export type EntitlementGrant = {
  entitlementKey: string;
  status: EntitlementGrantStatus;
  startsAt: string;
  endsAt: string | null;
  revokedAt: string | null;
};

export const COMMERCE_POSTGRES_INTEGER_MAX = 2_147_483_647;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRICE_KEY_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isCommerceUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function normalizeCommerceEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized.length <= 320 && EMAIL_PATTERN.test(normalized) ? normalized : null;
}

export function isCommercialPriceKey(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && PRICE_KEY_PATTERN.test(value);
}

export function isCommerceCurrency(value: unknown): value is CommerceCurrency {
  return typeof value === "string" && (COMMERCE_CURRENCIES as readonly string[]).includes(value);
}
