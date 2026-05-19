"use client";

import { useMemo } from "react";
import type { ExamDate, PlannedStudySession, StudyMode, StudySubject } from "@/lib/study-planner/types";
import { formatNextExamHighlight } from "@/lib/study-planner/subjects-page-logic";
import {
  comparePlannedByStartTime,
  getPlannerMetrics,
  getTodayDateString,
  minutesToHoursLabel,
  type WeeklyPlanCompletion,
} from "@/lib/study-planner/calculations";
import { buildDashboardHeroFromMetrics } from "@/lib/study-planner/dashboard-hero-context";
import type { WeeklyPlanAlert } from "@/lib/study-planner/weekly-alerts";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "../SessionTypeBadge";
import { SessionHeroCard, type SessionHeroPrimaryAction } from "./SessionHeroCard";
import { PulseLine } from "./PulseLine";
import { WeekAlertsCompact } from "../planning/WeeklyPlanDashboard";

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
  onGoToSubjects?: () => void;
  onGoToEvaluation?: () => void;
};

function ProgressRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[12px] text-slate-600">{label}</span>
        <span className="text-[12px] font-medium text-[#0f1a33]">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90 transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50/90 px-2.5 py-2 ring-1 ring-slate-100/80">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-semibold text-[#0f1a33]">{value}</p>
    </div>
  );
}

function TodayTimelineItem({
  session,
  onOpen,
}: {
  session: PlannedStudySession;
  onOpen: (session: PlannedStudySession) => void;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const time = session.startTime ?? "—";
  const isDone = session.status === "completed";
  const isSkipped = session.status === "skipped";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(session)}
        className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[12px] transition hover:shadow-sm ${
          isDone
            ? "border-emerald-200/80 bg-emerald-50/50"
            : isSkipped
              ? "border-slate-200/80 bg-slate-50/80 opacity-75"
              : "border-slate-200/80 bg-white hover:border-slate-300"
        }`}
      >
        <span className="w-10 shrink-0 tabular-nums font-semibold text-[#0f1a33]">{time}</span>
        <span className="min-w-0 flex-1 font-medium leading-snug text-[#0f1a33]">{subjectName}</span>
        <SessionTypeBadge type={session.type} />
        <span className="shrink-0 text-slate-500">{session.plannedDurationMinutes} min</span>
      </button>
    </li>
  );
}

export function DashboardWeekInProgress({
  mode,
  completion,
  subjects,
  nextSession,
  nextSessionSubjectName,
  alerts,
  positiveMessage,
  pulseParts,
  onOpenSession,
  examDates,
  onGoToLog,
  onViewPlan,
  onGoToSubjects,
  onGoToEvaluation,
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

  const metrics = useMemo(
    () =>
      getPlannerMetrics(completion.weekSessions, {
        today,
        studySessions: completion.weekLoggedSessions,
      }),
    [completion.weekSessions, completion.weekLoggedSessions, today],
  );

  const blockCount = metrics.totalPlannedSessions;
  const progressPercent = metrics.weeklyProgressPercent;
  const plannedHoursLabel = minutesToHoursLabel(metrics.totalPlannedMinutes);
  const completedHoursLabel = minutesToHoursLabel(metrics.completedMinutes);
  const blocksPercent =
    blockCount > 0 ? Math.round((metrics.completedSessions / blockCount) * 100) : 0;

  const heroContext = useMemo(() => buildDashboardHeroFromMetrics(metrics), [metrics]);

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
    <div className="planner-fade-up space-y-3 pb-1">
      <header className="space-y-1">
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">Semana en marcha</h2>
        <p className="max-w-lg text-[13px] leading-relaxed text-slate-600">
          Tu plan semanal ya está activo. Empieza por la próxima sesión y marca tu progreso.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Estado actual
          </p>
          <span className="text-[13px] font-semibold text-[#0f1a33]">
            {progressPercent}%
          </span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90 transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill label="Progreso semanal" value={`${Math.round(completion.completionPercent)}%`} />
          <StatPill label="Horas planificadas" value={plannedHoursLabel} />
          <StatPill label="Bloques" value={String(blockCount)} />
          <StatPill label="Completados" value={String(metrics.completedSessions)} />
        </div>
      </section>

      <SessionHeroCard
        context={heroContext}
        coachTone={{ emotionalLine: "" }}
        suppressCoachHeader
        onPrimaryAction={handleHeroPrimaryAction}
        onLogToday={onGoToLog}
        onViewPlan={onViewPlan}
        onViewEvaluation={onGoToEvaluation}
      />

      {nextExam ? (
        <p className="rounded-lg border border-[#c9a454]/25 bg-[#fffdf8] px-3 py-2 text-[13px] text-slate-700">
          <span className="font-semibold text-[#7a5a16]">Próximo examen:</span>{" "}
          {nextExam.subjectName} · {nextExam.daysLabel}
        </p>
      ) : onGoToSubjects ? (
        <button
          type="button"
          onClick={onGoToSubjects}
          className="text-left text-[13px] font-medium text-slate-500 underline-offset-2 hover:text-[#7a5a16] hover:underline"
        >
          Añadir fecha de examen
        </button>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Hoy
          </p>
          {todaySessions.length === 0 ? (
            <p className="text-[13px] text-slate-500">No tienes bloques planificados para hoy.</p>
          ) : (
            <ul className="space-y-1.5">
              {todaySessions.map((session) => (
                <TodayTimelineItem key={session.id} session={session} onOpen={onOpenSession} />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Progreso
          </p>
          <div className="space-y-3">
            <ProgressRow
              label="Esta semana"
              value={`${completedHoursLabel} / ${plannedHoursLabel}`}
              percent={progressPercent}
            />
            <ProgressRow
              label="Bloques completados"
              value={`${metrics.completedSessions} / ${blockCount}`}
              percent={blocksPercent}
            />
            <ProgressRow
              label="Asignaturas tocadas"
              value={`${metrics.activeSubjectsTouched} / ${subjects.length}`}
              percent={
                subjects.length > 0
                  ? Math.round((metrics.activeSubjectsTouched / subjects.length) * 100)
                  : 0
              }
            />
          </div>
        </section>
      </div>

      {alerts.length > 0 ? (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2.5">
          <WeekAlertsCompact alerts={alerts} />
        </div>
      ) : positiveMessage ? (
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-3 py-2.5 text-[13px] font-medium text-emerald-900">
          {positiveMessage}
        </div>
      ) : null}

      <PulseLine parts={pulseParts} alert={null} />
    </div>
  );
}
