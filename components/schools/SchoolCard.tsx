"use client";

import Link from "next/link";
import {
  dataStatusLabel,
  getSchoolCardBackgroundUrl,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  school: SchoolEntry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  /** Si es false, no se puede añadir a comparación desde esta card (listado pendientes). */
  allowComparison: boolean;
  /** True cuando ya hay el máximo de escuelas en comparación y esta card no está seleccionada. */
  selectionFull?: boolean;
  /** En la sección secundaria del listado, el badge muestra siempre “PENDIENTE”. */
  forcePendingListingBadge?: boolean;
};

function statusPillLabel(badgeText: string, forcePendingListingBadge?: boolean): string {
  if (forcePendingListingBadge) return "EN REVISIÓN";
  if (badgeText === "Verificada") return "VERIFICADA";
  if (badgeText === "En revisión") return "EN REVISIÓN";
  return badgeText.toUpperCase();
}

export function SchoolCard({
  school,
  selected,
  onToggleSelect,
  allowComparison,
  selectionFull,
  forcePendingListingBadge,
}: Props) {
  const badgeText = forcePendingListingBadge ? "PENDIENTE" : dataStatusLabel(school.dataStatus);
  const pillLabel = statusPillLabel(badgeText, forcePendingListingBadge);
  const backgroundUrl = getSchoolCardBackgroundUrl(school);
  const locationLine = `${school.city}, ${school.country} · Base ${school.baseAirport}`;
  const pillIsVerified = pillLabel === "VERIFICADA";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-[0_6px_20px_-12px_rgba(15,26,51,0.22)] transition duration-300 hover:border-[#c9a454]/40 hover:shadow-[0_12px_28px_-12px_rgba(15,26,51,0.28)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#0a1228] via-[#132447] to-[#1f3066]"
      />
      <div
        aria-hidden="true"
        role="presentation"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#0a1228]/72" />
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[#c9a454]/18 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/55 to-transparent"
      />

      <div className="relative z-10 flex flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-2.5">
        {/* Izquierda: nombre + ubicación */}
        <div className="min-w-0 flex-1 sm:max-w-[36%]">
          <h3
            className="truncate text-[1rem] font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-[1.1rem]"
            title={school.name}
          >
            {school.name}
          </h3>
          <p className="mt-0.5 truncate text-[11px] font-medium text-white/85 sm:text-[12px]" title={locationLine}>
            {locationLine}
          </p>
        </div>

        {/* Centro-derecha: opiniones (texto) + pill única */}
        <div className="flex shrink-0 items-center gap-3 sm:ml-auto sm:mr-1">
          <div
            className="flex shrink-0 flex-col whitespace-nowrap leading-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]"
            aria-label="Opiniones FlyPath: en validación."
          >
            <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#f2ddaa] sm:text-[11px]">
              Opiniones
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/80 sm:text-[10px]">
              En validación
            </span>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] backdrop-blur-sm sm:text-[10px] ${
              pillIsVerified
                ? "border-emerald-200/50 bg-emerald-500/15 text-emerald-100"
                : forcePendingListingBadge
                  ? "border-amber-200/55 bg-amber-100/15 text-amber-100"
                  : "border-[#c9a454]/55 bg-[#c9a454]/15 text-[#f2ddaa]"
            }`}
          >
            {pillLabel}
          </span>
        </div>

        {/* Derecha: acciones */}
        <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          {allowComparison || selected ? (
            <button
              type="button"
              disabled={Boolean(selectionFull && !selected)}
              title={
                selectionFull && !selected
                  ? "Ya has seleccionado el máximo de escuelas para comparar (2)."
                  : undefined
              }
              onClick={() => onToggleSelect(school.id)}
              className={`inline-flex min-h-[32px] w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:min-w-[132px] sm:text-[12px] ${
                selected
                  ? "border border-white/35 bg-white/12 text-white hover:bg-white/22"
                  : "border border-[#c9a454] bg-[#c9a454] text-[#0f1a33] shadow-sm hover:border-[#ddb75c] hover:bg-[#ddb75c]"
              }`}
            >
              {selected ? "Quitar de comparación" : "Añadir a comparación"}
            </button>
          ) : (
            <span
              role="status"
              title="Esta entidad aún no tiene datos mínimos comparables en FlyPath."
              className="inline-flex min-h-[32px] w-full cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-white/35 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 sm:w-auto sm:min-w-[132px] sm:text-[12px]"
            >
              Pendiente de datos
            </span>
          )}
          <Link
            href={`/schools/${school.slug}`}
            className="inline-flex min-h-[32px] w-full items-center justify-center rounded-lg border border-white/35 bg-white/8 px-2.5 py-1.5 text-[11px] font-semibold text-white/95 transition hover:border-white/50 hover:bg-white/15 sm:w-auto sm:min-w-[96px] sm:text-[12px]"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </article>
  );
}
