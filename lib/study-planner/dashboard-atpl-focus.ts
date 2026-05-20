import type { NextExamHighlight } from "./subjects-page-logic";

/** Línea discreta bajo estado semanal en Hoy (solo presentación). */
export function formatDashboardEvaluationVigilLine(params: {
  pendingErrors: number;
  nextExam: NextExamHighlight | null;
}): string | null {
  const parts: string[] = [];

  if (params.pendingErrors > 0) {
    parts.push(
      params.pendingErrors === 1
        ? "1 error pendiente"
        : `${params.pendingErrors} errores pendientes`,
    );
  }

  if (params.nextExam) {
    parts.push(`próximo examen ${params.nextExam.daysLabel}`);
  }

  if (parts.length === 0) return null;
  return `Vigila: ${parts.join(" · ")}`;
}
