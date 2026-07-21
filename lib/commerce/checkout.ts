export const CAREER_PLANNER_PREMIUM_CHECKOUT_KEY = "career_planner_premium";
export const CAREER_PLANNER_PREMIUM_PRICE_KEY = "career_planner_premium_eur";
export const CAREER_PLANNER_PREMIUM_UNIT_AMOUNT = 595;
export const CAREER_PLANNER_PREMIUM_CURRENCY = "EUR";
export const COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY = "como_ser_piloto_guide";
export const COMO_SER_PILOTO_GUIDE_PRICE_KEY = "como_ser_piloto_guide_eur";
export const COMO_SER_PILOTO_GUIDE_UNIT_AMOUNT = 1495;
export const COMO_SER_PILOTO_GUIDE_CURRENCY = "EUR";
export const COMMERCE_CHECKOUT_REQUEST_MAX_BODY_SIZE = 1_024;
export const CAREER_PLANNER_CHECKOUT_INTENT_COOKIE = "flypath_checkout_intent_career_planner";
export const COMO_SER_PILOTO_GUIDE_CHECKOUT_INTENT_COOKIE = "flypath_checkout_intent_como_ser_piloto_guide";

export const COMMERCE_ONE_TIME_PRODUCTS = {
  [CAREER_PLANNER_PREMIUM_CHECKOUT_KEY]: {
    checkoutKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
    productKey: "career_planner",
    priceKey: CAREER_PLANNER_PREMIUM_PRICE_KEY,
    unitAmount: CAREER_PLANNER_PREMIUM_UNIT_AMOUNT,
    currency: CAREER_PLANNER_PREMIUM_CURRENCY,
    checkoutIntentCookie: CAREER_PLANNER_CHECKOUT_INTENT_COOKIE,
  },
  [COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY]: {
    checkoutKey: COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY,
    productKey: COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY,
    priceKey: COMO_SER_PILOTO_GUIDE_PRICE_KEY,
    unitAmount: COMO_SER_PILOTO_GUIDE_UNIT_AMOUNT,
    currency: COMO_SER_PILOTO_GUIDE_CURRENCY,
    checkoutIntentCookie: COMO_SER_PILOTO_GUIDE_CHECKOUT_INTENT_COOKIE,
  },
} as const;

export type CommerceOneTimeCheckoutKey = keyof typeof COMMERCE_ONE_TIME_PRODUCTS;
export type CommerceOneTimeProduct = (typeof COMMERCE_ONE_TIME_PRODUCTS)[CommerceOneTimeCheckoutKey];

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
export function parseCommerceCheckoutRequest(value: unknown): { productKey: CommerceOneTimeCheckoutKey } {
  if (!isRecord(value) || Object.keys(value).length !== 1) {
    throw new CommerceCheckoutValidationError();
  }

  if (typeof value.productKey !== "string" || !(value.productKey in COMMERCE_ONE_TIME_PRODUCTS)) {
    throw new CommerceCheckoutValidationError();
  }

  return { productKey: value.productKey as CommerceOneTimeCheckoutKey };
}

export function getCommerceOneTimeProduct(value: CommerceOneTimeCheckoutKey): CommerceOneTimeProduct {
  return COMMERCE_ONE_TIME_PRODUCTS[value];
}

/** Public display formatting only; server-side catalog validation remains authoritative. */
export function formatCommerceEur(unitAmount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(unitAmount / 100);
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
