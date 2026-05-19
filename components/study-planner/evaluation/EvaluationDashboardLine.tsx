"use client";

type EvaluationDashboardLineProps = {
  line: string | null;
  showEmptyCta: boolean;
  onGoToEvaluation?: () => void;
};

export function EvaluationDashboardLine({
  line,
  showEmptyCta,
  onGoToEvaluation,
}: EvaluationDashboardLineProps) {
  if (line) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100/60"
        role="status"
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
          aria-hidden
        />
        {onGoToEvaluation ? (
          <button
            type="button"
            onClick={onGoToEvaluation}
            className="min-w-0 flex-1 text-left text-[12px] font-medium leading-snug text-slate-700 transition hover:text-[#7a5a16]"
          >
            {line}
          </button>
        ) : (
          <span className="text-[12px] font-medium leading-snug text-slate-700">{line}</span>
        )}
      </div>
    );
  }

  if (showEmptyCta && onGoToEvaluation) {
    return (
      <button
        type="button"
        onClick={onGoToEvaluation}
        className="text-[12px] font-medium text-slate-500 underline-offset-2 transition hover:text-[#7a5a16] hover:underline"
      >
        Registrar simulacro de examen
      </button>
    );
  }

  return null;
}
