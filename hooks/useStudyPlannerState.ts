"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ATPL_PLANNER_STATE,
  type AtplPlannerState,
  type ExamDate,
  type MockResult,
  type PlannedStudySession,
  type ErrorLogItem,
  type ErrorLogStatus,
  type PlannerOnboardingPayload,
  type PlannerPlanSettingsPayload,
  type ReviewItem,
  type StudyMode,
  type StudySession,
  type RecoveryPlan,
  type StudySessionQuality,
} from "@/lib/study-planner/types";

export type CompletePlannedSessionOverrides = {
  durationMinutes?: number;
  quality?: StudySessionQuality;
  notes?: string;
};
import { addDaysToDate, createPlannerId, getTodayDateString } from "@/lib/study-planner/calculations";
import {
  buildDefaultInitialSubjectStates,
  mergeExamDatesFromInitialStates,
} from "@/lib/study-planner/initial-subject-state";
import { getWeekRange } from "@/lib/study-planner/date-utils";
import {
  completePlannedSessionWithLog,
  deleteStudySessionWithPlannedSync,
} from "@/lib/study-planner/planned-log-sync";
import { isPendingLikeStatus } from "@/lib/study-planner/planner-session-status";
import type { ApplyPlanMode, WeeklyStudyPlan } from "@/lib/study-planner/planning/planning-types";
import { markPlanActivated } from "@/lib/study-planner/plan-activation";
import { weeklyPlanToPlannedSessions } from "@/lib/study-planner/planning/plan-to-sessions";
import {
  buildRecoveryApplyResult,
  recoveryPlanToPlannedSessions,
} from "@/lib/study-planner/recovery-apply";
import { sumPendingPlannedMinutesForWeek } from "@/lib/study-planner/recovery-load";
import { validatePlannedSessionScheduleDate } from "@/lib/study-planner/planned-session-scheduling";
import { loadStudyPlannerState, saveStudyPlannerState } from "@/lib/study-planner/storage";
import {
  filterErrorLogItemsByMode,
  filterExamDatesByMode,
  filterMockResultsByMode,
  filterPlannedSessionsByMode,
  filterReviewItemsByMode,
  filterSessionsByMode,
  getActiveSubjects,
  getSubjectsByMode,
} from "@/lib/study-planner/subjects";

