import type {
  FlypathSchoolRecommendation,
  ReadinessSchoolAnalyzed,
  School,
  SchoolAnalysisSummary,
  SchoolStatsSummary,
  YesNoUnknown,
} from "@/lib/reporting/types/shared";

function clampSchoolScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function yesScore(value: YesNoUnknown, yes = 10, no = -6, unknown = -2): number {
  if (value === "si") return yes;
  if (value === "no") return no;
  return unknown;
}

/**
 * Análisis documental/comercial de una escuela candidata.
 * Mantiene la heurística histórica del planner sin alterar umbrales ni mensajes.
 */
export function schoolAnalysis(school: School, totalRealista: number): SchoolAnalysisSummary {
  let claridadCoste = 30 + (school.precioAnunciado > 0 ? 10 : -10) + yesScore(school.calendarioPagosClaro, 12, -10, -3);
  claridadCoste += yesScore(school.tasasIncluidas, 8, -5, -2) + yesScore(school.skillTestsIncluidos, 7, -4, -2);

  let transparencia = 30;
  transparencia += yesScore(school.contratoAntesPagar, 12, -10, -4);
  transparencia += yesScore(school.reembolsoClaro, 10, -8, -3);
  transparencia += yesScore(school.flotaExplicada, 8, -5, -2);
  transparencia += yesScore(school.mantenimientoExplicado, 8, -5, -2);
  transparencia += yesScore(school.ratioAlumnoAvionConocido, 8, -5, -2);

  let riesgoFinanciero = 60;
  riesgoFinanciero -= yesScore(school.calendarioPagosClaro, 10, -8, -2);
  riesgoFinanciero -= yesScore(school.reembolsoClaro, 10, -8, -2);
  if (school.precioAnunciado > totalRealista * 1.15) riesgoFinanciero += 15;
  if (school.estadoVerificacion === "no_verificado") riesgoFinanciero += 10;

  let riesgoOperacional = 55;
  riesgoOperacional -= yesScore(school.flotaExplicada, 8, -8, -3);
  riesgoOperacional -= yesScore(school.mantenimientoExplicado, 8, -8, -3);
  riesgoOperacional -= yesScore(school.ratioAlumnoAvionConocido, 8, -6, -3);

  let riesgoMarketing = 55;
  if (school.promesasEmpleo === "garantia_contractual") riesgoMarketing += 5;
  if (school.promesasEmpleo === "vagas") riesgoMarketing += 10;
  if (school.promesasEmpleo === "ninguna") riesgoMarketing -= 5;
  if (school.fuentePrecio === "no_verificado" || school.fuentePrecio === "redes") riesgoMarketing += 10;

  const verificacion =
    school.estadoVerificacion === "verificado"
      ? 85
      : school.estadoVerificacion === "parcialmente_verificado"
        ? 60
        : school.estadoVerificacion === "pendiente"
          ? 35
          : 20;

  claridadCoste = clampSchoolScore(claridadCoste);
  transparencia = clampSchoolScore(transparencia);
  riesgoFinanciero = clampSchoolScore(riesgoFinanciero);
  riesgoOperacional = clampSchoolScore(riesgoOperacional);
  riesgoMarketing = clampSchoolScore(riesgoMarketing);

  const encajeGeneral = clampSchoolScore(
    Math.round(
      (claridadCoste +
        transparencia +
        (100 - riesgoFinanciero) +
        (100 - riesgoOperacional) +
        (100 - riesgoMarketing) +
        verificacion) /
        6,
    ),
  );

  const redFlags: string[] = [];
  if (school.calendarioPagosClaro !== "si") redFlags.push("Calendario de pagos no claro.");
  if (school.contratoAntesPagar !== "si") redFlags.push("Contrato no confirmado antes del pago.");
  if (school.reembolsoClaro !== "si") redFlags.push("Política de reembolso poco clara.");
  if (school.estadoVerificacion !== "verificado") redFlags.push("Información insuficiente.");

  const preguntasPendientes: string[] = [];
  if (school.tasasIncluidas !== "si") preguntasPendientes.push("Confirmar tasas de examen.");
  if (school.skillTestsIncluidos !== "si") preguntasPendientes.push("Confirmar coste de skill tests.");
  if (school.mccIncluido !== "si") preguntasPendientes.push("Aclarar MCC/JOC.");
  if (school.uprtIncluido !== "si") preguntasPendientes.push("Aclarar Advanced UPRT.");

  let recomendacionPrudente = "no decidir aún";
  if (claridadCoste >= 70 && transparencia >= 70 && verificacion >= 60) {
    recomendacionPrudente = "buena claridad documental";
  } else if (verificacion < 50) {
    recomendacionPrudente = "requiere confirmación";
  } else {
    recomendacionPrudente = "riesgo por falta de datos";
  }

  return {
    claridadCoste,
    transparencia,
    riesgoFinanciero,
    riesgoOperacional,
    riesgoMarketing,
    verificacion,
    encajeGeneral,
    redFlags,
    preguntasPendientes,
    recomendacionPrudente,
  };
}

