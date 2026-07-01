import { hasHighDocumentOrCommercialRisk, riskNivelIsHigh } from "@/lib/reporting/domain/risk-engine";
import type {
  CostInputs,
  FlyPathNextStepRecommendation,
  FlyPathPrimaryId,
  FlyPathProductCard,
  FlyPathProductId,
  Profile,
  ReadinessResult,
  RiskItem,
  RouteRecommendation,
} from "@/lib/reporting/types/shared";

export const FLYPATH_PRODUCT_HREF: Record<Exclude<FlyPathProductId, "escuelas">, string> = {
  guia: "/guia-como-ser-piloto",
  mentoria: "/mentorias",
  ingles: "/aerocomms",
};

export const FLYPATH_PRIMARY_IMAGE: Record<FlyPathProductId, string> = {
  guia: "/como-ser-piloto-cover.jpeg",
  mentoria: "/mentoria.jpg",
  ingles: "/ingles-aeronautico.jpg",
  escuelas: "/school-card-bg/cadet-airline.jpg",
};

export const FLYPATH_PRODUCTS: Record<
  FlyPathProductId,
  FlyPathProductCard
> = {
  guia: {
    title: "Guía Cómo ser Piloto",
    body: "Entiende el camino completo antes de hablar con escuelas: licencias, rutas, costes, tiempos y errores típicos.",
    cta: "Ver la guía",
  },
  mentoria: {
    title: "Mentoría de decisión",
    body: "Revisa tu caso, presupuesto y escuelas candidatas con un piloto profesional.",
    cta: "Reservar mentoría",
  },
  ingles: {
    title: "AeroComms",
    body: "Practica listening, readbacks, fraseología y escenarios guiados de radio ATC.",
    cta: "Ver AeroComms",
  },
  escuelas: {
    title: "Comparador de escuelas",
    body: "Explora la base FlyPath, compara opciones reales y valida condiciones antes de pagar.",
    cta: "Explorar escuelas",
  },
};

const FLYPATH_SECONDARY_BY_PRIMARY: Record<FlyPathPrimaryId, [FlyPathProductId, FlyPathProductId]> = {
  guia: ["mentoria", "ingles"],
  mentoria: ["guia", "ingles"],
  ingles: ["mentoria", "guia"],
};

export type PickFlyPathNextStepsInput = {
  profile: Pick<Profile, "class1" | "objetivo" | "ingles" | "preocupacionIngles" | "financiacion">;
  route: Pick<RouteRecommendation, "recommended" | "principalBlock">;
  decisionReadiness: Pick<ReadinessResult, "decision" | "faltanDatos">;
  schoolsCount: number;
  verifiedSchoolsCount: number;
  costInputs: Pick<CostInputs, "atplTheory">;
  costs: { riesgoFinanciero: string; coverage: number };
  riskDiagnosis: Pick<RiskItem, "label" | "nivel">[];
};

export type PickFlyPathNextStepsResult = FlyPathNextStepRecommendation;

/** Solo Mentoría, Guía o Inglés como principal. */
export function pickFlyPathNextSteps(input: PickFlyPathNextStepsInput): PickFlyPathNextStepsResult {
  const { profile, route, decisionReadiness, schoolsCount, verifiedSchoolsCount, costs, riskDiagnosis } =
    input;
  const reasons: string[] = [];

  const isInitial =
    profile.class1 !== "si" ||
    route.recommended === "Preparación" ||
    profile.objetivo === "no_lo_se";
  const totallyInitial = isInitial && schoolsCount === 0;

  const schoolsInsufficient = schoolsCount < 2;
  const schoolsUnverified = schoolsCount > 0 && verifiedSchoolsCount === 0;
  const documentOrCommercialRisk = hasHighDocumentOrCommercialRisk(riskDiagnosis);
  const notReadyToPay =
    decisionReadiness.decision === "No estás listo para pagar" ||
    decisionReadiness.decision === "Puedes seguir investigando, pero no pagar";
  const financialPressure =
    riskNivelIsHigh(costs.riesgoFinanciero) ||
    (profile.financiacion !== "confirmada" && costs.coverage < 70);
  const decisionBeforePay =
    schoolsInsufficient ||
    schoolsUnverified ||
    documentOrCommercialRisk ||
    notReadyToPay ||
    decisionReadiness.faltanDatos.length >= 2 ||
    financialPressure;

  const englishBlock =
    profile.ingles === "bajo" || (profile.preocupacionIngles === "si" && !totallyInitial);

  if (decisionBeforePay) {
    reasons.push(
      "Prioridad decisión/pago: escuelas, documentación o economía antes de avanzar en la formación",
    );
    return { primary: "mentoria", secondaryIds: FLYPATH_SECONDARY_BY_PRIMARY.mentoria, reasons };
  }

  if (totallyInitial || (isInitial && schoolsCount === 0)) {
    reasons.push("Perfil inicial: ruta, licencias y costes aún por aclarar");
    return { primary: "guia", secondaryIds: FLYPATH_SECONDARY_BY_PRIMARY.guia, reasons };
  }

  if (englishBlock) {
    reasons.push("Bloqueo principal: inglés operativo o ICAO");
    return { primary: "ingles", secondaryIds: FLYPATH_SECONDARY_BY_PRIMARY.ingles, reasons };
  }

  if (isInitial) {
    reasons.push("Perfil en preparación: entender ruta y marco antes de escuelas");
    return { primary: "guia", secondaryIds: FLYPATH_SECONDARY_BY_PRIMARY.guia, reasons };
  }

  reasons.push("Fallback: guía como base de decisión");
  return { primary: "guia", secondaryIds: FLYPATH_SECONDARY_BY_PRIMARY.guia, reasons };
}
