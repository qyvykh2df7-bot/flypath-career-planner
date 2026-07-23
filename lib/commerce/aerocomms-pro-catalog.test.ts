import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_PRO_CATALOG,
  AEROCOMMS_PRO_LEGACY_CATALOG,
} from "./aerocomms-pro-catalog";

describe("AeroComms Pro catalog contract", () => {
  it("defines one closed monthly recurring price and entitlement", () => {
    expect(AEROCOMMS_PRO_CATALOG).toMatchObject({
      productKey: "aerocomms_pro",
      productName: "AeroComms Pro",
      priceKey: "aerocomms_pro_monthly_eur_599",
      entitlementKey: "aerocomms_pro",
      currency: "EUR",
      unitAmount: 599,
      billingType: "recurring",
      billingInterval: "month",
      intervalCount: 1,
      gracePeriodDays: 2,
    });
  });

  it("keeps the price identities independent from server-only Stripe bindings", () => {
    expect(AEROCOMMS_PRO_LEGACY_CATALOG).toMatchObject({
      priceKey: "aerocomms_pro_monthly_eur",
      unitAmount: 737,
    });
    expect(AEROCOMMS_PRO_CATALOG).not.toHaveProperty("stripePriceId");
    expect(AEROCOMMS_PRO_LEGACY_CATALOG).not.toHaveProperty("stripePriceId");
  });
});
