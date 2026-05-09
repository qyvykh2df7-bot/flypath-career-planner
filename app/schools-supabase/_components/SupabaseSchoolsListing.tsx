"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatAdvertisedPriceLabel } from "@/lib/schoolMapper";
import type { FullSchoolProfile } from "@/lib/schoolQueries";
import type { DataStatus, RouteType, SchoolEntry } from "@/types/schools";
import { SupabaseComparisonPanel } from "./SupabaseComparisonPanel";
import { SupabaseDetailedComparison } from "./SupabaseDetailedComparison";

type Props = {
  schools: SchoolEntry[];
  profilesBySlug: Record<string, FullSchoolProfile>;
};

type RouteFilter = "all" | RouteType;
type DataStatusFilter = "all" | DataStatus;

const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  verified: "Verificado",
  partial: "Parcial",
  unknown: "Pendiente de validar",
  demo: "Demo",
};

const ROUTE_TYPE_LABEL: Record<RouteType, string> = {
  integrated: "Escuela integrada",
  modular: "Ruta modular",
  university_plus_license: "Universidad / Grado + licencia",
};

const PRICE_MIN = 40000;
const PRICE_MAX = 140000;
const PRICE_STEP = 2500;
const PRICE_DEFAULT = PRICE_MAX;

const MAX_SELECTED = 2;

/**
 * Clave temporal para la selección de la página Supabase. Se mantiene SEPARADA de la clave
 * usada por el comparador real `flypath-schools-selected-ids` para no contaminar su estado
 * mientras la integración Supabase está en MVP.
 */
const SELECTED_IDS_STORAGE_KEY = "flypath-supabase-schools-selected-ids";

const EUR_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function dataStatusReadable(value: DataStatus | null | undefined): string {
  if (!value) return "—";
  return DATA_STATUS_LABEL[value] ?? value;
}

function getCities(rows: SchoolEntry[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (r.city) set.add(r.city);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
}

function formatLastUpdated(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

/**
 * Calcula y formatea la brecha FlyPath. Solo se considera brecha real cuando ambos precios
 * son > 0. Brecha 0 o negativa (caso anómalo: estimación FlyPath ≤ anunciado) se reporta
 * como "Sin brecha estimada" para no inducir a error en UI.
 */
function formatBrecha(advertised: number, real: number): string {
  if (!(advertised > 0) || !(real > 0)) return "Brecha pendiente de validar";
  const diff = real - advertised;
  if (diff > 0) return `+${EUR_FORMATTER.format(diff)} estimados sobre el precio publicado`;
  return "Sin brecha estimada";
}

/**
 * Lee la selección persistida desde sessionStorage. Si la entrada no es array, no es string,
 * o el id ya no existe en la lista actual de escuelas, se descarta para no mostrar selección
 * "fantasma" tras un cambio en Supabase.
 */
function readStoredSelectedIds(validIds: Set<string>): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SELECTED_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string" && validIds.has(id))
      .slice(0, MAX_SELECTED);
  } catch {
    return [];
  }
}

