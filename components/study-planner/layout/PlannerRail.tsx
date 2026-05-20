"use client";

import { PLANNER_NAV_ITEMS, type PlannerNavId } from "./planner-nav";

type PlannerRailProps = {
  activeId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
};

export function PlannerRail({ activeId, onNavigate }: PlannerRailProps) {
  return (
    <aside
      className="relative hidden w-[4.25rem] shrink-0 flex-col border-r border-slate-200/40 bg-white/95 backdrop-blur-sm md:flex"
      aria-label="Navegación del planner"
    >
      <div
        className="pointer-events-none absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-slate-200/80 to-transparent"
        aria-hidden
      />
      <nav className="flex flex-1 flex-col gap-0.5 px-1.5 py-3" role="navigation">
        {PLANNER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex h-10 w-full items-center justify-center rounded-xl transition-[background-color,color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive
                  ? "bg-slate-50/90 text-[#0f1a33]"
                  : "text-slate-500 hover:bg-slate-50/80 hover:text-[#0f1a33]"
              }`}
            >
              {isActive ? (
                <span
                  className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-[#c9a454] shadow-[0_0_0_1px_rgba(201,164,84,0.2)]"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                  isActive ? "text-[#0f1a33]" : "text-slate-400 group-hover:text-slate-600"
                }`}
                aria-hidden
              />
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
