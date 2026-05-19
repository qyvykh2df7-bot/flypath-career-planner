import type { PlannedStudySession, StudySession } from "./types";
import {
  getDaysUntilDate,
  getTodayDateString,
  minutesToHoursLabel,
} from "./calculations";
import { isPendingLikeStatus } from "./planner-session-status";
import { getCurrentWeekStart, getWeekDates } from "./date-utils";
import type { WeeklyPlanCompletion } from "./calculations";

export type WeeklyPlanAlertSeverity = "info" | "warn" | "risk";

export type WeeklyPlanAlert = {
  id: string;
  severity: WeeklyPlanAlertSeverity;
  message: string;
};

function pendingMinutes(sessions: PlannedStudySession[]): number {
  return sessions
    .filter((p) => isPendingLikeStatus(p.status))
    .reduce((sum, p) => sum + (Number.isFinite(p.plannedDurationMinutes) ? p.plannedDurationMinutes : 0), 0);
}

function getLatestStudyDate(sessions: StudySession[]): string | null {
  if (sessions.length === 0) return null;
  return sessions.map((s) => s.date).sort((a, b) => b.localeCompare(a))[0] ?? null;
}

function buildGoalWithoutPlanAlerts(completion: WeeklyPlanCompletion): WeeklyPlanAlert[] {
  const alerts: WeeklyPlanAlert[] = [
    {
      id: "goal-no-plan",
      severity: "info",
      message: "Aún no has generado plan, pero puedes seguir tu objetivo semanal.",
    },
    {
      id: "goal-suggest-plan",
      severity: "info",
      message: "Generar un plan semanal te ayudará a repartir mejor la carga.",
    },
  ];

  const remainingGoalMinutes = Math.max(0, completion.targetMinutes - completion.totalCreditedMinutes);
  if (remainingGoalMinutes > 180) {
    alerts.push({
      id: "goal-hours-remaining",
      severity: completion.weeklyStatus === "critical" ? "risk" : "warn",
      message: `Te quedan ${minutesToHoursLabel(remainingGoalMinutes)} para cumplir tu objetivo semanal.`,
    });
  }

  if (completion.weeklyStatus === "critical" && !alerts.some((a) => a.id === "goal-hours-remaining")) {
    alerts.push({
      id: "goal-critical",
      severity: "risk",
      message: "Riesgo alto de no cumplir tu objetivo semanal.",
    });
  }

  const studySessions = completion.weekLoggedSessions;
  const today = getTodayDateString();
  const latestStudy = getLatestStudyDate(studySessions);
  if (latestStudy && latestStudy <= today) {
    const diff = getDaysUntilDate(today, latestStudy);
    const daysSinceStudy = diff <= 0 ? Math.abs(diff) : 0;
    if (daysSinceStudy >= 3) {
      alerts.push({
        id: "no-recent-study",
        severity: "warn",
        message: "No has estudiado desde hace varios días.",
      });
    }
  } else if (!completion.hasLoggedStudyThisWeek) {
    alerts.push({
      id: "no-study-log",
      severity: "info",
      message: "No has registrado estudio esta semana.",
    });
  }

  return alerts;
}

