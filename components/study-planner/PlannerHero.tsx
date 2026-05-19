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
    <section className="relative isolate min-h-[220px] border-b border-[#0f1a33]/20 bg-[#0f1a33] sm:min-h-[240px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {!imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/atpl-planner.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-90"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a33] via-[#152440] to-[#1a2d52]" />
        )}
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/55 to-black/20 sm:from-black/82 sm:via-black/40 sm:to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0f1a33]/75 via-[#0f1a33]/20 to-transparent sm:max-w-[55%]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-6 sm:px-6 sm:pb-7 sm:pt-7 lg:px-8">
        <div className="min-w-0 max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]">
            ATPL Planner
          </p>
          <h1 className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.65rem]">
            Organiza tu semana, controla progreso y detecta retrasos.
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2 text-[14px] font-semibold text-[#0f1a33] shadow-[0_8px_24px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
            >
              Ir al dashboard
            </button>
            <button
              type="button"
              onClick={onGoToRecovery}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Estoy perdido
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
