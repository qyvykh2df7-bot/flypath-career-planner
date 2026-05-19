"use client";

import { PanelLeft, Settings2 } from "lucide-react";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import { PLANNER_NAV_ITEMS, type PlannerNavId } from "./planner-nav";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatTopbarDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
}

type PlannerTopbarProps = {
  activeNavId: PlannerNavId;
  onOpenPlannerNav?: () => void;
  onOpenSettings: () => void;
};

export function PlannerTopbar({
  activeNavId,
  onOpenPlannerNav,
  onOpenSettings,
}: PlannerTopbarProps) {
  const todayLabel = formatTopbarDate(getTodayDateString());
  const sectionLabel =
    PLANNER_NAV_ITEMS.find((item) => item.id === activeNavId)?.label ?? "Hoy";

  return (
    <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-slate-200/40 bg-[#f6f7f9] px-4 sm:px-6">
      <p className="min-w-0 truncate text-[12px] leading-none text-slate-500">
        <span className="font-medium text-slate-600">{sectionLabel}</span>
        <span className="mx-1.5 text-slate-300/90" aria-hidden>
          ·
        </span>
        <span className="text-slate-400">{todayLabel}</span>
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-[#0f1a33] md:hidden"
          aria-label="Ajustes del planner"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
        </button>
        {onOpenPlannerNav ? (
          <button
            type="button"
            onClick={onOpenPlannerNav}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-[#0f1a33] md:hidden"
            aria-label="Abrir navegación del planner"
          >
            <PanelLeft className="h-4 w-4" aria-hidden />
            Menú
          </button>
        ) : null}
      </div>
    </header>
  );
}
