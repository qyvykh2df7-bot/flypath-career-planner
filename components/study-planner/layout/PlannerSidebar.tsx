"use client";

import { PlannerNavList } from "./PlannerNavList";
import type { PlannerNavId } from "./planner-nav";

type PlannerSidebarProps = {
  activeId: PlannerNavId;
  onNavigate: (id: PlannerNavId) => void;
};

export function PlannerSidebar({ activeId, onNavigate }: PlannerSidebarProps) {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#e5e1d8]/90 bg-[#f5f3ee] md:flex lg:w-[248px]">
      <div className="border-b border-[#e5e1d8]/80 px-4 pb-3.5 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Tu semana de estudio
        </p>
        <div className="mt-3 h-px w-8 bg-gradient-to-r from-[#c9a454]/70 to-transparent" aria-hidden />
      </div>
      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2.5"
        aria-label="Navegación del planner"
      >
        <PlannerNavList activeId={activeId} onNavigate={onNavigate} />
      </nav>
    </aside>
  );
}
