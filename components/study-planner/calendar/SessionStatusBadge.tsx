"use client";

import type { PlannedStudySession } from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import {
  DISPLAY_STATUS_LABELS,
  displayStatusBadgeClass,
  getSessionDisplayStatus,
} from "./session-display";

type SessionStatusBadgeProps = {
  session: PlannedStudySession;
  today?: string;
  className?: string;
};

export function SessionStatusBadge({ session, today, className = "" }: SessionStatusBadgeProps) {
  const refToday = today ?? getTodayDateString();
  const displayStatus = getSessionDisplayStatus(session, refToday);

  return (
    <span
      className={`inline-flex max-w-full min-w-0 shrink rounded-md px-1 py-px text-[8px] font-medium tracking-normal ${displayStatusBadgeClass(displayStatus)} ${className}`}
    >
      <span className="min-w-0 truncate">{DISPLAY_STATUS_LABELS[displayStatus]}</span>
    </span>
  );
}
