import { describe, expect, it } from "vitest";

import { LEVELS } from "./content";
import { recommendNext } from "./recommendation";

const cadet = LEVELS.find((level) => level.id === "cadet");
if (!cadet) throw new Error("Cadet catalog fixture is missing");

const skills = { listening: 0, readbacks: 0, phraseology: 0 };

describe("AeroComms gated recommendations", () => {
  it("never recommends Pro-only Cadet content to a Free user", () => {
    const completed = new Set(
      cadet.modules.flatMap((trainingModule) =>
        trainingModule.exercises.filter((exercise) => exercise.free).map((exercise) => exercise.id)),
    );

    const recommendation = recommendNext(cadet, completed, skills, false);
    expect(recommendation?.exercise.free).toBe(true);
  });

  it("can recommend the next Pro exercise after the Free part is complete", () => {
    const completed = new Set(
      cadet.modules.flatMap((trainingModule) =>
        trainingModule.exercises.filter((exercise) => exercise.free).map((exercise) => exercise.id)),
    );

    const recommendation = recommendNext(cadet, completed, skills, true);
    expect(recommendation).toBeDefined();
    expect(recommendation?.exercise.free).toBe(false);
  });
});
