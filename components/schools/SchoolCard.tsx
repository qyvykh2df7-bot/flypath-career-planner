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

export function SchoolCard({
  school,
  selected,
  onToggleSelect,
  allowComparison,
  selectionFull,
  forcePendingListingBadge,
}: Props) {
  const badgeText = forcePendingListingBadge ? "PENDIENTE" : dataStatusLabel(school.dataStatus);
  const backgroundUrl = getSchoolCardBackgroundUrl(school);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-14px_rgba(15,26,51,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c9a454]/45 hover:shadow-[0_18px_40px_-14px_rgba(15,26,51,0.32)]">
      {/* Franja superior compacta: imagen de categoría + overlay navy + nombre a la izquierda. */}
      <div className="relative h-[66px] overflow-hidden">
        {/* Capa 1 (fallback): gradiente premium navy. Queda visible si la imagen no carga. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#0a1228] via-[#132447] to-[#1f3066]"
        />
        {/* Capa 2: imagen de categoría como background-image (cover, center). */}
        <div
          aria-hidden="true"
          role="presentation"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
        {/* Capa 3: overlay navy uniforme (suficiente contraste para texto blanco). */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#0a1228]/68" />
        {/* Capa 4: blob dorado sutil + viñeta lateral para look premium. */}
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[#c9a454]/18 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-10 bottom-[-28px] h-28 w-28 rounded-full bg-white/5 blur-2xl"
        />
        {/* Capa 5: línea dorada inferior como separador. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/55 to-transparent"
        />

        {/* Fila única: nombre (izq.) · placeholder editorial de opiniones (sin rating
            inventado: hasta que tengamos reviews verificadas reales mostramos solo el
            estado "En validación") · badge estado (der.). Misma altura de strip
            `h-[66px]`; sin wrap extra ni padding vertical en el contenedor. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center gap-2 px-4 sm:gap-2.5 sm:px-5">
          <h3
            className="min-w-0 flex-1 line-clamp-2 text-left text-[1.125rem] font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-[1.375rem]"
            title={school.name}
          >
            {school.name}
          </h3>
          <div
            className="mr-3 flex shrink-0 flex-col items-center justify-center whitespace-nowrap leading-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] sm:mr-4"
            aria-label="Opiniones FlyPath: en validación."
          >
            <span className="text-[13px] font-extrabold uppercase leading-none tracking-[0.08em] text-[#f2ddaa] sm:text-[14px]">
              Opiniones
            </span>
            <span
              className="mt-1 hidden text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-white/85 sm:block sm:text-[11px]"
              aria-hidden="true"
            >
              En validación
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] backdrop-blur-sm ${
              forcePendingListingBadge
                ? "border-amber-200/55 bg-amber-100/15 text-amber-100"
                : "border-[#c9a454]/55 bg-[#c9a454]/15 text-[#f2ddaa]"
            }`}
          >
            {badgeText}
          </span>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <p className="text-[15px] text-slate-500">
          {school.city}, {school.country} · Base {school.baseAirport}
        </p>

        {/* Botones inferiores: principal dorado de marca + secundario outline */}
        <div className="mt-auto flex flex-wrap items-stretch gap-2.5 pt-5">
          {allowComparison || selected ? (
            <button
              type="button"
              disabled={Boolean(selectionFull && !selected)}
              title={
                selectionFull && !selected ? "Ya has seleccionado el máximo de escuelas para comparar (2)." : undefined
              }
              onClick={() => onToggleSelect(school.id)}
              className={`inline-flex min-h-[40px] flex-1 basis-[140px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 disabled:cursor-not-allowed disabled:opacity-55 ${
                selected
                  ? "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "border border-[#c9a454] bg-[#c9a454] text-[#0f1a33] shadow-sm hover:border-[#ddb75c] hover:bg-[#ddb75c]"
              }`}
            >
              {selected ? "Quitar de comparación" : "Añadir a comparación"}
            </button>
          ) : (
            <span
              role="status"
              title="Esta entidad aún no tiene datos mínimos comparables en FlyPath."
              className="inline-flex min-h-[40px] flex-1 basis-[140px] cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-500"
            >
              Pendiente de datos
            </span>
          )}
          <Link
            href={`/schools/${school.slug}`}
            className="inline-flex min-h-[40px] flex-1 basis-[120px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-[#0f1a33] transition hover:border-[#0f1a33]/55 hover:bg-slate-50"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </article>
  );
}
