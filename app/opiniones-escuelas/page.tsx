"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Menu, Plane, ShieldCheck, Star, X } from "lucide-react";
import { getComparableSchools } from "@/lib/schools/schoolUtils";

const TOAST_TIMEOUT_MS = 2300;

/** Slug real del comparador para Adventia (solo lectura; dataset no se modifica). */
const ADVENTIA_PREVIEW_SLUG = "adventia-usal";

const REVIEW_FORM_INTRO =
  "Tu opinión no se publicará automáticamente. FlyPath revisará la información antes de mostrarla públicamente y podrá anonimizar tus datos personales.";

const REVIEW_FORM_PREVIEW_NOTICE =
  "De momento este formulario es una vista previa. La recogida real de opiniones se activará próximamente.";

const REVIEW_FORM_ERROR_MESSAGE = "Completa los campos obligatorios antes de continuar.";
const REVIEW_FORM_SUCCESS_MESSAGE =
  "Formulario preparado. La recogida real de opiniones se activará próximamente.";

const RELATIONSHIP_OPTIONS = [
  "Soy alumno actual",
  "Soy antiguo alumno",
  "He terminado la formación",
  "Me cambié de escuela",
  "Solo pedí información",
];

const RATING_FIELDS: { name: string; label: string }[] = [
  { name: "ratingGeneral", label: "Valoración general" },
  { name: "ratingCosts", label: "Transparencia de costes" },
  { name: "ratingAvailability", label: "Disponibilidad de aviones" },
  { name: "ratingOrganization", label: "Organización de la formación" },
  { name: "ratingInstructors", label: "Calidad de instructores" },
  { name: "ratingSupport", label: "Soporte administrativo" },
  { name: "ratingContract", label: "Claridad de contrato y reembolso" },
];

const KEY_QUESTIONS: { name: string; label: string }[] = [
  { name: "qFinalCost", label: "¿El coste final se pareció al precio anunciado?" },
  { name: "qContract", label: "¿Recibiste contrato antes de pagar?" },
  { name: "qRefund", label: "¿La política de reembolso estaba clara?" },
  { name: "qWouldChoose", label: "¿Volverías a elegir esa escuela?" },
];

const KEY_QUESTION_OPTIONS = ["Sí", "No", "Parcialmente", "No lo sé"];

type ReviewFormStatus = "idle" | "error" | "success";

const ADVENTIA_DEMO_AREAS: { label: string; score: string }[] = [
  { label: "Transparencia de costes", score: "7,6/10" },
  { label: "Disponibilidad de aviones", score: "8,0/10" },
  { label: "Organización de la formación", score: "7,8/10" },
  { label: "Calidad de instructores", score: "8,5/10" },
  { label: "Soporte administrativo", score: "7,4/10" },
  { label: "Contrato y reembolso", score: "7,2/10" },
];

const ADVENTIA_DEMO_REVIEWS: { meta: string; quote: string }[] = [
  {
    meta: "Alumno verificado · Fase ATPL · 2024 · Simulada",
    quote:
      "Buena organización general y buen nivel docente. Antes de pagar, pediría el desglose completo de tasas y costes administrativos.",
  },
  {
    meta: "Antiguo alumno · Fase integrada · 2023 · Simulada",
    quote:
      "La experiencia fue positiva, especialmente en la parte teórica. Recomendaría confirmar por escrito calendario de pagos y política de reembolso.",
  },
];

const VALIDATION_TOPICS: string[] = [
  "Coste final frente al precio anunciado",
  "Disponibilidad real de aviones",
  "Organización de la formación",
  "Calidad de instructores",
  "Claridad de contrato y reembolso",
  "Soporte administrativo",
  "Retrasos durante la formación",
  "Si el alumno volvería a elegir esa escuela",
];

const VERIFICATION_BULLETS: string[] = [
  "Alumno o antiguo alumno real",
  "Escuela y fase de formación identificadas",
  "Moderación antes de publicar",
  "Posibilidad de mostrar la opinión de forma anónima",
];

/**
 * Mismo orden y mismas etiquetas que en `/schools` y `/` (landing).
 * `isCurrent` se decide en cada página por id del item.
 */
