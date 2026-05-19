import type { PlannedStudySession, StudySession } from "./types";
import { comparePlannedByStartTime, getTodayDateString } from "./calculations";
import { getCurrentWeekStart, getPlannedSessionsForWeek, getWeekRange } from "./date-utils";
import {
  isCountableAsCompleted,
  isPendingLikeStatus,
  normalizePlannedSessionStatus,
  sessionMinutes,
} from "./planner-session-status";

export type PlannerMetrics = {
  weekStartDate: string;
  weekSessions: PlannedStudySession[];
  totalPlannedSessions: number;
  pendingSessions: number;
  inProgressSessions: number;
  completedSessions: number;
  skippedSessions: number;
  totalPlannedMinutes: number;
  completedMinutes: number;
  pendingMinutes: number;
  skippedMinutes: number;
  /** Sesiones pendientes + en curso. */
  pendingLikeCount: number;
  /** completedMinutes / totalPlannedMinutes, clamp 0–100. */
  weeklyProgressPercent: number;
  todaySessions: PlannedStudySession[];
  todayPendingSessions: number;
  todayCompletedSessions: number;
  todaySkippedSessions: number;
  nextSession: PlannedStudySession | null;
  activeSubjectsTouched: number;
  totalActiveSubjects: number;
  hasPlan: boolean;
  upcomingSessions: PlannedStudySession[];
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

function sortUpcoming(a: PlannedStudySession, b: PlannedStudySession): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  return comparePlannedByStartTime(a, b);
}

export type GetPlannerMetricsOptions = {
  weekStartDate?: string;
  today?: string;
  activeSubjectIds?: string[];
  studySessions?: StudySession[];
};

/**
 * Fuente única de verdad para métricas del plan semanal visible.
 */
export function getPlannerMetrics(
  plannedSessions: PlannedStudySession[],
  options: GetPlannerMetricsOptions = {},
): PlannerMetrics {
  const today = options.today ?? getTodayDateString();
  const weekStartDate = options.weekStartDate ?? getCurrentWeekStart(today);
  const weekSessions = getPlannedSessionsForWeek(plannedSessions, weekStartDate);

  let pendingSessions = 0;
  let inProgressSessions = 0;
  let completedSessions = 0;
  let skippedSessions = 0;
  let totalPlannedMinutes = 0;
  let completedMinutes = 0;
  let pendingMinutes = 0;
  let skippedMinutes = 0;

  for (const s of weekSessions) {
    const mins = sessionMinutes(s);
    totalPlannedMinutes += mins;
    const status = normalizePlannedSessionStatus(s.status) ?? "pending";

    switch (status) {
      case "completed":
        completedSessions += 1;
        completedMinutes += mins;
        break;
      case "skipped":
        skippedSessions += 1;
        skippedMinutes += mins;
        break;
      case "in_progress":
        inProgressSessions += 1;
        pendingMinutes += mins;
        break;
      case "pending":
      default:
        pendingSessions += 1;
        pendingMinutes += mins;
        break;
    }
  }

  const weeklyProgressPercent =
    totalPlannedMinutes > 0
      ? clampPercent((completedMinutes / totalPlannedMinutes) * 100)
      : 0;

  const todaySessions = weekSessions
    .filter((s) => s.date === today)
    .sort(comparePlannedByStartTime);

  const todayPendingSessions = todaySessions.filter((s) =>
    isPendingLikeStatus(normalizePlannedSessionStatus(s.status) ?? "pending"),
  ).length;
  const todayCompletedSessions = todaySessions.filter(
    (s) => normalizePlannedSessionStatus(s.status) === "completed",
  ).length;
  const todaySkippedSessions = todaySessions.filter(
    (s) => normalizePlannedSessionStatus(s.status) === "skipped",
  ).length;

  const actionable = weekSessions
    .filter((s) => isPendingLikeStatus(normalizePlannedSessionStatus(s.status) ?? "pending"))
    .sort(sortUpcoming);
  const nextSession = actionable[0] ?? null;

  const upcomingFromToday = actionable.filter((s) => s.date >= today);
  const upcomingSessions = (
    upcomingFromToday.length > 0 ? upcomingFromToday : actionable
  ).slice(0, 3);

  const touched = new Set<string>();
  for (const s of weekSessions) {
    if (isCountableAsCompleted(normalizePlannedSessionStatus(s.status) ?? "pending")) {
      touched.add(s.subjectId);
    }
  }
  if (options.studySessions) {
    const { start, end } = getWeekRange(weekStartDate);
    for (const log of options.studySessions) {
      if (log.date >= start && log.date <= end) {
        touched.add(log.subjectId);
      }
    }
  }

  const totalActiveSubjects = options.activeSubjectIds?.length ?? 0;

  return {
    weekStartDate,
    weekSessions,
    totalPlannedSessions: weekSessions.length,
    pendingSessions,
    inProgressSessions,
    completedSessions,
    skippedSessions,
    totalPlannedMinutes,
    completedMinutes,
    pendingMinutes,
    skippedMinutes,
    pendingLikeCount: pendingSessions + inProgressSessions,
    weeklyProgressPercent,
    todaySessions,
    todayPendingSessions,
    todayCompletedSessions,
    todaySkippedSessions,
    nextSession,
    activeSubjectsTouched: touched.size,
    totalActiveSubjects,
    hasPlan: weekSessions.length > 0,
    upcomingSessions,
  };
}
