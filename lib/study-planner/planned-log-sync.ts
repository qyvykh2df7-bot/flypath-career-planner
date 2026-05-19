import type { PlannedStudySession, StudySession, StudySessionQuality } from "./types";
import { createPlannerId } from "./calculations";
import { isPendingLikeStatus, normalizePlannedSessionStatus } from "./planner-session-status";

export type CompletePlannedOverrides = {
  durationMinutes?: number;
  quality?: StudySessionQuality;
  notes?: string;
};

/** Quita marca de completado del bloque planificado (vuelve a pending). */
export function clearPlannedCompletion(planned: PlannedStudySession): PlannedStudySession {
  const next: PlannedStudySession = {
    id: planned.id,
    date: planned.date,
    subjectId: planned.subjectId,
    type: planned.type,
    plannedDurationMinutes: planned.plannedDurationMinutes,
    status: "pending",
    source: planned.source,
  };
  if (planned.startTime) next.startTime = planned.startTime;
  if (planned.goal) next.goal = planned.goal;
  return next;
}

/** Crea log de estudio vinculado explícitamente al bloque planificado. */
export function buildStudySessionForPlannedCompletion(
  planned: PlannedStudySession,
  overrides: CompletePlannedOverrides = {},
): StudySession {
  const noteText = overrides.notes?.trim();
  return {
    id: createPlannerId(),
    date: planned.date,
    subjectId: planned.subjectId,
    type: planned.type,
    durationMinutes: overrides.durationMinutes ?? planned.plannedDurationMinutes,
    linkedPlannedSessionId: planned.id,
    ...(overrides.quality ? { quality: overrides.quality } : {}),
    ...(noteText ? { notes: noteText } : planned.goal ? { notes: planned.goal } : {}),
  };
}

/** Marca bloque como completado y enlaza al log creado. */
export function applyPlannedCompletion(
  planned: PlannedStudySession,
  studySession: StudySession,
): PlannedStudySession {
  return {
    ...planned,
    status: "completed",
    completedSessionId: studySession.id,
  };
}

function findPlannedIdForDeletedSession(
  session: StudySession,
  plannedSessions: PlannedStudySession[],
): string | null {
  if (session.linkedPlannedSessionId) {
    const linked = plannedSessions.find((p) => p.id === session.linkedPlannedSessionId);
    if (linked && normalizePlannedSessionStatus(linked.status) === "completed") {
      return linked.id;
    }
  }
  const byCompletedId = plannedSessions.find(
    (p) =>
      p.completedSessionId === session.id &&
      normalizePlannedSessionStatus(p.status) === "completed",
  );
  return byCompletedId?.id ?? null;
}

/**
 * Elimina un registro y revierte el bloque planificado vinculado si aplica.
 * Registros libres no modifican plannedSessions.
 */
export function deleteStudySessionWithPlannedSync(
  sessions: StudySession[],
  plannedSessions: PlannedStudySession[],
  sessionId: string,
): { sessions: StudySession[]; plannedSessions: PlannedStudySession[] } {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    return { sessions, plannedSessions };
  }

  const plannedIdToRevert = findPlannedIdForDeletedSession(session, plannedSessions);
  const nextSessions = sessions.filter((s) => s.id !== sessionId);
  const nextPlanned =
    plannedIdToRevert === null
      ? plannedSessions
      : plannedSessions.map((p) =>
          p.id === plannedIdToRevert ? clearPlannedCompletion(p) : p,
        );

  return { sessions: nextSessions, plannedSessions: nextPlanned };
}

/**
 * Completa un bloque pendiente: crea log vinculado y marca planned como completed.
 */
export function completePlannedSessionWithLog(
  plannedSessions: PlannedStudySession[],
  sessions: StudySession[],
  plannedId: string,
  overrides: CompletePlannedOverrides = {},
): { sessions: StudySession[]; plannedSessions: PlannedStudySession[] } | null {
  const planned = plannedSessions.find((p) => p.id === plannedId);
  if (!planned || !isPendingLikeStatus(planned.status)) {
    return null;
  }

  const studySession = buildStudySessionForPlannedCompletion(planned, overrides);
  return {
    sessions: [...sessions, studySession],
    plannedSessions: plannedSessions.map((p) =>
      p.id === plannedId ? applyPlannedCompletion(p, studySession) : p,
    ),
  };
}

/**
 * Repara incoherencias tras cargar localStorage (log borrado pero bloque completed, etc.).
 */
export function reconcilePlannedAndStudyLogs(
  sessions: StudySession[],
  plannedSessions: PlannedStudySession[],
): { sessions: StudySession[]; plannedSessions: PlannedStudySession[] } {
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const nextPlanned = plannedSessions.map((planned) => {
    const status = normalizePlannedSessionStatus(planned.status) ?? "pending";
    if (status !== "completed") return planned;

    const logId = planned.completedSessionId;
    if (!logId || !sessionById.has(logId)) {
      return clearPlannedCompletion(planned);
    }
    return planned;
  });

  const plannedById = new Map(nextPlanned.map((p) => [p.id, p]));

  const nextSessions = sessions.map((session) => {
    if (session.linkedPlannedSessionId) {
      const planned = plannedById.get(session.linkedPlannedSessionId);
      if (!planned) {
        const { linkedPlannedSessionId: _removed, ...rest } = session;
        return rest;
      }
      const status = normalizePlannedSessionStatus(planned.status) ?? "pending";
      if (status !== "completed") {
        const { linkedPlannedSessionId: _removed, ...rest } = session;
        return rest;
      }
      return session;
    }

    const planned = nextPlanned.find((p) => p.completedSessionId === session.id);
    if (planned && normalizePlannedSessionStatus(planned.status) === "completed") {
      return { ...session, linkedPlannedSessionId: planned.id };
    }
    return session;
  });

  return { sessions: nextSessions, plannedSessions: nextPlanned };
}
