"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudyPlannerState } from "@/hooks/useStudyPlannerState";
import { PlannerShell } from "./layout/PlannerShell";
import type { PlannerNavId } from "./layout/planner-nav";
import { StudyDashboard } from "./dashboard/StudyDashboard";
import { ExamDateSettings } from "./ExamDateSettings";
import { SubjectOverview } from "./SubjectOverview";
import { StudyLogForm } from "./StudyLogForm";
import { StudyLogTable } from "./StudyLogTable";
import { StudyPlannerCalendar } from "./calendar/StudyPlannerCalendar";
import { SubjectReadinessOverview } from "./SubjectReadinessOverview";
import { RecoveryMode } from "./RecoveryMode";
import { PlannerOnboarding } from "./onboarding/PlannerOnboarding";
import { WeeklyPlanGenerator } from "./planning/WeeklyPlanGenerator";
import { PlannerSettingsPanel } from "./settings/PlannerSettingsPanel";
import { EvaluationSection, type EvaluationView } from "./EvaluationSection";
import type { PlannerPlanSettingsPayload } from "@/lib/study-planner/types";
import { getCurrentWeekStart, getPlannedSessionsForWeek } from "@/lib/study-planner/date-utils";
import { getTodayDateString } from "@/lib/study-planner/calculations";
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
  } = useStudyPlannerState();

  const [activeTab, setActiveTab] = useState<PlannerNavId>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [evaluationView, setEvaluationView] = useState<EvaluationView>("mocks");
  const [visibleWeekStartDate, setVisibleWeekStartDate] = useState(() =>
    getCurrentWeekStart(getTodayDateString()),
  );
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [externalCreateNonce, setExternalCreateNonce] = useState(0);
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
    }),
    [mode, activeSubjectIds, weeklyGoalMinutes, targetExamDate, studyStartDate],
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
  const goToLog = useCallback(() => navigate("log"), [navigate]);
  const goToSubjects = useCallback(() => navigate("subjects"), [navigate]);
  const goToRecovery = useCallback(() => navigate("recovery"), [navigate]);

  const scrollToWeeklyCalendar = useCallback(() => {
    requestAnimationFrame(() => {
      weeklyCalendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const openManualSessionDrawer = useCallback(() => {
    setExternalCreateNonce((n) => n + 1);
    scrollToWeeklyCalendar();
  }, [scrollToWeeklyCalendar]);

  const goToEvaluation = useCallback(
    (section?: EvaluationView) => {
      if (section) setEvaluationView(section);
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
            onGoToLog={goToLog}
            onGoToSubjects={goToSubjects}
            onGoToEvaluation={goToEvaluation}
            onCompletePlannedSession={completePlannedSession}
            onSkipPlannedSession={skipPlannedSession}
            onAddStudySession={addSession}
          />
        ) : null}

        {activeTab === "calendar" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#0f1a33]">Calendario de estudio</h2>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {hasActiveWeek
                  ? "Vista día, semana o mes. Toca un bloque para gestionarlo o + para planificar."
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
          <div className="space-y-4">
            <h2 className="text-[16px] font-semibold text-[#0f1a33]">Asignaturas</h2>
            <SubjectOverview
              subjects={activeSubjects}
              sessions={modeSessions}
              mockResults={modeMockResults}
              mode={mode}
              weeklyGoalMinutes={weeklyGoalMinutes}
              targetExamDate={targetExamDate}
              studyStartDate={studyStartDate}
            />
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
            <h2 className="text-[16px] font-semibold text-[#0f1a33]">Registro</h2>
            <StudyLogForm subjects={activeSubjects} onAddSession={addSession} />
            <StudyLogTable sessions={modeSessions} onDelete={deleteSession} />
          </div>
        ) : null}

        {activeTab === "evaluation" ? (
          <EvaluationSection
            mode={mode}
            subjects={activeSubjects}
            sessions={modeSessions}
            mockResults={modeMockResults}
            reviewItems={modeReviewItems}
            errorLogItems={modeErrorLogItems}
            weeklyGoalMinutes={weeklyGoalMinutes}
            initialView={evaluationView}
            onAddMockResult={addMockResult}
            onDeleteMockResult={deleteMockResult}
            onAddReviewItem={addReviewItem}
            onCompleteReviewItem={completeReviewItem}
            onRescheduleReviewItem={rescheduleReviewItem}
            onDeleteReviewItem={deleteReviewItem}
            onAddErrorLogItem={addErrorLogItem}
            onSetErrorLogStatus={setErrorLogStatus}
            onDeleteErrorLogItem={deleteErrorLogItem}
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
