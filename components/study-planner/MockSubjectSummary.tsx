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
import { mockPassesDisplay } from "@/lib/study-planner/evaluation-presentation";
import { getSubjectById } from "@/lib/study-planner/subjects";

type MockSubjectSummaryProps = {
  mockResults: MockResult[];
};

function trendTone(label: string | null): string {
  if (!label) return "";
  if (label === "Subiendo") return "text-emerald-700 bg-emerald-50/80 ring-emerald-200/40";
  if (label === "Bajando") return "text-amber-800 bg-amber-50/80 ring-amber-200/40";
  return "text-slate-600 bg-slate-100/80 ring-slate-200/40";
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
      <div className="rounded-xl bg-gradient-to-br from-[#fff9ee]/50 to-white px-4 py-5 text-center ring-1 ring-[#c9a454]/12">
        <p className="text-[13px] font-medium text-[#0f1a33]">
          Empieza con un simulacro para detectar puntos débiles
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          Verás evolución, tendencia y si vas en ritmo de aprobado por asignatura.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const score = row.latest?.score ?? 0;
        const passes = row.latest ? mockPassesDisplay(score) : null;

        return (
          <article
            key={row.subjectId}
            className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-slate-200/30 transition hover:ring-[#3b6ea8]/20"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold text-[#0f1a33]">{row.subjectName}</p>
              {row.trendLabel ? (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[12px] font-semibold ring-1 ${trendTone(row.trendLabel)}`}
                >
                  {row.trendLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-1.5 flex items-end justify-between gap-2">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
                  Último simulacro
                </p>
                <p className="text-[26px] font-semibold leading-none tabular-nums text-[#0f1a33]">
                  {row.latest ? formatMockScore(score) : "—"}
                </p>
              </div>
              {passes !== null ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${
                    passes
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/40"
                      : "bg-amber-50 text-amber-900 ring-1 ring-amber-200/40"
                  }`}
                >
                  {passes ? "En ritmo" : "Reforzar"}
                </span>
              ) : null}
            </div>

            <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  passes
                    ? "bg-gradient-to-r from-emerald-500/80 to-emerald-400/70"
                    : "bg-gradient-to-r from-amber-400/80 to-[#c9a454]/70"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>

            <p className="mt-1.5 text-[12px] tabular-nums text-slate-500">
              Media 3: {row.avg3 !== null ? formatMockScore(row.avg3) : "—"}
              <span className="text-slate-300"> · </span>
              Mejor: {row.best !== null ? formatMockScore(row.best) : "—"}
              <span className="text-slate-300"> · </span>
              {row.mocks.length} sim.
            </p>
          </article>
        );
      })}
    </div>
  );
}
