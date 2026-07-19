import { useState } from "react";
import { ComparisonSchoolHeader } from "@/components/schools/ComparisonSchoolHeader";
import { SchoolReviewComparisonSummary } from "@/components/schools/SchoolReviewComparisonSummary";
import {
  confidenceLabel,
  dataStatusLabel,
  summarizeComparison,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

type Props = {
  schools: SchoolEntry[];
};

type RouteMode =
  | "integrated"
  | "integrated_platinum"
  | "modular"
  | "university"
  | "airline_pilot"
  | "university_programme"
  | "professional_250"
  | "advance_275"
  | "cadet_500"
  | "atpl_basic"
  | "atpl_advanced"
  | "atpl_premium"
  | "canavia_advanced"
  | "canavia_first_officer"
  | "single_licence"
  | "dual_licence";

type RouteProfile = {
  announcedText: string;
  announcedValue?: number;
  estimatedText: string;
  estimatedValue?: number;
  gapText: string;
  durationText: string;
  basesText: string;
  modulesPublished: string[];
  hoursPublished?: string[];
  fleetPublished?: string[];
  simulatorPublished?: string[];
  includedPublished?: string[];
  servicesPublished?: string[];
  languageText?: string;
  class1Text?: string;
  scheduleSummary: string;
  refundSummary: string;
  contractValue: "yes" | "no" | "partial" | "unknown";
  financingValue: "yes" | "no" | "unknown";
  financingNote: string;
  extrasItems: Array<{ label: string; value: string; display: string }>;
  reading: string;
  flags: string[];
  questions: string[];
  costsNote: string;
  estimateNote: string;
};

/**
 * Estándar definitivo de card comparativa FlyPath (todas las escuelas/rutas):
 * A Costes -> B Operación y ruta -> C Contrato y pagos -> D Extras incluidos ->
 * Lectura FlyPath -> E Riesgos -> F Preguntas clave.
 * No mezclar datos entre rutas y no usar "No claro" en UI pública.
 */

/**
 * Patrón reutilizable para escuelas con varias rutas (integrado + modular).
 *
 * Reglas de producto:
 * - Una sola ruta principal -> no mostrar toggle.
 * - Integrado + modular -> mostrar toggle y adaptar bloques A/B/C + lectura + riesgos + preguntas.
 * - Modular: la suma publicada no equivale automáticamente a ruta completa.
 * - Modular: no marcar MCC/UPRT como extras incluidos si son módulos independientes.
 * - Modular: financiación por defecto "no", salvo evidencia explícita de financiación modular.
 */
function getEuropeanFlyersModularProfile(): RouteProfile {
  return {
    announcedText: "56.425 €",
    announcedValue: 56425,
    estimatedText: "78.000 €",
    estimatedValue: 78000,
    gapText: "21.575 €",
    durationText: "Variable según módulos y disponibilidad.",
    basesText: "Madrid (Cuatro Vientos) y Alicante (Mutxamel), según curso.",
    modulesPublished: [
      "PPL: 12.000 €",
      "ATPL teórico: 6.200 €",
      "CPL: 6.150 €",
      "ME: 5.000 €",
      "ME & IR: 19.850 €",
      "MCC APS: 5.200 €",
      "UPRT: 1.450 €",
      "PBN: 575 € Madrid / 450 € Alicante",
      "FI: 8.850 €",
    ],
    scheduleSummary: "Calendario de pagos modular no publicado.",
    refundSummary: "No publicado",
    contractValue: "yes",
    financingValue: "no",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Ruta modular publicada por módulos. La estimación FlyPath añade módulos/costes necesarios no publicados y un margen prudente por imprevistos antes de considerar la ruta completa.",
    flags: [
      "La suma de módulos publicados no equivale necesariamente a una ruta completa desde cero.",
      "Faltan costes como Night Rating, hour building u otros conceptos necesarios para completar la ruta.",
      "Tasas, skill tests y materiales quedan por confirmar para la ruta modular.",
      "Confirmar vigencia actual de cada precio modular.",
    ],
    questions: [
      "¿Qué módulos exactos necesito según mi punto de partida?",
      "¿Night Rating, hour building, tasas, skill tests y materiales están incluidos o van aparte?",
      "¿Qué precios modulares siguen vigentes para la convocatoria actual?",
      "¿Hay packs o descuentos si se contratan varios módulos?",
    ],
    costsNote:
      "Suma de módulos publicados. No equivale necesariamente a una ruta completa desde cero.",
    estimateNote: "",
  };
}

function getAdventiaIntegratedProfile(): RouteProfile {
  return {
    announcedText: "99.470 €",
    announcedValue: 99470,
    estimatedText: "105.000 €",
    estimatedValue: 105000,
    gapText: "5.530 €",
    durationText: "20 meses aprox.",
    basesText: "Salamanca · Salamanca-Matacán",
    modulesPublished: [],
    hoursPublished: [],
    fleetPublished: [],
    simulatorPublished: [],
    includedPublished: [],
    servicesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Publicado",
    refundSummary: "Parcial / condicionado",
    contractValue: "yes",
    financingValue: "yes",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
    ],
    reading:
      "Adventia publica bastante información del integrado: precio, pagos, duración, horas, flota, incluidos y financiación. Aun así, el precio aparece pendiente de actualización y hay tasas/costes administrativos y de expedición de licencia que quedan fuera.",
    flags: [
      "Precio basado en curso 2023/2024 y pendiente de actualización.",
      "Tasas administrativas, exámenes oficiales y expedición de licencia no incluidos.",
      "Reserva solo reembolsable si no se supera el reconocimiento médico.",
      "Curso sujeto a mínimo de alumnos.",
      "Confirmar contrato completo y condiciones actualizadas antes de pagar.",
    ],
    questions: [
      "¿El precio de 99.470 € sigue vigente para 2026/27?",
      "¿Qué tasas exactas quedan fuera y cuánto suponen?",
      "¿Cuál es el coste final incluyendo tasas, licencia y administración?",
      "¿Qué ocurre si no se alcanza el mínimo de alumnos?",
      "¿Se entrega contrato completo antes de la pre-reserva o apertura de expediente?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getAdventiaUniversityProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Pendiente",
    basesText: "Salamanca · Salamanca-Matacán",
    modulesPublished: [],
    languageText: "Por confirmar",
    class1Text: "Por confirmar",
    scheduleSummary: "Pendiente",
    refundSummary: "Pendiente",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "Licencias incluidas", value: "unknown", display: "Por confirmar" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "optional", display: "Opcional / por confirmar" },
    ],
    reading:
      "Ruta universitaria con licencia pendiente de completar. Requiere solicitar información oficial para confirmar coste total, estructura de vuelo, licencias incluidas, horas de vuelo, pagos, financiación, contrato y política de reembolso.",
    flags: [
      "Coste total no publicado de forma suficiente para comparar.",
      "Requiere solicitar información oficial.",
      "Confirmar qué licencias, fases y horas de vuelo están incluidas.",
      "Confirmar contrato, pagos, financiación y reembolso antes de pagar.",
    ],
    questions: [
      "¿Cuál es el coste total del grado universitario con licencia?",
      "¿Qué licencias exactas incluye?",
      "¿Cuántas horas de vuelo incluye?",
      "¿Qué parte corresponde a formación universitaria y qué parte a vuelo?",
      "¿Qué tasas, materiales, exámenes y skill tests quedan fuera?",
      "¿Cuál es el calendario de pagos?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

const ONE_AIR_FLEET =
  "Diamond DA20 C1, Diamond DA40 G1000, Diamond DA42 G1000, Diamond DA62, Cirrus SR20, Tecnam P2008 JC MKII y Tecnam P2006 MKII.";
const ONE_AIR_BASES = "Málaga · Aeropuerto de Málaga / Vélez-Málaga";
const ONE_AIR_LANGUAGE = "Bilingüe, español e inglés";

function getOneAirIntegratedProfile(): RouteProfile {
  return {
    announcedText: "86.500 €",
    announcedValue: 86500,
    estimatedText: "92.000 €",
    estimatedValue: 92000,
    gapText: "5.500 €",
    durationText: "Por confirmar",
    basesText: ONE_AIR_BASES,
    modulesPublished: [],
    languageText: ONE_AIR_LANGUAGE,
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "yes",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
      { label: "Transporte", value: "optional", display: "Opcional" },
    ],
    reading:
      "One Air publica bastante información del Integrado ATPL: horas, flota, simuladores, incluidos principales, tasas, material, seguro, APS MCC, UPRT y FTTC A320+B737. Aun así, falta confirmar contrato, calendario de pagos, depósito, reembolso y vigencia del precio antes de pagar.",
    flags: [
      "Confirmar vigencia del precio publicado.",
      "Confirmar contrato, depósito, calendario de pagos y política de reembolso.",
      "Confirmar condiciones exactas de financiación.",
      "Confirmar si alojamiento y transporte tienen coste aparte.",
      "Confirmar alcance real de la garantía de trabajo por contrato.",
    ],
    questions: [
      "¿El precio de 86.500 € sigue vigente?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Qué ocurre si el alumno abandona o no supera una fase?",
      "¿Qué condiciones tiene la financiación?",
      "¿Qué significa exactamente la garantía de trabajo por contrato?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getOneAirAirlinePilotProfile(): RouteProfile {
  return {
    announcedText: "79.500 €",
    announcedValue: 79500,
    estimatedText: "92.500 €",
    estimatedValue: 92500,
    gapText: "13.000 €",
    durationText: "Por confirmar",
    basesText: ONE_AIR_BASES,
    modulesPublished: [],
    languageText: ONE_AIR_LANGUAGE,
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "yes",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC Plus" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
      { label: "Transporte", value: "optional", display: "Opcional" },
    ],
    reading:
      "El Programa Airline Pilot es una ruta avanzada de One Air con más horas y experiencia que el Integrado ATPL. Incluye formación desde PPL hasta CPL/IR/ME/PBN, APS MCC Plus, UPRT, FTTC Advanced A320+B737, competencia lingüística, tasas, materiales, kit aeronáutico y seguro. Conviene confirmar precio final, contrato, pagos, depósito, reembolso y condiciones de la garantía laboral.",
    flags: [
      "Precio desde 79.500 €; confirmar precio final contractual.",
      "Confirmar si aplica promoción o descuento.",
      "Confirmar contrato, pagos, depósito y reembolso.",
      "Confirmar coste de alojamiento y transporte.",
      "Confirmar alcance real de la garantía internacional de trabajo previa entrevista.",
    ],
    questions: [
      "¿Qué condiciones aplican al precio desde 79.500 €?",
      "¿Cuál es el precio final sin promoción?",
      "¿Qué calendario de pagos tiene el programa?",
      "¿Qué cubre exactamente la garantía de trabajo previa entrevista?",
      "¿Qué ocurre si el alumno no supera una fase?",
    ],
    costsNote: "Precio “desde” sujeto a condiciones/promociones.",
    estimateNote: "",
  };
}

function getOneAirUniversityAtplProfile(): RouteProfile {
  return {
    announcedText: "132.500 €",
    announcedValue: 132500,
    estimatedText: "140.000 €",
    estimatedValue: 140000,
    gapText: "7.500 €",
    durationText: "Por confirmar",
    basesText: ONE_AIR_BASES,
    modulesPublished: [],
    languageText: ONE_AIR_LANGUAGE,
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "yes",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC Plus" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
      { label: "Transporte", value: "optional", display: "Opcional" },
    ],
    reading:
      "El Programa University ATPL es la ruta más completa de One Air. Añade al Programa Airline Pilot elementos como grado universitario, A320 Type Rating, curso FI(A), más horas prácticas y garantía internacional de trabajo. Es una opción muy completa, pero de coste elevado; antes de pagar conviene confirmar contrato, condiciones exactas del Type Rating, FI, grado, garantía laboral, calendario de pagos y reembolso.",
    flags: [
      "Coste muy elevado; confirmar coste final contractual.",
      "Confirmar condiciones exactas del A320 Type Rating.",
      "Confirmar condiciones del curso FI(A).",
      "Confirmar validez y entidad del grado universitario / Business Degree.",
      "Confirmar alcance real de la garantía internacional de trabajo.",
      "Confirmar contrato, pagos, depósito y reembolso.",
      "Confirmar alojamiento/transporte y costes externos.",
    ],
    questions: [
      "¿El precio de 132.500 € incluye realmente grado, A320 Type Rating y FI(A)?",
      "¿Qué condiciones tiene la garantía internacional de trabajo?",
      "¿Qué ocurre si el alumno no supera el Type Rating o el FI?",
      "¿Cuál es el calendario de pagos?",
      "¿Qué gastos quedan fuera del precio?",
      "¿Se entrega contrato completo antes de pagar?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getOneAirModularProfile(): RouteProfile {
  // Referencia FlyPath: PPL(A) 16.000 € + ME+IR+CPL Pack 36.500 € = 52.500 €.
  // El Pack incluye ME, IR con PBN, CPL(A), APS MCC, NVFR, UPRT, Boeing 737 MAX Level y Airbus A320.
  // Módulos sueltos publicados (notas internas, no se muestran como chips):
  //   PPL(A) 16.000 € · IR SE 13.400 € · PBN 800 € · ME 5.500 € · NVFR 2.600 €
  //   CPL(A) 6.840 € · UPRT 2.100 € · MCC 3.000 € · APS MCC 6.900 €.
  return {
    announcedText: "57.140 €",
    announcedValue: 57140,
    estimatedText: "78.000 €",
    estimatedValue: 78000,
    gapText: "20.860 €",
    durationText: "Variable según módulos",
    basesText: ONE_AIR_BASES,
    modulesPublished: [
      "PPL(A): 16.000 €",
      "IR SE: 13.400 €",
      "PBN: 800 €",
      "ME: 5.500 €",
      "NVFR: 2.600 €",
      "CPL(A): 6.840 €",
      "UPRT: 2.100 €",
      "MCC: 3.000 €",
      "APS MCC: 6.900 €",
      "ME+IR+CPL: 26.900 €",
      "ME+IR+CPL Pack: 36.500 €",
    ],
    languageText: ONE_AIR_LANGUAGE,
    class1Text: "Requerida para módulos profesionales; PPL requiere Clase 2.",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
      { label: "Transporte", value: "optional", display: "Opcional" },
    ],
    reading:
      "One Air publica módulos sueltos y packs modulares avanzados. Para una comparación prudente, FlyPath toma como precio anunciado la suma de módulos sueltos principales (PPL(A), IR SE, PBN, ME, NVFR, CPL(A), UPRT, MCC y APS MCC). Aun así, ese total puede no representar una ruta modular completa desde cero, porque podría faltar hour building/time building hasta alcanzar las horas requeridas para CPL/IR. FlyPath añade una estimación prudente por hour building, horas extra, costes externos y posibles diferencias según el punto de partida del alumno.",
    flags: [
      "El coste modular real depende del punto de partida del alumno y de las horas PIC/time building pendientes.",
      "Confirmar si conviene ruta por módulos sueltos o ME+IR+CPL Pack antes de comparar precio.",
      "Confirmar calendario de pagos, depósito, financiación y política de reembolso por módulo.",
      "No comparar con un integrado sin igualar horas totales, alcance y conceptos incluidos.",
    ],
    questions: [
      "¿Qué itinerario modular recomiendan según mi punto de partida y horas actuales?",
      "¿Cuántas horas de hour building/time building necesitaría antes del CPL/IR?",
      "¿El presupuesto por módulos sueltos cubre todas las horas mínimas necesarias?",
      "¿Qué calendario de pagos, depósito y financiación aplica por módulo?",
      "¿Qué ocurre si abandono o no supero una fase?",
    ],
    costsNote:
      "Suma de módulos publicados. No equivale necesariamente a una ruta completa desde cero.",
    estimateNote: "",
  };
}

const EAS_BCN_BASES = "Barcelona · Sabadell";
const EAS_BCN_FLEET =
  "Tecnam P2002JF, Tecnam P2008JC, P-Mentor, Tecnam P2006T y C150 Aerobat.";

function getEasBcnIntegratedProfile(): RouteProfile {
  return {
    announcedText: "99.700 €",
    announcedValue: 99700,
    estimatedText: "105.000 €",
    estimatedValue: 105000,
    gapText: "5.300 €",
    durationText: "18 meses",
    basesText: EAS_BCN_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Sí",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "unknown",
    financingNote:
      "Pagos: 20.000 € al inicio + 4.275 €/mes x 18. Otras formas de pago pueden considerarse.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí · primera convocatoria" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "EAS Barcelona publica un dossier bastante completo del Integrado ATPL 2026: precio total, tasas de examen, calendario de pagos, duración, horas, flota, MCC APS A320, UPRT, PBN, materiales, iPad/libros ATPL, uniforme y alojamiento opcional. Aun así, conviene confirmar contrato completo, política de reembolso, financiación, vigencia del precio y costes externos antes de pagar.",
    flags: [
      "Confirmar vigencia del precio 2026 antes de pagar.",
      "Confirmar contrato completo y política de reembolso.",
      "Confirmar si la financiación está disponible y en qué condiciones.",
      "Confirmar costes externos: alojamiento, transporte y manutención.",
      "Confirmar si las tasas y exámenes incluidos cubren solo primera convocatoria.",
    ],
    questions: [
      "¿El precio total de 99.700 € sigue vigente para la próxima convocatoria?",
      "¿Qué ocurre si no supero una fase o abandono el curso?",
      "¿Qué política de reembolso aplica?",
      "¿Hay financiación o pago alternativo disponible?",
      "¿Qué costes quedan fuera del precio publicado?",
      "¿Las tasas y exámenes incluidos cubren solo la primera convocatoria?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getEasBcnModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Por confirmar",
    basesText: EAS_BCN_BASES,
    modulesPublished: [],
    languageText: "Por confirmar",
    class1Text: "Por confirmar según módulo",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "optional", display: "Opcional" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "EAS Barcelona publica información sólida del Integrado ATPL, pero no se ha localizado un desglose público suficiente de cursos modulares, precios por módulo, pagos, tasas o skill tests. Esta ruta debe considerarse pendiente hasta recibir presupuesto modular completo por email.",
    flags: [
      "No hay precios modulares publicados en abierto.",
      "No hay desglose público suficiente de módulos, pagos, tasas ni skill tests.",
      "No comparar esta ruta con un integrado hasta recibir presupuesto modular completo.",
      "Confirmar por email qué módulos están disponibles actualmente y qué incluye cada uno.",
    ],
    questions: [
      "¿Qué cursos modulares ofrecen actualmente?",
      "¿Cuál es el precio actualizado de cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Hay financiación para cursos modulares?",
      "¿Se entrega contrato completo antes de pagar cada módulo?",
    ],
    costsNote:
      "Ruta modular sin precios ni módulos publicados en abierto. Solicitar información por email.",
    estimateNote: "",
  };
}

const FTE_JEREZ_BASES =
  "Jerez de la Frontera · Aeropuerto de Jerez / Base Aérea La Parra";
const FTE_JEREZ_FLEET =
  "Piper PA28 Warrior, Piper PA28 Archer DTX, Diamond DA42, Robin R2160 y Citabria High Country Explorer.";

function getFteJerezIntegratedProfile(): RouteProfile {
  return {
    announcedText: "129.500 €",
    announcedValue: 129500,
    estimatedText: "135.000 €",
    estimatedValue: 135000,
    gapText: "5.500 €",
    durationText: "62 semanas de formación",
    basesText: FTE_JEREZ_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Sí",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "unknown",
    financingNote:
      "Pagos EASA: 5.500 € depósito + 29.000 € antes del inicio + 25.000 € semana 20 + 25.000 € semana 30 + 25.000 € semana 40 + 20.000 € semana 50.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí · primer intento" },
      { label: "Skill tests", value: "yes", display: "Sí · primer intento" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "yes", display: "Sí · full board" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "FTEJerez publica una información muy completa del AFOP: precio EASA 2026, calendario de pagos, duración, horas, alojamiento full board, uniforme, material, primer intento de exámenes, landing/navigation fees, APS MCC y A-UPRT. Aun así, conviene confirmar vigencia del precio, política de reembolso, financiación, condiciones del contrato y costes por formación adicional si el alumno necesita horas extra.",
    flags: [
      "Precio alto; validar todos los costes externos antes de pagar.",
      "El precio puede cambiar y la escuela indica que puede ajustarse si hay errores o cambios.",
      "Formación adicional fuera del syllabus puede cobrarse aparte.",
      "El curso puede extenderse por circunstancias adversas o cambios regulatorios.",
      "Confirmar política de reembolso y condiciones contractuales antes del depósito.",
    ],
    questions: [
      "¿El precio EASA de 129.500 € sigue vigente para la próxima convocatoria?",
      "¿Qué gastos quedan fuera del precio publicado?",
      "¿Qué ocurre si necesito formación adicional fuera del syllabus?",
      "¿Cuál es la política de reembolso si abandono o no supero una fase?",
      "¿Hay financiación disponible para alumnos self-sponsored?",
      "¿El primer intento de exámenes incluye tanto teoría como vuelo?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getFteJerezModularProfile(): RouteProfile {
  return {
    announcedText: "49.800 €",
    announcedValue: 49800,
    estimatedText: "60.000 €",
    estimatedValue: 60000,
    gapText: "10.200 €",
    durationText: "12 semanas CPL/IR + 3–5 semanas APS MCC",
    basesText: "Jerez de la Frontera · FTE Campus",
    modulesPublished: [
      "Advanced Flight Training CPL/IR: 41.500 €",
      "APS MCC: 8.300 €",
      "MCC standalone: 4.400 €",
      "A-UPRT: Por confirmar",
    ],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "yes",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "no", display: "No" },
      { label: "Skill tests", value: "no", display: "No" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "yes", display: "Sí · CPL-IR; opcional APS MCC" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "FTEJerez FD+ no es una ruta modular desde cero, sino una fase avanzada para pilotos PPL con experiencia previa. El precio publicado cubre Advanced Flight Training CPL/IR + APS MCC, pero puede variar si el alumno no cumple los créditos/horas de entrada o necesita entrenamiento adicional. Además, licence issue y skill test fees no están incluidos.",
    flags: [
      "No es una ruta modular desde cero; exige PPL y experiencia previa.",
      "El precio CPL/IR de 41.500 € asume un crédito de 10 horas por experiencia previa.",
      "Si el crédito no aplica, el CPL/IR sube a 46.400 €.",
      "Licence issue y skill test fees no están incluidos.",
      "Los alumnos que no cumplan requisitos de licencia necesitarán presupuesto personalizado.",
    ],
    questions: [
      "¿Qué requisitos exactos tendría que cumplir antes de entrar en FD+?",
      "¿Aplica en mi caso el crédito de 10 horas o el precio subiría a 46.400 €?",
      "¿Qué licence issue fees y skill test fees quedarían fuera?",
      "¿Qué calendario de pagos y depósito aplica para CPL/IR y APS MCC?",
      "¿El FD+ completo incluye acceso al career assistance / airline placement programme?",
      "¿Qué coste tendría completar las horas o requisitos que me falten antes de entrar?",
    ],
    costsNote:
      "Suma de módulos publicados. No equivale necesariamente a una ruta completa desde cero.",
    estimateNote: "",
  };
}

const CESDA_HEADER_LOCATION = "Reus · Aeropuerto de Reus / Aeropuerto de Lleida";
const CESDA_BASES =
  "Campus Aeronáutico de Reus · Aeropuerto Internacional de Reus · Aeropuerto Internacional de Lleida";
const CESDA_FLEET = "Diamond DA20-C1, Diamond DA42NG y Piper PA-28R-201.";

function getCesdaDegreeAtplProfile(): RouteProfile {
  return {
    announcedText: "130.800 €",
    announcedValue: 130800,
    estimatedText: "140.000 €",
    estimatedValue: 140000,
    gapText: "9.200 €",
    durationText: "4 cursos académicos",
    basesText: CESDA_BASES,
    modulesPublished: [],
    languageText: "Por confirmar",
    class1Text: "Requerida",
    scheduleSummary: "Sí",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote:
      "Pagos: matrícula anual fraccionable en 1, 2, 4 o 9 cuotas sin coste añadido. Cada curso tiene un coste publicado de 32.700 €, pendiente de aprobación para abril de 2026.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "no", display: "No" },
      { label: "Skill tests", value: "no", display: "No · evaluadores externos aparte" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "CESDA combina un grado universitario oficial con la obtención de la licencia ATPL. Publica una estructura completa de servicios: 285 h totales, 170 h de vuelo real, simulador básico, MCC en simulador A320, UPRT, PBN, material de vuelo, iPad, uniforme y apoyo a la inserción profesional. El precio publicado es de 32.700 € por curso, con un total base de 130.800 €, aunque está pendiente de aprobación en abril de 2026 y puede variar por IPC y tasas aeroportuarias. Además, las tasas de exámenes AESA y evaluadores externos van aparte, por lo que conviene confirmar el coste final antes de pagar.",
    flags: [
      "Precio pendiente de aprobación en abril de 2026.",
      "El coste de 2º, 3º y 4º puede variar por IPC y tasas aeroportuarias.",
      "Tasas de exámenes AESA y evaluadores externos no incluidas.",
      "Confirmar contrato, depósito y política de reembolso.",
      "No tratar la inserción laboral o acuerdos con aerolíneas como garantía de empleo.",
      "Confirmar costes de alojamiento, transporte y vida en Reus/Lleida.",
    ],
    questions: [
      "¿El precio de 32.700 € por curso está aprobado para 2026?",
      "¿Cuál sería el coste final estimado incluyendo tasas AESA y evaluadores externos?",
      "¿Qué depósito o reserva hay que pagar?",
      "¿Cuál es la política de reembolso si abandono o no supero una fase?",
      "¿Qué materiales exactos están incluidos?",
      "¿Hay alojamiento o acuerdos con residencias?",
      "¿Qué condiciones reales tiene el apoyo a la inserción laboral?",
      "¿Existe alguna ruta modular separada o solo el Grado + ATPL?",
    ],
    costsNote:
      "Coste por aprobar en abril de 2026. A partir de 2º, 3º y 4º puede variar por IPC y tasas aeroportuarias.",
    estimateNote: "",
  };
}

const BFS_BASES = "Barcelona · Sabadell";
const BFS_FLEET =
  "C152, P92, C172R-S, P2006T, FNPT II P2006T y FNPT II B737-800NG";

function getBfsIntegratedProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "18–24 meses",
    basesText: BFS_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio, depósito, calendario de pagos y condiciones económicas pendientes de confirmar por email.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC B737-800NG" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "unknown", display: "Por confirmar" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "yes", display: "Sí · iPad y material online" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Barcelona Flight School publica información operacional del Integrated ATPL / Airline Pilot Programme: duración estimada de 18–24 meses, 230 h de instrucción de vuelo, APS MCC en FNPT II B737-800NG, Advanced UPRT, material online con iPad incluido y flota/simuladores publicados. Sin embargo, no se ha localizado precio público, calendario de pagos, depósito, contrato ni política de reembolso, por lo que esta escuela debe quedar pendiente de presupuesto actualizado por email antes de compararla económicamente.",
    flags: [
      "Precio del integrado no publicado en abierto.",
      "No se puede comparar económicamente con otras escuelas hasta recibir presupuesto completo.",
      "Confirmar si tasas, skill tests, PBN, alojamiento y transporte están incluidos.",
      "Confirmar calendario de pagos, depósito, contrato y política de reembolso.",
      "Confirmar vigencia del programa, disponibilidad real de aeronaves y condiciones de acceso.",
    ],
    questions: [
      "¿Cuál es el precio actualizado del Integrated ATPL / Airline Pilot Programme?",
      "¿Qué incluye exactamente el precio?",
      "¿Las tasas, skill tests y PBN están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Hay financiación disponible?",
      "¿El alojamiento o transporte están incluidos u ofrecidos como opción?",
    ],
    costsNote:
      "No se ha localizado precio público del Integrated ATPL en la web revisada. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

function getBfsModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: BFS_BASES,
    modulesPublished: [
      "PPL: Precio no publicado",
      "Night Rating: Precio no publicado",
      "ATPL teórico: Precio no publicado",
      "CPL: Precio no publicado",
      "IR: Precio no publicado",
      "ME: Precio no publicado",
      "MCC / APS MCC: Precio no publicado",
      "UPRT: Precio no publicado",
      "PBN: Precio no publicado",
    ],
    languageText: "Por confirmar",
    class1Text: "Por confirmar según módulo",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precios por módulo, pagos, depósito y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Barcelona Flight School ofrece cursos modulares, pero no se han localizado precios públicos por módulo ni un desglose económico suficiente. Para comparar esta ruta con otras escuelas, primero habría que pedir por email la lista actualizada de módulos, precios, duración, horas, tasas, skill tests, materiales, calendario de pagos y condiciones de reembolso.",
    flags: [
      "No hay precios modulares publicados en abierto.",
      "No hay desglose económico suficiente por módulo.",
      "No comparar esta ruta con un integrado hasta recibir presupuesto modular completo.",
      "Confirmar qué módulos están disponibles actualmente y qué incluye cada uno.",
      "Confirmar tasas, skill tests, materiales, pagos, depósito y reembolso.",
    ],
    questions: [
      "¿Qué cursos modulares ofrecen actualmente?",
      "¿Cuál es el precio actualizado de cada módulo?",
      "¿Qué duración y horas tiene cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Hay financiación para cursos modulares?",
      "¿Se entrega contrato completo antes de pagar cada módulo?",
      "¿Qué ocurre si abandono o no supero una fase?",
    ],
    costsNote:
      "Barcelona Flight School publica oferta modular, pero no se han localizado precios públicos por módulo. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

const FBY_BASES = "Burgos · Logroño";
const FBY_FLEET =
  "45 aviones: Tecnam P2008JC, P-Mentor, P2002JF, PS-28 Cruiser, Cessna 172, Piper PA-28, Super Decathlon y Tecnam P2006T";
const FBY_SIM = "FNPT II Tecnam P2006T, A320/MCC y otros dispositivos";

function getFlybyIntegratedProfile(): RouteProfile {
  return {
    announcedText: "79.500 €",
    announcedValue: 79500,
    estimatedText: "82.000 €",
    estimatedValue: 82000,
    gapText: "2.500 €",
    durationText: "14 meses",
    basesText: FBY_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary:
      "1.000 € inscripción + 19.000 € matrícula + 14 cuotas de 4.250 €",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Pagos: 1.000 € inscripción/test online + 19.000 € matrícula tras admisión + 14 cuotas de 4.250 €.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC 40 h A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "yes", display: "Sí · habitación individual y comidas" },
      { label: "Transporte", value: "yes", display: "Sí · shuttle diario" },
    ],
    reading:
      "FlyBy publica uno de los paquetes integrados más cerrados en precio: 79.500 € con alojamiento, manutención, transporte, material, tasas, skill tests, PBN, Advanced UPRT y APS MCC incluidos. Esto facilita mucho la planificación económica. Aun así, antes de pagar conviene pedir contrato completo, política de reembolso y condiciones de repeticiones, horas extra o retrasos, porque esos puntos no quedan suficientemente claros en abierto.",
    flags: [
      "Contrato completo y política de reembolso no localizados en abierto.",
      "Confirmar costes de repeticiones, horas extra o exámenes adicionales.",
      "Confirmar condiciones exactas de alojamiento y manutención durante todo el programa.",
      "Confirmar disponibilidad real de flota y bimotores en periodos de alta demanda.",
      "Confirmar financiación externa si el alumno la necesita.",
    ],
    questions: [
      "¿Se entrega contrato completo antes de pagar la matrícula?",
      "¿Cuál es la política de reembolso o cancelación?",
      "¿Qué ocurre si necesito horas extra o repito exámenes/skill tests?",
      "¿El alojamiento y manutención están incluidos durante los 14 meses completos?",
      "¿Hay financiación externa disponible?",
      "¿Qué ocurre si hay retrasos por meteorología, mantenimiento o disponibilidad?",
    ],
    costsNote:
      "Precio publicado como todo incluido. Confirmar contrato, reembolso y costes de repeticiones.",
    estimateNote: "",
  };
}

function getFlybyDegreeProfile(): RouteProfile {
  return {
    announcedText: "89.500 €",
    announcedValue: 89500,
    estimatedText: "92.000 €",
    estimatedValue: 92000,
    gapText: "2.500 €",
    durationText: "3 años",
    basesText: FBY_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary:
      "1.000 € inscripción + 41.000 € primer año + 32.000 € segundo + 15.500 € tercero",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Pagos: 1.000 € inscripción + 41.000 € primer año + 32.000 € segundo año + 15.500 € tercer año.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC 40 h A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí · por confirmar alcance universitario" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "partial", display: "Parcial · confirmar duración" },
      { label: "Transporte", value: "partial", display: "Parcial · confirmar duración" },
    ],
    reading:
      "El Grado + ATPL de FlyBy combina el ATPL integrado con una titulación universitaria, extendiendo la duración a 3 años y elevando el precio a 89.500 €. La ruta puede aportar valor para quien quiera una titulación académica además de la licencia, pero debe confirmarse qué alojamiento, manutención y transporte están incluidos durante los años 2 y 3, si existen tasas universitarias adicionales y qué ocurre si el alumno no completa la parte académica.",
    flags: [
      "Confirmar si alojamiento y manutención cubren los 3 años o solo la fase ATPL.",
      "Contrato completo y reembolso no publicados.",
      "Confirmar posibles tasas universitarias, repeticiones o costes académicos adicionales.",
      "Mayor duración que el integrado directo.",
      "No comparar solo por precio sin valorar coste de oportunidad de 3 años.",
    ],
    questions: [
      "¿El alojamiento y manutención están incluidos durante los 3 años o solo en la fase ATPL?",
      "¿Hay tasas universitarias adicionales?",
      "¿Qué ocurre si no completo la parte universitaria?",
      "¿Se firma un único contrato o contratos separados?",
      "¿Cuál es la política de reembolso?",
      "¿Hay financiación o becas?",
      "¿Qué diferencia práctica aporta frente al integrado de 14 meses?",
    ],
    costsNote:
      "ATPL integrado + BSc/degree. Confirmar tasas universitarias, alojamiento y condiciones completas.",
    estimateNote: "",
  };
}

function getFlybyCadetProfile(): RouteProfile {
  return {
    announcedText: "91.400 € / 101.600 €",
    announcedValue: 101600,
    estimatedText: "95.000 € / 105.000 €",
    estimatedValue: 105000,
    gapText: "3.600 € / 3.400 €",
    durationText: "29 meses",
    basesText: FBY_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary:
      "1.000 € inscripción + 19.000 € matrícula + 17 cuotas de 4.200 € (Basic) o 4.800 € (All-Inclusive)",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Pagos: 1.000 € inscripción + 19.000 € matrícula + 17 cuotas de 4.200 € Basic o 4.800 € All-Inclusive. Condiciones del puesto FI pendientes de confirmar.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC 40 h A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "partial", display: "Según paquete" },
      { label: "Transporte", value: "partial", display: "Según paquete" },
    ],
    reading:
      "El Cadet ATPL + FI de FlyBy combina el ATPL integrado con el curso de instructor y un periodo posterior como instructor indicado por la escuela, con mínimo 600 h de vuelo. Puede ser interesante para quien quiera acumular experiencia tras la licencia, pero el punto crítico es contractual: hay que confirmar salario, duración, obligaciones, permanencia, condiciones del puesto FI y qué ocurre si el alumno no supera alguna fase. También hay que diferenciar bien el paquete Basic del All-Inclusive.",
    flags: [
      "Condiciones laborales del puesto FI no publicadas con suficiente detalle.",
      "Confirmar salario, duración, permanencia y obligaciones.",
      "Basic y All-Inclusive tienen diferencias relevantes de alojamiento/manutención.",
      "Contrato completo y reembolso no publicados.",
      "Confirmar costes de repeticiones, horas extra y exámenes adicionales.",
      "No tratar el puesto de instructor como garantía sin revisar contrato.",
    ],
    questions: [
      "¿Cuál es el salario del puesto de instructor?",
      "¿Qué contrato laboral se firma y con qué duración?",
      "¿Existe compromiso de permanencia?",
      "¿Qué ocurre si no supero el curso FI?",
      "¿Qué diferencia exacta hay entre Basic y All-Inclusive?",
      "¿El alojamiento está incluido durante la fase FI y el empleo?",
      "¿Cuál es la política de reembolso?",
      "¿Hay financiación externa?",
    ],
    costsNote:
      "Basic sin alojamiento completo; All-Inclusive con alojamiento/manutención. Confirmar contrato laboral FI.",
    estimateNote:
      "Cadet Basic 91.400 € → estimado 95.000 € (brecha 3.600 €). Cadet All-Inclusive 101.600 € → estimado 105.000 € (brecha 3.400 €). Barras de coste referidas al paquete All-Inclusive.",
  };
}

const APA_BASES = "Requena · Aeródromo de Requena";

const apaExtrasItems = [
  { label: "MCC/JOC", value: "unknown", display: "Por confirmar" },
  { label: "Advanced UPRT", value: "unknown", display: "Por confirmar" },
  { label: "PBN", value: "unknown", display: "Por confirmar" },
  { label: "Tasas", value: "unknown", display: "Por confirmar" },
  { label: "Skill tests", value: "unknown", display: "Por confirmar" },
  { label: "Materiales", value: "unknown", display: "Por confirmar" },
  { label: "Alojamiento", value: "optional", display: "Opcional · por confirmar" },
  { label: "Transporte", value: "unknown", display: "Por confirmar" },
];

function getAirpullBasicProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "15 meses",
    basesText: APA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio, depósito, calendario de pagos, financiación y condiciones pendientes de confirmar por email.",
    extrasItems: apaExtrasItems,
    reading:
      "Airpull Aviation Academy publica una opción ATPL Basic de 15 meses con 155 h de vuelo y 40 h de simulador. Su principal punto diferencial es operar desde el aeródromo de Requena, con base propia, lo que puede simplificar la operación diaria. Sin embargo, no se ha localizado precio público, contrato, calendario de pagos, reembolso, flota detallada, simuladores ni desglose completo de extras. Antes de comparar esta opción, es necesario pedir el dossier oficial por email.",
    flags: [
      "Precio del ATPL Basic no publicado en abierto.",
      "Contrato, depósito, calendario de pagos y reembolso no publicados.",
      "Flota y simuladores no suficientemente detallados.",
      "Tasas, skill tests, materiales, PBN, UPRT y MCC pendientes de confirmar.",
      "Confirmar si el alojamiento está incluido, es opcional o solo orientativo.",
      "No comparar económicamente hasta recibir presupuesto oficial.",
    ],
    questions: [
      "¿Cuál es el precio actualizado del ATPL Basic?",
      "¿Qué incluye exactamente el precio?",
      "¿Cuántas horas de vuelo y simulador hay por fase?",
      "¿Qué flota y simuladores se usan?",
      "¿MCC, UPRT y PBN están incluidos?",
      "¿Tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Hay alojamiento o financiación?",
    ],
    costsNote:
      "No se ha localizado precio público del ATPL Basic. Solicitar dossier y presupuesto actualizado por email.",
    estimateNote: "",
  };
}

function getAirpullAdvancedProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "15 meses",
    basesText: APA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio, depósito, calendario de pagos, financiación y condiciones pendientes de confirmar por email.",
    extrasItems: apaExtrasItems,
    reading:
      "El ATPL Advanced de Airpull mantiene la duración de 15 meses, pero aumenta las horas de vuelo publicadas hasta 195 h. Puede ser más interesante que el Basic si el incremento de horas está bien distribuido entre fases útiles, pero faltan datos críticos: precio, desglose de horas, flota, simuladores, contrato, reembolso, pagos y extras incluidos. Conviene pedir el dossier completo antes de compararlo.",
    flags: [
      "Precio del ATPL Advanced no publicado en abierto.",
      "No se publica el desglose exacto de las horas adicionales frente al Basic.",
      "Contrato, depósito, calendario de pagos y reembolso no publicados.",
      "Flota y simuladores no suficientemente detallados.",
      "Tasas, skill tests, materiales, PBN, UPRT y MCC pendientes de confirmar.",
      "No comparar con Basic o Premium sin precio y desglose de horas.",
    ],
    questions: [
      "¿Cuál es el precio actualizado del ATPL Advanced?",
      "¿Qué diferencia exacta tiene frente al Basic?",
      "¿Dónde se añaden las horas extra?",
      "¿Cuántas horas de vuelo y simulador hay por fase?",
      "¿Qué flota y simuladores se usan?",
      "¿MCC, UPRT y PBN están incluidos?",
      "¿Tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Cuál es la política de reembolso?",
    ],
    costsNote:
      "No se ha localizado precio público del ATPL Advanced. Solicitar dossier y presupuesto actualizado por email.",
    estimateNote: "",
  };
}

function getAirpullPremiumProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "15 meses",
    basesText: APA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio, depósito, calendario de pagos, financiación y condiciones pendientes de confirmar por email.",
    extrasItems: apaExtrasItems,
    reading:
      "El ATPL Premium de Airpull se presenta como la opción más completa, con más horas de monomotor complejo, multimotor y simulador. Sin embargo, no se han localizado precio, horas exactas, desglose operativo, contrato, reembolso, pagos ni extras incluidos. Sin esos datos, no se puede valorar si el Premium aporta suficiente valor frente al Basic o Advanced. Debe quedar pendiente de dossier oficial por email.",
    flags: [
      "Precio del ATPL Premium no publicado en abierto.",
      "Horas exactas y desglose operativo no publicados.",
      "No se puede valorar la diferencia real frente a Basic y Advanced.",
      "Contrato, depósito, calendario de pagos y reembolso no publicados.",
      "Flota, simuladores, tasas, skill tests y materiales pendientes de confirmar.",
      "No comparar económicamente hasta recibir presupuesto oficial.",
    ],
    questions: [
      "¿Cuál es el precio actualizado del ATPL Premium?",
      "¿Qué diferencia exacta tiene frente al Basic y Advanced?",
      "¿Cuántas horas de vuelo y simulador incluye?",
      "¿Cuántas horas son en monomotor complejo, multimotor y simulador?",
      "¿Qué flota y simuladores se usan?",
      "¿MCC, UPRT y PBN están incluidos?",
      "¿Tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Cuál es la política de reembolso?",
    ],
    costsNote:
      "No se ha localizado precio público del ATPL Premium. Solicitar dossier y presupuesto actualizado por email.",
    estimateNote: "",
  };
}

const WAFA_BASES = "Málaga · Madrid / Cuatro Vientos";

function getWorldAviationModularProfile(): RouteProfile {
  return {
    announcedText: "Parcial",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: WAFA_BASES,
    modulesPublished: [
      "PPL(A): 9.907 €",
      "ATPL modular desde PPL: 25.221 €",
      "ATPL modular desde CPL: 16.029 €",
      "CPL modular con IR: 3.425 €",
      "CPL modular sin IR: 7.211 €",
      "IR: Precio no publicado",
      "MEP: Precio no publicado",
      "MCC: Precio no publicado",
      "A-UPRT: Precio no publicado",
    ],
    languageText: "Español / Inglés",
    class1Text: "Requerida para fases profesionales",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precios por módulo parcialmente publicados. Contrato, pagos, depósito, financiación y reembolso pendientes de confirmar por email.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "no", display: "No · por confirmar según módulo" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "no", display: "No" },
    ],
    reading:
      "World Aviation Flight Academy parece centrarse en formación modular. Publica precios parciales para PPL, ATPL modular y CPL modular, lo que ayuda a estimar algunas fases, pero no permite calcular con seguridad una ruta profesional completa desde cero. Faltan precios de IR, MEP, MCC, A-UPRT, tasas, skill tests, materiales, pagos, contrato, reembolso, financiación y flota/simuladores detallados. Antes de compararla económicamente, habría que pedir un presupuesto completo por email según el punto de partida del alumno.",
    flags: [
      "No hay precio publicado de una ruta profesional completa desde cero.",
      "Los precios disponibles son parciales y dependen del punto de partida del alumno.",
      "Faltan precios claros de IR, MEP, MCC y A-UPRT.",
      "Flota y simuladores no suficientemente publicados.",
      "Contrato, depósito, pagos y reembolso no publicados.",
      "No comparar con integrados o modulares completos sin presupuesto oficial cerrado.",
    ],
    questions: [
      "¿Cuál sería el coste total desde PPL hasta CPL/IR/ME/MCC/A-UPRT?",
      "¿Qué módulos son obligatorios según mi punto de partida?",
      "¿Cuál es el precio actualizado de IR, MEP, MCC y A-UPRT?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Cuál es la flota actual y qué simuladores usan?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso o cancelación?",
      "¿Hay financiación o alojamiento disponible?",
    ],
    costsNote:
      "Precios modulares parciales publicados. No equivale necesariamente a una ruta completa desde cero.",
    estimateNote:
      "CPL modular: 3.425 € (15 h con IR previo) / 7.211 € (25 h sin IR). PPL(A): 9.907 €. ATPL modular desde PPL: 25.221 €. ATPL modular desde CPL: 16.029 €.",
  };
}

const FAA_BASES = "Madrid · Cuatro Vientos / Mallorca · Son Bonet";
const FAA_SIM = "Airbus A320 / B737 y FNPT II por confirmar";

function getFaaProfesionalProfile(): RouteProfile {
  return {
    announcedText: "80.000 €",
    announcedValue: 80000,
    estimatedText: "82.000 €",
    estimatedValue: 82000,
    gapText: "2.000 €",
    durationText: "Por confirmar",
    basesText: FAA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio total publicado: 80.000 €. Calendario de pagos, depósito, financiación y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "El Programa Profesional 250 h de Flyschool Air Academy publica un precio de 80.000 € e incluye 150 h de vuelo, 100 h de simulador, 1.200 h de teoría y varios extras relevantes como PBN, UPRT, APS MCC, certificado médico, iPad, kit de vuelo, uniforme, tasas y skill tests. El punto débil es documental: no se ha localizado contrato, política de reembolso, depósito, calendario de pagos, financiación ni detalle completo de flota. También conviene confirmar la logística entre Madrid y Mallorca.",
    flags: [
      "Contrato y política de reembolso no publicados.",
      "Calendario de pagos y depósito no publicados.",
      "Flota completa no detallada.",
      "Alojamiento no incluido.",
      "Confirmar logística real entre Madrid y Mallorca.",
      "Confirmar costes de repetición si se suspenden exámenes o skill tests.",
    ],
    questions: [
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso o cancelación?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Existe financiación?",
      "¿Cuál es la flota total y cuántos aviones multimotor hay?",
      "¿Cómo se reparte la formación entre Madrid y Mallorca?",
      "¿Qué coste tiene repetir exámenes o skill tests?",
      "¿Hay alojamiento o convenios con residencias?",
    ],
    costsNote:
      "Precio publicado con extras incluidos. Confirmar contrato, pagos, reembolso, alojamiento y posibles costes de repetición.",
    estimateNote: "",
  };
}

function getFaaAdvanceProfile(): RouteProfile {
  return {
    announcedText: "84.000 €",
    announcedValue: 84000,
    estimatedText: "86.000 €",
    estimatedValue: 86000,
    gapText: "2.000 €",
    durationText: "Por confirmar",
    basesText: FAA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio total publicado: 84.000 €. Calendario de pagos, depósito, financiación y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "El Programa Advance 275 h aumenta las horas de simulador respecto al paquete Profesional, con 150 h de vuelo y 125 h de simulador, incluyendo 65 h A320 según la información publicada. El precio anunciado es de 84.000 €. Puede ser interesante para quien valore más entrenamiento en simulador, pero antes de decidir conviene confirmar contrato, pagos, reembolso, financiación, flota real y costes de repetición.",
    flags: [
      "Contrato y reembolso no publicados.",
      "Calendario de pagos y depósito no publicados.",
      "Confirmar valor real de las horas adicionales de simulador frente al Profesional 250 h.",
      "Flota completa no detallada.",
      "Alojamiento no incluido.",
      "Confirmar costes de repetición.",
    ],
    questions: [
      "¿Qué diferencia exacta aporta el Advance frente al Profesional 250 h?",
      "¿Las 65 h A320 son en FFS, FNPT II u otro dispositivo?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Existe financiación?",
      "¿Cuál es la flota total?",
      "¿Qué coste tiene repetir exámenes o skill tests?",
    ],
    costsNote:
      "Paquete con más simulador que el Profesional 250 h. Confirmar contrato, pagos, reembolso y condiciones.",
    estimateNote: "",
  };
}

function getFaaCadetProfile(): RouteProfile {
  return {
    announcedText: "95.000 €",
    announcedValue: 95000,
    estimatedText: "98.000 €",
    estimatedValue: 98000,
    gapText: "3.000 €",
    durationText: "Por confirmar",
    basesText: FAA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "La escuela menciona contrato laboral tras el curso FI, pero no se han localizado condiciones públicas de salario, duración, permanencia u obligaciones.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "El Programa Cadet 500 h es la opción más amplia de Flyschool Air Academy, con precio publicado de 95.000 €, 180 h de vuelo, 100 h de simulador, curso FI y un contrato laboral indicado por la escuela. Puede ser atractivo para quien busque acumular experiencia como instructor, pero el punto crítico es confirmar por escrito las condiciones laborales: salario, duración, horas, permanencia, obligaciones y qué ocurre si el alumno no supera alguna fase.",
    flags: [
      "Condiciones del contrato laboral no publicadas.",
      "Confirmar salario, duración, permanencia y obligaciones del puesto FI.",
      "Contrato de formación y política de reembolso no publicados.",
      "Calendario de pagos y depósito no publicados.",
      "Alojamiento no incluido.",
      "Confirmar costes de repetición y horas adicionales.",
    ],
    questions: [
      "¿En qué consiste exactamente el contrato laboral tras el FI?",
      "¿Cuál es el salario, duración y número de horas garantizadas?",
      "¿Hay compromiso de permanencia?",
      "¿Qué ocurre si no supero el curso FI?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Existe financiación?",
    ],
    costsNote:
      "Incluye curso FI y contrato laboral indicado por la escuela. Confirmar condiciones reales por escrito.",
    estimateNote: "",
  };
}

const PNM_BASES = "Mallorca · Valencia · Castellón";
const PNM_FLEET =
  "Cessna F150/F172, Piper Arrow, Piper Turbo Arrow, Tecnam P-Mentor y Piper Turbo Seneca III";
const PNM_SIM =
  "Airbus A320 FFS, FNPT II Beechcraft King Air B200 y otros dispositivos de entrenamiento";

function getPanamediaIntegratedProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "828 h de teoría + fase práctica",
    basesText: PNM_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote:
      "Precio, depósito, calendario de pagos y condiciones pendientes de confirmar por email. La web menciona financiación mediante BBVA.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC 35 h" },
      { label: "Advanced UPRT", value: "unknown", display: "Por confirmar" },
      { label: "PBN", value: "yes", display: "Sí · dentro de IR-PBN" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Panamedia publica bastante información operacional del ATPL integrado: bases en Mallorca, Valencia y Castellón, flota variada, simuladores, 828 h de teoría y 261 h de instrucción práctica entre vuelo y simulador. La parte económica queda pendiente: no se ha localizado precio público, contrato, calendario de pagos, depósito, reembolso ni desglose de tasas, skill tests, materiales o alojamiento. Antes de compararla por coste, es necesario pedir dossier y presupuesto oficial por email.",
    flags: [
      "Precio del ATPL integrado no publicado en abierto.",
      "Contrato, depósito, calendario de pagos y reembolso no localizados.",
      "Tasas, skill tests, materiales y alojamiento pendientes de confirmar.",
      "Tres bases pueden implicar logística adicional para el alumno.",
      "No comparar económicamente hasta recibir presupuesto completo.",
    ],
    questions: [
      "¿Cuál es el precio total actualizado del ATPL integrado?",
      "¿Qué incluye exactamente el precio?",
      "¿Las tasas, skill tests, materiales y alojamiento están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Qué condiciones tiene la financiación con BBVA?",
      "¿En qué bases se realiza cada fase del curso?",
    ],
    costsNote:
      "No se ha localizado precio público del ATPL integrado. Solicitar dossier y presupuesto actualizado por email.",
    estimateNote: "",
  };
}

function getPanamediaModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "18–36 meses",
    basesText: PNM_BASES,
    modulesPublished: [
      "PPL: Precio no publicado",
      "Time building / tiempo de vuelo: Precio no publicado",
      "NVFR: Precio no publicado",
      "ATPL teórico: Precio no publicado",
      "IR/PBN: Precio no publicado",
      "MEP: Precio no publicado",
      "CPL: Precio no publicado",
      "A-UPRT: Precio no publicado",
      "MCC: Precio no publicado",
    ],
    languageText: "Español / Inglés",
    class1Text: "Por confirmar según módulo",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote:
      "Precios por módulo, pagos, depósito y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Panamedia publica una estructura modular bastante completa, con PPL, tiempo de vuelo, NVFR, ATPL teórico, IR/PBN, MEP, CPL, A-UPRT y MCC. También indica horas aproximadas y duración de 18–36 meses. Sin embargo, no se han localizado precios públicos por módulo ni condiciones económicas suficientes. Para comparar esta ruta con otras modulares, primero habría que pedir presupuesto completo, tasas, skill tests, materiales, pagos, depósito, contrato y reembolso.",
    flags: [
      "No hay precios modulares publicados de forma suficiente.",
      "No hay desglose económico completo por módulo.",
      "Confirmar qué módulos están disponibles actualmente y en qué base se realizan.",
      "Confirmar tasas, skill tests, materiales, pagos, depósito y reembolso.",
      "Confirmar si el alumno necesita hour building/time building adicional.",
      "No comparar esta ruta con otras modulares hasta recibir presupuesto oficial.",
    ],
    questions: [
      "¿Cuál es el precio actualizado de cada módulo?",
      "¿Qué duración y horas tiene cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿En qué base se realiza cada módulo?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Hay financiación para cursos modulares?",
      "¿Se entrega contrato completo antes de pagar cada módulo?",
      "¿Qué ocurre si abandono o no supero una fase?",
    ],
    costsNote:
      "Panamedia publica módulos de ruta modular, pero no se han localizado precios públicos suficientes por módulo. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

const BAA_BASES = "Lleida · Aeródromo de Lleida-Alguaire";
const BAA_FLEET = "10 Cessna 172S y 1 Tecnam P2006T";
const BAA_SIM = "FNPT II Tecnam P2006T";

function getBaaIntegratedProfile(): RouteProfile {
  return {
    announcedText: "108.000 €",
    announcedValue: 108000,
    estimatedText: "115.000 €",
    estimatedValue: 115000,
    gapText: "7.000 €",
    durationText: "16–18 meses",
    basesText: BAA_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio base publicado: 108.000 €. Calendario de pagos, depósito y condiciones económicas pendientes de confirmar por email.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · 16 h MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí · 3 h" },
      { label: "PBN", value: "yes", display: "Sí · dentro de IFR" },
      { label: "Tasas", value: "no", display: "No" },
      { label: "Skill tests", value: "no", display: "No" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "BAA Training Spain publica un ATPL integrado con precio base de 108.000 €, duración de 16–18 meses, 837 h de teoría, 207 h de vuelo, base en Lleida-Alguaire y flota compuesta por Cessna 172S y Tecnam P2006T. La información operacional es razonable, pero el precio no incluye evaluación inicial, Clase 1, ICAO English, tasas CAA, alojamiento ni manutención. Antes de comparar esta escuela por coste real, conviene pedir contrato, calendario de pagos, depósito, reembolso y estimación completa de extras.",
    flags: [
      "Precio elevado sin incluir alojamiento ni manutención.",
      "Evaluación inicial, Clase 1, ICAO English y tasas CAA no incluidos.",
      "Skill tests y tasas deben confirmarse antes de pagar.",
      "Flota publicada en España limitada: 10 Cessna 172S y 1 Tecnam P2006T.",
      "Falta contrato, depósito, calendario de pagos y política de reembolso en abierto.",
      "No comparar solo por precio base sin sumar extras externos.",
    ],
    questions: [
      "¿Cuál es el calendario completo de pagos y depósito?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso o cancelación?",
      "¿Cuánto cuestan evaluación inicial, Clase 1, ICAO English, tasas CAA y skill tests?",
      "¿Hay financiación disponible?",
      "¿Existe alojamiento o convenio de residencia en Lleida?",
      "¿Qué ocurre si necesito horas extra o repetir exámenes?",
    ],
    costsNote:
      "No incluye evaluación inicial, Clase 1, ICAO English, tasas CAA, alojamiento ni manutención.",
    estimateNote: "",
  };
}

function getBaaModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: BAA_BASES,
    modulesPublished: [
      "ATPL teórico: Precio no publicado",
      "VFR / NVFR: Precio no publicado",
      "IFR SEP / ME: Precio no publicado",
      "Multi-engine: Precio no publicado",
      "CPL: Precio no publicado",
      "Advanced UPRT: Precio no publicado",
      "MCC: Precio no publicado",
    ],
    languageText: "Inglés",
    class1Text: "Por confirmar según módulo",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precios por módulo, pagos, depósito y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "BAA Training Spain muestra una estructura modular/CPL vinculada a su base de Lleida, pero no se ha localizado un desglose público suficiente de precios por módulo, horas por módulo, tasas, skill tests, materiales, pagos o reembolso. Para comparar esta ruta con otras opciones modulares, primero habría que pedir presupuesto completo por email y confirmar qué módulos están disponibles realmente en España.",
    flags: [
      "No hay precios modulares suficientemente publicados en abierto.",
      "No hay desglose económico completo por módulo.",
      "No comparar esta ruta con otras modulares hasta recibir presupuesto oficial.",
      "Confirmar qué módulos están disponibles actualmente en España.",
      "Confirmar tasas, skill tests, materiales, pagos, depósito y reembolso.",
      "Confirmar si el alumno necesita hour building/time building adicional antes del CPL.",
    ],
    questions: [
      "¿Qué cursos modulares ofrecen actualmente en España?",
      "¿Cuál es el precio actualizado de cada módulo?",
      "¿Qué duración y horas tiene cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Hay financiación para cursos modulares?",
      "¿Se entrega contrato completo antes de pagar cada módulo?",
      "¿Qué ocurre si abandono o no supero una fase?",
    ],
    costsNote:
      "BAA Training publica formación modular/CPL, pero no se ha localizado desglose público suficiente de precios por módulo en España. Solicitar presupuesto por email.",
    estimateNote: "",
  };
}

const AA_BASES = "Málaga · Aeropuerto de Málaga / Vélez-Málaga";

function getAerodynamicsClassicProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "16–18 meses",
    basesText: AA_BASES,
    modulesPublished: [],
    languageText: "Por confirmar",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio, depósito, calendario de pagos y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "unknown", display: "Por confirmar" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Aerodynamics Academy publica un Integrated ATPL Classic orientado a alumnos ab-initio, con duración indicada de 16–18 meses e incluyendo CPL, MEIR, A-UPRT y APS MCC A320. Sin embargo, no se han localizado precios públicos, horas detalladas, contrato, depósito, calendario de pagos, reembolso ni desglose de tasas o skill tests. Antes de comparar económicamente esta ruta, hace falta solicitar presupuesto completo por email.",
    flags: [
      "Precio del Integrated ATPL Classic no publicado en abierto.",
      "Horas de vuelo y simulador no desglosadas en la web revisada.",
      "Confirmar si tasas, skill tests, PBN, materiales, alojamiento y transporte están incluidos.",
      "Confirmar calendario de pagos, depósito, contrato y política de reembolso.",
      "No comparar con otros integrados hasta recibir presupuesto completo.",
    ],
    questions: [
      "¿Cuál es el precio actualizado del Integrated ATPL Classic?",
      "¿Cuántas horas de vuelo real y simulador incluye?",
      "¿Qué incluye exactamente el precio?",
      "¿Las tasas, skill tests y PBN están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Hay financiación disponible?",
    ],
    costsNote:
      "No se ha localizado precio público del Integrated ATPL Classic en la web revisada. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

function getAerodynamicsPlatinumProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "20–24 meses",
    basesText: AA_BASES,
    modulesPublished: [],
    languageText: "Por confirmar",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precio, depósito, calendario de pagos y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "unknown", display: "Por confirmar" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Aerodynamics Academy publica un Integrated ATPL Platinum orientado a alumnos ab-initio, con duración indicada de 20–24 meses. La web lo presenta como una versión ampliada del integrado, con más horas teóricas, de vuelo y simulador, incluyendo CPL, MEIR, A-UPRT, APS MCC A320, formación FI y prácticas en A320. No obstante, faltan precios, horas exactas, contrato, depósito, pagos, reembolso y desglose de costes incluidos, por lo que debe quedar pendiente de presupuesto por email.",
    flags: [
      "Precio del Integrated ATPL Platinum no publicado en abierto.",
      "Horas adicionales no cuantificadas en la web revisada.",
      "Confirmar alcance real de la formación FI y prácticas en A320.",
      "Confirmar si tasas, skill tests, PBN, materiales, alojamiento y transporte están incluidos.",
      "Confirmar calendario de pagos, depósito, contrato y política de reembolso.",
      "No comparar con el Classic sin precio y horas detalladas.",
    ],
    questions: [
      "¿Cuál es el precio actualizado del Integrated ATPL Platinum?",
      "¿Qué diferencia exacta de horas tiene frente al Classic?",
      "¿Qué incluye exactamente la formación FI?",
      "¿Qué prácticas en A320 están incluidas?",
      "¿Las tasas, skill tests y PBN están incluidos?",
      "¿Cuál es el calendario de pagos y depósito?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
    ],
    costsNote:
      "No se ha localizado precio público del Integrated ATPL Platinum en la web revisada. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

function getAerodynamicsModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: AA_BASES,
    modulesPublished: [
      "PPL: Precio no publicado",
      "Time building / horas PIC: Precio no publicado",
      "NVFR: Precio no publicado",
      "ATPL teórico: Precio no publicado",
      "MEIR: Precio no publicado",
      "CPL: Precio no publicado",
      "UPRT: Precio no publicado",
      "APS MCC: Precio no publicado",
    ],
    languageText: "Por confirmar",
    class1Text: "Por confirmar según módulo",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precios por módulo, pagos, depósito y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Aerodynamics Academy publica una ruta modular hacia CPL + MEIR + ATPL, con módulos como PPL, horas PIC, NVFR, ATPL teórico, MEIR, CPL, UPRT y APS MCC. Sin embargo, no se han localizado precios públicos por módulo ni desglose suficiente de duración, horas, tasas, skill tests, materiales, contrato o reembolso. Para comparar esta ruta con otras opciones modulares, es necesario pedir presupuesto completo por email.",
    flags: [
      "No hay precios modulares publicados en abierto.",
      "No hay desglose económico suficiente por módulo.",
      "No comparar esta ruta con otras rutas modulares hasta recibir presupuesto completo.",
      "Confirmar qué módulos están disponibles actualmente y qué incluye cada uno.",
      "Confirmar tasas, skill tests, materiales, pagos, depósito y reembolso.",
      "Confirmar horas PIC/time building necesarias según el punto de partida del alumno.",
    ],
    questions: [
      "¿Qué cursos modulares ofrecen actualmente?",
      "¿Cuál es el precio actualizado de cada módulo?",
      "¿Qué duración y horas tiene cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Cuántas horas PIC/time building necesita el alumno antes de CPL/MEIR?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Hay financiación para cursos modulares?",
      "¿Se entrega contrato completo antes de pagar cada módulo?",
      "¿Qué ocurre si abandono o no supero una fase?",
    ],
    costsNote:
      "Aerodynamics Academy publica una ruta modular CPL + MEIR + ATPL, pero no se han localizado precios públicos por módulo. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

const QF_BASES = "Madrid · Cuatro Vientos";
const QF_FLEET = "Tecnam P2006T, Tecnam P2008 y Cessna 172S";

function getQualityFlyIntegratedProfile(): RouteProfile {
  return {
    announcedText: "86.000 €",
    announcedValue: 86000,
    estimatedText: "90.000 €",
    estimatedValue: 90000,
    gapText: "4.000 €",
    durationText: "20 meses",
    basesText: QF_BASES,
    modulesPublished: [],
    languageText: "Español / por confirmar si también inglés",
    class1Text: "Requerida",
    scheduleSummary: "Parcial",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote:
      "Precio oferta 2026: 86.000 €. Precio catálogo: 89.500 €. Resto de pagos mensuales y opción de financiación con CaixaBank hasta 150.000 €.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "yes", display: "Sí · EASA teóricos un intento" },
      { label: "Skill tests", value: "yes", display: "Sí · CPL, IR, PBN y MEP un intento" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional · desde 865 €/mes" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Quality Fly publica una ficha bastante completa del ATPL integrado: precio oferta 2026, duración de 20 meses, flota, estructura del curso, horas, APS MCC, UPRT, PBN, materiales, uniforme, tasas teóricas EASA y verificaciones de vuelo en primer intento. El punto a validar es económico-contractual: vigencia de la oferta, depósito, pagos mensuales, financiación, reembolso, contrato y costes si el alumno necesita repetir exámenes o skill tests.",
    flags: [
      "Confirmar vigencia de la oferta 2026 de 86.000 €.",
      "Precio catálogo publicado: 89.500 €.",
      "Confirmar depósito, calendario mensual completo y condiciones de financiación.",
      "Confirmar política de reembolso y contrato antes de pagar.",
      "Alojamiento opcional desde 865 €/mes, no incluido en el precio base.",
      "Confirmar qué ocurre si se suspenden exámenes o verificaciones tras el primer intento incluido.",
      "Confirmar si el curso se imparte solo en español o también en inglés.",
    ],
    questions: [
      "¿La oferta 2026 de 86.000 € sigue vigente?",
      "¿Qué depósito hay que pagar para reservar plaza?",
      "¿Cuál es el calendario mensual completo de pagos?",
      "¿Qué condiciones tiene la financiación con CaixaBank?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso si abandono o no supero una fase?",
      "¿Qué coste tiene repetir exámenes teóricos o verificaciones de vuelo?",
      "¿El curso se imparte solo en español o también en inglés?",
      "¿Qué incluye exactamente el alojamiento desde 865 €/mes?",
    ],
    costsNote:
      "Oferta 2026. Precio catálogo publicado: 89.500 €. Confirmar vigencia antes de pagar.",
    estimateNote: "",
  };
}

const MFS_BASES = "Reus · Aeropuerto de Reus";

function getMfsModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: MFS_BASES,
    modulesPublished: [
      "PPL: Precio no publicado",
      "Time building: Precio no publicado",
      "ATPL teórico: Precio no publicado",
      "MEP: Precio no publicado",
      "IR: Precio no publicado",
      "CPL: Precio no publicado",
      "UPRT: Precio no publicado",
      "PBN: Precio no publicado",
    ],
    languageText: "Por confirmar",
    class1Text: "Por confirmar según módulo",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Precios por módulo, pagos, depósito y condiciones pendientes de confirmar por email.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Mediterranean Flight School parece operar principalmente con formación modular en Reus. Sin embargo, no se han localizado precios públicos actualizados por módulo ni un desglose económico suficiente. Para comparar esta escuela con otras rutas modulares, primero habría que pedir por email la lista actualizada de módulos, precios, duración, horas, tasas, skill tests, materiales, calendario de pagos, contrato y reembolso.",
    flags: [
      "No hay precios modulares publicados en abierto.",
      "No hay desglose económico suficiente por módulo.",
      "No comparar esta ruta con otras rutas modulares hasta recibir presupuesto completo.",
      "Confirmar qué módulos están disponibles actualmente y qué incluye cada uno.",
      "Confirmar tasas, skill tests, materiales, pagos, depósito y reembolso.",
    ],
    questions: [
      "¿Qué cursos modulares ofrecen actualmente?",
      "¿Cuál es el precio actualizado de cada módulo?",
      "¿Qué duración y horas tiene cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Cuál es el calendario de pagos y depósito por módulo?",
      "¿Hay financiación para cursos modulares?",
      "¿Se entrega contrato completo antes de pagar cada módulo?",
      "¿Qué ocurre si abandono o no supero una fase?",
    ],
    costsNote:
      "Mediterranean Flight School publica formación modular, pero no se han localizado precios públicos actualizados por módulo. Solicitar presupuesto por email.",
    estimateNote: "",
  };
}

// ----------------------------------------------------------------------------
// Aero Link Flight Academy (Aerolink) – Integrado ATPL único, sin precio público.
// ----------------------------------------------------------------------------
const AERO_LINK_BASES = "Barcelona / por confirmar base exacta";
const AERO_LINK_FLEET = "Diamond y Piper Seneca; flota completa por confirmar.";
const AERO_LINK_SIM = "Beechcraft turboprop, Airbus A320 y simulador de emergencias";

function getAeroLinkIntegratedProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "18 meses",
    basesText: AERO_LINK_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · MCC + JOC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "unknown", display: "Por confirmar" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Aerolink ofrece un programa integrado ATPL estructurado en 18 meses, con 230 h de vuelo, 10 h A320, MCC, JOC y UPRT. La parte operativa parece completa, pero la web no publica precio, contrato, pagos, reembolso ni desglose de extras. Antes de compararla económicamente, hay que pedir presupuesto oficial, contrato y condiciones completas.",
    flags: [
      "Precio no publicado.",
      "Contrato, pagos y reembolso no publicados.",
      "Flota completa y base exacta pendientes de confirmar.",
      "Tasas, skill tests, materiales y alojamiento no especificados.",
      "Las cifras promocionales de inserción laboral no son garantía de empleo.",
    ],
    questions: [
      "¿Cuál es el precio total del programa?",
      "¿Qué incluye exactamente el precio?",
      "¿Se entrega contrato antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Qué flota exacta se usa?",
      "¿Hay financiación o alojamiento?",
      "¿Tasas, skill tests y materiales están incluidos?",
    ],
    costsNote: "No se ha localizado precio público. Solicitar presupuesto actualizado por email.",
    estimateNote: "",
  };
}

// ----------------------------------------------------------------------------
// Atlantic Air Academy (Aeroflota del Noroeste) – Integrado + Modular.
// ----------------------------------------------------------------------------
const ATLANTIC_BASES = "A Coruña · Aeropuerto de Alvedro";
const ATLANTIC_FLEET = "Por confirmar";
const ATLANTIC_SIM = "FNPT II, MCC/JOC, PBN, UPRT y JOC A320/B737 por confirmar";

function getAtlanticIntegratedProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Por confirmar",
    basesText: ATLANTIC_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés por confirmar",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Atlantic Air Academy ofrece un ATPL integrado completo en A Coruña con 240 h de formación e inclusión de MCC/JOC, PBN y UPRT. El punto débil es que no publica precio, contrato, pagos, reembolso, flota ni simuladores detallados. El vínculo con Atlantic Air Solutions puede ser interesante, pero no debe tratarse como garantía de empleo.",
    flags: [
      "Precio no publicado.",
      "Flota y simuladores no detallados.",
      "Contrato y reembolso no publicados.",
      "Extras económicos por confirmar.",
      "Asociación con aerolínea no equivale a empleo garantizado.",
    ],
    questions: [
      "¿Cuál es el precio total del integrado?",
      "¿Qué flota y simuladores se utilizan?",
      "¿Qué tasas y skill tests están incluidos?",
      "¿Se entrega contrato antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Qué implica realmente la relación con Atlantic Air Solutions?",
    ],
    costsNote:
      "No se ha localizado precio público del integrado. Solicitar presupuesto oficial.",
    estimateNote: "",
  };
}

function getAtlanticModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: ATLANTIC_BASES,
    modulesPublished: [
      "PPL: Precio no publicado",
      "ATPL teórico: Precio no publicado",
      "CPL: Precio no publicado",
      "ME-IR: Precio no publicado",
      "UPRT: Precio no publicado",
      "MCC/JOC: Precio no publicado",
      "FI/CRI/IRI: Precio no publicado",
    ],
    languageText: "Español",
    class1Text: "Requerida para módulos profesionales",
    scheduleSummary: "Por módulo",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "unknown", display: "Por confirmar" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "La ruta modular de Atlantic Air Academy permite avanzar por fases con PPL, ATPL teórico, CPL, ME-IR, UPRT, MCC/JOC e instructor. Es flexible, pero no hay precios por módulo ni desglose económico. Para compararla habría que pedir presupuesto completo, horas, tasas, skill tests, contrato, pagos y reembolso.",
    flags: [
      "No hay precios por módulo.",
      "No hay horas detalladas por módulo.",
      "Flota y simuladores por confirmar.",
      "Contrato y reembolso no publicados.",
      "Puede ser difícil comparar sin presupuesto cerrado.",
    ],
    questions: [
      "¿Cuál es el precio de cada módulo?",
      "¿Hay paquetes combinados?",
      "¿Qué horas incluye cada módulo?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Hay financiación o alojamiento?",
      "¿Se entrega contrato por módulo?",
    ],
    costsNote:
      "No hay precios públicos por módulo. Solicitar presupuesto completo por email.",
    estimateNote: "",
  };
}

// ----------------------------------------------------------------------------
// Canavia Flight School – Standard + Advanced + First Officer + Modular.
// ----------------------------------------------------------------------------
const CANAVIA_BASES = "Maspalomas-El Berriel · Gran Canaria · Tenerife Norte · Tenerife Sur";
const CANAVIA_FLEET =
  "Tecnam P2006T, Tecnam P2008JC, Tecnam P2010 Mk II, Pipistrel Virus SW121 y Cessna 150M.";
const CANAVIA_SIM_STD =
  "FNPT II SoftekSim, MEP G1000 trainer, A320 FFS, B737 FFS, FNPT II A320, ATR 72 y Embraer 190";
const CANAVIA_SIM_ADV = "FNPT II, A320 FFS, B737 FFS y otros dispositivos";
const CANAVIA_SIM_FO = "A320, B737, ATR 72, Embraer 190 y otros dispositivos";
const CANAVIA_SIM_MOD = "FNPT II, MEP trainer, A320/B737/ATR/Embraer según curso";

function getCanaviaStandardProfile(): RouteProfile {
  return {
    announcedText: "71.410 €",
    announcedValue: 71410,
    estimatedText: "73.000 €",
    estimatedValue: 73000,
    gapText: "1.590 €",
    durationText: "16 meses",
    basesText: CANAVIA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Hasta 15 meses sin intereses",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote: "Financiación con Microbank y BBVA.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · MCC estándar" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí · IR-PBN" },
      { label: "Tasas", value: "yes", display: "Sí · 1er intento teórico" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí · PadPilot, headset, uniforme y logbook" },
      { label: "Alojamiento", value: "optional", display: "Opcional · 400–450 €/mes" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Canavia destaca por publicar precios, horas, paquetes y extras de forma bastante clara. El Standard cuesta 71.410 € e incluye 228 h, 800 h teóricas, MCC, UPRT, materiales, tasas teóricas de primer intento y skill tests. Aun así, el reconocimiento médico, repeticiones, seguro y alojamiento van aparte o deben confirmarse. Es una ficha fuerte, pero sigue siendo necesario revisar contrato y reembolso.",
    flags: [
      "Médico Clase 1 no incluido.",
      "Repeticiones y seguro no incluidos o por confirmar.",
      "Alojamiento no incluido.",
      "Confirmar contrato y reembolso.",
      "Confirmar disponibilidad real entre bases.",
    ],
    questions: [
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Qué coste tienen repeticiones y horas extra?",
      "¿Cuál es el depósito inicial?",
      "¿Hay plazas de alojamiento para todo el curso?",
      "¿Qué cubre exactamente la financiación?",
    ],
    costsNote:
      "Precio publicado con muchos extras incluidos. Médico, repeticiones, seguro y alojamiento aparte.",
    estimateNote: "",
  };
}

function getCanaviaAdvancedProfile(): RouteProfile {
  return {
    announcedText: "73.510 €",
    announcedValue: 73510,
    estimatedText: "75.000 €",
    estimatedValue: 75000,
    gapText: "1.490 €",
    durationText: "16 meses",
    basesText: CANAVIA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Hasta 15 meses sin intereses",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote: "Financiación con Microbank y BBVA.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí · IR-PBN" },
      { label: "Tasas", value: "yes", display: "Sí · 1er intento teórico" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional · 400–450 €/mes" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "El Advanced añade APS MCC y eleva el precio a 73.510 €. Puede tener sentido para alumnos que quieran una preparación más orientada a operación multipiloto y aerolínea. La diferencia económica frente al Standard es pequeña, pero conviene confirmar exactamente qué simulador se usa, qué horas son APS MCC y qué cubren los extras.",
    flags: [
      "Médico, repeticiones y seguro no incluidos o por confirmar.",
      "Confirmar si las 20 h APS son en FFS o dispositivo concreto.",
      "Contrato y reembolso no publicados.",
      "Alojamiento aparte.",
    ],
    questions: [
      "¿Qué diferencia exacta tiene frente al Standard?",
      "¿Dónde se realizan las horas APS MCC?",
      "¿Qué está incluido en el precio?",
      "¿Cuál es el contrato y reembolso?",
      "¿Qué costes adicionales pueden aparecer?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getCanaviaFirstOfficerProfile(): RouteProfile {
  return {
    announcedText: "95.510 €",
    announcedValue: 95510,
    estimatedText: "98.000 €",
    estimatedValue: 98000,
    gapText: "2.490 €",
    durationText: "18 meses",
    basesText: CANAVIA_BASES,
    modulesPublished: [],
    languageText: "Español / Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Hasta 15 meses sin intereses",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote: "Financiación con Microbank y BBVA.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí · IR-PBN" },
      { label: "Tasas", value: "yes", display: "Sí · 1er intento teórico" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "optional", display: "Opcional · 400–450 €/mes" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "El First Officer Package es el paquete más completo y caro de Canavia. Añade Type Rating y eleva el coste a 95.510 €. Puede ser atractivo para quien quiera salir con habilitación de tipo, pero es fundamental confirmar si realmente compensa pagar el type rating antes de tener oferta laboral, qué condiciones tiene, qué avión se elige y qué ocurre si el alumno no completa una fase.",
    flags: [
      "Type Rating incluido antes de tener empleo garantizado.",
      "Precio alto.",
      "Confirmar condiciones reales del type rating.",
      "Médico, repeticiones, seguro y alojamiento aparte.",
      "Contrato y reembolso por confirmar.",
    ],
    questions: [
      "¿Qué type rating incluye exactamente?",
      "¿Puede elegirse A320, B737, ATR 72 o Embraer 190 libremente?",
      "¿Qué ocurre si no supero el type rating?",
      "¿Hay acuerdo laboral o solo formación?",
      "¿Cuál es la política de reembolso?",
      "¿Hay financiación para el paquete completo?",
    ],
    costsNote: "",
    estimateNote: "",
  };
}

function getCanaviaModularProfile(): RouteProfile {
  return {
    announcedText: "No publicado por módulo",
    estimatedText: "Pendiente",
    gapText: "Pendiente",
    durationText: "Variable según módulos",
    basesText: CANAVIA_BASES,
    modulesPublished: [
      "PPL: Precio no publicado",
      "ATPL teórico: Precio no publicado",
      "CPL: Precio no publicado",
      "IR/MEIR: Precio no publicado",
      "MEP: Precio no publicado",
      "NVFR: Precio no publicado",
      "PBN: Precio no publicado",
      "MCC/APS MCC: Precio no publicado",
      "UPRT: Precio no publicado",
      "Time Building: Precio no publicado",
      "FI: Precio no publicado",
    ],
    languageText: "Español / Inglés",
    class1Text: "Requerida para módulos profesionales",
    scheduleSummary: "Por módulo",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "yes",
    financingNote: "Financiación con Microbank y BBVA.",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "optional", display: "Opcional · 400–450 €/mes" },
      { label: "Transporte", value: "unknown", display: "Por confirmar" },
    ],
    reading:
      "Canavia también ofrece ruta modular completa, pero no se ha localizado un precio global ni precios suficientes por módulo. Es útil para alumnos que ya tengan parte de la formación hecha, pero habría que pedir presupuesto individual por módulo y confirmar tasas, skill tests, materiales, contrato, pagos y reembolso antes de compararla con el integrado.",
    flags: [
      "No hay precio global modular.",
      "No hay precios publicados por módulo.",
      "La suma modular puede acercarse o superar al integrado.",
      "Extras por módulo pendientes de confirmar.",
      "Contrato y reembolso por confirmar.",
    ],
    questions: [
      "¿Cuál es el precio de cada módulo?",
      "¿Hay paquete modular completo?",
      "¿Qué tasas y skill tests están incluidos?",
      "¿Qué contrato se firma por módulo?",
      "¿Hay financiación modular?",
      "¿Qué módulos necesito según mi punto de partida?",
    ],
    costsNote:
      "Ruta modular sin precios públicos por módulo. Solicitar presupuesto detallado.",
    estimateNote: "",
  };
}

// ----------------------------------------------------------------------------
// Corflight School – Integrado ATPL + ruta modular PPL+ATPL+CPL.
// ----------------------------------------------------------------------------
const CORFLIGHT_BASES = "Madrid / por confirmar base exacta";

function getCorflightIntegratedProfile(): RouteProfile {
  return {
    announcedText: "76.000 €",
    announcedValue: 76000,
    estimatedText: "78.000 €",
    estimatedValue: 78000,
    gapText: "2.000 €",
    durationText: "Por confirmar",
    basesText: CORFLIGHT_BASES,
    modulesPublished: [],
    languageText: "Español",
    class1Text: "Requerida",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "MCC/JOC", value: "unknown", display: "Por confirmar · MCC APS ofertado" },
      { label: "Advanced UPRT", value: "unknown", display: "Por confirmar · ofertado aparte" },
      { label: "PBN", value: "unknown", display: "Por confirmar · ofertado aparte" },
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "no", display: "No" },
    ],
    reading:
      "Corflight publica un ATPL integrado por 76.000 €, pero no aporta suficiente desglose de horas, flota, simuladores, tasas, materiales, pagos, contrato ni reembolso. Aunque el precio existe, la comparabilidad es baja hasta recibir un dossier completo.",
    flags: [
      "Precio sin desglose de horas.",
      "Flota, simuladores y base no publicados con claridad.",
      "Contrato y reembolso no publicados.",
      "Extras importantes por confirmar.",
      "Posibles costes adicionales no visibles.",
    ],
    questions: [
      "¿Cuántas horas de vuelo y simulador incluye?",
      "¿Qué flota y simuladores se usan?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Hay contrato y política de reembolso?",
      "¿Cuál es el calendario de pagos?",
      "¿Hay financiación o alojamiento?",
    ],
    costsNote:
      "Precio publicado sin desglose suficiente de horas, flota, tasas, materiales ni contrato.",
    estimateNote: "",
  };
}

function getCorflightModularProfile(): RouteProfile {
  return {
    announcedText: "66.190 €",
    announcedValue: 66190,
    estimatedText: "68.000 €",
    estimatedValue: 68000,
    gapText: "1.810 €",
    durationText: "Por confirmar",
    basesText: CORFLIGHT_BASES,
    modulesPublished: [
      "PPL: Incluido en precio global",
      "ATPL teórico: Incluido en precio global",
      "CPL: Incluido en precio global",
      "IR: Precio no publicado",
      "MEPL: Precio no publicado",
      "MCC APS: Precio no publicado",
      "PBN: Precio no publicado",
      "UPRT: Precio no publicado",
      "FI/CRI/IRI: Precio no publicado",
    ],
    languageText: "Español",
    class1Text: "Requerida para CPL",
    scheduleSummary: "Por confirmar",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote: "",
    extrasItems: [
      { label: "Tasas", value: "unknown", display: "Por confirmar" },
      { label: "Skill tests", value: "unknown", display: "Por confirmar" },
      { label: "Materiales", value: "unknown", display: "Por confirmar" },
      { label: "Alojamiento", value: "no", display: "No" },
      { label: "Transporte", value: "no", display: "No" },
    ],
    reading:
      "Corflight publica una ruta combinada PPL + ATPL + CPL por 66.190 €, pero no detalla horas, flota, simuladores ni extras. Además, no queda claro si IR, MEPL, MCC APS, PBN o UPRT están incluidos o se pagan aparte. Antes de compararla como ruta profesional real, hay que pedir un desglose completo.",
    flags: [
      "Precio global sin desglose.",
      "No queda claro si la ruta llega a CPL/IR/ME/MCC completa.",
      "Flota y simuladores por confirmar.",
      "Contrato, pagos y reembolso no publicados.",
      "Extras importantes pendientes de confirmar.",
    ],
    questions: [
      "¿El precio de 66.190 € incluye IR, MEPL, MCC APS, PBN y UPRT?",
      "¿Cuántas horas de vuelo y teoría incluye cada fase?",
      "¿Qué tasas, skill tests y materiales están incluidos?",
      "¿Qué flota y simuladores se usan?",
      "¿Hay contrato y reembolso?",
      "¿Hay financiación?",
    ],
    costsNote:
      "Precio global publicado para PPL + ATPL + CPL, pero falta desglose de horas y extras.",
    estimateNote: "",
  };
}

// ----------------------------------------------------------------------------
// Leading Edge Aviation – LEAP Alhama (Single Licence + Dual Licence).
// ----------------------------------------------------------------------------
const LEAP_BASES = "Alhama, Murcia + Oxford, Reino Unido";
const LEAP_FLEET = "Piper PA-28, Diamond DA40, Diamond DA42 y Slingsby Firefly.";
const LEAP_SIM = "Diamond DA42 FNPT II y A320 FTD-1";

function getLeapSingleLicenceProfile(): RouteProfile {
  return {
    announcedText: "117.000 €",
    announcedValue: 117000,
    estimatedText: "121.000 €",
    estimatedValue: 121000,
    gapText: "4.000 €",
    durationText: "42 semanas aprox.",
    basesText: LEAP_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Sí",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Pagos Single Licence: 14.000 € depósito no reembolsable + 20.000 € antes del inicio + 20.000 € a los 4 meses + 21.000 € a los 8 meses + 21.000 € a los 10 meses + 20.000 € a los 12 meses.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí · dentro de MEIR" },
      { label: "Tasas", value: "yes", display: "Sí · ATPL y skill tests" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "yes", display: "Sí · Alhama y Oxford" },
      { label: "Transporte", value: "partial", display: "Parcial · vuelo a Oxford" },
    ],
    reading:
      "Leading Edge Aviation lanza en 2026 su programa LEAP Alhama, una ruta fATPL integrada con formación en Murcia y fase APS MCC en Oxford. El paquete Single Licence publica precio, pagos, alojamiento, materiales, tasas, skill tests, A-UPRT, APS MCC y training guarantee, lo que da bastante transparencia económica. El punto crítico es que el programa es nuevo en España y todavía hay que revisar contrato, reembolso, gastos personales, manutención, financiación y condiciones exactas de cancelación antes de pagar.",
    flags: [
      "Programa nuevo en España con inicio previsto en 2026.",
      "Precio elevado frente a otros integrados españoles.",
      "Contrato completo y política de reembolso no publicados.",
      "Confirmar gastos no incluidos: manutención, seguro, transporte local y gastos personales.",
      "Dependencia de dos bases: Alhama y Oxford.",
      "Valorar si la estructura internacional encaja con el perfil del alumno.",
    ],
    questions: [
      "¿Se entrega contrato completo antes de pagar el depósito?",
      "¿Cuál es la política de reembolso si abandono o no supero una fase?",
      "¿Qué gastos quedan fuera del precio?",
      "¿La manutención está incluida o solo el alojamiento?",
      "¿Hay financiación o préstamos disponibles?",
      "¿Qué cubre exactamente el training guarantee?",
      "¿Qué ocurre si hay retrasos operativos entre Alhama y Oxford?",
      "¿Qué experiencia operativa tendrá el campus de Alhama al inicio del programa?",
    ],
    costsNote:
      "Incluye alojamiento, materiales, tasas, skill tests y training guarantee. Confirmar contrato, reembolso y gastos personales.",
    estimateNote:
      "Margen prudente por manutención, seguro, transporte local, gastos personales o condiciones no detalladas.",
  };
}

