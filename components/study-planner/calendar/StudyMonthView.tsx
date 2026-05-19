"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import {
  calculateCompletedPlannedMinutes,
  calculatePlannedMinutes,
  getTodayDateString,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import {
  addMonths,
  formatMonthYear,
  getMonthGridDates,
  getMonthStart,
  getPlannedSessionsForMonth,
} from "@/lib/study-planner/date-utils";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { MonthSessionDots } from "./MonthSessionDots";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type StudyMonthViewProps = {
  plannedSessions: PlannedStudySession[];
  visibleMonthStart: string;
  onVisibleMonthStartChange: (monthStart: string) => void;
  onSelectDay: (date: string) => void;
};

export function StudyMonthView({
  plannedSessions,
  visibleMonthStart,
  onVisibleMonthStartChange,
  onSelectDay,
}: StudyMonthViewProps) {
  const today = getTodayDateString();
  const monthSessions = getPlannedSessionsForMonth(plannedSessions, visibleMonthStart);
  const grid = getMonthGridDates(visibleMonthStart);
  const totalPlanned = calculatePlannedMinutes(monthSessions);
  const totalCompleted = calculateCompletedPlannedMinutes(monthSessions);

  const sessionsByDate = new Map<string, PlannedStudySession[]>();
  for (const s of monthSessions) {
    const list = sessionsByDate.get(s.date) ?? [];
    list.push(s);
    sessionsByDate.set(s.date, list);
  }

  const maxDayMinutes = Math.max(
    1,
    ...[...sessionsByDate.values()].map((list) => calculatePlannedMinutes(list)),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">
            {formatMonthYear(visibleMonthStart)}
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {minutesToHoursLabel(totalPlanned)} planificadas · {minutesToHoursLabel(totalCompleted)} hechas
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onVisibleMonthStartChange(addMonths(visibleMonthStart, -1))}
            className={`${plannerBtnGhost} inline-flex px-2.5 py-1.5`}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onVisibleMonthStartChange(getMonthStart(today))}
            className={`${plannerBtnGhost} px-2.5 py-1.5 text-[12px]`}
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() => onVisibleMonthStartChange(addMonths(visibleMonthStart, 1))}
            className={`${plannerBtnGhost} inline-flex px-2.5 py-1.5`}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3b6ea8]" /> Teoría
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2d8a6b]" /> Banco
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4923a]" /> Simulacro
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8b6bb8]" /> Repaso
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {grid.map(({ date, inMonth }) => {
          const daySessions = sessionsByDate.get(date) ?? [];
          const count = daySessions.length;
          const minutes = calculatePlannedMinutes(daySessions);
          const completed = daySessions.filter((s) => s.status === "completed").length;
          const loadRatio = minutes / maxDayMinutes;
          const isToday = date === today;
          const progress = count > 0 ? Math.round((completed / count) * 100) : 0;

          return (
            <button
              key={date}
              type="button"
              onClick={() => inMonth && onSelectDay(date)}
              disabled={!inMonth}
              data-calendar-day={date}
              className={`group flex min-h-[5rem] flex-col rounded-xl border px-1.5 py-1.5 text-left transition duration-200 ${
                !inMonth
                  ? "cursor-default border-transparent bg-transparent opacity-25"
                  : isToday
                    ? "border-[#c9a454]/45 bg-[#fffdf8] ring-1 ring-[#c9a454]/20 hover:shadow-md"
                    : count > 0
                      ? loadRatio > 0.5
                        ? "border-slate-200/90 bg-white hover:border-[#c9a454]/30 hover:bg-[#fffdf8]/50 hover:shadow-md"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                      : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-white"
              }`}
            >
              {inMonth ? (
                <>
                  <span
                    className={`text-[12px] font-semibold tabular-nums transition ${
                      isToday ? "text-[#7a5a16]" : "text-[#0f1a33] group-hover:text-[#0f1a33]"
                    }`}
                  >
                    {parseInt(date.split("-")[2]!, 10)}
                  </span>
                  {count > 0 ? (
                    <>
                      <MonthSessionDots sessions={daySessions} />
                      <span className="mt-1 text-[10px] font-medium text-slate-600">
                        {count} ses.
                      </span>
                      <span className="text-[10px] tabular-nums text-slate-500">
                        {minutesToHoursLabel(minutes)}
                      </span>
                      <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#c9a454]/75 transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="mt-auto text-[9px] text-slate-300 group-hover:text-slate-400">
                      —
                    </span>
                  )}
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
