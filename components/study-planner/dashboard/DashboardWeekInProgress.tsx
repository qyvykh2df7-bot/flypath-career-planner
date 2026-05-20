"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { ExamDate, PlannedStudySession, StudyMode, StudySubject } from "@/lib/study-planner/types";
import {
  isPendingLikeStatus,
  normalizePlannedSessionStatus,
} from "@/lib/study-planner/planner-session-status";
import { formatNextExamHighlight } from "@/lib/study-planner/subjects-page-logic";
import {
  comparePlannedByStartTime,
  getPlannerMetrics,
  getTodayDateString,
  type WeeklyPlanCompletion,
} from "@/lib/study-planner/calculations";
import { buildDashboardHeroFromMetrics } from "@/lib/study-planner/dashboard-hero-context";
import type { WeeklyPlanAlert } from "@/lib/study-planner/weekly-alerts";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { SessionHeroCard, type SessionHeroPrimaryAction } from "./SessionHeroCard";
import { PulseLine } from "./PulseLine";
import { WeekAlertsCompact } from "../planning/WeeklyPlanDashboard";
import {
  EvaluationDashboardLine,
  type DashboardQuickAction,
} from "../evaluation/EvaluationDashboardLine";
import type {
  GoToEvaluationOptions,
  GoToSubjectsOptions,
} from "@/lib/study-planner/dashboard-navigation";

type DashboardWeekInProgressProps = {
  mode: StudyMode;
  completion: WeeklyPlanCompletion;
  subjects: StudySubject[];
  nextSession: PlannedStudySession | null;
  nextSessionSubjectName?: string;
  alerts: WeeklyPlanAlert[];
  positiveMessage: string | null;
  pulseParts: { label: string; onClick?: () => void }[];
  onOpenSession: (session: PlannedStudySession) => void;
  examDates: ExamDate[];
  onGoToLog?: () => void;
  onViewPlan?: () => void;
  onGoToSubjects?: (options?: GoToSubjectsOptions) => void;
  onGoToEvaluation?: (options?: GoToEvaluationOptions) => void;
  evaluationLine?: string | null;
  showEvaluationEmptyCta?: boolean;
};

