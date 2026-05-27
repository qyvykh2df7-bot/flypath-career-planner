import { parseBankArea } from "./atpl-bank-areas";
import { normalizeClassTrainingType } from "./class-session-subtopics";
import {
  DEFAULT_ATPL_PLANNER_STATE,
  type AtplPlannerState,
  type MockResult,
  type ErrorLogItem,
  type ExamDate,
  type ErrorLogStatus,
  type ErrorLogType,
  type ReviewItem,
  type ReviewStatus,
  type PlannedStudySession,
  type StudyMode,
  type StudySession,
  type StudySessionQuality,
  type StudySessionType,
  type TeacherFollowUpCategory,
  type TeacherFollowUpComment,
  type TeacherFollowUpCreatedBy,
} from "./types";
import { reconcilePlannedAndStudyLogs } from "./planned-log-sync";
import {
  normalizePlannedSessionStatus,
  type PlannedStudySessionStatus,
} from "./planner-session-status";
import { getSubjectsByMode } from "./subjects";
import {
  isInitialStudyContext,
  normalizeInitialSubjectStates,
} from "./initial-subject-state";

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

const PLANNED_STATUSES: PlannedStudySessionStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
];

const REVIEW_STATUSES: ReviewStatus[] = ["pending", "completed", "overdue"];

const ERROR_LOG_STATUSES: ErrorLogStatus[] = ["pending", "reviewed", "resolved"];

const ERROR_LOG_TYPES: ErrorLogType[] = [
  "concept",
  "formula",
  "unit_conversion",
  "fast_reading",
  "procedure",
  "english_comprehension",
  "memory",
  "distraction",
  "other",
];

function isStudyMode(v: unknown): v is StudyMode {
  return v === "atpl" || v === "ppl";
}

function isSessionType(v: unknown): v is StudySessionType {
  return typeof v === "string" && SESSION_TYPES.includes(v as StudySessionType);
}

function isQuality(v: unknown): v is StudySessionQuality {
  return typeof v === "string" && QUALITIES.includes(v as StudySessionQuality);
}

function isPlannedStatus(v: unknown): v is PlannedStudySessionStatus | "planned" {
  if (typeof v !== "string") return false;
  if (v === "planned") return true;
  return PLANNED_STATUSES.includes(v as PlannedStudySessionStatus);
}

function isReviewStatus(v: unknown): v is ReviewStatus {
  return typeof v === "string" && REVIEW_STATUSES.includes(v as ReviewStatus);
}

function isErrorLogStatus(v: unknown): v is ErrorLogStatus {
  return typeof v === "string" && ERROR_LOG_STATUSES.includes(v as ErrorLogStatus);
}

function isErrorLogType(v: unknown): v is ErrorLogType {
  return typeof v === "string" && ERROR_LOG_TYPES.includes(v as ErrorLogType);
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
  if (typeof s.linkedPlannedSessionId === "string" && s.linkedPlannedSessionId.length > 0) {
    session.linkedPlannedSessionId = s.linkedPlannedSessionId;
  }
  if (session.type === "class") {
    session.classTrainingType = normalizeClassTrainingType(s.classTrainingType);
    if (typeof s.classSubtopic === "string" && s.classSubtopic.trim().length > 0) {
      session.classSubtopic = s.classSubtopic.trim();
    }
  }
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

  const normalizedStatus = normalizePlannedSessionStatus(p.status);
  if (!normalizedStatus) return null;

  const planned: PlannedStudySession = {
    id: p.id,
    date: p.date,
    subjectId: p.subjectId,
    type: p.type,
    plannedDurationMinutes,
    status: normalizedStatus,
    source: p.source === "manual" || p.source === "auto" ? p.source : "auto",
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
  const bankArea = parseBankArea(p.bankArea);
  if (bankArea) {
    planned.bankArea = bankArea;
  }
  if (planned.type === "class") {
    planned.classTrainingType = normalizeClassTrainingType(p.classTrainingType);
    if (typeof p.classSubtopic === "string" && p.classSubtopic.trim().length > 0) {
      planned.classSubtopic = p.classSubtopic.trim();
    }
  }
  return planned;
}

function parseMockResult(raw: unknown): MockResult | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.id !== "string" || typeof m.date !== "string" || typeof m.subjectId !== "string") {
    return null;
  }
  const score = Number(m.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) return null;

  const mock: MockResult = {
    id: m.id,
    date: m.date,
    subjectId: m.subjectId,
    score,
  };
  if (typeof m.bank === "string" && m.bank.length > 0) mock.bank = m.bank;
  const durationMinutes = Number(m.durationMinutes);
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    mock.durationMinutes = Math.round(durationMinutes);
  }
  if (typeof m.notes === "string" && m.notes.length > 0) mock.notes = m.notes;
  return mock;
}

