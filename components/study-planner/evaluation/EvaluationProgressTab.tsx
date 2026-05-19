"use client";

import type { EvaluationDiagnostic } from "@/lib/study-planner/evaluation-page-logic";

type EvaluationProgressTabProps = {
  diagnostic: EvaluationDiagnostic;
};

export function EvaluationProgressTab({ diagnostic }: EvaluationProgressTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[14px] font-semibold text-[#0f1a33]">Diagnóstico</h4>
        <p className="mt-0.5 text-[13px] text-slate-600">
          Vista rápida de qué asignaturas y patrones necesitan atención antes del examen.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
        <h5 className="text-[13px] font-semibold text-[#0f1a33]">Asignaturas que más atención necesitan</h5>
        {diagnostic.attentionSubjects.length === 0 ? (
          <p className="mt-2 text-[13px] text-slate-600">
            Sin señales de riesgo claras. Sigue registrando simulacros de examen y errores para afinar el
            diagnóstico.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {diagnostic.attentionSubjects.map((row) => (
              <li
                key={row.subjectId}
                className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
              >
                <p className="font-semibold text-[#0f1a33]">{row.name}</p>
                <p className="mt-0.5 text-[12px] text-slate-600">{row.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
        <h5 className="text-[13px] font-semibold text-[#0f1a33]">Tendencia de simulacros de examen</h5>
        <p className="mt-2 text-[13px] text-slate-700">{diagnostic.mockTrendLabel}</p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
        <h5 className="text-[13px] font-semibold text-[#0f1a33]">Errores repetidos</h5>
        {diagnostic.repeatedErrorTopics.length === 0 ? (
          <p className="mt-2 text-[13px] text-slate-600">No hay temas con errores repetidos pendientes.</p>
        ) : (
          <ul className="mt-2 list-inside list-disc text-[13px] text-slate-700">
            {diagnostic.repeatedErrorTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
        <h5 className="text-[13px] font-semibold text-[#0f1a33]">Próximas acciones</h5>
        <ul className="mt-2 space-y-1.5">
          {diagnostic.nextActions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-[13px] text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" aria-hidden />
              {action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
