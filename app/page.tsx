"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Copy,
  Mail,
  Plane,
  Route,
  ShieldAlert,
  Trash2,
} from "lucide-react";

type Screen = "landing" | "onboarding" | "dashboard";
export type Tab = "route" | "cost" | "schools" | "plan" | "readiness" | "report";
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
};

type CostInputs = {
  ppl: number;
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
  hybrid: number;
  prep: number;
  recommended: "Integrada" | "Modular" | "Híbrida" | "Preparación";
  reason: string;
  warnings: string[];
  conflicts: string[];
  principalBlock: string;
};

type DecisionReadiness = {
  score: number;
  decision: "No pagues todavía" | "Puedes avanzar, pero faltan datos" | "Listo para decidir con condiciones";
  explanation: string;
  bloqueosCriticos: string[];
  faltanDatos: string[];
  proximosPasos: string[];
  showNoPaguesBadge: boolean;
};

const disclaimerText =
  "FlyPath Career Planner ofrece orientación educativa y herramientas de planificación basadas en los datos introducidos por el usuario. No sustituye asesoramiento financiero, médico, legal ni información oficial de escuelas, autoridades o aerolíneas. Los costes son estimaciones y pueden variar.";

const globalButtonFeedbackStyles = `
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
};

const defaultCostInputs: CostInputs = {
  ppl: 12000,
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

const exampleSchools: School[] = [
  {
    id: 1,
    isExample: true,
    nombre: "Escuela Ejemplo A",
    pais: "España",
    ciudad: "Madrid",
    programa: "integrado",
    precioAnunciado: 79000,
    duracionMeses: 18,
    depositoRequerido: 6000,
    calendarioPagosClaro: "no",
    mccIncluido: "no_se",
    uprtIncluido: "no_se",
    tasasIncluidas: "no",
    skillTestsIncluidos: "no_se",
    alojamientoIncluido: "no",
    reembolsoClaro: "no",
    contratoAntesPagar: "no_se",
    flotaExplicada: "si",
    mantenimientoExplicado: "no",
    ratioAlumnoAvionConocido: "no",
    permiteHablarAlumnos: "no_se",
    careerSupport: "no_se",
    promesasEmpleo: "vagas",
    fuentePrecio: "web_oficial",
    fechaActualizacion: "",
    estadoVerificacion: "no_verificado",
    enlaceReferencia: "",
    notas: "Ejemplo no verificado.",
  },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function euro(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
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

function computeRoute(profile: Profile): RouteAnalysis {
  let integrated = 30;
  let modular = 35;
  let hybrid = 35;
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
    hybrid -= 10;
    warnings.push("No pagues escuela todavía: primero confirma Clase 1.");
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
    hybrid += 20;
    integrated -= 20;
  }
  if (
    profile.dineroDisponible >= 70000 &&
    profile.class1 === "si" &&
    profile.ingles === "alto" &&
    profile.disponibilidad === "full-time"
  ) {
    integrated += 35;
    hybrid += 10;
  }
  if (profile.urgencia === "alta" && profile.necesitaTrabajar === "si") {
    conflicts.push("Quieres rapidez alta, pero necesitas trabajar durante la formación.");
  }
  if (profile.edad > 30 && profile.dineroDisponible >= 50000) {
    warnings.push("No se penaliza la edad; enfoca la decisión en coste de oportunidad.");
    integrated += 5;
    hybrid += 8;
  }
  if (profile.disponibilidad === "part-time") {
    modular += 8;
    hybrid += 12;
  } else {
    integrated += 8;
  }

  integrated = clamp(integrated);
  modular = clamp(modular);
  hybrid = clamp(hybrid);
  prep = clamp(prep);

  const ordered = [
    { key: "Integrada", score: integrated },
    { key: "Modular", score: modular },
    { key: "Híbrida", score: hybrid },
    { key: "Preparación", score: prep },
  ].sort((a, b) => b.score - a.score);

  const recommended = ordered[0].key as RouteAnalysis["recommended"];
  const reasonMap: Record<RouteAnalysis["recommended"], string> = {
    Integrada: "Encaja por capacidad financiera y disponibilidad full-time.",
    Modular: "Encaja por flexibilidad y control de caja por fases.",
    "Híbrida": "Encaja para avanzar con flexibilidad sin frenar del todo.",
    "Preparación": "Encaja para reducir riesgo antes de comprometer pagos altos.",
  };

  const principalBlock =
    profile.class1 !== "si"
      ? "Clase 1 no confirmada"
      : profile.ingles === "bajo"
      ? "Inglés operativo insuficiente"
      : profile.financiacion === "no" && profile.dineroDisponible < 30000
      ? "Brecha financiera crítica"
      : "Ningún bloqueo crítico";

  return { integrated, modular, hybrid, prep, recommended, reason: reasonMap[recommended], warnings, conflicts, principalBlock };
}

function computeCosts(costs: CostInputs, profile: Profile) {
  const subtotalFormacion =
    costs.ppl + costs.atplTheory + costs.hourBuilding + costs.cpl + costs.mep + costs.ir + costs.mccJoc + costs.advancedUprt;
  const subtotalExtras =
    costs.class1Medical +
    costs.tasasExamenes +
    costs.skillTests +
    costs.equipo +
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

  const anyVaguePromises = schoolsAnalyzed.some((x) => x.school.promesasEmpleo === "vagas");
  const anyDocMissing = schoolsAnalyzed.some(
    (x) =>
      x.school.contratoAntesPagar !== "si" ||
      x.school.reembolsoClaro !== "si" ||
      x.school.calendarioPagosClaro !== "si"
  );
  const anyCriticalMissing = schoolsAnalyzed.some(
    (x) =>
      x.school.mccIncluido !== "si" ||
      x.school.uprtIncluido !== "si" ||
      x.school.tasasIncluidas !== "si" ||
      x.school.skillTestsIncluidos !== "si" ||
      x.school.alojamientoIncluido !== "si"
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
    bloqueosCriticos.push("Brecha financiera alta respecto al coste realista.");
  } else if (costs.brechaFinanciacion > costs.totalRealista * 0.2) {
    score -= 12;
  }

  if (profile.financiacion !== "confirmada" && costs.coverage < 70) {
    score -= 25;
    bloqueosCriticos.push("Bloqueo financiero: cobertura < 70% y financiación no confirmada.");
  }

  if (bufferPct < 12) {
    score -= 10;
    faltanDatos.push("Buffer de costes bajo; subir por encima del 12%.");
  }

  if (schoolsAnalyzed.length === 0) {
    score -= 20;
    faltanDatos.push("No hay escuelas comparadas.");
  } else if (schoolsAnalyzed.length < 2) {
    score -= 10;
    faltanDatos.push("Comparar al menos 2 escuelas para decidir con criterio.");
  }

  if (verifiedOrPartial.length === 0) {
    score -= 20;
    bloqueosCriticos.push("Faltan datos verificados o parcialmente verificados.");
  }

  if (anyDocMissing) {
    score -= 18;
    bloqueosCriticos.push("Bloqueo documental: contrato/reembolso/calendario no claros.");
  }

  if (anyVaguePromises) {
    score -= 10;
    faltanDatos.push("Riesgo de marketing: promesas vagas de empleo.");
  }

  if (anyCriticalMissing) {
    score -= 12;
    faltanDatos.push("Faltan datos críticos: MCC/UPRT/tasas/skill tests/alojamiento.");
  }

  if (route.conflicts.some((c) => c.includes("rapidez"))) {
    score -= 8;
    faltanDatos.push("Conflicto actual entre urgencia y necesidad de trabajar.");
  }

  score = clamp(score);

  const showNoPaguesBadge = profile.class1 !== "si" || bloqueosCriticos.length > 0;

  let decision: DecisionReadiness["decision"] = "Puedes avanzar, pero faltan datos";
  if (profile.class1 !== "si") {
    decision = "No pagues todavía";
  } else if (bloqueosCriticos.length > 0 || score < 55) {
    decision = "No pagues todavía";
  } else if (faltanDatos.length > 0 || score < 75) {
    decision = "Puedes avanzar, pero faltan datos";
  } else {
    decision = "Listo para decidir con condiciones";
  }

  const explanationMap: Record<DecisionReadiness["decision"], string> = {
    "No pagues todavía":
      "El riesgo actual es demasiado alto para pagar matrícula, depósito o firmar sin resolver bloqueos críticos.",
    "Puedes avanzar, pero faltan datos":
      "El perfil permite avanzar en el proceso, pero aún faltan confirmaciones clave antes de comprometer pagos.",
    "Listo para decidir con condiciones":
      "La base de decisión es sólida, siempre que mantengas control documental y financiero en la firma final.",
  };

  const proximosPasos = [
    "Confirmar por escrito contrato, reembolso y calendario de pagos.",
    "Actualizar escenarios con costes verificados de al menos 2 escuelas.",
    "No transferir depósito hasta validar todos los datos críticos.",
  ];

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
  const specificQuestions: string[] = [];
  if (school.mccIncluido !== "si") specificQuestions.push("- ¿El MCC/JOC está incluido? Si no, ¿cuál es su coste exacto y en qué fase se paga?");
  if (school.uprtIncluido !== "si") specificQuestions.push("- ¿El Advanced UPRT está incluido? Si no, ¿cuál es su precio y proveedor?");
  if (school.tasasIncluidas !== "si") specificQuestions.push("- ¿Las tasas de examen están incluidas? Si no, ¿cuál es el coste estimado total?");
  if (school.skillTestsIncluidos !== "si") specificQuestions.push("- ¿Los skill tests están incluidos? Si no, ¿qué importe adicional debo prever?");
  if (school.alojamientoIncluido !== "si") specificQuestions.push("- ¿Ofrecen alojamiento? En caso contrario, ¿qué coste mensual aproximado recomiendan en la zona?");
  if (school.reembolsoClaro !== "si") specificQuestions.push("- ¿Podrían compartir su política de reembolso por escrito con escenarios y plazos?");
  if (school.contratoAntesPagar !== "si") specificQuestions.push("- Antes de pagar depósito o matrícula, ¿pueden enviar contrato tipo o condiciones completas?");
  if (school.calendarioPagosClaro !== "si") specificQuestions.push("- ¿Cuál es el calendario de pagos detallado por hitos del programa?");
  if (school.flotaExplicada !== "si") specificQuestions.push("- ¿Podrían detallar la flota activa (modelo, número de aeronaves y disponibilidad operativa)?");
  if (school.mantenimientoExplicado !== "si") specificQuestions.push("- ¿Cómo gestionan mantenimiento y tiempos de indisponibilidad de aeronaves?");
  if (school.ratioAlumnoAvionConocido !== "si") specificQuestions.push("- ¿Cuál es el ratio alumno/avión e instructor/alumno en operación real?");
  if (school.permiteHablarAlumnos !== "si") specificQuestions.push("- ¿Es posible hablar con alumnos actuales o antiguos para validar la experiencia real?");
  if (school.promesasEmpleo === "vagas") {
    specificQuestions.push(
      "- Sobre el apoyo laboral, agradecería una descripción por escrito de qué incluye exactamente (sin interpretarlo como garantía de empleo)."
    );
  }
  if (school.estadoVerificacion !== "verificado") {
    specificQuestions.push("- ¿Podrían confirmar oficialmente por escrito precio final, condiciones y fecha de vigencia de esta información?");
  }

  const specificBlock = specificQuestions.length
    ? `\nPreguntas específicas según datos pendientes:\n${specificQuestions.join("\n")}\n`
    : "\nPreguntas específicas según datos pendientes:\n- En este momento no detecto huecos críticos adicionales, pero agradecería validar igualmente todos los puntos por escrito.\n";

  return `Asunto: Solicitud de confirmación documental y económica - ${school.nombre}

