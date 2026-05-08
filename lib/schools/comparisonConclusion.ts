import { getPriceGap } from "@/lib/schools/schoolUtils";
import type { SchoolEntry, YesNoOptionalUnknown } from "@/types/schools";

function confidenceNumeric(c: SchoolEntry["dataConfidence"]): number {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  return 1;
}

/** Transparencia: claridad documental + costes + confianza global + señales de precios publicados. */
export function transparencyScore(entry: SchoolEntry): number {
  let s =
    entry.scores.documentTransparency * 0.38 +
    entry.scores.costClarity * 0.38 +
    entry.scores.dataConfidenceScore * 0.18 +
    confidenceNumeric(entry.dataConfidence) * 2;
  if (entry.advertisedPriceEUR > 0) s += 4;
  if (entry.flypathEstimatedRealCostEUR > 0) s += 4;
  if (entry.contractAvailableBeforePayment === "yes") s += 3;
  if (entry.contractAvailableBeforePayment === "partial") s += 1;
  const pay = entry.paymentScheduleSummary.toLowerCase();
  const ref = entry.refundPolicySummary.toLowerCase();
  if (!pay.includes("por confirmar") && !pay.includes("pendiente") && pay.length > 12) s += 2;
  if (!ref.includes("por confirmar") && !ref.includes("pendiente") && ref.length > 12) s += 2;
  return s;
}

function hasAdvertisedPrice(entry: SchoolEntry): boolean {
  return entry.advertisedPriceEUR > 0;
}

function hasFlypathRealEstimate(entry: SchoolEntry): boolean {
  return entry.flypathEstimatedRealCostEUR > 0;
}

/**
 * Menor riesgo económico: entre candidatos con precio publicado (salvo ambos sin precio).
 * Prioriza menor coste real estimado FlyPath, luego menor brecha, luego menor scores.financialRisk.
 */
export function pickLowerEconomicRisk(a: SchoolEntry, b: SchoolEntry): {
  winner: SchoolEntry | null;
  tie: boolean;
  reason: string;
} {
  const aAdv = hasAdvertisedPrice(a);
  const bAdv = hasAdvertisedPrice(b);

  let candidates: [SchoolEntry, SchoolEntry];
  if (!aAdv && !bAdv) {
    candidates = [a, b];
  } else if (aAdv && !bAdv) {
    return { winner: a, tie: false, reason: "Solo una opción publica precio anunciado." };
  } else if (!aAdv && bAdv) {
    return { winner: b, tie: false, reason: "Solo una opción publica precio anunciado." };
  } else {
    candidates = [a, b];
  }

  const [x, y] = candidates;
  const xReal = hasFlypathRealEstimate(x);
  const yReal = hasFlypathRealEstimate(y);

  if (xReal && yReal) {
    if (x.flypathEstimatedRealCostEUR < y.flypathEstimatedRealCostEUR) {
      return { winner: x, tie: false, reason: "Menor coste real estimado FlyPath." };
    }
    if (y.flypathEstimatedRealCostEUR < x.flypathEstimatedRealCostEUR) {
      return { winner: y, tie: false, reason: "Menor coste real estimado FlyPath." };
    }
    const gx = getPriceGap(x);
    const gy = getPriceGap(y);
    if (Number.isFinite(gx) && Number.isFinite(gy)) {
      if (gx < gy) return { winner: x, tie: false, reason: "Brecha anunciado vs real estimado algo menor." };
      if (gy < gx) return { winner: y, tie: false, reason: "Brecha anunciado vs real estimado algo menor." };
    }
    if (x.scores.financialRisk !== y.scores.financialRisk) {
      return x.scores.financialRisk < y.scores.financialRisk
        ? { winner: x, tie: false, reason: "Perfil de riesgo financiero algo más bajo en los scores FlyPath." }
        : { winner: y, tie: false, reason: "Perfil de riesgo financiero algo más bajo en los scores FlyPath." };
    }
    return { winner: null, tie: true, reason: "Costes y brechas muy similares con los datos actuales." };
  }

  if (xReal && !yReal) return { winner: x, tie: false, reason: "Solo una opción tiene coste real estimado FlyPath." };
  if (!xReal && yReal) return { winner: y, tie: false, reason: "Solo una opción tiene coste real estimado FlyPath." };

  const gx = getPriceGap(x);
  const gy = getPriceGap(y);
  if (Number.isFinite(gx) && Number.isFinite(gy)) {
    if (gx < gy) return { winner: x, tie: false, reason: "Brecha estimada algo menor." };
    if (gy < gx) return { winner: y, tie: false, reason: "Brecha estimada algo menor." };
  }
  if (x.advertisedPriceEUR > 0 && y.advertisedPriceEUR > 0 && x.advertisedPriceEUR !== y.advertisedPriceEUR) {
    return x.advertisedPriceEUR < y.advertisedPriceEUR
      ? { winner: x, tie: false, reason: "Precio anunciado algo menor (sin estimación FlyPath completa)." }
      : { winner: y, tie: false, reason: "Precio anunciado algo menor (sin estimación FlyPath completa)." };
  }
  if (x.scores.financialRisk !== y.scores.financialRisk) {
    return x.scores.financialRisk < y.scores.financialRisk
      ? { winner: x, tie: false, reason: "Riesgo financiero algo menor según scores FlyPath." }
      : { winner: y, tie: false, reason: "Riesgo financiero algo menor según scores FlyPath." };
  }
  return { winner: null, tie: true, reason: "Datos económicos insuficientes o muy parejos para diferenciar." };
}

