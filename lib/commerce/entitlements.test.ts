import { describe, expect, it } from "vitest";

import { isEntitlementGrantActive, resolveActiveEntitlementKeys } from "./entitlements";

const now = new Date("2026-07-20T12:00:00.000Z");

describe("effective entitlement resolution", () => {
  it("accepts an active perpetual grant", () => {
    expect(isEntitlementGrantActive({
      entitlementKey: "career_planner_premium",
      status: "active",
      startsAt: "2026-07-20T11:00:00.000Z",
      endsAt: null,
      revokedAt: null,
    }, now)).toBe(true);
  });

  it("rejects pending guest claims, revoked, expired, and future grants", () => {
    for (const grant of [
      { status: "pending_claim", startsAt: "2026-07-20T11:00:00.000Z", endsAt: null, revokedAt: null },
      { status: "revoked", startsAt: "2026-07-20T11:00:00.000Z", endsAt: null, revokedAt: "2026-07-20T11:30:00.000Z" },
      { status: "expired", startsAt: "2026-07-18T11:00:00.000Z", endsAt: "2026-07-19T11:00:00.000Z", revokedAt: null },
      { status: "active", startsAt: "2026-07-21T11:00:00.000Z", endsAt: null, revokedAt: null },
    ] as const) {
      expect(isEntitlementGrantActive({ entitlementKey: "aerocomms_pro", ...grant }, now)).toBe(false);
    }
  });

  it("deduplicates effective access from independent, valid grants", () => {
    expect(resolveActiveEntitlementKeys([
      { entitlementKey: "aerocomms_pro", status: "active", startsAt: "2026-07-01T00:00:00.000Z", endsAt: null, revokedAt: null },
      { entitlementKey: "aerocomms_pro", status: "active", startsAt: "2026-07-02T00:00:00.000Z", endsAt: null, revokedAt: null },
      { entitlementKey: "career_planner_premium", status: "expired", startsAt: "2026-07-01T00:00:00.000Z", endsAt: "2026-07-02T00:00:00.000Z", revokedAt: null },
    ], now)).toEqual(["aerocomms_pro"]);
  });
});
