import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getAdmin: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));

import {
  CareerPlannerDeliveryError,
  consumeCareerPlannerDelivery,
  getCareerPlannerDeliveryStatus,
  issueCareerPlannerDeliveryAccess,
} from "./career-planner-delivery";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

describe("Career Planner delivery access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: "issued", error: null });
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
  });

  it("issues only a hashed opaque token for a server-owned session and checkout intent", async () => {
    const result = await issueCareerPlannerDeliveryAccess("cs_test_abcdefgh", attemptId);
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.rpc).toHaveBeenCalledWith("issue_career_planner_delivery_access", expect.objectContaining({
      p_stripe_session_id: "cs_test_abcdefgh",
      p_checkout_intent_id: attemptId,
      p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain(result?.token ?? "");
  });

  it("rejects missing or malformed tokens without querying Supabase", async () => {
    await expect(getCareerPlannerDeliveryStatus("invalid")).rejects.toMatchObject({ kind: "invalid" });
    await expect(consumeCareerPlannerDelivery(null)).rejects.toMatchObject({ kind: "invalid" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns only presentation statuses and blocks download until confirmation", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: "confirmed", error: null });
    await expect(getCareerPlannerDeliveryStatus("A".repeat(43))).resolves.toBe("confirmed");

    mocks.rpc.mockResolvedValueOnce({ data: "verifying", error: null });
    await expect(consumeCareerPlannerDelivery("A".repeat(43))).rejects.toMatchObject({
      kind: "not_confirmed",
    } satisfies Partial<CareerPlannerDeliveryError>);

    mocks.rpc.mockResolvedValueOnce({ data: "confirmed", error: null });
    await expect(consumeCareerPlannerDelivery("A".repeat(43))).resolves.toBeUndefined();
  });
});