const PLATFORM_MODULES = [
  { id: "inicio", label: "Inicio", status: "available" as const, href: "/" },
  { id: "guia", label: "Guía Cómo ser piloto", status: "available" as const, href: "/guia-como-ser-piloto" },
  { id: "planifica", label: "Planifica tu ruta", status: "available" as const, href: "/" },
  { id: "compara", label: "Compara escuelas", status: "available" as const, href: "/schools" },
  {
    id: "opiniones",
    label: "Opiniones de escuelas",
    status: "available" as const,
    href: "/opiniones-escuelas",
  },
  { id: "atpl", label: "ATPL Planner", status: "soon" as const },
  { id: "ingles", label: "Inglés aeronáutico", status: "available" as const, href: "/ingles-aeronautico" },
  { id: "clases", label: "Clases PPL/ATPL", status: "available" as const, href: "/clases-ppl-atpl" },
  { id: "mentorias", label: "Mentorías", status: "available" as const, href: "/mentorias" },
  { id: "shop", label: "Shop", status: "available" as const, href: "/shop" },
  { id: "blog", label: "Blog", status: "available" as const, href: "/blog" },
];

const CURRENT_ITEM_ID = "opiniones";

/**
 * Página informativa del sistema de opiniones verificadas FlyPath.
 *
 * Funciona como placeholder honesto antes de tener un sistema real de
 * reviews. No conecta con backend, no publica opiniones y el CTA principal
 * solo muestra un toast editorial. La estética y el menú siguen el patrón
 * del comparador (`/schools`).
 */
