"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { PlannedStudySession, StudyMode, StudySubject } from "@/lib/study-planner/types";
import {
  isPendingLikeStatus,
  normalizePlannedSessionStatus,
} from "@/lib/study-planner/planner-session-status";
import {
  comparePlannedByStartTime,
  getPlannerMetrics,
  getTodayDateString,
  type WeeklyPlanCompletion,
} from "@/lib/study-planner/calculations";
import { buildDashboardHeroFromMetrics } from "@/lib/study-planner/dashboard-hero-context";
import type { WeeklyPlanAlert } from "@/lib/study-planner/weekly-alerts";
import { getSessionTypeShortLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { SessionHeroCard, type SessionHeroPrimaryAction } from "./SessionHeroCard";
import { WeekAlertsCompact } from "../planning/WeeklyPlanDashboard";
import { DashboardEvaluationVigil } from "./DashboardEvaluationVigil";
import type { NextExamHighlight } from "@/lib/study-planner/subjects-page-logic";
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
  onOpenSession: (session: PlannedStudySession) => void;
  onViewPlan?: () => void;
  onGoToSubjects?: (options?: GoToSubjectsOptions) => void;
  onGoToEvaluation?: (options?: GoToEvaluationOptions) => void;
  nextExamHighlight?: NextExamHighlight | null;
  onPrepareExam?: () => void;
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

  const typeLabel = getSessionTypeShortLabel(session.type);

  const subjectClass = isDone
    ? "text-emerald-900 line-through decoration-emerald-300/80"
    : isSkipped || isDimmed
      ? "text-slate-500"
      : "text-[#0f1a33]";

  const statusBadge =
    isNextUp && isPending ? (
      <span className="rounded-full bg-[#c9a454] px-2 py-0.5 text-[12px] font-bold uppercase leading-none tracking-wide text-[#0f1a33]">
        Ahora
      </span>
    ) : isSkipped ? (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-semibold leading-none text-amber-900">
        Saltada
      </span>
    ) : isInProgress ? (
      <span className="rounded-full bg-[#e8eef8] px-2 py-0.5 text-[12px] font-semibold leading-none text-[#0f1a33]">
        En curso
      </span>
    ) : null;

  return (
    <li className={isDimmed ? "opacity-55" : undefined}>
      <button
        type="button"
        onClick={() => onOpen(session)}
        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-[background-color,box-shadow,ring-color] duration-200 ${
          isDone
            ? "bg-emerald-50/60"
            : isSkipped
              ? "bg-amber-50/30"
              : isNextUp
                ? "bg-[#fffdf8] shadow-[0_4px_14px_-8px_rgba(201,164,84,0.38)] ring-2 ring-[#c9a454]/45"
                : isInProgress
                  ? "bg-[#fffdf8]/95 ring-1 ring-[#c9a454]/25"
                  : "bg-white/95 ring-1 ring-slate-200/40 hover:bg-slate-50/80"
        }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${
            isDone
              ? "bg-emerald-600 text-white ring-emerald-600"
              : isSkipped
                ? "bg-amber-100 text-amber-800 ring-amber-200/80"
                : isNextUp
                  ? "bg-[#c9a454] text-white ring-[#c9a454]"
                  : isInProgress
                    ? "bg-[#c9a454]/25 text-[#7a5a16] ring-[#c9a454]/40"
                    : "bg-slate-50 text-slate-300 ring-slate-200"
          }`}
          aria-hidden
        >
          {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>

        {/* Misma rejilla en todas las filas: hora · badge · asignatura · tipo · duración */}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:grid sm:grid-cols-[2.75rem_4.5rem_minmax(0,1fr)_7.75rem_3.25rem] sm:items-center sm:gap-x-2 sm:gap-y-0">
          <span
            className={`shrink-0 text-[13px] font-semibold tabular-nums leading-none sm:col-start-1 ${
              isDone ? "text-emerald-800" : isNextUp ? "text-[#7a5a16]" : "text-slate-600"
            }`}
          >
            {time}
          </span>

          <span
            className="flex h-5 w-[4.5rem] shrink-0 items-center sm:col-start-2"
            aria-hidden={statusBadge ? undefined : true}
          >
            {statusBadge}
          </span>

          <span
            className={`min-w-0 flex-1 truncate text-[14px] font-semibold leading-tight sm:col-start-3 ${subjectClass}`}
          >
            {subjectName}
          </span>

          <span className="ml-auto inline-flex shrink-0 items-center gap-2 sm:contents">
            <SessionTypeBadge
              type={session.type}
              className="!max-w-[7.75rem] !justify-self-end !normal-case !px-2 !py-1 text-[13px] tracking-normal ring-0 sm:col-start-4 [&_svg]:!h-3.5 [&_svg]:!w-3.5"
            />
            <span
              className={`shrink-0 text-right text-[13px] font-semibold tabular-nums leading-none sm:col-start-5 sm:w-[3.25rem] ${
                isDone ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {session.plannedDurationMinutes} min
              <span className="sr-only"> · {typeLabel}</span>
            </span>
          </span>
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
  onOpenSession,
  onViewPlan,
  onGoToEvaluation,
  nextExamHighlight = null,
  onPrepareExam,
}: DashboardWeekInProgressProps) {
  const today = getTodayDateString();

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
        onViewPlan={onViewPlan}
        onViewEvaluation={onGoToEvaluation ? () => onGoToEvaluation() : undefined}
      />

      <section className="rounded-xl bg-white px-3.5 py-3 shadow-[0_2px_14px_-12px_rgba(15,26,51,0.08)] ring-1 ring-slate-200/30">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold text-[#0f1a33]">Hoy</p>
          {todaySessions.length > 0 ? (
            <p className="text-[12px] font-medium tabular-nums text-slate-500">
              {todaySummary.done} hecho{todaySummary.done === 1 ? "" : "s"}
              {todaySummary.pending > 0
                ? ` · ${todaySummary.pending} pendiente${todaySummary.pending === 1 ? "" : "s"}`
                : ""}
            </p>
          ) : null}
        </div>
        {todaySessions.length === 0 ? (
          <p className="text-[13px] text-slate-500">No tienes bloques planificados para hoy.</p>
        ) : (
          <ul className="space-y-2">
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

      {alerts.length > 0 ? (
        <div className="rounded-lg border border-amber-200/50 bg-amber-50/35 px-3 py-2">
          <WeekAlertsCompact alerts={alerts} />
        </div>
      ) : positiveMessage ? (
        <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/45 px-3 py-2 text-[12px] font-medium text-emerald-900">
          {positiveMessage}
        </div>
      ) : null}

      <DashboardEvaluationVigil
        nextExam={nextExamHighlight}
        onPrepareExam={onPrepareExam}
      />
    </div>
  );
}
