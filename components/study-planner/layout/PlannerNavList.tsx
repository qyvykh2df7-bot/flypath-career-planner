"use client";

import { PLANNER_NAV_ITEMS, type PlannerNavId } from "./planner-nav";

type PlannerNavListProps = {
  activeId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
};

export function PlannerNavList({ activeId, onNavigate }: PlannerNavListProps) {
  return (
    <>
      {PLANNER_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all duration-150 ${
              isActive
                ? "border-l-2 border-[#c9a454] bg-[#f7f3ea] pl-[calc(0.625rem-2px)] font-medium text-[#5c4d28]"
                : "border-l-2 border-transparent font-normal text-slate-600 hover:bg-[#eeebe4]/80 hover:text-[#0f1a33]"
            }`}
          >
            <Icon
              className={`h-[15px] w-[15px] shrink-0 transition-colors duration-150 ${
                isActive ? "text-[#a5802a]" : "text-slate-400 group-hover:text-slate-500"
              }`}
              aria-hidden
            />
            {item.label}
          </button>
        );
      })}
    </>
  );
}
