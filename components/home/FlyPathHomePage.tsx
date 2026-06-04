"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { ProductSuite } from "@/components/home/ProductSuite";
import { TrustBlock } from "@/components/home/TrustBlock";

const ROADMAP_STEPS = [
  {
    step: 1,
    title: "Quiero ser piloto",
    line: "Ruta, coste y primeros pasos.",
    cta: "Career Planner",
    href: "/career-planner",
  },
  {
    step: 2,
    title: "Comparo escuelas",
    line: "Precio, incluidos y condiciones.",
    cta: "Comparador",
    href: "/escuelas",
  },
  {
    step: 3,
    title: "Estoy estudiando",
    line: "Asignaturas, calendario y objetivos.",
    cta: "ATPL Planner",
    href: "/atpl-estudio",
  },
  {
    step: 4,
    title: "Inglés aeronáutico",
    line: "Speaking y comunicación real.",
    cta: "Inglés",
    href: "/ingles-aeronautico",
  },
  {
    step: 5,
    title: "Aerolínea / selección",
    line: "CV, entrevistas y próximos pasos.",
    cta: "Mentorías",
    href: "/mentorias",
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
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#D6AE4F] px-8 py-4 text-[15px] font-bold tracking-tight text-[#071224] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}

export function FlyPathHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#071224]">
      <FlyPathPlatformHeader pageTitle="Inicio" currentModuleId="inicio" logoMode="landing" />

      <main className="flex flex-col">
        {/* 1 — Hero centrado */}
        <section className="relative flex min-h-[560px] flex-col items-center justify-start border-b border-white/[0.06] px-6 text-center sm:min-h-[640px] lg:min-h-[690px]">
          <img
            src="/home.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,25,0.54)_0%,rgba(5,10,25,0.58)_44%,rgba(5,10,25,0.62)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(201,164,84,0.06),transparent_65%)]"
            aria-hidden
          />

          <div className="relative z-[1] mx-auto flex w-full max-w-4xl flex-col items-center px-2 pb-2 pt-14 sm:pb-4 sm:pt-20 md:pt-24">
            <h1 className="max-w-[22ch] text-[2.15rem] font-semibold leading-[1.06] tracking-tight text-white sm:max-w-[24ch] sm:text-5xl md:max-w-[26ch] md:text-6xl lg:max-w-[28ch] lg:text-[3.5rem] lg:leading-[1.04]">
              Tu copiloto durante toda tu ruta en aviación.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base md:mt-6">
              Planifica tu ruta, compara escuelas y evita errores caros antes de pagar una
              matrícula.
            </p>
            <div className="mt-6 flex w-full justify-center sm:mt-7">
              <PrimaryCta href="/career-planner" className="w-full sm:w-auto sm:min-w-[230px]">
                Empezar mi ruta
              </PrimaryCta>
            </div>

            <div className="mt-6 w-full max-w-5xl sm:mt-8">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]/90">
                ¿Dónde estás ahora?
              </p>
              <div className="relative mt-7 md:hidden">
                <div
                  className="pointer-events-none absolute bottom-3 left-5 top-3 w-px bg-gradient-to-b from-white/30 via-white/20 to-transparent"
                  aria-hidden
                />
                <ol className="space-y-2.5 text-left">
                  {ROADMAP_STEPS.map((step) => (
                    <li key={step.step} className="relative pl-12">
                      <Link
                        href={step.href}
                        className="block rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                        aria-label={`${step.step}. ${step.title}`}
                      >
                        <span
                          className={`absolute left-0 top-1 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-[#0a1224]/90 font-mono text-[12px] font-semibold shadow-[0_8px_20px_rgba(7,13,26,0.45)] ${
                            step.step <= 2
                              ? "border-[#c9a454]/80 text-[#f2ddaa]"
                              : "border-white/45 text-white"
                          }`}
                        >
                          {String(step.step).padStart(2, "0")}
                        </span>
                        <span
                          className={`block text-[15px] font-semibold leading-snug ${
                            step.step <= 2 ? "text-white" : "text-slate-100"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`mt-1 block text-[13px] leading-snug ${
                            step.step <= 2 ? "text-slate-200" : "text-slate-300"
                          }`}
                        >
                          {step.line}
                        </span>
                        <span
                          className={`mt-1.5 inline-block text-[12px] font-medium uppercase tracking-[0.14em] ${
                            step.step <= 2 ? "text-[#f2ddaa]" : "text-[#c9a454]/95"
                          }`}
                        >
                          {step.cta} →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative mt-8 hidden md:block">
                <div
                  className="pointer-events-none absolute left-14 right-14 top-5 hidden h-px bg-gradient-to-r from-transparent via-white/40 to-transparent lg:block"
                  aria-hidden
                />
                <ol className="relative mx-auto flex items-start justify-between gap-3 px-2 lg:max-w-5xl">
                  {ROADMAP_STEPS.map((step) => (
                    <li key={step.step} className="group flex min-w-0 flex-1 flex-col items-center text-center">
                      <Link
                        href={step.href}
                        className="flex w-full flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                        aria-label={`${step.step}. ${step.title}`}
                      >
                        <span
                          className={`relative z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full border bg-[#0a1224]/90 font-mono text-[12px] font-semibold shadow-[0_8px_20px_rgba(7,13,26,0.45)] transition duration-200 group-hover:border-[#c9a454]/80 group-hover:text-[#f2ddaa] ${
                            step.step <= 2
                              ? "border-[#c9a454]/80 text-[#f2ddaa]"
                              : "border-white/45 text-white"
                          }`}
                        >
                          {String(step.step).padStart(2, "0")}
                        </span>
                        <span
                          className={`mt-4 text-[14px] font-semibold leading-snug transition duration-200 group-hover:text-white ${
                            step.step <= 2 ? "text-white" : "text-slate-100"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`mt-2 text-[13px] leading-snug ${
                            step.step <= 2 ? "text-slate-200" : "text-slate-300"
                          }`}
                        >
                          {step.line}
                        </span>
                        <span
                          className={`mt-3 text-[12px] font-medium uppercase tracking-[0.14em] transition duration-200 group-hover:text-[#f2ddaa] ${
                            step.step <= 2 ? "text-[#f2ddaa]" : "text-[#c9a454]/90"
                          }`}
                        >
                          {step.cta} →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Herramientas FlyPath */}
        <ProductSuite />

        <TrustBlock />

        {/* CTA final */}
        <section className="bg-[#071224]">
          <div className="mx-auto max-w-[36rem] px-6 py-14 text-center lg:px-8 lg:py-16">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Empieza por entender tu ruta.
            </h2>
            <p className="mx-auto mt-3 text-[14px] leading-relaxed text-[rgba(255,255,255,0.7)] sm:text-[15px]">
              Antes de comprometer tiempo y dinero.
            </p>
            <div className="mt-7 flex justify-center">
              <PrimaryCta href="/career-planner" className="px-7 py-3.5 text-[14px]">
                Crear mi plan
              </PrimaryCta>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
