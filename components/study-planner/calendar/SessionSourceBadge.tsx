"use client";

import type { PlannedSessionSource } from "@/lib/study-planner/types";

type SessionSourceBadgeProps = {
  source: PlannedSessionSource;
  className?: string;
};

export function SessionSourceBadge({ source, className = "" }: SessionSourceBadgeProps) {
  const isManual = source === "manual";
  return (
    <span
      className={`inline-flex shrink-0 rounded px-1 py-px text-[8px] font-bold uppercase tracking-wide ring-1 ${
        isManual
          ? "bg-violet-50 text-violet-900 ring-violet-200/80"
          : "bg-slate-100 text-slate-600 ring-slate-200/80"
      } ${className}`}
    >
      {isManual ? "Manual" : "Auto"}
    </span>
  );
}
