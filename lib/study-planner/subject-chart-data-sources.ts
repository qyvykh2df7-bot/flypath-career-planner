import type {
  ExamDate,
  InitialSubjectState,
  MockResult,
  PlannedStudySession,
  StudySession,
} from "./types";
import { isSubjectDeclaredPassed } from "./initial-subject-state";
import { normalizePlannedSessionStatus } from "./planner-session-status";

/**
 * Señales reales que habilitan mostrar % de preparación en el gráfico.
 * No incluye etapas declaradas en onboarding sin actividad registrada.
 */
export function hasSubjectChartDataSource(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
  examDates: ExamDate[];
  initialSubjectStates?: InitialSubjectState[];
}): boolean {
  if (isSubjectDeclaredPassed(params.subjectId, params.initialSubjectStates)) {
    return true;
  }
  if (params.sessions.some((s) => s.subjectId === params.subjectId)) {
    return true;
  }
  if (params.mockResults.some((m) => m.subjectId === params.subjectId)) {
    return true;
  }
  if (
    params.plannedSessions.some(
      (p) =>
        p.subjectId === params.subjectId &&
        normalizePlannedSessionStatus(p.status) === "completed",
    )
  ) {
    return true;
  }
  if (params.examDates.some((e) => e.subjectId === params.subjectId)) {
    return true;
  }
  return false;
}

export function formatSubjectChartDataSourceLine(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
}): string | null {
  const sessionCount = params.sessions.filter((s) => s.subjectId === params.subjectId).length;
  const mockCount = params.mockResults.filter((m) => m.subjectId === params.subjectId).length;
  const completedPlanned = params.plannedSessions.filter(
    (p) =>
      p.subjectId === params.subjectId &&
      normalizePlannedSessionStatus(p.status) === "completed",
  ).length;

  const parts: string[] = [];
  if (sessionCount > 0) {
    parts.push(`${sessionCount} sesión${sessionCount === 1 ? "" : "es"} en bitácora`);
  }
  if (mockCount > 0) {
    parts.push(`${mockCount} simulacro${mockCount === 1 ? "" : "s"}`);
  }
  if (completedPlanned > 0) {
    parts.push(`${completedPlanned} bloque${completedPlanned === 1 ? "" : "s"} completado${completedPlanned === 1 ? "" : "s"} en calendario`);
  }
  if (parts.length === 0) return null;
  return parts.join(" · ");
}
