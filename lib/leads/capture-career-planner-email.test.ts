import { afterEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => {
  class MockLeadCaptureError extends Error {}

  return {
    LeadCaptureError: MockLeadCaptureError,
    insertUserEvent: vi.fn(),
    upsertLeadByEmail: vi.fn(),
    upsertLeadProductInterest: vi.fn(),
    queueCareerPlannerConfirmation: vi.fn(),
    requestMarketingConfirmation: vi.fn(),
  };
});
const admin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/leads/capture-shared", () => dependencies);
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/leads/career-planner-consent", () => ({
  CAREER_PLANNER_MARKETING_CONSENT_TEXT: "consent",
}));
vi.mock("@/lib/email/send-transactional-email", () => ({
  queueCareerPlannerConfirmation: dependencies.queueCareerPlannerConfirmation,
}));
vi.mock("@/lib/leads/marketing-confirmation", () => ({ requestMarketingConfirmation: dependencies.requestMarketingConfirmation }));

import { captureCareerPlannerReportDownload } from "./capture-career-planner-report";

const IDEMPOTENCY_KEY = "4d3c2b1a-1234-4abc-8def-1234567890ab";

function prepareCapture() {
  admin.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "product-id" }, error: null }),
      }),
    }),
  });
  dependencies.upsertLeadByEmail.mockResolvedValue("lead-id");
  dependencies.upsertLeadProductInterest.mockResolvedValue(undefined);
  dependencies.insertUserEvent.mockResolvedValue("inserted");
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("Career Planner operational email integration", () => {
  it("queues one server-side confirmation after the valid lead capture", async () => {
    prepareCapture();
    dependencies.queueCareerPlannerConfirmation.mockResolvedValue("sent");

    await expect(
      captureCareerPlannerReportDownload("pilot@example.com", IDEMPOTENCY_KEY),
    ).resolves.toBeUndefined();

    expect(dependencies.queueCareerPlannerConfirmation).toHaveBeenCalledWith(admin, {
      leadId: "lead-id",
      idempotencyKey: IDEMPOTENCY_KEY,
    });
    expect(dependencies.requestMarketingConfirmation).not.toHaveBeenCalled();
  });

  it("does not convert a valid capture into a failure when email processing fails", async () => {
    prepareCapture();
    dependencies.queueCareerPlannerConfirmation.mockRejectedValue(new Error("provider failure"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      captureCareerPlannerReportDownload("pilot@example.com", IDEMPOTENCY_KEY),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Career Planner confirmation email processing failed.",
    );
  });

  it("starts double opt-in only after explicit consent", async () => {
      prepareCapture();

      await captureCareerPlannerReportDownload("pilot@example.com", IDEMPOTENCY_KEY, null, {
        marketingConsent: true,
        publicOrigin: "https://flypath.test",
      });

      expect(dependencies.requestMarketingConfirmation).toHaveBeenCalledWith(admin, expect.objectContaining({
        leadId: "lead-id", listKey: "career_planner",
      }));
  });
});