function getLeapDualLicenceProfile(): RouteProfile {
  return {
    announcedText: "124.000 €",
    announcedValue: 124000,
    estimatedText: "128.000 €",
    estimatedValue: 128000,
    gapText: "4.000 €",
    durationText: "42 semanas aprox.",
    basesText: LEAP_BASES,
    modulesPublished: [],
    languageText: "Inglés",
    class1Text: "Requerida",
    scheduleSummary: "Sí",
    refundSummary: "Por confirmar",
    contractValue: "unknown",
    financingValue: "unknown",
    financingNote:
      "Pagos Dual Licence: 14.000 € depósito no reembolsable + 22.000 € antes del inicio + 22.000 € a los 4 meses + 22.000 € a los 8 meses + 22.000 € a los 10 meses + 22.000 € a los 12 meses.",
    extrasItems: [
      { label: "MCC/JOC", value: "yes", display: "Sí · APS MCC A320" },
      { label: "Advanced UPRT", value: "yes", display: "Sí" },
      { label: "PBN", value: "yes", display: "Sí · dentro de MEIR" },
      { label: "Tasas", value: "yes", display: "Sí · ATPL y skill tests" },
      { label: "Skill tests", value: "yes", display: "Sí" },
      { label: "Materiales", value: "yes", display: "Sí" },
      { label: "Alojamiento", value: "yes", display: "Sí · Alhama y Oxford" },
      { label: "Transporte", value: "partial", display: "Parcial · vuelo a Oxford" },
    ],
    reading:
      "La ruta Dual Licence de LEAP Alhama mantiene la misma estructura del programa Single, pero añade la posibilidad de obtener licencia dual EASA + UK CAA. El precio sube a 124.000 €, por lo que solo tiene sentido si el alumno valora realmente trabajar o mantener opciones en el entorno UK CAA. Antes de elegirla, conviene confirmar qué trámites adicionales exige la licencia dual, si hay costes posteriores y si el objetivo laboral justifica el sobreprecio frente a la ruta Single.",
    flags: [
      "Sobrecoste frente al Single Licence.",
      "Confirmar si la licencia dual es necesaria para el objetivo laboral del alumno.",
      "Programa nuevo en España con inicio previsto en 2026.",
      "Contrato completo y reembolso no publicados.",
      "Confirmar gastos no incluidos y costes administrativos de la licencia dual.",
      "Dependencia de Alhama y Oxford.",
    ],
    questions: [
      "¿Qué diferencia práctica tiene la licencia dual frente a Single Licence?",
      "¿Qué costes adicionales puede generar mantener EASA + UK CAA?",
      "¿Se entrega contrato completo antes de pagar?",
      "¿Cuál es la política de reembolso?",
      "¿Qué cubre exactamente el training guarantee?",
      "¿Qué gastos quedan fuera del precio?",
      "¿Hay financiación?",
      "¿La licencia dual compensa según mi objetivo laboral?",
    ],
    costsNote:
      "Incluye ruta dual EASA + UK CAA. Confirmar si el sobrecoste compensa según objetivo laboral.",
    estimateNote:
      "Margen prudente por manutención, seguro, transporte local, gastos personales o condiciones no detalladas.",
  };
}

function supportsMultiRouteProfile(school: SchoolEntry): boolean {
  return (
    school.slug === "european-flyers" ||
    school.slug === "adventia-usal" ||
    school.slug === "one-air" ||
    school.slug === "eas-barcelona" ||
    school.slug === "fte-jerez" ||
    school.slug === "cesda-urv" ||
    school.slug === "barcelona-flight-school" ||
    school.slug === "mediterranean-flight-school" ||
    school.slug === "quality-fly" ||
    school.slug === "aerodynamics-academy" ||
    school.slug === "baa-training-spain" ||
    school.slug === "panamedia-escuela-de-pilotos" ||
    school.slug === "flyschool-air-academy" ||
    school.slug === "world-aviation-ato" ||
    school.slug === "airpull-aviation-academy" ||
    school.slug === "flyby-aviation-academy" ||
    school.slug === "aero-link-flight-academy" ||
    school.slug === "aeroflota-del-noroeste-afn" ||
    school.slug === "canavia-flight-school" ||
    school.slug === "corflight-school" ||
    school.slug === "leading-edge-aviation-leap-alhama"
  );
}

function flag(value: string) {
  return value === "yes" ? "Sí" : value === "no" ? "No" : value === "partial" ? "Parcial" : value === "optional" ? "Opcional" : "Por confirmar";
}

function chipClass(value: string): string {
  if (value === "yes") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "no") return "border-slate-300 bg-slate-100 text-slate-700";
  if (value === "partial" || value === "optional") return "border-[#c9a454]/35 bg-[#fff8e8] text-[#7a5a16]";
  return "border-slate-300 bg-slate-100 text-slate-600";
}

function routeTypeLabel(type: SchoolEntry["routeType"], school?: SchoolEntry): string {
  if (school?.slug === "european-flyers") return "Formación integrada y modular";
  if (school?.slug === "adventia-usal") return "Formación universitaria e integrada";
  if (school?.slug === "one-air") return "Formación integrada, Airline Pilot y University ATPL";
  if (school?.slug === "eas-barcelona") return "Formación integrada y modular";
  if (school?.slug === "fte-jerez") return "Formación integrada y modular";
  if (school?.slug === "cesda-urv") return "Grado universitario + licencia ATPL";
  if (school?.slug === "barcelona-flight-school") return "Formación integrada y modular";
  if (school?.slug === "mediterranean-flight-school") return "Formación modular";
  if (school?.slug === "quality-fly") return "Formación integrada ATPL";
  if (school?.slug === "aerodynamics-academy") return "Formación integrada y modular";
  if (school?.slug === "baa-training-spain") return "Formación integrada y modular";
  if (school?.slug === "panamedia-escuela-de-pilotos") return "Formación integrada y modular";
  if (school?.slug === "flyschool-air-academy") return "Programas profesionales ATPL por paquetes";
  if (school?.slug === "world-aviation-ato") return "Formación modular";
  if (school?.slug === "airpull-aviation-academy") return "ATPL integrado con base propia";
  if (school?.slug === "flyby-aviation-academy") return "Programas integrados ATPL, grado y cadet";
  if (school?.slug === "aero-link-flight-academy") return "Programa integrado de piloto de aerolínea";
  if (school?.slug === "aeroflota-del-noroeste-afn") return "ATPL integrado y ruta modular";
  if (school?.slug === "canavia-flight-school") return "Programas integrados ATPL y ruta modular";
  if (school?.slug === "corflight-school") return "ATPL integrado y programa modular";
  if (school?.slug === "leading-edge-aviation-leap-alhama") return "LEAP Alhama · fATPL integrado EASA / dual";
  if (type === "integrated") return "Escuela integrada";
  if (type === "modular") return "Ruta modular";
  return "Universidad / Grado + licencia";
}

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

const PENDING_PRICE_LABEL = "Pendiente de validar";

function getLiveAnnouncedValue(school: SchoolEntry, routeProfile: RouteProfile | null): number {
  if (school.advertisedPriceEUR > 0) return school.advertisedPriceEUR;
  return routeProfile?.announcedValue ?? 0;
}

function getLiveEstimatedValue(school: SchoolEntry, routeProfile: RouteProfile | null): number {
  if (school.flypathEstimatedRealCostEUR > 0) return school.flypathEstimatedRealCostEUR;
  return routeProfile?.estimatedValue ?? 0;
}

function formatPriceLabel(value: number, pendingLabel = PENDING_PRICE_LABEL): string {
  return value > 0 ? euro(value) : pendingLabel;
}

type LiveComparisonPricing = {
  liveAnnouncedValue: number;
  liveEstimatedValue: number;
  liveAnnouncedText: string;
  liveEstimatedText: string;
  liveGapText: string;
  hasAnnounced: boolean;
  hasEstimated: boolean;
  hasComparableCosts: boolean;
  announcedPct: number;
  estimatedPct: number;
};

/** Precios visibles del comparador: SchoolEntry primero; routeProfile solo como fallback numérico o copy no monetario. */
function resolveLiveComparisonPricing(
  school: SchoolEntry,
  routeProfile: RouteProfile | null,
  maxComparableCost: number,
): LiveComparisonPricing {
  const liveAnnouncedValue = getLiveAnnouncedValue(school, routeProfile);
  const liveEstimatedValue = getLiveEstimatedValue(school, routeProfile);
  const hasAnnounced = liveAnnouncedValue > 0;
  const hasEstimated = liveEstimatedValue > 0;
  const hasComparableCosts = hasAnnounced && hasEstimated;

  const liveAnnouncedText =
    liveAnnouncedValue > 0
      ? formatPriceLabel(liveAnnouncedValue)
      : routeProfile?.announcedText?.trim() || formatPriceLabel(0);
  const liveEstimatedText =
    liveEstimatedValue > 0
      ? formatPriceLabel(liveEstimatedValue)
      : routeProfile?.estimatedText?.trim() || formatPriceLabel(0);
  const liveGapText = hasComparableCosts
    ? euro(liveEstimatedValue - liveAnnouncedValue)
    : routeProfile?.gapText?.trim() || PENDING_PRICE_LABEL;

  const announcedPct =
    hasComparableCosts && maxComparableCost > 0
      ? Math.min(100, Math.max(6, Math.round((liveAnnouncedValue / maxComparableCost) * 100)))
      : 0;
  const estimatedPct =
    hasComparableCosts && maxComparableCost > 0
      ? Math.min(100, Math.max(8, Math.round((liveEstimatedValue / maxComparableCost) * 100)))
      : 0;

  return {
    liveAnnouncedValue,
    liveEstimatedValue,
    liveAnnouncedText,
    liveEstimatedText,
    liveGapText,
    hasAnnounced,
    hasEstimated,
    hasComparableCosts,
    announcedPct,
    estimatedPct,
  };
}

function flypathReading(school: SchoolEntry, gap: number): string {
  const missingCoreExtras = [school.examFeesIncluded, school.skillTestsIncluded, school.trainingMaterialsIncluded].filter(
    (item) => item === "unknown" || item === "no",
  ).length;

  if (school.pendingData.length >= 3 || school.dataConfidence === "low") {
    return "Datos todavía incompletos antes de tomar una decisión.";
  }
  if (Number.isFinite(gap) && gap >= 7000) {
    return "Brecha alta; conviene confirmar el coste final por escrito.";
  }
  if (missingCoreExtras >= 2) {
    return "Claridad media; conviene confirmar tasas y extras antes de pagar.";
  }
  return "Buena claridad relativa, con puntos de coste por validar en contrato.";
}

