import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  requireWarhomeAdmin: vi.fn(),
  getContentOsIdeas: vi.fn(),
  getContentOsLibrary: vi.fn(),
  generateContentOsPlanningProposal: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock("@/lib/warhome/auth", () => ({
  requireWarhomeAdmin: mocks.requireWarhomeAdmin,
}));
vi.mock("@/lib/warhome/content-os", () => ({
  ContentOsDataError: class ContentOsDataError extends Error {},
  ContentOsNotFoundError: class ContentOsNotFoundError extends Error {},
  getContentOsIdeas: mocks.getContentOsIdeas,
  getContentOsLibrary: mocks.getContentOsLibrary,
}));
vi.mock("@/lib/warhome/content-os-ai-planner", () => ({
  generateContentOsPlanningProposal: mocks.generateContentOsPlanningProposal,
}));

import {
  ContentOsPlannerRateLimitError,
  createContentOsAiProposal,
  getContentOsPlannerMinIntervalSeconds,
  getContentOsAvailability,
  reviewContentOsAiProposal,
} from "./content-os-planning";

type Query = {
  select: (...args: unknown[]) => Query;
  eq: (...args: unknown[]) => Query;
  lt: (...args: unknown[]) => Query;
  gt: (...args: unknown[]) => Query;
  order: (...args: unknown[]) => Query;
  limit: (...args: unknown[]) => Promise<{ data: unknown[]; error: null }>;
};

function availabilityQuery(data: unknown[]): Query {
  const query: Query = {
    select: () => query,
    eq: () => query,
    lt: () => query,
    gt: () => query,
    order: () => query,
    limit: async () => ({ data, error: null }),
  };
  return query;
}

const availabilitySlot = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  availability_type: "recording_available",
  starts_at: "2026-08-04T08:00:00.000Z",
  ends_at: "2026-08-04T12:00:00.000Z",
  timezone: "Europe/Madrid",
  notes: null,
  created_at: "2026-08-01T08:00:00.000Z",
  updated_at: "2026-08-01T08:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue({
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "owner",
  });
  mocks.getContentOsIdeas.mockResolvedValue([]);
  mocks.getContentOsLibrary.mockResolvedValue([
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Vídeo pendiente",
      platform: "youtube",
      objective: "growth",
      status: "production",
    },
  ]);
});

describe("Content OS planning server layer", () => {
  it("exige autorización Warhome antes de consultar el roster", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));

    await expect(getContentOsAvailability()).rejects.toThrow("unauthorized");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("revisa propuestas únicamente mediante la RPC server-only", async () => {
    const proposalId = "11111111-1111-4111-8111-111111111111";
    const rpc = vi.fn().mockResolvedValue({ data: proposalId, error: null });
    mocks.getSupabaseAdmin.mockReturnValue({ rpc });

    await expect(
      reviewContentOsAiProposal(proposalId, "approved"),
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith(
      "review_content_os_planning_proposal",
      {
        p_proposal_id: proposalId,
        p_admin_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        p_decision: "approved",
      },
    );
  });

  it("usa un intervalo de generación configurable y acotado", () => {
    expect(getContentOsPlannerMinIntervalSeconds("120")).toBe(120);
    expect(getContentOsPlannerMinIntervalSeconds("1")).toBe(15);
    expect(getContentOsPlannerMinIntervalSeconds("9000")).toBe(3600);
    expect(getContentOsPlannerMinIntervalSeconds("invalid")).toBe(60);
  });

  it("detiene una generación repetida antes de llamar al proveedor IA", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "content_os_planner_rate_limited" },
    });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue(availabilityQuery([availabilitySlot])),
      rpc,
    });

    await expect(createContentOsAiProposal()).rejects.toBeInstanceOf(
      ContentOsPlannerRateLimitError,
    );
    expect(rpc).toHaveBeenCalledWith(
      "claim_content_os_planning_generation",
      expect.objectContaining({
        p_admin_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        p_min_interval_seconds: 60,
      }),
    );
    expect(mocks.generateContentOsPlanningProposal).not.toHaveBeenCalled();
  });
});
