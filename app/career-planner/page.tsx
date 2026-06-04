"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Copy,
  Download,
  GraduationCap,
  Languages,
  LayoutList,
  Lock,
  Mail,
  MessagesSquare,
  Route,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { getSchoolBySlug } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";
import { useQaPremiumMode } from "@/hooks/useQaPremiumMode";
import { canSeePremiumForDevQa } from "@/lib/qaPremiumMode";
import { CareerPlannerAppShell } from "@/components/career-planner/CareerPlannerAppShell";
import { CareerPlannerBottomNav } from "@/components/career-planner/CareerPlannerBottomNav";
import { CareerPlannerStepNav } from "@/components/career-planner/CareerPlannerStepNav";
import { PlannerStepFooter } from "@/components/career-planner/PlannerStepFooter";
import { PlannerMainCanvas } from "@/components/career-planner/PlannerMainCanvas";
import {
  plannerBody,
  plannerBtnPrimary,
  plannerBtnSecondary,
  plannerDivider,
  plannerEyebrow,
  plannerMuted,
  plannerSectionTitle,
  plannerSubcard,
  plannerSubcardAccent,
  plannerTitle,
} from "@/components/career-planner/planner-surface";
import { CareerPlannerDiagnosisView } from "@/components/career-planner/CareerPlannerDiagnosisView";
import type { PlannerDashboardTab, PlannerStepId } from "@/components/career-planner/career-planner-steps";
import {
  normalizeDashboardTab,
  normalizePlannerStep,
  plannerStepToTab,
} from "@/components/career-planner/career-planner-steps";
import type { DiagnosisCtaTarget } from "@/lib/planner-diagnosis-ui";
import { buildReportSnapshot } from "@/lib/reporting/mappers/build-report-snapshot";
import { buildRiskDiagnosis, mapRiskRowsForInformePdf } from "@/lib/reporting/domain/risk-engine";
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
  FlyPathProductId,
  FlyPathNextStepRecommendation,
  Profile,
  ReadinessResult,
  RiskItem,
  RouteRecommendation,
  School,
  YesNoUnknown,
} from "@/lib/reporting/types/shared";
type Screen = "onboarding" | "dashboard";
export type Tab = PlannerDashboardTab;
type RouteAnalysis = RouteRecommendation;
type DecisionReadiness = ReadinessResult;

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

