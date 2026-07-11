import {
  getLevel,
  findModule,
  trainModules,
  type ExerciseType,
  type Module,
  type Topic,
} from "./content";

export type ProgressInput = {
  completedExercises: string[] | Set<string>;
};

export type ProgressGroupEvaluation =
  | "completion-only"
  | "scored-now"
  | "scorable-without-voice"
  | "voice-pending"
  | "mixed";

export type ProgressCompletionStatus = "not-started" | "in-progress" | "complete";

export type ProgressGroup = {
  id: string;
  name: string;
  description?: string;
  levelId: string;
  moduleId: string;
  exerciseIds: string[];
  totalExercises: number;
  completedExercises: number;
  completionPercent: number;
  status: ProgressCompletionStatus;
  evaluation: ProgressGroupEvaluation;
  exerciseTypes: ExerciseType[];
  hasVoicePending: boolean;
  hasScoredNow: boolean;
  hasScorableWithoutVoice: boolean;
};

export type ProgressModuleSummary = {
  levelId: string;
  moduleId: string;
  name: string;
  totalGroups: number;
  completedGroups: number;
  progressPercent: number;
  status: ProgressCompletionStatus;
  groups: ProgressGroup[];
};

export type ProgressLevelSummary = {
  levelId: string;
  name: string;
  totalModules: number;
  totalGroups: number;
  completedGroups: number;
  progressPercent: number;
  groupMeanPercent: number;
  status: ProgressCompletionStatus;
  modules: ProgressModuleSummary[];
};

function completedSet(progress: ProgressInput): Set<string> {
  return progress.completedExercises instanceof Set
    ? progress.completedExercises
    : new Set(progress.completedExercises);
}

function percent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function statusFor(completed: number, total: number): ProgressCompletionStatus {
  if (total <= 0 || completed <= 0) return "not-started";
  if (completed >= total) return "complete";
  return "in-progress";
}

function uniqueTypes(types: ExerciseType[]): ExerciseType[] {
  return Array.from(new Set(types));
}

function isVoicePendingType(type: ExerciseType): boolean {
  return type === "Readback" || type === "Speaking" || type === "Scenario" || type === "Mission";
}

function isCompletionOnlyType(type: ExerciseType): boolean {
  return type === "Lesson" || type === "Interactive Demo";
}

function isCurrentlyScoredType(levelId: string, type: ExerciseType): boolean {
  if (levelId !== "cadet") return false;
  return type === "Listening" || type === "Phraseology" || type === "Challenge";
}

function isScorableWithoutVoiceType(levelId: string, type: ExerciseType): boolean {
  if (levelId === "cadet") return false;
  return type === "Listening" || type === "Choice" || type === "Phraseology" || type === "Challenge";
}

function evaluationFor(levelId: string, types: ExerciseType[]): ProgressGroupEvaluation {
  const hasVoicePending = types.some(isVoicePendingType);
  const hasCompletionOnly = types.some(isCompletionOnlyType);
  const hasScoredNow = types.some((type) => isCurrentlyScoredType(levelId, type));
  const hasScorableWithoutVoice = types.some((type) => isScorableWithoutVoiceType(levelId, type));

  if (hasVoicePending && (hasCompletionOnly || hasScoredNow || hasScorableWithoutVoice)) return "mixed";
  if (hasVoicePending) return "voice-pending";
  if (hasScoredNow && hasCompletionOnly) return "mixed";
  if (hasScorableWithoutVoice && hasCompletionOnly) return "mixed";
  if (hasScoredNow) return "scored-now";
  if (hasScorableWithoutVoice) return "scorable-without-voice";
  return "completion-only";
}

