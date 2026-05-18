"use client";

import type { PlannedStudySession } from "@/lib/study-planner/types";
import {
  PLANNED_STATUS_LABELS,
  calculateCompletedPlannedMinutes,
  calculatePlannedMinutes,
  comparePlannedByStartTime,
  formatShortDate,
  getCurrentWeekDates,
  getDayShortLabel,
  getPlannedSessionsForCurrentWeek,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";

type StudyWeeklyCalendarProps = {
  plannedSessions: PlannedStudySession[];
  onCompletePlannedSession: (plannedId: string) => void;
  onSkipPlannedSession: (plannedId: string) => void;
  onDeletePlannedSession: (plannedId: string) => void;
};

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
  onCompletePlannedSession,
  onSkipPlannedSession,
  onDeletePlannedSession,
}: StudyWeeklyCalendarProps) {
  const weekDates = getCurrentWeekDates();
  const weekPlanned = getPlannedSessionsForCurrentWeek(plannedSessions);
  const plannedMinutes = calculatePlannedMinutes(weekPlanned);
  const completedMinutes = calculateCompletedPlannedMinutes(weekPlanned);
  const skippedCount = weekPlanned.filter((p) => p.status === "skipped").length;

  const byDate = (date: string) =>
    weekPlanned.filter((p) => p.date === date).sort(comparePlannedByStartTime);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200/90 bg-[#fffdf8] px-4 py-3 text-[14px] text-slate-700 ring-1 ring-[#c9a454]/15 sm:px-5">
        <span className="font-semibold text-[#0f1a33]">Esta semana:</span>{" "}
        Planificado: {minutesToHoursLabel(plannedMinutes)} · Completado:{" "}
        {minutesToHoursLabel(completedMinutes)} · Saltadas: {skippedCount}
      </div>

      <div className="hidden gap-2 lg:grid lg:grid-cols-7">
        {weekDates.map((date) => (
          <DayColumn
            key={date}
            date={date}
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
  sessions,
  onComplete,
  onSkip,
  onDelete,
  layout = "column",
}: {
  date: string;
  sessions: PlannedStudySession[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  layout?: "column" | "list";
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isToday = date === todayStr;

  return (
    <div
      className={`flex min-h-[120px] flex-col rounded-xl border p-3 ${
        isToday ? "border-[#c9a454]/45 bg-white ring-1 ring-[#c9a454]/20" : "border-slate-200/90 bg-white"
      } ${layout === "list" ? "min-h-0" : ""}`}
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
        <p className="flex-1 text-[12px] text-slate-400">Sin sesiones</p>
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
