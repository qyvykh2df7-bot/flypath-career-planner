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
  Languages,
  LayoutList,
  Lock,
  Mail,
  Menu,
  MessagesSquare,
  Plane,
  Route,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import type { FlyPathInformePdfInput, FlyPathResumenPadresPdfInput } from "@/lib/flypathReportPdf";
import { getSchoolBySlug } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";
import { useQaPremiumMode } from "@/hooks/useQaPremiumMode";
import { canSeePremiumForDevQa } from "@/lib/qaPremiumMode";

type Screen = "landing" | "onboarding" | "dashboard";
export type Tab = "route" | "cost" | "schools" | "report";
type YesNoUnknown = "si" | "no" | "no_se";

type Profile = {
  nombre: string;
  edad: number;
  pais: string;
  situacionLaboral: "estudiante" | "trabajando" | "desempleado" | "otro";
  objetivo: "aerolinea" | "ejecutivo" | "instructor" | "no_lo_se";
  class1: "si" | "no" | "reservado";
  class2: "si" | "no";
  ingles: "bajo" | "medio" | "alto";
  icaoLevel: "0" | "4" | "5" | "6" | "no_lo_se";
  preocupacionIngles: "si" | "no";
  dineroDisponible: number;
  ahorroMensual: number;
  financiacion: "confirmada" | "posible" | "no";
  apoyoFamiliar: "si" | "no" | "parcial";
  inversionMaxima: number;
  toleranciaRiesgo: "baja" | "media" | "alta";
  disponibilidad: "full-time" | "part-time";
  horasSemana: number;
  necesitaTrabajar: "si" | "no";
  movilidad: "solo_espana" | "europa" | "mundial";
  urgencia: "baja" | "media" | "alta";
  /** Origen de la estimación de costes en onboarding; condiciona copy en tab Costes. */
  costEstimateSource: "flypath_base" | "user_approx";
};

type CostInputs = {
  ppl: number;
  nightRating: number;
  atplTheory: number;
  hourBuilding: number;
  cpl: number;
  mep: number;
  ir: number;
  mccJoc: number;
  advancedUprt: number;
  class1Medical: number;
  tasasExamenes: number;
  skillTests: number;
  equipo: number;
  headset: number;
  ipadAppsCartas: number;
  uniformeMaterial: number;
  repeticiones: number;
  typeRatingOpcional: number;
  alojamiento: number;
  transporte: number;
  comida: number;
  otrosGastosVida: number;
  bufferPct: number;
};

type School = {
  id: number;
  isExample?: boolean;
  nombre: string;
  pais: string;
  ciudad: string;
  programa: "integrado" | "modular" | "cadet" | "no_lo_se";
  precioAnunciado: number;
  duracionMeses: number;
  depositoRequerido: number;
  calendarioPagosClaro: YesNoUnknown;
  mccIncluido: YesNoUnknown;
  uprtIncluido: YesNoUnknown;
  tasasIncluidas: YesNoUnknown;
  skillTestsIncluidos: YesNoUnknown;
  alojamientoIncluido: YesNoUnknown;
  reembolsoClaro: YesNoUnknown;
  contratoAntesPagar: YesNoUnknown;
  flotaExplicada: YesNoUnknown;
  mantenimientoExplicado: YesNoUnknown;
  ratioAlumnoAvionConocido: YesNoUnknown;
  permiteHablarAlumnos: YesNoUnknown;
  careerSupport: YesNoUnknown;
  promesasEmpleo: "ninguna" | "vagas" | "claras_no_garantizadas" | "garantia_contractual" | "no_se";
  fuentePrecio:
    | "web_oficial"
    | "email_escuela"
    | "llamada"
    | "folleto"
    | "alumno"
    | "redes"
    | "usuario"
    | "no_verificado";
  fechaActualizacion: string;
  estadoVerificacion: "verificado" | "parcialmente_verificado" | "no_verificado" | "pendiente";
  enlaceReferencia: string;
  notas: string;
};

type RouteAnalysis = {
  integrated: number;
  modular: number;
  prep: number;
  recommended: "Integrada" | "Modular" | "Preparación";
  reason: string;
  warnings: string[];
  conflicts: string[];
  principalBlock: string;
};

type DecisionReadiness = {
  score: number;
  decision: "No estás listo para pagar" | "Puedes seguir investigando, pero no pagar" | "Listo para decidir con condiciones";
  explanation: string;
  bloqueosCriticos: string[];
  faltanDatos: string[];
  proximosPasos: string[];
  showNoPaguesBadge: boolean;
};

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

const disclaimerText =
  "FlyPath Career Planner ofrece orientación educativa y herramientas de planificación basadas en los datos introducidos por el usuario. No sustituye asesoramiento financiero, médico, legal ni información oficial de escuelas, autoridades o aerolíneas. Los costes son estimaciones y pueden variar.";

function mapRiskRowsForInformePdf(
  riskDiagnosis: { label: string; nivel: string; explicacion: string; accion: string }[]
): FlyPathInformePdfInput["riskRows"] {
  return riskDiagnosis.map((risk) => {
    const label =
      risk.label === "Riesgo de marketing/promesas"
        ? "Riesgo comercial/marketing"
        : risk.label === "Riesgo de timing"
          ? "Riesgo de calendario"
          : risk.label;
    const accion =
      risk.accion === "Pedir por escrito alcance real de career support y límites."
        ? "Pedir por escrito el alcance real del apoyo laboral y cualquier promesa comercial."
        : risk.accion;
    return { label, nivel: risk.nivel, explicacion: risk.explicacion, accion };
  });
}

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

