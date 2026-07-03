"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

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

export function GuiaTocAccordion() {
  const [openChapterIndex, setOpenChapterIndex] = useState<number | null>(null);

  return (
    <>
      <ol className="mt-7">
        {TOC_CHAPTERS.map((chapter, i) => {
          const isOpen = openChapterIndex === i;
          const panelId = `toc-chapter-panel-${i}`;
          return (
            <li key={chapter.title} className="border-b border-slate-200/80 last:border-b-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenChapterIndex((current) => (current === i ? null : i))}
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
      {/* Native anchor — scroll without JS */}
      <a
        href="#formatos-guia"
        className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-7 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_12px_36px_rgba(201,164,84,0.32)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55"
      >
        Descarga la guía ahora
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </a>
    </>
  );
}
