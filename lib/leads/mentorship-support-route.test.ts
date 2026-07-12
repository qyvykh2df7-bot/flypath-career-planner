import { beforeEach, describe, expect, it, vi } from "vitest";

const ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";

const route = vi.hoisted(() => {
  class MockRequestBodyTooLargeError extends Error {}

  return {
    MENTORSHIP_SUPPORT_REQUEST_MAX_BODY_SIZE: 8_192,
    RequestBodyTooLargeError: MockRequestBodyTooLargeError,
    captureMentorshipSupportRequest: vi.fn(),
    getRequestOrigin: vi.fn(() => "https://flypath.test"),
    isMentorshipSupportSituation: vi.fn(),
    isTrackingUuid: vi.fn(),
    normalizeLeadEmail: vi.fn(),
    readJsonBodyWithinLimit: vi.fn(),
    sanitizeTrackingContext: vi.fn(),
  };
});

vi.mock("@/lib/leads/capture-mentorship-support", () => ({
  captureMentorshipSupportRequest: route.captureMentorshipSupportRequest,
  MentorshipSupportLeadCaptureError: class MentorshipSupportLeadCaptureError extends Error {},
}));
vi.mock("@/lib/leads/mentorship-support-consent", () => ({
  isMentorshipSupportSituation: route.isMentorshipSupportSituation,
}));
vi.mock("@/lib/leads/normalize-email", () => ({ normalizeLeadEmail: route.normalizeLeadEmail }));
vi.mock("@/lib/tracking/events", () => ({ isTrackingUuid: route.isTrackingUuid }));
vi.mock("@/lib/tracking/server", () => ({
  getRequestOrigin: route.getRequestOrigin,
  MENTORSHIP_SUPPORT_REQUEST_MAX_BODY_SIZE: route.MENTORSHIP_SUPPORT_REQUEST_MAX_BODY_SIZE,
  readJsonBodyWithinLimit: route.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: route.RequestBodyTooLargeError,
  sanitizeTrackingContext: route.sanitizeTrackingContext,
}));

import { POST } from "@/app/api/leads/mentorship-support/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mentorship support route", () => {
  it("rechaza un body excesivo antes de procesar la solicitud", async () => {
    route.readJsonBodyWithinLimit.mockRejectedValue(new route.RequestBodyTooLargeError());

    const response = await POST(
      new Request("https://flypath.test/api/leads/mentorship-support", { method: "POST" }),
    );

    expect(response.status).toBe(413);
    expect(route.captureMentorshipSupportRequest).not.toHaveBeenCalled();
  });

  it("rechaza UUID inválido y contexto con PII disfrazada", async () => {
    route.readJsonBodyWithinLimit.mockResolvedValue({
      fullName: "Pilot Example",
      email: "pilot@example.com",
      situation: "not_started",
      helpText: "Necesito ayuda.",
      idempotency_key: "not-a-uuid",
    });
    route.normalizeLeadEmail.mockReturnValue("pilot@example.com");
    route.isMentorshipSupportSituation.mockReturnValue(true);
    route.isTrackingUuid.mockReturnValue(false);

    const invalidKeyResponse = await POST(
      new Request("https://flypath.test/api/leads/mentorship-support", { method: "POST" }),
    );
    expect(invalidKeyResponse.status).toBe(400);

    route.readJsonBodyWithinLimit.mockResolvedValue({
      fullName: "Pilot Example",
      email: "pilot@example.com",
      situation: "not_started",
      helpText: "Necesito ayuda.",
      idempotency_key: ID,
      tracking: { utm_campaign: "pilot@example.com" },
    });
    route.isTrackingUuid.mockReturnValue(true);
    route.sanitizeTrackingContext.mockReturnValue(null);

    const piiResponse = await POST(
      new Request("https://flypath.test/api/leads/mentorship-support", { method: "POST" }),
    );
    expect(piiResponse.status).toBe(400);
    expect(route.captureMentorshipSupportRequest).not.toHaveBeenCalled();
  });
});
