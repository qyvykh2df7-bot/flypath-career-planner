import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "components/career-planner/SchoolReviewStars.tsx"), "utf8");

describe("Career Planner review-star rendering", () => {
  it("renders five stars and only the approved-review count beside them", () => {
    expect(source).toContain("Array.from({ length: 5 })");
    expect(source).toContain(">({total})</span>");
    expect(source).not.toContain("/5 ·");
    expect(source).toContain("schoolReviewSummaryToFive");
    expect(source).toContain("schoolReviewSummaryStarFillPercent");
  });

  it("keeps the no-review state visible with empty stars and no fabricated score", () => {
    expect(source).toContain(">Sin opiniones</span>");
    expect(source).toContain("rating === null");
    expect(source).not.toContain("school_scores");
  });

  it("does not use editorial scores or profile-fit data", () => {
    expect(source).not.toContain("school_scores");
    expect(source).not.toContain("encajeGeneral");
  });
});
