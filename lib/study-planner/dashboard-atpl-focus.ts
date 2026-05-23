import type { NextExamHighlight } from "./subjects-page-logic";

/** Línea discreta bajo estado semanal en Hoy (solo presentación; legado). */
export function formatDashboardEvaluationVigilLine(params: {
  pendingErrors: number;
  nextExam: NextExamHighlight | null;
}): string | null {
  if (!params.nextExam) return null;
  return `${params.nextExam.subjectName} exam ${params.nextExam.daysLabel}`;
}
