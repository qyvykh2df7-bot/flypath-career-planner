import {
  COMMERCE_POSTGRES_INTEGER_MAX,
  PRODUCT_PRICE_BILLING_TYPES,
  PRODUCT_PRICE_INTERVALS,
  PRODUCT_PRICE_TAX_BEHAVIORS,
  isCommerceCurrency,
  isCommerceUuid,
  isCommercialPriceKey,
  type CommercialPriceDraft,
  type ProductPriceBillingType,
  type ProductPriceInterval,
  type ProductPriceTaxBehavior,
} from "./contracts";

export type CommerceValidationField =
  | "payload"
  | "productId"
  | "priceKey"
  | "currency"
  | "unitAmount"
  | "billingType"
  | "billingInterval"
  | "intervalCount"
  | "taxBehavior";

export class CommerceValidationError extends Error {
  constructor(public readonly field: CommerceValidationField) {
    super("Invalid commerce input");
    this.name = "CommerceValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(field: CommerceValidationField): never {
  throw new CommerceValidationError(field);
}

/**
 * Validates catalog input only. Checkout and Stripe values remain server-owned
 * in later blocks and are intentionally absent from this parser.
 */
export function parseCommercialPriceDraft(value: unknown): CommercialPriceDraft {
  if (!isRecord(value)) invalid("payload");
  if (!isCommerceUuid(value.productId)) invalid("productId");
  if (!isCommercialPriceKey(value.priceKey)) invalid("priceKey");
  if (!isCommerceCurrency(value.currency)) invalid("currency");
  const unitAmount = value.unitAmount;
  if (typeof unitAmount !== "number" || !Number.isInteger(unitAmount) || unitAmount < 0 || unitAmount > COMMERCE_POSTGRES_INTEGER_MAX) {
    invalid("unitAmount");
  }
  if (!(PRODUCT_PRICE_BILLING_TYPES as readonly unknown[]).includes(value.billingType)) invalid("billingType");
  if (!(PRODUCT_PRICE_TAX_BEHAVIORS as readonly unknown[]).includes(value.taxBehavior)) invalid("taxBehavior");

  const billingType = value.billingType as ProductPriceBillingType;
  const billingInterval = value.billingInterval === null ? null : value.billingInterval as ProductPriceInterval;
  const intervalCount = value.intervalCount === null ? null : value.intervalCount;

  if (billingType === "one_time") {
    if (billingInterval !== null) invalid("billingInterval");
    if (intervalCount !== null) invalid("intervalCount");
  } else {
    if (!(PRODUCT_PRICE_INTERVALS as readonly unknown[]).includes(billingInterval)) invalid("billingInterval");
    if (typeof intervalCount !== "number" || !Number.isInteger(intervalCount) || intervalCount < 1 || intervalCount > 12) {
      invalid("intervalCount");
    }
  }

  return {
    productId: value.productId,
    priceKey: value.priceKey,
    currency: value.currency,
    unitAmount,
    billingType,
    billingInterval,
    intervalCount: intervalCount as number | null,
    taxBehavior: value.taxBehavior as ProductPriceTaxBehavior,
  };
}