function normalizeSummary(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shortRefundSummary(text: string): string {
  const v = normalizeSummary(text);
  if (v.includes("horas no voladas")) return "Parcial por horas no voladas";
  if (
    v.includes("detallada en la web") ||
    v.includes("sin politica publica") ||
    v.includes("no detallada publicamente") ||
    (v.includes("sin politica") && v.includes("detallada"))
  ) {
    return "No público detallado";
  }
  if (v.includes("conceptos no consumidos")) return "Parcial por no consumido";
  if (v.includes("email")) return "Parcial por email";
  if (v.includes("reglas separadas")) return "Reglas separadas";
  if (v.includes("resumen comercial")) return "Sin condiciones completas";
  if (v.includes("sin documento unificado")) return "Sin documento unificado";
  if (v.includes("academico claro")) return "Académico claro; vuelo aparte";
  if (v.includes("academico") && v.includes("vuelo")) return "Reglas separadas";
  if (v.includes("parcial")) return "Reembolso parcial";
  return "Confirmar con la escuela";
}

function shortScheduleSummary(text: string): string {
  const v = normalizeSummary(text);
  if (v.includes("hitos") && v.includes("fases")) return "5 hitos por fases";
  if (v.includes("modulo")) return "Pago por módulo";
  if (v.includes("trimestral")) return "Matrícula + trimestral";
  if (v.includes("bloque") && v.includes("reserva")) return "Pago por bloque";
  if (v.includes("externos")) return "Matrícula + vuelo externo";
  if (v.includes("deposito") && v.includes("hitos")) return "Depósito + hitos por fase";
  if (v.includes("coste academico anual")) return "Anual académico + vuelo";
  if (v.includes("matricula anual academica")) return "Matrícula + vuelo por bloques";
  if (v.includes("mensual")) return "Pago mensual";
  return "Confirmar calendario";
}

export function ComparisonResults({ schools }: Props) {
  const [selectedProgramModeBySchool, setSelectedProgramModeBySchool] = useState<Record<string, RouteMode>>({});
  const summary = summarizeComparison(schools);
  if (!summary) return null;
  const maxComparableCost = Math.max(
    ...schools.map((s) => Math.max(s.advertisedPriceEUR, s.flypathEstimatedRealCostEUR, 0)),
  );
  const gridColsClass = "lg:grid-cols-2";

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-[#0f1a33]">Análisis comparativo FlyPath</h2>

      <p className="text-[15px] text-slate-600">
        Compara las escuelas seleccionadas con los mismos criterios: costes, contrato, extras, riesgos y preguntas clave.
      </p>

      <div className={`grid gap-3.5 ${gridColsClass}`}>
        {schools.map((school) => {
          const selectedMode = selectedProgramModeBySchool[school.slug] ?? "integrated";
          const isEuropeanFlyers = school.slug === "european-flyers";
          const isEuropeanFlyersModular = isEuropeanFlyers && selectedMode === "modular";
          const isAdventia = school.slug === "adventia-usal";
          const isAdventiaUniversity = isAdventia && selectedMode === "university";
          const isOneAir = school.slug === "one-air";
          const oneAirMode: RouteMode = isOneAir
            ? selectedMode === "airline_pilot" ||
              selectedMode === "university_programme" ||
              selectedMode === "modular"
              ? selectedMode
              : "integrated"
            : selectedMode;
          const isEasBarcelona = school.slug === "eas-barcelona";
          const isEasBarcelonaModular = isEasBarcelona && selectedMode === "modular";
          const isFteJerez = school.slug === "fte-jerez";
          const isFteJerezModular = isFteJerez && selectedMode === "modular";
          const isCesda = school.slug === "cesda-urv";
          const isBfs = school.slug === "barcelona-flight-school";
          const isBfsModular = isBfs && selectedMode === "modular";
          const isMfs = school.slug === "mediterranean-flight-school";
          const isQualityFly = school.slug === "quality-fly";
          const isAerodynamics = school.slug === "aerodynamics-academy";
          const aerodynamicsMode: RouteMode = isAerodynamics
            ? selectedMode === "integrated_platinum" || selectedMode === "modular"
              ? selectedMode
              : "integrated"
            : selectedMode;
          const isAerodynamicsModular = isAerodynamics && aerodynamicsMode === "modular";
          const isAerodynamicsPlatinum = isAerodynamics && aerodynamicsMode === "integrated_platinum";
          const isBaa = school.slug === "baa-training-spain";
          const isBaaModular = isBaa && selectedMode === "modular";
          const isPanamedia = school.slug === "panamedia-escuela-de-pilotos";
          const isPanamediaModular = isPanamedia && selectedMode === "modular";
          const isFaa = school.slug === "flyschool-air-academy";
          const faaMode: RouteMode = isFaa
            ? selectedMode === "advance_275" || selectedMode === "cadet_500"
              ? selectedMode
              : "professional_250"
            : selectedMode;
          const isWafa = school.slug === "world-aviation-ato";
          const isApa = school.slug === "airpull-aviation-academy";
          const apaMode: RouteMode = isApa
            ? selectedMode === "atpl_advanced" || selectedMode === "atpl_premium"
              ? selectedMode
              : "atpl_basic"
            : selectedMode;
          const isFby = school.slug === "flyby-aviation-academy";
          const fbyMode: RouteMode = isFby
            ? selectedMode === "university" || selectedMode === "cadet_500"
              ? selectedMode
              : "integrated"
            : selectedMode;
          const isAeroLink = school.slug === "aero-link-flight-academy";
          const isAtlantic = school.slug === "aeroflota-del-noroeste-afn";
          const isAtlanticModular = isAtlantic && selectedMode === "modular";
          const isCanavia = school.slug === "canavia-flight-school";
          const canaviaMode: RouteMode = isCanavia
            ? selectedMode === "canavia_advanced" ||
              selectedMode === "canavia_first_officer" ||
              selectedMode === "modular"
              ? selectedMode
              : "integrated"
            : selectedMode;
          const isCanaviaModular = isCanavia && canaviaMode === "modular";
          const isCorflight = school.slug === "corflight-school";
          const isCorflightModular = isCorflight && selectedMode === "modular";
          const isLeap = school.slug === "leading-edge-aviation-leap-alhama";
          const leapMode: RouteMode = isLeap
            ? selectedMode === "dual_licence"
              ? "dual_licence"
              : "single_licence"
            : selectedMode;
          const routeProfile: RouteProfile | null = isEuropeanFlyersModular
            ? getEuropeanFlyersModularProfile()
            : isAdventiaUniversity
              ? getAdventiaUniversityProfile()
              : isAdventia
                ? getAdventiaIntegratedProfile()
                : isOneAir
                  ? oneAirMode === "airline_pilot"
                    ? getOneAirAirlinePilotProfile()
                    : oneAirMode === "university_programme"
                      ? getOneAirUniversityAtplProfile()
                      : oneAirMode === "modular"
                        ? getOneAirModularProfile()
                        : getOneAirIntegratedProfile()
                  : isEasBarcelona
                    ? isEasBarcelonaModular
                      ? getEasBcnModularProfile()
                      : getEasBcnIntegratedProfile()
                    : isFteJerez
                      ? isFteJerezModular
                        ? getFteJerezModularProfile()
                        : getFteJerezIntegratedProfile()
                      : isCesda
                        ? getCesdaDegreeAtplProfile()
                        : isBfs
                          ? isBfsModular
                            ? getBfsModularProfile()
                            : getBfsIntegratedProfile()
                          : isMfs
                            ? getMfsModularProfile()
                            : isQualityFly
                              ? getQualityFlyIntegratedProfile()
                              : isAerodynamics
                                ? aerodynamicsMode === "modular"
                                  ? getAerodynamicsModularProfile()
                                  : aerodynamicsMode === "integrated_platinum"
                                    ? getAerodynamicsPlatinumProfile()
                                    : getAerodynamicsClassicProfile()
                                : isBaa
                                  ? isBaaModular
                                    ? getBaaModularProfile()
                                    : getBaaIntegratedProfile()
                                  : isPanamedia
                                    ? isPanamediaModular
                                      ? getPanamediaModularProfile()
                                      : getPanamediaIntegratedProfile()
                                    : isFaa
                                      ? faaMode === "cadet_500"
                                        ? getFaaCadetProfile()
                                        : faaMode === "advance_275"
                                          ? getFaaAdvanceProfile()
                                          : getFaaProfesionalProfile()
                                      : isWafa
                                        ? getWorldAviationModularProfile()
                                        : isApa
                                          ? apaMode === "atpl_premium"
                                            ? getAirpullPremiumProfile()
                                            : apaMode === "atpl_advanced"
                                              ? getAirpullAdvancedProfile()
                                              : getAirpullBasicProfile()
                                          : isFby
                                            ? fbyMode === "university"
                                              ? getFlybyDegreeProfile()
                                              : fbyMode === "cadet_500"
                                                ? getFlybyCadetProfile()
                                                : getFlybyIntegratedProfile()
                                            : isAeroLink
                                              ? getAeroLinkIntegratedProfile()
                                              : isAtlantic
                                                ? isAtlanticModular
                                                  ? getAtlanticModularProfile()
                                                  : getAtlanticIntegratedProfile()
                                                : isCanavia
                                                  ? canaviaMode === "canavia_advanced"
                                                    ? getCanaviaAdvancedProfile()
                                                    : canaviaMode === "canavia_first_officer"
                                                      ? getCanaviaFirstOfficerProfile()
                                                      : canaviaMode === "modular"
                                                        ? getCanaviaModularProfile()
                                                        : getCanaviaStandardProfile()
                                                  : isCorflight
                                                    ? isCorflightModular
                                                      ? getCorflightModularProfile()
                                                      : getCorflightIntegratedProfile()
                                                    : isLeap
                                                      ? leapMode === "dual_licence"
                                                        ? getLeapDualLicenceProfile()
                                                        : getLeapSingleLicenceProfile()
                                                      : null;
          const {
            liveAnnouncedValue,
            liveEstimatedValue,
            liveAnnouncedText,
            liveEstimatedText,
            liveGapText,
            hasComparableCosts,
            announcedPct,
            estimatedPct,
          } = resolveLiveComparisonPricing(school, routeProfile, maxComparableCost);

          if (process.env.NODE_ENV !== "production" && isAdventia && !isAdventiaUniversity) {
            const profileAnnounced = routeProfile?.announcedValue ?? 0;
            if (
              school.advertisedPriceEUR > 0 &&
              profileAnnounced > 0 &&
              school.advertisedPriceEUR !== profileAnnounced
            ) {
              console.warn("[FlyPath DEV] Adventia comparador: precio vivo desde SchoolEntry", {
                schoolAdvertisedPriceEUR: school.advertisedPriceEUR,
                routeProfileAnnouncedValue: profileAnnounced,
                liveAnnouncedValue,
                liveAnnouncedText,
              });
            }
          }

          // Nota: los bloques "Lectura FlyPath", "E. Riesgos / Red flags" y "F. Preguntas clave" se han retirado
          // de las columnas del comparador para evitar duplicación con el nuevo bloque global "Conclusión FlyPath".
          // Los datos siguen disponibles en el dataset y en las fichas individuales /schools/[slug].
          const schoolDisplayName = isAdventia ? "Adventia" : school.name;
          const scheduleSummary = routeProfile
            ? routeProfile.scheduleSummary
            : shortScheduleSummary(school.paymentScheduleSummary);
          const financingValue = routeProfile ? routeProfile.financingValue : school.financingAvailable;
          const financingNote = routeProfile
            ? routeProfile.financingNote
            : "";
          const extrasItems = routeProfile
            ? routeProfile.extrasItems
            : [
                { label: "MCC/JOC", value: school.mccJocIncluded },
                { label: "Advanced UPRT", value: school.advancedUprtIncluded },
                { label: "Tasas", value: school.examFeesIncluded },
                { label: "Skill tests", value: school.skillTestsIncluded },
                { label: "Materiales", value: school.trainingMaterialsIncluded },
                { label: "Alojamiento", value: school.accommodationIncluded },
              ];
          // Producto: en el comparador la fila CONTRATO siempre se muestra como "Sí"
          // con chip verde, independientemente de `school.contractAvailableBeforePayment`
          // o `routeProfile.contractValue`. El dataset y la lógica interna se conservan
          // tal cual; solo se sobrescribe la visualización de esta única fila más abajo.
          const financingLabel =
            isAdventiaUniversity && routeProfile
              ? "Por confirmar"
              : flag(financingValue);
          const operationHoursText =
            isAdventia && !isAdventiaUniversity
              ? "261,5 h de vuelo certificadas."
              : isAdventiaUniversity
                ? "Por confirmar"
                : isEuropeanFlyers && isEuropeanFlyersModular
                  ? "Variable según módulos."
                    : isEuropeanFlyers
                      ? "180 h de vuelo real."
                      : isOneAir && oneAirMode === "integrated"
                        ? "151 h de vuelo real + 129 h de simulador / 280 h prácticas totales"
                        : isOneAir && oneAirMode === "airline_pilot"
                          ? "205 h de vuelo real + 155 h de simulador / 360 h prácticas totales"
                          : isOneAir && oneAirMode === "university_programme"
                            ? "262 h de vuelo real + 239 h de simulador aprox. / +502 h prácticas totales"
                            : isOneAir && oneAirMode === "modular"
                              ? "PPL + Pack modular: 87 h vuelo real aprox. + simulador según módulos"
                              : isEasBarcelona && !isEasBarcelonaModular
                                ? "247 h totales, incluyendo vuelo y simulador."
                                : isEasBarcelonaModular
                                  ? "Por confirmar"
                                  : isFteJerez && !isFteJerezModular
                                    ? "155 h de vuelo aprox. + 69 h de simulador/training device."
                                    : isFteJerezModular
                                      ? "46 h de vuelo + 76 h de simulador aprox."
                                      : isCesda
                                        ? "170 h de vuelo real + 115 h de simulador."
                                        : isBfs && !isBfsModular
                                          ? "230 h de instrucción de vuelo"
                                          : isBfsModular
                                            ? "Por confirmar"
                                            : isMfs
                                              ? "Por confirmar"
                                              : isQualityFly
                                                ? "220 h de vuelo y simulador + 3 sesiones de planeador"
                                                : isAerodynamics
                                                  ? "Por confirmar"
                                                    : isBaa && !isBaaModular
                                                    ? "837 h teoría + 207 h vuelo"
                                                    : isBaaModular
                                                      ? "Por confirmar"
                                                      : isPanamedia && !isPanamediaModular
                                                        ? "166 h de vuelo + 95 h de simulador"
                                                        : isPanamediaModular
                                                          ? "255,5 h de vuelo + 862 h de teoría aprox."
                                                            : isFaa && faaMode === "advance_275"
                                                            ? "150 h de vuelo + 125 h de simulador"
                                                            : isFaa && faaMode === "cadet_500"
                                                              ? "180 h de vuelo + 100 h de simulador"
                                                              : isFaa
                                                                ? "150 h de vuelo + 100 h de simulador"
                                                                : isWafa
                                                                  ? "Por confirmar según ruta completa"
                                                                  : isApa && apaMode === "atpl_basic"
                                                                    ? "155 h de vuelo + 40 h de simulador"
                                                                    : isApa && apaMode === "atpl_advanced"
                                                                      ? "195 h de vuelo + simulador por confirmar"
                                                                      : isApa
                                                                        ? "Por confirmar"
                                                                        : isFby && fbyMode === "university"
                                                                          ? "278 h de vuelo aprox. + 1.762 h de teoría"
                                                                          : isFby && fbyMode === "cadet_500"
                                                                            ? "238 h vuelo ATPL + 30 h vuelo FI + mínimo 600 h como instructor"
                                                                            : isFby
                                                                              ? "238 h de vuelo + 812 h de teoría"
                                                                              : isAeroLink
                                                                                ? "230 h de vuelo real + 10 h A320"
                                                                                : isAtlantic && !isAtlanticModular
                                                                                  ? "240 h de vuelo/formación"
                                                                                  : isAtlanticModular
                                                                                    ? "Por confirmar"
                                                                                    : isCanavia && canaviaMode === "integrated"
                                                                                      ? "228 h totales + 800 h teóricas"
                                                                                      : isCanavia && canaviaMode === "canavia_advanced"
                                                                                        ? "248 h totales + 800 h teóricas"
                                                                                        : isCanavia && canaviaMode === "canavia_first_officer"
                                                                                          ? "285 h totales + 800 h teóricas"
                                                                                          : isCanaviaModular
                                                                                            ? "Por confirmar según módulo"
                                                            : isCorflight
                                                              ? "Por confirmar"
                                                              : isLeap
                                                                ? "162 h de vuelo aprox. + 70,5 h de simulador"
                                                                : null;

          const headerLocationText = isAdventia
            ? "Salamanca · Salamanca-Matacán"
            : isEasBarcelona
              ? EAS_BCN_BASES
              : isFteJerez
                ? FTE_JEREZ_BASES
                : isCesda
                  ? CESDA_HEADER_LOCATION
                  : isBfs
                    ? BFS_BASES
                    : isMfs
                      ? MFS_BASES
                      : isQualityFly
                        ? QF_BASES
                        : isAerodynamics
                          ? AA_BASES
                          : isBaa
                            ? BAA_BASES
                            : isPanamedia
                              ? PNM_BASES
                              : isFaa
                                ? FAA_BASES
                                : isWafa
                                  ? WAFA_BASES
                                  : isApa
                                    ? APA_BASES
                                    : isFby
                                      ? FBY_BASES
                                      : isAeroLink
                                        ? AERO_LINK_BASES
                                        : isAtlantic
                                          ? ATLANTIC_BASES
                                          : isCanavia
                                            ? CANAVIA_BASES
                                            : isCorflight
                                              ? CORFLIGHT_BASES
                                              : isLeap
                                                ? LEAP_BASES
                                                : `${school.city} · ${school.baseAirport}`;

          return (
            <article key={school.id} className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ComparisonSchoolHeader
                school={school}
                displayName={schoolDisplayName}
                routeLabel={routeTypeLabel(school.routeType, school)}
                locationText={headerLocationText}
              />

              <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                {/* Slot compacto y estable para los toggles: reserva una altura mínima igual a la
                  natural de un botón estándar (~44 px) para que el bloque "A. Costes" empiece
                  siempre alineado, sin generar un hueco grande bajo el header cuando una card tiene
                  pocos toggles o usa botones compactos. Referencia visual: One Air vs Mediterranean. */}
                <div className="flex min-h-[44px] items-center justify-center">
                  {supportsMultiRouteProfile(school) ? (
                    <div
                      className={
                        isOneAir || isAerodynamics || isFaa || isApa || isFby || isCanavia
                          ? "flex flex-nowrap items-center justify-center gap-1.5"
                          : "inline-flex items-center gap-2.5"
                      }
                    >
                      {isCesda ? (
                        <span
                          className="rounded-xl border border-[#93c5fd] bg-[#dbeafe] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                          aria-current="true"
                        >
                          Grado + ATPL
                        </span>
                      ) : isMfs ? (
                        <span
                          className="rounded-xl border border-[#93c5fd] bg-[#dbeafe] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                          aria-current="true"
                        >
                          Ruta modular
                        </span>
                      ) : isWafa ? (
                        <span
                          className="rounded-xl border border-[#93c5fd] bg-[#dbeafe] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                          aria-current="true"
                        >
                          Ruta modular
                        </span>
                      ) : isQualityFly ? (
                        <span
                          className="rounded-xl border border-[#93c5fd] bg-[#dbeafe] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                          aria-current="true"
                        >
                          Integrado ATPL
                        </span>
                      ) : isEuropeanFlyers ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isAdventia ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "university",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "university"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Grado universitario
                          </button>
                        </>
                      ) : isOneAir ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              oneAirMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              oneAirMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "airline_pilot",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              oneAirMode === "airline_pilot"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Airline Pilot
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "university_programme",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              oneAirMode === "university_programme"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            University ATPL
                          </button>
                        </>
                      ) : isEasBarcelona ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isFteJerez ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode !== "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isBfs ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode !== "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isAerodynamics ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              aerodynamicsMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL Classic
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated_platinum",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              aerodynamicsMode === "integrated_platinum"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL Platinum
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              aerodynamicsMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isBaa ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode !== "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isPanamedia ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode !== "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isFaa ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "professional_250",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              faaMode === "professional_250"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Profesional 250 h
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "advance_275",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              faaMode === "advance_275"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Advance 275 h
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "cadet_500",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              faaMode === "cadet_500"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Cadet 500 h
                          </button>
                        </>
                      ) : isApa ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "atpl_basic",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              apaMode === "atpl_basic"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            ATPL Basic
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "atpl_advanced",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              apaMode === "atpl_advanced"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            ATPL Advanced
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "atpl_premium",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              apaMode === "atpl_premium"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            ATPL Premium
                          </button>
                        </>
                      ) : isAeroLink ? (
                        <span
                          className="rounded-xl border border-[#93c5fd] bg-[#dbeafe] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                          aria-current="true"
                        >
                          Integrado ATPL
                        </span>
                      ) : isAtlantic ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode !== "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isCanavia ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              canaviaMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "canavia_advanced",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              canaviaMode === "canavia_advanced"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado Advanced
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "canavia_first_officer",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              canaviaMode === "canavia_first_officer"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            First Officer
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              canaviaMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isCorflight ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode !== "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "modular",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              selectedMode === "modular"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Ruta modular
                          </button>
                        </>
                      ) : isLeap ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "single_licence",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              leapMode === "single_licence"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Single Licence
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "dual_licence",
                              }))
                            }
                            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition ${
                              leapMode === "dual_licence"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Dual Licence
                          </button>
                        </>
                      ) : isFby ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "integrated",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              fbyMode === "integrated"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Integrado ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "university",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              fbyMode === "university"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Grado + ATPL
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProgramModeBySchool((current) => ({
                                ...current,
                                [school.slug]: "cadet_500",
                              }))
                            }
                            className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                              fbyMode === "cadet_500"
                                ? "border border-[#93c5fd] bg-[#dbeafe] text-[#0f1a33] shadow-sm"
                                : "border border-[#d8dee8] bg-[#f8fafc] text-[#0f1a33]"
                            }`}
                          >
                            Cadet ATPL + FI
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">A. Costes</p>
                  <div className="mt-1.5 space-y-1.5 text-[15px] text-slate-700">
                    <p>
                      <span className="font-semibold text-[#0f1a33]">Precio anunciado:</span>{" "}
                      <span className="text-[17px] font-bold leading-none text-[#0f1a33]">
                        {liveAnnouncedText}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-[#0f1a33]">Coste real estimado FlyPath:</span>{" "}
                      <span className="text-[17px] font-bold leading-none text-[#0f1a33]">{liveEstimatedText}</span>
                    </p>
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Brecha estimada:</span>
                      <span className="inline-flex rounded-full border border-[#c9a454]/45 bg-[#fff8e8] px-2 py-0.5 text-sm font-semibold text-[#7a5a16]">
                        {liveGapText}
                      </span>
                      <span className="group relative inline-flex shrink-0">
                        <button
                          type="button"
                          aria-label="Qué significa la brecha estimada"
                          aria-describedby={`tooltip-brecha-${school.slug}`}
                          className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#c9a454]/60 bg-white text-[10px] font-bold leading-none text-[#7a5a16] transition hover:bg-[#fff8e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
                        >
                          i
                        </button>
                        <span
                          id={`tooltip-brecha-${school.slug}`}
                          role="tooltip"
                          className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-20 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-snug text-slate-700 opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                        >
                          Diferencia aproximada entre el precio anunciado por la escuela y el coste real estimado FlyPath. Puede incluir extras, tasas, skill tests, materiales, costes no publicados o margen de seguridad.
                        </span>
                      </span>
                    </p>
                    {routeProfile ? (
                      <p className="text-[15px] text-slate-600">
                        {routeProfile.costsNote}
                      </p>
                    ) : null}
                    {routeProfile?.estimateNote ? (
                      <p className="text-[15px] text-slate-600">
                        {routeProfile.estimateNote}
                      </p>
                    ) : null}
                  </div>
                  {hasComparableCosts ? (
                    <div className="mt-2.5 w-full max-w-full space-y-1.5 overflow-hidden">
                      <div className="w-full">
                        <p className="mb-0.5 text-[12px] text-slate-500">Anunciado</p>
                        <div className="h-1.5 w-full max-w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-1.5 max-w-full rounded-full bg-slate-400/70" style={{ width: `${announcedPct}%` }} />
                        </div>
                      </div>
                      <div className="w-full">
                        <p className="mb-0.5 text-[12px] text-slate-500">Real estimado</p>
                        <div className="h-1.5 w-full max-w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-1.5 max-w-full rounded-full bg-[#0f1a33]" style={{ width: `${estimatedPct}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : !routeProfile ? (
                    <p className="mt-2.5 text-[15px] text-slate-500">Dato pendiente</p>
                  ) : null}
                </section>

                {/* Estructura estándar de fichas comparativas para futuras escuelas: A/B/C/D + Lectura + E/F. */}
                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">B. Operación y ruta</p>
                  <div className="mt-1.5 space-y-1.5 text-[15px] text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-700">Duración:</span>{" "}
                      {routeProfile?.durationText ?? `${school.programDurationMonths || "Pendiente"} meses`}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Bases:</span>{" "}
                      {routeProfile?.basesText ?? `${school.city} · ${school.baseAirport}`}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Flota:</span>{" "}
                      {isAdventia
                        ? "Tobago TB10, Bonanza F33A y Baron B55."
                        : isEasBarcelona
                          ? isEasBarcelonaModular
                            ? `${EAS_BCN_FLEET} Según información del integrado.`
                            : EAS_BCN_FLEET
                          : isFteJerez
                            ? isFteJerezModular
                              ? "Piper Warrior II, Diamond DA42, FNPT II DA42, simulador B737-800 y simulador A320."
                              : FTE_JEREZ_FLEET
                            : isCesda
                              ? CESDA_FLEET
                              : isBfs
                                ? BFS_FLEET
                                : isMfs
                                  ? "Por confirmar"
                                  : isQualityFly
                                    ? QF_FLEET
                                    : isAerodynamics
                                      ? "Por confirmar"
                                      : isBaa
                                        ? BAA_FLEET
                                        : isPanamedia
                                          ? PNM_FLEET
                                          : isFaa
                                            ? "Por confirmar"
                                            : isWafa
                                              ? "Por confirmar"
                                              : isApa
                                                ? "Por confirmar"
                                                : isFby
                                                  ? FBY_FLEET
                                                  : isAeroLink
                                                    ? AERO_LINK_FLEET
                                                    : isAtlantic
                                                      ? ATLANTIC_FLEET
                                                      : isCanavia
                                                        ? CANAVIA_FLEET
                                                        : isCorflight
                                                          ? "Por confirmar"
                                                          : isLeap
                                                            ? LEAP_FLEET
                                                            : school.fleetSummary}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Idioma formación:</span>{" "}
                      {routeProfile?.languageText ?? school.languageOfInstruction}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Clase 1:</span>{" "}
                      {routeProfile?.class1Text ?? school.class1Requirement}
                    </p>
                    {operationHoursText ? (
                      <p>
                        <span className="font-semibold text-slate-700">Horas:</span> {operationHoursText}
                      </p>
                    ) : null}
                    {isCesda ? (
                      <p className="text-[15px] text-slate-500">
                        285 h totales: 170 h vuelo real, 55 h simulador básico y 60 h simulador A320.
                      </p>
                    ) : null}
                    {isBfs && !isBfsModular ? (
                      <p className="text-[15px] text-slate-500">
                        Desglose: 95 h VFR + 95 h IFR + 40 h APS MCC en FNPT II B737-800NG.
                      </p>
                    ) : null}
                    {isQualityFly ? (
                      <p className="text-[15px] text-slate-500">
                        Desglose: 90 h SEP VFR + 15 h SIM IFR + 44 h SEP IFR + 21 h ME + 40 h APS MCC.
                      </p>
                    ) : null}
                    {isAerodynamics && !isAerodynamicsModular ? (
                      <p className="text-[15px] text-slate-500">
                        {isAerodynamicsPlatinum
                          ? "Incluye CPL, MEIR, A-UPRT, APS MCC A320 y FI."
                          : "Incluye CPL, MEIR, A-UPRT y APS MCC A320."}
                      </p>
                    ) : null}
                    {isBaa && !isBaaModular ? (
                      <>
                        <p className="text-[15px] text-slate-500">
                          Simuladores: {BAA_SIM}.
                        </p>
                        <p className="text-[15px] text-slate-500">
                          Desglose: 94 h VFR/NVFR + 37 h IFR simulador + 59 h IFR SEP + 11 h ME + 3 h simulador ME + 3 h Advanced UPRT + 16 h MCC.
                        </p>
                      </>
                    ) : null}
                    {isBaaModular ? (
                      <p className="text-[15px] text-slate-500">
                        Simuladores: {BAA_SIM}.
                      </p>
                    ) : null}
                    {isPanamedia ? (
                      <p className="text-[15px] text-slate-500">
                        Simuladores: {PNM_SIM}.
                      </p>
                    ) : null}
                    {isPanamedia && !isPanamediaModular ? (
                      <p className="text-[15px] text-slate-500">
                        Desglose: 141 h monomotor + 25 h multimotor + 10 h OTD + 50 h FNPT II + 35 h APS MCC.
                      </p>
                    ) : null}
                    {isPanamediaModular ? (
                      <p className="text-[15px] text-slate-500">
                        ATPL teórico 670 h; IR/PBN 51,5 h; MEP 8 h vuelo + 13,5 h simulador; CPL 16,5 h; A-UPRT 7 h vuelo + 3 h simulador; MCC 25 h teoría + 20 h simulador.
                      </p>
                    ) : null}
                    {isFaa ? (
                      <p className="text-[15px] text-slate-500">
                        Simuladores: {FAA_SIM}.
                      </p>
                    ) : null}
                    {isFaa && faaMode === "professional_250" ? (
                      <p className="text-[15px] text-slate-500">Teoría: 1.200 h.</p>
                    ) : null}
                    {isFaa && faaMode === "advance_275" ? (
                      <p className="text-[15px] text-slate-500">
                        Incluye 65 h A320 según información publicada.
                      </p>
                    ) : null}
                    {isFaa && faaMode === "cadet_500" ? (
                      <p className="text-[15px] text-slate-500">
                        Incluye curso FI y contrato laboral, condiciones por confirmar.
                      </p>
                    ) : null}
                    {isWafa ? (
                      <>
                        <p className="text-[15px] text-slate-500">
                          Simuladores: FNPT II / por confirmar.
                        </p>
                        <p className="text-[15px] text-slate-500">
                          PPL(A): 112 h teoría + 45 h vuelo. ATPL modular desde PPL: 650 h teoría. ATPL modular desde CPL: 450 h teoría. CPL modular: 15–25 h vuelo.
                        </p>
                      </>
                    ) : null}
                    {isApa ? (
                      <p className="text-[15px] text-slate-500">
                        Simuladores: Por confirmar.
                      </p>
                    ) : null}
                    {isApa && apaMode === "atpl_basic" ? (
                      <p className="text-[15px] text-slate-500">
                        Programa integrado con mínimos FCL. Desglose por fases pendiente de confirmar.
                      </p>
                    ) : null}
                    {isApa && apaMode === "atpl_advanced" ? (
                      <p className="text-[15px] text-slate-500">
                        Opción con más horas de vuelo que el Basic. Desglose exacto pendiente de confirmar.
                      </p>
                    ) : null}
                    {isApa && apaMode === "atpl_premium" ? (
                      <p className="text-[15px] text-slate-500">
                        Opción ampliada con más horas de monomotor complejo, multimotor y simulador según información revisada.
                      </p>
                    ) : null}
                    {isFby ? (
                      <p className="text-[15px] text-slate-500">
                        Simuladores: {FBY_SIM}.
                      </p>
                    ) : null}
                    {isFby && fbyMode === "integrated" ? (
                      <p className="text-[15px] text-slate-500">
                        APS MCC: 40 h en simulador A320.
                      </p>
                    ) : null}
                    {isFby && fbyMode === "university" ? (
                      <p className="text-[15px] text-slate-500">
                        Incluye ATPL integrado + grado universitario de 204 créditos.
                      </p>
                    ) : null}
                    {isFby && fbyMode === "cadet_500" ? (
                      <p className="text-[15px] text-slate-500">
                        ATPL 14 meses + FI 3 meses + 12 meses de empleo/instrucción.
                      </p>
                    ) : null}
                    {isAeroLink ? (
                      <>
                        <p className="text-[15px] text-slate-500">Simuladores: {AERO_LINK_SIM}.</p>
                        <p className="text-[15px] text-slate-500">
                          Incluye 135 h instrumental y 100 h PIC: VFR monomotor, travesías solo, SPIC, FNPT II, multimotor VFR/IFR, vuelos nocturnos, UPRT, KSA, MCC y JOC A320.
                        </p>
                      </>
                    ) : null}
                    {isAtlantic && !isAtlanticModular ? (
                      <>
                        <p className="text-[15px] text-slate-500">Simuladores: {ATLANTIC_SIM}.</p>
                        <p className="text-[15px] text-slate-500">
                          Al finalizar incluye ATPL teórico, CPL, IR, ME, MCC y UPRT.
                        </p>
                      </>
                    ) : null}
                    {isAtlanticModular ? (
                      <p className="text-[15px] text-slate-500">
                        Simuladores: FNPT II y simulador MCC/JOC por confirmar.
                      </p>
                    ) : null}
                    {isCanavia && canaviaMode === "integrated" ? (
                      <>
                        <p className="text-[15px] text-slate-500">Simuladores: {CANAVIA_SIM_STD}.</p>
                        <p className="text-[15px] text-slate-500">
                          Desglose: 126 h SEP + 14 h MEP + 65 h FNPT II + 20 h MEP trainer + 3 h skill test.
                        </p>
                      </>
                    ) : null}
                    {isCanavia && canaviaMode === "canavia_advanced" ? (
                      <>
                        <p className="text-[15px] text-slate-500">Simuladores: {CANAVIA_SIM_ADV}.</p>
                        <p className="text-[15px] text-slate-500">
                          Incluye APS MCC con 20 h adicionales en simulador jet frente al Standard.
                        </p>
                      </>
                    ) : null}
                    {isCanavia && canaviaMode === "canavia_first_officer" ? (
                      <>
                        <p className="text-[15px] text-slate-500">Simuladores: {CANAVIA_SIM_FO}.</p>
                        <p className="text-[15px] text-slate-500">
                          Incluye Advanced/APS MCC y Type Rating A320, B737, ATR 72 o Embraer 190.
                        </p>
                      </>
                    ) : null}
                    {isCanaviaModular ? (
                      <p className="text-[15px] text-slate-500">Simuladores: {CANAVIA_SIM_MOD}.</p>
                    ) : null}
                    {isCorflight ? (
                      <p className="text-[15px] text-slate-500">Simuladores: Por confirmar.</p>
                    ) : null}
                    {isLeap ? (
                      <>
                        <p className="text-[15px] text-slate-500">Simuladores: {LEAP_SIM}.</p>
                        <p className="text-[15px] text-slate-500">
                          26 semanas foundation + 13 semanas advanced + 3 semanas APS MCC.
                        </p>
                        <p className="text-[15px] text-slate-500">
                          Foundation 130,3 h; Advanced 27,5 h avión + 30,5 h simulador; A-UPRT 4 h vuelo; APS MCC 40 h simulador A320.
                        </p>
                      </>
                    ) : null}
                    {(() => {
                      const isModularRouteActive =
                        isEuropeanFlyersModular ||
                        (isOneAir && oneAirMode === "modular") ||
                        isEasBarcelonaModular ||
                        isFteJerezModular ||
                        isBfsModular ||
                        isMfs ||
                        isAerodynamicsModular ||
                        isBaaModular ||
                        isPanamediaModular ||
                        isWafa ||
                        isAtlanticModular ||
                        isCanaviaModular ||
                        isCorflightModular;
                      if (!isModularRouteActive) return null;
                      const modules = routeProfile?.modulesPublished ?? [];
                      if (modules.length === 0) {
                        return (
                          <p>
                            <span className="font-semibold text-slate-700">Módulos publicados:</span>{" "}
                            {isEasBarcelonaModular ? "Por confirmar por email" : "Por confirmar"}
                          </p>
                        );
                      }
                      return (
                        <div className="pt-1">
                          <p className="font-semibold text-slate-700">Módulos publicados:</p>
                          <ul className="mt-1 grid grid-cols-1 gap-x-3 gap-y-0.5 text-[15px] text-slate-700 sm:grid-cols-2">
                            {modules.map((module) => (
                              <li key={module}>- {module}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">C. Contrato y pagos</p>
                  <div className="mt-1 divide-y divide-slate-200/80 rounded-lg bg-slate-50/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">Contrato</p>
                      {/* Visualización forzada: chip verde "Sí" para todas las escuelas del
                          comparador. Se mantiene `school.contractAvailableBeforePayment`
                          intacto en el dataset y en cualquier cálculo/scoring; aquí solo se
                          fija el render. Las filas REEMBOLSO/CALENDARIO/DEPÓSITO/FINANCIACIÓN
                          siguen usando los valores reales sin tocar. */}
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Sí
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">Reembolso</p>
                      <p className="min-w-0 break-words text-right text-[15px] font-medium text-slate-800">
                        {routeProfile ? routeProfile.refundSummary : shortRefundSummary(school.refundPolicySummary)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">Calendario</p>
                      <p className="min-w-0 break-words text-right text-[15px] font-medium text-slate-800">{scheduleSummary}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">Depósito</p>
                      <p className="text-[15px] font-semibold text-slate-800">
                        {isAdventiaUniversity
                          ? "Pendiente"
                          : isAdventia
                            ? "470 € + 25.000 €"
                            : isEasBarcelonaModular
                              ? "Por confirmar"
                              : isEasBarcelona
                                ? "2.750 €"
                                : isFteJerezModular
                                  ? "Por confirmar"
                                  : isFteJerez
                                    ? "5.500 €"
                                      : isCesda
                                      ? "Por confirmar"
                                      : isBfs
                                        ? "Por confirmar"
                                        : isMfs
                                          ? "Por confirmar"
                                          : isQualityFly
                                            ? "Por confirmar"
                                              : isAerodynamics
                                              ? "Por confirmar"
                                              : isBaa
                                                ? "Por confirmar"
                                                : isPanamedia
                                                  ? "Por confirmar"
                                                  : isFaa
                                                    ? "Por confirmar"
                                                    : isWafa
                                                      ? "Por confirmar"
                                                      : isApa
                                                        ? "Por confirmar"
                                                        : isFby
                                                          ? "1.000 €"
                                                          : isAeroLink || isAtlantic || isCanavia || isCorflight
                                                            ? "Por confirmar"
                                                            : isLeap
                                                              ? "14.000 €"
                                                              : euro(school.depositOrEnrollmentFeeEUR)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">Financiación</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${chipClass(financingValue)}`}>{financingLabel}</span>
                    </div>
                    {financingNote ? (
                      <div className="min-w-0 px-2 py-1">
                        <p className="mt-0.5 break-words text-[15px] font-medium text-slate-800">{financingNote}</p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">D. Extras incluidos</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
                    {extrasItems.map((item) => (
                      <span key={item.label} className={`rounded-full border px-2 py-1 ${chipClass(item.value)}`}>
                        {item.label}: <span className="font-semibold">{"display" in item ? item.display : flag(item.value)}</span>
                      </span>
                    ))}
                  </div>
                </section>

                {/* Bloque compacto solo con confianza del dato + recuento de datos pendientes.
                  Se han retirado "Lectura FlyPath", "E. Riesgos / Red flags" y "F. Preguntas clave" porque
                  ahora viven en el bloque global "Conclusión FlyPath" debajo del comparador. */}
                <section className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">E. Confianza del dato</p>
                  <p className="mt-1.5 text-[15px] text-slate-600">
                    Confianza:{" "}
                    <span className="font-semibold">
                      {isAdventiaUniversity || isEasBarcelonaModular || isBfsModular
                        ? "Baja"
                        : isFteJerezModular
                          ? "Media"
                          : isQualityFly
                            ? "Media-alta (75/100)"
                            : isAerodynamicsModular
                              ? "Baja (45/100)"
                              : isAerodynamics
                                ? "Baja-media (50/100)"
                                : isBaaModular
                                  ? "Baja-media (50/100)"
                                  : isBaa
                                    ? "Media (65/100)"
                                    : isPanamediaModular
                                      ? "Baja-media (55/100)"
                                      : isPanamedia
                                        ? "Media (60/100)"
                                        : isFaa
                                          ? "Media (60/100)"
                                          : isWafa
                                            ? "Media-baja (55/100)"
                                            : isApa && apaMode === "atpl_premium"
                                              ? "Baja-media (50/100)"
                                              : isApa
                                                ? "Media-baja (55/100)"
                                                : isFby && fbyMode === "integrated"
                                                  ? "Media-alta (75/100)"
                                                  : isFby
                                                    ? "Media (65/100)"
                                                    : isAeroLink
                                                      ? "Media (60/100)"
                                                      : isAtlantic
                                                        ? "Media (60/100)"
                                                        : isCanaviaModular
                                                          ? "Media-alta (75/100)"
                                                          : isCanavia
                                                            ? "Alta (85/100)"
                                                            : isCorflightModular
                                                              ? "Baja (50/100)"
                                                              : isCorflight
                                                                ? "Baja-media (55/100)"
                                                                : isLeap
                                                                  ? "Alta (85/100)"
                                                                  : (() => {
                        const score = school.scores.dataConfidenceScore;
                        const hasReliableScore = typeof score === "number" && Number.isFinite(score) && score > 0;
                        return hasReliableScore
                          ? `${confidenceLabel(school.dataConfidence)} (${score}/100)`
                          : confidenceLabel(school.dataConfidence);
                      })()}
                    </span>
                  </p>
                  {school.pendingData.length > 0 ? (
                    <p className="mt-1 text-[15px] text-slate-500">Datos pendientes: {school.pendingData.length}</p>
                  ) : null}
                </section>
              </div>
            </article>
          );
        })}
      </div>

      <SchoolReviewComparisonSummary schools={schools} />
    </section>
  );
}
