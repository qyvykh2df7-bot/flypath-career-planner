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
  /** Bloque planificado del calendario que originó este registro (vínculo explícito). */
  linkedPlannedSessionId?: string;
};

import type { AtplBankArea } from "./atpl-bank-areas";
import type { PlannedStudySessionStatus } from "./planner-session-status";
export type { AtplBankArea } from "./atpl-bank-areas";
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
  /** Área de banco ATPL (solo sesiones tipo question_bank). */
  bankArea?: AtplBankArea;
};

export type SubjectReadinessLevel = "no_data" | "low" | "medium" | "high" | "solid";

export type ReadinessConfidence = "low" | "medium" | "high";

export type SubjectReadinessBreakdown = {
  theoryMinutes: number;
  bankMinutes: number;
  reviewMinutes: number;
  otherSessionMinutes: number;
  theorySessions: number;
  bankSessions: number;
  mockCount: number;
  sessionCount: number;
  pendingErrors: number;
  pendingReviews: number;
  daysSinceLastSession: number | null;
  latestMockScore: number | null;
  averageMockScore: number | null;
};

export type SubjectReadiness = {
  subjectId: string;
  score: number;
  level: SubjectReadinessLevel;
  /** Etiqueta pedagógica visible (p. ej. «Primeras señales positivas»). */
  label: string;
  pedagogicalLabel: string;
  message: string;
  confidence: ReadinessConfidence;
  confidenceLabel: string;
  isProvisional: boolean;
  breakdown: SubjectReadinessBreakdown;
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

export type RecoveryPlanVariant = "standard" | "lighter";

export type RecoveryPlan = {
  problems: RecoveryProblem[];
  summary: string;
  riskLevel: "low" | "medium" | "high";
  steps: RecoveryPlanStep[];
  variant?: RecoveryPlanVariant;
  cta?: {
    label: string;
    href: string;
  };
};

export type InitialStudyContext =
  | "from_zero"
  | "started_some_subjects"
  | "mostly_bank"
  | "exam_prep"
  | "returning_after_break";

export type DeclaredSubjectStage =
  | "not_started"
  | "base_initial"
  | "in_progress"
  | "mostly_bank"
  | "exam_prep"
  | "passed";

export type InitialSubjectState = {
  subjectId: string;
  declaredStage: DeclaredSubjectStage;
  estimatedProgressPercent?: number;
  estimatedMockAverage?: number;
  examDate?: string;
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
  /** Contexto global declarado en onboarding/ajustes. */
  initialStudyContext?: InitialStudyContext;
  /** Estado inicial por asignatura (señal hasta que haya datos reales). */
  initialSubjectStates?: InitialSubjectState[];
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
  initialStudyContext: InitialStudyContext;
  initialSubjectStates: InitialSubjectState[];
};

/** Configuración editable del plan (post-onboarding). */
export type PlannerPlanSettingsPayload = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
  initialStudyContext?: InitialStudyContext;
  initialSubjectStates?: InitialSubjectState[];
};