function informePreparacionNivelTextClass(nivel: InformePreparacionNivel): string {
  switch (nivel) {
    case "Bajo":
      return "text-[#f2ddaa]";
    case "Medio":
      return "text-sky-300";
    case "Alto":
      return "text-emerald-300";
    default:
      return "text-[#f2ddaa]";
  }
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

function mapComparatorSchoolToPlannerSchool(source: SchoolEntry, id: number): School {
  const paymentText = source.paymentScheduleSummary.trim().toLowerCase();
  const refundText = source.refundPolicySummary.trim().toLowerCase();
  const supportText = source.jobSupportSummary.trim().toLowerCase();

  const calendarioPagosClaro: YesNoUnknown = paymentText.length > 0 ? "si" : "no_se";
  const reembolsoClaro: YesNoUnknown =
    refundText.includes("sin") || refundText.includes("no ")
      ? "no"
      : refundText.length > 0
        ? "si"
        : "no_se";
  const careerSupport: YesNoUnknown = supportText.length > 0 ? "si" : "no_se";

  return {
    id,
    nombre: source.name,
    pais: source.country,
    ciudad: source.city,
    programa:
      source.routeType === "integrated"
        ? "integrado"
        : source.routeType === "modular"
          ? "modular"
          : "no_lo_se",
    precioAnunciado: source.advertisedPriceEUR,
    duracionMeses: source.programDurationMonths,
    depositoRequerido: source.depositOrEnrollmentFeeEUR,
    calendarioPagosClaro,
    mccIncluido: mapYesNoOptionalUnknownToPlanner(source.mccJocIncluded),
    uprtIncluido: mapYesNoOptionalUnknownToPlanner(source.advancedUprtIncluded),
    tasasIncluidas: mapYesNoUnknownToPlanner(source.examFeesIncluded),
    skillTestsIncluidos: mapYesNoUnknownToPlanner(source.skillTestsIncluded),
    alojamientoIncluido: mapYesNoOptionalUnknownToPlanner(source.accommodationIncluded),
    reembolsoClaro,
    contratoAntesPagar: mapYesNoPartialUnknownToPlanner(source.contractAvailableBeforePayment),
    flotaExplicada: source.fleetSummary.trim().length > 0 ? "si" : "no_se",
    mantenimientoExplicado: "no_se",
    ratioAlumnoAvionConocido: source.studentAircraftRatio ? "si" : "no_se",
    permiteHablarAlumnos: "no_se",
    careerSupport,
    promesasEmpleo: mapEmploymentClaimsToPlanner(source.employmentClaimsType),
    fuentePrecio: "no_verificado",
    fechaActualizacion: source.lastUpdatedAt,
    estadoVerificacion:
      source.dataStatus === "verified"
        ? "verificado"
        : source.dataStatus === "partial"
          ? "parcialmente_verificado"
          : source.dataStatus === "unknown"
            ? "pendiente"
            : "no_verificado",
    enlaceReferencia: `comparador:${source.slug}`,
    notas: `Importada desde comparador FlyPath (${source.slug}).`,
  };
}

function mapYesNoOptionalUnknownToPlanner(value: "yes" | "no" | "optional" | "unknown"): YesNoUnknown {
  if (value === "yes") return "si";
  if (value === "no") return "no";
  return "no_se";
}

function mapYesNoUnknownToPlanner(value: "yes" | "no" | "unknown"): YesNoUnknown {
  if (value === "yes") return "si";
  if (value === "no") return "no";
  return "no_se";
}

function mapYesNoPartialUnknownToPlanner(value: "yes" | "no" | "partial" | "unknown"): YesNoUnknown {
  if (value === "yes") return "si";
  if (value === "no") return "no";
  return "no_se";
}

function mapEmploymentClaimsToPlanner(value: SchoolEntry["employmentClaimsType"]): School["promesasEmpleo"] {
  if (value === "none") return "ninguna";
  if (value === "vague") return "vagas";
  if (value === "clear_non_guaranteed") return "claras_no_garantizadas";
  if (value === "guaranteed_claimed") return "garantia_contractual";
  return "no_se";
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

function FlyPathPrimaryProductVisual({ productId }: { productId: FlyPathProductId }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = FLYPATH_PRIMARY_IMAGE[productId];
  const PlaceholderIcon =
    productId === "guia"
      ? BookOpen
      : productId === "mentoria"
        ? MessagesSquare
        : productId === "ingles"
          ? Languages
          : productId === "clases"
            ? GraduationCap
            : productId === "escuelas"
              ? ClipboardList
              : LayoutList;

  if (imgFailed) {
    return (
      <div
        className="flex aspect-[3/4] w-[100px] shrink-0 flex-col items-center justify-center rounded-lg border border-[#c9a454]/30 bg-gradient-to-br from-slate-100/95 to-[#f2ddaa]/25 p-2 shadow-[0_4px_12px_rgba(15,26,51,0.07)] sm:w-[106px] lg:w-[110px]"
        aria-hidden
      >
        <PlaceholderIcon className="h-8 w-8 text-[#0f1a33]/30 sm:h-9 sm:w-9" strokeWidth={1.2} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#c9a454]/35 bg-white/95 p-1 shadow-[0_4px_14px_rgba(15,26,51,0.08)]">
      <img
        src={src}
        alt=""
        className="mx-auto aspect-[3/4] w-[100px] rounded-md object-cover shadow-sm sm:w-[106px] lg:mx-0 lg:w-[110px]"
        onError={() => setImgFailed(true)}
      />
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
  profile: Pick<Profile, "class1" | "objetivo" | "ingles">;
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

  const primaryCtaClass =
    "inline-flex min-h-[40px] w-full min-w-0 max-w-[min(100%,22rem)] cursor-pointer items-center justify-center self-stretch rounded-xl bg-[#c9a454] px-5 py-2.5 text-base font-semibold text-[#0f1a33] shadow-md transition hover:bg-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:min-w-[13.5rem] sm:w-auto sm:self-start sm:px-7";

  const secondaryCtaClass =
    "inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-white/[0.12] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

  const renderCard = (id: FlyPathProductId, isPrimary: boolean) => {
    const p = FLYPATH_PRODUCTS[id];

    return (
      <div
        key={id}
        className={`flex h-full w-full flex-col rounded-2xl border text-left shadow-sm transition ${
          isPrimary
            ? "border-[#c9a454]/70 bg-gradient-to-br from-[#fffdf8] to-[#f8f5ef] p-4 text-[#0f1a33] ring-2 ring-[#c9a454]/40 sm:p-5"
            : "border-white/12 bg-white/[0.06] p-4 text-slate-100 sm:p-4"
        }`}
      >
        {isPrimary ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-3 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-4">
            <div className="flex min-w-0 flex-col">
              <span className="mb-1.5 inline-flex w-fit rounded-full border border-[#c9a454]/50 bg-[#c9a454]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                Recomendado para tu caso
              </span>
              <p className="text-base font-semibold leading-snug text-[#0f1a33]">{p.title}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{p.body}</p>
              <div className="mt-2.5 flex justify-center lg:hidden">
                <FlyPathPrimaryProductVisual productId={id} />
              </div>
              <button type="button" onClick={() => navigateToProduct(id)} className={`${primaryCtaClass} mt-3`}>
                {p.cta}
              </button>
            </div>
            <div className="hidden shrink-0 lg:flex lg:items-center lg:self-stretch">
              <FlyPathPrimaryProductVisual productId={id} />
            </div>
          </div>
        ) : (
          <div className={`flex min-h-0 flex-1 flex-col ${!isPrimary ? "min-h-[156px]" : ""}`}>
            <p className="text-[15px] font-semibold leading-snug text-[#f2ddaa]">{p.title}</p>
            <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-slate-300">{p.body}</p>
            <button type="button" onClick={() => navigateToProduct(id)} className={`${secondaryCtaClass} mt-auto shrink-0 pt-3`}>
              {p.cta}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-[28px] border border-[#c9a454]/35 bg-gradient-to-br from-[#0f1a33] via-[#121f3d] to-[#152547] px-5 py-6 text-white shadow-[0_14px_40px_rgba(15,26,51,0.18)] ring-1 ring-[#c9a454]/20 sm:px-7 sm:py-7">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]/90 sm:text-[11px]">Profundiza con FlyPath</p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">Tu siguiente paso FlyPath</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-200/95">
          Una recomendación principal y dos alternativas según lo que más te está bloqueando ahora.
        </p>
      </div>
      <div className="mt-6 space-y-4">
        {renderCard(primary, true)}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
          {secondaryIds.map((id) => (
            <div key={id} className="flex h-full min-h-0">
              {renderCard(id, false)}
            </div>
          ))}
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

function PlannerSchoolsPremiumModal({
  open,
  onClose,
  onUnlockClick,
}: {
  open: boolean;
  onClose: () => void;
  onUnlockClick: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar ventana"
        className="absolute inset-0 bg-[#071226]/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-schools-premium-title"
        aria-describedby="planner-schools-premium-desc"
        className="relative z-[1] w-full max-w-[32rem] rounded-3xl border border-[#c9a454]/35 bg-[#0f1a33] px-6 py-7 text-white shadow-2xl sm:px-7 sm:py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 pr-12">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
            <Lock className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
            ANÁLISIS PREMIUM FLYPATH
          </span>
        </div>
        <h3
          id="planner-schools-premium-title"
          className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl"
        >
          Descubre qué escuela encaja mejor contigo
        </h3>
        <p id="planner-schools-premium-desc" className="mt-2 text-[15px] leading-relaxed text-slate-300">
          Compara tus escuelas con tu perfil, presupuesto y riesgo antes de comprometer una matrícula.
        </p>
        <ul className="mt-4 space-y-2 text-[15px] text-slate-200">
          {[
            "Recomendación FlyPath aplicada a tu perfil",
            "Comparación personalizada entre tus escuelas",
            "Informe premium de decisión",
            "Próximos pasos adaptados a tu caso",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 leading-relaxed">
              <span
                aria-hidden
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onUnlockClick}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:text-base"
        >
          Desbloquear análisis premium
        </button>
        <p className="mt-3 text-center text-[12px] text-slate-400">Pago seguro. Acceso inmediato al análisis.</p>
      </div>
    </div>
  );
}

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
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [emailDrafts, setEmailDrafts] = useState<Record<number, string>>({});
  const [emailPendingBySchool, setEmailPendingBySchool] = useState<Record<number, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [premiumPdfExporting, setPremiumPdfExporting] = useState(false);
  const [freePdfExporting, setFreePdfExporting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatedEmailKey, setGeneratedEmailKey] = useState<number | null>(null);
  const [newSchool, setNewSchool] = useState<School>(createEmptySchool());
  const [schoolEditActiveId, setSchoolEditActiveId] = useState<number | null>(null);
  const schoolFormDetailsRef = useRef<HTMLDetailsElement>(null);
  // Apertura inicial del acordeón "Añadir escuela manualmente": abierto si el usuario es nuevo
  // (sin escuelas en localStorage ni en deep-link). Tras la decisión inicial el usuario controla
  // libremente con su toggle; no se reabre automáticamente al cambiar schools.length.
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const manualFormInitializedRef = useRef(false);
  const [plannerSchoolsPremiumModalOpen, setPlannerSchoolsPremiumModalOpen] = useState(false);
  /** Landing header: intenta /flypath-logo-white.png y luego /flypath-logo.png vía onError en la imagen. */
  const [cameFromSchoolsComparator, setCameFromSchoolsComparator] = useState(false);

  const { qaPremiumMode, toggleQaPremium } = useQaPremiumMode();
  // Misma clave localStorage que el comparador (`flypath_qa_premium_mode`).
  // Futuros bloques premium del Informe final: reutilizar `plannerPremiumContentVisible`.
  const premiumUnlockedPlanner = false;
  const plannerPremiumContentVisible = canSeePremiumForDevQa(
    premiumUnlockedPlanner,
    qaPremiumMode,
  );

  useEffect(() => {
    if (schools.length < 2) setPlannerSchoolsPremiumModalOpen(false);
  }, [schools.length]);

  const openPlannerSchoolsPremiumModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setPlannerSchoolsPremiumModalOpen(true);
  };

  useEffect(() => {
    if (!plannerSchoolsPremiumModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlannerSchoolsPremiumModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [plannerSchoolsPremiumModalOpen]);

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
    setManualFormOpen(false);
  }, [reviewMode]);

  useEffect(() => {
    if (reviewMode) {
      setStorageHydrated(true);
      return;
    }
    try {
      const p = localStorage.getItem("flypath_profile");
      const c = localStorage.getItem("flypath_cost_inputs");
      const s = localStorage.getItem("flypath_schools");
      const o = localStorage.getItem("flypath_onboarding_completed");
      if (p) {
        const parsed = JSON.parse(p) as Partial<Profile>;
        setProfile({
          ...defaultProfile,
          ...parsed,
          costEstimateSource: parsed.costEstimateSource === "user_approx" ? "user_approx" : "flypath_base",
        });
      }
      if (c) setCostInputs({ ...defaultCostInputs, ...JSON.parse(c) });
      if (s) setSchools(JSON.parse(s));
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
      setSchools((current) => {
        // Las escuelas manuales se preservan. Las escuelas importadas desde el
        // comparador ocupan hasta 2 slots de análisis separados y reemplazan
        // importaciones anteriores del comparador.
        const manualSchools = current.filter(
          (school) => !school.enlaceReferencia.startsWith("comparador:"),
        );
        const previousComparatorSlugs = current
          .filter((school) => school.enlaceReferencia.startsWith("comparador:"))
          .map((school) => school.enlaceReferencia.replace("comparador:", ""));

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
    }

    if (isSchoolsComparatorSource) {
      setCameFromSchoolsComparator(true);
      setProfile((current) => ({ ...current, costEstimateSource: "flypath_base" }));
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
      setOnboardingCompleted(true);
      setScreen("dashboard");
      setTab("schools");
      setPlannerStep("schools");
    } else if (startParam === "onboarding" || (isSchoolsComparatorSource && !onboardingDone)) {
      setScreen("onboarding");
      setPlannerStep("profile");
      setOnboardingStep(1);
    }
  }, [reviewMode, onboardingCompleted]);

  useEffect(() => {
    if (screen !== "onboarding" || onboardingStep !== 3) return;
    if (profile.costEstimateSource !== "user_approx") return;
    setOnboardingApproxDraft({
      precioFormacion: sumFormationParts(costInputs),
      extrasEstimados: sumExtrasParts(costInputs),
      vidaLogistica: sumVidaParts(costInputs),
      bufferPct: costInputs.bufferPct,
    });
  }, [screen, onboardingStep, profile.costEstimateSource]);

  useEffect(() => {
    if (!reviewMode) return;
    setScreen("dashboard");
    setTab(initialTab);
    setPlannerStep(normalizePlannerStep(initialTab));
  }, [reviewMode, initialTab]);

  // Las cuatro escrituras a localStorage están bloqueadas hasta que el efecto de
  // hidratación haya leído los datos guardados (storageHydrated === true). Esto
  // evita que el primer commit con valores INICIALES por defecto pise los datos
  // reales del usuario antes de la lectura.
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    localStorage.setItem("flypath_profile", JSON.stringify(profile));
  }, [profile, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    localStorage.setItem("flypath_cost_inputs", JSON.stringify(costInputs));
  }, [costInputs, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    localStorage.setItem("flypath_schools", JSON.stringify(schools));
  }, [schools, reviewMode, storageHydrated]);
  useEffect(() => {
    if (reviewMode || !storageHydrated) return;
    localStorage.setItem("flypath_onboarding_completed", JSON.stringify(onboardingCompleted));
  }, [onboardingCompleted, reviewMode, storageHydrated]);

  const route = useMemo(() => computeRoute(profile), [profile]);
  const costs = useMemo(() => computeCosts(costInputs, profile), [costInputs, profile]);

  const schoolStats = useMemo(
    () => computeSchoolStats(schools, costs.totalRealista),
    [schools, costs.totalRealista],
  );

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
    if (schoolFormDetailsRef.current) schoolFormDetailsRef.current.open = false;
    showToast("Edición cancelada");
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
      if (schoolFormDetailsRef.current) schoolFormDetailsRef.current.open = false;
      showToast("Escuela actualizada");
      return;
    }

    setSchools((prev) => [...prev, { ...newSchool, id: Date.now() }]);
    setNewSchool(createEmptySchool());
    showToast("Escuela añadida");
  };

  const finishOnboarding = () => {
    setOnboardingCompleted(true);
    setScreen("dashboard");
    setTab("diagnosis");
    setPlannerStep("diagnosis");
  };

  const goToPlannerStep = (step: PlannerStepId) => {
    if (step !== "profile" && !onboardingCompleted) {
      showToast("Completa tu perfil antes de continuar.");
      setPlannerStep("profile");
      setScreen("onboarding");
      setOnboardingStep(1);
      return;
    }
    setPlannerStep(step);
    if (step === "profile") {
      setScreen("onboarding");
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
  const goToDashboardTab = (nextTab: Tab | "route" | "cost") => {
    const normalized = normalizeDashboardTab(nextTab);
    setTab(normalized);
    setPlannerStep(normalized);
    if (typeof window === "undefined") return;
    // Esperamos al siguiente frame para que la nueva sección ya esté en el DOM antes
    // de mover el scroll: si lo hacemos sincrónicamente, el scrollTop puede aplicarse
    // sobre el layout viejo y queda inconsistente.
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

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
    />
  );

  const plannerBottomNav = (
    <CareerPlannerBottomNav
      activeStep={plannerStep}
      onboardingCompleted={onboardingCompleted}
      onStepChange={goToPlannerStep}
    />
  );

  if (screen === "onboarding") {
    return (
      <>
        <style jsx global>{globalButtonFeedbackStyles}</style>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-3 top-3 z-[60] inline-flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg sm:right-5 sm:top-5 sm:max-w-none sm:flex-nowrap">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            {toast}
          </motion.div>
        )}
        <CareerPlannerAppShell stepNav={plannerStepNav} bottomNav={plannerBottomNav}>
          <PlannerMainCanvas>
            <p className={plannerEyebrow}>Paso {onboardingStep} de 6 · Perfil</p>
            <h1 className={`mt-2 text-2xl ${plannerTitle}`}>{stepMeta[onboardingStep].title}</h1>
            {stepMeta[onboardingStep].desc ? (
              <p className={`mt-1 ${plannerBody}`}>{stepMeta[onboardingStep].desc}</p>
            ) : null}
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
            <div className={`mt-8 flex items-center justify-between ${plannerDivider} pt-5`}>
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
          </PlannerMainCanvas>
        </CareerPlannerAppShell>
      </>
    );
  }

  return (
    <>
      <style jsx global>{globalButtonFeedbackStyles}</style>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-3 top-3 z-[60] inline-flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg sm:right-5 sm:top-5 sm:max-w-none sm:flex-nowrap">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
          {toast}
        </motion.div>
      )}
      <CareerPlannerAppShell stepNav={plannerStepNav} bottomNav={plannerBottomNav}>
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
            {tab === "schools" && (
              <div className="flex flex-col gap-6">
                <div className="order-1">
                  <p className={plannerEyebrow}>Diagnóstico de escuelas</p>
                  <h2 className={`mt-2 text-2xl sm:text-3xl ${plannerTitle}`}>Compara escuelas antes de pagar depósito.</h2>
                  <p className={`mt-3 max-w-3xl ${plannerBody}`}>
                    No compares solo precio anunciado. Revisa contrato, reembolso, calendario de pagos, extras incluidos y evidencia por escrito.
                  </p>
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <div className={plannerSubcard}>
                      <p className="text-[15px] text-slate-400">Escuelas comparadas</p>
                      <p className="mt-1 text-lg font-semibold text-white">{schools.length}</p>
                    </div>
                    <div className={plannerSubcard}>
                      <p className="text-[15px] text-slate-400">Verificadas</p>
                      <p className="mt-1 text-lg font-semibold text-white">{schoolStats.verifiedCount}</p>
                    </div>
                    <div className={plannerSubcardAccent}>
                      <p className="text-[15px] text-slate-400">Recomendación FlyPath</p>
                      {schools.length < 2 ? (
                        <p className="mt-1 text-lg font-semibold text-white">Añade 2 escuelas</p>
                      ) : plannerPremiumContentVisible ? (
                        <p className="mt-1 text-lg font-semibold text-white">
                          {flypathSchoolRecommendation.school
                            ? flypathSchoolRecommendation.school.nombre
                            : "Sin recomendación todavía"}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={openPlannerSchoolsPremiumModal}
                          className="mt-1 inline-flex cursor-pointer border-none bg-transparent p-0 text-left text-lg font-bold leading-snug text-[#D6AE4F] underline-offset-2 transition hover:underline hover:opacity-90 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45"
                        >
                          Desbloquear análisis premium
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <details
                  ref={schoolFormDetailsRef}
                  open={manualFormOpen}
                  className="order-2 rounded-xl bg-white p-6 text-[#0f1a33] shadow-sm ring-1 ring-white/20"
                  onToggle={(e) => {
                    const el = e.currentTarget;
                    setManualFormOpen(el.open);
                    if (!el.open) {
                      if (schoolEditActiveId !== null) setNewSchool(createEmptySchool());
                      setSchoolEditActiveId(null);
                    }
                  }}
                >
                  <summary className="cursor-pointer marker:text-slate-400">
                    <span className="text-base font-semibold text-[#0f1a33]">
                      {schoolEditActiveId !== null
                        ? `Editando escuela: ${newSchool.nombre.trim() || "—"}`
                        : "Añadir escuela manualmente"}
                    </span>
                  </summary>
                  {schoolEditActiveId !== null && (
                    <div className="mt-4 rounded-2xl border border-[#c9a454]/30 bg-gradient-to-r from-[#fffdf8] to-white px-4 py-3 shadow-sm">
                      <p className="text-[15px] leading-relaxed text-slate-600">
                        Actualiza aquí precio, contrato, extras incluidos y condiciones. Los scores se recalculan automáticamente.
                      </p>
                    </div>
                  )}
                  <p className="mt-2 text-[15px] text-slate-600">
                    Introduce una escuela candidata. Cuantos más datos confirmes por escrito, más útil será el análisis.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <TextField label="Nombre" value={newSchool.nombre} onChange={(v) => setNewSchool((s) => ({ ...s, nombre: v }))} />
                    <TextField label="País" value={newSchool.pais} onChange={(v) => setNewSchool((s) => ({ ...s, pais: v }))} />
                    <TextField label="Ciudad" value={newSchool.ciudad} onChange={(v) => setNewSchool((s) => ({ ...s, ciudad: v }))} />
                    <NumberField label="Precio anunciado" value={newSchool.precioAnunciado} onChange={(v) => setNewSchool((s) => ({ ...s, precioAnunciado: v }))} />
                    <NumberField label="Duración meses" value={newSchool.duracionMeses} onChange={(v) => setNewSchool((s) => ({ ...s, duracionMeses: v }))} />
                    <TextField label="Fecha de actualización" value={newSchool.fechaActualizacion} onChange={(v) => setNewSchool((s) => ({ ...s, fechaActualizacion: v }))} />
                  </div>

                  <details className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <summary className="cursor-pointer text-base font-semibold text-slate-700">Añadir datos avanzados de verificación</summary>
                    <p className="mt-2 text-[15px] text-slate-600">
                      Empieza por los 3 datos clave. El resto sirve para afinar red flags y preguntas pendientes si tienes información suficiente.
                    </p>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-base font-semibold text-slate-800">Datos mínimos para decidir</p>
                      <p className="mt-1 text-[15px] text-slate-600">
                        Si solo puedes conseguir tres cosas de la escuela, empieza por contrato, reembolso y calendario de pagos.
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <SelectField
                          label="Contrato antes de pagar"
                          value={newSchool.contratoAntesPagar}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, contratoAntesPagar: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Reembolso claro"
                          value={newSchool.reembolsoClaro}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, reembolsoClaro: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Calendario de pagos claro"
                          value={newSchool.calendarioPagosClaro}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, calendarioPagosClaro: v as YesNoUnknown }))}
                        />
                      </div>
                    </div>

                    <details className="mt-4 rounded-xl border border-slate-200 p-4">
                      <summary className="cursor-pointer text-base font-semibold text-slate-700">Ver programa, precio y fuente</summary>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <SelectField
                          label="Programa"
                          value={newSchool.programa}
                          options={[
                            { value: "integrado", label: "integrado" },
                            { value: "modular", label: "modular" },
                            { value: "cadet", label: "cadet" },
                            { value: "no_lo_se", label: "no_lo_se" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, programa: v as School["programa"] }))}
                        />
                        <SelectField
                          label="Estado de verificación"
                          value={newSchool.estadoVerificacion}
                          options={[
                            { value: "verificado", label: "verificado" },
                            { value: "parcialmente_verificado", label: "parcialmente_verificado" },
                            { value: "no_verificado", label: "no_verificado" },
                            { value: "pendiente", label: "pendiente" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, estadoVerificacion: v as School["estadoVerificacion"] }))}
                        />
                        <SelectField
                          label="Fuente del precio"
                          value={newSchool.fuentePrecio}
                          options={[
                            { value: "web_oficial", label: "web_oficial" },
                            { value: "email_escuela", label: "email_escuela" },
                            { value: "llamada", label: "llamada" },
                            { value: "folleto", label: "folleto" },
                            { value: "alumno", label: "alumno" },
                            { value: "redes", label: "redes" },
                            { value: "usuario", label: "usuario" },
                            { value: "no_verificado", label: "no_verificado" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, fuentePrecio: v as School["fuentePrecio"] }))}
                        />
                        <NumberField label="Depósito requerido" value={newSchool.depositoRequerido} onChange={(v) => setNewSchool((s) => ({ ...s, depositoRequerido: v }))} />
                        <TextField label="Enlace de referencia" value={newSchool.enlaceReferencia} onChange={(v) => setNewSchool((s) => ({ ...s, enlaceReferencia: v }))} />
                        <TextField label="Notas" value={newSchool.notas} onChange={(v) => setNewSchool((s) => ({ ...s, notas: v }))} />
                      </div>
                    </details>

                    <details className="mt-4 rounded-xl border border-slate-200 p-4">
                      <summary className="cursor-pointer text-base font-semibold text-slate-700">Ver extras incluidos</summary>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <SelectField
                          label="MCC/JOC incluido"
                          value={newSchool.mccIncluido}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, mccIncluido: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Advanced UPRT incluido"
                          value={newSchool.uprtIncluido}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, uprtIncluido: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Tasas incluidas"
                          value={newSchool.tasasIncluidas}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, tasasIncluidas: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Skill tests incluidos"
                          value={newSchool.skillTestsIncluidos}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, skillTestsIncluidos: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Alojamiento incluido"
                          value={newSchool.alojamientoIncluido}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, alojamientoIncluido: v as YesNoUnknown }))}
                        />
                      </div>
                    </details>

                    <details className="mt-4 rounded-xl border border-slate-200 p-4">
                      <summary className="cursor-pointer text-base font-semibold text-slate-700">Ver operación, soporte y marketing</summary>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <SelectField
                          label="Flota explicada"
                          value={newSchool.flotaExplicada}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, flotaExplicada: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Mantenimiento explicado"
                          value={newSchool.mantenimientoExplicado}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, mantenimientoExplicado: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Ratio alumno/avión conocido"
                          value={newSchool.ratioAlumnoAvionConocido}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, ratioAlumnoAvionConocido: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Permite hablar con alumnos"
                          value={newSchool.permiteHablarAlumnos}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, permiteHablarAlumnos: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Career support"
                          value={newSchool.careerSupport}
                          options={[
                            { value: "si", label: "Sí" },
                            { value: "no", label: "No" },
                            { value: "no_se", label: "No lo sé" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, careerSupport: v as YesNoUnknown }))}
                        />
                        <SelectField
                          label="Promesas de empleo"
                          value={newSchool.promesasEmpleo}
                          options={[
                            { value: "ninguna", label: "ninguna" },
                            { value: "vagas", label: "vagas" },
                            { value: "claras_no_garantizadas", label: "claras_no_garantizadas" },
                            { value: "garantia_contractual", label: "garantia_contractual" },
                            { value: "no_se", label: "no_se" },
                          ]}
                          onChange={(v) => setNewSchool((s) => ({ ...s, promesasEmpleo: v as School["promesasEmpleo"] }))}
                        />
                      </div>
                    </details>
                  </details>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => addSchool(false)}
                      className="cursor-pointer rounded-xl bg-[#c9a454] px-4 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                    >
                      {schoolEditActiveId !== null ? "Guardar cambios" : "Añadir escuela manualmente"}
                    </button>
                    {schoolEditActiveId !== null && (
                      <button
                        type="button"
                        onClick={cancelSchoolEdit}
                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </details>

                {(() => {
                  const importedFromComparator = schools.filter((s) =>
                    s.enlaceReferencia.startsWith("comparador:"),
                  );
                  const ctaShellClass =
                    "order-4 relative isolate overflow-hidden rounded-3xl border border-[#c9a454]/30 text-white shadow-[0_12px_40px_rgba(15,26,51,0.28)]";
                  // Imagen local reutilizada de las cards del comparador para dar un acabado más
                  // visual al CTA sin descargar nuevos assets. Overlay azul oscuro fuerte para
                  // mantener legibilidad y look premium.
                  const ctaBackdrop = (
                    <>
                      <Image
                        src="/school-card-bg/cadet-airline.jpg"
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 768px, 100vw"
                        className="object-cover"
                        aria-hidden
                        priority
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-[#0a1228]/88 via-[#0f1a33]/74 to-[#152545]/64"
                        aria-hidden
                      />
                    </>
                  );
                  if (importedFromComparator.length > 0) {
                    return (
                      <div className={ctaShellClass}>
                        {ctaBackdrop}
                        <div className="relative p-5 sm:p-7">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]/85">ESCUELAS IMPORTADAS</p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                            Ya tienes {importedFromComparator.length}{" "}
                            {importedFromComparator.length === 1 ? "escuela" : "escuelas"} del comparador en tu Planner
                          </h3>
                          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-200">
                            Estas escuelas se usarán en tu informe final para cruzarlas con tu perfil, presupuesto, Clase 1, inglés y disponibilidad.
                          </p>
                          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                            {importedFromComparator.map((s) => (
                              <li
                                key={s.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-[15px] font-semibold text-white backdrop-blur-sm"
                              >
                                {s.nombre}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <button
                              type="button"
                              onClick={() => goToDashboardTab("report")}
                              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:bg-[#ddb75c] hover:border-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ddaa]/40"
                            >
                              Ver informe final
                              <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push("/schools?from=planner")}
                              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/[0.06] px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-white/[0.12] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ddaa]/40"
                            >
                              Cambiar escuelas
                            </button>
                          </div>
                          <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
                            Puedes cambiarlas en cualquier momento volviendo al comparador.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className={ctaShellClass}>
                      {ctaBackdrop}
                      <div className="relative p-5 sm:p-7">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]/85">COMPARADOR FLYPATH</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                          ¿Todavía no sabes qué escuelas comparar?
                        </h3>
                        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-200">
                          Explora la base de datos FlyPath y trae 2 opciones reales al Planner para analizarlas con tu perfil.
                        </p>
                        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-400">
                          La búsqueda y comparación básica son gratuitas. El análisis personalizado está disponible como opción premium.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push("/schools?from=planner")}
                          className="mt-5 inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:bg-[#ddb75c] hover:border-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ddaa]/40"
                        >
                          Explorar base de datos FlyPath
                          <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="order-5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-[#f8fafc] p-5 shadow-[0_4px_20px_rgba(15,26,51,0.04)] sm:p-6">
                  <p className="text-sm font-semibold text-[#0f1a33]">Antes de comparar, confirma:</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      "precio final",
                      "extras incluidos",
                      "contrato",
                      "política de reembolso",
                      "calendario de pagos",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 rounded-lg border border-slate-200/70 bg-white/90 px-3 py-2.5 text-[14px] font-medium capitalize text-slate-700"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]/75" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-3 flex flex-col gap-6">
                {schoolStats.analyzed.map(({ school, analysis }) => (
                  <div key={school.id} className={`rounded-3xl border bg-white p-6 shadow-sm ${flypathSchoolRecommendation.school?.id === school.id ? "border-[#c9a454]/50 bg-[#fffaf0]" : "border-slate-200"}`}>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <p className="text-xl font-semibold text-[#0f1a33]">{school.nombre}</p>
                        <p className="mt-1 text-[15px] text-slate-600">{school.ciudad}, {school.pais} · Programa {school.programa} · {euro(school.precioAnunciado)}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <SchoolTextMetricCard
                            label="Estado de verificación"
                            value={estadoVerificacionLabel(school.estadoVerificacion)}
                            secondary={school.estadoVerificacion === "pendiente" ? "Falta validar datos" : undefined}
                          />
                          <SchoolMetricCard label="Solidez general" score={analysis.encajeGeneral} reading={solidezGeneralReading(analysis.encajeGeneral)} />
                          <SchoolMetricCard label="Claridad del coste" score={analysis.claridadCoste} reading={claridadCosteReading(analysis.claridadCoste)} />
                          <SchoolMetricCard label="Transparencia documental" score={analysis.transparencia} reading={transparenciaDocumentalReading(analysis.transparencia)} />
                          <SchoolFinancialRiskCard value={analysis.riesgoFinanciero} />
                          <SchoolTextMetricCard label="Recomendación prudente" value={recomendacionLabel(analysis.recomendacionPrudente)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {plannerPremiumContentVisible ? (
                          <button
                            type="button"
                            className={`${generatedEmailKey === school.id ? "action-success-pulse border-emerald-300 bg-emerald-50 text-emerald-800" : "bg-[#c9a454] text-[#0f1a33] border-[#c9a454]/50"} w-full inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2 text-[15px] font-semibold transition hover:bg-[#ddb75c] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40`}
                            onClick={() => {
                              const pending = getSchoolEmailMissingData(school);
                              setEmailPendingBySchool((d) => ({ ...d, [school.id]: pending }));
                              setEmailDrafts((d) => ({ ...d, [school.id]: buildSchoolEmail(school, profile.nombre) }));
                              setGeneratedEmailKey(school.id);
                              if (typeof window !== "undefined") {
                                window.setTimeout(() => setGeneratedEmailKey((current) => (current === school.id ? null : current)), 2500);
                              }
                              showToast("Email generado");
                            }}
                          >
                            {generatedEmailKey === school.id ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-700" /> : <Mail className="mr-2 h-4 w-4" />}
                            {generatedEmailKey === school.id ? "Email generado" : "Generar email a escuela"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={openPlannerSchoolsPremiumModal}
                            aria-label="Email personalizado disponible con análisis premium"
                            className="w-full inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-[#c9a454] bg-[#fffaf0] px-4 py-2 text-[15px] font-semibold text-[#7b5e1f] transition hover:bg-[#fff5e6] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
                          >
                            <Lock className="mr-2 h-4 w-4" aria-hidden />
                            Email personalizado · Premium
                          </button>
                        )}
                        {plannerPremiumContentVisible && (
                          <button
                            type="button"
                            className="w-full inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-[15px] font-medium text-[#0f1a33] transition hover:bg-slate-50 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
                            onClick={async () => {
                              const draft = emailDrafts[school.id] || buildSchoolEmail(school, profile.nombre);
                              if (!emailDrafts[school.id]) {
                                const pending = getSchoolEmailMissingData(school);
                                setEmailPendingBySchool((d) => ({ ...d, [school.id]: pending }));
                                setEmailDrafts((d) => ({ ...d, [school.id]: draft }));
                              }
                              const ok = await copyText(draft);
                              if (ok) markCopied(`email-${school.id}`);
                              showToast(ok ? "Email copiado" : "No se pudo copiar el email");
                            }}
                          >
                            {copiedKey === `email-${school.id}` ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copiedKey === `email-${school.id}` ? "Copiado" : "Copiar email"}
                          </button>
                        )}
                        <button
                          type="button"
                          className={`w-full inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2 text-[15px] font-medium transition active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 ${
                            schoolEditActiveId === school.id
                              ? "border-[#c9a454]/55 bg-[#fffaf0] text-[#3d3418] shadow-sm hover:bg-[#fff5e6] focus-visible:ring-[#c9a454]/35"
                              : "border-slate-300 bg-white text-[#0f1a33] hover:bg-slate-50 focus-visible:ring-slate-300/60"
                          }`}
                          onClick={() => {
                            if (schoolEditActiveId === school.id) {
                              setSchoolEditActiveId(null);
                              setNewSchool(createEmptySchool());
                              const el = schoolFormDetailsRef.current;
                              if (el) el.open = false;
                              return;
                            }
                            setNewSchool({ ...school });
                            setSchoolEditActiveId(school.id);
                            requestAnimationFrame(() => {
                              const el = schoolFormDetailsRef.current;
                              if (el) {
                                el.open = true;
                                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                              }
                            });
                          }}
                        >
                          {schoolEditActiveId === school.id ? "Ocultar edición" : "Editar datos"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoList title="Red flags" items={analysis.redFlags.slice(0, 3)} empty="Sin red flags críticos con los datos actuales." />
                      <InfoList title="Datos pendientes" items={analysis.preguntasPendientes.slice(0, 4)} empty="Sin datos críticos pendientes." />
                    </div>
                    {plannerPremiumContentVisible && emailDrafts[school.id] && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <InfoList
                          title="Este email se ha adaptado porque faltan estos datos:"
                          items={emailPendingBySchool[school.id] || []}
                          empty="No faltan datos críticos detectados para esta escuela."
                        />
                        <p className="mb-2 mt-3 text-[15px] font-medium text-emerald-700">Email listo para copiar</p>
                        <pre className="whitespace-pre-wrap text-[15px] text-slate-700">{emailDrafts[school.id]}</pre>
                      </div>
                    )}
                  </div>
                ))}
                </div>

                {schools.length > 0 ? (
                  <div className="order-3 flex justify-start">
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined" && !window.confirm("¿Seguro que quieres eliminar todas las escuelas y empezar desde cero?")) return;
                        setSchools([]);
                        setNewSchool(createEmptySchool());
                        setSchoolEditActiveId(null);
                        if (schoolFormDetailsRef.current) schoolFormDetailsRef.current.open = false;
                        showToast("Escuelas eliminadas");
                      }}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/40"
                    >
                      Eliminar todas las escuelas y empezar desde cero
                    </button>
                  </div>
                ) : null}

                <div className="order-7 rounded-2xl border border-slate-200 border-r-4 border-r-[#c9a454] bg-gradient-to-r from-white to-[#fffaf0] p-5 shadow-sm sm:p-6">
                  <p className="text-sm font-semibold text-[#0f1a33]">Siguiente paso</p>
                  {schools.length >= 2 ? (
                    <>
                      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                        Cuando tengas precio final, contrato, reembolso y calendario de pagos claros en ambas escuelas, pasa al informe final.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => goToDashboardTab("report")}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                        >
                          Ver informe final
                          <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                        Añade al menos 2 escuelas para generar una comparación útil.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => router.push("/schools?from=planner")}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
                        >
                          Explorar escuelas
                          <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualFormOpen(true);
                            requestAnimationFrame(() => {
                              const el = schoolFormDetailsRef.current;
                              if (el) {
                                el.open = true;
                                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                              }
                            });
                          }}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
                        >
                          Añadir manualmente
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}
            {tab === "report" && (() => {
              const preparacionNivel = informePreparacionNivel(decisionReadiness.decision);
              const conclusionUi = informeConclusionUi(
                decisionReadiness.decision,
                criticalBlockersForConclusion,
                decisionReadiness.faltanDatos,
              );
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
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={`min-w-0 text-center sm:px-4 sm:py-3.5 ${plannerSubcard}`}>
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">Ruta recomendada</p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-[#D6AE4F] sm:text-2xl">{route.recommended}</p>
                    </div>
                    <div className={`min-w-0 text-center sm:px-4 sm:py-3.5 ${plannerSubcard}`}>
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">Decisión de pago</p>
                      <p
                        className={`mt-1.5 break-words text-base font-bold leading-tight sm:text-lg ${informeHeroDecisionValueTextClass(decisionReadiness.decision)}`}
                      >
                        {decisionReadiness.decision}
                      </p>
                    </div>
                    <div className={`min-w-0 text-center sm:px-4 sm:py-3.5 ${plannerSubcard}`}>
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">Coste realista</p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-[#D6AE4F] sm:text-2xl">{euro(costs.totalRealista)}</p>
                    </div>
                    <div className={`min-w-0 text-center sm:px-4 ${plannerSubcardAccent}`}>
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Nivel de preparación</p>
                      <p className={`mt-1.5 text-2xl font-bold leading-none tracking-tight sm:text-3xl ${informePreparacionNivelTextClass(preparacionNivel)}`}>
                        {preparacionNivel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${plannerSubcardAccent} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-base font-semibold ${plannerTitle}`}>Datos pendientes antes de pagar</p>
                    <span className="inline-flex rounded-full border border-[#D6AE4F]/40 bg-[#D6AE4F]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#D6AE4F]">
                      Prioridad
                    </span>
                  </div>
                  {decisionReadiness.faltanDatos.length > 0 ? (
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {decisionReadiness.faltanDatos.slice(0, 6).map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 rounded-lg border border-white/[0.08] bg-[#17233F] px-3.5 py-3 text-[15px] text-slate-200"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" aria-hidden />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`mt-3 ${plannerMuted}`}>
                      No hay datos críticos pendientes detectados, pero conserva toda la documentación por escrito.
                    </p>
                  )}
                </div>

                {conclusionUi.show ? (
                  <p className={`rounded-lg border border-[#D6AE4F]/30 bg-[#1B2947] px-4 py-3 text-[15px] font-medium leading-snug text-slate-200`}>
                    <span className="text-[#D6AE4F]">→ </span>
                    {conclusionUi.text}
                  </p>
                ) : null}

                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-[#f8fafc] p-5 shadow-[0_6px_24px_rgba(15,26,51,0.04)] sm:p-6">
                  <p className="text-base font-semibold text-[#0f1a33]">Riesgos principales</p>
                  <p className="mt-1 text-[14px] text-slate-500">Lo que más puede afectar tu decisión antes de pagar.</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {riskDiagnosis.slice(0, 6).map((risk) => {
                      const visualAction =
                        risk.accion === "Pedir por escrito alcance real de career support y límites."
                          ? "Exige contrato y desglose por escrito"
                          : risk.accion === "Confirmar Clase 1 antes de firmar o transferir dinero."
                            ? "Confirma Clase 1 antes de pagar"
                            : risk.accion === "Exigir confirmación documental de costes y condiciones."
                              ? "Exige contrato y desglose por escrito"
                              : risk.accion === "Reducir brecha, confirmar financiación y mantener un margen de seguridad financiero."
                                ? "Cierra brecha y financiación antes de pagar"
                                : risk.accion;
                      return (
                        <div
                          key={risk.label}
                          className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_2px_12px_rgba(15,26,51,0.04)]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-semibold text-[#0f1a33]">
                              {informeRiskChipLabel(risk.label)}
                            </span>
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${informeRiskNivelBadgeClass(risk.nivel)}`}
                            >
                              {risk.nivel}
                            </span>
                          </div>
                          <p className="mt-3 text-[15px] font-medium leading-snug text-slate-800">{risk.explicacion}</p>
                          <p className="mt-2.5 text-[14px] leading-snug text-slate-600">
                            <span className="font-semibold text-[#7a5e16]" aria-hidden>
                              →{" "}
                            </span>
                            {visualAction}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-[#f8fafc] p-5 shadow-[0_6px_24px_rgba(15,26,51,0.04)] sm:p-6">
                  <p className="text-base font-semibold text-[#0f1a33]">Plan resumido</p>
                  <p className="mt-1 text-[14px] text-slate-500">Roadmap prudente para avanzar sin comprometer dinero demasiado pronto.</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      { title: "Próximos 7 días", items: actionPlan.sevenDays.slice(0, 3), accent: "border-[#c9a454]/50" },
                      { title: "Próximos 30 días", items: actionPlan.thirtyDays.slice(0, 3), accent: "border-slate-300/80" },
                      { title: "Próximos 90 días", items: actionPlan.ninetyDays.slice(0, 3), accent: "border-slate-300/60" },
                    ].map((block) => (
                      <div
                        key={block.title}
                        className={`rounded-2xl border-l-[3px] ${block.accent} border border-slate-200/80 bg-white p-5 shadow-sm`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{block.title}</p>
                        {block.items.length > 0 ? (
                          <ol className="mt-4 space-y-3">
                            {block.items.map((task, idx) => (
                              <li key={task} className="flex items-start gap-3">
                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c9a454]/45 bg-[#fffaf0] text-xs font-bold tabular-nums text-[#7a5e16]">
                                  {idx + 1}
                                </span>
                                <span className="pt-0.5 text-[15px] leading-snug text-slate-700">{task}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="mt-3 text-[15px] text-slate-500">Sin acciones clave en este bloque.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloque premium del Informe final: antes de documentación y "Tu siguiente paso FlyPath". */}
                {(() => {
                  const totalSchools = schools.length;
                  if (!plannerPremiumContentVisible) {
                    return (
                      <div className="relative overflow-hidden rounded-[28px] border-2 border-[#c9a454]/45 bg-gradient-to-br from-[#071226] via-[#0f1a33] to-[#152547] p-7 text-white shadow-[0_20px_56px_rgba(15,26,51,0.28)] ring-1 ring-[#c9a454]/25 sm:p-8">
                        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#c9a454]/10 blur-2xl" aria-hidden />
                        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6">
                          <div className="lg:col-start-1 lg:row-start-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Lock className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]">
                                ANÁLISIS PREMIUM
                              </span>
                              <span className="ml-auto inline-flex rounded-full border border-[#c9a454]/40 bg-[#c9a454]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f2ddaa]">
                                Exclusivo
                              </span>
                            </div>
                            <h3 className="mt-3 text-xl font-semibold leading-tight text-white sm:text-2xl">
                              Desbloquea el análisis premium de escuelas
                            </h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
                              El informe gratuito te orienta si puedes avanzar. El premium cruza tu perfil con las escuelas comparadas para decidir con más criterio antes de pagar matrícula o depósito.
                            </p>
                          </div>
                          <ul className="space-y-0.5 text-[15px] leading-relaxed text-slate-200 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
                            {[
                              "Recomendación FlyPath para tu perfil",
                              "Riesgo económico y documental por escuela",
                              "Comparación según tu presupuesto real",
                              "Preguntas clave antes de pagar matrícula",
                              "Próximos pasos adaptados a tu situación",
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
                          <button
                            type="button"
                            onClick={openPlannerSchoolsPremiumModal}
                            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_8px_24px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:w-auto lg:col-start-1 lg:row-start-2 lg:justify-self-start"
                          >
                            Desbloquear análisis premium
                          </button>
                        </div>
                      </div>
                    );
                  }

                  type AnalyzedSchool = (typeof schoolStats.analyzed)[number];

                  const howToStart: string[] =
                    route.recommended === "Modular"
                      ? [
                          "No empieces pagando una integrada completa.",
                          "Empieza por cerrar Clase 1, presupuesto real y escuelas con contrato claro.",
                          "Prioriza una ruta modular o integrada solo si la financiación y condiciones están cerradas.",
                        ]
                      : route.recommended === "Integrada"
                        ? [
                            "No transfieras matrícula sin contrato firmado y reembolso claro.",
                            "Cierra antes la financiación, el presupuesto realista y la Clase 1.",
                            "Confirma calendario de pagos por fases y qué tasas o extras quedan dentro del precio.",
                          ]
                        : [
                            "Aún no decidas escuela ni firmes ningún depósito.",
                            "Cierra primero Clase 1, inglés operativo y presupuesto realista.",
                            "Vuelve a comparar escuelas cuando tengas datos personales más sólidos.",
                          ];

                  const sortedByEncaje: AnalyzedSchool[] = [...schoolStats.analyzed].sort(
                    (a, b) => b.analysis.encajeGeneral - a.analysis.encajeGeneral,
                  );
                  const recommendedSchool = flypathSchoolRecommendation.school;
                  const recommendedItem: AnalyzedSchool | undefined = recommendedSchool
                    ? sortedByEncaje.find((x) => x.school.id === recommendedSchool.id)
                    : undefined;
                  const comparisonSchools: AnalyzedSchool[] = recommendedItem
                    ? [
                        recommendedItem,
                        ...sortedByEncaje.filter((x) => x.school.id !== recommendedItem.school.id).slice(0, 1),
                      ]
                    : sortedByEncaje.slice(0, 2);
                  const alternativeItem: AnalyzedSchool | undefined = recommendedItem
                    ? comparisonSchools.find((x) => x.school.id !== recommendedItem.school.id)
                    : undefined;

                  /** Por qué la recomendada va por delante: comparación 1:1 con la alternativa. */
                  const whyRecommendedAhead = (
                    rec: AnalyzedSchool,
                    alt: AnalyzedSchool | undefined,
                  ): string[] => {
                    const reasons: string[] = [];
                    if (rec.school.contratoAntesPagar === "si" && alt?.school.contratoAntesPagar !== "si") {
                      reasons.push("Contrato disponible antes de pagar.");
                    }
                    if (rec.school.calendarioPagosClaro === "si" && alt?.school.calendarioPagosClaro !== "si") {
                      reasons.push("Calendario de pagos más claro.");
                    }
                    if (rec.school.reembolsoClaro === "si" && alt?.school.reembolsoClaro !== "si") {
                      reasons.push("Política de reembolso más clara.");
                    }
                    const recVerified =
                      rec.school.estadoVerificacion === "verificado" ||
                      rec.school.estadoVerificacion === "parcialmente_verificado";
                    const altVerified =
                      !!alt &&
                      (alt.school.estadoVerificacion === "verificado" ||
                        alt.school.estadoVerificacion === "parcialmente_verificado");
                    if (recVerified && !altVerified) {
                      reasons.push("Datos con mejor nivel de verificación.");
                    }
                    if (alt && rec.analysis.encajeGeneral > alt.analysis.encajeGeneral) {
                      reasons.push("Opción más sólida frente a las alternativas añadidas.");
                    }
                    const unique = Array.from(new Set(reasons));
                    if (unique.length === 0) {
                      return ["Mejor resultado relativo dentro de las opciones comparadas."];
                    }
                    return unique.slice(0, 3);
                  };

                  /** Asignación de "Punto fuerte" por escuela con dedup: cada escuela intenta tener un
                   *  motivo único distinto. Si todas comparten el mismo dato, se permite repetir como
                   *  fallback. La recomendada (primer item) tiene prioridad de elección. */
                  const STRENGTH_OPTIONS: Array<{ test: (s: School) => boolean; label: string }> = [
                    { test: (s) => s.contratoAntesPagar === "si", label: "Contrato disponible antes de pagar." },
                    { test: (s) => s.reembolsoClaro === "si", label: "Reembolso más claro." },
                    { test: (s) => s.calendarioPagosClaro === "si", label: "Calendario de pagos definido." },
                    {
                      test: (s) => s.tasasIncluidas === "si" && s.skillTestsIncluidos === "si",
                      label: "Mejor claridad de extras.",
                    },
                    {
                      test: (s) =>
                        s.estadoVerificacion === "verificado" ||
                        s.estadoVerificacion === "parcialmente_verificado",
                      label: "Mejor evidencia documental.",
                    },
                  ];
                  const strengthByItem = new Map<number, string>();
                  {
                    const used = new Set<string>();
                    for (const item of comparisonSchools) {
                      const cand = STRENGTH_OPTIONS.find(
                        (opt) => opt.test(item.school) && !used.has(opt.label),
                      );
                      if (cand) {
                        strengthByItem.set(item.school.id, cand.label);
                        used.add(cand.label);
                      }
                    }
                    for (const item of comparisonSchools) {
                      if (strengthByItem.has(item.school.id)) continue;
                      const any = STRENGTH_OPTIONS.find((opt) => opt.test(item.school));
                      strengthByItem.set(
                        item.school.id,
                        any ? any.label : "Necesita más datos antes de valorar.",
                      );
                    }
                  }

                  const riskOf = (item: AnalyzedSchool): string =>
                    item.analysis.redFlags[0] ??
                    "No se detecta un riesgo principal con los datos actuales.";

                  const askOf = (item: AnalyzedSchool): string =>
                    item.analysis.preguntasPendientes[0] ??
                    "Pedir precio final, contrato y calendario por escrito.";

                  const lecturaFor = (isRec: boolean): string =>
                    isRec
                      ? "Empezaría por esta escuela, pero solo para pedir documentación. No es una señal para pagar todavía."
                      : "Mantenerla como alternativa, sin priorizarla hasta aclarar los puntos pendientes.";

                  const isRecommendedItem = (item: AnalyzedSchool): boolean =>
                    !!recommendedSchool && item.school.id === recommendedSchool.id;

                  const notReadyToPay = decisionReadiness.decision === "No estás listo para pagar";
                  const decisionPracticaText = notReadyToPay
                    ? "Decisión práctica: validar primero, no pagar todavía."
                    : "Decisión práctica: avanzar con validación, no con pago.";

                  const decisionBlock: { text: string; bullets: string[] } = (() => {
                    if (recommendedSchool && notReadyToPay) {
                      return {
                        text: `FlyPath no recomienda pagar todavía. La decisión razonable ahora es avanzar con ${recommendedSchool.nombre} como primera opción de validación, mantener la otra escuela como alternativa y pedir documentación antes de transferir dinero.`,
                        bullets: [
                          "No pagar matrícula ni depósito todavía.",
                          "Pedir precio final, contrato, reembolso y calendario por escrito.",
                          `Comparar la respuesta de ${recommendedSchool.nombre} con la alternativa antes de decidir.`,
                        ],
                      };
                    }
                    if (recommendedSchool) {
                      return {
                        text: `Puedes avanzar en la conversación con ${recommendedSchool.nombre}, pero solo si confirma por escrito las condiciones críticas.`,
                        bullets: [
                          "Validar documentación.",
                          "Confirmar coste final.",
                          "No decidir solo por precio anunciado.",
                        ],
                      };
                    }
                    return {
                      text: "FlyPath no puede priorizar una escuela todavía. La decisión correcta es completar datos antes de elegir.",
                      bullets: [
                        "Añadir o completar al menos 2 escuelas.",
                        "Pedir contrato, reembolso y calendario.",
                        "Recalcular el informe con datos confirmados.",
                      ],
                    };
                  })();

                  const actionForSchool = (item: AnalyzedSchool): string =>
                    item.analysis.preguntasPendientes[0] ??
                    "Pedir precio final, contrato, reembolso y calendario por escrito.";

                  const renderSectionLabel = (n: number, text: string) => (
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b5e1f]">
                      <span
                        aria-hidden
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#c9a454]/40 bg-[#c9a454]/15 text-[10px] tabular-nums text-[#7b5e1f]"
                      >
                        {n}
                      </span>
                      {text}
                    </p>
                  );

                  return (
                    <div className="overflow-hidden rounded-3xl border border-[#c9a454]/40 bg-gradient-to-br from-[#fffbf5] via-white to-[#fff8eb] shadow-[0_16px_48px_rgba(15,26,51,0.12)]">
                      <div className="relative border-b border-[#c9a454]/25 bg-gradient-to-br from-[#071226] via-[#0f1a33] to-[#152547] px-6 py-7 sm:px-8 sm:py-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2ddaa]/95">
                              INFORME PREMIUM FLYPATH
                            </p>
                            <h3 className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl">
                              Análisis premium de escuelas
                            </h3>
                            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-300">
                              Decisión aplicada a tu perfil, presupuesto y riesgo antes de pagar matrícula o depósito.
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center self-start rounded-full border border-[#c9a454]/40 bg-[#c9a454]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
                            Premium desbloqueado
                          </span>
                        </div>
                      </div>

                      <div className="space-y-7 bg-gradient-to-b from-white to-[#fffbf5] px-6 py-7 sm:px-8 sm:py-8">
                        {/* Veredicto FlyPath (top synthesis) */}
                        <section className="rounded-2xl border-2 border-[#c9a454]/55 bg-[#fff7e3] p-5 shadow-sm sm:p-6">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b5e1f]">
                            Veredicto FlyPath
                          </p>
                          {recommendedSchool ? (
                            <>
                              <p className="mt-2 text-xl font-bold leading-snug text-[#0f1a33] sm:text-2xl">
                                Opción más sólida ahora:{" "}
                                <span className="text-[#7b5e1f]">{recommendedSchool.nombre}</span>
                              </p>
                              <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                                Entre las escuelas que has añadido, {recommendedSchool.nombre} aparece más sólida para tu caso ahora mismo. Esto no significa que debas pagar todavía: significa que, con los datos actuales, es la opción que conviene validar primero.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mt-2 text-xl font-bold leading-snug text-[#0f1a33] sm:text-2xl">
                                No hay recomendación suficiente todavía.
                              </p>
                              <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                                Con los datos actuales no hay base suficiente para elegir una escuela concreta. Antes de pagar, necesitas completar información documental, económica y contractual.
                              </p>
                            </>
                          )}
                          <div className="mt-4 rounded-xl border border-[#c9a454]/45 bg-white/70 px-4 py-3">
                            <p className="text-[14px] font-semibold leading-snug text-[#7b5e1f]">
                              {decisionPracticaText}
                            </p>
                          </div>
                        </section>

                        {/* 1. Tu ruta recomendada */}
                        <section>
                          {renderSectionLabel(1, "Tu ruta recomendada")}
                          <p className="mt-2 text-lg font-bold leading-snug text-[#0f1a33] sm:text-xl">
                            Ruta: <span className="text-[#7b5e1f]">{route.recommended}</span>
                          </p>
                          <p className="mt-2 text-base leading-relaxed text-slate-700">
                            <span className="font-semibold text-slate-800">Por qué:</span> {route.reason}
                          </p>
                          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Cómo empezar
                            </p>
                            <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-slate-700">
                              {howToStart.map((item) => (
                                <li key={item} className="flex items-start gap-2.5">
                                  <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>

                        {/* 2. Opción prioritaria entre tus escuelas */}
                        <section className="rounded-2xl border-2 border-[#c9a454]/45 bg-white p-5 shadow-sm sm:p-6">
                          {renderSectionLabel(2, "Opción prioritaria entre tus escuelas")}
                          {recommendedSchool && recommendedItem ? (
                            <>
                              <p className="mt-3 text-lg font-bold leading-snug text-[#0f1a33] sm:text-xl">
                                Opción más sólida ahora:{" "}
                                <span className="text-[#7b5e1f]">{recommendedSchool.nombre}</span>
                              </p>
                              <div className="mt-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Por qué sale delante
                                </p>
                                <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-slate-700">
                                  {whyRecommendedAhead(recommendedItem, alternativeItem).map((reason) => (
                                    <li key={reason} className="flex items-start gap-2.5">
                                      <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" />
                                      <span>{reason}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                                {flypathSchoolRecommendation.reason}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mt-3 text-lg font-bold leading-snug text-[#0f1a33] sm:text-xl">
                                No hay recomendación todavía.
                              </p>
                              <p className="mt-3 text-base leading-relaxed text-slate-700">
                                {flypathSchoolRecommendation.reason}
                              </p>
                            </>
                          )}
                        </section>

                        {/* 3. Comparación directa */}
                        {comparisonSchools.length > 0 && (
                          <section>
                            {renderSectionLabel(3, "Comparación directa")}
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {comparisonSchools.map((item) => {
                                const isRec = isRecommendedItem(item);
                                const cardClasses = isRec
                                  ? "rounded-2xl border-2 border-[#c9a454]/45 bg-white p-4 shadow-sm sm:p-5"
                                  : "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5";
                                const roleBadgeClasses = isRec
                                  ? "inline-flex items-center rounded-full border border-[#c9a454]/45 bg-[#c9a454]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b5e1f]"
                                  : "inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600";
                                return (
                                  <div key={item.school.id} className={cardClasses}>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-base font-bold text-[#0f1a33]">{item.school.nombre}</p>
                                      {recommendedSchool && (
                                        <span className={roleBadgeClasses}>
                                          {isRec ? "Opción más sólida ahora" : "Alternativa a validar"}
                                        </span>
                                      )}
                                    </div>
                                    <dl className="mt-3 space-y-2.5 text-[15px] leading-relaxed">
                                      <div>
                                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                          Punto fuerte
                                        </dt>
                                        <dd className="mt-0.5 text-slate-700">
                                          {strengthByItem.get(item.school.id) ?? "Necesita más datos antes de valorar."}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                          Riesgo principal
                                        </dt>
                                        <dd className="mt-0.5 text-slate-700">{riskOf(item)}</dd>
                                      </div>
                                      <div>
                                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                          Qué pedir
                                        </dt>
                                        <dd className="mt-0.5 text-slate-700">{askOf(item)}</dd>
                                      </div>
                                    </dl>
                                    {recommendedSchool && (
                                      <p className="mt-4 border-t border-slate-100 pt-3 text-[13px] leading-relaxed text-[#7b5e1f]">
                                        <span className="font-semibold uppercase tracking-wide">Lectura FlyPath:</span>{" "}
                                        <span className="text-slate-700">{lecturaFor(isRec)}</span>
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {totalSchools < 2 && (
                              <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
                                Añade al menos 2 escuelas comparables para una comparación directa más útil.
                              </p>
                            )}
                          </section>
                        )}

                        {/* 4. Decisión FlyPath */}
                        <section className="rounded-2xl border border-[#c9a454]/35 bg-[#fffdf8] p-5 sm:p-6">
                          {renderSectionLabel(4, "Decisión FlyPath")}
                          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                            {decisionBlock.text}
                          </p>
                          <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-slate-700">
                            {decisionBlock.bullets.map((text) => (
                              <li key={text} className="flex items-start gap-2.5">
                                <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" />
                                <span>{text}</span>
                              </li>
                            ))}
                          </ul>
                        </section>

                        {/* 5. Acción recomendada con cada escuela */}
                        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                          {renderSectionLabel(5, "Acción recomendada con cada escuela")}
                          {recommendedSchool && comparisonSchools.length > 0 ? (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {comparisonSchools.map((item) => {
                                const isRec = isRecommendedItem(item);
                                const priorityLabel = isRec ? "Validar primero" : "Mantener como alternativa";
                                const priorityClasses = isRec
                                  ? "inline-flex items-center rounded-full border border-[#c9a454]/45 bg-[#c9a454]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b5e1f]"
                                  : "inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600";
                                const cardClasses = isRec
                                  ? "rounded-2xl border-2 border-[#c9a454]/40 bg-white p-4 sm:p-5"
                                  : "rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5";
                                return (
                                  <div key={item.school.id} className={cardClasses}>
                                    <p className="text-base font-bold text-[#0f1a33]">{item.school.nombre}</p>
                                    <div className="mt-2.5 flex items-center gap-2">
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Prioridad:
                                      </span>
                                      <span className={priorityClasses}>{priorityLabel}</span>
                                    </div>
                                    <div className="mt-3">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        Acción
                                      </p>
                                      <p className="mt-0.5 text-[15px] leading-relaxed text-slate-700">
                                        {actionForSchool(item)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                              Añade al menos 2 escuelas comparables para ver la acción recomendada con cada una.
                            </p>
                          )}
                        </section>

                        <div className="border-t border-slate-200/90 bg-slate-50/60 px-1 py-4 sm:px-2">
                          <p className="text-xs leading-relaxed text-slate-500">
                            Este análisis no sustituye la confirmación oficial de la escuela. Úsalo como filtro de decisión antes de comprometer dinero.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,26,51,0.04)] sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Documentación</p>
                  <p className="mt-1 text-base font-semibold text-[#0f1a33]">
                    {plannerPremiumContentVisible
                      ? "Guardar o compartir informe premium"
                      : "Guardar o compartir informe"}
                  </p>
                  <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                    {plannerPremiumContentVisible
                      ? "Descarga tu informe premium con análisis de escuelas, recomendación FlyPath y próximos pasos personalizados."
                      : "Descarga tu informe gratuito o compártelo con tu familia antes de tomar una decisión."}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled={premiumPdfExporting || freePdfExporting}
                      onClick={async () => {
                        if (plannerPremiumContentVisible) {
                          if (premiumPdfExporting) return;
                          setPremiumPdfExporting(true);
                          try {
                            const { downloadPremiumCareerReportPdf } =
                              await import("@/lib/premiumCareerReportPdf");
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
                          return;
                        }
                        if (freePdfExporting) return;
                        setFreePdfExporting(true);
                        try {
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
                      }}
                      className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm sm:w-auto"
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
                      onClick={async () => {
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
                        }
                      }}
                      className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      Descargar resumen para padres
                    </button>
                  </div>
                </div>

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
            })()}
        </PlannerMainCanvas>
      </CareerPlannerAppShell>
      <PlannerSchoolsPremiumModal
        open={plannerSchoolsPremiumModalOpen}
        onClose={() => setPlannerSchoolsPremiumModalOpen(false)}
        onUnlockClick={() => showToast("Pago FlyPath próximamente")}
      />
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
