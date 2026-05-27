"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BatteryWarning,
  CalendarDays,
  CalendarPlus,
  CircleHelp,
  Compass,
  Layers,
  type LucideIcon,
  Timer,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import type {
  ExamDate,
  ErrorLogItem,
  MockResult,
  PlannedStudySession,
  RecoveryPlan,
  RecoveryProblem,
  ReviewItem,
  StudyMode,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import type { RecoveryApplyResult } from "@/lib/study-planner/recovery-apply";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import { getCurrentWeekStart } from "@/lib/study-planner/date-utils";
import { plannerPageTitle } from "@/lib/study-planner/planner-ui";
import {
  BURNOUT_APPLY_CONFIRM_MESSAGE,
  isBurnoutRecoveryPlan,
} from "@/lib/study-planner/recovery-burnout-relief";
import {
  attachRecoveryCalendarPreview,
  BURNOUT_PLAN_EFFECTS,
  formatWeeklyStructureImpactLine,
  isLowTimeRecoveryPlan,
  isMockCorrectionRecoveryPlan,
  isOverdueReviewsRecoveryPlan,
  isStartGuidanceRecoveryPlan,
  LOW_TIME_BUTTON_HINT,
  LOW_TIME_BUTTON_LABEL,
  LOW_TIME_IMPACT_LINE,
  MOCK_CORRECTION_BUTTON_HINT,
  MOCK_CORRECTION_BUTTON_LABEL,
  MOCK_CORRECTION_IMPACT_LINE,
  OVERDUE_REVIEWS_BUTTON_HINT,
  OVERDUE_REVIEWS_BUTTON_LABEL,
  OVERDUE_REVIEWS_IMPACT_LINE,
  START_GUIDANCE_BUTTON_HINT,
  START_GUIDANCE_BUTTON_LABEL,
  START_GUIDANCE_IMPACT_LINE,
  isWeeklyStructureRecoveryPlan,
  type RecoveryCalendarPreviewInput,
  WEEKLY_STRUCTURE_PLAN_EFFECTS,
} from "@/lib/study-planner/recovery-plan-preview";
import { formatRecoveryStepForDisplay } from "@/lib/study-planner/recovery-display";
import {
  RECOVERY_ACTION_LABELS,
  RECOVERY_PROBLEM_OPTIONS,
  RECOVERY_WEEK_LOAD_LABELS,
  generateRecoveryPlan,
} from "@/lib/study-planner/recovery";

const HELP_TOAST =
  "Próximamente: clases y mentorías por asignatura.";
const TOAST_MS = 4000;

const RECOVERY_CONFIRM_OVERWRITE =
  "Este plan modificará sesiones de los próximos 7 días. ¿Quieres continuar?";

const RECOVERY_PROBLEM_ICONS: Record<RecoveryProblem, LucideIcon> = {
  too_many_subjects: Layers,
  low_mock_scores: TrendingDown,
  no_weekly_plan: CalendarDays,
  overdue_reviews: RotateCcw,
  accumulated_doubts: CircleHelp,
  low_time: Timer,
  burnout: BatteryWarning,
  dont_know_where_to_start: Compass,
};

type RecoveryModeProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  weeklyGoalMinutes: number;
  weekStartDate?: string;
  today?: string;
  onApplyPlan?: (plan: RecoveryPlan) => RecoveryApplyResult;
  onGoToCalendar?: () => void;
};

function weekLoadStyles(level: RecoveryPlan["riskLevel"]): string {
  switch (level) {
    case "high":
      return "bg-amber-50 text-amber-900 ring-amber-200/70";
    case "medium":
      return "bg-[#fff8e8] text-[#7a5a16] ring-[#c9a454]/35";
    default:
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/70";
  }
}

