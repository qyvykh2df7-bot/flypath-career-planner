import type { ExamDate } from "../types";
import { getSubjectById } from "../subjects";
import { abbreviateSubjectName } from "../subjects-chart-data";

export function groupExamDatesByDate(examDates: ExamDate[]): Map<string, ExamDate[]> {
  const map = new Map<string, ExamDate[]>();
  for (const exam of examDates) {
    const list = map.get(exam.date) ?? [];
    list.push(exam);
    map.set(exam.date, list);
  }
  for (const [date, list] of map) {
    list.sort((a, b) => a.subjectId.localeCompare(b.subjectId));
    map.set(date, list);
  }
  return map;
}

export function getExamsForDate(examDates: ExamDate[], date: string): ExamDate[] {
  return examDates.filter((e) => e.date === date);
}

export function getExamsForMonth(
  examDates: ExamDate[],
  monthStart: string,
  monthEnd: string,
): ExamDate[] {
  return examDates.filter((e) => e.date >= monthStart && e.date <= monthEnd);
}

/** Etiqueta corta para celdas de calendario: "Examen · Air Law". */
export function formatExamCalendarLabel(subjectId: string): string {
  const name = getSubjectById(subjectId)?.name ?? subjectId;
  const short = abbreviateSubjectName(name, 14);
  return `Examen · ${short}`;
}
