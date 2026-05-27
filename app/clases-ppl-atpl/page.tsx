"use client";

import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { FlyPathTeamSection } from "@/components/FlyPathTeamSection";
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
const CALCOM_PPL_ATPL_CALL_URL = "#";

const ATPL_PLANNER_HREF = "/atpl-planner";

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
    image: "/jorge.jpeg",
  },
  {
    id: "carlos-vaello",
    name: "Carlos Vaello",
    role: "COMMERCIAL PILOT",
    text: "Experiencia en formación aeronáutica y apoyo a futuros pilotos.",
    image: "/pollo.jpg",
  },
] as const;

const HOW_CLASS_STEPS = [
  {
    step: "1",
    title: "Traes tu duda, tema o examen",
    text: "Puedes venir con una asignatura, un tema concreto o una fecha de examen cercana.",
  },
  {
    step: "2",
    title: "Lo trabajamos con explicación real",
    text: "Te explicamos la teoría con ejemplos, contexto operativo y aplicación práctica.",
  },
  {
    step: "3",
    title: "Sales con plan en el ATPL Planner",
    text: "Te llevas próximos pasos, sesiones recomendadas y objetivos claros para seguir estudiando dentro del ATPL Planner.",
  },
] as const;

const MODALITIES = [
  {
    title: "Clase individual online",
    tag: "Clase puntual",
    price: "25 €",
    text: "Clase enfocada en entender la teoría, resolver bloqueos y preparar exámenes con una explicación clara y aplicada.",
    cta: "Agendar clase",
    href: CALCOM_PPL_ATPL_CLASS_URL,
    featured: false,
  },
  {
    title: "Pack de clases + seguimiento",
    tag: "Plan de apoyo",
    price: "Pack 4 clases · 179 €",
    text: "Para trabajar varias asignaturas con continuidad, comentarios de seguimiento y organización del estudio dentro del ATPL Planner.",
    cta: "Reservar pack",
    href: CALCOM_PPL_ATPL_PACK_URL,
    featured: true,
  },
] as const;

const PACK_CLASS_OPTIONS = [
  { classes: 2, price: 55, perClass: "27,50" },
  { classes: 3, price: 79, perClass: "26,33" },
  { classes: 4, price: 99, perClass: "24,75" },
  { classes: 5, price: 119, perClass: "23,80" },
  { classes: 6, price: 139, perClass: "23,17" },
] as const;

