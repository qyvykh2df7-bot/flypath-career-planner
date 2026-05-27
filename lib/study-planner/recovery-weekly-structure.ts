import type { RecoveryPlan } from "./types";
import { isBurnoutRecoveryPlan } from "./recovery-burnout-relief";

export const WEEKLY_STRUCTURE_PLAN_INTRO =
  "Durante los próximos 7 días organizaremos una semana simple y clara:";

export const WEEKLY_STRUCTURE_PLAN_EFFECTS = [
  "pocas sesiones",
  "prioridades definidas",
  "mezcla equilibrada de teoría, banco y repaso",
] as const;

export function isWeeklyStructureRecoveryPlan(
  plan: Pick<RecoveryPlan, "problems" | "focusReduction" | "primaryIntent">,
): boolean {
  if (plan.primaryIntent) return plan.primaryIntent === "no_weekly_plan";
  if (!plan.problems.includes("no_weekly_plan")) return false;
  if (isBurnoutRecoveryPlan(plan.problems)) return false;
  if (plan.focusReduction?.appliesThisWeek) return false;
  return true;
}

export function formatWeeklyStructureImpactLine(sessionCount: number): string {
  return `~${sessionCount} sesiones organizadas · foco semanal · carga sostenible`;
}

export function buildWeeklyStructureRecoverySummary(): string {
  return WEEKLY_STRUCTURE_PLAN_INTRO;
}