function yesOrIncluded(v: YesNoOptionalUnknown | "yes" | "no" | "unknown"): boolean {
  return v === "yes" || v === "optional";
}

/** Extras con campos estructurados disponibles en SchoolEntry (no hay PBN ni transporte en el modelo). */
export function extrasIncludedCount(entry: SchoolEntry): number {
  let n = 0;
  if (yesOrIncluded(entry.mccJocIncluded)) n++;
  if (yesOrIncluded(entry.advancedUprtIncluded)) n++;
  if (entry.examFeesIncluded === "yes") n++;
  if (entry.skillTestsIncluded === "yes") n++;
  if (entry.trainingMaterialsIncluded === "yes") n++;
  if (yesOrIncluded(entry.accommodationIncluded)) n++;
  return n;
}

const PENDING_TEXT_RE = /por confirmar|pendiente|no publicado|\bparcial\b/gi;

function pendingFromSummaries(entry: SchoolEntry): number {
  const blob = `${entry.paymentScheduleSummary} ${entry.refundPolicySummary}`;
  const m = blob.match(PENDING_TEXT_RE);
  return m ? m.length : 0;
}

/** Campos con estado desconocido / parcial / no cubierto en el modelo estructurado. */
export function pendingIndicatorsCount(entry: SchoolEntry): number {
  let n = entry.pendingData.length;
  n += pendingFromSummaries(entry);
  if (entry.contractAvailableBeforePayment === "unknown" || entry.contractAvailableBeforePayment === "partial") n++;
  if (entry.financingAvailable === "unknown") n++;
  if (entry.mccJocIncluded === "unknown") n++;
  if (entry.advancedUprtIncluded === "unknown") n++;
  if (entry.examFeesIncluded === "unknown") n++;
  if (entry.skillTestsIncluded === "unknown") n++;
  if (entry.trainingMaterialsIncluded === "unknown") n++;
  if (entry.accommodationIncluded === "unknown") n++;
  return n;
}

function pickByScore(a: SchoolEntry, b: SchoolEntry, score: (e: SchoolEntry) => number, higherIsBetter: boolean): {
  winner: SchoolEntry | null;
  tie: boolean;
} {
  const sa = score(a);
  const sb = score(b);
  if (sa === sb) return { winner: null, tie: true };
  const better = higherIsBetter ? (sa > sb ? a : b) : sa < sb ? a : b;
  return { winner: better, tie: false };
}

function formatWinner(entry: SchoolEntry | null, tie: boolean, other: SchoolEntry): string {
  if (tie || !entry) return `Empate entre ${other.name} y la otra opción`;
  return entry.name;
}

export type FlypathComparisonConclusionModel = {
  mostTransparent: { text: string };
  lowerEconomicRisk: { text: string; hint?: string };
  mostExtras: { text: string };
  mostPending: { text: string };
  mainRisk: string;
  emailPoints: string[];
  reading: string;
};

function uniqueEmailPoints(a: SchoolEntry, b: SchoolEntry): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of [...a.keyQuestions, ...b.keyQuestions]) {
    const t = q.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 5) break;
  }
  const defaults = [
    "Precio total cerrado y vigencia del presupuesto.",
    "Contrato completo antes de pagar y política de reembolso.",
    "Calendario de pagos, depósito y costes de repetición.",
    "Tasas, skill tests y materiales incluidos o no.",
    "Condiciones de financiación y extras operativos (alojamiento, transporte).",
  ];
  for (const d of defaults) {
    if (out.length >= 5) break;
    if (!seen.has(d)) out.push(d);
  }
  return out.slice(0, 5);
}

