"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import {
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
} from "@/lib/study-planner/date-utils";
import { canSchedulePlannedSessionOnDate } from "@/lib/study-planner/planned-session-scheduling";
import { canMovePlannedSessionToDate } from "@/lib/study-planner/planned-session-move";
import { getSessionTypeAccentClass } from "@/lib/study-planner/session-type-visual";
import { CalendarPeriodNav } from "./CalendarPeriodNav";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { ClassBookingCta } from "./ClassBookingCta";
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
      ? "grid gap-2.5 lg:grid-cols-7 lg:gap-3"
      : "space-y-2.5";

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[16px] font-medium tracking-tight text-[#0f1a33] sm:text-[17px]">
            {formatWeekRange(visibleWeekStartDate)}
          </p>
        </div>
        <CalendarPeriodNav
          onPrev={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, -1))}
          onNext={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, 1))}
          onJumpToCurrent={() => onVisibleWeekStartChange(currentWeekStart)}
          currentLabel="Esta semana"
          currentDisabled={isCurrentWeek}
          prevAriaLabel="Semana anterior"
          nextAriaLabel="Semana siguiente"
        />
      </div>

      {feedback ? (
        <p className="rounded-lg bg-slate-50/90 px-3 py-1.5 text-[13px] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
        <p className="rounded-xl bg-slate-50/50 px-4 py-6 text-center text-[13px] text-slate-500">
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

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canAdd || isDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-planned-session-card]")) return;
    if (target.closest("button")) return;
    onAdd(date);
  };

  return (
    <div
      onClick={layout === "column" ? handleColumnClick : undefined}
      onKeyDown={
        layout === "column" && canAdd
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAdd(date);
              }
            }
          : undefined
      }
      role={layout === "column" && canAdd ? "button" : undefined}
      tabIndex={layout === "column" && canAdd ? 0 : undefined}
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
      className={`flex min-w-0 flex-col overflow-x-hidden rounded-xl px-2 py-2 transition-[background-color,box-shadow] duration-300 ease-out ${
        isToday
          ? "bg-[#fffdf8]/90 shadow-[0_2px_12px_-8px_rgba(201,164,84,0.2)] ring-1 ring-[#c9a454]/15"
          : "bg-slate-50/30 shadow-[0_1px_0_rgba(15,26,51,0.03)]"
      } ${layout === "column" ? "min-h-[4.5rem] cursor-pointer" : ""} ${
        isHovered && canDropHere ? "bg-[#fff8e8]/90 shadow-[0_4px_16px_-10px_rgba(201,164,84,0.25)] ring-1 ring-[#c9a454]/20" : ""
      } ${isInvalidHover ? "bg-slate-100/40" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-1 pb-1.5">
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          className="min-w-0 truncate text-left text-[12px] font-medium text-[#0f1a33] transition-colors duration-200 hover:text-[#3b6ea8] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/25"
        >
          {getDayShortLabel(date)}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {isToday ? (
            <span className="rounded-full bg-[#fff3d6]/90 px-1.5 py-0.5 text-[12px] font-medium text-[#7a5a16]">
              Hoy
            </span>
          ) : (
            <span className="text-[12px] tabular-nums text-slate-400">{formatShortDate(date)}</span>
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
            className="rounded-lg bg-white/60 py-2 text-[13px] font-medium text-slate-400 transition-[background-color,color] duration-200 hover:bg-white hover:text-[#7a5a16] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/20"
          >
            + Añadir sesión
          </button>
        ) : (
          <p className="rounded-lg bg-slate-50/40 py-2 text-center text-[13px] font-medium text-slate-400">
            Día pasado
          </p>
        )
      ) : (
        <>
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
          {canAdd ? (
            <button
              type="button"
              onClick={() => onAdd(date)}
              className="mt-1.5 w-full rounded-lg border border-dashed border-slate-200/80 py-1.5 text-[12px] font-medium text-slate-400 hover:border-[#c9a454]/35 hover:text-[#7a5a16]"
            >
              + Añadir bloque
            </button>
          ) : null}
        </>
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
        data-planned-session-card=""
        title={subjectName}
        className={`box-border w-full min-w-0 max-w-full overflow-hidden rounded-lg bg-white/95 px-3 py-2 text-left shadow-[0_1px_0_rgba(15,26,51,0.04)] ${getSessionTypeAccentClass(session.type)} transition-[box-shadow,background-color,opacity] duration-300 ease-out hover:bg-white hover:shadow-[0_6px_20px_-14px_rgba(15,26,51,0.14)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ea8]/25 focus-visible:ring-offset-1 ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${
          isDragging ? "z-[1] bg-white opacity-95 shadow-[0_8px_24px_-12px_rgba(15,26,51,0.18)] ring-1 ring-[#c9a454]/15" : ""
        }`}
      >
        <div className="flex min-w-0 items-start gap-2">
          <span className="min-w-0 flex-1 break-words text-left text-[12px] font-medium leading-[1.35] text-[#0f1a33] line-clamp-2">
            {subjectName}
          </span>
          {session.status === "completed" ? (
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
          ) : null}
        </div>
        <p className="mt-1 min-w-0 text-[12px] font-medium tabular-nums leading-tight text-slate-600">
          {timePart} · {minutesToHoursLabel(session.plannedDurationMinutes)}
        </p>
        <div className="mt-1.5 w-full min-w-0 space-y-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
            <SessionTypeBadge
              type={session.type}
              className="max-w-full !normal-case text-[7.5px] tracking-tight ring-0"
            />
            <SessionStatusBadge
              session={session}
              today={today}
              className="max-w-full !normal-case px-1 py-0.5 text-[7px] tracking-tight opacity-90 ring-0"
            />
          </div>
          <span className="block text-[12px] font-normal text-slate-400/90">
            {session.source === "manual" ? "Manual" : "Auto"}
          </span>
        </div>
        {session.type === "class" ? <ClassBookingCta variant="card" /> : null}
      </button>
    </li>
  );
});
