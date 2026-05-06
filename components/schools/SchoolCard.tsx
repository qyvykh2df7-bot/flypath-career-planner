"use client";

import Link from "next/link";
import { dataStatusLabel } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  school: SchoolEntry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

export function SchoolCard({ school, selected, onToggleSelect }: Props) {
  return (
    <article className="relative rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-5 shadow-[0_10px_26px_-18px_rgba(15,26,51,0.35)] sm:p-6">
      <span
        aria-hidden="true"
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-[#0f1a33]/85"
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 pl-2">
          <h3 className="text-[1.08rem] font-semibold leading-tight text-[#0f1a33] sm:text-[1.12rem]">
            {school.name}
          </h3>
          <p className="mt-1.5 text-[13px] text-slate-500 sm:text-sm">
            {school.city}, {school.country} · Base {school.baseAirport}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full border border-[#c9a454]/30 bg-[#fffaf0] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#7a5a16]">
          {dataStatusLabel(school.dataStatus)}
        </span>
      </div>
      <p className="mt-3.5 pl-2 text-sm leading-6 text-slate-600">{school.shortDescription}</p>
      <div className="mt-5 flex flex-wrap gap-2.5 pl-2">
        <button
          type="button"
          onClick={() => onToggleSelect(school.id)}
          className={`inline-flex min-h-[38px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
            selected
              ? "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "border border-[#0f1a33] bg-[#0f1a33] text-white hover:border-[#17284d] hover:bg-[#17284d]"
          }`}
        >
          {selected ? "Quitar de comparación" : "Añadir a comparación"}
        </button>
        <Link
          href={`/schools/${school.slug}`}
          className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-[#0f1a33] hover:bg-slate-50"
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}
