"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MockResult,
  PlannedStudySession,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import { formatShortDate, getTodayDateString } from "@/lib/study-planner/calculations";
import {
  getDayCalendarInsight,
  getWeekCalendarInsight,
} from "@/lib/study-planner/calendar/calendar-insights";
import { buildSessionFocusContext } from "@/lib/study-planner/calendar/session-focus-context";
import {
  getMonthStart,
  getPlannedSessionsForDate,
  getWeekStart,
} from "@/lib/study-planner/date-utils";
import type { CompletePlannedOverrides } from "@/lib/study-planner/planned-log-sync";
import { canSchedulePlannedSessionOnDate } from "@/lib/study-planner/planned-session-scheduling";
import {
  canMovePlannedSessionToDate,
  PAST_MOVE_DATE_ERROR,
} from "@/lib/study-planner/planned-session-move";
import { StudySessionFocusSheet } from "../StudySessionFocusSheet";
import { CalendarInsightStrip } from "./CalendarInsightStrip";
import { CalendarViewSwitcher } from "./CalendarViewSwitcher";
import { PlannedSessionDrawer, type PlannedSessionDrawerMode } from "./PlannedSessionDrawer";
import { StudyDayView } from "./StudyDayView";
import { StudyMonthView } from "./StudyMonthView";
import { StudyWeekView } from "./StudyWeekView";
import {
  CALENDAR_VIEW_STORAGE_KEY,
  DEFAULT_CALENDAR_VIEW,
  type CalendarViewMode,
} from "./types";

type StudyPlannerCalendarProps = {
  plannedSessions: PlannedStudySession[];
  studySessions?: StudySession[];
  mockResults?: MockResult[];
  weeklyGoalMinutes?: number;
  subjects: StudySubject[];
  visibleWeekStartDate: string;
  onVisibleWeekStartChange: (weekStart: string) => void;
  onAddPlannedSession: (session: PlannedStudySession) => void;
  onUpdatePlannedSession: (id: string, patch: Partial<Omit<PlannedStudySession, "id">>) => void;
  onDeletePlannedSession: (id: string) => void;
  onCompletePlannedSession: (plannedId: string, overrides?: CompletePlannedOverrides) => void;
  onSkipPlannedSession: (plannedId: string) => void;
  onAddStudySession: (session: StudySession) => void;
  externalCreateNonce?: number;
  externalCreateDate?: string;
};

type MoveSessionResult = { ok: true; message: string } | { ok: false; message: string };

function loadStoredView(): CalendarViewMode {
  if (typeof window === "undefined") return DEFAULT_CALENDAR_VIEW;
  const raw = window.localStorage.getItem(CALENDAR_VIEW_STORAGE_KEY);
  if (raw === "day" || raw === "week" || raw === "month") return raw;
  return DEFAULT_CALENDAR_VIEW;
}

