"use client";

import type { EvaluationSummary } from "@/lib/study-planner/evaluation-page-logic";
import { formatMockScore } from "@/lib/study-planner/calculations";

type EvaluationSummaryBarProps = {
  summary: EvaluationSummary;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50/90 px-2.5 py-2 ring-1 ring-slate-100/80">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#0f1a33]">{value}</p>
    </div>
  );
}

export function EvaluationSummaryBar({ summary }: EvaluationSummaryBarProps) {
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
      <StatCell label="Errores pendientes" value={String(summary.pendingErrors)} />
      <StatCell label="Repasos pendientes" value={String(summary.pendingReviews)} />
      <StatCell label="Asignaturas en riesgo" value={String(summary.atRiskCount)} />
    </div>
  );
}
