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
import {
  addWeeks,
  formatWeekRange,
  getCurrentWeekStart,
  getPlannedSessionsForWeek,
  getWeekDates,
  getWeekKind,
  type WeekKind,
} from "@/lib/study-planner/date-utils";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { getSessionTypeAccentClass } from "@/lib/study-planner/session-type-visual";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { SessionSourceBadge } from "./SessionSourceBadge";
import { SessionStatusBadge } from "./SessionStatusBadge";

type StudyWeekViewProps = {
  plannedSessions: PlannedStudySession[];
  visibleWeekStartDate: string;
  onVisibleWeekStartChange: (weekStart: string) => void;
  onSelectSession: (session: PlannedStudySession) => void;
  onOpenDay: (date: string) => void;
  onAddSessionOnDate: (date: string) => void;
};

function weekKindLabel(kind: WeekKind): string {
  switch (kind) {
    case "current":
      return "Semana actual";
    case "past":
      return "Semana pasada";
    case "future":
      return "Semana futura";
  }
}

function weekKindBadgeClass(kind: WeekKind): string {
  switch (kind) {
    case "current":
      return "border-[#c9a454]/40 bg-[#fff8e8] text-[#7a5a16]";
    case "past":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "future":
      return "border-sky-200/90 bg-sky-50/90 text-sky-900";
  }
}

export function StudyWeekView({
  plannedSessions,
  visibleWeekStartDate,
  onVisibleWeekStartChange,
  onSelectSession,
  onOpenDay,
  onAddSessionOnDate,
}: StudyWeekViewProps) {
  const today = getTodayDateString();
  const currentWeekStart = getCurrentWeekStart(today);
  const weekKind = getWeekKind(visibleWeekStartDate, today);
  const weekDates = getWeekDates(visibleWeekStartDate);
  const weekPlanned = getPlannedSessionsForWeek(plannedSessions, visibleWeekStartDate);
  const plannedMinutes = calculatePlannedMinutes(weekPlanned);
  const completedMinutes = calculateCompletedPlannedMinutes(weekPlanned);
  const completedCount = weekPlanned.filter((p) => p.status === "completed").length;
  const isCurrentWeek = visibleWeekStartDate === currentWeekStart;

  const byDate = (date: string) =>
    weekPlanned.filter((p) => p.date === date).sort(comparePlannedByStartTime);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold text-[#0f1a33]">{formatWeekRange(visibleWeekStartDate)}</p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${weekKindBadgeClass(weekKind)}`}
          >
            {weekKindLabel(weekKind)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, -1))}
            className={`${plannerBtnGhost} inline-flex items-center px-2.5 py-1.5 text-[12px]`}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(currentWeekStart)}
            disabled={isCurrentWeek}
            className={`${plannerBtnGhost} px-2.5 py-1.5 text-[12px] disabled:opacity-50`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, 1))}
            className={`${plannerBtnGhost} inline-flex items-center px-2.5 py-1.5 text-[12px]`}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-[12px] text-slate-500">
        {minutesToHoursLabel(plannedMinutes)} planificadas · {completedCount} completadas ·{" "}
        {minutesToHoursLabel(completedMinutes)} hechas
      </p>

      <div className="hidden gap-2 lg:grid lg:grid-cols-7">
        {weekDates.map((date) => (
          <WeekDayColumn
            key={date}
            date={date}
            today={today}
            sessions={byDate(date)}
            onSelect={onSelectSession}
            onOpenDay={onOpenDay}
            onAdd={onAddSessionOnDate}
          />
        ))}
      </div>

      <div className="space-y-2 lg:hidden">
        {weekDates.map((date) => (
          <WeekDayColumn
            key={date}
            date={date}
            today={today}
            sessions={byDate(date)}
            onSelect={onSelectSession}
            onOpenDay={onOpenDay}
            onAdd={onAddSessionOnDate}
            layout="list"
          />
        ))}
      </div>

      {weekPlanned.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 px-4 py-6 text-center text-[13px] text-slate-500">
          Sin sesiones esta semana. Genera un plan automático o añade bloques con + en un día.
        </p>
      ) : null}
    </div>
  );
}

function WeekDayColumn({
  date,
  today,
  sessions,
  onSelect,
  onOpenDay,
  onAdd,
  layout = "column",
}: {
  date: string;
  today: string;
  sessions: PlannedStudySession[];
  onSelect: (session: PlannedStudySession) => void;
  onOpenDay: (date: string) => void;
  onAdd: (date: string) => void;
  layout?: "column" | "list";
}) {
  const isToday = date === today;

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border px-2.5 py-2 ${
        isToday
          ? "border-[#c9a454]/35 bg-[#fffdf8] ring-1 ring-[#c9a454]/12"
          : "border-slate-200/80 bg-white"
      } ${layout === "column" ? "min-h-[4.5rem]" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-1 border-b border-slate-100/90 pb-1.5">
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          className="min-w-0 truncate text-left text-[11px] font-semibold text-[#0f1a33] hover:underline"
        >
          {getDayShortLabel(date)}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {isToday ? (
            <span className="text-[9px] font-bold uppercase text-[#7a5a16]">Hoy</span>
          ) : (
            <span className="text-[10px] tabular-nums text-slate-400">{formatShortDate(date)}</span>
          )}
          <button
            type="button"
            onClick={() => onAdd(date)}
            className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-[#0f1a33]"
            aria-label={`Añadir sesión el ${date}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <button
          type="button"
          onClick={() => onAdd(date)}
          className="py-2 text-[10px] text-slate-400 hover:text-[#7a5a16]"
        >
          + Añadir
        </button>
      ) : (
        <ul className="space-y-1.5">
          {sessions.map((session) => (
            <WeekSessionCard key={session.id} session={session} today={today} onSelect={() => onSelect(session)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WeekSessionCard({
  session,
  today,
  onSelect,
}: {
  session: PlannedStudySession;
  today: string;
  onSelect: () => void;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const timePart = session.startTime ?? "—";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        data-planned-session-id={session.id}
        className={`w-full rounded-lg border border-slate-200/70 border-l-[3px] bg-white px-2 py-2 text-left transition duration-200 hover:border-slate-300 hover:shadow-sm ${getSessionTypeAccentClass(session.type)}`}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#0f1a33]">
            {subjectName}
          </span>
          {session.status === "completed" ? (
            <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
          ) : null}
        </div>
        <p className="mt-1 text-[10px] tabular-nums text-slate-500">{timePart}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <SessionTypeBadge type={session.type} />
          <SessionSourceBadge source={session.source} />
          <SessionStatusBadge session={session} today={today} />
        </div>
      </button>
    </li>
  );
}
