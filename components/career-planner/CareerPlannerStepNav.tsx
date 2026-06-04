"use client";

import { PLANNER_STEPS, type PlannerStepId } from "./career-planner-steps";

/** Centro vertical de los círculos (h-7) dentro del track con py-1 */
const STEP_TRACK_LINE_TOP = "calc(0.25rem + 0.875rem)";

type CareerPlannerStepNavProps = {
  activeStep: PlannerStepId;
  onboardingCompleted: boolean;
  onStepChange: (step: PlannerStepId) => void;
};

export function CareerPlannerStepNav({
  activeStep,
  onboardingCompleted,
  onStepChange,
}: CareerPlannerStepNavProps) {
  const activeIndex = Math.max(
    0,
    PLANNER_STEPS.findIndex((s) => s.id === activeStep),
  );
  const progressPct =
    PLANNER_STEPS.length > 1 ? (activeIndex / (PLANNER_STEPS.length - 1)) * 100 : 0;

  return (
    <nav
      className="shrink-0 border-b border-[#0f1a33]/[0.08] bg-[#F6F7F9] px-3 pb-3 pt-5 sm:px-6 md:block"
      aria-label="Pasos del Career Planner"
    >
      <div className="relative isolate mx-auto max-w-[1120px] overflow-visible">
        <div
          className="pointer-events-none absolute left-[10%] right-[10%] z-0 hidden h-px bg-[#0f1a33]/10 sm:block"
          style={{ top: STEP_TRACK_LINE_TOP }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-[10%] z-0 hidden h-px bg-[#D6AE4F] transition-[width,opacity] duration-300 sm:block"
          style={{
            top: STEP_TRACK_LINE_TOP,
            width: `${progressPct * 0.8}%`,
            opacity: 0.45 + progressPct * 0.005,
          }}
          aria-hidden
        />

        <div className="relative z-10 flex gap-0 overflow-x-auto overflow-y-visible py-1 scrollbar-none sm:justify-between">
          {PLANNER_STEPS.map((step, index) => {
            const isActive = activeStep === step.id;
            const isComplete =
              step.id === "profile"
                ? onboardingCompleted
                : onboardingCompleted && index < activeIndex;
            const isPending = !isActive && !isComplete;
            const canClick = step.id === "profile" || onboardingCompleted;
            const stepCode = String(step.number).padStart(2, "0");

            return (
              <button
                key={step.id}
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepChange(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={`planner-step-button group relative z-10 flex min-w-[4.5rem] shrink-0 flex-col items-center gap-2 bg-transparent p-0 shadow-none outline-none [-webkit-tap-highlight-color:transparent] sm:min-w-0 sm:flex-1 ${
                  canClick ? "cursor-pointer" : "cursor-not-allowed opacity-35"
                }`}
              >
                <span
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums transition-colors duration-150 ${
                    isActive
                      ? "border-[#D6AE4F] bg-[#D6AE4F] text-[#101B35]"
                      : isComplete
                        ? "border-[#D6AE4F]/45 bg-[#101B35] text-[#c9b46a] group-hover:border-[#C9A85A] group-hover:text-[#D6AE4F]"
                        : "border-[#0f1a33]/15 bg-[#F6F7F9] text-slate-400 group-hover:border-[#C9A85A] group-hover:text-[#101B35]"
                  }`}
                >
                  {stepCode}
                </span>
                <span
                  className={`relative z-10 text-center text-[9px] font-medium uppercase tracking-[0.14em] transition-colors duration-150 sm:text-[10px] ${
                    isActive
                      ? "text-[#101B35]"
                      : isPending
                        ? "text-slate-400 group-hover:text-slate-600"
                        : "text-[#0f1a33]/65 group-hover:text-[#C9A85A]"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