Hola equipo de ${school.nombre},

Soy ${nombreUsuario || "un aspirante a piloto"} y estoy evaluando opciones de formación para tomar una decisión responsable antes de pagar matrícula o depósito.

Agradecería su ayuda para validar por escrito:

Preguntas generales:
- Precio total actualizado del programa y qué incluye / qué no incluye.
- Duración media real del programa (no solo estimada).
- Condiciones de pago: depósito, hitos y fechas.
- Posibilidad de recibir contrato tipo o condiciones completas antes de pagar.
${specificBlock}
Si disponen de folleto actualizado, contrato tipo o documento de condiciones, agradecería que lo incluyeran en la respuesta.

Gracias por su atención.

Un saludo,
${nombreUsuario || ""}`;
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

type FlyPathAppProps = {
  reviewMode?: boolean;
  initialTab?: Tab;
};

export function FlyPathApp({ reviewMode = false, initialTab = "route" }: FlyPathAppProps) {
  const [screen, setScreen] = useState<Screen>(reviewMode ? "dashboard" : "landing");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [costInputs, setCostInputs] = useState<CostInputs>(defaultCostInputs);
  const [schools, setSchools] = useState<School[]>(exampleSchools);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [emailDrafts, setEmailDrafts] = useState<Record<number, string>>({});
  const [emailPendingBySchool, setEmailPendingBySchool] = useState<Record<number, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatedEmailKey, setGeneratedEmailKey] = useState<number | null>(null);
  const [newSchool, setNewSchool] = useState<School>({
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

  useEffect(() => {
    if (reviewMode) return;
    try {
      const p = localStorage.getItem("flypath_profile");
      const c = localStorage.getItem("flypath_cost_inputs");
      const s = localStorage.getItem("flypath_schools");
      const o = localStorage.getItem("flypath_onboarding_completed");
      if (p) setProfile(JSON.parse(p));
      if (c) setCostInputs(JSON.parse(c));
      if (s) setSchools(JSON.parse(s));
      if (o) {
        const done = JSON.parse(o);
        setOnboardingCompleted(done);
        setScreen(done ? "dashboard" : "landing");
      }
    } catch {
      // noop
    }
  }, []);

  // Public review/deep-link mode: allow dashboard sections to be opened directly from URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const reviewMode = params.get("review");
    const requestedTab = params.get("tab") as Tab | null;
    const validTabs: Tab[] = ["route", "cost", "schools", "plan", "readiness", "report"];

    if (reviewMode === "dashboard") {
      setOnboardingCompleted(true);
      setScreen("dashboard");
      if (requestedTab && validTabs.includes(requestedTab)) {
        setTab(requestedTab);
      }
    }
  }, [reviewMode]);

  useEffect(() => {
    if (reviewMode) return;
    localStorage.setItem("flypath_profile", JSON.stringify(profile));
  }, [profile, reviewMode]);
  useEffect(() => {
    if (reviewMode) return;
    localStorage.setItem("flypath_cost_inputs", JSON.stringify(costInputs));
  }, [costInputs, reviewMode]);
  useEffect(() => {
    if (reviewMode) return;
    localStorage.setItem("flypath_schools", JSON.stringify(schools));
  }, [schools, reviewMode]);
  useEffect(() => {
    if (reviewMode) return;
    localStorage.setItem("flypath_onboarding_completed", JSON.stringify(onboardingCompleted));
  }, [onboardingCompleted, reviewMode]);

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

  const shouldPayNow = decisionReadiness.decision === "Listo para decidir con condiciones";
  const hasExampleSchools = schools.some((s) => s.isExample);
  const keyDataEdited = Boolean(profile.nombre.trim()) && profile.dineroDisponible !== defaultProfile.dineroDisponible && schools.length > 0;
  const isUsingDemoData = hasExampleSchools || !keyDataEdited;

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
        accion: "Reducir brecha, confirmar financiación y mantener buffer.",
      },
      {
        label: "Riesgo de inglés",
        nivel: profile.ingles === "alto" ? "Bajo" : profile.ingles === "medio" ? "Medio" : "Alto",
        explicacion: profile.ingles === "alto" ? "Nivel funcional para progresar." : "Puede impactar ritmo y rendimiento formativo.",
        accion: "Definir plan de mejora y validar objetivo ICAO.",
      },
      {
        label: "Riesgo de escuela/datos",
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

  const resumenPadresText = useMemo(() => {
    const riesgosAltos = riskDiagnosis.filter((r) => r.nivel === "Alto" || r.nivel === "Crítico").map((r) => `- ${r.label}: ${r.nivel}`);
    const pendientes = decisionReadiness.faltanDatos.slice(0, 5).map((p) => `- ${p}`);
    return `RESUMEN PARA PADRES / FAMILIA - FLYPATH CAREER PLANNER

Situación actual de ${profile.nombre || "el candidato"}:
- Coste optimista estimado: ${euro(costs.totalOptimista)}
- Coste realista estimado: ${euro(costs.totalRealista)}
- Coste conservador estimado: ${euro(costs.totalConservador)}
- Brecha financiera actual: ${euro(costs.brechaFinanciacion)}
- ¿Listo para pagar?: ${decisionReadiness.score}/100 (${decisionReadiness.decision})

Conclusión práctica:
${shouldPayNow ? "Puede avanzar con condiciones y control documental estricto." : "No conviene pagar matrícula o depósito todavía."}

