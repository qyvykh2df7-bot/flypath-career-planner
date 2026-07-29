import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  requireWarhomeAdmin: vi.fn(),
  generateContentOsStrategy: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock("@/lib/warhome/auth", () => ({
  requireWarhomeAdmin: mocks.requireWarhomeAdmin,
}));
vi.mock("@/lib/warhome/content-os-ai-strategist", () => ({
  generateContentOsStrategy: mocks.generateContentOsStrategy,
}));

import {
  ContentOsStrategistRateLimitError,
  createContentOsStrategyProposals,
  getContentOsStrategistMinIntervalSeconds,
  getContentOsStrategistWorkspace,
  reviewContentOsStrategyProposal,
} from "./content-os-strategy";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue({
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "owner",
  });
});

describe("Content OS strategy server layer", () => {
  it("exige autorización Warhome antes de consultar datos privados", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));

    await expect(getContentOsStrategistWorkspace()).rejects.toThrow(
      "unauthorized",
    );
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it.each(["approved", "rejected"] as const)(
    "revisa una propuesta con decisión %s mediante la RPC atómica",
    async (decision) => {
      const proposalId = "11111111-1111-4111-8111-111111111111";
      const rpc = vi.fn().mockResolvedValue({
        data: proposalId,
        error: null,
      });
      mocks.getSupabaseAdmin.mockReturnValue({ rpc });

      await expect(
        reviewContentOsStrategyProposal(proposalId, decision),
      ).resolves.toBeUndefined();
      expect(rpc).toHaveBeenCalledWith(
        "review_content_os_strategy_proposal",
        {
          p_idea_id: proposalId,
          p_admin_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          p_decision: decision,
        },
      );
    },
  );

  it("mantiene el límite de generación configurable y acotado", () => {
    expect(getContentOsStrategistMinIntervalSeconds("120")).toBe(120);
    expect(getContentOsStrategistMinIntervalSeconds("1")).toBe(15);
    expect(getContentOsStrategistMinIntervalSeconds("9000")).toBe(3600);
    expect(getContentOsStrategistMinIntervalSeconds("invalid")).toBe(60);
  });

  it("detiene una generación repetida antes de llamar al proveedor IA", async () => {
    const ideasLimit = vi.fn().mockResolvedValue({ data: [], error: null });
    const itemsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "content_os_strategist_rate_limited" },
    });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "content_ideas"
          ? {
              select: () => ({
                order: () => ({ limit: ideasLimit }),
              }),
            }
          : {
              select: () => ({
                eq: () => ({
                  order: () => ({ limit: itemsLimit }),
                }),
              }),
            },
      ),
      rpc,
    });

    await expect(
      createContentOsStrategyProposals({
        growth: 40,
        authority: 30,
        community: 20,
        conversion: 10,
      }),
    ).rejects.toBeInstanceOf(ContentOsStrategistRateLimitError);
    expect(mocks.generateContentOsStrategy).not.toHaveBeenCalled();
  });
});
