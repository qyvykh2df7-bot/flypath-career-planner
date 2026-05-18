"use client";

import type { ReactNode } from "react";
import type { MockResult, StudyMode, StudySession, StudySubject } from "@/lib/study-planner/types";
import {
  READINESS_LEVEL_LABELS,
  calculateMinutesByDate,
  calculateMinutesBySubject,
  calculateReadinessForSubjects,
  calculateTotalStudyMinutes,
  calculateWeeklyCompletionPercentage,
  formatMockScore,
  formatShortDate,
  getDayShortLabel,
  getLastNDays,
  getLeastStudiedSubjectId,
  getMostStudiedSubjectId,
  getSessionsForCurrentWeek,
  getWeeklyGoalStatusMessage,
  minutesToHoursLabel,
  sortMocksByDateDesc,
  sortReadinessForDisplay,
} from "@/lib/study-planner/calculations";
import { getSubjectById } from "@/lib/study-planner/subjects";

type StudyProgressChartsProps = {
  mode: StudyMode;
  sessions: StudySession[];
  mockResults: MockResult[];
  subjects: StudySubject[];
  weeklyGoalMinutes: number;
};

function ProgressBar({
  value,
  max,
  variant = "navy",
}: {
  value: number;
  max: number;
  variant?: "navy" | "gold";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill =
    variant === "gold"
      ? "bg-gradient-to-r from-[#c9a454] to-[#ddb75c]"
      : "bg-gradient-to-r from-[#0f1a33] to-[#1a2d52]";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="presentation">
      <div
        className={`h-full rounded-full transition-all ${fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
      <h4 className="text-[15px] font-semibold text-[#0f1a33]">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[14px] text-slate-600">
      {message}
    </p>
  );
}

export function StudyProgressCharts({
  mode,
  sessions,
  mockResults,
  subjects,
  weeklyGoalMinutes,
}: StudyProgressChartsProps) {
  const last7 = getLastNDays(7);
  const minutesByDay = calculateMinutesByDate(sessions, last7);
  const maxDayMinutes = Math.max(0, ...Object.values(minutesByDay));
  const hasAnySession = sessions.length > 0;

  const minutesBySubject = calculateMinutesBySubject(sessions);
  const subjectRows = subjects
    .map((s) => ({ subject: s, minutes: minutesBySubject[s.id] ?? 0 }))
    .filter((row) => row.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
  const maxSubjectMinutes = subjectRows[0]?.minutes ?? 0;

  const weekSessions = getSessionsForCurrentWeek(sessions);
  const weekMinutes = calculateTotalStudyMinutes(weekSessions);
  const weekPct = calculateWeeklyCompletionPercentage(weekMinutes, weeklyGoalMinutes);
  const weekPctRaw =
    weeklyGoalMinutes > 0 ? Math.round((weekMinutes / weeklyGoalMinutes) * 100) : 0;
  const weekStatus = getWeeklyGoalStatusMessage(weekPctRaw);

  const last7Minutes = calculateMinutesByDate(sessions, last7);
  const totalLast7 = calculateTotalStudyMinutes(
    sessions.filter((s) => last7.includes(s.date)),
  );
  const daysStudied = last7.filter((d) => (last7Minutes[d] ?? 0) > 0).length;
  let bestDayDate: string | null = null;
  let bestDayMinutes = 0;
  for (const d of last7) {
    const m = last7Minutes[d] ?? 0;
    if (m > bestDayMinutes) {
      bestDayMinutes = m;
      bestDayDate = d;
    }
  }

  const mostId = getMostStudiedSubjectId(sessions);
  const leastId = getLeastStudiedSubjectId(sessions, subjects.map((s) => s.id));
  const leastMinutes = leastId ? (minutesBySubject[leastId] ?? 0) : 0;

  const recentMocks = sortMocksByDateDesc(mockResults).slice(0, 5);

  const readinessRows = sortReadinessForDisplay(
    calculateReadinessForSubjects({
      subjectIds: subjects.map((s) => s.id),
      sessions,
      mockResults,
    }),
  ).filter((r) => r.level !== "no_data");

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Horas por día (últimos 7 días)">
        {!hasAnySession ? (
          <EmptyState message="Registra sesiones para ver tus horas por día." />
        ) : (
          <ul className="space-y-3">
            {last7.map((date) => {
              const minutes = minutesByDay[date] ?? 0;
              return (
                <li key={date}>
                  <div className="flex items-center justify-between gap-2 text-[14px]">
                    <span className="font-medium text-[#0f1a33]">
                      {getDayShortLabel(date)} · {formatShortDate(date)}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-600">
                      {minutesToHoursLabel(minutes)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={minutes} max={maxDayMinutes || 1} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      <ChartCard title="Horas por asignatura">
        {subjectRows.length === 0 ? (
          <EmptyState message="Todavía no hay horas registradas por asignatura." />
        ) : (
          <ul className="space-y-3">
            {subjectRows.map(({ subject, minutes }) => (
              <li key={subject.id}>
                <div className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="min-w-0 truncate font-medium text-[#0f1a33]">{subject.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-600">
                    {minutesToHoursLabel(minutes)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={minutes} max={maxSubjectMinutes} variant="gold" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>

      <ChartCard title="Objetivo semanal">
        <p className="text-lg font-semibold tabular-nums text-[#0f1a33]">
          {minutesToHoursLabel(weekMinutes)} / {minutesToHoursLabel(weeklyGoalMinutes)} · {weekPctRaw}%
        </p>
        <p className="mt-2 text-[14px] text-slate-600">{weekStatus}</p>
        <div className="mt-4">
          <ProgressBar value={weekMinutes} max={weeklyGoalMinutes || 1} variant="gold" />
        </div>
        <p className="mt-2 text-[12px] text-slate-500">
          Modo {mode.toUpperCase()} · semana actual (lunes a domingo)
        </p>
      </ChartCard>

      <ChartCard title="Resumen de consistencia">
        {!hasAnySession ? (
          <EmptyState message="Registra sesiones para ver tu consistencia." />
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <ConsistencyItem label="Días estudiados (7 días)" value={`${daysStudied} / 7`} />
            <ConsistencyItem label="Total horas (7 días)" value={minutesToHoursLabel(totalLast7)} />
            <ConsistencyItem
              label="Mejor día de estudio"
              value={
                bestDayDate
                  ? `${getDayShortLabel(bestDayDate)} · ${minutesToHoursLabel(bestDayMinutes)}`
                  : "—"
              }
            />
            <ConsistencyItem
              label="Asignatura más trabajada"
              value={
                mostId
                  ? (getSubjectById(mostId)?.name ?? mostId)
                  : "Sin datos suficientes"
              }
            />
            <ConsistencyItem
              label="Asignatura menos tocada"
              value={
                leastId
                  ? leastMinutes === 0
                    ? `${getSubjectById(leastId)?.name ?? leastId} · Sin tocar todavía`
                    : (getSubjectById(leastId)?.name ?? leastId)
                  : "Sin datos suficientes"
              }
              className="sm:col-span-2"
            />
          </dl>
        )}
      </ChartCard>

      <ChartCard title="Evolución de mocks">
        {recentMocks.length === 0 ? (
          <EmptyState message="Registra mocks para ver tu evolución de notas." />
        ) : (
          <ul className="space-y-3">
            {recentMocks.map((mock) => (
              <li key={mock.id}>
                <div className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="min-w-0 truncate font-medium text-[#0f1a33]">
                    {getSubjectById(mock.subjectId)?.name ?? mock.subjectId}
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-slate-700">
                    {formatMockScore(mock.score)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-slate-500">{mock.date}</p>
                <div className="mt-1.5">
                  <ProgressBar value={mock.score} max={100} variant="gold" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>

      <ChartCard title="Readiness por asignatura">
        {readinessRows.length === 0 ? (
          <EmptyState message="Registra horas o mocks para ver readiness orientativo por asignatura." />
        ) : (
          <ul className="space-y-3">
            {readinessRows.map((row) => (
              <li key={row.subjectId}>
                <div className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="min-w-0 truncate font-medium text-[#0f1a33]">
                    {getSubjectById(row.subjectId)?.name ?? row.subjectId}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-slate-600">
                    {READINESS_LEVEL_LABELS[row.level]}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[13px]">
                  <span className="tabular-nums text-slate-600">{row.score}/100</span>
                  <span className="text-[11px] text-slate-400">orientativo</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={row.score} max={100} variant="navy" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}

function ConsistencyItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 ${className}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-[#0f1a33]">{value}</dd>
    </div>
  );
}
