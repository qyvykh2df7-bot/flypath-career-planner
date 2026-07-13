import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CAREER_PLANNER_MARKETING_CONSENT_TEXT } from "./career-planner-consent";
import { HOME_NEWSLETTER_MARKETING_CONSENT_TEXT } from "./home-newsletter-consent";
import { PREPPL_WAITLIST_CONSENT_TEXT } from "./preppl-consent";

describe("marketing consent copy", () => {
  it("keeps the approved text in one shared constant per public marketing flow", () => {
    expect(CAREER_PLANNER_MARKETING_CONSENT_TEXT).toBe(
      "Acepto recibir recursos y novedades de FlyPath por email. Puedo darme de baja en cualquier momento.",
    );
    expect(PREPPL_WAITLIST_CONSENT_TEXT).toBe(
      "Quiero recibir novedades sobre Pre-PPL por email. Puedo darme de baja en cualquier momento.",
    );
    expect(HOME_NEWSLETTER_MARKETING_CONSENT_TEXT).toBe(
      "Quiero recibir la newsletter y novedades de FlyPath por email. Puedo darme de baja en cualquier momento.",
    );
  });

  it("renders the shared Pre-PPL and newsletter constants instead of duplicating consent text", () => {
    const prepplModal = fs.readFileSync(
      path.join(process.cwd(), "components/home/PrePplWaitlistModal.tsx"),
      "utf8",
    );
    const newsletterForm = fs.readFileSync(
      path.join(process.cwd(), "components/home/HomeNewsletterForm.tsx"),
      "utf8",
    );

    expect(prepplModal).toContain("PREPPL_WAITLIST_CONSENT_TEXT");
    expect(newsletterForm).toContain("HOME_NEWSLETTER_MARKETING_CONSENT_TEXT");
  });
});