export function RecoveryMode({
  mode,
  subjects: _subjects,
  sessions,
  plannedSessions,
  mockResults,
  reviewItems,
  errorLogItems,
  examDates,
  weeklyGoalMinutes,
  weekStartDate: weekStartDateProp,
  today: todayProp,
  onApplyPlan,
  onGoToCalendar,
}: RecoveryModeProps) {
  const today = todayProp ?? getTodayDateString();
  const weekStartDate = weekStartDateProp ?? getCurrentWeekStart(today);

  const calendarPreviewInput = useMemo<RecoveryCalendarPreviewInput>(
    () => ({
      activeSubjectIds: _subjects.map((s) => s.id),
      reviewItems,
      errorLogItems,
      plannedSessions,
      weekStartDate,
      today,
      weeklyGoalMinutes,
    }),
    [
      _subjects,
      reviewItems,
      errorLogItems,
      plannedSessions,
      weekStartDate,
      today,
      weeklyGoalMinutes,
    ],
  );

  const [selected, setSelected] = useState<Set<RecoveryProblem>>(new Set());
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast((t) => (t === toast ? null : t)), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const toggleProblem = (problem: RecoveryProblem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(problem)) next.delete(problem);
      else next.add(problem);
      return next;
    });
    setFormError(null);
    setActionNote(null);
    setApplySuccess(false);
    setPlan(null);
  };

  const requireSelection = (): RecoveryProblem[] | null => {
    if (selected.size === 0) {
      setFormError("Selecciona al menos una opción para orientar tu plan.");
      setPlan(null);
      return null;
    }
    setFormError(null);
    return [...selected];
  };

  const handleGenerate = () => {
    const problems = requireSelection();
    if (!problems) return;
    setActionNote(null);
    setApplySuccess(false);
    const hasBurnout = problems.includes("burnout");
    const base = generateRecoveryPlan({
      selectedProblems: problems,
      mode,
      subjects: _subjects,
      sessions,
      plannedSessions,
      mockResults,
      reviewItems,
      errorLogItems,
      examDates,
      weeklyGoalMinutes,
      variant: hasBurnout ? "lighter" : "standard",
      today,
    });
    setPlan(attachRecoveryCalendarPreview(base, calendarPreviewInput));
  };

  const handleApplyPlan = () => {
    if (!plan) return;
    if (!onApplyPlan) {
      setApplySuccess(false);
      setActionNote("Esta acción todavía no está conectada al calendario.");
      return;
    }
    const burnoutPlan = isBurnoutRecoveryPlan(plan.problems);
    const needsConfirm =
      burnoutPlan || plan.calendarImpact?.willModifyExistingSessions === true;
    if (needsConfirm) {
      const message = burnoutPlan
        ? BURNOUT_APPLY_CONFIRM_MESSAGE
        : RECOVERY_CONFIRM_OVERWRITE;
      if (!window.confirm(message)) return;
    }
    const result = onApplyPlan(plan);
    if (result.applied) {
      setApplySuccess(true);
      setActionNote(
        result.adjustmentLabel
          ? burnoutPlan
            ? `Semana más ligera aplicada. ${result.adjustmentLabel}`
            : `Plan aplicado al calendario. ${result.adjustmentLabel}`
          : burnoutPlan
            ? "Semana más ligera aplicada."
            : "Plan aplicado al calendario.",
      );
      onGoToCalendar?.();
    } else {
      setApplySuccess(false);
      setActionNote("No hubo cambios que aplicar esta semana.");
    }
  };

  const isBurnoutPlan = plan ? isBurnoutRecoveryPlan(plan.problems) : false;
  const isWeeklyStructurePlan = plan ? isWeeklyStructureRecoveryPlan(plan) : false;
  const isLowTimePlan = plan ? isLowTimeRecoveryPlan(plan) : false;
  const isMockCorrectionPlan = plan ? isMockCorrectionRecoveryPlan(plan) : false;
  const isOverdueReviewsPlan = plan ? isOverdueReviewsRecoveryPlan(plan) : false;
  const isStartGuidancePlan = plan ? isStartGuidanceRecoveryPlan(plan) : false;

  return (
    <div className="space-y-5">
      {toast ? (
        <p
          className="fixed bottom-4 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-xl border border-[#c9a454]/30 bg-[#0f1a33] px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <header>
        <h2 className={plannerPageTitle}>Recuperación</h2>
      </header>

      <section className="space-y-2">
        <h3 className="text-[14px] font-semibold text-[#0f1a33]">¿Qué te está pasando?</h3>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {RECOVERY_PROBLEM_OPTIONS.map((option) => {
            const isSelected = selected.has(option.value);
            const Icon = RECOVERY_PROBLEM_ICONS[option.value];
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleProblem(option.value)}
                className={`group flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 ${
                  isSelected
                    ? "bg-[#fffdf8] shadow-[0_2px_12px_-6px_rgba(201,164,84,0.35)] ring-2 ring-[#c9a454]/45"
                    : "bg-white/80 ring-1 ring-slate-200/35 hover:bg-[#fffdf8]/60 hover:ring-[#c9a454]/25"
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                    isSelected
                      ? "bg-[#c9a454]/20 text-[#7a5a16]"
                      : "bg-slate-100/80 text-slate-500 group-hover:bg-[#fff8e8]/80 group-hover:text-[#7a5a16]"
                  }`}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span
                  className={`min-w-0 flex-1 text-[17px] font-medium leading-snug ${
                    isSelected ? "text-[#0f1a33]" : "text-slate-700"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {formError ? (
        <p className="text-[14px] font-medium text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleGenerate}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
      >
        Generar plan de recuperación
      </button>

      {plan ? (
        <article className="overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_-14px_rgba(15,26,51,0.12)] ring-1 ring-slate-200/40">
          <div className="border-b border-[#0f1a33]/[0.08] bg-gradient-to-r from-[#0f1a33]/[0.07] via-[#eef2f8] to-[#fffdf8] px-3.5 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[16px] font-semibold tracking-tight text-[#0f1a33]">
                {isBurnoutPlan ? "Semana más ligera" : "Plan de 7 días"}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ${
                  isBurnoutPlan
                    ? "bg-[#fff8e8] text-[#7a5a16] ring-[#c9a454]/35"
                    : weekLoadStyles(plan.riskLevel)
                }`}
              >
                {isBurnoutPlan ? "Menos presión" : RECOVERY_WEEK_LOAD_LABELS[plan.riskLevel]}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 p-3.5 sm:p-4">
            <div
              className={`space-y-2 rounded-lg px-2.5 py-2.5 ring-1 ${
                isBurnoutPlan
                  ? "bg-gradient-to-br from-[#fff9ee]/90 via-[#fffdf8] to-white ring-[#c9a454]/20"
                  : "bg-[#fffdf8]/80 ring-[#c9a454]/15"
              }`}
            >
              <p className="text-[13px] font-semibold leading-snug text-[#0f1a33]">
                {isBurnoutPlan ? "Un respiro para esta semana" : "Qué hará este plan"}
              </p>
              <p className="text-[13px] leading-relaxed text-slate-600">{plan.summary}</p>
              {isBurnoutPlan ? (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-medium text-[#7a5a16]">
                    Este plan reducirá la carga de los próximos 7 días:
                  </p>
                  <ul className="list-inside list-disc space-y-0.5 text-[12px] leading-relaxed text-slate-600">
                    {BURNOUT_PLAN_EFFECTS.map((effect) => (
                      <li key={effect}>{effect}</li>
                    ))}
                  </ul>
                </div>
              ) : isWeeklyStructurePlan ? (
                <ul className="list-inside list-disc space-y-0.5 text-[12px] leading-relaxed text-slate-600">
                  {WEEKLY_STRUCTURE_PLAN_EFFECTS.map((effect) => (
                    <li key={effect}>{effect}</li>
                  ))}
                </ul>
              ) : null}
              {plan.calendarImpact && !isBurnoutPlan ? (
                <p className="text-[12px] text-slate-500">
                  {isMockCorrectionPlan
                    ? MOCK_CORRECTION_IMPACT_LINE
                    : isLowTimePlan
                      ? LOW_TIME_IMPACT_LINE
                    : isStartGuidancePlan
                      ? START_GUIDANCE_IMPACT_LINE
                    : isOverdueReviewsPlan
                      ? OVERDUE_REVIEWS_IMPACT_LINE
                    : isWeeklyStructurePlan
                    ? formatWeeklyStructureImpactLine(plan.calendarImpact.estimatedSessions)
                    : `~${plan.calendarImpact.estimatedSessions} sesiones · ${plan.calendarImpact.sessionTypesSummary}${
                        plan.calendarImpact.willModifyExistingSessions
                          ? " · sustituye bloques pendientes ya planificados"
                          : ""
                      }`}
                </p>
              ) : null}
            </div>

            {plan.burnoutRelief ? (
              <section className="space-y-1.5 rounded-lg bg-slate-50/60 px-2.5 py-2 ring-1 ring-slate-100/90">
                <p className="text-[13px] font-semibold text-[#0f1a33]">Cambios propuestos</p>
                <ul className="space-y-1 text-[12px] leading-relaxed text-slate-600">
                  {plan.burnoutRelief.proposedChanges.map((change) => (
                    <li key={change} className="flex gap-1.5">
                      <span className="text-[#c9a454]" aria-hidden>
                        –
                      </span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-500">
                  Volumen orientativo: ~{plan.burnoutRelief.volumeReductionPercent}% menos carga
                  semanal.
                </p>
              </section>
            ) : null}

            <ol className={`space-y-2 ${isBurnoutPlan ? "opacity-95" : ""}`}>
              {plan.steps.map((step, index) => {
                const display = formatRecoveryStepForDisplay(step);
                return (
                  <li
                    key={step.id}
                    className="flex gap-2.5 rounded-lg bg-slate-50/55 px-2.5 py-2 ring-1 ring-slate-100/80"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-lg text-[12px] font-bold shadow-[0_1px_4px_rgba(15,26,51,0.12)] ${
                        isBurnoutPlan
                          ? "bg-[#c9a454]/25 text-[#7a5a16]"
                          : "bg-[#0f1a33] text-white"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-px">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-[13px] font-semibold leading-snug text-[#0f1a33]">
                          {display.title}
                        </p>
                        {step.actionType ? (
                          <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[12px] font-medium text-[#1e4a7a] ring-1 ring-[#3b6ea8]/15">
                            {RECOVERY_ACTION_LABELS[step.actionType]}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-slate-600">
                        {display.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <section className="flex flex-col items-stretch gap-1.5 sm:items-end">
              <button
                type="button"
                onClick={handleApplyPlan}
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#c9a454] bg-[#c9a454] px-4 py-2 text-[13px] font-semibold text-[#0f1a33] shadow-[0_4px_14px_-6px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
                {isBurnoutPlan
                  ? "Aplicar semana más ligera"
                  : isLowTimePlan
                    ? LOW_TIME_BUTTON_LABEL
                  : isStartGuidancePlan
                    ? START_GUIDANCE_BUTTON_LABEL
                  : isMockCorrectionPlan
                    ? MOCK_CORRECTION_BUTTON_LABEL
                    : isOverdueReviewsPlan
                      ? OVERDUE_REVIEWS_BUTTON_LABEL
                    : "Aplicar al calendario"}
              </button>
              <p className="text-center text-[12px] leading-snug text-slate-500 sm:text-right">
                {isBurnoutPlan
                  ? "Reorganizará tus próximos 7 días para reducir saturación."
                  : isLowTimePlan
                    ? LOW_TIME_BUTTON_HINT
                  : isStartGuidancePlan
                    ? START_GUIDANCE_BUTTON_HINT
                  : isMockCorrectionPlan
                    ? MOCK_CORRECTION_BUTTON_HINT
                  : isOverdueReviewsPlan
                    ? OVERDUE_REVIEWS_BUTTON_HINT
                  : plan.focusReduction?.appliesThisWeek
                    ? "Eliminará o desprogramará las sesiones pendientes de esas asignaturas esta semana. No borrará historial ni progreso."
                    : "Creará o reorganizará sesiones de los próximos 7 días."}
              </p>
            </section>

            {actionNote ? (
              <p
                className={`rounded-md px-2.5 py-2 text-[12px] leading-relaxed ${
                  applySuccess
                    ? "bg-emerald-50/90 font-medium text-emerald-900"
                    : "bg-slate-50 text-slate-600"
                }`}
                role="status"
              >
                {actionNote}
              </p>
            ) : null}
          </div>

          {plan.cta ? (
            <section className="mx-3 mb-3 flex flex-col gap-2.5 rounded-xl bg-gradient-to-br from-[#fff9ee] via-[#fffdf8] to-white p-3 ring-1 ring-[#c9a454]/28 sm:mx-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0f1a33]">¿Bloqueo concreto?</p>
                <p className="mt-0.5 text-[13px] leading-snug text-slate-600">
                  Convierte una asignatura difícil en una acción concreta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToast(HELP_TOAST)}
                className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg border border-[#c9a454]/50 bg-[#fff8e8]/80 px-4 py-2 text-[13px] font-semibold text-[#7a5a16] shadow-[0_2px_10px_-6px_rgba(201,164,84,0.35)] transition hover:border-[#c9a454] hover:bg-[#fffdf8] hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 sm:ml-2"
              >
                {plan.cta.label}
              </button>
            </section>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