/** Alertas heurísticas de la semana actual (sin IA). */
export function buildWeeklyPlanAlerts(params: {
  completion: WeeklyPlanCompletion;
  plannedSessions: PlannedStudySession[];
  studySessions?: StudySession[];
  today?: string;
}): WeeklyPlanAlert[] {
  const today = params.today ?? getTodayDateString();
  const weekStart = getCurrentWeekStart(today);
  const weekDates = getWeekDates(weekStart);
  const { completion } = params;
  const studySessions = params.studySessions ?? completion.weekLoggedSessions;

  if (!completion.hasPlan && completion.usesWeeklyGoalAsTarget) {
    return buildGoalWithoutPlanAlerts(completion);
  }

  if (!completion.hasPlan) {
    return [];
  }

  const alerts: WeeklyPlanAlert[] = [];
  const remainingDates = weekDates.filter((d) => d >= today);
  const remainingDayCount = Math.max(1, remainingDates.length);

  const pending = completion.weekSessions.filter((p) => isPendingLikeStatus(p.status));
  const pendingOnRemaining = pending.filter((p) => p.date >= today);
  const pendingBlockMinutes = pendingMinutes(pendingOnRemaining);

  const remainingRealMinutes = Math.max(
    0,
    completion.plannedMinutes - completion.completedPlannedMinutes,
  );

  const allStillPending =
    completion.hasPlan &&
    completion.completedCount === 0 &&
    completion.skippedCount === 0 &&
    pending.length === completion.weekSessions.length;

  if (
    completion.actualLoggedMinutes > completion.completedPlannedMinutes + 15 &&
    completion.actualLoggedMinutes > completion.completedPlannedMinutes
  ) {
    alerts.push({
      id: "logged-not-completed",
      severity: "info",
      message:
        "Has registrado estudio, aunque no hayas marcado bloques como completados.",
    });
  }

  const isBehindSchedule =
    completion.weeklyStatus === "slightly_behind" ||
    completion.weeklyStatus === "behind" ||
    completion.weeklyStatus === "critical";

  const overduePending = pending.filter((p) => p.date < today).length;

  if (
    !allStillPending &&
    isBehindSchedule &&
    (overduePending > 0 ||
      (pendingOnRemaining.length >= 3 && remainingDayCount <= 2) ||
      (pendingOnRemaining.length >= 4 && pendingOnRemaining.length / remainingDayCount > 1.5))
  ) {
    alerts.push({
      id: "many-pending-soon",
      severity: completion.weeklyStatus === "critical" ? "risk" : "warn",
      message: "Tienes muchos bloques pendientes para los días restantes.",
    });
  }

  const latestStudy = getLatestStudyDate(studySessions);
  if (latestStudy && latestStudy <= today) {
    const diff = getDaysUntilDate(today, latestStudy);
    const daysSinceStudy = diff <= 0 ? Math.abs(diff) : 0;
    if (daysSinceStudy >= 3) {
      alerts.push({
        id: "no-recent-study",
        severity: "warn",
        message: "No has estudiado desde hace varios días.",
      });
    }
  } else if (!completion.hasLoggedStudyThisWeek && completion.totalCreditedMinutes === 0 && today >= weekStart) {
    alerts.push({
      id: "no-study-log",
      severity: "info",
      message: "No has registrado estudio esta semana.",
    });
  }

  if (overduePending > 0) {
    alerts.push({
      id: "overdue-sessions",
      severity: overduePending >= 2 ? "risk" : "warn",
      message:
        overduePending === 1
          ? "Tienes 1 bloque pendiente de días anteriores."
          : `Tienes ${overduePending} bloques pendientes de días anteriores.`,
    });
  }

  if (completion.skippedCount >= 2) {
    alerts.push({
      id: "skipped-sessions",
      severity: "warn",
      message: `Has saltado ${completion.skippedCount} sesiones esta semana.`,
    });
  }

  if (
    !allStillPending &&
    isBehindSchedule &&
    remainingRealMinutes > 180 &&
    completion.weeklyStatus !== "on_track" &&
    completion.weeklyStatus !== "ahead"
  ) {
    alerts.push({
      id: "hours-remaining-real",
      severity: completion.weeklyStatus === "critical" ? "risk" : "warn",
      message: `Te quedan ${minutesToHoursLabel(remainingRealMinutes)} reales para cumplir el plan semanal.`,
    });
  } else if (
    !allStillPending &&
    isBehindSchedule &&
    pendingBlockMinutes > 180 &&
    remainingRealMinutes > 60
  ) {
    alerts.push({
      id: "hours-remaining-blocks",
      severity: "warn",
      message: `Te quedan más de ${minutesToHoursLabel(pendingBlockMinutes)} en bloques pendientes.`,
    });
  }

  const avgPerRemainingDay = pendingBlockMinutes / remainingDayCount;
  if (!allStillPending && isBehindSchedule && pendingBlockMinutes > 0 && avgPerRemainingDay > 120) {
    alerts.push({
      id: "heavy-remaining-load",
      severity: "risk",
      message: "Semana muy cargada para el tiempo restante.",
    });
  }

  if (
    !allStillPending &&
    completion.weeklyStatus === "critical" &&
    !alerts.some((a) => a.id === "hours-remaining-real")
  ) {
    alerts.push({
      id: "critical-status",
      severity: "risk",
      message: "Riesgo alto de no cumplir el plan semanal.",
    });
  }

  return alerts;
}