export default function OpinionesEscuelasPage() {
  const router = useRouter();
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const [headerLogoFallback, setHeaderLogoFallback] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [heroImageAvailable, setHeroImageAvailable] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [modalSchoolSlug, setModalSchoolSlug] = useState<string>("");
  const [formStatus, setFormStatus] = useState<ReviewFormStatus>("idle");
  const [formKey, setFormKey] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const reviewFormRef = useRef<HTMLFormElement>(null);

  const setRating = (name: string, value: number) =>
    setRatings((current) =>
      current[name] === value
        ? (() => {
            const next = { ...current };
            delete next[name];
            return next;
          })()
        : { ...current, [name]: value },
    );

  /**
   * Lista de escuelas tomada del dataset real del comparador (`schoolsSpain`)
   * filtrada por `isSchoolComparable` y ordenada alfabéticamente por nombre
   * (locale `es`, sin distinguir mayúsculas/acentos).
   *
   * Solo se leen `slug` y `name`: no se modifica ninguna entrada y la página
   * sigue sin tocar lógica del comparador, Supabase, premium o filtros.
   */
  const schoolOptions = useMemo(
    () =>
      getComparableSchools()
        .map((s) => ({ value: s.slug, label: s.name }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, "es", { sensitivity: "base" }),
        ),
    [],
  );

  const selectedSchoolLabel = useMemo(
    () => schoolOptions.find((s) => s.value === selectedSchool)?.label ?? "",
    [selectedSchool, schoolOptions],
  );

  const isAdventiaPreview = selectedSchool === ADVENTIA_PREVIEW_SLUG;

  const openReviewModal = (slug: string = selectedSchool) => {
    setModalSchoolSlug(slug);
    setFormStatus("idle");
    setRatings({});
    setFormKey((k) => k + 1);
    setReviewModalOpen(true);
  };
  const closeReviewModal = () => setReviewModalOpen(false);

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const schoolSlug = String(data.get("schoolSlug") ?? "").trim();
    const relationship = String(data.get("relationship") ?? "").trim();
    const acceptReview = data.get("acceptReview") === "on";
    if (!fullName || !email || !schoolSlug || !relationship || !acceptReview) {
      setFormStatus("error");
      return;
    }
    setFormStatus("success");
  };

  useEffect(() => {
    if (!reviewModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReviewModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reviewModalOpen]);

  useEffect(() => {
    if (!reviewModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewModalOpen]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => {
      setToast((current) => (current === toast ? null : current));
    }, TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!moduleMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = moduleMenuRef.current;
      if (el && !el.contains(e.target as Node)) setModuleMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moduleMenuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

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
                  <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                    FlyPath
                  </p>
                </div>
              </div>
            )}
          </div>
          <p
            className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
            aria-hidden
          >
            Opiniones de escuelas
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
                className="absolute right-0 z-20 mt-2 max-h-[calc(100vh-120px)] w-[min(22rem,calc(100vw-2rem))] max-w-[min(96vw,26rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white px-1.5 py-2 shadow-[0_24px_52px_rgba(15,26,51,0.11),0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/45"
              >
                {PLATFORM_MODULES.map((m) => {
                  const isSoon = m.status === "soon";
                  const isCurrent = m.id === CURRENT_ITEM_ID;
                  const hasHref = "href" in m && typeof m.href === "string" && m.href.length > 0;
                  const isClickable = hasHref || isSoon;
                  return (
                    <li key={m.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isCurrent}
                        aria-disabled={false}
                        onClick={() => {
                          setModuleMenuOpen(false);
                          if (hasHref && m.href) {
                            router.push(m.href);
                            return;
                          }
                          if (isSoon) {
                            setToast("Próximamente");
                          }
                        }}
                        className={`flex w-full items-center justify-between gap-8 rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                          isClickable ? "cursor-pointer" : "cursor-not-allowed"
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
        <div className="mx-auto w-full max-w-[1100px] space-y-5">
          {/* HERO: filtro blanco/crema suave (estilo comparador, sin overlay azul fuerte) */}
          <section className="relative overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-b from-[#fffdfb] via-[#f8fafc] to-[#f3f6fa] p-6 shadow-[0_14px_44px_-18px_rgba(15,26,51,0.1)] ring-1 ring-[#c9a454]/18 sm:p-8">
            {heroImageAvailable ? (
              <Image
                src="/opiniones-escuelas-hero.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1100px) 95vw, 1100px"
                className="pointer-events-none -scale-x-100 object-cover opacity-[0.78] contrast-[1.02]"
                onError={() => setHeroImageAvailable(false)}
                aria-hidden
              />
            ) : (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[#f4f2ee]"
              />
            )}
            {/* Lavado crema muy ligero general — solo para integrar la foto */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[#fffdf6]/22"
            />
            {/* Refuerzo localizado bajo la columna de texto: claro → transparente */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#fffdf9]/82 via-[#fffdf9]/35 to-transparent sm:from-[#fffdf9]/74 sm:via-[#fffdf9]/22"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_8%,rgba(201,164,84,0.10),transparent_58%)]"
            />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a16]">
                  Opiniones verificadas
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#0f1a33] drop-shadow-[0_1px_0_rgba(255,255,255,0.95)] sm:text-4xl">
                  Opiniones verificadas de escuelas de vuelo
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#0f1a33] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] [text-shadow:0_0_24px_rgba(255,253,249,0.65)]">
                  Consulta el estado de opiniones verificadas por escuela y ayuda a otros
                  futuros pilotos compartiendo tu experiencia antes de una decisión
                  económica importante.
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#0f1a33]/82 sm:text-[15px]">
                  FlyPath recogerá experiencias reales sobre costes, organización,
                  disponibilidad de aviones, instructores, soporte administrativo y
                  condiciones antes de pagar.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => openReviewModal()}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                  >
                    Dejar una opinión
                  </button>
                </div>
                <p className="mt-3 max-w-2xl text-[12px] leading-snug text-[#0f1a33]/62">
                  Las opiniones públicas se mostrarán más adelante, cuando el sistema esté
                  validado.
                </p>
              </div>

              {/* Visual derecho: mini-card opaca (no recibe el filtro crema del hero) */}
              <aside
                aria-hidden
                className="relative z-20 hidden isolate rounded-2xl border border-white/12 bg-[#0f1a33] p-4 text-white shadow-[0_14px_32px_rgba(15,26,51,0.28)] ring-1 ring-[#c9a454]/30 lg:block"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                    <ShieldCheck className="h-4 w-4 text-[#f2ddaa]" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
                    Opinión verificada
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.06] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      {[0, 1, 2, 3].map((i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-[#f2ddaa]"
                          fill="currentColor"
                          strokeWidth={1.5}
                        />
                      ))}
                      <Star
                        className="h-4 w-4 text-[#f2ddaa]/30"
                        fill="currentColor"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="rounded-full border border-[#c9a454]/40 bg-[#c9a454]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f2ddaa]">
                      En validación
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-[72%] rounded-full bg-white/15" />
                    <div className="h-1.5 w-[55%] rounded-full bg-white/10" />
                    <div className="h-1.5 w-[40%] rounded-full bg-white/10" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#f2ddaa]" />
                  <span>Experiencias revisadas por FlyPath</span>
                </div>
              </aside>
            </div>
          </section>

          {/* SELECTOR de escuela (lista real del comparador, orden alfabético) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#0f1a33]">Selecciona una escuela</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
              Elige una escuela para consultar el estado de sus opiniones verificadas.
            </p>
            <label className="mt-4 block max-w-md">
              <span className="sr-only">Escuela</span>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
              >
                <option value="">Elige una escuela</option>
                {schoolOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {/* RESULTADO de escuela seleccionada */}
          {selectedSchool ? (
            isAdventiaPreview ? (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Cabecera azul marino: eyebrow + nombre + chip Demo interna */}
                <div className="relative bg-[#0f1a33] px-5 py-4 text-white sm:px-6">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_140%_at_100%_50%,rgba(201,164,84,0.14),transparent_60%)]"
                  />
                  <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
                        Vista previa de diseño
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                        Adventia
                      </h2>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300/45 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100">
                      Demo interna
                    </span>
                  </div>
                </div>

                {/* Cuerpo blanco */}
                <div className="px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[12px] leading-snug text-slate-500">
                    Contenido simulado únicamente para previsualizar la interfaz. No son
                    datos reales ni opiniones publicadas.
                  </p>

                  <div className="mt-5 border-b border-slate-100 pb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Calificación global
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="text-4xl font-bold tabular-nums tracking-tight text-[#0f1a33]">
                        8,1
                        <span className="text-2xl font-semibold text-slate-500">/10</span>
                      </p>
                      <div
                        className="flex items-center gap-0.5 self-end pb-1.5"
                        aria-label="4 de 5 estrellas (simulado)"
                      >
                        {[0, 1, 2, 3].map((i) => (
                          <Star
                            key={i}
                            className="h-6 w-6 text-[#c9a454]"
                            fill="currentColor"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        ))}
                        <Star
                          className="h-6 w-6 text-[#c9a454]/25"
                          fill="currentColor"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                    Basado en 12 opiniones verificadas simuladas para previsualizar el
                    diseño.
                  </p>

                  <div className="mt-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Áreas
                    </p>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {ADVENTIA_DEMO_AREAS.map((row) => (
                        <li
                          key={row.label}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-[14px]"
                        >
                          <span className="font-medium text-slate-700">{row.label}</span>
                          <span className="shrink-0 tabular-nums font-semibold text-[#0f1a33]">
                            {row.score}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Opiniones recientes simuladas
                    </p>
                    <ul className="mt-2 grid gap-3 sm:grid-cols-1">
                      {ADVENTIA_DEMO_REVIEWS.map((r) => (
                        <li
                          key={r.meta}
                          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 pl-[14px] shadow-[0_1px_0_rgba(15,26,51,0.03)]"
                        >
                          <span
                            aria-hidden
                            className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#c9a454]/55"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">
                              {r.meta}
                            </p>
                            <div
                              className="flex items-center gap-0.5"
                              aria-label="4 de 5 estrellas (simulado)"
                            >
                              {[0, 1, 2, 3].map((i) => (
                                <Star
                                  key={i}
                                  className="h-3.5 w-3.5 text-[#c9a454]"
                                  fill="currentColor"
                                  strokeWidth={1.5}
                                  aria-hidden
                                />
                              ))}
                              <Star
                                className="h-3.5 w-3.5 text-[#c9a454]/30"
                                fill="currentColor"
                                strokeWidth={1.5}
                                aria-hidden
                              />
                            </div>
                          </div>
                          <blockquote className="mt-2 text-[15px] leading-relaxed text-slate-700">
                            “{r.quote}”
                          </blockquote>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={() => openReviewModal(ADVENTIA_PREVIEW_SLUG)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                    >
                      Dejar una opinión sobre Adventia
                    </button>
                    <Link
                      href={`/schools?selected=${encodeURIComponent(ADVENTIA_PREVIEW_SLUG)}&source=reviews`}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Comparar esta escuela
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-[#c9a454]/30 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">
                      Escuela seleccionada
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-[#0f1a33] sm:text-2xl">
                      {selectedSchoolLabel}
                    </h2>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#c9a454]/35 bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a5a16]">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Opiniones en validación
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                  Todavía no hay suficientes opiniones verificadas para mostrar una
                  calificación pública de esta escuela.
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  Cuando haya suficientes datos revisados, aquí verás calificación global,
                  valoración por áreas, opiniones verificadas de alumnos y una lectura
                  FlyPath de puntos fuertes y puntos a vigilar.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={() => openReviewModal(selectedSchool)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                  >
                    {`Dejar una opinión sobre ${selectedSchoolLabel}`}
                  </button>
                  <Link
                    href={`/schools?selected=${encodeURIComponent(selectedSchool)}&source=reviews`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                  >
                    Comparar esta escuela
                  </Link>
                </div>
              </section>
            )
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 sm:p-6">
              <p className="text-[15px] leading-relaxed text-slate-700">
                Selecciona una escuela para ver el estado de sus opiniones verificadas.
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                Cuando existan suficientes opiniones revisadas, aquí aparecerán la
                calificación global, las áreas mejor valoradas y los puntos a vigilar.
              </p>
            </section>
          )}

          {/* CÓMO VERIFICAMOS LAS OPINIONES (incluye 'Qué queremos validar' como apoyo) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#0f1a33]">
              Cómo verificamos las opiniones
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
              Las opiniones no se publicarán automáticamente. FlyPath revisará que
              procedan de alumnos o antiguos alumnos reales antes de mostrarlas
              públicamente.
            </p>
            <ul className="mt-4 space-y-2 text-[15px] leading-snug text-slate-700">
              {VERIFICATION_BULLETS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                Qué se tendrá en cuenta
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {VALIDATION_TOPICS.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium leading-tight text-slate-700 shadow-[0_1px_0_rgba(15,26,51,0.02)]"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ESTADO ACTUAL */}
          <section className="rounded-2xl border border-[#c9a454]/30 bg-[#fffdf6] p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">
              Estado actual
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
              El sistema todavía está en preparación. Estamos dejando listo el flujo de
              consulta, envío y verificación. Hasta que haya suficientes opiniones reales
              y revisadas, no mostraremos calificaciones públicas ni usaremos esta señal
              en la lectura FlyPath.
            </p>
          </section>
        </div>
      </main>

      {/* MODAL: formulario de opinión (vista previa, sin backend) */}
      {reviewModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-form-title"
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-[#0a1228]/55 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReviewModal();
          }}
        >
          <div className="relative my-auto w-full max-w-[760px] overflow-hidden rounded-3xl border border-[#c9a454]/35 bg-white shadow-[0_28px_64px_-16px_rgba(15,26,51,0.45)] ring-1 ring-[#c9a454]/15">
            {/* Header navy */}
            <div className="relative bg-[#0f1a33] px-5 py-4 text-white sm:px-7 sm:py-5">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_140%_at_100%_50%,rgba(201,164,84,0.14),transparent_60%)]"
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 pr-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2ddaa]">
                    Opinión verificada
                  </p>
                  <h3
                    id="review-form-title"
                    className="mt-1 text-xl font-semibold leading-tight text-white sm:text-2xl"
                  >
                    Deja una opinión verificada
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  aria-label="Cerrar formulario de opinión"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] text-white transition hover:border-white/35 hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[82vh] overflow-y-auto overscroll-contain px-5 pb-8 pt-4 [scrollbar-gutter:stable] sm:px-7 sm:pb-10 sm:pt-5">
              {formStatus === "success" ? (
                <div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Listo
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-emerald-900">
                      {REVIEW_FORM_SUCCESS_MESSAGE}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {REVIEW_FORM_INTRO}
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setFormStatus("idle")}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-[14px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Editar datos
                    </button>
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  ref={reviewFormRef}
                  key={formKey}
                  onSubmit={handleReviewSubmit}
                  noValidate
                  className="space-y-7"
                >
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {REVIEW_FORM_INTRO}
                    </p>
                    <p className="rounded-xl border border-[#c9a454]/30 bg-[#fffdf6] px-3 py-1.5 text-sm leading-snug text-[#7a5a16]">
                      {REVIEW_FORM_PREVIEW_NOTICE}
                    </p>
                  </div>

                  {/* SECCIÓN 1 — Datos básicos */}
                  <fieldset className="space-y-4">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Datos básicos
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Nombre completo <span className="text-rose-600">*</span>
                        </span>
                        <input
                          type="text"
                          name="fullName"
                          autoComplete="name"
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Email <span className="text-rose-600">*</span>
                        </span>
                        <input
                          type="email"
                          name="email"
                          autoComplete="email"
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Escuela <span className="text-rose-600">*</span>
                        </span>
                        <select
                          name="schoolSlug"
                          defaultValue={modalSchoolSlug}
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        >
                          <option value="">Selecciona una escuela</option>
                          {schoolOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Programa o fase de formación
                        </span>
                        <input
                          type="text"
                          name="programPhase"
                          placeholder="Integrado ATPL, modular, PPL..."
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                    </div>
                  </fieldset>

                  {/* SECCIÓN 2 — Relación */}
                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Relación con la escuela
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Tu relación <span className="text-rose-600">*</span>
                        </span>
                        <select
                          name="relationship"
                          defaultValue=""
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        >
                          <option value="">Selecciona una opción</option>
                          {RELATIONSHIP_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Año aproximado
                        </span>
                        <input
                          type="text"
                          name="approxYear"
                          inputMode="numeric"
                          placeholder="Ej. 2024"
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                        />
                      </label>
                    </div>
                  </fieldset>

                  {/* SECCIÓN 3 — Valoraciones (estrellas, equivalencia /10) */}
                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Valoraciones (1–10)
                    </legend>
                    <p className="text-sm leading-snug text-slate-500">
                      Toca las estrellas para valorar cada área. La equivalencia se
                      muestra sobre 10.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {RATING_FIELDS.map((field) => {
                        const current = ratings[field.name];
                        return (
                          <div
                            key={field.name}
                            className="rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2.5"
                          >
                            <p className="text-sm font-medium leading-snug text-slate-700">
                              {field.label}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div
                                role="radiogroup"
                                aria-label={field.label}
                                className="flex items-center gap-0.5"
                              >
                                {[1, 2, 3, 4, 5].map((n) => {
                                  const value = n * 2;
                                  const active = (current ?? 0) >= value;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      role="radio"
                                      aria-checked={current === value}
                                      aria-label={`${value} sobre 10`}
                                      onClick={() => setRating(field.name, value)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 hover:bg-slate-100"
                                    >
                                      <Star
                                        className={`h-5 w-5 transition ${
                                          active
                                            ? "text-[#c9a454]"
                                            : "text-slate-300"
                                        }`}
                                        fill="currentColor"
                                        strokeWidth={1.5}
                                        aria-hidden
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                              <span className="text-[11.5px] font-medium tabular-nums text-slate-500">
                                {current ? `${current}/10` : "Sin valorar"}
                              </span>
                            </div>
                            <input
                              type="hidden"
                              name={field.name}
                              value={current ?? ""}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* SECCIÓN 4 — Preguntas clave */}
                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Preguntas clave
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {KEY_QUESTIONS.map((q) => (
                        <label key={q.name} className="block">
                          <span className="text-sm font-medium leading-snug text-slate-700">
                            {q.label}
                          </span>
                          <select
                            name={q.name}
                            defaultValue=""
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          >
                            <option value="">Sin responder</option>
                            {KEY_QUESTION_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* SECCIÓN 5 — Comentarios libres */}
                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Tu experiencia
                    </legend>
                    <div className="grid gap-4">
                      {[
                        { name: "bestPart", label: "Lo mejor de tu experiencia" },
                        { name: "improvements", label: "Lo que mejorarías" },
                        { name: "advice", label: "Consejo para futuros alumnos" },
                      ].map((t) => (
                        <label key={t.name} className="block">
                          <span className="text-sm font-medium text-slate-700">
                            {t.label}
                          </span>
                          <textarea
                            name={t.name}
                            rows={3}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-[#0f1a33] shadow-sm transition focus:border-[#c9a454] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/30"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* SECCIÓN 6 — Privacidad */}
                  <fieldset className="space-y-3 border-t border-slate-100 pt-6">
                    <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                      Privacidad y revisión
                    </legend>
                    <label className="flex items-start gap-2.5 text-sm leading-snug text-slate-700">
                      <input
                        type="checkbox"
                        name="anonymous"
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-400 text-[#c9a454] focus:ring-[#c9a454]/40"
                      />
                      <span>Quiero que mi opinión se muestre de forma anónima.</span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm leading-snug text-slate-700">
                      <input
                        type="checkbox"
                        name="acceptReview"
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-400 text-[#c9a454] focus:ring-[#c9a454]/40"
                      />
                      <span>
                        Acepto que FlyPath revise esta información antes de publicarla y
                        entiendo que no se publicará automáticamente.{" "}
                        <span className="text-rose-600">*</span>
                      </span>
                    </label>
                  </fieldset>

                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-snug text-slate-600">
                    No incluyas datos sensibles ni acusaciones graves sin contexto.
                    FlyPath podrá pedir verificación adicional antes de publicar una
                    opinión.
                  </p>

                  {formStatus === "error" ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[14px] font-medium text-rose-800"
                    >
                      {REVIEW_FORM_ERROR_MESSAGE}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                    >
                      Enviar opinión para revisión
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
