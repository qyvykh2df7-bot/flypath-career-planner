import type {
  ErrorLogItem,
  ErrorLogType,
  MockResult,
  PlannedStudySession,
  ReviewItem,
  ReviewStatus,
  StudyMode,
  StudySession,
  SubjectReadiness,
  SubjectReadinessLevel,
} from "./types";
import { ERROR_LOG_TYPE_OPTIONS, getErrorLogTypeLabel } from "./labels";
import {
  formatDateLocal,
  getCurrentWeekStart,
  getExpectedProgressPercentForDate,
  getWeekDates,
  getWeekRange,
} from "./date-utils";

export { formatDateLocal } from "./date-utils";

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
  return getWeekRange(getCurrentWeekStart());
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

export function formatExamDisplayDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  const month = MONTH_SHORT_ES[m - 1] ?? String(m);
  return `${d} ${month}`;
}

export function getDaysUntilDate(
  targetDate: string,
  today: string = getTodayDateString(),
): number {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = targetDate.split("-").map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

export function formatDaysRemaining(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "falta 1 día";
  if (days < 0) return `hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  return `faltan ${days} días`;
}

export type ExamUrgencyBadge = "Esta semana" | "Próximo" | "Planificado";

export function getExamUrgencyBadge(daysLeft: number): ExamUrgencyBadge {
  if (daysLeft <= 7) return "Esta semana";
  if (daysLeft <= 21) return "Próximo";
  return "Planificado";
}

export function getExamUrgencyTone(daysLeft: number): "risk" | "warn" | "good" {
  if (daysLeft <= 7) return "risk";
  if (daysLeft <= 21) return "warn";
  return "good";
}

export function getNextUpcomingExam<T extends { subjectId: string; date: string }>(
  examDates: T[],
  today: string = getTodayDateString(),
): T | null {
  const upcoming = examDates
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? null;
}

export function sortExamDatesByDateAsc<T extends { date: string }>(examDates: T[]): T[] {
  return [...examDates].sort((a, b) => a.date.localeCompare(b.date));
}

export function createPlannerId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getCurrentWeekDates(): string[] {
  return getWeekDates(getCurrentWeekStart());
}

export function getPlannedSessionsForCurrentWeek(
  plannedSessions: PlannedStudySession[],
): PlannedStudySession[] {
  const { start, end } = getCurrentWeekRange();
  return plannedSessions.filter((p) => p.date >= start && p.date <= end);
}

/** Alias explícito para el plan de la semana actual (dashboard / cumplimiento). */
export function getCurrentWeekPlannedSessions(
  plannedSessions: PlannedStudySession[],
): PlannedStudySession[] {
  return getPlannedSessionsForCurrentWeek(plannedSessions);
}

export type WeeklyPlanCompletionStatus = "no_plan" | "goal_without_plan";

export type WeeklyPlanStatus =
  | "ahead"
  | "on_track"
  | "slightly_behind"
  | "behind"
  | "critical";

export type WeeklyPlanCompletion = {
  weekSessions: PlannedStudySession[];
  weekLoggedSessions: StudySession[];
  plannedMinutes: number;
  completedPlannedMinutes: number;
  actualLoggedMinutes: number;
  totalCreditedMinutes: number;
  completionPercent: number;
  expectedProgressPercent: number;
  expectedMinutesByToday: number;
  progressDelta: number;
  weeklyStatus: WeeklyPlanStatus;
  pendingCount: number;
  completedCount: number;
  skippedCount: number;
  hasPlan: boolean;
  hasLoggedStudyThisWeek: boolean;
  /** Objetivo de referencia: plan semanal o weeklyGoalMinutes si no hay plan. */
  weeklyGoalMinutes: number;
  targetMinutes: number;
  usesWeeklyGoalAsTarget: boolean;
  /** Texto explicativo cuando se usa objetivo semanal sin plan. */
  referenceHint?: string;
  status?: WeeklyPlanCompletionStatus;
  statusMessage: string;
  upcomingSessions: PlannedStudySession[];
};

export function weeklyStatusMessage(
  status: WeeklyPlanStatus,
  usesWeeklyGoalAsTarget = false,
): string {
  switch (status) {
    case "ahead":
      return usesWeeklyGoalAsTarget
        ? "Vas adelantado respecto a tu objetivo semanal"
        : "Vas adelantado esta semana";
    case "on_track":
      return "Vas en ritmo";
    case "slightly_behind":
      return "Empiezas a retrasarte";
    case "behind":
      return usesWeeklyGoalAsTarget
        ? "Vas retrasado respecto a tu objetivo semanal"
        : "Vas bastante retrasado";
    case "critical":
      return usesWeeklyGoalAsTarget
        ? "Riesgo alto de no cumplir tu objetivo semanal"
        : "Riesgo alto de no cumplir el plan semanal";
  }
}

function resolveWeeklyStatus(progressDelta: number): WeeklyPlanStatus {
  if (progressDelta > 10) return "ahead";
  if (progressDelta >= -5) return "on_track";
  if (progressDelta >= -15) return "slightly_behind";
  if (progressDelta >= -30) return "behind";
  return "critical";
}

function emptyWeeklyPlanCompletion(
  overrides: Partial<WeeklyPlanCompletion> & Pick<WeeklyPlanCompletion, "status" | "statusMessage">,
): WeeklyPlanCompletion {
  return {
    weekSessions: [],
    weekLoggedSessions: [],
    plannedMinutes: 0,
    completedPlannedMinutes: 0,
    actualLoggedMinutes: 0,
    totalCreditedMinutes: 0,
    completionPercent: 0,
    expectedProgressPercent: 0,
    expectedMinutesByToday: 0,
    progressDelta: 0,
    weeklyStatus: "on_track",
    pendingCount: 0,
    completedCount: 0,
    skippedCount: 0,
    hasPlan: false,
    hasLoggedStudyThisWeek: false,
    weeklyGoalMinutes: 0,
    targetMinutes: 0,
    usesWeeklyGoalAsTarget: false,
    upcomingSessions: [],
    ...overrides,
  };
}

function buildGoalBasedCompletion(params: {
  weekLoggedSessions: StudySession[];
  actualLoggedMinutes: number;
  weeklyGoalMinutes: number;
  today: string;
}): WeeklyPlanCompletion {
  const { weekLoggedSessions, actualLoggedMinutes, weeklyGoalMinutes, today } = params;
  const weekStart = getCurrentWeekStart(today);
  const targetMinutes = Math.max(60, weeklyGoalMinutes);
  const totalCreditedMinutes = actualLoggedMinutes;
  const completionPercent =
    targetMinutes > 0 ? Math.round((totalCreditedMinutes / targetMinutes) * 100) : 0;
  const expectedProgressPercent = getExpectedProgressPercentForDate(today, weekStart);
  const expectedMinutesByToday = Math.round((targetMinutes * expectedProgressPercent) / 100);
  const progressDelta = completionPercent - expectedProgressPercent;
  const weeklyStatus = resolveWeeklyStatus(progressDelta);

  return {
    weekSessions: [],
    weekLoggedSessions,
    plannedMinutes: 0,
    completedPlannedMinutes: 0,
    actualLoggedMinutes,
    totalCreditedMinutes,
    completionPercent,
    expectedProgressPercent,
    expectedMinutesByToday,
    progressDelta,
    weeklyStatus,
    pendingCount: 0,
    completedCount: 0,
    skippedCount: 0,
    hasPlan: false,
    hasLoggedStudyThisWeek: actualLoggedMinutes > 0,
    weeklyGoalMinutes: targetMinutes,
    targetMinutes,
    usesWeeklyGoalAsTarget: true,
    referenceHint: "Sin plan generado, usando tu objetivo semanal como referencia.",
    status: "goal_without_plan",
    statusMessage: weeklyStatusMessage(weeklyStatus, true),
    upcomingSessions: [],
  };
}

export function calculateWeeklyPlanCompletion(
  plannedSessions: PlannedStudySession[],
  studySessions: StudySession[] = [],
  weeklyGoalMinutes: number = 0,
  today: string = getTodayDateString(),
): WeeklyPlanCompletion {
  const weekSessions = getCurrentWeekPlannedSessions(plannedSessions);
  const weekLoggedSessions = getSessionsForCurrentWeek(studySessions);
  const actualLoggedMinutes = calculateTotalStudyMinutes(weekLoggedSessions);
  const hasPlan = weekSessions.length > 0;
  const hasLoggedStudyThisWeek = actualLoggedMinutes > 0;
  const goalMinutes = Math.max(0, weeklyGoalMinutes);

  if (!hasPlan && goalMinutes > 0) {
    return buildGoalBasedCompletion({
      weekLoggedSessions,
      actualLoggedMinutes,
      weeklyGoalMinutes: goalMinutes,
      today,
    });
  }

  if (!hasPlan && !hasLoggedStudyThisWeek) {
    return emptyWeeklyPlanCompletion({
      weeklyGoalMinutes: goalMinutes,
      status: "no_plan",
      statusMessage: "Sin plan semanal todavía",
    });
  }

  const weekStart = getCurrentWeekStart(today);
  const plannedMinutes = calculatePlannedMinutes(weekSessions);
  const completedPlannedMinutes = calculateCompletedPlannedMinutes(weekSessions);
  const totalCreditedMinutes = Math.max(completedPlannedMinutes, actualLoggedMinutes);
  const pending = weekSessions.filter((p) => p.status === "planned");
  const completed = weekSessions.filter((p) => p.status === "completed");
  const skipped = weekSessions.filter((p) => p.status === "skipped");

  const completionPercent =
    plannedMinutes > 0 ? Math.round((totalCreditedMinutes / plannedMinutes) * 100) : 0;

  const expectedProgressPercent = getExpectedProgressPercentForDate(today, weekStart);
  const expectedMinutesByToday = Math.round((plannedMinutes * expectedProgressPercent) / 100);
  const progressDelta = completionPercent - expectedProgressPercent;
  const weeklyStatus = resolveWeeklyStatus(progressDelta);
  const statusMessage = weeklyStatusMessage(weeklyStatus, false);

  const sortUpcoming = (a: PlannedStudySession, b: PlannedStudySession) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return comparePlannedByStartTime(a, b);
  };

  const upcomingFromToday = pending.filter((p) => p.date >= today).sort(sortUpcoming);
  const upcomingSessions = (upcomingFromToday.length > 0 ? upcomingFromToday : [...pending].sort(sortUpcoming)).slice(
    0,
    3,
  );

  return {
    weekSessions,
    weekLoggedSessions,
    plannedMinutes,
    completedPlannedMinutes,
    actualLoggedMinutes,
    totalCreditedMinutes,
    completionPercent,
    expectedProgressPercent,
    expectedMinutesByToday,
    progressDelta,
    weeklyStatus,
    pendingCount: pending.length,
    completedCount: completed.length,
    skippedCount: skipped.length,
    hasPlan: true,
    hasLoggedStudyThisWeek,
    weeklyGoalMinutes: goalMinutes,
    targetMinutes: plannedMinutes,
    usesWeeklyGoalAsTarget: false,
    statusMessage,
    upcomingSessions,
  };
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

export function sortMocksByDateDesc(mockResults: MockResult[]): MockResult[] {
  return [...mockResults].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function getMocksBySubject(mockResults: MockResult[]): Record<string, MockResult[]> {
  const map: Record<string, MockResult[]> = {};
  for (const mock of sortMocksByDateDesc(mockResults)) {
    if (!map[mock.subjectId]) map[mock.subjectId] = [];
    map[mock.subjectId].push(mock);
  }
  return map;
}

export function getLatestMockForSubject(
  mockResults: MockResult[],
  subjectId: string,
): MockResult | null {
  const sorted = sortMocksByDateDesc(mockResults.filter((m) => m.subjectId === subjectId));
  return sorted[0] ?? null;
}

export function calculateAverageMockScore(mockResults: MockResult[], limit?: number): number | null {
  const sorted = sortMocksByDateDesc(mockResults);
  const slice = limit !== undefined ? sorted.slice(0, limit) : sorted;
  if (slice.length === 0) return null;
  const sum = slice.reduce((acc, m) => acc + m.score, 0);
  return Math.round((sum / slice.length) * 10) / 10;
}

export function getBestMockScore(mockResults: MockResult[]): number | null {
  if (mockResults.length === 0) return null;
  return Math.max(...mockResults.map((m) => m.score));
}

export function getMockTrend(mockResults: MockResult[]): "up" | "down" | "stable" | "none" {
  const sorted = sortMocksByDateDesc(mockResults);
  if (sorted.length < 2) return "none";
  const latest = sorted[0].score;
  const previous = sorted[1].score;
  if (latest > previous) return "up";
  if (latest < previous) return "down";
  return "stable";
}

export const MOCK_TREND_LABELS: Record<ReturnType<typeof getMockTrend>, string> = {
  up: "Subiendo",
  down: "Bajando",
  stable: "Estable",
  none: "Sin tendencia",
};

export function formatMockScore(score: number): string {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded}%`;
}

export function getMocksForCurrentWeek(mockResults: MockResult[]): MockResult[] {
  const { start, end } = getCurrentWeekRange();
  return mockResults.filter((m) => m.date >= start && m.date <= end);
}

export function getLatestMock(mockResults: MockResult[]): MockResult | null {
  const sorted = sortMocksByDateDesc(mockResults);
  return sorted[0] ?? null;
}

export const READINESS_LEVEL_LABELS: Record<SubjectReadinessLevel, string> = {
  no_data: "Sin datos",
  low: "Riesgo alto",
  medium: "Ajustado",
  high: "Buen progreso",
  solid: "Sólido",
};

export const READINESS_LEVEL_MESSAGES: Record<SubjectReadinessLevel, string> = {
  no_data: "Registra sesiones o mocks para calcular readiness.",
  low: "Faltan datos, horas o resultados suficientes antes de presentarte.",
  medium: "Hay base, pero todavía conviene reforzar antes de examinarte.",
  high: "La asignatura va bien, mantén repasos y mocks.",
  solid: "Buen nivel orientativo, mantén consistencia hasta el examen.",
};

export function getDaysSinceDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  then.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
}

