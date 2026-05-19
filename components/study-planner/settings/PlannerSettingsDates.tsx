"use client";

import { plannerFieldClass, plannerFieldLabel } from "@/lib/study-planner/planner-ui";
import { getTodayDateString } from "@/lib/study-planner/calculations";

type PlannerSettingsDatesProps = {
  targetExamDate: string;
  onTargetExamDateChange: (value: string) => void;
  useStudyStart: boolean;
  onUseStudyStartChange: (value: boolean) => void;
  studyStartDate: string;
  onStudyStartDateChange: (value: string) => void;
};

export function PlannerSettingsDates({
  targetExamDate,
  onTargetExamDateChange,
  useStudyStart,
  onUseStudyStartChange,
  studyStartDate,
  onStudyStartDateChange,
}: PlannerSettingsDatesProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[14px] font-semibold text-[#0f1a33]">Fechas del plan</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          La fecha objetivo alimenta semanas restantes y objetivos por asignatura.
        </p>
      </div>

      <label className={plannerFieldLabel}>
        Fecha objetivo global
        <input
          type="date"
          value={targetExamDate}
          onChange={(e) => onTargetExamDateChange(e.target.value)}
          className={plannerFieldClass}
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-[14px] text-slate-700">
        <input
          type="checkbox"
          checked={useStudyStart}
          onChange={(e) => onUseStudyStartChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#c9a454]"
        />
        Indicar fecha de inicio del plan
      </label>

      {useStudyStart ? (
        <label className={plannerFieldLabel}>
          Fecha de inicio
          <input
            type="date"
            max={getTodayDateString()}
            value={studyStartDate}
            onChange={(e) => onStudyStartDateChange(e.target.value)}
            className={plannerFieldClass}
          />
        </label>
      ) : null}
    </section>
  );
}
