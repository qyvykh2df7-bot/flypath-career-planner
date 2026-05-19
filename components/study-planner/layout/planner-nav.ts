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
  { id: "calendar", label: "Plan", icon: Calendar },
  { id: "subjects", label: "Asignaturas", icon: BookOpen },
  { id: "log", label: "Registro", icon: PenLine },
  { id: "evaluation", label: "Evaluación", icon: ClipboardList },
  { id: "recovery", label: "Recovery", icon: LifeBuoy },
  { id: "settings", label: "Ajustes", icon: Settings2 },
];
