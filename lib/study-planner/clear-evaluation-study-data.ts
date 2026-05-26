import type { AtplPlannerState } from "./types";

/** Borra datos de evaluación/bitácora; conserva planificación, exámenes y ajustes. */
export function clearEvaluationStudyData(state: AtplPlannerState): AtplPlannerState {
  return {
    ...state,
    sessions: [],
    mockResults: [],
    reviewItems: [],
    errorLogItems: [],
  };
}