function scoreTotalHoursPoints(totalMinutes: number): number {
  const hours = totalMinutes / 60;
  if (hours <= 0) return 0;
  if (hours <= 3) return 8;
  if (hours <= 6) return 15;
  if (hours <= 10) return 20;
  return 25;
}

function scoreRecentStudyPoints(recentMinutes: number): number {
  if (recentMinutes <= 0) return 0;
  if (recentMinutes < 120) return 8;
  if (recentMinutes <= 300) return 14;
  return 20;
}

function scoreAverageMockPoints(avg: number | null): number {
  if (avg === null) return 0;
  if (avg < 60) return 8;
  if (avg < 70) return 16;
  if (avg < 80) return 25;
  if (avg < 90) return 31;
  return 35;
}

function scoreMockCountPoints(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 4;
  if (count === 2) return 7;
  return 10;
}

function scoreRecencyPoints(daysSince: number | null): number {
  if (daysSince === null) return 0;
  if (daysSince === 0) return 10;
  if (daysSince <= 7) return 8;
  if (daysSince <= 21) return 5;
  return 2;
}

function resolveReadinessLevel(
  score: number,
  hasSessions: boolean,
  mockCount: number,
): SubjectReadinessLevel {
  if (!hasSessions && mockCount === 0) return "no_data";
  if (score <= 39) return "low";
  if (score <= 59) return "medium";
  if (score <= 79) return "high";
  return "solid";
}

