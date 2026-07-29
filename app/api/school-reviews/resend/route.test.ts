import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  resend: vi.fn(),
  sameOrigin: vi.fn(),
  getOrigin: vi.fn(),
  readBody: vi.fn(),
  authorize: vi.fn(),
  PublicFormSecurityError: class PublicFormSecurityError extends Error {
    constructor(public readonly kind: string) { super(kind); }
  },
}));
vi.mock("@/lib/school-reviews/service", () => ({
  resendSchoolReviewVerification: mocks.resend,
  SchoolReviewDataError: class SchoolReviewDataError extends Error {},
}));
vi.mock("@/lib/tracking/server", () => ({
  getRequestOrigin: mocks.getOrigin,
  isSameOriginRequest: mocks.sameOrigin,
  readJsonBodyWithinLimit: mocks.readBody,
  RequestBodyTooLargeError: class RequestBodyTooLargeError extends Error {},
}));
vi.mock("@/lib/security/public-form-security", () => ({
  authorizePublicFormSubmission: mocks.authorize,
  isJsonRequest: vi.fn(() => true),
  PublicFormSecurityError: mocks.PublicFormSecurityError,
}));
import { POST } from "./route";

describe("POST /api/school-reviews/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sameOrigin.mockReturnValue(true);
    mocks.authorize.mockResolvedValue(undefined);
    mocks.getOrigin.mockReturnValue("https://flypath.test");
    mocks.readBody.mockResolvedValue({ reviewId: "4d3c2b1a-1234-4abc-8def-1234567890ab", email: "pilot@example.com" });
  });
  it("keeps email verification resends server-side and bounded by the service", async () => {
    mocks.resend.mockResolvedValue("sent");
    const response = await POST(new Request("https://flypath.test/api/school-reviews/resend", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(200);
    expect(mocks.resend).toHaveBeenCalledWith({
      reviewId: "4d3c2b1a-1234-4abc-8def-1234567890ab", email: "pilot@example.com", publicOrigin: "https://flypath.test",
    });
  });
  it("rejects malformed payloads without calling the service", async () => {
    mocks.readBody.mockResolvedValue({ reviewId: "bad" });
    const response = await POST(new Request("https://flypath.test/api/school-reviews/resend", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(400);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
  it("does not dispatch an email when the distributed quota rejects the resend", async () => {
    const error = new mocks.PublicFormSecurityError("rate_limited");
    mocks.authorize.mockRejectedValue(error);
    const response = await POST(new Request("https://flypath.test/api/school-reviews/resend", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(429);
    expect(mocks.resend).not.toHaveBeenCalled();
  });
});
