import { describe, expect, it } from "vitest";
import { computeSubjectReadinessMetrics } from "./subject-readiness";
import {
  buildSubjectChartItems,
  resolveSubjectChartPercent,
} from "./subjects-chart-data";
import {
  formatSubjectChartActivityBullets,
  hasSubjectChartDataSource,
  summarizeSubjectChartActivity,
} from "./subject-chart-data-sources";
import type { InitialSubjectState, MockResult, PlannedStudySession, StudySession } from "./types";

const SUBJECT = "atpl-air-law";
const OTHER = "atpl-agk";

describe("subject-chart-data-sources", () => {
  it("sin señales reales → no hay fuente de gráfico", () => {
    expect(
      hasSubjectChartDataSource({
        subjectId: SUBJECT,
        sessions: [],
        mockResults: [],
        plannedSessions: [],
        examDates: [],
        initialSubjectStates: [
          { subjectId: SUBJECT, declaredStage: "in_progress" },
        ],
      }),
    ).toBe(false);
  });

  it("solo mock aislado habilita fuente pero el gráfico puede ser 0%", () => {
    const mocks: MockResult[] = [{ id: "m1", date: "2026-05-19", subjectId: SUBJECT, score: 89 }];
    expect(
      hasSubjectChartDataSource({
        subjectId: SUBJECT,
        sessions: [],
        mockResults: mocks,
        plannedSessions: [],
        examDates: [],
      }),
    ).toBe(true);

    const readiness = {
      subjectId: SUBJECT,
      ...computeSubjectReadinessMetrics({
        subjectId: SUBJECT,
        sessions: [],
        mockResults: mocks,
      }),
    };
    const items = buildSubjectChartItems({
      readinessList: [readiness],
      sessions: [],
      mockResults: mocks,
      plannedSessions: [],
      examDates: [],
      pendingErrorsBySubject: {},
      today: "2026-05-19",
    });
    expect(items[0]?.percent).toBeGreaterThan(0);
    expect(items[0]?.percent).toBeLessThanOrEqual(50);
  });

  it("asignatura sin datos muestra 0% en el gráfico", () => {
    const readiness = {
      subjectId: OTHER,
      ...computeSubjectReadinessMetrics({
        subjectId: OTHER,
        sessions: [],
        mockResults: [],
      }),
    };
    const items = buildSubjectChartItems({
      readinessList: [readiness],
      sessions: [],
      mockResults: [],
      plannedSessions: [],
      examDates: [],
      pendingErrorsBySubject: {},
      initialSubjectStates: [{ subjectId: OTHER, declaredStage: "mostly_bank" }],
      today: "2026-05-19",
    });
    expect(items[0]?.percent).toBe(0);
    expect(items[0]?.tooltipLines.some((l) => l.includes("Sin datos"))).toBe(true);
  });

  it("bloque completado en calendario cuenta como señal", () => {
    const planned: PlannedStudySession[] = [
      {
        id: "p1",
        date: "2026-05-18",
        subjectId: SUBJECT,
        type: "theory",
        plannedDurationMinutes: 60,
        status: "completed",
        source: "manual",
      },
    ];
    expect(
      hasSubjectChartDataSource({
        subjectId: SUBJECT,
        sessions: [],
        mockResults: [],
        plannedSessions: planned,
        examDates: [],
      }),
    ).toBe(true);
  });

  it("formatea viñetas sin mencionar bitácora", () => {
    const bullets = formatSubjectChartActivityBullets(
      summarizeSubjectChartActivity({
        subjectId: SUBJECT,
        sessions: [{ id: "s1", date: "2026-05-19", subjectId: SUBJECT, type: "theory", durationMinutes: 60 }],
        mockResults: [],
        plannedSessions: [
          {
            id: "p1",
            date: "2026-05-18",
            subjectId: SUBJECT,
            type: "theory",
            plannedDurationMinutes: 60,
            status: "completed",
            source: "manual",
          },
        ],
      }),
    );
    expect(bullets.join(" ")).not.toMatch(/bitácora/i);
    expect(bullets.some((l) => l.includes("sesión"))).toBe(true);
    expect(bullets.some((l) => l.includes("bloque"))).toBe(true);
  });

  it("resolveSubjectChartPercent devuelve 0 sin fuente", () => {
    const readiness = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions: [],
      mockResults: [],
    });
    expect(resolveSubjectChartPercent({ subjectId: SUBJECT, ...readiness }, "no_data", false)).toBe(
      0,
    );
  });
});
