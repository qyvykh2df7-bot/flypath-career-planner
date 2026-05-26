import { describe, expect, it } from "vitest";
import {
  formatExamCalendarLabel,
  getExamsForDate,
  groupExamDatesByDate,
} from "./exams-by-date";
import type { ExamDate } from "../types";

describe("exams-by-date", () => {
  const exams: ExamDate[] = [
    { id: "e1", subjectId: "atpl-air-law", date: "2026-06-10" },
    { id: "e2", subjectId: "atpl-agk", date: "2026-06-10" },
    { id: "e3", subjectId: "atpl-meteorology", date: "2026-06-15" },
  ];

  it("groups exams by date", () => {
    const map = groupExamDatesByDate(exams);
    expect(map.get("2026-06-10")).toHaveLength(2);
    expect(map.get("2026-06-15")).toHaveLength(1);
  });

  it("filters exams for a single date", () => {
    expect(getExamsForDate(exams, "2026-06-10").map((e) => e.id).sort()).toEqual(["e1", "e2"]);
  });

  it("formats calendar label with subject name", () => {
    expect(formatExamCalendarLabel("atpl-air-law")).toMatch(/^Examen · /);
  });
});
