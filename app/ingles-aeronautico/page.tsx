"use client";

import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { FlyPathTeamSection } from "@/components/FlyPathTeamSection";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Menu,
  Mic2,
  Plane,
  Radio,
  Sparkles,
} from "lucide-react";

const TOAST_MS = 2800;
const MAIN_TOAST = "Clases de inglés aeronáutico próximamente";

/** Sustituir por URLs reales de Cal.com cuando estén disponibles */
const CALCOM_INDIVIDUAL_URL = "#";
const CALCOM_PACK_URL = "#";

const HERO_HIGHLIGHTS = [
  "Clases 1:1 online",
  "Comunicaciones ATC",
  "Fraseología",
  "ICAO English",
  "Entrevistas y confianza oral",
] as const;

const AUDIENCE = [
  { icon: BookOpen, title: "No sé si mi inglés es suficiente para empezar." },
  { icon: GraduationCap, title: "Estoy en formación y me falta soltura hablando." },
  { icon: Radio, title: "Quiero practicar comunicaciones ATC reales." },
  { icon: Mic2, title: "Tengo entrevistas o pruebas orales próximamente." },
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
  {
    id: "socio-ingles",
    name: "Socio FlyPath",
    role: "Comunicación e inglés",
    text: "Enfoque práctico para hablar con más seguridad.",
    image: "/team/socio-3-flypath.jpg",
  },
] as const;

const CLASS_WORK = [
  {
    title: "Diagnóstico",
    items: ["Nivel real de speaking", "Comprensión y listening", "Bloqueos al hablar"],
  },
  {
    title: "Práctica aeronáutica",
    items: [
      "Comunicaciones ATC",
      "Fraseología y readbacks",
      "Situaciones normales y no normales",
    ],
  },
  {
    title: "Preparación específica",
    items: ["ICAO English", "Entrevistas y pruebas orales", "Plan de mejora personalizado"],
  },
] as const;

const WHY_BULLETS = [
  "Enfoque aeronáutico real",
  "Práctica oral y corrección",
  "Adaptado a tu fase",
] as const;

const MODALITIES = [
  {
    title: "Clase individual",
    tag: "Clase puntual",
    price: "20 €",
    text: "Una clase práctica para resolver bloqueos concretos, mejorar tu speaking y salir con un plan claro de estudio.",
    cta: "Agendar clase",
    href: CALCOM_INDIVIDUAL_URL,
    featured: false,
  },
  {
    title: "Pack de clases",
    price: "Pack 4 clases · 179 €",
    text: "Para mejorar de forma progresiva con seguimiento, práctica oral y objetivos semanales.",
    cta: "Reservar pack",
    href: CALCOM_PACK_URL,
    featured: true,
  },
] as const;

const PACK_CLASS_OPTIONS = [
  { classes: 2, price: 38, perClass: "19" },
  { classes: 3, price: 54, perClass: "18" },
  { classes: 4, price: 68, perClass: "17" },
  { classes: 5, price: 80, perClass: "16" },
  { classes: 6, price: 90, perClass: "15" },
] as const;

const TESTIMONIALS = [
  {
    quote: "Me ayudó a ganar confianza hablando y a entender qué tenía que mejorar.",
    author: "Alumno PPL",
  },
  {
    quote: "Las clases son prácticas y van directas a situaciones reales.",
    author: "Alumna ATPL",
  },
  {
    quote: "Por fin practiqué inglés aplicado a aviación, no inglés genérico.",
    author: "Aspirante a piloto",
  },
] as const;


