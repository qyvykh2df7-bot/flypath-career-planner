export type PlannerStepId = "profile" | "diagnosis" | "schools" | "report";

export type PlannerDashboardTab = "diagnosis" | "schools" | "report";

/** Tabs legacy en URLs / review; se mapean a diagnosis sin romper enlaces. */
export type LegacyPlannerTab = "route" | "cost";

export const PLANNER_STEPS: {
  id: PlannerStepId;
  label: string;
  shortLabel: string;
  number: number;
}[] = [
  { id: "profile", label: "Perfil", shortLabel: "Perfil", number: 1 },
  { id: "diagnosis", label: "Diagnóstico", shortLabel: "Diagnóstico", number: 2 },
  { id: "schools", label: "Escuelas", shortLabel: "Escuelas", number: 3 },
  { id: "report", label: "Informe", shortLabel: "Informe", number: 4 },
];

export function normalizePlannerStep(step: string | null | undefined): PlannerStepId {
  if (step === "route" || step === "cost") return "diagnosis";
  if (step === "profile" || step === "diagnosis" || step === "schools" || step === "report") {
    return step;
  }
  return "diagnosis";
}

export function normalizeDashboardTab(tab: string | null | undefined): PlannerDashboardTab {
  if (tab === "route" || tab === "cost") return "diagnosis";
  if (tab === "diagnosis" || tab === "schools" || tab === "report") return tab;
  return "diagnosis";
}

export function plannerStepToTab(step: PlannerStepId): PlannerDashboardTab | null {
  if (step === "profile") return null;
  return step;
}
