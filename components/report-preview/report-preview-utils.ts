import type { ReadinessDecision } from "@/lib/reporting/types/shared";
import type {
  ReportSnapshotRiskLevel,
  ReportSnapshotSchoolSummaryItem,
} from "@/lib/reporting/types/report-snapshot";

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function objetivoLabel(objetivo: string): string {
  if (objetivo === "aerolinea") return "Línea aérea";
  if (objetivo === "ejecutivo") return "Aviación ejecutiva";
  if (objetivo === "instructor") return "Instructor";
  return "Por definir";
}

export function disponibilidadLabel(disponibilidad: string): string {
  if (disponibilidad === "full-time") return "Dedicación completa";
  return "Compatibilidad con trabajo (part-time)";
}

export function riskLevelBadgeClass(nivel: string): string {
  if (nivel === "Crítico") return "bg-[#c9a454]/20 text-[#8a6520]";
  if (nivel === "Alto") return "bg-rose-100 text-rose-900";
  if (nivel === "Medio") return "bg-amber-100 text-amber-950";
  return "bg-emerald-100 text-emerald-900";
}

export function riskLevelTone(nivel: string): {
  border: string;
  bg: string;
  text: string;
  dot: string;
} {
  if (nivel === "Crítico") {
    return {
      border: "border-[#c9a454]/50",
      bg: "bg-[#c9a454]/12",
      text: "text-[#8a6520]",
      dot: "bg-[#c9a454]",
    };
  }
  if (nivel === "Alto") {
    return {
      border: "border-rose-300/60",
      bg: "bg-rose-50",
      text: "text-rose-900",
      dot: "bg-rose-500",
    };
  }
  if (nivel === "Medio") {
    return {
      border: "border-amber-200/80",
      bg: "bg-amber-50/80",
      text: "text-amber-950",
      dot: "bg-amber-500",
    };
  }
  return {
    border: "border-emerald-200/80",
    bg: "bg-emerald-50/60",
    text: "text-emerald-950",
    dot: "bg-emerald-500",
  };
}

export function highestRiskLabel(level: ReportSnapshotRiskLevel): string {
  return `Riesgo global: ${level}`;
}

/** Titular corto para la decisión de pago en preview (sin alterar el texto oficial del snapshot). */
export function paymentDecisionHeadline(decision: ReadinessDecision): string {
  if (decision === "No estás listo para pagar") return "No pagar todavía";
  if (decision === "Puedes seguir investigando, pero no pagar") return "Investigar, no pagar";
  if (decision === "Listo para decidir con condiciones") return "Avanzar con condiciones";
  return decision;
}

export function programaLabel(programa: string): string {
  if (programa === "integrado") return "Ruta integrada";
  if (programa === "modular") return "Ruta modular";
  if (programa === "cadet") return "Programa cadet";
  return "Programa por definir";
}

/** Primera letra en mayúscula para acciones editoriales en preview. */
export function formatEditorialSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function formatPriorityAction(warning: string): string {
  return formatEditorialSentence(warning.replace(/^Prioridad:\s*/i, ""));
}

export function financialInsightMessage(brechaFinanciacion: number, coveragePct: number): string {
  if (brechaFinanciacion > 0) {
    return "Tu principal limitación no es solo el coste total, sino la brecha entre presupuesto disponible y escenario realista.";
  }
  if (coveragePct >= 100) {
    return "El escenario realista queda cubierto por tu presupuesto declarado. Prioriza validación documental y reserva operativa antes de comprometer pagos.";
  }
  return "La cobertura del escenario realista es sólida. Mantén margen para imprevistos y fases no incluidas en el precio anunciado.";
}

export function schoolsInsightMessage(
  verifiedCount: number,
  total: number,
  bestSchoolName: string | null,
): string {
  if (total === 0) {
    return "Sin escuelas en comparador, la decisión de pago depende casi por completo de tu perfil y financiación.";
  }
  if (verifiedCount < total) {
    return "La comparación mejora cuando cada escuela confirma costes, calendario de pagos y condiciones por escrito.";
  }
  if (bestSchoolName) {
    return `${bestSchoolName} lidera en documentación, pero conviene contrastar contrato y extras antes de reservar plaza.`;
  }
  return "Documentación homogénea entre escuelas: el siguiente filtro es contrato, extras y alineación con tu ruta.";
}

export function routeInsightMessage(recommended: string, principalBlock: string): string {
  if (principalBlock && principalBlock !== "Ningún bloqueo crítico") {
    return `La ruta ${recommended} encaja, pero ${principalBlock.toLowerCase()} condiciona el ritmo de la decisión.`;
  }
  return `La ruta ${recommended} encaja con tu perfil actual; el foco pasa a financiación, documentación y timing de pagos.`;
}

export type RiskIconKey =
  | "medical"
  | "financial"
  | "english"
  | "document"
  | "marketing"
  | "timing"
  | "default";

export function riskIconKey(label: string): RiskIconKey {
  const normalized = label.toLowerCase();
  if (normalized.includes("médico") || normalized.includes("medico")) return "medical";
  if (normalized.includes("financiero")) return "financial";
  if (normalized.includes("inglés") || normalized.includes("ingles")) return "english";
  if (normalized.includes("documental")) return "document";
  if (normalized.includes("marketing") || normalized.includes("promesas")) return "marketing";
  if (normalized.includes("timing")) return "timing";
  return "default";
}

export function flypathSecondaryProductLabel(id: string): string {
  if (id === "guia") return "Guía Cómo ser Piloto";
  if (id === "ingles") return "AeroComms";
  if (id === "mentoria") return "Mentoría";
  if (id === "escuelas") return "Comparador de escuelas";
  return id;
}

export function verificacionLabel(estado: string): string {
  return estado.replace(/_/g, " ");
}

/** Acción sugerida en preview (heurística visual; no altera motores). */
export function schoolRecommendedAction(
  school: ReportSnapshotSchoolSummaryItem,
  bestSchoolName: string | null,
): string | null {
  if (bestSchoolName && school.nombre === bestSchoolName) {
    return "Priorizar validación documental y reunión informativa antes de reservar plaza.";
  }
  if (school.estadoVerificacion !== "verificado") {
    return "Solicitar contrato, calendario de pagos y confirmación de costes por escrito.";
  }
  if (school.pendientes.length > 0) {
    const top = school.pendientes.slice(0, 2).join(" · ");
    return `Cerrar pendientes: ${top}.`;
  }
  return "Mantener en comparador hasta cerrar brecha financiera y readiness.";
}
