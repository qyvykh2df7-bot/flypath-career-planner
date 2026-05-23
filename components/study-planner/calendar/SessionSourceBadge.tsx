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
      className={`inline-flex shrink-0 rounded px-1 py-0.5 text-[8px] font-medium tracking-normal ${
        isManual
          ? "bg-violet-50/80 text-violet-800/90"
          : "bg-slate-100/80 text-slate-500"
      } ${className}`}
    >
      {isManual ? "Manual" : "Auto"}
    </span>
  );
}
