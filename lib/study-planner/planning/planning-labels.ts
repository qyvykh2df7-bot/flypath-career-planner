import type { StudySessionType } from "../types";
import type { PlanningPriorityReason } from "./planning-types";

const REASON_LABELS: Record<PlanningPriorityReason, string> = {
  exam_soon: "Fecha objetivo cercana",
  low_progress: "Progreso bajo",
  low_mock_score: "Simulacro reciente bajo",
  no_recent_study: "Sin estudio reciente",
  question_bank_focus: "Refuerzo de banco",
  review_recommended: "Repaso recomendado",
  mock_recommended: "Simulacro recomendado",
  maintain_rhythm: "Mantener ritmo",
};

export function getPlanningReasonLabel(reason: PlanningPriorityReason): string {
  return REASON_LABELS[reason] ?? reason;
}

export function getSessionTypeReasonLabel(
  sessionType: StudySessionType,
  fallback: PlanningPriorityReason,
): string {
  switch (sessionType) {
    case "question_bank":
      return "Refuerzo de banco";
    case "review":
      return "Repaso recomendado";
    case "mock":
      return "Simulacro recomendado";
    case "error_correction":
      return "Revisión de errores pendientes";
    case "theory":
      return getPlanningReasonLabel(fallback);
    default:
      return getPlanningReasonLabel(fallback);
  }
}
