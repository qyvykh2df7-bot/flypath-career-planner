import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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
  SchoolReviewValidationError: class SchoolReviewValidationError extends Error {
    constructor(public readonly field = "payload") {
      super("Invalid school review input");
    }
  },
}));
vi.mock("@/lib/tracking/server", () => ({
  getRequestOrigin: mocks.getRequestOrigin,
  isSameOriginRequest: mocks.isSameOriginRequest,
  readJsonBodyWithinLimit: mocks.readJsonBodyWithinLimit,
  RequestBodyTooLargeError: class RequestBodyTooLargeError extends Error {},
}));
vi.mock("@/lib/security/public-form-security", () => ({
  authorizePublicFormSubmission: vi.fn(), hasOnlyPublicFormKeys: vi.fn(() => true), isJsonRequest: vi.fn(() => true),
  PublicFormSecurityError: class PublicFormSecurityError extends Error {}, publicFormSecurityErrorResponse: vi.fn(), validatePublicFormProof: vi.fn(),
}));

import { POST } from "./route";
import { SchoolReviewValidationError } from "@/lib/school-reviews/validation";

const input = { submissionId: "4d3c2b1a-1234-4abc-8def-1234567890ab" };

describe("POST /api/school-reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSameOriginRequest.mockReturnValue(true);
    mocks.getRequestOrigin.mockReturnValue("https://flypath.test");
    mocks.readJsonBodyWithinLimit.mockResolvedValue({});
    mocks.parseSchoolReviewSubmission.mockReturnValue(input);
    mocks.createServerClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.createSchoolReview.mockResolvedValue({ status: "pending_moderation", reviewId: "review-id" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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

  it("fails closed instead of treating an authentication outage as anonymous", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("auth unavailable") });
    const response = await POST(new Request("https://flypath.test/api/school-reviews", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(503);
    expect(mocks.createSchoolReview).not.toHaveBeenCalled();
  });

  it("reports only the invalid field in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.parseSchoolReviewSubmission.mockImplementationOnce(() => {
      throw new SchoolReviewValidationError("answers.finalCost");
    });

    const response = await POST(new Request("https://flypath.test/api/school-reviews", {
      method: "POST",
      headers: { origin: "https://flypath.test" },
      body: "{}",
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No hemos podido registrar tu opinión. Inténtalo de nuevo.",
      validationField: "answers.finalCost",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] School review validation failed:",
      "answers.finalCost",
    );
  });

  it("keeps validation details out of production responses", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.parseSchoolReviewSubmission.mockImplementationOnce(() => {
      throw new SchoolReviewValidationError("bestPart");
    });

    const response = await POST(new Request("https://flypath.test/api/school-reviews", {
      method: "POST",
      headers: { origin: "https://flypath.test" },
      body: "{}",
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No hemos podido registrar tu opinión. Inténtalo de nuevo.",
    });
  });

  it("rejects cross-origin requests before reading the body", async () => {
    mocks.isSameOriginRequest.mockReturnValue(false);
    const response = await POST(new Request("https://other.test/api/school-reviews", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(mocks.readJsonBodyWithinLimit).not.toHaveBeenCalled();
  });

});