export function useStudyPlannerState() {
  const [state, setState] = useState<AtplPlannerState>(DEFAULT_ATPL_PLANNER_STATE);
  const [hydrated, setHydrated] = useState(false);

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
    activeSubjectIds,
    targetExamDate,
    studyStartDate,
    initialStudyContext,
    initialSubjectStates,
    onboardingCompleted,
    sessions,
    plannedSessions,
    mockResults,
    reviewItems,
    errorLogItems,
    examDates,
  } = state;

  const catalogSubjects = useMemo(() => getSubjectsByMode(mode), [mode]);
  const activeSubjects = useMemo(
    () => getActiveSubjects(mode, activeSubjectIds),
    [mode, activeSubjectIds],
  );

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
    setState((prev) => {
      const nextCatalogIds = getSubjectsByMode(next).map((s) => s.id);
      const filtered = prev.activeSubjectIds.filter((id) => nextCatalogIds.includes(id));
      return {
        ...prev,
        mode: next,
        activeSubjectIds: filtered.length > 0 ? filtered : [...nextCatalogIds],
      };
    });
  }, []);

  const completeOnboarding = useCallback((payload: PlannerOnboardingPayload) => {
    const catalogIds = new Set(getSubjectsByMode(payload.mode).map((s) => s.id));
    const active = payload.activeSubjectIds.filter((id) => catalogIds.has(id));
    const activeIds = active.length > 0 ? active : [...catalogIds];
    const initialSubjectStates =
      payload.initialSubjectStates.length > 0
        ? payload.initialSubjectStates.filter((s) => catalogIds.has(s.subjectId))
        : buildDefaultInitialSubjectStates(activeIds, payload.initialStudyContext);

    setState((prev) => ({
      ...prev,
      mode: payload.mode,
      activeSubjectIds: activeIds,
      weeklyGoalMinutes: payload.weeklyGoalMinutes,
      targetExamDate: payload.targetExamDate,
      studyStartDate: payload.studyStartDate,
      initialStudyContext: payload.initialStudyContext,
      initialSubjectStates,
      examDates: mergeExamDatesFromInitialStates(
        prev.examDates,
        initialSubjectStates,
        createPlannerId,
      ),
      onboardingCompleted: true,
    }));
  }, []);

  const setActiveSubjectIds = useCallback((ids: string[]) => {
    setState((prev) => {
      const catalogIds = new Set(getSubjectsByMode(prev.mode).map((s) => s.id));
      const filtered = ids.filter((id) => catalogIds.has(id));
      return {
        ...prev,
        activeSubjectIds: filtered.length > 0 ? filtered : [...catalogIds],
      };
    });
  }, []);

  const setWeeklyGoalHours = useCallback((hours: number) => {
    const clamped = Math.min(80, Math.max(1, hours));
    setState((prev) => ({ ...prev, weeklyGoalMinutes: clamped * 60 }));
  }, []);

  const updatePlanSettings = useCallback((payload: PlannerPlanSettingsPayload) => {
    const catalogIds = getSubjectsByMode(payload.mode).map((s) => s.id);
    const catalogSet = new Set(catalogIds);
    const active = payload.activeSubjectIds.filter((id) => catalogSet.has(id));

    const weeklyGoalMinutes = Math.min(
      4800,
      Math.max(60, Math.round(payload.weeklyGoalMinutes)),
    );

    const targetExamDate =
      payload.targetExamDate && /^\d{4}-\d{2}-\d{2}$/.test(payload.targetExamDate)
        ? payload.targetExamDate
        : undefined;

    const studyStartDate =
      payload.studyStartDate && /^\d{4}-\d{2}-\d{2}$/.test(payload.studyStartDate)
        ? payload.studyStartDate
        : undefined;

    const activeIds = active.length > 0 ? active : [...catalogIds];

    setState((prev) => {
      const nextInitialStates =
        payload.initialSubjectStates !== undefined
          ? payload.initialSubjectStates.filter((s) => catalogSet.has(s.subjectId))
          : prev.initialSubjectStates?.filter((s) => catalogSet.has(s.subjectId));

      return {
        ...prev,
        mode: payload.mode,
        activeSubjectIds: activeIds,
        weeklyGoalMinutes,
        targetExamDate,
        studyStartDate,
        initialStudyContext: payload.initialStudyContext ?? prev.initialStudyContext,
        initialSubjectStates: nextInitialStates,
        examDates:
          nextInitialStates && nextInitialStates.length > 0
            ? mergeExamDatesFromInitialStates(prev.examDates, nextInitialStates, createPlannerId)
            : prev.examDates,
      };
    });
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => {
      const synced = deleteStudySessionWithPlannedSync(
        prev.sessions,
        prev.plannedSessions,
        sessionId,
      );
      return { ...prev, ...synced };
    });
  }, []);

  const addPlannedSession = useCallback((planned: PlannedStudySession) => {
    const today = getTodayDateString();
    if (
      planned.source === "manual" &&
      !validatePlannedSessionScheduleDate(planned.date, today).ok
    ) {
      return;
    }
    setState((prev) => ({
      ...prev,
      plannedSessions: [...prev.plannedSessions, planned],
    }));
  }, []);

  const completePlannedSession = useCallback(
    (plannedId: string, overrides?: CompletePlannedSessionOverrides) => {
      setState((prev) => {
        const result = completePlannedSessionWithLog(
          prev.plannedSessions,
          prev.sessions,
          plannedId,
          overrides,
        );
        if (!result) return prev;
        return { ...prev, ...result };
      });
    },
    [],
  );

  const skipPlannedSession = useCallback((plannedId: string) => {
    setState((prev) => ({
      ...prev,
      plannedSessions: prev.plannedSessions.map((p) =>
        p.id === plannedId && isPendingLikeStatus(p.status)
          ? { ...p, status: "skipped" as const }
          : p,
      ),
    }));
  }, []);

  const deletePlannedSession = useCallback((plannedId: string) => {
    setState((prev) => ({
      ...prev,
      plannedSessions: prev.plannedSessions.filter((p) => p.id !== plannedId),
    }));
  }, []);

  const updatePlannedSession = useCallback(
    (plannedId: string, patch: Partial<Omit<PlannedStudySession, "id">>) => {
      const today = getTodayDateString();
      if (patch.date && !validatePlannedSessionScheduleDate(patch.date, today).ok) {
        return;
      }
      setState((prev) => ({
        ...prev,
        plannedSessions: prev.plannedSessions.map((p) =>
          p.id === plannedId ? { ...p, ...patch } : p,
        ),
      }));
    },
    [],
  );

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
        r.id === reviewId ? { ...r, status: "completed" as const, completedAt: today } : r,
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
      errorLogItems: prev.errorLogItems.map((e) => (e.id === errorId ? { ...e, status } : e)),
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

  const clearVisibleWeekPendingPlanned = useCallback((weekStartDate: string) => {
    const { start, end } = getWeekRange(weekStartDate);
    setState((prev) => ({
      ...prev,
      plannedSessions: prev.plannedSessions.filter(
        (p) => !(p.date >= start && p.date <= end && isPendingLikeStatus(p.status)),
      ),
    }));
  }, []);

  const applyGeneratedWeeklyPlan = useCallback((plan: WeeklyStudyPlan, applyMode: ApplyPlanMode) => {
    const { start, end } = getWeekRange(plan.weekStartDate);
    const modeSubjectSet = new Set(getSubjectsByMode(plan.mode).map((s) => s.id));
    const newSessions = weeklyPlanToPlannedSessions(plan);

    setState((prev) => {
      let plannedSessions = prev.plannedSessions;
      if (applyMode === "replace_visible_week" || applyMode === "replace_auto_only") {
        plannedSessions = plannedSessions.filter((p) => {
          if (
            !(
              p.date >= start &&
              p.date <= end &&
              isPendingLikeStatus(p.status) &&
              modeSubjectSet.has(p.subjectId)
            )
          ) {
            return true;
          }
          if (applyMode === "replace_auto_only" && p.source === "manual") {
            return true;
          }
          return false;
        });
      }
      return {
        ...prev,
        plannedSessions: [...plannedSessions, ...newSessions],
      };
    });
    markPlanActivated(plan.mode);
  }, []);

  const applyRecoveryPlanToCalendar = useCallback(
    (plan: RecoveryPlan, weekStartDate: string) => {
      const today = getTodayDateString();
      let result = buildRecoveryApplyResult([], 0, 0);

      setState((prev) => {
        const previousPlannedMinutes = sumPendingPlannedMinutesForWeek(
          prev.plannedSessions,
          weekStartDate,
        );
        const sessions = recoveryPlanToPlannedSessions({
          plan,
          activeSubjectIds: prev.activeSubjectIds,
          reviewItems: filterReviewItemsByMode(prev.reviewItems, prev.mode),
          errorLogItems: filterErrorLogItemsByMode(prev.errorLogItems, prev.mode),
          weekStartDate,
          today,
          weeklyGoalMinutes: prev.weeklyGoalMinutes,
          currentPlannedMinutes: previousPlannedMinutes,
        });
        if (sessions.length === 0) {
          result = buildRecoveryApplyResult([], previousPlannedMinutes, previousPlannedMinutes);
          return prev;
        }

        const { start, end } = getWeekRange(weekStartDate);
        const activeSet = new Set(prev.activeSubjectIds);
        markPlanActivated(prev.mode);

        const mergedPlanned = [
          ...prev.plannedSessions.filter(
            (p) =>
              !(
                p.date >= start &&
                p.date <= end &&
                isPendingLikeStatus(p.status) &&
                p.source === "auto" &&
                activeSet.has(p.subjectId)
              ),
          ),
          ...sessions,
        ];
        const newPlannedMinutes = sumPendingPlannedMinutesForWeek(
          mergedPlanned,
          weekStartDate,
        );
        result = buildRecoveryApplyResult(
          sessions,
          previousPlannedMinutes,
          newPlannedMinutes,
        );

        return {
          ...prev,
          plannedSessions: mergedPlanned,
        };
      });

      return result;
    },
    [],
  );

  return {
    hydrated,
    onboardingCompleted: onboardingCompleted === true,
    mode,
    weeklyGoalMinutes,
    activeSubjectIds,
    targetExamDate,
    studyStartDate,
    initialStudyContext,
    initialSubjectStates,
    catalogSubjects,
    activeSubjects,
    modeSessions,
    modePlannedSessions,
    modeMockResults,
    modeReviewItems,
    modeErrorLogItems,
    modeExamDates,
    setMode,
    completeOnboarding,
    setActiveSubjectIds,
    setWeeklyGoalHours,
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
  };
}
