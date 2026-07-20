"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Compass,
  Database,
  Download,
  FileText,
  GraduationCap,
  HelpCircle,
  Moon,
  Languages,
  LayoutList,
  Lock,
  Mail,
  Pencil,
  Plane,
  Plus,
  School as SchoolIcon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Unlock,
  UserCheck,
  UserRound,
  Wallet,
  MessagesSquare,
  Route,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { getSchoolBySlug } from "@/lib/schools/schoolUtils";
import {
  countPlannerVerifiedSchools,
  getPlannerSchoolCatalog,
  getProgramOptionsForEntry,
  mapComparatorSchoolToPlannerSchool,
  mapEntryOptionToPlannerSchool,
  parsePlannerSchoolLink,
  type PlannerProgramOption,
} from "@/lib/planner-school-database";
import type { SchoolEntry } from "@/types/schools";
import type { PublicSchoolReviewSummary } from "@/lib/school-reviews/contracts";
import { buildSchoolReviewSummariesPath } from "@/lib/school-reviews/presentation";
import { useQaPremiumMode } from "@/hooks/useQaPremiumMode";
import { canSeePremiumForDevQa } from "@/lib/qaPremiumMode";
import { PREMIUM_REPORT_PRICE_LABEL } from "@/lib/premium-report-checkout";
import { CareerPlannerAppShell } from "@/components/career-planner/CareerPlannerAppShell";
import { CareerPlannerBottomNav } from "@/components/career-planner/CareerPlannerBottomNav";
import { CareerPlannerStepNav } from "@/components/career-planner/CareerPlannerStepNav";
import { PlannerStepFooter } from "@/components/career-planner/PlannerStepFooter";
import { PlannerMainCanvas } from "@/components/career-planner/PlannerMainCanvas";
import {
  plannerBody,
  plannerBtnPrimary,
  plannerEyebrow,
  plannerSubcard,
  plannerTitle,
} from "@/components/career-planner/planner-surface";
import { CareerPlannerDiagnosisView } from "@/components/career-planner/CareerPlannerDiagnosisView";
import { SchoolReviewStars } from "@/components/career-planner/SchoolReviewStars";
import {
  CareerPlannerSchoolsTab,
  SchoolDatabasePicker,
  SchoolManualForm,
} from "@/components/career-planner/CareerPlannerSchoolsTab";
import { CareerPlannerPremiumCheckoutButton } from "@/components/career-planner/CareerPlannerPremiumCheckoutButton";
import type { PlannerDashboardTab, PlannerStepId } from "@/components/career-planner/career-planner-steps";
import {
  normalizeDashboardTab,
  normalizePlannerStep,
  plannerStepToTab,
} from "@/components/career-planner/career-planner-steps";
import {
  resolveDiagnosisRiskDisplay,
  resolveDiagnosisViabilityDisplay,
  type DiagnosisCtaTarget,
  type DiagnosisDimensionLevel,
  type DiagnosisRiskPillTone,
} from "@/lib/planner-diagnosis-ui";
import { CareerPlannerCostAdjustForm } from "@/components/career-planner/CareerPlannerCostAdjustForm";
import { buildReportSnapshot } from "@/lib/reporting/mappers/build-report-snapshot";
import {
  buildRiskDiagnosis,
  hasHighDocumentOrCommercialRisk,
  riskNivelIsHigh,
} from "@/lib/reporting/domain/risk-engine";
import { buildActionPlan } from "@/lib/reporting/domain/roadmap-engine";
import { computeRoute } from "@/lib/reporting/domain/route-engine";
import { computeCosts } from "@/lib/reporting/domain/cost-engine";
import { computeDecisionReadiness } from "@/lib/reporting/domain/readiness-engine";
import {
  computeFlypathSchoolRecommendation,
  computeSchoolStats,
  getSchoolEmailMissingData,
} from "@/lib/reporting/domain/school-engine";
import {
  FLYPATH_PRIMARY_IMAGE,
  FLYPATH_PRODUCT_HREF,
  FLYPATH_PRODUCTS,
  pickFlyPathNextSteps,
} from "@/lib/reporting/domain/flypath-next-step-engine";
import type {
  CostInputs,
  FlyPathPrimaryId,
  FlyPathProductId,
  FlyPathNextStepRecommendation,
  Profile,
  ReadinessResult,
  RiskItem,
  RouteRecommendation,
  School,
  YesNoUnknown,
} from "@/lib/reporting/types/shared";
import { captureCareerPlannerReportLead } from "@/lib/leads/capture-career-planner-report-client";
import {
  CAREER_PLANNER_MARKETING_CONSENT_REQUIRED_MESSAGE,
  CAREER_PLANNER_MARKETING_CONSENT_TEXT,
} from "@/lib/leads/career-planner-consent";
import { trackEventOncePerSession, trackPageViewed } from "@/lib/tracking/client";
import {
  createTrackingUuid,
  getTrackingContext,
  initializeTrackingContext,
} from "@/lib/tracking/session";
const REPORT_EMAIL_STORAGE_KEY = "flypath_report_email";

function isValidReportEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

type Screen = "onboarding" | "dashboard";
export type Tab = PlannerDashboardTab;
type RouteAnalysis = RouteRecommendation;
type DecisionReadiness = ReadinessResult;
type SchoolReviewSummaryResponse = { items?: PublicSchoolReviewSummary[] };

/** Color del valor visible del badge "Decisión de pago" en el hero del Informe final (solo UI). */
function informeHeroDecisionValueTextClass(decision: DecisionReadiness["decision"]): string {
  switch (decision) {
    case "No estás listo para pagar":
      return "text-[#f2ddaa]";
    case "Listo para decidir con condiciones":
      return "text-emerald-300";
    case "Puedes seguir investigando, pero no pagar":
      return "text-sky-300";
    default:
      return "text-[#f2ddaa]";
  }
}

type InformePreparacionNivel = "Bajo" | "Medio" | "Alto";

/** Nivel cualitativo derivado de la decisión (solo copy del Informe final; no altera el score). */
function informePreparacionNivel(decision: DecisionReadiness["decision"]): InformePreparacionNivel {
  switch (decision) {
    case "No estás listo para pagar":
      return "Bajo";
    case "Puedes seguir investigando, pero no pagar":
      return "Medio";
    case "Listo para decidir con condiciones":
      return "Alto";
    default:
      return "Bajo";
  }
}

function informePreparacionNivelTextClass(_nivel: InformePreparacionNivel): string {
  return "text-[#D6AE4F]";
}

function informeFinalHeroHeadline(decision: DecisionReadiness["decision"]): string {
  switch (decision) {
    case "No estás listo para pagar":
      return "No estás listo para pagar todavía";
    case "Puedes seguir investigando, pero no pagar":
      return "Puedes investigar, pero no pagar todavía";
    case "Listo para decidir con condiciones":
      return "Puedes avanzar con validación prudente";
    default:
      return "No estás listo para pagar todavía";
  }
}

function informeFinalHeroSubheadline(
  route: RouteAnalysis,
  riskDiagnosis: { label: string; nivel: string }[],
): string {
  const routeWord =
    route.recommended === "Integrada"
      ? "integrada"
      : route.recommended === "Modular"
        ? "modular"
        : "de preparación";
  const riskThemes = riskDiagnosis
    .filter((r) => r.nivel === "Alto" || r.nivel === "Crítico")
    .map((r) => {
      if (r.label === "Riesgo financiero") return "financieros";
      if (r.label === "Riesgo documental") return "documentales";
      if (r.label === "Riesgo médico") return "médicos";
      if (r.label === "Riesgo de inglés") return "de inglés";
      if (r.label === "Riesgo de marketing/promesas") return "comerciales";
      if (r.label === "Riesgo de timing") return "de calendario";
      return null;
    })
    .filter((v) => v !== null);
  const uniqueThemes = [...new Set(riskThemes)];
  const riskPhrase =
    uniqueThemes.length === 0
      ? "puntos críticos sin validar por escrito"
      : uniqueThemes.length === 1
        ? `riesgos ${uniqueThemes[0]} sin validar`
        : `riesgos ${uniqueThemes.slice(0, -1).join(", ")} y ${uniqueThemes[uniqueThemes.length - 1]} sin validar`;

  return `Tu ruta más prudente ahora es ${routeWord} y todavía existen ${riskPhrase}.`;
}

function informeRiskChipLabel(label: string): string {
  if (label === "Riesgo de marketing/promesas") return "Riesgo comercial";
  if (label === "Riesgo de timing") return "Riesgo calendario";
  if (label === "Riesgo de inglés") return "Riesgo inglés";
  return label.replace(/^Riesgo de /i, "Riesgo ");
}

/** Si el hero ya comunica la decisión, la conclusión solo se muestra si aporta una acción concreta. */
function informeConclusionUi(
  decision: DecisionReadiness["decision"],
  bloqueosCriticos: string[],
  faltanDatos: string[],
): { show: boolean; text: string } {
  if (decision === "No estás listo para pagar") {
    if (bloqueosCriticos.length > 0) {
      return {
        show: true,
        text: `Próximo foco: ${bloqueosCriticos[0]}`,
      };
    }
    return { show: false, text: "" };
  }
  if (decision === "Puedes seguir investigando, pero no pagar") {
    return { show: false, text: "" };
  }
  if (faltanDatos.length > 0) {
    return {
      show: true,
      text: "Antes de pagar, cierra por escrito: contrato, precio final, extras incluidos, reembolso y calendario de pagos.",
    };
  }
  return {
    show: true,
    text: "Antes de transferir dinero, confirma contrato, precio final, extras, reembolso y calendario por escrito.",
  };
}

function informeRiskNivelBadgeClass(nivel: string): string {
  if (nivel === "Crítico") return "border-[#c9a454]/50 bg-[#c9a454]/20 text-[#7a5a16]";
  if (nivel === "Alto") return "border-[#1d4ed8]/35 bg-[#1d4ed8]/12 text-[#1e40af]";
  if (nivel === "Medio") return "border-amber-300/60 bg-amber-50 text-amber-900";
  return "border-slate-300/80 bg-slate-100 text-slate-700";
}

const disclaimerText =
  "FlyPath Career Planner ofrece orientación educativa y herramientas de planificación basadas en los datos introducidos por el usuario. No sustituye asesoramiento financiero, médico, legal ni información oficial de escuelas, autoridades o aerolíneas. Los costes son estimaciones y pueden variar.";

/**
 * Texto de la "Conclusión ejecutiva" del Informe final.
 *
 * El mensaje del caso "No estás listo para pagar" se refina con el contenido real de
 * `bloqueosCriticos` y `faltanDatos` para evitar contradicciones del tipo "resuelve
 * bloqueos críticos" cuando en la lectura ejecutiva consta "Ningún bloqueo crítico".
 *
 * No toca scoring, decisión ni el cálculo: solo el copy visible/exportado.
 */
function conclusionEjecutivaInformeFinal(
  decision: DecisionReadiness["decision"],
  bloqueosCriticos: string[] = [],
  faltanDatos: string[] = [],
): string {
  const hasCriticalBlockers = bloqueosCriticos.length > 0;
  const hasPendingData = faltanDatos.length > 0;

  if (decision === "No estás listo para pagar") {
    if (hasCriticalBlockers) {
      return "Ahora mismo no deberías pagar matrícula, depósito ni firmar condiciones. Primero debes resolver bloqueos críticos, cerrar datos pendientes y confirmar que la ruta encaja con tu situación real.";
    }
    if (hasPendingData) {
      return "Ahora mismo no deberías pagar matrícula, depósito ni firmar condiciones. Primero debes cerrar datos pendientes y confirmar que la ruta encaja con tu situación real.";
    }
    return "Ahora mismo no deberías pagar matrícula, depósito ni firmar condiciones. Primero conviene confirmar que la ruta encaja con tu situación real antes de comprometer dinero.";
  }
  if (decision === "Puedes seguir investigando, pero no pagar") {
    return "Puedes seguir comparando escuelas y completando información, pero todavía no hay base suficiente para comprometer dinero.";
  }
  return "La decisión parece más sólida, pero solo deberías avanzar si tienes contrato, precio final, extras incluidos, reembolso y calendario de pagos por escrito.";
}

function costEstimateNoteForPdf(source: Profile["costEstimateSource"]): string {
  if (source === "user_approx") {
    return "Costes: estimación basada en importes aproximados que introdujiste en el onboarding. Puedes afinar cada partida en el tab Costes.";
  }
  return "Costes: estimación basada en valores base FlyPath de formación, extras y costes de vida (ajustables en el tab Costes).";
}

const globalButtonFeedbackStyles = `
  @layer base {
    button {
      position: relative;
      cursor: pointer !important;
      overflow: hidden;
      user-select: none;
      transform-origin: center;
      transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease, background-color 120ms ease, border-color 120ms ease, color 120ms ease, opacity 120ms ease !important;
      -webkit-tap-highlight-color: transparent;
    }

    button::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgba(201, 164, 84, 0.28);
      opacity: 0;
      pointer-events: none;
      transition: opacity 120ms ease;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.015) !important;
      filter: brightness(1.09) saturate(1.08) !important;
      box-shadow: 0 14px 28px rgba(15, 26, 51, 0.18) !important;
    }

    button:hover:not(:disabled)::after {
      opacity: 0.16;
    }

    button:active:not(:disabled) {
      transform: translateY(4px) scale(0.90) !important;
      filter: brightness(0.78) saturate(1.12) !important;
      box-shadow: inset 0 6px 16px rgba(15, 26, 51, 0.45), 0 1px 2px rgba(15, 26, 51, 0.10) !important;
    }

    button:active:not(:disabled)::after {
      opacity: 0.42;
      background: rgba(15, 26, 51, 0.18);
    }

    button:focus-visible {
      outline: 3px solid rgba(201, 164, 84, 0.75) !important;
      outline-offset: 3px;
    }

    button:disabled {
      cursor: not-allowed !important;
      opacity: 0.55;
    }

    /* Career Planner stepper: sin overlay rectangular ni lift global de button */
    button.planner-step-button {
      position: static !important;
      overflow: visible !important;
      transform: none !important;
      box-shadow: none !important;
      filter: none !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
    }

    button.planner-step-button::after {
      display: none !important;
      content: none !important;
    }

    button.planner-step-button:hover:not(:disabled),
    button.planner-step-button:active:not(:disabled),
    button.planner-step-button:focus-visible {
      transform: none !important;
      box-shadow: none !important;
      filter: none !important;
      background: transparent !important;
      outline: none !important;
      outline-offset: 0 !important;
    }

    button.planner-step-button:focus-visible .planner-step-circle {
      outline: 2px solid rgba(201, 164, 84, 0.55);
      outline-offset: 2px;
    }
  }

  .action-success-pulse {
    animation: actionSuccessPulse 700ms ease-out;
  }

  @keyframes actionSuccessPulse {
    0% { transform: scale(1); }
    30% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }

  .landing-primary-button {
    background: #c9a454 !important;
    color: #0f1a33 !important;
    border: 1px solid rgba(201, 164, 84, 0.85) !important;
  }

  .landing-primary-button:hover:not(:disabled) {
    background: #f0c96b !important;
    color: #071226 !important;
    transform: translateY(-4px) scale(1.08) !important;
    box-shadow: 0 18px 38px rgba(201, 164, 84, 0.32), 0 10px 22px rgba(0, 0, 0, 0.22) !important;
    border-color: #f7d98a !important;
  }

  .landing-primary-button:active:not(:disabled) {
    background: #b98f35 !important;
    transform: translateY(4px) scale(0.88) !important;
    box-shadow: inset 0 5px 14px rgba(0, 0, 0, 0.32) !important;
  }

  .landing-primary-button:hover .landing-button-arrow {
    transform: translateX(7px) !important;
  }

  .landing-secondary-button {
    background: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
  }

  .landing-secondary-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.96) !important;
    color: #0f1a33 !important;
    border-color: #c9a454 !important;
    transform: translateY(-4px) scale(1.07) !important;
    box-shadow: 0 16px 32px rgba(255, 255, 255, 0.16), 0 10px 22px rgba(0, 0, 0, 0.20) !important;
  }

  .landing-secondary-button:active:not(:disabled) {
    background: rgba(201, 164, 84, 0.28) !important;
    color: #ffffff !important;
    transform: translateY(4px) scale(0.88) !important;
    box-shadow: inset 0 5px 14px rgba(0, 0, 0, 0.32) !important;
  }

  .landing-button-arrow {
    display: inline-block;
    transition: transform 140ms ease !important;
  }

  .landing-cta-primary {
    background: #c9a454 !important;
    color: #0f1a33 !important;
    border: 1px solid rgba(201, 164, 84, 0.85) !important;
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.10) !important;
    transition: all 160ms ease !important;
  }

  .landing-cta-primary:hover {
    background: #ddb75c !important;
    color: #0f1a33 !important;
    border-color: rgba(201, 164, 84, 0.9) !important;
    transform: translateY(-2px) scale(1.035) !important;
    box-shadow: 0 12px 26px rgba(201, 164, 84, 0.25) !important;
  }

  .landing-cta-primary:hover .landing-arrow {
    transform: translateX(4px) !important;
  }

  .landing-cta-primary:active:not(:disabled) {
    transform: translateY(2px) scale(0.97) !important;
  }

  .landing-cta-secondary {
    background: rgba(255, 255, 255, 0.05) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    transition: all 160ms ease !important;
  }

  .landing-cta-secondary:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #f2ddaa !important;
    border-color: rgba(201, 164, 84, 0.7) !important;
    transform: translateY(-2px) scale(1.03) !important;
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18) !important;
  }

  .landing-cta-secondary:active:not(:disabled) {
    transform: translateY(2px) scale(0.97) !important;
  }

  /* Sección azul “Todo lo que normalmente…”: colores fijos tras refresh (wrapper landing usa text-[#0f1a33]). */
  .landing-analyze-section {
    color: #ffffff !important;
  }

  .landing-analyze-section .landing-analyze-eyebrow {
    color: rgba(232, 213, 163, 0.95) !important;
  }

  .landing-analyze-section .landing-analyze-card {
    background: rgba(255, 255, 255, 0.075) !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
    color: #ffffff !important;
  }

  .landing-analyze-section .landing-analyze-title {
    color: #ffffff !important;
  }

  .landing-analyze-section .landing-analyze-text {
    color: rgba(255, 255, 255, 0.75) !important;
  }

  .landing-analyze-section .landing-analyze-icon {
    background: #071226 !important;
    color: #f2ddaa !important;
    border: 1px solid rgba(201, 164, 84, 0.30) !important;
  }

  .landing-analyze-section .landing-analyze-icon svg {
    color: #f2ddaa !important;
    stroke: #f2ddaa !important;
    fill: none !important;
  }

  .landing-analyze-section .landing-analyze-heading {
    color: #ffffff !important;
  }

  .landing-analyze-section .landing-analyze-description {
    color: rgba(255, 255, 255, 0.72) !important;
  }

  .landing-analyze-section .landing-analyze-chip {
    background: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(201, 164, 84, 0.35) !important;
    color: #f2ddaa !important;
  }

  .landing-analyze-section h2.landing-analyze-heading {
    color: #ffffff !important;
  }

  .landing-analyze-section h3.landing-analyze-title {
    color: #ffffff !important;
  }

  .landing-analyze-section p.landing-analyze-text {
    color: rgba(255, 255, 255, 0.75) !important;
  }

  .landing-analyze-section p.landing-analyze-description {
    color: rgba(255, 255, 255, 0.72) !important;
  }

  /* Franja de 3 bloques (separada de .landing-analyze-section): capa propia, sin heredar estilos de análisis. */
  .landing-hero-strip {
    isolation: isolate;
    position: relative;
  }
`;

