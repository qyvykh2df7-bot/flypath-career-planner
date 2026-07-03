"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Tablet } from "lucide-react";

const TOAST_MS = 2800;

export function GuiaFormatCards() {
  const [toast, setToast] = useState<string | null>(null);

  const showDigitalToast = useCallback(() => setToast("Compra digital próximamente"), []);
  const showPhysicalToast = useCallback(() => setToast("Compra física próximamente"), []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast((t) => (t === toast ? null : t)), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2.5 text-[15px] text-white shadow-lg sm:right-5 sm:top-5"
        >
          {toast}
        </div>
      ) : null}

      <section
        id="formatos-guia"
        className="border-b border-white/5 bg-header-navy pt-14 pb-10 text-white lg:pt-20 lg:pb-12"
      >
        <div className="relative z-[1] mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-[1080px]">
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                ELIGE TU FORMATO
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                Empieza como tú prefieras.
                <br className="hidden sm:block" />
                {" "}
                Dos formatos, el mismo objetivo.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70 lg:text-[17px]">
                Elige cómo quieres empezar: descarga inmediata o edición impresa para leer con calma.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:mt-12">
              {/* Tarjeta física */}
              <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-header-navy p-5 shadow-[0_14px_40px_rgba(7,18,36,0.18)] sm:p-6 md:max-w-[520px] md:justify-self-end">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                    <BookOpen className="h-5 w-5 text-[#D6AE4F]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D6AE4F]">
                      FÍSICO
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">Guía física</h3>
                  </div>
                </div>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-4xl font-semibold tracking-tight text-white sm:text-[2.5rem]">
                    26&nbsp;€
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-medium text-white/65">
                    Edición impresa
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-[14px] leading-snug text-white/75 sm:text-[15px]">
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    <span>Versión impresa de alta calidad</span>
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    <span className="md:whitespace-nowrap">Perfecta para leer con calma o regalar</span>
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    <span className="md:whitespace-nowrap">
                      Ideal para familias que quieren entender el camino
                    </span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={showPhysicalToast}
                  className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/30 bg-transparent px-6 py-3 text-[15px] font-semibold text-white transition hover:border-white/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Comprar física
                </button>
              </article>

              {/* Tarjeta digital — recomendada */}
              <article className="relative flex h-full flex-col overflow-visible rounded-2xl border border-[rgba(212,175,55,0.65)] bg-header-navy p-5 shadow-[0_14px_40px_rgba(7,18,36,0.18)] sm:p-6 sm:pt-7 md:max-w-[520px] md:justify-self-start">
                <span className="pointer-events-none absolute left-1/2 top-0 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c9a454] bg-[#c9a454] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f1a33]">
                  RECOMENDADO
                </span>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                    <Tablet className="h-5 w-5 text-[#D6AE4F]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D6AE4F]">
                      DIGITAL
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">Guía digital</h3>
                  </div>
                </div>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-4xl font-semibold tracking-tight text-[#D6AE4F] sm:text-[2.5rem]">
                    14,95&nbsp;€
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-medium text-white/65">
                    Descarga inmediata
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-[14px] leading-snug text-white/75 sm:text-[15px]">
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    <span>Acceso inmediato tras la compra</span>
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    <span>Ideal para empezar hoy mismo</span>
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6AE4F]" aria-hidden />
                    <span className="md:whitespace-nowrap">
                      Versión práctica para consultar mientras comparas escuelas
                    </span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={showDigitalToast}
                  className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_28px_rgba(201,164,84,0.28)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Comprar digital
                </button>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
