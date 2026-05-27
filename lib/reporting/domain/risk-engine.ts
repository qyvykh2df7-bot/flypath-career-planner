import type { RiskItem, RiskLevel } from "@/lib/reporting/types/shared";

export type RiskRow = RiskItem;

export type BuildRiskDiagnosisInput = {
  class1: "si" | "no" | "reservado";
  ingles: "bajo" | "medio" | "alto";
  riesgoFinanciero: string;
  coverage: number;
  schoolsCount: number;
  verifiedCount: number;
  routeConflicts: string[];
  bestSchoolAnalysis: {
    verificacion: number;
    transparencia: number;
    riesgoMarketing: number;
  } | null;
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "Crítico";
  if (score >= 60) return "Alto";
  if (score >= 40) return "Medio";
  return "Bajo";
}

export function riskLevelRank(nivel: string): number {
  if (nivel === "Crítico") return 4;
  if (nivel === "Alto") return 3;
  if (nivel === "Medio") return 2;
  return 1;
}

export function highestRiskLevel(risks: RiskRow[]): RiskLevel {
  if (risks.length === 0) return "Bajo";
  const highest = [...risks].sort((a, b) => riskLevelRank(b.nivel) - riskLevelRank(a.nivel))[0];
  if (highest?.nivel === "Crítico") return "Crítico";
  if (highest?.nivel === "Alto") return "Alto";
  if (highest?.nivel === "Medio") return "Medio";
  return "Bajo";
}

export function riskNivelIsHigh(nivel: string): boolean {
  return nivel === "Alto" || nivel === "Crítico";
}

export function hasHighDocumentOrCommercialRisk(riskDiagnosis: Pick<RiskRow, "label" | "nivel">[]): boolean {
  return riskDiagnosis.some(
    (r) =>
      (r.label === "Riesgo documental" || r.label === "Riesgo de marketing/promesas") &&
      riskNivelIsHigh(r.nivel),
  );
}

export function buildRiskDiagnosis(input: BuildRiskDiagnosisInput): RiskRow[] {
  const escuelaDataRiskScore = input.bestSchoolAnalysis
    ? Math.round(
        (100 - input.bestSchoolAnalysis.verificacion + (100 - input.bestSchoolAnalysis.transparencia)) / 2,
      )
    : 75;
  const marketingRiskScore = input.bestSchoolAnalysis ? input.bestSchoolAnalysis.riesgoMarketing : 70;
  const timingRiskScore = input.routeConflicts.length > 0 ? 75 : 35;

  return [
    {
      label: "Riesgo médico",
      nivel: input.class1 === "si" ? "Bajo" : input.class1 === "reservado" ? "Medio" : "Crítico",
      explicacion:
        input.class1 === "si"
          ? "Clase 1 confirmada."
          : "Clase 1 no confirmada para avanzar con seguridad.",
      accion: "Confirmar Clase 1 antes de firmar o transferir dinero.",
    },
    {
      label: "Riesgo financiero",
      nivel: input.riesgoFinanciero,
      explicacion: `Cobertura actual del ${input.coverage}% sobre el escenario realista.`,
      accion: "Reducir brecha, confirmar financiación y mantener un margen de seguridad financiero.",
    },
    {
      label: "Riesgo de inglés",
      nivel: input.ingles === "alto" ? "Bajo" : input.ingles === "medio" ? "Medio" : "Alto",
      explicacion:
        input.ingles === "alto"
          ? "Nivel funcional para progresar."
          : "Puede impactar ritmo y rendimiento formativo.",
      accion: "Definir plan de mejora y validar objetivo ICAO.",
    },
    {
      label: "Riesgo documental",
      nivel: riskLevelFromScore(escuelaDataRiskScore),
      explicacion: `${input.verifiedCount} escuela(s) verificadas de ${input.schoolsCount}.`,
      accion: "Exigir confirmación documental de costes y condiciones.",
    },
    {
      label: "Riesgo de marketing/promesas",
      nivel: riskLevelFromScore(marketingRiskScore),
      explicacion: input.bestSchoolAnalysis
        ? "Evaluación sobre promesas y transparencia comercial."
        : "Falta evidencia documental suficiente.",
      accion: "Pedir por escrito alcance real de career support y límites.",
    },
    {
      label: "Riesgo de timing",
      nivel: riskLevelFromScore(timingRiskScore),
      explicacion: input.routeConflicts[0] || "No se detecta conflicto fuerte de timing.",
      accion: "Alinear urgencia, disponibilidad y necesidad de trabajar.",
    },
  ];
}

export function mapRiskRowsForInformePdf(
  riskDiagnosis: RiskRow[],
): { label: string; nivel: string; explicacion: string; accion: string }[] {
  return riskDiagnosis.map((risk) => {
    const label =
      risk.label === "Riesgo de marketing/promesas"
        ? "Riesgo comercial/marketing"
        : risk.label === "Riesgo de timing"
          ? "Riesgo de calendario"
          : risk.label;
    const accion =
      risk.accion === "Pedir por escrito alcance real de career support y límites."
        ? "Pedir por escrito el alcance real del apoyo laboral y cualquier promesa comercial."
        : risk.accion;
    return { label, nivel: risk.nivel, explicacion: risk.explicacion, accion };
  });
}

export function riesgosSimpleParaPadresPdf(
  riskDiagnosis: Pick<RiskRow, "label" | "nivel" | "explicacion">[],
): string {
  const altos = riskDiagnosis.filter((r) => r.nivel === "Alto" || r.nivel === "Crítico");
  if (altos.length === 0) {
    return "No hay riesgos marcados como altos o críticos en este escenario. Aun así, conviene validar por escrito contrato, precio final, extras incluidos y política de reembolso antes de pagar.";
  }
  return altos
    .map((r) => {
      const label =
        r.label === "Riesgo de marketing/promesas"
          ? "Comercial o promesas exageradas"
          : r.label === "Riesgo de timing"
            ? "Calendario y plazos"
            : r.label;
      return `${label} (${r.nivel.toLowerCase()}): ${r.explicacion}`;
    })
    .join(" ");
}
