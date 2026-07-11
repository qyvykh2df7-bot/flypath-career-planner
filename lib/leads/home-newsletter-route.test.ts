import { describe, expect, it, vi } from "vitest";

const newsletter = vi.hoisted(() => {
  class MockRequestBodyTooLargeError extends Error {}

  return {
    RequestBodyTooLargeError: MockRequestBodyTooLargeError,
    captureHomeNewsletterSubscription: vi.fn(),
    getRequestOrigin: vi.fn(() => "https://flypath.test"),
    isTrackingUuid: vi.fn(),
    normalizeLeadEmail: vi.fn(),
    readJsonBodyWithinLimit: vi.fn(),
    sanitizeTrackingContext: vi.fn(),
    HOME_NEWSLETTER_REQUEST_MAX_BODY_SIZE: 8_192,
  };
});

vi.mock("@/lib/leads/capture-home-newsletter", () => ({
  captureHomeNewsletterSubscription: newsletter.captureHomeNewsletterSubscription,
  HomeNewsletterLeadCaptureError: class HomeNewsletterLeadCaptureError extends Error {},
}));
vi.mock("@/lib/leads/normalize-email", () => ({
  normalizeLeadEmail: newsletter.normalizeLeadEmail,
}));
vi.mock("@/lib/tracking/events", () => ({ isTrackingUuid: newsletter.isTrackingUuid }));
vi.mock("@/lib/tracking/server", () => ({
  getRequestOrigin: newsletter.getRequestOrigin,
  HOME_NEWSLETTER_REQUEST_MAX_BODY_SIZE: newsletter.HOME_NEWSLETTER_REQUEST_MAX_BODY_SIZE,
  readJsonBodyWithinLimit: newsletter.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: newsletter.RequestBodyTooLargeError,
  sanitizeTrackingContext: newsletter.sanitizeTrackingContext,
}));

import { POST } from "@/app/api/leads/home-newsletter/route";

describe("home newsletter route", () => {
  it("rechaza un body excesivo antes de parsearlo", async () => {
    newsletter.readJsonBodyWithinLimit.mockRejectedValue(
      new newsletter.RequestBodyTooLargeError(),
    );

    const response = await POST(
      new Request("https://flypath.test/api/leads/home-newsletter", { method: "POST" }),
    );

    expect(response.status).toBe(413);
    expect(newsletter.captureHomeNewsletterSubscription).not.toHaveBeenCalled();
  });

  it("rechaza una idempotency key que no es UUID", async () => {
    newsletter.readJsonBodyWithinLimit.mockResolvedValue({
      email: "pilot@example.com",
      idempotency_key: "not-a-uuid",
    });
    newsletter.normalizeLeadEmail.mockReturnValue("pilot@example.com");
    newsletter.isTrackingUuid.mockReturnValue(false);

    const response = await POST(
      new Request("https://flypath.test/api/leads/home-newsletter", { method: "POST" }),
    );

    expect(response.status).toBe(400);
    expect(newsletter.captureHomeNewsletterSubscription).not.toHaveBeenCalled();
  });
});
