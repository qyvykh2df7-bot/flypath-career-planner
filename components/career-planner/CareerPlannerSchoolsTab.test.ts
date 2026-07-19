import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "components/career-planner/CareerPlannerSchoolsTab.tsx"),
  "utf8",
);

describe("Career Planner approved school reviews", () => {
  it("uses the shared batch summaries source rather than an editorial score", () => {
    expect(source).toContain("buildSchoolReviewSummariesPath");
    expect(source).not.toContain("flypathSchoolRating");
    expect(source).toContain("schoolReviewSummaryToFive");
  });

  it("keeps the no-review state explicit and displays a partial star fill", () => {
    expect(source).toContain("Sin opiniones");
    expect(source).toContain("schoolReviewStarFillPercent");
    expect(source).toContain("summary?.total");
  });
});
