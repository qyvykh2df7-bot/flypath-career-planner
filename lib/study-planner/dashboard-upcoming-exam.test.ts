import { describe, expect, it } from "vitest";
import type { ExamDate } from "./types";
import { buildUpcomingExamSessionPreset } from "./dashboard-upcoming-exam";
import { formatNextExamHighlight } from "./subjects-page-logic";

const TODAY = "2026-05-20";

describe("dashboard upcoming exam quick actions", () => {
  it("formatNextExamHighlight hides past exams and picks nearest", () => {
    const exams: ExamDate[] = [
      { id: "past", subjectId: "atpl-air-law", date: "2026-05-10" },
      { id: "far", subjectId: "atpl-meteorology", date: "2026-06-01" },
      { id: "near", subjectId: "atpl-air-law", date: "2026-05-24" },
    ];
    const highlight = formatNextExamHighlight(exams, TODAY);
    expect(highlight?.subjectId).toBe("atpl-air-law");
    expect(highlight?.daysUntil).toBe(4);
    expect(highlight?.daysLabel).toBe("en 4 días");
  });

  it("buildUpcomingExamSessionPreset preselects subject and type", () => {
    const exams: ExamDate[] = [{ id: "e1", subjectId: "atpl-meteorology", date: "2026-05-24" }];
    const preset = buildUpcomingExamSessionPreset(exams, "question_bank", TODAY);
    expect(preset).toEqual({
      subjectId: "atpl-meteorology",
      type: "question_bank",
      date: TODAY,
    });
  });

  it("returns null when no upcoming exam", () => {
    const exams: ExamDate[] = [{ id: "e1", subjectId: "atpl-air-law", date: "2026-05-01" }];
    expect(formatNextExamHighlight(exams, TODAY)).toBeNull();
    expect(buildUpcomingExamSessionPreset(exams, "mock", TODAY)).toBeNull();
  });
});
