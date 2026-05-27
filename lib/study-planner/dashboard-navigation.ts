import type { StudySessionType } from "./types";
import type { SubjectFilterId } from "./subjects-page-logic";

/** Valores iniciales al abrir el drawer de sesión planificada desde Hoy / Evaluación. */
export type PlannedSessionCreatePreset = {
  subjectId?: string;
  type: StudySessionType;
  date?: string;
  /** Si true, no preseleccionar la primera asignatura del catálogo. */
  leaveSubjectEmpty?: boolean;
};

export type GoToSubjectsOptions = {
  openExamDatesForm?: boolean;
  filter?: SubjectFilterId;
};
