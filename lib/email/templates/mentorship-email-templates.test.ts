import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getMentorshipInternalAlertTemplate } from "./mentorship-internal-alert";
import { getMentorshipRequestConfirmationTemplate } from "./mentorship-request-confirmation";

describe("mentorship email templates", () => {
  it("confirms receipt without invented timing, acceptance, price, or availability", () => {
    const template = getMentorshipRequestConfirmationTemplate();
    const content = `${template.subject}\n${template.text}\n${template.html}`.toLowerCase();

    expect(template.subject).toBe("Hemos recibido tu solicitud de acompañamiento");
    expect(template.recipient).toEqual({ kind: "lead", subscriptionListKey: null });
    expect(content).toContain("revisará la información");
    expect(content).not.toContain("precio");
    expect(content).not.toContain("disponibilidad");
    expect(content).not.toContain("plazo");
    expect(content).not.toContain("aceptada");
    expect(content).not.toMatch(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
  });

  it("renders the internal alert PII only in the in-memory template and escapes HTML", () => {
    const template = getMentorshipInternalAlertTemplate({
      fullName: "Pilot <Example>",
      email: "pilot@example.com",
      phone: "+34600111222",
      situation: "not_started",
      helpText: "Necesito <ayuda> para mi ruta.",
      receivedAt: "2026-07-12T12:00:00.000Z",
    });

    expect(template.subject).toBe("Nueva solicitud de acompañamiento en FlyPath");
    expect(template.recipient).toEqual({ kind: "internal" });
    expect(template.text).toContain("pilot@example.com");
    expect(template.html).toContain("Pilot &lt;Example&gt;");
    expect(template.html).toContain("Necesito &lt;ayuda&gt; para mi ruta.");
    expect(template.html).not.toContain("Pilot <Example>");
  });
});