const defaultProfile: Profile = {
  nombre: "",
  edad: 24,
  pais: "España",
  situacionLaboral: "trabajando",
  objetivo: "aerolinea",
  class1: "no",
  class2: "si",
  ingles: "medio",
  icaoLevel: "no_lo_se",
  preocupacionIngles: "si",
  dineroDisponible: 25000,
  ahorroMensual: 800,
  financiacion: "no",
  apoyoFamiliar: "no",
  inversionMaxima: 70000,
  toleranciaRiesgo: "media",
  disponibilidad: "part-time",
  horasSemana: 20,
  necesitaTrabajar: "si",
  movilidad: "europa",
  urgencia: "media",
  costEstimateSource: "flypath_base",
};

const defaultCostInputs: CostInputs = {
  ppl: 12000,
  nightRating: 3000,
  atplTheory: 3500,
  hourBuilding: 18000,
  cpl: 9000,
  mep: 4500,
  ir: 16000,
  mccJoc: 7000,
  advancedUprt: 2500,
  class1Medical: 250,
  tasasExamenes: 1200,
  skillTests: 1600,
  equipo: 1800,
  headset: 350,
  ipadAppsCartas: 950,
  uniformeMaterial: 700,
  repeticiones: 4000,
  typeRatingOpcional: 0,
  alojamiento: 9000,
  transporte: 2200,
  comida: 3600,
  otrosGastosVida: 2200,
  bufferPct: 15,
};

function sumFormationParts(c: CostInputs) {
  return (
    c.ppl +
    (c.nightRating ?? 3000) +
    c.atplTheory +
    c.hourBuilding +
    c.cpl +
    c.mep +
    c.ir +
    c.mccJoc +
    c.advancedUprt
  );
}

function sumExtrasParts(c: CostInputs) {
  return (
    c.class1Medical +
    c.tasasExamenes +
    c.skillTests +
    c.headset +
    c.ipadAppsCartas +
    c.uniformeMaterial +
    c.repeticiones +
    c.typeRatingOpcional
  );
}

function sumVidaParts(c: CostInputs) {
  return c.alojamiento + c.transporte + c.comida + c.otrosGastosVida;
}

/** Reparte un total en euros según pesos relativos (p. ej. ratios FlyPath base). */
function distributeProportional(total: number, weights: number[]): number[] {
  const safe = Math.max(0, Math.round(total));
  const n = weights.length;
  if (n === 0) return [];
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW <= 0) {
    return Array.from({ length: n }, (_, i) => (i === 0 ? safe : 0));
  }
  const floored = weights.map((w) => Math.floor((safe * w) / sumW));
  let drift = safe - floored.reduce((a, b) => a + b, 0);
  const order = weights
    .map((w, i) => ({ w, i }))
    .sort((a, b) => b.w - a.w)
    .map((x) => x.i);
  let k = 0;
  const maxGuard = 200000;
  while (drift > 0 && k < maxGuard) {
    floored[order[k % order.length]] += 1;
    drift -= 1;
    k += 1;
  }
  return floored;
}

