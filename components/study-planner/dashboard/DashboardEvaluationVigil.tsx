"use client";

type DashboardEvaluationVigilProps = {
  line: string | null;
  onGoToEvaluation?: () => void;
};

export function DashboardEvaluationVigil({ line, onGoToEvaluation }: DashboardEvaluationVigilProps) {
  if (!line) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
      <p className="text-[11px] leading-snug text-slate-500">{line}</p>
      {onGoToEvaluation ? (
        <button
          type="button"
          onClick={onGoToEvaluation}
          className="shrink-0 text-[10px] font-medium text-[#3b6ea8] transition hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/20"
        >
          Ver evaluación →
        </button>
      ) : null}
    </div>
  );
}
