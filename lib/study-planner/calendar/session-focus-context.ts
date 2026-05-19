import type { MockResult, PlannedStudySession, StudySession } from "../types";
import {
  calculateSubjectProgressPercent,
  comparePlannedByStartTime,
  getTodayDateString,
  minutesToHoursLabel,
} from "../calculations";
import { getLastStudyLabelForSubject } from "./calendar-insights";
import { isPendingLikeStatus } from "../planner-session-status";

export type SessionFocusContext = {
  lastStudyLabel: string | null;
  subjectProgressPercent: number;
  relatedSessions: PlannedStudySession[];
};

export function buildSessionFocusContext(params: {
  session: PlannedStudySession;
  plannedSessions: PlannedStudySession[];
  studySessions: StudySession[];
  mockResults?: MockResult[];
  estimatedMinutesPerSubject?: number;
  today?: string;
}): SessionFocusContext {
  const today = params.today ?? getTodayDateString();
  const { session, plannedSessions, studySessions } = params;

  const lastStudyLabel = getLastStudyLabelForSubject(studySessions, session.subjectId, today);

  const progressPercent = calculateSubjectProgressPercent({
    subjectId: session.subjectId,
    sessions: studySessions,
    mockResults: params.mockResults ?? [],
    estimatedTargetMinutes: params.estimatedMinutesPerSubject ?? 600,
  });

  const relatedSessions = plannedSessions
    .filter(
      (p) =>
        p.id !== session.id &&
        p.subjectId === session.subjectId &&
        isPendingLikeStatus(p.status) &&
        p.date >= today,
    )
    .sort(comparePlannedByStartTime)
    .slice(0, 3);

  return {
    lastStudyLabel,
    subjectProgressPercent: Math.round(progressPercent),
    relatedSessions,
  };
}

export function formatRelatedSessionLine(session: PlannedStudySession): string {
  const time = session.startTime ?? "—";
  return `${time} · ${minutesToHoursLabel(session.plannedDurationMinutes)}`;
}
