"use client";

import type { StudySession, StudySubject } from "@/lib/study-planner/types";
import {
  calculateActiveSubjectIds,
  calculateStudyHealth,
  calculateTotalStudyMinutes,
  getSessionsForCurrentWeek,
  minutesToHoursLabel,
  studyHealthLabel,
} from "@/lib/study-planner/calculations";

type StudyDashboardProps = {
  sessions: StudySession[];
  weeklyGoalMinutes: number;
  subjects: StudySubject[];
  onWeeklyGoalHoursChange: (hours: number) => void;
};

export function StudyDashboard({
  sessions,
  weeklyGoalMinutes,
  subjects,
  onWeeklyGoalHoursChange,
}: StudyDashboardProps) {
  const weekSessions = getSessionsForCurrentWeek(sessions);
  const weekMinutes = calculateTotalStudyMinutes(weekSessions);
  const goalHours = Math.round(weeklyGoalMinutes / 60);
  const weekPct =
    weeklyGoalMinutes > 0 ? Math.min(100, Math.round((weekMinutes / weeklyGoalMinutes) * 100)) : 0;
  const activeIds = calculateActiveSubjectIds(sessions, 14);
  const activeInMode = activeIds.filter((id) => subjects.some((s) => s.id === id)).length;
  const health = calculateStudyHealth(weekMinutes, weeklyGoalMinutes);

  const handleGoalInput = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(80, Math.max(1, parsed));
    onWeeklyGoalHoursChange(clamped);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
        <label htmlFor="weekly-goal-hours" className="text-[13px] font-semibold text-slate-600">
          Objetivo semanal de estudio
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id="weekly-goal-hours"
            type="number"
            min={1}
            max={80}
            value={goalHours}
            onChange={(e) => handleGoalInput(e.target.value)}
            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[15px] font-semibold tabular-nums text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25"
          />
          <span className="text-[15px] font-medium text-slate-600">h / semana</span>
          <span className="text-[13px] text-slate-500">({minutesToHoursLabel(weeklyGoalMinutes)} objetivo)</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          label="Horas esta semana"
          value={minutesToHoursLabel(weekMinutes)}
          hint={
            weekMinutes > 0
              ? `${weekSessions.length} sesión${weekSessions.length === 1 ? "" : "es"} esta semana`
              : "Empieza registrando tu primera sesión"
          }
        />
        <DashboardCard
          label="Objetivo semanal"
          value={`${minutesToHoursLabel(weekMinutes)} / ${minutesToHoursLabel(weeklyGoalMinutes)}`}
          hint={`${weekPct}% completado`}
        />
        <DashboardCard
          label="Asignaturas activas"
          value={String(activeInMode)}
          hint="Con sesión en los últimos 14 días (modo actual)"
        />
        <DashboardCard label="Próximo examen" value="Sin configurar" hint="Podrás añadir fechas más adelante" />
        <DashboardCard label="Repasos pendientes" value="0" hint="Los repasos aparecerán aquí" />
        <DashboardCard
          label="Study Health"
          value={studyHealthLabel(health.level)}
          hint={health.message}
          highlight={health.level === "good"}
        />
      </div>
    </div>
  );
}

function DashboardCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ring-1 ${
        highlight
          ? "border-[#c9a454]/40 bg-[#fffdf8] ring-[#c9a454]/20"
          : "border-slate-200/90 bg-white ring-slate-100/80"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-[#0f1a33]">{value}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}
