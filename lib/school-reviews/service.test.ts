import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { calculateSchoolReviewAggregates } from "./service";
import type { SchoolReviewPublicDto } from "./contracts";

const approvedReview = (overall: number, wouldChooseAgain: "yes" | "no"): SchoolReviewPublicDto => ({
  reviewId: `review-${overall}`,
  schoolId: "school-id",
  displayAuthor: "Opinión anónima verificada",
  relationship: "former_student",
  programPhase: null,
  approximateYear: 2024,
  ratings: { general: overall, costs: 8, availability: 7, organization: 8, instructors: 9, support: 7, contract: 6 },
  answers: { finalCost: "partial", contractBeforePayment: "yes", refundClarity: "unknown", wouldChooseAgain },
  bestPart: "Una experiencia suficientemente detallada para el contrato público.",
  improvements: "Una mejora suficientemente detallada para el contrato público.",
  advice: "Un consejo suficientemente detallado para el contrato público.",
  approvedAt: "2026-07-19T10:00:00.000Z",
});

describe("school review public aggregate contract", () => {
  it("calculates dynamic aggregates only from approved DTOs without private identity", () => {
    const aggregates = calculateSchoolReviewAggregates([approvedReview(8, "yes"), approvedReview(6, "no")]);
    expect(aggregates).toMatchObject({ total: 2, averageOverall: 7, wouldChooseAgainPercent: 50 });
    expect(aggregates.distribution[8]).toBe(1);
    expect(aggregates.distribution[6]).toBe(1);
    expect(JSON.stringify(aggregates)).not.toMatch(/email|hash|user_id|moderation/i);
  });

  it("returns safe empty aggregates rather than fabricated scores", () => {
    expect(calculateSchoolReviewAggregates([])).toEqual({
      total: 0,
      averageOverall: null,
      averages: {},
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
      wouldChooseAgainPercent: null,
    });
  });

  it("keeps the public DTO contract free from private identity and moderation fields", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/school-reviews/service.ts"), "utf8");
    const publicSelect = source.match(/select\([\s\S]*?"([^"]+)"\,[\s\S]*?\)\.eq\("school_id"/)?.[1] ?? "";
    expect(publicSelect).not.toMatch(/author_email|author_email_hash|user_id|moderation_note|moderator_user_id/i);
  });
});
