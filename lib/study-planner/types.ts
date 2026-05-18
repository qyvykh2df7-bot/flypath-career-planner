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

export type AtplPlannerState = {
  mode: StudyMode;
  weeklyGoalMinutes: number;
  sessions: StudySession[];
};

export const DEFAULT_ATPL_PLANNER_STATE: AtplPlannerState = {
  mode: "atpl",
  weeklyGoalMinutes: 600,
  sessions: [],
};
