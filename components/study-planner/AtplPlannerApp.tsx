"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  Calendar,
  ClipboardList,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Compass,
} from "lucide-react";
import {
  DEFAULT_ATPL_PLANNER_STATE,
  type AtplPlannerState,
  type ExamDate,
  type MockResult,
  type PlannedStudySession,
  type ErrorLogItem,
  type ErrorLogStatus,
  type ReviewItem,
  type StudyMode,
  type StudySession,
} from "@/lib/study-planner/types";
import { addDaysToDate, createPlannerId, getTodayDateString } from "@/lib/study-planner/calculations";
import { loadStudyPlannerState, saveStudyPlannerState } from "@/lib/study-planner/storage";
import {
  filterErrorLogItemsByMode,
  filterExamDatesByMode,
  filterMockResultsByMode,
  filterPlannedSessionsByMode,
  filterReviewItemsByMode,
  filterSessionsByMode,
  getSubjectsByMode,
} from "@/lib/study-planner/subjects";
import { PlannerAppBar } from "./PlannerAppBar";
import { PlannerHero } from "./PlannerHero";
import { StudyModeSelector } from "./StudyModeSelector";
import { StudyDashboard } from "./StudyDashboard";
import { ExamDateSettings } from "./ExamDateSettings";
import { SubjectOverview } from "./SubjectOverview";
import { StudyLogForm } from "./StudyLogForm";
import { StudyLogTable } from "./StudyLogTable";
import { StudyProgressCharts } from "./StudyProgressCharts";
import { PlannedSessionForm } from "./PlannedSessionForm";
import { StudyWeeklyCalendar } from "./StudyWeeklyCalendar";
import { MockResultForm } from "./MockResultForm";
import { MockSubjectSummary } from "./MockSubjectSummary";
import { MockResultsTable } from "./MockResultsTable";
import { SubjectReadinessOverview } from "./SubjectReadinessOverview";
import { ReviewItemForm } from "./ReviewItemForm";
import { ReviewItemsList } from "./ReviewItemsList";
import { ErrorLogForm } from "./ErrorLogForm";
import { ErrorLogSummary } from "./ErrorLogSummary";
import { ErrorLogList } from "./ErrorLogList";
import { RecoveryMode } from "./RecoveryMode";

type PlannerTab =
  | "dashboard"
  | "subjects"
  | "log"
  | "calendar"
  | "mocks"
  | "reviews"
  | "errors"
  | "recovery"
  | "progress";

const TABS: { id: PlannerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subjects", label: "Asignaturas", icon: BookOpen },
  { id: "log", label: "Registro", icon: PenLine },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "mocks", label: "Mocks", icon: ClipboardList },
  { id: "reviews", label: "Repasos", icon: RotateCcw },
  { id: "errors", label: "Errores", icon: AlertTriangle },
  { id: "recovery", label: "Estoy perdido", icon: Compass },
  { id: "progress", label: "Progreso", icon: TrendingUp },
];

const PLACEHOLDER_MSG = "Esta sección se activará en una próxima fase.";