export function StudyPlannerCalendar({
  plannedSessions,
  studySessions = [],
  mockResults = [],
  weeklyGoalMinutes = 0,
  subjects,
  visibleWeekStartDate,
  onVisibleWeekStartChange,
  onAddPlannedSession,
  onUpdatePlannedSession,
  onDeletePlannedSession,
  onCompletePlannedSession,
  onSkipPlannedSession,
  onAddStudySession,
  externalCreateNonce = 0,
  externalCreateDate,
}: StudyPlannerCalendarProps) {
  const today = getTodayDateString();

  const [viewMode, setViewMode] = useState<CalendarViewMode>(DEFAULT_CALENDAR_VIEW);
  const [focusDate, setFocusDate] = useState(today);
  const [visibleMonthStart, setVisibleMonthStart] = useState(() => getMonthStart(today));

  const [selectedSession, setSelectedSession] = useState<PlannedStudySession | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<PlannedSessionDrawerMode>("create");
  const [drawerDate, setDrawerDate] = useState(today);
  const [editingSession, setEditingSession] = useState<PlannedStudySession | null>(null);

  useEffect(() => {
    setViewMode(loadStoredView());
  }, []);

  const persistView = useCallback((mode: CalendarViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CALENDAR_VIEW_STORAGE_KEY, mode);
    }
  }, []);

  const daySessions = useMemo(
    () => getPlannedSessionsForDate(plannedSessions, focusDate),
    [plannedSessions, focusDate],
  );

  const weekInsight = useMemo(
    () => getWeekCalendarInsight(plannedSessions, visibleWeekStartDate, weeklyGoalMinutes, today),
    [plannedSessions, visibleWeekStartDate, weeklyGoalMinutes, today],
  );

  const dayInsight = useMemo(
    () => getDayCalendarInsight(daySessions, today),
    [daySessions, today],
  );

  const activeInsight = viewMode === "day" ? dayInsight : viewMode === "week" ? weekInsight : null;

  const focusContext = useMemo(() => {
    if (!selectedSession) return null;
    return buildSessionFocusContext({
      session: selectedSession,
      plannedSessions,
      studySessions,
      mockResults,
      today,
    });
  }, [selectedSession, plannedSessions, studySessions, mockResults, today]);

  const openCreateDrawer = useCallback(
    (date: string) => {
      if (!canSchedulePlannedSessionOnDate(date, today)) return;
      setDrawerMode("create");
      setDrawerDate(date);
      setEditingSession(null);
      setDrawerOpen(true);
    },
    [today],
  );

  useEffect(() => {
    if (externalCreateNonce > 0) {
      openCreateDrawer(externalCreateDate ?? today);
    }
  }, [externalCreateNonce, externalCreateDate, today, openCreateDrawer]);

  const openEditDrawer = useCallback((session: PlannedStudySession) => {
    setDrawerMode("edit");
    setDrawerDate(session.date);
    setEditingSession(session);
    setDrawerOpen(true);
    setSelectedSession(null);
  }, []);

  const handleOpenDayFromMonth = useCallback(
    (date: string) => {
      setFocusDate(date);
      setVisibleMonthStart(getMonthStart(date));
      onVisibleWeekStartChange(getWeekStart(date));
      persistView("day");
    },
    [onVisibleWeekStartChange, persistView],
  );

  const handleOpenDayFromWeek = useCallback(
    (date: string) => {
      setFocusDate(date);
      persistView("day");
    },
    [persistView],
  );

  const handleFocusDateChange = useCallback(
    (date: string) => {
      setFocusDate(date);
      onVisibleWeekStartChange(getWeekStart(date));
      setVisibleMonthStart(getMonthStart(date));
    },
    [onVisibleWeekStartChange],
  );

  const handleDrawerSave = useCallback(
    (session: PlannedStudySession) => {
      if (drawerMode === "edit" && editingSession) {
        onUpdatePlannedSession(editingSession.id, {
          date: session.date,
          startTime: session.startTime,
          subjectId: session.subjectId,
          type: session.type,
          plannedDurationMinutes: session.plannedDurationMinutes,
          goal: session.goal,
        });
      } else {
        onAddPlannedSession(session);
      }
      setFocusDate(session.date);
      onVisibleWeekStartChange(getWeekStart(session.date));
      setVisibleMonthStart(getMonthStart(session.date));
    },
    [drawerMode, editingSession, onAddPlannedSession, onUpdatePlannedSession, onVisibleWeekStartChange, today],
  );

  const handleDeleteFromFocus = useCallback(
    (id: string) => {
      onDeletePlannedSession(id);
      setSelectedSession(null);
    },
    [onDeletePlannedSession],
  );

  const handleMoveSessionInWeek = useCallback(
    (sessionId: string, targetDate: string): MoveSessionResult => {
      const session = plannedSessions.find((item) => item.id === sessionId);
      if (!session) {
        return { ok: false, message: "No se pudo mover la sesión." };
      }
      if (!canMovePlannedSessionToDate(session, targetDate, today)) {
        return { ok: false, message: PAST_MOVE_DATE_ERROR };
      }
      if (session.date === targetDate) {
        return { ok: true, message: `Sesión movida al ${formatShortDate(targetDate)}` };
      }
      onUpdatePlannedSession(sessionId, { date: targetDate });
      return { ok: true, message: `Sesión movida al ${formatShortDate(targetDate)}` };
    },
    [onUpdatePlannedSession, plannedSessions, today],
  );

  const viewTitle =
    viewMode === "week"
      ? "Vista semanal"
      : viewMode === "day"
        ? "Vista diaria"
        : "Vista mensual";

  const viewSubtitle =
    viewMode === "week"
      ? "Bloques de la semana · arrastra sesiones para reorganizar"
      : viewMode === "day"
        ? "Agenda diaria y progreso de estudio"
        : "Pulsa un día para añadir sesión · número del día para ver agenda";

  return (
    <section className="rounded-2xl bg-white p-3 shadow-[0_6px_28px_-20px_rgba(15,26,51,0.12)] ring-1 ring-slate-200/35 transition-[box-shadow] duration-300 sm:p-3.5">
      <header className="mb-3 flex flex-col gap-2.5 border-b border-slate-100/70 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[16px] font-medium tracking-tight text-[#0f1a33] sm:text-[17px]">
            {viewTitle}
          </h3>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{viewSubtitle}</p>
        </div>
        <CalendarViewSwitcher value={viewMode} onChange={persistView} />
      </header>

      <div className="mb-3 transition-opacity duration-200">
        <CalendarInsightStrip insight={activeInsight} />
      </div>

      {viewMode === "day" ? (
        <StudyDayView
          focusDate={focusDate}
          sessions={daySessions}
          selectedSessionId={selectedSession?.id}
          onFocusDateChange={handleFocusDateChange}
          onSelectSession={setSelectedSession}
          onAddSession={() => openCreateDrawer(focusDate)}
          canAddSession={canSchedulePlannedSessionOnDate(focusDate, today)}
        />
      ) : null}

      {viewMode === "week" ? (
        <StudyWeekView
          plannedSessions={plannedSessions}
          visibleWeekStartDate={visibleWeekStartDate}
          onVisibleWeekStartChange={(ws) => {
            onVisibleWeekStartChange(ws);
            setFocusDate(ws);
            setVisibleMonthStart(getMonthStart(ws));
          }}
          onSelectSession={setSelectedSession}
          onOpenDay={handleOpenDayFromWeek}
          onAddSessionOnDate={openCreateDrawer}
          onMoveSessionOnDate={handleMoveSessionInWeek}
        />
      ) : null}

      {viewMode === "month" ? (
        <StudyMonthView
          plannedSessions={plannedSessions}
          visibleMonthStart={visibleMonthStart}
          today={today}
          onVisibleMonthStartChange={setVisibleMonthStart}
          onCreateSessionOnDate={openCreateDrawer}
          onOpenDay={handleOpenDayFromMonth}
        />
      ) : null}

      <StudySessionFocusSheet
        session={selectedSession}
        focusContext={focusContext}
        onClose={() => setSelectedSession(null)}
        onComplete={onCompletePlannedSession}
        onSkip={onSkipPlannedSession}
        onLogStudy={onAddStudySession}
        onEdit={openEditDrawer}
        onDelete={handleDeleteFromFocus}
        onSelectRelated={setSelectedSession}
      />

      <PlannedSessionDrawer
        open={drawerOpen}
        mode={drawerMode}
        initialDate={drawerDate}
        today={today}
        subjects={subjects}
        session={editingSession}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
      />
    </section>
  );
}
