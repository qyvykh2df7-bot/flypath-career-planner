import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  readBody: vi.fn(),
}));

vi.mock("@/lib/leads/marketing-confirmation", () => ({
  confirmMarketingSubscription: mocks.confirm,
}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn(() => ({})) }));
vi.mock("@/lib/tracking/server", () => ({
  readJsonBodyWithinLimit: mocks.readBody,
  RequestBodyTooLargeError: class RequestBodyTooLargeError extends Error {},
}));
vi.mock("@/lib/security/public-form-security", () => ({
  isJsonRequest: vi.fn(() => true),
}));

import { POST } from "./route";

describe("POST /api/email/confirm-marketing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readBody.mockResolvedValue({ token: "A".repeat(43) });
  });

  it("confirms a valid opaque token without exposing the result", async () => {
    mocks.confirm.mockResolvedValue("processed");
    const response = await POST(new Request("https://flypath.test/api/email/confirm-marketing", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("keeps invalid and expired tokens indistinguishable", async () => {
    mocks.confirm.mockResolvedValue("invalid");
    const response = await POST(new Request("https://flypath.test/api/email/confirm-marketing", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns a generic temporary error when confirmation infrastructure fails", async () => {
    mocks.confirm.mockRejectedValue(new Error("rpc unavailable"));
    const response = await POST(new Request("https://flypath.test/api/email/confirm-marketing", { method: "POST" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: true });
  });
});
