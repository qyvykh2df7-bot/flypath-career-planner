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
type Tab = "route" | "cost" | "schools" | "plan" | "readiness" | "report";
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

function buildSchoolEmail(school: School, nombreUsuario: string) {
  return `Asunto: Solicitud de desglose completo de costes y condiciones - ${school.nombre}\n\nHola equipo de ${school.nombre},\n\nSoy ${nombreUsuario || "un aspirante a piloto"} y estoy evaluando opciones de formación. Antes de tomar una decisión, necesito confirmar por escrito la información económica y operativa.\n\nAgradecería que me enviaran:\n\n1) Desglose completo de costes\n- Precio total del programa\n- Qué incluye y qué no incluye\n- Tasas de examen\n- Skill tests\n- MCC/JOC\n- Advanced UPRT\n- Alojamiento (si aplica)\n- Costes de repetición\n\n2) Pagos y condiciones\n- Depósito requerido\n- Calendario de pagos\n- Política de reembolso\n\n3) Operación real del programa\n- Duración media real del programa\n- Disponibilidad de flota e instructores\n- Posibilidad de hablar con alumnos actuales o antiguos\n\nSi tienen folleto actualizado, contrato tipo o anexo de condiciones, por favor inclúyanlo en la respuesta.\n\nGracias por vuestra ayuda.\n\nUn saludo,\n${nombreUsuario || ""}`;
}

