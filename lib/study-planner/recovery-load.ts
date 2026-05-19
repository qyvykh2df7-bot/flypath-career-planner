import type { PlannedStudySession, RecoveryProblem } from "./types";
import { getWeekRange } from "./date-utils";
import { isPendingLikeStatus } from "./planner-session-status";

export function sumPendingPlannedMinutesForWeek(
  sessions: PlannedStudySession[],
  weekStartDate: string,
): number {
  const { start, end } = getWeekRange(weekStartDate);
  return sessions
    .filter(
      (p) =>
        p.date >= start &&
        p.date <= end &&
        isPendingLikeStatus(p.status),
    )
    .reduce((sum, p) => sum + (Number.isFinite(p.plannedDurationMinutes) ? p.plannedDurationMinutes : 0), 0);
}

/** Minutos objetivo al aplicar un plan de recuperación (con suelos por variante). */
export function computeRecoveryTargetMinutes(params: {
  variant: "standard" | "lighter";
  selectedProblems: RecoveryProblem[];
  currentPlannedMinutes: number;
  weeklyGoalMinutes: number;
}): number {
  const { variant, selectedProblems, currentPlannedMinutes: current, weeklyGoalMinutes: goal } =
    params;
  const lighter = variant === "lighter";
  const burnout = selectedProblems.includes("burnout");
  const goalSafe = Math.max(0, goal);
  const currentSafe = Math.max(0, current);

  const goalFloor = lighter
    ? burnout
      ? Math.round(goalSafe * 0.35)
      : Math.round(goalSafe * 0.4)
    : Math.round(goalSafe * 0.5);

  const currentFloor = lighter
    ? burnout
      ? Math.round(currentSafe * 0.4)
      : Math.round(currentSafe * 0.5)
    : Math.round(currentSafe * 0.6);

  const floor = Math.max(goalFloor, currentFloor, 60);

  if (currentSafe <= 0) {
    const emptyTarget = Math.round(goalSafe * (lighter ? 0.45 : 0.55));
    return Math.max(floor, emptyTarget);
  }

  const aimRatio = lighter ? (burnout ? 0.52 : 0.58) : 0.72;
  let target = Math.round(currentSafe * aimRatio);
  target = Math.max(floor, Math.min(currentSafe, target));
  return target;
}
