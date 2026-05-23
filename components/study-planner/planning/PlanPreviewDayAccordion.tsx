"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatShortDate, getDayShortLabel } from "@/lib/study-planner/calculations";
import type { PlannedStudyBlock } from "@/lib/study-planner/planning/planning-types";
import { PlanPreviewSessionRow } from "./PlanPreviewSessionRow";

type PlanPreviewDayAccordionProps = {
  date: string;
  blocks: PlannedStudyBlock[];
  defaultOpen?: boolean;
  isToday?: boolean;
};

export function PlanPreviewDayAccordion({
  date,
  blocks,
  defaultOpen = false,
  isToday = false,
}: PlanPreviewDayAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-slate-50/80"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[13px] font-semibold text-[#0f1a33]">
            {getDayShortLabel(date)} · {formatShortDate(date)}
          </span>
          {isToday ? (
            <span className="rounded-full bg-[#fff8e8] px-1.5 py-0.5 text-[12px] font-semibold uppercase text-[#7a5a16]">
              Hoy
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-slate-500">
          {blocks.length} bloque{blocks.length === 1 ? "" : "s"}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <ul className="border-t border-slate-100 px-3 pb-2 pt-0.5">
          {blocks.map((block) => (
            <PlanPreviewSessionRow key={block.id} block={block} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
