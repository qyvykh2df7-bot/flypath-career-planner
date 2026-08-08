import { describe, expect, it } from "vitest";

import {
  CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
  COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY,
  COMO_SER_PILOTO_GUIDE_UNIT_AMOUNT,
  PRE_PPL_GUIDE_CHECKOUT_KEY,
  PRE_PPL_GUIDE_UNIT_AMOUNT,
  CommerceCheckoutValidationError,
  getCommerceOneTimeProduct,
  isStripeCheckoutUrl,
  parseCommerceCheckoutRequest,
} from "./checkout";

describe("closed FlyPath one-time Checkout input", () => {
  it("accepts only approved internal product keys", () => {
    expect(parseCommerceCheckoutRequest({ productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY })).toEqual({
      productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY,
    });
    expect(parseCommerceCheckoutRequest({ productKey: COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY })).toEqual({
      productKey: COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY,
    });
    expect(parseCommerceCheckoutRequest({ productKey: PRE_PPL_GUIDE_CHECKOUT_KEY })).toEqual({
      productKey: PRE_PPL_GUIDE_CHECKOUT_KEY,
    });
  });

  it("keeps Pre-PPL's EUR amount in trusted catalog configuration", () => {
    expect(getCommerceOneTimeProduct(PRE_PPL_GUIDE_CHECKOUT_KEY)).toMatchObject({
      productKey: "preppl_guide",
      priceKey: "preppl_guide_eur",
      unitAmount: PRE_PPL_GUIDE_UNIT_AMOUNT,
      currency: "EUR",
    });
  });

  it("keeps the guide's EUR amount in trusted catalog configuration", () => {
    expect(getCommerceOneTimeProduct(COMO_SER_PILOTO_GUIDE_CHECKOUT_KEY)).toMatchObject({
      productKey: "como_ser_piloto_guide",
      priceKey: "como_ser_piloto_guide_eur",
      unitAmount: COMO_SER_PILOTO_GUIDE_UNIT_AMOUNT,
      currency: "EUR",
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
