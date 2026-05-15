"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Compass,
  GraduationCap,
  Menu,
  Plane,
  Users,
} from "lucide-react";

const TOAST_MS = 2800;
const RESERVATION_TOAST = "Reserva de mentoría próximamente";
const PACK_TOAST = "Pack de mentoría próximamente";

const AUDIENCE_BLOCKS = [
  {
    icon: Compass,
    title: "Quiero ser piloto, pero no sé por dónde empezar",
    text: "Te ayudamos a entender rutas, licencias, Class 1, costes y primeros pasos antes de hablar con escuelas.",
  },
  {
    icon: ClipboardList,
    title: "Estoy comparando escuelas",
    text: "Revisamos precios, contratos, pagos, extras, ruta integrada o modular y puntos que deberías confirmar por escrito.",
  },
  {
    icon: GraduationCap,
    title: "Ya he empezado la formación",
    text: "Ordenamos tu situación actual, fases pendientes, costes, tiempos, ATPL, inglés y próximos pasos.",
  },
  {
    icon: Users,
    title: "Soy padre, madre o familiar",
    text: "Te ayudamos a entender el camino, los costes reales y las decisiones críticas antes de apoyar económicamente.",
  },
] as const;

const REVIEW_TOPICS = [
  "Ruta integrada vs modular",
  "Class 1 y requisitos médicos",
  "Presupuesto real y costes ocultos",
  "Comparación de escuelas",
  "Contrato, pagos y reembolsos",
  "Organización si ya estás estudiando",
  "ATPL, PPL, CPL, IR, MCC o UPRT",
  "Inglés aeronáutico",
  "CV y primeros pasos hacia aerolínea",
  "Decisiones antes de pagar matrícula",
];

const MENTORSHIP_INCLUDES = [
  "Revisión de tu situación actual.",
  "Análisis de ruta y próximos pasos.",
  "Revisión de dudas sobre escuelas, costes o formación.",
  "Recomendaciones prácticas para tu caso.",
  "Resumen de puntos clave a revisar después de la sesión.",
];

const PACK_PLANS = [
  {
    title: "Pack 3 sesiones",
    subtitle: "Para ordenar ruta, comparar opciones y revisar avances.",
    bullets: [
      "Seguimiento en fase de decisión.",
      "Comparación progresiva de escuelas.",
      "Revisión de presupuesto y próximos pasos.",
      "Ideal si estás cerca de pagar o elegir escuela.",
    ],
  },
  {
    title: "Pack 6 sesiones",
    subtitle: "Para acompañamiento más completo durante una fase de decisión o formación.",
    bullets: [
      "Seguimiento más continuo.",
      "Revisión de avances y bloqueos.",
      "Apoyo durante fases de formación.",
      "Ideal si ya has empezado o necesitas estructura.",
    ],
  },
] as const;

const HOW_IT_WORKS = [
  {
    title: "Cuéntanos tu situación",
    text: "Edad, ruta, presupuesto, Class 1, inglés, escuelas que estás mirando o fase de formación actual.",
  },
  {
    title: "Revisamos tu caso en sesión",
    text: "Analizamos tus opciones, riesgos, dudas y próximos pasos con un enfoque práctico.",
  },
  {
    title: "Sales con un plan más claro",
    text: "Te llevas una lista de decisiones, preguntas y puntos que conviene validar antes de avanzar.",
  },
] as const;

