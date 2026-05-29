"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FlyPathAlertsBlock } from "@/components/schools/FlyPathAlertsBlock";
import { LeaveReviewPlaceholderButton } from "@/components/schools/LeaveReviewPlaceholderButton";
import { SchoolProgramSelector } from "@/components/schools/SchoolProgramSelector";
import { buildFlyPathAlertsFromSources } from "@/lib/schools/school-detail-alerts";
import {
  defaultSchoolProgramId,
  getSchoolProgramOptions,
} from "@/lib/schools/school-detail-program-options";
import { getSchoolProgramContentOverrides } from "@/lib/schools/school-detail-program-profiles";
import { availabilityLabel, getPriceGap, routeTypeLabel } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

function euro(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function displayAdvertisedPrice(value: number): string {
  return value > 0 ? euro(value) : "No publicado";
}

function displayEstimatedPrice(value: number): string {
  return value > 0 ? euro(value) : "Pendiente";
}

function label(value: string): string {
  if (value === "yes") return "Sí";
  if (value === "no") return "No";
  if (value === "partial") return "Parcial";
  if (value === "optional") return "Opcional";
  return "Por confirmar";
}

type SchoolDetailBodyProps = {
  school: SchoolEntry;
};

/**
 * Cuerpo de la ficha individual FlyPath (cliente: selector de programas y alertas).
 */
export function SchoolDetailBody({ school }: SchoolDetailBodyProps) {
  const programOptions = useMemo(() => getSchoolProgramOptions(school.slug), [school.slug]);
  const [selectedProgramId, setSelectedProgramId] = useState(() =>
    defaultSchoolProgramId(school.slug),
  );
  const programOverrides = getSchoolProgramContentOverrides(school.slug, selectedProgramId);
  const selectorOptions = programOptions ?? [
    { id: "default", label: routeTypeLabel(school.routeType) },
  ];

  const isAdventia = school.slug === "adventia-usal";
  const isAdventiaUniversity = isAdventia && selectedProgramId === "university";
  const isEuropeanFlyers = school.slug === "european-flyers";
  const isEasBarcelona = school.slug === "eas-barcelona";
  const isFteJerez = school.slug === "fte-jerez";
  const isCesda = school.slug === "cesda-urv";
  const isBfs = school.slug === "barcelona-flight-school";
  const isMfs = school.slug === "mediterranean-flight-school";
  const isQualityFly = school.slug === "quality-fly";
  const isAerodynamics = school.slug === "aerodynamics-academy";
  const isBaa = school.slug === "baa-training-spain";
  const isPanamedia = school.slug === "panamedia-escuela-de-pilotos";
  const isFaa = school.slug === "flyschool-air-academy";
  const isWafa = school.slug === "world-aviation-ato";
  const isApa = school.slug === "airpull-aviation-academy";
  const isFby = school.slug === "flyby-aviation-academy";
  const priceGap = getPriceGap(school);
  const hasComparableCosts = Number.isFinite(priceGap);

  const advertisedPriceDisplay =
    programOverrides?.costs?.advertisedPrice ??
    (isFaa
      ? "80.000 € / 84.000 € / 95.000 €"
      : isWafa
        ? "Parcial"
        : isFby
          ? "79.500 € / 89.500 € / 91.400–101.600 €"
          : displayAdvertisedPrice(school.advertisedPriceEUR));

  const estimatedCostDisplay =
    programOverrides?.costs?.estimatedCost ??
    (isFaa
      ? "82.000 € / 86.000 € / 98.000 €"
      : isWafa
        ? "Pendiente"
        : isFby
          ? "82.000 € / 92.000 € / 95.000–105.000 €"
          : displayEstimatedPrice(school.flypathEstimatedRealCostEUR));

  const gapDisplay =
    programOverrides?.costs?.gap ??
    (isFaa
      ? "2.000 € / 2.000 € / 3.000 €"
      : isWafa
        ? "Pendiente"
        : isFby
          ? "2.500 € / 2.500 € / 3.400–3.600 €"
          : hasComparableCosts
            ? euro(priceGap)
            : "Pendiente");

  const flyPathAlerts = useMemo(() => {
    if (programOverrides?.alerts?.length) {
      return programOverrides.alerts;
    }

    const raw = isAdventia
      ? [
          "Precio publicado basado en curso 2023/2024 y pendiente de actualización.",
          "Tasas de Secretaría/Administración y exámenes oficiales no incluidas.",
          "Gastos de expedición de licencia CPL(A) no incluidos.",
          "Reserva solo reembolsable si no se supera el reconocimiento médico.",
          "Curso sujeto a mínimo de alumnos.",
          "Confirmar contrato completo y condiciones actualizadas antes de pagar.",
        ]
      : isEuropeanFlyers
        ? [
            "Precio publicado con fecha de edición; confirmar vigencia antes de pagar.",
            "Calendario de pagos, depósito y política de reembolso no publicados.",
            "Confirmar por escrito el alcance exacto de MCC APS y skill tests incluidos.",
          ]
        : isEasBarcelona
          ? [
              "Confirmar vigencia del precio 2026.",
              "Confirmar contrato completo y política de reembolso.",
              "Confirmar condiciones de financiación.",
              "Confirmar costes externos de alojamiento, transporte y manutención.",
              "Confirmar qué ocurre si no se supera una fase o examen.",
            ]
          : isFteJerez
            ? [
                "Precio alto.",
                "Formación adicional fuera del syllabus puede cobrarse aparte.",
                "Duración puede extenderse por circunstancias adversas.",
                "Confirmar política de reembolso.",
                "Confirmar condiciones de financiación.",
              ]
            : isCesda
              ? [
                  "Precio pendiente de aprobación en abril de 2026.",
                  "IPC y tasas aeroportuarias pueden modificar el coste de cursos posteriores.",
                  "Tasas AESA y evaluadores externos van aparte.",
                  "Falta confirmar contrato, depósito y reembolso.",
                  "Apoyo a inserción laboral no debe interpretarse como garantía de empleo.",
                ]
              : isBfs
                ? [
                    "Precio no publicado.",
                    "Calendario de pagos y depósito no publicados.",
                    "Tasas, skill tests, PBN, alojamiento y transporte por confirmar.",
                    "Contrato y reembolso por confirmar.",
                    "No comparar económicamente hasta recibir presupuesto oficial.",
                  ]
                : isMfs
                  ? [
                      "Precio no publicado.",
                      "Calendario de pagos y depósito no publicados.",
                      "Tasas, skill tests y materiales por confirmar.",
                      "Contrato y reembolso por confirmar.",
                      "No comparar económicamente hasta recibir presupuesto oficial.",
                    ]
                  : isQualityFly
                    ? [
                        "Oferta 2026 pendiente de confirmar antes de pagar.",
                        "Precio catálogo publicado superior: 89.500 €.",
                        "Falta depósito exacto.",
                        "Falta calendario mensual completo.",
                        "Falta política de reembolso.",
                        "Alojamiento opcional no incluido en el precio base.",
                        "Repeticiones tras primer intento pueden generar costes adicionales.",
                      ]
                    : isAerodynamics
                      ? [
                          "Precios no publicados.",
                          "Horas exactas no publicadas.",
                          "Calendario de pagos y depósito no publicados.",
                          "Tasas, skill tests, PBN, materiales y alojamiento por confirmar.",
                          "Contrato y reembolso por confirmar.",
                          "Diferencia exacta entre Classic y Platinum pendiente de confirmar.",
                          "No comparar económicamente hasta recibir presupuesto oficial.",
                        ]
                      : isBaa
                        ? [
                            "Precio base alto sin alojamiento ni manutención.",
                            "Evaluación inicial, Clase 1, ICAO English y tasas CAA no incluidas.",
                            "Skill tests y tasas deben confirmarse.",
                            "Falta contrato, reembolso, depósito y calendario de pagos.",
                            "Flota limitada en España.",
                          ]
                        : isPanamedia
                          ? [
                              "Precio no publicado.",
                              "Contrato, depósito, pagos y reembolso no publicados.",
                              "Tasas, skill tests, materiales y alojamiento por confirmar.",
                              "Tres bases pueden implicar logística adicional.",
                              "No comparar económicamente hasta recibir presupuesto oficial.",
                            ]
                          : isFaa
                            ? [
                                "Contrato y reembolso no publicados.",
                                "Calendario de pagos y depósito no publicados.",
                                "Flota completa no detallada.",
                                "Alojamiento no incluido.",
                                "Logística Madrid/Mallorca pendiente de confirmar.",
                                "En Cadet, condiciones laborales del contrato FI no publicadas.",
                              ]
                            : isWafa
                              ? [
                                  "Precio completo desde cero no publicado.",
                                  "Precios parciales no equivalen a ruta completa.",
                                  "Faltan IR, MEP, MCC y A-UPRT con precio claro.",
                                  "Flota y simuladores por confirmar.",
                                  "Contrato, depósito, pagos y reembolso no publicados.",
                                  "No comparar económicamente hasta recibir presupuesto oficial.",
                                ]
                              : isApa
                                ? [
                                    "Precios no publicados.",
                                    "Dossier oficial no accesible.",
                                    "Contrato, reembolso, depósito y pagos no publicados.",
                                    "Flota y simuladores no detallados.",
                                    "Extras incluidos pendientes de confirmar.",
                                    "No se puede comparar económicamente sin presupuesto oficial.",
                                  ]
                                : isFby
                                  ? [
                                      "Contrato completo y reembolso no publicados.",
                                      "Costes de repeticiones y horas extra pendientes de confirmar.",
                                      "Financiación no publicada.",
                                      "En Grado + ATPL, confirmar alojamiento/manutención durante años 2 y 3.",
                                      "En Cadet, confirmar condiciones laborales reales del puesto FI.",
                                      "No tratar puesto FI como garantía sin contrato.",
                                    ]
                                  : school.redFlags.length
                                    ? school.redFlags
                                    : ["Sin alertas críticas registradas en esta versión."];

    return buildFlyPathAlertsFromSources(raw);
  }, [
    programOverrides?.alerts,
    isAdventia,
    isEuropeanFlyers,
    isEasBarcelona,
    isFteJerez,
    isCesda,
    isBfs,
    isMfs,
    isQualityFly,
    isAerodynamics,
    isBaa,
    isPanamedia,
    isFaa,
    isWafa,
    isApa,
    isFby,
    school.redFlags,
  ]);

  const flyPathReading =
    programOverrides?.reading ??
    (isAdventia
      ? "Adventia publica bastante información del integrado: precio, pagos, duración, horas, flota, incluidos y financiación. Aun así, el precio aparece pendiente de actualización y hay tasas/costes administrativos y de expedición de licencia que quedan fuera."
      : isEuropeanFlyers
        ? "European Flyers publica el precio integrado y varios incluidos principales, pero faltan condiciones críticas antes de pagar: calendario de pagos, depósito, política de reembolso y contrato completo actualizado."
        : isEasBarcelona
          ? "EAS Barcelona ofrece un Integrado ATPL con información pública bastante completa en su dossier 2026. El programa incluye precio total, calendario de pagos, 247 h totales, MCC APS A320, UPRT, PBN, tasas, materiales, iPad/libros ATPL y uniforme. La ruta modular, en cambio, queda pendiente de información oficial por email."
          : isFteJerez
            ? "FTEJerez publica información muy sólida del AFOP 2026: precio, pagos, duración, horas, alojamiento full board, material, uniforme, primer intento de exámenes, landing/navigation fees, APS MCC y A-UPRT. La ruta FD+ modular también tiene información útil, pero no es una ruta desde cero y requiere PPL y experiencia previa."
            : isCesda
              ? "CESDA ofrece una vía diferente a un integrado ATPL puro: un grado universitario oficial junto con la licencia ATPL. La información pública es bastante completa en cuanto a horas, servicios, material, UPRT, PBN, MCC A320, flota y fraccionamiento de pagos. Sin embargo, el precio está pendiente de aprobación, los cursos posteriores pueden variar por IPC y tasas aeroportuarias, y las tasas AESA/evaluadores externos van aparte. Antes de pagar conviene pedir coste final completo, contrato, depósito y política de reembolso."
              : isBfs
                ? "Barcelona Flight School publica información útil sobre la estructura del Integrated ATPL, duración, horas, APS MCC B737-800NG, Advanced UPRT, material online con iPad incluido y flota/simuladores. También ofrece cursos modulares, pero no se han localizado precios públicos ni condiciones económicas suficientes. La escuela debe quedar pendiente de presupuesto oficial por email antes de compararla por coste."
                : isMfs
                  ? "Mediterranean Flight School encaja como escuela de ruta modular, pero la información pública localizada no permite calcular un coste real ni comparar precios con otras escuelas. Debe quedar pendiente de email para confirmar módulos, precios, horas, tasas, skill tests, contrato, pagos y reembolso."
                  : isQualityFly
                    ? "Quality Fly destaca por publicar una información bastante completa del ATPL integrado: precio oferta, precio catálogo, duración, estructura por fases, flota, horas, APS MCC, UPRT, PBN, material de vuelo, iPad, uniforme, tasas teóricas EASA y verificaciones de vuelo incluidas en primer intento. Aun así, antes de pagar conviene confirmar por escrito la vigencia de la oferta, depósito, calendario mensual, contrato, reembolso, financiación y costes de repetición."
                    : isAerodynamics
                      ? "Aerodynamics Academy publica varias rutas: Integrated ATPL Classic, Integrated ATPL Platinum y una ruta modular CPL + MEIR + ATPL. La información pública permite identificar estructura, duración aproximada de los integrados y módulos principales, pero no permite calcular un coste real ni comparar precios. Debe quedar pendiente de email para confirmar precios, horas, módulos, tasas, skill tests, contrato, pagos, reembolso y diferencias exactas entre Classic y Platinum."
                      : isBaa
                        ? "BAA Training Spain publica un ATPL integrado con datos operacionales razonables y precio base de 108.000 €, pero deja fuera varios costes relevantes: evaluación inicial, Clase 1, ICAO English, tasas CAA, alojamiento y manutención. La ruta modular también aparece, pero sin desglose económico suficiente. Antes de comparar o pagar, conviene pedir presupuesto completo, contrato, calendario, reembolso y costes externos."
                        : isPanamedia
                          ? "Panamedia destaca por publicar bastante información operacional: bases, flota, simuladores, horas del integrado y estructura modular. El punto débil es la falta de transparencia económica en abierto: no se han localizado precios, contrato, depósito, pagos, reembolso ni desglose claro de extras. Debe quedar pendiente de email antes de compararla por coste real."
                          : isFaa
                            ? "Flyschool Air Academy publica tres paquetes con precios y horas claras: Profesional 250 h, Advance 275 h y Cadet 500 h. También declara numerosos extras incluidos como PBN, UPRT, APS MCC, certificado médico, iPad, uniforme, tasas y skill tests. Aun así, faltan datos críticos antes de pagar: contrato, reembolso, depósito, calendario completo, financiación, flota detallada y, en el caso del Cadet, condiciones laborales del supuesto contrato FI."
                            : isWafa
                              ? "World Aviation Flight Academy puede ser útil para alumnos que quieran avanzar por módulos, especialmente si ya tienen parte de la formación hecha. Sin embargo, la información pública no permite calcular una ruta profesional completa desde cero. Los precios publicados son parciales y dependen del punto de partida del alumno. Antes de decidir, conviene pedir presupuesto completo, módulos obligatorios, tasas, skill tests, contrato, pagos, reembolso, flota y simuladores."
                              : isApa
                                ? "Airpull Aviation Academy destaca por operar desde una base propia en Requena y por ofrecer tres opciones de ATPL integrado en 15 meses: Basic, Advanced y Premium. La información pública permite identificar parte de la estructura y algunas horas, pero no permite calcular costes ni comparar con otras escuelas. Debe quedar pendiente de email para confirmar precios, horas detalladas, flota, simuladores, extras incluidos, pagos, contrato y reembolso."
                                : isFby
                                  ? "FlyBy destaca por publicar precios cerrados y una gran cantidad de extras incluidos: alojamiento, manutención, transporte, material, tasas, skill tests, PBN, UPRT y APS MCC. Esto facilita la planificación económica frente a escuelas con precios menos claros. Aun así, antes de pagar conviene pedir contrato completo, reembolso, condiciones de repeticiones, financiación y, en el caso del Cadet, detalles laborales del puesto de instructor."
                                  : "Cruza esta escuela con tu perfil, presupuesto, Clase 1, disponibilidad e inglés para saber si es una opción sólida antes de pagar matrícula o depósito.");

  return (
    <>
        <section className="rounded-3xl border border-[#c9a454]/30 bg-[#0f1a33] p-5 text-white shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
            {isAdventia
              ? "FORMACIÓN UNIVERSITARIA E INTEGRADA"
              : isCesda
                ? "GRADO UNIVERSITARIO + LICENCIA ATPL"
              : isEuropeanFlyers || isEasBarcelona || isFteJerez || isBfs
                ? "FORMACIÓN INTEGRADA Y MODULAR"
              : isMfs
                ? "FORMACIÓN MODULAR"
              : isQualityFly
                ? "FORMACIÓN INTEGRADA ATPL"
              : isAerodynamics
                ? "FORMACIÓN INTEGRADA Y MODULAR"
              : isBaa
                ? "FORMACIÓN INTEGRADA Y MODULAR"
              : isPanamedia
                ? "FORMACIÓN INTEGRADA Y MODULAR"
              : isFaa
                ? "PROGRAMAS PROFESIONALES ATPL POR PAQUETES"
              : isWafa
                ? "FORMACIÓN MODULAR"
              : isApa
                ? "ATPL INTEGRADO CON BASE PROPIA"
              : isFby
                ? "PROGRAMAS INTEGRADOS ATPL, GRADO Y CADET"
                : routeTypeLabel(school.routeType)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{isAdventia ? "Adventia" : school.name}</h1>
          <p className="mt-2 text-[15px] text-slate-200">
            {isEasBarcelona
              ? "Barcelona, España · Base Barcelona / Sabadell · ATO EAS Barcelona"
              : isFteJerez
                ? "Jerez de la Frontera, España · Aeropuerto de Jerez / Base Aérea La Parra · ATO FTEJerez"
              : isCesda
                ? "Reus, España · Campus Aeronáutico de Reus / Aeropuerto de Reus / Aeropuerto de Lleida · CESDA / Universitat Rovira i Virgili"
              : isBfs
                ? "Barcelona, España · Barcelona / Sabadell · Barcelona Flight School"
              : isMfs
                ? "Reus, España · Aeropuerto de Reus · Mediterranean Flight School"
              : isQualityFly
                ? "Madrid, España · Cuatro Vientos · Quality Fly"
              : isAerodynamics
                ? "Málaga, España · Aeropuerto de Málaga / Vélez-Málaga · Aerodynamics Academy"
              : isBaa
                ? "Lleida, España · Aeródromo de Lleida-Alguaire · BAA Training Spain"
              : isPanamedia
                ? "Mallorca / Valencia / Castellón, España · Son Bonet / Valencia-Manises / Castellón · Panamedia International Flight School"
              : isFaa
                ? "Madrid / Mallorca, España · Cuatro Vientos / Son Bonet · Flyschool Air Academy"
              : isWafa
                ? "Málaga / Madrid, España · Málaga / Cuatro Vientos · World Aviation Flight Academy"
              : isApa
                ? "Requena, España · Aeródromo de Requena / Valencia · Airpull Aviation Academy"
              : isFby
                ? "Burgos / Logroño, España · Burgos · Logroño · FlyBy Aviation Academy"
                : `${school.city}, ${school.country} · Base ${school.baseAirport} · ATO ${school.atoName}`}
          </p>
        </section>

        <SchoolProgramSelector
          options={selectorOptions}
          selectedId={programOptions ? selectedProgramId : selectorOptions[0]?.id ?? "default"}
          onSelect={setSelectedProgramId}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[15px] text-slate-500">Precio anunciado</p>
            <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{advertisedPriceDisplay}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[15px] text-slate-500">Coste real estimado FlyPath</p>
            <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{estimatedCostDisplay}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[15px] text-slate-500">Brecha estimada</p>
            <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{gapDisplay}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-[#0f1a33]">{isAdventia || isEuropeanFlyers || isEasBarcelona || isFteJerez || isCesda || isBfs || isMfs || isQualityFly || isAerodynamics || isBaa || isPanamedia || isFaa || isWafa || isApa || isFby ? "Incluidos principales" : "Incluidos y condiciones"}</p>
            {isAdventiaUniversity ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Licencias incluidas: <span className="font-semibold">Por confirmar</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Por confirmar</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">Opcional / por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Pendiente</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isAdventia ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Sí</span></li>
                <li>Material: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Opcional</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Sí</span></li>
                <li>Reembolso: <span className="font-semibold">Parcial / condicionado</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Publicado</span></li>
                <li>Financiación: <span className="font-semibold">Sí</span></li>
              </ul>
            ) : isEuropeanFlyers ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Sí</span></li>
                <li>Skill tests: <span className="font-semibold">Sí</span></li>
                <li>Material: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Opcional</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Sí</span></li>
                <li>Calendario de pagos: <span className="font-semibold">No publicado</span></li>
                <li>Reembolso: <span className="font-semibold">No publicado</span></li>
              </ul>
            ) : isEasBarcelona ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC A320</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Sí</span></li>
                <li>Skill tests: <span className="font-semibold">Sí · primera convocatoria</span></li>
                <li>Material: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Opcional</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Sí</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Sí</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
                <li>Pagos: <span className="font-semibold">2.750 € reserva + 20.000 € al inicio + 4.275 €/mes x 18</span></li>
              </ul>
            ) : isFteJerez ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Sí · primer intento</span></li>
                <li>Skill tests: <span className="font-semibold">Sí · primer intento</span></li>
                <li>Material: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Sí · full board</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Sí</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Sí</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
                <li>Pagos: <span className="font-semibold">5.500 € depósito + 29.000 € antes del inicio + pagos por semanas 20, 30, 40 y 50</span></li>
              </ul>
            ) : isCesda ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC A320</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">No</span></li>
                <li>Skill tests: <span className="font-semibold">No · evaluadores externos aparte</span></li>
                <li>Material: <span className="font-semibold">Sí</span></li>
                <li>iPad: <span className="font-semibold">Sí</span></li>
                <li>Uniforme: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Sí</span></li>
                <li>Financiación: <span className="font-semibold">Sí</span></li>
                <li>Pagos: <span className="font-semibold">1, 2, 4 o 9 cuotas sin coste añadido por curso</span></li>
              </ul>
            ) : isBfs ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC B737-800NG</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Por confirmar</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Por confirmar</span></li>
                <li>Material: <span className="font-semibold">Sí · iPad y material online</span></li>
                <li>Alojamiento: <span className="font-semibold">Por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isMfs ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Por confirmar</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">Por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isQualityFly ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC A320</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Sí · EASA teóricos un intento</span></li>
                <li>Skill tests: <span className="font-semibold">Sí · CPL, IR, PBN y MEP un intento</span></li>
                <li>Material: <span className="font-semibold">Sí</span></li>
                <li>iPad: <span className="font-semibold">Sí</span></li>
                <li>Uniforme: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Opcional · desde 865 €/mes</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Parcial</span></li>
                <li>Financiación: <span className="font-semibold">Sí</span></li>
                <li>Pagos: <span className="font-semibold">precio oferta 2026 de 86.000 €, resto de pagos mensuales, financiación CaixaBank hasta 150.000 €</span></li>
              </ul>
            ) : isAerodynamics ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC A320</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Por confirmar</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Por confirmar</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">Por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isBaa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · 16 h MCC</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí · 3 h</span></li>
                <li>PBN: <span className="font-semibold">Sí · dentro de IFR</span></li>
                <li>Tasas: <span className="font-semibold">No</span></li>
                <li>Skill tests: <span className="font-semibold">No</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">No</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isPanamedia ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC 35 h</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Por confirmar</span></li>
                <li>PBN: <span className="font-semibold">Sí · IR-PBN</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Por confirmar</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">Por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Sí · BBVA</span></li>
              </ul>
            ) : isFaa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Sí</span></li>
                <li>Skill tests: <span className="font-semibold">Sí</span></li>
                <li>Materiales: <span className="font-semibold">Sí</span></li>
                <li>iPad: <span className="font-semibold">Sí</span></li>
                <li>Uniforme: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">No</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isWafa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Módulo aparte / por confirmar</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Módulo aparte / por confirmar</span></li>
                <li>PBN: <span className="font-semibold">Por confirmar</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">No · por confirmar según módulo</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">No</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isApa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Por confirmar</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Por confirmar</span></li>
                <li>PBN: <span className="font-semibold">Por confirmar</span></li>
                <li>Tasas: <span className="font-semibold">Por confirmar</span></li>
                <li>Skill tests: <span className="font-semibold">Por confirmar</span></li>
                <li>Material: <span className="font-semibold">Por confirmar</span></li>
                <li>Alojamiento: <span className="font-semibold">Opcional · por confirmar</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Por confirmar</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : isFby ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>MCC/JOC: <span className="font-semibold">Sí · APS MCC 40 h A320</span></li>
                <li>Advanced UPRT: <span className="font-semibold">Sí</span></li>
                <li>PBN: <span className="font-semibold">Sí</span></li>
                <li>Tasas: <span className="font-semibold">Sí</span></li>
                <li>Skill tests: <span className="font-semibold">Sí</span></li>
                <li>Materiales: <span className="font-semibold">Sí</span></li>
                <li>iPad: <span className="font-semibold">Sí</span></li>
                <li>Uniforme: <span className="font-semibold">Sí</span></li>
                <li>Alojamiento: <span className="font-semibold">Sí · parcial · según paquete</span></li>
                <li>Transporte: <span className="font-semibold">Sí · parcial · según paquete</span></li>
                <li>Contrato antes de pagar: <span className="font-semibold">Por confirmar</span></li>
                <li>Reembolso: <span className="font-semibold">Por confirmar</span></li>
                <li>Calendario de pagos: <span className="font-semibold">Sí</span></li>
                <li>Financiación: <span className="font-semibold">Por confirmar</span></li>
              </ul>
            ) : (
              <>
                <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                  <li>MCC/JOC: <span className="font-semibold">{label(school.mccJocIncluded)}</span></li>
                  <li>Advanced UPRT: <span className="font-semibold">{label(school.advancedUprtIncluded)}</span></li>
                  <li>Tasas: <span className="font-semibold">{label(school.examFeesIncluded)}</span></li>
                  <li>Skill tests: <span className="font-semibold">{label(school.skillTestsIncluded)}</span></li>
                  <li>Material: <span className="font-semibold">{label(school.trainingMaterialsIncluded)}</span></li>
                  <li>Alojamiento: <span className="font-semibold">{label(school.accommodationIncluded)}</span></li>
                  <li>Contrato antes de pagar: <span className="font-semibold">{label(school.contractAvailableBeforePayment)}</span></li>
                </ul>
                <p className="mt-3 text-[15px] text-slate-600">Pagos: {school.paymentScheduleSummary}</p>
                <p className="mt-1 text-[15px] text-slate-600">Reembolso: {school.refundPolicySummary}</p>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-[#0f1a33]">Operación y ruta</p>
            {isAdventiaUniversity ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">Pendiente</span></li>
                <li>Base: <span className="font-semibold">Salamanca · Salamanca-Matacán</span></li>
                <li>Horas de vuelo: <span className="font-semibold">Por confirmar</span></li>
                <li>Idioma formación: <span className="font-semibold">Por confirmar</span></li>
                <li>Clase 1: <span className="font-semibold">Por confirmar</span></li>
                <li>Titulación: <span className="font-semibold">Grado universitario + licencia ATPL</span></li>
              </ul>
            ) : isAdventia ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">20 meses</span></li>
                <li>Base: <span className="font-semibold">Salamanca-Matacán</span></li>
                <li>Flota: <span className="font-semibold">Aerospatiale Tobago TB10, Beechcraft Bonanza F33A y Beechcraft Baron B55</span></li>
                <li>Simuladores: <span className="font-semibold">SR-BOX, FNPT II, Adv1000-PBN y A320 MCC</span></li>
                <li>Horas: <span className="font-semibold">261,5 h de vuelo certificadas</span></li>
                <li>Idioma formación: <span className="font-semibold">Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
              </ul>
            ) : isEuropeanFlyers ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">24 meses</span></li>
                <li>Bases: <span className="font-semibold">Madrid (Cuatro Vientos) / Alicante (Mutxamel)</span></li>
                <li>Flota: <span className="font-semibold">Cessna 172 G1000 y Diamond DA42 NG</span></li>
                <li>Horas: <span className="font-semibold">180 h de vuelo real</span></li>
                <li>Idioma formación: <span className="font-semibold">Español e inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida para integrado y cursos profesionales; PPL requiere Clase 2.</span></li>
              </ul>
            ) : isEasBarcelona ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">18 meses</span></li>
                <li>Base: <span className="font-semibold">Barcelona / Sabadell</span></li>
                <li>Flota: <span className="font-semibold">Tecnam P2002JF, Tecnam P2008JC, P-Mentor, Tecnam P2006T y C150 Aerobat</span></li>
                <li>Horas: <span className="font-semibold">247 h totales</span></li>
                <li>Idioma formación: <span className="font-semibold">Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
              </ul>
            ) : isFteJerez ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">62 semanas de formación</span></li>
                <li>Base: <span className="font-semibold">Jerez de la Frontera / Aeropuerto de Jerez</span></li>
                <li>Flota: <span className="font-semibold">Piper PA28 Warrior, Piper PA28 Archer DTX, Diamond DA42, Robin R2160 y Citabria High Country Explorer</span></li>
                <li>Simuladores: <span className="font-semibold">Alsim AL250-63 FNPT II, Diamond DA42 FNPT II, B737-800 NG FTD2 y Airbus A320 FTD</span></li>
                <li>Horas: <span className="font-semibold">single engine, twin engine, FNPT II, APS MCC y A-UPRT incluidos</span></li>
                <li>Idioma formación: <span className="font-semibold">Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
              </ul>
            ) : isCesda ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">4 cursos académicos</span></li>
                <li>Base: <span className="font-semibold">Campus Aeronáutico de Reus / Aeropuerto de Reus / Aeropuerto de Lleida</span></li>
                <li>Flota: <span className="font-semibold">Diamond DA20-C1, Diamond DA42NG y Piper PA-28R-201</span></li>
                <li>Horas: <span className="font-semibold">170 h de vuelo real + 115 h de simulador</span></li>
                <li>Idioma formación: <span className="font-semibold">Por confirmar</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
                <li>Titulación: <span className="font-semibold">Grado universitario oficial + licencia ATPL</span></li>
              </ul>
            ) : isBfs ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">18–24 meses</span></li>
                <li>Base: <span className="font-semibold">Barcelona / Sabadell</span></li>
                <li>Flota: <span className="font-semibold">C152, P92, C172R-S, P2006T, FNPT II P2006T y FNPT II B737-800NG</span></li>
                <li>Horas: <span className="font-semibold">230 h de instrucción de vuelo</span></li>
                <li>Desglose: <span className="font-semibold">95 h VFR + 95 h IFR + 40 h APS MCC</span></li>
                <li>Idioma formación: <span className="font-semibold">Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
              </ul>
            ) : isMfs ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">Variable según módulos</span></li>
                <li>Base: <span className="font-semibold">Reus / Aeropuerto de Reus</span></li>
                <li>Flota: <span className="font-semibold">Por confirmar</span></li>
                <li>Horas: <span className="font-semibold">Por confirmar</span></li>
                <li>Idioma formación: <span className="font-semibold">Por confirmar</span></li>
                <li>Clase 1: <span className="font-semibold">Por confirmar según módulo</span></li>
                <li>Módulos publicados: <span className="font-semibold">PPL, Time building, ATPL teórico, MEP, IR, CPL, UPRT, PBN — precios no publicados</span></li>
              </ul>
            ) : isQualityFly ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">20 meses</span></li>
                <li>Base: <span className="font-semibold">Madrid / Cuatro Vientos</span></li>
                <li>Flota: <span className="font-semibold">Tecnam P2006T, Tecnam P2008 y Cessna 172S</span></li>
                <li>Horas: <span className="font-semibold">220 h de vuelo y simulador + 3 sesiones de planeador</span></li>
                <li>Desglose: <span className="font-semibold">90 h SEP VFR + 15 h SIM IFR + 44 h SEP IFR + 21 h ME + 40 h APS MCC</span></li>
                <li>Idioma formación: <span className="font-semibold">Español / por confirmar si también inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
              </ul>
            ) : isAerodynamics ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">Classic 16–18 meses / Platinum 20–24 meses / modular variable</span></li>
                <li>Base: <span className="font-semibold">Málaga / Aeropuerto de Málaga / Vélez-Málaga</span></li>
                <li>Flota: <span className="font-semibold">Por confirmar</span></li>
                <li>Horas: <span className="font-semibold">Por confirmar</span></li>
                <li>Idioma formación: <span className="font-semibold">Por confirmar</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida para integrados; por confirmar según módulo en modular</span></li>
                <li>Rutas publicadas: <span className="font-semibold">Integrated ATPL Classic, Integrated ATPL Platinum y ruta modular CPL + MEIR + ATPL</span></li>
              </ul>
            ) : isBaa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">16–18 meses</span></li>
                <li>Base: <span className="font-semibold">Lleida / Aeródromo de Lleida-Alguaire</span></li>
                <li>Flota: <span className="font-semibold">10 Cessna 172S y 1 Tecnam P2006T</span></li>
                <li>Simulador: <span className="font-semibold">FNPT II Tecnam P2006T</span></li>
                <li>Horas: <span className="font-semibold">837 h teoría + 207 h vuelo</span></li>
                <li>Idioma formación: <span className="font-semibold">Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
                <li>Rutas publicadas: <span className="font-semibold">Integrado ATPL y ruta modular/CPL</span></li>
              </ul>
            ) : isPanamedia ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">integrado con 828 h de teoría + fase práctica; modular 18–36 meses</span></li>
                <li>Bases: <span className="font-semibold">Mallorca / Valencia / Castellón</span></li>
                <li>Flota: <span className="font-semibold">Cessna F150/F172, Piper Arrow, Piper Turbo Arrow, Tecnam P-Mentor y Piper Turbo Seneca III</span></li>
                <li>Simuladores: <span className="font-semibold">Airbus A320 FFS, FNPT II Beechcraft King Air B200 y otros dispositivos</span></li>
                <li>Horas integrado: <span className="font-semibold">166 h vuelo + 95 h simulador</span></li>
                <li>Horas modular: <span className="font-semibold">255,5 h vuelo + 862 h teoría aprox.</span></li>
                <li>Idioma formación: <span className="font-semibold">Español / Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida para ruta profesional</span></li>
                <li>Rutas publicadas: <span className="font-semibold">Integrado ATPL y ruta modular CPL/ATPL</span></li>
              </ul>
            ) : isFaa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">Por confirmar</span></li>
                <li>Bases: <span className="font-semibold">Madrid / Cuatro Vientos y Mallorca / Son Bonet</span></li>
                <li>Flota: <span className="font-semibold">Por confirmar</span></li>
                <li>Simuladores: <span className="font-semibold">Airbus A320 / B737 y FNPT II por confirmar</span></li>
                <li>Horas: <span className="font-semibold">250 h, 275 h o 500 h según paquete</span></li>
                <li>Idioma formación: <span className="font-semibold">Español / Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
                <li>Rutas publicadas: <span className="font-semibold">Profesional 250 h, Advance 275 h y Cadet 500 h</span></li>
              </ul>
            ) : isWafa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">Variable según módulos</span></li>
                <li>Bases: <span className="font-semibold">Málaga / Madrid</span></li>
                <li>Flota: <span className="font-semibold">Por confirmar</span></li>
                <li>Simuladores: <span className="font-semibold">FNPT II / por confirmar</span></li>
                <li>Horas: <span className="font-semibold">Por confirmar según ruta completa</span></li>
                <li>Idioma formación: <span className="font-semibold">Español / Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida para fases profesionales</span></li>
                <li>Rutas publicadas: <span className="font-semibold">Ruta modular</span></li>
                <li className="pt-2 font-semibold text-slate-700">Módulos publicados:</li>
                <li>- PPL(A): <span className="font-semibold">9.907 €</span></li>
                <li>- ATPL modular desde PPL: <span className="font-semibold">25.221 €</span></li>
                <li>- ATPL modular desde CPL: <span className="font-semibold">16.029 €</span></li>
                <li>- CPL modular con IR: <span className="font-semibold">3.425 €</span></li>
                <li>- CPL modular sin IR: <span className="font-semibold">7.211 €</span></li>
                <li>- IR: <span className="font-semibold">Precio no publicado</span></li>
                <li>- MEP: <span className="font-semibold">Precio no publicado</span></li>
                <li>- MCC: <span className="font-semibold">Precio no publicado</span></li>
                <li>- A-UPRT: <span className="font-semibold">Precio no publicado</span></li>
              </ul>
            ) : isApa ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">15 meses</span></li>
                <li>Base: <span className="font-semibold">Requena / Aeródromo de Requena</span></li>
                <li>Flota: <span className="font-semibold">Por confirmar</span></li>
                <li>Simuladores: <span className="font-semibold">Por confirmar</span></li>
                <li>Horas: <span className="font-semibold">Basic 155 h vuelo + 40 h simulador; Advanced 195 h vuelo; Premium por confirmar</span></li>
                <li>Idioma formación: <span className="font-semibold">Español / Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
                <li>Rutas publicadas: <span className="font-semibold">ATPL Basic, ATPL Advanced y ATPL Premium</span></li>
              </ul>
            ) : isFby ? (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">14 meses integrado / 3 años grado / 29 meses cadet</span></li>
                <li>Bases: <span className="font-semibold">Burgos / Logroño</span></li>
                <li>Flota: <span className="font-semibold">45 aviones: Tecnam P2008JC, P-Mentor, P2002JF, PS-28 Cruiser, Cessna 172, Piper PA-28, Super Decathlon y Tecnam P2006T</span></li>
                <li>Simuladores: <span className="font-semibold">FNPT II Tecnam P2006T, A320/MCC y otros dispositivos</span></li>
                <li>Horas: <span className="font-semibold">238 h vuelo integrado; 278 h vuelo aprox. en grado; 238 h ATPL + 30 h FI + mínimo 600 h instructor en cadet</span></li>
                <li>Idioma formación: <span className="font-semibold">Inglés</span></li>
                <li>Clase 1: <span className="font-semibold">Requerida</span></li>
                <li>Rutas publicadas: <span className="font-semibold">Integrado ATPL, Grado + ATPL, Cadet ATPL + FI</span></li>
                <li className="text-[15px] text-slate-500">Programa India EASA + DGCA: no incluido como toggle principal; tratar como programa específico internacional.</li>
              </ul>
            ) : (
              <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                <li>Duración programa: <span className="font-semibold">{school.programDurationMonths} meses</span></li>
                <li>Flota: <span className="font-semibold">{school.fleetSummary}</span></li>
                <li>Disponibilidad aeronaves: <span className="font-semibold">{availabilityLabel(school.aircraftAvailability)}</span></li>
                <li>Ratio alumno/avión: <span className="font-semibold">{school.studentAircraftRatio || "No disponible"}</span></li>
                <li>Ratio instructor/alumno: <span className="font-semibold">{school.instructorStudentRatio || "No disponible"}</span></li>
                <li>Idioma formación: <span className="font-semibold">{school.languageOfInstruction}</span></li>
                <li>Clase 1: <span className="font-semibold">{school.class1Requirement}</span></li>
              </ul>
            )}
          </article>
        </section>

        {isAdventia && !isAdventiaUniversity ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-[#0f1a33]">Pagos y condiciones</p>
            <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
              <li>Pre-reserva: <span className="font-semibold">470 €</span></li>
              <li>Apertura de expediente: <span className="font-semibold">25.000 €</span></li>
              <li>Matrícula: <span className="font-semibold">74.000 €</span></li>
              <li>Modalidades: <span className="font-semibold">pago único, pago fraccionado o financiación mensual</span></li>
              <li>Reembolso: <span className="font-semibold">reserva solo reembolsable si no se supera el reconocimiento médico</span></li>
            </ul>
          </section>
        ) : null}

        {isAdventiaUniversity ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-[#0f1a33]">Bloque universidad / grado + licencia</p>
            <div className="mt-3 grid gap-2 text-[15px] text-slate-700 md:grid-cols-2">
              <p>Universidad: <span className="font-semibold">Universidad de Salamanca</span></p>
              <p>Grado: <span className="font-semibold">Piloto de aviación comercial y operaciones aéreas</span></p>
              <p>Duración académica: <span className="font-semibold">Por confirmar</span></p>
              <p>Coste total estimado: <span className="font-semibold">Pendiente</span></p>
              <p>Licencias incluidas: <span className="font-semibold">Por confirmar</span></p>
              <p>Política Clase 1: <span className="font-semibold">Por confirmar</span></p>
            </div>
          </section>
        ) : school.universityTrack ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-[#0f1a33]">Bloque universidad / grado + licencia</p>
            <div className="mt-3 grid gap-2 text-[15px] text-slate-700 md:grid-cols-2">
              <p>Universidad: <span className="font-semibold">{school.universityTrack.universityName}</span></p>
              <p>Grado: <span className="font-semibold">{school.universityTrack.degreeName}</span></p>
              <p>ECTS: <span className="font-semibold">{school.universityTrack.ects}</span></p>
              <p>Duración académica: <span className="font-semibold">{school.universityTrack.academicDurationYears} años</span></p>
              <p>Coste académico: <span className="font-semibold">{euro(school.universityTrack.academicCostEUR)}</span></p>
              <p>Coste vuelo: <span className="font-semibold">{euro(school.universityTrack.flightCostEUR)}</span></p>
              <p>Coste total estimado: <span className="font-semibold">{euro(school.universityTrack.totalEstimatedCostEUR)}</span></p>
              <p>Política Clase 1: <span className="font-semibold">{school.universityTrack.class1FailurePolicy}</span></p>
            </div>
          </section>
        ) : null}

        <FlyPathAlertsBlock alerts={flyPathAlerts} />


        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-[#0f1a33]">Opiniones verificadas</p>
          <p className="mt-1 text-[15px] text-slate-600">
            Estamos preparando un sistema de opiniones verificadas de alumnos y exalumnos
            para mostrar experiencia real sobre costes, organización, disponibilidad de
            aviones, instructores y soporte administrativo.
          </p>
          <LeaveReviewPlaceholderButton />
        </section>

        <section className="rounded-2xl border border-[#c9a454]/30 bg-[#0f1a33] p-5 text-white">
          <p className="text-sm font-semibold text-[#f2ddaa]">Lectura FlyPath</p>
          <p className="mt-1 text-[15px] text-slate-200">{flyPathReading}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/schools?add=${school.slug}`} className="inline-flex min-h-[40px] items-center rounded-xl bg-[#c9a454] px-4 py-2 text-[15px] font-semibold text-[#0f1a33]">
              Añadir a comparación
            </Link>
            <Link href="/schools?results=1" className="inline-flex min-h-[40px] items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[15px] font-semibold">
              Volver al comparador
            </Link>
          </div>
        </section>
    </>
  );
}

