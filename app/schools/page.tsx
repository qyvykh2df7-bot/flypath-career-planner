"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { Menu, Plane } from "lucide-react";
import { ComparisonResults } from "@/components/schools/ComparisonResults";
import { FlypathComparisonConclusion } from "@/components/schools/FlypathComparisonConclusion";
import { SchoolCard } from "@/components/schools/SchoolCard";
import {
  getComparableSchoolsSync,
  isSupabaseSchoolsEnabled,
  loadComparableSchoolsForComparator,
} from "@/lib/schools/comparatorSchoolsSource";
import {
  filterSchools,
  getCities,
  isMainListingSchool,
  schoolAllowsListingComparison,
  sortMainListingSchools,
  type SchoolsFilters,
} from "@/lib/schools/schoolUtils";
import type { DataConfidence, RouteType, SchoolEntry } from "@/types/schools";
import { QaPremiumFloatingToggle } from "@/components/dev/QaPremiumFloatingToggle";
import { useQaPremiumMode } from "@/hooks/useQaPremiumMode";
import { canSeePremiumForDevQa } from "@/lib/qaPremiumMode";

const MAX_SELECTED = 2;
const SELECTED_IDS_STORAGE_KEY = "flypath-schools-selected-ids";

/**
 * Desde opiniones: incluir la escuela del query aunque ya hubiera 2 seleccionadas.
 * Si hay 2 y la escuela no está, sustituye la primera y conserva la segunda.
 */
function ensureSelectedSchoolFromReviewsQuery(
  currentIds: string[],
  querySchoolId: string,
): string[] {
  if (currentIds.includes(querySchoolId)) return currentIds;
  if (currentIds.length === 0) return [querySchoolId];
  if (currentIds.length === 1) return [...currentIds, querySchoolId];
  return [querySchoolId, currentIds[1]!];
}

function buildSchoolsPathWithoutReviewsSelectionParams(
  searchParams: { toString(): string },
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("selected");
  next.delete("source");
  const q = next.toString();
  return q ? `/schools?${q}` : "/schools";
}

function readStoredSelectedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SELECTED_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(getComparableSchoolsSync().map((s) => s.id));
    return parsed
      .filter((id): id is string => typeof id === "string" && valid.has(id))
      .slice(0, MAX_SELECTED);
  } catch {
    return [];
  }
}

function findSchoolInDataset(dataset: SchoolEntry[], slug: string): SchoolEntry | undefined {
  return dataset.find((s) => s.slug === slug);
}

