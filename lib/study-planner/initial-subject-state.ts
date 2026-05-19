import type {
  DeclaredSubjectStage,
  InitialStudyContext,
  InitialSubjectState,
  SubjectReadiness,
} from "./types";
import type { SubjectMaturityPhase } from "./planning/subject-maturity";
import type { SubjectStudyStats } from "./planning/subject-maturity";

export const INITIAL_STUDY_CONTEXT_OPTIONS: {
  value: InitialStudyContext;
  label: string;
  description: string;
}[] = [
  {
    value: "from_zero",
    label: "Empiezo desde cero",
    description: "Aún no he empezado o voy a empezar ahora.",
  },
  {
    value: "started_some_subjects",
    label: "Ya he empezado algunas asignaturas",
    description: "Tengo base en parte del temario.",
  },
  {
    value: "mostly_bank",
    label: "Estoy haciendo principalmente banco",
    description: "La teoría base ya está y practico preguntas.",
  },
  {
    value: "exam_prep",
    label: "Estoy preparando exámenes",
    description: "Enfocado en mocks, repaso y fechas de examen.",
  },
  {
    value: "returning_after_break",
    label: "Estoy retomando después de parar",
    description: "Vuelvo al estudio tras una pausa.",
  },
];

export const DECLARED_STAGE_OPTIONS: { value: DeclaredSubjectStage; label: string }[] = [
  { value: "not_started", label: "No empezada" },
  { value: "base_initial", label: "Base inicial" },
  { value: "in_progress", label: "En progreso" },
  { value: "mostly_bank", label: "Principalmente banco" },
  { value: "exam_prep", label: "Preparando examen" },
  { value: "passed", label: "Aprobada" },
];

const DECLARED_STAGES = new Set<DeclaredSubjectStage>([
  "not_started",
  "base_initial",
  "in_progress",
  "mostly_bank",
  "exam_prep",
  "passed",
]);

const STUDY_CONTEXTS = new Set<InitialStudyContext>([
  "from_zero",
  "started_some_subjects",
  "mostly_bank",
  "exam_prep",
  "returning_after_break",
]);

export function isDeclaredSubjectStage(v: unknown): v is DeclaredSubjectStage {
  return typeof v === "string" && DECLARED_STAGES.has(v as DeclaredSubjectStage);
}

export function isInitialStudyContext(v: unknown): v is InitialStudyContext {
  return typeof v === "string" && STUDY_CONTEXTS.has(v as InitialStudyContext);
}

export function defaultStageForContext(context: InitialStudyContext): DeclaredSubjectStage {
  switch (context) {
    case "from_zero":
      return "not_started";
    case "started_some_subjects":
      return "in_progress";
    case "mostly_bank":
      return "mostly_bank";
    case "exam_prep":
      return "exam_prep";
    case "returning_after_break":
      return "base_initial";
  }
}

export function buildDefaultInitialSubjectStates(
  activeSubjectIds: string[],
  context: InitialStudyContext,
): InitialSubjectState[] {
  const stage = defaultStageForContext(context);
  return activeSubjectIds.map((subjectId) => ({
    subjectId,
    declaredStage: stage,
  }));
}

export function indexInitialSubjectStates(
  states: InitialSubjectState[] | undefined,
): Map<string, InitialSubjectState> {
  const map = new Map<string, InitialSubjectState>();
  if (!states) return map;
  for (const s of states) {
    map.set(s.subjectId, s);
  }
  return map;
}

export function getInitialStateForSubject(
  subjectId: string,
  states: InitialSubjectState[] | undefined,
): InitialSubjectState | null {
  return states?.find((s) => s.subjectId === subjectId) ?? null;
}

export function isSubjectDeclaredPassed(
  subjectId: string,
  states: InitialSubjectState[] | undefined,
): boolean {
  return getInitialStateForSubject(subjectId, states)?.declaredStage === "passed";
}

/** Hay sesiones/mocks registrados que deben mandar sobre lo declarado. */
export function hasRealStudyDataFromStats(stats: Pick<SubjectStudyStats, "sessionCount" | "mockCount" | "totalMinutes">): boolean {
  return stats.sessionCount > 0 || stats.mockCount > 0 || stats.totalMinutes > 0;
}