export function SupabaseSchoolsListing({ schools, profilesBySlug }: Props) {
  const [query, setQuery] = useState("");
  const [routeType, setRouteType] = useState<RouteFilter>("all");
  const [city, setCity] = useState<string>("all");
  const [maxAdvertisedPrice, setMaxAdvertisedPrice] = useState<number>(PRICE_DEFAULT);
  const [dataStatus, setDataStatus] = useState<DataStatusFilter>("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const validIds = useMemo(() => new Set(schools.map((s) => s.id)), [schools]);
  const cities = useMemo(() => getCities(schools), [schools]);

  // Hidratación inicial: leer sessionStorage y filtrar contra la lista actual.
  useEffect(() => {
    const restored = readStoredSelectedIds(validIds);
    setSelectedIds(restored);
    setSelectionHydrated(true);
    // Solo en montaje: si la lista de escuelas cambia, lo gestionamos en el efecto siguiente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si la lista de escuelas cambia, eliminamos seleccionados que dejen de existir.
  useEffect(() => {
    if (!selectionHydrated) return;
    setSelectedIds((current) => {
      const filtered = current.filter((id) => validIds.has(id));
      return filtered.length === current.length ? current : filtered;
    });
  }, [validIds, selectionHydrated]);

  // Persistencia.
  useEffect(() => {
    if (!selectionHydrated || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(SELECTED_IDS_STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      /* ignore quota / private mode */
    }
  }, [selectedIds, selectionHydrated]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimeoutRef.current != null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
      toastTimeoutRef.current = null;
    }, 2300);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current != null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((current) => {
        if (current.includes(id)) return current.filter((x) => x !== id);
        if (current.length >= MAX_SELECTED) {
          queueMicrotask(() => showToast("Máximo 2 escuelas en comparación"));
          return current;
        }
        return [...current, id];
      });
    },
    [showToast],
  );

  const removeSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.filter((x) => x !== id));
  }, []);

  const selectedSchools = useMemo(() => {
    const byId = new Map(schools.map((s) => [s.id, s]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((s): s is SchoolEntry => Boolean(s));
  }, [schools, selectedIds]);

  const selectionFull = selectedIds.length >= MAX_SELECTED;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schools.filter((entry) => {
      if (q.length > 0) {
        const haystack = [entry.name, entry.city, entry.country, entry.baseAirport]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (routeType !== "all" && entry.routeType !== routeType) return false;
      if (city !== "all" && entry.city !== city) return false;
      if (dataStatus !== "all" && entry.dataStatus !== dataStatus) return false;

      // Solo aplica el slider cuando hay precio publicado > 0; las escuelas sin precio
      // no quedan ocultas por el slider.
      if (entry.advertisedPriceEUR > 0 && entry.advertisedPriceEUR > maxAdvertisedPrice) {
        return false;
      }

      return true;
    });
  }, [schools, query, routeType, city, maxAdvertisedPrice, dataStatus]);

  const total = schools.length;
  const showing = filtered.length;

  const hasActiveFilters =
    query.trim().length > 0 ||
    routeType !== "all" ||
    city !== "all" ||
    dataStatus !== "all" ||
    maxAdvertisedPrice !== PRICE_DEFAULT;

  const resetFilters = () => {
    setQuery("");
    setRouteType("all");
    setCity("all");
    setMaxAdvertisedPrice(PRICE_DEFAULT);
    setDataStatus("all");
  };

  const comparisonStatusText =
    selectedSchools.length === 0
      ? "Añade 2 escuelas para desbloquear la comparación visual."
      : selectedSchools.length === 1
        ? "Selecciona una segunda escuela para comparar."
        : "Comparación lista. (La vista comparativa se conectará en el siguiente paso.)";

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-lg font-semibold text-[#0f1a33]">Empieza tu comparación</p>
        <p className="mt-1 text-[15px] text-slate-600">
          Datos en vivo desde Supabase, mapeados a <code>SchoolEntry</code>. Selecciona hasta
          2 escuelas para comparar y filtra por nombre, ciudad, ruta, precio o estado del
          dato.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="text-[15px] font-medium text-slate-500">
              Buscar por nombre o ciudad
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
              placeholder="Ej. Madrid"
            />
          </label>
          <label className="block">
            <span className="text-[15px] font-medium text-slate-500">Tipo de ruta</span>
            <select
              value={routeType}
              onChange={(e) => setRouteType(e.target.value as RouteFilter)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
            >
              <option value="all">Todas</option>
              <option value="integrated">Escuela integrada</option>
              <option value="modular">Ruta modular</option>
              <option value="university_plus_license">Universidad / Grado + licencia</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[15px] font-medium text-slate-500">Ciudad</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
            >
              <option value="all">Todas</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[15px] font-medium text-slate-500">
              Precio anunciado máximo
            </span>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={maxAdvertisedPrice}
              onChange={(e) => setMaxAdvertisedPrice(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <p className="text-[15px] text-slate-600">
              Hasta {maxAdvertisedPrice.toLocaleString("es-ES")} EUR
            </p>
          </label>
          <label className="block">
            <span className="text-[15px] font-medium text-slate-500">Estado del dato</span>
            <select
              value={dataStatus}
              onChange={(e) => setDataStatus(e.target.value as DataStatusFilter)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
            >
              <option value="all">Todos</option>
              <option value="verified">Verificado</option>
              <option value="partial">Parcial</option>
              <option value="unknown">Pendiente de validar</option>
              <option value="demo">Demo</option>
            </select>
          </label>
        </div>
        {hasActiveFilters ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:border-[#c9a454]/55 hover:text-[#0f1a33]"
            >
              Limpiar filtros
            </button>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">
            Comparación activa
          </p>
          <p className="mt-0.5 text-[15px] font-medium text-[#0f1a33]">
            {selectedSchools.length}/{MAX_SELECTED} escuelas seleccionadas
          </p>
          <p className="mt-0.5 text-[15px] text-slate-600">{comparisonStatusText}</p>
          {selectedSchools.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedSchools.map((school) => (
                <span
                  key={school.id}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                >
                  {school.name}
                  <button
                    type="button"
                    onClick={() => removeSelection(school.id)}
                    className="rounded-full bg-slate-100 px-1.5 py-0 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
                    aria-label={`Quitar ${school.name} de la comparación`}
                  >
                    Quitar
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {selectedSchools.length === 2 ? (
        <>
          <SupabaseComparisonPanel
            schoolA={selectedSchools[0]}
            schoolB={selectedSchools[1]}
          />
          <SupabaseDetailedComparison
            schoolA={selectedSchools[0]}
            schoolB={selectedSchools[1]}
            profileA={profilesBySlug[selectedSchools[0].slug]}
            profileB={profilesBySlug[selectedSchools[1].slug]}
          />
        </>
      ) : null}

      <section className="mt-6 space-y-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[#0f1a33]">Escuelas encontradas</p>
          {showing === 0 ? (
            <p className="pt-1 text-[15px] font-medium text-slate-600/95">
              0 escuelas encontradas con estos filtros
            </p>
          ) : (
            <p className="pt-1 text-[15px] font-medium text-slate-600/95">
              Mostrando {showing} de {total} escuelas activas en Supabase
            </p>
          )}
        </div>

        {showing === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[15px] text-slate-600 shadow-sm">
            No hay escuelas que coincidan con estos filtros.
          </div>
        ) : (
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            {filtered.map((entry) => {
              const isSelected = selectedIds.includes(entry.id);
              return (
                <SupabaseSchoolEntryCard
                  key={entry.id}
                  entry={entry}
                  selected={isSelected}
                  selectionFull={selectionFull && !isSelected}
                  onToggleSelect={toggleSelection}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

type CardProps = {
  entry: SchoolEntry;
  selected: boolean;
  selectionFull: boolean;
  onToggleSelect: (id: string) => void;
};

function SupabaseSchoolEntryCard({
  entry,
  selected,
  selectionFull,
  onToggleSelect,
}: CardProps) {
  const advertisedLabel = formatAdvertisedPriceLabel(entry.advertisedPriceEUR);
  const realLabel = formatAdvertisedPriceLabel(entry.flypathEstimatedRealCostEUR);
  const routeLabel = ROUTE_TYPE_LABEL[entry.routeType];
  const dataStatusText = dataStatusReadable(entry.dataStatus);
  const updatedLabel = formatLastUpdated(entry.lastUpdatedAt);
  const brechaLabel = formatBrecha(entry.advertisedPriceEUR, entry.flypathEstimatedRealCostEUR);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-[0_10px_30px_-14px_rgba(15,26,51,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(15,26,51,0.32)] ${
        selected
          ? "border-[#c9a454] ring-1 ring-[#c9a454]/35"
          : "border-slate-200/80 hover:border-[#c9a454]/45"
      }`}
    >
      <div className="relative h-[66px] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#0a1228] via-[#132447] to-[#1f3066]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[#c9a454]/18 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-10 bottom-[-28px] h-28 w-28 rounded-full bg-white/5 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a454]/55 to-transparent"
        />
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center gap-2 px-4 sm:gap-2.5 sm:px-5">
          <h3
            className="min-w-0 flex-1 line-clamp-2 text-left text-[1.125rem] font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-[1.375rem]"
            title={entry.name}
          >
            {entry.name}
          </h3>
          <span className="shrink-0 rounded-full border border-[#c9a454]/55 bg-[#c9a454]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f2ddaa] backdrop-blur-sm">
            {dataStatusText}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <p className="text-[15px] text-slate-500">
          {entry.city || "—"}
          {entry.country ? `, ${entry.country}` : ""}
          {entry.baseAirport ? <> · Base {entry.baseAirport}</> : null}
        </p>

        <dl className="mt-3 space-y-1.5 text-[13px]">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Ruta principal</dt>
            <dd className="text-right font-medium text-slate-800">{routeLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Precio anunciado</dt>
            <dd className="text-right font-semibold text-[#7b5e1f]">{advertisedLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Coste estimado FlyPath</dt>
            <dd className="text-right font-semibold text-[#7b5e1f]">{realLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Brecha FlyPath</dt>
            <dd className="text-right text-slate-700">{brechaLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Última actualización</dt>
            <dd className="text-right text-slate-700">{updatedLabel}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-stretch gap-2.5 pt-5">
          <button
            type="button"
            disabled={selectionFull}
            onClick={() => onToggleSelect(entry.id)}
            title={
              selectionFull
                ? "Ya has seleccionado el máximo de escuelas para comparar (2)."
                : undefined
            }
            className={`inline-flex min-h-[40px] flex-1 basis-[140px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 disabled:cursor-not-allowed disabled:opacity-55 ${
              selected
                ? "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "border border-[#c9a454] bg-[#c9a454] text-[#0f1a33] shadow-sm hover:border-[#ddb75c] hover:bg-[#ddb75c]"
            }`}
          >
            {selected ? "Quitar de comparación" : "Añadir a comparación"}
          </button>
          <Link
            href={`/schools-supabase/${entry.slug}`}
            className="inline-flex min-h-[40px] flex-1 basis-[120px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-[#0f1a33] transition hover:border-[#0f1a33]/55 hover:bg-slate-50"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </article>
  );
}
