import { describe, expect, it } from "vitest";
import {
  FLYPATH_PARTNER_DISCOUNT_CODE,
  isFlyPathPartnerDiscountEligible,
} from "@/lib/flypath-partner-discount";

describe("flypath-partner-discount", () => {
  it("uses a single partner code for all eligible products", () => {
    expect(FLYPATH_PARTNER_DISCOUNT_CODE).toBe("FLYPARTNER20");
  });

  it("enables discount for primary FlyPath products", () => {
    expect(isFlyPathPartnerDiscountEligible("mentoria")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("guia")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("ingles")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("clases")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("atpl")).toBe(true);
  });

  it("disables discount for non-purchasable comparador", () => {
    expect(isFlyPathPartnerDiscountEligible("escuelas")).toBe(false);
    expect(isFlyPathPartnerDiscountEligible("unknown")).toBe(false);
  });
});
