import { riskNivelIsHigh } from "@/lib/reporting/domain/risk-engine";
import type {
  CostComputation,
  Profile,
  ReadinessResult,
  RiskItem,
  RouteRecommendation,
} from "@/lib/reporting/types/shared";

export type DiagnosisCtaTarget = "schools" | "cost-adjust" | "report" | "profile";

export type DiagnosisNextStep = {
  title: string;
  detail: string;
  /** CTA de la badge Siguiente decisión; nunca «Ajustar costes» (solo en Coste realista). */
  moduleCta?: { label: string; target: DiagnosisCtaTarget };
};

export type RouteDiagnosisSummaryLine = {
  name: string;
  hint: string;
  isRecommended: boolean;
};

export function routeDiagnosisSubtext(recommended: string): string {
  if (recommended === "Modular") {
    return "Para tu situación actual, la ruta modular permite controlar mejor la inversión y reducir riesgo antes de comprometer pagos elevados.";
  }
  if (recommended === "Integrada") {
    return "Para tu situación actual, la ruta integrada puede acelerar el camino si tienes financiación sólida y disponibilidad total.";
  }
  if (recommended === "Preparación") {
    return "Para tu situación actual, conviene preparar la decisión y resolver bloqueos antes de comprometer pagos elevados.";
  }
  return `Para tu situación actual, la opción ${recommended} debe validarse con tu perfil y financiación antes de pagar.`;
}

/** Frase corta de valor bajo el nombre de ruta (dinámica por recomendación). */
export function routeDiagnosisTagline(recommended: string): string {
  if (recommended === "Modular") {
    return "Mejor equilibrio entre inversión, flexibilidad y control de riesgo.";
  }
  if (recommended === "Integrada") {
    return "Mayor ritmo cuando tu perfil sostiene inversión concentrada y disponibilidad.";
  }
  if (recommended === "Preparación") {
    return "Menor exposición económica hasta resolver bloqueos operativos clave.";
  }
  return "Valida condiciones, financiación y bloqueos antes de comprometer matrícula.";
}

/** Mini resumen de las tres rutas del motor (scores Integrada / Modular / Preparación). */
export function buildRouteDiagnosisSummary(
  route: Pick<RouteRecommendation, "recommended" | "integrated" | "modular" | "prep">,
): RouteDiagnosisSummaryLine[] {
  const options = [
    { name: "Integrada", score: route.integrated },
    { name: "Modular", score: route.modular },
    { name: "Preparación", score: route.prep },
  ] as const;

  const ranked = [...options].sort((a, b) => b.score - a.score);
  const rankByName = new Map(ranked.map((r, index) => [r.name, index]));

  return options.map((opt) => {
    const isRecommended = opt.name === route.recommended;
    const rankIndex = rankByName.get(opt.name) ?? 0;
    let hint: string;
    if (isRecommended) {
      hint = "recomendada";
    } else if (rankIndex === 2) {
      hint = "menos prioritaria";
    } else if (opt.name === "Preparación") {
      hint = "posible si resuelves bloqueos";
    } else {
      hint = "posible, pero con más condiciones";
    }
    return { name: opt.name, hint, isRecommended };
  });
}

export function riskLevelForPill(nivel: string): "Alto" | "Medio" | "Bajo" {
  if (nivel === "Crítico" || nivel === "Alto") return "Alto";
  if (nivel === "Medio") return "Medio";
  return "Bajo";
}

export function formatDiagnosisRiskHeadline(label: string): string {
  const raw = label.trim();
  const lower = raw.toLowerCase();
  if (lower.includes("marketing") || lower.includes("promesas")) {
    return "Marketing y promesas";
  }
  if (lower.includes("médico") || lower.includes("medico")) return "Riesgo médico";
  if (lower.includes("financiero")) return "Riesgo financiero";
  if (lower.includes("inglés") || lower.includes("ingles")) return "Riesgo de inglés";
  if (lower.includes("documental")) return "Riesgo documental";
  if (lower.includes("timing") || lower.includes("calendario")) return "Riesgo de calendario";
  return raw.replace(/^Riesgo de /i, "").replace(/^Riesgo /i, "Riesgo ");
}

