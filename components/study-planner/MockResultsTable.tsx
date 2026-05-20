"use client";

import type { MockResult } from "@/lib/study-planner/types";
import { formatMockScore, minutesToHoursLabel, sortMocksByDateDesc } from "@/lib/study-planner/calculations";
import { formatHistoryMockTrendLabel } from "@/lib/study-planner/evaluation-page-logic";
import { mockPassesDisplay } from "@/lib/study-planner/evaluation-presentation";
import { getSubjectById } from "@/lib/study-planner/subjects";

type MockResultsTableProps = {
  mockResults: MockResult[];
  onDelete: (mockId: string) => void;
};

function trendChipClass(label: string): string {
  if (label === "Subiendo") return "text-emerald-700 bg-emerald-50/90";
  if (label === "Bajando") return "text-amber-800 bg-amber-50/90";
  return "text-slate-600 bg-slate-100/90";
}

export function MockResultsTable({ mockResults, onDelete }: MockResultsTableProps) {
  const sorted = sortMocksByDateDesc(mockResults);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl bg-[#fffdf8]/60 px-4 py-4 text-center ring-1 ring-[#c9a454]/10">
        <p className="text-[13px] font-medium text-slate-700">
          Aún no hay simulacros en el historial
        </p>
        <p className="mt-0.5 text-[12px] text-slate-500">
          El primero que registres aparecerá aquí con tendencia.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {sorted.map((mock, index) => {
        const trendLabel = formatHistoryMockTrendLabel(sorted, index);
        const subjectName = getSubjectById(mock.subjectId)?.name ?? mock.subjectId;
        const passes = mockPassesDisplay(mock.score);
        const metaParts = [
          mock.date,
          mock.bank,
          mock.durationMinutes ? minutesToHoursLabel(mock.durationMinutes) : null,
        ].filter(Boolean);

        return (
          <li
            key={mock.id}
            className="group flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/30 transition hover:ring-[#c9a454]/20"
          >
            <div
              className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                passes
                  ? "bg-emerald-50/90 text-emerald-800 ring-1 ring-emerald-200/40"
                  : "bg-amber-50/90 text-amber-900 ring-1 ring-amber-200/40"
              }`}
            >
              <span className="text-[13px] font-bold leading-none tabular-nums">
                {formatMockScore(mock.score)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <p className="text-[12px] font-semibold text-[#0f1a33]">{subjectName}</p>
                {trendLabel ? (
                  <span
                    className={`rounded px-1 py-px text-[9px] font-semibold ${trendChipClass(trendLabel)}`}
                  >
                    {trendLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">{metaParts.join(" · ")}</p>
              {mock.notes ? (
                <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{mock.notes}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDelete(mock.id)}
              className="shrink-0 px-1.5 py-1 text-[10px] font-medium text-slate-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Eliminar simulacro de ${subjectName}`}
            >
              Eliminar
            </button>
          </li>
        );
      })}
    </ul>
  );
}
