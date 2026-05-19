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
      ? "border-emerald-200/80 bg-emerald-50/60 text-emerald-900"
      : insight.tone === "attention"
        ? "border-amber-200/80 bg-amber-50/50 text-amber-950"
        : "border-slate-200/80 bg-slate-50/80 text-slate-700";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[12px] leading-snug ${toneClass}`}
      role="status"
    >
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      <p>{insight.message}</p>
    </div>
  );
}