const FAQS = [
  {
    q: "¿La mentoría sirve si todavía no he empezado?",
    a: "Sí. De hecho, es uno de los mejores momentos para revisar ruta, costes, Class 1 y escuelas antes de pagar.",
  },
  {
    q: "¿También sirve si ya estoy en una escuela?",
    a: "Sí. Podemos revisar tu situación actual, fases pendientes, costes, organización, ATPL, inglés o próximos pasos.",
  },
  {
    q: "¿Me vais a decir qué escuela elegir?",
    a: "No prometemos una escuela perfecta. Te ayudamos a comparar con criterio, detectar riesgos y saber qué deberías confirmar antes de decidir.",
  },
  {
    q: "¿Es asesoramiento financiero o legal?",
    a: "No. Es orientación educativa basada en experiencia real del sector. Para decisiones legales, médicas o financieras debes consultar profesionales acreditados.",
  },
  {
    q: "¿Puedo hacer una mentoría con mis padres?",
    a: "Sí. Puede ser útil si la familia va a participar en la decisión económica y necesita entender costes, rutas y riesgos.",
  },
] as const;

/** Mismo orden que `/`, `/schools`, `/opiniones-escuelas` y `/guia-como-ser-piloto`. */
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

const CURRENT_ITEM_ID = "mentorias";

