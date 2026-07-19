import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getSchoolReviewVerificationTemplate,
  SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY,
} from "./school-review-verification";

describe("school review verification template", () => {
  it("is transactional, contains the opaque verification link and does not promise marketing", () => {
    const template = getSchoolReviewVerificationTemplate({
      verificationLink: "https://flypath.test/opiniones-escuelas/verificar?token=opaque",
      expiresAt: "2026-07-21T10:00:00.000Z",
    });
    expect(template.key).toBe(SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY);
    expect(template.subject).toBe("Verifica tu opinión sobre una escuela en FlyPath");
    expect(template.text).toContain("token=opaque");
    expect(template.text).toContain("no te suscribe a comunicaciones comerciales");
    expect(template.text).not.toMatch(/precio|oferta|newsletter/i);
  });
});