export function computeSchoolStats(schools: School[], totalRealista: number): SchoolStatsSummary {
  const analyzed = schools.map((school) => ({
    school,
    analysis: schoolAnalysis(school, totalRealista),
  }));
  const verifiedCount = analyzed.filter((x) => x.school.estadoVerificacion === "verificado").length;
  const pendingCount = analyzed.filter((x) => x.school.estadoVerificacion === "pendiente").length;
  const viable = analyzed
    .filter((x) => x.analysis.verificacion >= 60 && x.analysis.claridadCoste >= 60)
    .sort((a, b) => b.analysis.encajeGeneral - a.analysis.encajeGeneral);

  return {
    analyzed,
    verifiedCount,
    pendingCount,
    bestSchool: viable[0] ?? null,
  };
}

/** Recomendación FlyPath unificada para hero Escuelas + Informe final. */
export function computeFlypathSchoolRecommendation(
  analyzed: ReadinessSchoolAnalyzed[],
): FlypathSchoolRecommendation {
  const candidates = [...analyzed].sort((a, b) => b.analysis.encajeGeneral - a.analysis.encajeGeneral);
  const best = candidates[0];

  if (!best || candidates.length < 2) {
    return {
      school: null,
      reason:
        "Añade al menos 2 escuelas comparables para que FlyPath pueda cruzar tu perfil con opciones reales.",
    };
  }

  const hasEnoughDocumentSignal =
    best.school.contratoAntesPagar === "si" ||
    best.school.reembolsoClaro === "si" ||
    best.school.calendarioPagosClaro === "si" ||
    best.school.estadoVerificacion === "verificado" ||
    best.school.estadoVerificacion === "parcialmente_verificado";

  if (best.analysis.encajeGeneral >= 60 && hasEnoughDocumentSignal) {
    return {
      school: best.school,
      reason:
        "Con los datos actuales, esta escuela es la opción más sólida dentro de las escuelas añadidas. Aun así, la recomendación depende de confirmar precio, contrato, reembolso y calendario antes de pagar.",
    };
  }

  return {
    school: best.school,
    reason:
      "Con los datos actuales, esta escuela es la opción más sólida dentro de las escuelas añadidas, pero la recomendación no es suficiente para pagar todavía. Faltan condiciones clave por confirmar: contrato, reembolso, calendario de pagos, coste final o extras incluidos.",
  };
}

export function getSchoolEmailMissingData(school: School): string[] {
  const pending: string[] = [];
  if (school.mccIncluido !== "si") pending.push("MCC/JOC");
  if (school.uprtIncluido !== "si") pending.push("Advanced UPRT");
  if (school.tasasIncluidas !== "si") pending.push("tasas de examen");
  if (school.skillTestsIncluidos !== "si") pending.push("skill tests");
  if (school.alojamientoIncluido !== "si") pending.push("alojamiento y costes aproximados");
  if (school.reembolsoClaro !== "si") pending.push("política de reembolso");
  if (school.contratoAntesPagar !== "si") pending.push("contrato/condiciones antes de pagar");
  if (school.calendarioPagosClaro !== "si") pending.push("calendario de pagos");
  if (school.flotaExplicada !== "si") pending.push("flota disponible");
  if (school.mantenimientoExplicado !== "si") pending.push("mantenimiento y disponibilidad");
  if (school.ratioAlumnoAvionConocido !== "si") pending.push("ratio alumno/avión");
  if (school.permiteHablarAlumnos !== "si") pending.push("contacto con alumnos actuales o antiguos");
  if (school.promesasEmpleo === "vagas") pending.push("detalle real de apoyo laboral (sin garantía de empleo)");
  if (school.estadoVerificacion !== "verificado") pending.push("confirmación oficial de precio y condiciones");
  return pending;
}
