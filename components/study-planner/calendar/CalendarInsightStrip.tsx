"use client";

import type { CalendarInsight } from "@/lib/study-planner/calendar/calendar-insights";
import { Sparkles } from "lucide-react";

type CalendarInsightStripProps = {
  insight: CalendarInsight | null;
};

export function CalendarInsightStrip({ insight }: CalendarInsightStripProps) {
  if (!insight) return null;

  const toneClass =
    insight.tone === "positive"
      ? "bg-emerald-50/50 text-emerald-900"
      : insight.tone === "attention"
        ? "bg-amber-50/40 text-amber-950"
        : "bg-slate-50/70 text-slate-700";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-1.5 text-[12px] leading-snug transition-[background-color,opacity] duration-200 ${toneClass}`}
      role="status"
    >
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      <p>{insight.message}</p>
    </div>
  );
}
