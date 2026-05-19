/** Modo de registro en la sección Registro. */
export type StudyLogMode = "plan_block" | "free_study";

/** Navegación hacia Registro desde Hoy u otras vistas. */
export type StudyLogIntent = {
  mode?: StudyLogMode;
  plannedSessionId?: string;
};

export const DEFAULT_STUDY_LOG_INTENT: StudyLogIntent = {
  mode: "free_study",
};
