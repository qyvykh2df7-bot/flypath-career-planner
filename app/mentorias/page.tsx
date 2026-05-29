"use client";

import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { FlyPathTeamSection } from "@/components/FlyPathTeamSection";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  ListChecks,
  Scale,
  ShieldAlert,
} from "lucide-react";

const TOAST_MS = 2800;
const MAIN_TOAST = "Reserva de mentoría próximamente";
const ACOMPANAMIENTO_TOAST = "Solicitud de acompañamiento próximamente";

/** Sustituir por URLs reales de Cal.com cuando estén disponibles */
const CALCOM_MENTORIA_URL = "#";
const CALCOM_ACOMPANAMIENTO_URL = "#";

const HERO_HIGHLIGHTS = [
  "Integrado vs modular",
  "Coste real de la ruta",
  "Escuela y contrato",
  "Clase 1 y requisitos",
  "Próximo paso lógico",
] as const;

const MENTORIA_IDEAL_FOR = [
  "Dudas concretas",
  "Revisar tu ruta actual",
  "Definir próximos pasos",
] as const;

const ACOMPANIMENT_INCLUDES = [
  "Comparación de rutas y escuelas",
  "Revisión de presupuestos y condiciones",
  "Preparación de preguntas para escuelas",
  "Seguimiento durante el proceso de decisión",
  "Próximos pasos claros tras cada avance",
] as const;

