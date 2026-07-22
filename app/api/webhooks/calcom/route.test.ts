import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  parse: vi.fn(),
  apply: vi.fn(),
  WebhookError: class CalcomWebhookError extends Error {
    constructor(public kind: "configuration" | "signature" | "payload" | "unavailable") { super("webhook"); }
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mentorias/calcom-webhooks", () => ({
  CalcomWebhookError: mocks.WebhookError,
  verifyCalcomWebhookSignature: mocks.verify,
  parseCalcomMentorshipWebhook: mocks.parse,
  applyCalcomMentorshipWebhook: mocks.apply,
}));

import { POST } from "./route";

const event = { triggerEvent: "BOOKING_CREATED", calBookingUid: "cal-booking-uid-1" };

describe("POST /api/webhooks/calcom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.parse.mockReturnValue(event);
    mocks.apply.mockResolvedValue("processed");
  });

  it("verifies and processes the exact raw request body", async () => {
    const response = await POST(new Request("https://flypath.test/api/webhooks/calcom", {
      method: "POST",
      headers: { "x-cal-signature-256": "signed" },
      body: '{"triggerEvent":"BOOKING_CREATED"}',
    }));
    expect(response.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith('{"triggerEvent":"BOOKING_CREATED"}', "signed");
    expect(mocks.parse).toHaveBeenCalledWith('{"triggerEvent":"BOOKING_CREATED"}');
    expect(mocks.apply).toHaveBeenCalledWith(event);
  });

  it("rejects missing or invalid signatures without attempting persistence", async () => {
    const missing = await POST(new Request("https://flypath.test/api/webhooks/calcom", { method: "POST", body: "{}" }));
    expect(missing.status).toBe(400);

    mocks.verify.mockImplementation(() => { throw new mocks.WebhookError("signature"); });
    const invalid = await POST(new Request("https://flypath.test/api/webhooks/calcom", {
      method: "POST", headers: { "x-cal-signature-256": "bad" }, body: "{}",
    }));
    expect(invalid.status).toBe(400);
    expect(mocks.apply).not.toHaveBeenCalled();
  });

  it("returns a retryable generic response when configuration or processing is unavailable", async () => {
    mocks.verify.mockImplementation(() => { throw new mocks.WebhookError("configuration"); });
    const configuration = await POST(new Request("https://flypath.test/api/webhooks/calcom", {
      method: "POST", headers: { "x-cal-signature-256": "signed" }, body: "{}",
    }));
    expect(configuration.status).toBe(503);

    mocks.verify.mockReset();
    mocks.apply.mockRejectedValue(new Error("database detail"));
    const unavailable = await POST(new Request("https://flypath.test/api/webhooks/calcom", {
      method: "POST", headers: { "x-cal-signature-256": "signed" }, body: "{}",
    }));
    expect(unavailable.status).toBe(503);
    await expect(unavailable.text()).resolves.toBe("Webhook no disponible.");
  });
});
