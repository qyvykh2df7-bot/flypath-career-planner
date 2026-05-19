"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { PlannedStudySession, StudySession } from "@/lib/study-planner/types";
import {
  PLANNED_STATUS_LABELS,
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
import { getSubjectById } from "@/lib/study-planner/subjects";
import { getSessionTypeAccentClass } from "@/lib/study-planner/session-type-visual";
import { SessionTypeBadge } from "./SessionTypeBadge";
import { StudySessionFocusSheet } from "./StudySessionFocusSheet";

type StudyWeeklyCalendarProps = {
  plannedSessions: PlannedStudySession[];
  visibleWeekStartDate: string;
  onVisibleWeekStartChange: (weekStart: string) => void;
  onCompletePlannedSession: (plannedId: string) => void;
  onSkipPlannedSession: (plannedId: string) => void;
  onAddStudySession: (session: StudySession) => void;
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

function accentBorder(status: PlannedStudySession["status"]): string {
  switch (status) {
    case "completed":
      return "border-l-emerald-500";
    case "skipped":
      return "border-l-slate-300";
    default:
      return "border-l-[#c9a454]";
  }
}

function statusBadgeClass(status: PlannedStudySession["status"]): string {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-800";
    case "skipped":
      return "bg-slate-100 text-slate-500";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function StudyWeeklyCalendar({
  plannedSessions,
  visibleWeekStartDate,
  onVisibleWeekStartChange,
  onCompletePlannedSession,
  onSkipPlannedSession,
  onAddStudySession,
}: StudyWeeklyCalendarProps) {
  const today = getTodayDateString();
  const currentWeekStart = getCurrentWeekStart(today);
  const weekKind = getWeekKind(visibleWeekStartDate, today);
  const weekDates = getWeekDates(visibleWeekStartDate);
  const weekPlanned = getPlannedSessionsForWeek(plannedSessions, visibleWeekStartDate);
  const plannedMinutes = calculatePlannedMinutes(weekPlanned);
  const completedMinutes = calculateCompletedPlannedMinutes(weekPlanned);
  const completedCount = weekPlanned.filter((p) => p.status === "completed").length;
  const isCurrentWeek = visibleWeekStartDate === currentWeekStart;

  const [selectedSession, setSelectedSession] = useState<PlannedStudySession | null>(null);

  const byDate = (date: string) =>
    weekPlanned.filter((p) => p.date === date).sort(comparePlannedByStartTime);

  if (weekPlanned.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200/90 bg-white/70 px-4 py-8 text-center">
        <p className="text-[14px] font-medium text-slate-600">Sin sesiones en esta semana</p>
        <p className="mt-1 text-[13px] text-slate-500">Genera o activa un plan para ver tu calendario aquí.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#0f1a33]">
              {formatWeekRange(visibleWeekStartDate)}
            </p>
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
              className={`${plannerBtnGhost} inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px]`}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onVisibleWeekStartChange(currentWeekStart)}
              disabled={isCurrentWeek}
              className={`${plannerBtnGhost} px-2.5 py-1.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, 1))}
              className={`${plannerBtnGhost} inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px]`}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <p className="text-[12px] text-slate-500">
          {minutesToHoursLabel(plannedMinutes)} planificadas · {completedCount} completadas ·{" "}
          {minutesToHoursLabel(completedMinutes)} hechas
        </p>

        <div className="hidden gap-2 xl:grid xl:grid-cols-7">
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              today={today}
              sessions={byDate(date)}
              onSelect={setSelectedSession}
            />
          ))}
        </div>

        <div className="space-y-2.5 xl:hidden">
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              today={today}
              sessions={byDate(date)}
              onSelect={setSelectedSession}
              layout="list"
            />
          ))}
        </div>
      </div>

      <StudySessionFocusSheet
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onComplete={onCompletePlannedSession}
        onSkip={onSkipPlannedSession}
        onLogStudy={onAddStudySession}
      />
    </>
  );
}

function DayColumn({
  date,
  today,
  sessions,
  onSelect,
  layout = "column",
}: {
  date: string;
  today: string;
  sessions: PlannedStudySession[];
  onSelect: (session: PlannedStudySession) => void;
  layout?: "column" | "list";
}) {
  const isToday = date === today;

  return (
    <div
      className={`flex min-w-0 flex-col rounded-lg border px-2 py-2 ${
        isToday
          ? "border-[#c9a454]/40 bg-[#fffdf8] ring-1 ring-[#c9a454]/15"
          : "border-slate-200/80 bg-white"
      } ${layout === "list" ? "" : "min-h-[72px]"}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1 border-b border-slate-100/90 pb-1.5">
        <p className="truncate text-[11px] font-semibold text-[#0f1a33]">{getDayShortLabel(date)}</p>
        {isToday ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#7a5a16]">
            Hoy
          </span>
        ) : (
          <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
            {formatShortDate(date)}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="py-1 text-[10px] text-slate-300">—</p>
      ) : (
        <ul className="space-y-1">
          {sessions.map((session) => (
            <CompactSessionCard key={session.id} session={session} onSelect={() => onSelect(session)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CompactSessionCard({
  session,
  onSelect,
}: {
  session: PlannedStudySession;
  onSelect: () => void;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const timePart = session.startTime ?? "—";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        title={subjectName}
        className={`group w-full rounded-md border border-slate-200/80 border-l-[3px] bg-white px-2 py-1.5 text-left transition hover:border-slate-300 hover:shadow-sm ${getSessionTypeAccentClass(session.type)} ${accentBorder(session.status)}`}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="min-w-0 flex-1 text-[11px] font-semibold leading-[1.25] text-[#0f1a33] [overflow-wrap:anywhere]">
            {subjectName}
          </span>
          <span
            className={`inline-flex shrink-0 rounded px-1 py-px text-[8px] font-semibold uppercase ${statusBadgeClass(session.status)}`}
          >
            {session.status === "completed" ? (
              <Check className="mr-0.5 inline h-2 w-2" aria-hidden />
            ) : null}
            {PLANNED_STATUS_LABELS[session.status]}
          </span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] tabular-nums text-slate-500">
          <span>
            {timePart} · {session.plannedDurationMinutes} min
          </span>
          <SessionTypeBadge type={session.type} />
        </p>
      </button>
    </li>
  );
}