export function hasRealStudyDataFromReadiness(readiness: SubjectReadiness): boolean {
  const { factors, level } = readiness;
  if (factors.totalStudyMinutes > 0) return true;
  if (factors.mockCount > 0) return true;
  if (factors.daysSinceLastSession !== null) return true;
  return level !== "no_data";
}

export function defaultProgressForDeclaredStage(stage: DeclaredSubjectStage): number {
  switch (stage) {
    case "not_started":
      return 0;
    case "base_initial":
      return 15;
    case "in_progress":
      return 40;
    case "mostly_bank":
      return 55;
    case "exam_prep":
      return 65;
    case "passed":
      return 100;
  }
}

export function declaredStageToMaturityPhase(
  stage: DeclaredSubjectStage,
  estimatedProgressPercent?: number,
): SubjectMaturityPhase {
  switch (stage) {
    case "not_started":
      return "initial";
    case "base_initial":
      return "building";
    case "in_progress": {
      const pct = estimatedProgressPercent ?? defaultProgressForDeclaredStage(stage);
      return pct >= 25 ? "consolidation" : "building";
    }
    case "mostly_bank":
      return "consolidation";
    case "exam_prep":
      return "exam";
    case "passed":
      return "consolidation";
  }
}

/**
 * Madurez efectiva: datos reales > declaración inicial > heurística por stats vacíos.
 */
export function resolveSubjectMaturityPhaseWithGetter(
  stats: SubjectStudyStats,
  declared: InitialSubjectState | null,
  getPhase: (s: SubjectStudyStats) => SubjectMaturityPhase,
): SubjectMaturityPhase {
  if (hasRealStudyDataFromStats(stats)) {
    return getPhase(stats);
  }
  if (declared) {
    return declaredStageToMaturityPhase(
      declared.declaredStage,
      declared.estimatedProgressPercent,
    );
  }
  return getPhase(stats);
}

export function effectiveProgressPercent(
  calculated: number,
  declared: InitialSubjectState | null,
  hasRealData: boolean,
): number {
  if (hasRealData) return calculated;
  if (declared?.estimatedProgressPercent !== undefined) {
    return Math.min(100, Math.max(0, declared.estimatedProgressPercent));
  }
  if (declared) return defaultProgressForDeclaredStage(declared.declaredStage);
  return calculated;
}

export function mergeExamDatesFromInitialStates(
  examDates: { id: string; subjectId: string; date: string; notes?: string }[],
  initialStates: InitialSubjectState[],
  createId: () => string,
): typeof examDates {
  const next = [...examDates];
  const existingBySubject = new Set(next.map((e) => e.subjectId));

  for (const s of initialStates) {
    if (!s.examDate || !/^\d{4}-\d{2}-\d{2}$/.test(s.examDate)) continue;
    if (existingBySubject.has(s.subjectId)) continue;
    next.push({
      id: createId(),
      subjectId: s.subjectId,
      date: s.examDate,
    });
    existingBySubject.add(s.subjectId);
  }

  return next;
}

export function normalizeInitialSubjectStates(
  raw: unknown,
  activeSubjectIds: string[],
): InitialSubjectState[] {
  if (!Array.isArray(raw)) return [];
  const activeSet = new Set(activeSubjectIds);
  const result: InitialSubjectState[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const subjectId = typeof o.subjectId === "string" ? o.subjectId : "";
    if (!activeSet.has(subjectId)) continue;
    if (!isDeclaredSubjectStage(o.declaredStage)) continue;

    const state: InitialSubjectState = {
      subjectId,
      declaredStage: o.declaredStage,
    };

    const pct = Number(o.estimatedProgressPercent);
    if (Number.isFinite(pct)) {
      state.estimatedProgressPercent = Math.min(100, Math.max(0, Math.round(pct)));
    }

    const mock = Number(o.estimatedMockAverage);
    if (Number.isFinite(mock)) {
      state.estimatedMockAverage = Math.min(100, Math.max(0, Math.round(mock)));
    }

    if (typeof o.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.examDate)) {
      state.examDate = o.examDate;
    }

    result.push(state);
  }

  return result;
}
