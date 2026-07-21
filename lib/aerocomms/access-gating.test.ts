import { describe, expect, it } from "vitest";

import { LEVELS, isExerciseAccessible, isLevelUnlocked } from "./content";
import { AEROCOMMS_FREE_MISSION_ID, getMissionUnlockState } from "./progress";

const completed = new Set<string>();
const cadet = LEVELS.find((level) => level.id === "cadet");
const studentPilot = LEVELS.find((level) => level.id === "student-pilot");

if (!cadet || !studentPilot) throw new Error("AeroComms catalog fixture is incomplete");

const cadetExercises = cadet.modules.flatMap((module) => module.exercises);
const freeCadetExercise = cadetExercises.find((exercise) => exercise.free);
const proCadetExercise = cadetExercises.find((exercise) => !exercise.free);

if (!freeCadetExercise || !proCadetExercise) throw new Error("Cadet Free/Pro fixture is incomplete");

describe("AeroComms Free and Pro gates", () => {
  it("keeps only marked Cadet content accessible for Free in production", () => {
    expect(isExerciseAccessible(freeCadetExercise, cadet, completed, false, false)).toBe(true);
    expect(isExerciseAccessible(proCadetExercise, cadet, completed, false, false)).toBe(false);
    expect(isLevelUnlocked(studentPilot, completed, false, false)).toBe(false);
  });

  it("unlocks all Train content for a real Pro access snapshot", () => {
    expect(isExerciseAccessible(proCadetExercise, cadet, completed, true, false)).toBe(true);
    expect(isLevelUnlocked(studentPilot, completed, true, false)).toBe(true);
  });

  it("keeps only Mission 1 free and requires Pro plus progress for later missions", () => {
    expect(getMissionUnlockState(AEROCOMMS_FREE_MISSION_ID, [], false, false, false).effectiveUnlocked).toBe(true);
    expect(getMissionUnlockState("cadet-taxi-hold-short", [], false, false, false)).toMatchObject({
      effectiveUnlocked: false,
      reason: "AeroComms Pro required",
    });
    expect(getMissionUnlockState("cadet-taxi-hold-short", [], false, true, false).effectiveUnlocked).toBe(false);
  });

  it("permits the internal override only when explicitly passed by a non-production caller", () => {
    expect(isExerciseAccessible(proCadetExercise, cadet, completed, false, true)).toBe(true);
    expect(getMissionUnlockState("cadet-taxi-hold-short", [], false, false, true).effectiveUnlocked).toBe(true);
  });
});
