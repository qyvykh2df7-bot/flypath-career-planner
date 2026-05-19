import { describe, expect, it } from "vitest";
import type { ExamDate } from "../types";
import { getSubjectMaturityPhase } from "./subject-maturity";
import { buildSubjectStudyStats } from "./subject-maturity";
import {
  buildExamDaysLeftBySubject,
  resolveExamDaysLeftForSubject,
} from "./exam-date-pressure";
import { rankSubjectsByPriority } from "./planning-engine";
import type { PlanningEngineInput } from "./planning-types";

const REFERENCE_DATE = "2026-05-19";
const SUBJECT_A = "atpl-air-law";
const SUBJECT_B = "atpl-meteorology";

function baseInput(overrides: Partial<PlanningEngineInput> = {}): PlanningEngineInput {
  return {
    mode: "atpl",
    activeSubjectIds: [SUBJECT_A, SUBJECT_B],
    weeklyGoalMinutes: 600,
    weekStartDate: "2026-05-19",
    referenceDate: REFERENCE_DATE,
    sessions: [],
    mockResults: [],
    ...overrides,
  };
}

function maturityStats(examDaysLeft: number | null) {
  return buildSubjectStudyStats({
    subjectId: SUBJECT_A,
    sessions: [
      {
        id: "s1",
        date: REFERENCE_DATE,
        subjectId: SUBJECT_A,
        type: "theory",
        durationMinutes: 60,
      },
      {
        id: "s2",
        date: REFERENCE_DATE,
        subjectId: SUBJECT_A,
        type: "theory",
        durationMinutes: 60,
      },
      {
        id: "s3",
        date: REFERENCE_DATE,
        subjectId: SUBJECT_A,
        type: "question_bank",
        durationMinutes: 45,
      },
    ],
    referenceDate: REFERENCE_DATE,
    progressPercent: 50,
    latestMockScore: null,
    examDaysLeft,
  });
}

describe("exam-date-pressure", () => {
  it("subject with own nearby examDate uses it for examDaysLeft", () => {
    const exams: ExamDate[] = [{ id: "e1", subjectId: SUBJECT_A, date: "2026-06-08" }];
    const days = resolveExamDaysLeftForSubject(
      SUBJECT_A,
      exams,
      "2026-12-01",
      REFERENCE_DATE,
    );
    expect(days).toBe(20);
    expect(getSubjectMaturityPhase(maturityStats(days))).toBe("exam");
  });

  it("subject without own examDate falls back to global targetExamDate", () => {
    const days = resolveExamDaysLeftForSubject(
      SUBJECT_A,
      [],
      "2026-06-08",
      REFERENCE_DATE,
    );
    expect(days).toBe(20);
  });

  it("subject with far own examDate does not use global for premature exam pressure", () => {
    const exams: ExamDate[] = [{ id: "e1", subjectId: SUBJECT_A, date: "2026-10-01" }];
    const days = resolveExamDaysLeftForSubject(
      SUBJECT_A,
      exams,
      "2026-06-08",
      REFERENCE_DATE,
    );
    expect(days).toBeGreaterThan(28);
    expect(getSubjectMaturityPhase(maturityStats(days))).not.toBe("exam");
  });

  it("closer exam date wins priority over equal-progress peer", () => {
    const exams: ExamDate[] = [
      { id: "e1", subjectId: SUBJECT_A, date: "2026-05-28" },
      { id: "e2", subjectId: SUBJECT_B, date: "2026-07-01" },
    ];
    const ranked = rankSubjectsByPriority(
      baseInput({ examDates: exams, targetExamDate: "2026-12-01" }),
    );
    expect(ranked[0]?.subjectId).toBe(SUBJECT_A);
    expect(ranked[0]?.dominantReason).toBe("exam_soon");
  });

  it("no examDate and no targetExamDate means no exam pressure", () => {
    const map = buildExamDaysLeftBySubject([SUBJECT_A], [], undefined, REFERENCE_DATE);
    expect(map[SUBJECT_A]).toBeNull();
    expect(getSubjectMaturityPhase(maturityStats(null))).not.toBe("exam");
  });
});
