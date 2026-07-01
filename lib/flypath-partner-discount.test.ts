import { describe, expect, it } from "vitest";
import {
  FLYPATH_PARTNER_DISCOUNT_CODE,
  FLYPATH_PARTNER_DISCOUNT_PERCENT,
  isFlyPathPartnerDiscountEligible,
} from "./flypath-partner-discount";

describe("flypath-partner-discount", () => {
  it("expone código y porcentaje", () => {
    expect(FLYPATH_PARTNER_DISCOUNT_CODE).toBe("FLYPARTNER20");
    expect(FLYPATH_PARTNER_DISCOUNT_PERCENT).toBe(20);
  });

  it("marca productos FlyPath activos como elegibles", () => {
    expect(isFlyPathPartnerDiscountEligible("guia")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("mentoria")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("ingles")).toBe(true);
    expect(isFlyPathPartnerDiscountEligible("escuelas")).toBe(false);
    expect(isFlyPathPartnerDiscountEligible("unknown")).toBe(false);
  });
});
