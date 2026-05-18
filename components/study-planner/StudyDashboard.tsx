"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  Compass,
  GraduationCap,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import type {
  ExamDate,
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
  formatDaysRemaining,
  formatExamDisplayDate,
  formatMockScore,
  getDaysUntilDate,
  getErrorDashboardHint,
  getExamUrgencyBadge,
  getExamUrgencyTone,
  getLatestMock,
  getMocksForCurrentWeek,
  getNextUpcomingExam,
  getPlannedSessionsForCurrentWeek,
  getReadinessSummary,
  getReviewDashboardHint,
  getSessionsForCurrentWeek,
  getTodayDateString,
  getWeeklyGoalStatusMessage,
  minutesToHoursLabel,
  studyHealthLabel,
} from "@/lib/study-planner/calculations";
import { plannerMetricCard } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type StudyDashboardProps = {
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  weeklyGoalMinutes: number;
  subjects: StudySubject[];
  onWeeklyGoalHoursChange: (hours: number) => void;
  onGoToRecovery?: () => void;
  onGoToCalendar?: () => void;
};

type BadgeTone = "neutral" | "good" | "warn" | "risk" | "gold";

function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200/80",
    good: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    warn: "bg-amber-50 text-amber-900 ring-amber-200/80",
    risk: "bg-red-50 text-red-800 ring-red-200/80",
    gold: "bg-[#fff8e8] text-[#7a5a16] ring-[#c9a454]/35",
  };
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight ring-1 ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function MiniBar({ value, max, variant = "gold" }: { value: number; max: number; variant?: "gold" | "navy" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill =
    variant === "gold"
      ? "bg-gradient-to-r from-[#c9a454] to-[#ddb75c]"
      : "bg-gradient-to-r from-[#0f1a33] to-[#1a2d52]";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  badge,
  badgeTone,
  hint,
  bar,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  badge: string;
  badgeTone: BadgeTone;
  hint: string;
  bar?: { value: number; max: number; variant?: "gold" | "navy" };
}) {
  return (
    <article className={`${plannerMetricCard} flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0f1a33]/5 text-[#0f1a33]">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <StatusBadge label={badge} tone={badgeTone} />
      </div>
      <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold leading-tight text-[#0f1a33]">{value}</p>
      {bar ? (
        <div className="mt-2">
          <MiniBar value={bar.value} max={bar.max} variant={bar.variant} />
        </div>
      ) : null}
      <p className="mt-2 text-[13px] leading-snug text-slate-600">{hint}</p>
    </article>
  );
}

function getHoursWeekBadge(pct: number, hasSessions: boolean): { label: string; tone: BadgeTone } {
  if (!hasSessions) return { label: "Pendiente", tone: "neutral" };
  if (pct >= 100) return { label: "Objetivo cumplido", tone: "good" };
  if (pct >= 80) return { label: "Buen ritmo", tone: "good" };
  if (pct >= 40) return { label: "En progreso", tone: "warn" };
  return { label: "Ajustado", tone: "warn" };
}

function getReadinessBadge(summary: ReturnType<typeof getReadinessSummary>): {
  label: string;
  tone: BadgeTone;
  shortHint: string;
} {
  if (summary.averageScore === null) {
    return { label: "Sin datos", tone: "neutral", shortHint: "Registra horas y mocks." };
  }
  if (summary.lowCount > 0 || summary.averageScore < 55) {
    return {
      label: "Riesgo",
      tone: "risk",
      shortHint: "Conviene reforzar antes de presentarte.",
    };
  }
  if (summary.averageScore >= 75 || summary.solidCount + summary.highCount >= summary.withDataCount / 2) {
    return { label: "Sólido", tone: "good", shortHint: "Buen progreso orientativo." };
  }
  return {
    label: "Ajustado",
    tone: "warn",
    shortHint: "Conviene reforzar antes de presentarte.",
  };
}

function getMockBadge(score: number | null): { label: string; tone: BadgeTone } {
  if (score === null) return { label: "Sin datos", tone: "neutral" };
  if (score >= 80) return { label: "Buen resultado", tone: "good" };
  if (score >= 70) return { label: "Ajustado", tone: "warn" };
  return { label: "Revisar", tone: "risk" };
}

function getReviewBadge(pending: number, overdue: number): { label: string; tone: BadgeTone } {
  if (pending === 0) return { label: "Todo al día", tone: "good" };
  if (overdue > 0) return { label: "Atrasado", tone: "risk" };
  return { label: "Pendiente", tone: "warn" };
}

function getErrorBadge(pending: number, total: number): { label: string; tone: BadgeTone } {
  if (total === 0) return { label: "Sin datos", tone: "neutral" };
  if (pending === 0) return { label: "Todo limpio", tone: "good" };
  return { label: "Revisar", tone: "warn" };
}

function getStudyHealthBadge(level: ReturnType<typeof calculateStudyHealth>["level"]): {
  label: string;
  tone: BadgeTone;
} {
  switch (level) {
    case "good":
      return { label: "Buen ritmo", tone: "good" };
    case "progress":
      return { label: "En progreso", tone: "warn" };
    case "low":
      return { label: "Bajo", tone: "risk" };
    default:
      return { label: "Sin datos", tone: "neutral" };
  }
}

export function StudyDashboard({
  sessions,
  plannedSessions,
  mockResults,
  reviewItems,
  errorLogItems,
  examDates,
  weeklyGoalMinutes,
  subjects,
  onWeeklyGoalHoursChange,
  onGoToRecovery,
  onGoToCalendar,
}: StudyDashboardProps) {
  const today = getTodayDateString();
  const weekSessions = getSessionsForCurrentWeek(sessions);
  const weekMinutes = calculateTotalStudyMinutes(weekSessions);
  const goalHours = Math.round(weeklyGoalMinutes / 60);
  const weekPctRaw =
    weeklyGoalMinutes > 0 ? Math.round((weekMinutes / weeklyGoalMinutes) * 100) : 0;
  const weekGoalMessage = getWeeklyGoalStatusMessage(weekPctRaw);
  const hoursBadge = getHoursWeekBadge(weekPctRaw, weekSessions.length > 0);

  const activeInMode = calculateActiveSubjectIds(sessions, 14).filter((id) =>
    subjects.some((s) => s.id === id),
  ).length;
  const health = calculateStudyHealth(weekMinutes, weeklyGoalMinutes);
  const healthBadge = getStudyHealthBadge(health.level);

  const weekPlanned = getPlannedSessionsForCurrentWeek(plannedSessions);
  const plannedMinutes = calculatePlannedMinutes(weekPlanned);
  const completedPlannedMinutes = calculateCompletedPlannedMinutes(weekPlanned);

  const weekMocks = getMocksForCurrentWeek(mockResults);
  const latestMock = getLatestMock(mockResults);
  const latestMockSubject = latestMock
    ? (getSubjectById(latestMock.subjectId)?.name ?? latestMock.subjectId)
    : null;
  const mockBadge = getMockBadge(latestMock?.score ?? null);

  const readinessList = calculateReadinessForSubjects({
    subjectIds: subjects.map((s) => s.id),
    sessions,
    mockResults,
  });
  const readinessSummary = getReadinessSummary(readinessList);
  const readinessBadge = getReadinessBadge(readinessSummary);

  const pendingReviews = calculatePendingReviewCount(reviewItems);
  const overdueReviews = calculateOverdueReviewCount(reviewItems);
  const reviewDashboard = getReviewDashboardHint(pendingReviews, overdueReviews);
  const reviewBadge = getReviewBadge(pendingReviews, overdueReviews);

  const pendingErrors = calculatePendingErrorCount(errorLogItems);
  const errorDashboard = getErrorDashboardHint(errorLogItems);
  const errorBadge = getErrorBadge(pendingErrors, errorLogItems.length);

  const nextExam = getNextUpcomingExam(examDates, today);
  const nextExamSubject = nextExam
    ? (getSubjectById(nextExam.subjectId)?.name ?? nextExam.subjectId)
    : null;
  const nextExamDays = nextExam ? getDaysUntilDate(nextExam.date, today) : null;
  const nextExamBadge = nextExam && nextExamDays !== null ? getExamUrgencyBadge(nextExamDays) : null;
  const nextExamTone: BadgeTone =
    nextExam && nextExamDays !== null ? getExamUrgencyTone(nextExamDays) : "neutral";

  const handleGoalInput = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    onWeeklyGoalHoursChange(Math.min(80, Math.max(1, parsed)));
  };

  const mockHint =
    latestMock && weekMocks.length > 0
      ? `${weekMocks.length} mock${weekMocks.length === 1 ? "" : "s"} esta semana · ${latestMockSubject}`
      : latestMock
        ? `Último: ${latestMockSubject}`
        : "Registra tu primer mock";

  const reviewHint =
    pendingReviews === 0
      ? "Sin repasos pendientes"
      : overdueReviews > 0
        ? "Tienes repasos atrasados"
        : "Repasos programados";

  const errorHint =
    errorLogItems.length === 0
      ? "Añade errores para detectar patrones"
      : errorDashboard.hint;

  const examValue = nextExamSubject ?? "Sin configurar";
  const examHint =
    nextExam && nextExamDays !== null
      ? `${formatExamDisplayDate(nextExam.date)} · ${formatDaysRemaining(nextExamDays)}`
      : "Añade una fecha en Asignaturas.";

  return (
    <div className="space-y-4">
      <section className={`${plannerMetricCard} border-[#0f1a33]/10 bg-gradient-to-br from-white to-slate-50/80`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0f1a33] text-[#f2ddaa]">
                <CalendarClock className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0f1a33]">Esta semana</h3>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums leading-tight text-[#0f1a33]">
              {minutesToHoursLabel(weekMinutes)}{" "}
              <span className="text-lg font-medium text-slate-500">
                / {minutesToHoursLabel(weeklyGoalMinutes)}
              </span>
            </p>
            <p className="mt-1 text-[14px] font-medium text-slate-600">{weekPctRaw}% completado</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <label htmlFor="weekly-goal-hours" className="text-[13px] font-semibold text-slate-600">
              Objetivo semanal
            </label>
            <input
              id="weekly-goal-hours"
              type="number"
              min={1}
              max={80}
              value={goalHours}
              onChange={(e) => handleGoalInput(e.target.value)}
              aria-label="Objetivo semanal en horas"
              className="w-12 rounded-md border border-slate-200 bg-slate-50/80 px-2 py-1 text-center text-[15px] font-semibold tabular-nums text-[#0f1a33] focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25"
            />
            <span className="text-[13px] text-slate-500">h / semana</span>
          </div>
        </div>

        <div className="mt-3">
          <MiniBar value={weekMinutes} max={weeklyGoalMinutes || 1} variant="gold" />
        </div>
        <p className="mt-2 text-[13px] text-slate-600">{weekGoalMessage}</p>
        <p className="mt-1 text-[13px] text-slate-500">
          Planificado: {minutesToHoursLabel(plannedMinutes)} · Hecho:{" "}
          {minutesToHoursLabel(completedPlannedMinutes)}
        </p>
      </section>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <StatusCard
          icon={Target}
          label="Horas semana"
          value={minutesToHoursLabel(weekMinutes)}
          badge={hoursBadge.label}
          badgeTone={hoursBadge.tone}
          hint={weekSessions.length > 0 ? `${weekSessions.length} sesiones registradas` : "Registra tu primera sesión"}
          bar={{ value: weekMinutes, max: weeklyGoalMinutes || 1, variant: "gold" }}
        />
        <StatusCard
          icon={TrendingUp}
          label="Readiness"
          value={readinessSummary.averageScore !== null ? `${readinessSummary.averageScore}/100` : "—"}
          badge={readinessBadge.label}
          badgeTone={readinessBadge.tone}
          hint={readinessBadge.shortHint}
          bar={
            readinessSummary.averageScore !== null
              ? { value: readinessSummary.averageScore, max: 100, variant: "navy" }
              : undefined
          }
        />
        <StatusCard
          icon={ClipboardCheck}
          label="Mocks"
          value={latestMock ? formatMockScore(latestMock.score) : "—"}
          badge={mockBadge.label}
          badgeTone={mockBadge.tone}
          hint={mockHint}
          bar={latestMock ? { value: latestMock.score, max: 100, variant: "gold" } : undefined}
        />
        <StatusCard
          icon={RotateCcw}
          label="Repasos"
          value={reviewDashboard.value}
          badge={reviewBadge.label}
          badgeTone={reviewBadge.tone}
          hint={reviewHint}
        />
        <StatusCard
          icon={AlertTriangle}
          label="Errores"
          value={errorDashboard.value}
          badge={errorBadge.label}
          badgeTone={errorBadge.tone}
          hint={errorHint}
        />
        <StatusCard
          icon={BookOpen}
          label="Asignaturas activas"
          value={String(activeInMode)}
          badge={activeInMode > 0 ? "En curso" : "Sin actividad"}
          badgeTone={activeInMode > 0 ? "good" : "neutral"}
          hint="Con sesiones en los últimos 14 días"
        />
        <StatusCard
          icon={Activity}
          label="Study Health"
          value={studyHealthLabel(health.level)}
          badge={healthBadge.label}
          badgeTone={healthBadge.tone}
          hint={health.message}
          bar={
            weekMinutes > 0
              ? { value: weekMinutes, max: weeklyGoalMinutes || 1, variant: "navy" }
              : undefined
          }
        />
        <StatusCard
          icon={GraduationCap}
          label="Próximo examen"
          value={examValue}
          badge={nextExamBadge ?? "Sin configurar"}
          badgeTone={nextExamTone}
          hint={examHint}
        />
      </div>

      {onGoToRecovery ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-[#0f1a33]/15 bg-gradient-to-r from-[#0f1a33] to-[#1a2d52] px-4 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white">¿Estás perdido?</p>
            <p className="mt-1 text-[13px] leading-snug text-slate-200">
              Genera un plan de recuperación para los próximos 7 días.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToRecovery}
            className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#c9a454] bg-[#c9a454] px-4 py-2.5 text-[14px] font-semibold text-[#0f1a33] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
          >
            <Compass className="h-4 w-4" aria-hidden />
            Ir a Estoy perdido
          </button>
        </div>
      ) : null}

      <section className="rounded-xl border border-[#c9a454]/25 bg-white p-4 shadow-sm ring-1 ring-[#c9a454]/15">
        <h4 className="text-[15px] font-semibold text-[#0f1a33]">
          ¿Hay una asignatura que se te está atragantando?
        </h4>
        <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">
          Si los mocks no suben, acumulas errores o no sabes cómo avanzar, puedes reservar una clase
          PPL/ATPL para resolver dudas concretas.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/clases-ppl-atpl"
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#c9a454] bg-[#c9a454] px-4 py-2.5 text-[14px] font-semibold text-[#0f1a33] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
          >
            Ver clases PPL/ATPL
          </Link>
          {onGoToCalendar ? (
            <button
              type="button"
              onClick={onGoToCalendar}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              Ir al calendario
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
