"use client";

import type { SchoolEntry } from "@/types/schools";

type Props = {
  selectedSchools: SchoolEntry[];
  onRemove: (id: string) => void;
};

export function ComparisonPanel({ selectedSchools, onRemove }: Props) {
  const count = selectedSchools.length;
  const helperText =
    count === 0
      ? "Añade al menos 2 escuelas para desbloquear la comparación visual."
      : count === 1
        ? "Selecciona al menos una escuela más para comparar."
        : "Comparación lista. Puedes revisar el resumen comparativo más abajo.";
  return (
    <section
      className={`rounded-3xl border shadow-sm transition ${
        count >= 2
          ? "border-[#c9a454]/35 bg-[#0f1a33] p-5 text-white"
          : count === 0
            ? "border-[#c9a454]/25 bg-white px-4 py-3 text-[#0f1a33]"
            : "border-[#c9a454]/20 bg-[#13213f] px-4 py-3.5 text-white"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${
          count >= 2 ? "text-[#f2ddaa]" : count === 0 ? "text-[#7a5a16]" : "text-[#f2ddaa]"
        }`}
      >
        Comparación activa
      </p>
      <p
        className={`mt-1 ${count >= 2 ? "text-sm text-slate-200" : count === 0 ? "text-[13px] text-slate-600" : "text-[13px] text-slate-200"}`}
      >
        {count}/3 escuelas seleccionadas
      </p>
      <p
        className={`mt-1 ${count >= 2 ? "text-sm text-slate-300" : count === 0 ? "text-[12px] text-slate-500" : "text-[12px] text-slate-300"}`}
      >
        {helperText}
      </p>
      <div className={`flex flex-wrap gap-2 ${count >= 2 ? "mt-3" : "mt-2.5"}`}>
        {selectedSchools.map((school) => (
          <span
            key={school.id}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs"
          >
            {school.name}
            <button
              type="button"
              onClick={() => onRemove(school.id)}
              className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-white/30"
            >
              Quitar
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}