export function calculateSubjectReadiness(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
}): SubjectReadiness {
  const { subjectId, sessions, mockResults } = params;
  const subjectSessions = sessions.filter((s) => s.subjectId === subjectId);
  const subjectMocks = mockResults.filter((m) => m.subjectId === subjectId);

  const totalStudyMinutes = subjectSessions.reduce(
    (sum, s) => sum + (Number.isFinite(s.durationMinutes) ? s.durationMinutes : 0),
    0,
  );

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = formatDateLocal(cutoff);
  const recentStudyMinutes = subjectSessions
    .filter((s) => s.date >= cutoffStr)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const latestMock = getLatestMockForSubject(mockResults, subjectId);
  const latestMockScore = latestMock?.score ?? null;
  const averageMockScore = calculateAverageMockScore(subjectMocks, 3);
  const mockCount = subjectMocks.length;

  const lastDate = getLatestSessionDateForSubject(sessions, subjectId);
  const daysSinceLastSession = lastDate !== null ? getDaysSinceDate(lastDate) : null;

  const hasSessions = subjectSessions.length > 0;
  const hoursPoints = scoreTotalHoursPoints(totalStudyMinutes);
  const recentPoints = scoreRecentStudyPoints(recentStudyMinutes);
  const mockAvgPoints = scoreAverageMockPoints(averageMockScore);
  const mockCountPoints = scoreMockCountPoints(mockCount);
  const recencyPoints = scoreRecencyPoints(daysSinceLastSession);

  const rawScore = hoursPoints + recentPoints + mockAvgPoints + mockCountPoints + recencyPoints;
  const score = Math.min(100, Math.max(0, rawScore));
  const level = resolveReadinessLevel(score, hasSessions, mockCount);

  return {
    subjectId,
    score,
    level,
    label: READINESS_LEVEL_LABELS[level],
    message: READINESS_LEVEL_MESSAGES[level],
    factors: {
      totalStudyMinutes,
      recentStudyMinutes,
      latestMockScore,
      averageMockScore,
      mockCount,
      daysSinceLastSession,
    },
  };
}

