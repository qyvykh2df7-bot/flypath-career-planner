"use client";

import type { MockResult } from "@/lib/study-planner/types";
import { formatMockScore, minutesToHoursLabel, sortMocksByDateDesc } from "@/lib/study-planner/calculations";
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

export function MockResultsTable({ mockResults, onDelete }: MockResultsTableProps) {
  const sorted = sortMocksByDateDesc(mockResults);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
        <p>Todavía no has registrado ningún mock.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200/90 md:block">
        <table className="min-w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Fecha</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Asignatura</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Nota</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Banco</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Duración</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Notas</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">
                <span className="sr-only">Eliminar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((mock) => (
              <tr key={mock.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{mock.date}</td>
                <td className="px-3 py-2.5 font-medium text-[#0f1a33]">
                  {getSubjectById(mock.subjectId)?.name ?? mock.subjectId}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums ring-1 ${scoreBadgeClass(mock.score)}`}
                  >
                    {formatMockScore(mock.score)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{mock.bank || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                  {mock.durationMinutes ? minutesToHoursLabel(mock.durationMinutes) : "—"}
                </td>
                <td className="max-w-[12rem] truncate px-3 py-2.5 text-slate-500" title={mock.notes}>
                  {mock.notes || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onDelete(mock.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {sorted.map((mock) => (
          <li
            key={mock.id}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#0f1a33]">
                  {getSubjectById(mock.subjectId)?.name ?? mock.subjectId}
                </p>
                <p className="mt-0.5 text-[13px] text-slate-500">{mock.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums ring-1 ${scoreBadgeClass(mock.score)}`}
                >
                  {formatMockScore(mock.score)}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(mock.id)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <div>
                <dt className="text-slate-500">Banco</dt>
                <dd className="font-medium text-slate-700">{mock.bank || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duración</dt>
                <dd className="font-medium tabular-nums text-slate-700">
                  {mock.durationMinutes ? minutesToHoursLabel(mock.durationMinutes) : "—"}
                </dd>
              </div>
              {mock.notes ? (
                <div className="col-span-2">
                  <dt className="text-slate-500">Notas</dt>
                  <dd className="mt-0.5 text-slate-700">{mock.notes}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