function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text);
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [tab, setTab] = useState<Tab>("route");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [costInputs, setCostInputs] = useState<CostInputs>(defaultCostInputs);
  const [schools, setSchools] = useState<School[]>(exampleSchools);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [emailDrafts, setEmailDrafts] = useState<Record<number, string>>({});
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

  useEffect(() => localStorage.setItem("flypath_profile", JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem("flypath_cost_inputs", JSON.stringify(costInputs)), [costInputs]);
  useEffect(() => localStorage.setItem("flypath_schools", JSON.stringify(schools)), [schools]);
  useEffect(() => localStorage.setItem("flypath_onboarding_completed", JSON.stringify(onboardingCompleted)), [onboardingCompleted]);

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

  const resetDemoData = () => {
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
  };

  const addSchool = (fromOnboarding = false) => {
    if (!newSchool.nombre.trim()) return;
    if (fromOnboarding && schools.length >= 3) return;
    setSchools((prev) => [...prev, { ...newSchool, id: Date.now() }]);
    setNewSchool((prev) => ({ ...prev, nombre: "", pais: "", ciudad: "", precioAnunciado: 0, duracionMeses: 18, notas: "", enlaceReferencia: "" }));
  };

  const finishOnboarding = () => {
    setOnboardingCompleted(true);
    setScreen("dashboard");
    setTab("route");
  };

  const navItems: Array<{ id: Tab; label: string }> = [
    { id: "route", label: "Planificador de ruta" },
    { id: "cost", label: "Calculadora" },
    { id: "schools", label: "Comparador" },
    { id: "plan", label: "Plan 7/30/90" },
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
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#c9a454]/20 p-2"><Plane className="h-4 w-4 text-[#f2ddaa]" /></div>
              <p className="font-semibold">FlyPath Career Planner</p>
            </div>
            <button onClick={() => setScreen(onboardingCompleted ? "dashboard" : "onboarding")} className="rounded-lg border border-white/25 px-4 py-2 text-sm">Ver demo</button>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#c9a454]/35 bg-[#c9a454]/10 px-3 py-1 text-xs tracking-[0.16em] text-[#f2ddaa]">FLYPATH CAREER PLANNER</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Planifica tu ruta como piloto antes de tomar decisiones caras.</h1>
              <p className="mt-5 text-lg text-slate-200">Calcula costes reales, compara rutas y analiza escuelas antes de invertir miles de euros.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }} className="rounded-xl bg-[#c9a454] px-6 py-3 font-semibold text-[#0f1a33]">
                  Crear mi plan <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
                <button onClick={() => setScreen(onboardingCompleted ? "dashboard" : "onboarding")} className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm">Ver demo</button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6">
              <p className="text-sm text-slate-300">Snapshot del resultado</p>
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
            <button onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }} className="mt-6 rounded-xl bg-[#c9a454] px-6 py-3 font-semibold text-[#0f1a33]">Crear mi plan</button>
          </div>

          <div className="mt-10 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-slate-200">{disclaimerText}</div>
        </div>
      </div>
    );
  }

  if (screen === "onboarding") {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
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
              <button onClick={() => setOnboardingStep((s) => Math.max(1, s - 1))} disabled={onboardingStep === 1} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Anterior</button>
              {onboardingStep < 6 ? (
                <button onClick={() => setOnboardingStep((s) => Math.min(6, s + 1))} className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm text-white">Siguiente</button>
              ) : (
                <button onClick={finishOnboarding} className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm text-white">Ir al dashboard</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 h-screen w-72 border-r border-slate-200 bg-[#0f1a33] px-5 py-6 text-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#c9a454]/15 p-2"><Plane className="h-5 w-5 text-[#f2ddaa]" /></div>
            <div><p className="font-semibold">FlyPath Career Planner</p><p className="text-xs text-slate-300">V1 funcional</p></div>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`w-full rounded-xl px-3 py-3 text-left text-sm ${tab === item.id ? "bg-white text-[#0f1a33]" : "text-slate-200 hover:bg-white/10"}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 space-y-2">
            <button onClick={() => { setScreen("onboarding"); setOnboardingStep(1); }} className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm">Editar onboarding</button>
            <button onClick={resetDemoData} className="w-full rounded-lg bg-[#8b1f1f] px-3 py-2 text-sm text-white">Resetear datos demo</button>
          </div>
        </aside>
        <main className="flex-1 px-8 py-6">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Perfil activo</p>
            <h1 className="text-2xl font-semibold">{profile.nombre || "Usuario"}</h1>
            <p className="text-sm text-slate-500">{profile.pais} · {profile.situacionLaboral} · Objetivo: {objetivoLabel(profile.objetivo)}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label="Ruta recomendada" value={route.recommended} />
              <SummaryCard label="Coste realista" value={euro(costs.totalRealista)} />
              <SummaryCard label="Brecha financiera" value={euro(costs.brechaFinanciacion)} />
              <SummaryCard label="Riesgo financiero" value={costs.riesgoFinanciero} />
              <SummaryCard label="Preparación general" value={`${Math.round((route.integrated + route.modular + route.hybrid + route.prep) / 4)}%`} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium">Siguiente paso prioritario</p>
                <p className="mt-1 text-slate-700">{route.warnings[0] || "Pedir desglose y contrato antes de pagar depósito."}</p>
              </div>
              {route.principalBlock === "Clase 1 no confirmada" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <p className="font-medium">No pagar escuela todavía</p>
                  <p>Confirma Clase 1 primero para evitar compromisos de alto riesgo.</p>
                </div>
              )}
            </div>
          </header>
          <div className="mt-4 rounded-2xl border border-[#1d4ed8]/25 bg-gradient-to-r from-[#e9f1ff] via-white to-[#f5f9ff] p-6 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">Decision Readiness · Módulo clave</p>
                <h2 className="text-xl font-semibold text-[#0f1a33]">¿Estoy listo para pagar una escuela?</h2>
                <p className="mt-1 text-sm text-slate-600">Decisión comercial crítica antes de pagar matrícula, depósito o firmar.</p>
              </div>
              <div className="flex items-center gap-3">
                {decisionReadiness.showNoPaguesBadge && (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    No pagues escuela todavía
                  </span>
                )}
                <div className="rounded-xl border border-[#1d4ed8]/20 bg-white px-4 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Readiness Score</p>
                  <p className="text-3xl font-bold text-[#0f1a33]">{decisionReadiness.score}<span className="text-base font-semibold text-slate-500">/100</span></p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Decisión recomendada</p>
              <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{decisionReadiness.decision}</p>
              <p className="mt-1 text-sm text-slate-600">{decisionReadiness.explanation}</p>
            </div>
          </div>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {tab === "route" && (
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-4">
                  <RouteOption title="Integrada" value={route.integrated} />
                  <RouteOption title="Modular" value={route.modular} />
                  <RouteOption title="Híbrida" value={route.hybrid} />
                  <RouteOption title="Preparación" value={route.prep} />
                </div>
                <InfoCard label="Ruta recomendada" value={route.recommended} />
                <InfoCard label="Razón principal" value={route.reason} />
                <InfoCard label="Bloqueo principal" value={route.principalBlock} />
                {route.warnings.map((w) => <div key={w} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">{w}</div>)}
                {route.conflicts.map((c) => <div key={c} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">{c}</div>)}
              </div>
            )}
            {tab === "cost" && (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <SummaryCard label="Total optimista" value={euro(costs.totalOptimista)} />
                  <SummaryCard label="Total realista" value={euro(costs.totalRealista)} />
                  <SummaryCard label="Total conservador" value={euro(costs.totalConservador)} />
                  <SummaryCard label="Brecha financiera" value={euro(costs.brechaFinanciacion)} />
                  <SummaryCard label="Meses para cerrar brecha" value={String(costs.mesesCerrarBrecha)} />
                  <SummaryCard label="Riesgo financiero" value={costs.riesgoFinanciero} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium">Cobertura financiera</p>
                  <div className="mt-2"><Progress value={costs.coverage} tone="bg-[#0f1a33]" /></div>
                  <p className="mt-1 text-sm text-slate-600">{costs.coverage}% del escenario realista cubierto.</p>
                </div>
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
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="Subtotal formación" value={euro(costs.subtotalFormacion)} />
                  <SummaryCard label="Subtotal extras" value={euro(costs.subtotalExtras)} />
                  <SummaryCard label="Subtotal vida" value={euro(costs.subtotalVida)} />
                  <SummaryCard label="Buffer" value={euro(costs.buffer)} />
                </div>
              </div>
            )}
            {tab === "schools" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{disclaimerText}</div>
                <button onClick={() => setSchools((prev) => prev.filter((s) => !s.isExample))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Eliminar ejemplos y empezar desde cero</button>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <TextField label="Nombre" value={newSchool.nombre} onChange={(v) => setNewSchool((s) => ({ ...s, nombre: v }))} />
                  <TextField label="País" value={newSchool.pais} onChange={(v) => setNewSchool((s) => ({ ...s, pais: v }))} />
                  <TextField label="Ciudad" value={newSchool.ciudad} onChange={(v) => setNewSchool((s) => ({ ...s, ciudad: v }))} />
                  <NumberField label="Precio anunciado" value={newSchool.precioAnunciado} onChange={(v) => setNewSchool((s) => ({ ...s, precioAnunciado: v }))} />
                  <NumberField label="Duración meses" value={newSchool.duracionMeses} onChange={(v) => setNewSchool((s) => ({ ...s, duracionMeses: v }))} />
                  <TextField label="Fecha de actualización" value={newSchool.fechaActualizacion} onChange={(v) => setNewSchool((s) => ({ ...s, fechaActualizacion: v }))} />
                </div>
                <button onClick={() => addSchool(false)} className="rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm text-white">Añadir escuela</button>
                {schoolStats.analyzed.map(({ school, analysis }) => (
                  <div key={school.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{school.nombre}</p>
                        <p className="text-sm text-slate-500">{school.ciudad}, {school.pais} · {euro(school.precioAnunciado)} · {school.duracionMeses} meses</p>
                      </div>
                      <button onClick={() => setEmailDrafts((d) => ({ ...d, [school.id]: buildSchoolEmail(school, profile.nombre) }))} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm"><Mail className="mr-2 h-4 w-4" />Generar email</button>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <InfoCard label="Claridad de coste" value={String(analysis.claridadCoste)} />
                      <InfoCard label="Transparencia" value={String(analysis.transparencia)} />
                      <InfoCard label="Riesgo financiero" value={String(analysis.riesgoFinanciero)} />
                      <InfoCard label="Riesgo operacional" value={String(analysis.riesgoOperacional)} />
                      <InfoCard label="Riesgo de marketing" value={String(analysis.riesgoMarketing)} />
                      <InfoCard label="Nivel de verificación" value={String(analysis.verificacion)} />
                      <InfoCard label="Encaje general" value={String(analysis.encajeGeneral)} />
                    </div>
                    <InfoList title="Red flags" items={analysis.redFlags} empty="Información insuficiente" />
                    <InfoList title="Preguntas pendientes" items={analysis.preguntasPendientes} empty="Sin preguntas pendientes" />
                    <InfoCard label="Recomendación prudente" value={recomendacionLabel(analysis.recomendacionPrudente)} />
                    {emailDrafts[school.id] && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <button onClick={() => copyText(emailDrafts[school.id])} className="mb-2 inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs"><Copy className="mr-1 h-3 w-3" />Copiar email</button>
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
                <div className="rounded-2xl border border-[#1d4ed8]/20 bg-gradient-to-br from-[#eef4ff] via-white to-[#f8fbff] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">Decision Readiness</p>
                  <h3 className="mt-1 text-2xl font-semibold text-[#0f1a33]">¿Estoy listo para pagar una escuela?</h3>
                  <p className="mt-1 text-sm text-slate-600">Lectura rápida: si el resultado es "No pagues todavía", evita transferencias hasta cerrar bloqueos.</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Readiness Score</p>
                      <p className="mt-1 text-4xl font-bold text-[#0f1a33]">{decisionReadiness.score}<span className="text-lg font-semibold text-slate-500">/100</span></p>
                      <div className="mt-3"><Progress value={decisionReadiness.score} tone="bg-[#1d4ed8]" /></div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Decisión recomendada</p>
                      <p className="mt-1 text-xl font-semibold text-[#0f1a33]">{decisionReadiness.decision}</p>
                      <p className="mt-2 text-sm text-slate-600">{decisionReadiness.explanation}</p>
                    </div>
                  </div>
                </div>
                {decisionReadiness.showNoPaguesBadge && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <p className="font-semibold">No pagues escuela todavía</p>
                    <p className="mt-1">Resuelve los bloqueos críticos antes de pagar matrícula, depósito o firmar.</p>
                  </div>
                )}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <InfoList title="Bloqueos críticos" items={decisionReadiness.bloqueosCriticos} empty="Sin bloqueos críticos detectados." />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <InfoList title="Datos pendientes" items={decisionReadiness.faltanDatos} empty="No faltan datos críticos para el siguiente paso." />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <InfoList title="Próximos 3 pasos" items={decisionReadiness.proximosPasos} empty="Sin pasos pendientes." />
                  </div>
                </div>
              </div>
            )}
            {tab === "report" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{disclaimerText}</div>
                <Panel title="1. Resumen ejecutivo">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <InfoCard label="Nombre del usuario" value={profile.nombre || "Usuario"} />
                  <InfoCard label="Ruta recomendada" value={route.recommended} />
                  <InfoCard label="Razón principal" value={route.reason} />
                  <InfoCard label="Coste optimista" value={euro(costs.totalOptimista)} />
                  <InfoCard label="Coste realista" value={euro(costs.totalRealista)} />
                  <InfoCard label="Coste conservador" value={euro(costs.totalConservador)} />
                  <InfoCard label="Brecha de financiación" value={euro(costs.brechaFinanciacion)} />
                  <InfoCard label="Meses para cerrar brecha" value={String(costs.mesesCerrarBrecha)} />
                  <InfoCard label="Riesgo financiero" value={costs.riesgoFinanciero} />
                  <InfoCard label="Riesgo médico" value={profile.class1 === "si" ? "Bajo" : profile.class1 === "reservado" ? "Medio" : "Alto"} />
                  <InfoCard label="Riesgo de inglés" value={profile.ingles === "alto" ? "Bajo" : profile.ingles === "medio" ? "Medio" : "Alto"} />
                  <InfoCard label="Principal bloqueo" value={route.principalBlock} />
                </div>
                </Panel>
                <Panel title="2. Escuelas y fiabilidad de datos">
                <InfoCard label="Mejor escuela según datos actuales" value={schoolStats.bestSchool ? `${schoolStats.bestSchool.school.nombre} (${recomendacionLabel(schoolStats.bestSchool.analysis.recomendacionPrudente)})` : "Información insuficiente"} />
                <InfoList title="Red flags principales" items={[...route.warnings, ...(schoolStats.bestSchool?.analysis.redFlags || ["No decidir aún"])]} empty="sin red flags" />
                <InfoList title="Preguntas pendientes" items={schoolStats.bestSchool?.analysis.preguntasPendientes || ["confirmar datos de costes y contrato"]} empty="sin pendientes" />
                <div className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p>Fuente principal de costes: {schools[0]?.fuentePrecio || "no disponible"}</p>
                  <p>Fecha de actualización: {schools[0]?.fechaActualizacion || "no disponible"}</p>
                  <p>Escuelas comparadas: {schools.length}</p>
                  <p>Escuelas verificadas: {schoolStats.verifiedCount}</p>
                  <p>Escuelas pendientes: {schoolStats.pendingCount}</p>
                </div>
                </Panel>
                <Panel title="3. Decision Readiness (resumen ejecutivo)">
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Readiness Score</p>
                      <p className="mt-1 text-3xl font-bold text-[#0f1a33]">{decisionReadiness.score}<span className="text-base font-semibold text-slate-500">/100</span></p>
                      <div className="mt-2"><Progress value={decisionReadiness.score} tone="bg-[#1d4ed8]" /></div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Decisión recomendada (5 segundos)</p>
                      <p className="mt-1 text-lg font-semibold text-[#0f1a33]">{decisionReadiness.decision}</p>
                      <p className="mt-1 text-sm text-slate-600">{decisionReadiness.explanation}</p>
                    </div>
                  </div>
                  {decisionReadiness.showNoPaguesBadge && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                      <strong>No pagues escuela todavía.</strong> Valida los bloqueos antes de firmar o transferir dinero.
                    </div>
                  )}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <InfoList title="Bloqueos críticos" items={decisionReadiness.bloqueosCriticos} empty="Sin bloqueos críticos detectados." />
                    <InfoList title="Datos pendientes antes de pagar" items={decisionReadiness.faltanDatos} empty="Sin pendientes críticos." />
                  </div>
                </Panel>
                <button onClick={() => copyText(`INFORME FLYPATH\\nUsuario: ${profile.nombre || "Usuario"}\\nRuta: ${route.recommended}\\nRazón: ${route.reason}\\nCoste optimista: ${euro(costs.totalOptimista)}\\nCoste realista: ${euro(costs.totalRealista)}\\nCoste conservador: ${euro(costs.totalConservador)}\\nBrecha: ${euro(costs.brechaFinanciacion)}\\nMeses: ${costs.mesesCerrarBrecha}\\nRiesgo financiero: ${costs.riesgoFinanciero}\\nBloqueo: ${route.principalBlock}\\nEscuelas: ${schools.length}\\nVerificadas: ${schoolStats.verifiedCount}\\nPendientes: ${schoolStats.pendingCount}\\n\\nNota: ${disclaimerText}`)} className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm text-white"><Copy className="mr-2 h-4 w-4" />Copiar resumen</button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
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
