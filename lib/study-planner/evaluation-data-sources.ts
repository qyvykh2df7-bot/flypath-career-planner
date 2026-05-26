import type {
  ErrorLogItem,
  MockResult,
  PlannedStudySession,
  ReviewItem,
  StudySession,
} from "./types";
import { normalizePlannedSessionStatus } from "./planner-session-status";

export type EvaluationDataSourceCounts = {
  sessionCount: number;
  mockCount: number;
  completedPlannedCount: number;
  pendingErrorCount: number;
  pendingReviewCount: number;
};

export function summarizeEvaluationDataSources(params: {
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
  errorLogItems: ErrorLogItem[];
  reviewItems: ReviewItem[];
}): EvaluationDataSourceCounts {
  const pendingReviewCount = params.reviewItems.filter((r) => r.status !== "completed").length;

  return {
    sessionCount: params.sessions.length,
    mockCount: params.mockResults.length,
    completedPlannedCount: params.plannedSessions.filter(
      (p) => normalizePlannedSessionStatus(p.status) === "completed",
    ).length,
    pendingErrorCount: params.errorLogItems.filter((e) => e.status === "pending").length,
    pendingReviewCount,
  };
}

/** Hay actividad registrada que justifica porcentajes y mensajes de preparación. */
export function hasEvaluationMeaningfulData(counts: EvaluationDataSourceCounts): boolean {
  return (
    counts.sessionCount > 0 ||
    counts.mockCount > 0 ||
    counts.completedPlannedCount > 0
  );
}

export function formatEvaluationDataSourceLine(counts: EvaluationDataSourceCounts): string {
  const parts: string[] = [];
  if (counts.sessionCount > 0) {
    parts.push(
      `${counts.sessionCount} sesión${counts.sessionCount === 1 ? "" : "es"} en bitácora`,
    );
  }
  if (counts.mockCount > 0) {
    parts.push(`${counts.mockCount} simulacro${counts.mockCount === 1 ? "" : "s"}`);
  }
  if (counts.completedPlannedCount > 0) {
    parts.push(
      `${counts.completedPlannedCount} bloque${counts.completedPlannedCount === 1 ? "" : "s"} completado${counts.completedPlannedCount === 1 ? "" : "s"} en calendario`,
    );
  }
  if (counts.pendingErrorCount > 0) {
    parts.push(
      `${counts.pendingErrorCount} error${counts.pendingErrorCount === 1 ? "" : "es"} pendiente${counts.pendingErrorCount === 1 ? "" : "s"}`,
    );
  }
  if (counts.pendingReviewCount > 0) {
    parts.push(
      `${counts.pendingReviewCount} repaso${counts.pendingReviewCount === 1 ? "" : "s"} pendiente${counts.pendingReviewCount === 1 ? "" : "s"}`,
    );
  }
  if (parts.length === 0) {
    return "Sin registros en bitácora ni simulacros todavía.";
  }
  return `Calculado con: ${parts.join(", ")}.`;
}
