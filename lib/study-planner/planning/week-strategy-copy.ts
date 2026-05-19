import { minutesToHoursLabel } from "../calculations";
import { getSubjectById } from "../subjects";
import type { WeeklyStudyPlan } from "./planning-types";
import { SUBJECT_MATURITY_LABELS, type SubjectMaturityPhase } from "./subject-maturity";

function buildPedagogyLine(phases: SubjectMaturityPhase[]): string {
  const set = new Set(phases);
  const hasInitial = set.has("initial") || set.has("building");
  const hasBank = phases.some((p) => p === "consolidation" || p === "building" || p === "exam");
  const hasReview = set.has("review");
  const hasExam = set.has("exam");

  if (hasInitial && hasBank && (hasReview || hasExam)) {
    return "Esta semana empezamos con teoría en las asignaturas nuevas y añadimos banco donde ya tienes base suficiente. Donde hay errores o mocks bajos, priorizamos repaso y simulacros.";
  }
  if (hasInitial && hasBank) {
    return "Esta semana empezamos con teoría en las asignaturas nuevas y añadimos banco donde ya tienes base suficiente. El objetivo es no estudiar a ciegas: primero entender, luego aplicar y después revisar errores.";
  }
  if (hasReview) {
    return "Esta semana combinamos banco y bloques de repaso o corrección de errores en las asignaturas que lo necesitan, sin saltar la teoría donde aún estás empezando.";
  }
  if (hasExam) {
    return "Esta semana reforzamos con mocks y banco las asignaturas más maduras, especialmente si el examen se acerca o el último mock fue bajo.";
  }
  return "Esta semana el reparto sigue la madurez de cada asignatura: teoría donde hace falta base, banco para aplicar y repaso donde hay huecos.";
}

/** Narrativa clara para el bloque «Estrategia de la semana» en la vista previa. */
export function buildWeekStrategyNarrative(preview: WeeklyStudyPlan): string {
  const uniqueDays = new Set(preview.blocks.map((b) => b.date)).size;
  const hoursLabel = minutesToHoursLabel(preview.totalPlannedMinutes);

  const phases = preview.subjectPhases
    ? Object.values(preview.subjectPhases)
    : [];
  const pedagogyLine =
    phases.length > 0
      ? buildPedagogyLine(phases)
      : "Esta semana el plan mezcla teoría, banco y repaso según el avance real de cada asignatura.";

  const focusNames = preview.focusSubjectIds
    .slice(0, 3)
    .map((id) => {
      const name = getSubjectById(id)?.name ?? id;
      const phase = preview.subjectPhases?.[id];
      if (phase) {
        return `${name} (${SUBJECT_MATURITY_LABELS[phase].toLowerCase()})`;
      }
      return name;
    })
    .filter(Boolean);

  let focusLine = "";
  if (focusNames.length >= 2) {
    const list =
      focusNames.length === 2
        ? `${focusNames[0]} y ${focusNames[1]}`
        : `${focusNames.slice(0, -1).join(", ")} y ${focusNames[focusNames.length - 1]}`;
    focusLine = ` Más foco en ${list}.`;
  } else if (focusNames.length === 1) {
    focusLine = ` Más foco en ${focusNames[0]}.`;
  }

  return `${pedagogyLine}${focusLine} El plan reparte ${hoursLabel} en ${uniqueDays} día${uniqueDays === 1 ? "" : "s"} para evitar sobrecarga.`;
}
