import type { EvaluationView } from "./evaluation-page-logic";
import type { SubjectFilterId } from "./subjects-page-logic";

export type GoToEvaluationOptions = {
  section?: EvaluationView | "errors";
  focusMockForm?: boolean;
};

export type GoToSubjectsOptions = {
  openExamDatesForm?: boolean;
  filter?: SubjectFilterId;
};
