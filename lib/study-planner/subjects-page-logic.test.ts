import { describe, expect, it } from "vitest";
import type { ExamDate, SubjectReadiness } from "./types";
import { computeSubjectReadinessMetrics } from "./subject-readiness";
import {
  buildSubjectsPageSummary,
  filterReadinessByChip,
  formatNextExamHighlight,
  getSubjectDisplayLabel,
  hasRealRiskSignals,
  isSubjectInCourse,
  resolveSubjectDisplayStatus,
  SUBJECT_DISPLAY_STATUS_LABELS,
} from "./subjects-page-logic";

const TODAY = "2026-05-19";

function readiness(
  level: SubjectReadiness["level"],
  subjectId = "atpl-air-law",
  overrides: Partial<SubjectReadiness["factors"]> & {
    score?: number;
    pedagogicalLabel?: string;
    confidence?: SubjectReadiness["confidence"];
    isProvisional?: boolean;
    breakdown?: Partial<SubjectReadiness["breakdown"]>;
  } = {},
): SubjectReadiness {
  const { score: scoreOverride, pedagogicalLabel, confidence, isProvisional, breakdown, ...factorOverrides } =
    overrides;
  const base = computeSubjectReadinessMetrics({
    subjectId,
    sessions: [],
    mockResults: [],
  });
  return {
    subjectId,
    score: scoreOverride ?? (level === "no_data" ? 0 : 26),
    level,
    label: pedagogicalLabel ?? base.pedagogicalLabel,
    pedagogicalLabel: pedagogicalLabel ?? base.pedagogicalLabel,
    message: "",
    confidence: confidence ?? base.confidence,
    confidenceLabel: base.confidenceLabel,
    isProvisional: isProvisional ?? base.isProvisional,
    breakdown: { ...base.breakdown, ...breakdown },
    factors: {
      totalStudyMinutes: 0,
      recentStudyMinutes: 0,
      latestMockScore: null,
      averageMockScore: null,
      mockCount: 0,
      daysSinceLastSession: null,
      ...factorOverrides,
    },
  };
}

describe("subjects-page-logic", () => {
  it("isSubjectInCourse detects activity from sessions or minutes", () => {
    expect(isSubjectInCourse(readiness("no_data"))).toBe(false);
    expect(
      isSubjectInCourse(
        readiness("low", "a", { totalStudyMinutes: 45, daysSinceLastSession: 2 }),
      ),
    ).toBe(true);
  });

  it("early progress maps to in_progress, not at_risk", () => {
    const r = readiness("low", "atpl-agk", {
      score: 26,
      pedagogicalLabel: "Construyendo base",
      totalStudyMinutes: 90,
      daysSinceLastSession: 1,
    });
    expect(resolveSubjectDisplayStatus(r, [], 0, TODAY)).toBe("in_progress");
    expect(getSubjectDisplayLabel("in_progress", r)).toBe("Construyendo base");
  });

  it("at_risk when exam is near and progress is low", () => {
    const r = readiness("low", "atpl-air-law", {
      score: 30,
      pedagogicalLabel: "Construyendo base",
      totalStudyMinutes: 120,
      daysSinceLastSession: 3,
    });
    const exams: ExamDate[] = [{ id: "e1", subjectId: "atpl-air-law", date: "2026-05-25" }];
    expect(resolveSubjectDisplayStatus(r, exams, 0, TODAY)).toBe("at_risk");
    expect(hasRealRiskSignals(r, exams[0], 0, TODAY)).toBe(true);
  });

  it("at_risk with pending errors", () => {
    const r = readiness("medium", "x", {
      score: 50,
      pedagogicalLabel: "Primeras señales positivas",
      totalStudyMinutes: 200,
      daysSinceLastSession: 2,
    });
    expect(resolveSubjectDisplayStatus(r, [], 3, TODAY)).toBe("at_risk");
  });

  it("filterReadinessByChip uses display status", () => {
    const list = [
      readiness("low", "a", { totalStudyMinutes: 60, daysSinceLastSession: 1 }),
      readiness("solid", "b", {
        score: 85,
        pedagogicalLabel: "Preparación sólida",
        confidence: "high",
        isProvisional: false,
        totalStudyMinutes: 500,
        mockCount: 3,
        daysSinceLastSession: 1,
        breakdown: { bankSessions: 3, bankMinutes: 300, mockCount: 3 },
      }),
      readiness("no_data", "c"),
    ];
    const exams: ExamDate[] = [{ id: "e1", subjectId: "b", date: "2026-06-01" }];

    expect(filterReadinessByChip(list, "in_progress", exams, {}, TODAY)).toHaveLength(1);
    expect(filterReadinessByChip(list, "with_exam", exams, {}, TODAY)).toHaveLength(1);
    expect(filterReadinessByChip(list, "all", exams, {}, TODAY)).toHaveLength(3);
  });

  it("buildSubjectsPageSummary counts en curso by activity", () => {
    const list = [
      readiness("low", "atpl-agk", { totalStudyMinutes: 90, daysSinceLastSession: 1 }),
      readiness("low", "atpl-meteorology", {
        totalStudyMinutes: 120,
        daysSinceLastSession: 2,
      }),
      readiness("no_data", "atpl-law"),
    ];
    const exams: ExamDate[] = [{ id: "e1", subjectId: "atpl-air-law", date: "2026-05-31" }];
    const summary = buildSubjectsPageSummary(list, exams, {}, TODAY);

    expect(summary.activeCount).toBe(3);
    expect(summary.inProgressCount).toBe(2);
    expect(summary.noDataCount).toBe(1);
    expect(summary.nextExamLine).toMatch(/Air Law/);
    expect(SUBJECT_DISPLAY_STATUS_LABELS.in_progress).toBe("En progreso");
  });

  it("formatNextExamHighlight returns subject and days label", () => {
    const exams: ExamDate[] = [{ id: "e1", subjectId: "atpl-air-law", date: "2026-05-31" }];
    const highlight = formatNextExamHighlight(exams, TODAY);
    expect(highlight?.subjectName).toMatch(/Air Law/);
    expect(highlight?.daysLabel).toMatch(/^en \d+ días$/);
  });
});