function riesgosSimpleParaPadresPdf(
  riskDiagnosis: { label: string; nivel: string; explicacion: string }[]
): string {
  const altos = riskDiagnosis.filter((r) => r.nivel === "Alto" || r.nivel === "Crítico");
  if (altos.length === 0) {
    return "No hay riesgos marcados como altos o críticos en este escenario. Aun así, conviene validar por escrito contrato, precio final, extras incluidos y política de reembolso antes de pagar.";
  }
  return altos
    .map((r) => {
      const label =
        r.label === "Riesgo de marketing/promesas"
          ? "Comercial o promesas exageradas"
          : r.label === "Riesgo de timing"
            ? "Calendario y plazos"
            : r.label;
      return `${label} (${r.nivel.toLowerCase()}): ${r.explicacion}`;
    })
    .join(" ");
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

function computeRoute(profile: Profile): RouteAnalysis {
  let integrated = 35;
  let modular = 40;
  let prep = 25;
  const warnings: string[] = [];
  const conflicts: string[] = [];

  if (profile.edad < 18) {
    prep += 40;
    warnings.push("Perfil menor de edad: priorizar preparación y madurez operativa.");
  }
  if (profile.class1 !== "si") {
    prep += 45;
    integrated -= 20;
    warnings.push("Prioridad: confirma Clase 1 antes de comparar escuelas.");
  }
  if (profile.ingles === "bajo") {
    prep += 25;
    modular += 8;
    integrated -= 10;
    warnings.push("Inglés bajo: requiere preparación previa o ruta modular con condición.");
  }
  if (profile.dineroDisponible < 30000 && profile.financiacion === "no") {
    prep += 35;
    integrated -= 20;
    warnings.push("Presupuesto bajo y sin financiación confirmada.");
  }
  if (profile.necesitaTrabajar === "si") {
    modular += 20;
    integrated -= 20;
  }
  if (
    profile.dineroDisponible >= 70000 &&
    profile.class1 === "si" &&
    profile.ingles === "alto" &&
    profile.disponibilidad === "full-time"
  ) {
    integrated += 35;
  }
  if (profile.urgencia === "alta" && profile.necesitaTrabajar === "si") {
    conflicts.push("Quieres rapidez alta, pero necesitas trabajar durante la formación.");
  }
  if (profile.edad > 30 && profile.dineroDisponible >= 50000) {
    warnings.push("No se penaliza la edad; enfoca la decisión en coste de oportunidad.");
    integrated += 5;
  }
  if (profile.disponibilidad === "part-time") {
    modular += 8;
  } else {
    integrated += 8;
  }

  integrated = clamp(integrated);
  modular = clamp(modular);
  prep = clamp(prep);

  const ordered = [
    { key: "Integrada", score: integrated },
    { key: "Modular", score: modular },
    { key: "Preparación", score: prep },
  ].sort((a, b) => b.score - a.score);

  const recommended = ordered[0].key as RouteAnalysis["recommended"];
  const reasonMap: Record<RouteAnalysis["recommended"], string> = {
    Integrada: "Encaja por capacidad financiera y disponibilidad full-time.",
    Modular: "Encaja por flexibilidad y control de caja por fases.",
    "Preparación": "Ayuda a reducir riesgo antes de comprometer pagos altos.",
  };

  const principalBlock =
    profile.class1 !== "si"
      ? "Clase 1 no confirmada"
      : profile.ingles === "bajo"
      ? "Inglés operativo insuficiente"
      : profile.financiacion === "no" && profile.dineroDisponible < 30000
      ? "Brecha financiera crítica"
      : "Ningún bloqueo crítico";

  return { integrated, modular, prep, recommended, reason: reasonMap[recommended], warnings, conflicts, principalBlock };
}

function computeCosts(costs: CostInputs, profile: Profile) {
  const subtotalFormacion =
    costs.ppl + (costs.nightRating ?? 3000) + costs.atplTheory + costs.hourBuilding + costs.cpl + costs.mep + costs.ir + costs.mccJoc + costs.advancedUprt;
  const subtotalExtras =
    costs.class1Medical +
    costs.tasasExamenes +
    costs.skillTests +
    costs.headset +
    costs.ipadAppsCartas +
    costs.uniformeMaterial +
    costs.repeticiones +
    costs.typeRatingOpcional;
  const subtotalVida = costs.alojamiento + costs.transporte + costs.comida + costs.otrosGastosVida;
  const subtotalBase = subtotalFormacion + subtotalExtras + subtotalVida;
  const buffer = Math.round((subtotalBase * costs.bufferPct) / 100);

  const totalOptimista = Math.round(subtotalBase * 0.9);
  const totalRealista = subtotalBase + buffer;
  const totalConservador = Math.round(subtotalBase * 1.2);
  const brechaFinanciacion = Math.max(0, totalRealista - profile.dineroDisponible);
  const mesesCerrarBrecha = brechaFinanciacion > 0 && profile.ahorroMensual > 0 ? Math.ceil(brechaFinanciacion / profile.ahorroMensual) : 0;
  const coverage = totalRealista > 0 ? Math.round((profile.dineroDisponible / totalRealista) * 100) : 0;

  let riskScore = 20;
  if (coverage < 25) riskScore += 45;
  else if (coverage < 50) riskScore += 25;
  else if (coverage < 75) riskScore += 10;
  if (profile.financiacion === "no") riskScore += 20;
  if (profile.toleranciaRiesgo === "baja") riskScore += 8;
  if (costs.bufferPct < 12) riskScore += 8;
  riskScore = clamp(riskScore);

  const riesgoFinanciero =
    riskScore >= 80 ? "Crítico" : riskScore >= 60 ? "Alto" : riskScore >= 40 ? "Medio" : "Bajo";

  return {
    subtotalFormacion,
    subtotalExtras,
    subtotalVida,
    buffer,
    totalOptimista,
    totalRealista,
    totalConservador,
    brechaFinanciacion,
    mesesCerrarBrecha,
    coverage,
    riskScore,
    riesgoFinanciero,
  };
}

function yesScore(value: YesNoUnknown, yes = 10, no = -6, unknown = -2) {
  if (value === "si") return yes;
  if (value === "no") return no;
  return unknown;
}

function schoolAnalysis(school: School, totalRealista: number) {
  let claridadCoste = 30 + (school.precioAnunciado > 0 ? 10 : -10) + yesScore(school.calendarioPagosClaro, 12, -10, -3);
  claridadCoste += yesScore(school.tasasIncluidas, 8, -5, -2) + yesScore(school.skillTestsIncluidos, 7, -4, -2);

  let transparencia = 30;
  transparencia += yesScore(school.contratoAntesPagar, 12, -10, -4);
  transparencia += yesScore(school.reembolsoClaro, 10, -8, -3);
  transparencia += yesScore(school.flotaExplicada, 8, -5, -2);
  transparencia += yesScore(school.mantenimientoExplicado, 8, -5, -2);
  transparencia += yesScore(school.ratioAlumnoAvionConocido, 8, -5, -2);

  let riesgoFinanciero = 60;
  riesgoFinanciero -= yesScore(school.calendarioPagosClaro, 10, -8, -2);
  riesgoFinanciero -= yesScore(school.reembolsoClaro, 10, -8, -2);
  if (school.precioAnunciado > totalRealista * 1.15) riesgoFinanciero += 15;
  if (school.estadoVerificacion === "no_verificado") riesgoFinanciero += 10;

  let riesgoOperacional = 55;
  riesgoOperacional -= yesScore(school.flotaExplicada, 8, -8, -3);
  riesgoOperacional -= yesScore(school.mantenimientoExplicado, 8, -8, -3);
  riesgoOperacional -= yesScore(school.ratioAlumnoAvionConocido, 8, -6, -3);

  let riesgoMarketing = 55;
  if (school.promesasEmpleo === "garantia_contractual") riesgoMarketing += 5;
  if (school.promesasEmpleo === "vagas") riesgoMarketing += 10;
  if (school.promesasEmpleo === "ninguna") riesgoMarketing -= 5;
  if (school.fuentePrecio === "no_verificado" || school.fuentePrecio === "redes") riesgoMarketing += 10;

  const verificacion =
    school.estadoVerificacion === "verificado"
      ? 85
      : school.estadoVerificacion === "parcialmente_verificado"
      ? 60
      : school.estadoVerificacion === "pendiente"
      ? 35
      : 20;

  claridadCoste = clamp(claridadCoste);
  transparencia = clamp(transparencia);
  riesgoFinanciero = clamp(riesgoFinanciero);
  riesgoOperacional = clamp(riesgoOperacional);
  riesgoMarketing = clamp(riesgoMarketing);

  const encajeGeneral = clamp(
    Math.round((claridadCoste + transparencia + (100 - riesgoFinanciero) + (100 - riesgoOperacional) + (100 - riesgoMarketing) + verificacion) / 6)
  );

  const redFlags: string[] = [];
  if (school.calendarioPagosClaro !== "si") redFlags.push("Calendario de pagos no claro.");
  if (school.contratoAntesPagar !== "si") redFlags.push("Contrato no confirmado antes del pago.");
  if (school.reembolsoClaro !== "si") redFlags.push("Política de reembolso poco clara.");
  if (school.estadoVerificacion !== "verificado") redFlags.push("Información insuficiente.");

  const preguntasPendientes: string[] = [];
  if (school.tasasIncluidas !== "si") preguntasPendientes.push("Confirmar tasas de examen.");
  if (school.skillTestsIncluidos !== "si") preguntasPendientes.push("Confirmar coste de skill tests.");
  if (school.mccIncluido !== "si") preguntasPendientes.push("Aclarar MCC/JOC.");
  if (school.uprtIncluido !== "si") preguntasPendientes.push("Aclarar Advanced UPRT.");

  let recomendacionPrudente = "no decidir aún";
  if (claridadCoste >= 70 && transparencia >= 70 && verificacion >= 60) recomendacionPrudente = "buena claridad documental";
  else if (verificacion < 50) recomendacionPrudente = "requiere confirmación";
  else recomendacionPrudente = "riesgo por falta de datos";

  return {
    claridadCoste,
    transparencia,
    riesgoFinanciero,
    riesgoOperacional,
    riesgoMarketing,
    verificacion,
    encajeGeneral,
    redFlags,
    preguntasPendientes,
    recomendacionPrudente,
  };
}

function computeDecisionReadiness({
  profile,
  costs,
  route,
  schoolsAnalyzed,
  bufferPct,
}: {
  profile: Profile;
  costs: ReturnType<typeof computeCosts>;
  route: RouteAnalysis;
  schoolsAnalyzed: Array<{ school: School; analysis: ReturnType<typeof schoolAnalysis> }>;
  bufferPct: number;
}): DecisionReadiness {
  let score = 100;
  const bloqueosCriticos: string[] = [];
  const faltanDatos: string[] = [];

  const verifiedOrPartial = schoolsAnalyzed.filter(
    (x) => x.school.estadoVerificacion === "verificado" || x.school.estadoVerificacion === "parcialmente_verificado"
  );

  // 1. Replace anyVaguePromises with hasAnySchool
  const hasAnySchool = schoolsAnalyzed.length > 0;
  // More robust and transparent logic for payment-clear schools
  const paymentClearSchools = schoolsAnalyzed.filter(
    (x) =>
      x.school.contratoAntesPagar === "si" &&
      x.school.reembolsoClaro === "si" &&
      x.school.calendarioPagosClaro === "si"
  );
  const hasPaymentClearSchool = paymentClearSchools.length > 0;

  // 1.5. Add usableSchools block after paymentClearSchools
  const usableSchools = schoolsAnalyzed.filter(
    (x) =>
      x.school.precioAnunciado > 0 &&
      x.school.contratoAntesPagar === "si" &&
      x.school.reembolsoClaro === "si" &&
      x.school.calendarioPagosClaro === "si"
  );

  const hasPaymentReadySchool = paymentClearSchools.some(
    (x) => x.school.estadoVerificacion === "verificado" || x.school.estadoVerificacion === "parcialmente_verificado"
  );

  // 2. Add new blocks
  const hasFullyCostedSchool = schoolsAnalyzed.some(
    (x) =>
      x.school.mccIncluido === "si" &&
      x.school.uprtIncluido === "si" &&
      x.school.tasasIncluidas === "si" &&
      x.school.skillTestsIncluidos === "si"
  );

  const hasLowMarketingRiskSchool = schoolsAnalyzed.some(
    (x) => x.school.promesasEmpleo === "ninguna" || x.school.promesasEmpleo === "claras_no_garantizadas"
  );

  if (profile.class1 !== "si") {
    score -= 45;
    bloqueosCriticos.push("Class 1 no confirmado.");
  }

  if (profile.ingles === "bajo") {
    score -= 18;
    faltanDatos.push("Condición previa: mejorar inglés operativo.");
  } else if (profile.ingles === "medio") {
    score -= 8;
  }

  if (costs.brechaFinanciacion > costs.totalRealista * 0.4) {
    score -= 25;
    if (profile.financiacion !== "confirmada") {
      bloqueosCriticos.push("Brecha financiera alta respecto al coste realista.");
    } else {
      faltanDatos.push("Brecha financiera alta, aunque hay financiación confirmada.");
    }
  } else if (costs.brechaFinanciacion > costs.totalRealista * 0.2) {
    score -= 12;
  }

  if (profile.financiacion !== "confirmada" && costs.coverage < 70) {
    score -= 25;
    bloqueosCriticos.push("Bloqueo financiero: cobertura < 70% y financiación no confirmada.");
  }

  if (bufferPct < 12) {
    score -= 10;
    faltanDatos.push("El margen de seguridad de costes es bajo; conviene subirlo por encima del 12%.");
  }

  if (schoolsAnalyzed.length === 0) {
    score -= 20;
    faltanDatos.push("No hay escuelas comparadas.");
  } else if (schoolsAnalyzed.length < 2) {
    score -= 6;
    faltanDatos.push("Comparar al menos 2 escuelas para decidir con criterio.");
  }

  if (verifiedOrPartial.length === 0 && usableSchools.length === 0) {
    score -= hasPaymentClearSchool ? 6 : 14;
    faltanDatos.push("Falta al menos una escuela con datos verificados o suficientemente documentados.");
  } else if (verifiedOrPartial.length === 0 && usableSchools.length > 0) {
    score -= 2;
    faltanDatos.push("La escuela parece suficientemente documentada, pero conviene conservar evidencia por escrito.");
  }

  if (schoolsAnalyzed.length > 0 && !hasPaymentClearSchool) {
    score -= 15;
    faltanDatos.push("Falta al menos una escuela con contrato, reembolso y calendario de pagos claros.");
  } else if (hasPaymentClearSchool && !hasPaymentReadySchool) {
    score -= 4;
    const clearSchoolNames = paymentClearSchools.map((x) => x.school.nombre).filter(Boolean).join(", ");
    faltanDatos.push(
      `${clearSchoolNames || "Una escuela"} ya tiene contrato, reembolso y calendario claros; falta marcarla como verificada o parcialmente verificada.`
    );
  }

  // 4. Replace vague promises block
  if (hasAnySchool && !hasLowMarketingRiskSchool) {
    score -= 6;
    faltanDatos.push("Falta una escuela con promesas comerciales claras y no garantizadas.");
  }

  // 5. Replace anyCriticalMissing block
  if (hasAnySchool && !hasFullyCostedSchool) {
    score -= 8;
    // No longer push the legacy generic message here; granular message will be handled below.
    // (Score penalty remains.)
  }

  // Accommodation is useful for budgeting, but it is not a critical readiness blocker.
  const hasAccommodationInfo = schoolsAnalyzed.some((x) => x.school.alojamientoIncluido === "si" || x.school.alojamientoIncluido === "no");

  if (route.conflicts.some((c) => c.includes("rapidez"))) {
    score -= 8;
    faltanDatos.push("Conflicto actual entre urgencia y necesidad de trabajar.");
  }

  // Remove any critical blockers related to documentation issues before clamping score
  const nonCriticalSchoolWarnings = [
    "Bloqueo documental",
    "contrato/reembolso/calendario",
    "Faltan datos verificados",
    "datos verificados o parcialmente verificados",
  ];

  const filteredCriticalBlockers = bloqueosCriticos.filter(
    (item) => !nonCriticalSchoolWarnings.some((warning) => item.includes(warning))
  );
  bloqueosCriticos.splice(0, bloqueosCriticos.length, ...filteredCriticalBlockers);

  // Remove "Falta al menos una escuela con contrato, reembolso y calendario de pagos claros." if we actually have one (safety cleanup)
  if (hasPaymentClearSchool) {
    const missingPaymentText = "Falta al menos una escuela con contrato, reembolso y calendario de pagos claros.";
    for (let i = faltanDatos.length - 1; i >= 0; i -= 1) {
      if (faltanDatos[i] === missingPaymentText) faltanDatos.splice(i, 1);
    }
  }
  // Remove legacy generic extras text if present (cleanup). The app should now show granular missing items instead.
  const legacyGenericExtrasFragments = [
    "Faltan datos críticos: MCC/UPRT/tasas/skill tests/alojamiento",
    "MCC/UPRT/tasas/skill tests/alojamiento",
  ];
  for (let i = faltanDatos.length - 1; i >= 0; i -= 1) {
    if (legacyGenericExtrasFragments.some((fragment) => faltanDatos[i]?.includes(fragment))) {
      faltanDatos.splice(i, 1);
    }
  }

  // 4. Safety cleanup for obsolete school verification steps if at least 2 usableSchools
  if (usableSchools.length >= 2) {
    const obsoleteSchoolVerificationSteps = [
      "Actualizar escenarios con costes verificados o parcialmente verificados de al menos 2 escuelas.",
      "Falta al menos una escuela con datos verificados o parcialmente verificados.",
    ];
    for (let i = faltanDatos.length - 1; i >= 0; i -= 1) {
      if (obsoleteSchoolVerificationSteps.some((text) => faltanDatos[i]?.includes(text))) {
        faltanDatos.splice(i, 1);
      }
    }
  }

  // Add granular message for missing included items, only if actually missing and not already present.
  const granularMissingIncludedItems = [
    !schoolsAnalyzed.some((x) => x.school.mccIncluido === "si") ? "MCC/JOC" : null,
    !schoolsAnalyzed.some((x) => x.school.uprtIncluido === "si") ? "Advanced UPRT" : null,
    !schoolsAnalyzed.some((x) => x.school.tasasIncluidas === "si") ? "tasas" : null,
    !schoolsAnalyzed.some((x) => x.school.skillTestsIncluidos === "si") ? "skill tests" : null,
    // alojamiento intentionally omitted as not critical for readiness
  ].filter(Boolean) as string[];

  const granularIncludedText = granularMissingIncludedItems.length
    ? `Falta confirmar como incluido: ${granularMissingIncludedItems.join(", ")}.`
    : null;

  const alreadyHasGranularIncludedText = faltanDatos.some((item) => item.startsWith("Falta confirmar como incluido:"));
  if (granularIncludedText && !alreadyHasGranularIncludedText) {
    faltanDatos.push(granularIncludedText);
  }

  // 7. Make sure the score rewards having at least one good school instead of being dragged down by every incomplete/demo school.
  // (This is achieved by the logic above: only penalize if NO school meets the good criteria, not for every incomplete one)

  score = clamp(score);

  const hasHardPersonalBlocker =
    profile.class1 !== "si" ||
    (profile.financiacion !== "confirmada" && costs.coverage < 70) ||
    (profile.financiacion !== "confirmada" && costs.brechaFinanciacion > costs.totalRealista * 0.4);

  const showNoPaguesBadge = hasHardPersonalBlocker;

  let decision: DecisionReadiness["decision"];
  if (hasHardPersonalBlocker || score < 50) {
    decision = "No estás listo para pagar";
  } else if (score < 75) {
    decision = "Puedes seguir investigando, pero no pagar";
  } else {
    decision = "Listo para decidir con condiciones";
  }

  const explanationMap: Record<DecisionReadiness["decision"], string> = {
    "No estás listo para pagar":
      "El riesgo actual es demasiado alto para pagar matrícula, depósito o firmar condiciones. Primero hay que resolver bloqueos y datos críticos.",
    "Puedes seguir investigando, pero no pagar":
      "Puedes seguir comparando escuelas y completando datos, pero todavía no hay base suficiente para comprometer pagos.",
    "Listo para decidir con condiciones":
      "La base de decisión es más sólida, siempre que conserves contrato, precio final, extras incluidos, reembolso y calendario de pagos por escrito.",
  };

  const proximosPasos: string[] = [];

  if (!hasPaymentClearSchool) {
    proximosPasos.push("Confirmar por escrito contrato, reembolso y calendario de pagos con al menos una escuela.");
  } else if (!hasPaymentReadySchool) {
    proximosPasos.push("Marcar como verificada o parcialmente verificada la escuela que ya tiene contrato, reembolso y calendario claros.");
  }

  if (schoolsAnalyzed.length < 2) {
    proximosPasos.push("Comparar al menos 2 escuelas antes de tomar una decisión final.");
  } else if (usableSchools.length < 2) {
    proximosPasos.push("Completar precio, contrato, reembolso y calendario de pagos en al menos 2 escuelas.");
  }

  if (granularMissingIncludedItems.length > 0) {
    proximosPasos.push(`Confirmar por escrito si están incluidos: ${granularMissingIncludedItems.join(", ")}.`);
  }


  if (proximosPasos.length === 0) {
    proximosPasos.push("Confirmar por escrito contrato, reembolso y calendario de pagos antes de transferir dinero.");
    proximosPasos.push("Guardar evidencia por escrito de precio final, extras incluidos y condiciones de pago.");
    proximosPasos.push("No transferir depósito hasta validar todos los datos críticos y conservar copia de las condiciones.");
  }

  // Safety cleanup: avoid surfacing legacy step texts.
  const legacySteps = [
    "Guardar evidencia por escrito de precio final, extras incluidos y condiciones de pago.",
    "No transferir depósito hasta validar todos los datos críticos y conservar copia de las condiciones.",
  ];
  for (let i = proximosPasos.length - 1; i >= 0; i -= 1) {
    if (legacySteps.includes(proximosPasos[i])) proximosPasos.splice(i, 1);
  }

  if (decision === "Listo para decidir con condiciones") {
    proximosPasos.splice(
      0,
      proximosPasos.length,
      "Confirmar por escrito contrato, reembolso y calendario de pagos antes de transferir dinero.",
      "Guardar evidencia por escrito de precio final, extras incluidos y condiciones de pago.",
      "No transferir depósito hasta validar todos los datos críticos y conservar copia de las condiciones."
    );
  }

  return {
    score,
    decision,
    explanation: explanationMap[decision],
    bloqueosCriticos,
    faltanDatos,
    proximosPasos,
    showNoPaguesBadge,
  };
}

function buildActionPlan({
  profile,
  costs,
  route,
  schools,
  decisionReadiness,
}: {
  profile: Profile;
  costs: ReturnType<typeof computeCosts>;
  route: RouteAnalysis;
  schools: School[];
  decisionReadiness: DecisionReadiness;
}) {
  const sevenDays: string[] = [];
  const thirtyDays: string[] = [];
  const ninetyDays: string[] = [];

  const pushUnique = (bucket: string[], text: string) => {
    if (!bucket.includes(text)) bucket.push(text);
  };

  const hasPaymentClearSchool = schools.some(
    (school) =>
      school.contratoAntesPagar === "si" &&
      school.reembolsoClaro === "si" &&
      school.calendarioPagosClaro === "si"
  );

  const hasTwoDocumentedSchools =
    schools.filter(
      (school) =>
        school.precioAnunciado > 0 &&
        school.contratoAntesPagar === "si" &&
        school.reembolsoClaro === "si" &&
        school.calendarioPagosClaro === "si"
    ).length >= 2;

  const missingExtras: string[] = [];
  if (!schools.some((school) => school.mccIncluido === "si")) missingExtras.push("MCC/JOC");
  if (!schools.some((school) => school.uprtIncluido === "si")) missingExtras.push("Advanced UPRT");
  if (!schools.some((school) => school.tasasIncluidas === "si")) missingExtras.push("tasas");
  if (!schools.some((school) => school.skillTestsIncluidos === "si")) missingExtras.push("skill tests");
  if (!schools.some((school) => school.alojamientoIncluido === "si")) missingExtras.push("alojamiento");

  if (profile.class1 !== "si") {
    pushUnique(sevenDays, "Reservar o confirmar Clase 1 antes de comprometer pagos.");
    pushUnique(thirtyDays, "No firmar matrícula ni depósito hasta tener el resultado médico claro.");
    pushUnique(ninetyDays, "Recalcular ruta cuando el Class 1 esté confirmado.");
  } else {
    pushUnique(sevenDays, "Guardar evidencia de Clase 1 y fecha de validez.");
  }

  if (profile.ingles === "bajo") {
    pushUnique(sevenDays, "Hacer una prueba realista de inglés aeronáutico y general.");
    pushUnique(thirtyDays, "Crear un plan intensivo de inglés antes de iniciar fases caras.");
    pushUnique(ninetyDays, "Reevaluar nivel de inglés antes de pagar una fase avanzada.");
  } else if (profile.ingles === "medio") {
    pushUnique(thirtyDays, "Practicar inglés aeronáutico y comunicaciones ATC semanalmente.");
  }

  if (costs.brechaFinanciacion > 0) {
    pushUnique(sevenDays, "Actualizar presupuesto máximo y brecha financiera real.");
    pushUnique(thirtyDays, "Cerrar financiación o ajustar ruta antes de comprometer pagos grandes.");
    pushUnique(ninetyDays, "Mantener un margen de seguridad financiero antes de avanzar a fases caras.");
  } else {
    pushUnique(sevenDays, "Confirmar que el dinero disponible cubre también extras y un margen de seguridad financiero.");
    pushUnique(ninetyDays, "Mantener reserva para repeticiones, tasas y retrasos.");
  }

  if (schools.length < 2) {
    pushUnique(sevenDays, "Añadir al menos 2 escuelas comparables.");
    pushUnique(thirtyDays, "Pedir desglose por escrito a cada escuela candidata.");
  } else {
    pushUnique(sevenDays, "Revisar puntos a validar de las escuelas comparadas.");
    pushUnique(thirtyDays, "Confirmar por escrito contrato, reembolso y calendario de pagos.");
  }

  if (!hasPaymentClearSchool) {
    pushUnique(sevenDays, "Pedir contrato, política de reembolso y calendario de pagos antes de decidir.");
  }

  if (route.recommended === "Preparación") {
    pushUnique(thirtyDays, "Resolver bloqueos principales antes de elegir escuela.");
    pushUnique(ninetyDays, "Recalcular ruta cuando Clase 1, inglés y financiación estén más claros.");
  } else if (route.recommended === "Modular") {
    pushUnique(thirtyDays, "Comparar escenarios modular e integrado con el mismo coste total.");
    pushUnique(ninetyDays, "Planificar fases por orden y evitar pagos adelantados innecesarios.");
  } else if (route.recommended === "Integrada") {
    pushUnique(thirtyDays, "Validar que la ruta integrada encaja con disponibilidad full-time y financiación.");
    pushUnique(ninetyDays, "No avanzar con integrada sin contrato completo y calendario de pagos por escrito.");
  }

  if (profile.necesitaTrabajar === "si") {
    pushUnique(thirtyDays, "Alinear la ruta con el trabajo actual y horas reales disponibles por semana.");
  }

  if (decisionReadiness.decision === "Listo para decidir con condiciones") {
    pushUnique(sevenDays, "Preparar carpeta con contrato, precio final, extras incluidos y condiciones.");
    pushUnique(thirtyDays, "Comparar la escuela elegida con al menos una alternativa real antes de pagar.");
    pushUnique(ninetyDays, "Transferir dinero solo si todas las condiciones finales están por escrito.");
  }

  if (schools.length >= 2 && !hasTwoDocumentedSchools) {
    pushUnique(thirtyDays, "Completar precio, contrato, reembolso y calendario de pagos en al menos 2 escuelas.");
  }

  if (missingExtras.length > 0) {
    pushUnique(thirtyDays, `Confirmar por escrito si están incluidos: ${missingExtras.join(", ")}.`);
  }

  return {
    sevenDays: sevenDays.slice(0, 4),
    thirtyDays: thirtyDays.slice(0, 4),
    ninetyDays: ninetyDays.slice(0, 4),
  };
}

function getSchoolEmailMissingData(school: School) {
  const pending: string[] = [];
  if (school.mccIncluido !== "si") pending.push("MCC/JOC");
  if (school.uprtIncluido !== "si") pending.push("Advanced UPRT");
  if (school.tasasIncluidas !== "si") pending.push("tasas de examen");
  if (school.skillTestsIncluidos !== "si") pending.push("skill tests");
  if (school.alojamientoIncluido !== "si") pending.push("alojamiento y costes aproximados");
  if (school.reembolsoClaro !== "si") pending.push("política de reembolso");
  if (school.contratoAntesPagar !== "si") pending.push("contrato/condiciones antes de pagar");
  if (school.calendarioPagosClaro !== "si") pending.push("calendario de pagos");
  if (school.flotaExplicada !== "si") pending.push("flota disponible");
  if (school.mantenimientoExplicado !== "si") pending.push("mantenimiento y disponibilidad");
  if (school.ratioAlumnoAvionConocido !== "si") pending.push("ratio alumno/avión");
  if (school.permiteHablarAlumnos !== "si") pending.push("contacto con alumnos actuales o antiguos");
  if (school.promesasEmpleo === "vagas") pending.push("detalle real de apoyo laboral (sin garantía de empleo)");
  if (school.estadoVerificacion !== "verificado") pending.push("confirmación oficial de precio y condiciones");
  return pending;
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

function riskLevelFromScore(score: number) {
  if (score >= 80) return "Crítico";
  if (score >= 60) return "Alto";
  if (score >= 40) return "Medio";
  return "Bajo";
}

type FlyPathProductId = "guia" | "mentoria" | "ingles" | "atpl";

const FLYPATH_PRODUCT_TOAST = "Producto FlyPath próximamente";

const FLYPATH_PRIMARY_IMAGE: Record<FlyPathProductId, string> = {
  guia: "/como-ser-piloto-cover.jpeg",
  mentoria: "/mentoria-flypath.jpg",
  ingles: "/ingles-aeronautico.jpg",
  atpl: "/atpl-planner.jpg",
};

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
  profile,
  route,
  decisionReadiness,
  schools,
  costInputs,
  onProductCta,
}: {
  profile: Profile;
  route: { recommended: "Integrada" | "Modular" | "Preparación"; principalBlock: string };
  decisionReadiness: { decision: string; faltanDatos: string[] };
  schools: { length: number };
  costInputs: { atplTheory: number };
  onProductCta: () => void;
}) {
  const products: Record<
    FlyPathProductId,
    { title: string; body: string; cta: string }
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
      title: "Inglés aeronáutico",
      body: "Trabaja inglés operativo, comunicaciones y confianza antes de avanzar a fases críticas.",
      cta: "Ver clases de inglés",
    },
    atpl: {
      title: "ATPL Planner",
      body: "Organiza asignaturas, horas semanales, repasos y exámenes con un plan realista.",
      cta: "Ver ATPL Planner",
    },
  };

  /**
   * Prioridad explícita para el producto principal (sin puntuaciones numéricas).
   * Logs: quitar `DEBUG_FLYPATH_NEXT_STEPS` y el `console.log` cuando ya no hagan falta.
   */
  const DEBUG_FLYPATH_NEXT_STEPS = process.env.NODE_ENV === "development";

  const isInitial =
    profile.class1 !== "si" ||
    route.recommended === "Preparación" ||
    profile.objetivo === "no_lo_se";

  const totallyInitial = isInitial && schools.length === 0;

  const englishFirst =
    profile.ingles === "bajo" ||
    (profile.preocupacionIngles === "si" && !totallyInitial);

  const sigSchools = schools.length > 0;
  const sigUrgent = profile.urgencia === "alta";
  const sigMoney = profile.dineroDisponible >= 45000;
  const sigInv = profile.inversionMaxima >= 90000;
  const sigData = decisionReadiness.faltanDatos.length >= 2;
  const sigInvestigateWithSchools =
    decisionReadiness.decision === "Puedes seguir investigando, pero no pagar" && sigSchools;

  const mentoriaSignalCount = [
    sigSchools,
    sigUrgent,
    sigMoney,
    sigInv,
    sigData,
    sigInvestigateWithSchools,
  ].filter(Boolean).length;

  const mentoriaWins = !isInitial && sigSchools && mentoriaSignalCount >= 2;

  const atplCandidate =
    profile.class1 === "si" &&
    profile.ingles !== "bajo" &&
    costInputs.atplTheory > 0 &&
    profile.objetivo !== "no_lo_se" &&
    route.recommended !== "Preparación";

  const strongPaymentBlock =
    sigSchools &&
    decisionReadiness.decision === "No estás listo para pagar" &&
    (sigData || mentoriaSignalCount >= 3);

  let primary: FlyPathProductId;
  const primaryReasons: string[] = [];

  if (englishFirst) {
    primary = "ingles";
    primaryReasons.push(
      "PRIORIDAD 1 inglés: bajo, o preocupación fuera de fase totalmente inicial (sin Class1 / Preparación / objetivo no claro y sin escuelas)",
    );
  } else if (mentoriaWins) {
    primary = "mentoria";
    primaryReasons.push(
      `PRIORIDAD 3 mentoría: perfil no inicial, hay escuelas y ${mentoriaSignalCount}/6 señales de decisión o pago cercano (la decisión de readiness no cuenta como señal)`,
    );
  } else if (atplCandidate && !strongPaymentBlock) {
    primary = "atpl";
    primaryReasons.push(
      "PRIORIDAD 4 ATPL: Class1, inglés suficiente, teoría ATPL en costes, ruta no solo preparación, sin bloqueo fuerte de pago con escuelas",
    );
  } else if (isInitial || schools.length === 0) {
    primary = "guia";
    primaryReasons.push(
      "PRIORIDAD 2 guía: perfil inicial (Class1 pendiente, Preparación u objetivo no claro) o aún sin escuelas candidatas",
    );
  } else {
    primary = "guia";
    primaryReasons.push("Fallback: guía (sin señal clara de inglés, mentoría ni ATPL)");
  }

  if (DEBUG_FLYPATH_NEXT_STEPS) {
    console.log("[FlyPath siguiente paso]", {
      primary,
      motivos: primaryReasons,
      class1: profile.class1,
      objetivo: profile.objetivo,
      ingles: profile.ingles,
      preocupacionIngles: profile.preocupacionIngles,
      routeRecommended: route.recommended,
      schoolsCount: schools.length,
      readiness: decisionReadiness.decision,
      urgencia: profile.urgencia,
      inversionMaxima: profile.inversionMaxima,
      dineroDisponible: profile.dineroDisponible,
      atplTheory: costInputs.atplTheory,
      isInitial,
      totallyInitial,
      englishFirst,
      mentoriaSignalCount,
      mentoriaWins,
      atplCandidate,
      strongPaymentBlock,
    });
  }

  const fallbackOrder: FlyPathProductId[] = ["guia", "mentoria", "ingles", "atpl"];
  const orderedFull: FlyPathProductId[] = [primary, ...fallbackOrder.filter((id) => id !== primary)];
  const ordered = orderedFull.slice(0, 4);
  const secondaryIds = ordered.slice(1);

  const primaryCtaClass =
    "inline-flex min-h-[40px] w-full min-w-0 max-w-[min(100%,22rem)] cursor-pointer items-center justify-center self-stretch rounded-xl bg-[#c9a454] px-5 py-2.5 text-base font-semibold text-[#0f1a33] shadow-md transition hover:bg-[#ddb75c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:min-w-[13.5rem] sm:w-auto sm:self-start sm:px-7";

  const secondaryCtaClass =
    "inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-white/[0.12] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

  const renderCard = (id: FlyPathProductId, isPrimary: boolean) => {
    const p = products[id];

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
              <button type="button" onClick={onProductCta} className={`${primaryCtaClass} mt-3`}>
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
            <button type="button" onClick={onProductCta} className={`${secondaryCtaClass} mt-auto shrink-0 pt-3`}>
              {p.cta}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-[#c9a454]/35 bg-gradient-to-br from-[#0f1a33] via-[#121f3d] to-[#152547] px-5 py-5 text-white shadow-[0_12px_36px_rgba(15,26,51,0.16)] ring-1 ring-[#c9a454]/20 sm:px-6 sm:py-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2ddaa]/90 sm:text-[11px]">Profundiza con FlyPath</p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">Tu siguiente paso FlyPath</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-200/95">
          El diagnóstico te da una dirección. Ahora elige el siguiente paso según lo que más te está bloqueando.
        </p>
      </div>
      <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-3.5">
        {renderCard(primary, true)}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3">
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
  initialTab?: Tab;
};

export function FlyPathApp({ reviewMode = false, initialTab = "route" }: FlyPathAppProps) {
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

  const [screen, setScreen] = useState<Screen>(reviewMode ? "dashboard" : "landing");
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
  const [dashboardMobileNavOpen, setDashboardMobileNavOpen] = useState(false);
  const [plannerSchoolsPremiumModalOpen, setPlannerSchoolsPremiumModalOpen] = useState(false);
  /** Landing header: intenta /flypath-logo-white.png y luego /flypath-logo.png vía onError en la imagen. */
  const [landingHeaderLogoPhase, setLandingHeaderLogoPhase] = useState<"white" | "plain" | "fallback">("white");
  const [landingGuideCoverAvailable, setLandingGuideCoverAvailable] = useState(false);
  const [landingHeroBgPhotoSrc, setLandingHeroBgPhotoSrc] = useState<string | null>(null);
  const [landingModuleMenuOpen, setLandingModuleMenuOpen] = useState(false);
  const [cameFromSchoolsComparator, setCameFromSchoolsComparator] = useState(false);
  const landingModuleMenuRef = useRef<HTMLDivElement>(null);

  const { qaPremiumMode, toggleQaPremium } = useQaPremiumMode();
  // Misma clave localStorage que el comparador (`flypath_qa_premium_mode`).
  // Futuros bloques premium del Informe final: reutilizar `plannerPremiumContentVisible`.
  const premiumUnlockedPlanner = false;
  const plannerPremiumContentVisible = canSeePremiumForDevQa(
    premiumUnlockedPlanner,
    qaPremiumMode,
  );

  useEffect(() => {
    if (screen !== "landing") setLandingModuleMenuOpen(false);
  }, [screen]);

  useEffect(() => {
    if (screen !== "landing" || !landingModuleMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = landingModuleMenuRef.current;
      if (el && !el.contains(e.target as Node)) setLandingModuleMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [screen, landingModuleMenuOpen]);

  useEffect(() => {
    if (screen !== "dashboard") setDashboardMobileNavOpen(false);
  }, [screen]);

  useEffect(() => {
    setDashboardMobileNavOpen(false);
  }, [tab]);

  useEffect(() => {
    if (tab !== "schools") setPlannerSchoolsPremiumModalOpen(false);
  }, [tab]);

  useEffect(() => {
    if (schools.length < 2) setPlannerSchoolsPremiumModalOpen(false);
  }, [schools.length]);

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
    setManualFormOpen(count === 0);
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
        // decidimos cuando NO hay deep-link: dashboard si onboarding está hecho, landing si no.
        const params = new URLSearchParams(window.location.search);
        const isSchoolsComparatorSource = params.get("source") === "schools-comparator";
        const reviewParam = params.get("review");
        if (!isSchoolsComparatorSource && reviewParam !== "dashboard") {
          setScreen(done ? "dashboard" : "landing");
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
    const requestedTab = params.get("tab") as Tab | null;
    const validTabs: Tab[] = ["route", "cost", "schools", "report"];

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
      if (requestedTab && validTabs.includes(requestedTab)) {
        setTab(requestedTab);
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
    } else if (startParam === "onboarding" || (isSchoolsComparatorSource && !onboardingDone)) {
      setScreen("onboarding");
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
  }, [reviewMode, initialTab]);

  useEffect(() => {
    if (screen !== "landing") return;
    setLandingHeaderLogoPhase("white");
    let cancelled = false;

    void (async () => {
      setLandingGuideCoverAvailable(false);
      setLandingHeroBgPhotoSrc(null);
      try {
        const res = await fetch("/como-ser-piloto-cover.jpeg", { method: "HEAD" });
        if (!cancelled && res.ok) setLandingGuideCoverAvailable(true);
      } catch {
        /* sin portada en public */
      }
      if (cancelled) return;
      try {
        const res = await fetch("/hero-aircraft.jpg", { method: "HEAD" });
        if (!cancelled && res.ok) setLandingHeroBgPhotoSrc("/hero-aircraft.jpg");
      } catch {
        /* sin imagen en public */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [screen]);

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

  const schoolStats = useMemo(() => {
    const analyzed = schools.map((s) => ({ school: s, analysis: schoolAnalysis(s, costs.totalRealista) }));
    const verifiedCount = analyzed.filter((x) => x.school.estadoVerificacion === "verificado").length;
    const pendingCount = analyzed.filter((x) => x.school.estadoVerificacion === "pendiente").length;
    const viable = analyzed
      .filter((x) => x.analysis.verificacion >= 60 && x.analysis.claridadCoste >= 60)
      .sort((a, b) => b.analysis.encajeGeneral - a.analysis.encajeGeneral);
    return { analyzed, verifiedCount, pendingCount, bestSchool: viable[0] || null };
  }, [schools, costs.totalRealista]);

  /** Recomendación FlyPath unificada: hero Escuelas + Informe final premium (Conclusión de decisión).
   *  Regla: con 2+ escuelas siempre devolvemos la mejor relativa. Las señales documentales solo matizan
   *  el texto explicativo, no bloquean la recomendación. */
  const flypathSchoolRecommendation = useMemo(() => {
    const candidates = [...schoolStats.analyzed].sort(
      (a, b) => b.analysis.encajeGeneral - a.analysis.encajeGeneral,
    );
    const best = candidates[0];

    if (!best || candidates.length < 2) {
      return {
        school: null as School | null,
        reason:
          "Añade al menos 2 escuelas comparables para que FlyPath pueda cruzar tu perfil con opciones reales.",
      };
    }

    const hasEnoughDocumentSignal =
      best.school.contratoAntesPagar === "si" ||
      best.school.reembolsoClaro === "si" ||
      best.school.calendarioPagosClaro === "si" ||
      best.school.estadoVerificacion === "verificado" ||
      best.school.estadoVerificacion === "parcialmente_verificado";

    if (best.analysis.encajeGeneral >= 60 && hasEnoughDocumentSignal) {
      return {
        school: best.school,
        reason:
          "Con los datos actuales, esta escuela es la opción más sólida dentro de las escuelas añadidas. Aun así, la recomendación depende de confirmar precio, contrato, reembolso y calendario antes de pagar.",
      };
    }

    return {
      school: best.school,
      reason:
        "Con los datos actuales, esta escuela es la opción más sólida dentro de las escuelas añadidas, pero la recomendación no es suficiente para pagar todavía. Faltan condiciones clave por confirmar: contrato, reembolso, calendario de pagos, coste final o extras incluidos.",
    };
  }, [schoolStats.analyzed]);

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

  const riskDiagnosis = useMemo(() => {
    const bestAnalysis = schoolStats.bestSchool?.analysis;
    const escuelaDataRiskScore = bestAnalysis ? Math.round((100 - bestAnalysis.verificacion + (100 - bestAnalysis.transparencia)) / 2) : 75;
    const marketingRiskScore = bestAnalysis ? bestAnalysis.riesgoMarketing : 70;
    const timingRiskScore = route.conflicts.length > 0 ? 75 : 35;

    return [
      {
        label: "Riesgo médico",
        nivel: profile.class1 === "si" ? "Bajo" : profile.class1 === "reservado" ? "Medio" : "Crítico",
        explicacion: profile.class1 === "si" ? "Clase 1 confirmada." : "Clase 1 no confirmada para avanzar con seguridad.",
        accion: "Confirmar Clase 1 antes de firmar o transferir dinero.",
      },
      {
        label: "Riesgo financiero",
        nivel: costs.riesgoFinanciero,
        explicacion: `Cobertura actual del ${costs.coverage}% sobre el escenario realista.`,
        accion: "Reducir brecha, confirmar financiación y mantener un margen de seguridad financiero.",
      },
      {
        label: "Riesgo de inglés",
        nivel: profile.ingles === "alto" ? "Bajo" : profile.ingles === "medio" ? "Medio" : "Alto",
        explicacion: profile.ingles === "alto" ? "Nivel funcional para progresar." : "Puede impactar ritmo y rendimiento formativo.",
        accion: "Definir plan de mejora y validar objetivo ICAO.",
      },
      {
        label: "Riesgo documental",
        nivel: riskLevelFromScore(escuelaDataRiskScore),
        explicacion: `${schoolStats.verifiedCount} escuela(s) verificadas de ${schools.length}.`,
        accion: "Exigir confirmación documental de costes y condiciones.",
      },
      {
        label: "Riesgo de marketing/promesas",
        nivel: riskLevelFromScore(marketingRiskScore),
        explicacion: bestAnalysis ? "Evaluación sobre promesas y transparencia comercial." : "Falta evidencia documental suficiente.",
        accion: "Pedir por escrito alcance real de career support y límites.",
      },
      {
        label: "Riesgo de timing",
        nivel: riskLevelFromScore(timingRiskScore),
        explicacion: route.conflicts[0] || "No se detecta conflicto fuerte de timing.",
        accion: "Alinear urgencia, disponibilidad y necesidad de trabajar.",
      },
    ];
  }, [profile.class1, profile.ingles, costs.riesgoFinanciero, costs.coverage, schoolStats.bestSchool, schoolStats.verifiedCount, schools.length, route.conflicts]);

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
    setTab("route");
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
  const goToDashboardTab = (nextTab: Tab) => {
    setTab(nextTab);
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

  const navItems: Array<{ id: Tab; label: string }> = [
    { id: "route", label: "Planificador de ruta" },
    { id: "cost", label: "Costes" },
    { id: "schools", label: "Escuelas" },
    { id: "report", label: "Informe final" },
  ];

  const stepMeta: Record<number, { title: string; desc: string }> = {
    1: { title: "Perfil", desc: "Define tu punto de partida profesional." },
    2: { title: "Medical e inglés", desc: "Valida bloqueos operativos críticos." },
            3: { title: "Presupuesto", desc: "Alinea capacidad económica y riesgo." },
    4: { title: "Disponibilidad", desc: "Calcula ritmo realista de progreso." },
    5: {
      title: "Escuelas",
      desc: "No necesitas tener datos exactos ahora. Podrás comparar escuelas reales más adelante desde el Planner.",
    },
            6: { title: "Resultado inicial", desc: "Visualiza recomendación y brechas." },
  };

  if (screen === "landing") {
    const gotoExample = () => setScreen(onboardingCompleted ? "dashboard" : "onboarding");
    const gotoDiagnosis = () => {
      if (onboardingCompleted) {
        setScreen("dashboard");
        setTab("route");
      } else {
        setScreen("onboarding");
        setOnboardingStep(1);
      }
    };

    const flypathPlatformModules = [
      { id: "inicio", label: "Inicio", status: "available" as const, href: "/" },
      { id: "guia", label: "Guía Cómo ser piloto", status: "available" as const, href: "/guia-como-ser-piloto" },
      { id: "planifica", label: "Planifica tu ruta", status: "available" as const, href: "/" },
      { id: "compara", label: "Compara escuelas", status: "available" as const, href: "/schools" },
      { id: "opiniones", label: "Opiniones de escuelas", status: "available" as const, href: "/opiniones-escuelas" },
      { id: "atpl", label: "ATPL Planner", status: "soon" as const },
      { id: "ingles", label: "Inglés aeronáutico", status: "available" as const, href: "/ingles-aeronautico" },
      { id: "clases", label: "Clases PPL/ATPL", status: "available" as const, href: "/clases-ppl-atpl" },
      { id: "mentorias", label: "Mentorías", status: "available" as const, href: "/mentorias" },
      { id: "shop", label: "Shop", status: "available" as const, href: "/shop" },
      { id: "blog", label: "Blog", status: "soon" as const },
    ];

    return (
      <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
        <style jsx global>{globalButtonFeedbackStyles}</style>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-3 top-3 z-[60] inline-flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg sm:right-5 sm:top-5 sm:max-w-none sm:flex-nowrap">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            {toast}
          </motion.div>
        )}

        <header className="border-b border-white/10 bg-[#0f1a33] text-white shadow-[0_12px_40px_rgba(15,26,51,0.35)]">
          <div className="mx-auto flex max-h-[90px] max-w-7xl items-center justify-between gap-3 px-6 py-3 sm:gap-4 md:justify-normal md:gap-4 lg:px-10">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none md:min-w-0 md:flex-1 md:justify-start">
              {landingHeaderLogoPhase !== "fallback" ? (
                <div className="relative flex h-12 max-h-[60px] w-[180px] shrink-0 items-center sm:h-[54px] sm:max-h-[58px] sm:w-[220px] md:max-h-[60px] md:w-[252px] lg:w-[268px]">
                  <Image
                    key={landingHeaderLogoPhase}
                    src={landingHeaderLogoPhase === "white" ? "/flypath-logo-white.png" : "/flypath-logo.png"}
                    alt="FlyPath"
                    width={540}
                    height={162}
                    className="h-auto max-h-12 w-auto max-w-full object-contain object-left sm:max-h-[54px] md:max-h-[58px] lg:max-h-[60px]"
                    priority
                    onError={() =>
                      setLandingHeaderLogoPhase((prev) => (prev === "white" ? "plain" : "fallback"))
                    }
                  />
                </div>
              ) : (
                <>
                  {/* No se ha encontrado logo real en /public. Añadir flypath-logo-white.png. */}
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a454]/15 ring-1 ring-[#c9a454]/35">
                      <Plane className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">FlyPath Career Planner</p>
                      <p className="truncate text-sm text-white/60">Diagnóstico antes de elegir escuela</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <p
              className="pointer-events-none hidden min-w-0 select-none truncate text-center text-sm font-medium tracking-[0.14em] text-[#f2ddaa]/90 md:flex md:flex-1 md:items-center md:justify-center"
              aria-hidden
            >
              Planifica tu Ruta
            </p>
            <div ref={landingModuleMenuRef} className="relative shrink-0 md:flex md:min-w-0 md:flex-1 md:justify-end">
              <button
                type="button"
                onClick={() => setLandingModuleMenuOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white transition-colors hover:border-white/24 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a454]/55"
                aria-expanded={landingModuleMenuOpen}
                aria-haspopup="listbox"
                aria-label="Menú de módulos FlyPath Platform"
              >
                <Menu className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
              </button>
              {landingModuleMenuOpen ? (
                <ul
                  role="listbox"
                  className="absolute right-0 z-20 mt-2 max-h-[calc(100vh-120px)] w-[min(22rem,calc(100vw-2rem))] max-w-[min(96vw,26rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white px-1.5 py-2 shadow-[0_24px_52px_rgba(15,26,51,0.11),0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/45"
                >
                  {flypathPlatformModules.map((m) => {
                    const isSoon = m.status === "soon";
                    // En la landing actual, el módulo "vivo" es Planifica tu ruta
                    // (Inicio y Planifica apuntan ambos a `/`, pero la home muestra
                    // el flujo del Planner, no un dashboard de Inicio). Marcamos
                    // ese item como ACTUAL con el mismo estilo dorado/crema que
                    // usa `Compara escuelas` en `/schools`.
                    const isCurrent = m.id === "planifica";
                    const hasHref = "href" in m && typeof m.href === "string" && m.href.length > 0;
                    const isClickable = hasHref || isSoon;
                    return (
                      <li key={m.id} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isCurrent}
                          aria-disabled={false}
                          onClick={() => {
                            setLandingModuleMenuOpen(false);
                            if (hasHref && m.href) {
                              router.push(m.href);
                              return;
                            }
                            if (isSoon) {
                              showToast("Próximamente");
                            }
                          }}
                          className={`flex w-full items-center justify-between gap-8 rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                            isClickable ? "cursor-pointer" : "cursor-not-allowed"
                          } ${isCurrent ? "bg-[#fff8e8]" : ""}`}
                        >
                          <span
                            className={`min-w-0 flex-1 truncate text-[0.9375rem] font-medium leading-snug ${
                              isSoon ? "text-slate-500" : isCurrent ? "text-[#7a5a16]" : "text-slate-700"
                            }`}
                          >
                            {m.label}
                          </span>
                          {isSoon ? (
                            <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                              Próximamente
                            </span>
                          ) : isCurrent ? (
                            <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a5802a]">
                              Actual
                            </span>
                          ) : (
                            <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                              Disponible
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-[#f7f9fc] to-[#f4f7fb]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.98)_0%,rgba(243,246,252,0.65)_38%,rgba(232,240,250,0.45)_58%,rgba(201,164,84,0.09)_82%,rgba(201,164,84,0.13)_100%),radial-gradient(ellipse_90%_70%_at_92%_18%,rgba(201,164,84,0.14),transparent_52%),radial-gradient(ellipse_70%_55%_at_12%_72%,rgba(15,26,51,0.06),transparent_50%),radial-gradient(ellipse_at_50%_100%,rgba(15,26,51,0.04),transparent_45%)]" />
            {landingHeroBgPhotoSrc ? (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 hidden bg-cover bg-[position:center_80%] lg:block"
                  style={{
                    backgroundImage: `url(${landingHeroBgPhotoSrc})`,
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.10)_40%,rgba(255,255,255,0.06)_100%)] lg:bg-[radial-gradient(ellipse_68%_118%_at_12%_40%,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.48)_36%,rgba(255,255,255,0.14)_56%,rgba(255,255,255,0.04)_70%,transparent_80%),linear-gradient(90deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.42)_18%,rgba(255,255,255,0.18)_36%,rgba(255,255,255,0.07)_54%,rgba(255,255,255,0.02)_74%,rgba(255,255,255,0)_100%)]"
                />
              </>
            ) : null}
            <div className="relative z-[1] mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-4 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-10 lg:pb-[3.875rem] lg:pt-5">
              <div className="relative isolate before:pointer-events-none before:absolute before:inset-y-0 before:-left-8 before:-z-10 before:w-[min(118%,52rem)] before:bg-[linear-gradient(90deg,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.52)_22%,rgba(255,255,255,0.24)_44%,rgba(255,255,255,0.08)_66%,rgba(255,255,255,0.02)_82%,transparent_100%)] before:content-[''] lg:before:-left-12 lg:before:w-[min(125%,56rem)]">
                <p className="inline-flex max-w-xl mt-3 -translate-y-6 rounded-full border border-[#c9a454]/32 bg-white/88 px-6 py-2 text-[14px] font-medium leading-tight tracking-wide text-[#7a5a16] shadow-[0_2px_14px_rgba(15,26,51,0.055),0_1px_6px_rgba(201,164,84,0.07)] sm:mt-0 sm:px-7 sm:py-2 sm:text-[15px]">
                  FlyPath Career Planner
                </p>
                <h1 className="mt-px text-4xl font-semibold leading-[1.08] tracking-tight text-[#0f1a33] md:text-5xl lg:text-[2.75rem] xl:text-6xl">
                  Antes de pagar una escuela de vuelo, entiende tu ruta, tus costes y tus riesgos.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                  Haz un diagnóstico inicial de tu situación antes de elegir escuela: ruta recomendada, coste realista, análisis de escuelas candidatas, riesgos principales y próximos pasos para decidir con menos margen de error.
                </p>
                <div className="mt-8 flex w-full max-w-xl justify-start">
                  <button
                    type="button"
                    onClick={gotoDiagnosis}
                    className="landing-cta-primary inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl px-10 py-4 text-base font-semibold shadow-md sm:w-auto sm:min-h-[56px] sm:min-w-[270px] md:min-w-[288px] md:py-[15px] md:text-[17px]"
                  >
                    Crear mi diagnóstico
                    <ArrowRight className="landing-arrow h-5 w-5 shrink-0 transition-transform duration-150 md:h-[1.3rem] md:w-[1.3rem]" />
                  </button>
                </div>
                <p className="mt-8 max-w-md text-[15px] leading-relaxed text-slate-400">
                  Orientación educativa. No sustituye información oficial de escuelas, médicos, bancos o autoridades.
                </p>
              </div>

              <div className="relative z-[1] lg:justify-self-end lg:translate-y-5">
                <div className="absolute -right-6 -top-6 hidden h-36 w-52 rounded-[100%] bg-[#c9a454]/18 blur-3xl lg:block" aria-hidden />
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_36px_100px_rgba(15,26,51,0.13),0_12px_36px_rgba(201,164,84,0.08)] ring-1 ring-[#0f1a33]/[0.06]">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#0f1a33] to-[#152547] px-5 py-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">EJEMPLO DE RESULTADO</p>
                      <p className="mt-0.5 text-sm font-semibold text-white">Así se vería tu diagnóstico</p>
                    </div>
                    <span className="rounded-full border border-[#c9a454]/40 bg-[#c9a454]/15 px-3 py-1 text-[11px] font-semibold text-[#f2ddaa]">V1</span>
                  </div>
                  <div className="space-y-4 bg-gradient-to-b from-white to-slate-50/40 p-6">
                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm">
                      {[
                        { label: "Ruta", pct: 78 },
                        { label: "Coste", pct: 64 },
                        { label: "Datos", pct: 41 },
                      ].map((m) => (
                        <div key={m.label} className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#c9a454] to-[#e8c97a]"
                              style={{ width: `${m.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ruta recomendada</p>
                      <p className="mt-1 text-lg font-semibold text-[#0f1a33]">
                        Modular / <span className="text-[#7a5a16]">Preparación</span>
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Prioriza cerrar bloqueos antes de pagos altos y avanza por fases con mejor control del riesgo.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,26,51,0.06)]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Coste realista</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[#0f1a33]">62.400&nbsp;€</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Optimista</span>
                            <span className="tabular-nums text-slate-700">58k</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-[55%] rounded-full bg-slate-300/90" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Conservador</span>
                            <span className="tabular-nums text-slate-700">71k</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-[88%] rounded-full bg-[#c9a454]/45" />
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">Incluye formación, extras frecuentes y margen prudente.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,26,51,0.06)]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">¿Listo para pagar?</p>
                        <p className="mt-1 text-sm font-semibold leading-snug text-[#b45309]">No estás listo para pagar</p>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-medium text-slate-500">
                            <span>Nivel de decisión</span>
                            <span className="tabular-nums text-slate-700">42%</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-amber-400 to-amber-600/90" />
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">Faltan datos por escrito y condiciones claras antes del depósito.</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#c9a454]/35 bg-gradient-to-br from-[#fffdf8] to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(201,164,84,0.12)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">Siguiente paso</p>
                          <p className="mt-1 text-base font-semibold text-[#0f1a33]">Revisar costes y escuelas candidatas</p>
                        </div>
                        <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f1a33] text-[#f2ddaa] shadow-md sm:flex" aria-hidden>
                          <Compass className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#c9a454] to-[#f0c96b]" />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-600">Progreso del diagnóstico: datos clave recogidos, pendientes de contrato y financiación.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-hero-strip border-b border-[#c9a454]/20 bg-[#0f1a33] py-5 md:py-6">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
                {[
                  { label: "Antes de pedir precio", text: "Entiende tu ruta" },
                  { label: "Antes de elegir escuela", text: "Analiza tus opciones" },
                  { label: "Antes de pagar matrícula", text: "Detecta riesgos" },
                ].map((strip) => (
                  <div
                    key={strip.label}
                    className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[2px] md:rounded-3xl md:px-5 md:py-3.5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e8d5a3]/95 sm:text-[11px]">{strip.label}</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-white sm:text-base">{strip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200/80 bg-[#f8fafc] py-12 lg:py-14">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <h2 className="text-3xl font-semibold tracking-tight text-[#0f1a33] md:text-4xl">Cómo funciona</h2>
              <p className="mt-3 max-w-2xl text-base text-slate-600">Tres pasos claros: datos, diagnóstico y qué hacer después.</p>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {[
                  {
                    step: "1",
                    title: "Introduce tus datos",
                    text: "Perfil, médico e inglés, presupuesto, disponibilidad y escuelas candidatas en minutos.",
                  },
                  {
                    step: "2",
                    title: "Revisa tu diagnóstico",
                    text: "Ruta recomendada, coste realista, análisis de escuelas candidatas, nivel de decisión y riesgos antes de comprometer dinero.",
                  },
                  {
                    step: "3",
                    title: "Decide tu siguiente paso",
                    text: "Plan corto plazo e informe para contrastar con familia, escuela o asesor antes de firmar.",
                  },
                ].map((block) => (
                  <div key={block.step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,26,51,0.06)]">
                    <div className="flex gap-4">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0f1a33] text-sm font-bold text-[#f2ddaa] shadow-md">
                        {block.step}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-[#0f1a33]">{block.title}</h3>
                        <p className="mt-2 text-base leading-relaxed text-slate-600">{block.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200/80 bg-[#f1f5f9]/85 py-12 lg:py-14">
            <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
              <div className="max-w-5xl">
                <h2 className="text-3xl font-semibold tracking-tight text-[#0f1a33] md:text-4xl">
                  Diseñado para quienes están antes de tomar una decisión importante.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  Si estás empezando, comparando escuelas, a punto de pagar matrícula o intentando explicarlo en casa, el Career Planner te ayuda a ordenar la decisión antes de comprometer dinero.
                </p>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: Route,
                    title: "Estoy empezando desde cero",
                    text: "Necesitas entender rutas, licencias, costes reales y errores típicos antes de pedir precios.",
                  },
                  {
                    icon: ClipboardCheck,
                    title: "Estoy comparando escuelas",
                    text: "Quieres ordenar precios, contrato, reembolsos, extras incluidos y promesas comerciales.",
                  },
                  {
                    icon: AlertTriangle,
                    title: "Estoy a punto de pagar matrícula",
                    text: "Necesitas revisar riesgos antes de transferir dinero o firmar condiciones.",
                  },
                  {
                    icon: Copy,
                    title: "Mi familia quiere entender el coste",
                    text: "Puedes generar un resumen claro para explicar ruta, presupuesto, riesgos y próximos pasos.",
                  },
                ].map((who) => {
                  const Icon = who.icon;
                  return (
                    <div
                      key={who.title}
                      className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_40px_rgba(15,26,51,0.06)] ring-1 ring-black/[0.03]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f1a33] text-[#f2ddaa] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-[#c9a454]/25">
                        <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      </div>
                      <h3 className="mt-4 text-base font-semibold leading-snug text-[#0f1a33]">{who.title}</h3>
                      <p className="mt-2 flex-1 text-base leading-relaxed text-slate-600">{who.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            className="relative z-0 border-b border-[#c9a454]/20 py-16 lg:py-20"
            style={{ backgroundColor: "#0f1a33" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 90% 70% at 100% 0%, rgba(201,164,84,0.14), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(255,255,255,0.05), transparent 45%), linear-gradient(180deg, rgba(21,37,71,0.5) 0%, transparent 45%)",
              }}
              aria-hidden
            />
            <div className="relative z-[1] mx-auto max-w-screen-2xl px-6 lg:px-10" style={{ color: "#ffffff" }}>
              <div className="max-w-5xl">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "rgba(232, 213, 163, 0.95)" }}
                >
                  DE DATOS SUELTOS A DECISIÓN CLARA
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: "#ffffff" }}>
                  Todo lo que normalmente se queda fuera del precio anunciado.
                </h2>
                <p className="mt-4 max-w-5xl text-base leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.72)" }}>
                  La herramienta cruza tu perfil, presupuesto, escuelas candidatas y timing para que no tomes una decisión solo por marketing, prisa o precio inicial.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Clase 1", "Inglés", "Financiación", "Contrato", "Reembolso", "Extras", "Calendario de pagos"].map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-solid px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderColor: "rgba(201, 164, 84, 0.35)",
                        color: "#f2ddaa",
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {(
                  [
                    {
                      Icon: Route,
                      title: "Ruta",
                      text: "Integrada, modular o preparación según tu perfil, bloqueos y capacidad real.",
                    },
                    {
                      Icon: ClipboardCheck,
                      title: "Costes",
                      text: "Escenarios optimista, realista y conservador para ver rangos antes de comprometer capital.",
                    },
                    {
                      Icon: ShieldAlert,
                      title: "Escuelas",
                      text: "Analiza tus escuelas candidatas: contrato, reembolso, extras implícitos y huecos de información por cerrar por escrito.",
                    },
                    {
                      Icon: AlertTriangle,
                      title: "Readiness",
                      text: "Si encaja pagar ahora o si conviene investigar, completar requisitos o replantear el ritmo.",
                    },
                    {
                      Icon: Compass,
                      title: "Plan",
                      text: "Próximos pasos en 7, 30 y 90 días para ordenar decisiones sin improvisar.",
                    },
                    {
                      Icon: Copy,
                      title: "Informe",
                      text: "Resumen listo para copiar o compartir cuando pidas segunda opinión familiar o profesional.",
                    },
                  ] as const
                ).map(({ Icon, title, text }) => (
                  <div
                    key={title}
                    className="flex items-start gap-5 rounded-3xl border border-solid p-6 shadow-[0_18px_44px_rgba(0,0,0,0.20)] ring-1 ring-white/[0.04] backdrop-blur-sm"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.075)",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                    }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                      style={{
                        backgroundColor: "#071226",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: "rgba(201, 164, 84, 0.3)",
                        color: "#f2ddaa",
                      }}
                    >
                      <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: "#f2ddaa", stroke: "#f2ddaa" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-snug" style={{ color: "#ffffff" }}>
                        {title}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.75)" }}>
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200/80 bg-white py-14 lg:py-16">
            <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
              <div className="max-w-5xl">
                <div className="h-0.5 w-14 rounded-full bg-[#c9a454]/85 sm:w-16" aria-hidden />
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#0f1a33] md:text-4xl">
                  Al final no recibes teoría. Recibes una decisión ordenada.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  El diagnóstico convierte tus datos en una lectura práctica que puedes revisar, copiar o compartir.
                </p>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                  "Ruta recomendada",
                  "Coste realista estimado",
                  "Nivel de preparación para pagar",
                  "Riesgos principales",
                  "Datos pendientes",
                  "Plan 7 / 30 / 90 días",
                  "Informe final para compartir",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] px-5 py-4 shadow-[0_10px_28px_rgba(15,26,51,0.045)]"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#c9a454]" aria-hidden />
                    <span className="text-sm font-medium leading-snug text-[#0f1a33]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#f8fafc] py-14 lg:py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <div className="overflow-hidden rounded-[2rem] border border-[#c9a454]/25 bg-[#0f1a33] p-8 text-center shadow-[0_28px_70px_rgba(15,26,51,0.35)] md:p-12 md:text-left">
                <div className="mx-auto flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Crea tu diagnóstico antes de elegir escuela.</h2>
                    <p className="mt-4 text-base leading-relaxed text-white/78">
                      En pocos minutos tendrás una lectura inicial de tu ruta, tus costes, tus riesgos y tus escuelas candidatas.
                    </p>
                    <p className="mt-3 text-base leading-relaxed text-white/72">
                      Después, si quieres profundizar, la guía <span className="text-white/95">Cómo ser Piloto</span> o una mentoría pueden ayudarte a revisar tu caso con más detalle antes de pagar.
                    </p>
                    <p className="mt-4 max-w-xl text-base font-semibold leading-snug text-[#f2ddaa]">
                      No empieces por la escuela. Empieza por entender tu caso.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
                      <button type="button" onClick={gotoDiagnosis} className="landing-cta-primary inline-flex items-center justify-center rounded-xl px-6 py-3 text-[15px] font-semibold">
                        Crear mi diagnóstico
                        <ArrowRight className="landing-arrow ml-2 h-4 w-4 transition-transform duration-150" />
                      </button>
                      <button
                        type="button"
                        onClick={gotoExample}
                        className="rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white hover:bg-white/15"
                      >
                        Ver ejemplo
                      </button>
                    </div>
                  </div>
                  {landingGuideCoverAvailable ? (
                    <div className="flex shrink-0 justify-center lg:justify-end">
                      <div className="relative rotate-[2.5deg] shadow-[0_22px_48px_rgba(0,0,0,0.38)] ring-2 ring-white/25 transition-transform duration-300 hover:rotate-[1deg]">
                        <Image
                          src="/como-ser-piloto-cover.jpeg"
                          alt="Guía Cómo ser Piloto FlyPath"
                          width={220}
                          height={308}
                          className="h-auto max-h-[220px] w-auto max-w-[200px] rounded-2xl border border-white/30 bg-white/10 object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="mx-auto mt-10 max-w-4xl px-1 text-center text-[11px] leading-relaxed text-slate-400 lg:text-xs">{disclaimerText}</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (screen === "onboarding") {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0f1a33]">
        <style jsx global>{globalButtonFeedbackStyles}</style>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-3 top-3 z-[60] inline-flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg sm:right-5 sm:top-5 sm:max-w-none sm:flex-nowrap">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            {toast}
          </motion.div>
        )}
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <p className="text-[15px] text-slate-500">Crear mi plan - Paso {onboardingStep} de 6</p>
            <h1 className="mt-1 text-2xl font-semibold">{stepMeta[onboardingStep].title}</h1>
            {stepMeta[onboardingStep].desc ? (
              <p className="mt-1 text-[15px] text-slate-600">{stepMeta[onboardingStep].desc}</p>
            ) : null}
            <div className="mt-4 rounded-full bg-slate-100 p-1"><Progress value={(onboardingStep / 6) * 100} tone="bg-[#0f1a33]" /></div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              {onboardingStep === 1 && <div className="grid gap-4 md:grid-cols-2"><TextField label="Nombre" value={profile.nombre} onChange={(v)=>setProfile(p=>({...p,nombre:v}))} /><NumberField label="Edad" value={profile.edad} onChange={(v)=>setProfile(p=>({...p,edad:v}))} /><TextField label="País" value={profile.pais} onChange={(v)=>setProfile(p=>({...p,pais:v}))} /><SelectField label="Situación laboral" value={profile.situacionLaboral} options={[{value:"estudiante",label:"Estudiante"},{value:"trabajando",label:"Trabajando"},{value:"desempleado",label:"Desempleado"},{value:"otro",label:"Otro"}]} onChange={(v)=>setProfile(p=>({...p,situacionLaboral:v as Profile["situacionLaboral"]}))} /><SelectField label="Objetivo" value={profile.objetivo} options={[{value:"aerolinea",label:"Aerolínea"},{value:"ejecutivo",label:"Ejecutivo"},{value:"instructor",label:"Instructor"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setProfile(p=>({...p,objetivo:v as Profile["objetivo"]}))} /></div>}
              {onboardingStep === 2 && <div className="grid gap-4 md:grid-cols-2"><SelectField label="Class 1" value={profile.class1} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"reservado",label:"Reservado"}]} onChange={(v)=>setProfile(p=>({...p,class1:v as Profile["class1"]}))} /><SelectField label="Class 2" value={profile.class2} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,class2:v as Profile["class2"]}))} /><SelectField label="Nivel de inglés" value={profile.ingles} options={[{value:"bajo",label:"Bajo"},{value:"medio",label:"Medio"},{value:"alto",label:"Alto"}]} onChange={(v)=>setProfile(p=>({...p,ingles:v as Profile["ingles"]}))} /><SelectField label="ICAO level" value={profile.icaoLevel} options={[{value:"0",label:"0"},{value:"4",label:"4"},{value:"5",label:"5"},{value:"6",label:"6"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setProfile(p=>({...p,icaoLevel:v as Profile["icaoLevel"]}))} /><SelectField label="Preocupación por inglés" value={profile.preocupacionIngles} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,preocupacionIngles:v as Profile["preocupacionIngles"]}))} /></div>}
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
                      <p className="text-base font-semibold text-[#0f1a33]">¿Tienes ya precios aproximados de una escuela o ruta?</p>
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
                          No, usar estimación base FlyPath
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
                          Sí, tengo precios aproximados
                        </button>
                      </div>
                      {profile.costEstimateSource === "user_approx" ? (
                        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                          <NumberField
                            label="Precio anunciado de formación / escuela"
                            value={onboardingApproxDraft.precioFormacion}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, precioFormacion: Math.max(0, v) }))}
                          />
                          <NumberField
                            label="Extras no incluidos estimados"
                            value={onboardingApproxDraft.extrasEstimados}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, extrasEstimados: Math.max(0, v) }))}
                          />
                          <NumberField
                            label="Costes de vida estimados"
                            value={onboardingApproxDraft.vidaLogistica}
                            onChange={(v) => setOnboardingApproxDraft((d) => ({ ...d, vidaLogistica: Math.max(0, v) }))}
                          />
                          <NumberField
                            label="Margen de seguridad recomendado %"
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
                        Hemos importado tus escuelas seleccionadas desde el comparador. Usaremos esos datos como base y podrás ajustar costes después en el dashboard.
                      </p>
                    </div>
                  ) : null}
                  {profile.costEstimateSource === "user_approx" ? (
                    <>
                      <p className="text-[15px] text-slate-600">
                        {cameFromSchoolsComparator && hasComparatorImportedSchools
                          ? "Ya hemos cargado tus escuelas seleccionadas. Puedes añadir o ajustar datos si lo necesitas."
                          : "Puedes añadir hasta 3 referencias iniciales si ya tienes escuelas o rutas en mente."}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Nombre" value={newSchool.nombre} onChange={(v)=>setNewSchool(s=>({...s,nombre:v}))} />
                        <TextField label="País" value={newSchool.pais} onChange={(v)=>setNewSchool(s=>({...s,pais:v}))} />
                        <NumberField label="Precio anunciado" value={newSchool.precioAnunciado} onChange={(v)=>setNewSchool(s=>({...s,precioAnunciado:v}))} />
                        <NumberField label="Duración anunciada" value={newSchool.duracionMeses} onChange={(v)=>setNewSchool(s=>({...s,duracionMeses:v}))} />
                        <SelectField label="Programa" value={newSchool.programa} options={[{value:"integrado",label:"Integrado"},{value:"modular",label:"Modular"},{value:"cadet",label:"Cadet"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setNewSchool(s=>({...s,programa:v as School["programa"]}))} />
                        <SelectField label="Fuente del dato" value={newSchool.fuentePrecio} options={[{value:"web_oficial",label:"Web oficial"},{value:"email_escuela",label:"Email escuela"},{value:"llamada",label:"Llamada"},{value:"folleto",label:"Folleto"},{value:"alumno",label:"Alumno"},{value:"redes",label:"Redes"},{value:"usuario",label:"Usuario"},{value:"no_verificado",label:"No verificado"}]} onChange={(v)=>setNewSchool(s=>({...s,fuentePrecio:v as School["fuentePrecio"]}))} />
                        <TextField label="Fecha de actualización (opcional)" value={newSchool.fechaActualizacion} onChange={(v)=>setNewSchool(s=>({...s,fechaActualizacion:v}))} />
                        <SelectField label="Estado de verificación (opcional)" value={newSchool.estadoVerificacion} options={[{value:"verificado",label:"Verificado"},{value:"parcialmente_verificado",label:"Parcialmente verificado"},{value:"no_verificado",label:"No verificado"},{value:"pendiente",label:"Pendiente"}]} onChange={(v)=>setNewSchool(s=>({...s,estadoVerificacion:v as School["estadoVerificacion"]}))} />
                      </div>
                      <button onClick={()=>addSchool(true)} disabled={schools.length>=3} className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-[15px] font-medium text-white disabled:opacity-50">Añadir escuela/ruta</button>
                    </>
                  ) : null}
                </div>
              )}
              {onboardingStep === 6 && <div className="grid gap-4 md:grid-cols-2"><InfoCard label="Ruta recomendada" value={route.recommended} /><InfoCard label="Razón principal" value={route.reason} /><InfoCard label="Coste realista" value={euro(costs.totalRealista)} /><InfoCard label="Brecha de financiación" value={euro(costs.brechaFinanciacion)} /></div>}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
              <button onClick={() => setOnboardingStep((s) => Math.max(1, s - 1))} disabled={onboardingStep === 1} className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-[15px] shadow-sm transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
              {onboardingStep < 6 ? (
                <button
                  type="button"
                  onClick={handleOnboardingNext}
                  className="cursor-pointer rounded-lg bg-[#1d4ed8] px-4 py-2 text-[15px] text-white shadow-sm transition hover:bg-[#1b45c2] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/50"
                >
                  Siguiente
                </button>
              ) : (
                <button onClick={finishOnboarding} className="cursor-pointer rounded-lg bg-[#0f766e] px-4 py-2 text-[15px] text-white shadow-sm transition hover:bg-[#0d665f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50">Ir al dashboard</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f1a33]">
      <style jsx global>{globalButtonFeedbackStyles}</style>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-3 top-3 z-[60] inline-flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg sm:right-5 sm:top-5 sm:max-w-none sm:flex-nowrap">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
          {toast}
        </motion.div>
      )}
      {dashboardMobileNavOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          className="fixed inset-0 z-40 bg-[#0f1a33]/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setDashboardMobileNavOpen(false)}
        />
      ) : null}
      <div className="mx-auto flex min-w-0 max-w-[1600px]">
        <aside
          id="dashboard-sidebar-nav"
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1rem))] flex-col overflow-y-auto border-r border-[#1f2f55] bg-[#0f1a33] px-5 py-7 text-slate-100 shadow-[4px_0_24px_rgba(15,26,51,0.18)] transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-auto lg:min-h-full lg:w-72 lg:max-w-none lg:self-stretch lg:shrink-0 lg:translate-x-0 lg:overflow-y-auto lg:shadow-sm ${
            dashboardMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Navegación</span>
            <button
              type="button"
              onClick={() => setDashboardMobileNavOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-lg p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#c9a454]/20 p-2.5"><Plane className="h-5 w-5 text-[#f2ddaa]" /></div>
            <div><p className="font-semibold text-white">FlyPath Career Planner</p><p className="text-[15px] text-slate-300">Planner de decisión</p></div>
          </div>
          <nav className="mt-9 space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  goToDashboardTab(item.id);
                  setDashboardMobileNavOpen(false);
                }}
                className={`w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-[15px] transition ${tab === item.id ? "bg-white/95 text-[#0f1a33] shadow-sm ring-1 ring-[#c9a454]/40" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 space-y-2">
            <button
              onClick={() => {
                setScreen("onboarding");
                setOnboardingStep(1);
                setDashboardMobileNavOpen(false);
              }}
              className="w-full cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[15px] transition hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Editar mis datos
            </button>
            <button
              onClick={() => {
                setScreen("landing");
                setDashboardMobileNavOpen(false);
              }}
              className="w-full cursor-pointer rounded-lg border border-emerald-300/35 bg-emerald-400/12 px-3 py-2 text-[15px] font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-emerald-200/60 hover:bg-emerald-300/20 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/35"
            >
              Volver al inicio
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setDashboardMobileNavOpen(true)}
              aria-expanded={dashboardMobileNavOpen}
              aria-controls="dashboard-sidebar-nav"
              aria-label="Abrir menú de navegación"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0f1a33] shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">Vista actual</p>
              <p className="truncate text-base font-semibold text-[#0f1a33]">{navItems.find((i) => i.id === tab)?.label ?? "FlyPath"}</p>
            </div>
          </div>
          {tab === "route" && (
            <header className="relative overflow-hidden rounded-[28px] bg-[#0f1a33] p-6 text-white shadow-sm">
              {/* Card azul con relative: avión decorativo en hueco superior derecho (ver div absoluto siguiente). */}
              <div
                className="pointer-events-none absolute top-[50px] right-[108px] z-0 hidden w-[158px] max-w-[calc(100%-2rem)] lg:block"
                aria-hidden
              >
                {/* Hueco superior derecho; ~+17% ancho vs 135px; micro top/right si invade cards o botón. */}
                <div className="relative aspect-[250/130] w-full shrink-0">
                  <svg viewBox="0 0 250 130" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
                    <path
                      d="M10 98 C65 30, 145 28, 230 66"
                      fill="none"
                      stroke="#b89a52"
                      strokeOpacity="0.78"
                      strokeWidth="1.65"
                      strokeDasharray="5 5"
                    />
                    <circle cx="12" cy="98" r="3.5" fill="rgba(201,164,84,0.35)" />
                    <circle cx="103" cy="42" r="3" fill="rgba(184,154,82,0.55)" />
                    <circle cx="230" cy="66" r="3.5" fill="rgba(148,163,184,0.35)" />
                  </svg>
                  <Plane className="absolute right-[2px] top-[29px] h-3.5 w-3.5 -rotate-12 text-[#c9a454]/90" aria-hidden />
                </div>
              </div>
              <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f2ddaa]">Diagnóstico de ruta</p>
                  <h1 className="mt-1.5 min-w-0 break-words text-2xl font-semibold text-white sm:text-3xl">Tu ruta más prudente ahora: {route.recommended}</h1>
                  <p className="mt-2.5 max-w-3xl text-base leading-relaxed text-slate-200">
                    Esta recomendación prioriza reducir riesgo antes de comprometer pagos altos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }}
                    className="cursor-pointer rounded-xl border border-[#c9a454]/45 bg-[#c9a454]/10 px-4 py-2 text-[15px] font-medium text-[#f2ddaa] transition hover:bg-[#c9a454]/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                  >
                    Editar mis datos
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
                <div className="flex h-full min-h-[88px] flex-col rounded-2xl border border-[#c9a454]/30 bg-[#c9a454]/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-[#c9a454]/75" />Ruta recomendada</p>
                    <Route className="h-4 w-4 text-[#f2ddaa]/55" />
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug text-white">{route.recommended}</p>
                </div>
                <div className={`flex h-full min-h-[88px] flex-col rounded-2xl border p-4 shadow-sm backdrop-blur ${route.principalBlock !== "Ningún bloqueo crítico" ? "border-[#c9a454]/25 bg-white/[0.07]" : "border-white/10 bg-white/[0.065]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-slate-300/50" />Bloqueo principal</p>
                    <ShieldAlert className="h-4 w-4 text-slate-300/60" />
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug text-white">{route.principalBlock}</p>
                </div>
              </div>
              <div className="mt-2.5 flex min-h-[76px] flex-col rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-[#c9a454]/75" />Siguiente paso prioritario</p>
                  <ClipboardCheck className="h-4 w-4 text-[#f2ddaa]/55" />
                </div>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-slate-100">
                  {profile.class1 !== "si"
                    ? "Confirma tu Class 1 antes de elegir escuela."
                    : route.warnings.find((w) => !w.toLowerCase().includes("no pagues escuela todavía")) || "Pide precio final, contrato, calendario de pagos y política de reembolso antes de transferir dinero."}
                </p>
              </div>
              {route.principalBlock === "Clase 1 no confirmada" && (
                <div className="mt-2.5 rounded-2xl border border-white/10 bg-[#081329]/55 p-4 text-[15px] text-slate-100">
                  <div className="max-w-2xl border-l-2 border-[#c9a454]/65 pl-3">
                    <p className="font-semibold text-[#f2ddaa]">No pagar escuela todavía</p>
                    <p className="mt-1 text-slate-200">
                      No comprometas dinero hasta resolver el bloqueo médico principal y tener condiciones claras por escrito.
                    </p>
                  </div>
                </div>
              )}
              </div>
            </header>
          )}
          <section className={`${tab === "route" ? "mt-6" : "mt-0"} mx-auto w-full min-w-0 max-w-[1120px] space-y-8`}>
            {tab === "route" && (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-7 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Comparación de rutas</p>
                  <p className="mb-4 text-[15px] text-slate-600">No es una probabilidad ni una promesa de resultado. Es una lectura prudente para ayudarte a priorizar la ruta con menos riesgo.</p>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <RouteOption title="Integrada" value={route.integrated} label={routePriorityLabels.Integrada} />
                    <RouteOption title="Modular" value={route.modular} label={routePriorityLabels.Modular} />
                    <RouteOption title="Preparación" value={route.prep} label={routePriorityLabels["Preparación"]} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 border-r-4 border-r-[#c9a454] bg-gradient-to-r from-white to-[#fffaf0] p-7 shadow-sm">
                  <p className="text-base font-semibold text-[#0f1a33]">Siguiente paso recomendado</p>
                  <p className="mt-2 max-w-3xl text-2xl font-semibold text-[#0f1a33]">
                    {route.recommended === "Modular"
                      ? "Avanza por fases, pero valida costes antes de pagar."
                      : route.recommended === "Integrada"
                      ? "Valida que puedes asumir una ruta intensiva."
                      : "Resuelve bloqueos antes de elegir escuela."}
                  </p>
                  <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-600">
                    {route.recommended === "Modular"
                      ? "Tu diagnóstico apunta a una ruta modular porque te permite controlar mejor el riesgo y la inversión por fases. El siguiente paso no es elegir escuela rápido, sino confirmar si el coste realista encaja con tu presupuesto y comparar escuelas con condiciones por escrito."
                      : route.recommended === "Integrada"
                      ? "Tu diagnóstico apunta a una ruta integrada, pero antes de pagar matrícula o depósito debes confirmar financiación, disponibilidad full-time, contrato, calendario de pagos y política de reembolso. La rapidez solo compensa si las condiciones están claras."
                      : "Tu diagnóstico indica que todavía conviene preparar mejor la decisión antes de comprometer pagos altos. Prioriza resolver el bloqueo principal, revisar costes y construir un plan antes de comparar escuelas en serio."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => goToDashboardTab("cost")}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                    >
                      Revisar costes
                    </button>
                    <button
                      type="button"
                      onClick={() => goToDashboardTab("schools")}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                    >
                      Comparar escuelas
                    </button>
                  </div>
                </div>
              </div>
            )}
            {tab === "cost" && (
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-[28px] bg-[#0f1a33] p-5 text-white shadow-sm sm:p-7">
                  <div className="pointer-events-none absolute right-6 top-4 z-0 hidden h-[105px] w-[190px] lg:flex items-center justify-end opacity-70">
                    <svg viewBox="0 0 260 150" className="h-full w-full">
                      <rect x="36" y="74" width="34" height="52" rx="6" fill="rgba(148,163,184,0.28)" />
                      <rect x="92" y="54" width="34" height="72" rx="6" fill="rgba(255,255,255,0.26)" />
                      <rect x="148" y="34" width="34" height="92" rx="6" fill="rgba(201,164,84,0.55)" />
                      <path d="M24 106 C76 92, 126 74, 236 28" fill="none" stroke="#c9a454" strokeOpacity="0.52" strokeWidth="2" strokeDasharray="5 5" />
                      <circle cx="24" cy="106" r="4" fill="rgba(255,255,255,0.38)" />
                      <circle cx="126" cy="74" r="3.5" fill="rgba(201,164,84,0.7)" />
                      <circle cx="236" cy="28" r="4.5" fill="rgba(255,255,255,0.5)" />
                    </svg>
                  </div>
                  <div className="relative z-10">
                  <div className="lg:max-w-[760px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">Diagnóstico financiero</p>
                    <p className="mt-2 text-3xl font-semibold">Coste realista estimado: {euro(costs.totalRealista)}</p>
                    <p className="mt-3 max-w-3xl text-[15px] text-slate-200">
                      {profile.costEstimateSource === "user_approx" ? (
                        <>
                          Estimación inicial basada en los importes aproximados que introdujiste.
                          <br />
                          Puedes afinar cada partida más abajo.
                        </>
                      ) : (
                        <>
                          Estimación inicial basada en valores base FlyPath de formación, extras y costes de vida.
                          <br />
                          Puedes ajustar cada partida más abajo.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4">
                      <p className="text-[15px] text-slate-300">Dinero que falta</p>
                      <p className="mt-1 text-lg font-semibold text-white">{euro(costs.brechaFinanciacion)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4">
                      <p className="text-[15px] text-slate-300">Presupuesto cubierto</p>
                      <p className="mt-1 text-lg font-semibold text-white">{costs.coverage}%</p>
                    </div>
                    <div className="rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4">
                      <p className="text-[15px] text-slate-300">Riesgo financiero</p>
                      <p className="mt-1 text-lg font-semibold text-white">{costs.riesgoFinanciero}</p>
                    </div>
                  </div>
                  <p className="mt-4 border-l-2 border-[#c9a454]/60 pl-3 text-[15px] text-slate-300">
                    {costs.brechaFinanciacion > 0
                      ? `Lectura rápida: tu presupuesto cubre aproximadamente ${costs.coverage}% del escenario realista. Antes de comprometer pagos, conviene cerrar la brecha o ajustar la ruta.`
                      : "Lectura rápida: tu presupuesto cubre el escenario realista, pero conviene mantener margen para retrasos, repeticiones y costes no incluidos."}
                  </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <details className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <summary className="cursor-pointer list-item marker:text-slate-400">
                      <span className="text-base font-semibold text-[#0f1a33]">Ajustar mi estimación de costes</span>
                      <span className="mt-1 block text-[15px] leading-relaxed text-slate-600">
                        Modifica formación, extras, costes de vida y margen de seguridad si tus números son diferentes.
                      </span>
                    </summary>
                    <div className="mt-4 space-y-4">
                      <CostBlock title={route.recommended === "Integrada" ? "Formación integrada" : "Formación modular"}>
                        {route.recommended === "Integrada" ? (
                          <>
                            <p className="md:col-span-2 xl:col-span-4 text-[15px] text-slate-600">
                              En una ruta integrada, la formación suele venderse como un paquete completo. Edita el precio total anunciado y después ajusta extras, costes de vida y margen de seguridad.
                            </p>
                            <NumberField label="Programa integrado completo" value={costInputs.ppl + (costInputs.nightRating ?? 3000) + costInputs.atplTheory + costInputs.hourBuilding + costInputs.cpl + costInputs.mep + costInputs.ir} onChange={(v) => {
                              const currentPack = costInputs.ppl + (costInputs.nightRating ?? 3000) + costInputs.atplTheory + costInputs.hourBuilding + costInputs.cpl + costInputs.mep + costInputs.ir;
                              if (currentPack <= 0) return;
                              const factor = v / currentPack;
                              setCostInputs((c) => ({
                                ...c,
                                ppl: Math.round(c.ppl * factor),
                                nightRating: Math.round((c.nightRating ?? 3000) * factor),
                                atplTheory: Math.round(c.atplTheory * factor),
                                hourBuilding: Math.round(c.hourBuilding * factor),
                                cpl: Math.round(c.cpl * factor),
                                mep: Math.round(c.mep * factor),
                                ir: Math.round(c.ir * factor),
                              }));
                            }} />
                            <NumberField label="MCC/JOC si no está incluido" value={costInputs.mccJoc} onChange={(v) => setCostInputs((c) => ({ ...c, mccJoc: v }))} />
                            <NumberField label="Advanced UPRT si no está incluido" value={costInputs.advancedUprt} onChange={(v) => setCostInputs((c) => ({ ...c, advancedUprt: v }))} />
                          </>
                        ) : (
                          <>
                            <p className="md:col-span-2 xl:col-span-4 text-[15px] text-slate-600">
                              En una ruta modular, tiene sentido revisar cada fase por separado para controlar pagos, ritmo y riesgo.
                            </p>
                            <NumberField label="PPL" value={costInputs.ppl} onChange={(v) => setCostInputs((c) => ({ ...c, ppl: v }))} />
                            <NumberField label="Night Rating / NR" value={costInputs.nightRating ?? 3000} onChange={(v) => setCostInputs((c) => ({ ...c, nightRating: v }))} />
                            <NumberField label="Teoría ATPL" value={costInputs.atplTheory} onChange={(v) => setCostInputs((c) => ({ ...c, atplTheory: v }))} />
                            <NumberField label="Horas de vuelo / Hour building" value={costInputs.hourBuilding} onChange={(v) => setCostInputs((c) => ({ ...c, hourBuilding: v }))} />
                            <NumberField label="CPL" value={costInputs.cpl} onChange={(v) => setCostInputs((c) => ({ ...c, cpl: v }))} />
                            <NumberField label="MEP" value={costInputs.mep} onChange={(v) => setCostInputs((c) => ({ ...c, mep: v }))} />
                            <NumberField label="IR" value={costInputs.ir} onChange={(v) => setCostInputs((c) => ({ ...c, ir: v }))} />
                            <NumberField label="MCC/JOC" value={costInputs.mccJoc} onChange={(v) => setCostInputs((c) => ({ ...c, mccJoc: v }))} />
                            <NumberField label="Advanced UPRT" value={costInputs.advancedUprt} onChange={(v) => setCostInputs((c) => ({ ...c, advancedUprt: v }))} />
                          </>
                        )}
                      </CostBlock>
                      <CostBlock title="Extras">
                        <NumberField label="Reconocimiento médico Clase 1" value={costInputs.class1Medical} onChange={(v) => setCostInputs((c) => ({ ...c, class1Medical: v }))} />
                        <NumberField label="Tasas exámenes" value={costInputs.tasasExamenes} onChange={(v) => setCostInputs((c) => ({ ...c, tasasExamenes: v }))} />
                        <NumberField label="Skill tests" value={costInputs.skillTests} onChange={(v) => setCostInputs((c) => ({ ...c, skillTests: v }))} />
                        <NumberField label="Headset" value={costInputs.headset} onChange={(v) => setCostInputs((c) => ({ ...c, headset: v }))} />
                        <NumberField label="iPad/apps/cartas" value={costInputs.ipadAppsCartas} onChange={(v) => setCostInputs((c) => ({ ...c, ipadAppsCartas: v }))} />
                        <NumberField label="Uniforme/material" value={costInputs.uniformeMaterial} onChange={(v) => setCostInputs((c) => ({ ...c, uniformeMaterial: v }))} />
                        <NumberField label="Repeticiones" value={costInputs.repeticiones} onChange={(v) => setCostInputs((c) => ({ ...c, repeticiones: v }))} />
                        <NumberField label="Type rating opcional" value={costInputs.typeRatingOpcional} onChange={(v) => setCostInputs((c) => ({ ...c, typeRatingOpcional: v }))} />
                      </CostBlock>
                      <CostBlock title="Costes de vida">
                        <NumberField label="Alojamiento" value={costInputs.alojamiento} onChange={(v) => setCostInputs((c) => ({ ...c, alojamiento: v }))} />
                        <NumberField label="Transporte" value={costInputs.transporte} onChange={(v) => setCostInputs((c) => ({ ...c, transporte: v }))} />
                        <NumberField label="Comida" value={costInputs.comida} onChange={(v) => setCostInputs((c) => ({ ...c, comida: v }))} />
                        <NumberField label="Otros gastos de vida" value={costInputs.otrosGastosVida} onChange={(v) => setCostInputs((c) => ({ ...c, otrosGastosVida: v }))} />
                        <NumberField label="Margen de seguridad %" value={costInputs.bufferPct} onChange={(v) => setCostInputs((c) => ({ ...c, bufferPct: v }))} />
                      </CostBlock>
                    </div>
                  </details>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-6 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
                  <p className="text-base font-semibold text-slate-700">Desglose estimado</p>
                  <p className="mt-1 text-[15px] text-slate-600">Detalle por formación, extras, costes de vida y margen de seguridad. Usa este bloque para ajustar hipótesis sin perder la visión global.</p>
                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="space-y-3">
                      {[
                        { label: "Formación", value: costs.subtotalFormacion, tone: "bg-[#1d3557]" },
                        { label: "Extras", value: costs.subtotalExtras, tone: "bg-[#64748b]" },
                        { label: "Costes de vida", value: costs.subtotalVida, tone: "bg-[#94a3b8]" },
                        { label: "Margen de seguridad", value: costs.buffer, tone: "bg-[#c9a454]" },
                      ].map((item) => {
                        const pct = costs.totalRealista > 0 ? (item.value / costs.totalRealista) * 100 : 0;
                        return (
                          <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between text-[15px]">
                              <p className="font-medium text-slate-700">{item.label}</p>
                              <p className="text-slate-600">{euro(item.value)} · {Math.round(pct)}%</p>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${clamp(pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-7 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
                  <p className="text-base font-semibold text-slate-700">Resumen financiero</p>
                  <p className="mt-2 max-w-3xl text-[15px] text-slate-600">
                    Compara el escenario realista con tu dinero disponible y tu ritmo de ahorro actual.
                  </p>
                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Escenarios posibles</p>
                      <div className="mt-2.5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                          <p className="text-[15px] text-slate-500">Optimista</p>
                          <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{euro(costs.totalOptimista)}</p>
                        </div>
                        <div className="rounded-2xl border border-[#c9a454]/35 bg-[#fffaf0] p-4">
                          <p className="text-[15px] text-slate-500">Realista</p>
                          <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{euro(costs.totalRealista)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                          <p className="text-[15px] text-slate-500">Conservador</p>
                          <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{euro(costs.totalConservador)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tu brecha actual</p>
                      <div className="mt-2.5 grid gap-3 md:grid-cols-3">
                        <SummaryCard label="Dinero disponible" value={euro(profile.dineroDisponible)} />
                        <SummaryCard label="Dinero que falta" value={euro(costs.brechaFinanciacion)} />
                        <SummaryCard
                          label="Tiempo estimado al ritmo actual"
                          value={`${costs.mesesCerrarBrecha} meses`}
                          subValue={humanYearsFromBrechaMonths(costs.mesesCerrarBrecha) ?? undefined}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 border-r-4 border-r-[#c9a454] bg-gradient-to-r from-white to-[#fffaf0] p-7 shadow-sm">
                  <p className="text-base font-semibold text-[#0f1a33]">Siguiente paso</p>
                  <p className="mt-2 max-w-4xl text-base leading-relaxed text-slate-600">
                    Con una estimación realista, compara escuelas usando el mismo criterio: precio final, extras incluidos, contrato, reembolso y calendario de pagos.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => goToDashboardTab("schools")}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                    >
                      Comparar escuelas
                    </button>
                  </div>
                </div>
              </div>
            )}
            {tab === "schools" && (
              <div className="flex flex-col gap-6">
                <div className="order-1 relative overflow-hidden rounded-[28px] bg-[#0f1a33] p-5 text-white shadow-sm sm:p-7">
                  <div className="pointer-events-none absolute right-5 top-5 z-0 hidden sm:block">
                    <ClipboardList className="h-16 w-16 text-[#c9a454]/28 drop-shadow-sm lg:h-[72px] lg:w-[72px] lg:text-[#c9a454]/32" strokeWidth={1.25} aria-hidden />
                  </div>
                  <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">Diagnóstico de escuelas</p>
                  <h2 className="mt-2 text-3xl font-semibold">Compara escuelas antes de pagar depósito.</h2>
                  <p className="mt-3 max-w-3xl text-[15px] text-slate-200">
                    No compares solo precio anunciado. Revisa contrato, reembolso, calendario de pagos, extras incluidos y evidencia por escrito.
                  </p>
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4">
                      <p className="text-[15px] text-slate-300">Escuelas comparadas</p>
                      <p className="mt-1 text-lg font-semibold text-white">{schools.length}</p>
                    </div>
                    <div className="rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4">
                      <p className="text-[15px] text-slate-300">Verificadas</p>
                      <p className="mt-1 text-lg font-semibold text-white">{schoolStats.verifiedCount}</p>
                    </div>
                    <div className="rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] p-4">
                      <p className="text-[15px] text-slate-300">Recomendación FlyPath</p>
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
                          onClick={() => setPlannerSchoolsPremiumModalOpen(true)}
                          className="mt-1 inline-flex cursor-pointer border-none bg-transparent p-0 text-left text-lg font-bold leading-snug text-[#f2ddaa] underline-offset-2 transition hover:underline hover:opacity-90 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ddaa]/45"
                        >
                          Desbloquear análisis premium
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
                {plannerSchoolsPremiumModalOpen ? (
                  <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
                    <button
                      type="button"
                      aria-label="Cerrar ventana"
                      className="absolute inset-0 bg-[#071226]/65 backdrop-blur-sm"
                      onClick={() => setPlannerSchoolsPremiumModalOpen(false)}
                    />
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="planner-schools-premium-title"
                      aria-describedby="planner-schools-premium-desc"
                      className="relative z-[1] w-full max-w-[32rem] rounded-3xl border border-[#c9a454]/35 bg-[#0f1a33] px-6 py-7 text-white shadow-2xl sm:px-7 sm:py-8"
                    >
                      <button
                        type="button"
                        onClick={() => setPlannerSchoolsPremiumModalOpen(false)}
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
                      <p
                        id="planner-schools-premium-desc"
                        className="mt-2 text-[15px] leading-relaxed text-slate-300"
                      >
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
                        onClick={() => showToast("Pago FlyPath próximamente")}
                        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60 sm:text-base"
                      >
                        Desbloquear análisis premium
                      </button>
                      <p className="mt-3 text-center text-[12px] text-slate-400">
                        Pago seguro. Acceso inmediato al análisis.
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="order-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Cómo añadir escuelas
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold text-[#0f1a33] sm:text-xl">
                    Elige cómo quieres añadir escuelas
                  </h3>
                  <p className="mt-1.5 max-w-3xl text-base leading-relaxed text-slate-600">
                    Puedes usar la base de datos FlyPath o introducir una escuela manualmente si ya tienes información propia.
                  </p>
                </div>
                {(() => {
                  const importedFromComparator = schools.filter((s) =>
                    s.enlaceReferencia.startsWith("comparador:"),
                  );
                  const ctaShellClass =
                    "order-3 relative isolate overflow-hidden rounded-3xl border border-[#c9a454]/30 text-white shadow-[0_12px_40px_rgba(15,26,51,0.28)]";
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
                            Estas escuelas se usarán en tu informe final para cruzarlas con tu perfil, presupuesto, Class 1, inglés y disponibilidad.
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
                <div className="order-6 flex flex-col gap-6">
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
                            onClick={() => setPlannerSchoolsPremiumModalOpen(true)}
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
                  <div className="order-5 flex justify-start">
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

                <details
                  ref={schoolFormDetailsRef}
                  open={manualFormOpen}
                  className="order-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
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
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Opción manual
                    </span>
                    <span className="mt-1 block text-base font-semibold text-[#0f1a33]">
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

                <div className="order-7 rounded-3xl border border-slate-200 border-r-4 border-r-[#c9a454] bg-gradient-to-r from-white to-[#fffaf0] p-7 shadow-sm">
                  <p className="text-base font-semibold text-[#0f1a33]">Siguiente paso</p>
                  <p className="mt-2 max-w-4xl text-base leading-relaxed text-slate-600">
                    Cuando tengas al menos dos escuelas con precio final, contrato, reembolso y calendario de pagos claros, revisa si estás listo para pagar.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => goToDashboardTab("report")}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm"
                    >
                      Ver informe final
                    </button>
                  </div>
                </div>

              </div>
            )}
            {tab === "report" && (
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-[28px] bg-[#0f1a33] p-5 text-white shadow-sm sm:p-7">
                  <div className="pointer-events-none absolute right-6 top-4 z-0 hidden h-[100px] w-[180px] lg:flex items-center justify-end opacity-70">
                    <svg viewBox="0 0 220 120" className="h-full w-full">
                      <rect x="42" y="16" width="136" height="92" rx="10" fill="rgba(255,255,255,0.16)" stroke="rgba(201,164,84,0.45)" strokeWidth="1.5" />
                      <line x1="58" y1="40" x2="156" y2="40" stroke="rgba(226,232,240,0.7)" strokeWidth="2" />
                      <line x1="58" y1="56" x2="144" y2="56" stroke="rgba(148,163,184,0.75)" strokeWidth="2" />
                      <line x1="58" y1="72" x2="130" y2="72" stroke="rgba(148,163,184,0.7)" strokeWidth="2" />
                      <circle cx="158" cy="83" r="11" fill="rgba(201,164,84,0.62)" />
                      <path d="M152 83 l4 4 l7 -8" fill="none" stroke="rgba(15,26,51,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="relative z-10">
                  <div className="lg:max-w-[760px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">Informe final FlyPath</p>
                    <h2 className="mt-2 min-w-0 break-words text-2xl font-semibold sm:text-3xl">Tu resumen de decisión</h2>
                    <p className="mt-2 max-w-4xl text-[15px] text-slate-200">
                      Resumen de tu ruta, costes, riesgos y próximos pasos antes de tomar una decisión económica.
                    </p>
                  </div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-4">
                    <div className="min-w-0 rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] px-3 py-3 text-center sm:px-4 sm:py-3.5">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-300 sm:text-sm">Ruta recomendada</p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-[#f2ddaa] sm:text-2xl">{route.recommended}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] px-3 py-3 text-center sm:px-4 sm:py-3.5">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-300 sm:text-sm">Decisión de pago</p>
                      <p
                        className={`mt-1.5 break-words text-base font-bold leading-tight sm:text-lg ${informeHeroDecisionValueTextClass(decisionReadiness.decision)}`}
                      >
                        {decisionReadiness.decision}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] px-3 py-3 text-center sm:px-4 sm:py-3.5">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-300 sm:text-sm">Coste realista</p>
                      <p className="mt-1.5 break-words text-xl font-bold leading-tight text-[#f2ddaa] sm:text-2xl">{euro(costs.totalRealista)}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-[#c9a454]/25 bg-white/[0.07] px-3 py-3 text-center sm:px-4 sm:py-3.5">
                      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-300 sm:text-sm">Score de decisión</p>
                      <p className="mt-1.5 break-words tabular-nums text-xl font-bold leading-tight text-[#f0c96b] sm:text-2xl">{decisionReadiness.score}/100</p>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Card unificada: "Conclusión ejecutiva" como bloque principal + "Lectura
                    rápida" como subbloque dentro de la misma tarjeta, separados por una
                    línea suave. Reemplaza las dos cards anteriores (Conclusión ejecutiva +
                    Lectura ejecutiva). El contenido y la fuente de cada bullet se mantienen
                    1:1; solo se unifica el contenedor visual. La conclusión sigue usando
                    `conclusionEjecutivaInformeFinal(...)` con los 3 argumentos correctos. */}
                <div className="rounded-3xl border border-slate-200/95 border-l-[3px] border-l-[#c9a454]/75 bg-gradient-to-br from-white via-white to-[#fafbfd] px-5 py-5 shadow-[0_10px_28px_rgba(15,26,51,0.07)]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
                    <p className="text-base font-semibold text-[#0f1a33]">Conclusión ejecutiva</p>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-slate-600">
                    {conclusionEjecutivaInformeFinal(
                      decisionReadiness.decision,
                      criticalBlockersForConclusion,
                      decisionReadiness.faltanDatos,
                    )}
                  </p>
                  <div className="mt-5 border-t border-slate-200/70 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Lectura rápida</p>
                    <ul className="mt-3 list-none space-y-3 text-base leading-relaxed text-slate-700">
                      <li className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]/80" aria-hidden />
                        <span>
                          <span className="font-semibold text-slate-800">Ruta recomendada:</span> {route.recommended}. {route.reason}
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]/80" aria-hidden />
                        <span>
                          <span className="font-semibold text-slate-800">Bloqueo principal:</span>{" "}
                          {decisionReadiness.bloqueosCriticos.length > 0
                            ? decisionReadiness.bloqueosCriticos[0]
                            : decisionReadiness.faltanDatos.length > 0
                              ? "Datos pendientes antes de pagar."
                              : "Ningún bloqueo crítico."}
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]/80" aria-hidden />
                        <span>
                          <span className="font-semibold text-slate-800">Siguiente paso:</span>{" "}
                          {actionPlan.sevenDays[0] ?? "Resolver bloqueos críticos y completar datos antes de pagar."}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* "Riesgos principales": compactado ligeramente para reducir altura y
                    no competir con el "Plan resumido". Cambios solo de espaciado:
                    contenedor p-6 → p-5; mt-4 → mt-3; cards internas p-4 → px-4 py-3;
                    separación entre párrafos mt-2 → mt-1.5. Mismo grid, mismos textos,
                    mismos riesgos, misma legibilidad. */}
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-5 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
                  <p className="text-base font-semibold text-[#0f1a33]">Riesgos principales</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {riskDiagnosis.slice(0, 6).map((risk) => {
                      const visualLabel =
                        risk.label === "Riesgo de marketing/promesas"
                          ? "Riesgo comercial"
                          : risk.label === "Riesgo de timing"
                          ? "Riesgo de calendario"
                          : risk.label;
                      const visualAction =
                        risk.accion === "Pedir por escrito alcance real de career support y límites."
                          ? "Pedir por escrito el alcance real del apoyo laboral y cualquier promesa comercial."
                          : risk.accion;
                      const badgeStyles =
                        risk.nivel === "Crítico"
                          ? "border-[#c9a454]/35 bg-[#c9a454]/15 text-[#7a5a16]"
                          : risk.nivel === "Alto"
                          ? "border-[#1d4ed8]/25 bg-[#1d4ed8]/10 text-[#1d4ed8]"
                          : "border-slate-300 bg-slate-100 text-slate-600";
                      return (
                        <div key={risk.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-semibold text-[#0f1a33]">{visualLabel}</p>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeStyles}`}>{risk.nivel}</span>
                          </div>
                          <p className="mt-1.5 text-base leading-relaxed text-slate-600">{risk.explicacion}</p>
                          <p className="mt-1.5 text-[15px] text-slate-700">
                            <span className="font-semibold">Acción:</span> {visualAction}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-6 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
                  <p className="text-base font-semibold text-[#0f1a33]">Datos pendientes antes de pagar</p>
                  {decisionReadiness.faltanDatos.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
                      {decisionReadiness.faltanDatos.slice(0, 6).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[15px] text-slate-600">No hay datos críticos pendientes detectados, pero conserva toda la documentación por escrito.</p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-6 shadow-[0_10px_30px_rgba(15,26,51,0.05)]">
                  <p className="text-base font-semibold text-[#0f1a33]">Plan resumido</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      { title: "Próximos 7 días", items: actionPlan.sevenDays.slice(0, 3) },
                      { title: "Próximos 30 días", items: actionPlan.thirtyDays.slice(0, 3) },
                      { title: "Próximos 90 días", items: actionPlan.ninetyDays.slice(0, 3) },
                    ].map((block) => (
                      <div key={block.title} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
                        <p className="text-base font-semibold text-slate-700">{block.title}</p>
                        {block.items.length > 0 ? (
                          <ol className="mt-3 space-y-2 text-base leading-relaxed text-slate-700">
                            {block.items.map((task, idx) => (
                              <li key={task} className="flex items-start gap-2.5">
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">{idx + 1}</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="mt-2 text-[15px] text-slate-500">Sin acciones clave en este bloque.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-r-4 border-slate-200 border-r-[#c9a454] bg-gradient-to-r from-white to-[#fffaf0] p-7 shadow-sm">
                  <p className="text-base font-semibold text-[#0f1a33]">
                    {plannerPremiumContentVisible
                      ? "Guardar o compartir informe premium"
                      : "Guardar o compartir informe"}
                  </p>
                  <p className="mt-2 max-w-4xl text-base leading-relaxed text-slate-600">
                    {plannerPremiumContentVisible
                      ? "Descarga tu informe premium con análisis de escuelas, recomendación FlyPath y próximos pasos personalizados."
                      : "Descarga tu informe gratuito o compártelo con tu familia antes de tomar una decisión."}
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        if (plannerPremiumContentVisible) {
                          // TODO: conectar descarga real del informe premium cuando exista el PDF premium.
                          showToast("Informe premium próximamente");
                          return;
                        }
                        try {
                          const { downloadFlyPathInformePdf, getFlyPathPrimaryProductForPdf } = await import("@/lib/flypathReportPdf");
                          const generatedAt = new Intl.DateTimeFormat("es-ES", {
                            dateStyle: "long",
                            timeStyle: "short",
                          }).format(new Date());
                          const nextPrimary = getFlyPathPrimaryProductForPdf({
                            class1: profile.class1,
                            ingles: profile.ingles,
                            preocupacionIngles: profile.preocupacionIngles,
                            objetivo: profile.objetivo,
                            urgencia: profile.urgencia,
                            dineroDisponible: profile.dineroDisponible,
                            inversionMaxima: profile.inversionMaxima,
                            routeRecommended: route.recommended,
                            schoolsLength: schools.length,
                            decision: decisionReadiness.decision,
                            faltanDatosLength: decisionReadiness.faltanDatos.length,
                            atplTheory: costInputs.atplTheory,
                          });
                          const schoolSummaries = schools.slice(0, 6).map((s, i) => {
                            const pend = getSchoolEmailMissingData(s);
                            return {
                              id: `school-${s.id}-${i}`,
                              nombre: s.nombre,
                              pais: s.pais,
                              ciudad: s.ciudad,
                              precio: euro(s.precioAnunciado),
                              estado: s.estadoVerificacion.replace(/_/g, " "),
                              pendientes: pend.length ? pend.slice(0, 8).join(", ") : "Sin pendientes destacados en el checklist.",
                            };
                          });
                          const payload: FlyPathInformePdfInput = {
                            generatedAt,
                            nombre: profile.nombre.trim(),
                            routeRecommended: route.recommended,
                            routeReason: route.reason,
                            principalBlock: route.principalBlock,
                            decision: decisionReadiness.decision,
                            score: decisionReadiness.score,
                            shouldPayNow,
                            conclusionEjecutiva: conclusionEjecutivaInformeFinal(
                              decisionReadiness.decision,
                              criticalBlockersForConclusion,
                              decisionReadiness.faltanDatos,
                            ),
                            totalOptimista: euro(costs.totalOptimista),
                            totalRealista: euro(costs.totalRealista),
                            totalConservador: euro(costs.totalConservador),
                            dineroDisponible: euro(profile.dineroDisponible),
                            brecha: euro(costs.brechaFinanciacion),
                            coverage: `${costs.coverage}% del coste realista`,
                            mesesCerrarBrecha: costs.mesesCerrarBrecha,
                            costEstimateNote: costEstimateNoteForPdf(profile.costEstimateSource),
                            riskRows: mapRiskRowsForInformePdf(riskDiagnosis),
                            faltanDatos: [...decisionReadiness.faltanDatos],
                            proximosPasos: [...decisionReadiness.proximosPasos],
                            sevenDays: [...actionPlan.sevenDays],
                            thirtyDays: [...actionPlan.thirtyDays],
                            ninetyDays: [...actionPlan.ninetyDays],
                            schoolsCount: schools.length,
                            verifiedCount: schoolStats.verifiedCount,
                            pendingCount: schoolStats.pendingCount,
                            schoolSummaries,
                            nextPrimary,
                            disclaimer: disclaimerText,
                          };
                          await downloadFlyPathInformePdf(payload);
                          showToast("Informe descargado");
                        } catch (e) {
                          if (process.env.NODE_ENV === "development") {
                            console.error("[FlyPath] Error generando PDF del informe:", e);
                          } else {
                            console.error("[FlyPath] PDF informe fallido");
                          }
                          showToast("No se pudo generar el informe. Inténtalo de nuevo.");
                        }
                      }}
                      className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      {plannerPremiumContentVisible ? "Descargar informe premium" : "Descargar informe gratuito"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { downloadFlyPathResumenPadresPdf } = await import("@/lib/flypathReportPdf");
                          const generatedAt = new Intl.DateTimeFormat("es-ES", {
                            dateStyle: "long",
                            timeStyle: "short",
                          }).format(new Date());
                          const padresPayload: FlyPathResumenPadresPdfInput = {
                            generatedAt,
                            nombre: profile.nombre.trim(),
                            routeRecommended: route.recommended,
                            decision: decisionReadiness.decision,
                            shouldPayNow,
                            totalRealista: euro(costs.totalRealista),
                            brecha: euro(costs.brechaFinanciacion),
                            riesgosSimple: riesgosSimpleParaPadresPdf(riskDiagnosis),
                            faltanDatos: [...decisionReadiness.faltanDatos],
                            sevenDays: [...actionPlan.sevenDays],
                            thirtyDays: [...actionPlan.thirtyDays],
                            ninetyDays: [...actionPlan.ninetyDays],
                            disclaimer: disclaimerText,
                          };
                          await downloadFlyPathResumenPadresPdf(padresPayload);
                          showToast("Resumen para padres descargado");
                        } catch (e) {
                          if (process.env.NODE_ENV === "development") {
                            console.error("[FlyPath] Error generando PDF resumen para padres:", e);
                          } else {
                            console.error("[FlyPath] PDF resumen padres fallido");
                          }
                          showToast("No se pudo generar el resumen para padres. Inténtalo de nuevo.");
                        }
                      }}
                      className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-sm sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      Descargar resumen para padres
                    </button>
                  </div>
                </div>

                {/* Bloque premium del Informe final. Reordenado: aparece DESPUÉS de "Guardar o
                    compartir informe" y ANTES de "Tu siguiente paso FlyPath". No bloquea el
                    informe gratuito. Reusa `setPlannerSchoolsPremiumModalOpen` (no nuevo modal).
                    En modo gratis: card oscura con CTA. En modo premium: usa la misma recomendación
                    que el minibadge Recomendación FlyPath (`flypathSchoolRecommendation`). */}
                {(() => {
                  const totalSchools = schools.length;
                  if (!plannerPremiumContentVisible) {
                    return (
                      <div className="rounded-3xl border border-[#c9a454]/35 bg-[#0f1a33] p-6 text-white shadow-[0_10px_30px_rgba(15,26,51,0.18)] sm:p-7">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-[#f2ddaa]" aria-hidden />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2ddaa]">
                            ANÁLISIS PREMIUM
                          </span>
                        </div>
                        <h3 className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl">
                          Desbloquea el análisis premium de escuelas
                        </h3>
                        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-300">
                          El informe gratuito te ayuda a saber si estás preparado para avanzar. El análisis premium cruza tu perfil con las escuelas que has comparado para ayudarte a decidir cuál tiene más sentido antes de pagar matrícula o depósito.
                        </p>
                        <ul className="mt-4 space-y-2 text-[15px] text-slate-200">
                          {[
                            "Escuela con mejor encaje FlyPath",
                            "Riesgo económico y documental por escuela",
                            "Comparación personalizada según tu presupuesto y perfil",
                            "Qué preguntar a cada escuela antes de pagar",
                            "Próximos pasos específicos para tu decisión",
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
                          onClick={() => setPlannerSchoolsPremiumModalOpen(true)}
                          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/60"
                        >
                          Desbloquear análisis premium
                        </button>
                      </div>
                    );
                  }

                  type AnalyzedSchool = (typeof schoolStats.analyzed)[number];

                  const howToStart: string[] =
                    route.recommended === "Modular"
                      ? [
                          "No empieces pagando una integrada completa.",
                          "Empieza por cerrar Class 1, presupuesto real y escuelas con contrato claro.",
                          "Prioriza una ruta modular o integrada solo si la financiación y condiciones están cerradas.",
                        ]
                      : route.recommended === "Integrada"
                        ? [
                            "No transfieras matrícula sin contrato firmado y reembolso claro.",
                            "Cierra antes la financiación, el presupuesto realista y el Class 1.",
                            "Confirma calendario de pagos por fases y qué tasas o extras quedan dentro del precio.",
                          ]
                        : [
                            "Aún no decidas escuela ni firmes ningún depósito.",
                            "Cierra primero Class 1, inglés operativo y presupuesto realista.",
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

                <FlyPathNextStepsPanel
                  profile={profile}
                  route={route}
                  decisionReadiness={decisionReadiness}
                  schools={schools}
                  costInputs={costInputs}
                  onProductCta={() => showToast(FLYPATH_PRODUCT_TOAST)}
                />

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota importante</p>
                  <p className="mt-1 text-[15px] text-slate-600">{disclaimerText}</p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
    {process.env.NODE_ENV === "development" && (
      <button
        type="button"
        onClick={toggleQaPremium}
        className="fixed bottom-4 right-4 z-[9999] inline-flex w-auto max-w-[calc(100vw-2rem)] items-center justify-center rounded-full border border-[#c9a454]/50 bg-[#0f1a33] px-4 py-2 text-xs font-semibold text-[#f2ddaa] shadow-lg transition hover:bg-[#152547]"
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
  return <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-6 shadow-[0_10px_30px_rgba(15,26,51,0.05)]"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>{children}</div>;
}

function YNField({ label, value, onChange }: { label: string; value: YesNoUnknown; onChange: (value: YesNoUnknown) => void }) {
  return <SelectField label={label} value={value} options={[{ value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "no_se", label: "No sé" }]} onChange={(v) => onChange(v as YesNoUnknown)} />;
}

function RouteOption({ title, value, label }: { title: string; value: number; label: string }) {
  void value;
  const isRecommended = label === "Ruta recomendada";
  const isPossible = label === "Ruta posible";

  const cardStyles = isRecommended
    ? "border-[#c9a454]/60 bg-[#fffaf0] shadow-[0_12px_30px_rgba(15,26,51,0.08)]"
    : isPossible
    ? "border-[#1d4ed8]/20 bg-white"
    : "border-slate-200 bg-white";

  const badgeStyles = isRecommended
    ? "border-[#c9a454]/35 bg-[#c9a454]/15 text-[#7a5a16]"
    : isPossible
    ? "border-[#1d4ed8]/20 bg-[#1d4ed8]/10 text-[#1d4ed8]"
    : "border-slate-200 bg-slate-100 text-slate-600";

  const accentTone = isRecommended ? "bg-[#c9a454]" : isPossible ? "bg-[#1d4ed8]" : "bg-slate-400";
  const advisoryText =
    title === "Integrada"
      ? "Solo recomendable si tienes financiación sólida, disponibilidad y condiciones claras."
      : title === "Modular"
      ? "Permite avanzar por fases y controlar mejor el riesgo financiero."
      : "Prioriza resolver bloqueos antes de comprometer pagos altos.";

  return (
    <div className={`flex h-full min-h-[170px] flex-col justify-between rounded-2xl border p-5 transition ${cardStyles}`}>
      <div>
        <p className="text-lg font-semibold text-[#0f1a33]">{title}</p>
        <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles}`}>
          {label}
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{advisoryText}</p>
      </div>
      <div className={`mt-5 h-0.5 rounded-full ${accentTone}`} />
    </div>
  );
}

function CostBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="mb-3 text-base font-semibold text-slate-700">{title}</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div></div>;
}

function SummaryCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
      <p className="text-[15px] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{value}</p>
      {subValue ? <p className="mt-0.5 text-xs font-medium text-slate-600">{subValue}</p> : null}
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