Riesgos relevantes ahora mismo:
${riesgosAltos.length ? riesgosAltos.join("\n") : "- No hay riesgos altos/críticos dominantes, pero se recomienda validar documentación por escrito."}

Información que falta antes de transferir dinero:
${pendientes.length ? pendientes.join("\n") : "- No hay pendientes críticos detectados en este momento."}

Preguntas clave para una escuela:
- ¿Qué incluye exactamente el precio y qué no?
- ¿Cuál es la política de reembolso por escrito?
- ¿Está incluido MCC/JOC y Advanced UPRT?
- ¿Cuál es la duración media real del programa?
- ¿Cuál es el calendario de pagos completo antes de pagar depósito?

Decisiones que conviene evitar por ahora:
- Pagar por presión comercial sin contrato y condiciones por escrito.
- Asumir promesas de empleo como garantía.
- Firmar sin validar costes extra (tasas, skill tests, repeticiones, alojamiento).`;
  }, [profile.nombre, costs.totalOptimista, costs.totalRealista, costs.totalConservador, costs.brechaFinanciacion, decisionReadiness.score, decisionReadiness.decision, decisionReadiness.faltanDatos, riskDiagnosis, shouldPayNow]);

  const informeCompletoText = useMemo(() => {
    return `INFORME FLYPATH CAREER PLANNER

Nombre: ${profile.nombre || "Usuario"}
Ruta recomendada: ${route.recommended}
Preparación para decidir: ${decisionReadiness.score}/100
Decisión recomendada: ${decisionReadiness.decision}
¿Conviene pagar ahora?: ${shouldPayNow ? "Sí, con condiciones" : "No, por ahora"}
Razón principal: ${route.reason}
Bloqueo principal: ${route.principalBlock}

Costes y financiación:
- Optimista: ${euro(costs.totalOptimista)}
- Realista: ${euro(costs.totalRealista)}
- Conservador: ${euro(costs.totalConservador)}
- Brecha financiera: ${euro(costs.brechaFinanciacion)}
- Meses para cerrar brecha: ${costs.mesesCerrarBrecha}
- Cobertura: ${costs.coverage}%

Riesgos principales:
${riskDiagnosis.map((r) => `- ${r.label}: ${r.nivel} (${r.explicacion})`).join("\n")}

Escuelas:
- Comparadas: ${schools.length}
- Verificadas: ${schoolStats.verifiedCount}
- Pendientes: ${schoolStats.pendingCount}

Datos pendientes:
${decisionReadiness.faltanDatos.length ? decisionReadiness.faltanDatos.map((x) => `- ${x}`).join("\n") : "- Sin pendientes críticos."}

Próximos pasos:
${decisionReadiness.proximosPasos.map((x) => `- ${x}`).join("\n")}

