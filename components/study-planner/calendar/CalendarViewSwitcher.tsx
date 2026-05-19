"use client";

import type { CalendarViewMode } from "./types";

/** Semana primero: vista principal del planner. */
const VIEWS: { id: CalendarViewMode; label: string }[] = [
  { id: "week", label: "Semana" },
  { id: "day", label: "Día" },
  { id: "month", label: "Mes" },
];

type CalendarViewSwitcherProps = {
  value: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
};

export function CalendarViewSwitcher({ value, onChange }: CalendarViewSwitcherProps) {
  return (
    <div
      className="inline-flex rounded-xl border border-slate-200/90 bg-slate-50/80 p-0.5 shadow-sm ring-1 ring-slate-100/80"
      role="tablist"
      aria-label="Vista del calendario"
    >
      {VIEWS.map((view) => {
        const active = value === view.id;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(view.id)}
            className={`min-w-[4.5rem] rounded-[10px] px-3.5 py-1.5 text-[13px] font-semibold transition ${
              active
                ? "bg-white text-[#0f1a33] shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-[#0f1a33]"
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
