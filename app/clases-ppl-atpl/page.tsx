"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Menu,
  Plane,
} from "lucide-react";

const TOAST_MS = 2800;
const MAIN_TOAST = "Clases PPL/ATPL próximamente";

/** Sustituir por URLs reales de Cal.com cuando estén disponibles */
const CALCOM_PPL_ATPL_CLASS_URL = "#";
const CALCOM_PPL_ATPL_PACK_URL = "#";

const HERO_HIGHLIGHTS = [
  "PPL Theory",
  "ATPL Theory",
  "Dudas concretas",
  "Preparación de exámenes",
  "Plan de estudio",
] as const;

const STUDY_SIGNALS = [
  "Haces bancos de preguntas, pero no entiendes el porqué.",
  "Te bloqueas con cálculos, fórmulas o conceptos.",
  "Tienes un examen cerca y no sabes cómo repasar.",
  "Vas saltando entre asignaturas sin un plan claro.",
  "Sientes que estudias muchas horas pero avanzas poco.",
] as const;

const TEAM = [
  {
    id: "jorge-feliu",
    name: "Jorge Feliu",
    role: "First Officer B737",
    text: "Experiencia real en aerolínea y formación de pilotos.",
    image: "/jorge.jpg",
  },
  {
    id: "socio-flypath",
    name: "Socio FlyPath",
    role: "Formación aeronáutica",
    text: "Apoyo en metodología, planificación y seguimiento.",
    image: "/team/socio-flypath.jpg",
  },
] as const;

const SUBJECT_WORK = [
  {
    title: "PPL Theory",
    items: ["Air Law", "Navigation", "Meteorology", "Aircraft General Knowledge"],
    footer: "Y otras asignaturas PPL",
  },
  {
    title: "ATPL Theory",
    items: ["Performance", "Flight Planning", "Mass & Balance", "General Navigation"],
    footer: "Y otras asignaturas ATPL",
  },
  {
    title: "Exámenes y estudio",
    items: [
      "Repaso antes de examen",
      "Dudas concretas",
      "Banco de preguntas con criterio",
      "Plan semanal de estudio",
    ],
  },
] as const;

const HOW_CLASS_STEPS = [
  {
    step: "1",
    title: "Traes tu duda, tema o examen",
    text: "Puedes venir con un tema concreto, un examen próximo o una asignatura que se te está atascando.",
  },
  {
    step: "2",
    title: "Lo explicamos con contexto",
    text: "Trabajamos teoría, ejemplos y aplicación real para que entiendas el porqué, no solo la respuesta.",
  },
  {
    step: "3",
    title: "Sales con plan de estudio",
    text: "Te llevas próximos pasos, prioridades de repaso y una forma más ordenada de seguir.",
  },
] as const;

