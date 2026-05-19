import type { PlannedStudySession } from "./types";
import { isPendingLikeStatus } from "./planner-session-status";
import type { StudyLogMode } from "./study-log-intent";

export const STUDY_LOG_FEEDBACK_MS = 2500;

/** Enlace secundario del hero Hoy → Registro */
export const REGISTER_STUDY_LINK_LABEL = "Registrar estudio";

export const STUDY_LOG_FEEDBACK = {
  planBlockSaved: "Sesión guardada y bloque completado.",
  freeStudySaved: "Estudio guardado.",
  saveError: "No se pudo guardar el estudio.",
} as const;

export function sortTodayPending(
  plannedSessions: PlannedStudySession[],
  today: string,
): PlannedStudySession[] {
  return plannedSessions
    .filter((p) => p.date === today && isPendingLikeStatus(p.status))
    .sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return 0;
    });
}

/** Tarjeta dorada “¿Has completado este bloque?” */
export function shouldShowPlanConfirmCard(
  mode: StudyLogMode,
  todayPending: PlannedStudySession[],
  plannedSessionId: string,
): boolean {
  if (mode !== "plan_block") return false;
  if (todayPending.length === 0) return false;
  return todayPending.some((p) => p.id === plannedSessionId);
}

/** Siguiente bloque pendiente hoy tras completar uno (excluye el recién guardado). */
export function nextPendingIdAfterComplete(
  todayPending: PlannedStudySession[],
  completedPlannedId: string,
): string | null {
  const remaining = todayPending.filter((p) => p.id !== completedPlannedId);
  return remaining[0]?.id ?? null;
}

export function getStudyLogSaveFeedback(linkedPlanned: boolean): string {
  return linkedPlanned ? STUDY_LOG_FEEDBACK.planBlockSaved : STUDY_LOG_FEEDBACK.freeStudySaved;
}