function SchoolsPageContent() {
  const [schoolsDataset, setSchoolsDataset] = useState<SchoolEntry[]>(() =>
    getComparableSchoolsSync(),
  );

  useEffect(() => {
    if (!isSupabaseSchoolsEnabled()) return;
    let cancelled = false;
    void loadComparableSchoolsForComparator().then((entries) => {
      if (!cancelled) setSchoolsDataset(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMaxAdvertisedPrice = 140000;
  const [filters, setFilters] = useState<SchoolsFilters>({
    query: "",
    routeType: "all",
    city: "all",
    maxAdvertisedPrice: defaultMaxAdvertisedPrice,
    dataConfidence: "all",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [heroVisualAvailable, setHeroVisualAvailable] = useState(true);
  const searchSectionRef = useRef<HTMLElement>(null);
  const comparisonPanelRef = useRef<HTMLDivElement>(null);
  // Wrapper alrededor de FlypathComparisonConclusion para que el CTA premium
  // inferior pueda hacer scroll al panel donde vive el overlay premium ya
  // renderizado (free user => isLocked => overlay visible). No modifica el
  // componente Conclusión ni el overlay.
  const conclusionSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLElement>(null);
  const lastHandledAddSlugRef = useRef<string | null>(null);
  const lastHandledReviewsSlugRef = useRef<string | null>(null);
  const pendingResultsScrollRef = useRef(false);
  const { qaPremiumMode, toggleQaPremium, hydrated: qaHydrated } = useQaPremiumMode();

  const premiumUnlocked = false; // pago real futuro (Stripe / backend)
  const canSeePremium = canSeePremiumForDevQa(premiumUnlocked, qaPremiumMode);

  const filtered = useMemo(() => filterSchools(schoolsDataset, filters), [schoolsDataset, filters]);
  const listingBuckets = useMemo(() => {
    const main: SchoolEntry[] = [];
    const pending: SchoolEntry[] = [];
    for (const s of filtered) {
      if (isMainListingSchool(s)) main.push(s);
      else pending.push(s);
    }
    pending.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return { mainSchools: sortMainListingSchools(main), pendingSchools: pending };
  }, [filtered]);
  const catalogBuckets = useMemo(() => {
    let catalogMain = 0;
    let catalogPending = 0;
    for (const s of schoolsDataset) {
      if (isMainListingSchool(s)) catalogMain++;
      else catalogPending++;
    }
    return { catalogMain, catalogPending };
  }, [schoolsDataset]);
  const selectedSchools = useMemo(() => {
    const idSet = new Set(selectedIds);
    return schoolsDataset.filter((school) => idSet.has(school.id));
  }, [schoolsDataset, selectedIds]);
  // Origen del comparador: solo cuando el usuario llega desde un CTA del Planner > Escuelas
  // (que añade ?from=planner en la URL). En cualquier otra entrada (menú, hamburger, hero,
  // landing, URL directa /schools…) este flag es false y el botón "Volver al Planner" no se
  // muestra en la Conclusión FlyPath.
  const cameFromPlanner = searchParams.get("from") === "planner";
  const plannerCtaHref = useMemo(() => {
    if (selectedSchools.length === 0) return "/";
    const slugs = selectedSchools.map((school) => school.slug).join(",");
    return `/?schools=${encodeURIComponent(slugs)}&start=onboarding&source=schools-comparator`;
  }, [selectedSchools]);
  const cities = useMemo(
    () => getCities(schoolsDataset.filter(isMainListingSchool)),
    [schoolsDataset],
  );
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.routeType !== "all" ||
    filters.city !== "all" ||
    filters.maxAdvertisedPrice !== defaultMaxAdvertisedPrice ||
    filters.dataConfidence !== "all";
  const hasSearchActive = hasActiveFilters || searchSubmitted;
  const filteredSchoolsCount = filtered.length;

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_SELECTED) return current;
      return [...current, id];
    });
  };

  useEffect(() => {
    const stored = readStoredSelectedIds();
    setSelectedIds(stored);
    if (stored.length > 0) setSearchSubmitted(true);
    setSelectionHydrated(true);
  }, []);

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
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2300);
  }, []);

  useEffect(() => {
    if (!selectionHydrated) return;

    const slug = searchParams.get("add")?.trim() ?? "";
    if (!slug) {
      lastHandledAddSlugRef.current = null;
      return;
    }
    if (lastHandledAddSlugRef.current === slug) return;
    lastHandledAddSlugRef.current = slug;

    router.replace("/schools", { scroll: false });

    const school = findSchoolInDataset(schoolsDataset, slug);
    if (!school) return;

    setSearchSubmitted(true);

    setSelectedIds((current) => {
      if (current.includes(school.id)) return current;
      if (current.length >= MAX_SELECTED) {
        queueMicrotask(() => showToast("Máximo 2 escuelas en comparación"));
        return current;
      }
      return [...current, school.id];
    });

    queueMicrotask(() => {
      comparisonPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams, router, showToast, selectionHydrated, schoolsDataset]);

  useEffect(() => {
    if (!selectionHydrated) return;

    const slug = searchParams.get("selected")?.trim() ?? "";
    const source = searchParams.get("source")?.trim() ?? "";
    if (source !== "reviews" || !slug) {
      lastHandledReviewsSlugRef.current = null;
      return;
    }
    if (lastHandledReviewsSlugRef.current === slug) return;
    lastHandledReviewsSlugRef.current = slug;

    const pathWithoutReviewsParams =
      buildSchoolsPathWithoutReviewsSelectionParams(searchParams);
    router.replace(pathWithoutReviewsParams, { scroll: false });

    const school = findSchoolInDataset(schoolsDataset, slug);
    setSearchSubmitted(true);

    if (school) {
      setSelectedIds((current) =>
        ensureSelectedSchoolFromReviewsQuery(current, school.id),
      );
    }

    queueMicrotask(() => {
      comparisonPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams, router, selectionHydrated, schoolsDataset]);

  useEffect(() => {
    if (!selectionHydrated) return;
    if (searchParams.get("results") !== "1") return;

    router.replace("/schools", { scroll: false });
    setSearchSubmitted(true);
    pendingResultsScrollRef.current = true;
  }, [searchParams, router, selectionHydrated]);

  useEffect(() => {
    if (!pendingResultsScrollRef.current || !hasSearchActive) return;
    pendingResultsScrollRef.current = false;
    requestAnimationFrame(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hasSearchActive]);

  const notifyMentoring = () => {
    showToast("Mentoría FlyPath próximamente");
  };

  /**
   * Cuando sea `true`, el CTA premium del comparador volverá a importar las 2
   * escuelas seleccionadas y abrir el Planner (flujo antiguo). Se mantiene a
   * `false` hasta conectar el pago real.
   */
  const comparatorPremiumUnlocked = false;

  /**
   * Flujo antiguo "Analizar mi caso en Career Planner": importa las 2 escuelas
   * vía `localStorage` y navega al Planner. Se conserva intacto detrás de la
   * constante `comparatorPremiumUnlocked` para reactivarlo cuando el pago real
   * esté operativo.
   */
  const handleAnalyzeWithProfileLegacy = useCallback(() => {
    if (selectedSchools.length !== 2) return;
    const slugs = selectedSchools.map((school) => school.slug).filter(Boolean);
    if (slugs.length !== 2) return;
    try {
      window.localStorage.setItem(
        "flypath_pending_comparator_schools",
        JSON.stringify(slugs),
      );
    } catch {
      /* localStorage opcional */
    }
    router.push(plannerCtaHref);
  }, [router, selectedSchools, plannerCtaHref]);

  /**
   * CTA inferior "Desbloquear análisis premium":
   *
   * - Si `comparatorPremiumUnlocked === true`, ejecuta el flujo antiguo
   *   (importar escuelas + abrir Planner).
   * - Si `comparatorPremiumUnlocked === false` (estado actual), hace scroll al
   *   panel de la Conclusión FlyPath para reutilizar el MISMO overlay premium
   *   que ya se monta sobre el contenido bloqueado. No navega, no importa
   *   escuelas, no escribe `flypath_pending_comparator_schools` ni crea otro
   *   overlay.
   */
  const handlePremiumComparatorCta = useCallback(() => {
    if (comparatorPremiumUnlocked) {
      handleAnalyzeWithProfileLegacy();
      return;
    }
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      conclusionSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [comparatorPremiumUnlocked, handleAnalyzeWithProfileLegacy]);

  const comparisonStatusText =
    selectedSchools.length === 0
      ? "Añade 2 escuelas para desbloquear la comparación visual."
      : selectedSchools.length === 1
        ? "Selecciona la segunda escuela para comparar."
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


  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      {toast && (
        <div className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg">
          {toast}
        </div>
      )}
      {/* QA temporal: quitar al conectar pago real. */}
      <QaPremiumFloatingToggle mode={qaPremiumMode} onToggle={toggleQaPremium} hydrated={qaHydrated} />
      <FlyPathPlatformHeader
        pageTitle="Comparador de escuelas"
        currentModuleId="schools"
        onSoonClick={(msg) => showToast(msg ?? "Próximamente")}
      />

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
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-base">
                No te quedes solo con el precio anunciado. Compara coste real estimado, extras incluidos, contrato, reembolso, calendario de pagos y señales de riesgo antes de decidir.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={startComparison}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#c9a454] px-5 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm hover:bg-[#ddb75c]"
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
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">2. Selecciona 2 escuelas</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">3. Compara riesgos</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[#c9a454]/30 bg-[#0f1a33] p-4 text-white shadow-[0_12px_28px_rgba(15,26,51,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">Comparación FlyPath</p>
              <div className="mt-3 space-y-2.5">
                {[
                  { name: "Escuela A", cost: "Mayor brecha", tone: "bg-amber-300/55" },
                  { name: "Escuela B", cost: "Más claridad", tone: "bg-emerald-300/55" },
                ].map((row) => (
                  <div key={row.name} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-white">{row.name}</p>
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
          <p className="mt-1 text-[15px] text-slate-600">
            Busca una escuela, ciudad o tipo de ruta. Después selecciona 2 escuelas para compararlas con criterios FlyPath.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="text-[15px] font-medium text-slate-500">Buscar por nombre o ciudad</span>
              <input
                value={filters.query}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, query: e.target.value }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
                placeholder="Ej. Madrid"
              />
            </label>
            <label className="block">
              <span className="text-[15px] font-medium text-slate-500">Tipo de ruta</span>
              <select
                value={filters.routeType}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, routeType: e.target.value as RouteType | "all" }));
                }}
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
                value={filters.city}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, city: e.target.value }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
              >
                <option value="all">Todas</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[15px] font-medium text-slate-500">Precio anunciado máximo</span>
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
              <p className="text-[15px] text-slate-600">Hasta {filters.maxAdvertisedPrice.toLocaleString("es-ES")} EUR</p>
            </label>
            <label className="block">
              <span className="text-[15px] font-medium text-slate-500">Confianza del dato</span>
              <select
                value={filters.dataConfidence}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, dataConfidence: e.target.value as DataConfidence | "all" }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px]"
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
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#c9a454] px-4 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm hover:bg-[#ddb75c]"
            >
              Buscar escuelas
            </button>
          </div>
          <div ref={comparisonPanelRef} className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">Comparación activa</p>
            <p className="mt-0.5 text-[15px] font-medium text-[#0f1a33]">{selectedSchools.length}/{MAX_SELECTED} escuelas seleccionadas</p>
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
        </section>

        {selectedSchools.length === 2 ? (
          <>
            <ComparisonResults schools={selectedSchools} />
            {/* Conclusión FlyPath con gating premium temporal.
                - El contenido real SIEMPRE se renderiza dentro del componente
                  (nunca se sustituye ni se duplica) para que QA y dev puedan
                  revisarlo y para que al desbloquear premium aparezca sin
                  reconstruir la sección.
                - El propio componente decide qué blurréa: cuando `isLocked` es
                  true, deja visible el ENCABEZADO (eyebrow + título + subtítulo)
                  como teaser y aplica blur + overlay solo al contenido inferior
                  (badges, riesgo, email, lectura, CTA). */}
            <div ref={conclusionSectionRef}>
              <FlypathComparisonConclusion
                schools={[selectedSchools[0], selectedSchools[1]]}
                isLocked={!canSeePremium}
                onUnlockClick={() => showToast("Pago FlyPath próximamente")}
                onBackToPlanner={
                  cameFromPlanner
                    ? () => {
                        router.push("/?review=dashboard&tab=schools");
                      }
                    : undefined
                }
                onProfileCta={() => {
                  if (selectedSchools.length !== 2) {
                    showToast("Selecciona 2 escuelas para analizarlas con tu perfil.");
                    return;
                  }
                  const slugs = selectedSchools
                    .map((school) => school.slug)
                    .filter(Boolean);
                  if (slugs.length !== 2) {
                    showToast("Selecciona 2 escuelas para analizarlas con tu perfil.");
                    return;
                  }
                  try {
                    window.localStorage.setItem(
                      "flypath_pending_comparator_schools",
                      JSON.stringify(slugs),
                    );
                  } catch {
                    // localStorage opcional: la URL ya transporta los slugs.
                  }
                  const query = new URLSearchParams({
                    source: "schools-comparator",
                    schools: slugs.join(","),
                  });
                  router.push(`/?${query.toString()}`);
                }}
              />
            </div>
          </>
        ) : null}

        {hasSearchActive ? (
          <section ref={resultsSectionRef} className={`${selectedSchools.length >= 2 ? "mt-8" : ""} space-y-4`}>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[#0f1a33]">Escuelas encontradas</p>
              {filteredSchoolsCount === 0 ? (
                <p className="pt-1 text-[15px] font-medium text-slate-600/95">
                  0 escuelas encontradas con estos filtros
                </p>
              ) : (
                <p className="pt-1 text-[15px] font-medium text-slate-600/95">
                  Mostrando {listingBuckets.mainSchools.length} de {catalogBuckets.catalogMain} escuelas
                </p>
              )}
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[15px] text-slate-600 shadow-sm">
                No hay escuelas que coincidan con estos filtros.
              </div>
            ) : (
              <div className="space-y-8">
                {listingBuckets.mainSchools.length > 0 ? (
                  <div className="grid items-stretch gap-4 lg:grid-cols-2">
                    {listingBuckets.mainSchools.map((school) => (
                      <SchoolCard
                        key={school.id}
                        school={school}
                        selected={selectedIds.includes(school.id)}
                        onToggleSelect={toggleSelection}
                        allowComparison={schoolAllowsListingComparison(school)}
                        selectionFull={selectedIds.length >= MAX_SELECTED && !selectedIds.includes(school.id)}
                      />
                    ))}
                  </div>
                ) : null}
                {listingBuckets.pendingSchools.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-[#0f1a33]">
                      Pendientes de revisión / formación inicial
                    </h3>
                    <div className="grid items-stretch gap-4 lg:grid-cols-2">
                      {listingBuckets.pendingSchools.map((school) => (
                        <SchoolCard
                          key={school.id}
                          school={school}
                          selected={selectedIds.includes(school.id)}
                          onToggleSelect={toggleSelection}
                          allowComparison={schoolAllowsListingComparison(school)}
                          selectionFull={selectedIds.length >= MAX_SELECTED && !selectedIds.includes(school.id)}
                          forcePendingListingBadge
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {selectedSchools.length >= 2 ? (
          <section className="rounded-3xl border border-[#c9a454]/45 bg-gradient-to-br from-[#0a1228] via-[#0f1a33] to-[#152545] p-6 text-white shadow-[0_18px_48px_-18px_rgba(15,26,51,0.45)] ring-1 ring-[#c9a454]/20 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]/95">
              FlyPath Premium
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">
              Desbloquea el análisis premium de tus escuelas
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-300">
              La comparación básica te muestra los datos. El análisis premium cruza estas escuelas con tu perfil,
              presupuesto y riesgo antes de decidir o pagar una matrícula.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={handlePremiumComparatorCta}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55 sm:w-auto sm:min-w-[220px]"
              >
                Desbloquear análisis premium
              </button>
              <button
                type="button"
                onClick={notifyMentoring}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/22 bg-white/[0.07] px-6 py-2.5 text-[15px] font-semibold text-white transition hover:border-white/35 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:w-auto"
              >
                Reservar mentoría
              </button>
            </div>
            <p className="mt-4 max-w-xl text-[12px] leading-snug text-slate-400">
              Incluye recomendación FlyPath, informe premium y email personalizado para la escuela.
            </p>
          </section>
        ) : null}
      </div>
      </main>
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" aria-hidden />}>
      <SchoolsPageContent />
    </Suspense>
  );
}
