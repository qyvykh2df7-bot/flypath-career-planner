"use client";

import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Menu, Plane, Star } from "lucide-react";

const TOAST_MS = 2800;

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

const GUIDE_PREVIEW_IMAGES = [
  { src: "/kindleguia.png", alt: "Vista previa de la guía en Kindle" },
  { src: "/pistaguia.png", alt: "Vista previa de la guía para futuros pilotos" },
  { src: "/cessnaguia.png", alt: "Vista previa de contenidos de la guía" },
] as const;

const TOC_CHAPTERS = [
  {
    title: "¿Qué significa ser piloto?",
    summary:
      "Una visión realista de lo que implica ser piloto profesional: responsabilidades, estilo de vida, toma de decisiones y expectativas antes de empezar la formación.",
  },
  {
    title: "Requisitos para ser piloto",
    summary:
      "Edad, estudios, inglés, certificado médico y requisitos prácticos que conviene revisar antes de hablar con escuelas o comprometer dinero.",
  },
  {
    title: "Licencias y habilitaciones",
    summary:
      "Explicación clara de licencias, habilitaciones y fases habituales para entender qué necesitas realmente para llegar a piloto comercial.",
  },
  {
    title: "Tipos de formación",
    summary:
      "Diferencias entre ruta integrada y modular, ventajas, riesgos, tiempos y qué tipo de perfil puede encajar mejor en cada camino.",
  },
  {
    title: "Cómo elegir escuela y el coste real",
    summary:
      "Cómo comparar escuelas con criterio: precio real, costes ocultos, contrato, reembolso, calendario de pagos y preguntas clave antes de pagar.",
  },
  {
    title: "Primer trabajo",
    summary:
      "Qué ocurre después de obtener las licencias: primeros procesos, entrevistas, simulador, opciones de entrada y cómo preparar el salto profesional.",
  },
  {
    title: "Caminos alternativos",
    summary:
      "Otras vías dentro de la aviación si tu camino no es lineal: instrucción, aviación ejecutiva, trabajo aéreo, oportunidades internacionales y rutas alternativas.",
  },
  {
    title: "Consejos finales",
    summary:
      "Resumen de errores frecuentes, recomendaciones finales, checklists y puntos que deberías validar antes de tomar una decisión económica importante.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Me ayudó a entender la diferencia entre integrado y modular sin depender solo de lo que decía cada escuela.",
    author: "Alumno PPL · España",
  },
  {
    quote:
      "Antes solo miraba el precio. Después de leer la guía empecé a preguntar por contrato, tasas, reembolsos y costes extra.",
    author: "Futuro piloto comercial",
  },
  {
    quote:
      "Muy útil para explicar a mi familia cuánto cuesta realmente el camino y qué pasos había que validar antes de pagar.",
    author: "Aspirante a piloto · Ruta modular",
  },
];

/** Mismo orden que `/`, `/schools` y `/opiniones-escuelas`. */

type Format = "fisico" | "digital";

export default function GuiaComoSerPilotoPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [guidePreviewIndex, setGuidePreviewIndex] = useState(0);
  const [openChapterIndex, setOpenChapterIndex] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format>("digital");

  const scrollToFormats = useCallback(() => {
    document.getElementById("formatos-guia")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToToc = useCallback(() => {
    document.getElementById("contenido-guia")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToBuy = useCallback(() => {
    document.getElementById("comprar-guia")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const goToPrevGuidePreview = useCallback(() => {
    setGuidePreviewIndex(
      (i) => (i - 1 + GUIDE_PREVIEW_IMAGES.length) % GUIDE_PREVIEW_IMAGES.length,
    );
  }, []);

  const goToNextGuidePreview = useCallback(() => {
    setGuidePreviewIndex((i) => (i + 1) % GUIDE_PREVIEW_IMAGES.length);
  }, []);

  const showDigitalToast = useCallback(() => {
    setToast("Compra digital próximamente");
  }, []);

  const showPhysicalToast = useCallback(() => {
    setToast("Compra física próximamente");
  }, []);

  const buyForSelectedFormat = useCallback(() => {
    if (selectedFormat === "fisico") {
      showPhysicalToast();
    } else {
      showDigitalToast();
    }
  }, [selectedFormat, showDigitalToast, showPhysicalToast]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => {
      setToast((t) => (t === toast ? null : t));
    }, TOAST_MS);
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
        pageTitle="Guía Cómo ser piloto"
        currentModuleId="guia"
        onSoonClick={(msg) => setToast(msg ?? "Próximamente")}
      />



      <main>
        {/* HERO — libro recortado, sin card blanca */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white via-[#f7f9fc] to-[#eef2f8]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 55% at 95% 10%, rgba(201,164,84,0.16), transparent 55%), radial-gradient(ellipse 60% 50% at 5% 95%, rgba(15,26,51,0.07), transparent 55%)",
            }}
          />
          <div className="relative z-[1] mx-auto max-w-7xl px-6 pb-4 pt-4 sm:pb-5 sm:pt-5 lg:px-10 lg:pb-4 lg:pt-4">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="order-2 min-w-0 lg:order-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  GUÍA FLYPATH
                </p>
                <h1 className="mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-[2.4rem] lg:text-[2.65rem] lg:leading-[1.08]">
                  La guía que te evita decisiones que cuestan miles de euros.
                </h1>
                <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[#7a5a16]">
                  Cómo ser piloto sin pagar a ciegas
                </p>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
                  Entiende rutas, licencias, costes reales, Clase 1, escuelas de vuelo y decisiones clave antes de comprometer tu dinero.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={scrollToBuy}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                  >
                    Comprar guía digital
                  </button>
                  <button
                    type="button"
                    onClick={scrollToToc}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:border-[#c9a454]/45 hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                  >
                    Ver contenido
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
                <p className="mt-5 text-[13px] font-medium tracking-[0.02em] text-slate-500">
                  Digital · Física · Pago único · Pensada antes de elegir escuela
                </p>
              </div>
              {/* Libro: presentación limpia sin caja blanca. */}
              <div className="order-1 lg:order-2 lg:-translate-y-4">
                <div className="relative mx-auto w-full max-w-[460px] lg:max-w-[560px]">
                  <div
                    className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#c9a454]/18 via-transparent to-[#0f1a33]/10 blur-3xl"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-x-10 bottom-2 -z-10 h-10 rounded-[100%] bg-[#0f1a33]/12 blur-2xl"
                    aria-hidden
                  />
                  <img
                    src="/librocomoserpiloto.png?v=2"
                    alt="Portada de la guía Cómo ser piloto"
                    width={1200}
                    height={1500}
                    fetchPriority="high"
                    decoding="async"
                    className="mx-auto h-auto w-full select-none object-contain drop-shadow-[0_22px_42px_rgba(15,26,51,0.18)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE PRODUCTO — imagen + ficha 2026 */}
        <section
          id="comprar-guia"
          className="border-b border-slate-200/70 bg-white py-12 lg:py-16"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
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
                        priority={i === 0}
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
                    onClick={goToPrevGuidePreview}
                    aria-label="Imagen anterior"
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#0f1a33]/55 text-white shadow-[0_8px_22px_rgba(15,26,51,0.35)] backdrop-blur-md transition hover:border-[#c9a454]/70 hover:bg-[#0f1a33]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:left-4"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextGuidePreview}
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

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  EDICIÓN 2026
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-4xl">
                  CÓMO SER PILOTO – 2026
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                  La guía de FlyPath “Cómo ser piloto” reúne en un solo documento lo que un futuro piloto debería saber antes de gastar miles de euros en formación.
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

                <div className="mt-7 flex flex-col items-center rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-[#fffdf8] p-5 text-center shadow-[0_16px_44px_rgba(15,26,51,0.07)] sm:p-6">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a5a16]">
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

        {/* TABLA DE CONTENIDOS */}
        <section
          id="contenido-guia"
          className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
              <div className="order-1 min-w-0 w-full lg:order-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  TABLA DE CONTENIDOS
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0f1a33] sm:text-[2rem]">
                  Tabla de contenidos por capítulos
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                  Conoce qué podrás encontrar en esta guía y de qué manera está estructurada.
                </p>
                <ol className="mt-7">
                  {TOC_CHAPTERS.map((chapter, i) => {
                    const isOpen = openChapterIndex === i;
                    const panelId = `toc-chapter-panel-${i}`;
                    return (
                      <li
                        key={chapter.title}
                        className="border-b border-slate-200/80 last:border-b-0"
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() =>
                            setOpenChapterIndex((current) => (current === i ? null : i))
                          }
                          className="group flex w-full items-center gap-4 rounded-md py-3 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7fb]"
                        >
                          <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-[#c9a454]/35 bg-[#fffdf6] px-1.5 text-[13px] font-semibold text-[#7a5a16]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-base font-medium leading-snug text-slate-700 transition-colors group-hover:text-[#0f1a33] lg:text-[17px]">
                            {chapter.title}
                          </span>
                          <ChevronDown
                            strokeWidth={2.25}
                            className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                              isOpen ? "rotate-180 text-[#c9a454]" : "text-[#7a5a16]"
                            }`}
                            aria-hidden
                          />
                        </button>
                        {isOpen ? (
                          <div id={panelId} role="region">
                            <p className="pb-4 pl-12 pr-2 text-[15px] leading-relaxed text-slate-600">
                              {chapter.summary}
                            </p>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
                <button
                  type="button"
                  onClick={scrollToFormats}
                  className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.32)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Descarga la guía ahora
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>
              <div className="order-2 w-full lg:order-1">
                <div className="overflow-hidden rounded-3xl border border-[#c9a454]/30 border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,26,51,0.10)] ring-1 ring-black/[0.04]">
                  <img
                    src="/avgas.JPG"
                    alt="Avión de aviación general como vista previa de la guía Cómo ser piloto"
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full max-w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NOTA EDITORIAL — texto grande + imagen vertical */}
        <section className="border-b border-slate-200/70 bg-gradient-to-b from-white to-[#f7f9fc] py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
              <div className="order-1 min-w-0 w-full">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a5a16]">
                  Por qué esta guía
                </p>
                <div className="mt-5 max-w-2xl space-y-5 text-[17px] leading-[1.8] text-[#0f1a33] sm:text-[19px] lg:text-[21px]">
                  <p>
                    Cómo ser Piloto es una guía práctica para quienes quieren iniciar o ya han iniciado el camino hacia la aviación profesional y no quieren equivocarse en las decisiones importantes.
                  </p>
                  <p>
                    Aquí encontrarás exactamente lo que a mí nadie me explicó al empezar: cómo elegir bien escuela y ruta, entender en qué se va realmente el dinero, evitar costes ocultos y gestionar el tiempo de forma inteligente.
                  </p>
                  <p>
                    No es una guía teórica. Es una recopilación clara y directa de los consejos que más impacto tienen en el resultado final: ahorrar miles de euros y años de camino.
                  </p>
                </div>
              </div>
              <div className="order-2 w-full">
                <div className="w-full overflow-hidden rounded-3xl border border-[#c9a454]/30 border-slate-200/80 bg-white shadow-[0_28px_70px_rgba(15,26,51,0.14)] ring-1 ring-black/[0.04]">
                  <img
                    src="/atardecer.jpg"
                    alt="Atardecer aeronáutico como apoyo visual de la guía Cómo ser piloto"
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full max-w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORMATOS Y COMPRA */}
        <section
          id="formatos-guia"
          className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-[#0f1a33] to-[#16264a] py-12 text-white lg:py-16"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 55% at 100% 0%, rgba(201,164,84,0.18), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(255,255,255,0.06), transparent 60%)",
            }}
          />
          <div className="relative z-[1] mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Elige tu formato
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
              Empieza con la versión que mejor encaje contigo. La guía está pensada para leerla antes de comparar escuelas o pagar una matrícula.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {/* Tarjeta física */}
              <div className="flex flex-col rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-[2px] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2ddaa]/85">
                  Físico
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Guía física</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-[#f2ddaa]">26&nbsp;€</span>
                  <span className="text-[13px] font-medium text-slate-300">Edición impresa</span>
                </p>
                <ul className="mt-5 space-y-2 text-[15px] leading-relaxed text-slate-200">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    Versión impresa.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    Perfecta para leer con calma o regalar.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    Ideal para familias que quieren entender el camino.
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={showPhysicalToast}
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/30 bg-transparent px-6 py-3 text-[15px] font-semibold text-white transition hover:border-white/60 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Comprar física
                </button>
              </div>

              {/* Tarjeta digital */}
              <div className="flex flex-col rounded-3xl border border-[#c9a454]/45 bg-white/[0.08] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-[2px] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2ddaa]/85">
                  Digital
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Guía digital</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-[#f2ddaa]">14,95&nbsp;€</span>
                  <span className="text-[13px] font-medium text-slate-300">Descarga inmediata</span>
                </p>
                <ul className="mt-5 space-y-2 text-[15px] leading-relaxed text-slate-200">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    Descarga digital inmediata.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    Ideal para empezar hoy.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    Versión práctica para consultar mientras comparas escuelas.
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={showDigitalToast}
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
                >
                  Comprar digital
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RESEÑAS */}
        <section className="border-b border-slate-200/70 bg-[#f8fafc] py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Lo que dicen otros futuros pilotos
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.author}
                  className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]"
                >
                  <div className="flex items-center gap-0.5" aria-label="Valoración 5 sobre 5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[#c9a454] text-[#c9a454]" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-slate-700">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-4 text-[13px] font-medium text-slate-500">
                    {t.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-gradient-to-b from-[#f8fafc] to-white py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Empieza con la guía, valida tu ruta y después compara escuelas con más criterio.
            </h2>
            <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-slate-500">
              LEE · PLANIFICA · COMPARA
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={showDigitalToast}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
              >
                Comprar guía digital
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
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
