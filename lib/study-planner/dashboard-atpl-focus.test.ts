import { describe, expect, it } from "vitest";
import type { ExamDate } from "./types";
import { formatDashboardEvaluationVigilLine } from "./dashboard-atpl-focus";
import { formatNextExamHighlight } from "./subjects-page-logic";

const TODAY = "2026-05-20";

describe("formatDashboardEvaluationVigilLine", () => {
  it("returns null when nothing to watch", () => {
    expect(
      formatDashboardEvaluationVigilLine({ pendingErrors: 0, nextExam: null }),
    ).toBeNull();
  });

  it("combines errors and next exam", () => {
    const exams: ExamDate[] = [{ subjectId: "atpl-mass-balance", date: "2026-05-30" }];
    const nextExam = formatNextExamHighlight(exams, TODAY);
    const line = formatDashboardEvaluationVigilLine({
      pendingErrors: 1,
      nextExam,
    });
    expect(line).toBe("Vigila: 1 error pendiente · próximo examen en 10 días");
  });
});
