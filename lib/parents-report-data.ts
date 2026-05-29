import {
  formatEuro,
  objetivoLabel,
  paymentDecisionHeadline,
} from "@/components/report-preview/report-preview-utils";
import {
  formatPrincipalRiskLabel,
  resolvePrincipalRiskItem,
} from "@/lib/free-report-data";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

export const PARENTS_REPORT_FAMILY_CHECKLIST = [
  "Clase 1",
  "Financiación",
  "Contrato",
  "Reembolso",
  "Calendario de pagos",
  "Comparación de escuelas",
] as const;

/** Copy aprobado en /parents-report-preview (página 3). */
export const PARENTS_REPORT_EXECUTIVE_SUMMARY =
  "El proyecto es viable, pero todavía existen aspectos importantes que conviene validar antes de comprometer una inversión elevada. Recomendamos solicitar por escrito condiciones de pago, política de reembolso, servicios incluidos y alcance real del apoyo laboral antes de realizar cualquier transferencia o reserva.";

export const PARENTS_REPORT_MENTORIA_BODY =
  "Una conversación con un piloto profesional ayuda a la familia a entender costes reales, riesgos, documentación y preguntas clave antes de firmar o transferir dinero a una escuela.";

export const PARENTS_REPORT_TRUST_LINE_1 = "FlyPath no vende plazas en escuelas.";
export const PARENTS_REPORT_TRUST_LINE_2 =
  "Ayuda a las familias a tomar una decisión antes de comprometer grandes cantidades de dinero.";

export type ParentsReportData = {
  studentName: string;
  generatedAt: string;
  objetivo: string;
  routeRecommended: string;
  totalRealista: string;
  brecha: string;
  brechaDetail: string;
  decision: string;
  decisionHint: string;
  principalRiskTitle: string;
  principalRiskExplanation: string;
  executiveSummary: string;
  nextStep: string;
  familyChecklist: readonly string[];
};

function financialGapDetail(snapshot: ReportSnapshotV1): string {
  const brecha = snapshot.costs.summary.brechaFinanciacion;
  const meses = snapshot.costs.summary.mesesCerrarBrecha;
  if (brecha > 0 && meses > 0) {
    return `aprox. ${meses} meses para cerrarla con el ahorro familiar declarado`;
  }
  if (brecha <= 0) {
    return "escenario cubierto con el presupuesto familiar declarado";
  }
  return "";
}

function nextRecommendedAction(snapshot: ReportSnapshotV1): string {
  const step = snapshot.readiness.proximosPasos[0]?.trim();
  if (step) return step;
  const reason = snapshot.flypathNextStep.reasons[0]?.trim();
  if (reason) return reason;
  return snapshot.flypathNextStep.primary.body;
}

function decisionHint(snapshot: ReportSnapshotV1): string {
  const explanation = snapshot.readiness.explanation.trim();
  if (explanation) return explanation;
  if (snapshot.readiness.shouldPayNow) {
    return "Conviene validar documentación y condiciones por escrito antes de transferir matrícula o depósito.";
  }
  return "Conviene validar documentación y financiación antes de transferir matrícula o depósito.";
}

function principalRiskExplanation(
  risk: NonNullable<ReturnType<typeof resolvePrincipalRiskItem>>,
): string {
  const accion = risk.accion?.trim();
  if (accion) return accion;
  return risk.explicacion;
}

/** Datos del informe para padres — preview (mock) y PDF (snapshot). */
export function mapSnapshotToParentsReportData(snapshot: ReportSnapshotV1): ParentsReportData {
  const principal = resolvePrincipalRiskItem(snapshot.risks.items, snapshot.risks.highestLevel);

  return {
    studentName: snapshot.profile.nombre.trim() || "Aspirante a piloto",
    generatedAt: snapshot.generatedAt,
    objetivo: objetivoLabel(snapshot.profile.objetivo),
    routeRecommended: snapshot.routeRecommendation.recommended,
    totalRealista: formatEuro(snapshot.costs.summary.totalRealista),
    brecha: formatEuro(snapshot.costs.summary.brechaFinanciacion),
    brechaDetail: financialGapDetail(snapshot),
    decision: paymentDecisionHeadline(snapshot.readiness.decision),
    decisionHint: decisionHint(snapshot),
    principalRiskTitle: principal
      ? formatPrincipalRiskLabel(principal.label)
      : formatPrincipalRiskLabel(snapshot.risks.highestLevel),
    principalRiskExplanation: principal
      ? principalRiskExplanation(principal)
      : "Revisad condiciones, contrato y calendario de pagos por escrito antes de comprometer dinero.",
    executiveSummary: PARENTS_REPORT_EXECUTIVE_SUMMARY,
    nextStep: nextRecommendedAction(snapshot),
    familyChecklist: PARENTS_REPORT_FAMILY_CHECKLIST,
  };
}
