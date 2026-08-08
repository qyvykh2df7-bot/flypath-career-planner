import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));

import {
  consumePrePplGuideDelivery,
  getPrePplGuideDeliveryStatus,
  issuePrePplGuideDeliveryAccess,
  PRE_PPL_GUIDE_PRIVATE_ASSET_PATH,
  readPrePplGuidePdf,
} from "./pre-ppl-guide-delivery";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

describe("Pre-PPL guide delivery access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: "issued", error: null });
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
  });

  it("issues an opaque Pre-PPL token only for a valid Live or Test Stripe session", async () => {
    const result = await issuePrePplGuideDeliveryAccess("cs_live_abcdefgh", attemptId);
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.rpc).toHaveBeenCalledWith("issue_preppl_guide_delivery_access", expect.objectContaining({
      p_stripe_session_id: "cs_live_abcdefgh", p_checkout_intent_id: attemptId, p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain(result?.token ?? "");
    await expect(issuePrePplGuideDeliveryAccess("cs_unknown_abcdefgh", attemptId)).resolves.toBeNull();
  });

  it("exposes only presentation statuses and keeps the PDF private", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: "confirmed", error: null });
    await expect(getPrePplGuideDeliveryStatus("A".repeat(43))).resolves.toBe("confirmed");
    mocks.rpc.mockResolvedValueOnce({ data: "verifying", error: null });
    await expect(consumePrePplGuideDelivery("A".repeat(43))).rejects.toMatchObject({ kind: "not_confirmed" });
    expect(PRE_PPL_GUIDE_PRIVATE_ASSET_PATH).toBe("private-assets/commerce/pre-ppl-guide.pdf");
    expect(existsSync(resolve(process.cwd(), PRE_PPL_GUIDE_PRIVATE_ASSET_PATH))).toBe(true);
    expect(readFileSync(resolve(process.cwd(), PRE_PPL_GUIDE_PRIVATE_ASSET_PATH)).subarray(0, 5).toString()).toBe("%PDF-");
    await expect(readPrePplGuidePdf()).resolves.toSatisfy((pdf: Buffer) => pdf.subarray(0, 5).toString() === "%PDF-");
  });
});
