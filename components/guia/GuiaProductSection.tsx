"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Tablet, BookOpen } from "lucide-react";

const TOAST_MS = 2800;

const GUIDE_PREVIEW_IMAGES = [
  { src: "/kindleguia.webp", alt: "Vista previa de la guía en Kindle" },
  { src: "/pistaguia.webp", alt: "Vista previa de la guía para futuros pilotos" },
  { src: "/cessnaguia.webp", alt: "Vista previa de contenidos de la guía" },
] as const;

const PRODUCT_INCLUDES = [
  "Requisitos reales: edad, estudios, inglés y certificado médico.",
  "Licencias y habilitaciones explicadas de forma clara.",
  "Diferencias entre formación modular e integrada.",
  "Coste real de ser piloto, con fases y costes ocultos.",
  "Cómo elegir escuela de pilotos con criterio.",
  "Qué pasa después de obtener las licencias.",
  "Caminos alternativos en aviación.",
  "Bonus con checklists y plantilla de CV.",
];

type Format = "fisico" | "digital";

export function GuiaProductSection() {
  const [toast, setToast] = useState<string | null>(null);
  const [guidePreviewIndex, setGuidePreviewIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<Format>("digital");

  const showDigitalToast = useCallback(() => setToast("Compra digital próximamente"), []);
  const showPhysicalToast = useCallback(() => setToast("Compra física próximamente"), []);

  const buyForSelectedFormat = useCallback(() => {
    if (selectedFormat === "fisico") showPhysicalToast();
    else showDigitalToast();
  }, [selectedFormat, showDigitalToast, showPhysicalToast]);

  const goToPrev = useCallback(() => {
    setGuidePreviewIndex((i) => (i - 1 + GUIDE_PREVIEW_IMAGES.length) % GUIDE_PREVIEW_IMAGES.length);
  }, []);

  const goToNext = useCallback(() => {
    setGuidePreviewIndex((i) => (i + 1) % GUIDE_PREVIEW_IMAGES.length);
  }, []);

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

      <section id="comprar-guia" className="border-b border-slate-200/70 bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            {/* Image carousel */}
            <div
              className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#0f1a33] to-[#152547] shadow-[0_28px_70px_rgba(15,26,51,0.18)] ring-1 ring-black/[0.04]"
              aria-roledescription="carousel"
              aria-label="Galería de imágenes de la guía"
            >
              <div className="relative aspect-[4/5] w-full">
                {GUIDE_PREVIEW_IMAGES.map((img, i) => {
                  const active = i === guidePreviewIndex;
                  return (
                    <Image
                      key={img.src}
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      aria-hidden={!active}
                      className={`object-cover transition-opacity duration-500 ease-out ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  );
                })}

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0f1a33]/55 via-[#0f1a33]/15 to-transparent"
                  aria-hidden
                />

                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#0f1a33]/55 text-white shadow-[0_8px_22px_rgba(15,26,51,0.35)] backdrop-blur-md transition hover:border-[#c9a454]/70 hover:bg-[#0f1a33]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:left-4"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Imagen siguiente"
                  className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#0f1a33]/55 text-white shadow-[0_8px_22px_rgba(15,26,51,0.35)] backdrop-blur-md transition hover:border-[#c9a454]/70 hover:bg-[#0f1a33]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:right-4"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>

                <div
                  role="tablist"
                  aria-label="Selección de imagen"
                  className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2"
                >
                  {GUIDE_PREVIEW_IMAGES.map((img, i) => {
                    const active = i === guidePreviewIndex;
                    return (
                      <button
                        key={img.src}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={`Ir a la imagen ${i + 1} de ${GUIDE_PREVIEW_IMAGES.length}`}
                        onClick={() => setGuidePreviewIndex(i)}
                        className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/70 ${
                          active
                            ? "w-6 bg-[#c9a454] shadow-[0_2px_8px_rgba(201,164,84,0.55)]"
                            : "w-2 bg-white/55 hover:bg-white/85"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Product info + format picker */}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                EDICIÓN 2026
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
                CÓMO SER PILOTO – 2026
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                La guía de FlyPath &ldquo;Cómo ser piloto&rdquo; reúne en un solo documento lo que un futuro piloto
                debería saber antes de gastar miles de euros en formación.
              </p>

              <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f1a33]/70">
                Incluye:
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {PRODUCT_INCLUDES.map((item) => (
                  <li key={item} className="flex gap-2 text-base leading-snug text-slate-700 lg:text-[17px]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Format picker */}
              <div className="mt-7 flex flex-col items-center rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-[#fffdf8] p-5 text-center shadow-[0_16px_44px_rgba(15,26,51,0.07)] sm:p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#B8923F]">
                  Formato
                </p>
                <div
                  role="tablist"
                  aria-label="Selección de formato"
                  className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                >
                  {(["fisico", "digital"] as Format[]).map((f) => {
                    const active = selectedFormat === f;
                    const label = f === "fisico" ? "Físico" : "Digital";
                    return (
                      <button
                        key={f}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedFormat(f)}
                        className={`min-w-[6.5rem] rounded-lg px-4 py-2 text-[15px] font-semibold transition-colors ${
                          active
                            ? "bg-[#0f1a33] text-white shadow-[0_4px_14px_rgba(15,26,51,0.25)]"
                            : "text-slate-600 hover:text-[#0f1a33]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-baseline justify-center gap-2">
                  <span className="text-[2.75rem] font-semibold leading-none tracking-tight text-[#0f1a33]">
                    {selectedFormat === "fisico" ? "26\u00a0€" : "14,95\u00a0€"}
                  </span>
                </p>
                <p className="mt-1 text-[15px] font-medium text-slate-500">
                  {selectedFormat === "fisico" ? "Edición impresa" : "Descarga inmediata"}
                </p>
                <button
                  type="button"
                  onClick={buyForSelectedFormat}
                  className="mt-4 inline-flex min-h-[48px] min-w-[14rem] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  {selectedFormat === "fisico" ? "Comprar física" : "Comprar digital"}
                </button>
                <p className="mt-3 text-[12px] leading-snug text-slate-500">
                  Tasas incluidas · Pago único y seguro · Descarga digital inmediata
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
