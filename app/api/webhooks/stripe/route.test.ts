import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), process: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/stripe-webhooks", () => ({
  StripeWebhookError: class StripeWebhookError extends Error {
    constructor(public kind: "configuration" | "signature" | "unavailable") { super("webhook"); }
  },
  verifyStripeWebhook: mocks.verify,
  processStripeWebhook: mocks.process,
}));

import { POST } from "./route";

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockReturnValue({ id: "evt_test", type: "checkout.session.completed" });
    mocks.process.mockResolvedValue("processed");
  });

  it("uses the raw request body after signature verification", async () => {
    const response = await POST(new Request("https://flypath.test/api/webhooks/stripe", {
      method: "POST", headers: { "stripe-signature": "t=1,v1=signed" }, body: "{\"id\":\"evt_test\"}",
    }));
    expect(response.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith("{\"id\":\"evt_test\"}", "t=1,v1=signed");
    expect(mocks.process).toHaveBeenCalledWith(expect.anything(), "{\"id\":\"evt_test\"}");
  });

  it("rejects unsigned requests and returns retryable failures without payload details", async () => {
    expect((await POST(new Request("https://flypath.test/api/webhooks/stripe", { method: "POST", body: "{}" }))).status).toBe(400);
    mocks.process.mockRejectedValue(new Error("database detail"));
    const response = await POST(new Request("https://flypath.test/api/webhooks/stripe", {
      method: "POST", headers: { "stripe-signature": "t=1,v1=signed" }, body: "{}",
    }));
    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toBe("Webhook unavailable");
  });
});
