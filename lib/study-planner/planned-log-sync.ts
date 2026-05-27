import type { AtplBankArea } from "./atpl-bank-areas";
import type {
  MockResult,
  PlannedStudySession,
  StudySession,
  StudySessionQuality,
} from "./types";
import { createPlannerId } from "./calculations";
import { isPendingLikeStatus, normalizePlannedSessionStatus } from "./planner-session-status";

export type CompletePlannedOverrides = {
  durationMinutes?: number;
  quality?: StudySessionQuality;
  notes?: string;
  /** Si la sesión es simulacro de examen, registra resultado en Evaluación. */
  mockScore?: number;
  /** Área de banco al completar (sesiones question_bank). */
  bankArea?: AtplBankArea;
};

export function buildMockResultFromPlannedCompletion(
  planned: PlannedStudySession,
  score: number,
): MockResult {
  return {
    id: createPlannerId(),
    date: planned.date,
    subjectId: planned.subjectId,
    score: Math.min(100, Math.max(0, score)),
    bank: "Calendario",
    notes: planned.goal?.trim() || undefined,
  };
}

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
  if (planned.bankArea) next.bankArea = planned.bankArea;
  if (planned.classTrainingType) next.classTrainingType = planned.classTrainingType;
  if (planned.classSubtopic) next.classSubtopic = planned.classSubtopic;
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
    ...(planned.classTrainingType ? { classTrainingType: planned.classTrainingType } : {}),
    ...(planned.classSubtopic ? { classSubtopic: planned.classSubtopic } : {}),
  };
}

/** Marca bloque como completado y enlaza al log creado. */
export function applyPlannedCompletion(
  planned: PlannedStudySession,
  studySession: StudySession,
  bankArea?: AtplBankArea,
): PlannedStudySession {
  const next: PlannedStudySession = {
    ...planned,
    status: "completed",
    completedSessionId: studySession.id,
  };
  if (bankArea) {
    next.bankArea = bankArea;
  }
  return next;
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
): {
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResult?: MockResult;
} | null {
  const planned = plannedSessions.find((p) => p.id === plannedId);
  if (!planned || !isPendingLikeStatus(planned.status)) {
    return null;
  }

  const { mockScore, bankArea, ...sessionOverrides } = overrides;
  const plannedForLog = bankArea ? { ...planned, bankArea } : planned;
  const studySession = buildStudySessionForPlannedCompletion(plannedForLog, sessionOverrides);
  let mockResult: MockResult | undefined;
  if (
    planned.type === "mock" &&
    mockScore !== undefined &&
    !Number.isNaN(mockScore)
  ) {
    mockResult = buildMockResultFromPlannedCompletion(planned, mockScore);
  }

  return {
    sessions: [...sessions, studySession],
    plannedSessions: plannedSessions.map((p) =>
      p.id === plannedId ? applyPlannedCompletion(p, studySession, bankArea ?? p.bankArea) : p,
    ),
    mockResult,
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
