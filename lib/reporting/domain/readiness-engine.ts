import type {
  ComputeDecisionReadinessInput,
  ReadinessDecision,
  ReadinessResult,
} from "@/lib/reporting/types/shared";

function clampReadinessScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Mantiene la heurística histórica de readiness/decisión de pago del planner.
 * No modificar umbrales, mensajes ni orden de prioridad sin migración explícita.
 */
export function computeDecisionReadiness(input: ComputeDecisionReadinessInput): ReadinessResult {
  const { profile, costs, route, schoolsAnalyzed, bufferPct } = input;
  let score = 100;
  const bloqueosCriticos: string[] = [];
  const faltanDatos: string[] = [];

  const verifiedOrPartial = schoolsAnalyzed.filter(
    (x) => x.school.estadoVerificacion === "verificado" || x.school.estadoVerificacion === "parcialmente_verificado",
  );

  const hasAnySchool = schoolsAnalyzed.length > 0;
  const paymentClearSchools = schoolsAnalyzed.filter(
    (x) =>
      x.school.contratoAntesPagar === "si" &&
      x.school.reembolsoClaro === "si" &&
      x.school.calendarioPagosClaro === "si",
  );
  const hasPaymentClearSchool = paymentClearSchools.length > 0;

  const usableSchools = schoolsAnalyzed.filter(
    (x) =>
      x.school.precioAnunciado > 0 &&
      x.school.contratoAntesPagar === "si" &&
      x.school.reembolsoClaro === "si" &&
      x.school.calendarioPagosClaro === "si",
  );

  const hasPaymentReadySchool = paymentClearSchools.some(
    (x) => x.school.estadoVerificacion === "verificado" || x.school.estadoVerificacion === "parcialmente_verificado",
  );

  const hasFullyCostedSchool = schoolsAnalyzed.some(
    (x) =>
      x.school.mccIncluido === "si" &&
      x.school.uprtIncluido === "si" &&
      x.school.tasasIncluidas === "si" &&
      x.school.skillTestsIncluidos === "si",
  );

  const hasLowMarketingRiskSchool = schoolsAnalyzed.some(
    (x) => x.school.promesasEmpleo === "ninguna" || x.school.promesasEmpleo === "claras_no_garantizadas",
  );

  if (profile.class1 !== "si") {
    score -= 45;
    bloqueosCriticos.push("Clase 1 no confirmado.");
  }

  if (profile.ingles === "bajo") {
    score -= 18;
    faltanDatos.push("Condición previa: mejorar inglés operativo.");
  } else if (profile.ingles === "medio") {
    score -= 8;
  }

  if (costs.brechaFinanciacion > costs.totalRealista * 0.4) {
    score -= 25;
    if (profile.financiacion !== "confirmada") {
      bloqueosCriticos.push("Brecha financiera alta respecto al coste realista.");
    } else {
      faltanDatos.push("Brecha financiera alta, aunque hay financiación confirmada.");
    }
  } else if (costs.brechaFinanciacion > costs.totalRealista * 0.2) {
    score -= 12;
  }

  if (profile.financiacion !== "confirmada" && costs.coverage < 70) {
    score -= 25;
    bloqueosCriticos.push("Bloqueo financiero: cobertura < 70% y financiación no confirmada.");
  }

  if (bufferPct < 12) {
    score -= 10;
    faltanDatos.push("El margen de seguridad de costes es bajo; conviene subirlo por encima del 12%.");
  }

  if (schoolsAnalyzed.length === 0) {
    score -= 20;
    faltanDatos.push("No hay escuelas comparadas.");
  } else if (schoolsAnalyzed.length < 2) {
    score -= 6;
    faltanDatos.push("Comparar al menos 2 escuelas para decidir con criterio.");
  }

  if (verifiedOrPartial.length === 0 && usableSchools.length === 0) {
    score -= hasPaymentClearSchool ? 6 : 14;
    faltanDatos.push("Falta al menos una escuela con datos verificados o suficientemente documentados.");
  } else if (verifiedOrPartial.length === 0 && usableSchools.length > 0) {
    score -= 2;
    faltanDatos.push("La escuela parece suficientemente documentada, pero conviene conservar evidencia por escrito.");
  }

  if (schoolsAnalyzed.length > 0 && !hasPaymentClearSchool) {
    score -= 15;
    faltanDatos.push("Falta al menos una escuela con contrato, reembolso y calendario de pagos claros.");
  } else if (hasPaymentClearSchool && !hasPaymentReadySchool) {
    score -= 4;
    const clearSchoolNames = paymentClearSchools.map((x) => x.school.nombre).filter(Boolean).join(", ");
    faltanDatos.push(
      `${clearSchoolNames || "Una escuela"} ya tiene contrato, reembolso y calendario claros; falta marcarla como verificada o parcialmente verificada.`,
    );
  }

  if (hasAnySchool && !hasLowMarketingRiskSchool) {
    score -= 6;
    faltanDatos.push("Falta una escuela con promesas comerciales claras y no garantizadas.");
  }

  if (hasAnySchool && !hasFullyCostedSchool) {
    score -= 8;
  }

  const hasAccommodationInfo = schoolsAnalyzed.some(
    (x) => x.school.alojamientoIncluido === "si" || x.school.alojamientoIncluido === "no",
  );

  if (route.conflicts.some((c) => c.includes("rapidez"))) {
    score -= 8;
    faltanDatos.push("Conflicto actual entre urgencia y necesidad de trabajar.");
  }

  const nonCriticalSchoolWarnings = [
    "Bloqueo documental",
    "contrato/reembolso/calendario",
    "Faltan datos verificados",
    "datos verificados o parcialmente verificados",
  ];

  const filteredCriticalBlockers = bloqueosCriticos.filter(
    (item) => !nonCriticalSchoolWarnings.some((warning) => item.includes(warning)),
  );
  bloqueosCriticos.splice(0, bloqueosCriticos.length, ...filteredCriticalBlockers);

  if (hasPaymentClearSchool) {
    const missingPaymentText = "Falta al menos una escuela con contrato, reembolso y calendario de pagos claros.";
    for (let i = faltanDatos.length - 1; i >= 0; i -= 1) {
      if (faltanDatos[i] === missingPaymentText) faltanDatos.splice(i, 1);
    }
  }

  const legacyGenericExtrasFragments = [
    "Faltan datos críticos: MCC/UPRT/tasas/skill tests/alojamiento",
    "MCC/UPRT/tasas/skill tests/alojamiento",
  ];
  for (let i = faltanDatos.length - 1; i >= 0; i -= 1) {
    if (legacyGenericExtrasFragments.some((fragment) => faltanDatos[i]?.includes(fragment))) {
      faltanDatos.splice(i, 1);
    }
  }

  if (usableSchools.length >= 2) {
    const obsoleteSchoolVerificationSteps = [
      "Actualizar escenarios con costes verificados o parcialmente verificados de al menos 2 escuelas.",
      "Falta al menos una escuela con datos verificados o parcialmente verificados.",
    ];
    for (let i = faltanDatos.length - 1; i >= 0; i -= 1) {
      if (obsoleteSchoolVerificationSteps.some((text) => faltanDatos[i]?.includes(text))) {
        faltanDatos.splice(i, 1);
      }
    }
  }

  const granularMissingIncludedItems = [
    !schoolsAnalyzed.some((x) => x.school.mccIncluido === "si") ? "MCC/JOC" : null,
    !schoolsAnalyzed.some((x) => x.school.uprtIncluido === "si") ? "Advanced UPRT" : null,
    !schoolsAnalyzed.some((x) => x.school.tasasIncluidas === "si") ? "tasas" : null,
    !schoolsAnalyzed.some((x) => x.school.skillTestsIncluidos === "si") ? "skill tests" : null,
  ].filter(Boolean) as string[];

  const granularIncludedText = granularMissingIncludedItems.length
    ? `Falta confirmar como incluido: ${granularMissingIncludedItems.join(", ")}.`
    : null;

  const alreadyHasGranularIncludedText = faltanDatos.some((item) => item.startsWith("Falta confirmar como incluido:"));
  if (granularIncludedText && !alreadyHasGranularIncludedText) {
    faltanDatos.push(granularIncludedText);
  }

  score = clampReadinessScore(score);

  const hasHardPersonalBlocker =
    profile.class1 !== "si" ||
    (profile.financiacion !== "confirmada" && costs.coverage < 70) ||
    (profile.financiacion !== "confirmada" && costs.brechaFinanciacion > costs.totalRealista * 0.4);

  const showNoPaguesBadge = hasHardPersonalBlocker;

  let decision: ReadinessDecision;
  if (hasHardPersonalBlocker || score < 50) {
    decision = "No estás listo para pagar";
  } else if (score < 75) {
    decision = "Puedes seguir investigando, pero no pagar";
  } else {
    decision = "Listo para decidir con condiciones";
  }

  const explanationMap: Record<ReadinessDecision, string> = {
    "No estás listo para pagar":
      "El riesgo actual es demasiado alto para pagar matrícula, depósito o firmar condiciones. Primero hay que resolver bloqueos y datos críticos.",
    "Puedes seguir investigando, pero no pagar":
      "Puedes seguir comparando escuelas y completando datos, pero todavía no hay base suficiente para comprometer pagos.",
    "Listo para decidir con condiciones":
      "La base de decisión es más sólida, siempre que conserves contrato, precio final, extras incluidos, reembolso y calendario de pagos por escrito.",
  };

  const proximosPasos: string[] = [];

  if (!hasPaymentClearSchool) {
    proximosPasos.push("Confirmar por escrito contrato, reembolso y calendario de pagos con al menos una escuela.");
  } else if (!hasPaymentReadySchool) {
    proximosPasos.push(
      "Marcar como verificada o parcialmente verificada la escuela que ya tiene contrato, reembolso y calendario claros.",
    );
  }

  if (schoolsAnalyzed.length < 2) {
    proximosPasos.push("Comparar al menos 2 escuelas antes de tomar una decisión final.");
  } else if (usableSchools.length < 2) {
    proximosPasos.push("Completar precio, contrato, reembolso y calendario de pagos en al menos 2 escuelas.");
  }

  if (granularMissingIncludedItems.length > 0) {
    proximosPasos.push(`Confirmar por escrito si están incluidos: ${granularMissingIncludedItems.join(", ")}.`);
  }

  if (proximosPasos.length === 0) {
    proximosPasos.push("Confirmar por escrito contrato, reembolso y calendario de pagos antes de transferir dinero.");
    proximosPasos.push("Guardar evidencia por escrito de precio final, extras incluidos y condiciones de pago.");
    proximosPasos.push("No transferir depósito hasta validar todos los datos críticos y conservar copia de las condiciones.");
  }

  const legacySteps = [
    "Guardar evidencia por escrito de precio final, extras incluidos y condiciones de pago.",
    "No transferir depósito hasta validar todos los datos críticos y conservar copia de las condiciones.",
  ];
  for (let i = proximosPasos.length - 1; i >= 0; i -= 1) {
    if (legacySteps.includes(proximosPasos[i])) proximosPasos.splice(i, 1);
  }

  if (decision === "Listo para decidir con condiciones") {
    proximosPasos.splice(
      0,
      proximosPasos.length,
      "Confirmar por escrito contrato, reembolso y calendario de pagos antes de transferir dinero.",
      "Guardar evidencia por escrito de precio final, extras incluidos y condiciones de pago.",
      "No transferir depósito hasta validar todos los datos críticos y conservar copia de las condiciones.",
    );
  }

  return {
    score,
    decision,
    explanation: explanationMap[decision],
    bloqueosCriticos,
    faltanDatos,
    proximosPasos,
    showNoPaguesBadge,
  };
}
