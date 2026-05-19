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
