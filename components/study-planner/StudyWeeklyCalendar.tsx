"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
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
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type StudyWeeklyCalendarProps = {
  plannedSessions: PlannedStudySession[];
  visibleWeekStartDate: string;
  onVisibleWeekStartChange: (weekStart: string) => void;
  onCompletePlannedSession: (plannedId: string) => void;
  onSkipPlannedSession: (plannedId: string) => void;
  onDeletePlannedSession: (plannedId: string) => void;
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

function statusStyles(status: PlannedStudySession["status"]): string {
  switch (status) {
    case "completed":
      return "border-emerald-200/90 bg-emerald-50/80";
    case "skipped":
      return "border-slate-200 bg-slate-50 opacity-80";
    default:
      return "border-[#c9a454]/30 bg-[#fffdf8]";
  }
}

export function StudyWeeklyCalendar({
  plannedSessions,
  visibleWeekStartDate,
  onVisibleWeekStartChange,
  onCompletePlannedSession,
  onSkipPlannedSession,
  onDeletePlannedSession,
}: StudyWeeklyCalendarProps) {
  const today = getTodayDateString();
  const currentWeekStart = getCurrentWeekStart(today);
  const weekKind = getWeekKind(visibleWeekStartDate, today);
  const weekDates = getWeekDates(visibleWeekStartDate);
  const weekPlanned = getPlannedSessionsForWeek(plannedSessions, visibleWeekStartDate);
  const plannedMinutes = calculatePlannedMinutes(weekPlanned);
  const completedMinutes = calculateCompletedPlannedMinutes(weekPlanned);
  const skippedCount = weekPlanned.filter((p) => p.status === "skipped").length;
  const isCurrentWeek = visibleWeekStartDate === currentWeekStart;

  const byDate = (date: string) =>
    weekPlanned.filter((p) => p.date === date).sort(comparePlannedByStartTime);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, -1))}
            className={`${plannerBtnGhost} inline-flex items-center gap-1`}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Anterior
          </button>
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(currentWeekStart)}
            disabled={isCurrentWeek}
            className={`${plannerBtnGhost} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, 1))}
            className={`${plannerBtnGhost} inline-flex items-center gap-1`}
            aria-label="Semana siguiente"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200/90 bg-[#fffdf8] px-3 py-2.5 text-[13px] text-slate-700 ring-1 ring-[#c9a454]/15">
        <span className="font-semibold text-[#0f1a33]">
          {isCurrentWeek ? "Esta semana" : "Semana visible"}:
        </span>{" "}
        Planificado: {minutesToHoursLabel(plannedMinutes)} · Completado:{" "}
        {minutesToHoursLabel(completedMinutes)} · Saltadas: {skippedCount}
      </div>

      <div className="hidden gap-2 lg:grid lg:grid-cols-7">
        {weekDates.map((date) => (
          <DayColumn
            key={date}
            date={date}
            today={today}
            sessions={byDate(date)}
            onComplete={onCompletePlannedSession}
            onSkip={onSkipPlannedSession}
            onDelete={onDeletePlannedSession}
          />
        ))}
      </div>

      <div className="space-y-4 lg:hidden">
        {weekDates.map((date) => (
          <DayColumn
            key={date}
            date={date}
            today={today}
            sessions={byDate(date)}
            onComplete={onCompletePlannedSession}
            onSkip={onSkipPlannedSession}
            onDelete={onDeletePlannedSession}
            layout="list"
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  date,
  today,
  sessions,
  onComplete,
  onSkip,
  onDelete,
  layout = "column",
}: {
  date: string;
  today: string;
  sessions: PlannedStudySession[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  layout?: "column" | "list";
}) {
  const isToday = date === today;

  return (
    <div
      className={`flex flex-col rounded-lg border p-2.5 ${
        isToday ? "border-[#c9a454]/45 bg-[#fffdf8] ring-1 ring-[#c9a454]/20" : "border-slate-200/90 bg-white"
      } ${layout === "list" ? "" : "min-h-[88px]"}`}
    >
      <div className="mb-2 border-b border-slate-100 pb-2">
        <p className="text-[13px] font-semibold text-[#0f1a33]">
          {getDayShortLabel(date)} · {formatShortDate(date)}
        </p>
        {isToday ? (
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#7a5a16]">Hoy</p>
        ) : null}
      </div>

      {sessions.length === 0 ? (
        <p className="py-2 text-[11px] text-slate-400">—</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <PlannedSessionCard
              key={session.id}
              session={session}
              onComplete={onComplete}
              onSkip={onSkip}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlannedSessionCard({
  session,
  onComplete,
  onSkip,
  onDelete,
}: {
  session: PlannedStudySession;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;

  return (
    <li className={`rounded-lg border p-2.5 text-[12px] ${statusStyles(session.status)}`}>
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold text-[#0f1a33]">{subjectName}</span>
        <span className="shrink-0 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
          {PLANNED_STATUS_LABELS[session.status]}
        </span>
      </div>
      <p className="mt-1 text-slate-600">
        {session.startTime ? `${session.startTime} · ` : ""}
        {getSessionTypeLabel(session.type)} · {minutesToHoursLabel(session.plannedDurationMinutes)}
      </p>
      {session.goal ? <p className="mt-1 line-clamp-2 text-slate-500">{session.goal}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {session.status === "planned" ? (
          <>
            <ActionButton label="Completar" variant="primary" onClick={() => onComplete(session.id)} />
            <ActionButton label="Saltar" onClick={() => onSkip(session.id)} />
          </>
        ) : null}
        <ActionButton label="Eliminar" variant="danger" onClick={() => onDelete(session.id)} />
      </div>
    </li>
  );
}

function ActionButton({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "border-[#c9a454] bg-[#c9a454] text-[#0f1a33]"
      : variant === "danger"
        ? "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-700"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 ${styles}`}
    >
      {label}
    </button>
  );
}
