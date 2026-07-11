import { beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => {
  class MockRequestBodyTooLargeError extends Error {}

  return {
    PREPPL_WAITLIST_REQUEST_MAX_BODY_SIZE: 8_192,
    RequestBodyTooLargeError: MockRequestBodyTooLargeError,
    capturePrepplWaitlistJoin: vi.fn(),
    getRequestOrigin: vi.fn(() => "https://flypath.test"),
    isTrackingUuid: vi.fn(),
    normalizeLeadEmail: vi.fn(),
    readJsonBodyWithinLimit: vi.fn(),
    sanitizeTrackingContext: vi.fn(),
  };
});

vi.mock("@/lib/leads/capture-preppl-waitlist", () => ({
  capturePrepplWaitlistJoin: route.capturePrepplWaitlistJoin,
  PrepplWaitlistLeadCaptureError: class PrepplWaitlistLeadCaptureError extends Error {},
}));
vi.mock("@/lib/leads/normalize-email", () => ({ normalizeLeadEmail: route.normalizeLeadEmail }));
vi.mock("@/lib/tracking/events", () => ({ isTrackingUuid: route.isTrackingUuid }));
vi.mock("@/lib/tracking/server", () => ({
  getRequestOrigin: route.getRequestOrigin,
  PREPPL_WAITLIST_REQUEST_MAX_BODY_SIZE: route.PREPPL_WAITLIST_REQUEST_MAX_BODY_SIZE,
  readJsonBodyWithinLimit: route.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: route.RequestBodyTooLargeError,
  sanitizeTrackingContext: route.sanitizeTrackingContext,
}));

import { POST } from "@/app/api/leads/preppl-waitlist/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Pre-PPL waitlist route", () => {
  it("rechaza un body excesivo antes de capturar el lead", async () => {
    route.readJsonBodyWithinLimit.mockRejectedValue(new route.RequestBodyTooLargeError());

    const response = await POST(
      new Request("https://flypath.test/api/leads/preppl-waitlist", { method: "POST" }),
    );

    expect(response.status).toBe(413);
    expect(route.capturePrepplWaitlistJoin).not.toHaveBeenCalled();
  });

  it("rechaza UUID inválido y tracking saneado como PII", async () => {
    route.readJsonBodyWithinLimit.mockResolvedValue({
      email: "pilot@example.com",
      idempotency_key: "not-a-uuid",
    });
    route.normalizeLeadEmail.mockReturnValue("pilot@example.com");
    route.isTrackingUuid.mockReturnValue(false);

    const invalidKeyResponse = await POST(
      new Request("https://flypath.test/api/leads/preppl-waitlist", { method: "POST" }),
    );
    expect(invalidKeyResponse.status).toBe(400);

    route.readJsonBodyWithinLimit.mockResolvedValue({
      email: "pilot@example.com",
      idempotency_key: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      tracking: { referrer: "https://example.test/?email=pilot@example.com" },
    });
    route.isTrackingUuid.mockReturnValue(true);
    route.sanitizeTrackingContext.mockReturnValue(null);

    const piiResponse = await POST(
      new Request("https://flypath.test/api/leads/preppl-waitlist", { method: "POST" }),
    );
    expect(piiResponse.status).toBe(400);
    expect(route.capturePrepplWaitlistJoin).not.toHaveBeenCalled();
  });
});
