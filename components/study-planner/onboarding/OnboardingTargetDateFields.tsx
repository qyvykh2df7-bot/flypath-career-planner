"use client";

import { useMemo } from "react";
import { getDaysUntilDate, getTodayDateString } from "@/lib/study-planner/calculations";
import { plannerFieldClass, plannerFieldLabel } from "@/lib/study-planner/planner-ui";

const QUICK_MONTH_OPTIONS = [
  { label: "3 meses", months: 3 },
  { label: "6 meses", months: 6 },
  { label: "12 meses", months: 12 },
] as const;

const EIGHTEEN_MONTHS_DAYS = 18 * 30;

function addMonthsFromToday(months: number): string {
  const [y, m, d] = getTodayDateString().split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

type OnboardingTargetDateFieldsProps = {
  value: string;
  onChange: (isoDate: string) => void;
};

export function OnboardingTargetDateFields({ value, onChange }: OnboardingTargetDateFieldsProps) {
  const today = getTodayDateString();

  const daysUntil = useMemo(() => {
    if (!value) return null;
    return getDaysUntilDate(value, today);
  }, [value, today]);

  const showAggressiveWarning =
    daysUntil !== null && daysUntil >= 0 && daysUntil < 30;
  const showFarInfo = daysUntil !== null && daysUntil > EIGHTEEN_MONTHS_DAYS;

  return (
    <div className="space-y-4">
      <label className={plannerFieldLabel}>
        ¿Cuándo te gustaría terminar este bloque?
        <input
          type="date"
          required
          min={today}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={plannerFieldClass}
        />
      </label>

      <p className="text-[12px] leading-relaxed text-slate-500">
        Usaremos esta fecha para calcular tu ritmo semanal y decirte si vas en tiempo.
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Plazos rápidos">
        {QUICK_MONTH_OPTIONS.map(({ label, months }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(addMonthsFromToday(months))}
            className="rounded-full border border-slate-200/90 bg-slate-50/90 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
          >
            {label}
          </button>
        ))}
      </div>

      {showAggressiveWarning ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[12px] leading-relaxed text-amber-900/90">
          Objetivo bastante exigente para el tiempo disponible.
        </p>
      ) : null}

      {showFarInfo ? (
        <p className="text-[12px] leading-relaxed text-slate-500">
          Puedes ajustar esta fecha más adelante desde configuración.
        </p>
      ) : null}
    </div>
  );
}
