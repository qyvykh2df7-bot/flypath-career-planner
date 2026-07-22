/**
 * Catalog entries that were intentionally removed but may still appear in old
 * bookmarks, browser history, or previously persisted activity.
 *
 * Keep this list independent from the live catalog so retired routes remain
 * safe after their exercises are removed.
 */
const RETIRED_AEROCOMMS_EXERCISES = [
  { id: "sp-missions.circuit-training.mission", title: "Circuit Training" },
  { id: "sp-missions.touch-and-go-session.mission", title: "Touch & Go Session" },
  { id: "sp-missions.local-training-flight.mission", title: "Local Training Flight" },
  { id: "sp-missions.first-solo.mission", title: "First Solo" },
] as const;

export const RETIRED_AEROCOMMS_EXERCISE_IDS = RETIRED_AEROCOMMS_EXERCISES.map((exercise) => exercise.id);

const retiredExercisesById = new Map<string, (typeof RETIRED_AEROCOMMS_EXERCISES)[number]>(
  RETIRED_AEROCOMMS_EXERCISES.map((exercise) => [exercise.id, exercise]),
);

export function isRetiredAeroCommsExerciseId(exerciseId: string | null | undefined): boolean {
  return typeof exerciseId === "string" && retiredExercisesById.has(exerciseId);
}

/**
 * Retired exercises are never playable. This metadata exists solely to keep
 * pre-retirement progress readable and synchronizable across devices.
 */
export function findRetiredAeroCommsExercise(exerciseId: string | null | undefined) {
  return typeof exerciseId === "string" ? retiredExercisesById.get(exerciseId) : undefined;
}
