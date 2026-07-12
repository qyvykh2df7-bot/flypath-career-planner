import { afterEach, describe, expect, it, vi } from "vitest";

const leadCapture = vi.hoisted(() => {
  class MockLeadCaptureError extends Error {}

  return {
    LeadCaptureError: MockLeadCaptureError,
    insertUserEvent: vi.fn(),
    queueMentorshipInternalAlert: vi.fn(),
    queueMentorshipRequestConfirmation: vi.fn(),
    upsertLeadByEmail: vi.fn(),
    upsertLeadProductInterest: vi.fn(),
  };
});

const admin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/leads/capture-shared", () => leadCapture);
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/email/send-transactional-email", () => ({
  queueMentorshipInternalAlert: leadCapture.queueMentorshipInternalAlert,
  queueMentorshipRequestConfirmation: leadCapture.queueMentorshipRequestConfirmation,
}));

import { captureMentorshipSupportRequest } from "./capture-mentorship-support";

const ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const CONTEXT = {
  anonymous_id: ID,
  session_id: "5d3c2b1a-1234-4abc-8def-1234567890ab",
  page_path: "/mentorias",
  landing_page: "/mentorias",
  referrer: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
};

function prepareSuccessfulLeadCapture(): void {
  admin.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "product-id" }, error: null }),
      }),
    }),
  });
  leadCapture.upsertLeadByEmail.mockResolvedValue("lead-id");
  leadCapture.upsertLeadProductInterest.mockResolvedValue(undefined);
  leadCapture.queueMentorshipRequestConfirmation.mockResolvedValue("sent");
  leadCapture.queueMentorshipInternalAlert.mockResolvedValue("sent");
}

const INPUT = {
  fullName: "Pilot Example",
  normalizedEmail: "pilot@example.com",
  phone: "+34600111222",
  situation: "not_started" as const,
  helpText: "Necesito ayuda para elegir ruta.",
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("captureMentorshipSupportRequest", () => {
  it("confirma la captación aunque falle el evento y excluye PII de metadata", async () => {
    prepareSuccessfulLeadCapture();
    leadCapture.insertUserEvent.mockRejectedValue(new Error("analytics"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(captureMentorshipSupportRequest(INPUT, ID, CONTEXT)).resolves.toBeUndefined();

    expect(leadCapture.upsertLeadProductInterest).toHaveBeenCalledOnce();
    expect(leadCapture.insertUserEvent).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        idempotencyKey: ID,
        trackingContext: CONTEXT,
      }),
    );
    expect(leadCapture.insertUserEvent.mock.calls[0]?.[1].metadata).toEqual({
      interest_intent: "inquiry",
      popup_id: "mentorship_support",
      form_id: "mentorship_support",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Mentorship conversion event persistence failed.",
    );
  });

  it("acepta un evento de conversión duplicado para la misma idempotency key", async () => {
    prepareSuccessfulLeadCapture();
    leadCapture.insertUserEvent.mockResolvedValue("duplicate");

    await expect(captureMentorshipSupportRequest(INPUT, ID, CONTEXT)).resolves.toBeUndefined();
    expect(leadCapture.insertUserEvent).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ idempotencyKey: ID }),
    );
  });

  it("intenta el aviso interno aunque falle la confirmación al solicitante", async () => {
    prepareSuccessfulLeadCapture();
    leadCapture.insertUserEvent.mockResolvedValue("inserted");
    leadCapture.queueMentorshipRequestConfirmation.mockRejectedValue(new Error("user email failure"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(captureMentorshipSupportRequest(INPUT, ID, CONTEXT)).resolves.toBeUndefined();

    expect(leadCapture.queueMentorshipInternalAlert).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Mentorship confirmation email processing failed.",
    );
  });

  it("intenta la confirmación al solicitante aunque falle el aviso interno", async () => {
    prepareSuccessfulLeadCapture();
    leadCapture.insertUserEvent.mockResolvedValue("inserted");
    leadCapture.queueMentorshipInternalAlert.mockRejectedValue(new Error("internal email failure"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(captureMentorshipSupportRequest(INPUT, ID, CONTEXT)).resolves.toBeUndefined();

    expect(leadCapture.queueMentorshipRequestConfirmation).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Mentorship internal alert email processing failed.",
    );
  });
});
