"use client";

import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import {
  calculateCompletedPlannedMinutes,
  calculatePlannedMinutes,
  comparePlannedByStartTime,
  formatShortDate,
  getDayShortLabel,
  getTodayDateString,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import { addDays } from "@/lib/study-planner/date-utils";
import { getSessionTypeShortLabel } from "@/lib/study-planner/labels";
import { plannerBtnGhost, plannerBtnPrimary } from "@/lib/study-planner/planner-ui";
import { getSessionTypeAccentClass } from "@/lib/study-planner/session-type-visual";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { SessionSourceBadge } from "./SessionSourceBadge";
import { SessionStatusBadge } from "./SessionStatusBadge";

type StudyDayViewProps = {
  focusDate: string;
  sessions: PlannedStudySession[];
  selectedSessionId?: string | null;
  onFocusDateChange: (date: string) => void;
  onSelectSession: (session: PlannedStudySession) => void;
  onAddSession: () => void;
};

export function StudyDayView({
  focusDate,
  sessions,
  selectedSessionId,
  onFocusDateChange,
  onSelectSession,
  onAddSession,
}: StudyDayViewProps) {
  const today = getTodayDateString();
  const isToday = focusDate === today;
  const daySessions = [...sessions].sort(comparePlannedByStartTime);
  const plannedMinutes = calculatePlannedMinutes(daySessions);
  const completedMinutes = calculateCompletedPlannedMinutes(daySessions);
  const completedCount = daySessions.filter((s) => s.status === "completed").length;
  const progressPercent =
    daySessions.length > 0 ? Math.round((completedCount / daySessions.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {isToday ? "Hoy" : getDayShortLabel(focusDate)}
          </p>
          <h3 className="mt-0.5 text-[20px] font-semibold tracking-tight text-[#0f1a33]">
            {formatShortDate(focusDate)}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFocusDateChange(addDays(focusDate, -1))}
            className={`${plannerBtnGhost} inline-flex items-center px-2.5 py-1.5 text-[12px]`}
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onFocusDateChange(today)}
            disabled={isToday}
            className={`${plannerBtnGhost} px-2.5 py-1.5 text-[12px] disabled:opacity-50`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onFocusDateChange(addDays(focusDate, 1))}
            className={`${plannerBtnGhost} inline-flex items-center px-2.5 py-1.5 text-[12px]`}
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Progreso del día
            </p>
            <p className="mt-0.5 text-[20px] font-semibold tabular-nums text-[#0f1a33]">{progressPercent}%</p>
          </div>
          <p className="text-right text-[11px] text-slate-500">
            {minutesToHoursLabel(completedMinutes)} / {minutesToHoursLabel(plannedMinutes)}
          </p>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c9a454] to-[#ddb75c] transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
        <button
          type="button"
          onClick={onAddSession}
          className={`${plannerBtnPrimary} inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px]`}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nueva sesión
        </button>
      </div>

      {daySessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-slate-600">Sin sesiones este día</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Añade un bloque manual o genera tu semana automáticamente.
          </p>
          <button type="button" onClick={onAddSession} className={`${plannerBtnGhost} mt-4`}>
            + Nueva sesión
          </button>
        </div>
      ) : (
        <ol className="relative ml-1 border-l-2 border-slate-200/70 pl-5">
          {daySessions.map((session, index) => {
            const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
            const time = session.startTime ?? "—";
            const isActive = selectedSessionId === session.id;
            const isDone = session.status === "completed";
            const isSkipped = session.status === "skipped";
            const isLast = index === daySessions.length - 1;

            return (
              <li
                key={session.id}
                className={`relative ${isLast ? "pb-0" : "pb-3"}`}
                data-planned-session-id={session.id}
              >
                <span
                  className={`absolute -left-[23px] top-2.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white ring-2 ${
                    isDone
                      ? "bg-emerald-500 ring-emerald-200"
                      : isActive
                        ? "bg-[#c9a454] ring-[#c9a454]/40"
                        : "bg-white ring-slate-200"
                  }`}
                >
                  {isDone ? <Check className="h-2 w-2 text-white" strokeWidth={3} aria-hidden /> : null}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectSession(session)}
                  className={`w-full rounded-xl border border-l-[3px] px-3 py-2 text-left transition duration-200 ${getSessionTypeAccentClass(session.type)} ${
                    isActive
                      ? "border-[#c9a454]/50 bg-[#fffdf8] shadow-md ring-1 ring-[#c9a454]/25"
                      : isDone
                        ? "border-slate-200/70 bg-emerald-50/30 opacity-90 hover:shadow-sm"
                        : isSkipped
                          ? "border-slate-200/60 bg-slate-50/80 opacity-75"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-semibold tabular-nums text-[#7a5a16]">{time}</span>
                    <SessionStatusBadge session={session} today={today} />
                    <SessionSourceBadge source={session.source} />
                  </div>
                  <p
                    className={`mt-0.5 text-[14px] font-semibold leading-snug ${
                      isDone ? "text-slate-600 line-through decoration-slate-400" : "text-[#0f1a33]"
                    }`}
                  >
                    {subjectName} · {getSessionTypeShortLabel(session.type)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    {session.plannedDurationMinutes} min
                    <SessionTypeBadge type={session.type} />
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
