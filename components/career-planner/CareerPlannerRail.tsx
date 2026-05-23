"use client";

import { Settings2 } from "lucide-react";
import type { CareerPlannerTab } from "./career-planner-nav";
import { CAREER_PLANNER_NAV_ITEMS } from "./career-planner-nav";

type CareerPlannerRailProps = {
  activeTab: CareerPlannerTab;
  onNavigate: (tab: CareerPlannerTab) => void;
  onEditData: () => void;
};

const iconStroke = 1.65;

export function CareerPlannerRail({ activeTab, onNavigate, onEditData }: CareerPlannerRailProps) {
  return (
    <aside
      className="relative z-10 hidden h-full min-h-0 w-[4.25rem] shrink-0 flex-col self-stretch md:flex"
      aria-label="Navegación del Career Planner"
    >
      <nav className="shrink-0 px-1.5 pb-1 pt-2" role="navigation">
        <div className="flex flex-col gap-0.5">
          {CAREER_PLANNER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.shortLabel === "Informe" ? "Informe final" : item.shortLabel}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(item.id)}
                className={`group relative flex w-full flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-[background-color,color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a33] ${
                  isActive
                    ? "bg-white/[0.96] text-[#0f1a33] shadow-[0_1px_8px_rgba(0,0,0,0.1)] ring-1 ring-[#c9a454]/20"
                    : "text-slate-400/80 hover:bg-white/[0.07] hover:text-slate-200"
                }`}
              >
                {isActive ? (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-[#c9a454]"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  strokeWidth={iconStroke}
                  className={`h-[17px] w-[17px] shrink-0 transition-colors duration-200 ${
                    isActive ? "text-[#0f1a33]" : "text-slate-400/75 group-hover:text-slate-300"
                  }`}
                  aria-hidden
                />
                <span
                  className={`max-w-full truncate px-0.5 text-[12px] font-medium leading-none ${
                    isActive ? "text-[#0f1a33]" : "text-slate-400/75 group-hover:text-slate-300"
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-h-0 flex-1" aria-hidden />

      <div className="shrink-0 border-t border-white/10 px-1.5 pb-3 pt-2">
        <button
          type="button"
          title="Editar datos"
          aria-label="Editar datos"
          onClick={onEditData}
          className="group flex w-full flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-slate-400/75 transition hover:bg-white/[0.07] hover:text-[#f2ddaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30"
        >
          <Settings2
            strokeWidth={iconStroke}
            className="h-[17px] w-[17px] shrink-0 transition-colors group-hover:text-[#f2ddaa]"
            aria-hidden
          />
          <span className="text-[12px] font-medium leading-none group-hover:text-slate-300">Datos</span>
        </button>
      </div>
    </aside>
  );
}
