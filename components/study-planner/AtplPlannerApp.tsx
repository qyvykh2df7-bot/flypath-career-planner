"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudyPlannerState } from "@/hooks/useStudyPlannerState";
import { PlannerShell } from "./layout/PlannerShell";
import type { PlannerNavId } from "./layout/planner-nav";
import { StudyDashboard } from "./dashboard/StudyDashboard";
import { SubjectsPage } from "./subjects/SubjectsPage";
import { StudyLogSection } from "./study-log-section";
import type { StudyLogIntent } from "@/lib/study-planner/study-log-intent";
import { StudyPlannerCalendar } from "./calendar/StudyPlannerCalendar";
import { RecoveryMode } from "./RecoveryMode";
import { PlannerOnboarding } from "./onboarding/PlannerOnboarding";
import { WeeklyPlanGenerator } from "./planning/WeeklyPlanGenerator";
import { PlannerSettingsPanel } from "./settings/PlannerSettingsPanel";
import { EvaluationSection, type EvaluationView } from "./EvaluationSection";
import type { PlannerPlanSettingsPayload, RecoveryPlan } from "@/lib/study-planner/types";
import type { RecoveryApplyResult } from "@/lib/study-planner/recovery-apply";
import type { SubjectFilterId } from "@/lib/study-planner/subjects-page-logic";
import type {
  GoToEvaluationOptions,
  GoToSubjectsOptions,
} from "@/lib/study-planner/dashboard-navigation";
import { getCurrentWeekStart, getPlannedSessionsForWeek } from "@/lib/study-planner/date-utils";
import {
  getTodayDateString,
  getTodayPendingPlannedSessions,
} from "@/lib/study-planner/calculations";
import { ActivatedWeekPanel } from "./planning/ActivatedWeekPanel";

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
    initialStudyContext,
    initialSubjectStates,
    completeOnboarding,
    updatePlanSettings,
    addSession,
    deleteSession,
    addPlannedSession,
    completePlannedSession,
    skipPlannedSession,
    deletePlannedSession,
    updatePlannedSession,
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
    clearVisibleWeekPendingPlanned,
    applyRecoveryPlanToCalendar,
  } = useStudyPlannerState();

  const [activeTab, setActiveTab] = useState<PlannerNavId>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [evaluationView, setEvaluationView] = useState<EvaluationView>("mocks");
  const [mockFormFocusKey, setMockFormFocusKey] = useState(0);
  const [examDatesFormKey, setExamDatesFormKey] = useState(0);
  const [subjectsFilter, setSubjectsFilter] = useState<SubjectFilterId>("all");
  const [visibleWeekStartDate, setVisibleWeekStartDate] = useState(() =>
    getCurrentWeekStart(getTodayDateString()),
  );
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [externalCreateNonce, setExternalCreateNonce] = useState(0);
  const [logIntent, setLogIntent] = useState<StudyLogIntent | null>(null);
  const weeklyCalendarRef = useRef<HTMLDivElement>(null);
  const today = getTodayDateString();

  const visibleWeekPlanned = useMemo(
    () => getPlannedSessionsForWeek(modePlannedSessions, visibleWeekStartDate),
    [modePlannedSessions, visibleWeekStartDate],
  );
  const hasActiveWeek = visibleWeekPlanned.length > 0;
  const showPlanGenerator = !hasActiveWeek || regenerateOpen;

  useEffect(() => {
    setRegenerateOpen(false);
  }, [visibleWeekStartDate]);

  const planSettingsInitial = useMemo<PlannerPlanSettingsPayload>(
    () => ({
      mode,
      activeSubjectIds,
      weeklyGoalMinutes,
      targetExamDate,
      studyStartDate,
      initialStudyContext,
      initialSubjectStates,
    }),
    [
      mode,
      activeSubjectIds,
      weeklyGoalMinutes,
      targetExamDate,
      studyStartDate,
      initialStudyContext,
      initialSubjectStates,
    ],
  );

  const modeLabel = mode === "atpl" ? "Modo ATPL" : "Modo PPL";

  const navigate = useCallback((tab: PlannerNavId) => {
    if (tab === "settings") {
      setSettingsOpen(true);
      return;
    }
    setSettingsOpen(false);
    setActiveTab(tab);
  }, []);

  const goToCalendar = useCallback(() => navigate("calendar"), [navigate]);
  const goToLog = useCallback(
    (intent?: StudyLogIntent) => {
      setLogIntent(intent ?? null);
      navigate("log");
    },
    [navigate],
  );

  const goToLogFromToday = useCallback(() => {
    const pending = getTodayPendingPlannedSessions(modePlannedSessions, today);
    if (pending.length > 0) {
      goToLog({
        mode: "plan_block",
        plannedSessionId: pending[0]!.id,
      });
    } else {
      goToLog({ mode: "free_study" });
    }
  }, [goToLog, modePlannedSessions, today]);
  const goToSubjects = useCallback(
    (options?: GoToSubjectsOptions) => {
      if (options?.openExamDatesForm) {
        setExamDatesFormKey((k) => k + 1);
      }
      if (options?.filter) {
        setSubjectsFilter(options.filter);
      }
      navigate("subjects");
    },
    [navigate],
  );
  const goToRecovery = useCallback(() => navigate("recovery"), [navigate]);

  const scrollToWeeklyCalendar = useCallback(() => {
    requestAnimationFrame(() => {
      weeklyCalendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const recoveryApplyPlan = useCallback(
    (plan: RecoveryPlan): RecoveryApplyResult => {
      const weekStart = getCurrentWeekStart(today);
      setVisibleWeekStartDate(weekStart);
      const result = applyRecoveryPlanToCalendar(plan, weekStart);
      if (result.applied) {
        setRegenerateOpen(false);
        goToCalendar();
        scrollToWeeklyCalendar();
      }
      return result;
    },
    [applyRecoveryPlanToCalendar, today, goToCalendar, scrollToWeeklyCalendar],
  );

  const openManualSessionDrawer = useCallback(() => {
    setExternalCreateNonce((n) => n + 1);
    scrollToWeeklyCalendar();
  }, [scrollToWeeklyCalendar]);

  const goToEvaluation = useCallback(
    (options?: GoToEvaluationOptions) => {
      const section = options?.section;
      if (section) setEvaluationView(section);
      else setEvaluationView("mocks");
      if (options?.focusMockForm) {
        setMockFormFocusKey((k) => k + 1);
      }
      navigate("evaluation");
    },
    [navigate],
  );

  const shellNavId: PlannerNavId = settingsOpen ? "settings" : activeTab;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] text-[#0f1a33]" />
    );
  }

  if (!onboardingCompleted) {
    return (
      <div className="min-h-screen bg-[#f6f7f9]">
        <PlannerOnboarding onComplete={completeOnboarding} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#0f1a33]">
      <PlannerShell
        activeNavId={shellNavId}
        onNavigate={navigate}
        onOpenSettings={() => setSettingsOpen(true)}
        narrowWorkspace={activeTab === "dashboard"}
        wideWorkspace={activeTab === "calendar"}
      >
        {activeTab === "dashboard" ? (
          <StudyDashboard
            mode={mode}
            targetExamDate={targetExamDate}
            sessions={modeSessions}
            plannedSessions={modePlannedSessions}
            mockResults={modeMockResults}
            reviewItems={modeReviewItems}
            errorLogItems={modeErrorLogItems}
            examDates={modeExamDates}
            weeklyGoalMinutes={weeklyGoalMinutes}
            subjects={activeSubjects}
            onGoToCalendar={goToCalendar}
            onGoToLog={goToLogFromToday}
            onGoToSubjects={goToSubjects}
            onGoToEvaluation={goToEvaluation}
            onCompletePlannedSession={completePlannedSession}
            onSkipPlannedSession={skipPlannedSession}
            onAddStudySession={addSession}
          />
        ) : null}

        {activeTab === "calendar" ? (
          <div className="space-y-3">
            <div>
              <p className="text-[12px] font-medium text-slate-500">Planificación</p>
              <h2 className="mt-0.5 text-[19px] font-semibold tracking-tight text-[#0f1a33] sm:text-[21px]">
                Calendario de estudio
              </h2>
              <p className="mt-0.5 text-[13px] leading-snug text-slate-500">
                {hasActiveWeek
                  ? "Gestiona la semana activa y navega por día, semana o mes en el panel inferior."
                  : "Genera tu semana automáticamente o crea sesiones manualmente desde el calendario."}
              </p>
            </div>

            {hasActiveWeek && !regenerateOpen ? (
              <ActivatedWeekPanel
                visibleWeekStartDate={visibleWeekStartDate}
                weekPlanned={visibleWeekPlanned}
                onRegenerate={() => setRegenerateOpen(true)}
                onAddManual={openManualSessionDrawer}
                onClearWeek={() => clearVisibleWeekPendingPlanned(visibleWeekStartDate)}
              />
            ) : null}

            {showPlanGenerator ? (
            <WeeklyPlanGenerator
              mode={mode}
              activeSubjectIds={activeSubjectIds}
              weeklyGoalMinutes={weeklyGoalMinutes}
              targetExamDate={targetExamDate}
              examDates={modeExamDates}
              initialSubjectStates={initialSubjectStates}
              studyStartDate={studyStartDate}
              visibleWeekStartDate={visibleWeekStartDate}
              sessions={modeSessions}
              mockResults={modeMockResults}
              reviewItems={modeReviewItems}
              errorLogItems={modeErrorLogItems}
              plannedSessions={modePlannedSessions}
              onApply={applyGeneratedWeeklyPlan}
              onPlanActivated={() => {
                setRegenerateOpen(false);
                scrollToWeeklyCalendar();
              }}
              regenerateMode={hasActiveWeek}
              onCancelRegenerate={() => setRegenerateOpen(false)}
            />
            ) : null}

            <div ref={weeklyCalendarRef} id="weekly-calendar" className="scroll-mt-4">
              <StudyPlannerCalendar
                plannedSessions={modePlannedSessions}
                studySessions={modeSessions}
                mockResults={modeMockResults}
                weeklyGoalMinutes={weeklyGoalMinutes}
                subjects={activeSubjects}
                visibleWeekStartDate={visibleWeekStartDate}
                onVisibleWeekStartChange={setVisibleWeekStartDate}
                onAddPlannedSession={addPlannedSession}
                onUpdatePlannedSession={updatePlannedSession}
                onDeletePlannedSession={deletePlannedSession}
                onCompletePlannedSession={completePlannedSession}
                onSkipPlannedSession={skipPlannedSession}
                onAddStudySession={addSession}
                externalCreateNonce={externalCreateNonce}
                externalCreateDate={today}
              />
            </div>
          </div>
        ) : null}

        {activeTab === "subjects" ? (
          <SubjectsPage
            subjects={activeSubjects}
            sessions={modeSessions}
            mockResults={modeMockResults}
            errorLogItems={modeErrorLogItems}
            reviewItems={modeReviewItems}
            examDates={modeExamDates}
            plannedSessions={modePlannedSessions}
            initialSubjectStates={initialSubjectStates}
            onAddExamDate={addExamDate}
            onDeleteExamDate={deleteExamDate}
            examDatesFormRequestKey={examDatesFormKey}
            initialFilter={subjectsFilter}
          />
        ) : null}

        {activeTab === "log" ? (
          <StudyLogSection
            subjects={activeSubjects}
            plannedSessions={modePlannedSessions}
            sessions={modeSessions}
            examDates={modeExamDates}
            intent={logIntent}
            onIntentConsumed={() => setLogIntent(null)}
            onAddSession={addSession}
            onCompletePlannedSession={completePlannedSession}
            onDeleteSession={deleteSession}
          />
        ) : null}

        {activeTab === "evaluation" ? (
          <EvaluationSection
            mode={mode}
            subjects={activeSubjects}
            sessions={modeSessions}
            mockResults={modeMockResults}
            reviewItems={modeReviewItems}
            errorLogItems={modeErrorLogItems}
            examDates={modeExamDates}
            initialView={evaluationView}
            focusMockFormRequestKey={mockFormFocusKey}
            onAddMockResult={addMockResult}
            onDeleteMockResult={deleteMockResult}
            onAddReviewItem={addReviewItem}
            onCompleteReviewItem={completeReviewItem}
            onRescheduleReviewItem={rescheduleReviewItem}
            onDeleteReviewItem={deleteReviewItem}
            onAddErrorLogItem={addErrorLogItem}
            onSetErrorLogStatus={setErrorLogStatus}
            onDeleteErrorLogItem={deleteErrorLogItem}
            onGoToCalendar={goToCalendar}
            onGoToSubjects={goToSubjects}
          />
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
            onApplyPlan={recoveryApplyPlan}
            onGoToCalendar={goToCalendar}
          />
        ) : null}
      </PlannerShell>

      <PlannerSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initial={planSettingsInitial}
        onSave={updatePlanSettings}
      />
    </div>
  );
}
