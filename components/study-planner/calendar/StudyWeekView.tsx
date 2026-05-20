"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { canSchedulePlannedSessionOnDate } from "@/lib/study-planner/planned-session-scheduling";
import { canMovePlannedSessionToDate } from "@/lib/study-planner/planned-session-move";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { getSessionTypeAccentClass } from "@/lib/study-planner/session-type-visual";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { SessionStatusBadge } from "./SessionStatusBadge";

const LG_MEDIA_QUERY = "(min-width: 1024px)";

type StudyWeekViewProps = {
  plannedSessions: PlannedStudySession[];
  visibleWeekStartDate: string;
  onVisibleWeekStartChange: (weekStart: string) => void;
  onSelectSession: (session: PlannedStudySession) => void;
  onOpenDay: (date: string) => void;
  onAddSessionOnDate: (date: string) => void;
  onMoveSessionOnDate: (
    sessionId: string,
    targetDate: string,
  ) => { ok: true; message: string } | { ok: false; message: string };
};

function useIsLgViewport(): boolean | null {
  const [isLg, setIsLg] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(LG_MEDIA_QUERY);
    const apply = () => setIsLg(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return isLg;
}

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

function buildSessionsByDate(
  weekDates: string[],
  weekPlanned: PlannedStudySession[],
): Record<string, PlannedStudySession[]> {
  const byDate: Record<string, PlannedStudySession[]> = {};
  for (const date of weekDates) {
    byDate[date] = [];
  }
  for (const session of weekPlanned) {
    const bucket = byDate[session.date];
    if (bucket) bucket.push(session);
  }
  for (const date of weekDates) {
    byDate[date].sort(comparePlannedByStartTime);
  }
  return byDate;
}

export function StudyWeekView({
  plannedSessions,
  visibleWeekStartDate,
  onVisibleWeekStartChange,
  onSelectSession,
  onOpenDay,
  onAddSessionOnDate,
  onMoveSessionOnDate,
}: StudyWeekViewProps) {
  const today = getTodayDateString();
  const currentWeekStart = getCurrentWeekStart(today);
  const weekKind = getWeekKind(visibleWeekStartDate, today);
  const weekDates = useMemo(
    () => getWeekDates(visibleWeekStartDate),
    [visibleWeekStartDate],
  );
  const weekPlanned = useMemo(
    () => getPlannedSessionsForWeek(plannedSessions, visibleWeekStartDate),
    [plannedSessions, visibleWeekStartDate],
  );
  const sessionsByDate = useMemo(
    () => buildSessionsByDate(weekDates, weekPlanned),
    [weekDates, weekPlanned],
  );
  const plannedMinutes = useMemo(() => calculatePlannedMinutes(weekPlanned), [weekPlanned]);
  const completedMinutes = useMemo(
    () => calculateCompletedPlannedMinutes(weekPlanned),
    [weekPlanned],
  );
  const completedCount = useMemo(
    () => weekPlanned.filter((p) => p.status === "completed").length,
    [weekPlanned],
  );
  const isCurrentWeek = visibleWeekStartDate === currentWeekStart;
  const isLgViewport = useIsLgViewport();
  const weekLayout = isLgViewport === true ? "column" : "list";

  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const draggingSession = useMemo(
    () => weekPlanned.find((session) => session.id === draggingSessionId) ?? null,
    [draggingSessionId, weekPlanned],
  );

  const handleHoverDate = useCallback((next: string | null) => {
    setHoverDate((prev) => (prev === next ? prev : next));
  }, []);

  const handleDragStart = useCallback((sessionId: string) => {
    setDraggingSessionId(sessionId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingSessionId(null);
    setHoverDate(null);
  }, []);

  const handleDropSession = useCallback(
    (sessionId: string, targetDate: string) => {
      const result = onMoveSessionOnDate(sessionId, targetDate);
      setFeedback(result.message);
      setDraggingSessionId(null);
      setHoverDate(null);
    },
    [onMoveSessionOnDate],
  );

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const isDragging = draggingSessionId !== null;
  const weekColumnsClassName =
    weekLayout === "column"
      ? "grid gap-3 lg:grid-cols-7"
      : "space-y-2.5";

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-[#0f1a33]">
            {formatWeekRange(visibleWeekStartDate)}
          </p>
          <span
            className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${weekKindBadgeClass(weekKind)}`}
          >
            {weekKindLabel(weekKind)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, -1))}
            className={`${plannerBtnGhost} inline-flex items-center rounded-lg px-2.5 py-1.5 text-[12px] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-px hover:shadow-sm active:translate-y-0`}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(currentWeekStart)}
            disabled={isCurrentWeek}
            className={`${plannerBtnGhost} rounded-lg px-2.5 py-1.5 text-[12px] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-px hover:shadow-sm disabled:opacity-50`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, 1))}
            className={`${plannerBtnGhost} inline-flex items-center rounded-lg px-2.5 py-1.5 text-[12px] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-px hover:shadow-sm active:translate-y-0`}
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

      {feedback ? (
        <p className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-[12px] text-slate-700">
          {feedback}
        </p>
      ) : null}

      <div key={`week-${visibleWeekStartDate}`} className={weekColumnsClassName}>
        {weekDates.map((date) => (
          <WeekDayColumn
            key={date}
            date={date}
            today={today}
            sessions={sessionsByDate[date] ?? []}
            onSelect={onSelectSession}
            onOpenDay={onOpenDay}
            onAdd={onAddSessionOnDate}
            layout={weekLayout}
            draggingSession={draggingSession}
            isDragging={isDragging}
            hoveredDate={hoverDate}
            onHoverDate={handleHoverDate}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropSession={handleDropSession}
          />
        ))}
      </div>

      {weekPlanned.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-4 py-7 text-center text-[13px] text-slate-500">
          Sin sesiones esta semana. Genera un plan automático o añade bloques con + en un día.
        </p>
      ) : null}
    </div>
  );
}

const WeekDayColumn = memo(function WeekDayColumn({
  date,
  today,
  sessions,
  onSelect,
  onOpenDay,
  onAdd,
  layout = "column",
  draggingSession,
  isDragging = false,
  hoveredDate,
  onHoverDate,
  onDragStart,
  onDragEnd,
  onDropSession,
}: {
  date: string;
  today: string;
  sessions: PlannedStudySession[];
  onSelect: (session: PlannedStudySession) => void;
  onOpenDay: (date: string) => void;
  onAdd: (date: string) => void;
  layout?: "column" | "list";
  draggingSession?: PlannedStudySession | null;
  isDragging?: boolean;
  hoveredDate?: string | null;
  onHoverDate?: (date: string | null) => void;
  onDragStart?: (sessionId: string) => void;
  onDragEnd?: () => void;
  onDropSession?: (sessionId: string, targetDate: string) => void;
}) {
  const isToday = date === today;
  const canAdd = canSchedulePlannedSessionOnDate(date, today);
  const canDropHere =
    layout === "column" && draggingSession
      ? canMovePlannedSessionToDate(draggingSession, date, today)
      : false;
  const isHovered = isDragging && hoveredDate === date;
  const isInvalidHover = isHovered && !canDropHere;

  return (
    <div
      onDragOver={
        layout === "column"
          ? (event) => {
              if (!isDragging) return;
              event.preventDefault();
              if (hoveredDate !== date) onHoverDate?.(date);
            }
          : undefined
      }
      onDragLeave={
        layout === "column"
          ? (event) => {
              const related = event.relatedTarget;
              if (related instanceof Node && event.currentTarget.contains(related)) return;
              if (hoveredDate === date) onHoverDate?.(null);
            }
          : undefined
      }
      onDrop={
        layout === "column"
          ? (event) => {
              event.preventDefault();
              const sessionId = event.dataTransfer.getData("text/session-id");
              if (!sessionId) return;
              onDropSession?.(sessionId, date);
            }
          : undefined
      }
      className={`flex min-w-0 flex-col overflow-x-hidden rounded-xl border px-1.5 py-2.5 transition-[border-color,background-color,box-shadow] duration-200 ${
        isToday
          ? "border-[#c9a454]/45 bg-gradient-to-b from-[#fffdf8] to-white ring-1 ring-[#c9a454]/20 shadow-[0_1px_0_rgba(201,164,84,0.08)]"
          : "border-slate-200/80 bg-white"
      } ${layout === "column" ? "min-h-[4.5rem]" : ""} ${
        isHovered && canDropHere
          ? "border-[#c9a454]/60 bg-[#fff8e8] ring-1 ring-[#c9a454]/20"
          : ""
      } ${isInvalidHover ? "border-slate-200/80 bg-slate-50/50" : ""}`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-1 border-b border-slate-100/90 pb-1.5">
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          className="min-w-0 truncate text-left text-[11px] font-semibold text-[#0f1a33] hover:underline"
        >
          {getDayShortLabel(date)}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {isToday ? (
            <span className="rounded-full bg-[#fff3d6] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#7a5a16] ring-1 ring-[#c9a454]/30">
              Hoy
            </span>
          ) : (
            <span className="text-[10px] tabular-nums text-slate-400">{formatShortDate(date)}</span>
          )}
          {canAdd ? (
            <button
              type="button"
              onClick={() => onAdd(date)}
              className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0f1a33]"
              aria-label={`Añadir sesión el ${date}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {sessions.length === 0 ? (
        canAdd ? (
          <button
            type="button"
            onClick={() => onAdd(date)}
            className="rounded-lg border border-dashed border-slate-200/80 py-2 text-[10px] font-medium text-slate-400 transition-colors hover:border-[#c9a454]/35 hover:text-[#7a5a16]"
          >
            + Añadir sesión
          </button>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200/70 py-2 text-center text-[10px] font-medium text-slate-300">
            Día pasado
          </p>
        )
      ) : (
        <ul className="min-w-0 space-y-2.5 overflow-x-hidden">
          {sessions.map((session) => (
            <WeekSessionCard
              key={session.id}
              session={session}
              today={today}
              draggable={layout === "column"}
              isDragging={draggingSession?.id === session.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
});

const WeekSessionCard = memo(function WeekSessionCard({
  session,
  today,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onSelect,
}: {
  session: PlannedStudySession;
  today: string;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (sessionId: string) => void;
  onDragEnd?: () => void;
  onSelect: (session: PlannedStudySession) => void;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const timePart = session.startTime ?? "—";
  const canDrag = draggable && session.status === "pending";

  return (
    <li className="min-w-0 w-full">
      <button
        type="button"
        onClick={() => onSelect(session)}
        draggable={canDrag}
        onDragStart={(event) => {
          if (!canDrag) return;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/session-id", session.id);
          onDragStart?.(session.id);
        }}
        onDragEnd={() => onDragEnd?.()}
        data-planned-session-id={session.id}
        className={`box-border w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200/70 border-l-[3px] bg-white px-2 py-2.5 text-left transition-[box-shadow,border-color,opacity] duration-200 ease-out hover:border-slate-300 hover:shadow-[0_6px_18px_-12px_rgba(15,26,51,0.35)] hover:ring-1 hover:ring-[#c9a454]/12 active:shadow-[0_2px_8px_-6px_rgba(15,26,51,0.25)] ${getSessionTypeAccentClass(session.type)} ${
          canDrag ? "cursor-grab active:cursor-grabbing" : ""
        } ${isDragging ? "z-[1] opacity-95 shadow-md ring-2 ring-[#c9a454]/25" : ""}`}
      >
        <div className="flex min-w-0 items-start justify-between gap-1.5">
          <span className="min-w-0 flex-1 hyphens-auto break-words text-left text-[12px] font-semibold leading-snug text-[#0f1a33] [overflow-wrap:anywhere] line-clamp-2">
            {subjectName}
          </span>
          {session.status === "completed" ? (
            <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
          ) : null}
        </div>
        <p className="mt-1.5 min-w-0 truncate text-[11px] tabular-nums text-slate-500">
          {timePart} · {minutesToHoursLabel(session.plannedDurationMinutes)}
        </p>
        <div className="mt-2 w-full min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
            <SessionTypeBadge type={session.type} className="max-w-full text-[8px]" />
            <SessionStatusBadge
              session={session}
              today={today}
              className="max-w-full px-1 py-px text-[7px] opacity-90"
            />
          </div>
          <span className="block text-[9px] font-medium uppercase tracking-wide text-slate-400">
            {session.source === "manual" ? "Manual" : "Auto"}
          </span>
        </div>
      </button>
    </li>
  );
});
