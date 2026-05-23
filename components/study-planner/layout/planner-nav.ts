import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Calendar,
  PenLine,
  Settings2,
} from "lucide-react";

export type PlannerNavId =
  | "dashboard"
  | "calendar"
  | "subjects"
  | "log"
  | "evaluation"
  | "recovery"
  | "settings";

export const PLANNER_NAV_ITEMS: {
  id: PlannerNavId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "dashboard", label: "Hoy", icon: LayoutDashboard },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "subjects", label: "Asignaturas", icon: BookOpen },
  { id: "log", label: "Registro", icon: PenLine },
  { id: "evaluation", label: "Evaluación", icon: ClipboardList },
  { id: "recovery", label: "Recuperación", icon: LifeBuoy },
  { id: "settings", label: "Ajustes", icon: Settings2 },
];

/** Rail lateral (escritorio): navegación principal sin Registro. */
export const PLANNER_RAIL_PRIMARY_NAV_IDS: PlannerNavId[] = [
  "dashboard",
  "calendar",
  "subjects",
  "evaluation",
  "recovery",
  "settings",
];

/** Rail lateral — secundario (Registro hasta retirada final). */
export const PLANNER_RAIL_MORE_NAV_IDS: PlannerNavId[] = ["log"];

/** Bottom bar principal (móvil). */
export const PLANNER_MOBILE_PRIMARY_NAV_IDS: PlannerNavId[] = [
  "dashboard",
  "calendar",
  "subjects",
  "evaluation",
];

/** Dentro de “Más” en móvil. */
export const PLANNER_MOBILE_MORE_NAV_IDS: PlannerNavId[] = ["log", "recovery", "settings"];

export function getPlannerNavItem(id: PlannerNavId) {
  return PLANNER_NAV_ITEMS.find((item) => item.id === id);
}
