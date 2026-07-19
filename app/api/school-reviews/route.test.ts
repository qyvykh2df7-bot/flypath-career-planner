import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  createSchoolReview: vi.fn(),
  parseSchoolReviewSubmission: vi.fn(),
  isSameOriginRequest: vi.fn(),
  getRequestOrigin: vi.fn(),
  readJsonBodyWithinLimit: vi.fn(),
  isRateLimited: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createServerClient }));
vi.mock("@/lib/school-reviews/service", () => ({
  createSchoolReview: mocks.createSchoolReview,
  SchoolReviewDataError: class SchoolReviewDataError extends Error {},
}));
vi.mock("@/lib/school-reviews/validation", () => ({
  parseSchoolReviewSubmission: mocks.parseSchoolReviewSubmission,
  SCHOOL_REVIEW_REQUEST_MAX_BODY_SIZE: 16_384,
  SchoolReviewValidationError: class SchoolReviewValidationError extends Error {},
}));
vi.mock("@/lib/tracking/server", () => ({
  getRequestOrigin: mocks.getRequestOrigin,
  isSameOriginRequest: mocks.isSameOriginRequest,
  readJsonBodyWithinLimit: mocks.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: class RequestBodyTooLargeError extends Error {},
}));
vi.mock("@/lib/school-reviews/rate-limit", () => ({ isSchoolReviewRateLimited: mocks.isRateLimited }));

import { POST } from "./route";

const input = { submissionId: "4d3c2b1a-1234-4abc-8def-1234567890ab" };

describe("POST /api/school-reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSameOriginRequest.mockReturnValue(true);
    mocks.isRateLimited.mockReturnValue(false);
    mocks.getRequestOrigin.mockReturnValue("https://flypath.test");
    mocks.readJsonBodyWithinLimit.mockResolvedValue({});
    mocks.parseSchoolReviewSubmission.mockReturnValue(input);
    mocks.createServerClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.createSchoolReview.mockResolvedValue({ status: "pending_moderation", reviewId: "review-id" });
  });

  it("uses only a server-confirmed authenticated email and never accepts a client user id", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "4d3c2b1a-1234-4abc-8def-1234567890ab", email: "pilot@example.com", email_confirmed_at: "2026-07-19" } }, error: null });
    const response = await POST(new Request("https://flypath.test/api/school-reviews", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(200);
    expect(mocks.createSchoolReview).toHaveBeenCalledWith(input, {
      kind: "authenticated", userId: "4d3c2b1a-1234-4abc-8def-1234567890ab", email: "pilot@example.com",
    }, "https://flypath.test");
  });

  it("requires an email in the anonymous path", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(new Request("https://flypath.test/api/school-reviews", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(400);
    expect(mocks.createSchoolReview).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before reading the body", async () => {
    mocks.isSameOriginRequest.mockReturnValue(false);
    const response = await POST(new Request("https://other.test/api/school-reviews", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(mocks.readJsonBodyWithinLimit).not.toHaveBeenCalled();
  });

  it("rejects a rate-limited public submission before reading the body", async () => {
    mocks.isRateLimited.mockReturnValue(true);
    const response = await POST(new Request("https://flypath.test/api/school-reviews", { method: "POST", headers: { origin: "https://flypath.test" } }));
    expect(response.status).toBe(429);
    expect(mocks.readJsonBodyWithinLimit).not.toHaveBeenCalled();
  });
});
