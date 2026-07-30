import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTENT_OS_BRAND_PROFILE } from "./content-os-brand-contract";

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  requireWarhomeAdmin: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock("@/lib/warhome/auth", () => ({
  requireWarhomeAdmin: mocks.requireWarhomeAdmin,
}));

import {
  getContentOsBrandProfile,
  upsertContentOsBrandProfile,
} from "./content-os-brand";

const input = {
  brandName: DEFAULT_CONTENT_OS_BRAND_PROFILE.brandName,
  brandDescription: DEFAULT_CONTENT_OS_BRAND_PROFILE.brandDescription,
  audiences: DEFAULT_CONTENT_OS_BRAND_PROFILE.audiences,
  products: DEFAULT_CONTENT_OS_BRAND_PROFILE.products,
  contentPillars: DEFAULT_CONTENT_OS_BRAND_PROFILE.contentPillars,
  objectives: DEFAULT_CONTENT_OS_BRAND_PROFILE.objectives,
  toneStyle: DEFAULT_CONTENT_OS_BRAND_PROFILE.toneStyle,
  tonePersonality: DEFAULT_CONTENT_OS_BRAND_PROFILE.tonePersonality,
  toneCommunication: DEFAULT_CONTENT_OS_BRAND_PROFILE.toneCommunication,
  toneAvoid: DEFAULT_CONTENT_OS_BRAND_PROFILE.toneAvoid,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue({
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "owner",
  });
});

describe("Content OS Brand DNA server layer", () => {
  it("exige Warhome antes de leer Brand DNA", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));
    await expect(getContentOsBrandProfile()).rejects.toThrow("unauthorized");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("crea o edita la misma configuración privada mediante upsert", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: "pilotfeliu", error: null });
    mocks.getSupabaseAdmin.mockReturnValue({ rpc });

    await expect(upsertContentOsBrandProfile(input)).resolves.toBeUndefined();
    await expect(
      upsertContentOsBrandProfile({
        ...input,
        toneStyle: "Directo, educativo y cercano.",
      }),
    ).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith(
      "upsert_content_os_brand_profile",
      expect.objectContaining({
        p_tone_style: "Directo, educativo y cercano.",
      }),
    );
  });
});
