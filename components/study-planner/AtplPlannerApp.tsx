"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  Settings2,
} from "lucide-react";
import { useStudyPlannerState } from "@/hooks/useStudyPlannerState";
import { FlyPathPlatformHeader } from "./FlyPathPlatformHeader";
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
import { PlannerOnboarding } from "./onboarding/PlannerOnboarding";
import { WeeklyPlanGenerator } from "./planning/WeeklyPlanGenerator";
import { PlannerSettingsPanel } from "./settings/PlannerSettingsPanel";
import type { PlannerPlanSettingsPayload } from "@/lib/study-planner/types";
import { getCurrentWeekStart } from "@/lib/study-planner/date-utils";
import { getTodayDateString } from "@/lib/study-planner/calculations";

type PlannerTab =
  | "dashboard"
  | "settings"
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
  { id: "settings", label: "Configuración", icon: Settings2 },
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
  const {
    hydrated,
    onboardingCompleted,
    mode,
    weeklyGoalMinutes,
    targetExamDate,
    studyStartDate,
    activeSubjectIds,
    activeSubjects,
    modeSessions,
    modePlannedSessions,
    modeMockResults,
    modeReviewItems,
    modeErrorLogItems,
    modeExamDates,
    setMode,
    completeOnboarding,
    updatePlanSettings,
    setWeeklyGoalHours,
    addSession,
    deleteSession,
    addPlannedSession,
    completePlannedSession,
    skipPlannedSession,
    deletePlannedSession,
    addMockResult,
    deleteMockResult,
    addReviewItem,
    completeReviewItem,
    rescheduleReviewItem,
    deleteReviewItem,
    addErrorLogItem,
    setErrorLogStatus,
    deleteErrorLogItem,
    addExamDate,
    deleteExamDate,
    applyGeneratedWeeklyPlan,
  } = useStudyPlannerState();

  const [activeTab, setActiveTab] = useState<PlannerTab>("dashboard");
  const [visibleWeekStartDate, setVisibleWeekStartDate] = useState(() =>
    getCurrentWeekStart(getTodayDateString()),
  );
  const workspaceRef = useRef<HTMLDivElement>(null);

  const planSettingsInitial = useMemo<PlannerPlanSettingsPayload>(
    () => ({
      mode,
      activeSubjectIds,
      weeklyGoalMinutes,
      targetExamDate,
      studyStartDate,
    }),
    [mode, activeSubjectIds, weeklyGoalMinutes, targetExamDate, studyStartDate],
  );

  const scrollToWorkspace = useCallback(() => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToRecovery = useCallback(() => {
    setActiveTab("recovery");
    requestAnimationFrame(() => scrollToWorkspace());
  }, [scrollToWorkspace]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
        <FlyPathPlatformHeader pageTitle="ATPL Planner" currentModuleId="atpl" />
      </div>
    );
  }

  if (!onboardingCompleted) {
    return (
      <>
        <FlyPathPlatformHeader pageTitle="ATPL Planner" currentModuleId="atpl" />
        <PlannerOnboarding onComplete={completeOnboarding} />
      </>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle="ATPL Planner" currentModuleId="atpl" />
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
                  mode={mode}
                  activeSubjectIds={activeSubjectIds}
                  targetExamDate={targetExamDate}
                  studyStartDate={studyStartDate}
                  sessions={modeSessions}
                  plannedSessions={modePlannedSessions}
                  mockResults={modeMockResults}
                  reviewItems={modeReviewItems}
                  errorLogItems={modeErrorLogItems}
                  examDates={modeExamDates}
                  weeklyGoalMinutes={weeklyGoalMinutes}
                  subjects={activeSubjects}
                  onWeeklyGoalHoursChange={setWeeklyGoalHours}
                  onSavePlanSettings={updatePlanSettings}
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

              {activeTab === "settings" ? (
                <PlannerSettingsPanel
                  embedded
                  open
                  onClose={() => setActiveTab("dashboard")}
                  initial={planSettingsInitial}
                  onSave={updatePlanSettings}
                />
              ) : null}

              {activeTab === "subjects" ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-[14px] font-semibold text-[#0f1a33]">
                      Asignaturas ({mode.toUpperCase()})
                    </h3>
                    <SubjectOverview
                      subjects={activeSubjects}
                      sessions={modeSessions}
                      mockResults={modeMockResults}
                      mode={mode}
                      weeklyGoalMinutes={weeklyGoalMinutes}
                      targetExamDate={targetExamDate}
                      studyStartDate={studyStartDate}
                    />
                  </div>
                  <ExamDateSettings
                    subjects={activeSubjects}
                    examDates={modeExamDates}
                    onAddExamDate={addExamDate}
                    onDeleteExamDate={deleteExamDate}
                  />
                  <SubjectReadinessOverview
                    mode={mode}
                    subjects={activeSubjects}
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
                  <StudyLogForm subjects={activeSubjects} onAddSession={addSession} />
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
                  <MockResultForm subjects={activeSubjects} onAddMockResult={addMockResult} />
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
                  <WeeklyPlanGenerator
                    mode={mode}
                    activeSubjectIds={activeSubjectIds}
                    weeklyGoalMinutes={weeklyGoalMinutes}
                    targetExamDate={targetExamDate}
                    studyStartDate={studyStartDate}
                    visibleWeekStartDate={visibleWeekStartDate}
                    sessions={modeSessions}
                    mockResults={modeMockResults}
                    plannedSessions={modePlannedSessions}
                    onApply={applyGeneratedWeeklyPlan}
                  />
                  <PlannedSessionForm subjects={activeSubjects} onAddPlannedSession={addPlannedSession} />
                  <StudyWeeklyCalendar
                    plannedSessions={modePlannedSessions}
                    visibleWeekStartDate={visibleWeekStartDate}
                    onVisibleWeekStartChange={setVisibleWeekStartDate}
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
                  <ReviewItemForm subjects={activeSubjects} onAddReviewItem={addReviewItem} />
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
                  <ErrorLogForm subjects={activeSubjects} onAddErrorLogItem={addErrorLogItem} />
                  <ErrorLogSummary
                    errorLogItems={modeErrorLogItems}
                    subjects={activeSubjects}
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
                  subjects={activeSubjects}
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
                    subjects={activeSubjects}
                    weeklyGoalMinutes={weeklyGoalMinutes}
                  />
                </div>
              ) : null}

              {activeTab !== "dashboard" &&
              activeTab !== "settings" &&
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
