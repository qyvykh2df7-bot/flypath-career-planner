"use client";

import type { StudyMode } from "@/lib/study-planner/types";
import { minutesToHoursLabel, type WeeklyPlanCompletion } from "@/lib/study-planner/calculations";
import { DashboardWeeklyProgress } from "./DashboardWeeklyProgress";

type DashboardStudyCenterProps = {
  mode: StudyMode;
  weeklyGoalMinutes: number;
  subjectCount: number;
  targetExamDate?: string;
  completion?: WeeklyPlanCompletion | null;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatGoalDateShort(iso?: string): string {
  if (!iso) return "sin fecha";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

function buildPlanMetaLine(params: {
  hoursLabel: string;
  subjectCount: number;
  targetExamDate?: string;
  modeLabel: string;
}): string {
  const { hoursLabel, subjectCount, targetExamDate, modeLabel } = params;
  const goalPart = targetExamDate
    ? `Objetivo ${formatGoalDateShort(targetExamDate)}`
    : "Sin fecha objetivo";
  return `${hoursLabel} objetivo · ${subjectCount} asignaturas · ${goalPart} · ${modeLabel}`;
}

export function DashboardStudyCenter({
  mode,
  weeklyGoalMinutes,
  subjectCount,
  targetExamDate,
  completion = null,
}: DashboardStudyCenterProps) {
  const modeLabel = mode === "atpl" ? "ATPL" : "PPL";
  const hasActivePlan = completion?.hasPlan === true;
  const hoursLabel = minutesToHoursLabel(Math.max(0, weeklyGoalMinutes));
  const planMetaLine = buildPlanMetaLine({
    hoursLabel,
    subjectCount,
    targetExamDate,
    modeLabel,
  });

  return (
    <header className="space-y-2">
      <h2 className="text-[17px] font-medium tracking-tight text-[#0f1a33]">
        Centro de estudio {modeLabel}
      </h2>

      {hasActivePlan && completion ? (
        <DashboardWeeklyProgress completion={completion} planMetaLine={planMetaLine} />
      ) : (
        <p className="text-[11px] leading-relaxed text-slate-500">{planMetaLine}</p>
      )}
    </header>
  );
}
