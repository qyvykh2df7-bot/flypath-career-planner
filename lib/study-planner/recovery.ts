import type {
  ExamDate,
  ErrorLogItem,
  MockResult,
  PlannedStudySession,
  RecoveryFocusReduction,
  RecoveryPlan,
  RecoveryPlanStep,
  RecoveryPlanVariant,
  RecoveryProblem,
  ReviewItem,
  StudyMode,
  StudySession,
  StudySubject,
} from "./types";
import {
  calculateActiveSubjectIds,
  calculateAverageMockScore,
  calculateMinutesBySubject,
  calculateOverdueReviewCount,
  calculatePendingErrorCount,
  calculateTotalStudyMinutes,
  createPlannerId,
  getDaysUntilDate,
  getTodayDateString,
  getPlannedSessionsForCurrentWeek,
  getSessionsForCurrentWeek,
} from "./calculations";
import { getCurrentWeekStart, getWeekRange } from "./date-utils";
import { BURNOUT_MAIN_SUMMARY, isBurnoutRecoveryPlan } from "./recovery-burnout-relief";
import { buildCombinedIntentPlan, resolvePrimaryRecoveryIntent } from "./recovery-intent";
import { buildLowTimeSteps } from "./recovery-low-time";
import { buildMockCorrectionSteps } from "./recovery-mock-correction";
import { buildOverdueReviewSteps } from "./recovery-overdue-reviews";
import { buildStartGuidanceSteps } from "./recovery-start-guidance";
import { isCountableAsCompleted, isPendingLikeStatus } from "./planner-session-status";

export const RECOVERY_PROBLEM_OPTIONS: { value: RecoveryProblem; label: string }[] = [
  { value: "too_many_subjects", label: "Tengo demasiadas asignaturas abiertas" },
  { value: "low_mock_scores", label: "Hago simulacros de examen pero no subo nota" },
  { value: "no_weekly_plan", label: "No sé qué estudiar esta semana" },
  { value: "overdue_reviews", label: "Tengo repasos atrasados" },
  { value: "accumulated_doubts", label: "Tengo dudas acumuladas sin resolver" },
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
    title: "Haz un simulacro diagnóstico y anota dudas concretas",
    description:
      "No hagas bancos en automático. Haz un simulacro corto, anota las dudas que repites y repasa esos temas antes de otro simulacro completo.",
    actionType: "mock",
  },
  no_weekly_plan: {
    title: "Planifica 3 sesiones realistas esta semana",
    description:
      "Crea tres sesiones en el calendario: una de teoría, una de banco y una de repaso o simulacro de examen.",
    actionType: "plan_session",
  },
  overdue_reviews: {
    title: "Limpia primero los repasos atrasados",
    description:
      "Antes de avanzar con temas nuevos, completa o reprograma los repasos atrasados para no acumular carga.",
    actionType: "review",
  },
  accumulated_doubts: {
    title: "Resuelve dudas acumuladas en sesiones cortas",
    description:
      "Dedica bloques de 30-45 minutos a cerrar dudas pendientes: anótalas, repásalas y marca las que ya dominas.",
    actionType: "review",
  },
  low_time: {
    title: "Baja el objetivo semanal a algo realista",
    description:
      "Si tienes poco tiempo, es mejor cumplir 4-6 horas reales que planificar 15 y no hacerlas. Ajusta tu objetivo semanal.",
    actionType: "plan_session",
  },
  burnout: {
    title: "Semana ligera: bloques cortos y descanso",
    description:
      "Prioriza repasos suaves, sesiones de 45-60 minutos y espacio entre bloques. No busques recuperar horas de golpe.",
    actionType: "rest",
  },
  dont_know_where_to_start: {
    title: "Empieza con una asignatura y una acción concreta",
    description:
      "Elige una asignatura, registra una sesión de 45-60 minutos y apunta tres dudas concretas para resolver en la siguiente sesión.",
    actionType: "plan_session",
  },
};

export const RECOVERY_ACTION_LABELS: Record<
  NonNullable<RecoveryPlanStep["actionType"]>,
  string