export default function MentoriasPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [logoFallback, setLogoFallback] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const showReservationToast = useCallback(() => {
    setToast(RESERVATION_TOAST);
  }, []);

  const showPackToast = useCallback(() => {
    setToast(PACK_TOAST);
  }, []);

  const scrollToRevision = useCallback(() => {
    document.getElementById("que-revisamos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => {
      setToast((t) => (t === toast ? null : t));
    }, TOAST_MS);
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
            Mentorías FlyPath
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

      <main>
        {/* HERO */}
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
                  MENTORÍAS FLYPATH
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-[2.4rem] lg:text-[2.65rem] lg:leading-[1.08]">
                  Toma mejores decisiones en tu camino como piloto
                </h1>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                  Una sesión individual para ordenar tu situación, revisar tus opciones y saber cuál es el siguiente paso correcto, tanto si estás empezando desde cero como si ya has iniciado la formación.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={showReservationToast}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                  >
                    Reservar mentoría
                  </button>
                  <button
                    type="button"
                    onClick={scrollToRevision}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                  >
                    Ver qué revisamos
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
                <p className="mt-5 text-[13px] font-medium tracking-[0.02em] text-slate-500">
                  Sesión 1:1 · Online · Orientación práctica
                </p>
              </div>
              {/* Card de mentoría individual del hero */}
              <div className="lg:justify-self-end">
                <div className="relative mx-auto w-full max-w-[440px] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_rgba(15,26,51,0.14)] ring-1 ring-black/[0.04] sm:p-7">
                  <div
                    className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#c9a454]/14 via-transparent to-[#0f1a33]/10 blur-3xl"
                    aria-hidden
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                    Mentoría 1:1
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f1a33]">
                    Mentoría individual
                  </h2>
                  <p className="mt-4 flex items-baseline gap-2">
                    <span className="text-[2.5rem] font-semibold leading-none tracking-tight text-[#0f1a33]">
                      44,95&nbsp;€
                    </span>
                    <span className="text-[13px] font-medium text-slate-500">Sesión 1:1</span>
                  </p>
                  <ul className="mt-5 space-y-2 text-[15px] leading-snug text-slate-700">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Ruta y próximos pasos
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Escuelas y costes
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Formación ya iniciada
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      Decisiones antes de pagar
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={showReservationToast}
                    className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_32px_rgba(201,164,84,0.3)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                  >
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PARA QUIÉN ES */}
        <section className="border-b border-slate-200/70 bg-white py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              PARA QUIÉN ES
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Para quién es esta mentoría
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCE_BLOCKS.map((b) => {
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
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                      {b.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* QUÉ PODEMOS REVISAR */}
        <section
          id="que-revisamos"
          className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              QUÉ REVISAMOS
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Qué podemos revisar en una sesión
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
              La mentoría no es una charla genérica. Trabajamos sobre tu caso real, tu presupuesto, tu disponibilidad, tu nivel de inglés, tu situación de formación y tus dudas concretas.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {REVIEW_TOPICS.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_10px_28px_rgba(15,26,51,0.05)]"
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

        {/* MENTORÍA INDIVIDUAL */}
        <section className="border-b border-slate-200/70 bg-white py-14 lg:py-20">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              MENTORÍA INDIVIDUAL
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Mentoría individual FlyPath
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              Una sesión 1:1 para analizar tu situación y salir con una idea mucho más clara de qué hacer a continuación.
            </p>
            <div className="mt-8 grid gap-8 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-[#fffdf8] p-7 shadow-[0_24px_60px_rgba(15,26,51,0.08)] ring-1 ring-black/[0.04] sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  Sesión 1:1
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
                  Mentoría individual
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-[17px]">
                  Ideal si tienes dudas concretas, estás comparando opciones o necesitas ordenar tu ruta antes de comprometer dinero o seguir avanzando.
                </p>
                <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f1a33]/70">
                  Incluye:
                </p>
                <ul className="mt-3 space-y-2 text-[15px] leading-snug text-slate-700 lg:text-base">
                  {MENTORSHIP_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-[0_16px_44px_rgba(15,26,51,0.07)] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  Precio
                </p>
                <p className="mt-4 flex items-baseline justify-center gap-2">
                  <span className="text-[2.75rem] font-semibold leading-none tracking-tight text-[#0f1a33]">
                    44,95&nbsp;€
                  </span>
                </p>
                <p className="mt-1 text-[15px] font-medium text-slate-500">Sesión 1:1 · Online</p>
                <button
                  type="button"
                  onClick={showReservationToast}
                  className="mt-5 inline-flex min-h-[48px] min-w-[14rem] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Reservar mentoría
                </button>
                <p className="mt-3 text-[12px] leading-snug text-slate-500">
                  Reserva próximamente · Plazas limitadas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PACKS DE SEGUIMIENTO */}
        <section className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              SEGUIMIENTO
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-[2rem]">
              ¿Necesitas seguimiento?
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-[17px]">
              Si tu caso requiere más acompañamiento, puedes plantear un seguimiento en varias sesiones. La mentoría individual es la entrada recomendada; los packs son para casos que necesitan continuidad.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {PACK_PLANS.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_44px_rgba(15,26,51,0.07)] ring-1 ring-black/[0.03] sm:p-7"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a16]">
                    Seguimiento
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f1a33]">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    {p.subtitle}
                  </p>
                  <ul className="mt-5 space-y-2 text-[15px] leading-snug text-slate-700">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Bajo solicitud
                  </p>
                  <button
                    type="button"
                    onClick={showPackToast}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/55 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
                  >
                    Consultar pack
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="border-b border-slate-200/70 bg-white py-14 lg:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              CÓMO FUNCIONA
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Cómo funciona
            </h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#fffdf8] p-6 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.04] sm:p-7"
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

        {/* FAQs */}
        <section className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <ul className="mt-8">
              {FAQS.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                const panelId = `mentorias-faq-panel-${i}`;
                return (
                  <li key={faq.q} className="border-b border-slate-200/80 last:border-b-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() =>
                        setOpenFaqIndex((current) => (current === i ? null : i))
                      }
                      className="group flex w-full items-start justify-between gap-4 rounded-md py-4 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7fb]"
                    >
                      <span className="flex-1 text-base font-semibold leading-snug text-[#0f1a33] sm:text-[17px]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        strokeWidth={2.25}
                        className={`mt-1 h-5 w-5 shrink-0 transition-all duration-300 ${
                          isOpen ? "rotate-180 text-[#c9a454]" : "text-[#7a5a16]"
                        }`}
                        aria-hidden
                      />
                    </button>
                    {isOpen ? (
                      <div id={panelId} role="region">
                        <p className="pb-4 pr-9 text-[15px] leading-relaxed text-slate-600">
                          {faq.a}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Ordena tu ruta antes de tomar una decisión cara
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-[17px]">
              Una sesión puede ayudarte a evitar errores, hacer mejores preguntas y avanzar con más claridad.
            </p>
            <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Reserva · Sesión · Plan claro
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={showReservationToast}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Reservar mentoría
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
