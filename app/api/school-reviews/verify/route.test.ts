import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  sameOrigin: vi.fn(),
  readBody: vi.fn(),
  authorize: vi.fn(),
  PublicFormSecurityError: class PublicFormSecurityError extends Error {
    constructor(public readonly kind: string) { super(kind); }
  },
}));
vi.mock("@/lib/school-reviews/service", () => ({
  verifySchoolReviewEmail: mocks.verify,
  SchoolReviewDataError: class SchoolReviewDataError extends Error {},
}));
vi.mock("@/lib/tracking/server", () => ({
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

describe("POST /api/school-reviews/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sameOrigin.mockReturnValue(true);
    mocks.authorize.mockResolvedValue(undefined);
    mocks.readBody.mockResolvedValue({ token: "A".repeat(43) });
  });
  it("verifies only a one-field opaque token payload", async () => {
    mocks.verify.mockResolvedValue("verified");
    const response = await POST(new Request("https://flypath.test/api/school-reviews/verify", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "verified" });
  });
  it("does not expose token lookup details for invalid links", async () => {
    mocks.verify.mockResolvedValue("invalid_or_expired");
    const response = await POST(new Request("https://flypath.test/api/school-reviews/verify", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(await response.json()).toEqual({ status: "invalid_or_expired" });
  });
  it("does not verify a token when the distributed quota rejects the request", async () => {
    const error = new mocks.PublicFormSecurityError("rate_limited");
    mocks.authorize.mockRejectedValue(error);
    const response = await POST(new Request("https://flypath.test/api/school-reviews/verify", { method: "POST", headers: { origin: "https://flypath.test" }, body: "{}" }));
    expect(response.status).toBe(429);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});
