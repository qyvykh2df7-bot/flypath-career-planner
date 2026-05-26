"use client";

import type { ExamDate, PlannedStudySession } from "@/lib/study-planner/types";
import { groupExamDatesByDate } from "@/lib/study-planner/calendar/exams-by-date";
import { CalendarExamChip } from "./CalendarExamChip";
import { calculatePlannedMinutes, minutesToHoursLabel } from "@/lib/study-planner/calculations";
import { canSchedulePlannedSessionOnDate } from "@/lib/study-planner/planned-session-scheduling";
import { getDayCompletionSummary } from "@/lib/study-planner/month-day-completion";
import {
  addMonths,
  formatMonthYear,
  getMonthGridDates,
  getMonthStart,
  getPlannedSessionsForMonth,
} from "@/lib/study-planner/date-utils";
import { MonthSessionDots } from "./MonthSessionDots";
import { MonthPrivateClassReminder } from "./MonthPrivateClassReminder";
import { CalendarPeriodNav } from "./CalendarPeriodNav";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dayProgressBarFillClass(state: ReturnType<typeof getDayCompletionSummary>["state"]): string {
  if (state === "completed") return "bg-emerald-500/85";
  if (state === "in_progress") return "bg-[#c9a454]/80";
  return "bg-transparent";
}

type StudyMonthViewProps = {
  plannedSessions: PlannedStudySession[];
  examDates?: ExamDate[];
  visibleMonthStart: string;
  today: string;
  onVisibleMonthStartChange: (monthStart: string) => void;
  /** Día planificable (hoy o futuro): abrir creación de sesión. */
  onCreateSessionOnDate: (date: string) => void;
  /** Ver agenda del día (doble acción secundaria en cabecera del número). */
  onOpenDay?: (date: string) => void;
  onSelectExam?: (exam: ExamDate) => void;
};