> = {
  plan_session: "Planificar",
  review: "Repasos",
  mock: "Simulacros",
  error_log: "Dudas",
  reduce_subjects: "Enfoque",
  rest: "Descanso",
  class_cta: "Clases",
};

/** Etiqueta visible de carga semanal (sin “riesgo” ni tono punitivo). */
export const RECOVERY_WEEK_LOAD_LABELS: Record<RecoveryPlan["riskLevel"], string> = {
  low: "Carga baja",
  medium: "Carga moderada",
  high: "Carga alta",
};

/** @deprecated Usar RECOVERY_WEEK_LOAD_LABELS */
export const RECOVERY_RISK_LABELS = RECOVERY_WEEK_LOAD_LABELS;

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

const LIGHTER_STEP_PRIORITY: NonNullable<RecoveryPlanStep["actionType"]>[] = [
  "rest",
  "review",
  "error_log",
  "reduce_subjects",
  "plan_session",
  "mock",
];

function getSubjectExamUrgencyDays(
  subjectId: string,
  examDates: ExamDate[],
  today: string,
): number | null {
  const upcoming = examDates
    .filter((exam) => exam.subjectId === subjectId && exam.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!upcoming) return null;
  return getDaysUntilDate(upcoming.date, today);
}

function buildFocusReductionPlan(params: {
  selectedProblems: RecoveryProblem[];
  subjects: StudySubject[];
  sessions: StudySession[];
  plannedSessions: PlannedStudySession[];
  examDates: ExamDate[];
  today: string;
}): RecoveryFocusReduction | null {
  const { selectedProblems, subjects, sessions, plannedSessions, examDates, today } = params;
  if (!selectedProblems.includes("too_many_subjects")) return null;

  const weekStart = getCurrentWeekStart(today);
  const { start, end } = getWeekRange(weekStart);
  const activeSet = new Set(subjects.map((subject) => subject.id));
  for (const planned of plannedSessions) {
    if (
      planned.date >= start &&
      planned.date <= end &&
      isPendingLikeStatus(planned.status)
    ) {
      activeSet.add(planned.subjectId);
    }
  }
  const activeSubjectIds = [...activeSet];
  const activeSubjectsCount = activeSubjectIds.length;
  if (activeSubjectsCount < 4) {
    return {
      activeSubjectsCount,
      subjectsToRemoveCount: 0,
      subjectIdsToRemove: [],
      subjectIdsToKeep: activeSubjectIds,
      nearExamSubjectIds: activeSubjectIds.filter((id) => {
        const days = getSubjectExamUrgencyDays(id, examDates, today);
        return days !== null && days <= 14;
      }),
      appliesThisWeek: false,
    };
  }

  const subjectsToRemoveCount = Math.max(1, Math.round(activeSubjectsCount * 0.2));
  const recentMinutesBySubject = calculateMinutesBySubject(
    sessions.filter((session) => getDaysUntilDate(today, session.date) <= 14 && session.date <= today),
  );
  const completedThisWeekBySubject: Record<string, number> = {};
  for (const planned of plannedSessions) {
    if (planned.date < start || planned.date > end) continue;
    if (!isCountableAsCompleted(planned.status)) continue;
    completedThisWeekBySubject[planned.subjectId] =
      (completedThisWeekBySubject[planned.subjectId] ?? 0) + 1;
  }

  const ranked = activeSubjectIds
    .map((subjectId) => {
      const examUrgencyDays = getSubjectExamUrgencyDays(subjectId, examDates, today);
      const hasNearExam = examUrgencyDays !== null && examUrgencyDays <= 14;
      const urgencyScore = examUrgencyDays === null ? 999 : examUrgencyDays;
      const recentMinutes = recentMinutesBySubject[subjectId] ?? 0;
      const completedThisWeek = completedThisWeekBySubject[subjectId] ?? 0;
      return {
        subjectId,
        hasNearExam,
        urgencyScore,
        recentMinutes,
        completedThisWeek,
      };
    })
    .sort((a, b) => {
      if (a.hasNearExam !== b.hasNearExam) return a.hasNearExam ? 1 : -1;
      if (a.urgencyScore !== b.urgencyScore) return b.urgencyScore - a.urgencyScore;
      if (a.recentMinutes !== b.recentMinutes) return a.recentMinutes - b.recentMinutes;
      if (a.completedThisWeek !== b.completedThisWeek) return a.completedThisWeek - b.completedThisWeek;
      return a.subjectId.localeCompare(b.subjectId);
    });

  const removable = ranked.filter((item) => !item.hasNearExam);
  const subjectIdsToRemove = removable.slice(0, subjectsToRemoveCount).map((item) => item.subjectId);
  const subjectIdsToKeep = activeSubjectIds.filter((id) => !subjectIdsToRemove.includes(id));
  const nearExamSubjectIds = ranked.filter((item) => item.hasNearExam).map((item) => item.subjectId);

  return {
    activeSubjectsCount,
    subjectsToRemoveCount,
    subjectIdsToRemove,
    subjectIdsToKeep,
    nearExamSubjectIds,
    appliesThisWeek: subjectIdsToRemove.length > 0,
  };
}

