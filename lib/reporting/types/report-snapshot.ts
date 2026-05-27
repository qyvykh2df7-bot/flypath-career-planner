import type {
  FlyPathNextStep,
  Profile,
  ReadinessDecision,
  RiskItem,
  RiskLevel,
  RoadmapPlan,
  RouteRecommendation,
} from "@/lib/reporting/types/shared";

export type ReportSnapshotVersion = "v1";

export type ReportSnapshotRiskLevel = RiskLevel;

export type ReportSnapshotRisk = RiskItem;

export type ReportSnapshotSchoolSummaryItem = {
  id: string;
  nombre: string;
  pais: string;
  ciudad?: string;
  programa: string;
  precioAnunciado: number;
  estadoVerificacion: string;
  pendientes: string[];
};

export type ReportSnapshotV1 = {
  version: ReportSnapshotVersion;
  generatedAt: string;
  metadata: {
    source: "career-planner";
    reviewMode: boolean;
    initialTab?: string;
  };
  disclaimer: string;
  profile: Pick<
    Profile,
    | "nombre"
    | "edad"
    | "pais"
    | "objetivo"
    | "class1"
    | "ingles"
    | "icaoLevel"
    | "preocupacionIngles"
    | "dineroDisponible"
    | "ahorroMensual"
    | "financiacion"
    | "inversionMaxima"
    | "toleranciaRiesgo"
    | "disponibilidad"
    | "horasSemana"
    | "necesitaTrabajar"
    | "movilidad"
    | "urgencia"
    | "costEstimateSource"
  >;
  routeRecommendation: Pick<
    RouteRecommendation,
    "recommended" | "reason" | "principalBlock" | "warnings" | "conflicts"
  > & {
    scores: Pick<RouteRecommendation, "integrated" | "modular" | "prep">;
  };
  costs: {
    inputs: Record<string, number>;
    summary: {
      subtotalFormacion: number;
      subtotalExtras: number;
      subtotalVida: number;
      buffer: number;
      totalOptimista: number;
      totalRealista: number;
      totalConservador: number;
      brechaFinanciacion: number;
      coveragePct: number;
      mesesCerrarBrecha: number;
      riskScore: number;
      riesgoFinanciero: string;
    };
  };
  readiness: {
    score: number;
    decision: ReadinessDecision;
    explanation: string;
    showNoPaguesBadge: boolean;
    shouldPayNow: boolean;
    bloqueosCriticos: string[];
    faltanDatos: string[];
    proximosPasos: string[];
  };
  risks: {
    items: ReportSnapshotRisk[];
    highestLevel: ReportSnapshotRiskLevel;
  };
  roadmap: RoadmapPlan;
  schoolsSummary: {
    total: number;
    verifiedCount: number;
    pendingCount: number;
    bestSchoolName: string | null;
    items: ReportSnapshotSchoolSummaryItem[];
  };
  flypathNextStep: FlyPathNextStep;
};