function mainRiskPhrase(a: SchoolEntry, b: SchoolEntry): string {
  const byRed = [...a.redFlags, ...b.redFlags].filter(Boolean);
  if (byRed.length > 0) return byRed[0];
  const byPending = [...a.pendingData, ...b.pendingData].filter(Boolean);
  if (byPending.length > 0) return `Información pendiente relevante: ${byPending[0].slice(0, 120)}${byPending[0].length > 120 ? "…" : ""}`;
  return "Antes de pagar matrícula o depósito, conviene tener por escrito precio final, contrato y condiciones de reembolso.";
}

function buildReading(
  a: SchoolEntry,
  b: SchoolEntry,
  trans: { winner: SchoolEntry | null; tie: boolean },
  extras: { winner: SchoolEntry | null; tie: boolean },
  pending: { winner: SchoolEntry | null; tie: boolean },
): string {
  const bothNoPrice = !hasAdvertisedPrice(a) && !hasAdvertisedPrice(b);
  const bothHeavyPending =
    pendingIndicatorsCount(a) >= 10 &&
    pendingIndicatorsCount(b) >= 10 &&
    trans.tie &&
    extras.tie;

  if (bothNoPrice || bothHeavyPending) {
    return "No hay datos suficientes para recomendar una opción con seguridad. Ambas escuelas pueden tener información pendiente importante. Antes de decidir, habría que pedir precio final, contrato, reembolso, calendario de pagos, tasas y skill tests por escrito.";
  }

  const pendLow = pending.winner;
  const clearLead =
    !trans.tie &&
    trans.winner &&
    !extras.tie &&
    extras.winner === trans.winner &&
    !pending.tie &&
    pendLow === trans.winner;

  if (clearLead) {
    return `En esta comparación, FlyPath ve más sólida inicialmente a ${trans.winner!.name} por mayor claridad de costes, más extras reflejados en el dataset y menos campos pendientes detectados. Aun así, no recomendamos pagar todavía sin confirmar contrato, reembolso, costes de repetición y calendario final de pagos.`;
  }

  if (!trans.tie && trans.winner) {
    return `Para esta comparación concreta, ${trans.winner.name} parece algo más transparente o mejor documentada en los criterios que FlyPath prioriza. No es un ranking absoluto ni una garantía de resultado: conviene validar siempre por escrito los puntos de la lista inferior antes de pagar.`;
  }

  return "Las dos opciones quedan muy parejas en los indicadores FlyPath disponibles. La decisión debería basarse sobre todo en lo que confirméis por email o contrato (precio cerrado, extras, reembolso y calendario), no solo en la información web actual.";
}

export function buildFlypathComparisonConclusion(a: SchoolEntry, b: SchoolEntry): FlypathComparisonConclusionModel {
  const trans = pickByScore(a, b, transparencyScore, true);
  const econ = pickLowerEconomicRisk(a, b);
  const extras = pickByScore(a, b, extrasIncludedCount, true);
  // Escuela con MENOS campos pendientes (mejor en este criterio). Se usa para la lectura FlyPath.
  const pendingLow = pickByScore(a, b, pendingIndicatorsCount, false);
  // Escuela con MÁS campos pendientes (peor en este criterio). Se usa para el badge "Más datos pendientes".
  const pendingHigh = pickByScore(a, b, pendingIndicatorsCount, true);

  const mostTransparentText = trans.tie
    ? `Empate entre ${a.name} y ${b.name}`
    : `${trans.winner!.name}`;

  const lowerEconText =
    econ.tie || !econ.winner ? `Empate o datos insuficientes (${econ.reason})` : `${econ.winner.name}`;

  const mostExtrasText = extras.tie ? `Empate entre ${a.name} y ${b.name}` : `${extras.winner!.name}`;

  const mostPendingText = pendingHigh.tie
    ? `Empate entre ${a.name} y ${b.name}`
    : `${pendingHigh.winner!.name}`;

  return {
    mostTransparent: { text: mostTransparentText },
    lowerEconomicRisk: { text: lowerEconText, hint: econ.reason },
    mostExtras: { text: mostExtrasText },
    mostPending: { text: mostPendingText },
    mainRisk: mainRiskPhrase(a, b),
    emailPoints: uniqueEmailPoints(a, b),
    reading: buildReading(a, b, trans, extras, pendingLow),
  };
}
