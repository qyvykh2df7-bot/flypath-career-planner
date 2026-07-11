import { beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => {
  class MockRequestBodyTooLargeError extends Error {}

  return {
    CAREER_PLANNER_REPORT_REQUEST_MAX_BODY_SIZE: 8_192,
    RequestBodyTooLargeError: MockRequestBodyTooLargeError,
    captureCareerPlannerReportDownload: vi.fn(),
    getRequestOrigin: vi.fn(() => "https://flypath.test"),
    isTrackingUuid: vi.fn(),
    normalizeLeadEmail: vi.fn(),
    readJsonBodyWithinLimit: vi.fn(),
    sanitizeTrackingContext: vi.fn(),
  };
});

vi.mock("@/lib/leads/capture-career-planner-report", () => ({
  captureCareerPlannerReportDownload: route.captureCareerPlannerReportDownload,
  CareerPlannerLeadCaptureError: class CareerPlannerLeadCaptureError extends Error {},
}));
vi.mock("@/lib/leads/career-planner-consent", () => ({
  CAREER_PLANNER_MARKETING_CONSENT_REQUIRED_MESSAGE: "consent required",
}));
vi.mock("@/lib/leads/normalize-email", () => ({ normalizeLeadEmail: route.normalizeLeadEmail }));
vi.mock("@/lib/tracking/events", () => ({ isTrackingUuid: route.isTrackingUuid }));
vi.mock("@/lib/tracking/server", () => ({
  CAREER_PLANNER_REPORT_REQUEST_MAX_BODY_SIZE: route.CAREER_PLANNER_REPORT_REQUEST_MAX_BODY_SIZE,
  getRequestOrigin: route.getRequestOrigin,
  readJsonBodyWithinLimit: route.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: route.RequestBodyTooLargeError,
  sanitizeTrackingContext: route.sanitizeTrackingContext,
}));

import { POST } from "@/app/api/leads/career-planner-report/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("career planner report route", () => {
  it("rechaza un body excesivo antes de capturar el lead", async () => {
    route.readJsonBodyWithinLimit.mockRejectedValue(new route.RequestBodyTooLargeError());

    const response = await POST(
      new Request("https://flypath.test/api/leads/career-planner-report", { method: "POST" }),
    );

    expect(response.status).toBe(413);
    expect(route.captureCareerPlannerReportDownload).not.toHaveBeenCalled();
  });

  it("rechaza una clave inválida y contexto analítico con PII", async () => {
    route.readJsonBodyWithinLimit.mockResolvedValue({
      email: "pilot@example.com",
      downloadType: "free_report",
      marketingConsent: true,
      idempotency_key: "not-a-uuid",
    });
    route.normalizeLeadEmail.mockReturnValue("pilot@example.com");
    route.isTrackingUuid.mockReturnValue(false);

    const invalidKeyResponse = await POST(
      new Request("https://flypath.test/api/leads/career-planner-report", { method: "POST" }),
    );
    expect(invalidKeyResponse.status).toBe(400);

    route.readJsonBodyWithinLimit.mockResolvedValue({
      email: "pilot@example.com",
      downloadType: "free_report",
      marketingConsent: true,
      idempotency_key: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      tracking: { utm_campaign: "pilot@example.com" },
    });
    route.isTrackingUuid.mockReturnValue(true);
    route.sanitizeTrackingContext.mockReturnValue(null);

    const piiResponse = await POST(
      new Request("https://flypath.test/api/leads/career-planner-report", { method: "POST" }),
    );
    expect(piiResponse.status).toBe(400);
    expect(route.captureCareerPlannerReportDownload).not.toHaveBeenCalled();
  });
});