export function calculateReadinessForSubjects(params: {
  subjectIds: string[];
  sessions: StudySession[];
  mockResults: MockResult[];
}): SubjectReadiness[] {
  return params.subjectIds.map((subjectId) =>
    calculateSubjectReadiness({
      subjectId,
      sessions: params.sessions,
      mockResults: params.mockResults,
    }),
  );
}

const READINESS_SORT_ORDER: Record<SubjectReadinessLevel, number> = {
  low: 0,
  medium: 1,
  no_data: 2,
  high: 3,
  solid: 4,
};

export function sortReadinessForDisplay(readinessList: SubjectReadiness[]): SubjectReadiness[] {
  return [...readinessList].sort((a, b) => {
    const levelDiff = READINESS_SORT_ORDER[a.level] - READINESS_SORT_ORDER[b.level];
    if (levelDiff !== 0) return levelDiff;
    if (a.level === "low" || a.level === "medium") return a.score - b.score;
    return b.score - a.score;
  });
}

export function getReadinessSummary(readinessList: SubjectReadiness[]): {
  averageScore: number | null;
  solidCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  noDataCount: number;
  withDataCount: number;
} {
  const withData = readinessList.filter((r) => r.level !== "no_data");
  const averageScore =
    withData.length > 0
      ? Math.round(withData.reduce((sum, r) => sum + r.score, 0) / withData.length)
      : null;

  return {
    averageScore,
    solidCount: readinessList.filter((r) => r.level === "solid").length,
    lowCount: readinessList.filter((r) => r.level === "low").length,
    mediumCount: readinessList.filter((r) => r.level === "medium").length,
    highCount: readinessList.filter((r) => r.level === "high").length,
    noDataCount: readinessList.filter((r) => r.level === "no_data").length,
    withDataCount: withData.length,
  };
}

