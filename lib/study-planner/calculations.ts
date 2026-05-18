import type { PlannedStudySession, StudySession } from "./types";

export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function minutesToHoursLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 h";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return h === 1 ? "1 h" : `${h} h`;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

export function calculateTotalStudyMinutes(sessions: StudySession[]): number {
  return sessions.reduce(
    (sum, s) => sum + (Number.isFinite(s.durationMinutes) ? s.durationMinutes : 0),
    0,
  );
}

export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDateLocal(monday), end: formatDateLocal(sunday) };
}

export function getSessionsForCurrentWeek(sessions: StudySession[]): StudySession[] {
  const { start, end } = getCurrentWeekRange();
  return sessions.filter((s) => s.date >= start && s.date <= end);
}

export function calculateMinutesBySubject(sessions: StudySession[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    if (!Number.isFinite(s.durationMinutes)) continue;
    map[s.subjectId] = (map[s.subjectId] ?? 0) + s.durationMinutes;
  }
  return map;
}

export function calculateActiveSubjectIds(sessions: StudySession[], days = 14): string[] {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = formatDateLocal(cutoff);
  const ids = new Set<string>();
  for (const s of sessions) {
    if (s.date >= cutoffStr) ids.add(s.subjectId);
  }
  return [...ids];
}

export function getLatestSessionDateForSubject(
  sessions: StudySession[],
  subjectId: string,
): string | null {
  const dates = sessions.filter((s) => s.subjectId === subjectId).map((s) => s.date);
  if (dates.length === 0) return null;
  return dates.sort((a, b) => b.localeCompare(a))[0];
}

export type StudyHealthLevel = "no_data" | "low" | "progress" | "good";

export function calculateStudyHealth(
  weekMinutes: number,
  weeklyGoalMinutes: number,
): { level: StudyHealthLevel; message: string } {
  if (weekMinutes <= 0) {
    return { level: "no_data", message: "Registra sesiones para ver tu ritmo." };
  }
  const pct = weeklyGoalMinutes > 0 ? (weekMinutes / weeklyGoalMinutes) * 100 : 0;
  if (pct < 40) {
    return { level: "low", message: "Vas por debajo de tu objetivo semanal." };
  }
  if (pct < 80) {
    return { level: "progress", message: "Estás avanzando, pero aún queda margen." };
  }
  return { level: "good", message: "Buen ritmo esta semana." };
}

export function studyHealthLabel(level: StudyHealthLevel): string {
  switch (level) {
    case "no_data":
      return "Sin datos";
    case "low":
      return "Bajo";
    case "progress":
      return "En progreso";
    case "good":
      return "Buen ritmo";
  }
}

export function getLastNDays(days: number): string[] {
  const result: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(formatDateLocal(d));
  }
  return result;
}

export function getSessionsForDate(sessions: StudySession[], date: string): StudySession[] {
  return sessions.filter((s) => s.date === date);
}

export function calculateMinutesByDate(
  sessions: StudySession[],
  dates: string[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const date of dates) map[date] = 0;
  for (const s of sessions) {
    if (!dates.includes(s.date)) continue;
    if (!Number.isFinite(s.durationMinutes)) continue;
    map[s.date] = (map[s.date] ?? 0) + s.durationMinutes;
  }
  return map;
}

export function getMostStudiedSubjectId(sessions: StudySession[]): string | null {
  const bySubject = calculateMinutesBySubject(sessions);
  let bestId: string | null = null;
  let bestMinutes = 0;
  for (const [id, minutes] of Object.entries(bySubject)) {
    if (minutes > bestMinutes) {
      bestMinutes = minutes;
      bestId = id;
    }
  }
  return bestId;
}

export function getLeastStudiedSubjectId(
  sessions: StudySession[],
  subjectIds: string[],
): string | null {
  if (subjectIds.length === 0) return null;
  const bySubject = calculateMinutesBySubject(sessions);
  let leastId: string | null = subjectIds[0];
  let leastMinutes = Infinity;
  for (const id of subjectIds) {
    const minutes = bySubject[id] ?? 0;
    if (minutes < leastMinutes) {
      leastMinutes = minutes;
      leastId = id;
    }
  }
  return leastId;
}

export function calculateWeeklyCompletionPercentage(
  completedMinutes: number,
  goalMinutes: number,
): number {
  if (!Number.isFinite(goalMinutes) || goalMinutes <= 0) return 0;
  if (!Number.isFinite(completedMinutes) || completedMinutes <= 0) return 0;
  return Math.min(100, Math.round((completedMinutes / goalMinutes) * 100));
}

export function getWeeklyGoalStatusMessage(percentage: number): string {
  if (percentage <= 0) return "Aún no has empezado esta semana.";
  if (percentage < 40) return "Vas por debajo de tu objetivo.";
  if (percentage < 80) return "Buen avance, pero aún queda margen.";
  if (percentage < 100) return "Muy cerca del objetivo semanal.";
  return "Objetivo semanal completado.";
}

const DAY_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export function getDayShortLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return DAY_SHORT_ES[date.getDay()] ?? dateStr;
}

export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export function createPlannerId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getCurrentWeekDates(): string[] {
  const { start } = getCurrentWeekRange();
  const [y, m, d] = start.split("-").map(Number);
  const monday = new Date(y, m - 1, d);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(formatDateLocal(day));
  }
  return dates;
}

export function getPlannedSessionsForCurrentWeek(
  plannedSessions: PlannedStudySession[],
): PlannedStudySession[] {
  const { start, end } = getCurrentWeekRange();
  return plannedSessions.filter((p) => p.date >= start && p.date <= end);
}

export function calculatePlannedMinutes(plannedSessions: PlannedStudySession[]): number {
  return plannedSessions.reduce(
    (sum, p) => sum + (Number.isFinite(p.plannedDurationMinutes) ? p.plannedDurationMinutes : 0),
    0,
  );
}

export function calculateCompletedPlannedMinutes(plannedSessions: PlannedStudySession[]): number {
  return plannedSessions
    .filter((p) => p.status === "completed")
    .reduce(
      (sum, p) => sum + (Number.isFinite(p.plannedDurationMinutes) ? p.plannedDurationMinutes : 0),
      0,
    );
}

export function comparePlannedByStartTime(a: PlannedStudySession, b: PlannedStudySession): number {
  if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
  if (a.startTime) return -1;
  if (b.startTime) return 1;
  return 0;
}

export const PLANNED_STATUS_LABELS: Record<
  PlannedStudySession["status"],
  string
> = {
  planned: "Planificada",
  completed: "Completada",
  skipped: "Saltada",
};
