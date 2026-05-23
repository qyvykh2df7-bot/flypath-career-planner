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
      className={`inline-flex max-w-full min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium leading-none tracking-normal ${badgeClass} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      <span className="min-w-0 truncate">{getSessionTypeShortLabel(type)}</span>
    </span>
  );
}
