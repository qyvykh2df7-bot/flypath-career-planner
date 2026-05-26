import type { PlannedStudySession } from "./types";
import { isCountableAsCompleted } from "./planner-session-status";

export type DayCompletionVisualState = "none" | "not_started" | "in_progress" | "completed";

export type DayCompletionSummary = {
  completed: number;
  total: number;
  percent: number;
  state: DayCompletionVisualState;
};

/** Progreso del día según sesiones planificadas completadas (0% gris · parcial dorado · 100% verde). */
export function getDayCompletionSummary(sessions: PlannedStudySession[]): DayCompletionSummary {
  const total = sessions.length;
  if (total === 0) {
    return { completed: 0, total: 0, percent: 0, state: "none" };
  }

  const completed = sessions.filter((s) => isCountableAsCompleted(s.status)).length;
  const percent = Math.round((completed / total) * 100);

  if (percent <= 0) {
    return { completed, total, percent: 0, state: "not_started" };
  }
  if (percent >= 100) {
    return { completed, total, percent: 100, state: "completed" };
  }
  return { completed, total, percent, state: "in_progress" };
}
