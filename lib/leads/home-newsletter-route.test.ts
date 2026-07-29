import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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
    authorizePublicFormSubmission: vi.fn(),
    validatePublicFormProof: vi.fn(),
    publicFormSecurityErrorResponse: vi.fn(),
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
vi.mock("@/lib/security/public-form-security", () => ({
  authorizePublicFormSubmission: newsletter.authorizePublicFormSubmission,
  hasOnlyPublicFormKeys: vi.fn(() => true),
  isJsonRequest: vi.fn(() => true),
  PublicFormSecurityError: class PublicFormSecurityError extends Error {},
  publicFormSecurityErrorResponse: newsletter.publicFormSecurityErrorResponse,
  validatePublicFormProof: newsletter.validatePublicFormProof,
}));

import { POST } from "@/app/api/leads/home-newsletter/route";

describe("home newsletter route", () => {
  it("does not capture or queue email when the distributed quota rejects the submission", async () => {
    newsletter.readJsonBodyWithinLimit.mockResolvedValue({
      email: "pilot@example.com",
      idempotency_key: "5d3c2b1a-1234-4abc-8def-1234567890ab",
      honeypot: "",
      form_started_at: Date.now() - 2_000,
    });
    newsletter.normalizeLeadEmail.mockReturnValue("pilot@example.com");
    newsletter.isTrackingUuid.mockReturnValue(true);
    newsletter.authorizePublicFormSubmission.mockRejectedValue(new Error("limited"));
    newsletter.publicFormSecurityErrorResponse.mockReturnValue(Response.json({ error: "limited" }, { status: 429 }));

    const response = await POST(new Request("https://flypath.test/api/leads/home-newsletter", { method: "POST" }));

    expect(response.status).toBe(429);
    expect(newsletter.captureHomeNewsletterSubscription).not.toHaveBeenCalled();
  });

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
