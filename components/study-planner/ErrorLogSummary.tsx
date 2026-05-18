"use client";

import type { ErrorLogItem, StudyMode, StudySubject } from "@/lib/study-planner/types";
import {
  calculatePendingErrorCount,
  calculateResolvedErrorCount,
  getErrorTypeRanking,
  getMostCommonErrorType,
  getRecentErrorLogCount,
  getSubjectWithMostErrors,
} from "@/lib/study-planner/calculations";
import { getErrorLogTypeLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";

type ErrorLogSummaryProps = {
  errorLogItems: ErrorLogItem[];
  subjects: StudySubject[];
  mode: StudyMode;
};

export function ErrorLogSummary({ errorLogItems, subjects, mode }: ErrorLogSummaryProps) {
  const pending = calculatePendingErrorCount(errorLogItems);
  const resolved = calculateResolvedErrorCount(errorLogItems);
  const activeCount = errorLogItems.filter((e) => e.status !== "resolved").length;
  const recent7 = getRecentErrorLogCount(errorLogItems, 7);
  const mostCommon = getMostCommonErrorType(errorLogItems);
  const topSubjectId = getSubjectWithMostErrors(errorLogItems);
  const ranking = getErrorTypeRanking(errorLogItems);
  const maxTypeCount = ranking[0]?.count ?? 0;

  if (errorLogItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
        <p className="text-[15px] font-medium text-slate-700">
          Registra errores para detectar patrones de estudio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/90 bg-[#fffdf8] px-4 py-3 ring-1 ring-[#c9a454]/15 sm:px-5">
        <p className="text-[14px] text-slate-700">
          <span className="font-semibold text-[#0f1a33]">Resumen ({mode.toUpperCase()}):</span>{" "}
          Activos: {activeCount} · Pendientes: {pending} · Resueltos: {resolved} · Últimos 7 días: {recent7}
        </p>
        <p className="mt-1 text-[13px] text-slate-600">
          {mostCommon ? (
            <>Tipo más repetido: {getErrorLogTypeLabel(mostCommon)}</>
          ) : null}
          {topSubjectId ? (
            <>
              {mostCommon ? " · " : ""}
              Más errores en: {getSubjectById(topSubjectId)?.name ?? topSubjectId}
            </>
          ) : null}
        </p>
      </div>

      {ranking.length > 0 ? (
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
          <h4 className="text-[14px] font-semibold text-[#0f1a33]">Patrones por tipo de error</h4>
          <ul className="mt-3 space-y-2.5">
            {ranking.map((row) => (
              <li key={row.type}>
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="min-w-0 truncate font-medium text-slate-700">{row.label}</span>
                  <span className="shrink-0 tabular-nums font-semibold text-[#0f1a33]">{row.count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0f1a33] to-[#1a2d52]"
                    style={{
                      width: `${maxTypeCount > 0 ? Math.round((row.count / maxTypeCount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
