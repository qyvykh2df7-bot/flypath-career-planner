import type {
  ErrorLogItem,
  MockResult,
  PlannedStudySession,
  RecoveryPlan,
  RecoveryPlanStep,
  RecoveryProblem,
  ReviewItem,
  StudyMode,
  StudySession,
  StudySubject,
} from "./types";
import {
  calculateActiveSubjectIds,
  calculateAverageMockScore,
  calculateOverdueReviewCount,
  calculatePendingErrorCount,
  calculateTotalStudyMinutes,
  createPlannerId,
  getPlannedSessionsForCurrentWeek,
  getSessionsForCurrentWeek,
} from "./calculations";

export const RECOVERY_PROBLEM_OPTIONS: { value: RecoveryProblem; label: string }[] = [
  { value: "too_many_subjects", label: "Tengo demasiadas asignaturas abiertas" },
  { value: "low_mock_scores", label: "Hago mocks pero no subo nota" },
  { value: "no_weekly_plan", label: "No sé qué estudiar esta semana" },
  { value: "overdue_reviews", label: "Tengo repasos atrasados" },
  { value: "pending_errors", label: "Tengo errores pendientes sin revisar" },
  { value: "low_time", label: "Tengo poco tiempo para estudiar" },
  { value: "burnout", label: "Estoy quemado o saturado" },
  { value: "dont_know_where_to_start", label: "No sé por dónde empezar" },
];

const PROBLEM_STEP_TEMPLATES: Record<
  RecoveryProblem,
  Omit<RecoveryPlanStep, "id">
> = {
  too_many_subjects: {
    title: "Reduce temporalmente a 2 asignaturas activas",
    description:
      "Durante los próximos 7 días, evita abrir más asignaturas. Elige una asignatura principal y una secundaria para recuperar control.",
    actionType: "reduce_subjects",
  },
  low_mock_scores: {
    title: "Haz un mock diagnóstico y corrige errores",
    description:
      "No hagas bancos en automático. Haz un mock, registra los errores en el Error log y repasa los temas que más fallas.",
    actionType: "mock",
  },
  no_weekly_plan: {
    title: "Planifica 3 sesiones realistas esta semana",
    description:
      "Crea tres sesiones de estudio en el calendario: una de teoría, una de banco y una de repaso o mock.",
    actionType: "plan_session",
  },
  overdue_reviews: {
    title: "Limpia primero los repasos atrasados",
    description:
      "Antes de avanzar con temas nuevos, completa o reprograma los repasos atrasados para no acumular carga.",
    actionType: "review",
  },
  pending_errors: {
    title: "Revisa errores pendientes",
    description:
      "Dedica una sesión corta a revisar errores pendientes y marca como resueltos los que ya entiendas.",
    actionType: "error_log",
  },
  low_time: {
    title: "Baja el objetivo semanal a algo realista",
    description:
      "Si tienes poco tiempo, es mejor cumplir 4-6 horas reales que planificar 15 y no hacerlas. Ajusta tu objetivo semanal.",
    actionType: "plan_session",
  },
  burnout: {
    title: "Programa descanso y reduce carga",
    description:
      "Si estás saturado, no añadas más asignaturas esta semana. Programa una sesión corta de repaso y deja al menos un día libre.",
    actionType: "rest",
  },
  dont_know_where_to_start: {
    title: "Empieza con una asignatura y una acción concreta",
    description:
      "Elige una asignatura, registra una sesión de 45-60 minutos y apunta tres dudas o errores concretos.",
    actionType: "plan_session",
  },
};

export const RECOVERY_ACTION_LABELS: Record<
  NonNullable<RecoveryPlanStep["actionType"]>,
  string
> = {
  plan_session: "Planificar",
  review: "Repasos",
  mock: "Mocks",
  error_log: "Errores",
  reduce_subjects: "Enfoque",
  rest: "Descanso",
  class_cta: "Clases",
};

export const RECOVERY_RISK_LABELS: Record<RecoveryPlan["riskLevel"], string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

function makeStep(template: Omit<RecoveryPlanStep, "id">): RecoveryPlanStep {
  return { ...template, id: createPlannerId() };
}

function stepFingerprint(step: RecoveryPlanStep): string {
  return step.title.trim().toLowerCase();
}

function addStepUnique(steps: RecoveryPlanStep[], step: RecoveryPlanStep): void {
  const fp = stepFingerprint(step);
  if (steps.some((s) => stepFingerprint(s) === fp)) return;
  steps.push(step);
}

function buildSummary(selected: RecoveryProblem[]): string {
  if (selected.includes("burnout")) {
    return "Ahora mismo conviene bajar el ritmo: menos asignaturas abiertas, pendientes al día y sesiones que sí puedas cumplir.";
  }
  if (
    selected.includes("too_many_subjects") ||
    selected.includes("dont_know_where_to_start")
  ) {
    return "Ahora mismo el objetivo no es avanzar más rápido, sino recuperar control: reducir asignaturas abiertas, limpiar pendientes y planificar sesiones realistas.";
  }
  if (selected.includes("low_mock_scores") || selected.includes("pending_errors")) {
    return "Prioriza entender lo que fallas: menos volumen de banco, más corrección de errores y repasos dirigidos antes de presentarte.";
  }
  if (selected.includes("low_time") || selected.includes("no_weekly_plan")) {
    return "Ajusta expectativas a tu tiempo real: pocas sesiones bien hechas valen más que un plan ambicioso que no cumples.";
  }
  return "Usa los próximos 7 días para ordenar pendientes, enfocar pocas asignaturas y volver a una rutina sostenible.";
}

