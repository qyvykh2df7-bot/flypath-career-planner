import { describe, expect, it } from "vitest";
import { computeSubjectReadinessMetrics } from "./subject-readiness";
import type { MockResult, SubjectReadiness } from "./types";
import { buildEvaluationSummary } from "./evaluation-page-logic";
import {
  buildEvaluationPriorityGroups,
  formatPriorityContextLine,
  getEvaluationReadinessChip,
} from "./evaluation-presentation";

function readiness(subjectId: string, score: number, sessions = []): SubjectReadiness {
  const base = computeSubjectReadinessMetrics({
    subjectId,
    sessions,
    mockResults: [],
  });
  return { subjectId, ...base, score };
}

describe("evaluation-presentation", () => {
  it("sin datos significativos → chip y contexto sin mensajes optimistas", () => {
    const summary = buildEvaluationSummary({
      mockResults: [],
      errorLogItems: [],
      reviewItems: [],
      subjectIds: ["atpl-air-law"],
      examDates: [],
      sessions: [],
      plannedSessions: [],
    });
    expect(summary.hasMeaningfulStudyData).toBe(false);
    expect(getEvaluationReadinessChip(summary).label).toBe("Sin datos suficientes");
    const groups = buildEvaluationPriorityGroups({
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      readiness: [readiness("atpl-air-law", 48)],
      sessions: [],
      mockResults: [],
      errorLogItems: [],
      examDates: [],
      plannedSessions: [],
    });
    expect(groups.improving).toHaveLength(0);
    expect(formatPriorityContextLine(groups, false)).toBeNull();
    expect(formatPriorityContextLine(groups, true)).toBeNull();
  });

  it("con mock no muestra Listo para seguir si hay riesgo", () => {
    const mocks: MockResult[] = [
      { id: "m1", date: "2026-05-19", subjectId: "atpl-air-law", score: 58 },
    ];
    const summary = buildEvaluationSummary({
      mockResults: mocks,
      errorLogItems: [],
      reviewItems: [],
      subjectIds: ["atpl-air-law"],
      examDates: [],
      sessions: [],
      plannedSessions: [],
    });
    expect(summary.hasMeaningfulStudyData).toBe(true);
    expect(summary.dataSourceLine).toMatch(/simulacro/);
    const chip = getEvaluationReadinessChip(summary);
    expect(chip.label).not.toBe("Listo para seguir");
  });
});
