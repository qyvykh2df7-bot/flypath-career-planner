"use client";

import type { PlannedStudyBlock } from "@/lib/study-planner/planning/planning-types";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";

type PlanPreviewSessionRowProps = {
  block: PlannedStudyBlock;
};

export function PlanPreviewSessionRow({ block }: PlanPreviewSessionRowProps) {
  const subjectName = getSubjectById(block.subjectId)?.name ?? block.subjectId;

  return (
    <li className="flex items-center justify-between gap-2 border-b border-slate-100/90 py-1.5 text-[12px] last:border-0">
      <span className="min-w-0 truncate font-medium text-[#0f1a33]">{subjectName}</span>
      <span className="flex shrink-0 items-center gap-1.5 tabular-nums text-slate-500">
        {block.suggestedStartTime} · {block.plannedMinutes} min
        <SessionTypeBadge type={block.sessionType} />
      </span>
    </li>
  );
}
