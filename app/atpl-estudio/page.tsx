import { PlatformHubShell } from "@/components/PlatformHubShell";

export default function AtplEstudioHubPage() {
  return (
    <PlatformHubShell
      currentModuleId="atpl-estudio"
      pageTitle="ATPL & Estudio"
      title="ATPL & Estudio"
      cardsSectionLabel="Organiza tu estudio"
      description="La fase teórica exige método: calendario, mocks, repasos y registro de errores. Esta sección concentra planificación de estudio y apoyo en asignaturas concretas."
      intro="Pensado para alumnos en ATPL, PPL o modular que quieren dejar de improvisar el estudio semana a semana."
      heroBackgroundImage="/landingatpl.jpg"
      heroOverlayClassName="bg-gradient-to-r from-black/62 via-[#0f1a33]/36 to-transparent"
      cardClassName="border-[#bfdbfe]/80 shadow-[0_6px_24px_rgba(15,26,51,0.06)] hover:border-[#93c5fd] hover:shadow-[0_12px_34px_rgba(15,26,51,0.1)]"
      highlightsListClassName="text-slate-600"
      highlightMarkerClassName="text-[#c9a454] text-[12px] leading-none"
      highlightSymbol="✓"
      cards={[
        {
          title: "ATPL Planner",
          description:
            "Planificador local con calendario, mocks, repasos, error log y seguimiento por asignatura.",
          href: "/atpl-planner",
          cta: "Abrir ATPL Planner",
          highlights: [
            "Modo ATPL y PPL",
            "Datos en tu navegador (local)",
            "Panel de seguimiento de estudio",
          ],
        },
        {
          title: "Clases PPL/ATPL",
          description:
            "Sesiones de apoyo para dudas puntuales, preparación de examen y planificación del estudio.",
          href: "/clases-ppl-atpl",
          cta: "Ver clases",
          highlights: [
            "Clases 1:1 online",
            "Por asignatura o bloque",
            "Enfoque práctico de examen",
          ],
        },
      ]}
    />
  );
}
