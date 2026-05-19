import { describe, expect, it } from "vitest";
import type { MockResult } from "./types";
import {
  buildEvaluationCoachRecommendation,
  buildEvaluationSummary,
  formatEvaluationDashboardLine,
  formatHistoryMockTrendLabel,
  formatSubjectMockTrendLabel,
} from "./evaluation-page-logic";

describe("evaluation-page-logic", () => {
  it("summary without data", () => {
    const summary = buildEvaluationSummary({
      mockResults: [],
      errorLogItems: [],
      reviewItems: [],
      subjectIds: ["atpl-air-law"],
      examDates: [],
      sessions: [],
    });
    expect(summary.hasEnoughData).toBe(false);
    expect(formatEvaluationDashboardLine(summary)).toBeNull();
  });

  it("dashboard line with simulacros and zeros", () => {
    const mocks: MockResult[] = [
      { id: "1", date: "2026-05-19", subjectId: "atpl-air-law", score: 99 },
    ];
    const summary = buildEvaluationSummary({
      mockResults: mocks,
      errorLogItems: [],
      reviewItems: [],
      subjectIds: ["atpl-air-law"],
      examDates: [],
      sessions: [],
    });
    const line = formatEvaluationDashboardLine(summary, [], "2026-05-19");
    expect(line).toBe("Simulacros de examen 99% · 0 errores pendientes · 0 repasos hoy");
  });

  it("coach recommends first mock when none", () => {
    const summary = buildEvaluationSummary({
      mockResults: [],
      errorLogItems: [],
      reviewItems: [],
      subjectIds: [],
      examDates: [],
      sessions: [],
    });
    const coach = buildEvaluationCoachRecommendation(summary, [], [], []);
    expect(coach.ctaLabel).toBe("Registrar simulacro de examen");
    expect(coach.message).toMatch(/detectar tu nivel real/);
  });

  it("coach prioritizes pending errors", () => {
    const mocks: MockResult[] = [{ id: "1", date: "2026-05-19", subjectId: "a", score: 85 }];
    const errors = [
      {
        id: "e1",
        date: "2026-05-19",
        subjectId: "a",
        topic: "t",
        type: "concept" as const,
        description: "d",
        status: "pending" as const,
      },
    ];
    const summary = buildEvaluationSummary({
      mockResults: mocks,
      errorLogItems: errors,
      reviewItems: [],
      subjectIds: ["a"],
      examDates: [],
      sessions: [],
    });
    const coach = buildEvaluationCoachRecommendation(summary, errors, [], mocks);
    expect(coach.ctaLabel).toBe("Ver errores");
  });

  it("trend label for single mock", () => {
    expect(formatSubjectMockTrendLabel(1, "none")).toBe("Primer simulacro de examen");
    const sorted: MockResult[] = [{ id: "1", date: "2026-05-19", subjectId: "a", score: 80 }];
    expect(formatHistoryMockTrendLabel(sorted, 0)).toBe("Primer simulacro de examen");
  });
});
