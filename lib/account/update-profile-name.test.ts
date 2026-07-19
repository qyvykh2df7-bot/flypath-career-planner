import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bootstrapFlyPathIdentity: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/account/bootstrap", () => ({ bootstrapFlyPathIdentity: mocks.bootstrapFlyPathIdentity }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));

import { saveAuthenticatedFlyPathProfileName } from "./update-profile-name";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "account-a" } }, error: null });
  mocks.bootstrapFlyPathIdentity.mockResolvedValue({ status: "ready" });
  mocks.createSupabaseServerClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })),
  });
});

describe("saveAuthenticatedFlyPathProfileName", () => {
  it("updates only the authenticated user's own profile after an explicit request", async () => {
    await expect(saveAuthenticatedFlyPathProfileName("  Paco  ")).resolves.toEqual({
      status: "success", fullName: "Paco",
    });
  });

  it("rejects an invalid proposal without contacting Supabase", async () => {
    await expect(saveAuthenticatedFlyPathProfileName("   ")).resolves.toEqual({ status: "invalid" });
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("does not update a profile when the cookie identity is unavailable", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(saveAuthenticatedFlyPathProfileName("Paco")).resolves.toEqual({ status: "unavailable" });
    expect(mocks.bootstrapFlyPathIdentity).not.toHaveBeenCalled();
  });
});
