"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { StudyMode } from "@/lib/study-planner/types";
import { minutesToHoursLabel } from "@/lib/study-planner/calculations";
import { plannerBtnHero } from "@/lib/study-planner/planner-ui";

type DashboardMissionControlProps = {
  mode: StudyMode;
  weeklyGoalMinutes: number;
  subjectCount: number;
  targetExamDate?: string;
  onGeneratePlan: () => void;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatGoalDate(iso?: string): string {
  if (!iso) return "Sin fecha objetivo";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

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
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a5802a]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-[12px] font-medium text-[#0f1a33]">{value}</p>
      </div>
    </div>
  );
}

function HelpMini({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5 ring-1 ring-slate-100/60">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff8e8] ring-1 ring-[#c9a454]/20">
        <Icon className="h-3.5 w-3.5 text-[#a5802a]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[#0f1a33]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function DashboardMissionControl({
  mode,
  weeklyGoalMinutes,
  subjectCount,
  targetExamDate,
  onGeneratePlan,
}: DashboardMissionControlProps) {
  const hoursLabel = minutesToHoursLabel(Math.max(0, weeklyGoalMinutes));
  const modeLabel = mode === "atpl" ? "ATPL" : "PPL";
  const weeklyHours = Math.round(weeklyGoalMinutes / 60);

  return (
    <div className="planner-fade-up space-y-3 pb-1">
      <header className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a5802a]">
          Tu planner está listo
        </p>
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">
          Centro de estudio {modeLabel}
        </h2>
      </header>

      {/* A — Estado actual */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Estado actual
          </p>
          <span className="text-[13px] font-semibold text-[#0f1a33]">0%</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200/70">
          <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill icon={Clock} label="Horas/semana" value={hoursLabel} />
          <StatPill
            icon={BookOpen}
            label="Asignaturas"
            value={`${subjectCount} activas`}
          />
          <StatPill icon={Calendar} label="Objetivo" value={formatGoalDate(targetExamDate)} />
          <StatPill icon={Target} label="Programa" value={modeLabel} />
        </div>
      </section>

      {/* B — Acción principal */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0f1a33] px-5 py-5 shadow-[0_16px_44px_rgba(15,26,51,0.18)] ring-1 ring-white/[0.08] sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#c9a454]/[0.08] via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/30">
              <Sparkles className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
            </span>
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight text-white sm:text-[18px]">
                Organiza tu primera semana
              </h3>
              <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-slate-300/95">
                El planner repartirá tus horas entre teoría, banco, repasos y mocks para que
                sepas qué estudiar cada día.
              </p>
            </div>
          </div>
          <button type="button" onClick={onGeneratePlan} className={plannerBtnHero}>
            Generar plan semanal
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* C — Cómo te ayuda */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Cómo te ayuda FlyPath
          </p>
          <div className="space-y-2">
            <HelpMini
              icon={Layers}
              title="Reparte tus horas"
              description="Bloques diarios según tu objetivo semanal."
            />
            <HelpMini
              icon={Target}
              title="Prioriza asignaturas"
              description="Foco en lo que más necesita atención."
            />
            <HelpMini
              icon={TrendingUp}
              title="Detecta retrasos"
              description="Avisos si te sales del ritmo previsto."
            />
          </div>
        </section>

        {/* D — Progreso preview */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Progreso
          </p>
          <div className="space-y-3">
            <ProgressRow
              label="Esta semana"
              value={`0 / ${weeklyHours} h`}
              percent={0}
            />
            <ProgressRow label={`${modeLabel} total`} value="0%" percent={0} />
            <ProgressRow
              label="Asignaturas"
              value={`0 / ${subjectCount} en progreso`}
              percent={0}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
