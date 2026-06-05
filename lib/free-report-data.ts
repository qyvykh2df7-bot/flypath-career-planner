import { formatEuro, paymentDecisionHeadline } from "@/components/report-preview/report-preview-utils";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

export const FREE_REPORT_VALIDATION_TITLE = "Lo que desbloqueas con el informe premium";

export const FREE_REPORT_VALIDATION_LEAD =
  "Ya conoces la ruta recomendada y el principal riesgo detectado.";

export const FREE_REPORT_VALIDATION_BULLETS = [
  "Veredicto FlyPath para tu caso",
  "Escuela más sólida entre tus candidatas",
  "Comparación directa entre escuelas",
  "Riesgos documentales, comerciales y financieros",
  "Qué pedir a cada escuela antes de pagar",
  "Decisión FlyPath y próximos pasos recomendados",
] as const;

export const FREE_REPORT_VALIDATION_BODY =
  "El informe completo te permite validar escuelas, entender el impacto financiero real y tomar una decisión con mayor seguridad antes de comprometer pagos importantes.";

/** @deprecated Sustituido por LEAD + BODY */
export const FREE_REPORT_VALIDATION_CLOSING = "";

/** Separador vertical del bloque navy (preview + PDF). */
export const FREE_REPORT_NAVY_DIVIDER = "rgba(212,175,55,0.25)";

export const FREE_REPORT_NO_SCHOOLS_MESSAGE = "Aún no has añadido escuelas";

const FREE_REPORT_MAX_ANALYZED_SCHOOLS_SHOWN = 3;

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
  /** Nombres de escuelas comparadas — sin ranking ni escuela líder (reservado al premium). */
  analyzedSchoolsLine: string;
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

/** Lista neutral de escuelas del comparador — máx. 3 nombres + recuento restante. */
export function formatAnalyzedSchoolsLine(snapshot: ReportSnapshotV1): string {
  const names = snapshot.schoolsSummary.items.map((school) => school.nombre.trim()).filter(Boolean);
  if (names.length === 0) return FREE_REPORT_NO_SCHOOLS_MESSAGE;

  const shown = names.slice(0, FREE_REPORT_MAX_ANALYZED_SCHOOLS_SHOWN);
  const line = shown.join(" · ");
  const remaining = names.length - shown.length;
  return remaining > 0 ? `${line} · + ${remaining} más` : line;
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
    analyzedSchoolsLine: formatAnalyzedSchoolsLine(snapshot),
    nextAction: nextRecommendedAction(snapshot),
  };
}
