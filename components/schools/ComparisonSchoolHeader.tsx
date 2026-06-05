"use client";

import { dataStatusLabel, getSchoolCardBackgroundUrl } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  school: SchoolEntry;
  displayName: string;
  routeLabel: string;
  locationText: string;
  programChip?: React.ReactNode;
};

function statusPillLabel(status: SchoolEntry["dataStatus"]): string {
  const label = dataStatusLabel(status);
  if (label === "Verificada") return "VERIFICADA";
  if (label === "En revisión") return "EN REVISIÓN";
  return label.toUpperCase();
}

export function ComparisonSchoolHeader({
  school,
  displayName,
  routeLabel,
  locationText,
  programChip,
}: Props) {
  const backgroundUrl = getSchoolCardBackgroundUrl(school);
  const pillLabel = statusPillLabel(school.dataStatus);
  const pillIsVerified = pillLabel === "VERIFICADA";

  return (
    <div className="relative overflow-hidden rounded-t-2xl border-b border-[#c9a454]/20">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#0a1228] via-[#132447] to-[#1f3066]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div aria-hidden className="absolute inset-0 bg-[#0a1228]/74" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/55 to-transparent"
      />

      <div className="relative z-10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-lg font-bold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] lg:text-xl">
              {displayName}
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-white/90">{locationText}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f2ddaa]">
                {routeLabel}
              </span>
              {programChip}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:justify-start sm:gap-0.5">
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                pillIsVerified
                  ? "border-emerald-300/55 bg-emerald-50/95 text-emerald-900"
                  : "border-amber-300/50 bg-amber-50/95 text-amber-950"
              }`}
            >
              {pillLabel}
            </span>
            <span className="min-w-0 text-right text-[8px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#f2ddaa]/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] sm:hidden">
              Opiniones en validación
            </span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]/95 sm:block">
              Opiniones
            </span>
            <span className="hidden text-[8px] font-medium uppercase tracking-[0.12em] text-white/75 sm:block">
              En validación
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
