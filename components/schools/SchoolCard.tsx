"use client";

import Link from "next/link";
import { routeTypeLabel, confidenceLabel, getPriceGap } from "@/lib/schools/utils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  school: SchoolEntry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function SchoolCard({ school, selected, onToggleSelect }: Props) {
  const gap = getPriceGap(school);
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {routeTypeLabel(school.routeType)}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#0f1a33]">{school.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {school.city}, {school.country} · Base {school.baseAirport}
          </p>
        </div>
        <span className="rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#7a5a16]">
          {school.dataStatus}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{school.shortDescription}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500">Precio anunciado</p>
          <p className="text-sm font-semibold text-[#0f1a33]">{euro(school.advertisedPriceEUR)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500">Coste real estimado FlyPath</p>
          <p className="text-sm font-semibold text-[#0f1a33]">{euro(school.flypathEstimatedRealCostEUR)}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <p className="text-[11px] text-slate-500">Brecha</p>
          <p className="text-sm font-semibold text-[#0f1a33]">{euro(gap)}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <p className="text-[11px] text-slate-500">Transparencia</p>
          <p className="text-sm font-semibold text-[#0f1a33]">{school.scores.documentTransparency}/100</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <p className="text-[11px] text-slate-500">Confianza dato</p>
          <p className="text-sm font-semibold text-[#0f1a33]">
            {confidenceLabel(school.dataConfidence)} ({school.scores.dataConfidenceScore}/100)
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onToggleSelect(school.id)}
          className={`inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
            selected
              ? "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-[#c9a454] text-[#0f1a33] hover:bg-[#ddb75c]"
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

