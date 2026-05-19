"use client";

import { PLANNER_NAV_ITEMS, type PlannerNavId } from "./planner-nav";

type PlannerMobileNavProps = {
  activeId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
};

export function PlannerMobileNav({ activeId, onNavigate }: PlannerMobileNavProps) {
  return (
    <nav
      className="flex gap-0.5 overflow-x-auto border-b border-slate-200/40 bg-[#f6f7f9]/95 px-2 py-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Navegación móvil"
    >
      {PLANNER_NAV_ITEMS.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`shrink-0 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
              isActive
                ? "bg-slate-200/80 font-medium text-[#0f1a33]"
                : "font-normal text-slate-500"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
