import { describe, expect, it } from "vitest";

import type { PublicSchoolReviewSummary } from "./contracts";
import {
  buildSchoolReviewSummariesPath,
  schoolReviewAverageToFive,
  schoolReviewStarFillPercent,
  schoolReviewSummaryStarFillPercent,
  schoolReviewSummaryToFive,
} from "./presentation";

const summary = (averageOverall: number | null, total: number): PublicSchoolReviewSummary => ({
  schoolSlug: "adventia-usal",
  averageOverall,
  total,
  distribution: {},
  wouldChooseAgainPercent: null,
});

describe("school review presentation", () => {
  it("converts the approved-review 1–10 scale to five stars without editorial fallback", () => {
    expect(schoolReviewAverageToFive(10)).toBe(5);
    expect(schoolReviewAverageToFive(8)).toBe(4);
    expect(schoolReviewAverageToFive(8.6)).toBe(4.3);
    expect(schoolReviewAverageToFive(null)).toBeNull();
  });

  it("keeps zero-review schools unrated with five empty stars", () => {
    expect(schoolReviewSummaryToFive(summary(10, 0))).toBeNull();
    expect(Array.from({ length: 5 }, (_, index) => schoolReviewSummaryStarFillPercent(summary(10, 0), index))).toEqual([0, 0, 0, 0, 0]);
    expect(schoolReviewSummaryToFive(summary(8.6, 3))).toBe(4.3);
  });

  it("converts approved-review averages to exact partial star fills", () => {
    expect(schoolReviewStarFillPercent(4.3, 0)).toBe(100);
    expect(schoolReviewStarFillPercent(4.3, 4)).toBeCloseTo(30);
    expect(schoolReviewStarFillPercent(4.3, 5)).toBe(0);
    expect(Array.from({ length: 5 }, (_, index) => schoolReviewSummaryStarFillPercent(summary(8, 2), index))).toEqual([100, 100, 100, 100, 0]);
    const partialFills = Array.from({ length: 5 }, (_, index) => schoolReviewSummaryStarFillPercent(summary(8.6, 2), index));
    expect(partialFills.slice(0, 4)).toEqual([100, 100, 100, 100]);
    expect(partialFills[4]).toBeCloseTo(30);
  });

  it("builds one deduplicated batch request for review summaries", () => {
    expect(buildSchoolReviewSummariesPath(["adventia-usal", "adventia-usal", "fte-jerez"])).toBe(
      "/api/school-reviews/summaries?schools=adventia-usal%2Cfte-jerez",
    );
    expect(buildSchoolReviewSummariesPath(["bad value", ""])).toBeNull();
  });
});
