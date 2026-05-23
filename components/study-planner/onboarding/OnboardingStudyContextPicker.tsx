"use client";

import type { InitialStudyContext } from "@/lib/study-planner/types";
import { INITIAL_STUDY_CONTEXT_OPTIONS } from "@/lib/study-planner/initial-subject-state";

type OnboardingStudyContextPickerProps = {
  value: InitialStudyContext;
  onChange: (value: InitialStudyContext) => void;
};

export function OnboardingStudyContextPicker({
  value,
  onChange,
}: OnboardingStudyContextPickerProps) {
  return (
    <div className="space-y-2">
      {INITIAL_STUDY_CONTEXT_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
              selected
                ? "border-[#c9a454]/50 bg-[#fff8e8] ring-1 ring-[#c9a454]/25"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-[14px] font-semibold text-[#0f1a33]">{opt.label}</p>
            <p className="mt-0.5 text-[13px] text-slate-500">{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