function parseReviewItem(raw: unknown): ReviewItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.subjectId !== "string" ||
    typeof r.topic !== "string" ||
    typeof r.createdAt !== "string" ||
    typeof r.dueDate !== "string"
  ) {
    return null;
  }
  if (!r.topic.trim()) return null;
  const intervalDays = Number(r.intervalDays);
  if (!Number.isFinite(intervalDays) || intervalDays < 1) return null;
  if (!isReviewStatus(r.status)) return null;

  const item: ReviewItem = {
    id: r.id,
    subjectId: r.subjectId,
    topic: r.topic.trim(),
    createdAt: r.createdAt,
    dueDate: r.dueDate,
    intervalDays: Math.round(intervalDays),
    status: r.status,
  };
  if (typeof r.completedAt === "string" && r.completedAt.length > 0) {
    item.completedAt = r.completedAt;
  }
  if (typeof r.notes === "string" && r.notes.length > 0) {
    item.notes = r.notes;
  }
  return item;
}

function parseErrorLogItem(raw: unknown): ErrorLogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.date !== "string" ||
    typeof e.subjectId !== "string" ||
    typeof e.topic !== "string" ||
    typeof e.description !== "string"
  ) {
    return null;
  }
  if (!e.topic.trim() || !e.description.trim()) return null;
  if (!isErrorLogType(e.type)) return null;
  if (!isErrorLogStatus(e.status)) return null;

  const item: ErrorLogItem = {
    id: e.id,
    date: e.date,
    subjectId: e.subjectId,
    topic: e.topic.trim(),
    type: e.type,
    description: e.description.trim(),
    status: e.status,
  };
  if (typeof e.correctiveAction === "string" && e.correctiveAction.length > 0) {
    item.correctiveAction = e.correctiveAction;
  }
  if (typeof e.linkedMockId === "string" && e.linkedMockId.length > 0) {
    item.linkedMockId = e.linkedMockId;
  }
  if (typeof e.notes === "string" && e.notes.length > 0) {
    item.notes = e.notes;
  }
  return item;
}

const FOLLOW_UP_CATEGORIES: TeacherFollowUpCategory[] = [
  "class",
  "study",
  "mock",
  "general",
];

const FOLLOW_UP_CREATED_BY: TeacherFollowUpCreatedBy[] = ["student", "teacher", "local"];

function isFollowUpCategory(v: unknown): v is TeacherFollowUpCategory {
  return typeof v === "string" && FOLLOW_UP_CATEGORIES.includes(v as TeacherFollowUpCategory);
}

function isFollowUpCreatedBy(v: unknown): v is TeacherFollowUpCreatedBy {
  return typeof v === "string" && FOLLOW_UP_CREATED_BY.includes(v as TeacherFollowUpCreatedBy);
}

function parseTeacherFollowUpComment(raw: unknown): TeacherFollowUpComment | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== "string" || typeof c.date !== "string" || typeof c.comment !== "string") {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) return null;
  if (!isFollowUpCategory(c.category)) return null;
  const commentText = c.comment.trim();
  if (!commentText) return null;

  const item: TeacherFollowUpComment = {
    id: c.id,
    date: c.date,
    category: c.category,
    comment: commentText,
  };
  if (typeof c.subjectId === "string" && c.subjectId.length > 0) {
    item.subjectId = c.subjectId;
  }
  if (typeof c.nextTask === "string" && c.nextTask.trim().length > 0) {
    item.nextTask = c.nextTask.trim();
  }
  if (isFollowUpCreatedBy(c.createdBy)) {
    item.createdBy = c.createdBy;
  }
  return item;
}

