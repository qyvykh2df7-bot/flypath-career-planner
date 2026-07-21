import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ issue: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/como-ser-piloto-guide-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/como-ser-piloto-guide-delivery")>();
  return { ...actual, issueComoSerPilotoGuideDeliveryAccess: mocks.issue };
});

import { POST } from "./route";

const origin = "https://flypath.test";
const intent = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

function request(body: unknown, cookie = `flypath_checkout_intent_como_ser_piloto_guide=${intent}`) {
  return new Request(`${origin}/api/commerce/guide/access`, {
    method: "POST",
    headers: { origin, cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/commerce/guide/access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.issue.mockResolvedValue({ token: "A".repeat(43), maxAge: 60 });
  });

  it("issues an isolated HttpOnly guide delivery token only for its own checkout intent", async () => {
    const response = await POST(request({ sessionId: "cs_test_guide" }));
    expect(response.status).toBe(200);
    expect(mocks.issue).toHaveBeenCalledWith("cs_test_guide", intent);
    expect(response.headers.get("set-cookie")).toContain("flypath_como_ser_piloto_guide_delivery=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects a Career Planner intent cookie and cross-origin access", async () => {
    expect((await POST(request({ sessionId: "cs_test_guide" }, `flypath_checkout_intent_career_planner=${intent}`))).status).toBe(403);
    const crossOrigin = new Request(`${origin}/api/commerce/guide/access`, {
      method: "POST",
      headers: { origin: "https://attacker.test", "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_test_guide" }),
    });
    expect((await POST(crossOrigin)).status).toBe(403);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
});
