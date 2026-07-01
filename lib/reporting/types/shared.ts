export type YesNoUnknown = "si" | "no" | "no_se";

export type ReadinessDecision =
  | "No estás listo para pagar"
  | "Puedes seguir investigando, pero no pagar"
  | "Listo para decidir con condiciones";

export type RiskLevel = "Bajo" | "Medio" | "Alto" | "Crítico";

export type Profile = {
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
  costEstimateSource: "flypath_base" | "user_approx";
};

export type CostInputs = {
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

export type CostComputation = {
  subtotalFormacion: number;
  subtotalExtras: number;
  subtotalVida: number;
  buffer: number;
  totalOptimista: number;
  totalRealista: number;
  totalConservador: number;
  brechaFinanciacion: number;
  mesesCerrarBrecha: number;
  coverage: number;
  riskScore: number;
  riesgoFinanciero: RiskLevel;
};

export type School = {
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

export type RouteRecommendation = {
  integrated: number;
  modular: number;
  prep: number;
  recommended: "Integrada" | "Modular" | "Preparación";
  reason: string;
  warnings: string[];
  conflicts: string[];
  principalBlock: string;
};

export type ReadinessResult = {
  score: number;
  decision: ReadinessDecision;
  explanation: string;
  bloqueosCriticos: string[];
  faltanDatos: string[];
  proximosPasos: string[];
  showNoPaguesBadge: boolean;
};

export type SchoolAnalysisSummary = {
  claridadCoste: number;
  transparencia: number;
  riesgoFinanciero: number;
  riesgoOperacional: number;
  riesgoMarketing: number;
  verificacion: number;
  encajeGeneral: number;
  redFlags: string[];
  preguntasPendientes: string[];
  recomendacionPrudente: string;
};

export type ReadinessSchoolAnalyzed = {
  school: School;
  analysis: SchoolAnalysisSummary;
};

export type ComputeDecisionReadinessInput = {
  profile: Profile;
  costs: CostComputation;
  route: RouteRecommendation;
  schoolsAnalyzed: ReadinessSchoolAnalyzed[];
  bufferPct: number;
};

export type SchoolStatsSummary = {
  analyzed: ReadinessSchoolAnalyzed[];
  verifiedCount: number;
  pendingCount: number;
  bestSchool: ReadinessSchoolAnalyzed | null;
};

export type FlypathSchoolRecommendation = {
  school: School | null;
  reason: string;
};

export type RiskItem = {
  label: string;
  nivel: RiskLevel | string;
  explicacion: string;
  accion: string;
};

export type RoadmapPlan = {
  sevenDays: string[];
  thirtyDays: string[];
  ninetyDays: string[];
};

export type FlyPathPrimaryId = "guia" | "mentoria" | "ingles";
export type FlyPathProductId = FlyPathPrimaryId | "escuelas";

export type FlyPathProductCard = {
  title: string;
  body: string;
  cta: string;
};

export type FlyPathNextStepRecommendation = {
  primary: FlyPathPrimaryId;
  secondaryIds: [FlyPathProductId, FlyPathProductId];
  reasons: string[];
};

export type FlyPathNextStep = {
  primaryId: FlyPathPrimaryId;
  primary: FlyPathProductCard;
  secondaryIds: FlyPathProductId[];
  reasons: string[];
};