const AUDIENCE = [
  { icon: GitBranch, title: "No sé qué ruta encaja mejor conmigo." },
  { icon: Scale, title: "Estoy comparando escuelas y no sé cuál tiene más sentido." },
  { icon: ShieldAlert, title: "Quiero evitar errores antes de pagar matrícula o depósito." },
  { icon: ListChecks, title: "Necesito ordenar mi plan, costes y próximos pasos." },
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

const MENTORSHIP_WORK = [
  {
    title: "Ruta y timing",
    items: ["Integrado vs modular", "Edad, disponibilidad y trabajo", "Orden lógico de pasos"],
  },
  {
    title: "Costes y riesgos",
    items: ["Presupuesto realista", "Pagos, depósitos y extras", "Riesgos antes de firmar"],
  },
  {
    title: "Escuelas y condiciones",
    items: ["Comparación de opciones", "Preguntas clave a escuelas", "Plan de acción concreto"],
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Me ayudó a entender qué ruta tenía más sentido para mi situación.",
    author: "Aspirante a piloto",
  },
  {
    quote: "Salí con una lista clara de preguntas para hacer a las escuelas.",
    author: "Alumno modular",
  },
  {
    quote: "Me hizo ver costes y riesgos que no estaba teniendo en cuenta.",
    author: "Futuro piloto",
  },
] as const;

export default function MentoriasPage() {
  const [toast, setToast] = useState<string | null>(null);

  const scrollToModalities = useCallback(() => {
    document.getElementById("modalidades-mentorias")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToAcompanamiento = useCallback(() => {
    document.getElementById("acompanamiento-flypath")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleCalLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string, toastMessage?: string) => {
      if (href === "#") {
        e.preventDefault();
        setToast(toastMessage ?? MAIN_TOAST);
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
        pageTitle="Mentorías"
        currentModuleId="mentorias"
        onSoonClick={(msg) => setToast(msg ?? "Próximamente")}
      />


      <main>
        {/* 1. Hero con imagen de fondo */}
        <section className="relative isolate min-h-[440px] border-b border-[#0f1a33]/20 bg-[#0f1a33] sm:min-h-[480px] lg:min-h-0">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <img
              src="/mentoria.jpg"
              alt=""
              className="absolute inset-0 h-[108%] w-full object-cover object-[center_80%] blur-[2px] sm:object-[center_70%]"
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
                  MENTORÍAS FLYPATH
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.55rem] lg:leading-[1.08]">
                  Decide tu ruta como piloto con criterio
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
                  Mentorías y acompañamiento para futuros pilotos y alumnos en formación que necesitan
                  claridad antes de elegir escuela, pagar matrícula, cambiar de ruta o tomar una
                  decisión importante.
                </p>
                <p className="mt-4 max-w-xl border-l-2 border-[#c9a454] pl-4 text-[15px] font-medium leading-relaxed text-[#f2ddaa] sm:text-base">
                  No se trata de venderte una escuela. Se trata de ayudarte a no equivocarte con tu
                  tiempo, tu dinero y tu futuro.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={scrollToModalities}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.4)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                >
                  Reservar mentoría
                </button>
                <button
                  type="button"
                  onClick={scrollToAcompanamiento}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Ver acompañamiento
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>

              </div>

              <div className="w-full rounded-2xl border border-white/20 bg-[#0f1a33]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-[#c9a454]/25 backdrop-blur-md sm:p-5 lg:mt-0 lg:translate-y-12 lg:justify-self-end xl:translate-y-14">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]">
                  DECISIONES QUE REVISAMOS
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
              Para quién es esta mentoría
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


        {/* 3. Qué revisamos en tu caso */}
        <section
          id="que-revisamos-mentorias"
          className="border-b border-slate-200/70 bg-[#eef2f8] py-10 sm:py-12"
        >
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
              TU CASO
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-3xl">
              Qué revisamos en tu caso
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              No damos respuestas genéricas. Revisamos tu situación real: ruta, presupuesto, tiempo
              disponible, escuelas candidatas y próximos pasos.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {MENTORSHIP_WORK.map((block) => (
                <div
                  key={block.title}
                  className="rounded-2xl border border-[#0f1a33]/10 bg-white p-5 shadow-[0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-[#c9a454]/10 sm:p-6"
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

        {/* 4. Modalidades */}
        <section
          id="modalidades-mentorias"
          className="border-b border-slate-200/70 bg-gradient-to-b from-[#f6f8fc] to-white py-12 sm:py-14"
        >
          <div className="mx-auto max-w-4xl px-6 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a454]">
                MODALIDADES
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-3xl">
                Elige cómo quieres revisar tu decisión
              </h2>
            </div>

            <div className="mt-7 flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_32px_rgba(15,26,51,0.07)] ring-1 ring-[#0f1a33]/5 sm:mt-8 sm:p-6">
              <div>
                <h3 className="text-xl font-semibold text-[#0f1a33]">Mentoría individual</h3>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0f1a33]">44,95 €</p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  Una sesión directa para analizar tu situación y salir con una decisión más clara.
                </p>
                <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                  Ideal para:
                </p>
                <ul className="mt-1.5 grid grid-cols-1 gap-x-5 gap-y-1.5 lg:grid-cols-3 lg:items-start">
                  {MENTORIA_IDEAL_FOR.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[15px] leading-snug text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={CALCOM_MENTORIA_URL}
                onClick={(e) => handleCalLinkClick(e, CALCOM_MENTORIA_URL, MAIN_TOAST)}
                className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#0f1a33]/20 bg-[#0f1a33] px-6 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#16264a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1a33]/40 sm:w-auto sm:min-w-[200px]"
              >
                Reservar mentoría
              </a>
            </div>

            <div
              id="acompanamiento-flypath"
              className="relative mt-6 scroll-mt-24 overflow-visible rounded-2xl border-2 border-[#c9a454]/45 bg-gradient-to-br from-[#fffdf8] via-white to-[#f6f8fc] p-5 shadow-[0_16px_48px_rgba(201,164,84,0.12)] ring-1 ring-[#c9a454]/20 sm:mt-8 sm:p-6 md:p-7"
            >
              <span className="pointer-events-none absolute left-1/2 top-0 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a454] bg-[#c9a454] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f1a33] shadow-sm">
                RECOMENDADO
              </span>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <div className="min-w-0 pr-0 md:pr-4">
                  <h3 className="text-xl font-semibold text-[#0f1a33]">Acompañamiento FlyPath</h3>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#7a5a16]">A consultar</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    Un apoyo más continuado para tomar decisiones con criterio antes de comprometer dinero.
                  </p>
                </div>
                <div className="flex flex-col border-t border-[#c9a454]/20 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                    Podemos ayudarte con:
                  </p>
                  <ul className="mt-3 space-y-2">
                    {ACOMPANIMENT_INCLUDES.map((item) => (
                      <li key={item} className="flex gap-2 text-[15px] leading-snug text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={CALCOM_ACOMPANAMIENTO_URL}
                    onClick={(e) =>
                      handleCalLinkClick(e, CALCOM_ACOMPANAMIENTO_URL, ACOMPANAMIENTO_TOAST)
                    }
                    className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_28px_rgba(201,164,84,0.25)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
                  >
                    Solicitar acompañamiento
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Equipo */}
        <FlyPathTeamSection
          description="Te ayudamos desde experiencia real en aviación, formación y toma de decisiones, con un enfoque claro: evitar humo y ayudarte a decidir con criterio."
          members={TEAM}
        />

        {/* 6. Reviews */}
        <section className="border-b border-slate-200/70 bg-white py-10 sm:py-11">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
              Lo que más valoran quienes ya han pedido orientación
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

        {/* 7. CTA final */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-10 sm:py-12">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Antes de pagar una escuela, entiende tu ruta
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Una decisión mal tomada puede costarte meses y miles de euros. Reserva una mentoría o
              solicita acompañamiento para revisar tu caso con calma antes de avanzar.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={scrollToModalities}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Reservar mentoría
              </button>
              <button
                type="button"
                onClick={scrollToAcompanamiento}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35 sm:w-auto"
              >
                Solicitar acompañamiento
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
