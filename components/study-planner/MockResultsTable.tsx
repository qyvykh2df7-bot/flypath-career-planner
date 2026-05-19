"use client";

import type { MockResult } from "@/lib/study-planner/types";
import { formatMockScore, minutesToHoursLabel, sortMocksByDateDesc } from "@/lib/study-planner/calculations";
import { formatHistoryMockTrendLabel } from "@/lib/study-planner/evaluation-page-logic";
import { getSubjectById } from "@/lib/study-planner/subjects";

type MockResultsTableProps = {
  mockResults: MockResult[];
  onDelete: (mockId: string) => void;
};

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
  if (score >= 60) return "bg-slate-50 text-slate-700 ring-slate-200/80";
  return "bg-amber-50 text-amber-900 ring-amber-200/80";
}

function trendBadgeClass(label: string): string {
  if (label === "Subiendo") return "bg-emerald-50 text-emerald-800 ring-emerald-200/60";
  if (label === "Bajando") return "bg-amber-50 text-amber-900 ring-amber-200/60";
  if (label === "Primer simulacro de examen") return "bg-[#e8eef8] text-[#0f1a33] ring-[#0f1a33]/10";
  return "bg-slate-50 text-slate-600 ring-slate-200/60";
}

export function MockResultsTable({ mockResults, onDelete }: MockResultsTableProps) {
  const sorted = sortMocksByDateDesc(mockResults);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[13px] font-medium text-slate-600">
        <p>Todavía no has registrado ningún simulacro de examen.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {sorted.map((mock, index) => {
        const trendLabel = formatHistoryMockTrendLabel(sorted, index);
        const subjectName = getSubjectById(mock.subjectId)?.name ?? mock.subjectId;
        const metaParts = [mock.date, mock.bank, mock.durationMinutes ? minutesToHoursLabel(mock.durationMinutes) : null].filter(
          Boolean,
        );

        return (
          <li
            key={mock.id}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 ring-1 ring-slate-100/60"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-[13px] font-semibold text-[#0f1a33]">{subjectName}</p>
                {trendLabel ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${trendBadgeClass(trendLabel)}`}
                  >
                    {trendLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{metaParts.join(" · ")}</p>
              {mock.notes ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600">{mock.notes}</p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ring-1 ${scoreBadgeClass(mock.score)}`}
            >
              {formatMockScore(mock.score)}
            </span>
            <button
              type="button"
              onClick={() => onDelete(mock.id)}
              className="shrink-0 p-1 text-[11px] font-medium text-slate-400 transition hover:text-red-600"
              aria-label={`Eliminar simulacro de examen de ${subjectName}`}
            >
              Eliminar
            </button>
          </li>
        );
      })}
    </ul>
  );
}
