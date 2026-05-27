import type { RecoveryFocusReduction, RecoveryPlanStep, RecoveryProblem } from "./types";
import { BURNOUT_MAIN_SUMMARY } from "./recovery-burnout-relief";

export const RECOVERY_INTENT_PRIORITY: RecoveryProblem[] = [
  "burnout",
  "low_time",
  "dont_know_where_to_start",
  "no_weekly_plan",
  "too_many_subjects",
  "overdue_reviews",
  "accumulated_doubts",
  "low_mock_scores",
];

export function resolvePrimaryRecoveryIntent(selectedProblems: RecoveryProblem[]): RecoveryProblem {
  for (const intent of RECOVERY_INTENT_PRIORITY) {
    if (selectedProblems.includes(intent)) return intent;
  }
  return selectedProblems[0] ?? "dont_know_where_to_start";
}

type BuildCombinedIntentPlanParams = {
  selectedProblems: RecoveryProblem[];
  focusReduction?: RecoveryFocusReduction | null;
  makeStep: (step: Omit<RecoveryPlanStep, "id">) => RecoveryPlanStep;
};

export function buildCombinedIntentPlan(params: BuildCombinedIntentPlanParams): {
  primaryIntent: RecoveryProblem;
  summary: string;
  steps: RecoveryPlanStep[];
} {
  const { selectedProblems, makeStep, focusReduction } = params;
  const has = (problem: RecoveryProblem) => selectedProblems.includes(problem);
  const primaryIntent = resolvePrimaryRecoveryIntent(selectedProblems);

  if (primaryIntent === "burnout") {
    const summary = has("low_time")
      ? "Durante los próximos 7 días haremos una semana mínima y ligera: menos bloques, pausas claras y continuidad sin presión."
      : BURNOUT_MAIN_SUMMARY;
    return {
      primaryIntent,
      summary,
      steps: [
        makeStep({
          title: "Carga mínima primero",
          description: "Recorta la semana a los bloques esenciales para bajar saturación.",
          actionType: "rest",
        }),
        makeStep({
          title: "Bloques cortos con descanso",
          description: "Usa sesiones breves y evita encadenar bloques largos.",
          actionType: "review",
        }),
        makeStep({
          title: "Continuidad sin exigencia",
          description: "Mantén ritmo suave para no perder inercia sin sobrecargarte.",
          actionType: "plan_session",
        }),
      ],
    };
  }

  if (primaryIntent === "low_time") {
    const summary = has("dont_know_where_to_start")
      ? "Durante los próximos 7 días simplificaremos al mínimo: una prioridad clara y bloques cortos que sí puedas completar."
      : "Durante los próximos 7 días ajustaremos el plan a una carga mínima realista, con menos carga y prioridades claras.";
    return {
      primaryIntent,
      summary,
      steps: [
        makeStep({
          title: "Objetivo semanal realista",
          description: "Planifica solo bloques que realmente puedas cumplir.",
          actionType: "plan_session",
        }),
        makeStep({
          title: "Prioridad alta primero",
          description: "Mantén únicamente tareas o asignaturas críticas esta semana.",
          actionType: "reduce_subjects",
        }),
        makeStep({
          title: "Sesiones cortas",
          description: "Usa bloques de 30-45 minutos para mantener continuidad sin saturarte.",
          actionType: "plan_session",
        }),
      ],
    };
  }

  if (primaryIntent === "dont_know_where_to_start") {
    return {
      primaryIntent,
      summary:
        "Durante los próximos 7 días empezaremos con una sola asignatura y acciones pequeñas para crear inercia sin bloquearte.",
      steps: [
        makeStep({
          title: "Una asignatura primero",
          description: "Elige una sola materia para empezar esta semana.",
          actionType: "reduce_subjects",
        }),
        makeStep({
          title: "Primer bloque corto",
          description: "Planifica una sesión de 30-45 minutos para romper el bloqueo.",
          actionType: "plan_session",
        }),
        makeStep({
          title: "Siguiente paso visible",
          description: "Después del primer bloque, añade banco o repaso según cómo te haya ido.",
          actionType: "review",
        }),
      ],
    };
  }

  if (primaryIntent === "no_weekly_plan") {
    if (has("too_many_subjects")) {
      return {
        primaryIntent,
        summary:
          "Durante los próximos 7 días ordenaremos el foco: primero reducimos asignaturas activas y después estructuramos una semana simple.",
        steps: [
          makeStep({
            title: "Reducir foco primero",
            description: "Quédate con 1-2 asignaturas prioritarias para evitar dispersión.",
            actionType: "reduce_subjects",
          }),
          makeStep({
            title: "Semana estructurada",
            description: "Define pocos bloques con secuencia clara de teoría, banco y repaso.",
            actionType: "plan_session",
          }),
          makeStep({
            title: "Ritmo sostenible",
            description: "Mantén continuidad semanal con carga estable y sin picos.",
            actionType: "review",
          }),
        ],
      };
    }
    return {
      primaryIntent,
      summary:
        "Durante los próximos 7 días organizaremos una semana simple y clara: pocas sesiones, prioridades definidas y mezcla equilibrada.",
      steps: [
        makeStep({
          title: "Definir prioridades",
          description: "Selecciona las tareas clave de la semana antes de llenar el calendario.",
          actionType: "plan_session",
        }),
        makeStep({
          title: "Pocos bloques bien elegidos",
          description: "Planifica solo sesiones útiles y fáciles de sostener.",
          actionType: "plan_session",
        }),
        makeStep({
          title: "Revisión de cierre",
          description: "Reserva un bloque de repaso para consolidar lo avanzado.",
          actionType: "review",
        }),
      ],
    };
  }

  if (primaryIntent === "too_many_subjects") {
    const removalCopy =
      focusReduction && focusReduction.subjectIdsToRemove.length > 0
        ? ` Te propongo dejar fuera ${focusReduction.subjectIdsToRemove.length} asignatura${focusReduction.subjectIdsToRemove.length === 1 ? "" : "s"} del calendario semanal.`
        : "";
    return {
      primaryIntent,
      summary: `Durante los próximos 7 días reduciremos foco para ganar claridad: menos asignaturas activas y una semana más ordenada.${removalCopy}`,
      steps: [
        makeStep({
          title: "Quitar ruido semanal",
          description: "Saca temporalmente asignaturas secundarias del calendario.",
          actionType: "reduce_subjects",
        }),
        makeStep({
          title: "Mantener prioridades",
          description: "Conserva solo asignaturas críticas o con examen próximo.",
          actionType: "reduce_subjects",
        }),
        makeStep({
          title: "Consolidar ritmo",
          description: "Usa bloques realistas para no volver a dispersarte.",
          actionType: "plan_session",
        }),
      ],
    };
  }

  if (primaryIntent === "overdue_reviews") {
    if (has("accumulated_doubts")) {
      return {
        primaryIntent,
        summary:
          "Durante los próximos 7 días priorizaremos consolidación: repasos dirigidos y cierre de dudas antes de añadir teoría nueva.",
        steps: [
          makeStep({
            title: "Repasos y dudas primero",
            description: "Limpia pendientes y dudas abiertas antes de avanzar.",
            actionType: "review",
          }),
          makeStep({
            title: "Teoría nueva limitada",
            description: "Reduce contenido nuevo hasta ponerte al día.",
            actionType: "plan_session",
          }),
          makeStep({
            title: "Revisión corta diaria",
            description: "Añade bloques breves para no volver a acumular retraso.",
            actionType: "review",
          }),
        ],
      };
    }
    return {
      primaryIntent,
      summary:
        "Durante los próximos 7 días limpiaremos repasos pendientes antes de añadir más carga nueva.",
      steps: [
        makeStep({
          title: "Repasos atrasados primero",
          description: "Completa o reprograma repasos pendientes antes de avanzar con temas nuevos.",
          actionType: "review",
        }),
        makeStep({
          title: "Teoría nueva limitada",
          description: "Reduce carga nueva esta semana hasta volver al ritmo normal.",
          actionType: "plan_session",
        }),
        makeStep({
          title: "Revisión corta diaria",
          description: "Añade bloques breves de repaso para evitar volver a acumular retraso.",
          actionType: "review",
        }),
      ],
    };
  }

  if (primaryIntent === "accumulated_doubts") {
    if (has("low_mock_scores")) {
      return {
        primaryIntent,
        summary:
          "Durante los próximos 7 días cambiaremos cantidad por precisión: revisión de errores reales y cierre de dudas repetidas.",
        steps: [
          makeStep({
            title: "Analizar errores clave",
            description: "Prioriza los fallos que se repiten en simulacros o banco.",
            actionType: "mock",
          }),
          makeStep({
            title: "Repasos dirigidos",
            description: "Convierte dudas abiertas en repasos concretos y medibles.",
            actionType: "review",
          }),
          makeStep({
            title: "Menos banco automático",
            description: "Reduce volumen sin análisis para mejorar precisión.",
            actionType: "review",
          }),
        ],
      };
    }
    return {
      primaryIntent,
      summary:
        "Durante los próximos 7 días priorizaremos cerrar dudas pendientes antes de añadir temas nuevos.",
      steps: [
        makeStep({
          title: "Cerrar dudas abiertas",
          description: "Reúne preguntas pendientes y conviértelas en repasos concretos.",
          actionType: "review",
        }),
        makeStep({
          title: "Menos contenido nuevo",
          description: "Reduce teoría nueva hasta recuperar claridad.",
          actionType: "plan_session",
        }),
        makeStep({
          title: "Revisar antes de avanzar",
          description: "Prioriza entender temas abiertos antes de añadir asignaturas nuevas.",
          actionType: "review",
        }),
      ],
    };
  }

  return {
    primaryIntent,
    summary:
      "Durante los próximos 7 días cambiaremos volumen por precisión: menos bancos automáticos y más análisis de errores reales.",
    steps: [
      makeStep({
        title: "Simulacro + revisión",
        description: "Haz menos simulacros, pero revisa cada fallo importante.",
        actionType: "mock",
      }),
      makeStep({
        title: "Detectar patrones",
        description: "Identifica asignaturas o temas donde repites errores.",
        actionType: "review",
      }),
      makeStep({
        title: "Menos volumen automático",
        description: "Reduce sesiones de banco masivo sin análisis.",
        actionType: "review",
      }),
    ],
  };
}
