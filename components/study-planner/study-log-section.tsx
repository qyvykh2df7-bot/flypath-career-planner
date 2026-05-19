"use client";

import type { PlannedStudySession, StudySession, StudySubject } from "@/lib/study-planner/types";
import type { CompletePlannedSessionOverrides } from "@/hooks/useStudyPlannerState";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import type { StudyLogIntent } from "@/lib/study-planner/study-log-intent";
import { StudyLogForm, type StudyLogSavePayload } from "./study-log-form";
import { StudyLogHistory } from "./study-log-history";

type StudyLogSectionProps = {
  subjects: StudySubject[];
  plannedSessions: PlannedStudySession[];
  sessions: StudySession[];
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
    <div className="space-y-6 pb-2">
      <header className="space-y-1">
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">Registro de estudio</h2>
        <p className="max-w-xl text-[14px] leading-relaxed text-slate-600">
          Guarda lo que has estudiado para que el planner ajuste tu progreso y próximas sesiones.
        </p>
      </header>

      <StudyLogForm
        subjects={subjects}
        plannedSessions={plannedSessions}
        today={today}
        intent={intent}
        onSave={handleSave}
        onIntentConsumed={onIntentConsumed}
      />

      <StudyLogHistory sessions={sessions} onDelete={onDeleteSession} />
    </div>
  );
}
