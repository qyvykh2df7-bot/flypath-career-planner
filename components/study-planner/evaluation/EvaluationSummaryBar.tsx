"use client";

import type { EvaluationSummary } from "@/lib/study-planner/evaluation-page-logic";
import { formatMockScore } from "@/lib/study-planner/calculations";

type EvaluationSummaryBarProps = {
  summary: EvaluationSummary;
  onNavigate?: (target: "errors_pending" | "reviews_pending" | "subjects_at_risk") => void;
};

function StatCell({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const baseClass =
    "rounded-lg bg-slate-50/90 px-2.5 py-2 ring-1 ring-slate-100/80 text-left";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} transition hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40`}
      >
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#0f1a33]">{value}</p>
      </button>
    );
  }
  return (
    <div className={baseClass}>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#0f1a33]">{value}</p>
    </div>
  );
}

export function EvaluationSummaryBar({ summary, onNavigate }: EvaluationSummaryBarProps) {
  if (!summary.hasEnoughData) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
        No hay suficientes datos todavía. Registra simulacros de examen o errores para empezar a detectar
        patrones.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <StatCell
        label="Media de últimos simulacros de examen"
        value={summary.avgMockScore !== null ? formatMockScore(summary.avgMockScore) : "—"}
      />
      <StatCell label="Simulacros de examen registrados" value={String(summary.mockCount)} />
      <StatCell
        label="Errores pendientes"
        value={String(summary.pendingErrors)}
        onClick={onNavigate ? () => onNavigate("errors_pending") : undefined}
      />
      <StatCell
        label="Repasos pendientes"
        value={String(summary.pendingReviews)}
        onClick={onNavigate ? () => onNavigate("reviews_pending") : undefined}
      />
      <StatCell
        label="Asignaturas en riesgo"
        value={String(summary.atRiskCount)}
        onClick={onNavigate ? () => onNavigate("subjects_at_risk") : undefined}
      />
    </div>
  );
}
