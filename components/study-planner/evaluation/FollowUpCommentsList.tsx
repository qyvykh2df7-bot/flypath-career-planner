"use client";

import { Trash2 } from "lucide-react";
import type { TeacherFollowUpComment } from "@/lib/study-planner/types";
import {
  FOLLOW_UP_CATEGORY_LABELS,
  formatFollowUpDate,
  sortFollowUpCommentsDesc,
} from "@/lib/study-planner/teacher-follow-up";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { plannerEmptyState, plannerListCard } from "@/lib/study-planner/planner-ui";

type FollowUpCommentsListProps = {
  comments: TeacherFollowUpComment[];
  onDelete?: (id: string) => void;
  emptyMessage?: string;
  deleteAriaLabel?: string;
};

export function FollowUpCommentsList({
  comments,
  onDelete,
  emptyMessage = "Todavía no hay comentarios de seguimiento.",
  deleteAriaLabel = "Eliminar comentario",
}: FollowUpCommentsListProps) {
  const sorted = sortFollowUpCommentsDesc(comments);

  if (sorted.length === 0) {
    return (
      <p className={plannerEmptyState}>{emptyMessage}</p>
    );
  }

  return (
    <ul className="space-y-2">
      {sorted.map((item) => {
        const subjectName = item.subjectId
          ? (getSubjectById(item.subjectId)?.name ?? item.subjectId)
          : null;

        return (
          <li key={item.id} className={plannerListCard}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[12px] font-semibold tabular-nums text-slate-500">
                    {formatFollowUpDate(item.date)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {FOLLOW_UP_CATEGORY_LABELS[item.category]}
                  </span>
                  {subjectName ? (
                    <span className="text-[12px] font-medium text-[#3b6ea8]">{subjectName}</span>
                  ) : null}
                </div>
                <p className="text-[13px] leading-relaxed text-[#0f1a33]">{item.comment}</p>
                {item.nextTask?.trim() ? (
                  <p className="text-[12px] leading-snug text-slate-600">
                    <span className="font-semibold text-slate-500">Próxima tarea:</span>{" "}
                    {item.nextTask.trim()}
                  </p>
                ) : null}
              </div>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  aria-label={deleteAriaLabel}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
