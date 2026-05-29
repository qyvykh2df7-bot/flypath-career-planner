import { PlatformHubShell } from "@/components/PlatformHubShell";

export default function EscuelasHubPage() {
  return (
    <PlatformHubShell
      currentModuleId="escuelas"
      pageTitle="Escuelas"
      title="Escuelas"
      cardsSectionLabel="Compara y valida"
      description="La decisión de escuela condiciona precio final, calendario, extras incluidos y riesgos contractuales. Aquí comparas opciones y contrastas experiencias reales de alumnos."
      intro="Usa el comparador para criterios objetivos y las opiniones para validar lo que no aparece en la web comercial de la escuela."
      heroBackgroundImage="/landingescuelas.jpg"
      heroOverlayClassName="bg-gradient-to-r from-black/62 via-[#0f1a33]/36 to-transparent"
      cardClassName="border-[#bfdbfe]/80 shadow-[0_6px_24px_rgba(15,26,51,0.06)] hover:border-[#93c5fd] hover:shadow-[0_12px_34px_rgba(15,26,51,0.1)]"
      highlightsListClassName="text-slate-600"
      highlightMarkerClassName="text-[#c9a454] text-[12px] leading-none"
      highlightSymbol="✓"
      cards={[
        {
          title: "Comparador de escuelas",
          description:
            "Filtra y compara escuelas por ruta, coste estimado, condiciones y señales de riesgo.",
          href: "/schools",
          cta: "Abrir comparador",
          highlights: [
            "Comparación lado a lado",
            "Importación al Career Planner",
            "Señales de coste y contrato",
          ],
        },
        {
          title: "Opiniones de escuelas",
          description:
            "Experiencias de alumnos y aspirantes para contrastar marketing con la realidad del día a día.",
          href: "/opiniones-escuelas",
          cta: "Ver opiniones",
          highlights: [
            "Lectura por escuela y ruta",
            "Útil antes de visitar o firmar",
            "Complementa el comparador",
          ],
        },
      ]}
    />
  );
}
