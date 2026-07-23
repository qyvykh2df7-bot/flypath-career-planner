import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getStripeCatalogBinding,
  isAeroCommsProCatalogPrice,
  isAeroCommsProStripePriceId,
  isStripeCatalogPriceId,
} from "./stripe-catalog";

describe("server-only Stripe catalog", () => {
  it("resolves the approved Test and Live bindings independently", () => {
    expect(getStripeCatalogBinding("aerocomms_pro", "test")).toEqual({
      stripeProductId: "prod_UvXKn9mQPp3G17",
      stripePriceId: "price_1Tw6JqKuujVRKb0Pr4jCc5oQ",
    });
    expect(getStripeCatalogBinding("aerocomms_pro", "live")).toEqual({
      stripeProductId: "prod_UwBTbbxIuxOWFo",
      stripePriceId: "price_1TwJ6VKuujVRKb0PexWeKrvD",
    });
    expect(getStripeCatalogBinding("career_planner", "live").stripePriceId).toBe("price_1TwJ6gKuujVRKb0PzHL9PjjN");
    expect(getStripeCatalogBinding("como_ser_piloto_guide", "live").stripePriceId).toBe("price_1TwJ6cKuujVRKb0PPKY1Y8El");
  });

  it("never accepts a Price ID from the other provider mode", () => {
    const testPrice = getStripeCatalogBinding("aerocomms_pro", "test").stripePriceId;
    const livePrice = getStripeCatalogBinding("aerocomms_pro", "live").stripePriceId;

    expect(isStripeCatalogPriceId("aerocomms_pro", "test", testPrice)).toBe(true);
    expect(isStripeCatalogPriceId("aerocomms_pro", "live", testPrice)).toBe(false);
    expect(isStripeCatalogPriceId("aerocomms_pro", "live", livePrice)).toBe(true);
    expect(isAeroCommsProStripePriceId("test", "price_1TvgG4KuujVRKb0PkofwZMz7")).toBe(true);
    expect(isAeroCommsProStripePriceId("live", "price_1TvgG4KuujVRKb0PkofwZMz7")).toBe(false);
    expect(isAeroCommsProCatalogPrice("live", { stripePriceId: livePrice })).toBe(true);
    expect(isAeroCommsProCatalogPrice("live", { stripePriceId: testPrice })).toBe(false);
  });
});
