"use client";

import { Plus } from "lucide-react";
import type { NextExamHighlight } from "@/lib/study-planner/subjects-page-logic";

type DashboardUpcomingExamCardProps = {
  nextExam: NextExamHighlight | null;
  onQuickMock?: () => void;
  onQuickBank?: () => void;
  onQuickReview?: () => void;
};

const quickBtnClass =
  "inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-[12px] font-semibold text-[#3b6ea8] ring-1 ring-[#c9a454]/22 transition hover:bg-white hover:text-[#0f1a33] hover:ring-[#c9a454]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25";

export function DashboardUpcomingExamCard({
  nextExam,
  onQuickMock,
  onQuickBank,
  onQuickReview,
}: DashboardUpcomingExamCardProps) {
  if (!nextExam) return null;

  const hasActions = onQuickMock || onQuickBank || onQuickReview;

  return (
    <section
      className="rounded-xl bg-gradient-to-br from-[#fffdf8] to-[#fff8e8]/95 px-3 py-2.5 ring-1 ring-[#c9a454]/20"
      aria-label="Próximo examen"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-[#0f1a33]">
            <span>{nextExam.subjectName}</span>
            <span className="font-medium text-[#7a5a16]"> exam {nextExam.daysLabel}</span>
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-600">
            Refuerza esta asignatura antes del examen.
          </p>
        </div>
        {hasActions ? (
          <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:justify-end">
            {onQuickMock ? (
              <button type="button" onClick={onQuickMock} className={quickBtnClass}>
                <Plus className="h-3.5 w-3.5 shrink-0 text-[#c9a454]" aria-hidden />
                Simulacro
              </button>
            ) : null}
            {onQuickBank ? (
              <button type="button" onClick={onQuickBank} className={quickBtnClass}>
                <Plus className="h-3.5 w-3.5 shrink-0 text-[#c9a454]" aria-hidden />
                Banco
              </button>
            ) : null}
            {onQuickReview ? (
              <button type="button" onClick={onQuickReview} className={quickBtnClass}>
                <Plus className="h-3.5 w-3.5 shrink-0 text-[#c9a454]" aria-hidden />
                Repaso
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
