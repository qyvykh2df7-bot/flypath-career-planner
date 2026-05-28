import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

export type ExecutiveReading = {
  headline: string;
  whatItMeans: string;
  whatToAvoid: string;
  whatToValidate: string;
};

function briefLine(text: string, max = 132): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 60 ? slice.slice(0, lastSpace) : slice;
  return cut.trimEnd();
}

/** Lectura ejecutiva breve para preview. */
const EXECUTIVE_WHAT_IT_MEANS =
  "Todavía existen variables críticas sin validar antes de comprometer pagos. La prioridad pasa a confirmar documentación, calendario de pagos y brecha financiera real.";

export function buildExecutiveReading(snapshot: ReportSnapshotV1): ExecutiveReading {
  const { readiness, risks, flypathNextStep } = snapshot;

  const whatItMeans = EXECUTIVE_WHAT_IT_MEANS;

  let whatToAvoid =
    "No cerrar pagos ni reservas sin contrato, calendario de pagos y costes confirmados por escrito.";
  if (readiness.showNoPaguesBadge || /no pagar/i.test(readiness.decision)) {
    whatToAvoid =
      "No adelantar matrículas, depósitos ni fases costosas hasta cerrar documentación y brecha financiera.";
  } else if (readiness.bloqueosCriticos[0]) {
    whatToAvoid = readiness.bloqueosCriticos[0];
  } else if (risks.highestLevel === "Alto" || risks.highestLevel === "Crítico") {
    whatToAvoid =
      "No avanzar con riesgo alto sin plan claro para documentación, finanzas o inglés.";
  }

  const validateSource =
    readiness.faltanDatos[0] ??
    readiness.proximosPasos[0] ??
    flypathNextStep.reasons[0] ??
    "Confirmar contrato y extras incluidos con al menos una escuela.";

  return {
    headline: readiness.decision,
    whatItMeans,
    whatToAvoid: briefLine(whatToAvoid),
    whatToValidate: briefLine(validateSource),
  };
}
