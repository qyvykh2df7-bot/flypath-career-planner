"use client";

import { MessageSquareText } from "lucide-react";
import type { TeacherFollowUpComment } from "@/lib/study-planner/types";
import {
  buildDashboardFollowUpNoticePreview,
  shouldShowDashboardFollowUpNotice,
} from "@/lib/study-planner/dashboard-follow-up-notice";

type DashboardFollowUpNoticeProps = {
  comments: TeacherFollowUpComment[];
  lastSeenCommentId?: string | null;
  onViewEvaluation?: () => void;
};

export function DashboardFollowUpNotice({
  comments,
  lastSeenCommentId,
  onViewEvaluation,
}: DashboardFollowUpNoticeProps) {
  if (!shouldShowDashboardFollowUpNotice(comments, lastSeenCommentId)) return null;

  const preview = buildDashboardFollowUpNoticePreview(comments);
  if (!preview) return null;

  return (
    <section
      className="rounded-xl bg-white px-3 py-2.5 shadow-[0_2px_12px_-10px_rgba(15,26,51,0.12)] ring-1 ring-[#3b6ea8]/15"
      aria-label={preview.title}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 gap-2.5">
          <MessageSquareText
            className="mt-0.5 h-4 w-4 shrink-0 text-[#3b6ea8]"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug text-[#0f1a33]">
              {preview.title}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-600">{preview.body}</p>
            {preview.metaLine ? (
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">{preview.metaLine}</p>
            ) : null}
          </div>
        </div>
        {onViewEvaluation ? (
          <button
            type="button"
            onClick={onViewEvaluation}
            className="inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-lg bg-[#e8eef8] px-3 py-1.5 text-[12px] font-semibold text-[#3b6ea8] transition hover:bg-[#dce6f5] hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/30 sm:self-center"
          >
            Ver evaluación
          </button>
        ) : null}
      </div>
    </section>
  );
}
