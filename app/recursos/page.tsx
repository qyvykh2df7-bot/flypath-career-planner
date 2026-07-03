import type { Metadata } from "next";
import { PlatformHubShell } from "@/components/PlatformHubShell";

export const metadata: Metadata = {
  title: "Recursos | FlyPath",
  description:
    "Productos, servicios y contenido editorial de FlyPath: guías, mentorías, logbooks y artículos para apoyar decisiones y formación.",
  robots: { index: true, follow: true },
};

export default function RecursosHubPage() {
  return (
    <PlatformHubShell
      currentModuleId="recursos"
      pageTitle="Recursos"
      title="Recursos"
      cardsSectionLabel="Explora recursos"
      description="Productos, servicios y contenido editorial de FlyPath: guías, mentorías, logbooks y artículos para apoyar decisiones y formación."
      intro="La Shop concentra lo comprable o reservable; el Blog profundiza en rutas, costes, ATPL y escuelas con artículos prácticos."
      heroBackgroundImage="/recursoslanding.jpg"
      heroOverlayClassName="bg-gradient-to-r from-black/62 via-[#0f1a33]/36 to-transparent"
      cardClassName="border-[#bfdbfe]/80 shadow-[0_6px_24px_rgba(15,26,51,0.06)] hover:border-[#93c5fd] hover:shadow-[0_12px_34px_rgba(15,26,51,0.1)]"
      highlightsListClassName="text-slate-600"
      highlightMarkerClassName="text-[#c9a454] text-[12px] leading-none"
      highlightSymbol="✓"
      cards={[
        {
          title: "Shop",
          description:
            "Guía, mentorías, clases, logbooks y servicios FlyPath en un único catálogo.",
          href: "/shop",
          cta: "Ir a la Shop",
          highlights: [
            "Guía Cómo ser piloto",
            "Mentorías y acompañamiento",
            "Logbooks en Amazon",
          ],
        },
        {
          title: "Blog",
          description:
            "Artículos sobre formación, costes, licencias, escuelas, inglés aeronáutico y primeros pasos.",
          href: "/blog",
          cta: "Leer artículos",
          highlights: [
            "Contenido por categorías",
            "Enfoque práctico para aspirantes",
            "Complementa el Career Planner",
          ],
        },
      ]}
    />
  );
}
