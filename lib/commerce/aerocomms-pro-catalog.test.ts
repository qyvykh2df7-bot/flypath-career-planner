import { describe, expect, it } from "vitest";

import { AEROCOMMS_PRO_CATALOG } from "./aerocomms-pro-catalog";

describe("AeroComms Pro catalog contract", () => {
  it("defines one closed monthly recurring price and entitlement", () => {
    expect(AEROCOMMS_PRO_CATALOG).toMatchObject({
      productKey: "aerocomms_pro",
      productName: "AeroComms Pro",
      priceKey: "aerocomms_pro_monthly_eur",
      entitlementKey: "aerocomms_pro",
      currency: "EUR",
      unitAmount: 737,
      billingType: "recurring",
      billingInterval: "month",
      intervalCount: 1,
      gracePeriodDays: 2,
    });
  });
});
