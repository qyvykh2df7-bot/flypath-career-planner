import { describe, expect, it } from "vitest";

import {
  CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
  CommerceCheckoutValidationError,
  isStripeCheckoutUrl,
  parseCommerceCheckoutRequest,
} from "./checkout";

describe("closed Career Planner Checkout input", () => {
  it("accepts only the approved internal product key", () => {
    expect(parseCommerceCheckoutRequest({ productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY })).toEqual({
      productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
    });
  });

  it("rejects product keys, prices, user IDs, amounts, currencies and unknown fields from the browser", () => {
    for (const input of [
      {},
      { productKey: "aerocomms_pro" },
      { productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY, amount: 1 },
      { productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY, currency: "USD" },
      { productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY, priceId: "price_attacker" },
      { productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY, userId: "attacker" },
      { productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY, successUrl: "https://attacker.test" },
    ]) {
      expect(() => parseCommerceCheckoutRequest(input)).toThrow(CommerceCheckoutValidationError);
    }
  });

  it("accepts only the hosted Stripe Checkout origin before client navigation", () => {
    expect(isStripeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_123")).toBe(true);
    expect(isStripeCheckoutUrl("https://attacker.test/checkout")).toBe(false);
    expect(isStripeCheckoutUrl("javascript:alert(1)")).toBe(false);
  });
});
