import { describe, expect, it } from "vitest";
import type { ErrorLogItem, ReviewItem, StudySession } from "../types";
import {
  buildSubjectStudyStats,
  getSubjectMaturityPhase,
  pickSessionTypeForMaturity,
  type SubjectMaturityPhase,
  type SubjectStudyStats,
} from "./subject-maturity";

const SUBJECT_ID = "air-law";
const REFERENCE_DATE = "2026-05-19";

function stats(overrides: Partial<SubjectStudyStats> = {}): SubjectStudyStats {
  return {
    subjectId: SUBJECT_ID,
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

function studySession(
  type: StudySession["type"],
  minutes = 45,
  subjectId = SUBJECT_ID,
): StudySession {
  return {
    id: `log-${type}-${minutes}`,
    date: REFERENCE_DATE,
    subjectId,
    type,
    durationMinutes: minutes,
  };
}

function pick(params: {
  phase: SubjectMaturityPhase;
  subjectBlockIndex: number;
  stats?: Partial<SubjectStudyStats>;
  errorSlotUsed?: boolean;
  reviewSlotUsed?: boolean;
  mockSlotUsed?: boolean;
}) {
  const base = stats(params.stats);
  return pickSessionTypeForMaturity({
    phase: params.phase,
    subjectBlockIndex: params.subjectBlockIndex,
    stats: base,
    errorSlotUsed: params.errorSlotUsed ?? false,
    reviewSlotUsed: params.reviewSlotUsed ?? false,
    mockSlotUsed: params.mockSlotUsed ?? false,
  });
}

describe("getSubjectMaturityPhase", () => {
  it("asignatura sin sesiones → initial", () => {
    expect(getSubjectMaturityPhase(stats())).toBe("initial");
  });

  it("1–2 sesiones de teoría y poco banco → building", () => {
    expect(
      getSubjectMaturityPhase(
        stats({
          sessionCount: 2,
          theoryCount: 2,
          bankCount: 0,
          totalMinutes: 90,
        }),
      ),
    ).toBe("building");
  });

  it("varias sesiones de teoría y algo de banco → consolidation", () => {
    expect(
      getSubjectMaturityPhase(
        stats({
          sessionCount: 4,
          theoryCount: 3,
          bankCount: 1,
          totalMinutes: 200,
        }),
      ),
    ).toBe("consolidation");

    expect(
      getSubjectMaturityPhase(
        stats({
          sessionCount: 3,
          theoryCount: 2,
          bankCount: 1,
          totalMinutes: 160,
        }),
      ),
    ).toBe("consolidation");
  });

  it("errores pendientes → review", () => {
    expect(
      getSubjectMaturityPhase(
        stats({
          pendingErrorCount: 1,
          sessionCount: 1,
          theoryCount: 1,
          totalMinutes: 45,
        }),
      ),
    ).toBe("review");
  });

  it("repasos pendientes → review", () => {
    expect(
      getSubjectMaturityPhase(
        stats({
          pendingReviewCount: 2,
          sessionCount: 2,
          theoryCount: 2,
          bankCount: 1,
          totalMinutes: 120,
        }),
      ),
    ).toBe("review");
  });

  it("mock bajo con progreso suficiente → exam", () => {
    expect(
      getSubjectMaturityPhase(
        stats({
          sessionCount: 2,
          theoryCount: 2,
          bankCount: 1,
          totalMinutes: 120,
          progressPercent: 45,
          latestMockScore: 72,
        }),
      ),
    ).toBe("exam");
  });

  it("fecha objetivo cercana con progreso y sesiones suficientes → exam", () => {
    expect(
      getSubjectMaturityPhase(
        stats({
          sessionCount: 3,
          theoryCount: 2,
          bankCount: 1,
          totalMinutes: 150,
          progressPercent: 50,
          examDaysLeft: 20,
        }),
      ),
    ).toBe("exam");
  });

  it("buildSubjectStudyStats: repasos y errores pendientes alimentan la fase", () => {
    const built = buildSubjectStudyStats({
      subjectId: SUBJECT_ID,
      sessions: [studySession("theory")],
      reviewItems: [
        {
          id: "r1",
          subjectId: SUBJECT_ID,
          dueDate: REFERENCE_DATE,
          intervalDays: 3,
          status: "pending",
        } satisfies ReviewItem,
      ],
      errorLogItems: [
        {
          id: "e1",
          date: REFERENCE_DATE,
          subjectId: SUBJECT_ID,
          type: "concept",
          status: "pending",
        } satisfies ErrorLogItem,
      ],
      referenceDate: REFERENCE_DATE,
      progressPercent: 10,
      latestMockScore: null,
      examDaysLeft: null,
    });

    expect(built.pendingReviewCount).toBe(1);
    expect(built.pendingErrorCount).toBe(1);
    expect(getSubjectMaturityPhase(built)).toBe("review");
  });
});

describe("pickSessionTypeForMaturity", () => {
  describe("initial", () => {
    it("bloque 0 → theory", () => {
      expect(pick({ phase: "initial", subjectBlockIndex: 0 }).type).toBe("theory");
    });

    it("bloque 1 → theory", () => {
      expect(pick({ phase: "initial", subjectBlockIndex: 1 }).type).toBe("theory");
    });

    it("bloque 2 → question_bank", () => {
      expect(pick({ phase: "initial", subjectBlockIndex: 2 }).type).toBe("question_bank");
    });
  });

  describe("building", () => {
    it("primeros bloques priorizan theory", () => {
      expect(pick({ phase: "building", subjectBlockIndex: 0 }).type).toBe("theory");
      expect(pick({ phase: "building", subjectBlockIndex: 1 }).type).toBe("theory");
    });

    it("después question_bank", () => {
      expect(pick({ phase: "building", subjectBlockIndex: 2 }).type).toBe("question_bank");
      expect(pick({ phase: "building", subjectBlockIndex: 3 }).type).toBe("question_bank");
    });
  });

  describe("consolidation", () => {
    it("prioriza question_bank en los primeros bloques", () => {
      expect(pick({ phase: "consolidation", subjectBlockIndex: 0 }).type).toBe("question_bank");
      expect(pick({ phase: "consolidation", subjectBlockIndex: 1 }).type).toBe("question_bank");
    });

    it("incluye review en el tercer bloque", () => {
      expect(pick({ phase: "consolidation", subjectBlockIndex: 2 }).type).toBe("review");
    });
  });

  describe("review", () => {
    it("si hay errores → error_correction", () => {
      const result = pick({
        phase: "review",
        subjectBlockIndex: 0,
        stats: { pendingErrorCount: 2 },
      });
      expect(result.type).toBe("error_correction");
      expect(result.usedErrorSlot).toBe(true);
    });

    it("si hay repasos pendientes → review en bloques 1 y 3", () => {
      expect(
        pick({
          phase: "review",
          subjectBlockIndex: 1,
          stats: { pendingReviewCount: 2 },
        }).type,
      ).toBe("review");

      expect(
        pick({
          phase: "review",
          subjectBlockIndex: 3,
          stats: { pendingReviewCount: 2 },
          reviewSlotUsed: true,
        }).type,
      ).toBe("review");
    });

    it("sin errores en idx 0 → question_bank", () => {
      expect(
        pick({
          phase: "review",
          subjectBlockIndex: 0,
          stats: { pendingErrorCount: 0, pendingReviewCount: 0 },
        }).type,
      ).toBe("question_bank");
    });
  });

  describe("exam", () => {
    it("mock bajo en bloque 0 → mock", () => {
      const result = pick({
        phase: "exam",
        subjectBlockIndex: 0,
        stats: { latestMockScore: 70, progressPercent: 50 },
      });
      expect(result.type).toBe("mock");
      expect(result.usedMockSlot).toBe(true);
    });

    it("si mock ya usado, alterna question_bank y review", () => {
      expect(
        pick({
          phase: "exam",
          subjectBlockIndex: 1,
          stats: { latestMockScore: 70 },
          mockSlotUsed: true,
        }).type,
      ).toBe("question_bank");

      expect(
        pick({
          phase: "exam",
          subjectBlockIndex: 3,
          stats: { latestMockScore: 70 },
          mockSlotUsed: true,
        }).type,
      ).toBe("review");
    });
  });
});
