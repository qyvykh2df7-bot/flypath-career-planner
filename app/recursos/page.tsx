import { PlatformHubShell } from "@/components/PlatformHubShell";

export default function RecursosHubPage() {
  return (
    <PlatformHubShell
      currentModuleId="recursos"
      pageTitle="Recursos"
      title="Recursos"
      cardsSectionLabel="Explora recursos"
      description="Productos, servicios y contenido editorial de FlyPath: guías, mentorías, logbooks y artículos para apoyar decisiones y formación."
      intro="La Shop concentra lo comprable o reservable; el Blog profundiza en rutas, costes, ATPL y escuelas con artículos prácticos."
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
