import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_PRO_CATALOG,
  AEROCOMMS_PRO_LEGACY_CATALOG,
  isAeroCommsProCatalogPrice,
  isAeroCommsProStripePriceId,
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

  it("uses 5.99 EUR for new Checkout while accepting only the closed legacy price for existing subscriptions", () => {
    expect(AEROCOMMS_PRO_CATALOG.stripePriceId).toBe("price_1Tw6JqKuujVRKb0Pr4jCc5oQ");
    expect(AEROCOMMS_PRO_LEGACY_CATALOG).toMatchObject({
      priceKey: "aerocomms_pro_monthly_eur",
      unitAmount: 737,
      stripePriceId: "price_1TvgG4KuujVRKb0PkofwZMz7",
    });
    expect(isAeroCommsProStripePriceId(AEROCOMMS_PRO_CATALOG.stripePriceId)).toBe(true);
    expect(isAeroCommsProStripePriceId(AEROCOMMS_PRO_LEGACY_CATALOG.stripePriceId)).toBe(true);
    expect(isAeroCommsProStripePriceId("price_unrelated")).toBe(false);
    expect(isAeroCommsProCatalogPrice({
      priceKey: AEROCOMMS_PRO_LEGACY_CATALOG.priceKey,
      stripePriceId: AEROCOMMS_PRO_LEGACY_CATALOG.stripePriceId,
    })).toBe(true);
  });
});
