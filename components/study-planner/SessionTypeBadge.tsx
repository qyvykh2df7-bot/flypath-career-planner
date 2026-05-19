"use client";

import type { StudySessionType } from "@/lib/study-planner/types";
import {
  getSessionTypeBadgeClass,
  getSessionTypeIcon,
} from "@/lib/study-planner/session-type-visual";
import { getSessionTypeShortLabel } from "@/lib/study-planner/labels";

type SessionTypeBadgeProps = {
  type: StudySessionType;
  className?: string;
};

export function SessionTypeBadge({ type, className = "" }: SessionTypeBadgeProps) {
  const Icon = getSessionTypeIcon(type);
  const badgeClass = getSessionTypeBadgeClass(type);

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ring-1 ${badgeClass} ${className}`}
    >
      <Icon className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />
      {getSessionTypeShortLabel(type)}
    </span>
  );
}