export function getReadinessDashboardHint(summary: ReturnType<typeof getReadinessSummary>): string {
  if (summary.withDataCount === 0) {
    return "Registra horas y mocks para calcular readiness.";
  }
  if (summary.lowCount > 0) {
    return "Hay asignaturas con readiness bajo. Conviene reforzar antes de presentarte.";
  }
  if (summary.solidCount + summary.highCount >= Math.max(1, Math.floor(summary.withDataCount / 2))) {
    return "Varias asignaturas muestran buen progreso orientativo.";
  }
  return "Revisa asignaturas ajustadas y mantén repasos regulares.";
}

export function getTodayDateString(): string {
  return formatDateLocal(new Date());
}

export function addDaysToDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(y, m - 1, d);
  next.setDate(next.getDate() + days);
  return formatDateLocal(next);
}

export function getReviewStatus(item: ReviewItem, today: string = getTodayDateString()): ReviewStatus {
  if (item.status === "completed" || item.completedAt) return "completed";
  if (item.dueDate < today) return "overdue";
  return "pending";
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  overdue: "Atrasado",
  completed: "Completado",
};

export function groupReviewItemsByStatus(
  items: ReviewItem[],
  today: string = getTodayDateString(),
): {
  today: ReviewItem[];
  overdue: ReviewItem[];
  upcoming: ReviewItem[];
  completed: ReviewItem[];
} {
  const todayList: ReviewItem[] = [];
  const overdue: ReviewItem[] = [];
  const upcoming: ReviewItem[] = [];
  const completed: ReviewItem[] = [];

  for (const item of items) {
    const status = getReviewStatus(item, today);
    if (status === "completed") {
      completed.push(item);
    } else if (status === "overdue") {
      overdue.push(item);
    } else if (item.dueDate === today) {
      todayList.push(item);
    } else {
      upcoming.push(item);
    }
  }

  const byDue = (a: ReviewItem, b: ReviewItem) => a.dueDate.localeCompare(b.dueDate);
  const byCompleted = (a: ReviewItem, b: ReviewItem) =>
    (b.completedAt ?? "").localeCompare(a.completedAt ?? "");

  return {
    today: todayList.sort(byDue),
    overdue: overdue.sort(byDue),
    upcoming: upcoming.sort(byDue),
    completed: completed.sort(byCompleted),
  };
}

