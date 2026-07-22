import { describe, expect, it } from "vitest";

import { findExercise } from "./content";
import {
  RETIRED_AEROCOMMS_EXERCISE_IDS,
  findRetiredAeroCommsExercise,
  isRetiredAeroCommsExerciseId,
} from "./retired-content";

describe("retired AeroComms content", () => {
  it.each(RETIRED_AEROCOMMS_EXERCISE_IDS)("blocks the retired route for %s", (exerciseId) => {
    expect(isRetiredAeroCommsExerciseId(exerciseId)).toBe(true);
    expect(findExercise(exerciseId)).toBeUndefined();
    expect(findRetiredAeroCommsExercise(exerciseId)).toMatchObject({ id: exerciseId });
  });

  it("does not treat current exercises as retired", () => {
    expect(isRetiredAeroCommsExerciseId("cadet.cadet-basics.intro-to-atc")).toBe(false);
    expect(isRetiredAeroCommsExerciseId(undefined)).toBe(false);
  });
});
