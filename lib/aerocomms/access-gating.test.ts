import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_FREE_CADET_RATIO,
  LEVELS,
  isExerciseAccessible,
  isLevelUnlocked,
} from "./content";
import { MISSIONS } from "./atcSim";
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

  it("makes the initial approximately 30 percent of every Cadet block Free", () => {
    for (const trainingModule of cadet.modules) {
      const expectedFree = Math.max(1, Math.ceil(trainingModule.exercises.length * AEROCOMMS_FREE_CADET_RATIO));
      const freeExercises = trainingModule.exercises.filter((exercise) => exercise.free);

      expect(freeExercises).toHaveLength(expectedFree);
      expect(trainingModule.exercises.slice(0, expectedFree).every((exercise) => exercise.free)).toBe(true);
      expect(trainingModule.exercises.slice(expectedFree).every((exercise) => !exercise.free)).toBe(true);
    }
  });

  it("does not expose Free exercises in levels after Cadet", () => {
    for (const level of LEVELS.filter((candidate) => candidate.id !== "cadet")) {
      expect(level.modules.flatMap((trainingModule) => trainingModule.exercises).some((exercise) => exercise.free)).toBe(false);
    }
  });

  it("unlocks all Train content for a real Pro access snapshot", () => {
    expect(isExerciseAccessible(proCadetExercise, cadet, completed, true, false)).toBe(true);
    expect(isLevelUnlocked(studentPilot, completed, true, false)).toBe(true);
  });

  it("keeps only Mission 1 free and marks every other mission as commercially locked for Free", () => {
    expect(getMissionUnlockState(AEROCOMMS_FREE_MISSION_ID, [], false, false, false).effectiveUnlocked).toBe(true);
    expect(getMissionUnlockState("cadet-taxi-hold-short", [], false, false, false)).toMatchObject({
      effectiveUnlocked: false,
      reason: "AeroComms Pro required",
      isProLocked: true,
      isProgressLocked: false,
    });
  });

  it("unlocks the complete mission catalog for Pro regardless of progress", () => {
    for (const mission of MISSIONS) {
      expect(getMissionUnlockState(mission.id, [], mission.locked, true, false)).toMatchObject({
        effectiveUnlocked: true,
        isProLocked: false,
        isProgressLocked: false,
      });
    }
  });

  it("does not let a legacy catalog lock override a Pro entitlement", () => {
    expect(getMissionUnlockState("future-mission", [], true, true, false)).toMatchObject({
      effectiveUnlocked: true,
      isProLocked: false,
      isProgressLocked: false,
    });
  });

  it("permits the internal override only when explicitly passed by a non-production caller", () => {
    expect(isExerciseAccessible(proCadetExercise, cadet, completed, false, true)).toBe(true);
    expect(getMissionUnlockState("cadet-taxi-hold-short", [], false, false, true).effectiveUnlocked).toBe(true);
  });
});
