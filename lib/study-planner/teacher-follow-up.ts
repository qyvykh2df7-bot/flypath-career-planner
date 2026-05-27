import type {
  PlannedStudySession,
  StudySubject,
  TeacherFollowUpCategory,
  TeacherFollowUpComment,
} from "./types";
import { comparePlannedByStartTime, getTodayDateString } from "./calculations";
import { isPendingLikeStatus, normalizePlannedSessionStatus } from "./planner-session-status";
import type { PlannedSessionCreatePreset } from "./dashboard-navigation";
import type { StudyMode } from "./types";
import { getSubjectIdsForMode } from "./subjects";

export const FOLLOW_UP_CATEGORY_LABELS: Record<TeacherFollowUpCategory, string> = {
  class: "Clase",
  study: "Estudio",
  mock: "Simulacro",
  general: "General",
};

export const FOLLOW_UP_CATEGORY_OPTIONS: TeacherFollowUpCategory[] = [
  "class",
  "study",
  "mock",
  "general",
];

export type FlyPathFollowUpSummary = {
  latestComment: TeacherFollowUpComment | null;
  nextObjective: string | null;
  nextClass: {
    date: string;
    subjectId: string;
    startTime?: string;
  } | null;
  generalStatus: string;
};

export type RecommendedFollowUpTask = {
  id: string;
  label: string;
  sourceCommentId: string;
  date: string;
};

export function sortFollowUpCommentsDesc(
  comments: TeacherFollowUpComment[],
): TeacherFollowUpComment[] {
  return [...comments].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.id.localeCompare(a.id);
  });
}

export function getLatestFollowUpComment(
  comments: TeacherFollowUpComment[],
): TeacherFollowUpComment | null {
  return sortFollowUpCommentsDesc(comments)[0] ?? null;
}

export function filterFollowUpCommentsByMode(
  comments: TeacherFollowUpComment[],
  mode: StudyMode,
): TeacherFollowUpComment[] {
  const ids = getSubjectIdsForMode(mode);
  return comments.filter((c) => !c.subjectId || ids.has(c.subjectId));
}

export function getNextUpcomingClassSession(
  plannedSessions: PlannedStudySession[],
  today: string = getTodayDateString(),
): PlannedStudySession | null {
  const upcoming = plannedSessions
    .filter((p) => {
      if (p.type !== "class" || p.date < today) return false;
      const status = normalizePlannedSessionStatus(p.status) ?? "pending";
      return isPendingLikeStatus(status) || status === "in_progress";
    })
    .sort(comparePlannedByStartTime);
  return upcoming[0] ?? null;
}

export function buildFlyPathFollowUpSummary(
  comments: TeacherFollowUpComment[],
  plannedSessions: PlannedStudySession[],
  today: string = getTodayDateString(),
): FlyPathFollowUpSummary {
  const sorted = sortFollowUpCommentsDesc(comments);
  const latestComment = sorted[0] ?? null;
  const nextObjective =
    sorted.find((c) => c.nextTask?.trim())?.nextTask?.trim() ?? null;
  const nextClassSession = getNextUpcomingClassSession(plannedSessions, today);

  let generalStatus = "Sin seguimiento registrado";
  if (sorted.length > 0) {
    const taskCount = buildRecommendedFollowUpTasks(sorted).length;
    generalStatus =
      taskCount > 0
        ? `${taskCount} tarea${taskCount === 1 ? "" : "s"} recomendada${taskCount === 1 ? "" : "s"}`
        : "Seguimiento activo";
  }

  return {
    latestComment,
    nextObjective,
    nextClass: nextClassSession
      ? {
          date: nextClassSession.date,
          subjectId: nextClassSession.subjectId,
          startTime: nextClassSession.startTime,
        }
      : null,
    generalStatus,
  };
}

export function buildRecommendedFollowUpTasks(
  comments: TeacherFollowUpComment[],
): RecommendedFollowUpTask[] {
  const sorted = sortFollowUpCommentsDesc(comments);
  const seen = new Set<string>();
  const tasks: RecommendedFollowUpTask[] = [];

  for (const comment of sorted) {
    const label = comment.nextTask?.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push({
      id: `${comment.id}-task`,
      label,
      sourceCommentId: comment.id,
      date: comment.date,
    });
  }

  return tasks;
}

const FOLLOW_UP_MONTHS_SHORT = [
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

export function formatFollowUpDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${FOLLOW_UP_MONTHS_SHORT[m - 1]} ${y}`;
}

export function formatFollowUpDateCompact(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  if (!m || !d) return iso;
  return `${d} ${FOLLOW_UP_MONTHS_SHORT[m - 1]}`;
}

/** Preset para planificar clase particular desde Evaluación. */
export function buildPlanClassSessionPreset(
  comments: TeacherFollowUpComment[],
  subjects: StudySubject[],
  today: string = getTodayDateString(),
): PlannedSessionCreatePreset {
  const latest = sortFollowUpCommentsDesc(comments)[0];
  const subjectId =
    latest?.subjectId && subjects.some((s) => s.id === latest.subjectId)
      ? latest.subjectId
      : undefined;

  return {
    type: "class",
    date: today,
    ...(subjectId ? { subjectId } : { leaveSubjectEmpty: true }),
  };
}
