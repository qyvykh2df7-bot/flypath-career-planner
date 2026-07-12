import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getTransactionalEmailTemplate, isTransactionalTemplateKey } from ".";
import { getPrepplWaitlistConfirmationTemplate } from "./preppl-waitlist-confirmation";

describe("Pre-PPL waitlist confirmation template", () => {
  it("uses the approved subject and waitlist confirmation content", () => {
    const template = getPrepplWaitlistConfirmationTemplate();

    expect(template.subject).toBe("Tu plaza en la lista Pre-PPL está confirmada");
    expect(template.recipient).toEqual({ kind: "lead", subscriptionListKey: "preppl" });
    expect(template.text).toContain("lista de espera de Pre-PPL está confirmada");
    expect(template.text).toContain("novedades relevantes sobre el producto");
    expect(template.text).toContain("info@flypath.es");
  });

  it("does not invent launch dates, pricing, or undefined promises", () => {
    const template = getPrepplWaitlistConfirmationTemplate();
    const content = `${template.subject}\n${template.text}\n${template.html}`.toLowerCase();

    expect(content).not.toContain("precio");
    expect(content).not.toContain("lanzamiento");
    expect(content).not.toContain("garantizamos");
    expect(content).not.toMatch(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
    expect(content).not.toContain("€");
  });

  it("is available only through the closed transactional template catalog", () => {
    expect(isTransactionalTemplateKey("preppl_waitlist_confirmation")).toBe(true);
    expect(isTransactionalTemplateKey("preppl_waitlist_custom")).toBe(false);
    expect(getTransactionalEmailTemplate("preppl_waitlist_confirmation").key).toBe(
      "preppl_waitlist_confirmation",
    );
  });
});