const MODALITIES = [
  {
    title: "Clase individual",
    tag: "Clase puntual",
    price: "49 €",
    text: "Para resolver dudas concretas, reforzar una asignatura o preparar una explicación desde cero.",
    cta: "Agendar clase",
    href: CALCOM_PPL_ATPL_CLASS_URL,
    featured: false,
  },
  {
    title: "Pack de clases",
    tag: "Plan de apoyo",
    price: "Pack 4 clases · 179 €",
    text: "Para trabajar varias asignaturas, preparar exámenes o seguir un plan de estudio con continuidad.",
    cta: "Reservar pack",
    href: CALCOM_PPL_ATPL_PACK_URL,
    featured: true,
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Por fin entendí temas que llevaba días memorizando sin sentido.",
    author: "Alumno PPL",
  },
  {
    quote: "Me ayudó a organizar el estudio y llegar más tranquilo al examen.",
    author: "Alumno ATPL",
  },
  {
    quote: "Las explicaciones van al punto y se entienden con ejemplos reales.",
    author: "Alumno en formación",
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

function TeamMemberAvatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed) {
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-[#c9a454]/40 bg-gradient-to-br from-[#0f1a33] to-[#16264a] text-2xl font-semibold text-[#f2ddaa] sm:h-32 sm:w-32">
        {initials || <Plane className="h-8 w-8" aria-hidden />}
      </div>
    );
  }

  return (
    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-[#c9a454]/35 bg-slate-100 ring-2 ring-white sm:h-32 sm:w-32">
      <Image
        src={src}
        alt={name}
        fill
        className="h-full w-full rounded-full object-cover"
        sizes="128px"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function ClasesPplAtplPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [logoFallback, setLogoFallback] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  const scrollToModalities = useCallback(() => {
    document.getElementById("modalidades-clases")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToSubjects = useCallback(() => {
    document.getElementById("asignaturas-clases")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleCalLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href === "#") {
        e.preventDefault();
        setToast(MAIN_TOAST);
      }
    },
    [],
  );

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
            Clases PPL/ATPL
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
        {/* 1. Hero con imagen de fondo */}
        <section className="relative isolate min-h-[440px] border-b border-[#0f1a33]/20 bg-[#0f1a33] sm:min-h-[480px] lg:min-h-0">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <img
              src="/clases.jpg"
              alt=""
              className="absolute inset-0 h-[108%] w-full scale-x-[-1] object-cover object-[center_35%] blur-[2px] sm:object-center"
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/15 sm:from-black/80 sm:via-black/35 sm:to-black/5"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0f1a33]/70 via-[#0f1a33]/25 to-transparent sm:max-w-[62%]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent sm:hidden"
            aria-hidden
          />

          <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-10 sm:pb-10 sm:pt-12 lg:px-10 lg:pb-14 lg:pt-12">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-center lg:gap-10 xl:gap-12">
              <div className="min-w-0 lg:max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]">
                  CLASES PPL / ATPL
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.55rem] lg:leading-[1.08]">
                  Entiende la teoría, no solo memorices preguntas
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
                  Clases para alumnos PPL y ATPL que quieren reforzar asignaturas, resolver dudas y preparar
                  exámenes con una explicación clara y aplicada a la aviación real.
                </p>
                <p className="mt-4 max-w-xl border-l-2 border-[#c9a454] pl-4 text-[15px] font-medium leading-relaxed text-[#f2ddaa] sm:text-base">
                  Estudiar más no siempre es estudiar mejor. A veces necesitas que alguien te ordene el tema y te explique lo importante.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={scrollToModalities}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.4)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                >
                  Agendar clase
                </button>
                <button
                  type="button"
                  onClick={scrollToSubjects}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Ver asignaturas
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>

              </div>

              <div className="w-full rounded-2xl border border-white/20 bg-[#0f1a33]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-[#c9a454]/25 backdrop-blur-md sm:p-5 lg:mt-0 lg:translate-y-12 lg:justify-self-end xl:translate-y-14">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]">
                  APOYO ACADÉMICO
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {HERO_HIGHLIGHTS.map((item) => (
                    <li key={item} className="flex gap-2 text-[14px] leading-snug text-white/95">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* 2. Señales de que necesitas apoyo */}
        <section className="border-b border-slate-200/70 bg-[#eef2f8] py-8 sm:py-10">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold leading-tight tracking-tight text-[#0f1a33] sm:text-2xl">
              Señales de que necesitas apoyo
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              Si estás estudiando mucho pero sigues sin entender, quizá no necesitas más horas:
              necesitas una explicación mejor y un plan más claro.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STUDY_SIGNALS.map((signal) => (
                <li
                  key={signal}
                  className="flex gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-[14px] leading-snug text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Asignaturas */}
        <section
          id="asignaturas-clases"
          className="border-b border-slate-200/70 bg-white py-8 sm:py-9"
        >
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold leading-snug tracking-tight text-[#0f1a33] sm:text-2xl">
              Podemos ayudarte con cualquier asignatura PPL o ATPL
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              No nos limitamos a una lista cerrada. Estas son áreas habituales, pero podemos trabajar
              cualquier tema de PPL o ATPL según tu escuela, banco de preguntas y fecha de examen.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {SUBJECT_WORK.map((block) => (
                <div
                  key={block.title}
                  className="rounded-2xl border border-slate-200/80 bg-[#f4f7fb] p-4 shadow-[0_10px_28px_rgba(15,26,51,0.05)] ring-1 ring-black/[0.03] sm:p-5"
                >
                  <h3 className="text-lg font-semibold text-[#0f1a33]">{block.title}</h3>
                  <ul className="mt-2.5 space-y-1.5">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[15px] leading-snug text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {"footer" in block && block.footer ? (
                    <p className="mt-2.5 border-t border-slate-200/70 pt-2 text-[14px] font-medium leading-snug text-slate-500">
                      {block.footer}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Modalidades */}
        <section
          id="modalidades-clases"
          className="border-b border-[#0f1a33]/30 bg-gradient-to-b from-[#0f1a33] via-[#121f3d] to-[#0f1a33] py-10 sm:py-12"
        >
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a454]">
                MODALIDADES
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl">
                Elige cómo quieres preparar tus asignaturas
              </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
                  Puedes reservar una clase puntual o trabajar varias sesiones con seguimiento según
                  tus asignaturas y fechas de examen.
                </p>
                <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 items-stretch gap-5 md:max-w-none md:grid-cols-2 md:gap-6">
                  {MODALITIES.map((mod) => (
                    <div
                      key={mod.title}
                      className={`relative h-full ${mod.featured ? "order-first md:order-none" : ""}`}
                    >
                      {mod.featured ? (
                        <span className="pointer-events-none absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 rounded-full border border-[#c9a454] bg-[#c9a454] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f1a33] shadow-sm">
                          Recomendado
                        </span>
                      ) : null}
                      <div
                        className={`flex h-full min-h-[260px] flex-col rounded-xl p-6 ${
                          mod.featured
                            ? "border-2 border-[#c9a454]/70 bg-white shadow-[0_8px_28px_rgba(15,26,51,0.08)] ring-2 ring-[#c9a454]/20"
                            : "border border-slate-300/90 bg-white shadow-sm ring-1 ring-slate-200/60"
                        }`}
                      >
                        <div>
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                              mod.featured
                                ? "bg-[#fff8e8] text-[#7a5a16]"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {mod.tag}
                          </span>
                          <h3 className="mt-3 text-xl font-semibold text-[#0f1a33]">{mod.title}</h3>
                          <p
                            className={`mt-3 text-2xl font-semibold tracking-tight ${
                              mod.featured ? "text-[#7a5a16]" : "text-[#0f1a33]"
                            }`}
                          >
                            {mod.price}
                          </p>
                          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{mod.text}</p>
                        </div>
                        <div className="mt-auto pt-6">
                          <a
                            href={mod.href}
                            onClick={(e) => handleCalLinkClick(e, mod.href)}
                            className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-2.5 text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                              mod.featured
                                ? "border border-[#c9a454] bg-[#c9a454] text-[#0f1a33] hover:bg-[#ddb75c] focus-visible:ring-[#c9a454]/55"
                                : "border border-[#0f1a33]/20 bg-[#0f1a33] text-white hover:bg-[#16264a] focus-visible:ring-[#0f1a33]/40"
                            }`}
                          >
                            {mod.cta}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* 5. Cómo es una clase */}
        <section className="border-b border-slate-200/70 bg-white py-9 sm:py-10">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Cómo es una clase
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              No se trata de repetir apuntes. La idea es detectar el bloqueo, explicarlo con claridad
              y darte una forma práctica de seguir estudiando.
            </p>
            <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {HOW_CLASS_STEPS.map((step) => (
                <li
                  key={step.step}
                  className="relative rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-5"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0f1a33] text-sm font-semibold text-[#f2ddaa]">
                    {step.step}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-[#0f1a33]">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. Equipo */}
        <section className="border-b border-slate-200/70 bg-[#f4f7fb] py-10 sm:py-11">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              El equipo detrás de FlyPath
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Un enfoque creado por pilotos y profesionales de formación para ayudarte a entender la
              teoría con contexto, no solo memorizar respuestas.
            </p>
            <div className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-5 sm:max-w-4xl md:grid-cols-2">
              {TEAM.map((member) => (
                <article
                  key={member.id}
                  className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white p-5 text-center shadow-[0_8px_22px_rgba(15,26,51,0.05)] sm:p-6"
                >
                  <TeamMemberAvatar src={member.image} name={member.name} />
                  <h3 className="mt-4 text-base font-semibold text-[#0f1a33]">{member.name}</h3>
                  <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-[#7a5a16]">
                    {member.role}
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{member.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Reviews */}
        <section className="border-b border-slate-200/70 bg-white py-10 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Lo que más valoran los alumnos
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.author}
                  className="rounded-xl border border-slate-200/80 bg-[#f8fafc] p-4 shadow-sm sm:p-5"
                >
                  <p className="text-sm tracking-wide text-[#c9a454]" aria-label="5 estrellas">
                    ★★★★★
                  </p>
                  <blockquote className="mt-2 text-[15px] leading-relaxed text-slate-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 text-[13px] font-semibold text-[#7a5a16]">
                    {t.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CTA final */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-10 sm:py-12">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Refuerza tus asignaturas antes de que se conviertan en un bloqueo
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Si una asignatura se atasca, no esperes al último momento. Agenda una clase y trabaja
              el problema con una explicación clara.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={scrollToModalities}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Agendar clase
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
