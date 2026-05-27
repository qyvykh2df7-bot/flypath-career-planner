import type { StudyMode } from "./types";
import { ATPL_BANK_AREAS } from "./atpl-bank-areas";
import { getSubjectById } from "./subjects";

export type ClassSessionSubtopicCatalog = {
  id: string;
  label: string;
  subtopics: string[];
};

const PPL_CLASS_SUBTOPICS: Record<string, string[]> = {
  "ppl-flight-performance-planning": [
    "Detalles de carga y centrado",
    "Determinación de la posición del CG",
    "Finalidad de las consideraciones de carga y centrado",
    "Masa",
    "Performance",
    "Plan de vuelo OACI (Plan de vuelo ATS)",
    "Planificación de vuelos VFR",
    "Preparación prevuelo",
    "Seguimiento del vuelo y replanificación en vuelo",
  ],
  "ppl-principles-of-flight": [
    "Aerodinámica subsónica",
    "Control",
    "Estabilidad",
    "Hélices",
    "Limitaciones",
    "Mecánica de vuelo",
  ],
  "ppl-operational-procedures": [
    "Aterrizajes de emergencia y precaución",
    "Cizalladura y microrráfagas",
    "Fuego y humo",
    "Onda turbulenta",
    "Operación del avión. Anexo 6 OACI, requisitos generales",
    "Pistas contaminadas",
    "Procedimientos operativos especiales y peligros",
    "Reducción de ruido",
  ],
  "ppl-navigation": [
    "Conceptos básicos",
    "GNSS",
    "Magnetismo y brújulas",
    "Mapas",
    "Navegación DR",
    "Navegación en vuelo",
    "Radar",
    "Radioayudas",
    "Teoría básica de la propagación de la radio",
  ],
  "ppl-human-performance": [
    "Conceptos básicos",
    "Psicología básica de aviación",
  ],
  "ppl-air-law": [
    "Anexo 11: Doc. 4444 Gestión del tráfico aéreo",
    "Anexo 12: Búsqueda y rescate",
    "Anexo 13: Investigación de accidentes",
    "Anexo 14, volumen 1 y 2: Aeródromos",
    "Anexo 15: Servicio de información aeronáutica",
    "Anexo 17: Seguridad",
    "Anexo 1: Licencias",
    "Anexo 2: Reglas del aire",
    "Anexo 7: Nacionalidad de las aeronaves y marcas",
    "Anexo 8: Aeronavegabilidad",
    "Doc. 7300/6: Convenio sobre Aviación Civil Internacional",
    "Procedimientos de calaje de altímetro",
    "Radar secundario de vigilancia. Procedimientos de operación del transpondedor",
    "Reglamentación nacional",
  ],
  "ppl-aircraft-general-knowledge": [
    "Célula",
    "Controles de vuelo",
    "Diseño del sistema, cargas, tensiones, mantenimiento",
    "Electricidad",
    "Hélices",
    "Hidráulica",
    "Instrumentos giroscópicos",
    "Instrumentos integrados: Pantallas electrónicas",
    "Magnetismo: brújula de lectura directa",
    "Medida de los parámetros aerodinámicos",
    "Motores de pistón",
    "Performance y manejo del motor",
    "Sistema de combustible",
    "Sistemas de alerta y sistemas de proximidad",
    "Sistemas de comunicación",
    "Sistemas de instrumentos e indicaciones",
    "Tren de aterrizaje, ruedas, neumáticos y frenos",
  ],
  "ppl-communications": [
    "Actuación en caso de fallo de comunicaciones",
    "Definiciones",
    "Principios generales de propagación de las ondas VHF y atribución de frecuencias",
    "Procedimientos en caso de peligro o urgencia",
    "Procedimientos operativos generales",
    "Términos relevantes para la información meteorológica (VFR)",
  ],
  "ppl-meteorology": [
    "Altimetría",
    "Atmósfera estándar OACI",
    "Causa primaria del viento",
    "Composición, extensión y división vertical",
    "Definición y medida del viento",
    "Densidad del aire",
    "Presión atmosférica",
    "Temperatura del aire",
  ],
};

function buildCatalogFromRecord(record: Record<string, string[]>): ClassSessionSubtopicCatalog[] {
  return Object.entries(record)
    .map(([id, subtopics]) => {
      const subject = getSubjectById(id);
      if (!subject) return null;
      return { id, label: subject.name, subtopics };
    })
    .filter((item): item is ClassSessionSubtopicCatalog => item !== null);
}

const ATPL_CLASS_SUBTOPIC_CATALOG = buildCatalogFromRecord(
  Object.fromEntries(
    Object.entries(ATPL_BANK_AREAS).map(([id, areas]) => [
      id,
      areas.map((area) => area.title),
    ]),
  ),
);

const PPL_CLASS_SUBTOPIC_CATALOG = buildCatalogFromRecord(PPL_CLASS_SUBTOPICS);

export function getClassSubtopicCatalog(mode: StudyMode): ClassSessionSubtopicCatalog[] {
  return mode === "ppl" ? PPL_CLASS_SUBTOPIC_CATALOG : ATPL_CLASS_SUBTOPIC_CATALOG;
}

export function getClassSubtopicsForSubject(params: {
  mode: StudyMode;
  subjectId: string;
}): string[] {
  const subject = getClassSubtopicCatalog(params.mode).find((item) => item.id === params.subjectId);
  return subject?.subtopics ?? [];
}

export function normalizeClassTrainingType(raw: unknown): StudyMode {
  return raw === "ppl" ? "ppl" : "atpl";
}

