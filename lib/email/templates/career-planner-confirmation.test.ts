import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getCareerPlannerConfirmationTemplate } from "./career-planner-confirmation";
import { getTransactionalEmailTemplate, isTransactionalTemplateKey } from ".";

describe("Career Planner confirmation template", () => {
  it("uses the approved fixed subject and no invented URL", () => {
    const template = getCareerPlannerConfirmationTemplate();

    expect(template.subject).toBe("Tu Career Planner de FlyPath está listo");
    expect(template.recipient).toEqual({ kind: "lead", subscriptionListKey: "career_planner" });
    expect(template.html).toContain("Descargar informe gratuito");
    expect(template.html).not.toMatch(/https?:\/\//);
    expect(template.text).toContain("info@flypath.es");
  });

  it("accepts only the transactional template catalog", () => {
    expect(isTransactionalTemplateKey("career_planner_confirmation")).toBe(true);
    expect(isTransactionalTemplateKey("custom_html_from_browser")).toBe(false);
    expect(getTransactionalEmailTemplate("career_planner_confirmation").key).toBe(
      "career_planner_confirmation",
    );
  });
});
