"use client";

import type { MockResult } from "@/lib/study-planner/types";
import {
  calculateAverageMockScore,
  formatMockScore,
  getBestMockScore,
  getLatestMockForSubject,
  getMockTrend,
  getMocksBySubject,
} from "@/lib/study-planner/calculations";
import { formatSubjectMockTrendLabel } from "@/lib/study-planner/evaluation-page-logic";
import { getSubjectById } from "@/lib/study-planner/subjects";

type MockSubjectSummaryProps = {
  mockResults: MockResult[];
};

function trendBadgeClass(label: string | null): string {
  if (!label) return "";
  if (label === "Subiendo") return "bg-emerald-50 text-emerald-800 ring-emerald-200/70";
  if (label === "Bajando") return "bg-amber-50 text-amber-900 ring-amber-200/70";
  if (label === "Primer simulacro") return "bg-[#e8eef8] text-[#0f1a33] ring-[#0f1a33]/12";
  return "bg-slate-50 text-slate-700 ring-slate-200/70";
}

export function MockSubjectSummary({ mockResults }: MockSubjectSummaryProps) {
  const bySubject = getMocksBySubject(mockResults);

  const rows = Object.keys(bySubject)
    .map((subjectId) => {
      const mocks = bySubject[subjectId];
      const latest = getLatestMockForSubject(mockResults, subjectId);
      const trend = getMockTrend(mocks);
      return {
        subjectId,
        subjectName: getSubjectById(subjectId)?.name ?? subjectId,
        mocks,
        latest,
        avg3: calculateAverageMockScore(mocks, 3),
        best: getBestMockScore(mocks),
        trendLabel: formatSubjectMockTrendLabel(mocks.length, trend),
      };
    })
    .sort(
      (a, b) =>
        (b.latest?.date ?? "").localeCompare(a.latest?.date ?? "") ||
        a.subjectName.localeCompare(b.subjectName),
    );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[13px] font-medium text-slate-600">
        <p>Registra tus primeros simulacros para ver evolución por asignatura.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <article
          key={row.subjectId}
          className="rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-semibold text-[#0f1a33]">{row.subjectName}</h4>
            {row.trendLabel ? (
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${trendBadgeClass(row.trendLabel)}`}
              >
                {row.trendLabel}
              </span>
            ) : null}
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[12px]">
            <div>
              <dt className="text-slate-500">Último simulacro</dt>
              <dd className="font-semibold tabular-nums text-[#0f1a33]">
                {row.latest ? formatMockScore(row.latest.score) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Media últimos 3</dt>
              <dd className="font-semibold tabular-nums text-[#0f1a33]">
                {row.avg3 !== null ? formatMockScore(row.avg3) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Mejor nota</dt>
              <dd className="font-semibold tabular-nums text-[#0f1a33]">
                {row.best !== null ? formatMockScore(row.best) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Simulacros</dt>
              <dd className="font-semibold text-[#0f1a33]">{row.mocks.length}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
