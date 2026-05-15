"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Layers,
  Menu,
  Plane,
} from "lucide-react";

const TOAST_MS = 2800;
const GENERIC_TOAST = "Clases PPL/ATPL próximamente";
const PPL_TOAST = "Clases PPL próximamente";
const ATPL_TOAST = "Clases ATPL próximamente";

const AUDIENCE = [
  {
    icon: BookOpen,
    title: "Estoy haciendo PPL y necesito refuerzo.",
  },
  {
    icon: Layers,
    title: "Estoy con ATPL y me estoy atascando.",
  },
  {
    icon: ClipboardCheck,
    title: "Quiero preparar exámenes con más estructura.",
  },
  {
    icon: BookMarked,
    title: "Necesito organizar mi estudio y prioridades.",
  },
] as const;

const PPL_BULLETS = [
  "Principios de vuelo.",
  "Meteorología.",
  "Navegación.",
  "Comunicaciones.",
  "Performance y planificación.",
  "Legislación básica.",
];

const ATPL_BULLETS = [
  "Air Law.",
  "Meteorology.",
  "General Navigation.",
  "Flight Planning.",
  "Performance.",
  "Mass & Balance.",
  "Human Performance.",
  "Operational Procedures.",
  "Radio Navigation.",
  "Aircraft General Knowledge.",
];

const WORK_TOPICS = [
  "Resolver dudas de teoría.",
  "Preparar exámenes.",
  "Crear un plan de estudio.",
  "Priorizar asignaturas.",
  "Repasar conceptos difíciles.",
  "Mejorar técnica de test.",
  "Organizar calendario.",
  "Revisar errores habituales.",
];

const HOW_STEPS = [
  {
    title: "Cuéntanos dónde estás atascado.",
    text: "Nivel, escuela, asignaturas y objetivo a corto plazo.",
  },
  {
    title: "Preparamos la sesión según tu objetivo.",
    text: "Enfoque práctico: dudas, esquemas, tests y prioridades.",
  },
  {
    title: "Sales con dudas resueltas y próximos pasos.",
    text: "Lista clara de qué repasar y cómo seguir organizando el estudio.",
  },
] as const;

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
  { id: "shop", label: "Shop", status: "soon" as const },
  { id: "blog", label: "Blog", status: "soon" as const },
];

const CURRENT_ITEM_ID = "clases";

