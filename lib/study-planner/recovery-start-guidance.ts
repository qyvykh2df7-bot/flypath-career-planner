import type { RecoveryPlan, RecoveryPlanStep } from "./types";

export const START_GUIDANCE_SUMMARY =
  "Durante los próximos 7 días empezaremos con una sola asignatura y acciones pequeñas para crear inercia sin bloquearte.";

export const START_GUIDANCE_IMPACT_LINE =
  "~3 bloques simples · una asignatura · primer paso claro";

export const START_GUIDANCE_BUTTON_LABEL = "Aplicar plan de inicio";

export const START_GUIDANCE_BUTTON_HINT =
  "Creará una semana muy simple para empezar sin saturarte.";

export function isStartGuidanceRecoveryPlan(
  plan: Pick<RecoveryPlan, "problems" | "focusReduction" | "primaryIntent">,
): boolean {
  if (plan.primaryIntent) return plan.primaryIntent === "dont_know_where_to_start";
  return (
    plan.problems.length === 1 &&
    plan.problems[0] === "dont_know_where_to_start" &&
    !plan.focusReduction
  );
}

export function buildStartGuidanceSteps(
  makeStep: (step: Omit<RecoveryPlanStep, "id">) => RecoveryPlanStep,
) {
  return [
    makeStep({
      title: "Una asignatura primero",
      description: "Elige una sola materia para empezar esta semana.",
      actionType: "reduce_subjects",
    }),
    makeStep({
      title: "Primer bloque corto",
      description: "Planifica una sesión de 30-45 minutos para romper el bloqueo.",
      actionType: "plan_session",
    }),
    makeStep({
      title: "Siguiente paso visible",
      description: "Después del primer bloque, añade banco o repaso según cómo te haya ido.",
      actionType: "review",
    }),
  ];
}
