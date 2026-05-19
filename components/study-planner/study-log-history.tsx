"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { StudySession } from "@/lib/study-planner/types";
import { formatShortDate, minutesToHoursLabel } from "@/lib/study-planner/calculations";
import { getSessionQualityLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "./SessionTypeBadge";

const INITIAL_VISIBLE = 10;

type StudyLogHistoryProps = {
  sessions: StudySession[];
  onDelete: (sessionId: string) => void;
};

export function StudyLogHistory({ sessions, onDelete }: StudyLogHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [sessions],
  );

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hasMore = sorted.length > INITIAL_VISIBLE;

  if (sorted.length === 0) {
    return (
      <section className="space-y-3">
        <h3 className="text-[15px] font-semibold text-[#0f1a33]">Historial reciente</h3>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
          <p>Todavía no has registrado ningún estudio.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[#0f1a33]">Historial reciente</h3>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[13px] font-semibold text-[#7a5a16] underline-offset-2 hover:text-[#0f1a33]"
          >
            {showAll ? "Ver menos" : "Ver todo"}
          </button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {visible.map((session) => (
          <li
            key={session.id}
            className="group rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-100/80 transition hover:border-slate-300/90"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#0f1a33]">
                    {getSubjectById(session.subjectId)?.name ?? session.subjectId}
                  </p>
                  <SessionTypeBadge type={session.type} />
                </div>
                <p className="mt-1.5 text-[13px] text-slate-600">
                  <span className="tabular-nums">{formatShortDate(session.date)}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="font-medium text-slate-700">
                    {minutesToHoursLabel(session.durationMinutes)}
                  </span>
                  {session.quality ? (
                    <>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {getSessionQualityLabel(session.quality)}
                    </>
                  ) : null}
                </p>
                {session.notes ? (
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-slate-500">{session.notes}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDelete(session.id)}
                className="shrink-0 rounded-lg p-2 text-slate-400 opacity-60 transition hover:bg-red-50 hover:text-red-600 hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                aria-label="Eliminar registro"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
