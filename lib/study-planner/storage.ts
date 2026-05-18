import {
  DEFAULT_ATPL_PLANNER_STATE,
  type AtplPlannerState,
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

function isStudyMode(v: unknown): v is StudyMode {
  return v === "atpl" || v === "ppl";
}

function isSessionType(v: unknown): v is StudySessionType {
  return typeof v === "string" && SESSION_TYPES.includes(v as StudySessionType);
}

function isQuality(v: unknown): v is StudySessionQuality {
  return typeof v === "string" && QUALITIES.includes(v as StudySessionQuality);
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

  return { mode, weeklyGoalMinutes: goal, sessions };
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
