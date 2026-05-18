"use client";

import type { StudyMode } from "@/lib/study-planner/types";
import { ATPL_SUBJECTS, PPL_SUBJECTS } from "@/lib/study-planner/subjects";

type StudyModeSelectorProps = {
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
};

const MODES: { id: StudyMode; label: string; subjectCount: number }[] = [
  { id: "atpl", label: "ATPL", subjectCount: ATPL_SUBJECTS.length },
  { id: "ppl", label: "PPL", subjectCount: PPL_SUBJECTS.length },
];

export function StudyModeSelector({ mode, onModeChange }: StudyModeSelectorProps) {
  return (
    <div
      className="grid w-full grid-cols-2 gap-2"
      role="group"
      aria-label="Modo de estudio"
    >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`min-h-[56px] rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 ${
                active
                  ? "border-2 border-[#c9a454] bg-[#fffdf8] text-[#0f1a33] shadow-[0_4px_16px_rgba(201,164,84,0.18)] ring-1 ring-[#c9a454]/25"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              aria-pressed={active}
            >
              <span className="block text-[15px] font-semibold">{m.label}</span>
              <span
                className={`mt-0.5 block text-[12px] leading-snug ${
                  active ? "text-slate-600" : "text-slate-500"
                }`}
              >
                {m.subjectCount} asignaturas
              </span>
            </button>
          );
        })}
    </div>
  );
}
