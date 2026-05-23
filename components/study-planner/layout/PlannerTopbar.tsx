"use client";

import { Settings2 } from "lucide-react";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import { getPlannerNavItem, type PlannerNavId } from "./planner-nav";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatTopbarDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
}

type PlannerTopbarProps = {
  activeNavId: PlannerNavId;
  onOpenSettings: () => void;
};

export function PlannerTopbar({ activeNavId, onOpenSettings }: PlannerTopbarProps) {
  const todayLabel = formatTopbarDate(getTodayDateString());
  const sectionLabel = getPlannerNavItem(activeNavId)?.label ?? "Hoy";

  return (
    <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-slate-200/40 bg-[#f6f7f9]/95 px-3 backdrop-blur-sm sm:px-5">
      <p className="min-w-0 truncate text-[13px] leading-snug text-slate-500">
        <span className="font-semibold text-slate-700">{sectionLabel}</span>
        <span className="mx-1.5 text-slate-300/90" aria-hidden>
          ·
        </span>
        <span className="font-normal text-slate-500">{todayLabel}</span>
      </p>
      <button
        type="button"
        onClick={onOpenSettings}
        className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-[background-color,color] duration-200 hover:bg-slate-200/50 hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/30 md:inline-flex"
        aria-label="Abrir ajustes del planner"
      >
        <Settings2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        Ajustes
      </button>
    </header>
  );
}
