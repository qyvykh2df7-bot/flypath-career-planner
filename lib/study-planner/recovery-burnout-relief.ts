import type { RecoveryBurnoutRelief, RecoveryProblem } from "./types";
import type { RecoveryCalendarPreviewInput } from "./recovery-plan-preview";
import { getWeekRange } from "./date-utils";
import { isPendingLikeStatus } from "./planner-session-status";
import { pickRecoveryFocusSubjects } from "./recovery-apply";

export const BURNOUT_MAIN_SUMMARY =
  "Ahora mismo no necesitas estudiar más horas. Necesitas recuperar control y volver a una rutina sostenible.";

export const BURNOUT_PLAN_EFFECTS = [
  "menos sesiones",
  "sesiones más cortas",
  "menos banco intensivo",
  "más repasos ligeros",
  "más descanso entre bloques",
] as const;

export const BURNOUT_APPLY_CONFIRM_MESSAGE =
  "Este cambio reducirá sesiones y reorganizará tu semana para bajar carga. No se perderá progreso ni historial.";

export function isBurnoutRecoveryPlan(problems: RecoveryProblem[]): boolean {
  return problems.includes("burnout");
}

export function buildBurnoutRelief(
  input: RecoveryCalendarPreviewInput,
  proposedSessionCount: number,
): RecoveryBurnoutRelief {
  const { start, end } = getWeekRange(input.weekStartDate);
  const weekPending = input.plannedSessions.filter(
    (session) =>
      session.date >= start &&
      session.date <= end &&
      session.date >= input.today &&
      isPendingLikeStatus(session.status),
  );

  const currentSessionCount = weekPending.length;
  const intensiveBankCount = weekPending.filter(
    (session) => session.type === "question_bank" || session.type === "mock",
  ).length;
  const intensiveBankRemoved = Math.max(
    0,
    intensiveBankCount - Math.round(intensiveBankCount * 0.35),
  );

  const prioritySubjectIds = pickRecoveryFocusSubjects(
    input.activeSubjectIds,
    input.reviewItems,
    input.errorLogItems,
    input.today,
  ).slice(0, 3);
  const prioritySubjectCount = Math.max(
    1,
    Math.min(3, prioritySubjectIds.length || input.activeSubjectIds.length || 1),
  );

  const volumeReductionPercent =
    currentSessionCount > 0
      ? Math.min(40, Math.max(30, Math.round((1 - proposedSessionCount / currentSessionCount) * 100)))
      : 35;

  const proposedChanges: string[] = [];
  if (currentSessionCount > 0) {
    proposedChanges.push(
      `reducir de ${currentSessionCount} → ${proposedSessionCount} sesiones`,
    );
  } else {
    proposedChanges.push(`planificar unas ${proposedSessionCount} sesiones cortas`);
  }
  if (intensiveBankRemoved > 0) {
    proposedChanges.push(
      `eliminar ${intensiveBankRemoved} bloque${intensiveBankRemoved === 1 ? "" : "s"} de banco intensivo`,
    );
  }
  proposedChanges.push(
    `mantener solo ${prioritySubjectCount} asignatura${prioritySubjectCount === 1 ? "" : "s"} prioritarias`,
  );
  proposedChanges.push("añadir más separación entre sesiones");

  return {
    currentSessionCount,
    proposedSessionCount,
    intensiveBankRemoved,
    prioritySubjectCount,
    prioritySubjectIds,
    volumeReductionPercent,
    proposedChanges,
    planEffects: [...BURNOUT_PLAN_EFFECTS],
  };
}
