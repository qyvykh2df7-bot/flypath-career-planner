"use client";

import type {
  MockResult,
  PlannedStudySession,
  ErrorLogItem,
  ReviewItem,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import {
  calculateActiveSubjectIds,
  calculateCompletedPlannedMinutes,
  calculatePlannedMinutes,
  calculateOverdueReviewCount,
  calculatePendingErrorCount,
  calculatePendingReviewCount,
  calculateReadinessForSubjects,
  calculateStudyHealth,
  calculateTotalStudyMinutes,
  getErrorDashboardHint,
  getReviewDashboardHint,
  formatMockScore,
  getLatestMock,
  getMocksForCurrentWeek,
  getPlannedSessionsForCurrentWeek,
  getReadinessDashboardHint,
  getReadinessSummary,
  getSessionsForCurrentWeek,
  getWeeklyGoalStatusMessage,
  minutesToHoursLabel,
  studyHealthLabel,
} from "@/lib/study-planner/calculations";
import { getSubjectById } from "@/lib/study-planner/subjects";

type StudyDashboardProps = {
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  weeklyGoalMinutes: number;
  subjects: StudySubject[];
  onWeeklyGoalHoursChange: (hours: number) => void;
  onGoToRecovery?: () => void;
};

export function StudyDashboard({
  sessions,
  plannedSessions,
  mockResults,
  reviewItems,
  errorLogItems,
  weeklyGoalMinutes,
  subjects,
  onWeeklyGoalHoursChange,
  onGoToRecovery,
}: StudyDashboardProps) {
  const weekSessions = getSessionsForCurrentWeek(sessions);
  const weekMinutes = calculateTotalStudyMinutes(weekSessions);
  const goalHours = Math.round(weeklyGoalMinutes / 60);
  const weekPctRaw =
    weeklyGoalMinutes > 0 ? Math.round((weekMinutes / weeklyGoalMinutes) * 100) : 0;
  const weekGoalMessage = getWeeklyGoalStatusMessage(weekPctRaw);
  const activeIds = calculateActiveSubjectIds(sessions, 14);
  const activeInMode = activeIds.filter((id) => subjects.some((s) => s.id === id)).length;
  const health = calculateStudyHealth(weekMinutes, weeklyGoalMinutes);
  const weekPlanned = getPlannedSessionsForCurrentWeek(plannedSessions);
  const plannedMinutes = calculatePlannedMinutes(weekPlanned);
  const completedPlannedMinutes = calculateCompletedPlannedMinutes(weekPlanned);
  const plannedCount = weekPlanned.filter((p) => p.status === "planned").length;
  const completedPlannedCount = weekPlanned.filter((p) => p.status === "completed").length;
  const skippedPlannedCount = weekPlanned.filter((p) => p.status === "skipped").length;
  const hasPlannedData = weekPlanned.length > 0;
  const plannedFulfillmentPct =
    plannedMinutes > 0 ? Math.round((completedPlannedMinutes / plannedMinutes) * 100) : 0;
  const weekMocks = getMocksForCurrentWeek(mockResults);
  const latestMock = getLatestMock(mockResults);
  const readinessList = calculateReadinessForSubjects({
    subjectIds: subjects.map((s) => s.id),
    sessions,
    mockResults,
  });
  const readinessSummary = getReadinessSummary(readinessList);
  const readinessHint = getReadinessDashboardHint(readinessSummary);
  const pendingReviews = calculatePendingReviewCount(reviewItems);
  const overdueReviews = calculateOverdueReviewCount(reviewItems);
  const reviewDashboard = getReviewDashboardHint(pendingReviews, overdueReviews);
  const errorDashboard = getErrorDashboardHint(errorLogItems);

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
        {hasPlannedData ? (
          <p className="mt-3 border-t border-slate-100 pt-3 text-[13px] leading-relaxed text-slate-600">
            <span className="font-semibold text-[#0f1a33]">Planificación:</span>{" "}
            Planificado: {minutesToHoursLabel(plannedMinutes)} · Completado:{" "}
            {minutesToHoursLabel(completedPlannedMinutes)}
            {skippedPlannedCount > 0 ? ` · Saltadas: ${skippedPlannedCount}` : ""}
            <span className="mt-1 block text-slate-500">
              {completedPlannedCount} de {weekPlanned.length} sesiones planificadas completadas
              {plannedMinutes > 0 ? ` (${plannedFulfillmentPct}% del tiempo planificado)` : ""}
              {plannedCount > 0 ? ` · ${plannedCount} pendiente${plannedCount === 1 ? "" : "s"}` : ""}
            </span>
          </p>
        ) : null}
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
          hint={`${weekPctRaw}% completado · ${weekGoalMessage}`}
          progressValue={weekMinutes}
          progressMax={weeklyGoalMinutes}
        />
        <DashboardCard
          label="Asignaturas activas"
          value={String(activeInMode)}
          hint="Con sesión en los últimos 14 días (modo actual)"
        />
        <DashboardCard label="Próximo examen" value="Sin configurar" hint="Podrás añadir fechas más adelante" />
        <DashboardCard
          label="Repasos pendientes"
          value={reviewDashboard.value}
          hint={reviewDashboard.hint}
          highlight={overdueReviews > 0}
        />
        <DashboardCard
          label="Errores"
          value={errorDashboard.value}
          hint={errorDashboard.hint}
          highlight={errorLogItems.length > 0 && calculatePendingErrorCount(errorLogItems) > 0}
        />
        <DashboardCard
          label="Readiness"
          value={
            readinessSummary.averageScore !== null
              ? `${readinessSummary.averageScore}/100`
              : "Sin datos"
          }
          hint={readinessHint}
          highlight={
            readinessSummary.withDataCount > 0 &&
            readinessSummary.lowCount === 0 &&
            readinessSummary.solidCount + readinessSummary.highCount > 0
          }
        />
        <DashboardCard
          label="Mocks"
          value={
            latestMock
              ? formatMockScore(latestMock.score)
              : "Sin mocks todavía"
          }
          hint={
            weekMocks.length > 0
              ? `${weekMocks.length} mock${weekMocks.length === 1 ? "" : "s"} esta semana · último: ${getSubjectById(latestMock!.subjectId)?.name ?? latestMock!.subjectId}`
              : mockResults.length > 0
                ? `Último: ${getSubjectById(latestMock!.subjectId)?.name ?? latestMock!.subjectId} (${latestMock!.date})`
                : "Registra mocks en la pestaña Mocks"
          }
        />
        <DashboardCard
          label="Study Health"
          value={studyHealthLabel(health.level)}
          hint={health.message}
          highlight={health.level === "good"}
        />
      </div>

      {onGoToRecovery ? (
        <div className="rounded-xl border border-[#0f1a33]/15 bg-gradient-to-br from-[#0f1a33] to-[#1a2d52] p-4 text-white shadow-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
            ¿Estás perdido?
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-100">
            Genera un plan de recuperación para los próximos 7 días.
          </p>
          <button
            type="button"
            onClick={onGoToRecovery}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
          >
            Ir a Estoy perdido
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DashboardCard({
  label,
  value,
  hint,
  highlight,
  progressValue,
  progressMax,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
  progressValue?: number;
  progressMax?: number;
}) {
  const showBar =
    progressValue !== undefined && progressMax !== undefined && progressMax > 0;
  const barPct = showBar
    ? Math.min(100, Math.round((progressValue / progressMax) * 100))
    : 0;

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
      {showBar ? (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c9a454] to-[#ddb75c]"
            style={{ width: `${barPct}%` }}
          />
        </div>
      ) : null}
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}
