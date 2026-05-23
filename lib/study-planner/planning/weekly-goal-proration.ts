import type { WeekKind } from "../date-utils";

const DAYS_IN_WEEK = 7;

export type WeeklyGoalProration = {
  effectiveMinutes: number;
  /** true cuando la semana actual se genera con menos días que la semana completa. */
  prorated: boolean;
  eligibleDayCount: number;
};

/**
 * Reparte el objetivo semanal de forma proporcional si quedan pocos días en la semana actual.
 * Semana futura o semana completa (lun–dom disponibles) → carga completa.
 */
export function computeWeeklyGoalProration(params: {
  weeklyGoalMinutes: number;
  weekKind: WeekKind;
  eligibleDayCount: number;
  daysInWeek?: number;
}): WeeklyGoalProration {
  const daysInWeek = params.daysInWeek ?? DAYS_IN_WEEK;
  const goal = Math.max(0, params.weeklyGoalMinutes);
  const eligible = Math.max(0, Math.min(params.eligibleDayCount, daysInWeek));

  if (goal === 0 || eligible === 0) {
    return { effectiveMinutes: 0, prorated: false, eligibleDayCount: eligible };
  }

  const fullWeek =
    params.weekKind === "future" || eligible >= daysInWeek;

  if (fullWeek) {
    return { effectiveMinutes: goal, prorated: false, eligibleDayCount: eligible };
  }

  const effectiveMinutes = Math.max(
    30,
    Math.round((goal * eligible) / daysInWeek),
  );

  return {
    effectiveMinutes,
    prorated: true,
    eligibleDayCount: eligible,
  };
}

/** Máximo razonable de minutos planificados en un solo día (evita picos tras prorrateo). */
export const MAX_PLANNED_MINUTES_PER_DAY = 360;
