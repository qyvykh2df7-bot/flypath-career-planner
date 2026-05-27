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
 * Señales que habilitan mostrar % en el gráfico.
 * Los bloques completados del calendario solo habilitan visibilidad, no influyen en el score.
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

export type SubjectChartActivitySummary = {
  sessionCount: number;
  mockCount: number;
  completedBlockCount: number;
};

export function summarizeSubjectChartActivity(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
}): SubjectChartActivitySummary {
  return {
    sessionCount: params.sessions.filter((s) => s.subjectId === params.subjectId).length,
    mockCount: params.mockResults.filter((m) => m.subjectId === params.subjectId).length,
    completedBlockCount: params.plannedSessions.filter(
      (p) =>
        p.subjectId === params.subjectId &&
        normalizePlannedSessionStatus(p.status) === "completed",
    ).length,
  };
}

/** Viñetas cortas para tooltip (sin “bitácora”). */
export function formatSubjectChartActivityBullets(
  summary: SubjectChartActivitySummary,
): string[] {
  const bullets: string[] = [];
  if (summary.sessionCount > 0) {
    bullets.push(
      `• ${summary.sessionCount} sesión${summary.sessionCount === 1 ? "" : "es"} registrada${summary.sessionCount === 1 ? "" : "s"}`,
    );
  }
  if (summary.mockCount > 0) {
    bullets.push(
      `• ${summary.mockCount} simulacro${summary.mockCount === 1 ? "" : "s"}`,
    );
  }
  if (summary.completedBlockCount > 0) {
    bullets.push(
      `• ${summary.completedBlockCount} bloque${summary.completedBlockCount === 1 ? "" : "s"} completado${summary.completedBlockCount === 1 ? "" : "s"}`,
    );
  }
  return bullets;
}
