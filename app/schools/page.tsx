"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Plane } from "lucide-react";
import { ComparisonResults } from "@/components/schools/ComparisonResults";
import { SchoolCard } from "@/components/schools/SchoolCard";
import { schoolsDataset } from "@/lib/schools/data";
import { filterSchools, getCities, type SchoolsFilters } from "@/lib/schools/utils";
import type { DataConfidence, RouteType } from "@/types/schools";

const MAX_SELECTED = 3;

export default function SchoolsPage() {
  const router = useRouter();
  const defaultMaxAdvertisedPrice = 140000;
  const [filters, setFilters] = useState<SchoolsFilters>({
    query: "",
    routeType: "all",
    city: "all",
    maxAdvertisedPrice: defaultMaxAdvertisedPrice,
    dataConfidence: "all",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [heroVisualAvailable, setHeroVisualAvailable] = useState(true);
  const searchSectionRef = useRef<HTMLElement>(null);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [headerLogoFallback, setHeaderLogoFallback] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterSchools(schoolsDataset, filters), [filters]);
  const selectedSchools = useMemo(
    () => schoolsDataset.filter((school) => selectedIds.includes(school.id)),
    [selectedIds],
  );
  const cities = useMemo(() => getCities(schoolsDataset), []);
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.routeType !== "all" ||
    filters.city !== "all" ||
    filters.maxAdvertisedPrice !== defaultMaxAdvertisedPrice ||
    filters.dataConfidence !== "all";
  const hasSearchActive = hasActiveFilters || searchSubmitted;

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_SELECTED) return current;
      return [...current, id];
    });
  };

  useEffect(() => {
    if (!moduleMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = moduleMenuRef.current;
      if (el && !el.contains(e.target as Node)) setModuleMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moduleMenuOpen]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2300);
  };

  const notifyMentoring = () => {
    showToast("Mentoría FlyPath próximamente");
  };

  const comparisonStatusText =
    selectedSchools.length === 0
      ? "Añade al menos 2 escuelas para desbloquear la comparación visual."
      : selectedSchools.length === 1
        ? "Añade una escuela más para comparar."
        : "Comparación desbloqueada. Revisa el panel comparativo más abajo.";

  const startComparison = () => {
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const runSearch = () => {
    setSearchSubmitted(true);
  };

  const flypathPlatformModules = [
    { id: "inicio", label: "Inicio", status: "available" as const, href: "/" },
    { id: "planifica", label: "Planifica tu ruta", status: "available" as const, href: "/" },
    { id: "compara", label: "Compara escuelas", status: "available" as const, href: "/schools" },
    { id: "opiniones", label: "Opiniones de escuelas", status: "soon" as const },
    { id: "atpl", label: "ATPL Planner", status: "soon" as const },
    { id: "ingles", label: "Inglés aeronáutico", status: "soon" as const },
    { id: "mentorias", label: "Mentorías", status: "soon" as const },
    { id: "recursos", label: "Recursos", status: "soon" as const },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      {toast && (
        <div className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <header className="border-b border-white/10 bg-[#0f1a33] text-white shadow-[0_12px_40px_rgba(15,26,51,0.35)]">
        <div className="mx-auto flex max-h-[90px] max-w-7xl items-center justify-between gap-3 px-6 py-3 sm:gap-4 md:justify-normal md:gap-4 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none md:min-w-0 md:flex-1 md:justify-start">
            {!headerLogoFallback ? (
              <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                <Image
                  src="/flypath-logo-white.png"
                  alt="FlyPath"
                  width={540}
                  height={162}
                  className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                  onError={() => setHeaderLogoFallback(true)}
                />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                  <Plane className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">FlyPath</p>
                </div>
              </div>
            )}
          </div>
          <p
            className="pointer-events-none hidden min-w-0 select-none truncate text-center text-[13px] font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
            aria-hidden
          >
            Comparador de escuelas
          </p>
          <div ref={moduleMenuRef} className="relative shrink-0 md:flex md:min-w-0 md:flex-1 md:justify-end">
            <button
              type="button"
              onClick={() => setModuleMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white transition-colors hover:border-white/24 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a454]/55"
              aria-expanded={moduleMenuOpen}
              aria-haspopup="listbox"
              aria-label="Menú de módulos FlyPath Platform"
            >
              <Menu className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            </button>
            {moduleMenuOpen ? (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] max-w-[min(96vw,26rem)] rounded-2xl border border-slate-200/90 bg-white px-1.5 py-2.5 shadow-[0_24px_52px_rgba(15,26,51,0.11),0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/45"
              >
                {flypathPlatformModules.map((m) => {
                  const isAvailable = m.status === "available";
                  const isSoon = m.status === "soon";
                  const isCurrent = m.id === "compara";
                  return (
                    <li key={m.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isCurrent}
                        aria-disabled={isSoon}
                        onClick={() => {
                          setModuleMenuOpen(false);
                          if (isSoon) {
                            showToast("Módulo FlyPath próximamente");
                            return;
                          }
                          if ("href" in m && m.href) router.push(m.href);
                        }}
                        className={`flex w-full items-center justify-between gap-8 rounded-lg px-3.5 py-3.5 text-left transition-colors ${
                          isSoon ? "cursor-not-allowed" : "cursor-pointer"
                        } ${isCurrent ? "bg-[#fff8e8]" : ""}`}
                      >
                        <span
                          className={`min-w-0 flex-1 truncate text-[0.9375rem] font-medium leading-snug ${
                            isSoon ? "text-slate-500" : isCurrent ? "text-[#7a5a16]" : "text-slate-700"
                          }`}
                        >
                          {m.label}
                        </span>
                        {isSoon ? (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            Próximamente
                          </span>
                        ) : isCurrent ? (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a5802a]">
                            Actual
                          </span>
                        ) : (
                          <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            Disponible
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-[#f7f9fc] to-[#f4f7fb] p-5 shadow-sm sm:p-7">
          {heroVisualAvailable ? (
            <Image
              src="/schools-hero-planning.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 95vw, 1200px"
              className="pointer-events-none object-cover opacity-[0.32] contrast-[1.03]"
              onError={() => setHeroVisualAvailable(false)}
              aria-hidden
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-white/46" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_95%_10%,rgba(201,164,84,0.10),transparent_55%),radial-gradient(ellipse_70%_60%_at_10%_90%,rgba(15,26,51,0.06),transparent_52%)]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a5a16]">Compara escuelas FlyPath</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#0f1a33] sm:text-4xl">
                Compara escuelas antes de pagar matrícula.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
                No te quedes solo con el precio anunciado. Compara coste real estimado, extras incluidos, contrato, reembolso, calendario de pagos y señales de riesgo antes de decidir.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={startComparison}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#c9a454] px-5 py-2 text-sm font-semibold text-[#0f1a33] shadow-sm hover:bg-[#ddb75c]"
                >
                  Empezar comparación
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Coste real estimado",
                  "Contrato y reembolso",
                  "Extras incluidos",
                  "Reviews verificadas próximamente",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">1. Busca</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">2. Selecciona 2-3 escuelas</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">3. Compara riesgos</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[#c9a454]/30 bg-[#0f1a33] p-4 text-white shadow-[0_12px_28px_rgba(15,26,51,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">Comparación FlyPath</p>
              <div className="mt-3 space-y-2.5">
                {[
                  { name: "Escuela A", cost: "Mayor brecha", tone: "bg-amber-300/55" },
                  { name: "Escuela B", cost: "Más claridad", tone: "bg-emerald-300/55" },
                  { name: "Escuela C", cost: "Datos pendientes", tone: "bg-slate-300/55" },
                ].map((row) => (
                  <div key={row.name} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{row.name}</p>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                        {row.cost}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-1.5 rounded-full bg-white/15">
                        <div className={`h-1.5 w-[72%] rounded-full ${row.tone}`} />
                      </div>
                      <div className="h-1.5 rounded-full bg-white/15">
                        <div className="h-1.5 w-[58%] rounded-full bg-blue-300/55" />
                      </div>
                      <div className="h-1.5 rounded-full bg-white/15">
                        <div className="h-1.5 w-[65%] rounded-full bg-rose-200/45" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section ref={searchSectionRef} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-[#0f1a33]">Empieza tu comparación</p>
          <p className="mt-1 text-sm text-slate-600">
            Busca una escuela, ciudad o tipo de ruta. Después selecciona 2 o 3 opciones para compararlas con criterios FlyPath.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Buscar por nombre o ciudad</span>
              <input
                value={filters.query}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, query: e.target.value }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Ej. Madrid"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Tipo de ruta</span>
              <select
                value={filters.routeType}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, routeType: e.target.value as RouteType | "all" }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="integrated">Escuela integrada</option>
                <option value="modular">Ruta modular</option>
                <option value="university_plus_license">Universidad / Grado + licencia</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Ciudad</span>
              <select
                value={filters.city}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, city: e.target.value }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Precio anunciado máximo</span>
              <input
                type="range"
                min={40000}
                max={140000}
                step={2500}
                value={filters.maxAdvertisedPrice}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, maxAdvertisedPrice: Number(e.target.value) }));
                }}
                className="mt-3 w-full"
              />
              <p className="text-xs text-slate-600">Hasta {filters.maxAdvertisedPrice.toLocaleString("es-ES")} EUR</p>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Confianza del dato</span>
              <select
                value={filters.dataConfidence}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, dataConfidence: e.target.value as DataConfidence | "all" }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runSearch}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#c9a454] px-4 py-2 text-sm font-semibold text-[#0f1a33] shadow-sm hover:bg-[#ddb75c]"
            >
              Buscar escuelas
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">Comparación activa</p>
            <p className="mt-0.5 text-sm font-medium text-[#0f1a33]">{selectedSchools.length}/3 escuelas seleccionadas</p>
            <p className="mt-0.5 text-xs text-slate-600">{comparisonStatusText}</p>
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
                      onClick={() => setSelectedIds((x) => x.filter((k) => k !== school.id))}
                      className="rounded-full bg-slate-100 px-1.5 py-0 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Quitar
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Versión demo: los datos actuales son ejemplos para probar la herramienta. La base real de escuelas en España se añadirá con fuentes, fecha de actualización y nivel de confianza.
          </p>
        </section>

        {selectedSchools.length >= 2 ? <ComparisonResults schools={selectedSchools} /> : null}

        {hasSearchActive ? (
          <section className="space-y-4">
            <p className="text-lg font-semibold text-[#0f1a33]">Resultados encontrados</p>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                No hay escuelas que coincidan con estos filtros.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((school) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    selected={selectedIds.includes(school.id)}
                    onToggleSelect={toggleSelection}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {selectedSchools.length >= 2 ? (
          <section className="rounded-3xl border border-[#c9a454]/35 bg-gradient-to-br from-[#0f1a33] via-[#122041] to-[#15264a] p-6 text-white shadow-sm">
            <p className="text-lg font-semibold">¿Quieres saber si estas opciones encajan con tu caso?</p>
            <p className="mt-2 text-sm text-slate-200">
              Usa el Career Planner para cruzar esta comparación con tu presupuesto, Class 1, tiempo disponible, inglés y nivel de riesgo personal.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#c9a454] px-5 py-2 text-sm font-semibold text-[#0f1a33] hover:bg-[#ddb75c]"
              >
                Analizar mi caso en Career Planner
              </Link>
              <button
                type="button"
                onClick={notifyMentoring}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Reservar mentoría
              </button>
            </div>
          </section>
        ) : null}
      </div>
      </main>
    </div>
  );
}

