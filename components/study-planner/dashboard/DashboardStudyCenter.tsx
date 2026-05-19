"use client";

import { useMemo } from "react";
import { BookOpen, Calendar, Clock, Target } from "lucide-react";
import type { StudyMode } from "@/lib/study-planner/types";
import {
  getPlannerMetrics,
  getTodayDateString,
  minutesToHoursLabel,
  type WeeklyPlanCompletion,
} from "@/lib/study-planner/calculations";

type DashboardStudyCenterProps = {
  mode: StudyMode;
  weeklyGoalMinutes: number;
  subjectCount: number;
  targetExamDate?: string;
  /** Si hay plan activo, muestra métricas semanales en Estado actual */
  completion?: WeeklyPlanCompletion | null;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatGoalDate(iso?: string): string {
  if (!iso) return "Sin fecha objetivo";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatTodayBlocks(count: number): string {
  if (count === 1) return "1 bloque";
  return `${count} bloques`;
}

/** Configuración del planner (fila superior). */
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-50/90 px-2.5 py-2 ring-1 ring-slate-100/80">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#a5802a]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-[#0f1a33]">{value}</p>
      </div>
    </div>
  );
}

/** Actividad semanal (fila inferior: mini-cards legibles, sin iconos). */
function WeekStatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200/70 bg-slate-50/90 px-2 py-1.5 ring-1 ring-slate-100/60">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-semibold leading-tight text-slate-700">
        {value}
      </p>
    </div>
  );
}

export function DashboardStudyCenter({
  mode,
  weeklyGoalMinutes,
  subjectCount,
  targetExamDate,
  completion = null,
}: DashboardStudyCenterProps) {
  const modeLabel = mode === "atpl" ? "ATPL" : "PPL";
  const hasActivePlan = completion?.hasPlan === true;
  const today = getTodayDateString();
  const hoursLabel = minutesToHoursLabel(Math.max(0, weeklyGoalMinutes));

  const metrics = useMemo(() => {
    if (!hasActivePlan || !completion) return null;
    return getPlannerMetrics(completion.weekSessions, {
      today,
      studySessions: completion.weekLoggedSessions,
    });
  }, [hasActivePlan, completion, today]);

  const weeklyProgressPercent =
    hasActivePlan && completion ? Math.round(completion.completionPercent) : 0;
  const eyebrow = hasActivePlan ? "Centro de estudio" : "Tu planner está listo";

  return (
    <header className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a5802a]">
          {eyebrow}
        </p>
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">
          Centro de estudio {modeLabel}
        </h2>
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Estado actual
          </p>
          <span className="text-[13px] font-semibold text-[#0f1a33]">
            {hasActivePlan ? `${weeklyProgressPercent}%` : "0%"}
          </span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90 transition-[width] duration-500"
            style={{ width: `${hasActivePlan ? weeklyProgressPercent : 0}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill icon={Clock} label="Horas objetivo" value={hoursLabel} />
          <StatPill icon={BookOpen} label="Asignaturas" value={`${subjectCount} activas`} />
          <StatPill icon={Calendar} label="Objetivo" value={formatGoalDate(targetExamDate)} />
          <StatPill icon={Target} label="Programa" value={modeLabel} />
        </div>

        {hasActivePlan && metrics && completion ? (
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5 sm:grid-cols-4">
            <WeekStatPill label="Progreso semanal" value={`${weeklyProgressPercent}%`} />
            <WeekStatPill label="Bloques" value={String(metrics.totalPlannedSessions)} />
            <WeekStatPill label="Completados" value={String(metrics.completedSessions)} />
            <WeekStatPill
              label="Hoy"
              value={formatTodayBlocks(metrics.todaySessions.length)}
            />
          </div>
        ) : null}
      </section>
    </header>
  );
}
