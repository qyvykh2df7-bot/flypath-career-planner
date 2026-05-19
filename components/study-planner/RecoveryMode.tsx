"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Layers } from "lucide-react";
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
  RECOVERY_ACTION_LABELS,
  RECOVERY_PROBLEM_OPTIONS,
  RECOVERY_WEEK_LOAD_LABELS,
  generateRecoveryPlan,
} from "@/lib/study-planner/recovery";

const HELP_TOAST =
  "Próximamente: clases y mentorías por asignatura.";
const TOAST_MS = 4000;

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
        <div className="grid gap-2 sm:grid-cols-2">
          {RECOVERY_PROBLEM_OPTIONS.map((option) => {
            const isSelected = selected.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleProblem(option.value)}
                className={`rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 ${
                  isSelected
                    ? "border-[#c9a454] bg-[#fffdf8] text-[#0f1a33] ring-1 ring-[#c9a454]/30"
                    : "border-slate-200/90 bg-white text-slate-700 hover:border-[#c9a454]/40 hover:bg-[#fffdf8]"
                }`}
                aria-pressed={isSelected}
              >
                {option.label}
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
        <article className="overflow-hidden rounded-xl border border-[#c9a454]/25 bg-white shadow-md ring-1 ring-[#c9a454]/20">
          <div className="border-b border-[#c9a454]/20 bg-gradient-to-r from-[#0f1a33] to-[#1a2d52] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[16px] font-semibold text-white">Plan de 7 días</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {plan.variant === "lighter" ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25">
                    Versión con menos carga
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${weekLoadStyles(plan.riskLevel)}`}
                >
                  {RECOVERY_WEEK_LOAD_LABELS[plan.riskLevel]}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <p className="text-[14px] leading-relaxed text-slate-700">{plan.summary}</p>

            <ol className="space-y-3">
              {plan.steps.map((step, index) => (
                <li
                  key={step.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f1a33] text-[12px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#0f1a33]">{step.title}</p>
                        {step.actionType ? (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                            {RECOVERY_ACTION_LABELS[step.actionType]}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <section className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 ring-1 ring-slate-100/80">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Siguiente paso
              </p>
              <p className="mt-1 text-[13px] text-slate-600">
                Puedes aplicar esta propuesta a tu calendario o pedir una versión con menos carga.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleApplyPlan}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#c9a454] bg-[#c9a454] px-3 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:flex-none sm:px-4"
                >
                  <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
                  Aplicar este plan
                </button>
                <button
                  type="button"
                  onClick={handleGenerateLighter}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:border-[#c9a454]/40 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 sm:flex-none sm:px-4"
                >
                  <Layers className="h-4 w-4 shrink-0" aria-hidden />
                  Generar versión más ligera
                </button>
              </div>
              {actionNote ? (
                <p
                  className={`mt-2.5 rounded-lg border px-3 py-2 text-[12px] leading-relaxed ${
                    applySuccess
                      ? "border-emerald-200/80 bg-emerald-50/80 font-medium text-emerald-900"
                      : "border-slate-200/80 bg-white text-slate-600"
                  }`}
                  role="status"
                >
                  {actionNote}
                </p>
              ) : null}
            </section>
          </div>

          {plan.cta ? (
            <section className="border-t border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-[12px] text-slate-500">
                ¿Una asignatura te bloquea (teoría, banco o simulacro)?
              </p>
              <button
                type="button"
                onClick={() => setToast(HELP_TOAST)}
                className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200/90 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-[#c9a454]/40 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
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
