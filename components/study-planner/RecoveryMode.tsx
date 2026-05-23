"use client";

import { useEffect, useState } from "react";
import {
  BatteryWarning,
  CalendarDays,
  CalendarPlus,
  CircleAlert,
  Compass,
  Layers,
  type LucideIcon,
  Timer,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import type {
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
import {
  formatRecoveryStepForDisplay,
  formatRecoverySummaryForDisplay,
} from "@/lib/study-planner/recovery-display";
import {
  RECOVERY_ACTION_LABELS,
  RECOVERY_PROBLEM_OPTIONS,
  RECOVERY_WEEK_LOAD_LABELS,
  generateRecoveryPlan,
} from "@/lib/study-planner/recovery";

const HELP_TOAST =
  "Próximamente: clases y mentorías por asignatura.";
const TOAST_MS = 4000;

const RECOVERY_PROBLEM_ICONS: Record<RecoveryProblem, LucideIcon> = {
  too_many_subjects: Layers,
  low_mock_scores: TrendingDown,
  no_weekly_plan: CalendarDays,
  overdue_reviews: RotateCcw,
  pending_errors: CircleAlert,
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
  weeklyGoalMinutes: number;
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

function buildPlanInput(
  props: RecoveryModeProps,
  selected: RecoveryProblem[],
  variant: "standard" | "lighter",
) {
  return {
    selectedProblems: selected,
    mode: props.mode,
    subjects: props.subjects,
    sessions: props.sessions,
    plannedSessions: props.plannedSessions,
    mockResults: props.mockResults,
    reviewItems: props.reviewItems,
    errorLogItems: props.errorLogItems,
    weeklyGoalMinutes: props.weeklyGoalMinutes,
    variant,
  };
}

export function RecoveryMode(props: RecoveryModeProps) {
  const {
    mode,
    subjects,
    sessions,
    plannedSessions,
    mockResults,
    reviewItems,
    errorLogItems,
    weeklyGoalMinutes,
    onApplyPlan,
    onGoToCalendar,
  } = props;

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
    setPlan(generateRecoveryPlan(buildPlanInput(props, problems, "standard")));
  };

  const handleGenerateLighter = () => {
    const problems = requireSelection();
    if (!problems) return;
    setApplySuccess(false);
    setPlan(generateRecoveryPlan(buildPlanInput(props, problems, "lighter")));
    setActionNote(
      "Versión con menos carga lista. Pulsa «Aplicar este plan» para crear bloques cortos de repaso y errores en el calendario.",
    );
  };

  const handleApplyPlan = () => {
    if (!plan) return;
    if (!onApplyPlan) {
      setApplySuccess(false);
      setActionNote("Esta acción todavía no está conectada al calendario.");
      return;
    }
    const result = onApplyPlan(plan);
    if (result.applied) {
      setApplySuccess(true);
      setActionNote(
        result.adjustmentLabel
          ? `Plan aplicado al calendario. ${result.adjustmentLabel}`
          : "Plan aplicado al calendario",
      );
      onGoToCalendar?.();
    } else {
      setApplySuccess(false);
      setActionNote(
        "No se pudieron crear bloques. Activa al menos una asignatura en ajustes del planner.",
      );
    }
  };

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

      <header className="space-y-1">
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">Recuperación</h2>
        <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600">
          Cuando vas perdido, saturado o atrasado, marca lo que te pasa. Te proponemos un plan de 7
          días para reorganizar la semana con pasos concretos, sin juzgarte.
        </p>
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
                  className={`min-w-0 flex-1 text-[12px] font-medium leading-snug ${
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
                Plan de 7 días
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {plan.variant === "lighter" ? (
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[12px] font-semibold text-[#1e4a7a] ring-1 ring-[#3b6ea8]/15">
                    Versión con menos carga
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ${weekLoadStyles(plan.riskLevel)}`}
                >
                  {RECOVERY_WEEK_LOAD_LABELS[plan.riskLevel]}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 p-3.5 sm:p-4">
            <p className="text-[13px] leading-snug text-slate-500">
              {formatRecoverySummaryForDisplay(plan.summary)}
            </p>

            <ol className="space-y-2">
              {plan.steps.map((step, index) => {
                const display = formatRecoveryStepForDisplay(step);
                return (
                  <li
                    key={step.id}
                    className="flex gap-2.5 rounded-lg bg-slate-50/55 px-2.5 py-2 ring-1 ring-slate-100/80"
                  >
                    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-lg bg-[#0f1a33] text-[12px] font-bold text-white shadow-[0_1px_4px_rgba(15,26,51,0.2)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-px">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p
                          className="text-[13px] font-semibold leading-snug text-[#0f1a33]"
                          title={step.title}
                        >
                          {display.title}
                        </p>
                        {step.actionType ? (
                          <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[12px] font-medium text-[#1e4a7a] ring-1 ring-[#3b6ea8]/15">
                            {RECOVERY_ACTION_LABELS[step.actionType]}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className="mt-1 line-clamp-2 text-[13px] leading-snug text-slate-400"
                        title={step.description}
                      >
                        {display.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <section className="rounded-lg bg-slate-50/50 px-2.5 py-2 ring-1 ring-slate-200/25">
              <p className="text-[12px] font-semibold text-slate-500">Siguiente paso</p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                Puedes aplicar esta propuesta a tu calendario o pedir una versión con menos carga.
              </p>
              <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleApplyPlan}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#c9a454] bg-[#c9a454] px-3 py-1.5 text-[12px] font-semibold text-[#0f1a33] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:flex-none sm:px-3.5"
                >
                  <CalendarPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Aplicar este plan
                </button>
                <button
                  type="button"
                  onClick={handleGenerateLighter}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0f1a33] ring-1 ring-slate-200/40 transition hover:bg-[#fffdf8] hover:ring-[#c9a454]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 sm:flex-none sm:px-3.5"
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Generar versión más ligera
                </button>
              </div>
              {actionNote ? (
                <p
                  className={`mt-2 rounded-md px-2 py-1.5 text-[12px] leading-relaxed ${
                    applySuccess
                      ? "bg-emerald-50/90 font-medium text-emerald-900"
                      : "bg-white/80 text-slate-600"
                  }`}
                  role="status"
                >
                  {actionNote}
                </p>
              ) : null}
            </section>
          </div>

          {plan.cta ? (
            <section className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-[#fff9ee] via-[#fffdf8] to-white p-3 ring-1 ring-[#c9a454]/28 sm:mx-3.5">
              <p className="text-[13px] font-semibold text-[#0f1a33]">¿Bloqueo concreto?</p>
              <p className="mt-0.5 text-[13px] leading-snug text-slate-600">
                Convierte una asignatura difícil en una acción concreta.
              </p>
              <button
                type="button"
                onClick={() => setToast(HELP_TOAST)}
                className="mt-2.5 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[#c9a454]/50 bg-white px-4 py-2 text-[13px] font-semibold text-[#0f1a33] shadow-[0_2px_10px_-6px_rgba(201,164,84,0.35)] transition hover:border-[#c9a454] hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 sm:w-auto"
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
