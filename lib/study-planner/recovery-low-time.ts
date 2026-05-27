import type { RecoveryPlan, RecoveryPlanStep } from "./types";

export const LOW_TIME_SUMMARY =
  "Durante los próximos 7 días ajustaremos el plan a una carga mínima realista: pocas sesiones, bloques cortos y prioridades claras.";

export const LOW_TIME_IMPACT_LINE =
  "~4–6 sesiones · bloques de 30–45 min · máxima prioridad";

export const LOW_TIME_BUTTON_LABEL = "Aplicar semana mínima";

export const LOW_TIME_BUTTON_HINT =
  "Creará una semana ligera con pocas sesiones y prioridades claras.";

export function isLowTimeRecoveryPlan(
  plan: Pick<RecoveryPlan, "problems" | "focusReduction" | "primaryIntent">,
): boolean {
  if (plan.primaryIntent) return plan.primaryIntent === "low_time";
  return plan.problems.length === 1 && plan.problems[0] === "low_time" && !plan.focusReduction;
}

export function buildLowTimeSteps(
  makeStep: (step: Omit<RecoveryPlanStep, "id">) => RecoveryPlanStep,
) {
  return [
    makeStep({
      title: "Objetivo semanal realista",
      description: "Planifica solo bloques que realmente puedas cumplir.",
      actionType: "plan_session",
    }),
    makeStep({
      title: "Prioridad alta primero",
      description:
        "Mantén únicamente las tareas o asignaturas más importantes esta semana.",
      actionType: "reduce_subjects",
    }),
    makeStep({
      title: "Sesiones cortas",
      description:
        "Usa bloques de 30-45 minutos para mantener continuidad sin saturarte.",
      actionType: "plan_session",
    }),
  ];
}
