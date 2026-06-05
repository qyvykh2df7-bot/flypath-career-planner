"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { ComparisonResults } from "@/components/schools/ComparisonResults";
import { ComparatorPlannerPreviewMockup } from "@/components/schools/ComparatorPlannerPreviewMockup";
import { SchoolComparatorPicker } from "@/components/schools/SchoolComparatorPicker";
import {
  getComparableSchoolsSync,
  isSupabaseSchoolsEnabled,
  loadComparableSchoolsForComparator,
} from "@/lib/schools/comparatorSchoolsSource";
import {
  schoolAllowsListingComparison,
  sortMainListingSchools,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";
import { QaPremiumFloatingToggle } from "@/components/dev/QaPremiumFloatingToggle";
import { useQaPremiumMode } from "@/hooks/useQaPremiumMode";

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
      if (cancelled) return;
      setSchoolsDataset(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [heroVisualAvailable, setHeroVisualAvailable] = useState(true);
  const searchSectionRef = useRef<HTMLElement>(null);
  const comparisonPanelRef = useRef<HTMLDivElement>(null);
  const lastHandledAddSlugRef = useRef<string | null>(null);
  const lastHandledReviewsSlugRef = useRef<string | null>(null);
  const { qaPremiumMode, toggleQaPremium, hydrated: qaHydrated } = useQaPremiumMode();

  const pickableSchools = useMemo(
    () =>
      sortMainListingSchools(
        schoolsDataset.filter((school) => schoolAllowsListingComparison(school)),
      ),
    [schoolsDataset],
  );

  const selectedSchools = useMemo(() => {
    const idSet = new Set(selectedIds);
    return schoolsDataset.filter((school) => idSet.has(school.id));
  }, [schoolsDataset, selectedIds]);

  const addSchool = useCallback(
    (id: string) => {
      setSelectedIds((current) => {
        if (current.includes(id)) return current;
        if (current.length >= MAX_SELECTED) return current;
        return [...current, id];
      });
    },
    [],
  );

  const removeSchool = useCallback((id: string) => {
    setSelectedIds((current) => current.filter((x) => x !== id));
  }, []);

  useEffect(() => {
    const stored = readStoredSelectedIds();
    setSelectedIds(stored);
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

    setSelectedIds((current) => {
      if (current.includes(school.id)) return current;
      if (current.length >= MAX_SELECTED) {
        queueMicrotask(() => showToast("Máximo 2 escuelas en comparación"));
        return current;
      }
      return [...current, school.id];
    });

    queueMicrotask(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    if (school) {
      setSelectedIds((current) =>
        ensureSelectedSchoolFromReviewsQuery(current, school.id),
      );
    }

    queueMicrotask(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams, router, selectionHydrated, schoolsDataset]);

  const notifyMentoring = () => {
    showToast("Mentoría FlyPath próximamente");
  };

  const handleOpenCareerPlanner = useCallback(() => {
    const slugs = selectedSchools.map((school) => school.slug).filter(Boolean);
    if (slugs.length === 0) {
      router.push("/career-planner?source=schools-comparator");
      return;
    }
    try {
      window.localStorage.setItem(
        "flypath_pending_comparator_schools",
        JSON.stringify(slugs),
      );
    } catch {
      /* localStorage opcional: la URL ya transporta los slugs. */
    }
    const query = new URLSearchParams({
      source: "schools-comparator",
      schools: slugs.join(","),
    });
    router.push(`/career-planner?${query.toString()}`);
  }, [router, selectedSchools]);

  const comparisonHelpText =
    selectedSchools.length === 0
      ? "Selecciona una o dos escuelas para empezar."
      : selectedSchools.length === 1
        ? "Añade una segunda escuela para activar la comparación completa."
        : null;

  const startComparison = () => {
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      {toast && (
        <div className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg">
          {toast}
        </div>
      )}
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

        <section ref={searchSectionRef} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-lg font-semibold text-[#0f1a33]">Empieza tu comparación</p>
          <p className="mt-1 text-[15px] text-slate-600">
            Elige hasta 2 escuelas para comparar costes, ruta, documentación y riesgos con criterios FlyPath.
          </p>

          <div ref={comparisonPanelRef} className="mt-5">
            <SchoolComparatorPicker
              schools={pickableSchools}
              selectedSchools={selectedSchools}
              maxSelected={MAX_SELECTED}
              onAddSchool={addSchool}
              onRemoveSchool={removeSchool}
              onSelectionLimit={() => showToast("Máximo 2 escuelas en comparación")}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">
              {selectedSchools.length === 2 ? "Comparación activa" : "Estado"}
            </p>
            <p className="mt-0.5 text-[15px] font-medium text-[#0f1a33]">
              {selectedSchools.length}/{MAX_SELECTED} escuelas seleccionadas
            </p>
            {comparisonHelpText ? (
              <p className="mt-0.5 text-[15px] text-slate-600">{comparisonHelpText}</p>
            ) : (
              <p className="mt-0.5 text-[15px] text-slate-600">
                Comparación desbloqueada. Revisa el análisis comparativo más abajo.
              </p>
            )}
          </div>
        </section>

        {selectedSchools.length === 2 ? (
          <>
            <ComparisonResults schools={selectedSchools} />
            <section className="rounded-3xl border border-[#c9a454]/45 bg-gradient-to-br from-[#0a1228] via-[#0f1a33] to-[#152545] p-6 text-white shadow-[0_18px_48px_-18px_rgba(15,26,51,0.45)] ring-1 ring-[#c9a454]/20 sm:p-7">
              <div className="grid gap-5 lg:grid-cols-[1fr_minmax(240px,300px)] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-8 lg:gap-y-5">
                <div className="lg:col-start-1 lg:row-start-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]/95">
                    Career Planner
                  </p>
                  <h2 className="mt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">
                    Convierte esta comparación en un plan real
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
                    Lleva tus escuelas favoritas al Career Planner y cruza la comparación con tu perfil,
                    presupuesto, disponibilidad y riesgos antes de pagar una matrícula.
                  </p>
                  <ul className="mt-4 space-y-2 text-[15px] text-slate-200">
                    {[
                      "Ruta recomendada según tu situación",
                      "Coste realista con margen de seguridad",
                      "Riesgos personales y documentales",
                      "Informe premium personalizado",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 leading-relaxed">
                        <span
                          aria-hidden
                          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
                  <ComparatorPlannerPreviewMockup />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-start-1 lg:row-start-2">
                  <button
                    type="button"
                    onClick={handleOpenCareerPlanner}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55 sm:min-w-[220px] lg:w-auto"
                  >
                    Abrir Career Planner
                  </button>
                  <button
                    type="button"
                    onClick={notifyMentoring}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/22 bg-white/[0.07] px-6 py-2.5 text-[15px] font-semibold text-white transition hover:border-white/35 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 lg:w-auto"
                  >
                    Reservar mentoría
                  </button>
                </div>
              </div>
            </section>
          </>
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
