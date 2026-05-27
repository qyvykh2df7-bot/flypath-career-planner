import type { RecoveryPlan, RecoveryPlanStep } from "./types";

export const MOCK_CORRECTION_SUMMARY =
  "Durante los próximos 7 días cambiaremos volumen por precisión: menos bancos automáticos y más análisis de errores reales.";

export const MOCK_CORRECTION_IMPACT_LINE =
  "~4 simulacros diagnósticos · revisión de errores · repasos dirigidos";

export const MOCK_CORRECTION_BUTTON_LABEL = "Aplicar semana de corrección";

export const MOCK_CORRECTION_BUTTON_HINT =
  "Creará sesiones de simulacro, revisión de errores y repasos dirigidos durante 7 días.";

export function isMockCorrectionRecoveryPlan(
  plan: Pick<RecoveryPlan, "problems" | "focusReduction" | "primaryIntent">,
): boolean {
  if (plan.primaryIntent) return plan.primaryIntent === "low_mock_scores";
  return plan.problems.includes("low_mock_scores") && !plan.focusReduction?.appliesThisWeek;
}

export function buildMockCorrectionSteps(makeStep: (step: Omit<RecoveryPlanStep, "id">) => RecoveryPlanStep) {
  return [
    makeStep({
      title: "Simulacro + revisión",
      description: "Haz menos simulacros, pero revisa cada fallo importante.",
      actionType: "mock",
    }),
    makeStep({
      title: "Detectar patrones",
      description: "Identifica asignaturas o temas donde repites errores.",
      actionType: "review",
    }),
    makeStep({
      title: "Menos volumen automático",
      description: "Reduce sesiones de banco masivo sin análisis.",
      actionType: "review",
    }),
  ];
}