export function AtplPlannerApp() {
  const [state, setState] = useState<AtplPlannerState>(DEFAULT_ATPL_PLANNER_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<PlannerTab>("dashboard");
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(loadStudyPlannerState(DEFAULT_ATPL_PLANNER_STATE));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStudyPlannerState(state);
  }, [state, hydrated]);

  const {
    mode,
    weeklyGoalMinutes,
    sessions,
    plannedSessions,
    mockResults,
    reviewItems,
    errorLogItems,
    examDates,
  } = state;
  const subjects = useMemo(() => getSubjectsByMode(mode), [mode]);
  const modeSessions = useMemo(() => filterSessionsByMode(sessions, mode), [sessions, mode]);
  const modePlannedSessions = useMemo(
    () => filterPlannedSessionsByMode(plannedSessions, mode),
    [plannedSessions, mode],
  );
  const modeMockResults = useMemo(
    () => filterMockResultsByMode(mockResults, mode),
    [mockResults, mode],
  );
  const modeReviewItems = useMemo(
    () => filterReviewItemsByMode(reviewItems, mode),
    [reviewItems, mode],
  );
  const modeErrorLogItems = useMemo(
    () => filterErrorLogItemsByMode(errorLogItems, mode),
    [errorLogItems, mode],
  );
  const modeExamDates = useMemo(
    () => filterExamDatesByMode(examDates, mode),
    [examDates, mode],
  );

  const setMode = useCallback((next: StudyMode) => {
    setState((prev) => ({ ...prev, mode: next }));
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const setWeeklyGoalHours = useCallback((hours: number) => {
    const clamped = Math.min(80, Math.max(1, hours));
    setState((prev) => ({ ...prev, weeklyGoalMinutes: clamped * 60 }));
  }, []);

  const addPlannedSession = useCallback((planned: PlannedStudySession) => {
    setState((prev) => ({
      ...prev,
      plannedSessions: [...prev.plannedSessions, planned],
    }));
  }, []);

  const completePlannedSession = useCallback((plannedId: string) => {
    setState((prev) => {
      const planned = prev.plannedSessions.find((p) => p.id === plannedId);
      if (!planned || planned.status !== "planned") return prev;

      const realSession: StudySession = {
        id: createPlannerId(),
        date: planned.date,
        subjectId: planned.subjectId,
        type: planned.type,
        durationMinutes: planned.plannedDurationMinutes,
        notes: planned.goal,
      };

      return {
        ...prev,
        sessions: [...prev.sessions, realSession],
        plannedSessions: prev.plannedSessions.map((p) =>
          p.id === plannedId
            ? { ...p, status: "completed" as const, completedSessionId: realSession.id }
            : p,
        ),
      };
    });
  }, []);

  const skipPlannedSession = useCallback((plannedId: string) => {
    setState((prev) => ({
      ...prev,
      plannedSessions: prev.plannedSessions.map((p) =>
        p.id === plannedId && p.status === "planned" ? { ...p, status: "skipped" as const } : p,
      ),
    }));
  }, []);

  const deletePlannedSession = useCallback((plannedId: string) => {
    setState((prev) => ({
      ...prev,
      plannedSessions: prev.plannedSessions.filter((p) => p.id !== plannedId),
    }));
  }, []);

  const addMockResult = useCallback((mock: MockResult) => {
    setState((prev) => ({
      ...prev,
      mockResults: [...prev.mockResults, mock],
    }));
  }, []);

  const deleteMockResult = useCallback((mockId: string) => {
    setState((prev) => ({
      ...prev,
      mockResults: prev.mockResults.filter((m) => m.id !== mockId),
    }));
  }, []);

  const addReviewItem = useCallback((item: ReviewItem) => {
    setState((prev) => ({
      ...prev,
      reviewItems: [...prev.reviewItems, item],
    }));
  }, []);

  const completeReviewItem = useCallback((reviewId: string) => {
    const today = getTodayDateString();
    setState((prev) => ({
      ...prev,
      reviewItems: prev.reviewItems.map((r) =>
        r.id === reviewId
          ? { ...r, status: "completed" as const, completedAt: today }
          : r,
      ),
    }));
  }, []);

  const rescheduleReviewItem = useCallback((reviewId: string, days: number) => {
    const today = getTodayDateString();
    const dueDate = addDaysToDate(today, days);
    setState((prev) => ({
      ...prev,
      reviewItems: prev.reviewItems.map((r) => {
        if (r.id !== reviewId) return r;
        const { completedAt: _removed, ...rest } = r;
        return {
          ...rest,
          dueDate,
          intervalDays: days,
          status: "pending" as const,
        };
      }),
    }));
  }, []);

  const deleteReviewItem = useCallback((reviewId: string) => {
    setState((prev) => ({
      ...prev,
      reviewItems: prev.reviewItems.filter((r) => r.id !== reviewId),
    }));
  }, []);

  const addErrorLogItem = useCallback((item: ErrorLogItem) => {
    setState((prev) => ({
      ...prev,
      errorLogItems: [...prev.errorLogItems, item],
    }));
  }, []);

  const setErrorLogStatus = useCallback((errorId: string, status: ErrorLogStatus) => {
    setState((prev) => ({
      ...prev,
      errorLogItems: prev.errorLogItems.map((e) =>
        e.id === errorId ? { ...e, status } : e,
      ),
    }));
  }, []);

  const deleteErrorLogItem = useCallback((errorId: string) => {
    setState((prev) => ({
      ...prev,
      errorLogItems: prev.errorLogItems.filter((e) => e.id !== errorId),
    }));
  }, []);

  const addExamDate = useCallback((exam: ExamDate) => {
    setState((prev) => ({
      ...prev,
      examDates: [...prev.examDates, exam],
    }));
  }, []);

  const deleteExamDate = useCallback((examId: string) => {
    setState((prev) => ({
      ...prev,
      examDates: prev.examDates.filter((e) => e.id !== examId),
    }));
  }, []);

  const scrollToWorkspace = useCallback(() => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToRecovery = useCallback(() => {
    setActiveTab("recovery");
    requestAnimationFrame(() => scrollToWorkspace());
  }, [scrollToWorkspace]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
      <PlannerAppBar onGoToRecovery={goToRecovery} />
      <PlannerHero
        onGoToDashboard={() => {
          setActiveTab("dashboard");
          requestAnimationFrame(() => scrollToWorkspace());
        }}
        onGoToRecovery={goToRecovery}
      />

      <div ref={workspaceRef} id="planner-workspace" className="scroll-mt-3 px-4 pb-10 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <section
            id="mode-heading"
            className="grid gap-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:grid-cols-5 sm:items-center sm:gap-6"
          >
            <div className="min-w-0 sm:col-span-2">
              <h2 className="text-[15px] font-semibold text-[#0f1a33]">Modo de estudio</h2>
              <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
                Elige el programa para adaptar asignaturas, métricas y planificación.
              </p>
            </div>
            <div className="w-full min-w-0 sm:col-span-3">
              <StudyModeSelector mode={mode} onModeChange={setMode} />
            </div>
          </section>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,26,51,0.05)] ring-1 ring-slate-100/80">
            <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <nav
                className="flex min-w-max gap-0.5 px-0.5 pt-0.5"
                role="tablist"
                aria-label="Secciones del ATPL Planner"
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 sm:px-3 ${
                        isActive
                          ? "bg-[#0f1a33] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#0f1a33]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-100 p-3 sm:p-4" role="tabpanel">
              {activeTab === "dashboard" ? (
                <StudyDashboard
                  sessions={modeSessions}
                  plannedSessions={modePlannedSessions}
                  mockResults={modeMockResults}
                  reviewItems={modeReviewItems}
                  errorLogItems={modeErrorLogItems}
                  examDates={modeExamDates}
                  weeklyGoalMinutes={weeklyGoalMinutes}
                  subjects={subjects}
                  onWeeklyGoalHoursChange={setWeeklyGoalHours}
                  onGoToRecovery={() => {
                    setActiveTab("recovery");
                    requestAnimationFrame(() => scrollToWorkspace());
                  }}
                  onGoToCalendar={() => {
                    setActiveTab("calendar");
                    requestAnimationFrame(() => scrollToWorkspace());
                  }}
                />
              ) : null}

              {activeTab === "subjects" ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">
                      Asignaturas ({mode.toUpperCase()})
                    </h3>
                    <SubjectOverview subjects={subjects} sessions={modeSessions} />
                  </div>
                  <ExamDateSettings
                    subjects={subjects}
                    examDates={modeExamDates}
                    onAddExamDate={addExamDate}
                    onDeleteExamDate={deleteExamDate}
                  />
                  <SubjectReadinessOverview
                    mode={mode}
                    subjects={subjects}
                    sessions={modeSessions}
                    mockResults={modeMockResults}
                    errorLogItems={modeErrorLogItems}
                  />
                </div>
              ) : null}

              {activeTab === "log" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">Registro de estudio</h3>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      Anota qué has estudiado, cuánto tiempo le has dedicado y cómo ha ido la sesión.
                    </p>
                  </div>
                  <StudyLogForm subjects={subjects} onAddSession={addSession} />
                  <div>
                    <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Sesiones registradas</h4>
                    <StudyLogTable sessions={modeSessions} onDelete={deleteSession} />
                  </div>
                </div>
              ) : null}

              {activeTab === "mocks" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">Mocks</h3>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      Registra tus mocks por asignatura para controlar tu evolución antes del examen.
                    </p>
                  </div>
                  <MockResultForm subjects={subjects} onAddMockResult={addMockResult} />
                  <div>
                    <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Resumen por asignatura</h4>
                    <MockSubjectSummary mockResults={modeMockResults} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Historial de mocks</h4>
                    <MockResultsTable mockResults={modeMockResults} onDelete={deleteMockResult} />
                  </div>
                </div>
              ) : null}

              {activeTab === "calendar" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">Calendario semanal</h3>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      Planifica tus sesiones de estudio y compáralas con lo que realmente completas.
                    </p>
                  </div>
                  <PlannedSessionForm subjects={subjects} onAddPlannedSession={addPlannedSession} />
                  <StudyWeeklyCalendar
                    plannedSessions={modePlannedSessions}
                    onCompletePlannedSession={completePlannedSession}
                    onSkipPlannedSession={skipPlannedSession}
                    onDeletePlannedSession={deletePlannedSession}
                  />
                </div>
              ) : null}

              {activeTab === "reviews" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">Repasos</h3>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      Programa temas para revisar y evita que se te acumulen antes del examen.
                    </p>
                  </div>
                  <ReviewItemForm subjects={subjects} onAddReviewItem={addReviewItem} />
                  <ReviewItemsList
                    reviewItems={modeReviewItems}
                    onComplete={completeReviewItem}
                    onReschedule={rescheduleReviewItem}
                    onDelete={deleteReviewItem}
                  />
                </div>
              ) : null}

              {activeTab === "errors" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">Error log</h3>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      Registra los errores que repites para detectar patrones y corregirlos antes del examen.
                    </p>
                  </div>
                  <ErrorLogForm subjects={subjects} onAddErrorLogItem={addErrorLogItem} />
                  <ErrorLogSummary
                    errorLogItems={modeErrorLogItems}
                    subjects={subjects}
                    mode={mode}
                  />
                  <ErrorLogList
                    errorLogItems={modeErrorLogItems}
                    onSetStatus={setErrorLogStatus}
                    onDelete={deleteErrorLogItem}
                  />
                </div>
              ) : null}

              {activeTab === "recovery" ? (
                <RecoveryMode
                  mode={mode}
                  subjects={subjects}
                  sessions={modeSessions}
                  plannedSessions={modePlannedSessions}
                  mockResults={modeMockResults}
                  reviewItems={modeReviewItems}
                  errorLogItems={modeErrorLogItems}
                  weeklyGoalMinutes={weeklyGoalMinutes}
                />
              ) : null}

              {activeTab === "progress" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">Progreso visual</h3>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      Revisa tus horas, consistencia y distribución por asignatura.
                    </p>
                  </div>
                  <StudyProgressCharts
                    mode={mode}
                    sessions={modeSessions}
                    mockResults={modeMockResults}
                    subjects={subjects}
                    weeklyGoalMinutes={weeklyGoalMinutes}
                  />
                </div>
              ) : null}

              {activeTab !== "dashboard" &&
              activeTab !== "subjects" &&
              activeTab !== "log" &&
              activeTab !== "calendar" &&
              activeTab !== "mocks" &&
              activeTab !== "reviews" &&
              activeTab !== "errors" &&
              activeTab !== "recovery" &&
              activeTab !== "progress" ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[14px] font-medium text-slate-600">
                  <p>{PLACEHOLDER_MSG}</p>
                  <p className="mt-2 text-[13px] text-slate-500">
                    Pronto podrás usar esta pestaña desde el mismo centro de control.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
