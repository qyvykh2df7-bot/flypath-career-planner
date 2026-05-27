import type { CostComputation, CostInputs, Profile } from "@/lib/reporting/types/shared";

function clampCostRiskScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Mantiene la heurística histórica de coste y riesgo financiero del planner.
 * No modificar umbrales, redondeos ni orden de cálculo sin migración explícita.
 */
export function computeCosts(costs: CostInputs, profile: Profile): CostComputation {
  const subtotalFormacion =
    costs.ppl +
    (costs.nightRating ?? 3000) +
    costs.atplTheory +
    costs.hourBuilding +
    costs.cpl +
    costs.mep +
    costs.ir +
    costs.mccJoc +
    costs.advancedUprt;
  const subtotalExtras =
    costs.class1Medical +
    costs.tasasExamenes +
    costs.skillTests +
    costs.headset +
    costs.ipadAppsCartas +
    costs.uniformeMaterial +
    costs.repeticiones +
    costs.typeRatingOpcional;
  const subtotalVida = costs.alojamiento + costs.transporte + costs.comida + costs.otrosGastosVida;
  const subtotalBase = subtotalFormacion + subtotalExtras + subtotalVida;
  const buffer = Math.round((subtotalBase * costs.bufferPct) / 100);

  const totalOptimista = Math.round(subtotalBase * 0.9);
  const totalRealista = subtotalBase + buffer;
  const totalConservador = Math.round(subtotalBase * 1.2);
  const brechaFinanciacion = Math.max(0, totalRealista - profile.dineroDisponible);
  const mesesCerrarBrecha =
    brechaFinanciacion > 0 && profile.ahorroMensual > 0
      ? Math.ceil(brechaFinanciacion / profile.ahorroMensual)
      : 0;
  const coverage = totalRealista > 0 ? Math.round((profile.dineroDisponible / totalRealista) * 100) : 0;

  let riskScore = 20;
  if (coverage < 25) riskScore += 45;
  else if (coverage < 50) riskScore += 25;
  else if (coverage < 75) riskScore += 10;
  if (profile.financiacion === "no") riskScore += 20;
  if (profile.toleranciaRiesgo === "baja") riskScore += 8;
  if (costs.bufferPct < 12) riskScore += 8;
  riskScore = clampCostRiskScore(riskScore);

  const riesgoFinanciero =
    riskScore >= 80 ? "Crítico" : riskScore >= 60 ? "Alto" : riskScore >= 40 ? "Medio" : "Bajo";

  return {
    subtotalFormacion,
    subtotalExtras,
    subtotalVida,
    buffer,
    totalOptimista,
    totalRealista,
    totalConservador,
    brechaFinanciacion,
    mesesCerrarBrecha,
    coverage,
    riskScore,
    riesgoFinanciero,
  };
}
