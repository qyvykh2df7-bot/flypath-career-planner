import type { PlannedStudySession } from "./types";

export const PAST_MOVE_DATE_ERROR = "No puedes mover sesiones a días pasados.";

export function canMovePlannedSessionToDate(
  session: PlannedStudySession,
  targetDate: string,
  referenceDate: string,
): boolean {
  if (session.status !== "pending") return false;
  if (targetDate < referenceDate) return false;
  return true;
}

export function movePlannedSessionToDate(
  sessions: PlannedStudySession[],
  sessionId: string,
  targetDate: string,
  referenceDate: string,
): PlannedStudySession[] {
  return sessions.map((session) => {
    if (session.id !== sessionId) return session;
    if (!canMovePlannedSessionToDate(session, targetDate, referenceDate)) {
      return session;
    }
    if (session.date === targetDate) return session;
    return { ...session, date: targetDate };
  });
}
