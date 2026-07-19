"use client";

import { useEffect, useMemo, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Database,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  plannerBody,
  plannerEyebrow,
  plannerSubcard,
  plannerTitle,
} from "./planner-surface";
import type { School, YesNoUnknown } from "@/lib/reporting/types/shared";
import type { PublicSchoolReviewSummary } from "@/lib/school-reviews/contracts";
import {
  buildSchoolReviewSummariesPath,
  formatSchoolReviewRating,
  schoolReviewSummaryStarFillPercent,
  schoolReviewSummaryToFive,
} from "@/lib/school-reviews/presentation";
import type { SchoolEntry } from "@/types/schools";
import { getSchoolBySlug } from "@/lib/schools/schoolUtils";
import {
  getProgramOptionsForEntry,
  isPlannerFlypathDatabaseSchool,
  parsePlannerSchoolLink,
  plannerSchoolReviewsHref,
  plannerSchoolsDataSourceLabel,
  schoolProgramPillLabel,
  schoolCardEstadoLabel,
  type PlannerProgramOption,
} from "@/lib/planner-school-database";

/** Misma imagen que el badge histórico «Explorar base de datos FlyPath». */
const FLYPATH_DATABASE_CARD_BG = "/school-card-bg/cadet-airline.webp";

/** Rejilla fija de 7 columnas en cards seleccionadas (≥900px). */
const SELECTED_SCHOOL_DESKTOP_GRID =
  "min-w-0 flex-1 grid-cols-[minmax(140px,1fr)_220px_108px_92px_132px_minmax(88px,auto)_40px] items-center gap-x-3 gap-y-0 py-3 pl-5 pr-4";

const PROGRAM_PILL_TRACK =
  "inline-flex h-7 shrink-0 items-center rounded-lg border border-[#0f1a33]/10 bg-[#f4f2ec] p-0.5";

const PROGRAM_PILL_ACTIVE =
  "whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#0f1a33] shadow-sm ring-1 ring-[#c9a454]/35 sm:px-2.5 sm:py-1 sm:text-[11px]";

type SchoolReviewSummaryResponse = { items?: PublicSchoolReviewSummary[] };

