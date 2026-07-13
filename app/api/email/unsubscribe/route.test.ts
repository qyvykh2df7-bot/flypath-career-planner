import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockRequestBodyTooLargeError extends Error {}

  return {
    RequestBodyTooLargeError: MockRequestBodyTooLargeError,
    getSupabaseAdmin: vi.fn(),
    readJsonBodyWithinLimit: vi.fn(),
    unsubscribeByOpaqueToken: vi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/email/unsubscribe", () => ({ unsubscribeByOpaqueToken: mocks.unsubscribeByOpaqueToken }));
vi.mock("@/lib/tracking/server", () => ({
  readJsonBodyWithinLimit: mocks.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: mocks.RequestBodyTooLargeError,
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSupabaseAdmin.mockReturnValue({});
  mocks.unsubscribeByOpaqueToken.mockResolvedValue("processed");
});

describe("POST /api/email/unsubscribe", () => {
  it("runs only after an explicit POST and returns the same public response for invalid tokens", async () => {
    mocks.readJsonBodyWithinLimit.mockResolvedValue({ token: "invalid" });
    mocks.unsubscribeByOpaqueToken.mockResolvedValue("invalid");

    const response = await POST(new Request("https://flypath.es/api/email/unsubscribe", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.unsubscribeByOpaqueToken).toHaveBeenCalledWith({}, "invalid");
  });

  it("keeps RPC failures generic and never exposes their result or details", async () => {
    mocks.readJsonBodyWithinLimit.mockResolvedValue({ token: "opaque-token" });
    mocks.unsubscribeByOpaqueToken.mockRejectedValue(new Error("unexpected RPC result: processed"));

    const response = await POST(new Request("https://flypath.es/api/email/unsubscribe", { method: "POST" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("rejects email or internal identifiers instead of forwarding them to the service", async () => {
    mocks.readJsonBodyWithinLimit.mockResolvedValue({
      token: "opaque-token",
      email: "pilot@example.com",
      subscription_id: "private-id",
    });

    const response = await POST(new Request("https://flypath.es/api/email/unsubscribe", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(mocks.unsubscribeByOpaqueToken).not.toHaveBeenCalled();
  });

  it("handles oversized bodies before processing a token", async () => {
    mocks.readJsonBodyWithinLimit.mockRejectedValue(new mocks.RequestBodyTooLargeError());

    const response = await POST(new Request("https://flypath.es/api/email/unsubscribe", { method: "POST" }));

    expect(response.status).toBe(413);
    expect(mocks.unsubscribeByOpaqueToken).not.toHaveBeenCalled();
  });
});
