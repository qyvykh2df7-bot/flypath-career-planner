import type { PlannedStudySession } from "./types";

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Lunes de la semana que contiene `dateStr` (YYYY-MM-DD). */
export function getWeekStart(dateStr: string): string {
  const date = parseDateLocal(dateStr);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() + diffToMonday);
  return formatDateLocal(monday);
}

/** Domingo de la semana cuyo lunes es `weekStart`. */
export function getWeekEnd(weekStart: string): string {
  const monday = parseDateLocal(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return formatDateLocal(sunday);
}

/** Suma `amount` semanas al lunes `weekStart` y devuelve el nuevo lunes. */
export function addWeeks(weekStart: string, amount: number): string {
  const monday = parseDateLocal(weekStart);
  monday.setDate(monday.getDate() + amount * 7);
  return formatDateLocal(monday);
}

export function getWeekRange(weekStart: string): { start: string; end: string } {
  return { start: weekStart, end: getWeekEnd(weekStart) };
}

/** Las 7 fechas (lun–dom) de la semana que empieza en `weekStart`. */
export function getWeekDates(weekStart: string): string[] {
  const monday = parseDateLocal(weekStart);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(formatDateLocal(day));
  }
  return dates;
}

export function getCurrentWeekStart(today: string = formatDateLocal(new Date())): string {
  return getWeekStart(today);
}

export type WeekKind = "current" | "past" | "future";

export function getWeekKind(weekStart: string, today: string = formatDateLocal(new Date())): WeekKind {
  const currentStart = getCurrentWeekStart(today);
  if (weekStart === currentStart) return "current";
  if (weekStart < currentStart) return "past";
  return "future";
}

const MONTH_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/** Rango legible, p. ej. "12 may – 18 may". */
export function formatWeekRange(weekStart: string): string {
  const end = getWeekEnd(weekStart);
  const fmt = (s: string) => {
    const [, m, d] = s.split("-").map(Number);
    const month = MONTH_SHORT_ES[m - 1] ?? String(m);
    return `${d} ${month}`;
  };
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

export function getPlannedSessionsForWeek(
  plannedSessions: PlannedStudySession[],
  weekStart: string,
): PlannedStudySession[] {
  const { start, end } = getWeekRange(weekStart);
  return plannedSessions.filter((p) => p.date >= start && p.date <= end);
}

/** Progreso esperado acumulado (0–100) según el día de la semana (lun–dom). */
const EXPECTED_PROGRESS_BY_WEEKDAY = [15, 30, 45, 60, 75, 90, 100] as const;

export function getExpectedProgressPercentForDate(
  today: string,
  weekStart: string = getCurrentWeekStart(today),
): number {
  const weekDates = getWeekDates(weekStart);
  const idx = weekDates.indexOf(today);
  if (idx < 0) {
    if (today < weekStart) return 0;
    return 100;
  }
  return EXPECTED_PROGRESS_BY_WEEKDAY[idx] ?? 100;
}
