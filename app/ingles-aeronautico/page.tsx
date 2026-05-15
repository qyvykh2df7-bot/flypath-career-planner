"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Menu,
  Mic2,
  Plane,
  Radio,
} from "lucide-react";

const TOAST_MS = 2800;
const MAIN_TOAST = "Clases de inglés aeronáutico próximamente";

const AUDIENCE = [
  {
    icon: BookOpen,
    title: "Quiero empezar aviación y mi inglés me preocupa.",
  },
  {
    icon: GraduationCap,
    title: "Estoy haciendo PPL/ATPL y necesito mejorar.",
  },
  {
    icon: Radio,
    title: "Quiero preparar comunicaciones y fraseología.",
  },
  {
    icon: Mic2,
    title: "Quiero ganar confianza hablando en contexto aeronáutico.",
  },
] as const;

const WORK_TOPICS = [
  "Fraseología aeronáutica básica.",
  "Comunicaciones ATC.",
  "Escucha y comprensión.",
  "Respuestas orales.",
  "Situaciones normales y no normales.",
  "Preparación ICAO English.",
  "Inglés para entrevistas.",
  "Confianza y fluidez hablando.",
];

const HOW_STEPS = [
  {
    title: "Cuéntanos tu nivel y objetivo.",
    text: "Definimos prioridades según tu formación, fechas y el uso que necesitas del inglés.",
  },
  {
    title: "Trabajamos situaciones reales.",
    text: "Practicamos comunicaciones, escucha activa y respuestas con material aplicado a aviación.",
  },
  {
    title: "Sales con más seguridad y próximos pasos.",
    text: "Te llevas ideas claras para seguir practicando y encajar el inglés en tu ruta.",
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

const CURRENT_ITEM_ID = "ingles";

export default function InglesAeronauticoPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [logoFallback, setLogoFallback] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const showMainToast = useCallback(() => setToast(MAIN_TOAST), []);

  const scrollToWork = useCallback(() => {
    document.getElementById("que-trabajamos-ingles")?.scrollIntoView({
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
            Inglés aeronáutico
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
                  INGLÉS AERONÁUTICO
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-[2.35rem] lg:text-[2.55rem] lg:leading-[1.08]">
                  Habla con más seguridad en inglés aeronáutico
                </h1>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                  Clases para futuros pilotos y alumnos en formación que quieren mejorar comunicaciones, fraseología, confianza oral e inglés aplicado a la aviación.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={showMainToast}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                  >
                    Solicitar clases
                  </button>
                  <button
                    type="button"
                    onClick={scrollToWork}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                  >
                    Ver qué trabajamos
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
                    Inglés aeronáutico
                  </h2>
                  <ul className="mt-5 space-y-2 text-[15px] leading-snug text-slate-700">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Comunicaciones ATC
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Fraseología
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      ICAO English
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Entrevistas y confianza oral
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
          id="que-trabajamos-ingles"
          className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-16"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              CONTENIDOS
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Qué podemos trabajar
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {WORK_TOPICS.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_10px_28px_rgba(15,26,51,0.05)]"
                >
                  <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a454]" aria-hidden />
                  <span className="text-base font-medium leading-snug text-slate-700 lg:text-[17px]">
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              FORMATOS
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Modalidades
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#fffdf8] p-6 shadow-[0_16px_44px_rgba(15,26,51,0.07)] ring-1 ring-black/[0.03] sm:p-7">
                <h3 className="text-xl font-semibold text-[#0f1a33]">Clase individual</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                  Para trabajar tus puntos concretos y avanzar a tu ritmo.
                </p>
                <p className="mt-6 text-lg font-semibold text-[#7a5a16]">Próximamente</p>
                <button
                  type="button"
                  onClick={showMainToast}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_32px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Solicitar información
                </button>
              </div>
              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_44px_rgba(15,26,51,0.07)] ring-1 ring-black/[0.03] sm:p-7">
                <h3 className="text-xl font-semibold text-[#0f1a33]">Pack de clases</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                  Para mejorar de forma progresiva con seguimiento.
                </p>
                <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Bajo solicitud
                </p>
                <button
                  type="button"
                  onClick={showMainToast}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
                >
                  Consultar pack
                </button>
              </div>
              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_44px_rgba(15,26,51,0.07)] ring-1 ring-black/[0.03] sm:p-7">
                <h3 className="text-xl font-semibold text-[#0f1a33]">Preparación específica</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                  Para entrevistas, pruebas orales o comunicaciones concretas.
                </p>
                <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Bajo solicitud
                </p>
                <button
                  type="button"
                  onClick={showMainToast}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
                >
                  Consultar preparación
                </button>
              </div>
            </div>
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
              Mejora tu inglés antes de que se convierta en un bloqueo
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-[17px]">
              El inglés puede marcar la diferencia en la formación, las comunicaciones y los procesos de selección.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={showMainToast}
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