export type DiagnosisRiskPillTone = "alto" | "medio" | "bajo";

export type DiagnosisFinancialRiskPanel = {
  brechaFormatted: string;
  coberturaPct: number;
};

export type DiagnosisQualitativeRisk = {
  estadoActual: string;
  porQueImporta: string;
  recommendedAction: string;
};

export type DiagnosisRiskDisplay = {
  title: string;
  pill: string;
  pillTone: DiagnosisRiskPillTone;
  /** Sin bloqueo crítico: párrafos principales. */
  body?: string;
  footnote?: string;
  qualitative?: DiagnosisQualitativeRisk;
  financialPanel?: DiagnosisFinancialRiskPanel;
  recommendedAction?: string;
  contextualLink?: { href: string; label: string };
};

export type DiagnosisDimensionLevel = "Alto" | "Medio" | "Bajo";

export type DiagnosisViabilityLevel = "Alta" | "Media" | "Baja";

export type DiagnosisViabilityDisplay = {
  overall: DiagnosisViabilityLevel;
  overallTone: DiagnosisRiskPillTone;
  summary: string;
  dimensions: {
    presupuesto: DiagnosisDimensionLevel;
    tiempo: DiagnosisDimensionLevel;
    ingles: DiagnosisDimensionLevel;
    class1: { label: string; level: DiagnosisDimensionLevel };
  };
};

type DiagnosisPlannerInput = {
  profile: Pick<Profile, "class1" | "ingles" | "disponibilidad" | "necesitaTrabajar" | "objetivo">;
  costs: Pick<CostComputation, "brechaFinanciacion" | "coverage" | "riesgoFinanciero">;
  route: Pick<RouteRecommendation, "recommended" | "conflicts">;
};