Disclaimer:
${disclaimerText}`;
  }, [
    profile.nombre,
    route.recommended,
    route.reason,
    route.principalBlock,
    decisionReadiness.score,
    decisionReadiness.decision,
    decisionReadiness.faltanDatos,
    decisionReadiness.proximosPasos,
    shouldPayNow,
    costs.totalOptimista,
    costs.totalRealista,
    costs.totalConservador,
    costs.brechaFinanciacion,
    costs.mesesCerrarBrecha,
    costs.coverage,
    riskDiagnosis,
    schools.length,
    schoolStats.verifiedCount,
    schoolStats.pendingCount,
  ]);

  const resetDemoData = () => {
    if (typeof window !== "undefined" && !window.confirm("¿Seguro que quieres resetear los datos demo? Esta acción no se puede deshacer.")) return;
    localStorage.removeItem("flypath_profile");
    localStorage.removeItem("flypath_cost_inputs");
    localStorage.removeItem("flypath_schools");
    localStorage.removeItem("flypath_onboarding_completed");
    setProfile(defaultProfile);
    setCostInputs(defaultCostInputs);
    setSchools(exampleSchools);
    setOnboardingCompleted(false);
    setOnboardingStep(1);
    setScreen("landing");
    showToast("Datos demo reseteados");
  };

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

  const addSchool = (fromOnboarding = false) => {
    if (!newSchool.nombre.trim()) return;
    if (fromOnboarding && schools.length >= 3) return;
    setSchools((prev) => [...prev, { ...newSchool, id: Date.now() }]);
    setNewSchool((prev) => ({ ...prev, nombre: "", pais: "", ciudad: "", precioAnunciado: 0, duracionMeses: 18, notas: "", enlaceReferencia: "" }));
    showToast("Escuela añadida");
  };

  const finishOnboarding = () => {
    setOnboardingCompleted(true);
    setScreen("dashboard");
    setTab("route");
  };

  const navItems: Array<{ id: Tab; label: string }> = [
    { id: "route", label: "Planificador de ruta" },
    { id: "cost", label: "Costes" },
    { id: "schools", label: "Escuelas" },
    { id: "plan", label: "Plan de acción" },
    { id: "readiness", label: "¿Listo para pagar?" },
    { id: "report", label: "Informe final" },
  ];

  const stepMeta: Record<number, { title: string; desc: string }> = {
    1: { title: "Perfil", desc: "Define tu punto de partida profesional." },
    2: { title: "Medical e inglés", desc: "Valida bloqueos operativos críticos." },
            3: { title: "Presupuesto", desc: "Alinea capacidad económica y riesgo." },
    4: { title: "Disponibilidad", desc: "Calcula ritmo realista de progreso." },
    5: { title: "Escuelas", desc: "Carga referencias iniciales para comparar." },
            6: { title: "Resultado inicial", desc: "Visualiza recomendación y brechas." },
  };

  if (screen === "landing") {
    return (
      <div className="min-h-screen bg-[#081329] text-white">
        <style jsx global>{globalButtonFeedbackStyles}</style>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-sm text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toast}
          </motion.div>
        )}
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#c9a454]/20 p-2"><Plane className="h-4 w-4 text-[#f2ddaa]" /></div>
              <p className="font-semibold">FlyPath Career Planner</p>
            </div>
            <button
              type="button"
              onClick={() => setScreen(onboardingCompleted ? "dashboard" : "onboarding")}
              className="landing-cta-secondary rounded-lg px-4 py-2 text-sm font-medium"
            >
              Ver demo
            </button>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#c9a454]/35 bg-[#c9a454]/10 px-3 py-1 text-xs tracking-[0.16em] text-[#f2ddaa]">FLYPATH CAREER PLANNER</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Planifica tu ruta como piloto antes de tomar decisiones caras.</h1>
              <p className="mt-5 text-lg text-slate-200">Calcula costes reales, compara rutas y analiza escuelas antes de invertir miles de euros.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }}
                  className="landing-cta-primary inline-flex items-center rounded-xl px-6 py-3 font-semibold"
                >
                  Crear mi plan
                  <ArrowRight className="landing-arrow ml-2 h-4 w-4 transition-transform duration-150" />
                </button>
                <button
                  type="button"
                  onClick={() => setScreen(onboardingCompleted ? "dashboard" : "onboarding")}
                  className="landing-cta-secondary rounded-xl px-6 py-3 text-sm font-medium"
                >
                  Ver demo
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6">
              <p className="text-sm text-slate-300">Resumen inicial</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <KpiMini label="Ruta recomendada" value={route.recommended} />
                <KpiMini label="Coste realista" value={euro(costs.totalRealista)} />
                <KpiMini label="Brecha de financiación" value={euro(costs.brechaFinanciacion)} />
                <KpiMini label="Riesgo principal" value={route.principalBlock} />
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            <LandingFeature title="El problema" text="Costes incompletos, promesas ambiguas y decisiones tomadas con poca evidencia." />
            <LandingFeature title="Qué hace el planner" text="Estructura datos, compara escenarios y reduce riesgo antes de pagar." />
            <LandingFeature title="Cómo funciona" text="Onboarding guiado, análisis de rutas, comparador y reporte final accionable." />
          </div>

          <div className="mt-12 rounded-3xl border border-[#c9a454]/35 bg-[#0d1d3a] p-8 text-center">
            <h2 className="text-3xl font-semibold">Toma decisiones de carrera con claridad y criterio.</h2>
            <p className="mx-auto mt-3 max-w-3xl text-slate-200">No decidas por marketing ni presión comercial: decide por evidencia y planificación.</p>
            <button
              type="button"
              onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }}
              className="landing-cta-primary mt-6 rounded-xl px-6 py-3 font-semibold"
            >
              Crear mi plan
            </button>
          </div>

          <div className="mt-10 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-slate-200">{disclaimerText}</div>
        </div>
      </div>
    );
  }

  if (screen === "onboarding") {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
        <style jsx global>{globalButtonFeedbackStyles}</style>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-sm text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toast}
          </motion.div>
        )}
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Crear mi plan - Paso {onboardingStep} de 6</p>
            <h1 className="mt-1 text-2xl font-semibold">{stepMeta[onboardingStep].title}</h1>
            <p className="mt-1 text-sm text-slate-600">{stepMeta[onboardingStep].desc}</p>
            <div className="mt-4 rounded-full bg-slate-100 p-1"><Progress value={(onboardingStep / 6) * 100} tone="bg-[#0f1a33]" /></div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              {onboardingStep === 1 && <div className="grid gap-4 md:grid-cols-2"><TextField label="Nombre" value={profile.nombre} onChange={(v)=>setProfile(p=>({...p,nombre:v}))} /><NumberField label="Edad" value={profile.edad} onChange={(v)=>setProfile(p=>({...p,edad:v}))} /><TextField label="País" value={profile.pais} onChange={(v)=>setProfile(p=>({...p,pais:v}))} /><SelectField label="Situación laboral" value={profile.situacionLaboral} options={[{value:"estudiante",label:"Estudiante"},{value:"trabajando",label:"Trabajando"},{value:"desempleado",label:"Desempleado"},{value:"otro",label:"Otro"}]} onChange={(v)=>setProfile(p=>({...p,situacionLaboral:v as Profile["situacionLaboral"]}))} /><SelectField label="Objetivo" value={profile.objetivo} options={[{value:"aerolinea",label:"Aerolínea"},{value:"ejecutivo",label:"Ejecutivo"},{value:"instructor",label:"Instructor"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setProfile(p=>({...p,objetivo:v as Profile["objetivo"]}))} /></div>}
              {onboardingStep === 2 && <div className="grid gap-4 md:grid-cols-2"><SelectField label="Class 1" value={profile.class1} options={[{value:"si",label:"Sí"},{value:"no",label:"No"},{value:"reservado",label:"Reservado"}]} onChange={(v)=>setProfile(p=>({...p,class1:v as Profile["class1"]}))} /><SelectField label="Class 2" value={profile.class2} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,class2:v as Profile["class2"]}))} /><SelectField label="Nivel de inglés" value={profile.ingles} options={[{value:"bajo",label:"Bajo"},{value:"medio",label:"Medio"},{value:"alto",label:"Alto"}]} onChange={(v)=>setProfile(p=>({...p,ingles:v as Profile["ingles"]}))} /><SelectField label="ICAO level" value={profile.icaoLevel} options={[{value:"0",label:"0"},{value:"4",label:"4"},{value:"5",label:"5"},{value:"6",label:"6"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setProfile(p=>({...p,icaoLevel:v as Profile["icaoLevel"]}))} /><SelectField label="Preocupación por inglés" value={profile.preocupacionIngles} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,preocupacionIngles:v as Profile["preocupacionIngles"]}))} /></div>}
              {onboardingStep === 3 && <div className="grid gap-4 md:grid-cols-2"><NumberField label="Dinero disponible ahora" value={profile.dineroDisponible} onChange={(v)=>setProfile(p=>({...p,dineroDisponible:v}))} /><NumberField label="Ahorro mensual posible" value={profile.ahorroMensual} onChange={(v)=>setProfile(p=>({...p,ahorroMensual:v}))} /><SelectField label="Financiación" value={profile.financiacion} options={[{value:"confirmada",label:"Confirmada"},{value:"posible",label:"Posible"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,financiacion:v as Profile["financiacion"]}))} /><SelectField label="Apoyo familiar" value={profile.apoyoFamiliar} options={[{value:"si",label:"Sí"},{value:"parcial",label:"Parcial"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,apoyoFamiliar:v as Profile["apoyoFamiliar"]}))} /><NumberField label="Inversión máxima aceptable" value={profile.inversionMaxima} onChange={(v)=>setProfile(p=>({...p,inversionMaxima:v}))} /><SelectField label="Tolerancia al riesgo financiero" value={profile.toleranciaRiesgo} options={[{value:"baja",label:"Baja"},{value:"media",label:"Media"},{value:"alta",label:"Alta"}]} onChange={(v)=>setProfile(p=>({...p,toleranciaRiesgo:v as Profile["toleranciaRiesgo"]}))} /></div>}
              {onboardingStep === 4 && <div className="grid gap-4 md:grid-cols-2"><SelectField label="Disponibilidad" value={profile.disponibilidad} options={[{value:"full-time",label:"Full-time"},{value:"part-time",label:"Part-time"}]} onChange={(v)=>setProfile(p=>({...p,disponibilidad:v as Profile["disponibilidad"]}))} /><NumberField label="Horas por semana" value={profile.horasSemana} onChange={(v)=>setProfile(p=>({...p,horasSemana:v}))} /><SelectField label="Necesita trabajar durante formación" value={profile.necesitaTrabajar} options={[{value:"si",label:"Sí"},{value:"no",label:"No"}]} onChange={(v)=>setProfile(p=>({...p,necesitaTrabajar:v as Profile["necesitaTrabajar"]}))} /><SelectField label="Movilidad" value={profile.movilidad} options={[{value:"solo_espana",label:"Solo España"},{value:"europa",label:"Europa"},{value:"mundial",label:"Mundial"}]} onChange={(v)=>setProfile(p=>({...p,movilidad:v as Profile["movilidad"]}))} /><SelectField label="Urgencia" value={profile.urgencia} options={[{value:"baja",label:"Baja"},{value:"media",label:"Media"},{value:"alta",label:"Alta"}]} onChange={(v)=>setProfile(p=>({...p,urgencia:v as Profile["urgencia"]}))} /></div>}
              {onboardingStep === 5 && <div className="space-y-4"><p className="text-sm text-slate-600">Puedes añadir hasta 3 escuelas iniciales.</p><div className="grid gap-4 md:grid-cols-2"><TextField label="Nombre" value={newSchool.nombre} onChange={(v)=>setNewSchool(s=>({...s,nombre:v}))} /><TextField label="País" value={newSchool.pais} onChange={(v)=>setNewSchool(s=>({...s,pais:v}))} /><NumberField label="Precio anunciado" value={newSchool.precioAnunciado} onChange={(v)=>setNewSchool(s=>({...s,precioAnunciado:v}))} /><NumberField label="Duración anunciada" value={newSchool.duracionMeses} onChange={(v)=>setNewSchool(s=>({...s,duracionMeses:v}))} /><SelectField label="Programa" value={newSchool.programa} options={[{value:"integrado",label:"Integrado"},{value:"modular",label:"Modular"},{value:"cadet",label:"Cadet"},{value:"no_lo_se",label:"No lo sé"}]} onChange={(v)=>setNewSchool(s=>({...s,programa:v as School["programa"]}))} /><SelectField label="Fuente del dato" value={newSchool.fuentePrecio} options={[{value:"web_oficial",label:"Web oficial"},{value:"email_escuela",label:"Email escuela"},{value:"llamada",label:"Llamada"},{value:"folleto",label:"Folleto"},{value:"alumno",label:"Alumno"},{value:"redes",label:"Redes"},{value:"usuario",label:"Usuario"},{value:"no_verificado",label:"No verificado"}]} onChange={(v)=>setNewSchool(s=>({...s,fuentePrecio:v as School["fuentePrecio"]}))} /><TextField label="Fecha de actualización" value={newSchool.fechaActualizacion} onChange={(v)=>setNewSchool(s=>({...s,fechaActualizacion:v}))} /><SelectField label="Estado de verificación" value={newSchool.estadoVerificacion} options={[{value:"verificado",label:"Verificado"},{value:"parcialmente_verificado",label:"Parcialmente verificado"},{value:"no_verificado",label:"No verificado"},{value:"pendiente",label:"Pendiente"}]} onChange={(v)=>setNewSchool(s=>({...s,estadoVerificacion:v as School["estadoVerificacion"]}))} /></div><button onClick={()=>addSchool(true)} disabled={schools.length>=3} className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Añadir escuela inicial</button></div>}
              {onboardingStep === 6 && <div className="grid gap-4 md:grid-cols-2"><InfoCard label="Ruta recomendada" value={route.recommended} /><InfoCard label="Razón principal" value={route.reason} /><InfoCard label="Coste realista" value={euro(costs.totalRealista)} /><InfoCard label="Brecha de financiación" value={euro(costs.brechaFinanciacion)} /></div>}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
              <button onClick={() => setOnboardingStep((s) => Math.max(1, s - 1))} disabled={onboardingStep === 1} className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm shadow-sm transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
              {onboardingStep < 6 ? (
                <button onClick={() => setOnboardingStep((s) => Math.min(6, s + 1))} className="cursor-pointer rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm text-white shadow-sm transition hover:bg-[#1b45c2] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/50">Siguiente</button>
              ) : (
                <button onClick={finishOnboarding} className="cursor-pointer rounded-lg bg-[#0f766e] px-4 py-2 text-sm text-white shadow-sm transition hover:bg-[#0d665f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50">Ir al dashboard</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
      <style jsx global>{globalButtonFeedbackStyles}</style>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-sm text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {toast}
        </motion.div>
      )}
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 h-screen w-72 border-r border-slate-200 bg-[#0f1a33] px-5 py-6 text-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#c9a454]/15 p-2"><Plane className="h-5 w-5 text-[#f2ddaa]" /></div>
            <div><p className="font-semibold">FlyPath Career Planner</p><p className="text-xs text-slate-300">Planner de decisión</p></div>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`w-full rounded-xl px-3 py-3 text-left text-sm ${tab === item.id ? "bg-white text-[#0f1a33]" : "text-slate-200 hover:bg-white/10"}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 space-y-2">
            <button onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }} className="w-full cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">Editar mis datos</button>
            <button onClick={resetDemoData} className="w-full cursor-pointer rounded-lg border border-rose-400/40 bg-[#8b1f1f] px-3 py-2 text-sm text-white shadow-sm transition hover:bg-[#7a1b1b] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50">Restaurar demo</button>
          </div>
        </aside>
        <main className="flex-1 px-8 py-6">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tu diagnóstico inicial</p>
            <h1 className="text-2xl font-semibold">{profile.nombre || "Usuario"}</h1>
            <p className="text-sm text-slate-500">Esta es una estimación basada en los datos introducidos.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Ruta recomendada" value={route.recommended} />
              <SummaryCard label="Coste realista" value={euro(costs.totalRealista)} />
              <SummaryCard label="Brecha financiera" value={euro(costs.brechaFinanciacion)} />
              <SummaryCard label="¿Listo para pagar?" value={decisionReadiness.decision} />
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">Lectura rápida</p>
              <p className="mt-1 text-slate-700">
                Este diagnóstico resume tu situación actual. La prioridad no es elegir escuela rápido, sino validar si puedes avanzar sin asumir un riesgo innecesario.
              </p>
              {profile.class1 !== "si" && <p className="mt-2 text-slate-700">El primer bloqueo a resolver es la <strong>Clase 1</strong>.</p>}
            </div>
            <div className={`mt-3 rounded-xl border p-3 text-sm ${isUsingDemoData ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              <p>
                {isUsingDemoData
                  ? "Estás viendo datos demo. Edita el onboarding, costes y escuelas para obtener un resultado realista."
                  : "Ya estás usando datos más realistas. Mantén la información actualizada para mejorar la precisión del diagnóstico."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }} className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1 text-xs transition hover:bg-slate-50">Editar mis datos</button>
                <button onClick={() => { setSchools((prev) => prev.filter((s) => !s.isExample)); showToast("Ejemplos eliminados"); }} className="cursor-pointer rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs text-rose-700 transition hover:bg-rose-100">Eliminar ejemplos</button>
              </div>
            </div>
            {tab === "route" && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-medium">Siguiente paso prioritario</p>
                  <p className="mt-1 text-slate-700">
                    {profile.class1 !== "si"
                      ? "Prioridad: confirma Clase 1 antes de comparar escuelas."
                      : route.warnings.find((w) => !w.toLowerCase().includes("no pagues escuela todavía")) || "Pedir desglose y contrato antes de pagar depósito."}
                  </p>
                </div>
                {route.principalBlock === "Clase 1 no confirmada" && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <p className="font-medium">No pagar escuela todavía</p>
                    <p>Confirma Clase 1 primero para evitar compromisos de alto riesgo.</p>
                  </div>
                )}
              </div>
            )}
          </header>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {tab === "route" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#1d4ed8]/20 bg-gradient-to-br from-[#eef4ff] to-white p-5">
                  <p className="text-sm font-semibold text-[#0f1a33]">Ruta recomendada</p>
                  <p className="mt-2 text-3xl font-bold text-[#0f1a33]">{route.recommended}</p>
                  <p className="mt-2 text-sm text-slate-700"><strong>Por qué importa:</strong> {route.reason}</p>
                  <p className="mt-1 text-sm text-slate-700"><strong>Bloqueo principal:</strong> {route.principalBlock}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Esta recomendación no significa que solo tengas una opción. Significa qué ruta parece más prudente con tus datos actuales.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Qué hacer ahora</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {profile.class1 !== "si"
                      ? "Reserva o confirma Clase 1 antes de avanzar con pagos."
                      : "Compara al menos 2 escuelas con datos verificados."}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Comparación de rutas</p>
                  <p className="mb-3 text-xs text-slate-600">Estos porcentajes son referencia secundaria para comparar encaje según tu situación actual.</p>
                  <div className="grid gap-3 lg:grid-cols-4">
                    <RouteOption title="Integrada" value={route.integrated} />
                    <RouteOption title="Modular" value={route.modular} />
                    <RouteOption title="Híbrida" value={route.hybrid} />
                    <RouteOption title="Preparación" value={route.prep} />
                  </div>
                </div>
                <details className="rounded-xl border border-slate-200 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver riesgos y conflictos detectados</summary>
                  <div className="mt-3 space-y-2">
                    {route.warnings
                      .filter((w) => {
                        const lower = w.toLowerCase();
                        return !lower.includes("no pagues escuela todavía") && !lower.includes("no pagar escuela todavía");
                      })
                      .map((w) => <div key={w} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">{w}</div>)}
                    {route.conflicts.map((c) => <div key={c} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">{c}</div>)}
                  </div>
                </details>
              </div>
            )}
            {tab === "cost" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#1d4ed8]/20 bg-gradient-to-br from-[#eef4ff] to-white p-5">
                  <p className="text-sm font-semibold text-[#0f1a33]">Lectura financiera</p>
                  <p className="mt-2 text-3xl font-bold text-[#0f1a33]">{euro(costs.totalRealista)}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Cobertura estimada: <strong>{costs.coverage}%</strong> · Brecha financiera: <strong>{euro(costs.brechaFinanciacion)}</strong>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Con tus datos actuales, tu presupuesto cubre {costs.coverage}% del escenario realista. La brecha estimada es de {euro(costs.brechaFinanciacion)}. Esto no es un precio oficial, sino una referencia para decidir y preguntar mejor.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Qué hacer ahora</p>
                  <p className="text-sm text-slate-700">
                    {costs.brechaFinanciacion > 0
                      ? "No comprometas pagos hasta cerrar financiación o ajustar presupuesto."
                      : "Confirma que los costes reales de la escuela coinciden con este escenario."}
                  </p>
                </div>
                <FinancialCoverageCard
                  dineroDisponible={profile.dineroDisponible}
                  totalRealista={costs.totalRealista}
                  brechaFinanciacion={costs.brechaFinanciacion}
                  coverage={costs.coverage}
                />
                <details className="rounded-xl border border-slate-200 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver escenarios de coste</summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <SummaryCard label="Total optimista" value={euro(costs.totalOptimista)} />
                      <SummaryCard label="Total realista" value={euro(costs.totalRealista)} />
                      <SummaryCard label="Total conservador" value={euro(costs.totalConservador)} />
                    </div>
                    <CostBreakdownBars
                      totalRealista={costs.totalRealista}
                      subtotalFormacion={costs.subtotalFormacion}
                      subtotalExtras={costs.subtotalExtras}
                      subtotalVida={costs.subtotalVida}
                      buffer={costs.buffer}
                    />
                    <ScenarioBars totalOptimista={costs.totalOptimista} totalRealista={costs.totalRealista} totalConservador={costs.totalConservador} />
                  </div>
                </details>
                <details className="rounded-xl border border-slate-200 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Editar desglose completo</summary>
                  <div className="mt-4 space-y-4">
                    <CostBlock title="Formación">
                      <NumberField label="PPL" value={costInputs.ppl} onChange={(v) => setCostInputs((c) => ({ ...c, ppl: v }))} />
                      <NumberField label="Teoría ATPL" value={costInputs.atplTheory} onChange={(v) => setCostInputs((c) => ({ ...c, atplTheory: v }))} />
                      <NumberField label="Horas de vuelo / Hour building" value={costInputs.hourBuilding} onChange={(v) => setCostInputs((c) => ({ ...c, hourBuilding: v }))} />
                      <NumberField label="CPL" value={costInputs.cpl} onChange={(v) => setCostInputs((c) => ({ ...c, cpl: v }))} />
                      <NumberField label="MEP" value={costInputs.mep} onChange={(v) => setCostInputs((c) => ({ ...c, mep: v }))} />
                      <NumberField label="IR" value={costInputs.ir} onChange={(v) => setCostInputs((c) => ({ ...c, ir: v }))} />
                      <NumberField label="MCC/JOC" value={costInputs.mccJoc} onChange={(v) => setCostInputs((c) => ({ ...c, mccJoc: v }))} />
                      <NumberField label="Advanced UPRT" value={costInputs.advancedUprt} onChange={(v) => setCostInputs((c) => ({ ...c, advancedUprt: v }))} />
                    </CostBlock>
                    <CostBlock title="Extras">
                      <NumberField label="Reconocimiento médico Clase 1" value={costInputs.class1Medical} onChange={(v) => setCostInputs((c) => ({ ...c, class1Medical: v }))} />
                      <NumberField label="Tasas exámenes" value={costInputs.tasasExamenes} onChange={(v) => setCostInputs((c) => ({ ...c, tasasExamenes: v }))} />
                      <NumberField label="Skill tests" value={costInputs.skillTests} onChange={(v) => setCostInputs((c) => ({ ...c, skillTests: v }))} />
                      <NumberField label="Equipo" value={costInputs.equipo} onChange={(v) => setCostInputs((c) => ({ ...c, equipo: v }))} />
                      <NumberField label="Headset" value={costInputs.headset} onChange={(v) => setCostInputs((c) => ({ ...c, headset: v }))} />
                      <NumberField label="iPad/apps/cartas" value={costInputs.ipadAppsCartas} onChange={(v) => setCostInputs((c) => ({ ...c, ipadAppsCartas: v }))} />
                      <NumberField label="Uniforme/material" value={costInputs.uniformeMaterial} onChange={(v) => setCostInputs((c) => ({ ...c, uniformeMaterial: v }))} />
                      <NumberField label="Repeticiones" value={costInputs.repeticiones} onChange={(v) => setCostInputs((c) => ({ ...c, repeticiones: v }))} />
                      <NumberField label="Type rating opcional" value={costInputs.typeRatingOpcional} onChange={(v) => setCostInputs((c) => ({ ...c, typeRatingOpcional: v }))} />
                    </CostBlock>
                    <CostBlock title="Vida y logística">
                      <NumberField label="Alojamiento" value={costInputs.alojamiento} onChange={(v) => setCostInputs((c) => ({ ...c, alojamiento: v }))} />
                      <NumberField label="Transporte" value={costInputs.transporte} onChange={(v) => setCostInputs((c) => ({ ...c, transporte: v }))} />
                      <NumberField label="Comida" value={costInputs.comida} onChange={(v) => setCostInputs((c) => ({ ...c, comida: v }))} />
                      <NumberField label="Otros gastos de vida" value={costInputs.otrosGastosVida} onChange={(v) => setCostInputs((c) => ({ ...c, otrosGastosVida: v }))} />
                      <NumberField label="Buffer %" value={costInputs.bufferPct} onChange={(v) => setCostInputs((c) => ({ ...c, bufferPct: v }))} />
                    </CostBlock>
                  </div>
                </details>
                <details className="rounded-xl border border-slate-200 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver fórmulas y detalles técnicos</summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <SummaryCard label="Brecha financiera" value={euro(costs.brechaFinanciacion)} />
                      <SummaryCard label="Meses para cerrar brecha" value={String(costs.mesesCerrarBrecha)} />
                      <SummaryCard label="Riesgo financiero" value={costs.riesgoFinanciero} />
                      <SummaryCard label="Subtotal formación" value={euro(costs.subtotalFormacion)} />
                      <SummaryCard label="Subtotal extras" value={euro(costs.subtotalExtras)} />
                      <SummaryCard label="Subtotal vida" value={euro(costs.subtotalVida)} />
                    </div>
                    <p className="text-sm text-slate-700">Brecha financiera = lo que falta para cubrir el escenario realista con tu dinero disponible.</p>
                    <p className="text-sm text-slate-700">Meses estimados = brecha financiera / ahorro mensual.</p>
                    <p className="text-sm text-slate-700">Cobertura = (dinero disponible / coste realista) x 100.</p>
                    {profile.ahorroMensual === 0 && costs.brechaFinanciacion > 0 && (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
                        No se puede estimar el tiempo para cerrar la brecha porque el ahorro mensual es 0.
                      </p>
                    )}
                  </div>
                </details>
              </div>
            )}
            {tab === "schools" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#1d4ed8]/20 bg-[#eef4ff] p-4">
                  <p className="text-sm font-semibold text-[#0f1a33]">Estado de la comparación</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Has comparado <strong>{schools.length}</strong> escuela(s), con <strong>{schoolStats.verifiedCount}</strong> verificada(s).
                    {hasExampleSchools ? " Sigues usando escuelas demo." : " Ya estás trabajando con escuelas reales."}{" "}
                    {schoolStats.bestSchool ? `La mejor opción actual es ${schoolStats.bestSchool.school.nombre}.` : "Todavía no hay suficiente información para decidir con seguridad."}
                  </p>
                  {schoolStats.verifiedCount === 0 && (
                    <p className="mt-2 text-sm text-slate-700">
                      Todavía no hay suficiente información verificada para elegir escuela con seguridad. El siguiente paso es pedir por escrito precio final, contrato, reembolso, MCC/JOC, UPRT y calendario de pagos.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Qué hacer ahora</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {hasExampleSchools
                      ? "Elimina ejemplos y añade escuelas reales."
                      : schools.length < 2
                      ? "Añade al menos 2 escuelas."
                      : schoolStats.verifiedCount === 0
                      ? "Pide confirmación por escrito usando el email inteligente."
                      : "Revisa red flags y confirma por escrito antes de comprometer dinero."}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{disclaimerText}</div>
                <button
                  onClick={() => {
                    setSchools((prev) => prev.filter((s) => !s.isExample));
                    showToast("Ejemplos eliminados");
                  }}
                  className="cursor-pointer rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 shadow-sm transition hover:bg-rose-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50"
                >
                  Eliminar ejemplos y empezar desde cero
                </button>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <TextField label="Nombre" value={newSchool.nombre} onChange={(v) => setNewSchool((s) => ({ ...s, nombre: v }))} />
                  <TextField label="País" value={newSchool.pais} onChange={(v) => setNewSchool((s) => ({ ...s, pais: v }))} />
                  <TextField label="Ciudad" value={newSchool.ciudad} onChange={(v) => setNewSchool((s) => ({ ...s, ciudad: v }))} />
                  <NumberField label="Precio anunciado" value={newSchool.precioAnunciado} onChange={(v) => setNewSchool((s) => ({ ...s, precioAnunciado: v }))} />
                  <NumberField label="Duración meses" value={newSchool.duracionMeses} onChange={(v) => setNewSchool((s) => ({ ...s, duracionMeses: v }))} />
                  <TextField label="Fecha de actualización" value={newSchool.fechaActualizacion} onChange={(v) => setNewSchool((s) => ({ ...s, fechaActualizacion: v }))} />
                </div>
                <button onClick={() => addSchool(false)} className="cursor-pointer rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm text-white shadow-sm transition hover:bg-[#1b45c2] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/50">Añadir escuela</button>
                {schoolStats.analyzed.map(({ school, analysis }) => (
                  <div key={school.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{school.nombre}</p>
                        <p className="text-sm text-slate-500">{school.ciudad}, {school.pais} · {euro(school.precioAnunciado)} · {school.duracionMeses} meses</p>
                      </div>
                      <button
                        type="button"
                        className={`${generatedEmailKey === school.id ? "action-success-pulse border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white"} inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40`}
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
                        {generatedEmailKey === school.id ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> : <Mail className="mr-2 h-4 w-4" />}
                        {generatedEmailKey === school.id ? "Email generado" : "Generar email"}
                      </button>
                    </div>
                    <InfoCard label="Recomendación prudente" value={recomendacionLabel(analysis.recomendacionPrudente)} />
                    <InfoList title="Red flags" items={analysis.redFlags} empty="Información insuficiente" />
                    <InfoList title="Preguntas pendientes" items={analysis.preguntasPendientes} empty="Sin preguntas pendientes" />
                    <details className="mt-3 rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver métricas técnicas</summary>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <InfoCard label="Claridad de coste" value={String(analysis.claridadCoste)} />
                        <InfoCard label="Transparencia" value={String(analysis.transparencia)} />
                        <InfoCard label="Riesgo financiero" value={String(analysis.riesgoFinanciero)} />
                        <InfoCard label="Riesgo operacional" value={String(analysis.riesgoOperacional)} />
                        <InfoCard label="Riesgo de marketing" value={String(analysis.riesgoMarketing)} />
                        <InfoCard label="Nivel de verificación" value={String(analysis.verificacion)} />
                        <InfoCard label="Encaje general" value={String(analysis.encajeGeneral)} />
                      </div>
                    </details>
                    {emailDrafts[school.id] && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <InfoList
                          title="Este email se ha adaptado porque faltan estos datos:"
                          items={emailPendingBySchool[school.id] || []}
                          empty="No faltan datos críticos detectados para esta escuela."
                        />
                        <p className="mb-2 mt-2 text-xs font-medium text-emerald-700">Email listo para copiar</p>
                        <button
                          type="button"
                          className={`${copiedKey === `email-${school.id}` ? "action-success-pulse border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white"} mb-2 inline-flex cursor-pointer items-center rounded-md border px-2 py-1 text-xs shadow-sm transition hover:bg-slate-50 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40`}
                          onClick={async () => {
                            const ok = await copyText(emailDrafts[school.id]);
                            if (ok) markCopied(`email-${school.id}`);
                            showToast(ok ? "Email copiado" : "No se pudo copiar el email");
                          }}
                        >
                          {copiedKey === `email-${school.id}` ? <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" /> : <Copy className="mr-1 h-3 w-3" />}
                          {copiedKey === `email-${school.id}` ? "Copiado" : "Copiar email"}
                        </button>
                        <pre className="whitespace-pre-wrap text-xs">{emailDrafts[school.id]}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {tab === "plan" && (
              <div className="grid gap-4 lg:grid-cols-3">
                <PlanColumn title="Próximos 7 días" tasks={[profile.class1 !== "si" ? "Reserva Clase 1 antes de pagar escuela." : "Actualizar estado Clase 1.", "Solicitar desglose por escrito a 3 escuelas.", "Definir límite máximo de inversión."]} />
                <PlanColumn title="Próximos 30 días" tasks={["Comparar escenarios optimista/realista/conservador.", "Confirmar tasas, skill tests, MCC/JOC y UPRT.", profile.ingles === "bajo" ? "Iniciar plan intensivo de inglés." : "Mantener práctica semanal ATC."]} />
                <PlanColumn title="Próximos 90 días" tasks={["Decidir solo con contrato y reembolso claros.", "Asegurar buffer financiero.", "Evitar decisiones por presión comercial."]} />
              </div>
            )}
            {tab === "readiness" && (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-5 ${decisionReadiness.decision === "No pagues todavía" ? "border-rose-200 bg-rose-50" : "border-[#1d4ed8]/20 bg-gradient-to-br from-[#eef4ff] via-white to-[#f8fbff]"}`}>
                  <p className="text-3xl font-bold text-[#0f1a33]">{decisionReadiness.decision}</p>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="mt-1 text-4xl font-bold text-[#0f1a33]">{decisionReadiness.score}<span className="text-lg font-semibold text-slate-500">/100</span></p>
                    <div className="mt-2"><Progress value={decisionReadiness.score} tone="bg-[#1d4ed8]" /></div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{decisionReadiness.explanation}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700">Motivo principal</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {decisionReadiness.bloqueosCriticos[0] || decisionReadiness.faltanDatos[0] || "No hay bloqueos críticos dominantes."}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Antes de pagar, falta</p>
                  <InfoList title="Datos pendientes clave" items={decisionReadiness.faltanDatos.slice(0, 5)} empty="No faltan datos críticos para el siguiente paso." />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Próximos pasos</p>
                  <InfoList title="Próximos 3 pasos" items={decisionReadiness.proximosPasos} empty="Sin pasos pendientes." />
                </div>
              </div>
            )}
            {tab === "report" && (
              <div className="space-y-4">
                <Panel title="1. Resumen ejecutivo">
                  <div className="rounded-xl border border-[#1d4ed8]/20 bg-[#eef4ff] p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                      <InfoCard label="Decisión" value={decisionReadiness.decision} />
                      <InfoCard label="Ruta" value={route.recommended} />
                      <InfoCard label="Coste realista" value={euro(costs.totalRealista)} />
                      <InfoCard label="Brecha financiera" value={euro(costs.brechaFinanciacion)} />
                      <InfoCard label="Bloqueo principal" value={route.principalBlock} />
                      <InfoCard label="Próximo paso" value={decisionReadiness.proximosPasos[0] || "Confirmar datos críticos por escrito."} />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      La recomendación principal es <strong>{decisionReadiness.decision}</strong>. La ruta sugerida es <strong>{route.recommended}</strong>. El coste realista estimado es <strong>{euro(costs.totalRealista)}</strong>, con una brecha de <strong>{euro(costs.brechaFinanciacion)}</strong>.
                    </p>
                  </div>
                </Panel>
                <Panel title="2. Decisión antes de pagar">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoCard label="Decisión recomendada" value={decisionReadiness.decision} />
                    <InfoCard label="Preparación para decidir" value={`${decisionReadiness.score}/100`} />
                    <InfoCard label="Motivo principal" value={decisionReadiness.bloqueosCriticos[0] || decisionReadiness.faltanDatos[0] || "Sin bloqueos críticos dominantes"} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <InfoList title="Bloqueos críticos" items={decisionReadiness.bloqueosCriticos} empty="Sin bloqueos críticos detectados." />
                    <InfoList title="Datos pendientes" items={decisionReadiness.faltanDatos} empty="Sin datos pendientes críticos." />
                    <InfoList title="Próximos pasos" items={decisionReadiness.proximosPasos} empty="Sin próximos pasos pendientes." />
                  </div>
                </Panel>
                <Panel title="Costes y financiación">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoCard label="Coste optimista" value={euro(costs.totalOptimista)} />
                    <InfoCard label="Coste realista" value={euro(costs.totalRealista)} />
                    <InfoCard label="Coste conservador" value={euro(costs.totalConservador)} />
                    <InfoCard label="Brecha financiera" value={euro(costs.brechaFinanciacion)} />
                    <InfoCard label="Meses para cerrar brecha" value={String(costs.mesesCerrarBrecha)} />
                    <InfoCard label="Porcentaje cubierto" value={`${costs.coverage}%`} />
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    Estos importes son una referencia de trabajo para decidir con criterio y contrastar por escrito con cada escuela.
                  </p>
                  <div className="mt-3 space-y-4">
                    <CostBreakdownBars
                      totalRealista={costs.totalRealista}
                      subtotalFormacion={costs.subtotalFormacion}
                      subtotalExtras={costs.subtotalExtras}
                      subtotalVida={costs.subtotalVida}
                      buffer={costs.buffer}
                    />
                    <ScenarioBars totalOptimista={costs.totalOptimista} totalRealista={costs.totalRealista} totalConservador={costs.totalConservador} />
                    <FinancialCoverageCard
                      dineroDisponible={profile.dineroDisponible}
                      totalRealista={costs.totalRealista}
                      brechaFinanciacion={costs.brechaFinanciacion}
                      coverage={costs.coverage}
                    />
                  </div>
                </Panel>
                <Panel title="Riesgos principales">
                  <div className="grid gap-3 md:grid-cols-2">
                    {riskDiagnosis.filter((risk) => risk.nivel === "Crítico" || risk.nivel === "Alto").map((risk) => (
                      <div key={risk.label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{risk.label}</p>
                        <p className="mt-1 text-sm font-semibold text-[#0f1a33]">{risk.nivel}</p>
                        <p className="mt-1 text-sm text-slate-600">{risk.explicacion}</p>
                        <p className="mt-2 text-sm text-slate-700"><strong>Acción recomendada:</strong> {risk.accion}</p>
                      </div>
                    ))}
                  </div>
                  <details className="mt-3 rounded-lg border border-slate-200 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver riesgos secundarios</summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      {riskDiagnosis.filter((risk) => risk.nivel !== "Crítico" && risk.nivel !== "Alto").map((risk) => (
                        <div key={risk.label} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">{risk.label}</p>
                          <p className="mt-1 text-sm font-semibold text-[#0f1a33]">{risk.nivel}</p>
                          <p className="mt-1 text-sm text-slate-600">{risk.explicacion}</p>
                          <p className="mt-2 text-sm text-slate-700"><strong>Acción recomendada:</strong> {risk.accion}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </Panel>
                <Panel title="Escuelas y datos pendientes">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Escuelas comparadas" value={String(schools.length)} />
                    <InfoCard label="Escuelas verificadas" value={String(schoolStats.verifiedCount)} />
                    <InfoCard label="Escuelas pendientes" value={String(schoolStats.pendingCount)} />
                    <InfoCard label="Mejor escuela actual" value={schoolStats.bestSchool ? schoolStats.bestSchool.school.nombre : "Información insuficiente"} />
                  </div>
                  <div className="mt-3">
                    <InfoCard
                      label="Recomendación de mejor escuela"
                      value={schoolStats.bestSchool ? recomendacionLabel(schoolStats.bestSchool.analysis.recomendacionPrudente) : "No hay suficiente información para decidir escuela."}
                    />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <InfoList title="Red flags principales" items={schoolStats.bestSchool?.analysis.redFlags || []} empty="Sin red flags de escuelas detectadas." />
                    <InfoList title="Preguntas pendientes principales" items={schoolStats.bestSchool?.analysis.preguntasPendientes || ["Confirmar costes, contrato y reembolso."]} empty="Sin pendientes." />
                  </div>
                  <details className="mt-3 rounded-lg border border-slate-200 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver detalle ampliado de escuelas y fiabilidad</summary>
                    <div className="mt-2 text-sm text-slate-700">
                      <p>Fuente principal de costes: {schools[0]?.fuentePrecio || "no disponible"}</p>
                      <p>Fecha de actualización: {schools[0]?.fechaActualizacion || "no disponible"}</p>
                    </div>
                  </details>
                  {(!schoolStats.bestSchool || schoolStats.verifiedCount === 0) && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Aún no hay información suficiente para decidir con seguridad qué escuela elegir.
                    </p>
                  )}
                </Panel>
                <Panel title="Resumen para padres / familia">
                  <p className="text-sm text-slate-700">
                    Antes de pagar una matrícula o depósito, conviene confirmar por escrito qué incluye el precio, cuál es la política de reembolso,
                    si el MCC/JOC está incluido y cuál es la duración media real del programa.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Coste realista estimado" value={euro(costs.totalRealista)} />
                    <InfoCard label="Brecha financiera actual" value={euro(costs.brechaFinanciacion)} />
                    <InfoCard label="¿Listo para pagar?" value={decisionReadiness.decision} />
                    <InfoCard label="Riesgo dominante" value={riskDiagnosis.find((r) => r.nivel === "Crítico" || r.nivel === "Alto")?.label || "Sin riesgo dominante"} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <InfoList title="Información que falta antes de transferir dinero" items={decisionReadiness.faltanDatos} empty="No hay faltas críticas detectadas." />
                    <InfoList
                      title="Preguntas que deberían hacerse a una escuela"
                      items={[
                        "¿Qué incluye exactamente el precio final?",
                        "¿Cuál es la política de reembolso por escrito?",
                        "¿Está incluido MCC/JOC y Advanced UPRT?",
                        "¿Cuál es la duración media real del programa?",
                        "¿Cuál es el calendario de pagos completo?",
                      ]}
                      empty="Sin preguntas."
                    />
                  </div>
                  <InfoList
                    title="Decisiones que conviene evitar por ahora"
                    items={[
                      "Pagar por presión comercial sin contrato por escrito.",
                      "Asumir promesas de empleo como garantías.",
                      "Firmar sin validar tasas, skill tests y costes extra.",
                    ]}
                    empty="Sin bloqueos."
                  />
                  <button
                    onClick={async () => {
                      const ok = await copyText(resumenPadresText);
                      if (ok) markCopied("padres");
                      showToast(ok ? "Resumen para padres copiado" : "No se pudo copiar el resumen para padres");
                    }}
                    className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40"
                  >
                    {copiedKey === "padres" ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copiedKey === "padres" ? "Copiado" : "Copiar resumen para padres"}
                  </button>
                </Panel>
                <Panel title="Plan de acción">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <PlanColumn title="Próximos 7 días" tasks={[profile.class1 !== "si" ? "Reserva Clase 1 antes de pagar escuela." : "Actualizar estado Clase 1.", "Solicitar desglose por escrito a 3 escuelas.", "Definir límite máximo de inversión."]} />
                    <PlanColumn title="Próximos 30 días" tasks={["Comparar escenarios optimista/realista/conservador.", "Confirmar tasas, skill tests, MCC/JOC y UPRT.", profile.ingles === "bajo" ? "Iniciar plan intensivo de inglés." : "Mantener práctica semanal ATC."]} />
                    <PlanColumn title="Próximos 90 días" tasks={["Decidir solo con contrato y reembolso claros.", "Asegurar buffer financiero.", "Evitar decisiones por presión comercial."]} />
                  </div>
                </Panel>
                <Panel title="Disclaimer final">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{disclaimerText}</div>
                </Panel>
                <button
                  onClick={async () => {
                    const ok = await copyText(informeCompletoText);
                    if (ok) markCopied("informe");
                    showToast(ok ? "Resumen copiado" : "No se pudo copiar el resumen");
                  }}
                  className="inline-flex cursor-pointer items-center rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm text-white shadow-sm transition hover:bg-[#1b45c2] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/50"
                >
                  {copiedKey === "informe" ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-200" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copiedKey === "informe" ? "Copiado" : "Copiar resumen"}
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return <FlyPathApp />;
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/5 p-3"><p className="text-xs text-slate-300">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

function LandingFeature({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/15 bg-white/5 p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-slate-200">{text}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"><p className="mb-2 text-sm font-semibold">{title}</p>{children}</div>;
}

function YNField({ label, value, onChange }: { label: string; value: YesNoUnknown; onChange: (value: YesNoUnknown) => void }) {
  return <SelectField label={label} value={value} options={[{ value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "no_se", label: "No sé" }]} onChange={(v) => onChange(v as YesNoUnknown)} />;
}

function RouteOption({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between"><p className="font-medium">{title}</p><p className="text-sm font-semibold">{value}%</p></div>
      <div className="mt-2"><Progress value={value} tone="bg-[#1d4ed8]" /></div>
    </div>
  );
}

function CostBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="mb-3 text-sm font-semibold text-slate-700">{title}</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div></div>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
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
    { label: "Vida y logística", value: subtotalVida, tone: "bg-[#7c3aed]" },
    { label: "Buffer", value: buffer, tone: "bg-[#c9a454]" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">Desglose visual del coste realista</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const percentage = totalRealista > 0 ? (item.value / totalRealista) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">Escenarios de coste (no hay un único número)</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario) => {
          const height = (scenario.value / maxValue) * 100;
          return (
            <div key={scenario.label} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{scenario.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{euro(scenario.value)}</p>
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

function FinancialCoverageCard({
  dineroDisponible,
  totalRealista,
  brechaFinanciacion,
  coverage,
}: {
  dineroDisponible: number;
  totalRealista: number;
  brechaFinanciacion: number;
  coverage: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">Cobertura financiera</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <InfoCard label="Dinero disponible" value={euro(dineroDisponible)} />
        <InfoCard label="Coste realista" value={euro(totalRealista)} />
        <InfoCard label="Brecha de financiación" value={euro(brechaFinanciacion)} />
        <InfoCard label="Porcentaje cubierto" value={`${coverage}%`} />
      </div>
      <div className="mt-3"><Progress value={coverage} tone="bg-[#0f1a33]" /></div>
      <p className="mt-2 text-sm text-slate-600">Tu presupuesto actual cubre aproximadamente {coverage}% del escenario realista.</p>
      {brechaFinanciacion > 0 && (
        <p className="mt-1 text-sm text-slate-700">Te faltarían aproximadamente {euro(brechaFinanciacion)} para cubrir el escenario realista.</p>
      )}
    </div>
  );
}

function InfoList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="rounded-lg border border-slate-200 p-3"><p className="text-sm font-medium">{title}</p><ul className="mt-2 space-y-1 text-sm text-slate-700">{items.length ? items.map((item) => <li key={item}>- {item}</li>) : <li>{empty}</li>}</ul></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function PlanColumn({ title, tasks }: { title: string; tasks: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
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
  return <label className="block"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#1d4ed8]/20 focus:ring-2" /></label>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#1d4ed8]/20 focus:ring-2" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<string | { value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#1d4ed8]/20 focus:ring-2">
        {options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
