"use client";

import { useMemo } from "react";
import {
  DASHBOARD_WEEK_BADGE_TONE_CLASS,
  getDashboardWeekBadge,
  getDashboardWeekEncouragement,
} from "@/lib/study-planner/dashboard-week-badge";
import {
  getPlannerMetrics,
  getTodayDateString,
  type WeeklyPlanCompletion,
} from "@/lib/study-planner/calculations";

type DashboardWeeklyProgressProps = {
  completion: WeeklyPlanCompletion;
  planMetaLine: string;
};

export function DashboardWeeklyProgress({
  completion,
  planMetaLine,
}: DashboardWeeklyProgressProps) {
  const today = getTodayDateString();

  const metrics = useMemo(
    () =>
      getPlannerMetrics(completion.weekSessions, {
        today,
        studySessions: completion.weekLoggedSessions,
      }),
    [completion.weekSessions, completion.weekLoggedSessions, today],
  );

  const progressPercent = Math.round(completion.completionPercent);
  const blockCount = metrics.totalPlannedSessions;
  const badge = getDashboardWeekBadge(completion.weeklyStatus, progressPercent);
  const encouragement = getDashboardWeekEncouragement({
    completionPercent: progressPercent,
    completedSessions: metrics.completedSessions,
    totalPlannedSessions: blockCount,
    weeklyStatus: completion.weeklyStatus,
    todayPendingCount: metrics.todayPendingSessions,
  });

  return (
    <div className="space-y-1">
      <section
        className="rounded-xl bg-gradient-to-br from-[#fff9ee] via-[#fffdf8] to-white px-3 py-2.5 ring-1 ring-[#c9a454]/18"
        aria-label="Progreso semanal"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-[#7a5a16]/85">Tu semana</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${DASHBOARD_WEEK_BADGE_TONE_CLASS[badge.tone]}`}
          >
            {badge.label}
          </span>
        </div>

        <p className="mt-1.5 leading-tight text-[#0f1a33]">
          <span className="text-[26px] font-semibold tabular-nums tracking-tight">
            {progressPercent}
          </span>
          <span className="ml-1 text-[13px] font-medium text-slate-600">
            % completado esta semana
          </span>
        </p>

        <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{encouragement}</p>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e0d0]/45">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c9a454] via-[#ddb75c] to-[#e5c878] transition-[width] duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <p className="mt-1.5 text-[11px] text-slate-600">
          <span className="font-semibold tabular-nums text-[#0f1a33]">
            {metrics.completedSessions}
          </span>
          <span className="text-slate-400"> de </span>
          <span className="font-semibold tabular-nums text-[#0f1a33]">{blockCount}</span>
          <span> bloques completados</span>
        </p>

        <p className="mt-2 border-t border-[#c9a454]/12 pt-1.5 text-[10px] leading-snug text-slate-500">
          {planMetaLine}
        </p>
      </section>
    </div>
  );
}
