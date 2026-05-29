import { formatEuro, paymentDecisionHeadline } from "@/components/report-preview/report-preview-utils";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

export const FREE_REPORT_VALIDATION_TITLE = "Lo que desbloqueas con Premium Analysis";

export const FREE_REPORT_VALIDATION_LEAD =
  "Ya conoces la ruta recomendada y el principal riesgo detectado.";

export const FREE_REPORT_VALIDATION_BULLETS = [
  "Riesgos financieros completos",
  "Comparativa documental de escuelas",
  "Calendario de pagos y reembolsos",
  "Escenario económico detallado",
  "Plan de acción 7 / 30 / 90 días",
  "Recomendación profesional personalizada",
] as const;

export const FREE_REPORT_VALIDATION_BODY =
  "El informe completo te permite validar escuelas, entender el impacto financiero real y tomar una decisión con mayor seguridad antes de comprometer pagos importantes.";

/** @deprecated Sustituido por LEAD + BODY */
export const FREE_REPORT_VALIDATION_CLOSING = "";

/** Separador vertical del bloque navy (preview + PDF). */
export const FREE_REPORT_NAVY_DIVIDER = "rgba(212,175,55,0.25)";

export const FREE_REPORT_LEADING_SCHOOL_HINT =
  "Escuela actualmente mejor posicionada para tu perfil según los datos introducidos.";

/** @deprecated Usar FREE_REPORT_VALIDATION_BULLETS */
export const FREE_REPORT_PREMIUM_BULLETS = FREE_REPORT_VALIDATION_BULLETS;

export type FreeReportData = {
  routeRecommended: string;
  decisionScore: number;
  paymentDecision: string;
  recommendation: string;
  principalRiskLabel: string;
  principalRiskLevel: string;
  financialGap: string;
  financialGapDetail: string;
  leadingSchool: string | null;
  leadingSchoolHint: string | null;
  nextAction: string;
};

function riskLevelRank(nivel: string): number {
  if (nivel === "Crítico") return 4;
  if (nivel === "Alto") return 3;
  if (nivel === "Medio") return 2;
  return 1;
}

export function resolvePrincipalRiskItem(
  items: ReportSnapshotV1["risks"]["items"],
  highestLevel: string,
): ReportSnapshotV1["risks"]["items"][number] | null {
  if (items.length === 0) return null;
  const atLevel = items.filter((r) => r.nivel === highestLevel);
  const pool = atLevel.length > 0 ? atLevel : items;
  return [...pool].sort((a, b) => riskLevelRank(b.nivel) - riskLevelRank(a.nivel))[0] ?? null;
}

export function formatPrincipalRiskLabel(label: string): string {
  const raw = label.trim();
  const lower = raw.toLowerCase();
  if (lower.includes("marketing") || lower.includes("promesas")) {
    return "Marketing y promesas comerciales";
  }
  if (lower.includes("médico") || lower.includes("medico")) return "Riesgo médico";
  if (lower.includes("financiero")) return "Riesgo financiero";
  if (lower.includes("inglés") || lower.includes("ingles")) return "Riesgo de inglés";
  if (lower.includes("documental")) return "Riesgo documental";
  if (lower.includes("timing") || lower.includes("calendario")) return "Riesgo de calendario";
  return raw;
}

export function buildFreeReportRecommendation(snapshot: ReportSnapshotV1): string {
  const route = snapshot.routeRecommendation.recommended.trim();
  if (route === "Modular") {
    return "Tu perfil encaja mejor con una ruta modular. Antes de comprometer pagos importantes recomendamos validar documentación, financiación y condiciones por escrito.";
  }
  if (route === "Integrada") {
    return "Tu perfil encaja mejor con una ruta integrada. Antes de comprometer pagos importantes recomendamos validar documentación, financiación y condiciones por escrito.";
  }
  return "Tu perfil encaja con una fase de preparación previa. Antes de escalar inversión, valida documentación, financiación y condiciones con claridad por escrito.";
}

function nextRecommendedAction(snapshot: ReportSnapshotV1): string {
  const step = snapshot.readiness.proximosPasos[0]?.trim();
  if (step) return step;
  const reason = snapshot.flypathNextStep.reasons[0]?.trim();
  if (reason) return reason;
  return snapshot.flypathNextStep.primary.body;
}

function financialGapDetail(snapshot: ReportSnapshotV1): string {
  const brecha = snapshot.costs.summary.brechaFinanciacion;
  const meses = snapshot.costs.summary.mesesCerrarBrecha;
  if (brecha > 0 && meses > 0) {
    return `~${meses} meses para cerrarla con tu ritmo de ahorro declarado`;
  }
  if (brecha <= 0) {
    return "Escenario cubierto con tu presupuesto declarado";
  }
  return "";
}

function leadingSchoolLine(snapshot: ReportSnapshotV1): string | null {
  const name = snapshot.schoolsSummary.bestSchoolName?.trim();
  if (name) return name;
  if (snapshot.schoolsSummary.total > 0) {
    return "Comparador activo — define escuela líder en el planner";
  }
  return null;
}

/** Datos del informe gratuito — única fuente para preview y PDF. */
export function mapSnapshotToFreeReportData(snapshot: ReportSnapshotV1): FreeReportData {
  const principal = resolvePrincipalRiskItem(snapshot.risks.items, snapshot.risks.highestLevel);

  return {
    routeRecommended: snapshot.routeRecommendation.recommended,
    decisionScore: snapshot.readiness.score,
    paymentDecision: paymentDecisionHeadline(snapshot.readiness.decision),
    recommendation: buildFreeReportRecommendation(snapshot),
    principalRiskLabel: principal
      ? formatPrincipalRiskLabel(principal.label)
      : formatPrincipalRiskLabel(snapshot.risks.highestLevel),
    principalRiskLevel: principal?.nivel ?? snapshot.risks.highestLevel,
    financialGap: formatEuro(snapshot.costs.summary.brechaFinanciacion),
    financialGapDetail: financialGapDetail(snapshot),
    leadingSchool: leadingSchoolLine(snapshot),
    leadingSchoolHint: snapshot.schoolsSummary.bestSchoolName?.trim()
      ? FREE_REPORT_LEADING_SCHOOL_HINT
      : null,
    nextAction: nextRecommendedAction(snapshot),
  };
}
