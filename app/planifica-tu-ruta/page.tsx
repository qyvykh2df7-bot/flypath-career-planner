import { PlatformHubShell } from "@/components/PlatformHubShell";

export default function PlanificaTuRutaPage() {
  return (
    <PlatformHubShell
      currentModuleId="planifica"
      pageTitle="Planifica tu ruta"
      title="Planifica tu ruta"
      cardsSectionLabel="Empieza aquí"
      description="Antes de pagar matrícula o firmar con una escuela, ordena tu situación: ruta posible, coste realista, escuelas candidatas y próximos pasos con criterio."
      intro="Esta sección reúne el diagnóstico interactivo y la guía editorial para quienes están empezando o replanteando su formación."
      cards={[
        {
          title: "Career Planner",
          description:
            "Herramienta principal de FlyPath: introduce tu perfil y obtén un diagnóstico de ruta, costes y riesgos.",
          href: "/",
          cta: "Abrir Career Planner",
          highlights: [
            "Diagnóstico de ruta integrada vs modular",
            "Comparación de escuelas candidatas",
            "Informe para familia o asesor",
          ],
        },
        {
          title: "Guía Cómo ser piloto",
          description:
            "Contenido estructurado para entender licencias, tiempos, costes ocultos y errores habituales.",
          href: "/guia-como-ser-piloto",
          cta: "Ver guía",
          highlights: [
            "Requisitos y licencias explicados",
            "Cómo elegir escuela con criterio",
            "Formato digital y físico",
          ],
        },
      ]}
    />
  );
}
