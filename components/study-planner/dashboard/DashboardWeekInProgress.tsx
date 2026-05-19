"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { ExamDate, PlannedStudySession, StudyMode, StudySubject } from "@/lib/study-planner/types";
import { normalizePlannedSessionStatus } from "@/lib/study-planner/planner-session-status";
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
import { EvaluationDashboardLine } from "../evaluation/EvaluationDashboardLine";
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

function TodayTimelineItem({
  session,
  onOpen,
}: {
  session: PlannedStudySession;
  onOpen: (session: PlannedStudySession) => void;
}) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const time = session.startTime ?? "—";
  const status = normalizePlannedSessionStatus(session.status) ?? "pending";
  const isDone = status === "completed";
  const isSkipped = status === "skipped";
  const isInProgress = status === "in_progress";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(session)}
        className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[12px] transition hover:shadow-sm ${
          isDone
            ? "border-emerald-200/80 bg-emerald-50/60"
            : isSkipped
              ? "border-amber-200/60 bg-amber-50/40"
              : isInProgress
                ? "border-[#c9a454]/30 bg-[#fffdf8]"
                : "border-slate-200/80 bg-white hover:border-slate-300"
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
          className={`min-w-0 flex-1 font-medium leading-snug ${isDone ? "text-emerald-900 line-through decoration-emerald-300/80" : isSkipped ? "text-slate-600" : "text-[#0f1a33]"}`}
        >
          {subjectName}
        </span>
        {isSkipped ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200/70">
            Saltada
          </span>
        ) : isInProgress ? (
          <span className="shrink-0 rounded-full bg-[#e8eef8] px-1.5 py-0.5 text-[10px] font-semibold text-[#0f1a33] ring-1 ring-[#0f1a33]/10">
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
        <h3 className="text-[16px] font-semibold tracking-tight text-[#0f1a33]">Semana en marcha</h3>
        <p className="max-w-lg text-[13px] leading-relaxed text-slate-600">
          Tu plan semanal ya está activo. Empieza por la próxima sesión y marca tu progreso.
        </p>
      </header>


      <SessionHeroCard
        context={heroContext}
        coachTone={{ emotionalLine: "" }}
        suppressCoachHeader
        onPrimaryAction={handleHeroPrimaryAction}
        onLogToday={onGoToLog}
        onViewPlan={onViewPlan}
        onViewEvaluation={onGoToEvaluation ? () => onGoToEvaluation() : undefined}
      />

      {evaluationLine ? (
        <EvaluationDashboardLine
          line={evaluationLine}
          showEmptyCta={false}
          onGoToEvaluation={onGoToEvaluation ? () => onGoToEvaluation() : undefined}
        />
      ) : null}

      {nextExam ? (
        <p className="rounded-lg border border-[#c9a454]/25 bg-[#fffdf8] px-3 py-2 text-[13px] text-slate-700">
          <span className="font-semibold text-[#7a5a16]">Próximo examen:</span>{" "}
          {nextExam.subjectName} · {nextExam.daysLabel}
        </p>
      ) : showEvaluationEmptyCta || onGoToSubjects ? (
        <div className="flex flex-wrap items-center gap-2">
          {showEvaluationEmptyCta && onGoToEvaluation ? (
            <button
              type="button"
              onClick={() =>
                onGoToEvaluation({ section: "mocks", focusMockForm: true })
              }
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-100/60 transition hover:border-[#c9a454]/35 hover:bg-[#fffdf8] hover:text-[#7a5a16]"
            >
              Registrar simulacro de examen
            </button>
          ) : null}
          {!nextExam && onGoToSubjects ? (
            <button
              type="button"
              onClick={() => onGoToSubjects({ openExamDatesForm: true })}
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-100/60 transition hover:border-[#c9a454]/35 hover:bg-[#fffdf8] hover:text-[#7a5a16]"
            >
              Añadir fecha de examen
            </button>
          ) : null}
        </div>
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
