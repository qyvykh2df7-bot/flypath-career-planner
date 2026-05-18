"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

type PlannerHeroProps = {
  onGoToDashboard: () => void;
  onGoToRecovery: () => void;
};

export function PlannerHero({ onGoToDashboard, onGoToRecovery }: PlannerHeroProps) {
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/atpl-planner.jpg";
    img.onload = () => setImageReady(true);
    img.onerror = () => setImageReady(false);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-[#0f1a33]/10 px-4 py-4 sm:px-6 sm:py-5">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0f1a33] via-[#152440] to-[#1a2d52]"
        aria-hidden
      />
      {imageReady ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-[0.42] saturate-[0.65]"
          style={{ backgroundImage: "url(/atpl-planner.jpg)" }}
          aria-hidden
        />
      ) : null}
      {imageReady ? (
        <div className="absolute inset-0 bg-[#0f1a33]/55" aria-hidden />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0f1a33]/97 via-[#0f1a33]/88 to-[#0f1a33]/62"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa] drop-shadow-sm">
            ATPL PLANNER
          </p>
          <h1 className="mt-1 text-xl font-semibold leading-snug tracking-tight text-white drop-shadow-md sm:text-2xl">
            Organiza tu estudio sin estudiar a ciegas
          </h1>
          <p className="mt-1.5 max-w-xl text-[15px] leading-snug text-slate-100 drop-shadow-sm">
            Registra horas, planifica sesiones, controla mocks, repasos y progreso por asignatura.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onGoToDashboard}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-4 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
          >
            Ir al dashboard
          </button>
          <button
            type="button"
            onClick={onGoToRecovery}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-[#0f1a33]/40 px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-[#0f1a33]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Estoy perdido
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
