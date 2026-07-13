import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getResendWebhookSecret: vi.fn(),
  verifyResendWebhook: vi.fn(),
  isProcessableResendWebhookEvent: vi.fn(),
  applyResendWebhookEvent: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/email/config", () => ({ getResendWebhookSecret: mocks.getResendWebhookSecret }));
vi.mock("@/lib/email/resend-webhooks", () => ({
  verifyResendWebhook: mocks.verifyResendWebhook,
  isProcessableResendWebhookEvent: mocks.isProcessableResendWebhookEvent,
  applyResendWebhookEvent: mocks.applyResendWebhookEvent,
}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

import { POST } from "./route";

const EVENT = {
  type: "email.delivered",
  providerEventId: "msg_9bbd20b9-6c76-4d66-96de-87f5a20a9ea3",
  providerMessageId: "8bd6fe63-f8a0-4b43-9c29-2c8335436d1f",
  occurredAt: "2026-07-12T10:00:00.000Z",
};

function createRequest(body = '{"type":"email.delivered"}', headers: HeadersInit = {}) {
  return new Request("https://flypath.es/api/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": "msg_9bbd20b9-6c76-4d66-96de-87f5a20a9ea3",
      "svix-timestamp": "1720778400",
      "svix-signature": "v1,test",
      ...headers,
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getResendWebhookSecret.mockReturnValue("whsec_test");
  mocks.verifyResendWebhook.mockReturnValue(EVENT);
  mocks.isProcessableResendWebhookEvent.mockReturnValue(true);
  mocks.applyResendWebhookEvent.mockResolvedValue("processed");
  mocks.getSupabaseAdmin.mockReturnValue({});
});

describe("POST /api/webhooks/resend", () => {
  it("uses the raw request body and all required Svix headers for verification", async () => {
    const rawBody = '{"type":"email.delivered","data":{"email_id":"message-id"}}';
    const response = await POST(createRequest(rawBody));

    expect(response.status).toBe(200);
    expect(mocks.verifyResendWebhook).toHaveBeenCalledWith({
      payload: rawBody,
      headers: {
        id: "msg_9bbd20b9-6c76-4d66-96de-87f5a20a9ea3",
        timestamp: "1720778400",
        signature: "v1,test",
      },
      webhookSecret: "whsec_test",
    });
  });

  it("returns a generic 400 for missing headers or an invalid signature", async () => {
    const missingHeaders = await POST(createRequest("{}", { "svix-id": "" }));
    expect(missingHeaders.status).toBe(400);
    expect(mocks.verifyResendWebhook).not.toHaveBeenCalled();

    mocks.verifyResendWebhook.mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const invalidSignature = await POST(createRequest());
    expect(invalidSignature.status).toBe(400);
    expect(await invalidSignature.json()).toEqual({ error: "Solicitud de webhook inválida." });
  });

  it("returns a generic 500 when the server webhook secret is unavailable", async () => {
    mocks.getResendWebhookSecret.mockImplementation(() => {
      throw new Error("missing secret");
    });

    const response = await POST(createRequest());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Webhook no disponible." });
  });

  it("ignores signed event types outside the closed catalog", async () => {
    mocks.verifyResendWebhook.mockReturnValue({ ...EVENT, type: "email.scheduled" });
    mocks.isProcessableResendWebhookEvent.mockReturnValue(false);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, ignored: true });
    expect(mocks.applyResendWebhookEvent).not.toHaveBeenCalled();
  });

  it.each(["duplicate", "delivery_not_found"])("acknowledges %s without a second update", async (result) => {
    mocks.applyResendWebhookEvent.mockResolvedValue(result);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(mocks.applyResendWebhookEvent).toHaveBeenCalledOnce();
  });

  it("keeps internal failures generic without logging webhook content", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.applyResendWebhookEvent.mockRejectedValue(new Error("pilot@example.com could not update"));

    const response = await POST(createRequest('{"recipient":"pilot@example.com"}'));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Webhook no disponible." });
    expect(error).toHaveBeenCalledWith("[FlyPath] Resend webhook processing failed.");
    error.mockRestore();
  });
});
