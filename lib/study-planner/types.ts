export type StudyMode = "ppl" | "atpl";

export type StudySubject = {
  id: string;
  name: string;
  mode: StudyMode;
  category?: string;
};

export type StudySessionType =
  | "theory"
  | "question_bank"
  | "mock"
  | "review"
  | "error_correction"
  | "class";

export type StudySessionQuality = "good" | "medium" | "bad";

export type StudySession = {
  id: string;
  date: string;
  subjectId: string;
  type: StudySessionType;
  durationMinutes: number;
  quality?: StudySessionQuality;
  notes?: string;
};

import type { PlannedStudySessionStatus } from "./planner-session-status";
export type { PlannedStudySessionStatus } from "./planner-session-status";

/** Origen de la sesión planificada (generador vs usuario). */
export type PlannedSessionSource = "auto" | "manual";

export type PlannedStudySession = {
  id: string;
  date: string;
  startTime?: string;
  subjectId: string;
  type: StudySessionType;
  plannedDurationMinutes: number;
  goal?: string;
  status: PlannedStudySessionStatus;
  completedSessionId?: string;
  /** Por defecto en datos antiguos: auto. */
  source: PlannedSessionSource;
};

export type SubjectReadinessLevel = "no_data" | "low" | "medium" | "high" | "solid";

export type SubjectReadiness = {
  subjectId: string;
  score: number;
  level: SubjectReadinessLevel;
  label: string;
  message: string;
  factors: {
    totalStudyMinutes: number;
    recentStudyMinutes: number;
    latestMockScore: number | null;
    averageMockScore: number | null;
    mockCount: number;
    daysSinceLastSession: number | null;
  };
};

export type MockResult = {
  id: string;
  date: string;
  subjectId: string;
  score: number;
  bank?: string;
  durationMinutes?: number;
  notes?: string;
};

export type ReviewStatus = "pending" | "completed" | "overdue";

export type ReviewItem = {
  id: string;
  subjectId: string;
  topic: string;
  createdAt: string;
  dueDate: string;
  intervalDays: number;
  status: ReviewStatus;
  completedAt?: string;
  notes?: string;
};

export type ErrorLogType =
  | "concept"
  | "formula"
  | "unit_conversion"
  | "fast_reading"
  | "procedure"
  | "english_comprehension"
  | "memory"
  | "distraction"
  | "other";

export type ErrorLogStatus = "pending" | "reviewed" | "resolved";

export type ErrorLogItem = {
  id: string;
  date: string;
  subjectId: string;
  topic: string;
  type: ErrorLogType;
  description: string;
  correctiveAction?: string;
  status: ErrorLogStatus;
  linkedMockId?: string;
  notes?: string;
};

export type ExamDate = {
  id: string;
  subjectId: string;
  date: string;
  notes?: string;
};

export type RecoveryProblem =
  | "too_many_subjects"
  | "low_mock_scores"
  | "no_weekly_plan"
  | "overdue_reviews"
  | "pending_errors"
  | "low_time"
  | "burnout"
  | "dont_know_where_to_start";

export type RecoveryPlanStep = {
  id: string;
  title: string;
  description: string;
  actionType?:
    | "plan_session"
    | "review"
    | "mock"
    | "error_log"
    | "reduce_subjects"
    | "rest"
    | "class_cta";
};

export type RecoveryPlan = {
  problems: RecoveryProblem[];
  summary: string;
  riskLevel: "low" | "medium" | "high";
  steps: RecoveryPlanStep[];
  cta?: {
    label: string;
    href: string;
  };
};

export type AtplPlannerState = {
  mode: StudyMode;
  weeklyGoalMinutes: number;
  /** Asignaturas activas en el plan (ids del catálogo del modo actual). */
  activeSubjectIds: string[];
  /** Fecha objetivo global (YYYY-MM-DD). */
  targetExamDate?: string;
  /** Inicio del plan (YYYY-MM-DD). */
  studyStartDate?: string;
  onboardingCompleted?: boolean;
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
};

export const DEFAULT_ATPL_PLANNER_STATE: AtplPlannerState = {
  mode: "atpl",
  weeklyGoalMinutes: 600,
  activeSubjectIds: [],
  onboardingCompleted: false,
  sessions: [],
  plannedSessions: [],
  mockResults: [],
  reviewItems: [],
  errorLogItems: [],
  examDates: [],
};

export type PlannerOnboardingPayload = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate: string;
  studyStartDate?: string;
};

/** Configuración editable del plan (post-onboarding). */
export type PlannerPlanSettingsPayload = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
};
