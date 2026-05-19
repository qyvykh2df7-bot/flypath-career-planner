import type { EvaluationView } from "./evaluation-page-logic";

export type GoToEvaluationOptions = {
  section?: EvaluationView;
  focusMockForm?: boolean;
};

export type GoToSubjectsOptions = {
  openExamDatesForm?: boolean;
};
