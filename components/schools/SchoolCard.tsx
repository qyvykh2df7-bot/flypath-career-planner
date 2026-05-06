"use client";

import Link from "next/link";
import { routeTypeLabel } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  school: SchoolEntry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

export function SchoolCard({ school, selected, onToggleSelect }: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {routeTypeLabel(school.routeType)}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-[#0f1a33]">{school.name}</h3>
          <p className="mt-1.5 text-sm text-slate-600">
            {school.city}, {school.country} · Base {school.baseAirport}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#7a5a16]">
          {school.dataStatus}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{school.shortDescription}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onToggleSelect(school.id)}
          className={`inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
            selected
              ? "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "border border-[#0f1a33] bg-[#0f1a33] text-white hover:border-[#17284d] hover:bg-[#17284d]"
          }`}
        >
          {selected ? "Quitar de comparación" : "Añadir a comparación"}
        </button>
        <Link
          href={`/schools/${school.slug}`}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1a33] hover:bg-slate-50"
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}