function parseLastSeenFollowUpCommentByMode(
  raw: unknown,
): Partial<Record<StudyMode, string>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const result: Partial<Record<StudyMode, string>> = {};
  if (typeof o.atpl === "string" && o.atpl.length > 0) result.atpl = o.atpl;
  if (typeof o.ppl === "string" && o.ppl.length > 0) result.ppl = o.ppl;
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseExamDate(raw: unknown): ExamDate | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== "string" || typeof e.subjectId !== "string" || typeof e.date !== "string") {
    return null;
  }
  const exam: ExamDate = {
    id: e.id,
    subjectId: e.subjectId,
    date: e.date,
  };
  if (typeof e.notes === "string" && e.notes.length > 0) exam.notes = e.notes;
  return exam;
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

  const mocksRaw = Array.isArray(o.mockResults) ? o.mockResults : [];
  const mockResults = mocksRaw
    .map(parseMockResult)
    .filter((m): m is MockResult => m !== null);

  const reviewsRaw = Array.isArray(o.reviewItems) ? o.reviewItems : [];
  const reviewItems = reviewsRaw
    .map(parseReviewItem)
    .filter((r): r is ReviewItem => r !== null);

  const errorsRaw = Array.isArray(o.errorLogItems) ? o.errorLogItems : [];
  const errorLogItems = errorsRaw
    .map(parseErrorLogItem)
    .filter((e): e is ErrorLogItem => e !== null);

  const examsRaw = Array.isArray(o.examDates) ? o.examDates : [];
  const examDates = examsRaw.map(parseExamDate).filter((e): e is ExamDate => e !== null);

  const followUpRaw = Array.isArray(o.teacherFollowUpComments)
    ? o.teacherFollowUpComments
    : [];
  const teacherFollowUpComments = followUpRaw
    .map(parseTeacherFollowUpComment)
    .filter((c): c is TeacherFollowUpComment => c !== null);

  const modeSubjectIds = getSubjectsByMode(mode).map((s) => s.id);
  const modeSubjectSet = new Set(modeSubjectIds);

  const activeRaw = Array.isArray(o.activeSubjectIds) ? o.activeSubjectIds : [];
  let activeSubjectIds = activeRaw.filter(
    (id): id is string => typeof id === "string" && modeSubjectSet.has(id),
  );

  const usedSubjectIds = new Set<string>();
  for (const s of sessions) {
    if (modeSubjectSet.has(s.subjectId)) usedSubjectIds.add(s.subjectId);
  }
  for (const p of plannedSessions) {
    if (modeSubjectSet.has(p.subjectId)) usedSubjectIds.add(p.subjectId);
  }
  for (const m of mockResults) {
    if (modeSubjectSet.has(m.subjectId)) usedSubjectIds.add(m.subjectId);
  }
  for (const r of reviewItems) {
    if (modeSubjectSet.has(r.subjectId)) usedSubjectIds.add(r.subjectId);
  }
  for (const e of errorLogItems) {
    if (modeSubjectSet.has(e.subjectId)) usedSubjectIds.add(e.subjectId);
  }
  for (const e of examDates) {
    if (modeSubjectSet.has(e.subjectId)) usedSubjectIds.add(e.subjectId);
  }

  if (activeSubjectIds.length === 0) {
    activeSubjectIds =
      usedSubjectIds.size > 0
        ? modeSubjectIds.filter((id) => usedSubjectIds.has(id))
        : [...modeSubjectIds];
  }

  const targetExamDate =
    typeof o.targetExamDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.targetExamDate)
      ? o.targetExamDate
      : undefined;

  const studyStartDate =
    typeof o.studyStartDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.studyStartDate)
      ? o.studyStartDate
      : undefined;

  const hasLegacyData =
    sessions.length > 0 ||
    plannedSessions.length > 0 ||
    mockResults.length > 0 ||
    reviewItems.length > 0 ||
    errorLogItems.length > 0 ||
    examDates.length > 0;

  let onboardingCompleted: boolean;
  if (typeof o.onboardingCompleted === "boolean") {
    onboardingCompleted = o.onboardingCompleted;
  } else {
    onboardingCompleted = hasLegacyData;
  }

  const reconciled = reconcilePlannedAndStudyLogs(sessions, plannedSessions);

  const initialStudyContext = isInitialStudyContext(o.initialStudyContext)
    ? o.initialStudyContext
    : undefined;

  const initialSubjectStates = normalizeInitialSubjectStates(
    o.initialSubjectStates,
    activeSubjectIds,
  );

  return {
    mode,
    weeklyGoalMinutes: goal,
    activeSubjectIds,
    targetExamDate,
    studyStartDate,
    initialStudyContext,
    initialSubjectStates:
      initialSubjectStates.length > 0 ? initialSubjectStates : undefined,
    onboardingCompleted,
    sessions: reconciled.sessions,
    plannedSessions: reconciled.plannedSessions,
    mockResults,
    reviewItems,
    errorLogItems,
    examDates,
    teacherFollowUpComments:
      teacherFollowUpComments.length > 0 ? teacherFollowUpComments : undefined,
    lastSeenFollowUpCommentByMode: parseLastSeenFollowUpCommentByMode(
      o.lastSeenFollowUpCommentByMode,
    ),
  };
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
