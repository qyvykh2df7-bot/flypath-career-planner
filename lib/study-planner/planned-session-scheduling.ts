export const PAST_PLAN_DATE_ERROR =
  "No puedes planificar sesiones en días pasados.";

/** Fechas estrictamente anteriores a hoy no admiten planificación manual. */
export function canSchedulePlannedSessionOnDate(date: string, today: string): boolean {
  return date >= today;
}

export function validatePlannedSessionScheduleDate(
  date: string,
  today: string,
): { ok: true } | { ok: false; error: string } {
  if (canSchedulePlannedSessionOnDate(date, today)) {
    return { ok: true };
  }
  return { ok: false, error: PAST_PLAN_DATE_ERROR };
}