export function calculatePendingReviewCount(
  items: ReviewItem[],
  today: string = getTodayDateString(),
): number {
  return items.filter((item) => getReviewStatus(item, today) !== "completed").length;
}

export function calculateOverdueReviewCount(
  items: ReviewItem[],
  today: string = getTodayDateString(),
): number {
  return items.filter((item) => getReviewStatus(item, today) === "overdue").length;
}

export function formatReviewIntervalDays(days: number): string {
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

export function getReviewDashboardHint(
  pendingCount: number,
  overdueCount: number,
): { value: string; hint: string } {
  if (pendingCount === 0) {
    return { value: "0 pendientes", hint: "Sin repasos pendientes" };
  }
  if (overdueCount > 0) {
    return {
      value: `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`,
      hint: `${overdueCount} atrasado${overdueCount === 1 ? "" : "s"} · Tienes repasos atrasados`,
    };
  }
  return {
    value: `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`,
    hint: "Repasos programados en la pestaña Repasos",
  };
}

const ALL_ERROR_LOG_TYPES: ErrorLogType[] = ERROR_LOG_TYPE_OPTIONS.map((o) => o.value);

export function getErrorLogsBySubject(errorLogItems: ErrorLogItem[]): Record<string, ErrorLogItem[]> {
  const map: Record<string, ErrorLogItem[]> = {};
  for (const item of errorLogItems) {
    if (!map[item.subjectId]) map[item.subjectId] = [];
    map[item.subjectId].push(item);
  }
  for (const id of Object.keys(map)) {
    map[id].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }
  return map;
}

export function getErrorLogsByType(errorLogItems: ErrorLogItem[]): Record<ErrorLogType, number> {
  const counts = Object.fromEntries(ALL_ERROR_LOG_TYPES.map((t) => [t, 0])) as Record<
    ErrorLogType,
    number
  >;
  for (const item of errorLogItems) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }
  return counts;
}

export function calculatePendingErrorCount(errorLogItems: ErrorLogItem[]): number {
  return errorLogItems.filter((e) => e.status === "pending").length;
}

export function calculateResolvedErrorCount(errorLogItems: ErrorLogItem[]): number {
  return errorLogItems.filter((e) => e.status === "resolved").length;
}

export function getMostCommonErrorType(errorLogItems: ErrorLogItem[]): ErrorLogType | null {
  const counts = getErrorLogsByType(errorLogItems);
  let best: ErrorLogType | null = null;
  let bestCount = 0;
  for (const type of ALL_ERROR_LOG_TYPES) {
    if (counts[type] > bestCount) {
      bestCount = counts[type];
      best = type;
    }
  }
  return bestCount > 0 ? best : null;
}

export function getSubjectWithMostErrors(errorLogItems: ErrorLogItem[]): string | null {
  const bySubject = getErrorLogsBySubject(errorLogItems);
  let bestId: string | null = null;
  let bestCount = 0;
  for (const [subjectId, items] of Object.entries(bySubject)) {
    if (items.length > bestCount) {
      bestCount = items.length;
      bestId = subjectId;
    }
  }
  return bestId;
}

export function getRecentErrorLogCount(errorLogItems: ErrorLogItem[], days = 7): number {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffStr = formatDateLocal(cutoff);
  return errorLogItems.filter((e) => e.date >= cutoffStr).length;
}

