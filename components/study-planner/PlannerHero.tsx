"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type PlannerHeroProps = {
  onGoToDashboard: () => void;
  onGoToRecovery: () => void;
};

export function PlannerHero({ onGoToDashboard, onGoToRecovery }: PlannerHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className="relative isolate min-h-[400px] border-b border-[#0f1a33]/20 bg-[#0f1a33] sm:min-h-[440px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {!imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/atpl-planner.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a33] via-[#152440] to-[#1a2d52]" />
        )}
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
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]">
            ATPL PLANNER
          </p>
          <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.15rem] sm:leading-[1.08]">
            Organiza tu estudio sin estudiar a ciegas
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
            Registra horas, planifica sesiones, controla mocks, repasos y progreso por asignatura.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.4)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
            >
              Ir al dashboard
            </button>
            <button
              type="button"
              onClick={onGoToRecovery}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Estoy perdido
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
