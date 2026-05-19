import { describe, expect, it } from "vitest";
import { getSessionTypeLabel } from "../labels";
import {
  buildSubjectPlanningMetaMap,
  pickSessionTypeForBlock,
} from "./session-type-picker";
import type { SubjectStudyStats } from "./subject-maturity";

const REFERENCE_DATE = "2026-05-19";

function stats(overrides: Partial<SubjectStudyStats>): SubjectStudyStats {
  return {
    subjectId: overrides.subjectId ?? "air-law",
    sessionCount: 0,
    totalMinutes: 0,
    theoryCount: 0,
    bankCount: 0,
    reviewCount: 0,
    mockCount: 0,
    errorCorrectionCount: 0,
    pendingReviewCount: 0,
    pendingErrorCount: 0,
    latestMockScore: null,
    progressPercent: 0,
    examDaysLeft: null,
    ...overrides,
  };
}

describe("session-type-picker", () => {
  describe("Banco labels", () => {
    it('question_bank visible label is "Banco"', () => {
      expect(getSessionTypeLabel("question_bank")).toBe("Banco");
    });
  });

  describe("no global alternation", () => {
    it("same subjectBlockIndex, different phases → different session types", () => {
      const initialStats = stats({ subjectId: "air-law" });
      const consolidationStats = stats({
        subjectId: "meteorology",
        sessionCount: 4,
        theoryCount: 3,
        bankCount: 1,
        totalMinutes: 200,
      });

      const initialPick = pickSessionTypeForBlock({
        subjectId: "air-law",
        subjectBlockIndex: 0,
        progressPercent: 0,
        latestMockScore: null,
        pendingReviewCount: 0,
        pendingErrorCount: 0,
        phase: "initial",
        stats: initialStats,
        errorSlotUsedForSubject: false,
        reviewSlotUsedForSubject: false,
        mockSlotUsedForSubject: false,
      });

      const consolidationPick = pickSessionTypeForBlock({
        subjectId: "meteorology",
        subjectBlockIndex: 0,
        progressPercent: 60,
        latestMockScore: null,
        pendingReviewCount: 0,
        pendingErrorCount: 0,
        phase: "consolidation",
        stats: consolidationStats,
        errorSlotUsedForSubject: false,
        reviewSlotUsedForSubject: false,
        mockSlotUsedForSubject: false,
      });

      expect(initialPick.type).toBe("theory");
      expect(consolidationPick.type).toBe("question_bank");
    });

    it("buildSubjectPlanningMetaMap assigns phase per subject independently", () => {
      const meta = buildSubjectPlanningMetaMap(
        {
          sessions: [],
          referenceDate: REFERENCE_DATE,
          progressBySubject: { "air-law": 0, "meteorology": 55 },
          mockScoreBySubject: { "air-law": null, "meteorology": 72 },
          examDaysLeft: 21,
        },
        ["air-law", "meteorology"],
      );

      expect(meta.get("air-law")?.phase).toBe("initial");
      expect(meta.get("meteorology")?.phase).toBe("exam");
    });

    it("slot flags are tracked per subject, not globally", () => {
      const reviewStats = stats({
        subjectId: "air-law",
        pendingReviewCount: 1,
      });
      const initialStats = stats({ subjectId: "meteorology" });

      const airLaw = pickSessionTypeForBlock({
        subjectId: "air-law",
        subjectBlockIndex: 3,
        progressPercent: 20,
        latestMockScore: null,
        pendingReviewCount: 1,
        pendingErrorCount: 0,
        phase: "review",
        stats: reviewStats,
        errorSlotUsedForSubject: false,
        reviewSlotUsedForSubject: false,
        mockSlotUsedForSubject: false,
      });

      const meteorology = pickSessionTypeForBlock({
        subjectId: "meteorology",
        subjectBlockIndex: 3,
        progressPercent: 0,
        latestMockScore: null,
        pendingReviewCount: 0,
        pendingErrorCount: 0,
        phase: "initial",
        stats: initialStats,
        errorSlotUsedForSubject: false,
        reviewSlotUsedForSubject: false,
        mockSlotUsedForSubject: false,
      });

      expect(airLaw.type).toBe("review");
      expect(meteorology.type).toBe("theory");
    });
  });
});