function formatEuroEs(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function dimensionFromInvertedRisk(nivel: RiskItem["nivel"]): DiagnosisDimensionLevel {
  if (nivel === "Crítico" || nivel === "Alto") return "Bajo";
  if (nivel === "Medio") return "Medio";
  return "Alto";
}

function inglesDimension(ingles: Profile["ingles"]): DiagnosisDimensionLevel {
  if (ingles === "alto") return "Alto";
  if (ingles === "medio") return "Medio";
  return "Bajo";
}

function class1Dimension(class1: Profile["class1"]): { label: string; level: DiagnosisDimensionLevel } {
  if (class1 === "si") return { label: "Confirmada", level: "Alto" };
  if (class1 === "reservado") return { label: "Reservada", level: "Alto" };
  return { label: "No iniciada", level: "Medio" };
}

/** Reservada / confirmada: sin riesgo médico en Diagnóstico ni como riesgo principal. */
function class1EligibleForPrimaryMedicalRisk(class1: Profile["class1"]): boolean {
  return class1 === "no";
}

function buildClass1MedicalRiskCandidate(class1: Profile["class1"]): DiagnosisRiskCandidate | null {
  if (!class1EligibleForPrimaryMedicalRisk(class1)) return null;
  return {
    title: "Riesgo médico",
    nivel: "Medio",
    body: "Inicia o confirma Clase 1 antes de comprometer pagos importantes.",
    priority: 60,
  };
}

function presupuestoDimension(
  costs: Pick<CostComputation, "brechaFinanciacion" | "coverage" | "riesgoFinanciero">,
): DiagnosisDimensionLevel {
  const finNivel = financieroNivel(costs.riesgoFinanciero, costs.brechaFinanciacion, costs.coverage);
  return dimensionFromInvertedRisk(finNivel);
}

function tiempoDimension(
  profile: Pick<Profile, "disponibilidad" | "necesitaTrabajar">,
  route: Pick<RouteRecommendation, "conflicts">,
): DiagnosisDimensionLevel {
  if (route.conflicts.length > 0) return "Bajo";
  if (profile.disponibilidad === "part-time" && profile.necesitaTrabajar === "si") return "Bajo";
  if (profile.disponibilidad === "part-time" || profile.necesitaTrabajar === "si") return "Medio";
  return "Alto";
}

function viabilityTone(overall: DiagnosisViabilityLevel): DiagnosisRiskPillTone {
  if (overall === "Alta") return "bajo";
  if (overall === "Media") return "medio";
  return "alto";
}

/** No puede ser mejor que `maxAllowed` (Alta > Media > Baja en favorabilidad). */
function capViabilityMax(current: DiagnosisViabilityLevel, maxAllowed: DiagnosisViabilityLevel): DiagnosisViabilityLevel {
  const rank: Record<DiagnosisViabilityLevel, number> = { Alta: 0, Media: 1, Baja: 2 };
  return rank[current] < rank[maxAllowed] ? maxAllowed : current;
}

function hasProfessionalGoal(objetivo: Profile["objetivo"]): boolean {
  return objetivo !== "no_lo_se";
}

function viabilitySummaryCopy(
  overall: DiagnosisViabilityLevel,
  opts?: { budgetOnlyBlock?: boolean },
): string {
  if (overall === "Alta") {
    return "Puedes avanzar y comparar escuelas sin un bloqueo crítico previo.";
  }
  if (overall === "Baja") {
    return "Conviene resolver los bloqueos principales antes de comprometer pagos.";
  }
  if (opts?.budgetOnlyBlock) {
    return "Puedes avanzar, pero necesitas resolver el bloqueo financiero antes de comprometer pagos.";
  }
  return "Puedes avanzar, pero aún hay un punto crítico que resolver.";
}

/** Solo presupuesto en Bajo; tiempo, inglés y Clase 1 favorables. */
function isBudgetOnlyBlock(dimensions: DiagnosisViabilityDisplay["dimensions"]): boolean {
  return (
    dimensions.presupuesto === "Bajo" &&
    dimensions.tiempo === "Alto" &&
    dimensions.ingles === "Alto" &&
    dimensions.class1.level === "Alto"
  );
}

/** Baja solo con combinaciones de varios bloqueos fuertes. */
function shouldViabilityBeBaja(
  input: DiagnosisPlannerInput,
  dimensions: DiagnosisViabilityDisplay["dimensions"],
): boolean {
  const presupuestoBajo = dimensions.presupuesto === "Bajo";

  if (presupuestoBajo && dimensions.tiempo === "Bajo") return true;
  if (presupuestoBajo && dimensions.ingles === "Bajo") return true;
  if (presupuestoBajo && input.profile.class1 === "no") return true;
  if (presupuestoBajo && input.route.recommended === "Preparación") return true;

  if (dimensions.tiempo === "Bajo" && dimensions.ingles === "Bajo") return true;
  if (dimensions.class1.level === "Bajo" && dimensions.ingles === "Bajo") return true;

  return false;
}

function hasModerateBlock(
  dimensions: DiagnosisViabilityDisplay["dimensions"],
  primary: DiagnosisRiskCandidate | null,
): boolean {
  if (dimensions.presupuesto === "Bajo") return true;
  if (dimensions.tiempo === "Medio" || dimensions.tiempo === "Bajo") return true;
  if (dimensions.ingles === "Medio" || dimensions.ingles === "Bajo") return true;
  if (dimensions.class1.level !== "Alto") return true;
  return primary !== null;
}

/** Viabilidad para avanzar ahora (alineada con riesgo principal; sin escuelas). */
export function resolveDiagnosisViabilityDisplay(input: DiagnosisPlannerInput): DiagnosisViabilityDisplay {
  const primary = pickPrimaryDiagnosisRisk(buildDiagnosisRiskCandidates(input));
  const presupuesto = presupuestoDimension(input.costs);
  const tiempo = tiempoDimension(input.profile, input.route);
  const ingles = inglesDimension(input.profile.ingles);
  const class1 = class1Dimension(input.profile.class1);
  const dimensions = { presupuesto, tiempo, ingles, class1 };

  const budgetOnlyBlock = isBudgetOnlyBlock(dimensions);
  let overall: DiagnosisViabilityLevel;

  if (shouldViabilityBeBaja(input, dimensions)) {
    overall = "Baja";
  } else if (budgetOnlyBlock) {
    overall = "Media";
  } else if (
    !primary &&
    dimensions.presupuesto !== "Bajo" &&
    dimensions.tiempo === "Alto" &&
    dimensions.ingles === "Alto" &&
    dimensions.class1.level === "Alto"
  ) {
    overall = "Alta";
  } else if (hasModerateBlock(dimensions, primary)) {
    overall = "Media";
  } else {
    overall = "Alta";
  }

  if (dimensions.presupuesto === "Bajo") {
    overall = capViabilityMax(overall, "Media");
  }

  if (input.profile.class1 === "no" && hasProfessionalGoal(input.profile.objetivo)) {
    overall = capViabilityMax(overall, "Baja");
  }

  return {
    overall,
    overallTone: viabilityTone(overall),
    summary: viabilitySummaryCopy(overall, {
      budgetOnlyBlock: budgetOnlyBlock && overall === "Media",
    }),
    dimensions,
  };
}

type DiagnosisRiskCandidate = {
  title: string;
  nivel: RiskItem["nivel"];
  body: string;
  priority: number;
};

function financieroNivel(
  riesgoFinanciero: string,
  brechaFinanciacion: number,
  coverage: number,
): RiskItem["nivel"] {
  if (riskNivelIsHigh(riesgoFinanciero) || brechaFinanciacion > 0) {
    return riesgoFinanciero === "Crítico" || riesgoFinanciero === "Alto" ? riesgoFinanciero : "Alto";
  }
  if (coverage < 70) return "Medio";
  return "Bajo";
}

function buildDiagnosisRiskCandidates(input: DiagnosisPlannerInput): DiagnosisRiskCandidate[] {
  const candidates: DiagnosisRiskCandidate[] = [];

  const medicalRisk = buildClass1MedicalRiskCandidate(input.profile.class1);
  if (medicalRisk) candidates.push(medicalRisk);

  if (input.profile.ingles === "bajo") {
    candidates.push({
      title: "Riesgo inglés",
      nivel: "Alto",
      body: "Necesitas mejorar inglés antes de fases críticas.",
      priority: 80,
    });
  } else if (input.profile.ingles === "medio") {
    candidates.push({
      title: "Riesgo inglés",
      nivel: "Medio",
      body: "Necesitas mejorar inglés antes de fases críticas.",
      priority: 45,
    });
  }

  const finNivel = financieroNivel(
    input.costs.riesgoFinanciero,
    input.costs.brechaFinanciacion,
    input.costs.coverage,
  );
  if (finNivel !== "Bajo") {
    candidates.push({
      title: "Riesgo financiero",
      nivel: finNivel,
      body: "Tu presupuesto todavía no cubre el escenario realista.",
      priority: finNivel === "Crítico" ? 90 : finNivel === "Alto" ? 85 : 55,
    });
  }

  const timingStress =
    input.profile.disponibilidad === "part-time" ||
    input.profile.necesitaTrabajar === "si" ||
    input.route.conflicts.length > 0;

  if (timingStress) {
    candidates.push({
      title: "Riesgo tiempo",
      nivel: input.route.conflicts.length > 0 ? "Alto" : "Medio",
      body: "Tu disponibilidad puede alargar significativamente la ruta.",
      priority: input.route.conflicts.length > 0 ? 75 : 50,
    });
  }

  if (input.route.recommended === "Preparación") {
    candidates.push({
      title: "Riesgo ruta",
      nivel: "Medio",
      body: "Conviene resolver bloqueos antes de comprometer pagos elevados.",
      priority: 48,
    });
  }

  return candidates;
}

/** Orden fijo del riesgo principal en Diagnóstico (un solo riesgo; sin secundarios). */
const DIAGNOSIS_PRIMARY_RISK_ORDER = [
  "Riesgo financiero",
  "Riesgo médico",
  "Riesgo inglés",
  "Riesgo tiempo",
  "Riesgo ruta",
] as const;

function pickPrimaryDiagnosisRisk(candidates: DiagnosisRiskCandidate[]): DiagnosisRiskCandidate | null {
  if (candidates.length === 0) return null;
  const byTitle = new Map(candidates.map((c) => [c.title, c]));
  for (const title of DIAGNOSIS_PRIMARY_RISK_ORDER) {
    const match = byTitle.get(title);
    if (match) return match;
  }
  return candidates[0] ?? null;
}

function buildRiskDisplayFromPrimary(top: DiagnosisRiskCandidate, input: DiagnosisPlannerInput): DiagnosisRiskDisplay {
  const pill = riskLevelForPill(top.nivel);
  const pillTone: DiagnosisRiskPillTone = pill === "Alto" ? "alto" : pill === "Medio" ? "medio" : "bajo";
  const coverageRounded = Math.round(Math.max(0, Math.min(100, input.costs.coverage)));

  if (top.title === "Riesgo financiero") {
    return {
      title: top.title,
      pill,
      pillTone,
      financialPanel: {
        brechaFormatted: formatEuroEs(input.costs.brechaFinanciacion),
        coberturaPct: coverageRounded,
      },
      recommendedAction: "Ajustar presupuesto o comparar opciones con menor coste.",
    };
  }

  if (top.title === "Riesgo médico") {
    return {
      title: top.title,
      pill,
      pillTone,
      qualitative: {
        estadoActual: "Clase 1 no iniciada.",
        porQueImporta:
          "Sin Clase 1 no deberías comprometer pagos importantes de formación profesional.",
        recommendedAction:
          "Reserva el reconocimiento médico antes de elegir escuela o pagar matrícula.",
      },
    };
  }

  if (top.title === "Riesgo inglés") {
    const estadoActual =
      input.profile.ingles === "bajo"
        ? "Nivel de inglés bajo para avanzar con comodidad."
        : "Nivel de inglés medio; conviene reforzarlo antes de fases exigentes.";
    return {
      title: top.title,
      pill,
      pillTone,
      qualitative: {
        estadoActual,
        porQueImporta: "El inglés afecta ATPL, comunicaciones, entrevistas y selección.",
        recommendedAction: "Refuerza inglés antes de fases críticas de la ruta.",
      },
      contextualLink: { href: "/aerocomms", label: "Ver AeroComms →" },
    };
  }

  if (top.title === "Riesgo tiempo") {
    const estadoActual =
      input.route.conflicts.length > 0
        ? "Disponibilidad limitada y conflictos en el calendario de la ruta."
        : input.profile.disponibilidad === "part-time" && input.profile.necesitaTrabajar === "si"
          ? "Part-time y necesidad de trabajar durante la formación."
          : input.profile.disponibilidad === "part-time"
            ? "Formación en part-time."
            : "Necesitas trabajar mientras avanzas en la formación.";
    return {
      title: top.title,
      pill,
      pillTone,
      qualitative: {
        estadoActual,
        porQueImporta:
          "Tu ritmo real puede alargar la ruta y aumentar costes de vida y oportunidad.",
        recommendedAction: "Revisa ritmo y calendario antes de comprometer matrícula.",
      },
    };
  }

  if (top.title === "Riesgo ruta") {
    return {
      title: top.title,
      pill,
      pillTone,
      qualitative: {
        estadoActual: `Ruta en preparación (${input.route.recommended} recomendada cuando resuelvas bloqueos).`,
        porQueImporta:
          "Comprometer pagos elevados sin preparación aumenta el riesgo de perder tiempo y dinero.",
        recommendedAction: "Resolver bloqueos operativos antes de pagos elevados.",
      },
    };
  }

  return {
    title: top.title,
    pill,
    pillTone,
    qualitative: {
      estadoActual: top.body,
      porQueImporta: "Conviene validarlo antes de comprometer pagos importantes.",
      recommendedAction: top.body,
    },
  };
}

/** Riesgo principal del diagnóstico: perfil, presupuesto y ruta (sin escuelas/documentación). */
export function resolveDiagnosisRiskDisplay(input: DiagnosisPlannerInput): DiagnosisRiskDisplay {
  const top = pickPrimaryDiagnosisRisk(buildDiagnosisRiskCandidates(input));

  if (!top) {
    return {
      title: "Sin bloqueo crítico",
      pill: "Bajo",
      pillTone: "bajo",
      body: "No se detecta un riesgo principal antes de comparar escuelas.",
      footnote:
        "El siguiente punto crítico será validar escuelas, costes reales y condiciones por escrito.",
    };
  }

  return buildRiskDisplayFromPrimary(top, input);
}

export function pickDiagnosisNextStep(input: {
  profile: Pick<Profile, "class1" | "financiacion">;
  schoolsCount: number;
  costs: { brechaFinanciacion: number; coverage: number; riesgoFinanciero: string };
  decisionReadiness: Pick<ReadinessResult, "proximosPasos" | "decision">;
  actionPlanSevenDays: string[];
}): DiagnosisNextStep {
  if (input.profile.class1 !== "si") {
    return {
      title: "Confirmar Clase 1",
      detail: "Sin Clase 1 confirmada, cualquier matrícula o depósito aumenta el riesgo de perder dinero y tiempo.",
      moduleCta: { label: "Revisar perfil", target: "profile" },
    };
  }

  const financialPressure =
    riskNivelIsHigh(input.costs.riesgoFinanciero) ||
    input.costs.brechaFinanciacion > 0 ||
    (input.profile.financiacion !== "confirmada" && input.costs.coverage < 70);

  if (financialPressure) {
    return {
      title: "Revisar presupuesto",
      detail: "Revisa el presupuesto antes de elegir escuela.",
    };
  }

  if (input.schoolsCount < 2) {
    return {
      title: "Comparar escuelas",
      detail: "Necesitas al menos dos opciones documentadas para validar precio final, contrato y reembolso.",
      moduleCta: { label: "Ir a escuelas", target: "schools" },
    };
  }

  const readyForReport =
    input.decisionReadiness.decision === "Listo para decidir con condiciones" ||
    input.decisionReadiness.decision === "Puedes seguir investigando, pero no pagar";

  if (readyForReport) {
    return {
      title: "Ver informe",
      detail: "Consolida perfil, diagnóstico y escuelas en un resumen listo para compartir o exportar.",
      moduleCta: { label: "Ver informe", target: "report" },
    };
  }

  const fromReadiness = input.decisionReadiness.proximosPasos[0]?.trim();
  const fromPlan = input.actionPlanSevenDays[0]?.trim();
  const detail = fromReadiness || fromPlan || "Valida el siguiente punto crítico antes de pagar matrícula o depósito.";

  return {
    title: fromReadiness ? fromReadiness.replace(/\.$/, "") : "Comparar escuelas",
    detail,
    moduleCta: {
      label: input.schoolsCount >= 2 ? "Ver informe" : "Ir a escuelas",
      target: input.schoolsCount >= 2 ? "report" : "schools",
    },
  };
}

