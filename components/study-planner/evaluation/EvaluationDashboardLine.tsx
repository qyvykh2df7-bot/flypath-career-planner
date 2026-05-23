"use client";

import { ChevronRight } from "lucide-react";

export type DashboardQuickAction = {
  label: string;
  onClick: () => void;
};

type EvaluationDashboardLineProps = {
  line: string | null;
  showEmptyCta: boolean;
  onGoToEvaluation?: () => void;
  quickActions?: DashboardQuickAction[];
  nextExamHint?: { subjectName: string; daysLabel: string } | null;
  /** Menos protagonismo frente al bloque de progreso semanal. */
  variant?: "default" | "subtle";
};

export function EvaluationDashboardLine({
  line,
  showEmptyCta,
  onGoToEvaluation,
  quickActions = [],
  nextExamHint = null,
  variant = "default",
}: EvaluationDashboardLineProps) {
  const hasFooter = Boolean(nextExamHint) || quickActions.length > 0;
  const isSubtle = variant === "subtle";
  const shellClass = isSubtle
    ? "overflow-hidden rounded-lg bg-transparent"
    : "overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_-14px_rgba(15,26,51,0.1)] ring-1 ring-slate-200/40 transition-[box-shadow] duration-300";

  if (line) {
    return (
      <section className={shellClass} role="status">
        {onGoToEvaluation ? (
          <button
            type="button"
            onClick={onGoToEvaluation}
            className={`flex w-full items-center gap-2 text-left transition-[color] duration-200 hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/25 ${isSubtle ? "px-0 py-1" : "gap-2.5 px-3 py-2.5 hover:bg-slate-50/80"}`}
          >
            <span
              className={`shrink-0 rounded-full bg-[#c9a454]/70 ${isSubtle ? "h-1 w-1" : "h-1.5 w-1.5"}`}
              aria-hidden
            />
            <span
              className={`min-w-0 flex-1 font-medium leading-snug ${isSubtle ? "text-[13px] text-slate-500" : "text-[13px] text-slate-700"}`}
            >
              {line}
            </span>
            <ChevronRight
              className={`shrink-0 text-slate-400 ${isSubtle ? "h-3.5 w-3.5" : "h-4 w-4"}`}
              aria-hidden
            />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]/90"
              aria-hidden
            />
            <span className="text-[13px] font-medium leading-snug text-slate-700">{line}</span>
          </div>
        )}
        {hasFooter ? (
          <div
            className={`flex flex-wrap items-center gap-1.5 ${isSubtle ? "mt-1 px-0 py-0" : "border-t border-slate-100/90 bg-slate-50/50 px-2.5 py-2"}`}
          >
            {nextExamHint ? (
              <span className="inline-flex items-center rounded-lg bg-[#fff8e8]/80 px-2 py-1 text-[12px] font-medium text-[#7a5a16]">
                Próximo examen: {nextExamHint.subjectName} · {nextExamHint.daysLabel}
              </span>
            ) : null}
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center rounded-lg border border-slate-200/50 bg-white px-2.5 py-1 text-[13px] font-medium text-slate-600 shadow-[0_2px_8px_-6px_rgba(15,26,51,0.08)] transition-[background-color,border-color,box-shadow] duration-200 hover:border-[#c9a454]/30 hover:bg-[#fffdf8] hover:text-[#7a5a16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/20"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  if (showEmptyCta || quickActions.length > 0 || nextExamHint) {
    return (
      <section className="overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_-14px_rgba(15,26,51,0.1)] ring-1 ring-slate-200/40">
        {showEmptyCta && onGoToEvaluation ? (
          <button
            type="button"
            onClick={onGoToEvaluation}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-[background-color] duration-200 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3b6ea8]/20"
          >
            <span className="text-[13px] font-medium text-slate-700">
              Registra tu primer simulacro de examen para ver tu nivel
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          </button>
        ) : null}
        {(nextExamHint || quickActions.length > 0) && (
          <div
            className={`flex flex-wrap items-center gap-1.5 px-2.5 py-2 ${
              showEmptyCta && onGoToEvaluation ? "border-t border-slate-100/90 bg-slate-50/50" : ""
            }`}
          >
            {nextExamHint ? (
              <span className="inline-flex items-center rounded-lg bg-[#fff8e8]/80 px-2 py-1 text-[12px] font-medium text-[#7a5a16]">
                Próximo examen: {nextExamHint.subjectName} · {nextExamHint.daysLabel}
              </span>
            ) : null}
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center rounded-lg border border-slate-200/50 bg-white px-2.5 py-1 text-[13px] font-medium text-slate-600 shadow-[0_2px_8px_-6px_rgba(15,26,51,0.08)] transition-[background-color,border-color] duration-200 hover:border-[#c9a454]/30 hover:bg-[#fffdf8] hover:text-[#7a5a16]"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return null;
}
