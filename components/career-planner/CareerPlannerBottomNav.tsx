"use client";

import { PLANNER_STEPS, type PlannerStepId } from "./career-planner-steps";
import { PLANNER_STEP_ICONS } from "./career-planner-nav";

type CareerPlannerBottomNavProps = {
  activeStep: PlannerStepId;
  onboardingCompleted: boolean;
  onStepChange: (step: PlannerStepId) => void;
  /** En review mode no hay onboarding real: la navegación no debe quedar bloqueada. */
  reviewMode?: boolean;
};

export function CareerPlannerBottomNav({
  activeStep,
  onboardingCompleted,
  onStepChange,
  reviewMode = false,
}: CareerPlannerBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#101B35] shadow-[0_-8px_24px_rgba(0,0,0,0.2)] md:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Navegación del Career Planner"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-0.5 px-1 pt-1.5">
        {PLANNER_STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const canClick = step.id === "profile" || onboardingCompleted || reviewMode;
          const Icon = PLANNER_STEP_ICONS[step.id];

          return (
            <button
              key={step.id}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onStepChange(step.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={step.label}
              className={`planner-step-button group flex min-w-0 flex-col items-center gap-0.5 bg-transparent px-0.5 py-1 shadow-none outline-none [-webkit-tap-highlight-color:transparent] ${
                canClick ? "cursor-pointer" : "cursor-not-allowed opacity-35"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 ${
                  isActive ? "text-[#D6AE4F]" : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={isActive ? 2.1 : 1.65} aria-hidden />
              </span>
              <span
                className={`max-w-full truncate px-0.5 text-[10px] font-medium leading-tight transition-colors duration-150 ${
                  isActive ? "text-[#D6AE4F]" : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {step.shortLabel}
              </span>
              {isActive ? (
                <span className="h-0.5 w-4 rounded-full bg-[#D6AE4F]" aria-hidden />
              ) : (
                <span className="h-0.5 w-4 rounded-full bg-transparent" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