function groupFromTopic(levelId: string, moduleId: string, topic: Topic, completed: Set<string>): ProgressGroup {
  const exerciseIds = topic.exercises.map((exercise) => exercise.id);
  const completedCount = exerciseIds.filter((id) => completed.has(id)).length;
  const exerciseTypes = uniqueTypes(topic.exercises.map((exercise) => exercise.type));
  const evaluation = evaluationFor(levelId, exerciseTypes);

  return {
    id: topic.id,
    name: topic.name,
    description: topic.description,
    levelId,
    moduleId,
    exerciseIds,
    totalExercises: exerciseIds.length,
    completedExercises: completedCount,
    completionPercent: percent(completedCount, exerciseIds.length),
    status: statusFor(completedCount, exerciseIds.length),
    evaluation,
    exerciseTypes,
    hasVoicePending: exerciseTypes.some(isVoicePendingType),
    hasScoredNow: exerciseTypes.some((type) => isCurrentlyScoredType(levelId, type)),
    hasScorableWithoutVoice: exerciseTypes.some((type) => isScorableWithoutVoiceType(levelId, type)),
  };
}

function groupsForModule(levelId: string, module: Module, completed: Set<string>): ProgressGroup[] {
  if (module.trainExcluded) return [];

  if (module.topics?.length) {
    return module.topics.map((topic) => groupFromTopic(levelId, module.id, topic, completed));
  }

  return module.exercises.map((exercise) => {
    const exerciseTypes = [exercise.type];
    const done = completed.has(exercise.id) ? 1 : 0;

    return {
      id: exercise.id,
      name: exercise.title,
      description: exercise.description,
      levelId,
      moduleId: module.id,
      exerciseIds: [exercise.id],
      totalExercises: 1,
      completedExercises: done,
      completionPercent: done === 1 ? 100 : 0,
      status: statusFor(done, 1),
      evaluation: evaluationFor(levelId, exerciseTypes),
      exerciseTypes,
      hasVoicePending: isVoicePendingType(exercise.type),
      hasScoredNow: isCurrentlyScoredType(levelId, exercise.type),
      hasScorableWithoutVoice: isScorableWithoutVoiceType(levelId, exercise.type),
    };
  });
}

function moduleSummary(levelId: string, module: Module, completed: Set<string>): ProgressModuleSummary {
  const groups = groupsForModule(levelId, module, completed);
  const completedGroups = groups.filter((group) => group.status === "complete").length;
  const progressPercent = mean(groups.map((group) => group.completionPercent));

  return {
    levelId,
    moduleId: module.id,
    name: module.name,
    totalGroups: groups.length,
    completedGroups,
    progressPercent,
    status: statusFor(completedGroups, groups.length),
    groups,
  };
}

export function getLevelProgressGroups(levelId: string, progress: ProgressInput): ProgressGroup[] {
  const level = getLevel(levelId);
  if (!level) return [];

  const completed = completedSet(progress);
  return trainModules(level).flatMap((module) => groupsForModule(level.id, module, completed));
}

export function getModuleProgressSummary(
  moduleId: string,
  progress: ProgressInput,
): ProgressModuleSummary | undefined {
  const found = findModule(moduleId);
  if (!found || found.module.trainExcluded) return undefined;

  return moduleSummary(found.level.id, found.module, completedSet(progress));
}

export function getLevelProgressSummary(
  levelId: string,
  progress: ProgressInput,
): ProgressLevelSummary | undefined {
  const level = getLevel(levelId);
  if (!level) return undefined;

  const completed = completedSet(progress);
  const modules = trainModules(level).map((module) => moduleSummary(level.id, module, completed));
  const totalGroups = modules.reduce((sum, module) => sum + module.totalGroups, 0);
  const completedGroups = modules.reduce((sum, module) => sum + module.completedGroups, 0);
  const groupMeanPercent = mean(modules.flatMap((module) => module.groups.map((group) => group.completionPercent)));

  return {
    levelId: level.id,
    name: level.name,
    totalModules: modules.length,
    totalGroups,
    completedGroups,
    // Level progress is the mean of visible module progress, not raw exercise
    // count, so a large drill-heavy module does not dominate the level.
    progressPercent: mean(modules.map((module) => module.progressPercent)),
    groupMeanPercent,
    status: statusFor(completedGroups, totalGroups),
    modules,
  };
}
