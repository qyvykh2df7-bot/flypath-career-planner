"use client";

import type { StudyMode } from "@/lib/study-planner/types";

type StudyModeSelectorProps = {
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
};

export function StudyModeSelector({ mode, onModeChange }: StudyModeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onModeChange("atpl")}
        className={`rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:px-5 sm:py-5 ${
          mode === "atpl"
            ? "border-[#c9a454] bg-[#fff8e8] shadow-[0_4px_20px_rgba(201,164,84,0.2)] ring-1 ring-[#c9a454]/30"
            : "border-slate-200/90 bg-white hover:border-[#c9a454]/35 hover:bg-[#fffdf8]"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">ATPL</p>
        <p className="mt-1.5 text-lg font-semibold text-[#0f1a33]">Modo ATPL</p>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          Para alumnos ATPL que necesitan controlar asignaturas, bancos, mocks y carga semanal.
        </p>
      </button>
      <button
        type="button"
        onClick={() => onModeChange("ppl")}
        className={`rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:px-5 sm:py-5 ${
          mode === "ppl"
            ? "border-[#c9a454] bg-[#fff8e8] shadow-[0_4px_20px_rgba(201,164,84,0.2)] ring-1 ring-[#c9a454]/30"
            : "border-slate-200/90 bg-white hover:border-[#c9a454]/35 hover:bg-[#fffdf8]"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">PPL</p>
        <p className="mt-1.5 text-lg font-semibold text-[#0f1a33]">Modo PPL</p>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          Para alumnos que están preparando teoría PPL y quieren organizar asignaturas, horas y repasos.
        </p>
        <p className="mt-2 text-[12px] leading-snug text-slate-500">
          Opción compatible dentro de <span className="font-semibold text-[#0f1a33]">ATPL Planner</span>.
        </p>
      </button>
    </div>
  );
}
