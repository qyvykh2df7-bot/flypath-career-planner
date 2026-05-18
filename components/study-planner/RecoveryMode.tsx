"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  RECOVERY_ACTION_LABELS,
  RECOVERY_PROBLEM_OPTIONS,
  RECOVERY_RISK_LABELS,
  generateRecoveryPlan,
} from "@/lib/study-planner/recovery";

type RecoveryModeProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  weeklyGoalMinutes: number;
};

function riskStyles(level: RecoveryPlan["riskLevel"]): string {
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
  subjects,
  sessions,
  plannedSessions,
  mockResults,
  reviewItems,
  errorLogItems,
  weeklyGoalMinutes,
}: RecoveryModeProps) {
  const [selected, setSelected] = useState<Set<RecoveryProblem>>(new Set());
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleProblem = (problem: RecoveryProblem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(problem)) next.delete(problem);
      else next.add(problem);
      return next;
    });
    setFormError(null);
  };

  const handleGenerate = () => {
    if (selected.size === 0) {
      setFormError("Selecciona al menos un problema para generar tu plan.");
      setPlan(null);
      return;
    }
    setFormError(null);
    setPlan(
      generateRecoveryPlan({
        selectedProblems: [...selected],
        mode,
        subjects,
        sessions,
        plannedSessions,
        mockResults,
        reviewItems,
        errorLogItems,
        weeklyGoalMinutes,
      }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#0f1a33]/10 bg-gradient-to-r from-[#0f1a33]/5 to-transparent px-3 py-2.5">
        <p className="text-[13px] leading-relaxed text-slate-600">
          Marca lo que te pasa y genera un plan orientativo de 7 días. Sin IA: reglas basadas en tus datos.
        </p>
      </div>

      <section className="space-y-2">
        <h4 className="text-[14px] font-semibold text-[#0f1a33]">¿Qué te está pasando?</h4>
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
              <h4 className="text-[16px] font-semibold text-white">Plan de recuperación 7 días</h4>
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${riskStyles(plan.riskLevel)}`}
              >
                Riesgo {RECOVERY_RISK_LABELS[plan.riskLevel]}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
          <p className="text-[14px] leading-relaxed text-slate-700">{plan.summary}</p>

          <ol className="mt-4 space-y-3">
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

          {plan.cta ? (
            <div className="mt-4 rounded-lg border border-[#c9a454]/25 bg-[#fffdf8] p-3">
              <p className="text-[13px] text-slate-700">
                Si una asignatura está bloqueada, puedes reservar una clase para resolver dudas concretas.
              </p>
              <Link
                href={plan.cta.href}
                className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#0f1a33]/20 bg-white px-4 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:border-[#c9a454]/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
              >
                {plan.cta.label}
              </Link>
            </div>
          ) : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}
