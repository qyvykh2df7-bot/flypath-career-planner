"use client";

import type { PlannedStudyBlock } from "@/lib/study-planner/planning/planning-types";
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
import {
  getSessionTypeAccentClass,
  getSessionTypeIcon,
} from "@/lib/study-planner/session-type-visual";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";

type PlanPreviewSessionCardProps = {
  block: PlannedStudyBlock;
};

export function PlanPreviewSessionCard({ block }: PlanPreviewSessionCardProps) {
  const subjectName = getSubjectById(block.subjectId)?.name ?? block.subjectId;
  const Icon = getSessionTypeIcon(block.sessionType);
  const accent = getSessionTypeAccentClass(block.sessionType);

  return (
    <li
      className={`group rounded-lg border border-slate-200/90 border-l-[3px] bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300/90 hover:shadow-md ${accent}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f6f7f9] text-[#0f1a33]/75"
          aria-hidden
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[#0f1a33]">{subjectName}</p>
            <SessionTypeBadge type={block.sessionType} />
          </div>
          <p className="mt-0.5 text-[13px] text-slate-600">
            {getSessionTypeLabel(block.sessionType)} · {block.plannedMinutes} min ·{" "}
            {block.suggestedStartTime}
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            <span className="font-medium text-slate-600">Motivo:</span> {block.reasonLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a5a16]">
          Pendiente
        </span>
      </div>
    </li>
  );
}