const PACK_FOLLOWUP_ITEMS = [
  "clases online",
  "planificación de sesiones en el planner",
  "comentarios de seguimiento en Evaluación",
  "próximos objetivos",
  "organización antes de examen",
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


export default function ClasesPplAtplPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPackClasses, setSelectedPackClasses] = useState<number>(2);

  const selectedPack =
    PACK_CLASS_OPTIONS.find((option) => option.classes === selectedPackClasses) ??
    PACK_CLASS_OPTIONS[0];

  const scrollToModalities = useCallback(() => {
    document.getElementById("modalidades-clases")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToHowClass = useCallback(() => {
    document.getElementById("como-es-una-clase")?.scrollIntoView({
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

      <FlyPathPlatformHeader
        pageTitle="Clases PPL/ATPL"
        currentModuleId="clases"
        onSoonClick={(msg) => setToast(msg ?? "Próximamente")}
      />



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
                  onClick={scrollToHowClass}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Cómo funciona
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

        {/* 3. Cómo es una clase */}
        <section
          id="como-es-una-clase"
          className="border-b border-slate-200/70 bg-white py-9 sm:py-10"
        >
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
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                    {step.step === "3" ? (
                      <>
                        Te llevas próximos pasos, sesiones recomendadas y objetivos claros para seguir
                        estudiando dentro del{" "}
                        <Link
                          href={ATPL_PLANNER_HREF}
                          className="font-semibold text-[#7a5a16] underline decoration-[#c9a454]/55 underline-offset-2 hover:text-[#5e4511]"
                        >
                          ATPL Planner
                        </Link>
                        .
                      </>
                    ) : (
                      step.text
                    )}
                  </p>
                </li>
              ))}
            </ol>
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
                <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-5 md:gap-6">
                  {MODALITIES.map((mod) => (
                    <div
                      key={mod.title}
                      className="relative h-full"
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
                            {mod.featured
                              ? `Pack ${selectedPack.classes} clases · ${selectedPack.price} €`
                              : mod.price}
                          </p>
                          {mod.featured ? (
                            <div className="mt-2 space-y-2">
                              <label
                                htmlFor="pack-class-count"
                                className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                              >
                                Número de clases
                              </label>
                              <select
                                id="pack-class-count"
                                value={selectedPackClasses}
                                onChange={(e) => setSelectedPackClasses(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] font-medium text-[#0f1a33] focus:outline-none focus:ring-2 focus:ring-[#c9a454]/45"
                              >
                                {PACK_CLASS_OPTIONS.map((option) => (
                                  <option key={option.classes} value={option.classes}>
                                    {option.classes} clases
                                  </option>
                                ))}
                              </select>
                              <p className="text-[15px] leading-relaxed text-slate-600">{mod.text}</p>
                              <p className="text-[14px] font-semibold text-[#7a5a16]">
                                {selectedPack.perClass} €/clase aprox.
                              </p>
                              <p className="text-[13px] text-slate-500">
                                Más clases = más seguimiento y mejor precio por sesión.
                              </p>
                              <ul className="space-y-1.5 rounded-lg border border-slate-200/80 bg-slate-50/90 p-3">
                                {PACK_FOLLOWUP_ITEMS.map((item) => (
                                  <li key={item} className="flex gap-2 text-[13px] leading-snug text-slate-600">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="mt-2 space-y-2">
                              <p className="text-[15px] leading-relaxed text-slate-600">{mod.text}</p>
                              <ul className="space-y-1.5 rounded-lg border border-slate-200/80 bg-slate-50/90 p-3">
                                {[
                                  "explicación clara y estructurada",
                                  "teoría aplicada a la aviación real",
                                  "preparación PPL o ATPL",
                                  "sesión personalizada online",
                                ].map((item) => (
                                  <li key={item} className="flex gap-2 text-[13px] leading-snug text-slate-600">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
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
                            {mod.featured
                              ? `Reservar pack de ${selectedPack.classes} clases`
                              : mod.cta}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* 5. Videollamada inicial */}
        <section className="border-b border-slate-200/70 bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc] py-7 sm:py-8">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <div className="rounded-3xl border border-[#c9a454]/25 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,26,51,0.08)] ring-1 ring-[#c9a454]/15 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 text-center sm:gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:text-left">
                <div className="min-w-0">
                  <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#0f1a33] sm:text-[1.65rem]">
                    ¿No sabes qué opción elegir?
                  </h2>
                  <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                    Reserva una videollamada inicial de 10–15 minutos y vemos qué asignatura te está
                    bloqueando, si necesitas una clase puntual o seguimiento, y cómo podemos ayudarte de
                    forma más útil.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <a
                    href={CALCOM_PPL_ATPL_CALL_URL}
                    onClick={(e) => handleCalLinkClick(e, CALCOM_PPL_ATPL_CALL_URL)}
                    className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-2xl border border-[#c9a454] bg-[#c9a454] px-5 py-2 text-[15px] font-semibold leading-none text-[#0f1a33] shadow-[0_10px_24px_rgba(201,164,84,0.33)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:px-6"
                  >
                    Reservar videollamada
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Equipo */}
        <FlyPathTeamSection
          description="Un enfoque creado por pilotos y profesionales de formación para ayudarte a entender la teoría con contexto, no solo memorizar respuestas."
          members={TEAM}
        />

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
              Deja de estudiar a ciegas
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Te ayudamos a entender la teoría, organizar tu estudio y llegar al examen con más
              claridad.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={scrollToModalities}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Agendar clase
              </button>
              <a
                href={CALCOM_PPL_ATPL_CALL_URL}
                onClick={(e) => handleCalLinkClick(e, CALCOM_PPL_ATPL_CALL_URL)}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
              >
                Reservar videollamada
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
