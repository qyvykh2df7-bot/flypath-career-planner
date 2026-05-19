"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MockResult,
  PlannedStudySession,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
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
import { canSchedulePlannedSessionOnDate } from "@/lib/study-planner/planned-session-scheduling";
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
  onCompletePlannedSession: (plannedId: string) => void;
  onSkipPlannedSession: (plannedId: string) => void;
  onAddStudySession: (session: StudySession) => void;
  externalCreateNonce?: number;
  externalCreateDate?: string;
};

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

  const handleSelectDayFromMonth = useCallback(
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

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Calendario de estudio
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-600">
            Vista {viewMode === "week" ? "semanal" : viewMode === "day" ? "del día" : "mensual"} · toca un
            bloque para gestionarlo
          </p>
        </div>
        <CalendarViewSwitcher value={viewMode} onChange={persistView} />
      </div>

      <CalendarInsightStrip insight={activeInsight} />

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
        />
      ) : null}

      {viewMode === "month" ? (
        <StudyMonthView
          plannedSessions={plannedSessions}
          visibleMonthStart={visibleMonthStart}
          onVisibleMonthStartChange={setVisibleMonthStart}
          onSelectDay={handleSelectDayFromMonth}
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