export function StudyMonthView({
  plannedSessions,
  examDates = [],
  visibleMonthStart,
  today,
  onVisibleMonthStartChange,
  onCreateSessionOnDate,
  onOpenDay,
  onSelectExam,
}: StudyMonthViewProps) {
  const monthSessions = getPlannedSessionsForMonth(plannedSessions, visibleMonthStart);
  const grid = getMonthGridDates(visibleMonthStart);
  const sessionsByDate = new Map<string, PlannedStudySession[]>();
  const examsByDate = groupExamDatesByDate(examDates);
  for (const s of monthSessions) {
    const list = sessionsByDate.get(s.date) ?? [];
    list.push(s);
    sessionsByDate.set(s.date, list);
  }

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[17px] font-medium tracking-tight text-[#0f1a33]">
            {formatMonthYear(visibleMonthStart)}
          </p>
        </div>
        <CalendarPeriodNav
          onPrev={() => onVisibleMonthStartChange(addMonths(visibleMonthStart, -1))}
          onNext={() => onVisibleMonthStartChange(addMonths(visibleMonthStart, 1))}
          onJumpToCurrent={() => onVisibleMonthStartChange(getMonthStart(today))}
          currentLabel="Este mes"
          currentDisabled={visibleMonthStart === getMonthStart(today)}
          prevAriaLabel="Mes anterior"
          nextAriaLabel="Mes siguiente"
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#3b6ea8]/80" /> Teoría
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#2d8a6b]/80" /> Banco
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#d4923a]/80" /> Simulacro de examen
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#8b6bb8]/80" /> Repaso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#b45353]/85" /> Examen
        </span>
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 border-l border-slate-200/80 pl-3 text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-5 rounded-full bg-slate-200/95 ring-1 ring-slate-200/80" />
            Sin empezar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative h-1.5 w-5 overflow-hidden rounded-full bg-slate-200/95 ring-1 ring-slate-200/80">
              <span className="absolute inset-y-0 left-0 w-[55%] rounded-full bg-[#c9a454]/80" />
            </span>
            En progreso
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-5 rounded-full bg-emerald-500/85" />
            Completado
          </span>
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[13px] font-medium text-slate-500">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="py-1.5">
            {d}
          </span>
        ))}
      </div>

      <div
        key={visibleMonthStart}
        className="grid grid-cols-7 gap-1 transition-opacity duration-300 ease-out"
      >
        {grid.map(({ date, inMonth }) => {
          const daySessions = sessionsByDate.get(date) ?? [];
          const dayExams = examsByDate.get(date) ?? [];
          const count = daySessions.length;
          const minutes = calculatePlannedMinutes(daySessions);
          const dayProgress = getDayCompletionSummary(daySessions);
          const isToday = date === today;
          const canSchedule = inMonth && canSchedulePlannedSessionOnDate(date, today);
          const isPast = inMonth && date < today;

          const handleDayClick = () => {
            if (!inMonth) return;
            if (canSchedule) {
              onCreateSessionOnDate(date);
            }
          };

          return (
            <div
              key={date}
              data-calendar-day={date}
              role={canSchedule ? "button" : undefined}
              tabIndex={canSchedule ? 0 : undefined}
              onClick={handleDayClick}
              onKeyDown={
                canSchedule
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCreateSessionOnDate(date);
                      }
                    }
                  : undefined
              }
              className={`group relative flex min-h-[5.25rem] flex-col rounded-xl px-1.5 py-1.5 text-left transition-[background-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/25 ${
                !inMonth
                  ? "cursor-default bg-transparent opacity-15"
                  : isPast
                    ? "cursor-default bg-slate-50/15 opacity-70"
                    : canSchedule
                      ? isToday
                        ? "cursor-pointer bg-[#fff8e8]/75 shadow-[0_2px_16px_-8px_rgba(201,164,84,0.35)] ring-1 ring-[#c9a454]/45 hover:bg-[#fff8e8]/90 hover:shadow-[0_4px_20px_-8px_rgba(201,164,84,0.38)]"
                        : count > 0
                          ? "cursor-pointer bg-white/90 hover:bg-white hover:shadow-[0_4px_16px_-12px_rgba(15,26,51,0.1)]"
                          : "cursor-pointer bg-slate-50/20 hover:bg-white/80 hover:shadow-[0_2px_12px_-10px_rgba(15,26,51,0.06)]"
                      : "cursor-default bg-slate-50/15"
              }`}
            >
              {inMonth ? (
                <>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      {onOpenDay ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDay(date);
                          }}
                          className={`text-[12px] font-semibold tabular-nums underline-offset-2 transition-colors hover:underline ${
                            isToday ? "text-[#7a5a16]" : "text-[#0f1a33]"
                          }`}
                          title="Ver agenda del día"
                        >
                          {parseInt(date.split("-")[2]!, 10)}
                        </button>
                      ) : (
                        <span
                          className={`text-[12px] font-semibold tabular-nums transition-colors duration-200 ${
                            isToday ? "text-[#7a5a16]" : "text-[#0f1a33]"
                          }`}
                        >
                          {parseInt(date.split("-")[2]!, 10)}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {isToday ? (
                        <span className="rounded-md bg-[#c9a454]/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#7a5a16] ring-1 ring-[#c9a454]/25">
                          Hoy
                        </span>
                      ) : null}
                      {canSchedule && count === 0 && !isToday ? (
                        <span className="text-[12px] font-medium text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                          +
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {dayExams.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {dayExams.map((exam) => (
                        <CalendarExamChip
                          key={exam.id}
                          exam={exam}
                          compact
                          onSelect={onSelectExam}
                        />
                      ))}
                    </div>
                  ) : null}
                  {count > 0 ? (
                    <>
                      <MonthSessionDots sessions={daySessions} />
                      <p className="mt-1.5 text-[13px] font-semibold leading-tight text-slate-700">
                        <span className="tabular-nums">
                          {count} ses. · {minutesToHoursLabel(minutes)}
                        </span>
                      </p>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/90"
                        role="presentation"
                        aria-hidden
                      >
                        <div
                          className={`h-full rounded-full transition-[width,background-color] duration-300 ease-out ${dayProgressBarFillClass(dayProgress.state)}`}
                          style={{
                            width:
                              dayProgress.state === "not_started" || dayProgress.state === "none"
                                ? "0%"
                                : `${dayProgress.percent}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : dayExams.length > 0 ? (
                    <p className="mt-1 text-[11px] font-medium text-[#7a2e2e]/90">Día de examen</p>
                  ) : canSchedule ? (
                    <span className="mt-auto text-[13px] text-slate-300/80 transition-colors duration-200 group-hover:text-[#7a5a16]">
                      Añadir
                    </span>
                  ) : (
                    <span className="mt-auto text-[13px] text-slate-300/60">—</span>
                  )}
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      <MonthPrivateClassReminder
        plannedSessions={plannedSessions}
        visibleMonthStart={visibleMonthStart}
      />
    </div>
  );
}
