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
      className="inline-flex rounded-xl bg-slate-100/60 p-0.5 shadow-[inset_0_1px_2px_rgba(15,26,51,0.04)] transition-[background-color] duration-200"
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
            className={`relative min-w-[4.5rem] rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/20 ${
              active
                ? "bg-white text-[#0f1a33] shadow-[0_2px_8px_-4px_rgba(15,26,51,0.1)]"
                : "text-slate-500 hover:bg-white/50 hover:text-slate-800"
            }`}
          >
            {active ? (
              <span
                className="pointer-events-none absolute inset-x-2.5 bottom-1 h-px rounded-full bg-[#c9a454]/70 transition-opacity duration-200"
                aria-hidden
              />
            ) : null}
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
