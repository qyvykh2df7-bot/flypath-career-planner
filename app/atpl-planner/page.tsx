import type { Metadata } from "next";
import { AtplPlannerApp } from "@/components/study-planner/AtplPlannerApp";

export const metadata: Metadata = {
  title: "ATPL Planner | Organiza tu estudio ATPL",
  description: "Organiza asignaturas, horas de estudio, progreso y planificación ATPL/PPL con FlyPath.",
};

export default function AtplPlannerPage() {
  return <AtplPlannerApp />;
}
