import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ issue: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/pre-ppl-guide-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/pre-ppl-guide-delivery")>();
  return { ...actual, issuePrePplGuideDeliveryAccess: mocks.issue };
});

import { POST } from "./route";

const origin = "https://flypath.test";
const intent = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

function request(body: unknown, cookie = `flypath_checkout_intent_preppl_guide=${intent}`) {
  return new Request(`${origin}/api/commerce/pre-ppl/access`, {
    method: "POST", headers: { origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

describe("POST /api/commerce/pre-ppl/access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.issue.mockResolvedValue({ token: "A".repeat(43), maxAge: 60 });
  });

  it("issues an isolated HttpOnly Pre-PPL delivery token only for its own checkout intent", async () => {
    const response = await POST(request({ sessionId: "cs_live_preppl" }));
    expect(response.status).toBe(200);
    expect(mocks.issue).toHaveBeenCalledWith("cs_live_preppl", intent);
    expect(response.headers.get("set-cookie")).toContain("flypath_preppl_guide_delivery=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects another product's intent cookie before the delivery RPC", async () => {
    const response = await POST(request({ sessionId: "cs_live_preppl" }, `flypath_checkout_intent_como_ser_piloto_guide=${intent}`));
    expect(response.status).toBe(403);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
});