export default function InglesAeronauticoPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPackClasses, setSelectedPackClasses] = useState<number>(2);

  const selectedPack =
    PACK_CLASS_OPTIONS.find((option) => option.classes === selectedPackClasses) ??
    PACK_CLASS_OPTIONS[0];

  const showMainToast = useCallback(() => setToast(MAIN_TOAST), []);

  const scrollToModalities = useCallback(() => {
    document.getElementById("modalidades-ingles")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToWork = useCallback(() => {
    document.getElementById("que-trabajamos-ingles")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleCalLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href === "#") {
        e.preventDefault();
        showMainToast();
      }
    },
    [showMainToast],
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
        pageTitle="Inglés aeronáutico"
        currentModuleId="ingles"
        onSoonClick={(msg) => setToast(msg ?? "Próximamente")}
      />


      <main>
        {/* 1. Hero con imagen de fondo */}
        <section className="relative isolate min-h-[440px] border-b border-[#0f1a33]/20 sm:min-h-[480px] lg:min-h-0">
          <img
            src="/ingles-aeronautico.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover object-[center_30%] sm:object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10 sm:from-black/70 sm:via-black/30 sm:to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0f1a33]/45 via-transparent to-transparent sm:max-w-[58%]"
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
                  INGLÉS AERONÁUTICO
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.55rem] lg:leading-[1.08]">
                  Entrena el inglés que usarás como piloto
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
                  Clases prácticas para futuros pilotos y alumnos en formación que quieren mejorar
                  comunicaciones ATC, fraseología, entrevistas, listening y speaking aplicado a la
                  aviación.
                </p>
                <p className="mt-4 max-w-xl border-l-2 border-[#c9a454] pl-4 text-[15px] font-medium leading-relaxed text-[#f2ddaa] sm:text-base">
                  No necesitas sonar perfecto. Necesitas comunicar con claridad, seguridad y criterio.
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
                  onClick={scrollToWork}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Ver qué trabajamos
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>

              </div>

              <div className="w-full rounded-2xl border border-white/20 bg-black/45 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-5 lg:mt-0 lg:translate-y-12 lg:justify-self-end xl:translate-y-14">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]">
                  LO QUE TRABAJAMOS
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

        {/* 2. Para quién es */}
        <section className="border-b border-slate-200/70 bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              PARA QUIÉN ES
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-3xl">
              Para quién son estas clases
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCE.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(15,26,51,0.05)] ring-1 ring-black/[0.03] sm:p-5"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a454]/35 bg-[#fffdf6] text-[#7a5a16]">
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <h3 className="text-[15px] font-semibold leading-snug text-[#0f1a33] sm:text-base">
                      {b.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Modalidades */}
        <section
          id="modalidades-ingles"
          className="border-b border-slate-200/70 bg-white py-12 sm:py-14"
        >
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl border border-[#c9a454]/25 bg-gradient-to-b from-[#fffdf8] via-white to-[#f7f9fc] p-6 shadow-[0_20px_52px_rgba(15,26,51,0.08)] ring-1 ring-[#c9a454]/20 sm:p-8 lg:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                aria-hidden
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,164,84,0.14), transparent 55%)",
                }}
              />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  MODALIDADES
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-3xl lg:text-[2rem]">
                  Elige cómo quieres trabajar tu inglés
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
                  Elige una clase individual o un pack con seguimiento.
                </p>
                <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 items-stretch gap-5 md:max-w-none md:grid-cols-2 md:gap-6">
                  {MODALITIES.map((mod) => (
                    <div
                      key={mod.title}
                      className={`relative h-full ${mod.featured ? "order-first md:order-none" : ""}`}
                    >
                      {mod.featured ? (
                        <span className="pointer-events-none absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#c9a454] bg-[#c9a454] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f1a33] shadow-md">
                          <Sparkles className="h-3 w-3" aria-hidden />
                          Recomendado
                        </span>
                      ) : null}
                      <div
                        className={`flex h-full min-h-[260px] flex-col rounded-2xl p-6 ${
                          mod.featured
                            ? "border-2 border-[#c9a454] bg-gradient-to-br from-[#fffdf6] via-white to-[#f7f4ea] shadow-[0_24px_56px_rgba(201,164,84,0.22),0_12px_32px_rgba(15,26,51,0.08)] ring-1 ring-[#c9a454]/30"
                            : "border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]"
                        }`}
                      >
                        <div>
                          {!mod.featured ? (
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                              {mod.tag}
                            </span>
                          ) : null}
                          <h3
                            className={`text-xl font-semibold text-[#0f1a33] ${
                              mod.featured ? "mt-[18px]" : ""
                            }`}
                          >
                            {mod.title}
                          </h3>
                          <p
                            className={`mt-3 text-2xl font-semibold tracking-tight ${
                              mod.featured ? "text-[#7a5a16]" : "text-[#0f1a33]"
                            }`}
                          >
                            {mod.featured ? `${selectedPack.price} €` : mod.price}
                          </p>
                          {mod.featured ? (
                            <div className="mt-2 space-y-1.5">
                              <label
                                htmlFor="pack-class-count-english"
                                className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                              >
                                Número de clases
                              </label>
                              <select
                                id="pack-class-count-english"
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
                            </div>
                          ) : (
                            <div className="mt-2 space-y-2">
                              <p className="text-[15px] leading-relaxed text-slate-600">{mod.text}</p>
                              <ul className="space-y-1.5 rounded-lg border border-slate-200/80 bg-slate-50/90 p-3">
                                {[
                                  "1 sesión online personalizada",
                                  "práctica speaking y listening",
                                  "feedback sobre errores frecuentes",
                                  "ejercicios aplicados a aviación real",
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
                            className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-6 py-2.5 text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                              mod.featured
                                ? "border border-[#c9a454] bg-[#c9a454] text-[#0f1a33] shadow-[0_12px_32px_rgba(201,164,84,0.35)] hover:bg-[#ddb75c] focus-visible:ring-[#c9a454]/55"
                                : "border border-[#0f1a33]/15 bg-[#0f1a33] text-white shadow-sm hover:bg-[#16264a] focus-visible:ring-[#0f1a33]/40"
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
            </div>
          </div>
        </section>

        {/* 4. Qué trabajamos en clase */}
        <section
          id="que-trabajamos-ingles"
          className="border-b border-slate-200/70 bg-white py-10 sm:py-12"
        >
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <h2 className="text-2xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-3xl">
              Qué trabajamos en clase
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Cada clase combina diagnóstico, práctica oral y situaciones reales de aviación para que
              sepas qué mejorar y cómo practicar.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
              {CLASS_WORK.map((block) => (
                <div
                  key={block.title}
                  className="rounded-2xl border border-slate-200/80 bg-[#f4f7fb] p-5 shadow-[0_10px_28px_rgba(15,26,51,0.05)] ring-1 ring-black/[0.03] sm:p-6"
                >
                  <h3 className="text-lg font-semibold text-[#0f1a33]">{block.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[15px] leading-snug text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Equipo */}
        <FlyPathTeamSection
          description="Un enfoque creado desde la experiencia real de pilotos y formación aeronáutica, para ayudarte a practicar inglés con contexto y criterio."
          members={TEAM}
          layout="three"
        />

        {/* 6. Reseñas */}

        <section className="border-b border-slate-200/70 bg-[#f4f7fb] py-10 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Lo que más valoran los alumnos
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.author}
                  className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_22px_rgba(15,26,51,0.05)] sm:p-5"
                >
                  <p
                    className="text-sm tracking-wide text-[#c9a454]"
                    aria-label="5 estrellas"
                  >
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

        {/* 7. Por qué FlyPath (compacto) */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-[#0f1a33] to-[#16264a] py-10 text-white sm:py-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 55% at 100% 0%, rgba(201,164,84,0.2), transparent 55%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]/90">
              POR QUÉ FLYPATH
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl">
              No es inglés general. Es inglés aplicado a tu ruta como piloto.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300 sm:text-base">
              Practicamos situaciones reales de formación, comunicaciones, entrevistas y speaking con
              un enfoque claro: que puedas comunicar con seguridad, no sonar perfecto.
            </p>
            <ul className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-3">
              {WHY_BULLETS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[15px] text-slate-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8. CTA final */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-10 sm:py-12">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Mejora tu inglés antes de que se convierta en un bloqueo
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Si el inglés te frena ahora, te va a frenar más cuando lleguen las comunicaciones,
              entrevistas o fases avanzadas de la formación.
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
                onClick={() => router.push("/career-planner")}
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
