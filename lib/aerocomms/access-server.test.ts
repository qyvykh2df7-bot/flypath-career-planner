import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFlyPathSessionState: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  entitlementMaybeSingle: vi.fn(),
  grantsEq: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getFlyPathSessionState: mocks.getFlyPathSessionState }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

import { getAeroCommsAccess } from "./access-server";

const userId = "11111111-1111-4111-8111-111111111111";

function configureAdmin() {
  const entitlementEqActive = vi.fn(() => ({ maybeSingle: mocks.entitlementMaybeSingle }));
  const entitlementEqKey = vi.fn(() => ({ eq: entitlementEqActive }));
  const grantsEqBeneficiary = vi.fn(() => ({ eq: mocks.grantsEq }));

  mocks.getSupabaseAdmin.mockReturnValue({
    from: vi.fn((table: string) => table === "entitlements"
      ? { select: vi.fn(() => ({ eq: entitlementEqKey })) }
      : { select: vi.fn(() => ({ eq: grantsEqBeneficiary })) }),
  });
}

describe("AeroComms access server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFlyPathSessionState.mockResolvedValue({
      status: "authenticated",
      account: { id: userId, email: null },
    });
    mocks.entitlementMaybeSingle.mockResolvedValue({ data: { id: "22222222-2222-4222-8222-222222222222" }, error: null });
    mocks.grantsEq.mockResolvedValue({ data: [], error: null });
    configureAdmin();
  });

  it("returns Pro from an active grant assigned to the validated account", async () => {
    mocks.grantsEq.mockResolvedValue({
      data: [{
        status: "active",
        starts_at: "2026-07-20T00:00:00.000Z",
        ends_at: "2026-08-20T00:00:00.000Z",
        revoked_at: null,
      }],
      error: null,
    });

    await expect(getAeroCommsAccess({ environment: "production" })).resolves.toEqual({
      status: "authenticated",
      accountId: userId,
      access: { status: "pro", isPro: true, source: "entitlement" },
    });
  });

  it("keeps an authenticated account Free when no entitlement exists", async () => {
    mocks.entitlementMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getAeroCommsAccess({ environment: "production" })).resolves.toEqual({
      status: "authenticated",
      accountId: userId,
      access: { status: "authenticated_free", isPro: false, source: "free" },
    });
  });

  it("does not query Commerce for anonymous or unavailable identity", async () => {
    mocks.getFlyPathSessionState.mockResolvedValueOnce({ status: "anonymous" });
    await expect(getAeroCommsAccess({ environment: "production" })).resolves.toMatchObject({
      status: "anonymous",
      accountId: null,
      access: { status: "anonymous_free", isPro: false, source: "free" },
    });
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();

    mocks.getFlyPathSessionState.mockResolvedValueOnce({ status: "unavailable" });
    await expect(getAeroCommsAccess({ environment: "production" })).resolves.toMatchObject({
      status: "unavailable",
      accountId: null,
      access: { status: "unavailable", isPro: false, source: "free" },
    });
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("fails closed when Commerce is unavailable", async () => {
    mocks.grantsEq.mockResolvedValue({ data: null, error: new Error("database unavailable") });

    await expect(getAeroCommsAccess({ environment: "production" })).resolves.toEqual({
      status: "unavailable",
      accountId: null,
      access: { status: "unavailable", isPro: false, source: "free" },
    });
  });
});
