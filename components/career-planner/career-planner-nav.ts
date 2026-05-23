import type { LucideIcon } from "lucide-react";
import { Building2, FileText, Route, Wallet } from "lucide-react";

export type CareerPlannerTab = "route" | "cost" | "schools" | "report";

export const CAREER_PLANNER_NAV_ITEMS: {
  id: CareerPlannerTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: "route", label: "Planificador de ruta", shortLabel: "Ruta", icon: Route },
  { id: "cost", label: "Costes", shortLabel: "Costes", icon: Wallet },
  { id: "schools", label: "Escuelas", shortLabel: "Escuelas", icon: Building2 },
  { id: "report", label: "Informe final", shortLabel: "Informe", icon: FileText },
];

export function getCareerPlannerNavItem(id: CareerPlannerTab) {
  return CAREER_PLANNER_NAV_ITEMS.find((item) => item.id === id);
}
