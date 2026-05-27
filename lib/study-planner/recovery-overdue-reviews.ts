import type { RecoveryPlan, RecoveryPlanStep } from "./types";

export const OVERDUE_REVIEWS_SUMMARY =
  "Durante los próximos 7 días limpiaremos repasos pendientes antes de añadir más carga nueva.";

export const OVERDUE_REVIEWS_IMPACT_LINE =
  "~5 bloques de repaso · menos teoría nueva · continuidad semanal";

export const OVERDUE_REVIEWS_BUTTON_LABEL = "Aplicar semana de repaso";

export const OVERDUE_REVIEWS_BUTTON_HINT =
  "Reorganizará tus próximos 7 días para priorizar repasos pendientes sin borrar progreso.";

export function isOverdueReviewsRecoveryPlan(
  plan: Pick<RecoveryPlan, "problems" | "focusReduction" | "primaryIntent">,
): boolean {
  if (plan.primaryIntent) return plan.primaryIntent === "overdue_reviews";
  return plan.problems.length === 1 && plan.problems[0] === "overdue_reviews" && !plan.focusReduction;
}

export function buildOverdueReviewSteps(
  makeStep: (step: Omit<RecoveryPlanStep, "id">) => RecoveryPlanStep,
) {
  return [
    makeStep({
      title: "Repasos atrasados primero",
      description:
        "Completa o reprograma repasos pendientes antes de avanzar con temas nuevos.",
      actionType: "review",
    }),
    makeStep({
      title: "Teoría nueva limitada",
      description: "Reduce carga nueva esta semana hasta volver al ritmo normal.",
      actionType: "plan_session",
    }),
    makeStep({
      title: "Revisión corta diaria",
      description: "Añade bloques breves de repaso para evitar volver a acumular retraso.",
      actionType: "review",
    }),
  ];
}