function euro(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function locationLabel(school: School): string | null {
  const parts = [school.ciudad, school.pais].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px] text-[#0f1a33] outline-none ring-[#1d4ed8]/20 focus:ring-2";

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[#0f1a33]">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[#0f1a33]">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[#0f1a33]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgramPillSwitch({
  options,
  activeKey,
  onSelect,
}: {
  options: PlannerProgramOption[];
  activeKey: string;
  onSelect: (opt: PlannerProgramOption) => void;
}) {
  return (
    <div className={PROGRAM_PILL_TRACK} role="group" aria-label="Tipo de programa">
      {options.map((opt) => {
        const active = opt.key === activeKey;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt)}
            className={`cursor-pointer whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 sm:px-2 sm:py-1 sm:text-[11px] ${
              active
                ? "bg-white text-[#0f1a33] shadow-sm ring-1 ring-[#c9a454]/35"
                : "text-[#5a6b85] hover:text-[#0f1a33]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ProgramPillStatic({ label }: { label: string }) {
  return (
    <div className={PROGRAM_PILL_TRACK}>
      <span className={PROGRAM_PILL_ACTIVE}>{label}</span>
    </div>
  );
}

function PublicReviewRating({
  summary,
  loading,
  href,
}: {
  summary: PublicSchoolReviewSummary | undefined;
  loading: boolean;
  href: string;
}) {
  const rating = schoolReviewSummaryToFive(summary);
  if (loading) {
    return <span className="text-[11px] font-medium text-[#5a6b85]">Cargando opiniones…</span>;
  }

  if (rating === null) {
    return (
      <Link
        href={href}
        className="inline-flex min-h-7 items-center rounded-md px-0.5 text-[11px] font-medium text-[#5a6b85] transition hover:bg-[#FAF9F6] hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45"
      >
        Sin opiniones
      </Link>
    );
  }

  const total = summary?.total ?? 0;
  return (
    <Link
      href={href}
      className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md px-0.5 py-0.5 transition hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45"
      aria-label={`Ver ${total} ${total === 1 ? "opinión aprobada" : "opiniones aprobadas"} de la escuela (valoración ${formatSchoolReviewRating(rating)} de 5)`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className="relative block h-3.5 w-3.5">
            <Star className="absolute inset-0 h-3.5 w-3.5 text-slate-300" aria-hidden />
            <span
              className="absolute inset-y-0 left-0 block overflow-hidden"
              style={{ width: `${schoolReviewSummaryStarFillPercent(summary, index)}%` }}
            >
              <Star className="h-3.5 w-3.5 fill-[#c9a454] text-[#c9a454]" aria-hidden />
            </span>
          </span>
        ))}
      </span>
      <span className="hidden whitespace-nowrap text-[11px] font-medium text-[#5a6b85] min-[1100px]:inline">
        {formatSchoolReviewRating(rating)}/5 · {total}
      </span>
    </Link>
  );
}

type SchoolDatabasePickerProps = {
  schools: School[];
  catalog: SchoolEntry[];
  onAddFromDatabase: (entry: SchoolEntry, option: PlannerProgramOption) => string | null;
  onRemoveSchool: (id: number) => void;
  onClose: () => void;
};

/** Buscador compacto de la base de datos FlyPath: búsqueda + lista + añadir/quitar. Reutilizable como popover o en línea. */
export function SchoolDatabasePicker({
  schools,
  catalog,
  onAddFromDatabase,
  onRemoveSchool,
  onClose,
}: SchoolDatabasePickerProps) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const selectedSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const school of schools) {
      const link = parsePlannerSchoolLink(school.enlaceReferencia);
      if (link) slugs.add(link.slug);
    }
    return slugs;
  }, [schools]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.city.toLowerCase().includes(q) ||
        entry.country.toLowerCase().includes(q),
    );
  }, [catalog, query]);

  const handleAddEntry = (entry: SchoolEntry) => {
    const options = getProgramOptionsForEntry(entry);
    const option = options[0];
    if (!option) return;
    const message = onAddFromDatabase(entry, option);
    if (message) {
      setNotice(message);
      return;
    }
    setNotice(null);
  };

  const handleToggleEntry = (entry: SchoolEntry) => {
    if (selectedSlugs.has(entry.slug)) {
      const selected = schools.find(
        (school) => parsePlannerSchoolLink(school.enlaceReferencia)?.slug === entry.slug,
      );
      if (selected) onRemoveSchool(selected.id);
      setNotice(null);
      return;
    }
    handleAddEntry(entry);
  };

  return (
    <div className="w-full rounded-xl border border-[#c9a454]/30 bg-white p-3.5 shadow-[0_16px_40px_-12px_rgba(15,26,51,0.35)] ring-1 ring-[#0f1a33]/8">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-[#0f1a33]">Escuelas FlyPath</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[#5a6b85] transition hover:bg-slate-50 hover:text-[#0f1a33]"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Cerrar
        </button>
      </div>
      <div className="relative mt-2.5">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a6b85]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ciudad…"
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-[14px] text-[#0f1a33] outline-none focus:border-[#c9a454]/50 focus:ring-2 focus:ring-[#D6AE4F]/30"
        />
      </div>
      {notice ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900 ring-1 ring-amber-200/80">
          {notice}
        </p>
      ) : null}
      <ul className="mt-2 max-h-[min(260px,45vh)] overflow-y-auto overscroll-contain rounded-lg border border-slate-100">
        {filteredCatalog.length === 0 ? (
          <li className="px-3 py-5 text-center text-[13px] text-[#5a6b85]">No hay resultados.</li>
        ) : (
          filteredCatalog.map((entry) => {
            const already = selectedSlugs.has(entry.slug);
            return (
              <li
                key={entry.slug}
                className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0f1a33]">{entry.name}</p>
                  <p className="truncate text-[11px] text-[#5a6b85]">
                    {[entry.city, entry.country].filter(Boolean).join(", ")}
                    {entry.advertisedPriceEUR > 0 ? ` · ${euro(entry.advertisedPriceEUR)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleEntry(entry)}
                  className={`shrink-0 cursor-pointer rounded-md border px-2.5 py-0.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                    already
                      ? "border-rose-200/90 bg-rose-50 text-rose-800 hover:border-rose-300 hover:bg-rose-100 focus-visible:ring-rose-300/50"
                      : "border-[#0f1a33]/12 bg-white text-[#0f1a33] hover:border-[#c9a454]/40 hover:bg-[#FFFCF7] focus-visible:ring-[#0f1a33]/20"
                  }`}
                >
                  {already ? "Quitar" : "Añadir"}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

type SelectedSchoolCardProps = {
  school: School;
  reviewSummary: PublicSchoolReviewSummary | undefined;
  reviewsLoading: boolean;
  onUpdateProgram: (schoolId: number, entry: SchoolEntry, option: PlannerProgramOption) => void;
  onEditSchool: (school: School) => void;
  onRemoveSchool: (id: number) => void;
};

function SelectedSchoolCard({
  school,
  reviewSummary,
  reviewsLoading,
  onUpdateProgram,
  onEditSchool,
  onRemoveSchool,
}: SelectedSchoolCardProps) {
  const link = parsePlannerSchoolLink(school.enlaceReferencia);
  const isFromDatabase = isPlannerFlypathDatabaseSchool(school);
  const entry = link ? getSchoolBySlug(link.slug) : undefined;
  const programOptions = entry ? getProgramOptionsForEntry(entry) : [];
  const activeKey = link?.profileKey ?? programOptions[0]?.key ?? "default";
  const activeOption = programOptions.find((o) => o.key === activeKey) ?? programOptions[0];
  const location = locationLabel(school);
  const programaLabel = activeOption?.label ?? schoolProgramPillLabel(school.programa);
  const estado = schoolCardEstadoLabel(school);
  const reviewsHref = plannerSchoolReviewsHref(link?.slug ?? null);
  const comparatorHref = link
    ? `/schools?add=${encodeURIComponent(link.slug)}&from=planner`
    : null;

  const estadoBadgeClass =
    estado === "VERIFICADA"
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
      : "border-amber-200/80 bg-amber-50 text-amber-900";

  const priceLabel =
    school.precioAnunciado > 0 ? euro(school.precioAnunciado) : "Precio sin definir";
  const priceIsDefined = school.precioAnunciado > 0;

  const programNode =
    programOptions.length > 1 && entry ? (
      <ProgramPillSwitch
        options={programOptions}
        activeKey={activeKey}
        onSelect={(opt) => onUpdateProgram(school.id, entry, opt)}
      />
    ) : (
      <ProgramPillStatic label={programaLabel} />
    );

  const mobilePrimaryAction =
    isFromDatabase && comparatorHref ? (
      <Link
        href={comparatorHref}
        className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-lg border border-[#B8943F]/45 bg-[#D6AE4F]/12 px-3 py-2 text-[13px] font-semibold text-[#5c4820] transition hover:border-[#B8943F]/65 hover:bg-[#D6AE4F]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40"
      >
        Ver en comparador
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => onEditSchool(school)}
        className="inline-flex min-h-[36px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#0f1a33]/14 bg-white px-3 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1a33]/20"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Editar
      </button>
    );

  const desktopPrimaryAction =
    isFromDatabase && comparatorHref ? (
      <Link
        href={comparatorHref}
        className="inline-flex min-h-[32px] shrink-0 items-center justify-center rounded-lg border border-[#B8943F]/45 bg-[#D6AE4F]/12 px-3 py-1.5 text-[12px] font-semibold text-[#5c4820] transition hover:border-[#B8943F]/65 hover:bg-[#D6AE4F]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40"
      >
        Ver en comparador
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => onEditSchool(school)}
        className="inline-flex min-h-[32px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#0f1a33]/14 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0f1a33] transition hover:bg-[#FAF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1a33]/20"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Editar
      </button>
    );

  return (
    <li className="relative overflow-hidden rounded-2xl border border-[#0f1a33]/10 bg-white shadow-[0_6px_20px_-10px_rgba(15,26,51,0.2)]">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-sm bg-gradient-to-b from-[#c9a454] via-[#e8c97a] to-[#d6ae4f]/30 shadow-[2px_0_10px_rgba(201,164,84,0.28)]"
      />

      {/* Mobile: jerarquía vertical compacta */}
      <div className="flex flex-col gap-2.5 py-3 pl-5 pr-3 min-[900px]:hidden">
        <div className="min-w-0 pr-1">
          <h4 className="text-[15px] font-bold leading-snug text-[#0f1a33]">{school.nombre}</h4>
          {location ? (
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#5a6b85]">
              <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span>{location}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[12px] text-slate-400">Sin ubicación</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            {programNode}
          </div>
          <div className="shrink-0">
            {priceIsDefined ? (
              <span className="whitespace-nowrap text-[15px] font-bold tabular-nums text-[#5c4820]">
                {priceLabel}
              </span>
            ) : (
              <span className="whitespace-nowrap text-[13px] text-[#5a6b85]">{priceLabel}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estadoBadgeClass}`}
          >
            {estado}
          </span>
          {isFromDatabase ? (
            <PublicReviewRating summary={reviewSummary} loading={reviewsLoading} href={reviewsHref} />
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5">
          {mobilePrimaryAction}
          <button
            type="button"
            onClick={() => onRemoveSchool(school.id)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-rose-200/80 p-2.5 text-rose-800 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50"
            aria-label={`Eliminar ${school.nombre}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className={`hidden min-[900px]:grid ${SELECTED_SCHOOL_DESKTOP_GRID}`}>
        {/* Col 1: nombre + ubicación */}
        <div className="min-w-0">
          <h4 className="truncate text-[15px] font-bold leading-tight text-[#0f1a33]">
            {school.nombre}
          </h4>
          {location ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#5a6b85] sm:text-[13px]">
              <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">{location}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[12px] text-slate-400">Sin ubicación</p>
          )}
        </div>

        {/* Col 2: programa (columna fija 220px) */}
        <div className="flex w-full min-w-0 max-w-[220px] items-center justify-start overflow-x-auto overscroll-x-contain [scrollbar-width:thin] min-[900px]:w-[220px]">
          {programNode}
        </div>

        {/* Col 3: precio */}
        <div className="min-w-0 tabular-nums min-[900px]:w-[108px]">
          {priceIsDefined ? (
            <span className="whitespace-nowrap text-[14px] font-bold text-[#5c4820]">{priceLabel}</span>
          ) : (
            <span className="whitespace-nowrap text-[13px] text-[#5a6b85]">{priceLabel}</span>
          )}
        </div>

        {/* Col 4: estado */}
        <div className="flex min-w-0 items-center min-[900px]:w-[92px]">
          <span
            className={`inline-flex w-[5.75rem] items-center justify-center rounded-full border px-2 py-0.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-[11px] ${estadoBadgeClass}`}
          >
            {estado}
          </span>
        </div>

        {/* Col 5: rating */}
        <div className="flex min-h-7 w-full items-center justify-start min-[900px]:w-[132px]">
          {isFromDatabase ? (
            <PublicReviewRating summary={reviewSummary} loading={reviewsLoading} href={reviewsHref} />
          ) : null}
        </div>

        {/* Col 6: acción principal */}
        <div className="flex items-center min-[900px]:justify-start">{desktopPrimaryAction}</div>

        {/* Col 7: eliminar */}
        <div className="flex items-center justify-start min-[900px]:w-[40px] min-[900px]:justify-center">
          <button
            type="button"
            onClick={() => onRemoveSchool(school.id)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-rose-200/80 p-2 text-rose-800 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50"
            aria-label={`Eliminar ${school.nombre}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

const YES_NO_UNKNOWN_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no_se", label: "No lo sé" },
];

const PROGRAMA_ADVANCED_OPTIONS = [
  { value: "integrado", label: "Integrado" },
  { value: "modular", label: "Modular" },
  { value: "cadet", label: "Cadet" },
  { value: "no_lo_se", label: "Carrera universitaria / No definido" },
];

const ESTADO_VERIFICACION_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "verificado", label: "Verificado" },
  { value: "parcialmente_verificado", label: "Parcialmente verificado" },
  { value: "no_verificado", label: "No verificado" },
];

const FUENTE_PRECIO_OPTIONS = [
  { value: "usuario", label: "Usuario / manual" },
  { value: "web_oficial", label: "Web oficial" },
  { value: "email_escuela", label: "Email escuela" },
  { value: "llamada", label: "Llamada" },
  { value: "folleto", label: "Folleto" },
  { value: "alumno", label: "Alumno" },
  { value: "redes", label: "Redes" },
  { value: "no_verificado", label: "No verificado" },
];

const PROMESAS_EMPLEO_OPTIONS = [
  { value: "no_se", label: "No lo sé" },
  { value: "ninguna", label: "Ninguna" },
  { value: "vagas", label: "Vagas" },
  { value: "claras_no_garantizadas", label: "Claras, no garantizadas" },
  { value: "garantia_contractual", label: "Garantía contractual" },
];

type SchoolManualFormProps = {
  formPanelRef: RefObject<HTMLDivElement | null>;
  schoolEditActiveId: number | null;
  newSchool: School;
  setNewSchool: Dispatch<SetStateAction<School>>;
  onSaveSchool: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
};

/** Formulario compacto para añadir/editar una escuela manualmente. Reutilizable dentro o fuera del gestor completo. */
export function SchoolManualForm({
  formPanelRef,
  schoolEditActiveId,
  newSchool,
  setNewSchool,
  onSaveSchool,
  onCancelEdit,
  onClose,
}: SchoolManualFormProps) {
  return (
    <section
      ref={formPanelRef}
      className="rounded-xl bg-white p-5 text-[#0f1a33] shadow-sm ring-1 ring-white/20 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#0f1a33]">
            {schoolEditActiveId !== null
              ? `Editar escuela: ${newSchool.nombre.trim() || "—"}`
              : "Añadir escuela manualmente"}
          </h3>
          <p className="mt-1 text-[13px] text-[#2a3a55]">
            Introduce los datos básicos. Podrás afinarlos después en el informe.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-[#2a3a55] transition hover:bg-slate-50"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Tipo de programa"
          value={newSchool.programa === "cadet" ? "no_lo_se" : newSchool.programa}
          options={[
            { value: "integrado", label: "Integrado" },
            { value: "modular", label: "Modular" },
            { value: "no_lo_se", label: "Carrera universitaria / No definido" },
          ]}
          onChange={(v) => setNewSchool((s) => ({ ...s, programa: v as School["programa"] }))}
        />
        <TextField
          label="Nombre"
          value={newSchool.nombre}
          onChange={(v) => setNewSchool((s) => ({ ...s, nombre: v }))}
        />
        <TextField
          label="País"
          value={newSchool.pais}
          onChange={(v) => setNewSchool((s) => ({ ...s, pais: v }))}
        />
        <TextField
          label="Ciudad"
          value={newSchool.ciudad}
          onChange={(v) => setNewSchool((s) => ({ ...s, ciudad: v }))}
        />
        <NumberField
          label="Precio anunciado"
          value={newSchool.precioAnunciado}
          onChange={(v) => setNewSchool((s) => ({ ...s, precioAnunciado: v }))}
        />
        <NumberField
          label="Duración en meses"
          value={newSchool.duracionMeses}
          onChange={(v) => setNewSchool((s) => ({ ...s, duracionMeses: v }))}
        />
        <SelectField
          label="Contrato antes de pagar"
          value={newSchool.contratoAntesPagar}
          options={YES_NO_UNKNOWN_OPTIONS}
          onChange={(v) => setNewSchool((s) => ({ ...s, contratoAntesPagar: v as YesNoUnknown }))}
        />
        <SelectField
          label="Política de reembolso clara"
          value={newSchool.reembolsoClaro}
          options={YES_NO_UNKNOWN_OPTIONS}
          onChange={(v) => setNewSchool((s) => ({ ...s, reembolsoClaro: v as YesNoUnknown }))}
        />
        <SelectField
          label="Calendario de pagos claro"
          value={newSchool.calendarioPagosClaro}
          options={YES_NO_UNKNOWN_OPTIONS}
          onChange={(v) => setNewSchool((s) => ({ ...s, calendarioPagosClaro: v as YesNoUnknown }))}
        />
      </div>

      <details className="group mt-5 rounded-xl border border-slate-200/90 bg-[#FAFAF8]">
        <summary className="cursor-pointer list-none px-4 py-3.5 text-[14px] font-semibold text-[#0f1a33] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            Datos avanzados para el informe
            <ChevronDown
              className="h-4 w-4 text-[#5a6b85] transition group-open:rotate-180"
              aria-hidden
            />
          </span>
        </summary>
        <div className="border-t border-slate-200/80 px-4 pb-4 pt-3">
          <p className="text-[12px] leading-relaxed text-[#5a6b85]">
            Opcional. Cuantos más datos añadas, más completo será el informe premium.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="Programa"
              value={newSchool.programa}
              options={PROGRAMA_ADVANCED_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, programa: v as School["programa"] }))}
            />
            <SelectField
              label="Estado de verificación"
              value={newSchool.estadoVerificacion}
              options={ESTADO_VERIFICACION_OPTIONS}
              onChange={(v) =>
                setNewSchool((s) => ({ ...s, estadoVerificacion: v as School["estadoVerificacion"] }))
              }
            />
            <SelectField
              label="Fuente del precio"
              value={newSchool.fuentePrecio}
              options={FUENTE_PRECIO_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, fuentePrecio: v as School["fuentePrecio"] }))}
            />
            <NumberField
              label="Depósito requerido"
              value={newSchool.depositoRequerido}
              onChange={(v) => setNewSchool((s) => ({ ...s, depositoRequerido: v }))}
            />
            <TextField
              label="Enlace de referencia"
              value={newSchool.enlaceReferencia}
              onChange={(v) => setNewSchool((s) => ({ ...s, enlaceReferencia: v }))}
            />
            <SelectField
              label="MCC/JOC incluido"
              value={newSchool.mccIncluido}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, mccIncluido: v as YesNoUnknown }))}
            />
            <SelectField
              label="Advanced UPRT incluido"
              value={newSchool.uprtIncluido}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, uprtIncluido: v as YesNoUnknown }))}
            />
            <SelectField
              label="Tasas incluidas"
              value={newSchool.tasasIncluidas}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, tasasIncluidas: v as YesNoUnknown }))}
            />
            <SelectField
              label="Skill tests incluidos"
              value={newSchool.skillTestsIncluidos}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, skillTestsIncluidos: v as YesNoUnknown }))}
            />
            <SelectField
              label="Alojamiento incluido"
              value={newSchool.alojamientoIncluido}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, alojamientoIncluido: v as YesNoUnknown }))}
            />
            <SelectField
              label="Flota explicada"
              value={newSchool.flotaExplicada}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, flotaExplicada: v as YesNoUnknown }))}
            />
            <SelectField
              label="Mantenimiento explicado"
              value={newSchool.mantenimientoExplicado}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, mantenimientoExplicado: v as YesNoUnknown }))}
            />
            <SelectField
              label="Ratio alumno/avión conocido"
              value={newSchool.ratioAlumnoAvionConocido}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, ratioAlumnoAvionConocido: v as YesNoUnknown }))}
            />
            <SelectField
              label="Permite hablar con alumnos"
              value={newSchool.permiteHablarAlumnos}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, permiteHablarAlumnos: v as YesNoUnknown }))}
            />
            <SelectField
              label="Career support"
              value={newSchool.careerSupport}
              options={YES_NO_UNKNOWN_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, careerSupport: v as YesNoUnknown }))}
            />
            <SelectField
              label="Promesas de empleo"
              value={newSchool.promesasEmpleo}
              options={PROMESAS_EMPLEO_OPTIONS}
              onChange={(v) => setNewSchool((s) => ({ ...s, promesasEmpleo: v as School["promesasEmpleo"] }))}
            />
          </div>
        </div>
      </details>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveSchool}
          className="cursor-pointer rounded-xl bg-[#c9a454] px-4 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
        >
          {schoolEditActiveId !== null ? "Guardar cambios" : "Añadir escuela"}
        </button>
        {schoolEditActiveId !== null ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-[15px] font-semibold text-[#0f1a33] transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Cancelar edición
          </button>
        ) : null}
      </div>
    </section>
  );
}

type CareerPlannerSchoolsTabProps = {
  schools: School[];
  verifiedCount: number;
  catalog: SchoolEntry[];
  onAddFromDatabase: (entry: SchoolEntry, option: PlannerProgramOption) => string | null;
  onUpdateProgram: (schoolId: number, entry: SchoolEntry, option: PlannerProgramOption) => void;
  manualFormOpen: boolean;
  formPanelRef: RefObject<HTMLDivElement | null>;
  schoolEditActiveId: number | null;
  newSchool: School;
  setNewSchool: Dispatch<SetStateAction<School>>;
  onOpenManualForm: () => void;
  onCloseManualForm: () => void;
  onSaveSchool: () => void;
  onCancelEdit: () => void;
  onEditSchool: (school: School) => void;
  onRemoveSchool: (id: number) => void;
};

export function CareerPlannerSchoolsTab({
  schools,
  verifiedCount,
  catalog,
  onAddFromDatabase,
  onUpdateProgram,
  manualFormOpen,
  formPanelRef,
  schoolEditActiveId,
  newSchool,
  setNewSchool,
  onOpenManualForm,
  onCloseManualForm,
  onSaveSchool,
  onCancelEdit,
  onEditSchool,
  onRemoveSchool,
}: CareerPlannerSchoolsTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ key: string; items: PublicSchoolReviewSummary[] }>({
    key: "",
    items: [],
  });

  const dataSourceLabel = useMemo(() => plannerSchoolsDataSourceLabel(schools), [schools]);
  const reviewRequestKey = useMemo(() => {
    const slugs = schools.flatMap((school) => {
      const link = parsePlannerSchoolLink(school.enlaceReferencia);
      return link ? [link.slug] : [];
    });
    return [...new Set(slugs)].join(",");
  }, [schools]);
  const reviewsLoading = reviewRequestKey.length > 0 && reviewResult.key !== reviewRequestKey;
  const reviewSummariesBySlug = useMemo(
    () => new Map(reviewResult.items.map((summary) => [summary.schoolSlug, summary])),
    [reviewResult.items],
  );

  useEffect(() => {
    if (!reviewRequestKey) return;

    const path = buildSchoolReviewSummariesPath(reviewRequestKey.split(","));
    if (!path) return;

    const controller = new AbortController();
    void fetch(path, { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() as Promise<SchoolReviewSummaryResponse> : { items: [] }))
      .then((body) => {
        if (!controller.signal.aborted) {
          setReviewResult({ key: reviewRequestKey, items: Array.isArray(body.items) ? body.items : [] });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setReviewResult({ key: reviewRequestKey, items: [] });
      });
    return () => controller.abort();
  }, [reviewRequestKey]);

  const handleTogglePicker = () => {
    setPickerOpen((open) => !open);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className={plannerEyebrow}>DIAGNÓSTICO DE ESCUELAS</p>
        <h2 className={`mt-2 text-2xl sm:text-3xl ${plannerTitle}`}>Elige las escuelas que quieres analizar</h2>
        <p className={`mt-3 max-w-3xl ${plannerBody}`}>
          Las escuelas que añadas aquí se usarán en tu informe final para comparar costes, riesgos y condiciones antes
          de pagar matrícula o depósito.
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className={plannerSubcard}>
            <p className="text-[15px] text-slate-400">Escuelas comparadas</p>
            <p className="mt-1 text-lg font-semibold text-white">{schools.length}</p>
          </div>
          <div className={plannerSubcard}>
            <p className="text-[15px] text-slate-400">Verificadas</p>
            <p className="mt-1 text-lg font-semibold text-white">{verifiedCount}</p>
          </div>
          <div className={plannerSubcard}>
            <p className="text-[15px] text-slate-400">Fuente de datos</p>
            <p className="mt-1 text-lg font-semibold text-white">{dataSourceLabel}</p>
          </div>
        </div>
      </div>

      <section className="relative overflow-visible rounded-xl border border-[#c9a454]/40 p-5 shadow-[0_8px_28px_-10px_rgba(15,26,51,0.28)] ring-1 ring-[#c9a454]/28 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#0a1228] via-[#132447] to-[#1f3066]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${FLYPATH_DATABASE_CARD_BG})` }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-[#0a1228]/82" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/50 to-transparent"
        />

        <div className="relative z-[1]">
          <h3 className="text-base font-semibold text-white drop-shadow-sm">Añadir escuelas candidatas</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="relative h-[148px] shrink-0 overflow-visible">
              <div className="relative flex h-[148px] flex-col overflow-hidden rounded-xl border border-white/25 bg-white/[0.94] p-4 shadow-lg shadow-black/10 backdrop-blur-sm ring-1 ring-white/40">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a454]/35 bg-[#D6AE4F]/15 text-[#5c4820]">
                      <Database className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-[#0f1a33]">Base de datos FlyPath</p>
                      <p className="mt-1 text-[13px] leading-snug text-[#2a3a55]">
                        Escuelas españolas ya investigadas. Selecciónalas aquí sin salir del Planner.
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleTogglePicker}
                      aria-expanded={pickerOpen}
                      aria-controls="flypath-school-picker"
                      className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-[#B8943F]/70 bg-[#D6AE4F] px-3.5 py-2 text-[13px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] hover:border-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ddaa]/50"
                    >
                      Elegir escuelas
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${pickerOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>

            {pickerOpen ? (
              <div
                id="flypath-school-picker"
                className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[min(100%,22rem)]"
              >
                <SchoolDatabasePicker
                  schools={schools}
                  catalog={catalog}
                  onAddFromDatabase={onAddFromDatabase}
                  onRemoveSchool={onRemoveSchool}
                  onClose={() => setPickerOpen(false)}
                />
              </div>
            ) : null}
          </div>

            <div className="flex h-[148px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/25 bg-white/[0.94] p-4 shadow-lg shadow-black/10 backdrop-blur-sm ring-1 ring-white/40">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#0f1a33]/10 bg-[#f4f2ec] text-[#3d4f6f]">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#0f1a33]">Escuela externa</p>
                    <p className="mt-1 text-[13px] leading-snug text-[#2a3a55]">
                      Añade manualmente una escuela que no esté todavía en nuestra base de datos.
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={onOpenManualForm}
                    className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-[#0f1a33]/14 bg-white px-3.5 py-2 text-[13px] font-semibold text-[#0f1a33] transition hover:border-[#0f1a33]/22 hover:bg-[#FAF9F6] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1a33]/20"
                  >
                    Añadir manualmente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-white">Tus escuelas seleccionadas</h3>
        {schools.length === 0 ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-300">
            Aún no has añadido escuelas. Añade al menos 2 para que el informe final pueda comparar opciones reales.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2.5">
            {schools.map((school) => {
              const schoolSlug = parsePlannerSchoolLink(school.enlaceReferencia)?.slug;
              return (
                <SelectedSchoolCard
                  key={school.id}
                  school={school}
                  reviewSummary={schoolSlug ? reviewSummariesBySlug.get(schoolSlug) : undefined}
                  reviewsLoading={reviewsLoading}
                  onUpdateProgram={onUpdateProgram}
                  onEditSchool={onEditSchool}
                  onRemoveSchool={onRemoveSchool}
                />
              );
            })}
          </ul>
        )}
      </section>

      {manualFormOpen ? (
        <SchoolManualForm
          formPanelRef={formPanelRef}
          schoolEditActiveId={schoolEditActiveId}
          newSchool={newSchool}
          setNewSchool={setNewSchool}
          onSaveSchool={onSaveSchool}
          onCancelEdit={onCancelEdit}
          onClose={onCloseManualForm}
        />
      ) : null}

      <section className="rounded-2xl border border-slate-200/90 bg-[#FFFCF7] px-5 py-6 shadow-[0_4px_18px_-10px_rgba(15,26,51,0.12)] ring-1 ring-[#c9a454]/12 sm:px-7 sm:py-7">
        <p className="text-[15px] font-semibold text-[#0f1a33]">¿Necesitas investigar antes de decidir?</p>
        <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-[#2a3a55]">
          Consulta el comparador y las opiniones de escuelas si todavía no tienes claras tus candidatas.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/schools"
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#0f1a33]/10 bg-white px-4 py-2 text-[13px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/35 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30"
            >
              Ver comparador
            </Link>
            <Link
              href="/opiniones-escuelas"
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#0f1a33]/10 bg-[#FAF9F6] px-4 py-2 text-[13px] font-semibold text-[#2a3a55] transition hover:border-[#0f1a33]/16 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1a33]/12"
            >
            Ver opiniones
          </Link>
        </div>
      </section>
    </div>
  );
}
