import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));

import {
  COMO_SER_PILOTO_GUIDE_PRIVATE_ASSET_PATH,
  ComoSerPilotoGuideDeliveryError,
  consumeComoSerPilotoGuideDelivery,
  getComoSerPilotoGuideDeliveryStatus,
  issueComoSerPilotoGuideDeliveryAccess,
  readComoSerPilotoGuidePdf,
} from "./como-ser-piloto-guide-delivery";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

describe("Cómo ser Piloto guide delivery access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: "issued", error: null });
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
  });

  it("issues only a hashed opaque guide token for the guide-specific RPC", async () => {
    const result = await issueComoSerPilotoGuideDeliveryAccess("cs_test_abcdefgh", attemptId);
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.rpc).toHaveBeenCalledWith("issue_como_ser_piloto_guide_delivery_access", expect.objectContaining({
      p_stripe_session_id: "cs_test_abcdefgh",
      p_checkout_intent_id: attemptId,
      p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain(result?.token ?? "");
  });

  it("returns only presentation statuses and never reads a Career Planner token", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: "confirmed", error: null });
    await expect(getComoSerPilotoGuideDeliveryStatus("A".repeat(43))).resolves.toBe("confirmed");
    mocks.rpc.mockResolvedValueOnce({ data: "verifying", error: null });
    await expect(consumeComoSerPilotoGuideDelivery("A".repeat(43))).rejects.toMatchObject({
      kind: "not_confirmed",
    } satisfies Partial<ComoSerPilotoGuideDeliveryError>);
  });

  it("keeps the PDF outside public and verifies its real PDF signature before delivery", async () => {
    expect(COMO_SER_PILOTO_GUIDE_PRIVATE_ASSET_PATH).toBe("private-assets/commerce/como-ser-piloto-guide.pdf");
    expect(existsSync(resolve(process.cwd(), "public/GUIA COMPLETA COMO SER PILOTO.PDF"))).toBe(false);
    expect(readFileSync(resolve(process.cwd(), COMO_SER_PILOTO_GUIDE_PRIVATE_ASSET_PATH)).subarray(0, 5).toString()).toBe("%PDF-");
    await expect(readComoSerPilotoGuidePdf()).resolves.toSatisfy((pdf: Buffer) => pdf.subarray(0, 5).toString() === "%PDF-");
  });
});
