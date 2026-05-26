import { describe, expect, it } from "vitest";
import type { AtplPlannerState, PlannedStudySession } from "./types";
import {
  formatEvaluationDataSourceLine,
  hasEvaluationMeaningfulData,
  summarizeEvaluationDataSources,
} from "./evaluation-data-sources";
import { clearEvaluationStudyData } from "./clear-evaluation-study-data";

describe("evaluation-data-sources", () => {
  it("sin datos significativos", () => {
    const counts = summarizeEvaluationDataSources({
      sessions: [],
      mockResults: [],
      plannedSessions: [],
      errorLogItems: [],
      reviewItems: [],
    });
    expect(hasEvaluationMeaningfulData(counts)).toBe(false);
    expect(formatEvaluationDataSourceLine(counts)).toMatch(/Sin registros/);
  });

  it("resume bitácora y simulacros", () => {
    const counts = summarizeEvaluationDataSources({
      sessions: [
        { id: "1", date: "2026-05-19", subjectId: "a", type: "theory", durationMinutes: 60 },
      ],
      mockResults: [{ id: "m1", date: "2026-05-19", subjectId: "a", score: 80 }],
      plannedSessions: [],
      errorLogItems: [],
      reviewItems: [],
    });
    expect(hasEvaluationMeaningfulData(counts)).toBe(true);
    expect(formatEvaluationDataSourceLine(counts)).toMatch(/1 sesión/);
    expect(formatEvaluationDataSourceLine(counts)).toMatch(/1 simulacro/);
  });
});

describe("clearEvaluationStudyData", () => {
  const planned: PlannedStudySession = {
    id: "p1",
    date: "2026-05-20",
    subjectId: "atpl-air-law",
    type: "theory",
    plannedDurationMinutes: 45,
    status: "pending",
    source: "manual",
  };

  it("limpia bitácora y evaluación pero conserva calendario y exámenes", () => {
    const state: AtplPlannerState = {
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: ["atpl-air-law"],
      targetExamDate: "2026-12-01",
      studyStartDate: "2026-01-01",
      onboardingCompleted: true,
      sessions: [
        { id: "s1", date: "2026-05-19", subjectId: "atpl-air-law", type: "theory", durationMinutes: 90 },
      ],
      plannedSessions: [planned],
      mockResults: [{ id: "m1", date: "2026-05-19", subjectId: "atpl-air-law", score: 88 }],
      reviewItems: [
        {
          id: "r1",
          subjectId: "atpl-air-law",
          topic: "t",
          createdAt: "2026-05-19",
          dueDate: "2026-05-20",
          intervalDays: 3,
          status: "pending",
        },
      ],
      errorLogItems: [
        {
          id: "e1",
          date: "2026-05-19",
          subjectId: "atpl-air-law",
          topic: "x",
          type: "concept",
          description: "d",
          status: "pending",
        },
      ],
      examDates: [{ id: "ex1", subjectId: "atpl-air-law", date: "2026-06-01" }],
    };

    const next = clearEvaluationStudyData(state);
    expect(next.sessions).toEqual([]);
    expect(next.mockResults).toEqual([]);
    expect(next.reviewItems).toEqual([]);
    expect(next.errorLogItems).toEqual([]);
    expect(next.plannedSessions).toEqual([planned]);
    expect(next.examDates).toHaveLength(1);
    expect(next.weeklyGoalMinutes).toBe(600);
  });
});
