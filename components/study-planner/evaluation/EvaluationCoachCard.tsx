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
    <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fffdf8]/80 px-3 py-2 ring-1 ring-[#c9a454]/12">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-[#7a5a16]">{recommendation.title}</p>
        <p className="text-[13px] leading-snug text-slate-600">{recommendation.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onAction(recommendation.action)}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[#c9a454] px-3 text-[12px] font-semibold text-[#0f1a33] ring-1 ring-[#ddb75c]/35 transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
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
      return "reviews";
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
