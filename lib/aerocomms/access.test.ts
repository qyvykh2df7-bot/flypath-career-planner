import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_PRO_ENTITLEMENT_KEY,
  isAeroCommsDevelopmentOverrideEnabled,
  reconcileAeroCommsAccess,
  resolveAeroCommsAccess,
  resolveAeroCommsAccessFromGrants,
} from "./access";

const now = new Date("2026-07-21T12:00:00.000Z");

describe("AeroComms Pro access contract", () => {
  it("grants Pro only from the closed AeroComms entitlement in production", () => {
    expect(resolveAeroCommsAccess({
      entitlementKeys: [AEROCOMMS_PRO_ENTITLEMENT_KEY],
      environment: "production",
    })).toEqual({ status: "pro", isPro: true, source: "entitlement" });

    expect(resolveAeroCommsAccess({
      entitlementKeys: ["career_planner_premium"],
      environment: "production",
    })).toEqual({ status: "authenticated_free", isPro: false, source: "free" });
  });

  it("does not treat an editable local subscription value as an entitlement", () => {
    expect(resolveAeroCommsAccess({
      entitlementKeys: [],
      environment: "production",
    })).toEqual({ status: "authenticated_free", isPro: false, source: "free" });
  });

  it("rejects inactive, expired, pending, and revoked grants", () => {
    for (const grant of [
      { status: "pending_claim", startsAt: "2026-07-20T00:00:00.000Z", endsAt: null, revokedAt: null },
      { status: "expired", startsAt: "2026-07-19T00:00:00.000Z", endsAt: "2026-07-20T00:00:00.000Z", revokedAt: null },
      { status: "revoked", startsAt: "2026-07-19T00:00:00.000Z", endsAt: null, revokedAt: "2026-07-20T00:00:00.000Z" },
    ] as const) {
      expect(resolveAeroCommsAccessFromGrants([
        { entitlementKey: AEROCOMMS_PRO_ENTITLEMENT_KEY, ...grant },
      ], now, "production")).toEqual({ status: "authenticated_free", isPro: false, source: "free" });
    }
  });

  it("allows the internal override only in development and test", () => {
    expect(isAeroCommsDevelopmentOverrideEnabled("production", true)).toBe(false);
    expect(isAeroCommsDevelopmentOverrideEnabled("development", false)).toBe(false);
    expect(isAeroCommsDevelopmentOverrideEnabled("development", true)).toBe(true);
    expect(isAeroCommsDevelopmentOverrideEnabled("test", true)).toBe(true);
    expect(resolveAeroCommsAccess({
      environment: "development",
      developmentOverride: true,
    })).toEqual({
      status: "pro",
      isPro: true,
      source: "development_override",
    });
  });

  it("represents loading, anonymous, authenticated Free, and unavailable distinctly", () => {
    expect(resolveAeroCommsAccess({ identityStatus: "loading", environment: "production" }).status).toBe("loading");
    expect(resolveAeroCommsAccess({ identityStatus: "anonymous", environment: "production" }).status).toBe("anonymous_free");
    expect(resolveAeroCommsAccess({ identityStatus: "authenticated", environment: "production" }).status).toBe("authenticated_free");
    expect(resolveAeroCommsAccess({ identityStatus: "unavailable", environment: "production" }).status).toBe("unavailable");
  });

  it("drops a stale Pro snapshot after logout or account change", () => {
    const serverAccess = resolveAeroCommsAccess({
      entitlementKeys: [AEROCOMMS_PRO_ENTITLEMENT_KEY],
      identityStatus: "authenticated",
      environment: "production",
    });

    expect(reconcileAeroCommsAccess(serverAccess, "user-a", {
      status: "authenticated",
      accountId: "user-a",
    }, "production").status).toBe("pro");
    expect(reconcileAeroCommsAccess(serverAccess, "user-a", {
      status: "authenticated",
      accountId: "user-b",
    }, "production")).toEqual({ status: "authenticated_free", isPro: false, source: "free" });
    expect(reconcileAeroCommsAccess(serverAccess, "user-a", {
      status: "anonymous",
    }, "production")).toEqual({ status: "anonymous_free", isPro: false, source: "free" });
  });

  it("keeps entitlement lookup failures unavailable after Auth resolves", () => {
    const unavailable = resolveAeroCommsAccess({
      identityStatus: "unavailable",
      environment: "production",
    });

    expect(reconcileAeroCommsAccess(unavailable, null, {
      status: "authenticated",
      accountId: "user-a",
    }, "production")).toEqual({ status: "unavailable", isPro: false, source: "free" });
  });
});
