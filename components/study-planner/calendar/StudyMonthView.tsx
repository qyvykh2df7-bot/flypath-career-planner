"use client";

import type { PlannedStudySession } from "@/lib/study-planner/types";
import { calculatePlannedMinutes, getTodayDateString, minutesToHoursLabel } from "@/lib/study-planner/calculations";
import {
  addMonths,
  formatMonthYear,
  getMonthGridDates,
  getMonthStart,
  getPlannedSessionsForMonth,
} from "@/lib/study-planner/date-utils";
import { MonthSessionDots } from "./MonthSessionDots";
import { CalendarPeriodNav } from "./CalendarPeriodNav";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type LoadTier = "low" | "medium" | "high" | "none";

function getLoadTier(count: number, loadRatio: number): LoadTier {
  if (count === 0) return "none";
  if (loadRatio <= 0.33) return "low";
  if (loadRatio <= 0.66) return "medium";
  return "high";
}

function loadTierStyles(tier: LoadTier): { cell: string; bar: string } {
  switch (tier) {
    case "low":
      return {
        cell: "bg-sky-50/25",
        bar: "bg-sky-400/45",
      };
    case "medium":
      return {
        cell: "bg-[#fff8e8]/35",
        bar: "bg-[#c9a454]/50",
      };
    case "high":
      return {
        cell: "bg-[#fff3d6]/40",
        bar: "bg-[#c9a454]/70",
      };
    default:
      return { cell: "", bar: "" };
  }
}

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

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3b6ea8]/80" /> Teoría
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2d8a6b]/80" /> Banco
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4923a]/80" /> Simulacro de examen
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8b6bb8]/80" /> Repaso
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-400">
          <span className="h-0.5 w-3 rounded-full bg-sky-400/45" /> Baja
          <span className="h-0.5 w-3 rounded-full bg-[#c9a454]/50" /> Media
          <span className="h-0.5 w-3 rounded-full bg-[#c9a454]/70" /> Alta
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500">
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
          const count = daySessions.length;
          const minutes = calculatePlannedMinutes(daySessions);
          const loadRatio = minutes / maxDayMinutes;
          const isToday = date === today;
          const tier = getLoadTier(count, loadRatio);
          const tierStyle = loadTierStyles(tier);

          return (
            <button
              key={date}
              type="button"
              onClick={() => inMonth && onSelectDay(date)}
              disabled={!inMonth}
              data-calendar-day={date}
              className={`group relative flex min-h-[5rem] flex-col rounded-xl px-1.5 py-1.5 text-left transition-[background-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/25 ${
                !inMonth
                  ? "cursor-default bg-transparent opacity-15"
                  : isToday
                    ? "bg-[#fffdf8] shadow-[0_2px_14px_-8px_rgba(201,164,84,0.28)] ring-1 ring-[#c9a454]/20 hover:shadow-[0_4px_18px_-8px_rgba(201,164,84,0.32)]"
                    : count > 0
                      ? `${tierStyle.cell} bg-white/90 hover:bg-white hover:shadow-[0_4px_16px_-12px_rgba(15,26,51,0.1)]`
                      : "bg-slate-50/20 hover:bg-white/80 hover:shadow-[0_2px_12px_-10px_rgba(15,26,51,0.06)]"
              }`}
            >
              {inMonth ? (
                <>
                  <span
                    className={`text-[12px] font-medium tabular-nums transition-colors duration-200 ${
                      isToday ? "text-[#7a5a16]" : "text-[#0f1a33]"
                    }`}
                  >
                    {parseInt(date.split("-")[2]!, 10)}
                  </span>
                  {count > 0 ? (
                    <>
                      <MonthSessionDots sessions={daySessions} />
                      <p className="mt-1 text-[10px] font-medium leading-tight text-slate-600">
                        <span className="tabular-nums">
                          {count} ses. · {minutesToHoursLabel(minutes)}
                        </span>
                      </p>
                      <div className="mt-1.5 h-px overflow-hidden rounded-full bg-slate-100/70">
                        <div
                          className={`h-full rounded-full transition-[width] duration-300 ease-out ${tierStyle.bar}`}
                          style={{ width: `${Math.round(loadRatio * 100)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="mt-auto text-[11px] text-slate-300/80 transition-colors duration-200 group-hover:text-slate-400">
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
