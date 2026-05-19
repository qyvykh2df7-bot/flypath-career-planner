import type { StudySessionType } from "../types";
import type { PlanningPriorityReason } from "./planning-types";

const REASON_LABELS: Record<PlanningPriorityReason, string> = {
  exam_soon: "Fecha objetivo cercana",
  low_progress: "Progreso bajo",
  low_mock_score: "Mock reciente bajo",
  no_recent_study: "Sin estudio reciente",
  question_bank_focus: "Refuerzo de preguntas",
  review_recommended: "Repaso recomendado",
  mock_recommended: "Mock recomendado",
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
      return "Refuerzo de preguntas";
    case "review":
      return "Repaso recomendado";
    case "mock":
      return "Mock recomendado";
    case "theory":
      return getPlanningReasonLabel(fallback);
    default:
      return getPlanningReasonLabel(fallback);
  }
}
