import type { PublicSchoolReviewSummary } from "./contracts";

function isValidAverage(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 10;
}

/** Converts the approved-review average from its canonical 1–10 scale to 0–5. */
export function schoolReviewAverageToFive(value: number | null): number | null {
  if (!isValidAverage(value)) return null;
  return value / 2;
}

/** A zero-review summary intentionally has no rating; it never falls back to editorial scoring. */
export function schoolReviewSummaryToFive(summary: PublicSchoolReviewSummary | undefined): number | null {
  if (!summary || summary.total <= 0) return null;
  return schoolReviewAverageToFive(summary.averageOverall);
}

/** Percentage fill for one visual star, preserving fractional approved-review averages. */
export function schoolReviewStarFillPercent(rating: number, starIndex: number): number {
  if (!Number.isFinite(rating) || !Number.isInteger(starIndex) || starIndex < 0 || starIndex >= 5) return 0;
  return Math.min(100, Math.max(0, (rating - starIndex) * 100));
}

export function formatSchoolReviewRating(rating: number): string {
  return rating.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Keeps the planner on the same approved-review batch endpoint as the comparator. */
export function buildSchoolReviewSummariesPath(slugs: readonly string[]): string | null {
  const uniqueSlugs = [...new Set(slugs.filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))];
  if (!uniqueSlugs.length) return null;
  return `/api/school-reviews/summaries?schools=${encodeURIComponent(uniqueSlugs.join(","))}`;
}
