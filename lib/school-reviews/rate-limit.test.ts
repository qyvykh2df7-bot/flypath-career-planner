import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isSchoolReviewRateLimited } from "./rate-limit";

describe("school review rate limit", () => {
  it("limits public creation without retaining request content", () => {
    const request = new Request("https://flypath.test/api/school-reviews", { headers: { "x-real-ip": "198.51.100.10" } });
    for (let index = 0; index < 6; index += 1) expect(isSchoolReviewRateLimited(request, "create", 10)).toBe(false);
    expect(isSchoolReviewRateLimited(request, "create", 10)).toBe(true);
  });
  it("keeps resend limits independent and allows a later window", () => {
    const request = new Request("https://flypath.test/api/school-reviews/resend", { headers: { "x-real-ip": "198.51.100.11" } });
    for (let index = 0; index < 4; index += 1) expect(isSchoolReviewRateLimited(request, "resend", 20)).toBe(false);
    expect(isSchoolReviewRateLimited(request, "resend", 20)).toBe(true);
    expect(isSchoolReviewRateLimited(request, "resend", 20 + 60 * 60_000)).toBe(false);
  });
});
