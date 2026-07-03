"use client";

import { useCallback, useRef, useState } from "react";

type ProcessStep = {
  readonly step: string;
  readonly title: string;
  readonly text: string;
};

export function MentoriasMobileProcess({ steps }: { steps: readonly ProcessStep[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || steps.length <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveStep(Math.min(steps.length - 1, Math.max(0, index)));
  }, [steps.length]);

  return (
    <div className="sm:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="-mx-6 flex snap-x snap-mandatory overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step) => (
          <div
            key={step.step}
            className="relative flex min-w-full shrink-0 snap-center flex-col items-center px-1 text-center"
          >
            <span className="relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D6AE4F]/55 bg-white text-[15px] font-semibold text-[#0f1a33] shadow-[0_4px_16px_rgba(7,18,36,0.08)]">
              {step.step}
            </span>
            <h3 className="mt-4 text-[16px] font-semibold leading-snug text-[#071224]">
              {step.title}
            </h3>
            <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-[#4B5563]">
              {step.text}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2" aria-hidden>
        {steps.map((step, index) => (
          <span
            key={step.step}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              index === activeStep ? "bg-[#D6AE4F]" : "bg-[#0f1a33]/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
