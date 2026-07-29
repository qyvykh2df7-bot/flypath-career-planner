import { afterEach, describe, expect, it, vi } from "vitest";

const leadCapture = vi.hoisted(() => {
  class MockLeadCaptureError extends Error {}

  return {
    LeadCaptureError: MockLeadCaptureError,
    insertUserEvent: vi.fn(),
    upsertLeadByEmail: vi.fn(),
    upsertLeadProductInterest: vi.fn(),
  };
});

const admin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/leads/capture-shared", () => leadCapture);
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/leads/career-planner-consent", () => ({
  CAREER_PLANNER_MARKETING_CONSENT_TEXT: "consent",
}));

import { captureCareerPlannerReportDownload } from "./capture-career-planner-report";
import { capturePrepplWaitlistJoin } from "./capture-preppl-waitlist";

const ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const CONTEXT = {
  anonymous_id: ID,
  session_id: "5d3c2b1a-1234-4abc-8def-1234567890ab",
  page_path: "/career-planner",
  landing_page: "/career-planner",
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
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("tracked lead conversions", () => {
  it("confirma el informe de Career Planner aunque falle su evento analítico", async () => {
    prepareSuccessfulLeadCapture();
    leadCapture.insertUserEvent.mockRejectedValue(new Error("analytics"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      captureCareerPlannerReportDownload("pilot@example.com", ID, CONTEXT),
    ).resolves.toBeUndefined();

    expect(leadCapture.insertUserEvent).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        idempotencyKey: ID,
        trackingContext: CONTEXT,
        metadata: { download_type: "free_report", form_id: "career_planner_report" },
      }),
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Career Planner conversion event persistence failed.",
    );
  });

  it("mantiene Pre-PPL válida cuando el evento es duplicado y no reenvía PII", async () => {
    prepareSuccessfulLeadCapture();
    leadCapture.insertUserEvent.mockResolvedValue("duplicate");

    await expect(capturePrepplWaitlistJoin("pilot@example.com", ID, CONTEXT)).resolves.toBeUndefined();

    expect(leadCapture.insertUserEvent).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        idempotencyKey: ID,
        trackingContext: CONTEXT,
        metadata: {
          popup_id: "preppl_waitlist",
          form_id: "preppl_waitlist",
          product_key: "preppl_guide",
        },
      }),
    );
  });
});
