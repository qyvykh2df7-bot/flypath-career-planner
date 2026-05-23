"use client";

import { plannerFieldClass, plannerFieldLabel } from "@/lib/study-planner/planner-ui";

type PlannerSettingsWeeklyGoalProps = {
  weeklyHours: number;
  onChange: (hours: number) => void;
};

export function PlannerSettingsWeeklyGoal({
  weeklyHours,
  onChange,
}: PlannerSettingsWeeklyGoalProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-[14px] font-semibold text-[#0f1a33]">Horas semanales</h3>
      <p className="text-[13px] text-slate-500">
        Objetivo de estudio por semana. Se usa en el dashboard y en estimaciones de progreso.
      </p>
      <label className={plannerFieldLabel}>
        Horas por semana
        <input
          type="number"
          min={1}
          max={80}
          value={weeklyHours}
          onChange={(e) => onChange(Number(e.target.value))}
          className={plannerFieldClass}
        />
      </label>
      <p className="text-[13px] text-slate-500">
        {weeklyHours} h/semana ({weeklyHours * 60} minutos).
      </p>
    </section>
  );
}
