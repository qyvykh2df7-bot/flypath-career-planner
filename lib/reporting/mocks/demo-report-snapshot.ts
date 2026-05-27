import { buildReportSnapshot } from "@/lib/reporting/mappers/build-report-snapshot";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

const DISCLAIMER =
  "FlyPath Career Planner ofrece orientación educativa y herramientas de planificación basadas en los datos introducidos por el usuario. No sustituye asesoramiento financiero, médico, legal ni información oficial de escuelas, autoridades o aerolíneas. Los costes son estimaciones y pueden variar.";

/** Snapshot de demostración para /report-preview — ensamblado vía buildReportSnapshot, sin motores en runtime. */
export function createDemoReportSnapshot(): ReportSnapshotV1 {
  const risks = [
    {
      label: "Riesgo médico",
      nivel: "Bajo" as const,
      explicacion: "Clase 1 confirmada.",
      accion: "Confirmar Clase 1 antes de firmar o transferir dinero.",
    },
    {
      label: "Riesgo financiero",
      nivel: "Medio" as const,
      explicacion: "Cobertura actual del 72% sobre el escenario realista.",
      accion: "Reducir brecha, confirmar financiación y mantener un margen de seguridad financiero.",
    },
    {
      label: "Riesgo de inglés",
      nivel: "Medio" as const,
      explicacion: "Puede impactar ritmo y rendimiento formativo.",
      accion: "Definir plan de mejora y validar objetivo ICAO.",
    },
    {
      label: "Riesgo documental",
      nivel: "Alto" as const,
      explicacion: "1 escuela(s) verificadas de 2.",
      accion: "Exigir confirmación documental de costes y condiciones.",
    },
    {
      label: "Riesgo de marketing/promesas",
      nivel: "Medio" as const,
      explicacion: "Evaluación sobre promesas y transparencia comercial.",
      accion: "Pedir por escrito alcance real de career support y límites.",
    },
    {
      label: "Riesgo de timing",
      nivel: "Bajo" as const,
      explicacion: "No se detecta conflicto fuerte de timing.",
      accion: "Alinear urgencia, disponibilidad y necesidad de trabajar.",
    },
  ];

  return buildReportSnapshot({
    generatedAt: "27 de mayo de 2026, 22:15",
    disclaimer: DISCLAIMER,
    metadata: {
      source: "career-planner",
      reviewMode: false,
      initialTab: "report",
    },
    profile: {
      nombre: "Jorge Feliu",
      edad: 26,
      pais: "España",
      objetivo: "aerolinea",
      class1: "si",
      ingles: "medio",
      icaoLevel: "5",
      preocupacionIngles: "no",
      dineroDisponible: 95000,
      ahorroMensual: 1200,
      financiacion: "posible",
      inversionMaxima: 120000,
      toleranciaRiesgo: "media",
      disponibilidad: "part-time",
      horasSemana: 22,
      necesitaTrabajar: "si",
      movilidad: "europa",
      urgencia: "media",
      costEstimateSource: "flypath_base",
    },
    routeRecommendation: {
      recommended: "Modular",
      reason: "Encaja por flexibilidad y control de caja por fases.",
      principalBlock: "Ningún bloqueo crítico",
      warnings: ["Prioridad: confirma contrato y calendario de pagos por escrito."],
      conflicts: [],
      scores: { integrated: 58, modular: 72, prep: 38 },
    },
    costs: {
      inputs: {},
      summary: {
        subtotalFormacion: 108500,
        subtotalExtras: 9550,
        subtotalVida: 17000,
        buffer: 20258,
        totalOptimista: 130995,
        totalConservador: 174660,
        totalRealista: 155308,
        brechaFinanciacion: 60308,
        coveragePct: 61,
        mesesCerrarBrecha: 51,
        riskScore: 55,
        riesgoFinanciero: "Medio",
      },
    },
    readiness: {
      score: 68,
      decision: "Puedes seguir investigando, pero no pagar",
      explanation:
        "Puedes seguir comparando escuelas y completando datos, pero todavía no hay base suficiente para comprometer pagos.",
      showNoPaguesBadge: false,
      shouldPayNow: false,
      bloqueosCriticos: [],
      faltanDatos: [
        "Comparar al menos 2 escuelas para decidir con criterio.",
        "Falta confirmar como incluido: MCC/JOC, Advanced UPRT.",
      ],
      proximosPasos: [
        "Confirmar por escrito contrato, reembolso y calendario de pagos con al menos una escuela.",
        "Comparar al menos 2 escuelas antes de tomar una decisión final.",
        "Confirmar por escrito si están incluidos: MCC/JOC, Advanced UPRT.",
      ],
    },
    risks,
    roadmap: {
      sevenDays: [
        "Revisar puntos a validar de las escuelas comparadas.",
        "Actualizar presupuesto máximo y brecha financiera real.",
        "Guardar evidencia de Clase 1 y fecha de validez.",
      ],
      thirtyDays: [
        "Confirmar por escrito contrato, reembolso y calendario de pagos.",
        "Comparar escenarios modular e integrado con el mismo coste total.",
        "Practicar inglés aeronáutico y comunicaciones ATC semanalmente.",
      ],
      ninetyDays: [
        "Planificar fases por orden y evitar pagos adelantados innecesarios.",
        "Mantener reserva para repeticiones, tasas y retrasos.",
        "Reevaluar nivel de inglés antes de pagar una fase avanzada.",
      ],
    },
    schoolsSummary: {
      total: 2,
      verifiedCount: 1,
      pendingCount: 0,
      bestSchoolName: "European Aviation Academy",
      items: [
        {
          id: "1",
          nombre: "European Aviation Academy",
          pais: "España",
          ciudad: "Valencia",
          programa: "integrado",
          precioAnunciado: 92000,
          estadoVerificacion: "verificado",
          pendientes: ["alojamiento y costes aproximados"],
        },
        {
          id: "2",
          nombre: "SkyPath Cadet Program",
          pais: "Portugal",
          ciudad: "Porto",
          programa: "cadet",
          precioAnunciado: 88000,
          estadoVerificacion: "parcialmente_verificado",
          pendientes: ["MCC/JOC", "política de reembolso", "calendario de pagos"],
        },
      ],
    },
    flypathNextStep: {
      primaryId: "mentoria",
      primary: {
        title: "Mentoría de decisión",
        body: "Revisa tu caso, presupuesto y escuelas candidatas con un piloto profesional.",
        cta: "Reservar mentoría",
      },
      secondaryIds: ["guia", "ingles"],
      reasons: [
        "Prioridad decisión/pago: escuelas, documentación o economía antes de organizar estudio ATPL",
      ],
    },
  });
}
