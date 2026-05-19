import type { PlannedStudySession, StudySession } from "../types";
import {
  calculateCompletedPlannedMinutes,
  calculatePlannedMinutes,
  comparePlannedByStartTime,
  getDaysUntilDate,
  getLatestSessionDateForSubject,
  getTodayDateString,
  minutesToHoursLabel,
} from "../calculations";
import { getPlannedSessionsForWeek } from "../date-utils";
import { isPendingLikeStatus } from "../planner-session-status";

export type CalendarInsight = {
  message: string;
  tone: "neutral" | "positive" | "attention";
};

function daysSinceLabel(fromDate: string, today: string): string {
  const diff = getDaysUntilDate(today, fromDate);
  if (diff <= 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

/** Insight contextual para la cabecera del calendario (semana visible). */
export function getWeekCalendarInsight(
  plannedSessions: PlannedStudySession[],
  weekStart: string,
  weeklyGoalMinutes: number,
  today: string = getTodayDateString(),
): CalendarInsight | null {
  const weekSessions = getPlannedSessionsForWeek(plannedSessions, weekStart);
  if (weekSessions.length === 0) return null;

  const planned = calculatePlannedMinutes(weekSessions);
  const completed = calculateCompletedPlannedMinutes(weekSessions);
  const remaining = Math.max(0, planned - completed);

  const todaySessions = weekSessions
    .filter((s) => s.date === today && isPendingLikeStatus(s.status))
    .sort(comparePlannedByStartTime);

  if (todaySessions.length >= 2) {
    const first = todaySessions[0]!;
    const hasTheoryBeforeBank = todaySessions.some(
      (s, i) =>
        i > 0 &&
        s.subjectId === first.subjectId &&
        s.type === "question_bank" &&
        todaySessions.slice(0, i).some((p) => p.type === "theory"),
    );
    if (hasTheoryBeforeBank) {
      return { message: "Hoy toca teoría antes de banco en al menos una asignatura.", tone: "neutral" };
    }
  }

  const bankPending = weekSessions.filter(
    (s) => s.type === "question_bank" && isPendingLikeStatus(s.status),
  ).length;
  const theoryPending = weekSessions.filter(
    (s) => s.type === "theory" && isPendingLikeStatus(s.status),
  ).length;
  if (theoryPending >= 2 && bankPending === 0) {
    return { message: "Llevas varias sesiones de teoría planificadas: valora añadir banco pronto.", tone: "attention" };
  }

  if (weeklyGoalMinutes > 0 && planned <= weeklyGoalMinutes * 0.55) {
    return { message: "Carga ligera esta semana — buen momento para consolidar.", tone: "positive" };
  }

  if (weeklyGoalMinutes > 0 && planned > weeklyGoalMinutes * 1.05) {
    return { message: "Semana intensa: reparte descansos entre bloques.", tone: "attention" };
  }

  if (theoryPending > 0 && bankPending > 0 && remaining > 0 && remaining <= 90) {
    return { message: "Semana equilibrada entre teoría y banco.", tone: "positive" };
  }

  if (remaining >= 60) {
    return {
      message: `Necesitas recuperar ${minutesToHoursLabel(remaining)} para cerrar el plan.`,
      tone: "attention",
    };
  }

  return null;
}

/** Insight para vista día. */
export function getDayCalendarInsight(
  daySessions: PlannedStudySession[],
  today: string = getTodayDateString(),
): CalendarInsight | null {
  if (daySessions.length === 0) return null;

  const pending = daySessions.filter((s) => isPendingLikeStatus(s.status));
  const completed = daySessions.filter((s) => s.status === "completed").length;

  if (completed === daySessions.length) {
    return { message: "Día completado — buen ritmo.", tone: "positive" };
  }

  const sorted = [...pending].sort(comparePlannedByStartTime);
  const next = sorted[0];
  if (next?.type === "theory") {
    return { message: "Empieza por teoría para sentar base antes del banco.", tone: "neutral" };
  }
  if (next?.type === "question_bank") {
    return { message: "Hoy toca aplicar con banco — refuerza lo estudiado.", tone: "neutral" };
  }

  if (daySessions.length >= 3 && pending.length >= 2) {
    return { message: "Día con varios bloques: prioriza el primero pendiente.", tone: "neutral" };
  }

  return null;
}

/** Última sesión registrada (log) de la asignatura. */
export function getLastStudyLabelForSubject(
  studySessions: StudySession[],
  subjectId: string,
  today: string = getTodayDateString(),
): string | null {
  const last = getLatestSessionDateForSubject(studySessions, subjectId);
  if (!last) return null;
  return `Última sesión ${daysSinceLabel(last, today)}`;
}
