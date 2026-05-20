"use client";

import { useMemo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { ExamDate, StudySession } from "@/lib/study-planner/types";
import {
  formatDaysRemaining,
  formatShortDate,
  getDaysUntilDate,
  getTodayDateString,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import { getSessionQualityLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { getExamForSubject } from "@/lib/study-planner/subjects-page-logic";
import { SessionTypeBadge } from "./SessionTypeBadge";

const INITIAL_VISIBLE = 10;

type StudyLogHistoryProps = {
  sessions: StudySession[];
  examDates?: ExamDate[];
  onDelete: (sessionId: string) => void;
};

export function StudyLogHistory({
  sessions,
  examDates = [],
  onDelete,
}: StudyLogHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const today = getTodayDateString();

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [sessions],
  );

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hasMore = sorted.length > INITIAL_VISIBLE;

  if (sorted.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-[14px] font-semibold text-[#0f1a33]">Historial reciente</h3>
        <div className="rounded-xl bg-slate-50/60 px-4 py-6 text-center text-[13px] text-slate-600 ring-1 ring-slate-200/25">
          <p>Todavía no has registrado ningún estudio.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-[#0f1a33]">Historial reciente</h3>
          <p className="text-[11px] text-slate-500">{sorted.length} sesiones registradas</p>
        </div>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[12px] font-semibold text-[#7a5a16] hover:text-[#0f1a33]"
          >
            {showAll ? "Ver menos" : "Ver todo"}
          </button>
        ) : null}
      </div>

      <ul className="space-y-1.5">
        {visible.map((session) => {
          const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
          const exam = getExamForSubject(session.subjectId, examDates, today);

          return (
            <li
              key={session.id}
              className="group rounded-xl bg-gradient-to-r from-white to-[#fffdf8]/40 px-3 py-2.5 ring-1 ring-slate-200/35 transition hover:ring-[#c9a454]/20 hover:shadow-[0_4px_16px_-12px_rgba(15,26,51,0.12)]"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-[13px] font-semibold text-[#0f1a33]">{subjectName}</p>
                    <SessionTypeBadge type={session.type} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-600">
                    <span className="tabular-nums font-medium text-slate-700">
                      {formatShortDate(session.date)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="tabular-nums font-medium text-slate-700">
                      {minutesToHoursLabel(session.durationMinutes)}
                    </span>
                    {session.quality ? (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>{getSessionQualityLabel(session.quality)}</span>
                      </>
                    ) : null}
                    {exam ? (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium text-[#7a5a16]/90">
                          Examen {formatDaysRemaining(getDaysUntilDate(exam.date, today))}
                        </span>
                      </>
                    ) : null}
                  </p>
                  {session.notes ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                      {session.notes}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(session.id)}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-200"
                  aria-label="Eliminar registro"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
