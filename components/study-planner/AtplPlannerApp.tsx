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
import { EvaluationSection } from "./EvaluationSection";
import type { PlannerPlanSettingsPayload, RecoveryPlan } from "@/lib/study-planner/types";
import type { RecoveryApplyResult } from "@/lib/study-planner/recovery-apply";
import type { SubjectFilterId } from "@/lib/study-planner/subjects-page-logic";
import type { GoToSubjectsOptions } from "@/lib/study-planner/dashboard-navigation";
import { getCurrentWeekStart, getPlannedSessionsForWeek } from "@/lib/study-planner/date-utils";
import { plannerPageTitle } from "@/lib/study-planner/planner-ui";
import {
  getTodayDateString,
  getTodayPendingPlannedSessions,
} from "@/lib/study-planner/calculations";

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
    modeFollowUpComments,
    addFollowUpComment,
    deleteFollowUpComment,
    lastSeenFollowUpCommentId,
    markFollowUpCommentsSeen,
    applyGeneratedWeeklyPlan,
    clearVisibleWeekPendingPlanned,
    applyRecoveryPlanToCalendar,
  } = useStudyPlannerState();

  const [activeTab, setActiveTab] = useState<PlannerNavId>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [examDatesFormKey, setExamDatesFormKey] = useState(0);
  const [subjectsFilter, setSubjectsFilter] = useState<SubjectFilterId>("all");
  const [visibleWeekStartDate, setVisibleWeekStartDate] = useState(() =>
    getCurrentWeekStart(getTodayDateString()),
  );
  const [externalCreateNonce, setExternalCreateNonce] = useState(0);
  const [logIntent, setLogIntent] = useState<StudyLogIntent | null>(null);
  const weeklyCalendarRef = useRef<HTMLDivElement>(null);
  const today = getTodayDateString();

  const visibleWeekPlanned = useMemo(
    () => getPlannedSessionsForWeek(modePlannedSessions, visibleWeekStartDate),
    [modePlannedSessions, visibleWeekStartDate],
  );
  const hasActiveWeek = visibleWeekPlanned.length > 0;
  const showPlanGenerator = !hasActiveWeek;

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
        goToCalendar();
        scrollToWeeklyCalendar();
      }
      return result;
    },
    [applyRecoveryPlanToCalendar, today, goToCalendar, scrollToWeeklyCalendar],
  );

  const goToEvaluation = useCallback(() => {
    markFollowUpCommentsSeen(mode);
    navigate("evaluation");
  }, [markFollowUpCommentsSeen, mode, navigate]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeTab === "evaluation" && !settingsOpen) {
      markFollowUpCommentsSeen(mode);
    }
  }, [hydrated, activeTab, settingsOpen, mode, markFollowUpCommentsSeen]);

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
            onAddStudySession={addSession}
            onAddPlannedSession={addPlannedSession}
            followUpComments={modeFollowUpComments}
            lastSeenFollowUpCommentId={lastSeenFollowUpCommentId}
          />
        ) : null}

        {activeTab === "calendar" ? (
          <div className="space-y-3">
            <div>
              <h2 className={plannerPageTitle}>Calendario de estudio</h2>
              {!hasActiveWeek ? (
                <p className="mt-1 text-[13px] leading-snug text-slate-500">
                  Genera tu semana automáticamente o crea sesiones manualmente desde el calendario.
                </p>
              ) : null}
            </div>

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
                scrollToWeeklyCalendar();
              }}
            />
            ) : null}

            <div ref={weeklyCalendarRef} id="weekly-calendar" className="scroll-mt-4">
              <StudyPlannerCalendar
                plannedSessions={modePlannedSessions}
                examDates={modeExamDates}
                studySessions={modeSessions}
                mockResults={modeMockResults}
                onDeleteExamDate={deleteExamDate}
                weeklyGoalMinutes={weeklyGoalMinutes}
                subjects={activeSubjects}
                visibleWeekStartDate={visibleWeekStartDate}
                onVisibleWeekStartChange={setVisibleWeekStartDate}
                onAddPlannedSession={addPlannedSession}
                onUpdatePlannedSession={updatePlannedSession}
                onDeletePlannedSession={deletePlannedSession}
                onCompletePlannedSession={completePlannedSession}
                onAddStudySession={addSession}
                externalCreateNonce={externalCreateNonce}
                externalCreateDate={today}
                weekManagement={
                  hasActiveWeek
                    ? {
                        onClearWeek: () => clearVisibleWeekPendingPlanned(visibleWeekStartDate),
                      }
                    : null
                }
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
            onGoToCalendar={goToCalendar}
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
            plannedSessions={modePlannedSessions}
            followUpComments={modeFollowUpComments}
            onAddFollowUpComment={addFollowUpComment}
            onDeleteFollowUpComment={deleteFollowUpComment}
            onAddPlannedSession={addPlannedSession}
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
            examDates={modeExamDates}
            weeklyGoalMinutes={weeklyGoalMinutes}
            weekStartDate={visibleWeekStartDate}
            today={today}
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
