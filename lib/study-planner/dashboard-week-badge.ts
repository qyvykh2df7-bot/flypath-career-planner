import type { WeeklyPlanStatus } from "./calculations";

export type DashboardWeekBadgeTone =
  | "warm"
  | "blue"
  | "gold"
  | "green"
  | "greenStrong"
  | "amber"
  | "critical";

export type DashboardWeekBadge = {
  label: string;
  tone: DashboardWeekBadgeTone;
};

/** Clases Tailwind para el chip de «Tu semana». */
export const DASHBOARD_WEEK_BADGE_TONE_CLASS: Record<DashboardWeekBadgeTone, string> = {
  warm: "text-slate-700 bg-slate-100/90 ring-slate-200/60",
  blue: "text-[#1e4a7a] bg-[#e8f0fa] ring-[#3b6ea8]/20",
  gold: "text-[#7a5a16] bg-[#fff8e8] ring-[#c9a454]/25",
  green: "text-emerald-800 bg-emerald-50/90 ring-emerald-200/50",
  greenStrong: "text-emerald-900 bg-emerald-100/90 ring-emerald-300/55",
  amber: "text-amber-900 bg-amber-50/90 ring-amber-200/55",
  critical: "text-rose-900/90 bg-rose-50/85 ring-rose-200/50",
};

/** Por debajo de este % la semana se trata como «recién empezada» en el badge. */
const EARLY_WEEK_PERCENT_MAX = 20;

function badgeFromPercent(completionPercent: number): DashboardWeekBadge {
  const p = Math.round(completionPercent);
  if (p >= 100) return { label: "Semana completada", tone: "greenStrong" };
  if (p >= 81) return { label: "Casi completada", tone: "green" };
  if (p >= 51) return { label: "Avanzando bien", tone: "gold" };
  if (p >= 21) return { label: "Buen ritmo", tone: "blue" };
  return { label: "Semana en marcha", tone: "warm" };
}

/** Copy neutral al inicio de semana (independiente de weeklyStatus). */
function earlyWeekBadge(completionPercent: number): DashboardWeekBadge {
  const p = Math.round(completionPercent);
  if (p <= 0) return { label: "Semana en marcha", tone: "warm" };
  return { label: "Ritmo inicial", tone: "warm" };
}

/**
 * Badge dinámico de progreso semanal (solo presentación).
 * En 0–20% nunca mensaje agresivo; «Te estás quedando atrás» solo si critical y avance >20%.
 */
export function getDashboardWeekBadge(
  weeklyStatus: WeeklyPlanStatus,
  completionPercent: number,
): DashboardWeekBadge {
  const p = Math.round(completionPercent);

  if (p < 100 && p <= EARLY_WEEK_PERCENT_MAX) {
    return earlyWeekBadge(p);
  }

  if (weeklyStatus === "critical") {
    return { label: "Te estás quedando atrás", tone: "critical" };
  }

  if (
    weeklyStatus === "behind" ||
    (weeklyStatus === "slightly_behind" && p >= 30)
  ) {
    return { label: "Revisa el ritmo", tone: "amber" };
  }

  return badgeFromPercent(p);
}

export type DashboardWeekEncouragementInput = {
  completionPercent: number;
  completedSessions: number;
  totalPlannedSessions: number;
  weeklyStatus: WeeklyPlanStatus;
  todayPendingCount?: number;
};

/** Microcopy coach bajo el % (sin nueva lógica de negocio). */
export function getDashboardWeekEncouragement({
  completionPercent,
  completedSessions,
  totalPlannedSessions,
  weeklyStatus,
  todayPendingCount = 0,
}: DashboardWeekEncouragementInput): string {
  const p = Math.round(completionPercent);

  if (p >= 100 || (totalPlannedSessions > 0 && completedSessions >= totalPlannedSessions)) {
    return "Semana cerrada — buen trabajo.";
  }

  if (weeklyStatus === "critical" || weeklyStatus === "behind") {
    return "Hoy toca avanzar con sesiones cortas y claras.";
  }

  if (completedSessions === 0) {
    return "Empieza por el siguiente bloque.";
  }

  if (completedSessions === 1) {
    return "Buen inicio: ya has completado el primer bloque.";
  }

  if (p < 50) {
    return "Completa un bloque más para mantener el ritmo.";
  }

  if (todayPendingCount > 0) {
    return "Cierra los bloques de hoy y suma a la semana.";
  }

  if (p >= 81) {
    return "Un empujón más y cierras la semana.";
  }

  return "Sigue así: cada bloque suma al objetivo.";
}
