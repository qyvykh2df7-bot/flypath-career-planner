"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import type { NextExamHighlight } from "@/lib/study-planner/subjects-page-logic";

type DashboardEvaluationVigilProps = {
  nextExam: NextExamHighlight | null;
  onPrepareExam?: () => void;
};

export function DashboardEvaluationVigil({
  nextExam,
  onPrepareExam,
}: DashboardEvaluationVigilProps) {
  if (!nextExam) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fff8e8]/90 px-2.5 py-2 ring-1 ring-[#c9a454]/18">
      <p className="flex min-w-0 flex-1 items-start gap-1.5 text-[13px] font-medium leading-snug text-[#5c4d28]">
        <AlertTriangle
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9a454]"
          aria-hidden
        />
        <span>
          <span className="text-[#0f1a33]">{nextExam.subjectName}</span>
          <span className="text-[#7a5a16]"> exam {nextExam.daysLabel}</span>
        </span>
      </p>
      {onPrepareExam ? (
        <button
          type="button"
          onClick={onPrepareExam}
          className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#3b6ea8] transition hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25"
        >
          Preparar examen
          <ArrowRight className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
