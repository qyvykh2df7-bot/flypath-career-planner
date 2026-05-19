"use client";

import type {
  EvaluationCoachAction,
  EvaluationCoachRecommendation,
  EvaluationView,
} from "@/lib/study-planner/evaluation-page-logic";

type EvaluationCoachCardProps = {
  recommendation: EvaluationCoachRecommendation;
  onAction: (action: EvaluationCoachAction) => void;
};

export function EvaluationCoachCard({ recommendation, onAction }: EvaluationCoachCardProps) {
  return (
    <section className="rounded-xl border border-[#c9a454]/30 bg-gradient-to-br from-[#fffdf8] to-white p-4 shadow-sm ring-1 ring-[#c9a454]/15">
      <h3 className="text-[14px] font-semibold text-[#0f1a33]">{recommendation.title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">{recommendation.message}</p>
      <button
        type="button"
        onClick={() => onAction(recommendation.action)}
        className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c9a454] bg-[#c9a454] px-4 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
      >
        {recommendation.ctaLabel}
      </button>
    </section>
  );
}

export function resolveCoachView(action: EvaluationCoachAction): EvaluationView | null {
  switch (action.kind) {
    case "register_mock":
      return "mocks";
    case "view_errors":
      return "errors";
    case "view_reviews":
    case "plan_review":
      return "reviews";
    case "view_subjects":
    case "view_calendar":
      return null;
    default:
      return "mocks";
  }
}
