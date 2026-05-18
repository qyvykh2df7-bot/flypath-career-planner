"use client";

import type { MockResult } from "@/lib/study-planner/types";
import {
  MOCK_TREND_LABELS,
  calculateAverageMockScore,
  formatMockScore,
  getBestMockScore,
  getLatestMockForSubject,
  getMockTrend,
  getMocksBySubject,
} from "@/lib/study-planner/calculations";
import { getSubjectById } from "@/lib/study-planner/subjects";

type MockSubjectSummaryProps = {
  mockResults: MockResult[];
};

function trendBadgeClass(trend: ReturnType<typeof getMockTrend>): string {
  switch (trend) {
    case "up":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/70";
    case "down":
      return "bg-amber-50 text-amber-900 ring-amber-200/70";
    case "stable":
      return "bg-slate-50 text-slate-700 ring-slate-200/70";
    default:
      return "bg-slate-50 text-slate-500 ring-slate-200/60";
  }
}

export function MockSubjectSummary({ mockResults }: MockSubjectSummaryProps) {
  const bySubject = getMocksBySubject(mockResults);

  const rows = Object.keys(bySubject)
    .map((subjectId) => {
      const mocks = bySubject[subjectId];
      const latest = getLatestMockForSubject(mockResults, subjectId);
      return {
        subjectId,
        subjectName: getSubjectById(subjectId)?.name ?? subjectId,
        mocks,
        latestDate: latest?.date ?? "",
        latest,
        avg3: calculateAverageMockScore(mocks, 3),
        best: getBestMockScore(mocks),
        trend: getMockTrend(mocks),
      };
    })
    .sort((a, b) => b.latestDate.localeCompare(a.latestDate) || a.subjectName.localeCompare(b.subjectName));

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
        <p>
          Registra tus primeros mocks para ver evolución por asignatura.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <article
          key={row.subjectId}
          className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[15px] font-semibold text-[#0f1a33]">{row.subjectName}</h4>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${trendBadgeClass(row.trend)}`}
            >
              {MOCK_TREND_LABELS[row.trend]}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
            <div>
              <dt className="text-slate-500">Último mock</dt>
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
              <dt className="text-slate-500">Total mocks</dt>
              <dd className="font-semibold text-[#0f1a33]">{row.mocks.length}</dd>
            </div>
          </dl>
          {row.latest ? (
            <p className="mt-2 text-[12px] text-slate-500">
              Último: {row.latest.date}
              {row.latest.bank ? ` · ${row.latest.bank}` : ""}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