function TodayTimelineItem({
  session,
  onOpen,
  isNextUp = false,
  isDimmed = false,
}: {
  session: PlannedStudySession;
  onOpen: (session: PlannedStudySession) => void;
  isNextUp?: boolean;
  isDimmed?: boolean;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const time = session.startTime ?? "—";
  const status = normalizePlannedSessionStatus(session.status) ?? "pending";
  const isDone = status === "completed";
  const isSkipped = status === "skipped";
  const isInProgress = status === "in_progress";
  const isPending = isPendingLikeStatus(status);

  return (
    <li className={isDimmed ? "opacity-60" : undefined}>
      <button
        type="button"
        onClick={() => onOpen(session)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-[background-color,box-shadow] duration-200 ${
          isDone
            ? "bg-emerald-50/60"
            : isSkipped
              ? "bg-amber-50/30"
              : isNextUp
                ? "bg-[#fffdf8] ring-1 ring-[#c9a454]/35 shadow-[0_2px_10px_-8px_rgba(201,164,84,0.35)]"
                : isInProgress
                  ? "bg-[#fffdf8]/90"
                  : "bg-white/90 hover:bg-slate-50/70"
        }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${
            isDone
              ? "bg-emerald-600 text-white ring-emerald-600"
              : isSkipped
                ? "bg-amber-100 text-amber-800 ring-amber-200/80"
                : isInProgress
                  ? "bg-[#c9a454]/20 text-[#7a5a16] ring-[#c9a454]/40"
                  : "bg-slate-50 text-slate-300 ring-slate-200"
          }`}
          aria-hidden
        >
          {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
        <span
          className={`w-9 shrink-0 tabular-nums font-semibold ${isDone ? "text-emerald-800" : "text-[#0f1a33]"}`}
        >
          {time}
        </span>
        <span
          className={`min-w-0 flex-1 font-medium leading-snug ${
            isDone
              ? "text-emerald-900 line-through decoration-emerald-300/80"
              : isSkipped
                ? "text-slate-500"
                : isDimmed
                  ? "text-slate-500"
                  : "text-[#0f1a33]"
          }`}
        >
          {subjectName}
        </span>
        {isNextUp && isPending ? (
          <span className="shrink-0 rounded-full bg-[#fff8e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#7a5a16] ring-1 ring-[#c9a454]/30">
            Ahora
          </span>
        ) : null}
        {isSkipped ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
            Saltada
          </span>
        ) : isInProgress ? (
          <span className="shrink-0 rounded-full bg-[#e8eef8] px-1.5 py-0.5 text-[10px] font-semibold text-[#0f1a33]">
            En curso
          </span>
        ) : null}
        <SessionTypeBadge type={session.type} />
        <span className={`shrink-0 tabular-nums ${isDone ? "text-emerald-700" : "text-slate-500"}`}>
          {session.plannedDurationMinutes} min
        </span>
      </button>
    </li>
  );
}

export function DashboardWeekInProgress({
  mode: _mode,
  completion,
  subjects: _subjects,
  nextSession,
  nextSessionSubjectName: _nextSessionSubjectName,
  alerts,
  positiveMessage,
  pulseParts,
  onOpenSession,
  examDates,
  onGoToLog,
  onViewPlan,
  onGoToSubjects,
  onGoToEvaluation,
  evaluationLine,
  showEvaluationEmptyCta = false,
}: DashboardWeekInProgressProps) {
  const today = getTodayDateString();
  const nextExam = formatNextExamHighlight(examDates, today);

  const todaySessions = useMemo(
    () =>
      completion.weekSessions
        .filter((p) => p.date === today)
        .sort(comparePlannedByStartTime),
    [completion.weekSessions, today],
  );

  const todaySummary = useMemo(() => {
    let done = 0;
    let pending = 0;
    for (const s of todaySessions) {
      const status = normalizePlannedSessionStatus(s.status) ?? "pending";
      if (status === "completed") done += 1;
      else if (status !== "skipped") pending += 1;
    }
    return { done, pending };
  }, [todaySessions]);

  const metrics = useMemo(
    () =>
      getPlannerMetrics(completion.weekSessions, {
        today,
        studySessions: completion.weekLoggedSessions,
      }),
    [completion.weekSessions, completion.weekLoggedSessions, today],
  );

  const heroContext = useMemo(() => buildDashboardHeroFromMetrics(metrics), [metrics]);
  const nextUpSessionId = heroContext.focusPlannedSessionId ?? null;

  const insightQuickActions = useMemo(() => {
    const actions: DashboardQuickAction[] = [];
    if (!nextExam && onGoToSubjects) {
      actions.push({
        label: "Añadir fecha de examen",
        onClick: () => onGoToSubjects({ openExamDatesForm: true }),
      });
    }
    if (showEvaluationEmptyCta && onGoToEvaluation) {
      actions.push({
        label: "Registrar simulacro de examen",
        onClick: () => onGoToEvaluation({ section: "mocks", focusMockForm: true }),
      });
    }
    return actions;
  }, [nextExam, onGoToSubjects, showEvaluationEmptyCta, onGoToEvaluation]);

  const handleHeroPrimaryAction = () => {
    const action: SessionHeroPrimaryAction =
      heroContext.primaryAction ?? "start_session";

    if (action === "view_calendar" || action === "reorganize_week") {
      onViewPlan?.();
      return;
    }
    if (action === "view_evaluation") {
      onGoToEvaluation?.();
      return;
    }

    const targetId = heroContext.focusPlannedSessionId;
    const session = targetId
      ? metrics.weekSessions.find((s) => s.id === targetId) ?? nextSession
      : nextSession;
    if (session) {
      onOpenSession(session);
    } else {
      onViewPlan?.();
    }
  };

  return (
    <div className="planner-fade-up space-y-2.5 pb-1">
      <SessionHeroCard
        context={heroContext}
        coachTone={{ emotionalLine: "" }}
        suppressCoachHeader
        onPrimaryAction={handleHeroPrimaryAction}
        onLogToday={onGoToLog}
        onViewPlan={onViewPlan}
        onViewEvaluation={onGoToEvaluation ? () => onGoToEvaluation() : undefined}
      />

      <section className="rounded-xl bg-white/85 px-3 py-2 ring-1 ring-slate-200/25">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-[12px] font-semibold text-[#0f1a33]">Hoy</p>
          {todaySessions.length > 0 ? (
            <p className="text-[11px] font-medium tabular-nums text-slate-500">
              {todaySummary.done} hecho{todaySummary.done === 1 ? "" : "s"}
              {todaySummary.pending > 0
                ? ` · ${todaySummary.pending} pendiente${todaySummary.pending === 1 ? "" : "s"}`
                : ""}
            </p>
          ) : null}
        </div>
        {todaySessions.length === 0 ? (
          <p className="text-[12px] text-slate-500">No tienes bloques planificados para hoy.</p>
        ) : (
          <ul className="space-y-1">
            {todaySessions.map((session) => {
              const status = normalizePlannedSessionStatus(session.status) ?? "pending";
              const isDone = status === "completed";
              const isNextUp = session.id === nextUpSessionId;
              const isDimmed =
                !isDone &&
                !isNextUp &&
                status !== "skipped" &&
                status !== "in_progress" &&
                isPendingLikeStatus(status);

              return (
                <TodayTimelineItem
                  key={session.id}
                  session={session}
                  onOpen={onOpenSession}
                  isNextUp={isNextUp}
                  isDimmed={isDimmed}
                />
              );
            })}
          </ul>
        )}
      </section>

      <EvaluationDashboardLine
        line={evaluationLine ?? null}
        showEmptyCta={showEvaluationEmptyCta}
        onGoToEvaluation={onGoToEvaluation ? () => onGoToEvaluation() : undefined}
        nextExamHint={
          nextExam
            ? { subjectName: nextExam.subjectName, daysLabel: nextExam.daysLabel }
            : null
        }
        quickActions={insightQuickActions}
        variant="subtle"
      />

      {alerts.length > 0 ? (
        <div className="rounded-lg border border-amber-200/50 bg-amber-50/35 px-3 py-2">
          <WeekAlertsCompact alerts={alerts} />
        </div>
      ) : positiveMessage ? (
        <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/45 px-3 py-2 text-[12px] font-medium text-emerald-900">
          {positiveMessage}
        </div>
      ) : null}

      <PulseLine parts={pulseParts} alert={null} />
    </div>
  );
}
