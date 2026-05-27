"use client";

import type { ExamDate, PlannedStudySession, StudySession, StudySubject } from "@/lib/study-planner/types";
import type { CompletePlannedSessionOverrides } from "@/hooks/useStudyPlannerState";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import type { StudyLogIntent } from "@/lib/study-planner/study-log-intent";
import { plannerPageTitle } from "@/lib/study-planner/planner-ui";
import { StudyLogForm, type StudyLogSavePayload } from "./study-log-form";
import { StudyLogHistory } from "./study-log-history";

type StudyLogSectionProps = {
  subjects: StudySubject[];
  plannedSessions: PlannedStudySession[];
  sessions: StudySession[];
  examDates?: ExamDate[];
  intent?: StudyLogIntent | null;
  onIntentConsumed?: () => void;
  onAddSession: (session: StudySession) => void;
  onCompletePlannedSession: (
    plannedId: string,
    overrides?: CompletePlannedSessionOverrides,
  ) => void;
  onDeleteSession: (sessionId: string) => void;
};

export function StudyLogSection({
  subjects,
  plannedSessions,
  sessions,
  examDates = [],
  intent,
  onIntentConsumed,
  onAddSession,
  onCompletePlannedSession,
  onDeleteSession,
}: StudyLogSectionProps) {
  const today = getTodayDateString();

  const handleSave = (payload: StudyLogSavePayload) => {
    const { session, plannedSessionId } = payload;
    if (plannedSessionId) {
      onCompletePlannedSession(plannedSessionId, {
        durationMinutes: session.durationMinutes,
        quality: session.quality,
        notes: session.notes,
      });
      return;
    }
    onAddSession(session);
  };

  return (
    <div className="space-y-4 pb-2">
      <header>
        <h2 className={plannerPageTitle}>Registro de estudio</h2>
      </header>

      <StudyLogForm
        subjects={subjects}
        plannedSessions={plannedSessions}
        today={today}
        intent={intent}
        onSave={handleSave}
        onIntentConsumed={onIntentConsumed}
      />

      <StudyLogHistory
        sessions={sessions}
        examDates={examDates}
        onDelete={onDeleteSession}
      />
    </div>
  );
}