export default function ClasesPplAtplPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [logoFallback, setLogoFallback] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const showGenericToast = useCallback(() => setToast(GENERIC_TOAST), []);
  const showPplToast = useCallback(() => setToast(PPL_TOAST), []);
  const showAtplToast = useCallback(() => setToast(ATPL_TOAST), []);

  const scrollToOpciones = useCallback(() => {
    document.getElementById("opciones-clases")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast((t) => (t === toast ? null : t)), TOAST_MS);
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
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2.5 text-[15px] text-white shadow-lg sm:right-5 sm:top-5"
        >
          {toast}
        </div>
      ) : null}

      <header className="border-b border-white/10 bg-[#0f1a33] text-white shadow-[0_12px_40px_rgba(15,26,51,0.35)]">
        <div className="mx-auto flex max-h-[90px] max-w-7xl items-center justify-between gap-3 px-6 py-3 sm:gap-4 md:justify-normal md:gap-4 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none md:min-w-0 md:flex-1 md:justify-start">
            <Link href="/" className="min-w-0 shrink">
              {!logoFallback ? (
                <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                  <Image
                    src="/flypath-logo-white.png"
                    alt="FlyPath — inicio"
                    width={540}
                    height={162}
                    className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                    priority
                    onError={() => setLogoFallback(true)}
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
            </Link>
          </div>
          <p
            className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
            aria-hidden
          >
            Clases PPL / ATPL
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
                          if (isSoon) setToast("Próximamente");
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

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white via-[#f7f9fc] to-[#eef2f8]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 55% at 95% 10%, rgba(201,164,84,0.16), transparent 55%), radial-gradient(ellipse 60% 50% at 5% 95%, rgba(15,26,51,0.07), transparent 55%)",
            }}
          />
          <div className="relative z-[1] mx-auto max-w-7xl px-6 pb-12 pt-10 sm:pb-14 sm:pt-12 lg:px-10 lg:pb-16 lg:pt-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  CLASES PPL / ATPL
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-[2.35rem] lg:text-[2.55rem] lg:leading-[1.08]">
                  Refuerzo para avanzar con más claridad en tu formación teórica
                </h1>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                  Clases para alumnos PPL y ATPL que necesitan ordenar asignaturas, resolver dudas, preparar exámenes o recuperar confianza durante la formación.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={showGenericToast}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                  >
                    Solicitar clases
                  </button>
                  <button
                    type="button"
                    onClick={scrollToOpciones}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                  >
                    Ver opciones
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="lg:justify-self-end">
                <div className="relative mx-auto w-full max-w-[440px] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_rgba(15,26,51,0.14)] ring-1 ring-black/[0.04] sm:p-7">
                  <div
                    className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#c9a454]/14 via-transparent to-[#0f1a33]/10 blur-3xl"
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                      FlyPath
                    </p>
                    <span className="rounded-full border border-[#c9a454]/40 bg-[#fffdf6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a5a16]">
                      Próximamente
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#0f1a33]">
                    Apoyo teórico
                  </h2>
                  <ul className="mt-5 space-y-2 text-[15px] leading-snug text-slate-700">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      PPL
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      ATPL
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Exámenes
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Plan de estudio
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              PARA QUIÉN ES
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Para quién son estas clases
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCE.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a454]/35 bg-[#fffdf6] text-[#7a5a16]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-[17px] font-semibold leading-snug text-[#0f1a33] sm:text-lg">
                      {b.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="opciones-clases"
          className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-16"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              OPCIONES
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Opciones
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_24px_60px_rgba(15,26,51,0.08)] ring-1 ring-black/[0.04] sm:p-8">
                <h3 className="text-2xl font-semibold tracking-tight text-[#0f1a33]">Clases PPL</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-base">
                  Refuerzo para entender conceptos básicos, preparar exámenes y ganar seguridad durante la primera fase de formación.
                </p>
                <ul className="mt-6 space-y-2 text-[15px] leading-snug text-slate-700">
                  {PPL_BULLETS.map((line) => (
                    <li key={line} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={showPplToast}
                  className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Solicitar clases PPL
                </button>
              </div>
              <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-[#fffdf8] p-7 shadow-[0_24px_60px_rgba(15,26,51,0.08)] ring-1 ring-black/[0.04] sm:p-8">
                <h3 className="text-2xl font-semibold tracking-tight text-[#0f1a33]">Clases ATPL</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-base">
                  Apoyo para asignaturas ATPL, organización de estudio, dudas concretas y preparación de exámenes.
                </p>
                <ul className="mt-6 grid gap-2 text-[14px] leading-snug text-slate-700 sm:grid-cols-2 sm:text-[15px]">
                  {ATPL_BULLETS.map((line) => (
                    <li key={line} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={showAtplToast}
                  className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Solicitar clases ATPL
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              CONTENIDOS
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Qué podemos trabajar en clase
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {WORK_TOPICS.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-[#f8fafc] px-5 py-4 shadow-[0_10px_28px_rgba(15,26,51,0.05)]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a454]" aria-hidden />
                  <span className="text-base font-medium leading-snug text-slate-700 lg:text-[17px]">
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              PROCESO
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Cómo funciona
            </h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {HOW_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.04] sm:p-7"
                >
                  <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border border-[#c9a454]/35 bg-[#fffdf6] px-2 text-sm font-semibold text-[#7a5a16]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-[#0f1a33]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600 lg:text-base">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              No dejes que la teoría te bloquee
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-[17px]">
              Una buena explicación en el momento adecuado puede ahorrarte tiempo, frustración y repeticiones.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={showGenericToast}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Solicitar clases
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
              >
                Planificar mi ruta
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