function buildSummary(
  selected: RecoveryProblem[],
  variant: RecoveryPlanVariant = "standard",
  focusReduction?: RecoveryFocusReduction | null,
): string {
  if (selected.includes("burnout")) {
    return BURNOUT_MAIN_SUMMARY;
  }
  if (variant === "lighter") {
    return "Propuesta con menos carga: primero repasos y dudas, bloques cortos en calendario y menos asignaturas abiertas.";
  }
  if (selected.includes("overdue_reviews") && selected.includes("accumulated_doubts")) {
    return "Primero limpia la base: cierra repasos atrasados y resuelve dudas acumuladas antes de abrir más carga nueva.";
  }
  if (
    selected.includes("too_many_subjects") ||
    selected.includes("dont_know_where_to_start")
  ) {
    if (focusReduction && selected.includes("too_many_subjects")) {
      if (!focusReduction.appliesThisWeek) {
        return "No tienes demasiadas asignaturas abiertas esta semana. Mantén el foco actual.";
      }
      return `Esta semana conviene reducir foco: tienes ${focusReduction.activeSubjectsCount} asignaturas abiertas. Te propongo dejar fuera ${focusReduction.subjectIdsToRemove.length} asignatura${focusReduction.subjectIdsToRemove.length === 1 ? "" : "s"} del calendario semanal para concentrarte mejor.`;
    }
    return "El objetivo es recuperar control: reducir asignaturas abiertas, limpiar pendientes y planificar sesiones realistas.";
  }
  if (selected.includes("low_mock_scores") || selected.includes("accumulated_doubts")) {
    return "Prioriza entender lo que fallas: menos volumen de banco, más repasos dirigidos y dudas cerradas antes de presentarte.";
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

function downgradeRiskLevel(level: RecoveryPlan["riskLevel"]): RecoveryPlan["riskLevel"] {
  if (level === "high") return "medium";
  if (level === "medium") return "low";
  return "low";
}

function applyLighterVariant(
  steps: RecoveryPlanStep[],
  selected: RecoveryProblem[],
): RecoveryPlanStep[] {
  const sorted = [...steps].sort((a, b) => {
    const pa = LIGHTER_STEP_PRIORITY.indexOf(a.actionType ?? "plan_session");
    const pb = LIGHTER_STEP_PRIORITY.indexOf(b.actionType ?? "plan_session");
    return pa - pb;
  });

  const trimmed = sorted.slice(0, 4);
  const anchor = makeStep(
    selected.includes("burnout")
      ? {
          title: "Esta semana: menos bloques y más aire",
          description:
            "Al aplicar, reorganizamos la semana con sesiones más cortas, repasos ligeros y descanso entre bloques.",
          actionType: "rest",
        }
      : {
          title: "Esta semana: máximo 2-3 bloques en calendario",
          description:
            "Al aplicar, prioriza repaso y cierre de dudas. Deja teoría nueva o bancos largos para cuando tengas los pendientes al día.",
          actionType: "plan_session",
        },
  );

  const withoutDup = trimmed.filter((s) => stepFingerprint(s) !== stepFingerprint(anchor));
  return [anchor, ...withoutDup].slice(0, 5);
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
  examDates?: ExamDate[];
  weeklyGoalMinutes: number;
  variant?: RecoveryPlanVariant;
  today?: string;
}): RecoveryPlan {
  const {
    selectedProblems,
    subjects,
    sessions,
    plannedSessions,
    mockResults,
    reviewItems,
    errorLogItems,
    examDates = [],
    weeklyGoalMinutes,
    variant = "standard",
    today = getTodayDateString(),
  } = params;

  const steps: RecoveryPlanStep[] = [];

  const focusReduction = buildFocusReductionPlan({
    selectedProblems,
    subjects,
    sessions,
    plannedSessions,
    examDates,
    today,
  });

  for (const problem of selectedProblems) {
    addStepUnique(steps, makeStep(PROBLEM_STEP_TEMPLATES[problem]));
  }

  if (selectedProblems.includes("low_mock_scores")) {
    const withoutGenericMock = steps.filter(
      (step) => step.title !== PROBLEM_STEP_TEMPLATES.low_mock_scores.title,
    );
    steps.length = 0;
    steps.push(...withoutGenericMock);
    for (const step of buildMockCorrectionSteps(makeStep)) {
      addStepUnique(steps, step);
    }
  }

  if (selectedProblems.length === 1 && selectedProblems[0] === "overdue_reviews") {
    const withoutGenericOverdue = steps.filter(
      (step) => step.title !== PROBLEM_STEP_TEMPLATES.overdue_reviews.title,
    );
    steps.length = 0;
    steps.push(...withoutGenericOverdue);
    for (const step of buildOverdueReviewSteps(makeStep)) {
      addStepUnique(steps, step);
    }
  }

  if (selectedProblems.length === 1 && selectedProblems[0] === "low_time") {
    const withoutGenericLowTime = steps.filter(
      (step) => step.title !== PROBLEM_STEP_TEMPLATES.low_time.title,
    );
    steps.length = 0;
    steps.push(...withoutGenericLowTime);
    for (const step of buildLowTimeSteps(makeStep)) {
      addStepUnique(steps, step);
    }
  }

  if (selectedProblems.length === 1 && selectedProblems[0] === "dont_know_where_to_start") {
    const withoutGenericStart = steps.filter(
      (step) => step.title !== PROBLEM_STEP_TEMPLATES.dont_know_where_to_start.title,
    );
    steps.length = 0;
    steps.push(...withoutGenericStart);
    for (const step of buildStartGuidanceSteps(makeStep)) {
      addStepUnique(steps, step);
    }
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

  if (
    overdueReviews > 0 &&
    !selectedProblems.includes("overdue_reviews") &&
    !selectedProblems.includes("low_mock_scores")
  ) {
    addStepUnique(
      steps,
      makeStep({
        title: "Tienes repasos atrasados: resuélvelos o reprográmalos primero",
        description: `Hay ${overdueReviews} repaso${overdueReviews === 1 ? "" : "s"} atrasado${overdueReviews === 1 ? "" : "s"}. Completa o reprograma antes de abrir temas nuevos.`,
        actionType: "review",
      }),
    );
  }

  if (
    pendingErrors > 0 &&
    !selectedProblems.includes("accumulated_doubts") &&
    !selectedProblems.includes("low_mock_scores")
  ) {
    addStepUnique(
      steps,
      makeStep({
        title: "Tienes dudas o temas sin cerrar: priorízalos esta semana",
        description: `Hay ${pendingErrors} tema${pendingErrors === 1 ? "" : "s"} pendiente${pendingErrors === 1 ? "" : "s"} de revisar. Dedica una sesión corta a cerrar los más repetidos.`,
        actionType: "review",
      }),
    );
  }

  if (weekSessions.length === 0 && !selectedProblems.includes("low_mock_scores")) {
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

  if (
    activeCount > 3 &&
    !selectedProblems.includes("too_many_subjects") &&
    !isBurnoutRecoveryPlan(selectedProblems) &&
    !selectedProblems.includes("low_mock_scores")
  ) {
    addStepUnique(
      steps,
      makeStep({
        title: "Has tocado varias asignaturas recientemente; reduce foco esta semana",
        description: `En los últimos 14 días has activado ${activeCount} asignaturas. Elige máximo dos para los próximos 7 días.`,
        actionType: "reduce_subjects",
      }),
    );
  }

  if (
    avgMock !== null &&
    avgMock < 70 &&
    mockResults.length > 0 &&
    !selectedProblems.includes("low_mock_scores") &&
    !isBurnoutRecoveryPlan(selectedProblems)
  ) {
    addStepUnique(
      steps,
      makeStep({
        title: "Tu media de simulacros está ajustada; prioriza repaso dirigido",
        description: `Media orientativa: ${Math.round(avgMock)}%. Haz simulacros más cortos, anota dudas y repasa antes de repetir bancos completos.`,
        actionType: "mock",
      }),
    );
  }

  if (focusReduction && selectedProblems.includes("too_many_subjects")) {
    const subjectName = (subjectId: string) =>
      subjects.find((subject) => subject.id === subjectId)?.name ?? subjectId;
    if (!focusReduction.appliesThisWeek) {
      addStepUnique(
        steps,
        makeStep({
          title: "No hace falta recortar más asignaturas esta semana",
          description: "No tienes demasiadas asignaturas abiertas esta semana. Mantén el foco actual.",
          actionType: "reduce_subjects",
        }),
      );
    } else {
      const removeText =
        focusReduction.subjectIdsToRemove.length > 0
          ? `• ${focusReduction.subjectIdsToRemove.map(subjectName).join(" · ")}`
          : "ninguna";
      const keepPriority = [
        ...focusReduction.nearExamSubjectIds,
        ...focusReduction.subjectIdsToKeep.filter(
          (subjectId) => !focusReduction.nearExamSubjectIds.includes(subjectId),
        ),
      ].slice(0, 4);
      addStepUnique(
        steps,
        makeStep({
          title: "Quitar esta semana",
          description: removeText,
          actionType: "reduce_subjects",
        }),
      );
      addStepUnique(
        steps,
        makeStep({
          title: "Mantener prioridad",
          description:
            keepPriority.length > 0
              ? `• ${keepPriority.map(subjectName).join(" · ")}`
              : "Asignaturas con examen próximo y asignaturas críticas.",
          actionType: "reduce_subjects",
        }),
      );
    }
  }

  if (
    weekPlanned.length === 0 &&
    weekSessions.length > 0 &&
    !selectedProblems.includes("no_weekly_plan") &&
    !selectedProblems.includes("low_mock_scores")
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

  let riskLevel = calculateRiskLevel({
    selected: selectedProblems,
    overdueReviews,
    pendingErrors,
    avgMock,
    weekMinutes,
    weeklyGoalMinutes,
  });

  const primaryIntent = resolvePrimaryRecoveryIntent(selectedProblems);
  const intentPlan = buildCombinedIntentPlan({
    selectedProblems,
    focusReduction,
    makeStep,
  });
  const useLighterVariant =
    variant === "lighter" || primaryIntent === "burnout" || primaryIntent === "low_time";

  let finalSteps = steps;
  if (useLighterVariant) {
    riskLevel = primaryIntent === "burnout" ? "low" : downgradeRiskLevel(riskLevel);
    finalSteps = applyLighterVariant(steps, selectedProblems);
  }

  finalSteps = intentPlan.steps.slice(0, 3);

  return {
    problems: selectedProblems,
    primaryIntent,
    summary: intentPlan.summary,
    riskLevel,
    steps: finalSteps,
    variant: useLighterVariant ? "lighter" : variant,
    focusReduction: focusReduction ?? undefined,
    cta: {
      label: "Pedir ayuda con una asignatura",
      href: "/clases-ppl-atpl",
    },
  };
}