function mapOnboardingApproxToCostInputs(approx: {
  precioFormacion: number;
  extrasEstimados: number;
  vidaLogistica: number;
  bufferPct: number;
}): CostInputs {
  const d = defaultCostInputs;
  const formW = [d.ppl, d.nightRating ?? 3000, d.atplTheory, d.hourBuilding, d.cpl, d.mep, d.ir, d.mccJoc, d.advancedUprt];
  const extraW = [d.class1Medical, d.tasasExamenes, d.skillTests, d.headset, d.ipadAppsCartas, d.uniformeMaterial, d.repeticiones, d.typeRatingOpcional];
  const vidaW = [d.alojamiento, d.transporte, d.comida, d.otrosGastosVida];

  const f = distributeProportional(approx.precioFormacion, formW);
  const e = distributeProportional(approx.extrasEstimados, extraW);
  const v = distributeProportional(approx.vidaLogistica, vidaW);

  return {
    ...d,
    ppl: f[0],
    nightRating: f[1],
    atplTheory: f[2],
    hourBuilding: f[3],
    cpl: f[4],
    mep: f[5],
    ir: f[6],
    mccJoc: f[7],
    advancedUprt: f[8],
    class1Medical: e[0],
    tasasExamenes: e[1],
    skillTests: e[2],
    headset: e[3],
    ipadAppsCartas: e[4],
    uniformeMaterial: e[5],
    repeticiones: e[6],
    typeRatingOpcional: e[7],
    alojamiento: v[0],
    transporte: v[1],
    comida: v[2],
    otrosGastosVida: v[3],
    bufferPct: clamp(Math.round(approx.bufferPct), 0, 100),
  };
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function euro(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

/** Solo presentación: número grande + símbolo € separado en hero financiero. */
function formatEuroHeroAmount(value: number) {
  return {
    amount: new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value || 0),
    symbol: "€",
  };
}

/** Lectura humana para tiempo al ritmo actual; solo si > 36 meses. No altera cálculos. */
function humanYearsFromBrechaMonths(meses: number): string | null {
  if (meses <= 36) return null;
  const wholeYears = Math.floor(meses / 12);
  if (wholeYears < 1) return null;
  const remainder = meses % 12;
  if (remainder === 0) return `${wholeYears} ${wholeYears === 1 ? "año" : "años"}`;
  if (remainder >= 6 || wholeYears >= 9) return `más de ${wholeYears} ${wholeYears === 1 ? "año" : "años"}`;
  return null;
}

function objetivoLabel(value: Profile["objetivo"]) {
  if (value === "aerolinea") return "aerolínea";
  if (value === "ejecutivo") return "ejecutivo";
  if (value === "instructor") return "instructor";
  return "no lo sé";
}

function recomendacionLabel(value: string) {
  if (value === "no decidir aún") return "No decidir aún";
  if (value === "requiere confirmación") return "Requiere confirmación";
  return value;
}

// Etiqueta humana y corta del enum interno `estadoVerificacion`. Solo afecta a texto
// visible (mini-card "Estado de verificación" en Planner > Escuelas). Los valores
// internos del enum se conservan tal cual; nada de cálculos ni scoring lee esta función.
function estadoVerificacionLabel(value: School["estadoVerificacion"]): string {
  if (value === "verificado") return "Verificado";
  if (value === "parcialmente_verificado") return "Parcial";
  if (value === "no_verificado") return "No verificado";
  return "Pendiente";
}

function buildSchoolEmail(school: School, nombreUsuario: string) {
  const who = nombreUsuario.trim() || "un aspirante a piloto";
  const signOff = nombreUsuario.trim();

  const extras: string[] = [];
  if (school.alojamientoIncluido !== "si") {
    extras.push("- Si ofrecen alojamiento o orientación sobre coste aproximado en la zona.");
  }
  if (school.promesasEmpleo === "vagas") {
    extras.push("- Aclaración por escrito del alcance del apoyo laboral (sin interpretarlo como garantía de empleo).");
  }
  if (school.estadoVerificacion !== "verificado") {
    extras.push("- Confirmación de precio y condiciones con su vigencia o referencia de actualización.");
  }

  const extrasBlock =
    extras.length > 0 ? `\n\nAdemás, si pueden concretar:\n${extras.join("\n")}` : "";

  return `Asunto: Solicitud de confirmación documental y económica - ${school.nombre}

Hola equipo de ${school.nombre},

Soy ${who} y estoy valorando opciones de formación. Antes de tomar una decisión económica, me gustaría confirmar por escrito algunos puntos importantes del programa.

Información económica y contractual:
- Precio total actualizado del programa.
- Qué está incluido y qué no está incluido en el precio.
- Calendario de pagos: depósito, hitos y fechas.
- Política de reembolso.
- Contrato o condiciones completas antes de pagar matrícula o depósito.

Elementos del programa:
- Si MCC/JOC está incluido y, si no, coste aproximado.
- Si Advanced UPRT está incluido y, si no, coste aproximado.
- Si tasas de examen y skill tests están incluidos.
- Duración media real del programa.

Información operativa:
- Flota disponible y disponibilidad real de aeronaves.
- Cómo se gestionan mantenimiento y posibles retrasos.
- Ratio aproximado alumno/avión e instructor/alumno.
- Si es posible hablar con alumnos actuales o antiguos.${extrasBlock}

Si disponen de folleto actualizado, contrato tipo o documento de condiciones, agradecería que lo adjuntaran en la respuesta.

Muchas gracias por su ayuda.

Un saludo,${signOff ? `\n${signOff}` : ""}`;
}

async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  try {
    if (typeof document === "undefined") return false;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/** Copy visible en la card principal — solo UI; no altera pickFlyPathNextSteps. */
function flyPathPrimaryReasonDisplayCopy(input: {
  primary: FlyPathPrimaryId;
  profile: Pick<Profile, "class1" | "objetivo" | "ingles" | "preocupacionIngles" | "financiacion">;
  route: Pick<RouteRecommendation, "recommended">;
  decisionReadiness: Pick<ReadinessResult, "decision" | "faltanDatos">;
  schoolsCount: number;
  verifiedSchoolsCount: number;
  costs: { riesgoFinanciero: string; coverage: number };
  riskDiagnosis: Pick<RiskItem, "label" | "nivel">[];
}): string {
  const {
    primary,
    profile,
    route,
    decisionReadiness,
    schoolsCount,
    verifiedSchoolsCount,
    costs,
    riskDiagnosis,
  } = input;

  if (primary === "ingles") {
    return "El inglés puede convertirse en el principal cuello de botella de tu formación si no se trabaja a tiempo.";
  }

  if (profile.class1 !== "si") {
    return "Antes de comprometer dinero con una ruta, confirmaríamos que no existe ningún bloqueo médico relevante.";
  }

  const financialPressure =
    riskNivelIsHigh(costs.riesgoFinanciero) ||
    (profile.financiacion !== "confirmada" && costs.coverage < 70);
  const documentOrCommercialRisk = hasHighDocumentOrCommercialRisk(riskDiagnosis);
  const schoolsInsufficient = schoolsCount < 2;
  const schoolsUnverified = schoolsCount > 0 && verifiedSchoolsCount === 0;
  const notReadyToPay =
    decisionReadiness.decision === "No estás listo para pagar" ||
    decisionReadiness.decision === "Puedes seguir investigando, pero no pagar";

  if (primary === "mentoria") {
    if (financialPressure) {
      return riskNivelIsHigh(costs.riesgoFinanciero)
        ? "Tu siguiente decisión puede ahorrarte miles de euros en costes de formación."
        : "Antes de comprometer dinero con una escuela, validaríamos el impacto económico real de tu ruta.";
    }
    if (documentOrCommercialRisk) {
      return "Todavía hay documentación y condiciones que conviene validar antes de pagar una matrícula o depósito.";
    }
    return "La siguiente decisión importante no es estudiar más. Es asegurarte de que estás apostando por la escuela adecuada.";
  }

  if (documentOrCommercialRisk && schoolsCount > 0) {
    return "Todavía hay documentación y condiciones que conviene validar antes de pagar una matrícula o depósito.";
  }

  if (financialPressure && route.recommended !== "Preparación") {
    return "Antes de comprometer dinero con una escuela, validaríamos el impacto económico real de tu ruta.";
  }

  return "Ahora mismo el foco está en ejecutar el plan con criterio y evitar errores caros en las siguientes decisiones.";
}

/** Miniatura real del PDF premium: pág. 6 (Hoja de ruta) en informes gratuitos; portada si premium. */
function FlyPathReportDownloadPreview({
  premium,
  variant = "default",
}: {
  premium: boolean;
  variant?: "default" | "compact" | "premium-card" | "section-feature";
}) {
  const src = premium ? "/premium-report-real-preview.png" : "/premium-report-action-preview.png";

  const wrapperClass =
    variant === "section-feature"
      ? "w-[180px] shrink-0 mx-auto sm:w-[220px] lg:mx-0 lg:w-[260px] xl:w-[300px] 2xl:w-[340px]"
      : variant === "premium-card"
        ? "w-[112px] shrink-0 mx-auto md:mx-0 md:w-[170px] lg:w-[200px] xl:w-[220px]"
        : variant === "compact"
          ? "w-[88px] shrink-0 sm:w-[110px] md:w-[130px] lg:w-[150px]"
          : "mx-auto w-[200px] max-w-[72vw] shrink-0 sm:w-[240px] lg:mx-0 lg:w-[300px] lg:max-w-none lg:pt-1";

  const imgClass =
    variant === "default"
      ? "w-full rounded-md border border-slate-200/80 shadow-[0_16px_40px_rgba(15,26,51,0.16)]"
      : variant === "section-feature"
        ? "w-full rounded-md border border-white/20 shadow-[0_18px_48px_rgba(0,0,0,0.55)] ring-1 ring-[#D6AE4F]/30"
        : "w-full rounded border border-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ring-[#D6AE4F]/25";

  return (
    <div className={wrapperClass} aria-hidden>
      <Image src={src} alt="" width={1683} height={1190} className={imgClass} />
    </div>
  );
}

function DocumentationStatusBadge({ premium }: { premium: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
        premium
          ? "border-emerald-400/50 bg-emerald-50 text-emerald-800"
          : "border-[#c9a454]/50 bg-[#0f1a33] text-[#f2ddaa]"
      }`}
    >
      {!premium ? <Lock className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} /> : null}
      {premium ? "Listo" : "Premium"}
    </span>
  );
}

function FlyPathProductVisual({
  productId,
  variant = "thumb",
}: {
  productId: FlyPathProductId;
  variant?: "hero" | "thumb";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = FLYPATH_PRIMARY_IMAGE[productId];
  const PlaceholderIcon =
    productId === "guia"
      ? BookOpen
      : productId === "mentoria"
        ? MessagesSquare
        : productId === "ingles"
          ? Languages
          : productId === "escuelas"
            ? ClipboardList
            : LayoutList;

  const isHero = variant === "hero";

  if (!isHero) {
    if (imgFailed) {
      return (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-[#f8f0dc]/50"
          aria-hidden
        >
          <PlaceholderIcon className="h-8 w-8 text-[#0f1a33]/25" strokeWidth={1.2} />
        </div>
      );
    }
    return (
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
      />
    );
  }

  const heroFrameClass =
    "overflow-hidden rounded-2xl border border-[#c9a454]/35 bg-[#fffdf8] p-1 shadow-[0_10px_28px_rgba(15,26,51,0.08)] ring-1 ring-[#c9a454]/15";
  const heroImgClass =
    "aspect-[3/4] w-full max-w-[200px] rounded-[14px] object-cover sm:max-w-[220px] lg:max-w-[240px]";

  if (imgFailed) {
    return (
      <div
        className={`flex ${heroFrameClass} mx-auto aspect-[3/4] w-full max-w-[200px] flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-[#f8f0dc]/40 sm:max-w-[220px] lg:max-w-[240px]`}
        aria-hidden
      >
        <PlaceholderIcon className="h-12 w-12 text-[#0f1a33]/25 sm:h-14 sm:w-14" strokeWidth={1.2} />
      </div>
    );
  }

  return (
    <div className={heroFrameClass}>
      <img src={src} alt="" className={heroImgClass} loading="lazy" decoding="async" onError={() => setImgFailed(true)} />
    </div>
  );
}

function FlyPathNextStepsPanel({
  recommendation,
  profile,
  route,
  decisionReadiness,
  schools,
  costInputs,
  costs,
  riskDiagnosis,
  verifiedSchoolsCount,
}: {
  recommendation: FlyPathNextStepRecommendation;
  profile: Pick<Profile, "class1" | "objetivo" | "ingles" | "preocupacionIngles" | "financiacion">;
  route: Pick<RouteRecommendation, "recommended">;
  decisionReadiness: Pick<ReadinessResult, "decision" | "faltanDatos">;
  schools: { length: number };
  costInputs: Pick<CostInputs, "atplTheory">;
  costs: { riesgoFinanciero: string; coverage: number };
  riskDiagnosis: Pick<RiskItem, "label" | "nivel">[];
  verifiedSchoolsCount: number;
}) {
  const router = useRouter();

  const navigateToProduct = (id: FlyPathProductId) => {
    if (id === "escuelas") return;
    router.push(FLYPATH_PRODUCT_HREF[id]);
  };

  const DEBUG_FLYPATH_NEXT_STEPS = process.env.NODE_ENV === "development";

  const { primary, secondaryIds, reasons: primaryReasons } = recommendation;

  if (DEBUG_FLYPATH_NEXT_STEPS) {
    console.log("[FlyPath siguiente paso]", {
      primary,
      secondaryIds,
      motivos: primaryReasons,
      class1: profile.class1,
      objetivo: profile.objetivo,
      ingles: profile.ingles,
      routeRecommended: route.recommended,
      schoolsCount: schools.length,
      verifiedSchoolsCount,
      readiness: decisionReadiness.decision,
      faltanDatos: decisionReadiness.faltanDatos.length,
      riesgoFinanciero: costs.riesgoFinanciero,
      atplTheory: costInputs.atplTheory,
    });
  }

  const primaryProduct = FLYPATH_PRODUCTS[primary];
  const primaryReasonCopy = flyPathPrimaryReasonDisplayCopy({
    primary,
    profile,
    route,
    decisionReadiness,
    schoolsCount: schools.length,
    verifiedSchoolsCount,
    costs,
    riskDiagnosis,
  });

  const primaryCtaClass =
    "inline-flex min-h-[48px] w-full min-w-0 cursor-pointer items-center justify-center self-start rounded-xl bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.3)] transition hover:bg-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto";

  const secondaryCtaClass =
    "inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-xl border border-[#0f1a33]/15 bg-white px-4 py-2 text-[14px] font-semibold text-[#0f1a33] transition hover:border-[#c9a454]/45 hover:bg-[#fffaf0] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30 sm:w-auto";

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#faf8f5] via-white to-[#f6f4ef] p-6 shadow-[0_10px_36px_rgba(15,26,51,0.07)] sm:p-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7b3c]">
          Recomendación FlyPath
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
          Qué haríamos en tu situación
        </h2>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-[#c9a454]/35 bg-gradient-to-br from-[#fffdf8] via-white to-[#faf6ee] p-6 shadow-[0_8px_32px_rgba(15,26,51,0.06)] sm:p-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-10">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-[#c9a454]/45 bg-[#c9a454]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
              Recomendación principal para tu caso
            </span>
            <p className="mt-4 text-xl font-bold leading-snug text-[#0f1a33] sm:text-2xl">{primaryProduct.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-base">{primaryProduct.body}</p>
            {primaryReasons[0] ? (
              <div className="mt-4 rounded-xl border border-[#c9a454]/20 bg-[#fffaf0] px-4 py-3 text-[14px] leading-snug text-slate-700">
                <p className="font-semibold text-[#7a5a16]">Por qué te lo recomendamos</p>
                <p className="mt-1">{primaryReasonCopy}</p>
              </div>
            ) : null}
            <button type="button" onClick={() => navigateToProduct(primary)} className={`${primaryCtaClass} mt-6`}>
              {primaryProduct.cta}
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
            </button>
          </div>
          <div className="flex justify-center lg:justify-end">
            <FlyPathProductVisual productId={primary} variant="hero" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          También puede ayudarte
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {secondaryIds.map((id) => {
            const p = FLYPATH_PRODUCTS[id];
            return (
              <div
                key={id}
                className="flex h-full min-h-[148px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_16px_rgba(15,26,51,0.04)]"
              >
                <div className="relative w-[30%] shrink-0 self-stretch overflow-hidden rounded-l-2xl">
                  <FlyPathProductVisual productId={id} variant="thumb" />
                </div>
                <div className="flex min-w-0 flex-1 basis-[70%] flex-col p-4 sm:p-5">
                  <p className="text-[15px] font-semibold leading-snug text-[#0f1a33]">{p.title}</p>
                  <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-slate-600">{p.body}</p>
                  <button type="button" onClick={() => navigateToProduct(id)} className={`${secondaryCtaClass} mt-4`}>
                    {p.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type FlyPathAppProps = {
  reviewMode?: boolean;
  /** Acepta tabs legacy `route` / `cost` (mapean a diagnóstico). */
  initialTab?: Tab | "route" | "cost";
};

const PLANNER_PREMIUM_CHECKOUT_CTA = `Desbloquear informe premium · ${PREMIUM_REPORT_PRICE_LABEL}`;

export function FlyPathApp({
  reviewMode = false,
  initialTab: initialTabProp = "diagnosis",
}: FlyPathAppProps) {
  const initialTab = normalizeDashboardTab(initialTabProp);
  const router = useRouter();
  const createEmptySchool = (): School => ({
    id: 0,
    nombre: "",
    pais: "",
    ciudad: "",
    programa: "no_lo_se",
    precioAnunciado: 0,
    duracionMeses: 18,
    depositoRequerido: 0,
    calendarioPagosClaro: "no_se",
    mccIncluido: "no_se",
    uprtIncluido: "no_se",
    tasasIncluidas: "no_se",
    skillTestsIncluidos: "no_se",
    alojamientoIncluido: "no_se",
    reembolsoClaro: "no_se",
    contratoAntesPagar: "no_se",
    flotaExplicada: "no_se",
    mantenimientoExplicado: "no_se",
    ratioAlumnoAvionConocido: "no_se",
    permiteHablarAlumnos: "no_se",
    careerSupport: "no_se",
    promesasEmpleo: "no_se",
    fuentePrecio: "no_verificado",
    fechaActualizacion: "",
    estadoVerificacion: "pendiente",
    enlaceReferencia: "",
    notas: "",
  });

  const [screen, setScreen] = useState<Screen>(reviewMode ? "dashboard" : "onboarding");
  const [plannerStep, setPlannerStep] = useState<PlannerStepId>(
    reviewMode ? normalizePlannerStep(initialTab) : "profile",
  );
  const [tab, setTab] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [costInputs, setCostInputs] = useState<CostInputs>(defaultCostInputs);
  // Bandera de hidratación: bloquea las escrituras a localStorage hasta haber leído
  // los valores ya guardados. Sin esto, los useEffect de persistencia disparan en el
  // primer render con los valores INICIALES por defecto (onboardingCompleted=false,
  // schools=[], etc.) y pisan los datos reales antes de que la hidratación los recupere.
  // En reviewMode no hay persistencia ni hidratación, así que arranca como `true`.
  const [storageHydrated, setStorageHydrated] = useState<boolean>(reviewMode);
  const [onboardingApproxDraft, setOnboardingApproxDraft] = useState({
    precioFormacion: sumFormationParts(defaultCostInputs),
    extrasEstimados: sumExtrasParts(defaultCostInputs),
    vidaLogistica: sumVidaParts(defaultCostInputs),
    bufferPct: defaultCostInputs.bufferPct,
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [dashboardReviewResult, setDashboardReviewResult] = useState<{ key: string; items: PublicSchoolReviewSummary[] }>({
    key: "",
    items: [],
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [emailDrafts, setEmailDrafts] = useState<Record<number, string>>({});
  const [emailPendingBySchool, setEmailPendingBySchool] = useState<Record<number, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [premiumPdfExporting, setPremiumPdfExporting] = useState(false);
  const [freePdfExporting, setFreePdfExporting] = useState(false);
  const [parentsPdfExporting, setParentsPdfExporting] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [reportEmailDownloadHint, setReportEmailDownloadHint] = useState(false);
  const [reportLeadCaptureError, setReportLeadCaptureError] = useState<string | null>(null);
  const [reportMarketingConsent, setReportMarketingConsent] = useState(false);
  const [reportMarketingConsentHint, setReportMarketingConsentHint] = useState(false);
  const [reportConversionId, setReportConversionId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatedEmailKey, setGeneratedEmailKey] = useState<number | null>(null);
  const [newSchool, setNewSchool] = useState<School>(createEmptySchool());
  const [schoolEditActiveId, setSchoolEditActiveId] = useState<number | null>(null);
  const schoolFormPanelRef = useRef<HTMLDivElement>(null);
  // Apertura inicial del acordeón "Añadir escuela manualmente": abierto si el usuario es nuevo
  // (sin escuelas en localStorage ni en deep-link). Tras la decisión inicial el usuario controla
  // libremente con su toggle; no se reabre automáticamente al cambiar schools.length.
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const manualFormInitializedRef = useRef(false);
  const [cameFromSchoolsComparator, setCameFromSchoolsComparator] = useState(false);
  // Estado solo visual del dashboard compacto (no afecta a cálculos ni persistencia).
  const [costAdjustOpen, setCostAdjustOpen] = useState(false);
  const [schoolsDbPickerOpen, setSchoolsDbPickerOpen] = useState(false);

  const { qaPremiumMode, toggleQaPremium } = useQaPremiumMode();
  // Misma clave localStorage que el comparador (`flypath_qa_premium_mode`).
  // Futuros bloques premium del Informe final: reutilizar `plannerPremiumContentVisible`.
  const premiumUnlockedPlanner = false;
  const plannerPremiumContentVisible = canSeePremiumForDevQa(
    premiumUnlockedPlanner,
    qaPremiumMode,
  );

  useEffect(() => {
    initializeTrackingContext();
    trackPageViewed("career_planner");
  }, []);

  // Decide la apertura inicial del acordeón manual una sola vez, leyendo síncronamente
  // localStorage y los slugs del deep-link. Posteriores cambios de schools.length no afectan.
  useEffect(() => {
    if (manualFormInitializedRef.current) return;
    if (reviewMode) return;
    if (typeof window === "undefined") return;
    manualFormInitializedRef.current = true;
    let count = 0;
    try {
      const raw = window.localStorage.getItem("flypath_schools");
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) count = parsed.length;
      }
      const params = new URLSearchParams(window.location.search);
      const schoolsParam = params.get("schools");
      if (schoolsParam) {
        const slugs = schoolsParam
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        count = Math.max(count, slugs.length);
      }
    } catch {
      count = 0;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) setManualFormOpen(false);
    });
    return () => {
      active = false;
    };
  }, [reviewMode]);

  useEffect(() => {
    let active = true;
    if (reviewMode) {
      queueMicrotask(() => {
        if (active) setStorageHydrated(true);
      });
      return () => {
        active = false;
      };
    }
    queueMicrotask(() => {
      if (!active) return;
      try {
        const p = localStorage.getItem("flypath_profile");
        const c = localStorage.getItem("flypath_cost_inputs");
        const s = localStorage.getItem("flypath_schools");
        const o = localStorage.getItem("flypath_onboarding_completed");
        const reportEmailStored = localStorage.getItem(REPORT_EMAIL_STORAGE_KEY);
        if (reportEmailStored) setReportEmail(reportEmailStored);
        if (p) {
          const parsed = JSON.parse(p) as Partial<Profile>;
          setProfile({
            ...defaultProfile,
            ...parsed,
            costEstimateSource: parsed.costEstimateSource === "user_approx" ? "user_approx" : "flypath_base",
          });
        }
        if (c) setCostInputs({ ...defaultCostInputs, ...JSON.parse(c) });
        if (s) {
          const parsedSchools = JSON.parse(s) as unknown;
          if (Array.isArray(parsedSchools)) setSchools(parsedSchools as School[]);
        }
        if (o) {
          // Lectura robusta: aceptamos JSON booleano `true` o el string literal "true".
          const done = JSON.parse(o) === true || o === "true";
          setOnboardingCompleted(done);

          // Si la URL trae un deep-link (?source=schools-comparator o ?review=dashboard) la
          // decisión de pantalla la toma el efecto del deep-link de más abajo. Aquí solo
          // decidimos cuando NO hay deep-link: dashboard si onboarding está hecho, perfil si no.
          const params = new URLSearchParams(window.location.search);
          const isSchoolsComparatorSource = params.get("source") === "schools-comparator";
          const reviewParam = params.get("review");
          if (!isSchoolsComparatorSource && reviewParam !== "dashboard") {
            if (done) {
              setScreen("dashboard");
              setPlannerStep("diagnosis");
              setTab("diagnosis");
            } else {
              setScreen("onboarding");
              setPlannerStep("profile");
            }
          }
        }
        setStorageHydrated(true);
      } catch {
        setStorageHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Public deep-link mode via query params (legacy): disabled in review routes
  useEffect(() => {
    if (reviewMode) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const reviewParam = params.get("review");
    const schoolsParam = params.get("schools");
    const startParam = params.get("start");
    const sourceParam = params.get("source");
    const isSchoolsComparatorSource = sourceParam === "schools-comparator";
    const tabParam = params.get("tab");
    const validTabs: Tab[] = ["diagnosis", "schools", "report"];

    // Onboarding ya completado se lee directamente de localStorage para decidir
    // de forma síncrona si saltamos al dashboard cuando llegamos desde el comparador.
    // Lectura defensiva: aceptamos tanto JSON booleano (`true`) como el string literal
    // ("true") por si en algún momento se guardó sin JSON.stringify; y si JSON.parse
    // explota (valor corrupto), caemos al test de string crudo.
    let onboardingDoneFromStorage = false;
    try {
      const raw = window.localStorage.getItem("flypath_onboarding_completed");
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        onboardingDoneFromStorage = parsed === true || raw === "true";
      }
    } catch {
      onboardingDoneFromStorage =
        window.localStorage.getItem("flypath_onboarding_completed") === "true";
    }

    if (reviewParam === "dashboard") {
      queueMicrotask(() => {
        setOnboardingCompleted(true);
        setScreen("dashboard");
        if (tabParam) {
          const requestedTab = normalizeDashboardTab(tabParam);
          if (validTabs.includes(requestedTab)) {
            setTab(requestedTab);
            setPlannerStep(requestedTab);
          } else {
            setPlannerStep("diagnosis");
            setTab("diagnosis");
          }
        } else {
          setPlannerStep("diagnosis");
          setTab("diagnosis");
        }
      });
    }

    // Slugs pueden venir por query (preferente) o por localStorage de respaldo
    // (flypath_pending_comparator_schools), generado al pulsar "Analizar con mi perfil".
    let slugs: string[] = [];
    if (schoolsParam) {
      slugs = schoolsParam
        .split(",")
        .map((value) => decodeURIComponent(value).trim())
        .filter(Boolean);
    } else if (isSchoolsComparatorSource) {
      try {
        const raw = window.localStorage.getItem("flypath_pending_comparator_schools");
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            slugs = parsed
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.trim())
              .filter(Boolean);
          }
        }
      } catch {
        slugs = [];
      }
    }

    if (slugs.length > 0) {
      queueMicrotask(() => {
        setSchools((current) => {
          // Las escuelas manuales se preservan. Las escuelas importadas desde el
          // comparador ocupan hasta 2 slots de análisis separados y reemplazan
          // importaciones anteriores del comparador.
          const manualSchools = current.filter(
            (school) => !school.enlaceReferencia.startsWith("comparador:"),
          );
          const previousComparatorSlugs = current
            .map((school) => parsePlannerSchoolLink(school.enlaceReferencia)?.slug)
            .filter((slug): slug is string => Boolean(slug));

          // Idempotencia: si los slugs entrantes coinciden exactamente con los que ya
          // estaban importados desde comparador, no hacer nada (evita duplicados al
          // pulsar varias veces o al recargar la URL).
          const incomingSet = new Set(slugs);
          const previousSet = new Set(previousComparatorSlugs);
          const sameAsBefore =
            incomingSet.size > 0 &&
            incomingSet.size === previousSet.size &&
            [...incomingSet].every((slug) => previousSet.has(slug));
          if (sameAsBefore) {
            return current;
          }

          const existingNames = new Set(
            manualSchools.map((school) => school.nombre.trim().toLowerCase()),
          );
          const maxComparatorSlots = 2;

          const schoolsToImport: School[] = [];
          let nextId = current.length > 0 ? Math.max(...current.map((school) => school.id)) + 1 : 1;

          for (const slug of slugs) {
            if (schoolsToImport.length >= maxComparatorSlots) break;
            const comparatorSchool = getSchoolBySlug(slug);
            if (!comparatorSchool) continue;
            const normalizedName = comparatorSchool.name.trim().toLowerCase();
            if (existingNames.has(normalizedName)) continue;
            schoolsToImport.push(mapComparatorSchoolToPlannerSchool(comparatorSchool, nextId));
            existingNames.add(normalizedName);
            nextId += 1;
          }

          if (schoolsToImport.length === 0) {
            return current;
          }

          setToast("Escuelas importadas desde el comparador.");
          window.setTimeout(
            () =>
              setToast((currentToast) =>
                currentToast === "Escuelas importadas desde el comparador." ? null : currentToast,
              ),
            2300,
          );
          return [...manualSchools, ...schoolsToImport];
        });
      });
    }

    if (isSchoolsComparatorSource) {
      queueMicrotask(() => {
        setCameFromSchoolsComparator(true);
        setProfile((current) => ({ ...current, costEstimateSource: "flypath_base" }));
      });
      // Limpieza del respaldo en localStorage tras consumirlo: la siguiente
      // navegación al planner sin query ya no debe re-importar nada.
      try {
        window.localStorage.removeItem("flypath_pending_comparator_schools");
      } catch {
        // no-op: el respaldo es opcional.
      }
    }

    // Decisión de pantalla. Si venimos del comparador y el usuario ya tenía onboarding
    // completado, vamos directo al dashboard, tab "Escuelas". Comprobamos la condición
    // contra el estado React y contra localStorage para que no afecte ninguna desincronización
    // momentánea entre ambos (por ejemplo, en el primer commit tras montar la página). En
    // caso contrario, arrancamos onboarding (sin onboarding o con start=onboarding explícito).
    const onboardingDone = onboardingCompleted || onboardingDoneFromStorage;

    if (process.env.NODE_ENV === "development" && isSchoolsComparatorSource) {
      // Debug temporal para verificar en consola qué lee realmente el deep-link del
      // comparador. Si "rawOnboardingCompleted" es "true" o true, el usuario debe ir al
      // dashboard, no al onboarding. Útil mientras estabilizamos el flujo.
      // eslint-disable-next-line no-console
      console.log("[FlyPath comparator deep-link]", {
        onboardingCompletedState: onboardingCompleted,
        onboardingDoneFromStorage,
        rawOnboardingCompleted: window.localStorage.getItem("flypath_onboarding_completed"),
        schoolsParam,
      });
    }

    if (isSchoolsComparatorSource && onboardingDone) {
      queueMicrotask(() => {
        setOnboardingCompleted(true);
        setScreen("dashboard");
        setTab("schools");
        setPlannerStep("schools");
      });
    } else if (startParam === "onboarding" || (isSchoolsComparatorSource && !onboardingDone)) {
      queueMicrotask(() => {
        setScreen("onboarding");
        setPlannerStep("profile");
        setOnboardingStep(1);
      });
    }
  }, [reviewMode, onboardingCompleted]);

  useEffect(() => {
    if (screen !== "onboarding" || onboardingStep !== 3) return;
    if (profile.costEstimateSource !== "user_approx") return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setOnboardingApproxDraft({
        precioFormacion: sumFormationParts(costInputs),
        extrasEstimados: sumExtrasParts(costInputs),
        vidaLogistica: sumVidaParts(costInputs),
        bufferPct: costInputs.bufferPct,
      });
    });
    return () => {
      active = false;
    };
  }, [screen, onboardingStep, profile.costEstimateSource]);

  useEffect(() => {
    if (!reviewMode) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setScreen("dashboard");
      setTab(initialTab);
      setPlannerStep(normalizePlannerStep(initialTab));
    });
    return () => {
      active = false;
    };
  }, [reviewMode, initialTab]);

  // Las cuatro escrituras a localStorage están bloqueadas hasta que el efecto de
  // hidratación haya leído los datos guardados (storageHydrated === true). Esto
  // evita que el primer commit con valores INICIALES por defecto pise los datos
  // reales del usuario antes de la lectura.
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    try {
      localStorage.setItem("flypath_profile", JSON.stringify(profile));
    } catch {
      // no-op: localStorage puede fallar en modo privado o por cuota.
    }
  }, [profile, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    try {
      localStorage.setItem("flypath_cost_inputs", JSON.stringify(costInputs));
    } catch {
      // no-op: localStorage puede fallar en modo privado o por cuota.
    }
  }, [costInputs, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    try {
      localStorage.setItem("flypath_schools", JSON.stringify(schools));
    } catch {
      // no-op: localStorage puede fallar en modo privado o por cuota.
    }
  }, [schools, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    try {
      localStorage.setItem("flypath_onboarding_completed", JSON.stringify(onboardingCompleted));
    } catch {
      // no-op: localStorage puede fallar en modo privado o por cuota.
    }
  }, [onboardingCompleted, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    const trimmed = reportEmail.trim();
    try {
      if (trimmed) {
        localStorage.setItem(REPORT_EMAIL_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(REPORT_EMAIL_STORAGE_KEY);
      }
    } catch {
      // no-op: localStorage puede fallar en modo privado o por cuota.
    }
  }, [reportEmail, reviewMode, storageHydrated]);

  useEffect(() => {
    if (reviewMode || screen !== "onboarding") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [screen, reviewMode]);

  const route = useMemo(() => computeRoute(profile), [profile]);
  const costs = useMemo(() => computeCosts(costInputs, profile), [costInputs, profile]);

  const schoolStats = useMemo(
    () => computeSchoolStats(schools, costs.totalRealista),
    [schools, costs.totalRealista],
  );
  const dashboardReviewRequestKey = useMemo(() => {
    const slugs = schools.flatMap((school) => {
      const link = parsePlannerSchoolLink(school.enlaceReferencia);
      return link ? [link.slug] : [];
    });
    return [...new Set(slugs)].join(",");
  }, [schools]);
  const dashboardReviewsLoading = dashboardReviewRequestKey.length > 0 && dashboardReviewResult.key !== dashboardReviewRequestKey;
  const dashboardReviewSummariesBySlug = useMemo(
    () => new Map(dashboardReviewResult.items.map((summary) => [summary.schoolSlug, summary])),
    [dashboardReviewResult.items],
  );

  useEffect(() => {
    if (!dashboardReviewRequestKey) return;

    const path = buildSchoolReviewSummariesPath(dashboardReviewRequestKey.split(","));
    if (!path) return;

    const controller = new AbortController();
    void fetch(path, { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() as Promise<SchoolReviewSummaryResponse> : { items: [] }))
      .then((body) => {
        if (!controller.signal.aborted) {
          setDashboardReviewResult({ key: dashboardReviewRequestKey, items: Array.isArray(body.items) ? body.items : [] });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setDashboardReviewResult({ key: dashboardReviewRequestKey, items: [] });
      });
    return () => controller.abort();
  }, [dashboardReviewRequestKey]);

  const flypathSchoolRecommendation = useMemo(
    () => computeFlypathSchoolRecommendation(schoolStats.analyzed),
    [schoolStats.analyzed],
  );

  const decisionReadiness = useMemo(
    () =>
      computeDecisionReadiness({
        profile,
        costs,
        route,
        schoolsAnalyzed: schoolStats.analyzed,
        bufferPct: costInputs.bufferPct,
      }),
    [profile, costs, route, schoolStats.analyzed, costInputs.bufferPct]
  );
  // Bloqueos críticos coherentes con la lectura visible "Bloqueo principal" del informe.
  //
  // `route.principalBlock` y `decisionReadiness.bloqueosCriticos` se calculan con criterios
  // distintos: `route.principalBlock` solo marca como bloqueo crítico Class 1, inglés bajo
  // o brecha financiera crítica (con dineroDisponible < 30k); `decisionReadiness` aplica
  // reglas más amplias y puede contener entradas tipo "Brecha financiera alta..." aunque
  // en la card "Bloqueo principal" se haya escrito "Ningún bloqueo crítico".
  //
  // Para que la "Conclusión ejecutiva" no contradiga lo que el usuario acaba de leer,
  // tomamos `route.principalBlock` como señal autoritativa: si visiblemente se afirma
  // "Ningún bloqueo crítico", también lo respetamos en la conclusión. Esto NO modifica
  // ni `computeRoute`, ni `computeDecisionReadiness`, ni el score, ni el cálculo de la
  // decisión: solo se filtra la lista que se pasa al helper de copy.
  const criticalBlockersForConclusion = useMemo(
    () =>
      route.principalBlock === "Ningún bloqueo crítico"
        ? []
        : decisionReadiness.bloqueosCriticos,
    [route.principalBlock, decisionReadiness.bloqueosCriticos],
  );
  const actionPlan = useMemo(
    () => buildActionPlan({ profile, costs, route, schools, decisionReadiness }),
    [profile, costs, route, schools, decisionReadiness]
  );

  const shouldPayNow = decisionReadiness.decision === "Listo para decidir con condiciones";
  const hasExampleSchools = schools.some((s) => s.isExample);
  const hasComparatorImportedSchools = schools.some((s) => s.enlaceReferencia.startsWith("comparador:"));
  const keyDataEdited = Boolean(profile.nombre.trim()) && profile.dineroDisponible !== defaultProfile.dineroDisponible && schools.length > 0;
  const isUsingDemoData = hasExampleSchools || !keyDataEdited;
  const routePriorityLabels = useMemo(() => {
    const ranked = [
      { key: "Integrada", score: route.integrated },
      { key: "Modular", score: route.modular },
      { key: "Preparación", score: route.prep },
    ].sort((a, b) => b.score - a.score);

    return {
      Integrada:
        ranked[0].key === "Integrada" ? "Ruta recomendada" : ranked[2].key === "Integrada" ? "Ruta menos prioritaria" : "Ruta posible",
      Modular:
        ranked[0].key === "Modular" ? "Ruta recomendada" : ranked[2].key === "Modular" ? "Ruta menos prioritaria" : "Ruta posible",
      "Preparación":
        ranked[0].key === "Preparación" ? "Ruta recomendada" : ranked[2].key === "Preparación" ? "Ruta menos prioritaria" : "Ruta posible",
    } as const;
  }, [route.integrated, route.modular, route.prep]);

  const riskDiagnosis = useMemo(
    () =>
      buildRiskDiagnosis({
        class1: profile.class1,
        ingles: profile.ingles,
        riesgoFinanciero: costs.riesgoFinanciero,
        coverage: costs.coverage,
        schoolsCount: schools.length,
        verifiedCount: schoolStats.verifiedCount,
        routeConflicts: route.conflicts,
        bestSchoolAnalysis: schoolStats.bestSchool?.analysis ?? null,
      }),
    [
      profile.class1,
      profile.ingles,
      costs.riesgoFinanciero,
      costs.coverage,
      schoolStats.bestSchool,
      schoolStats.verifiedCount,
      schools.length,
      route.conflicts,
    ],
  );

  const nextStepRecommendation = useMemo(
    () =>
      pickFlyPathNextSteps({
        profile,
        route,
        decisionReadiness,
        schoolsCount: schools.length,
        verifiedSchoolsCount: schoolStats.verifiedCount,
        costInputs,
        costs,
        riskDiagnosis,
      }),
    [profile, route, decisionReadiness, schools.length, schoolStats.verifiedCount, costInputs, costs, riskDiagnosis],
  );

  const reportSnapshot = useMemo(() => {
    const generatedAt = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

    return buildReportSnapshot({
      generatedAt,
      disclaimer: disclaimerText,
      metadata: {
        source: "career-planner",
        reviewMode,
        initialTab,
      },
      profile: {
        nombre: profile.nombre,
        edad: profile.edad,
        pais: profile.pais,
        objetivo: profile.objetivo,
        class1: profile.class1,
        ingles: profile.ingles,
        icaoLevel: profile.icaoLevel,
        preocupacionIngles: profile.preocupacionIngles,
        dineroDisponible: profile.dineroDisponible,
        ahorroMensual: profile.ahorroMensual,
        financiacion: profile.financiacion,
        inversionMaxima: profile.inversionMaxima,
        toleranciaRiesgo: profile.toleranciaRiesgo,
        disponibilidad: profile.disponibilidad,
        horasSemana: profile.horasSemana,
        necesitaTrabajar: profile.necesitaTrabajar,
        movilidad: profile.movilidad,
        urgencia: profile.urgencia,
        costEstimateSource: profile.costEstimateSource,
      },
      routeRecommendation: {
        recommended: route.recommended,
        reason: route.reason,
        principalBlock: route.principalBlock,
        warnings: [...route.warnings],
        conflicts: [...route.conflicts],
        scores: {
          integrated: route.integrated,
          modular: route.modular,
          prep: route.prep,
        },
      },
      costs: {
        inputs: { ...costInputs },
        summary: {
          subtotalFormacion: costs.subtotalFormacion,
          subtotalExtras: costs.subtotalExtras,
          subtotalVida: costs.subtotalVida,
          buffer: costs.buffer,
          totalOptimista: costs.totalOptimista,
          totalRealista: costs.totalRealista,
          totalConservador: costs.totalConservador,
          brechaFinanciacion: costs.brechaFinanciacion,
          coveragePct: costs.coverage,
          mesesCerrarBrecha: costs.mesesCerrarBrecha,
          riskScore: costs.riskScore,
          riesgoFinanciero: costs.riesgoFinanciero,
        },
      },
      readiness: {
        score: decisionReadiness.score,
        decision: decisionReadiness.decision,
        explanation: decisionReadiness.explanation,
        showNoPaguesBadge: decisionReadiness.showNoPaguesBadge,
        shouldPayNow,
        bloqueosCriticos: [...decisionReadiness.bloqueosCriticos],
        faltanDatos: [...decisionReadiness.faltanDatos],
        proximosPasos: [...decisionReadiness.proximosPasos],
      },
      risks: riskDiagnosis.map((risk) => ({
        label: risk.label,
        nivel: risk.nivel,
        explicacion: risk.explicacion,
        accion: risk.accion,
      })),
      roadmap: {
        sevenDays: [...actionPlan.sevenDays],
        thirtyDays: [...actionPlan.thirtyDays],
        ninetyDays: [...actionPlan.ninetyDays],
      },
      schoolsSummary: {
        total: schools.length,
        verifiedCount: schoolStats.verifiedCount,
        pendingCount: schoolStats.pendingCount,
        bestSchoolName: schoolStats.bestSchool?.school.nombre ?? null,
        items: schools.slice(0, 6).map((school) => ({
          id: String(school.id),
          nombre: school.nombre,
          pais: school.pais,
          ciudad: school.ciudad,
          programa: school.programa,
          precioAnunciado: school.precioAnunciado,
          estadoVerificacion: school.estadoVerificacion,
          pendientes: getSchoolEmailMissingData(school),
        })),
      },
      flypathNextStep: {
        primaryId: nextStepRecommendation.primary,
        primary: FLYPATH_PRODUCTS[nextStepRecommendation.primary],
        secondaryIds: [...nextStepRecommendation.secondaryIds],
        reasons: [...nextStepRecommendation.reasons],
      },
    });
  }, [
    reviewMode,
    initialTab,
    profile,
    route,
    costInputs,
    costs,
    decisionReadiness,
    shouldPayNow,
    riskDiagnosis,
    actionPlan,
    schools,
    schoolStats,
    nextStepRecommendation,
  ]);

  const showToast = (message: string) => {
    setToast(message);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2800);
    }
  };

  const markCopied = (key: string) => {
    setCopiedKey(key);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2500);
    }
  };

  const cancelSchoolEdit = () => {
    setSchoolEditActiveId(null);
    setNewSchool(createEmptySchool());
    setManualFormOpen(false);
    showToast("Edición cancelada");
  };

  const openSchoolsManualForm = () => {
    setManualFormOpen(true);
    requestAnimationFrame(() => {
      schoolFormPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const editSchoolInPlanner = (school: School) => {
    setNewSchool({ ...school });
    setSchoolEditActiveId(school.id);
    openSchoolsManualForm();
  };

  const removeSchoolById = (id: number) => {
    setSchools((prev) => prev.filter((s) => s.id !== id));
    if (schoolEditActiveId === id) {
      setSchoolEditActiveId(null);
      setNewSchool(createEmptySchool());
      setManualFormOpen(false);
    }
    showToast("Escuela eliminada");
  };

  const plannerSchoolCatalog = useMemo(() => getPlannerSchoolCatalog(), []);

  const plannerVerifiedCount = useMemo(() => countPlannerVerifiedSchools(schools), [schools]);

  const tryAddSchoolFromDatabase = (entry: SchoolEntry, option: PlannerProgramOption): string | null => {
    if (schools.some((s) => parsePlannerSchoolLink(s.enlaceReferencia)?.slug === entry.slug)) {
      return "Esta escuela ya está en tu selección.";
    }
    setSchools((prev) => [...prev, mapEntryOptionToPlannerSchool(entry, option, Date.now())]);
    showToast(`${entry.name} añadida`);
    return null;
  };

  const updatePlannerSchoolProgram = (
    schoolId: number,
    entry: SchoolEntry,
    option: PlannerProgramOption,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id !== schoolId) return s;
        const mapped = mapEntryOptionToPlannerSchool(entry, option, schoolId);
        return { ...mapped, id: schoolId, isExample: s.isExample };
      }),
    );
  };

  const updateSchoolPrograma = (schoolId: number, programa: School["programa"]) => {
    setSchools((prev) => prev.map((s) => (s.id === schoolId ? { ...s, programa } : s)));
  };

  const addSchool = (fromOnboarding = false) => {
    if (!newSchool.nombre.trim()) return;
    if (fromOnboarding && schools.length >= 3) return;

    if (!fromOnboarding && schoolEditActiveId !== null) {
      const target = schools.find((s) => s.id === schoolEditActiveId);
      if (!target) {
        setSchoolEditActiveId(null);
        setNewSchool(createEmptySchool());
        showToast("No se pudo guardar: escuela no encontrada");
        return;
      }
      setSchools((prev) => {
        const i = prev.findIndex((s) => s.id === schoolEditActiveId);
        if (i === -1) return prev;
        const prevSchool = prev[i];
        const updated: School = { ...newSchool, id: schoolEditActiveId, isExample: prevSchool.isExample };
        const next = [...prev];
        next[i] = updated;
        return next;
      });
      setSchoolEditActiveId(null);
      setNewSchool(createEmptySchool());
      setManualFormOpen(false);
      showToast("Escuela actualizada");
      return;
    }

    setSchools((prev) => [
      ...prev,
      {
        ...newSchool,
        id: Date.now(),
        fuentePrecio: newSchool.enlaceReferencia.startsWith("comparador:") ? newSchool.fuentePrecio : "usuario",
      },
    ]);
    setNewSchool(createEmptySchool());
    setManualFormOpen(false);
    showToast("Escuela añadida");
  };

  const finishOnboarding = () => {
    setOnboardingCompleted(true);
    setScreen("dashboard");
    setTab("diagnosis");
    setPlannerStep("diagnosis");
  };

  const openProfileOnboardingModal = () => {
    // En reviewMode el modal de onboarding nunca se renderiza: evitamos dejar
    // `screen` en "onboarding" sin que exista overlay que lo represente.
    if (reviewMode) return;
    setOnboardingStep(1);
    setScreen("onboarding");
  };

  /**
   * Navegación de tabs del dashboard activada por el USUARIO (clicks en sidebar o
   * en CTAs visibles tipo "Siguiente paso", "Comparar escuelas", "Ver informe final",
   * etc.). Cambia el tab y hace scroll a la parte superior del nuevo contenido.
   *
   * Solo se usa para clicks visibles. Las navegaciones automáticas (efectos de
   * deep-link, importación desde el comparador, finishOnboarding, review mode,
   * carga inicial) siguen llamando a setTab(...) directamente: en esos casos no
   * hay que tocar el scroll porque el usuario aún no estaba navegando dentro del
   * dashboard.
   */
  function goToDashboardTab(nextTab: Tab | "route" | "cost") {
    const normalized = normalizeDashboardTab(nextTab);
    setTab(normalized);
    setPlannerStep(normalized);
    if (typeof window === "undefined") return;
    // Esperamos al siguiente frame para que la nueva sección ya esté en el DOM antes
    // de mover el scroll: si lo hacemos sincrónicamente, el scrollTop puede aplicarse
    // sobre el layout viejo y queda inconsistente.
    window.requestAnimationFrame(() => {
      // Dashboard normal = una sola página larga: navegamos haciendo scroll a la
      // sección correspondiente. En modo review seguimos mostrando un único tab,
      // así que volvemos arriba como antes.
      if (!reviewMode) {
        const section = document.getElementById(`planner-${normalized}`);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const goToPlannerStep = (step: PlannerStepId) => {
    if (step !== "profile" && !onboardingCompleted && !reviewMode) {
      showToast("Completa tu perfil antes de continuar.");
      setPlannerStep("profile");
      setScreen("onboarding");
      setOnboardingStep(1);
      return;
    }
    setPlannerStep(step);
    if (step === "profile") {
      // En reviewMode no hay onboarding modal disponible; mantenemos la pantalla
      // actual para no desincronizar `screen` con el contenido visible.
      if (!reviewMode) {
        setScreen("onboarding");
      }
      return;
    }
    const nextTab = plannerStepToTab(step);
    if (nextTab) {
      setScreen("dashboard");
      goToDashboardTab(nextTab);
    }
  };

  const plannerStepFooter = (() => {
    if (screen === "onboarding") {
      if (onboardingStep === 6) {
        return (
          <PlannerStepFooter label="Continuar a diagnóstico" onClick={finishOnboarding} variant="gold" />
        );
      }
      return null;
    }
    switch (plannerStep) {
      case "schools":
        return (
          <PlannerStepFooter
            label="Continuar a informe"
            onClick={() => goToPlannerStep("report")}
            variant="gold"
          />
        );
      default:
        return null;
    }
  })();

  const handleOnboardingNext = () => {
    if (onboardingStep === 3 && cameFromSchoolsComparator) {
      setCostInputs({ ...defaultCostInputs });
    }
    if (onboardingStep === 5) {
      if (profile.costEstimateSource === "user_approx") {
        setCostInputs(mapOnboardingApproxToCostInputs(onboardingApproxDraft));
      } else {
        setCostInputs({ ...defaultCostInputs });
      }
    }
    setOnboardingStep((s) => Math.min(6, s + 1));
  };

  const stepMeta: Record<number, { title: string; desc: string }> = {
    1: { title: "Perfil", desc: "Define tu punto de partida profesional." },
    2: { title: "Medical e inglés", desc: "Valida bloqueos operativos críticos." },
            3: { title: "Presupuesto", desc: "Alinea capacidad económica y riesgo." },
    4: { title: "Disponibilidad", desc: "Calcula ritmo realista de progreso." },
    5: {
      title: "Costes",
      desc: "Estima el coste de tu formación con FlyPath o con tus propios números. Podrás afinarlo después en el diagnóstico.",
    },
            6: { title: "Resultado inicial", desc: "Visualiza recomendación y brechas." },
  };

  const handleDiagnosisNavigate = (target: DiagnosisCtaTarget | "schools" | "report") => {
    if (target === "profile") {
      goToPlannerStep("profile");
      return;
    }
    if (target === "cost-adjust") return;
    goToPlannerStep(target);
  };

  const plannerStepNav = (
    <CareerPlannerStepNav
      activeStep={plannerStep}
      onboardingCompleted={onboardingCompleted}
      onStepChange={goToPlannerStep}
      reviewMode={reviewMode}
    />
  );

  const plannerBottomNav = (
    <CareerPlannerBottomNav
      activeStep={plannerStep}
      onboardingCompleted={onboardingCompleted}
      onStepChange={goToPlannerStep}
      reviewMode={reviewMode}
    />
  );

  const onboardingModalBody = (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className={plannerEyebrow}>CAREER PLANNER</p>
          <p className="mt-1 text-[15px] font-semibold text-white">Configura tu perfil para generar tu diagnóstico</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D6AE4F]/35 bg-[#1B2947] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D6AE4F]">
          Paso {onboardingStep} de 6
        </span>
      </div>
      <h1 id="onboarding-modal-title" className={`text-2xl ${plannerTitle}`}>
        {stepMeta[onboardingStep].title}
      </h1>
      {stepMeta[onboardingStep].desc ? <p className={`mt-1 ${plannerBody}`}>{stepMeta[onboardingStep].desc}</p> : null}
      <div className="mt-4 rounded-full bg-white/10 p-1">
        <Progress value={(onboardingStep / 6) * 100} tone="bg-[#D6AE4F]" />
      </div>
      <div className="mt-6 rounded-xl bg-white p-4 text-[#0f1a33] shadow-sm ring-1 ring-white/20">
              {onboardingStep === 1 && <div className="grid gap-4 md:grid-cols-2"><TextField label="Nombre" value={profile.nombre} onChange={(v)=>setProfile(p=>({...p,nombre:v}))} /><NumberField label="Edad" value={profile.edad} onChange={(v)=>setProfile(p=>({...p,edad:v}))} /><TextField label="País" value={profile.pais} onChange={(v)=>setProfile(p=>({...p,pais:v}))} /><SelectField label="Situación laboral" value={profile.situacionLaboral} options={[{value:"estudiante",label:"Estudiante"},{value:"trabajando",label:"Trabajando"},{value:"desempleado",label:"Desempleado"},{value:"otro",label:"Otro"}]} onChange={(v)=>setProfile(p=>({...p,situacionLaboral:v as Profile["situacionLaboral"]}))} /><SelectField label="Objetivo" value={profile.objetivo} options={[{value:"aerolinea",label:"Aerolínea"},{value:"ejecutivo",label:"Ejecutivo"},{value:"instructor",label:"Instructor"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setProfile(p=>({...p,objetivo:v as Profile["objetivo"]}))} /></div>}
              {onboardingStep === 2 && <div className="grid gap-4 md:grid-cols-2"><SelectField label="Clase 1" value={profile.class1} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"reservado",label:"Reservado"}]} onChange={(v)=>setProfile(p=>({...p,class1:v as Profile["class1"]}))} /><SelectField label="Class 2" value={profile.class2} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,class2:v as Profile["class2"]}))} /><SelectField label="Nivel de inglés" value={profile.ingles} options={[{value:"bajo",label:"Bajo"},{value:"medio",label:"Medio"},{value:"alto",label:"Alto"}]} onChange={(v)=>setProfile(p=>({...p,ingles:v as Profile["ingles"]}))} /><SelectField label="ICAO level" value={profile.icaoLevel} options={[{value:"0",label:"0"},{value:"4",label:"4"},{value:"5",label:"5"},{value:"6",label:"6"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setProfile(p=>({...p,icaoLevel:v as Profile["icaoLevel"]}))} /><SelectField label="Preocupación por inglés" value={profile.preocupacionIngles} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,preocupacionIngles:v as Profile["preocupacionIngles"]}))} /></div>}
              {onboardingStep === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <NumberField label="Dinero disponible ahora" value={profile.dineroDisponible} onChange={(v) => setProfile((p) => ({ ...p, dineroDisponible: v }))} />
                    <NumberField label="Ahorro mensual posible" value={profile.ahorroMensual} onChange={(v) => setProfile((p) => ({ ...p, ahorroMensual: v }))} />
                    <SelectField
                      label="Financiación"
                      value={profile.financiacion}
                      options={[
                        { value: "confirmada", label: "Confirmada" },
                        { value: "posible", label: "Posible" },
                        { value: "no", label: "No" },
                      ]}
                      onChange={(v) => setProfile((p) => ({ ...p, financiacion: v as Profile["financiacion"] }))}
                    />
                    <SelectField
                      label="Apoyo familiar"
                      value={profile.apoyoFamiliar}
                      options={[
                        { value: "si", label: "Sí" },
                        { value: "parcial", label: "Parcial" },
                        { value: "no", label: "No" },
                      ]}
                      onChange={(v) => setProfile((p) => ({ ...p, apoyoFamiliar: v as Profile["apoyoFamiliar"] }))}
                    />
                    <NumberField label="Inversión máxima aceptable" value={profile.inversionMaxima} onChange={(v) => setProfile((p) => ({ ...p, inversionMaxima: v }))} />
                    <SelectField
                      label="Tolerancia al riesgo financiero"
                      value={profile.toleranciaRiesgo}
                      options={[
                        { value: "baja", label: "Baja" },
                        { value: "media", label: "Media" },
                        { value: "alta", label: "Alta" },
                      ]}
                      onChange={(v) => setProfile((p) => ({ ...p, toleranciaRiesgo: v as Profile["toleranciaRiesgo"] }))}
                    />
                  </div>
                </div>
              )}
              {onboardingStep === 4 && <div className="grid gap-4 md:grid-cols-2"><SelectField label="Disponibilidad" value={profile.disponibilidad} options={[{value:"full-time",label:"Full-time"},{value:"part-time",label:"Part-time"}]} onChange={(v)=>setProfile(p=>({...p,disponibilidad:v as Profile["disponibilidad"]}))} /><NumberField label="Horas por semana" value={profile.horasSemana} onChange={(v)=>setProfile(p=>({...p,horasSemana:v}))} /><SelectField label="Necesita trabajar durante formación" value={profile.necesitaTrabajar} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,necesitaTrabajar:v as Profile["necesitaTrabajar"]}))} /><SelectField label="Movilidad" value={profile.movilidad} options={[{value:"solo_espana",label:"Solo España"},{value:"europa",label:"Europa"},{value:"mundial",label:"Mundial"}]} onChange={(v)=>setProfile(p=>({...p,movilidad:v as Profile["movilidad"]}))} /><SelectField label="Urgencia" value={profile.urgencia} options={[{value:"baja",label:"Baja"},{value:"media",label:"Media"},{value:"alta",label:"Alta"}]} onChange={(v)=>setProfile(p=>({...p,urgencia:v as Profile["urgencia"]}))} /></div>}
              {onboardingStep === 5 && (
                <div className="space-y-4">
                  {!cameFromSchoolsComparator ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-base font-semibold text-[#0f1a33]">¿Tienes ya una estimación de cuánto te costará la formación?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, costEstimateSource: "flypath_base" }))}
                          className={`cursor-pointer rounded-xl border px-3 py-2 text-left text-[15px] font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40 ${
                            profile.costEstimateSource === "flypath_base"
                              ? "border-[#1d4ed8] bg-blue-50 text-[#1d4ed8]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          Usar estimación FlyPath
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, costEstimateSource: "user_approx" }))}
                          className={`cursor-pointer rounded-xl border px-3 py-2 text-left text-[15px] font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40 ${
                            profile.costEstimateSource === "user_approx"
                              ? "border-[#1d4ed8] bg-blue-50 text-[#1d4ed8]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          Introducir mis propios números
                        </button>
                      </div>
                      {profile.costEstimateSource === "user_approx" ? (
                        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                          <NumberField
                            label="Coste de formación estimado"
                            value={onboardingApproxDraft.precioFormacion}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, precioFormacion: Math.max(0, v) }))}
                          />
                          <NumberField
                            label="Costes adicionales estimados"
                            value={onboardingApproxDraft.extrasEstimados}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, extrasEstimados: Math.max(0, v) }))}
                          />
                          <NumberField
                            label="Costes de vida estimados"
                            value={onboardingApproxDraft.vidaLogistica}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, vidaLogistica: Math.max(0, v) }))}
                          />
                          <NumberField
                            label="Margen de seguridad %"
                            value={onboardingApproxDraft.bufferPct}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, bufferPct: clamp(v, 0, 100) }))}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {cameFromSchoolsComparator && hasComparatorImportedSchools ? (
                    <div className="rounded-xl border border-slate-200 bg-[#fffdf7] px-3 py-2.5">
                      <p className="text-[15px] text-slate-700">
                        Hemos importado tus escuelas seleccionadas desde el comparador. Usaremos esos datos como base y podrás ajustar costes después en el diagnóstico.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
              {onboardingStep === 6 && <div className="grid gap-4 md:grid-cols-2"><InfoCard label="Ruta recomendada" value={route.recommended} /><InfoCard label="Razón principal" value={route.reason} /><InfoCard label="Coste realista" value={euro(costs.totalRealista)} /><InfoCard label="Brecha de financiación" value={euro(costs.brechaFinanciacion)} /></div>}
      </div>
    </>
  );

  const onboardingModalFooter = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => setOnboardingStep((s) => Math.max(1, s - 1))}
        disabled={onboardingStep === 1}
        className="cursor-pointer rounded-lg border border-white/25 px-4 py-2 text-[15px] text-slate-300 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>
      {onboardingStep < 6 ? (
        <button
          type="button"
          onClick={handleOnboardingNext}
          className="cursor-pointer rounded-lg bg-[#D6AE4F] px-4 py-2 text-[15px] font-semibold text-[#071224] transition hover:brightness-105"
        >
          Siguiente
        </button>
      ) : (
        plannerStepFooter
      )}
    </div>
  );

  const scrollToPlannerSection = (id: string) => {
    if (typeof window === "undefined") return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const plannerNextStep =
    schools.length === 0
      ? { label: "Comparar escuelas", target: "planner-schools" }
      : { label: "Ver informe", target: "planner-report" };

  // Gate de email + descargas del informe (misma lógica que antes, elevada a scope
  // de componente para reutilizarla en el dashboard compacto y en modo review).
  const reportEmailValid = isValidReportEmail(reportEmail);
  const freeDownloadsEnabled = reportEmailValid && !freePdfExporting;
  const requireReportEmailForDownload = () => {
    if (reportEmailValid) {
      setReportEmailDownloadHint(false);
      return true;
    }
    setReportEmailDownloadHint(true);
    return false;
  };

  const handlePremiumReportDownload = async () => {
    if (premiumPdfExporting) return;
    setPremiumPdfExporting(true);
    try {
      const { downloadPremiumCareerReportPdf } = await import("@/lib/premiumCareerReportPdf");
      await downloadPremiumCareerReportPdf(reportSnapshot);
      showToast("Informe premium descargado");
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FlyPath] Error generando PDF premium:", e);
      } else {
        console.error("[FlyPath] PDF premium fallido");
      }
      const pdfErr = await import("@/lib/premiumCareerReportPdf");
      showToast(pdfErr.PREMIUM_PDF_ERROR_MESSAGE);
    } finally {
      setPremiumPdfExporting(false);
    }
  };

  const handleFreeReportDownload = async () => {
    if (!requireReportEmailForDownload()) return;
    if (!reportMarketingConsent) {
      setReportMarketingConsentHint(true);
      setReportLeadCaptureError(null);
      return;
    }
    setReportMarketingConsentHint(false);
    if (freePdfExporting) return;
    setFreePdfExporting(true);
    setReportLeadCaptureError(null);
    try {
      const idempotencyKey = reportConversionId ?? createTrackingUuid();
      if (!reportConversionId) setReportConversionId(idempotencyKey);
      const captureResult = await captureCareerPlannerReportLead(
        reportEmail,
        reportMarketingConsent,
        getTrackingContext(),
        idempotencyKey,
      );
      if (!captureResult.ok) {
        setReportLeadCaptureError(captureResult.message);
        showToast(captureResult.message);
        return;
      }
      setReportConversionId(null);

      const { downloadFreeCareerReportPdf } = await import("@/lib/freeCareerReportPdf");
      await downloadFreeCareerReportPdf(reportSnapshot);
      showToast("Informe descargado");
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FlyPath] Error generando informe gratuito V2:", e);
      } else {
        console.error("[FlyPath] PDF informe gratuito fallido");
      }
      const pdfErr = await import("@/lib/freeCareerReportPdf");
      showToast(pdfErr.FREE_PDF_ERROR_MESSAGE);
    } finally {
      setFreePdfExporting(false);
    }
  };

  const handleParentsReportDownload = async () => {
    if (!plannerPremiumContentVisible && !requireReportEmailForDownload()) return;
    if (parentsPdfExporting) return;
    setParentsPdfExporting(true);
    try {
      const { downloadParentsReportPdf } = await import("@/lib/parentsReportPdf");
      await downloadParentsReportPdf(reportSnapshot);
      showToast("Resumen para padres descargado");
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FlyPath] Error generando PDF resumen para padres:", e);
      } else {
        console.error("[FlyPath] PDF resumen padres fallido");
      }
      const pdfErr = await import("@/lib/parentsReportPdf");
      showToast(pdfErr.PARENTS_PDF_ERROR_MESSAGE);
    } finally {
      setParentsPdfExporting(false);
    }
  };

  // Resumen compacto de diagnóstico para el dashboard (solo presentación;
  // reutiliza los mismos resolvers que la vista completa de Diagnóstico).
  const diagnosisSlices = {
    profile,
    costs: {
      brechaFinanciacion: costs.brechaFinanciacion,
      coverage: costs.coverage,
      riesgoFinanciero: costs.riesgoFinanciero,
    },
    route: { recommended: route.recommended, conflicts: route.conflicts },
  };
  const dashRiskDisplay = resolveDiagnosisRiskDisplay(diagnosisSlices);
  const dashViabilityDisplay = resolveDiagnosisViabilityDisplay(diagnosisSlices);

  const schoolsTabElement = (
    <CareerPlannerSchoolsTab
      schools={schools}
      verifiedCount={plannerVerifiedCount}
      manualFormOpen={manualFormOpen}
      formPanelRef={schoolFormPanelRef}
      schoolEditActiveId={schoolEditActiveId}
      newSchool={newSchool}
      setNewSchool={setNewSchool}
      catalog={plannerSchoolCatalog}
      onAddFromDatabase={tryAddSchoolFromDatabase}
      onUpdateProgram={updatePlannerSchoolProgram}
      onOpenManualForm={openSchoolsManualForm}
      onCloseManualForm={() => {
        setManualFormOpen(false);
        if (schoolEditActiveId !== null) {
          setSchoolEditActiveId(null);
          setNewSchool(createEmptySchool());
        }
      }}
      onSaveSchool={() => addSchool(false)}
      onCancelEdit={cancelSchoolEdit}
      onEditSchool={editSchoolInPlanner}
      onRemoveSchool={removeSchoolById}
    />
  );

  const reportNextStepsBlock = (
    <div className="mt-8 space-y-8">
      <FlyPathNextStepsPanel
        recommendation={nextStepRecommendation}
        profile={profile}
        route={route}
        decisionReadiness={decisionReadiness}
        schools={schools}
        costInputs={costInputs}
        costs={costs}
        riskDiagnosis={riskDiagnosis}
        verifiedSchoolsCount={schoolStats.verifiedCount}
      />
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota importante</p>
        <p className="mt-1 text-[15px] text-slate-600">{disclaimerText}</p>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{globalButtonFeedbackStyles}</style>
      {toast && (
        <div className="planner-toast-in fixed right-3 top-3 z-[60] inline-flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg sm:right-5 sm:top-5 sm:max-w-none sm:flex-nowrap">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
          {toast}
        </div>
      )}
      <CareerPlannerAppShell
        stepNav={reviewMode ? plannerStepNav : undefined}
        bottomNav={reviewMode ? plannerBottomNav : undefined}
        surface={reviewMode ? "light" : "navy"}
        contentClassName={
          reviewMode
            ? undefined
            : "mx-auto w-full min-w-0 max-w-[1480px] px-4 py-4 pb-10 sm:px-6 sm:py-5 lg:px-8"
        }
      >
        {!reviewMode && (
          <div
            className={`career-planner-dashboard relative -mt-4 bg-[#080F1F] pt-8 sm:-mt-5 sm:pt-10${
              screen === "onboarding" ? " pointer-events-none select-none" : ""
            }`}
            aria-hidden={screen === "onboarding" ? true : undefined}
          >
            <div
              className="pointer-events-none absolute -top-4 left-1/2 z-0 h-[min(780px,92vh)] w-screen -translate-x-1/2 sm:-top-5 lg:h-[820px]"
              aria-hidden
            >
              <Image
                src="/fondocarrer.webp"
                alt=""
                fill
                preload
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: "right -112px" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(5,11,24,0.92)_0%,rgba(8,15,31,0.52)_42%,rgba(8,15,31,0.22)_68%,rgba(5,11,24,0.12)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-[min(440px,58%)] bg-gradient-to-b from-transparent via-[#080F1F]/65 to-[#080F1F]" />
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-5">
                {/* B. Hero compacto + métricas */}
                <section className="mb-8 sm:mb-10">
                  <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-start lg:gap-8">
                    <div className="w-full max-w-md shrink-0 lg:max-w-sm xl:max-w-md">
                      <h1 className="font-extrabold leading-[0.9] tracking-[0.03em]">
                        <span className="block text-[2.75rem] text-white sm:text-[3.5rem]">CAREER</span>
                        <span className="block text-[3rem] text-[#DFB04E] sm:text-[3.85rem]">PLANNER</span>
                      </h1>
                      <p className="mt-2 text-[15px] font-semibold text-slate-200">Tu ruta. Tu plan. Tu futuro.</p>
                      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-slate-400">
                        Planifica tu camino según tu perfil, presupuesto, tiempo, escuelas candidatas y riesgos antes
                        de pagar matrícula.
                      </p>
                    </div>
                    <div className="relative w-full min-w-0 sm:w-auto">
                      <div className="-mx-4 overflow-x-auto overflow-y-visible overscroll-x-contain pb-1 pl-4 pr-4 snap-x snap-proximity scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:1rem] touch-pan-x [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none">
                        <div className="flex w-max flex-nowrap items-stretch gap-2.5 sm:gap-3">
                          <div className={HERO_METRIC_SLIDE_CLASS}>
                            <PlannerMetricCard
                              label="Presupuesto estimado"
                              value={euro(costs.totalRealista)}
                              sub="Coste realista total"
                              actionLabel="Ver desglose"
                              onAction={() => scrollToPlannerSection("planner-budget")}
                              Icon={Wallet}
                              stretchValueArea
                            />
                          </div>
                          <div className={HERO_METRIC_SLIDE_CLASS}>
                            <PlannerMetricCard
                              label="Tiempo estimado"
                              value={tiempoEstimadoLabel(route.recommended)}
                              sub={`Ruta ${route.recommended}`}
                              actionLabel="Ver línea de tiempo"
                              onAction={() => scrollToPlannerSection("planner-route")}
                              Icon={CalendarClock}
                              stretchValueArea
                            />
                          </div>
                          <div className={HERO_METRIC_SLIDE_CLASS}>
                            <PlannerMetricCard
                              label="Próximo paso"
                              value={plannerNextStep.label}
                              sub="Según tu progreso"
                              actionLabel="Ir ahora"
                              onAction={() => scrollToPlannerSection(plannerNextStep.target)}
                              Icon={ClipboardCheck}
                              highlight
                              stretchValueArea
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* C. 1. Tu perfil */}
                <section id="planner-profile" className={`scroll-mt-6 ${dashCard}`}>
                  <DashSectionHeader number={1} title="Tu perfil" Icon={UserRound} />
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    <DashTextField label="Nombre" value={profile.nombre} onChange={(v) => setProfile((p) => ({ ...p, nombre: v }))} />
                    <DashNumberField label="Edad" value={profile.edad} onChange={(v) => setProfile((p) => ({ ...p, edad: v }))} />
                    <DashSelectField
                      label="Certificado médico"
                      value={dashMedicalValueFromProfile(profile)}
                      options={[
                        { value: "clase1_confirmada", label: "Clase 1 confirmada" },
                        { value: "clase1_pendiente", label: "Clase 1 pendiente" },
                        { value: "clase2", label: "Clase 2" },
                        { value: "no_lo_se", label: "No lo sé todavía" },
                      ]}
                      onChange={(v) => setProfile((p) => applyDashMedicalOption(p, v as DashMedicalOption))}
                    />
                    <DashSelectField
                      label="Nivel de inglés"
                      value={profile.ingles}
                      options={[{ value: "bajo", label: "Bajo" }, { value: "medio", label: "Medio" }, { value: "alto", label: "Alto" }]}
                      onChange={(v) => setProfile((p) => ({ ...p, ingles: v as Profile["ingles"] }))}
                    />
                    <DashNumberField
                      label="Presupuesto disponible"
                      value={profile.dineroDisponible}
                      onChange={(v) => setProfile((p) => ({ ...p, dineroDisponible: v }))}
                    />
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full sm:max-w-sm">
                      <DashSelectField
                        label="Objetivo profesional"
                        value={profile.objetivo}
                        options={[
                          { value: "aerolinea", label: "Piloto de línea aérea" },
                          { value: "ejecutivo", label: "Aviación ejecutiva" },
                          { value: "instructor", label: "Instructor" },
                          { value: "no_lo_se", label: "No lo sé todavía" },
                        ]}
                        onChange={(v) => setProfile((p) => ({ ...p, objetivo: v as Profile["objetivo"] }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openProfileOnboardingModal}
                      className={`${plannerBtnPrimary} shrink-0`}
                    >
                      Editar mis datos
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </section>

                {/* D. 2. Tu ruta recomendada */}
                <section id="planner-route" className={`scroll-mt-6 ${dashCard}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <DashSectionHeader number={2} title="Tu ruta recomendada" Icon={Route} />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6AE4F]/35 bg-[#D6AE4F]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#E8C978]">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      {route.recommended}
                    </span>
                    <span className="text-[12px] text-slate-400">Según tu disponibilidad, presupuesto y objetivos.</span>
                  </div>
                  <PlannerRouteTimeline recommended={route.recommended} objetivo={profile.objetivo} />
                </section>

                {/* E. 3. Presupuesto + 4. Diagnóstico */}
                <section className="grid gap-4 lg:grid-cols-5">
                  <div id="planner-budget" className={`scroll-mt-6 lg:col-span-3 ${dashCard}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <DashSectionHeader number={3} title="Presupuesto y tiempo" Icon={Wallet} />
                      <button
                        type="button"
                        onClick={() => setCostAdjustOpen(true)}
                        className={`${dashGhostBtn} text-[#DFB04E] hover:text-[#E8C978] [&_svg]:text-[#DFB04E]`}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                        Ajustar costes
                      </button>
                    </div>
                    <div
                      className={
                        route.recommended === "Preparación"
                          ? "mt-3.5 flex justify-center"
                          : "mt-3.5 grid items-start gap-4 sm:grid-cols-2"
                      }
                    >
                      <div className={route.recommended === "Preparación" ? "w-full max-w-lg" : undefined}>
                        <p
                          className={`${dashBudgetMiniLabel}${route.recommended === "Preparación" ? " text-center" : ""}`}
                        >
                          Coste por partida
                        </p>
                        <DashCostDonut
                          centered={route.recommended === "Preparación"}
                          totalRealista={costs.totalRealista}
                          subtotalFormacion={costs.subtotalFormacion}
                          subtotalExtras={costs.subtotalExtras}
                          subtotalVida={costs.subtotalVida}
                          buffer={costs.buffer}
                        />
                      </div>
                      {route.recommended !== "Preparación" ? (
                        <div>
                          <p className={dashBudgetMiniLabel}>Tiempo por fase</p>
                          <DashTimePhaseBars recommended={route.recommended} />
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3.5 grid grid-cols-3 gap-2">
                      <DashScenarioMini label="Optimista" value={euro(costs.totalOptimista)} />
                      <DashScenarioMini label="Realista" value={euro(costs.totalRealista)} highlight />
                      <DashScenarioMini label="Conservador" value={euro(costs.totalConservador)} />
                    </div>
                    <div className="mt-2.5 rounded-xl border border-white/[0.06] bg-[#101B35]/60 px-3.5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-slate-300">Situación actual</p>
                        <p className="text-[13px] tabular-nums text-slate-400">
                          Cobertura <span className="font-bold text-white">{Math.round(costs.coverage)}%</span> · Brecha{" "}
                          <span className="font-bold text-[#E8C978]">{euro(costs.brechaFinanciacion)}</span>
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D6AE4F] to-[#E8C978]"
                          style={{ width: `${clamp(costs.coverage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div id="planner-diagnosis" className={`scroll-mt-6 lg:col-span-2 ${dashCard}`}>
                    <DashSectionHeader number={4} title="Tu diagnóstico" Icon={Activity} />
                    <div className="mt-4 space-y-2.5">
                      <DashDiagRow
                        Icon={Plane}
                        iconAccent="route"
                        label="Ruta recomendada"
                        value={route.recommended}
                        badge="Según tu perfil"
                        badgeTone="bajo"
                      />
                      <DashDiagRow
                        Icon={ShieldAlert}
                        iconAccent="risk"
                        label="Riesgo principal"
                        value={dashRiskDisplay.title}
                        badge={dashRiskDisplay.pill}
                        badgeTone={dashRiskDisplay.pillTone}
                      />
                      <DashDiagRow
                        Icon={Activity}
                        iconAccent="viability"
                        label="Viabilidad actual"
                        value={dashViabilityDisplay.overall}
                        valueTone={dashViabilityDisplay.overallTone}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <DashDimensionChip label="Presupuesto" level={dashViabilityDisplay.dimensions.presupuesto} />
                      <DashDimensionChip label="Tiempo" level={dashViabilityDisplay.dimensions.tiempo} />
                      <DashDimensionChip label="Inglés" level={dashViabilityDisplay.dimensions.ingles} />
                      <DashDimensionChip
                        label="Clase 1"
                        level={dashViabilityDisplay.dimensions.class1.level}
                        customValue={dashViabilityDisplay.dimensions.class1.label}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollToPlannerSection("planner-report")}
                      className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#D6AE4F] transition hover:brightness-110"
                    >
                      Ver recomendaciones detalladas
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </section>

                {/* F. 5. Escuelas candidatas */}
                <section id="planner-schools" className={`scroll-mt-6 ${dashCard}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <DashSectionHeader number={5} title="Escuelas candidatas" Icon={SchoolIcon} />
                      <p className="mt-1.5 text-[12.5px] text-slate-400">
                        Compara escuelas de nuestra base de datos o añade opciones manualmente.
                      </p>
                    </div>
                    <div className="relative flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSchoolsDbPickerOpen((open) => !open);
                          setManualFormOpen(false);
                        }}
                        aria-expanded={schoolsDbPickerOpen}
                        aria-controls="planner-schools-db-picker"
                        className={dashGhostBtn}
                      >
                        <Database className="h-3.5 w-3.5" aria-hidden />
                        Base de datos FlyPath
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSchoolsDbPickerOpen(false);
                          openSchoolsManualForm();
                        }}
                        className={dashGhostBtn}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Añadir escuela manual
                      </button>

                      {schoolsDbPickerOpen ? (
                        <div id="planner-schools-db-picker" className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[min(100%,22rem)]">
                          <SchoolDatabasePicker
                            schools={schools}
                            catalog={plannerSchoolCatalog}
                            onAddFromDatabase={tryAddSchoolFromDatabase}
                            onRemoveSchool={removeSchoolById}
                            onClose={() => setSchoolsDbPickerOpen(false)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {schools.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-[#101B35]/50 px-4 py-6 text-center">
                      <p className="text-[13px] text-slate-400">Aún no has añadido escuelas.</p>
                    </div>
                  ) : (
                    <>
                      {/* Tabla compacta (md+) */}
                      <div className="mt-4 hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[860px] text-left text-[14px]">
                          <thead>
                            <tr className="border-b border-white/10">
                              {["Escuela", "Ruta", "Coste estimado", "Opiniones de alumnos", "Riesgo", "Acciones"].map((h) => (
                                <th key={h} className="py-2.5 pr-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06]">
                            {schoolStats.analyzed.map(({ school, analysis }) => {
                              const link = parsePlannerSchoolLink(school.enlaceReferencia);
                              const reviewSummary = link ? dashboardReviewSummariesBySlug.get(link.slug) : undefined;
                              return (
                                <tr key={school.id}>
                                  <td className="py-3 pr-3">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#101B35] text-[11px] font-bold uppercase tracking-wide text-[#D6AE4F]"
                                        aria-hidden
                                      >
                                        {dashSchoolInitials(school.nombre)}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-[15px] font-semibold text-white">{school.nombre}</p>
                                        <p className="text-[12.5px] text-slate-400">
                                          {[school.ciudad, school.pais].filter(Boolean).join(", ")}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 pr-3">
                                    <DashSchoolRoutePills
                                      school={school}
                                      onUpdateProgram={updatePlannerSchoolProgram}
                                      onUpdatePrograma={updateSchoolPrograma}
                                    />
                                  </td>
                                  <td className="py-3 pr-3 text-[14px] font-semibold tabular-nums text-slate-200">
                                    {school.precioAnunciado > 0 ? euro(school.precioAnunciado) : "Pendiente"}
                                  </td>
                                  <td className="py-3 pr-3">
                                    <SchoolReviewStars
                                      summary={reviewSummary}
                                      loading={dashboardReviewsLoading}
                                      href={link ? `/opiniones-escuelas?school=${encodeURIComponent(link.slug)}` : undefined}
                                      tone="dark"
                                    />
                                  </td>
                                  <td className="py-3 pr-3">
                                    <DashSchoolRiskBadge value={analysis.riesgoFinanciero} />
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      {link ? (
                                        <a
                                          href={`/schools?add=${link.slug}&from=planner`}
                                          className="rounded-md border border-white/15 px-2.5 py-1.5 text-[12px] font-semibold text-slate-300 transition hover:border-[#D6AE4F]/40 hover:text-white"
                                        >
                                          Ver comparador
                                        </a>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={() => editSchoolInPlanner(school)}
                                        className="rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                        aria-label={`Editar ${school.nombre}`}
                                      >
                                        <Pencil className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeSchoolById(school.id)}
                                        className="rounded-md p-2 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                        aria-label={`Eliminar ${school.nombre}`}
                                      >
                                        <Trash2 className="h-4 w-4" aria-hidden />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Cards apiladas (móvil) */}
                      <div className="mt-4 space-y-3 md:hidden">
                        {schoolStats.analyzed.map(({ school, analysis }) => {
                          const link = parsePlannerSchoolLink(school.enlaceReferencia);
                          const reviewSummary = link ? dashboardReviewSummariesBySlug.get(link.slug) : undefined;
                          return (
                            <div key={school.id} className="rounded-xl border border-white/[0.08] bg-[#101B35]/60 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[15px] font-semibold text-white">{school.nombre}</p>
                                  <p className="text-[12.5px] text-slate-400">
                                    {[school.ciudad, school.pais].filter(Boolean).join(", ")}
                                  </p>
                                </div>
                                <DashSchoolRiskBadge value={analysis.riesgoFinanciero} />
                              </div>
                              <div className="mt-2.5">
                                <DashSchoolRoutePills
                                  school={school}
                                  onUpdateProgram={updatePlannerSchoolProgram}
                                  onUpdatePrograma={updateSchoolPrograma}
                                />
                              </div>
                              <div className="mt-2.5">
                                <span className="shrink-0 font-semibold tabular-nums text-[13px] text-slate-200">
                                  {school.precioAnunciado > 0 ? euro(school.precioAnunciado) : "Coste pendiente"}
                                </span>
                              </div>
                              <div className="mt-2.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Opiniones de alumnos</p>
                                <div className="mt-1">
                                  <SchoolReviewStars
                                    summary={reviewSummary}
                                    loading={dashboardReviewsLoading}
                                    href={link ? `/opiniones-escuelas?school=${encodeURIComponent(link.slug)}` : undefined}
                                    tone="dark"
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                {link ? (
                                  <a
                                    href={`/schools?add=${link.slug}&from=planner`}
                                    className="rounded-md border border-white/15 px-2.5 py-1.5 text-[12px] font-semibold text-slate-300"
                                  >
                                    Ver comparador
                                  </a>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => editSchoolInPlanner(school)}
                                  className="rounded-md border border-white/15 px-2.5 py-1.5 text-[12px] font-semibold text-slate-300"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSchoolById(school.id)}
                                  className="rounded-md border border-white/15 px-2.5 py-1.5 text-[12px] font-semibold text-red-300/90"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3.5 flex justify-center">
                        <Link
                          href="/schools"
                          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#D6AE4F] transition hover:brightness-110"
                        >
                          Ver comparador completo
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </div>
                    </>
                  )}

                  {manualFormOpen ? (
                    <div className="mt-5 scroll-mt-6 border-t border-white/10 pt-5">
                      <SchoolManualForm
                        formPanelRef={schoolFormPanelRef}
                        schoolEditActiveId={schoolEditActiveId}
                        newSchool={newSchool}
                        setNewSchool={setNewSchool}
                        onSaveSchool={() => addSchool(false)}
                        onCancelEdit={cancelSchoolEdit}
                        onClose={() => {
                          setManualFormOpen(false);
                          if (schoolEditActiveId !== null) {
                            setSchoolEditActiveId(null);
                            setNewSchool(createEmptySchool());
                          }
                        }}
                      />
                    </div>
                  ) : null}
                </section>

                {/* G. 6. Informe + Mentoría */}
                <section>
                  <div
                    id="planner-report"
                    className="relative scroll-mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1729]/82 px-4 py-3 sm:px-5 sm:py-3.5"
                  >
                    <DashSectionHeader number={6} title="Tu informe" Icon={FileText} />
                    <div className="mt-2.5 flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)] lg:items-start lg:gap-x-4 lg:gap-y-1">
                        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-3 lg:gap-4">
                        {/* Informe gratuito */}
                        <div className="flex min-w-0 flex-col rounded-xl border border-white/[0.08] bg-[#101B35]/60 p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B2947] ring-1 ring-[#3B5AA6]/30 shadow-[0_0_18px_rgba(59,90,166,0.25)]">
                              <FileText className="h-5 w-5 text-slate-200" aria-hidden />
                            </span>
                            <p className="text-[15px] font-semibold text-white">Informe gratuito</p>
                          </div>
                          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-400">
                            Resumen inicial con tu ruta recomendada y costes estimados.
                          </p>
                          {!plannerPremiumContentVisible ? (
                            <div className="mt-2">
                              <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
                                <input
                                  id="report-email"
                                  type="email"
                                  autoComplete="email"
                                  value={reportEmail}
                                  onFocus={() =>
                                    trackEventOncePerSession("form_started", {
                                      form_id: "career_planner_report",
                                    })
                                  }
                                  onChange={(e) => {
                                    setReportEmail(e.target.value);
                                    if (isValidReportEmail(e.target.value)) {
                                      setReportEmailDownloadHint(false);
                                      setReportLeadCaptureError(null);
                                    }
                                  }}
                                  placeholder="tu@email.com"
                                  className="w-full rounded-lg border border-white/12 bg-[#101B35] py-2 pl-9 pr-3 text-[13px] text-white outline-none transition placeholder:text-slate-500 focus:border-[#D6AE4F]/50 focus:ring-2 focus:ring-[#D6AE4F]/20"
                                />
                              </div>
                              {reportEmailDownloadHint && !reportEmailValid ? (
                                <p className="mt-1 text-[13px] text-amber-300" role="status">
                                  Introduce un email válido para descargar.
                                </p>
                              ) : null}
                              {reportLeadCaptureError ? (
                                <p className="mt-1 text-[13px] text-rose-300" role="alert">
                                  {reportLeadCaptureError}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          {!plannerPremiumContentVisible ? (
                            <div className="mt-1.5">
                              <label className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={reportMarketingConsent}
                                  onChange={(event) => {
                                    setReportMarketingConsent(event.target.checked);
                                    if (event.target.checked) {
                                      setReportMarketingConsentHint(false);
                                    }
                                  }}
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-[#101B35] text-[#D6AE4F] focus:ring-[#D6AE4F]/30"
                                />
                                <span className="text-[12px] leading-snug text-slate-400">
                                  {CAREER_PLANNER_MARKETING_CONSENT_TEXT}
                                </span>
                              </label>
                              <p
                                className={`mt-1 text-[13px] text-amber-300 ${reportMarketingConsentHint ? "" : "invisible"}`}
                                role="alert"
                                aria-hidden={!reportMarketingConsentHint}
                              >
                                {CAREER_PLANNER_MARKETING_CONSENT_REQUIRED_MESSAGE}
                              </p>
                            </div>
                          ) : null}
                          <div className="mt-auto pt-2">
                            <button
                              type="button"
                              disabled={freePdfExporting}
                              aria-disabled={!freeDownloadsEnabled}
                              onClick={handleFreeReportDownload}
                              className={`inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                                freeDownloadsEnabled || plannerPremiumContentVisible
                                  ? "bg-[#D6AE4F] text-[#101B35] hover:brightness-105"
                                  : "cursor-not-allowed bg-white/10 text-slate-400"
                              }`}
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {freePdfExporting ? "Generando PDF…" : "Descargar informe gratuito"}
                            </button>
                            <button
                              type="button"
                              disabled={parentsPdfExporting}
                              onClick={handleParentsReportDownload}
                              aria-disabled={!plannerPremiumContentVisible && !reportEmailValid}
                              className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[13px] font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {parentsPdfExporting ? "Generando PDF…" : "Descargar resumen para padres"}
                            </button>
                          </div>
                        </div>
                        {/* Informe premium */}
                        <div className="flex min-w-0 flex-col rounded-xl border border-[#D6AE4F]/35 bg-gradient-to-br from-[#1B2947] to-[#141F3C] p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D6AE4F]/14 ring-1 ring-[#D6AE4F]/40 shadow-[0_0_20px_rgba(214,174,79,0.35)]">
                              {plannerPremiumContentVisible ? (
                                <Unlock className="h-5 w-5 text-[#D6AE4F]" aria-hidden />
                              ) : (
                                <Lock className="h-5 w-5 text-[#D6AE4F]" aria-hidden />
                              )}
                            </span>
                            <p className="text-[16px] font-semibold leading-snug text-white">Informe premium</p>
                          </div>
                          <ul className="mt-2.5 space-y-1.5">
                            {[
                              "Veredicto FlyPath para tu caso",
                              "Escuela más sólida entre tus candidatas",
                              "Comparación directa entre escuelas",
                              "Riesgos documentales, comerciales y financieros",
                              "Qué pedir a cada escuela antes de pagar",
                              "Decisión FlyPath y próximos pasos recomendados",
                            ].map((item) => (
                              <li key={item} className="flex items-start gap-2 text-[14px] leading-normal text-slate-300">
                                <span aria-hidden className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[#D6AE4F]" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-auto pt-2">
                            {plannerPremiumContentVisible ? (
                              <button
                                type="button"
                                disabled={premiumPdfExporting}
                                onClick={handlePremiumReportDownload}
                                className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#D6AE4F] px-3 py-2 text-[14px] font-bold text-[#101B35] shadow-[0_6px_18px_rgba(214,174,79,0.3)] transition hover:brightness-105"
                              >
                                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                {premiumPdfExporting ? "Generando PDF…" : "Descargar informe premium"}
                              </button>
                            ) : (
                              <CareerPlannerPremiumCheckoutButton
                                className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#D6AE4F] px-3 py-2 text-[14px] font-bold text-[#101B35] shadow-[0_6px_18px_rgba(214,174,79,0.3)] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
                                label={`Desbloquear informe premium · ${PREMIUM_REPORT_PRICE_LABEL}`}
                              />
                            )}
                          </div>
                        </div>
                        </div>
                      <div className="flex min-w-0 items-start justify-center lg:pt-0.5">
                        <Image
                          src="/aerocomms/mockups/mockplan.webp"
                          alt=""
                          aria-hidden="true"
                          width={790}
                          height={730}
                          className="h-auto w-full max-h-[min(420px,55vh)] max-w-[min(100%,520px)] object-contain object-center drop-shadow-[0_16px_36px_rgba(0,0,0,0.42)] lg:max-h-full lg:max-w-none"
                        />
                      </div>
                        <div className="lg:-mt-14 rounded-xl border border-[#D6AE4F]/28 bg-[#16223F]/80 p-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D6AE4F]/12 ring-1 ring-[#D6AE4F]/30">
                                  <MessagesSquare className="h-3 w-3 text-[#D6AE4F]" aria-hidden />
                                </span>
                                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#D6AE4F]">RECOMENDACIÓN FLYPATH</p>
                              </div>
                              <h3 className="mt-1 text-[15px] font-bold leading-snug text-[#D6AE4F]">Mentoría de decisión</h3>
                              <p className="mt-0.5 text-[13px] leading-snug text-slate-300">
                                Revisa tu caso, presupuesto y escuelas candidatas con un piloto profesional.
                              </p>
                            </div>
                            <a
                              href="/mentorias"
                              className={`${plannerBtnPrimary} inline-flex min-h-[32px] shrink-0 items-center justify-center self-start px-3 py-1.5 text-[13px]`}
                            >
                              Ver mentorías
                              <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                            </a>
                          </div>
                          <ul className="mt-1.5 grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2 md:grid-cols-3">
                            {["Análisis personalizado de tu ruta", "Resolución de dudas clave", "Decide con seguridad antes de pagar"].map((item) => (
                              <li key={item} className="flex items-center gap-1 text-[12.5px] leading-snug text-slate-200 md:whitespace-nowrap">
                                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                    </div>
                  </div>
                </section>

                {/* Nota legal */}
                <p className="pt-1 text-center text-[11px] text-slate-500">
                  Los cálculos son estimaciones orientativas. Revisa siempre con cada escuela.
                </p>

                {/* Modal de ajuste de costes (misma lógica y formulario) */}
                {costAdjustOpen ? (
                  <div
                    className="fixed inset-0 z-[55] flex items-end justify-center bg-[#0f1a33]/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dash-cost-adjust-title"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 cursor-default"
                      aria-label="Cerrar"
                      onClick={() => setCostAdjustOpen(false)}
                    />
                    <div className="relative z-10 flex max-h-[min(90dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#101B35] shadow-2xl sm:rounded-2xl">
                      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-[#101B35] px-4 py-3.5 sm:px-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B2947] ring-1 ring-[#D6AE4F]/30">
                            <SlidersHorizontal className="h-[18px] w-[18px] text-[#D6AE4F]" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p id="dash-cost-adjust-title" className="text-base font-semibold text-white">
                              Ajustar mi estimación de costes
                            </p>
                            <p className="mt-0.5 text-[13px] text-slate-300">
                              Modifica formación, extras, costes de vida y margen de seguridad.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCostAdjustOpen(false)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                          aria-label="Cerrar ajuste de costes"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F2EC] px-4 py-4 sm:px-5 sm:py-5">
                        <CareerPlannerCostAdjustForm route={route} costInputs={costInputs} setCostInputs={setCostInputs} />
                      </div>
                      <div className="shrink-0 border-t border-white/10 bg-[#101B35] px-4 py-3.5 sm:px-5">
                        <button
                          type="button"
                          onClick={() => setCostAdjustOpen(false)}
                          className="w-full rounded-lg bg-[#D6AE4F] px-4 py-2.5 text-[14px] font-semibold text-[#101B35] transition hover:brightness-105 sm:w-auto sm:min-w-[10rem]"
                        >
                          Guardar estimación
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
            </div>
          </div>
        )}
        {reviewMode && (
        <PlannerMainCanvas footer={plannerStepFooter}>
            {tab === "diagnosis" && (
              <CareerPlannerDiagnosisView
                route={route}
                costs={costs}
                profile={profile}
                costInputs={costInputs}
                setCostInputs={setCostInputs}
                onNavigate={handleDiagnosisNavigate}
              />
            )}
            {tab === "schools" && schoolsTabElement}
            {tab === "report" && (() => {
              const preparacionNivel = informePreparacionNivel(decisionReadiness.decision);
              return (
              <div className="space-y-7">
                <div>
                  <p className={plannerEyebrow}>Informe final FlyPath</p>
                  <h2 className={`mt-3 min-w-0 break-words text-2xl leading-tight tracking-tight sm:text-[1.75rem] lg:text-3xl ${plannerTitle}`}>
                    {informeFinalHeroHeadline(decisionReadiness.decision)}
                  </h2>
                  <p className={`mt-3 max-w-3xl sm:text-base ${plannerBody}`}>
                    {informeFinalHeroSubheadline(route, riskDiagnosis)}
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={`min-w-0 text-center sm:px-4 sm:py-3.5 ${plannerSubcard}`}>
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">Ruta recomendada</p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-[#D6AE4F] sm:text-2xl">{route.recommended}</p>
                    </div>
                    <div className={`min-w-0 text-center sm:px-4 sm:py-3.5 ${plannerSubcard}`}>
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">Coste realista</p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-[#D6AE4F] sm:text-2xl">{euro(costs.totalRealista)}</p>
                    </div>
                    <div className={`min-w-0 text-center sm:px-4 sm:py-3.5 ${plannerSubcard}`}>
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">Nivel de preparación</p>
                      <p className={`mt-1.5 text-2xl font-bold leading-none tracking-tight text-[#D6AE4F] sm:text-3xl ${informePreparacionNivelTextClass(preparacionNivel)}`}>
                        {preparacionNivel}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`relative rounded-2xl p-6 sm:p-7 ${
                    plannerPremiumContentVisible
                      ? "border-2 border-[#c9a454]/50 bg-gradient-to-br from-[#fffdf8] via-white to-[#faf6ee] shadow-[0_8px_28px_rgba(201,164,84,0.14)] ring-1 ring-[#c9a454]/25"
                      : "border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,26,51,0.04)]"
                  }`}
                >
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-x-16 lg:gap-y-6">
                    <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Documentación</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-2">
                    {plannerPremiumContentVisible ? (
                      <Unlock className="h-5 w-5 shrink-0 text-[#c9a454]" aria-hidden />
                    ) : null}
                    <p className="text-base font-semibold text-[#0f1a33]">
                      {plannerPremiumContentVisible
                        ? "Guardar o compartir informe premium"
                        : "Descarga tus informes gratuitos"}
                    </p>
                    <DocumentationStatusBadge premium={plannerPremiumContentVisible} />
                  </div>
                  <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                    {plannerPremiumContentVisible
                      ? "Descarga tu informe premium con comparación de escuelas, recomendación FlyPath y próximos pasos personalizados."
                      : "Guarda tu resultado o compártelo con tu familia antes de tomar una decisión."}
                  </p>
                  {!plannerPremiumContentVisible ? (
                    <div className="mt-5 max-w-md">
                      <label htmlFor="report-email" className="text-[13px] font-semibold text-slate-600">
                        Email
                      </label>
                      <div className="relative mt-1.5">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                          id="report-email"
                          type="email"
                          autoComplete="email"
                          value={reportEmail}
                          onFocus={() =>
                            trackEventOncePerSession("form_started", {
                              form_id: "career_planner_report",
                            })
                          }
                          onChange={(e) => {
                            setReportEmail(e.target.value);
                            if (isValidReportEmail(e.target.value)) {
                              setReportEmailDownloadHint(false);
                              setReportLeadCaptureError(null);
                            }
                          }}
                          placeholder="tu@email.com"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-[15px] text-[#0f1a33] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#c9a454]/60 focus:ring-2 focus:ring-[#c9a454]/25"
                        />
                      </div>
                      {reportEmailDownloadHint && !reportEmailValid ? (
                        <p className="mt-1.5 text-[13px] text-amber-700" role="status">
                          Introduce un email válido para descargar.
                        </p>
                      ) : null}
                      {reportLeadCaptureError ? (
                        <p className="mt-1.5 text-[13px] text-rose-700" role="alert">
                          {reportLeadCaptureError}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-5 flex justify-center lg:hidden">
                    <FlyPathReportDownloadPreview premium={plannerPremiumContentVisible} />
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled={plannerPremiumContentVisible ? premiumPdfExporting : freePdfExporting}
                      aria-disabled={!plannerPremiumContentVisible && !freeDownloadsEnabled}
                      onClick={() => {
                        if (plannerPremiumContentVisible) {
                          void handlePremiumReportDownload();
                          return;
                        }
                        void handleFreeReportDownload();
                      }}
                      className={`inline-flex w-full min-w-0 items-center justify-center rounded-xl px-6 py-3 text-[15px] font-semibold sm:w-auto ${
                        plannerPremiumContentVisible
                          ? "min-h-[48px] bg-[#c9a454] text-[#0f1a33] font-bold shadow-[0_8px_24px_rgba(201,164,84,0.35)] ring-1 ring-[#c9a454]/40 transition hover:bg-[#ddb75c]"
                          : freeDownloadsEnabled
                            ? "min-h-[44px] bg-[#c9a454] text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c]"
                            : "min-h-[44px] cursor-not-allowed bg-slate-200 text-slate-400 shadow-sm"
                      }`}
                    >
                      <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      {premiumPdfExporting || freePdfExporting
                        ? "Generando PDF…"
                        : plannerPremiumContentVisible
                          ? "Descargar informe premium"
                          : "Descargar informe gratuito"}
                    </button>
                    <button
                      type="button"
                      disabled={parentsPdfExporting}
                      aria-disabled={!plannerPremiumContentVisible && !reportEmailValid}
                      onClick={handleParentsReportDownload}
                      className={`inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl border px-6 py-3 text-[15px] font-semibold shadow-sm sm:w-auto ${
                        plannerPremiumContentVisible || reportEmailValid
                          ? "border-slate-300 bg-white text-[#0f1a33] transition hover:border-slate-400 hover:bg-slate-50"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      {parentsPdfExporting ? "Generando PDF…" : "Descargar resumen para padres"}
                    </button>
                  </div>
                    </div>
                    <div className="hidden justify-center lg:flex lg:items-center lg:justify-end">
                      <FlyPathReportDownloadPreview premium={plannerPremiumContentVisible} />
                    </div>
                  </div>
                </div>

                {/* Bloque premium del Informe final: después de descarga y antes de "Tu siguiente paso FlyPath". */}
                {(() => {
                  if (!plannerPremiumContentVisible) {
                    return (
                      <div className="relative overflow-hidden rounded-[28px] border-2 border-[#c9a454]/45 bg-gradient-to-br from-[#071226] via-[#0f1a33] to-[#152547] p-7 text-white shadow-[0_20px_56px_rgba(15,26,51,0.28)] ring-1 ring-[#c9a454]/25 sm:p-8">
                        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#c9a454]/10 blur-2xl" aria-hidden />
                        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6">
                          <div className="lg:col-start-1 lg:row-start-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Lock className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]">
                                INFORME PREMIUM
                              </span>
                              <span className="ml-auto inline-flex rounded-full border border-[#c9a454]/40 bg-[#c9a454]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f2ddaa]">
                                Exclusivo
                              </span>
                            </div>
                            <h3 className="mt-3 text-xl font-semibold leading-tight text-white sm:text-2xl">
                              La diferencia entre investigar y decidir
                            </h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
                              El informe gratuito te ofrece una orientación inicial. El informe premium cruza tu perfil, presupuesto y escuelas candidatas para ayudarte a decidir con más criterio antes de pagar matrícula o depósito.
                            </p>
                          </div>
                          <ul className="space-y-0.5 text-[15px] leading-relaxed text-slate-200 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
                            {[
                              "Veredicto FlyPath para tu caso",
                              "Escuela más sólida entre tus candidatas",
                              "Comparación directa entre escuelas",
                              "Riesgos documentales, comerciales y financieros",
                              "Qué pedir a cada escuela antes de pagar",
                              "Decisión FlyPath y próximos pasos recomendados",
                            ].map((item) => (
                              <li key={item} className="flex items-start gap-3 py-1.5">
                                <span
                                  aria-hidden
                                  className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <CareerPlannerPremiumCheckoutButton
                            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_8px_24px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 disabled:cursor-wait disabled:opacity-70 sm:w-auto lg:col-start-1 lg:row-start-2 lg:justify-self-start"
                            label={PLANNER_PREMIUM_CHECKOUT_CTA}
                          />
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
              );
            })()}
        </PlannerMainCanvas>
        )}
        {reviewMode && tab === "report" ? reportNextStepsBlock : null}
      </CareerPlannerAppShell>
      {screen === "onboarding" && !reviewMode ? (
        <div
          className="fixed inset-0 z-[58] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-modal-title"
        >
          <div className="absolute inset-0 bg-[#050B18]/72 backdrop-blur-[4px]" aria-hidden />
          <div className="relative z-10 flex max-h-[min(85dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-gradient-to-b from-[#101B35] via-[#0F1A33] to-[#0C1730] shadow-2xl ring-1 ring-[#D6AE4F]/20 sm:max-h-[85vh] sm:max-w-[min(900px,100%)] sm:rounded-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
              {onboardingModalBody}
            </div>
            <div className="shrink-0 border-t border-white/10 bg-[#101B35]/95 px-4 py-4 sm:px-6">
              {onboardingModalFooter}
            </div>
          </div>
        </div>
      ) : null}
    {process.env.NODE_ENV === "development" && (
      <button
        type="button"
        onClick={toggleQaPremium}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 z-[40] inline-flex max-w-[calc(100vw-1.5rem)] items-center rounded-md border border-[#0f1a33]/12 bg-[#F6F7F9]/95 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 shadow-[0_2px_8px_rgba(15,26,51,0.08)] backdrop-blur-sm transition hover:border-[#D6AE4F]/35 hover:text-[#9a7b3c] md:bottom-4 md:right-4"
        aria-label={
          qaPremiumMode === "premium"
            ? "Alternar a modo gratis para revisión QA"
            : "Alternar a modo premium para revisión QA"
        }
      >
        {qaPremiumMode === "premium" ? "QA: ver modo gratis" : "QA: ver premium"}
      </button>
    )}
    </>
  );
}

export default function Page() {
  return <FlyPathApp />;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#17233F] p-5 sm:p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#D6AE4F]">{title}</p>
      {children}
    </div>
  );
}

function YNField({ label, value, onChange }: { label: string; value: YesNoUnknown; onChange: (value: YesNoUnknown) => void }) {
  return <SelectField label={label} value={value} options={[{ value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "no_se", label: "No sé" }]} onChange={(v) => onChange(v as YesNoUnknown)} />;
}

function RouteOption({ title, value, label }: { title: string; value: number; label: string }) {
  void value;
  const isRecommended = label === "Ruta recomendada";
  const isPossible = label === "Ruta posible";

  const cardStyles = isRecommended
    ? "border border-[#D6AE4F]/40 bg-[#1B2947] ring-1 ring-[#D6AE4F]/25"
    : isPossible
      ? "border border-white/[0.08] bg-[#17233F]"
      : "border border-white/[0.06] bg-[#17233F]/80";

  const chipStyles = isRecommended
    ? "bg-[#101B35] text-[#E8C978] ring-1 ring-[#D6AE4F]/40"
    : isPossible
      ? "bg-[#101B35] text-slate-300 ring-1 ring-white/15"
      : "bg-[#101B35] text-slate-400 ring-1 ring-white/10";

  const accentTone = isRecommended ? "bg-[#c9a454]/80" : isPossible ? "bg-[#3b6ea8]/45" : "bg-slate-200";
  const advisoryText =
    title === "Integrada"
      ? "Solo recomendable si tienes financiación sólida, disponibilidad y condiciones claras."
      : title === "Modular"
      ? "Permite avanzar por fases y controlar mejor el riesgo financiero."
      : "Prioriza resolver bloqueos antes de comprometer pagos altos.";

  return (
    <div
      className={`relative flex h-full min-h-[118px] flex-col rounded-lg border px-3.5 pb-3.5 pt-6 transition sm:min-h-[124px] sm:px-4 sm:pb-4 sm:pt-7 ${cardStyles}`}
    >
      <span
        className={`absolute left-1/2 top-0 z-[1] max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 truncate rounded-md px-2.5 py-1 text-center text-[11px] font-semibold leading-snug sm:text-[12px] ${chipStyles}`}
      >
        {label}
      </span>
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="mt-1.5 flex-1 text-[13px] leading-snug text-slate-400">{advisoryText}</p>
      <div className={`mt-2.5 h-0.5 shrink-0 rounded-full ${accentTone}`} aria-hidden />
    </div>
  );
}

function SummaryCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#17233F] p-4">
      <p className="text-[15px] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {subValue ? <p className="mt-0.5 text-xs font-medium text-slate-400">{subValue}</p> : null}
    </div>
  );
}

function CostBreakdownBars({
  totalRealista,
  subtotalFormacion,
  subtotalExtras,
  subtotalVida,
  buffer,
}: {
  totalRealista: number;
  subtotalFormacion: number;
  subtotalExtras: number;
  subtotalVida: number;
  buffer: number;
}) {
  const items = [
    { label: "Formación", value: subtotalFormacion, tone: "bg-[#1d4ed8]" },
    { label: "Extras", value: subtotalExtras, tone: "bg-[#0f766e]" },
    { label: "Costes de vida", value: subtotalVida, tone: "bg-[#7c3aed]" },
    { label: "Margen de seguridad", value: buffer, tone: "bg-[#c9a454]" },
  ];

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
      <p className="text-base font-semibold text-slate-700">Desglose visual del coste realista</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const percentage = totalRealista > 0 ? (item.value / totalRealista) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-[15px]">
                <p className="font-medium text-slate-700">{item.label}</p>
                <p className="text-slate-600">{euro(item.value)} · {Math.round(percentage)}%</p>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${clamp(percentage)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioBars({
  totalOptimista,
  totalRealista,
  totalConservador,
}: {
  totalOptimista: number;
  totalRealista: number;
  totalConservador: number;
}) {
  const maxValue = Math.max(totalOptimista, totalRealista, totalConservador, 1);
  const scenarios = [
    { label: "Optimista", value: totalOptimista, tone: "bg-[#0f766e]" },
    { label: "Realista", value: totalRealista, tone: "bg-[#1d4ed8]" },
    { label: "Conservador", value: totalConservador, tone: "bg-[#b45309]" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-4">
      <p className="text-base font-semibold text-slate-700">Escenarios de coste (no hay un único número)</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario) => {
          const height = (scenario.value / maxValue) * 100;
          return (
            <div key={scenario.label} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{scenario.label}</p>
              <p className="mt-1 text-base font-semibold text-slate-700">{euro(scenario.value)}</p>
              <div className="mt-3 h-24 rounded bg-slate-100 p-1">
                <div className={`w-full rounded ${scenario.tone}`} style={{ height: `${clamp(height)}%`, marginTop: `${100 - clamp(height)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4"><p className="text-[15px] font-medium text-[#0f1a33]">{title}</p><ul className="mt-2 space-y-1.5 text-[15px] text-slate-700">{items.length ? items.map((item) => <li key={item}>- {item}</li>) : <li>{empty}</li>}</ul></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4"><p className="text-[15px] text-slate-500">{label}</p><p className="mt-1 text-[15px] font-medium text-[#0f1a33]">{value}</p></div>;
}

function solidezGeneralReading(score: number): string {
  if (score <= 39) return "Baja";
  if (score <= 69) return "Media";
  return "Alta";
}

function claridadCosteReading(score: number): string {
  if (score <= 39) return "Poco clara";
  if (score <= 69) return "Parcial";
  return "Clara";
}

function transparenciaDocumentalReading(score: number): string {
  if (score <= 39) return "Muy baja";
  if (score <= 69) return "Parcial";
  return "Alta";
}

function riesgoFinancieroReading(score: number): string {
  if (score <= 39) return "Riesgo bajo";
  if (score <= 69) return "Riesgo medio/alto";
  return "Riesgo alto";
}

function SchoolTextMetricCard({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/90 px-3.5 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-slate-600">{label}</p>
        <p className="mt-1 text-lg font-bold leading-snug tracking-tight text-[#0f1a33]">{value}</p>
        {secondary ? <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-700">{secondary}</p> : null}
      </div>
      <div className="shrink-0 pt-3">
        <div className="h-[3px] w-full rounded-full bg-slate-400/45" aria-hidden />
      </div>
    </div>
  );
}

function SchoolMetricCard({ label, score, reading }: { label: string; score: number; reading: string }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/90 px-3.5 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-slate-600">{label}</p>
        <p className="mt-1.5 text-lg font-bold tabular-nums tracking-tight text-[#0f1a33]">{score}/100</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-700">{reading}</p>
      </div>
      <div className="shrink-0 pt-3">
        <div
          className="h-[3px] w-full rounded-full bg-gradient-to-r from-[#0f1a33]/45 via-slate-500/40 to-slate-400/30"
          aria-hidden
        />
      </div>
    </div>
  );
}

function SchoolFinancialRiskCard({ value }: { value: number }) {
  const elevated = value >= 68;
  const watch = value >= 52 && value < 68;
  const shell = elevated
    ? "border-amber-200/85 bg-amber-50/75"
    : watch
      ? "border-[#c9a454]/25 bg-[#fffdf6]"
      : "border-slate-200/80 bg-slate-50/80";
  const reading = riesgoFinancieroReading(value);
  return (
    <div className={`relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-2xl border px-3.5 py-3 shadow-sm ${shell}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-slate-700">Riesgo financiero</p>
            <p className="mt-0.5 text-[12px] font-medium leading-snug text-slate-600">En esta métrica, un valor más alto indica más riesgo.</p>
          </div>
          {elevated ? (
            <span className="shrink-0 rounded-full border border-amber-300/75 bg-amber-100/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950/80">
              Elevado
            </span>
          ) : watch ? (
            <span className="shrink-0 rounded-full border border-[#c9a454]/35 bg-[#fef9ed] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5c4a1f]/85">
              A VIGILAR
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-lg font-bold tabular-nums tracking-tight text-[#0f1a33]">{value}/100</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-800">{reading}</p>
      </div>
      <div className="shrink-0 pt-3">
        <div
          className="h-[3px] w-full rounded-full bg-gradient-to-r from-amber-700/25 via-[#c9a454]/50 to-amber-600/20"
          aria-hidden
        />
      </div>
    </div>
  );
}

function PlanColumn({ title, tasks }: { title: string; tasks: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-5 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
        {tasks.map((task) => (
          <li key={task} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" />{task}</li>
        ))}
      </ul>
    </div>
  );
}

function Progress({ value, tone }: { value: number; tone: string }) {
  return <div className="h-2 w-full rounded-full bg-slate-200"><div className={`h-2 rounded-full ${tone}`} style={{ width: `${clamp(value)}%` }} /></div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block"><span className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</span><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px] outline-none ring-[#1d4ed8]/20 focus:ring-2" /></label>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px] outline-none ring-[#1d4ed8]/20 focus:ring-2" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<string | { value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px] outline-none ring-[#1d4ed8]/20 focus:ring-2">
        {options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

/* ============================================================================
 * Dashboard premium (una sola página) — solo capa visual.
 * ==========================================================================*/

/** Rango orientativo de duración total según la ruta recomendada (solo copy). */
function tiempoEstimadoLabel(recommended: RouteRecommendation["recommended"]): string {
  if (recommended === "Integrada") return "18–24 meses";
  if (recommended === "Modular") return "24–36 meses";
  return "Por definir";
}

type PlannerRoutePhase = { name: string; duration?: string; Icon: typeof Plane; months?: number };

const OBJETIVO_ICONS: Record<Profile["objetivo"], typeof Plane> = {
  aerolinea: Plane,
  ejecutivo: Briefcase,
  instructor: GraduationCap,
  no_lo_se: HelpCircle,
};

const PHASES_BY_ROUTE: Record<RouteRecommendation["recommended"], PlannerRoutePhase[]> = {
  Modular: [
    { name: "Clase 1", Icon: ShieldCheck },
    { name: "Elegir escuela", Icon: GraduationCap },
    { name: "PPL", Icon: Plane },
    { name: "ATPL Teórico", Icon: BookOpen },
    { name: "Night Rating", Icon: Moon },
    { name: "Time Building", Icon: Clock },
    { name: "ME/IR", Icon: Compass },
    { name: "CPL", Icon: GraduationCap },
    { name: "UPRT", Icon: Activity },
    { name: "MCC", Icon: ClipboardList },
  ],
  Integrada: [
    { name: "Clase 1", Icon: ShieldCheck },
    { name: "Selección de escuela", Icon: GraduationCap },
    { name: "Admisión", Icon: UserCheck },
    { name: "ATPL integrado", Icon: BookOpen },
    { name: "MCC", Icon: ClipboardList },
  ],
  Preparación: [
    { name: "Diagnóstico inicial", Icon: ClipboardList },
    { name: "Presupuesto/financiación", Icon: Wallet },
    { name: "Nivel de inglés", Icon: Languages },
    { name: "Elegir ruta", Icon: Route },
    { name: "Comparar escuelas", Icon: GraduationCap },
    { name: "Plan de inicio", Icon: CalendarCheck },
    { name: "Clase 1", Icon: ShieldCheck },
  ],
};

function buildPlannerRoutePhases(
  recommended: RouteRecommendation["recommended"],
  objetivo: Profile["objetivo"],
): PlannerRoutePhase[] {
  const base = PHASES_BY_ROUTE[recommended];
  if (recommended === "Modular" || recommended === "Integrada") {
    return [
      ...base,
      { name: objetivoLabel(objetivo), duration: "Objetivo final", Icon: OBJETIVO_ICONS[objetivo] },
    ];
  }
  return base;
}

type TimePhase = { name: string; duration: string; months: number };

/** Fases con duración orientativa para “Tiempo por fase” (independiente de la timeline visual). */
const TIME_PHASES_BY_ROUTE: Record<"Modular" | "Integrada", TimePhase[]> = {
  Modular: [
    { name: "PPL", duration: "3–6 meses", months: 4.5 },
    { name: "ATPL Teórico", duration: "6–9 meses", months: 7.5 },
    { name: "Night Rating", duration: "1 mes", months: 1 },
    { name: "Time Building", duration: "2–4 meses", months: 3 },
    { name: "ME/IR", duration: "2–3 meses", months: 2.5 },
    { name: "CPL", duration: "1–2 meses", months: 1.5 },
    { name: "UPRT", duration: "1 mes", months: 1 },
    { name: "MCC", duration: "1–2 meses", months: 1.5 },
  ],
  Integrada: [
    { name: "ATPL integrado", duration: "18–24 meses", months: 21 },
    { name: "MCC", duration: "1–2 meses", months: 1.5 },
  ],
};

/* Tokens visuales del dashboard compacto */
const dashCard = "rounded-2xl border border-white/[0.08] bg-[#0E1729]/82 p-4 sm:p-5";
const dashGhostBtn =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-slate-300 transition hover:border-[#DFB04E]/45 hover:text-white";
const dashMiniLabel = "text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400";
const dashBudgetMiniLabel = "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400";
const dashInput =
  "mt-1 box-border h-10 min-h-10 w-full rounded-lg border border-white/[0.12] bg-[#0A1220] px-3 text-[14px] leading-normal text-white outline-none transition placeholder:text-slate-500 focus:border-[#DFB04E]/55 focus:ring-2 focus:ring-[#DFB04E]/25";
const dashSelectInput =
  `${dashInput} appearance-none bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-9 [background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M6%209l6%206%206-6%27%2F%3E%3C%2Fsvg%3E")]`;
const dashNumberInput =
  `${dashInput} !mt-0 pr-7 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
const dashFieldLabel = "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400";

function DashSectionHeader({ number, title, Icon }: { number: number; title: string; Icon: typeof Wallet }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#DFB04E]/14 ring-1 ring-[#DFB04E]/38">
        <Icon className="h-3.5 w-3.5 text-[#DFB04E]" aria-hidden />
      </span>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-white">
        {number}. {title}
      </h2>
    </div>
  );
}

const HERO_METRIC_SLIDE_CLASS =
  "box-border flex w-[172px] min-w-[172px] max-w-[172px] shrink-0 snap-start";

function PlannerMetricCard({
  label,
  value,
  sub,
  actionLabel,
  onAction,
  Icon,
  highlight = false,
  stretchValueArea = false,
}: {
  label: string;
  value: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
  Icon: typeof Wallet;
  highlight?: boolean;
  /** Reserva altura de valor en 2 líneas (cards 1–2) para alinear sub/CTA con la tercera. */
  stretchValueArea?: boolean;
}) {
  return (
    <div
      className={`flex h-full w-full min-w-full shrink-0 flex-col rounded-xl border bg-[#0F1829]/75 p-3 ${
        highlight ? "border-[#DFB04E]/42" : "border-white/[0.09]"
      }`}
    >
      <div className="flex justify-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DFB04E]/42 bg-[#0A1220]/90">
          <Icon className="h-[22px] w-[22px] text-[#DFB04E]" aria-hidden />
        </span>
      </div>
      <p className="mt-2 whitespace-nowrap text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p
        className={`mt-1 text-[1.2rem] font-bold leading-snug tracking-tight sm:text-[1.25rem] ${
          stretchValueArea ? "min-h-[3.25rem]" : ""
        } ${highlight ? "text-[#E8C46A]" : "text-white"}`}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-[11.5px] text-slate-400">{sub}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex cursor-pointer items-center gap-1 self-start whitespace-nowrap text-[12px] font-semibold text-[#DFB04E] transition hover:brightness-110"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** Timeline horizontal compacto: items de tamaño fijo, scroll horizontal si no cabe. */
function PlannerRouteTimeline({
  recommended,
  objetivo,
}: {
  recommended: RouteRecommendation["recommended"];
  objetivo: Profile["objetivo"];
}) {
  const phases = buildPlannerRoutePhases(recommended, objetivo);

  return (
    <div className="relative mt-5 overflow-x-auto overflow-y-visible pt-3 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="relative mx-auto w-max">
        <div
          className="pointer-events-none absolute left-8 right-8 top-[28px] border-t border-dashed border-[#D6AE4F]/25 xl:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-8 right-8 top-[24px] hidden border-t border-dashed border-[#D6AE4F]/25 xl:block"
          aria-hidden
        />
        <Plane
          className="pointer-events-none absolute right-1 top-[14px] hidden h-[18px] w-[18px] rotate-45 text-[#D6AE4F] xl:block"
          aria-hidden
        />
        <div className="flex flex-nowrap gap-5">
          {phases.map((phase, index) => {
            const Icon = phase.Icon;
            const isLast = index === phases.length - 1;
            return (
              <div key={`${phase.name}-${index}`} className="flex w-[128px] shrink-0 flex-col items-center text-center">
                <div
                  className={`relative z-10 flex h-[56px] w-[56px] items-center justify-center rounded-full border bg-[#101B35] xl:h-[48px] xl:w-[48px] ${
                    isLast ? "border-[#D6AE4F] shadow-[0_0_16px_rgba(214,174,79,0.25)]" : "border-[#D6AE4F]/45"
                  }`}
                >
                  <Icon className="h-[20px] w-[20px] text-[#D6AE4F] xl:h-[18px] xl:w-[18px]" aria-hidden />
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#D6AE4F] text-[10px] font-bold tabular-nums text-[#101B35]">
                    {index + 1}
                  </span>
                </div>
                <p className="mt-2.5 text-[12px] font-semibold leading-tight text-white">{phase.name}</p>
                {phase.duration ? (
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{phase.duration}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DashTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className={dashFieldLabel}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={dashInput} />
    </label>
  );
}

function DashNumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const stepValue = (direction: 1 | -1) => {
    const el = inputRef.current;
    if (!el) return;
    if (direction > 0) el.stepUp();
    else el.stepDown();
    onChange(Number(el.value));
  };

  return (
    <label className="block min-w-0">
      <span className={dashFieldLabel}>{label}</span>
      <div className="relative mt-1">
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={dashNumberInput}
        />
        <div className="pointer-events-none absolute inset-y-0 right-1.5 flex w-4 flex-col items-stretch justify-center">
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Aumentar ${label}`}
            onClick={() => stepValue(1)}
            className="pointer-events-auto flex h-[14px] w-full cursor-pointer items-center justify-center text-white transition hover:text-[#DFB04E]"
          >
            <ChevronUp className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Reducir ${label}`}
            onClick={() => stepValue(-1)}
            className="pointer-events-auto flex h-[14px] w-full cursor-pointer items-center justify-center text-white transition hover:text-[#DFB04E]"
          >
            <ChevronDown className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>
    </label>
  );
}

function DashSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className={dashFieldLabel}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={dashSelectInput}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Certificado médico (solo UI del dashboard): mapea el select visible sobre los
 * campos médicos existentes (class1/class2) sin tocar fórmulas ni cálculos.
 */
type DashMedicalOption = "clase1_confirmada" | "clase1_pendiente" | "clase2" | "no_lo_se";

function dashMedicalValueFromProfile(profile: Pick<Profile, "class1" | "class2">): DashMedicalOption {
  if (profile.class1 === "si") return "clase1_confirmada";
  if (profile.class1 === "reservado") return "clase1_pendiente";
  if (profile.class2 === "si") return "clase2";
  return "no_lo_se";
}

function applyDashMedicalOption(profile: Profile, option: DashMedicalOption): Profile {
  if (option === "clase1_confirmada") return { ...profile, class1: "si" };
  if (option === "clase1_pendiente") return { ...profile, class1: "reservado" };
  if (option === "clase2") return { ...profile, class1: "no", class2: "si" };
  return { ...profile, class1: "no", class2: "no" };
}

function dashSchoolInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`;
  return name.trim().slice(0, 2) || "??";
}

/** Donut CSS (conic-gradient) con el desglose real de costes por partida. */
function DashCostDonut({
  totalRealista,
  subtotalFormacion,
  subtotalExtras,
  subtotalVida,
  buffer,
  centered = false,
}: {
  totalRealista: number;
  subtotalFormacion: number;
  subtotalExtras: number;
  subtotalVida: number;
  buffer: number;
  centered?: boolean;
}) {
  const items = [
    { label: "Formación", value: subtotalFormacion, color: "#D6AE4F" },
    { label: "Extras", value: subtotalExtras, color: "#6B82AB" },
    { label: "Costes de vida", value: subtotalVida, color: "#3D5A8F" },
    { label: "Margen", value: buffer, color: "#8FA3C4" },
  ];
  const total = Math.max(totalRealista, 1);
  let acc = 0;
  const segments = items.map((item) => {
    const start = (acc / total) * 100;
    acc += item.value;
    const end = (acc / total) * 100;
    return `${item.color} ${start}% ${end}%`;
  });

  return (
    <div className={`mt-2.5 flex items-center ${centered ? "mx-auto w-max gap-4" : "gap-4"}`}>
      <div
        className="relative h-[120px] w-[120px] shrink-0 rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
        role="img"
        aria-label="Desglose del coste realista por partida"
      >
        <div className="absolute inset-[16px] flex flex-col items-center justify-center rounded-full bg-[#141F3B] text-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</span>
          <span className="text-[13px] font-bold tabular-nums leading-tight text-white">{euro(totalRealista)}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-slate-200">{euro(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras de tiempo por fase (mapping independiente de la timeline visual). */
function DashTimePhaseBars({ recommended }: { recommended: RouteRecommendation["recommended"] }) {
  if (recommended === "Preparación") return null;

  const phases = TIME_PHASES_BY_ROUTE[recommended];
  const maxMonths = Math.max(...phases.map((p) => p.months), 1);

  return (
    <div className="mt-2.5 space-y-2">
      {phases.map((phase) => (
        <div key={phase.name} className="flex items-center gap-2.5">
          <span className="w-[100px] shrink-0 truncate text-[12px] font-medium text-slate-300">{phase.name}</span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D6AE4F] to-[#E8C978]"
              style={{ width: `${(phase.months / maxMonths) * 100}%` }}
            />
          </div>
          <span className="w-[80px] shrink-0 text-right text-[11.5px] tabular-nums text-slate-400">{phase.duration}</span>
        </div>
      ))}
    </div>
  );
}

function DashScenarioMini({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 text-center ${
        highlight ? "border-[#D6AE4F]/35 bg-[#D6AE4F]/[0.07]" : "border-white/[0.08] bg-[#101B35]/60"
      }`}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className={`mt-0.5 text-[14px] font-bold tabular-nums ${highlight ? "text-[#E8C978]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function dashToneBadgeClass(tone: DiagnosisRiskPillTone): string {
  if (tone === "alto") return "border-orange-400/40 bg-orange-400/10 text-orange-300";
  if (tone === "medio") return "border-[#D6AE4F]/40 bg-[#D6AE4F]/10 text-[#E8C978]";
  return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
}

function dashToneTextClass(tone: DiagnosisRiskPillTone): string {
  if (tone === "alto") return "text-orange-300";
  if (tone === "medio") return "text-[#E8C978]";
  return "text-emerald-300";
}

type DashDiagIconAccent = "route" | "risk" | "viability";

function dashDiagIconShellClass(accent: DashDiagIconAccent): string {
  const base = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full";
  if (accent === "route") {
    return `${base} bg-emerald-500/20 ring-1 ring-emerald-400/55 shadow-[0_0_16px_rgba(16,185,129,0.28)]`;
  }
  if (accent === "risk") {
    return `${base} bg-orange-500/20 ring-1 ring-orange-400/55 shadow-[0_0_16px_rgba(249,115,22,0.28)]`;
  }
  return `${base} bg-cyan-500/20 ring-1 ring-cyan-400/55 shadow-[0_0_16px_rgba(34,211,238,0.28)]`;
}

function DashDiagRow({
  Icon,
  iconAccent,
  label,
  value,
  badge,
  badgeTone = "medio",
  valueTone,
}: {
  Icon: typeof Wallet;
  iconAccent: DashDiagIconAccent;
  label: string;
  value: string;
  badge?: string;
  badgeTone?: DiagnosisRiskPillTone;
  valueTone?: DiagnosisRiskPillTone;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#101B35]/60 px-3.5 py-2.5">
      <span className={dashDiagIconShellClass(iconAccent)}>
        <Icon className="h-[18px] w-[18px] text-white" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className={`truncate text-[13.5px] font-semibold ${valueTone ? dashToneTextClass(valueTone) : "text-white"}`}>
          {value}
        </p>
      </div>
      {badge ? (
        <span
          className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${dashToneBadgeClass(badgeTone)}`}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

/** En dimensiones de viabilidad, "Alto" es positivo (verde) y "Bajo" negativo. */
function DashDimensionChip({
  label,
  level,
  customValue,
}: {
  label: string;
  level: DiagnosisDimensionLevel;
  customValue?: string;
}) {
  const toneClass =
    level === "Alto" ? "text-emerald-300" : level === "Medio" ? "text-[#E8C978]" : "text-orange-300";
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#101B35]/50 px-2.5 py-1.5">
      <span className="text-[11px] font-semibold text-slate-300">{label}</span>
      <span className={`text-[11px] font-bold ${toneClass}`}>{customValue ?? level}</span>
    </div>
  );
}

const DASH_MANUAL_ROUTE_OPTIONS: { programa: School["programa"]; label: string }[] = [
  { programa: "integrado", label: "Integrada" },
  { programa: "modular", label: "Modular" },
  { programa: "no_lo_se", label: "Carrera univ." },
  { programa: "cadet", label: "No definido" },
];

const dashRoutePillTrack =
  "inline-flex max-w-full shrink-0 flex-wrap items-center gap-0.5 rounded-lg border border-white/12 bg-[#101B35] p-0.5";

function DashSchoolRoutePills({
  school,
  onUpdateProgram,
  onUpdatePrograma,
}: {
  school: School;
  onUpdateProgram: (schoolId: number, entry: SchoolEntry, option: PlannerProgramOption) => void;
  onUpdatePrograma: (schoolId: number, programa: School["programa"]) => void;
}) {
  const link = parsePlannerSchoolLink(school.enlaceReferencia);
  const entry = link ? getSchoolBySlug(link.slug) : undefined;
  const programOptions = entry ? getProgramOptionsForEntry(entry) : [];
  const activeKey = link?.profileKey ?? programOptions[0]?.key ?? school.programa;

  if (programOptions.length > 3 && entry) {
    return (
      <select
        value={activeKey}
        onChange={(e) => {
          const option = programOptions.find((o) => o.key === e.target.value);
          if (option) onUpdateProgram(school.id, entry, option);
        }}
        className="max-w-[10.5rem] cursor-pointer rounded-lg border border-white/15 bg-[#101B35] px-2 py-1.5 text-[11px] font-semibold text-slate-200 outline-none focus:border-[#D6AE4F]/45 focus:ring-1 focus:ring-[#D6AE4F]/30"
        aria-label={`Ruta de formación de ${school.nombre}`}
      >
        {programOptions.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (programOptions.length > 1 && entry) {
    return (
      <div className={dashRoutePillTrack} role="group" aria-label={`Ruta de formación de ${school.nombre}`}>
        {programOptions.map((opt) => {
          const active = opt.key === activeKey;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onUpdateProgram(school.id, entry, opt)}
              className={`cursor-pointer whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40 ${
                active
                  ? "bg-[#D6AE4F]/20 text-[#E8C978] ring-1 ring-[#D6AE4F]/45"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (programOptions.length === 1) {
    return (
      <span className="inline-flex rounded-md border border-[#D6AE4F]/35 bg-[#D6AE4F]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E8C978]">
        {programOptions[0].label}
      </span>
    );
  }

  return (
    <div className={dashRoutePillTrack} role="group" aria-label={`Ruta de formación de ${school.nombre}`}>
      {DASH_MANUAL_ROUTE_OPTIONS.map((opt) => {
        const active = school.programa === opt.programa;
        return (
          <button
            key={opt.programa}
            type="button"
            onClick={() => onUpdatePrograma(school.id, opt.programa)}
            className={`cursor-pointer whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40 ${
              active
                ? "bg-[#D6AE4F]/20 text-[#E8C978] ring-1 ring-[#D6AE4F]/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Umbrales visuales alineados con SchoolFinancialRiskCard (>=68 alto, >=52 medio). */
function DashSchoolRiskBadge({ value }: { value: number }) {
  const tone: DiagnosisRiskPillTone = value >= 68 ? "alto" : value >= 52 ? "medio" : "bajo";
  const label = tone === "alto" ? "Alto" : tone === "medio" ? "Medio" : "Bajo";
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${dashToneBadgeClass(tone)}`}
    >
      {label}
    </span>
  );
}
