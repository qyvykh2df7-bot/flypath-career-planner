import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ issue: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/career-planner-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/career-planner-delivery")>();
  return { ...actual, issueCareerPlannerDeliveryAccess: mocks.issue };
});

import { POST } from "./route";

const origin = "https://flypath.test";
const intent = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

function request(body: unknown, cookie = `flypath_checkout_intent_career_planner=${intent}`) {
  return new Request(`${origin}/api/commerce/checkout/access`, {
    method: "POST",
    headers: { origin, cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/commerce/checkout/access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.issue.mockResolvedValue({ token: "A".repeat(43), maxAge: 60 });
  });

  it("issues an HttpOnly delivery token only when the server-owned checkout cookie matches", async () => {
    const response = await POST(request({ sessionId: "cs_test_abcdefgh" }));
    expect(response.status).toBe(200);
    expect(mocks.issue).toHaveBeenCalledWith("cs_test_abcdefgh", intent);
    expect(response.headers.get("set-cookie")).toContain("flypath_career_planner_delivery=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects free IDs and cross-origin access attempts", async () => {
    expect((await POST(request({ sessionId: "cs_test_abcdefgh" }, ""))).status).toBe(403);
    const crossOrigin = new Request(`${origin}/api/commerce/checkout/access`, {
      method: "POST",
      headers: { origin: "https://attacker.test" },
      body: JSON.stringify({ sessionId: "cs_test_abcdefgh" }),
    });
    expect((await POST(crossOrigin)).status).toBe(403);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
});