export function getErrorTypeRanking(
  errorLogItems: ErrorLogItem[],
): { type: ErrorLogType; label: string; count: number }[] {
  const counts = getErrorLogsByType(errorLogItems);
  return ALL_ERROR_LOG_TYPES.map((type) => ({
    type,
    label: getErrorLogTypeLabel(type),
    count: counts[type],
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function groupErrorLogByStatus(errorLogItems: ErrorLogItem[]): {
  pending: ErrorLogItem[];
  reviewed: ErrorLogItem[];
  resolved: ErrorLogItem[];
} {
  const pending: ErrorLogItem[] = [];
  const reviewed: ErrorLogItem[] = [];
  const resolved: ErrorLogItem[] = [];
  const sorted = [...errorLogItems].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  for (const item of sorted) {
    if (item.status === "resolved") resolved.push(item);
    else if (item.status === "reviewed") reviewed.push(item);
    else pending.push(item);
  }
  return { pending, reviewed, resolved };
}

export function calculatePendingErrorsForSubject(
  errorLogItems: ErrorLogItem[],
  subjectId: string,
): number {
  return errorLogItems.filter((e) => e.subjectId === subjectId && e.status === "pending").length;
}

export function getErrorDashboardHint(errorLogItems: ErrorLogItem[]): {
  value: string;
  hint: string;
} {
  const pending = calculatePendingErrorCount(errorLogItems);
  if (errorLogItems.length === 0) {
    return { value: "Sin errores", hint: "Sin errores registrados" };
  }
  if (pending === 0) {
    return { value: "0 pendientes", hint: "No tienes errores pendientes de revisar" };
  }
  const mostCommon = getMostCommonErrorType(errorLogItems);
  const typeHint = mostCommon ? `Más repetido: ${getErrorLogTypeLabel(mostCommon)}` : "";
  return {
    value: `${pending} pendiente${pending === 1 ? "" : "s"}`,
    hint: typeHint || "Revisa patrones en la pestaña Errores",
  };
}

const DEFAULT_ESTIMATED_MINUTES_PER_SUBJECT_ATPL = 2400;
const DEFAULT_ESTIMATED_MINUTES_PER_SUBJECT_PPL = 1200;

/** Semanas completas entre dos fechas (mínimo 1 si end > start). */
export function getWeeksBetweenDates(
  startDate: string,
  endDate: string,
  today: string = getTodayDateString(),
): number {
  const effectiveStart = startDate <= today ? startDate : today;
  const days = getDaysUntilDate(endDate, effectiveStart);
  if (days <= 0) return 0;
  return Math.max(1, Math.ceil(days / 7));
}

export function getApproximateWeeksRemaining(
  targetExamDate: string | undefined,
  today: string = getTodayDateString(),
): number | null {
  if (!targetExamDate) return null;
  const days = getDaysUntilDate(targetExamDate, today);
  if (days < 0) return 0;
  return Math.max(1, Math.ceil(days / 7));
}

export function calculateEstimatedMinutesPerSubject(params: {
  mode: StudyMode;
  activeSubjectCount: number;
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
}): number {
  const { mode, activeSubjectCount, weeklyGoalMinutes, targetExamDate, studyStartDate } = params;
  const count = Math.max(1, activeSubjectCount);

  if (targetExamDate) {
    const today = getTodayDateString();
    const start = studyStartDate && studyStartDate <= today ? studyStartDate : today;
    const weeks = getWeeksBetweenDates(start, targetExamDate, today);
    if (weeks > 0 && weeklyGoalMinutes > 0) {
      return Math.max(180, Math.round((weeklyGoalMinutes * weeks) / count));
    }
  }

  return mode === "atpl"
    ? DEFAULT_ESTIMATED_MINUTES_PER_SUBJECT_ATPL
    : DEFAULT_ESTIMATED_MINUTES_PER_SUBJECT_PPL;
}

/** Progreso orientativo 0–100: horas estudiadas + bonus por mocks. */
export function calculateSubjectProgressPercent(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  estimatedTargetMinutes: number;
}): number {
  const { subjectId, sessions, mockResults, estimatedTargetMinutes } = params;
  const studied =
    sessions
      .filter((s) => s.subjectId === subjectId)
      .reduce((sum, s) => sum + (Number.isFinite(s.durationMinutes) ? s.durationMinutes : 0), 0) ?? 0;

  const hoursPart =
    estimatedTargetMinutes > 0
      ? Math.min(85, Math.round((studied / estimatedTargetMinutes) * 85))
      : 0;

  const subjectMocks = mockResults.filter((m) => m.subjectId === subjectId);
  let mockPart = 0;
  if (subjectMocks.length > 0) {
    const avg = subjectMocks.reduce((sum, m) => sum + m.score, 0) / subjectMocks.length;
    mockPart = Math.min(15, Math.round((avg / 100) * 15));
  }

  if (studied <= 0 && subjectMocks.length === 0) return 0;
  return Math.min(100, hoursPart + mockPart);
}

export function formatWeeksRemainingLabel(weeks: number | null): string {
  if (weeks === null) return "Sin fecha objetivo";
  if (weeks === 0) return "Objetivo pasado o hoy";
  if (weeks === 1) return "~1 semana restante";
  return `~${weeks} semanas restantes`;
}
