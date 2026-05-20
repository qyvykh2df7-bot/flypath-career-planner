"use client";

import { useMemo, useState } from "react";
import type {
  ExamDate,
  MockResult,
  PlannedStudySession,
  ErrorLogItem,
  ReviewItem,
  StudyMode,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import type { StudyLogIntent } from "@/lib/study-planner/study-log-intent";
import {
  formatNextSessionLine,
  getNextPlannedSession,
  useWeeklyDashboardData,
} from "@/components/study-planner/planning/WeeklyPlanDashboard";
import { StudySessionFocusSheet } from "../StudySessionFocusSheet";
import { CoachStatusStrip } from "./CoachStatusStrip";
import {
  SessionHeroCard,
  buildSessionHeroContext,
} from "./SessionHeroCard";
import { MomentumStrip } from "./MomentumStrip";
import { AttentionList } from "./AttentionList";
import { DashboardMissionControl } from "./DashboardMissionControl";
import { DashboardStudyCenter } from "./DashboardStudyCenter";
import { DashboardWeekInProgress } from "./DashboardWeekInProgress";
import {
  buildAttentionItems,
  buildHeroCoachTone,
  resolveDashboardHeroEmptyState,
  calculatePendingErrorsForSubject,
  calculatePendingReviewCount,
  calculateReadinessForSubjects,
  getNextUpcomingExam,
  getReviewStatus,
  getCurrentWeekPlannedSessions,
  getTodayDateString,
  hasStudiedOnDate,
  sortReadinessForDisplay,
} from "@/lib/study-planner/calculations";
import { resolveWeeklyAlertsDisplay } from "@/lib/study-planner/weekly-alerts-display";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { buildEvaluationSummary } from "@/lib/study-planner/evaluation-page-logic";
import { formatDashboardEvaluationVigilLine } from "@/lib/study-planner/dashboard-atpl-focus";
import { formatNextExamHighlight } from "@/lib/study-planner/subjects-page-logic";
import { DashboardEvaluationVigil } from "./DashboardEvaluationVigil";
import type {
  GoToEvaluationOptions,
  GoToSubjectsOptions,
} from "@/lib/study-planner/dashboard-navigation";

type StudyDashboardProps = {
  mode: StudyMode;
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  weeklyGoalMinutes: number;
  subjects: StudySubject[];
  targetExamDate?: string;
  onGoToCalendar?: () => void;
  onGoToLog?: (intent?: StudyLogIntent) => void;
  onGoToSubjects?: (options?: GoToSubjectsOptions) => void;
  onGoToEvaluation?: (options?: GoToEvaluationOptions) => void;
  onCompletePlannedSession: (id: string) => void;
  onSkipPlannedSession: (id: string) => void;
  onAddStudySession: (session: StudySession) => void;
};

export function StudyDashboard({
  mode,
  sessions,
  plannedSessions,
  mockResults,
  reviewItems,
  errorLogItems,
  examDates,
  weeklyGoalMinutes,
  subjects,
  targetExamDate,
  onGoToCalendar,
  onGoToLog,
  onGoToSubjects,
  onGoToEvaluation,
  onCompletePlannedSession,
  onSkipPlannedSession,
  onAddStudySession,
}: StudyDashboardProps) {
  const today = getTodayDateString();
  const studiedToday = hasStudiedOnDate(sessions, today);
  const [focusSession, setFocusSession] = useState<PlannedStudySession | null>(null);

  const { completion, alerts } = useWeeklyDashboardData(
    plannedSessions,
    sessions,
    weeklyGoalMinutes,
  );

  const alertsDisplay = useMemo(
    () => resolveWeeklyAlertsDisplay({ alerts, mode, completion }),
    [alerts, mode, completion],
  );

  const nextSession = getNextPlannedSession(completion);
  const nextSessionInfo = nextSession ? formatNextSessionLine(nextSession) : null;

  const readinessList = useMemo(
    () =>
      sortReadinessForDisplay(
        calculateReadinessForSubjects({
          subjectIds: subjects.map((s) => s.id),
          sessions,
          mockResults,
        }),
      ),
    [subjects, sessions, mockResults],
  );

  const attentionItems = useMemo(
    () =>
      buildAttentionItems({
        subjectIds: subjects.map((s) => s.id),
        sessions,
        mockResults,
        errorLogItems,
        readinessList,
        getSubjectName: (id) => getSubjectById(id)?.name ?? id,
        today,
      }),
    [subjects, sessions, mockResults, errorLogItems, readinessList, today],
  );

  const focusSubjectId = nextSession?.subjectId ?? attentionItems[0]?.subjectId;
  const focusSubjectName = focusSubjectId
    ? (getSubjectById(focusSubjectId)?.name ?? focusSubjectId)
    : undefined;

  const pendingReviewsForSubject = focusSubjectId
    ? reviewItems.filter(
        (r) => r.subjectId === focusSubjectId && getReviewStatus(r, today) !== "completed",
      ).length
    : 0;
  const pendingErrorsForSubject = focusSubjectId
    ? calculatePendingErrorsForSubject(errorLogItems, focusSubjectId)
    : 0;

  const emptyHeroState = useMemo(
    () => resolveDashboardHeroEmptyState(plannedSessions, sessions),
    [plannedSessions, sessions],
  );

  const todayPendingCount = useMemo(() => {
    return getCurrentWeekPlannedSessions(plannedSessions).filter(
      (p) => p.date === today && (p.status === "pending" || p.status === "in_progress"),
    ).length;
  }, [plannedSessions, today]);

  const heroContext = buildSessionHeroContext({
    nextSession,
    subjectName: nextSessionInfo?.subjectName ?? focusSubjectName,
    sessionMeta: nextSessionInfo
      ? `${nextSessionInfo.meta} · ${nextSessionInfo.type}`
      : undefined,
    topAttention: attentionItems[0] ?? null,
    pendingReviewsForSubject,
    pendingErrorsForSubject,
    emptyState: emptyHeroState,
    weekActive: completion.hasPlan,
    todayPendingCount,
    today,
  });

  const coachTone = buildHeroCoachTone({
    completion,
    focusSubjectName: nextSessionInfo?.subjectName ?? focusSubjectName,
    nextSessionDate: nextSession?.date,
    studiedToday,
    totalStudySessions: sessions.length,
    plannedSessions,
    today,
  });

  const evaluationSummary = useMemo(
    () =>
      buildEvaluationSummary({
        mockResults,
        errorLogItems,
        reviewItems,
        subjectIds: subjects.map((s) => s.id),
        examDates,
        sessions,
        today,
      }),
    [mockResults, errorLogItems, reviewItems, subjects, examDates, sessions, today],
  );
  const nextExamHighlight = useMemo(
    () => formatNextExamHighlight(examDates, today),
    [examDates, today],
  );
  const evaluationVigilLine = useMemo(
    () =>
      formatDashboardEvaluationVigilLine({
        pendingErrors: evaluationSummary.pendingErrors,
        nextExam: nextExamHighlight,
      }),
    [evaluationSummary.pendingErrors, nextExamHighlight],
  );
  const nextExam = getNextUpcomingExam(examDates, today);

  const topAlert =
    alertsDisplay.alerts.find(
      (a) =>
        a.severity !== "info" &&
        !(a.id === "goal-hours-remaining" && !completion.hasPlan),
    ) ?? null;

  const remainingGoalMinutes = !completion.hasPlan
    ? Math.max(0, completion.targetMinutes - completion.totalCreditedMinutes)
    : undefined;

  const hideCoachSubline =
    emptyHeroState?.variant === "fresh" ||
    (emptyHeroState?.variant === "study_no_plan" && !completion.hasLoggedStudyThisWeek);

  const goToEvaluationDefault = onGoToEvaluation
    ? () => onGoToEvaluation({ section: "mocks" })
    : undefined;

  const openFocusSession = (session: PlannedStudySession | null) => {
    if (session) setFocusSession(session);
    else if (nextSession) setFocusSession(nextSession);
    else onGoToCalendar?.();
  };

  const isFreshEmpty = emptyHeroState?.variant === "fresh";

  if (isFreshEmpty) {
    return (
      <DashboardMissionControl
        mode={mode}
        weeklyGoalMinutes={weeklyGoalMinutes}
        subjectCount={subjects.length}
        targetExamDate={targetExamDate}
        onGeneratePlan={() => onGoToCalendar?.()}
      />
    );
  }

  if (completion.hasPlan) {
    return (
      <div className="flex flex-col gap-2.5 pb-1">
        <DashboardStudyCenter
          mode={mode}
          weeklyGoalMinutes={weeklyGoalMinutes}
          subjectCount={subjects.length}
          targetExamDate={targetExamDate}
          completion={completion}
        />
        <DashboardWeekInProgress
          mode={mode}
          completion={completion}
          subjects={subjects}
          nextSession={nextSession}
          nextSessionSubjectName={nextSessionInfo?.subjectName ?? focusSubjectName}
          alerts={alertsDisplay.alerts}
          positiveMessage={alertsDisplay.positiveMessage}
          onOpenSession={setFocusSession}
          onGoToLog={onGoToLog}
          onViewPlan={onGoToCalendar}
          onGoToSubjects={onGoToSubjects}
          onGoToEvaluation={onGoToEvaluation}
          evaluationVigilLine={evaluationVigilLine}
          onEvaluationVigilGo={goToEvaluationDefault}
        />
        <StudySessionFocusSheet
          session={focusSession}
          onClose={() => setFocusSession(null)}
          onComplete={onCompletePlannedSession}
          onSkip={onSkipPlannedSession}
          onLogStudy={onAddStudySession}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-1">
      <DashboardStudyCenter
        mode={mode}
        weeklyGoalMinutes={weeklyGoalMinutes}
        subjectCount={subjects.length}
        targetExamDate={targetExamDate}
      />
      <CoachStatusStrip
        completion={completion}
        totalStudySessions={sessions.length}
        hideSubline={hideCoachSubline}
      />

      <SessionHeroCard
        context={heroContext}
        coachTone={coachTone}
        onPrimaryAction={() => onGoToCalendar?.()}
        onLogToday={onGoToLog}
        onViewPlan={onGoToCalendar}
      />

      <MomentumStrip
        sessions={sessions}
        weekPercent={completion.completionPercent}
        targetExamDate={targetExamDate}
        nextExamDate={nextExam?.date}
        hasPlan={completion.hasPlan}
        remainingGoalMinutes={remainingGoalMinutes}
      />

      <AttentionList
        items={attentionItems}
        onSelectSubject={onGoToSubjects ? () => onGoToSubjects() : undefined}
      />

      {topAlert ? (
        <p
          className={`text-[11px] leading-snug ${
            topAlert.severity === "risk" ? "text-red-700/90" : "text-amber-800/90"
          }`}
        >
          {topAlert.message}
        </p>
      ) : null}

      <DashboardEvaluationVigil
        line={evaluationVigilLine}
        onGoToEvaluation={goToEvaluationDefault}
      />
    </div>
  );
}
