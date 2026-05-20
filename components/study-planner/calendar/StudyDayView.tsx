"use client";

import { Check, Plus } from "lucide-react";
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
import { CalendarPeriodNav } from "./CalendarPeriodNav";
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
  canAddSession?: boolean;
};

export function StudyDayView({
  focusDate,
  sessions,
  selectedSessionId,
  onFocusDateChange,
  onSelectSession,
  onAddSession,
  canAddSession = true,
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
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-slate-500">
            {isToday ? "Hoy" : getDayShortLabel(focusDate)}
          </p>
          <h3 className="mt-0.5 text-[20px] font-medium tracking-tight text-[#0f1a33]">
            {formatShortDate(focusDate)}
          </h3>
        </div>
        <CalendarPeriodNav
          onPrev={() => onFocusDateChange(addDays(focusDate, -1))}
          onNext={() => onFocusDateChange(addDays(focusDate, 1))}
          onJumpToCurrent={() => onFocusDateChange(today)}
          currentLabel="Hoy"
          currentDisabled={isToday}
          prevAriaLabel="Día anterior"
          nextAriaLabel="Día siguiente"
        />
      </div>

      <section className="rounded-2xl bg-gradient-to-br from-slate-50/80 to-white px-3.5 py-3 shadow-[0_4px_20px_-16px_rgba(15,26,51,0.1)] ring-1 ring-slate-200/30">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] text-slate-500">Progreso del día</p>
            <p className="mt-0.5 text-[21px] font-medium tabular-nums tracking-tight text-[#0f1a33]">
              {progressPercent}%
            </p>
          </div>
          <p className="text-right text-[12px] tabular-nums text-slate-500">
            {minutesToHoursLabel(completedMinutes)} / {minutesToHoursLabel(plannedMinutes)}
          </p>
        </div>
        <div className="h-0.5 overflow-hidden rounded-full bg-slate-200/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <p className="text-[12px] font-medium text-slate-600">Agenda del día</p>
        {canAddSession ? (
          <button
            type="button"
            onClick={onAddSession}
            className={`${plannerBtnPrimary} inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] transition-[box-shadow] duration-300 ease-out`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nueva sesión
          </button>
        ) : null}
      </div>

      {daySessions.length === 0 ? (
        <div className="rounded-2xl bg-slate-50/40 px-4 py-10 text-center transition-[background-color] duration-200">
          <p className="text-[15px] font-medium text-slate-700">Sin sesiones este día</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            Añade un bloque manual o genera tu semana automáticamente.
          </p>
          {canAddSession ? (
            <button
              type="button"
              onClick={onAddSession}
              className={`${plannerBtnGhost} mt-4 transition-[background-color,box-shadow] duration-300 ease-out`}
            >
              + Nueva sesión
            </button>
          ) : (
            <p className="mt-4 text-[12px] text-slate-400">No puedes planificar en días pasados.</p>
          )}
        </div>
      ) : (
        <ol className="relative space-y-2 pl-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-gradient-to-b before:from-slate-200/80 before:via-slate-200/50 before:to-transparent">
          {daySessions.map((session) => {
            const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
            const time = session.startTime ?? "—";
            const isActive = selectedSessionId === session.id;
            const isDone = session.status === "completed";
            const isSkipped = session.status === "skipped";

            return (
              <li key={session.id} className="relative" data-planned-session-id={session.id}>
                <span
                  className={`absolute -left-4 top-3.5 z-[1] flex h-2 w-2 items-center justify-center rounded-full border-2 border-[#f6f7f9] transition-[background-color,box-shadow] duration-300 ${
                    isDone
                      ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
                      : isActive
                        ? "bg-[#c9a454] shadow-[0_0_0_2px_rgba(201,164,84,0.2)]"
                        : "bg-white shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-1.5 w-1.5 text-white" strokeWidth={3} aria-hidden />
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectSession(session)}
                  className={`w-full rounded-xl bg-white/95 px-3 py-2.5 text-left shadow-[0_1px_0_rgba(15,26,51,0.04)] transition-[box-shadow,background-color] duration-300 ease-out ${getSessionTypeAccentClass(session.type)} ${
                    isActive
                      ? "shadow-[0_6px_22px_-14px_rgba(15,26,51,0.14)] ring-1 ring-[#c9a454]/15"
                      : isDone
                        ? "bg-emerald-50/20 opacity-95 hover:bg-emerald-50/30"
                        : isSkipped
                          ? "bg-slate-50/50 opacity-85"
                          : "hover:bg-white hover:shadow-[0_6px_20px_-14px_rgba(15,26,51,0.12)]"
                  } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/25 focus-visible:ring-offset-1`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-medium tabular-nums text-[#5c4d28]">
                      {time}
                    </span>
                    <SessionStatusBadge
                      session={session}
                      today={today}
                      className="!normal-case text-[8px] tracking-normal ring-0"
                    />
                    <SessionSourceBadge source={session.source} className="!normal-case ring-0" />
                  </div>
                  <p
                    className={`mt-1 text-[14px] font-medium leading-snug ${
                      isDone ? "text-slate-600 line-through decoration-slate-400" : "text-[#0f1a33]"
                    }`}
                  >
                    {subjectName} · {getSessionTypeShortLabel(session.type)}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="tabular-nums">{session.plannedDurationMinutes} min</span>
                    <SessionTypeBadge
                      type={session.type}
                      className="!normal-case text-[8px] tracking-normal ring-0"
                    />
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
