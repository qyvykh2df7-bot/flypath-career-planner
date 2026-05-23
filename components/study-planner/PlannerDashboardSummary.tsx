"use client";

import { Calendar, Clock, Target, BookOpen } from "lucide-react";
import type { StudyMode } from "@/lib/study-planner/types";
import {
  formatExamDisplayDate,
  formatWeeksRemainingLabel,
  getApproximateWeeksRemaining,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import { plannerMetricCard } from "@/lib/study-planner/planner-ui";

type PlannerDashboardSummaryProps = {
  mode: StudyMode;
  targetExamDate?: string;
  studyStartDate?: string;
  weeklyGoalMinutes: number;
  activeSubjectCount: number;
};

export function PlannerDashboardSummary({
  mode,
  targetExamDate,
  weeklyGoalMinutes,
  activeSubjectCount,
}: PlannerDashboardSummaryProps) {
  const weeksRemaining = getApproximateWeeksRemaining(targetExamDate);

  const items = [
    {
      icon: Target,
      label: "Fecha objetivo",
      value: targetExamDate ? formatExamDisplayDate(targetExamDate) : "Sin definir",
      hint: formatWeeksRemainingLabel(weeksRemaining),
    },
    {
      icon: Clock,
      label: "Horas semanales",
      value: minutesToHoursLabel(weeklyGoalMinutes),
      hint: "Objetivo de estudio por semana",
    },
    {
      icon: BookOpen,
      label: "Asignaturas activas",
      value: String(activeSubjectCount),
      hint: `Modo ${mode.toUpperCase()}`,
    },
    {
      icon: Calendar,
      label: "Semanas restantes",
      value: weeksRemaining === null ? "—" : `~${weeksRemaining}`,
      hint: targetExamDate ? "Estimación hasta tu objetivo" : "Añade fecha objetivo en onboarding",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.label} className={plannerMetricCard}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f1a33]/5 text-[#0f1a33]">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-0.5 text-xl font-semibold text-[#0f1a33]">{item.value}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-500">{item.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
