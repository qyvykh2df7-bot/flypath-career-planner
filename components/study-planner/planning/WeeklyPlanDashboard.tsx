"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarCheck, CalendarClock, Sparkles } from "lucide-react";
import type { PlannedStudySession, StudySession } from "@/lib/study-planner/types";
import {
  calculateWeeklyPlanCompletion,
  formatShortDate,
  getDayShortLabel,
  minutesToHoursLabel,
  type WeeklyPlanStatus,
} from "@/lib/study-planner/calculations";
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
import { buildWeeklyPlanAlerts } from "@/lib/study-planner/weekly-alerts";
import {
  plannerBtnPrimary,
  plannerEmptyState,
  plannerMetricCard,
  plannerSectionHeading,
} from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type WeeklyPlanDashboardProps = {
  plannedSessions: PlannedStudySession[];
  studySessions?: StudySession[];
  weeklyGoalMinutes: number;
  onGoToCalendar?: () => void;
};

function weeklyStatusTone(status: WeeklyPlanStatus): string {
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

function alertSeverityClass(severity: "info" | "warn" | "risk"): string {
  switch (severity) {
    case "risk":
      return "border-red-200/90 bg-red-50/90 text-red-900";
    case "warn":
      return "border-amber-200/90 bg-amber-50/90 text-amber-950";
    default:
      return "border-slate-200/90 bg-slate-50/90 text-slate-700";
  }
}

export function WeeklyPlanDashboard({
  plannedSessions,
  studySessions = [],
  weeklyGoalMinutes,
  onGoToCalendar,
}: WeeklyPlanDashboardProps) {
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

  if (completion.status === "no_plan") {
    return (
      <section className={plannerEmptyState}>
        <CalendarClock className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
        <p className="mt-2 text-[15px] font-semibold text-[#0f1a33]">
          Aún no tienes plan para esta semana
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          Genera un plan automático o añade sesiones manualmente en el calendario.
        </p>
        {completion.weeklyGoalMinutes > 0 ? (
          <p className="mt-3 text-[14px] font-medium text-[#0f1a33]">
            Tu objetivo semanal actual es{" "}
            <span className="text-[#7a5a16]">{minutesToHoursLabel(completion.weeklyGoalMinutes)}</span>.
          </p>
        ) : null}
        {onGoToCalendar ? (
          <button type="button" onClick={onGoToCalendar} className={`${plannerBtnPrimary} mt-4`}>
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
            Generar plan semanal
          </button>
        ) : null}
      </section>
    );
  }

  if (completion.status === "goal_without_plan") {
    const goalDeltaLabel =
      completion.progressDelta > 0
        ? `+${completion.progressDelta} pts vs esperado`
        : `${completion.progressDelta} pts vs esperado`;

    return (
      <section className={`${plannerMetricCard} border-sky-200/40 bg-gradient-to-br from-white to-sky-50/30`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className={plannerSectionHeading}>Plan de esta semana</h3>
            {completion.referenceHint ? (
              <p className="mt-1 text-[13px] font-medium text-sky-900">{completion.referenceHint}</p>
            ) : null}
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${weeklyStatusTone(completion.weeklyStatus)}`}
          >
            {completion.statusMessage}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Objetivo semanal
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#0f1a33]">
              {minutesToHoursLabel(completion.targetMinutes)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Registrado real
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#0f1a33]">
              {minutesToHoursLabel(completion.actualLoggedMinutes)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Crédito total
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#c9a454]">
              {minutesToHoursLabel(completion.totalCreditedMinutes)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Esperado hoy: {minutesToHoursLabel(completion.expectedMinutesByToday)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Cumplimiento
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#0f1a33]">
              {completion.completionPercent}%
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Objetivo hoy: {completion.expectedProgressPercent}%
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ritmo</p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-700">{goalDeltaLabel}</p>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-500">
            <span>Registrado vs objetivo semanal</span>
            <span>Esperado hoy ({completion.expectedProgressPercent}%)</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#c9a454] to-[#ddb75c] transition-all"
              style={{ width: `${Math.min(100, completion.completionPercent)}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#0f1a33]/50"
              style={{ left: `${Math.min(100, completion.expectedProgressPercent)}%` }}
              title={`Objetivo acumulado: ${completion.expectedProgressPercent}%`}
            />
          </div>
        </div>

        {alerts.length > 0 ? (
          <div className="mt-4 rounded-lg border border-slate-200/90 bg-[#f8fafc] p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-600">
                Alertas de esta semana
              </p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`rounded-lg border px-3 py-2 text-[13px] ${alertSeverityClass(alert.severity)}`}
                >
                  {alert.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {onGoToCalendar ? (
          <button type="button" onClick={onGoToCalendar} className={`${plannerBtnPrimary} mt-4`}>
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
            Generar plan semanal
          </button>
        ) : null}
      </section>
    );
  }

  const deltaLabel =
    completion.progressDelta > 0
      ? `+${completion.progressDelta} pts vs esperado`
      : `${completion.progressDelta} pts vs esperado`;

  return (
    <section className={`${plannerMetricCard} border-[#0f1a33]/8`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f1a33]/5 text-[#0f1a33]">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </div>
          <h3 className={plannerSectionHeading}>Plan de esta semana</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${weeklyStatusTone(completion.weeklyStatus)}`}
        >
          {completion.statusMessage}
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-slate-500">
        Usamos el mayor valor entre bloques completados y estudio registrado para evitar duplicar
        horas.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Planificado</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#0f1a33]">
            {minutesToHoursLabel(completion.plannedMinutes)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Completado (calendario)
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#0f1a33]">
            {minutesToHoursLabel(completion.completedPlannedMinutes)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Registrado real
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#0f1a33]">
            {minutesToHoursLabel(completion.actualLoggedMinutes)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Crédito total
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#c9a454]">
            {minutesToHoursLabel(completion.totalCreditedMinutes)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Esperado hoy: {minutesToHoursLabel(completion.expectedMinutesByToday)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cumplimiento</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-[#0f1a33]">
            {completion.completionPercent}%
          </p>
          <p className="text-[11px] text-slate-500">
            Objetivo acumulado hoy: {completion.expectedProgressPercent}%
          </p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ritmo</p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-700">{deltaLabel}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            <span className="text-[#0f1a33]">{completion.pendingCount}</span> pend. ·{" "}
            <span className="text-emerald-800">{completion.completedCount}</span> hechos ·{" "}
            <span className="text-slate-500">{completion.skippedCount}</span> salt.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[11px] font-medium text-slate-500">
          <span>Crédito total vs plan</span>
          <span>Esperado hoy ({completion.expectedProgressPercent}%)</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#c9a454] to-[#ddb75c] transition-all"
            style={{ width: `${Math.min(100, completion.completionPercent)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#0f1a33]/50"
            style={{ left: `${Math.min(100, completion.expectedProgressPercent)}%` }}
            title={`Objetivo acumulado: ${completion.expectedProgressPercent}%`}
          />
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="mt-4 rounded-lg border border-slate-200/90 bg-[#f8fafc] p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-600">
              Alertas de esta semana
            </p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-lg border px-3 py-2 text-[13px] ${alertSeverityClass(alert.severity)}`}
              >
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {completion.upcomingSessions.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
            Próximas sesiones
          </p>
          <ul className="mt-2 space-y-2">
            {completion.upcomingSessions.map((session) => {
              const subjectName =
                getSubjectById(session.subjectId)?.name ?? session.subjectId;
              return (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-[#f8fafc] px-3 py-2 text-[13px]"
                >
                  <span className="font-medium text-[#0f1a33]">{subjectName}</span>
                  <span className="text-slate-600">
                    {getDayShortLabel(session.date)} {formatShortDate(session.date)}
                    {session.startTime ? ` · ${session.startTime}` : ""} ·{" "}
                    {session.plannedDurationMinutes} min · {getSessionTypeLabel(session.type)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : completion.pendingCount === 0 ? (
        <p className="mt-3 text-[13px] text-slate-500">
          No quedan bloques pendientes esta semana.
        </p>
      ) : null}

      {onGoToCalendar ? (
        <button
          type="button"
          onClick={onGoToCalendar}
          className="mt-3 text-[13px] font-semibold text-[#7a5a16] underline-offset-2 hover:underline"
        >
          Ver calendario semanal
        </button>
      ) : null}
    </section>
  );
}
