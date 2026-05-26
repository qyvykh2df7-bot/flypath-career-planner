import { describe, expect, it } from "vitest";
import { computeSubjectReadinessMetrics } from "./subject-readiness";
import type { StudySession, SubjectReadiness } from "./types";
import {
  abbreviateSubjectName,
  buildSubjectChartItems,
  resolveSubjectChartPercent,
} from "./subjects-chart-data";
import { resolveSubjectDisplayStatus } from "./subjects-page-logic";

function readiness(
  subjectId: string,
  score: number,
  sessions: StudySession[] = [
    {
      id: "1",
      date: "2026-05-18",
      subjectId,
      type: "theory",
      durationMinutes: 60,
      quality: "good",
    },
  ],
): SubjectReadiness {
  const base = computeSubjectReadinessMetrics({
    subjectId,
    sessions,
    mockResults: [],
  });
  return { ...base, subjectId, score };
}

describe("subjects-chart-data", () => {
  it("abbreviates long subject names", () => {
    expect(abbreviateSubjectName("Mass & Balance")).toBe("M&B");
    expect(abbreviateSubjectName("Air Law")).toBe("Air Law");
  });

  it("maps no_data to 0% and passed to 100%", () => {
    const r = readiness("atpl-air-law", 40);
    expect(resolveSubjectChartPercent(r, "no_data", false)).toBe(0);
    expect(resolveSubjectChartPercent(r, "passed", true)).toBe(100);
    expect(resolveSubjectChartPercent(r, "in_progress", true)).toBe(40);
  });

  it("builds tooltip with no-session message for no_data", () => {
    const r = readiness("atpl-air-law", 0, []);
    const items = buildSubjectChartItems({
      readinessList: [r],
      sessions: [],
      mockResults: [],
      plannedSessions: [],
      examDates: [],
      pendingErrorsBySubject: {},
      today: "2026-05-19",
    });
    expect(items[0]?.percent).toBe(0);
    expect(items[0]?.tooltipLines.some((l) => l.includes("Sin datos"))).toBe(true);
  });

  it("includes exam line when exam exists", () => {
    const r = readiness("atpl-air-law", 37);
    const status = resolveSubjectDisplayStatus(
      r,
      [{ id: "e1", subjectId: "atpl-air-law", date: "2026-05-23" }],
      0,
      "2026-05-19",
    );
    expect(status).toBe("at_risk");
    const items = buildSubjectChartItems({
      readinessList: [r],
      sessions: [
        {
          id: "1",
          date: "2026-05-18",
          subjectId: "atpl-air-law",
          type: "theory",
          durationMinutes: 60,
          quality: "good",
        },
      ],
      mockResults: [],
      plannedSessions: [],
      examDates: [{ id: "e1", subjectId: "atpl-air-law", date: "2026-05-23" }],
      pendingErrorsBySubject: {},
      today: "2026-05-19",
    });
    expect(items[0]?.tooltipLines.some((l) => l.startsWith("Examen"))).toBe(true);
    expect(items[0]?.tooltipLines.some((l) => l.startsWith("Fuente:"))).toBe(true);
  });
});