function calculateRiskLevel(params: {
  selected: RecoveryProblem[];
  overdueReviews: number;
  pendingErrors: number;
  avgMock: number | null;
  weekMinutes: number;
  weeklyGoalMinutes: number;
}): RecoveryPlan["riskLevel"] {
  const { selected, overdueReviews, pendingErrors, avgMock, weekMinutes, weeklyGoalMinutes } =
    params;

  if (selected.includes("burnout")) return "high";
  if (overdueReviews > 0 && pendingErrors > 0) return "high";
  if (avgMock !== null && avgMock < 60) return "high";
  if (weekMinutes === 0 && weeklyGoalMinutes > 0) return "high";

  if (selected.length >= 3) return "medium";
  if (avgMock !== null && avgMock >= 60 && avgMock < 75) return "medium";
  const weekPct =
    weeklyGoalMinutes > 0 ? (weekMinutes / weeklyGoalMinutes) * 100 : 100;
  if (weekPct < 40 && weeklyGoalMinutes > 0) return "medium";

  return "low";
}

export function generateRecoveryPlan(params: {
  selectedProblems: RecoveryProblem[];
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  weeklyGoalMinutes: number;
}): RecoveryPlan {
  const {
    selectedProblems,
    sessions,
    plannedSessions,
    mockResults,
    reviewItems,
    errorLogItems,
    weeklyGoalMinutes,
  } = params;

  const steps: RecoveryPlanStep[] = [];

  for (const problem of selectedProblems) {
    addStepUnique(steps, makeStep(PROBLEM_STEP_TEMPLATES[problem]));
  }

  const overdueReviews = calculateOverdueReviewCount(reviewItems);
  const pendingErrors = calculatePendingErrorCount(errorLogItems);
  const weekSessions = getSessionsForCurrentWeek(sessions);
  const weekMinutes = calculateTotalStudyMinutes(weekSessions);
  const avgMock = calculateAverageMockScore(mockResults);
  const activeCount = calculateActiveSubjectIds(sessions, 14).length;
  const weekPlanned = getPlannedSessionsForCurrentWeek(
    plannedSessions.filter((p) => p.status === "pending" || p.status === "in_progress"),
  );

  if (overdueReviews > 0 && !selectedProblems.includes("overdue_reviews")) {
    addStepUnique(
      steps,
      makeStep({
        title: "Tienes repasos atrasados: resuélvelos o reprográmalos primero",
        description: `Hay ${overdueReviews} repaso${overdueReviews === 1 ? "" : "s"} atrasado${overdueReviews === 1 ? "" : "s"}. Completa o reprograma antes de abrir temas nuevos.`,
        actionType: "review",
      }),
    );
  }

  if (pendingErrors > 0 && !selectedProblems.includes("pending_errors")) {
    addStepUnique(
      steps,
      makeStep({
        title: "Tienes errores pendientes: revisa los más repetidos",
        description: `Hay ${pendingErrors} error${pendingErrors === 1 ? "" : "es"} pendiente${pendingErrors === 1 ? "" : "s"}. Revisa los patrones en Error log antes de seguir haciendo mocks.`,
        actionType: "error_log",
      }),
    );
  }

  if (weekSessions.length === 0) {
    addStepUnique(
      steps,
      makeStep({
        title: "Empieza con una sesión corta hoy o mañana",
        description:
          "No llevas sesiones registradas esta semana. Una sesión de 45-60 minutos te devuelve ritmo sin saturarte.",
        actionType: "plan_session",
      }),
    );
  }

  if (activeCount > 3 && !selectedProblems.includes("too_many_subjects")) {
    addStepUnique(
      steps,
      makeStep({
        title: "Has tocado varias asignaturas recientemente; reduce foco esta semana",
        description: `En los últimos 14 días has activado ${activeCount} asignaturas. Elige máximo dos para los próximos 7 días.`,
        actionType: "reduce_subjects",
      }),
    );
  }

  if (avgMock !== null && avgMock < 70 && mockResults.length > 0 && !selectedProblems.includes("low_mock_scores")) {
    addStepUnique(
      steps,
      makeStep({
        title: "Tu media de mocks está ajustada; prioriza corrección de errores",
        description: `Media orientativa: ${Math.round(avgMock)}%. Haz mocks más cortos, registra fallos y repasa antes de repetir bancos completos.`,
        actionType: "mock",
      }),
    );
  }

  if (
    weekPlanned.length === 0 &&
    weekSessions.length > 0 &&
    !selectedProblems.includes("no_weekly_plan")
  ) {
    addStepUnique(
      steps,
      makeStep({
        title: "Planifica al menos una sesión en el calendario",
        description:
          "Tienes horas registradas pero poca planificación visible. Añade 2-3 sesiones concretas en Calendario para la semana.",
        actionType: "plan_session",
      }),
    );
  }

  const riskLevel = calculateRiskLevel({
    selected: selectedProblems,
    overdueReviews,
    pendingErrors,
    avgMock,
    weekMinutes,
    weeklyGoalMinutes,
  });

  return {
    problems: selectedProblems,
    summary: buildSummary(selectedProblems),
    riskLevel,
    steps,
    cta: {
      label: "Necesito ayuda con una asignatura",
      href: "/clases-ppl-atpl",
    },
  };
}
