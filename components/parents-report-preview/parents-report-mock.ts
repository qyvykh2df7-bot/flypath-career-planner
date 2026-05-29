import {
  PARENTS_REPORT_EXECUTIVE_SUMMARY,
  PARENTS_REPORT_FAMILY_CHECKLIST,
  type ParentsReportData,
} from "@/lib/parents-report-data";

/** Datos mock — vista previa informe para padres (solo diseño). */
export type ParentsReportMock = ParentsReportData;

export { PARENTS_REPORT_FAMILY_CHECKLIST };

export const PARENTS_REPORT_MOCK: ParentsReportMock = {
  studentName: "Lucía Martín",
  generatedAt: "28 may 2026",
  objetivo: "Línea aérea comercial",
  routeRecommended: "Modular",
  totalRealista: "78.500 €",
  brecha: "12.400 €",
  brechaDetail: "aprox. 14 meses para cerrarla con el ahorro familiar declarado",
  decision: "Investigar, no pagar todavía",
  decisionHint: "Conviene validar documentación y financiación antes de transferir matrícula o depósito.",
  principalRiskTitle: "Marketing y promesas comerciales",
  principalRiskExplanation:
    "Algunas escuelas prometen apoyo laboral o acuerdos con aerolíneas que no siempre quedan por escrito. La familia debe pedir límites claros antes de pagar.",
  executiveSummary: PARENTS_REPORT_EXECUTIVE_SUMMARY,
  nextStep:
    "Reunión informativa con al menos dos escuelas, pidiendo contrato, extras incluidos y política de reembolso por escrito en las próximas dos semanas.",
  familyChecklist: PARENTS_REPORT_FAMILY_CHECKLIST,
};
