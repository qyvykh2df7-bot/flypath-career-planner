import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { importContentOsHistoricalItem } from "./content-os-history";

const input = {
  title: "Vídeo publicado",
  platform: "youtube" as const,
  publishedOn: "2026-07-20",
  sourceUrl: "https://www.youtube.com/watch?v=123",
  description: null,
  hook: "Hook",
  cta: null,
  contentPillar: "training",
  objective: "authority" as const,
  relatedProductKey: "guide" as const,
  metrics: {
    recordedOn: "2026-07-20",
    views: 100,
    likes: 10,
    comments: 2,
    shares: 3,
    saves: 4,
    followersGained: 5,
    leadsGenerated: 1,
    salesAttributed: 0,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue({
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "owner",
  });
});

describe("Content OS historical import server layer", () => {
  it("rechaza usuarios fuera de Warhome antes de abrir Supabase", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));
    await expect(importContentOsHistoricalItem(input)).rejects.toThrow(
      "unauthorized",
    );
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("crea contenido y métricas en la RPC atómica", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "11111111-1111-4111-8111-111111111111",
      error: null,
    });
    mocks.getSupabaseAdmin.mockReturnValue({ rpc });

    await expect(importContentOsHistoricalItem(input)).resolves.toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(rpc).toHaveBeenCalledWith(
      "import_content_os_historical_item",
      expect.objectContaining({
        p_admin_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        p_platform: "youtube",
        p_published_on: "2026-07-20",
        p_metrics: expect.objectContaining({ saves: 4 }),
      }),
    );
  });
});
