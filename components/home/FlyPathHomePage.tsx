"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";

const FLIGHT_PATH_PHASES = [
  {
    step: "01",
    title: "Quiero ser piloto",
    line: "Ruta, coste y primeros pasos con criterio.",
    cta: "Career Planner",
    href: "/career-planner",
  },
  {
    step: "02",
    title: "Comparo escuelas",
    line: "Precio, incluidos y condiciones antes de firmar.",
    cta: "Comparador",
    href: "/escuelas",
  },
  {
    step: "03",
    title: "Estoy estudiando",
    line: "Asignaturas, calendario y objetivos ATPL.",
    cta: "ATPL Planner",
    href: "/atpl-estudio",
  },
  {
    step: "04",
    title: "Inglés aeronáutico",
    line: "Speaking y comunicación con enfoque práctico.",
    cta: "Inglés",
    href: "/ingles-aeronautico",
  },
  {
    step: "05",
    title: "Aerolínea / selección",
    line: "CV, entrevistas y próximos pasos profesionales.",
    cta: "Mentorías",
    href: "/mentorias",
  },
] as const;

const RISK_ALERTS = [
  { label: "Coste real", detail: "Lo anunciado rara vez es lo que pagas." },
  { label: "Contrato", detail: "Cláusulas que condicionan tu formación." },
  { label: "Reembolso", detail: "Depósitos y salidas poco transparentes." },
  { label: "Ruta correcta", detail: "Integrada, modular o universitaria mal elegida." },
] as const;

const CAPABILITIES = [
  {
    title: "Planifica",
    body: "Career Planner e informes.",
    href: "/career-planner",
    cta: "Abrir planner",
  },
  {
    title: "Compara",
    body: "Escuelas, costes y condiciones.",
    href: "/escuelas",
    cta: "Ver escuelas",
  },
  {
    title: "Avanza",
    body: "ATPL, inglés y preparación.",
    href: "/atpl-estudio",
    cta: "Seguir formación",
  },
] as const;

function PrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#c9a454] px-7 py-3 text-[15px] font-semibold tracking-tight text-[#0a1224] shadow-[0_10px_28px_rgba(201,164,84,0.32)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}

function GhostCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-md transition hover:border-white/35 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${className}`}
    >
      {children}
    </Link>
  );
}

function BriefingField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 border-b border-white/[0.08] py-3 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a454]/90">
        {label}
      </span>
      <span className="font-mono text-[13px] leading-snug text-slate-200 sm:text-sm">{value}</span>
    </div>
  );
}

export function FlyPathHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070d1a] text-white">
      <FlyPathPlatformHeader pageTitle="Inicio" currentModuleId="inicio" logoMode="landing" />

      <main className="flex flex-col">
        {/* 1 — Hero briefing */}
        <section className="relative flex min-h-[100dvh] min-h-screen flex-col border-b border-white/[0.06]">
          <img
            src="/hero-aircraft.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[62%_38%]"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,13,26,0.94)_0%,rgba(15,26,51,0.82)_42%,rgba(7,13,26,0.55)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_22%,rgba(201,164,84,0.08),transparent)]"
            aria-hidden
          />

          <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-6 pb-10 pt-24 sm:pb-14 sm:pt-28 lg:px-10 lg:pb-16">
            <div className="grid flex-1 items-end gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-12 xl:gap-16">
              <div className="flex flex-col justify-center lg:min-h-[52vh] lg:py-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#f2ddaa]/80">
                  Briefing inicial
                </p>
                <h1 className="mt-4 max-w-[14ch] text-[2.35rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                  Tu copiloto durante toda la formación.
                </h1>
                <p className="mt-4 max-w-lg text-lg font-medium leading-snug text-slate-200/95 sm:text-xl">
                  Desde la decisión de empezar hasta tu primera aerolínea.
                </p>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
                  Planifica tu ruta, compara escuelas y evita errores caros antes de comprometer
                  dinero.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryCta href="/career-planner" className="w-full sm:w-auto">
                    Empezar mi ruta
                  </PrimaryCta>
                  <GhostCta href="/escuelas" className="w-full sm:w-auto">
                    Comparar escuelas
                  </GhostCta>
                </div>
              </div>

              <aside
                className="w-full max-w-md justify-self-end lg:max-w-none"
                aria-label="Resumen de plan de vuelo"
              >
                <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0f1a33]/75 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a1224]/60 px-5 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Flight plan · borrador
                    </span>
                    <span className="rounded-md border border-[#c9a454]/30 bg-[#c9a454]/10 px-2 py-0.5 font-mono text-[10px] text-[#f2ddaa]">
                      FP-INIT
                    </span>
                  </div>
                  <div className="px-5 py-1">
                    <BriefingField label="Ruta" value="Integrada / modular — por validar" />
                    <BriefingField label="Coste" value="Estimación según perfil y escuela" />
                    <BriefingField label="Escuela" value="Sin selección · comparar antes" />
                  </div>
                  <div className="border-t border-white/[0.06] bg-[#0a1224]/40 px-5 py-3">
                    <p className="font-mono text-[11px] leading-relaxed text-slate-500">
                      Completa el briefing en Career Planner para fijar tu lectura inicial.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* 2 — Flight path */}
        <section className="border-b border-[#0f1a33]/10 bg-[#f4f1ea] text-[#0f1a33]">
          <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Elige tu punto de partida
            </h2>
            <p className="mt-2 max-w-lg text-[15px] text-slate-600">
              Una sola ruta de formación. Entra donde estés ahora.
            </p>

            <div className="relative mt-12">
              <div
                className="pointer-events-none absolute left-0 right-0 top-[1.15rem] hidden h-px bg-gradient-to-r from-transparent via-[#0f1a33]/20 to-transparent lg:block"
                aria-hidden
              />
              <ol className="flex gap-0 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {FLIGHT_PATH_PHASES.map((phase, index) => (
                  <li
                    key={phase.step}
                    className="relative flex min-w-[11.5rem] flex-1 flex-col pl-0 lg:min-w-0 lg:px-2 first:lg:pl-0 last:lg:pr-0"
                  >
                    {index < FLIGHT_PATH_PHASES.length - 1 ? (
                      <span
                        className="absolute left-[calc(100%-0.5rem)] top-[1.15rem] hidden h-px w-[calc(100%-1rem)] bg-[#0f1a33]/15 lg:block"
                        aria-hidden
                      />
                    ) : null}
                    <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-0">
                      <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0f1a33]/15 bg-white font-mono text-[11px] font-semibold text-[#0f1a33] shadow-sm lg:mb-5">
                        {phase.step}
                      </span>
                      <div className="min-w-0 flex-1 lg:pr-1">
                        <h3 className="text-[15px] font-semibold leading-tight tracking-tight">
                          {phase.title}
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
                          {phase.line}
                        </p>
                        <Link
                          href={phase.href}
                          className="mt-3 inline-block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16] transition hover:text-[#0f1a33]"
                        >
                          {phase.cta} →
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 3 — Why */}
        <section className="border-b border-white/[0.06] bg-[#0f1a33]">
          <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Decidir mal puede costarte miles de euros.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-400 sm:text-base">
                Muchas decisiones se toman con información incompleta: precio anunciado, rutas mal
                entendidas, contratos poco claros y promesas comerciales difíciles de comprobar.
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RISK_ALERTS.map((alert) => (
                <div
                  key={alert.label}
                  className="rounded-xl border border-[#c9a454]/20 bg-[#0a1224]/50 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
                    Alerta
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">{alert.label}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-slate-400">{alert.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — What FlyPath does */}
        <section className="border-b border-slate-200/30 bg-[#f8f6f1] text-[#0f1a33]">
          <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
            <h2 className="sr-only">Qué hace FlyPath</h2>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[#0f1a33]/10 bg-[#0f1a33]/10 shadow-[0_20px_50px_rgba(15,26,51,0.08)] sm:grid-cols-3">
              {CAPABILITIES.map((cap, i) => (
                <article
                  key={cap.title}
                  className={`flex flex-col bg-white px-6 py-8 sm:px-7 sm:py-9 ${
                    i < CAPABILITIES.length - 1 ? "border-b border-[#0f1a33]/8 sm:border-b-0 sm:border-r" : ""
                  }`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#c9a454]">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">{cap.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">
                    {cap.body}
                  </p>
                  <Link
                    href={cap.href}
                    className="mt-6 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#0f1a33] transition hover:text-[#7a5a16]"
                  >
                    {cap.cta} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — Final CTA */}
        <section className="relative overflow-hidden bg-[#070d1a]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(201,164,84,0.1),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl px-6 py-16 text-center sm:py-20 lg:px-10 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              No empieces por una escuela. Empieza por un plan.
            </h2>
            <div className="mt-9 flex justify-center">
              <PrimaryCta href="/career-planner">Crear mi plan</PrimaryCta>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
