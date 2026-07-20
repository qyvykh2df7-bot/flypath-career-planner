export const CAREER_PLANNER_PREMIUM_CHECKOUT_KEY = "career_planner_premium";
export const CAREER_PLANNER_PREMIUM_PRICE_KEY = "career_planner_premium_eur";
export const CAREER_PLANNER_PREMIUM_UNIT_AMOUNT = 595;
export const CAREER_PLANNER_PREMIUM_CURRENCY = "EUR";
export const COMMERCE_CHECKOUT_REQUEST_MAX_BODY_SIZE = 1_024;

export class CommerceCheckoutValidationError extends Error {
  constructor() {
    super("Invalid checkout request");
    this.name = "CommerceCheckoutValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The browser chooses only a closed FlyPath key, never any commercial value. */
export function parseCommerceCheckoutRequest(value: unknown): {
  productKey: typeof CAREER_PLANNER_PREMIUM_CHECKOUT_KEY;
} {
  if (!isRecord(value) || Object.keys(value).length !== 1) {
    throw new CommerceCheckoutValidationError();
  }

  if (value.productKey !== CAREER_PLANNER_PREMIUM_CHECKOUT_KEY) {
    throw new CommerceCheckoutValidationError();
  }

  return { productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY };
}

export function isStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}
