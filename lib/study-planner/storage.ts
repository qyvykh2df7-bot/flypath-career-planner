import {
  DEFAULT_ATPL_PLANNER_STATE,
  type AtplPlannerState,
  type PlannedStudySession,
  type PlannedStudySessionStatus,
  type StudyMode,
  type StudySession,
  type StudySessionQuality,
  type StudySessionType,
} from "./types";

export const STUDY_PLANNER_STORAGE_KEY = "flypath_atpl_planner_state";

const SESSION_TYPES: StudySessionType[] = [
  "theory",
  "question_bank",
  "mock",
  "review",
  "error_correction",
  "class",
];

const QUALITIES: StudySessionQuality[] = ["good", "medium", "bad"];

const PLANNED_STATUSES: PlannedStudySessionStatus[] = ["planned", "completed", "skipped"];

function isStudyMode(v: unknown): v is StudyMode {
  return v === "atpl" || v === "ppl";
}

function isSessionType(v: unknown): v is StudySessionType {
  return typeof v === "string" && SESSION_TYPES.includes(v as StudySessionType);
}

function isQuality(v: unknown): v is StudySessionQuality {
  return typeof v === "string" && QUALITIES.includes(v as StudySessionQuality);
}

function isPlannedStatus(v: unknown): v is PlannedStudySessionStatus {
  return typeof v === "string" && PLANNED_STATUSES.includes(v as PlannedStudySessionStatus);
}

function parseSession(raw: unknown): StudySession | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== "string" || typeof s.date !== "string" || typeof s.subjectId !== "string") {
    return null;
  }
  if (!isSessionType(s.type)) return null;
  const durationMinutes = Number(s.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  const session: StudySession = {
    id: s.id,
    date: s.date,
    subjectId: s.subjectId,
    type: s.type,
    durationMinutes,
  };
  if (s.quality !== undefined) {
    if (!isQuality(s.quality)) return null;
    session.quality = s.quality;
  }
  if (typeof s.notes === "string" && s.notes.length > 0) session.notes = s.notes;
  return session;
}

function parsePlannedSession(raw: unknown): PlannedStudySession | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.date !== "string" || typeof p.subjectId !== "string") {
    return null;
  }
  if (!isSessionType(p.type)) return null;
  if (!isPlannedStatus(p.status)) return null;
  const plannedDurationMinutes = Number(p.plannedDurationMinutes);
  if (!Number.isFinite(plannedDurationMinutes) || plannedDurationMinutes <= 0) return null;

  const planned: PlannedStudySession = {
    id: p.id,
    date: p.date,
    subjectId: p.subjectId,
    type: p.type,
    plannedDurationMinutes,
    status: p.status,
  };
  if (typeof p.startTime === "string" && p.startTime.length > 0) {
    planned.startTime = p.startTime;
  }
  if (typeof p.goal === "string" && p.goal.length > 0) {
    planned.goal = p.goal;
  }
  if (typeof p.completedSessionId === "string" && p.completedSessionId.length > 0) {
    planned.completedSessionId = p.completedSessionId;
  }
  return planned;
}

export function normalizeStudyPlannerState(raw: unknown): AtplPlannerState {
  const fallback = DEFAULT_ATPL_PLANNER_STATE;
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;

  const mode = isStudyMode(o.mode) ? o.mode : fallback.mode;
  const weeklyGoalMinutes = Number(o.weeklyGoalMinutes);
  const goal =
    Number.isFinite(weeklyGoalMinutes) && weeklyGoalMinutes > 0
      ? Math.min(4800, Math.max(60, Math.round(weeklyGoalMinutes)))
      : fallback.weeklyGoalMinutes;

  const sessionsRaw = Array.isArray(o.sessions) ? o.sessions : [];
  const sessions = sessionsRaw
    .map(parseSession)
    .filter((s): s is StudySession => s !== null);

  const plannedRaw = Array.isArray(o.plannedSessions) ? o.plannedSessions : [];
  const plannedSessions = plannedRaw
    .map(parsePlannedSession)
    .filter((p): p is PlannedStudySession => p !== null);

  return { mode, weeklyGoalMinutes: goal, sessions, plannedSessions };
}

export function loadStudyPlannerState<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STUDY_PLANNER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (fallback && typeof fallback === "object" && "sessions" in (fallback as object)) {
      return normalizeStudyPlannerState(parsed) as T;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveStudyPlannerState<T>(state: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STUDY_PLANNER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}
