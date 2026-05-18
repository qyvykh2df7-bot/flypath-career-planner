"use client";

import type { StudySession } from "@/lib/study-planner/types";
import { minutesToHoursLabel } from "@/lib/study-planner/calculations";
import { getSessionQualityLabel, getSessionTypeLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";

type StudyLogTableProps = {
  sessions: StudySession[];
  onDelete: (sessionId: string) => void;
};

export function StudyLogTable({ sessions, onDelete }: StudyLogTableProps) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
        <p>Todavía no has registrado ninguna sesión.</p>
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
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Tipo</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Duración</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Calidad</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">Notas</th>
              <th className="px-3 py-2.5 font-semibold text-[#0f1a33]">
                <span className="sr-only">Eliminar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((session) => (
              <tr key={session.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{session.date}</td>
                <td className="px-3 py-2.5 font-medium text-[#0f1a33]">
                  {getSubjectById(session.subjectId)?.name ?? session.subjectId}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{getSessionTypeLabel(session.type)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                  {minutesToHoursLabel(session.durationMinutes)}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{getSessionQualityLabel(session.quality)}</td>
                <td className="max-w-[12rem] truncate px-3 py-2.5 text-slate-500" title={session.notes}>
                  {session.notes || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onDelete(session.id)}
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
        {sorted.map((session) => (
          <li
            key={session.id}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#0f1a33]">
                  {getSubjectById(session.subjectId)?.name ?? session.subjectId}
                </p>
                <p className="mt-0.5 text-[13px] text-slate-500">{session.date}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(session.id)}
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <div>
                <dt className="text-slate-500">Tipo</dt>
                <dd className="font-medium text-slate-700">{getSessionTypeLabel(session.type)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duración</dt>
                <dd className="font-medium tabular-nums text-slate-700">
                  {minutesToHoursLabel(session.durationMinutes)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Calidad</dt>
                <dd className="font-medium text-slate-700">{getSessionQualityLabel(session.quality)}</dd>
              </div>
              {session.notes ? (
                <div className="col-span-2">
                  <dt className="text-slate-500">Notas</dt>
                  <dd className="mt-0.5 text-slate-700">{session.notes}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
