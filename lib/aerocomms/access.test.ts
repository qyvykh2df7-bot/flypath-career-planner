import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_PRO_ENTITLEMENT_KEY,
  isAeroCommsDevelopmentOverrideEnabled,
  resolveAeroCommsAccess,
  resolveAeroCommsAccessFromGrants,
} from "./access";

const now = new Date("2026-07-21T12:00:00.000Z");

describe("AeroComms Pro access contract", () => {
  it("grants Pro only from the closed AeroComms entitlement in production", () => {
    expect(resolveAeroCommsAccess({
      entitlementKeys: [AEROCOMMS_PRO_ENTITLEMENT_KEY],
      environment: "production",
    })).toEqual({ isPro: true, source: "entitlement" });

    expect(resolveAeroCommsAccess({
      entitlementKeys: ["career_planner_premium"],
      environment: "production",
    })).toEqual({ isPro: false, source: "free" });
  });

  it("does not treat an editable local subscription value as an entitlement", () => {
    expect(resolveAeroCommsAccess({
      entitlementKeys: [],
      environment: "production",
    })).toEqual({ isPro: false, source: "free" });
  });

  it("rejects inactive, expired, pending, and revoked grants", () => {
    for (const grant of [
      { status: "pending_claim", startsAt: "2026-07-20T00:00:00.000Z", endsAt: null, revokedAt: null },
      { status: "expired", startsAt: "2026-07-19T00:00:00.000Z", endsAt: "2026-07-20T00:00:00.000Z", revokedAt: null },
      { status: "revoked", startsAt: "2026-07-19T00:00:00.000Z", endsAt: null, revokedAt: "2026-07-20T00:00:00.000Z" },
    ] as const) {
      expect(resolveAeroCommsAccessFromGrants([
        { entitlementKey: AEROCOMMS_PRO_ENTITLEMENT_KEY, ...grant },
      ], now, "production")).toEqual({ isPro: false, source: "free" });
    }
  });

  it("allows the internal override only in development and test", () => {
    expect(isAeroCommsDevelopmentOverrideEnabled("production")).toBe(false);
    expect(isAeroCommsDevelopmentOverrideEnabled("development")).toBe(true);
    expect(isAeroCommsDevelopmentOverrideEnabled("test")).toBe(true);
    expect(resolveAeroCommsAccess({ environment: "development" })).toEqual({
      isPro: true,
      source: "development_override",
    });
  });
});
