import type { StudySession } from "./types";

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
