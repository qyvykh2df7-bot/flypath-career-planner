"use client";

import Image from "next/image";
import Link from "next/link";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Menu, Plane, Route, Star, Tablet, Wallet } from "lucide-react";

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
  { src: "/cessnaguia.webp", alt: "Vista previa de contenidos de la guía" },
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

const WHY_GUIDE_CARDS = [
  {
    title: "Evita errores caros",
    text: "Entiende dónde se va realmente el dinero y qué costes suelen aparecer tarde.",
    icon: Wallet,
  },
  {
    title: "Compara rutas reales",
    text: "Modular, integrado, licencias, tiempos y riesgos explicados sin humo.",
    icon: Route,
  },
  {
    title: "Decide con criterio",
    text: "Aprende qué preguntar, qué revisar y cuándo avanzar antes de pagar matrícula.",
    icon: ClipboardCheck,
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
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#F7F8FA] pt-8 pb-8 md:py-14 xl:min-h-[680px] xl:py-16 xl:pt-[72px] xl:pb-12 2xl:min-h-[720px] 2xl:pb-10 [@media(min-width:1280px)_and_(min-height:850px)]:min-h-[740px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 65% 45% at 90% 8%, rgba(7,18,36,0.04), transparent 55%), radial-gradient(ellipse 50% 40% at 6% 92%, rgba(7,18,36,0.03), transparent 55%), linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%)",
            }}
          />
          <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10 2xl:max-w-[1400px]">
            <div className="md:mx-auto md:max-w-[620px] xl:grid xl:grid-cols-[0.9fr_1.1fr] xl:items-center xl:gap-10 xl:mx-0 xl:max-w-none 2xl:gap-12">
              <div className="relative max-w-[560px] md:mx-auto xl:mx-0 xl:max-w-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B8923F]">
                  GUÍA FLYPATH
                </p>
                <h1 className="mt-3 mb-0 w-full max-w-[600px] overflow-visible text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-[#071224] sm:text-[3.25rem] sm:leading-[1.04] md:text-[52px] md:leading-[0.98] xl:mt-5 xl:text-[3.75rem] xl:leading-[1.04] 2xl:text-[64px] 2xl:leading-[0.95]">
                  <span className="block xl:whitespace-nowrap">Cómo ser piloto</span>
                  <span className="block xl:whitespace-nowrap">sin tomar decisiones</span>
                  <span className="block font-serif italic text-[#B8923F]">a ciegas.</span>
                </h1>

                <div className="relative left-1/2 -mt-6 w-screen max-w-[100vw] -translate-x-1/2 md:hidden">
                  <Image
                    src="/comoserpilotohero.png"
                    alt="Portada de la guía Cómo ser piloto"
                    width={1122}
                    height={1402}
                    preload
                    sizes="100vw"
                    className="mx-auto block h-auto w-full max-w-none -mb-6 object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                <div className="mx-auto mt-7 hidden w-full max-w-[305px] md:block xl:hidden">
                  <Image
                    src="/comoserpilotohero.png"
                    alt="Portada de la guía Cómo ser piloto"
                    width={1122}
                    height={1402}
                    sizes="305px"
                    className="mx-auto h-auto w-full object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                <p className="-mt-2 mb-4 max-w-[520px] text-left text-[16px] leading-[1.7] text-[#4B5563] md:mt-5 md:max-w-[620px] md:text-[17px] md:leading-[1.55] xl:mb-0 xl:mt-6 xl:max-w-[520px] xl:text-[18px] xl:leading-[1.65]">
                  Entiende rutas, licencias, costes reales, Clase 1, escuelas de vuelo y decisiones clave antes de comprometer tu dinero.
                </p>

                <div className="flex flex-col gap-2.5 sm:flex-row md:mt-6 md:gap-4 xl:mt-8 xl:gap-3">
                  <button
                    type="button"
                    onClick={scrollToBuy}
                    className="inline-flex h-auto items-center justify-center rounded-[14px] bg-[#D6AE4F] px-7 py-3.5 text-[15px] font-bold tracking-tight text-[#071224] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
                  >
                    Comprar guía digital
                  </button>
                  <button
                    type="button"
                    onClick={scrollToToc}
                    className="inline-flex h-auto items-center justify-center gap-2 rounded-[14px] border border-[#071224]/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-[#071224] transition duration-200 hover:border-[#071224]/30 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071224]/20 md:h-[56px] md:px-8 md:text-base xl:h-auto xl:px-7 xl:py-3.5 xl:text-[15px] 2xl:h-[56px] 2xl:px-8 2xl:text-[16px]"
                  >
                    Ver contenido
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>

                <p className="mt-2.5 text-[13px] font-medium tracking-[0.02em] text-[#6B7280] xl:mt-7">
                  Digital · Física · Pago único · Actualizada 2026
                </p>
              </div>

              {/* Right column — desktop mockup (same spacer rhythm as AeroComms) */}
              <div className="relative hidden min-h-[480px] self-start xl:block 2xl:min-h-[520px]">
                <Image
                  src="/comoserpilotohero.png"
                  alt="Portada de la guía Cómo ser piloto"
                  width={1122}
                  height={1402}
                  sizes="(max-width: 1536px) 535px, 593px"
                  className="absolute right-10 top-0 h-auto w-full max-w-[535px] -translate-y-12 object-contain object-top object-right drop-shadow-[0_28px_35px_rgba(15,23,42,0.28)] 2xl:max-w-[593px]"
                />
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
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

        {/* TABLA DE CONTENIDOS */}
        <section
          id="contenido-guia"
          className="border-b border-slate-200/70 bg-[#f4f7fb] py-14 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
              <div className="order-1 min-w-0 w-full lg:order-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
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
              <div className="order-2 w-full lg:order-1 lg:flex lg:items-center lg:justify-center">
                <div className="w-full overflow-hidden rounded-3xl border border-[#c9a454]/30 border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,26,51,0.10)] ring-1 ring-black/[0.04] lg:mx-auto lg:w-[88%] lg:max-w-[520px]">
                  <Image
                    src="/avgas.webp"
                    alt="Avión de aviación general como vista previa de la guía Cómo ser piloto"
                    width={3024}
                    height={4032}
                    className="block h-auto w-full max-w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POR QUÉ ESTA GUÍA */}
        <section className="border-b border-slate-200/70 bg-[#F7F8FA] py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
              <div className="order-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
                  POR QUÉ ESTA GUÍA
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-[1.12] tracking-tight text-[#0f1a33] sm:text-[2rem] lg:max-w-lg">
                  No es una guía teórica.
                  <br />
                  Es claridad antes de pagar una formación.
                </h2>
                <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-slate-600 lg:max-w-lg">
                  Cómo ser Piloto reúne lo que a mí me habría gustado entender antes de elegir escuela, ruta y forma de financiar la formación.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:gap-3.5">
                  {WHY_GUIDE_CARDS.map(({ title, text, icon: Icon }) => (
                    <div
                      key={title}
                      className="flex gap-3.5 rounded-[18px] border border-[#E5E7EB] bg-white p-4 sm:gap-4 sm:p-5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fffdf6] ring-1 ring-[#c9a454]/25">
                        <Icon className="h-4 w-4 text-[#c9a454]" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold leading-snug text-[#0f1a33]">{title}</h3>
                        <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-2 flex w-full justify-center lg:order-2">
                <div className="w-full max-w-[300px] overflow-hidden rounded-3xl border border-[#c9a454]/30 border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,26,51,0.10)] ring-1 ring-black/[0.04] sm:max-w-[360px] lg:max-w-[500px]">
                  <Image
                    src="/atardecer.jpg"
                    alt="Atardecer aeronáutico como apoyo visual de la guía Cómo ser piloto"
                    width={2000}
                    height={1500}
                    className="block h-auto w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORMATOS Y COMPRA */}
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
                    <span className="text-4xl font-semibold tracking-tight text-white sm:text-[2.5rem]">26&nbsp;€</span>
                    <span className="whitespace-nowrap text-[13px] font-medium text-white/65">Edición impresa</span>
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
                      <span className="md:whitespace-nowrap">Ideal para familias que quieren entender el camino</span>
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
                    <span className="text-4xl font-semibold tracking-tight text-[#D6AE4F] sm:text-[2.5rem]">14,95&nbsp;€</span>
                    <span className="whitespace-nowrap text-[13px] font-medium text-white/65">Descarga inmediata</span>
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
                      <span className="md:whitespace-nowrap">Versión práctica para consultar mientras comparas escuelas</span>
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

        {/* RESEÑAS */}
        <section className="border-b border-slate-200/70 bg-[#f8fafc] py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f1a33] sm:text-3xl">
              Lo que dicen otros futuros pilotos
            </h2>
            <div className="mt-8 md:hidden">
              <div className="-mx-6 flex snap-x snap-mandatory overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TESTIMONIALS.map((t) => (
                  <figure
                    key={t.author}
                    className="box-border w-full shrink-0 grow-0 basis-full snap-center"
                  >
                    <div className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_14px_38px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]">
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
                    </div>
                  </figure>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-2" aria-hidden>
                {TESTIMONIALS.map((t, index) => (
                  <span
                    key={t.author}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === 0 ? "bg-[#c9a454]" : "bg-[#0f1a33]/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8 hidden gap-5 md:grid md:grid-cols-3">
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
      <HomeFooter />
    </div>
  );
}
