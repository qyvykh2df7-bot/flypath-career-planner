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

import {
  ContentOsDataError,
  ContentOsIdeaPromotionError,
  getContentOsIdeas,
  promoteContentOsIdea,
} from "./content-os";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue({
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "owner",
  });
});

describe("Content OS server-only data layer", () => {
  it("exige autorización Warhome antes de abrir el cliente admin", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));

    await expect(getContentOsIdeas()).rejects.toThrow("unauthorized");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("valida estrictamente los DTOs devueltos por Supabase", async () => {
    const ideasQuery = {
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [{ id: "not-a-uuid", title: "Unsafe" }],
            error: null,
          }),
        })),
      })),
    };
    const itemsQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    };
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => (table === "content_ideas" ? ideasQuery : itemsQuery)),
    });

    await expect(getContentOsIdeas()).rejects.toBeInstanceOf(ContentOsDataError);
  });

  it("devuelve únicamente el contrato operativo de ideas", async () => {
    const ideasQuery = {
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                title: "Idea segura",
                description: "Descripción",
                category: "aviation",
                platform: "youtube",
                objective: "authority",
                status: "approved",
                proposal_source: "manual",
                proposal_status: "approved",
                created_at: "2026-07-29T10:00:00.000Z",
                updated_at: "2026-07-29T10:00:00.000Z",
                provider_payload: "never expose",
              },
            ],
            error: null,
          }),
        })),
      })),
    };
    const itemsQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    };
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => (table === "content_ideas" ? ideasQuery : itemsQuery)),
    });

    const result = await getContentOsIdeas();
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("provider_payload");
    expect(result[0]).toMatchObject({
      title: "Idea segura",
      contentItemId: null,
      proposalSource: "manual",
    });
  });

  it("rechaza una idea descartada antes de invocar la RPC", async () => {
    const existingItemQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })),
      })),
    };
    const ideaQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { status: "discarded" }, error: null }),
        })),
      })),
    };
    const rpc = vi.fn();
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => (table === "content_items" ? existingItemQuery : ideaQuery)),
      rpc,
    });

    await expect(
      promoteContentOsIdea("11111111-1111-4111-8111-111111111111"),
    ).rejects.toBeInstanceOf(ContentOsIdeaPromotionError);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("promociona una idea válida mediante la RPC atómica", async () => {
    const existingItemQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })),
      })),
    };
    const ideaQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { status: "approved" }, error: null }),
        })),
      })),
    };
    const rpc = vi.fn().mockResolvedValue({
      data: "22222222-2222-4222-8222-222222222222",
      error: null,
    });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => (table === "content_items" ? existingItemQuery : ideaQuery)),
      rpc,
    });

    await expect(
      promoteContentOsIdea("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe("22222222-2222-4222-8222-222222222222");
    expect(rpc).toHaveBeenCalledWith("promote_content_os_idea", {
      p_idea_id: "11111111-1111-4111-8111-111111111111",
      p_admin_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
  });
});
