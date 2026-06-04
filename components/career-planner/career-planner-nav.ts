import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, FileText, User } from "lucide-react";
import type { PlannerDashboardTab, PlannerStepId } from "./career-planner-steps";

/** Tabs del dashboard (shell legacy con rail lateral). */
export type CareerPlannerTab = PlannerDashboardTab;

export const CAREER_PLANNER_NAV_ITEMS: {
  id: CareerPlannerTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: "diagnosis", label: "Diagnóstico", shortLabel: "Diagnóstico", icon: ClipboardList },
  { id: "schools", label: "Escuelas", shortLabel: "Escuelas", icon: Building2 },
  { id: "report", label: "Informe final", shortLabel: "Informe", icon: FileText },
];

export const PLANNER_STEP_ICONS: Record<PlannerStepId, LucideIcon> = {
  profile: User,
  diagnosis: ClipboardList,
  schools: Building2,
  report: FileText,
};

export function getCareerPlannerNavItem(id: CareerPlannerTab) {
  return CAREER_PLANNER_NAV_ITEMS.find((item) => item.id === id);
}
