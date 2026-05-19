import type { MockResult, PlannedStudySession, StudyMode, StudySession, StudySessionType } from "../types";

/** Prioridad de una tarea o bloque en el plan semanal. */
export type WeeklyPlanPriority = "critical" | "high" | "medium" | "low";

/** Motivo interno de priorización / tipo de bloque. */
export type PlanningPriorityReason =
  | "exam_soon"
  | "low_progress"
  | "low_mock_score"
  | "no_recent_study"
  | "question_bank_focus"
  | "review_recommended"
  | "mock_recommended"
  | "maintain_rhythm";

/** Cómo aplicar el plan generado al calendario. */
export type ApplyPlanMode = "append" | "replace_visible_week";

export type PlanningGenerationWarningCode =
  | "existing_planned_sessions"
  | "no_active_subjects"
  | "no_eligible_days"
  | "low_weekly_minutes"
  | "past_week";

export type PlanningGenerationWarning = {
  code: PlanningGenerationWarningCode;
  message: string;
};

/** Bloque orientativo de estudio para un día. */
export type PlannedStudyBlock = {
  id: string;
  date: string;
  suggestedStartTime: string;
  subjectId: string;
  sessionType: StudySessionType;
  plannedMinutes: number;
  priority: WeeklyPlanPriority;
  reason: PlanningPriorityReason;
  reasonLabel: string;
  notes?: string;
};

/** Plan semanal generado. */
export type WeeklyStudyPlan = {
  weekStartDate: string;
  weekEndDate: string;
  mode: StudyMode;
  totalPlannedMinutes: number;
  blocks: PlannedStudyBlock[];
  focusSubjectIds: string[];
  summaryHints: string[];
};

/** Entrada del motor de planificación. */
export type PlanningEngineInput = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
  /** Lunes de la semana objetivo (YYYY-MM-DD). */
  weekStartDate: string;
  /** Fecha de referencia para prioridades y elegibilidad (normalmente hoy). */
  referenceDate: string;
  sessions: StudySession[];
  mockResults: MockResult[];
};

export type PlanningEngineResult = {
  plan: WeeklyStudyPlan | null;
  warnings: PlanningGenerationWarning[];
};

/** Puntuación de prioridad por asignatura (uso interno / tests). */
export type SubjectPriorityScore = {
  subjectId: string;
  score: number;
  progressPercent: number;
  latestMockScore: number | null;
  daysSinceLastSession: number | null;
  dominantReason: PlanningPriorityReason;
};
