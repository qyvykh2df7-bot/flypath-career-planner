import type { TeacherFollowUpComment } from "./types";
import { getSubjectById } from "./subjects";
import {
  formatFollowUpDateCompact,
  getLatestFollowUpComment,
  sortFollowUpCommentsDesc,
} from "./teacher-follow-up";

export const DASHBOARD_FOLLOW_UP_NOTICE_TITLE = "Nuevo comentario de seguimiento";
export const DASHBOARD_FOLLOW_UP_NOTICE_BODY =
  "Tienes una actualización en Evaluación.";

export type DashboardFollowUpNoticePreview = {
  title: string;
  body: string;
  metaLine: string | null;
  latestCommentId: string;
};

/** Metadatos del aviso Home (sin texto del comentario). */
export function buildDashboardFollowUpNoticePreview(
  comments: TeacherFollowUpComment[],
): DashboardFollowUpNoticePreview | null {
  const latest = sortFollowUpCommentsDesc(comments)[0];
  if (!latest) return null;

  const subjectName = latest.subjectId
    ? (getSubjectById(latest.subjectId)?.name ?? latest.subjectId)
    : null;
  const dateLabel = formatFollowUpDateCompact(latest.date);

  const metaParts = [subjectName, dateLabel].filter(Boolean);
  const metaLine = metaParts.length > 0 ? metaParts.join(" · ") : null;

  return {
    title: DASHBOARD_FOLLOW_UP_NOTICE_TITLE,
    body: DASHBOARD_FOLLOW_UP_NOTICE_BODY,
    metaLine,
    latestCommentId: latest.id,
  };
}

/** Aviso solo si hay comentario más reciente no visto en el modo actual. */
export function shouldShowDashboardFollowUpNotice(
  comments: TeacherFollowUpComment[],
  lastSeenCommentId?: string | null,
): boolean {
  const latest = getLatestFollowUpComment(comments);
  if (!latest) return false;
  if (!lastSeenCommentId) return true;
  return latest.id !== lastSeenCommentId;
}
