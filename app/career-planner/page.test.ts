import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/career-planner/page.tsx"), "utf8");

describe("Career Planner school-review presentation", () => {
  it("shows approved-review stars in the candidate-school table", () => {
    expect(source).toContain("Opiniones de alumnos");
    expect(source).toContain("SchoolReviewStars");
    expect(source).toContain("dashboardReviewSummariesBySlug");
  });

  it("keeps profile fit distinct from student reviews", () => {
    expect(source).toContain("Ajuste a tu perfil");
    expect(source).toContain("DashProfileFitScore");
    expect(source).not.toContain("DashFitIndicator");
    expect(source).not.toContain("school_scores");
  });
});
