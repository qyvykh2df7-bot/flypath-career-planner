import { describe, expect, it } from "vitest";

import { normalizeCommerceEmail } from "./contracts";
import { CommerceValidationError, parseCommercialPriceDraft } from "./validation";

const productId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

describe("commercial catalog validation", () => {
  it("accepts a closed EUR recurring price shape", () => {
    expect(parseCommercialPriceDraft({
      productId,
      priceKey: "aerocomms_pro_monthly_eur",
      currency: "EUR",
      unitAmount: 599,
      billingType: "recurring",
      billingInterval: "month",
      intervalCount: 1,
      taxBehavior: "inclusive",
    })).toMatchObject({ billingType: "recurring", billingInterval: "month", intervalCount: 1 });
  });

  it("rejects a one-time price with recurring fields", () => {
    expect(() => parseCommercialPriceDraft({
      productId,
      priceKey: "career_planner_premium_eur",
      currency: "EUR",
      unitAmount: 595,
      billingType: "one_time",
      billingInterval: "month",
      intervalCount: 1,
      taxBehavior: "inclusive",
    })).toThrow(CommerceValidationError);
  });

  it("rejects open currencies, malformed price keys, and unsafe amount values", () => {
    for (const partial of [
      { currency: "USD" },
      { priceKey: "Career Planner" },
      { unitAmount: -1 },
      { unitAmount: 2_147_483_648 },
    ]) {
      expect(() => parseCommercialPriceDraft({
        productId,
        priceKey: "career_planner_premium_eur",
        currency: "EUR",
        unitAmount: 595,
        billingType: "one_time",
        billingInterval: null,
        intervalCount: null,
        taxBehavior: "inclusive",
        ...partial,
      })).toThrow(CommerceValidationError);
    }
  });

  it("normalizes the minimal email used only for guest delivery and recovery", () => {
    expect(normalizeCommerceEmail(" Buyer@Example.com ")).toBe("buyer@example.com");
    expect(normalizeCommerceEmail("not-an-email")).toBeNull();
  });
});
