"use client";

import { useMemo } from "react";
import { Calendar, CalendarClock } from "lucide-react";
import type { PlannedStudySession, StudySession } from "@/lib/study-planner/types";
import {
  calculateWeeklyPlanCompletion,
  formatShortDate,
  getDayShortLabel,
  minutesToHoursLabel,
  type WeeklyPlanCompletion,
  type WeeklyPlanStatus,
} from "@/lib/study-planner/calculations";
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
import { buildWeeklyPlanAlerts, type WeeklyPlanAlert } from "@/lib/study-planner/weekly-alerts";
import { plannerBtnPrimary, plannerEmptyState, plannerMetricCard } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

export type WeeklyPlanDashboardProps = {
  plannedSessions: PlannedStudySession[];
  studySessions?: StudySession[];
  weeklyGoalMinutes: number;
  onGoToCalendar?: () => void;
  /** Oculta alertas (se muestran en otra sección del dashboard). */
  hideAlerts?: boolean;
  /** Oculta próxima sesión (se muestra en “Qué hacer ahora”). */
  hideNextSession?: boolean;
  /** Oculta CTA (el padre puede ponerlo en otra zona). */
  hideCta?: boolean;
  compact?: boolean;
};

export function weeklyStatusTone(status: WeeklyPlanStatus): string {
  switch (status) {
    case "ahead":
      return "border-sky-200/90 bg-sky-50/90 text-sky-900";
    case "on_track":
      return "border-emerald-200/90 bg-emerald-50/90 text-emerald-900";
    case "slightly_behind":
      return "border-amber-200/90 bg-amber-50/90 text-amber-950";
    case "behind":
      return "border-orange-200/90 bg-orange-50/90 text-orange-950";
    case "critical":
      return "border-red-200/90 bg-red-50/90 text-red-900";
  }
}

function progressTarget(completion: WeeklyPlanCompletion): number {
  return completion.hasPlan ? completion.plannedMinutes : completion.targetMinutes;
}

function WeekProgressBar({ completion }: { completion: WeeklyPlanCompletion }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#c9a454] to-[#ddb75c] transition-all"
        style={{ width: `${Math.min(100, completion.completionPercent)}%` }}
      />
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#0f1a33]/40"
        style={{ left: `${Math.min(100, completion.expectedProgressPercent)}%` }}
      />
    </div>
  );
}

export function getNextPlannedSession(completion: WeeklyPlanCompletion) {
  return completion.upcomingSessions[0] ?? null;
}

export function useWeeklyDashboardData(
  plannedSessions: PlannedStudySession[],
  studySessions: StudySession[],
  weeklyGoalMinutes: number,
) {
  const completion = useMemo(
    () => calculateWeeklyPlanCompletion(plannedSessions, studySessions, weeklyGoalMinutes),
    [plannedSessions, studySessions, weeklyGoalMinutes],
  );

  const alerts = useMemo(
    () =>
      buildWeeklyPlanAlerts({
        completion,
        plannedSessions,
        studySessions,
      }),
    [completion, plannedSessions, studySessions],
  );

  return { completion, alerts };
}

export function formatNextSessionLine(session: NonNullable<ReturnType<typeof getNextPlannedSession>>) {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  return {
    subjectName,
    meta: `${getDayShortLabel(session.date)} ${formatShortDate(session.date)}${session.startTime ? ` · ${session.startTime}` : ""} · ${session.plannedDurationMinutes} min`,
    type: getSessionTypeLabel(session.type),
  };
}

export function WeekAlertsCompact({ alerts }: { alerts: WeeklyPlanAlert[] }) {
  const important = alerts.filter((a) => a.severity !== "info").slice(0, 4);
  if (important.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {important.map((alert) => (
        <li
          key={alert.id}
          className={`max-w-full rounded-full px-2.5 py-1 text-[11px] font-medium leading-snug ${
            alert.severity === "risk"
              ? "bg-red-50 text-red-900 ring-1 ring-red-200/80"
              : "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80"
          }`}
        >
          {alert.message}
        </li>
      ))}
    </ul>
  );
}

function WeekMetrics({ completion, compact }: { completion: WeeklyPlanCompletion; compact?: boolean }) {
  const target = progressTarget(completion);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p
          className={`font-semibold tabular-nums text-[#0f1a33] ${
            compact ? "text-[1.5rem] leading-none" : "text-[1.65rem] leading-none sm:text-[1.85rem]"
          }`}
        >
          {minutesToHoursLabel(completion.totalCreditedMinutes)}
          <span className="text-base font-medium text-slate-500">
            {" "}
            / {minutesToHoursLabel(target || completion.weeklyGoalMinutes)}
          </span>
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
          <span>{completion.completionPercent}%</span>
          <span>·</span>
          <span>Objetivo hoy {completion.expectedProgressPercent}%</span>
          {completion.referenceHint ? (
            <>
              <span>·</span>
              <span className="text-sky-800">Sin plan · objetivo semanal</span>
            </>
          ) : null}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${weeklyStatusTone(completion.weeklyStatus)}`}
      >
        {completion.statusMessage}
      </span>
    </div>
  );
}

export function WeeklyPlanDashboard({
  plannedSessions,
  studySessions = [],
  weeklyGoalMinutes,
  onGoToCalendar,
  hideAlerts = false,
  hideNextSession = false,
  hideCta = false,
  compact = true,
}: WeeklyPlanDashboardProps) {
  const { completion, alerts } = useWeeklyDashboardData(
    plannedSessions,
    studySessions,
    weeklyGoalMinutes,
  );

  if (completion.status === "no_plan") {
    return (
      <section className={`${plannerMetricCard} border-[#0f1a33]/10`}>
        <div className={plannerEmptyState.replace("rounded-xl ", "").replace("py-8", "py-5")}>
          <CalendarClock className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
          <p className="mt-2 text-[14px] font-semibold text-[#0f1a33]">Sin plan esta semana</p>
          {completion.weeklyGoalMinutes > 0 ? (
            <p className="mt-1 text-[12px] text-[#7a5a16]">
              Objetivo {minutesToHoursLabel(completion.weeklyGoalMinutes)}
            </p>
          ) : null}
        </div>
        {!hideCta && onGoToCalendar ? (
          <button type="button" onClick={onGoToCalendar} className={`${plannerBtnPrimary} mt-3 w-full`}>
            <Calendar className="mr-1.5 h-4 w-4" aria-hidden />
            Ver calendario
          </button>
        ) : null}
        {!hideAlerts ? <div className="mt-3"><WeekAlertsCompact alerts={alerts} /></div> : null}
      </section>
    );
  }

  const next = getNextPlannedSession(completion);

  return (
    <section className={`${plannerMetricCard} border-[#0f1a33]/10`}>
      <WeekMetrics completion={completion} compact={compact} />
      <div className="mt-3">
        <WeekProgressBar completion={completion} />
      </div>
      {!hideNextSession && next ? (
        <p className="mt-2 text-[12px] text-slate-600">
          <span className="font-semibold text-[#0f1a33]">
            {formatNextSessionLine(next).subjectName}
          </span>{" "}
          · {formatNextSessionLine(next).meta}
        </p>
      ) : null}
      {!hideCta && onGoToCalendar ? (
        <button type="button" onClick={onGoToCalendar} className={`${plannerBtnPrimary} mt-3 w-full sm:w-auto`}>
          <Calendar className="mr-1.5 h-4 w-4" aria-hidden />
          Ver calendario
        </button>
      ) : null}
      {!hideAlerts ? <div className="mt-3"><WeekAlertsCompact alerts={alerts} /></div> : null}
    </section>
  );
}
