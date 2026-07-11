import { describe, expect, it, vi } from "vitest";

const leadCapture = vi.hoisted(() => {
  class MockLeadCaptureError extends Error {}

  return {
    LeadCaptureError: MockLeadCaptureError,
    insertUserEvent: vi.fn(),
    upsertEmailSubscriptionForLead: vi.fn(),
    upsertLeadByEmail: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/leads/capture-shared", () => leadCapture);
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock("@/lib/leads/home-newsletter-consent", () => ({
  HOME_NEWSLETTER_MARKETING_CONSENT_TEXT: "consent",
}));

import { captureHomeNewsletterSubscription } from "./capture-home-newsletter";

describe("captureHomeNewsletterSubscription", () => {
  it("confirma la suscripción aunque falle el evento analítico", async () => {
    leadCapture.upsertLeadByEmail.mockResolvedValue("lead-id");
    leadCapture.upsertEmailSubscriptionForLead.mockResolvedValue(undefined);
    leadCapture.insertUserEvent.mockRejectedValue(new leadCapture.LeadCaptureError());
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      captureHomeNewsletterSubscription(
        "pilot@example.com",
        "4d3c2b1a-1234-4abc-8def-1234567890ab",
      ),
    ).resolves.toBeUndefined();

    expect(leadCapture.upsertEmailSubscriptionForLead).toHaveBeenCalledOnce();
    expect(leadCapture.insertUserEvent).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Newsletter conversion event persistence failed.",
    );
    consoleError.mockRestore();
  });
});
