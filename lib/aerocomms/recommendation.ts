/**
 * app/lib/recommendation.ts
 *
 * Smart recommendNext — Cadet uses prerequisite-aware interleaved logic;
 * all other levels fall through to the original linear recommendNext from
 * content.ts (re-exported here as recommendNextLinear).
 *
 * This lives in a separate file to avoid the circular import that would arise
 * from having content.ts import progress.ts (progress.ts already imports
 * content.ts for LEVELS, topicCompletion, etc.).
 *
 * DEV flags: this module deliberately ignores DEV_UNLOCK_ALL_MISSIONS and
 * DEV_UNLOCK_ALL_TRAIN for recommendation purposes — same principle applied
 * to Today's ATC Sim mission recommendations.
 */

import {
  type Level,
  type PracticeSkill,
  type Recommendation,
  firstIncompleteExercise,
  moduleCompletion,
  recommendNext as recommendNextLinear,
  trainModules,
  weakestSkill,
} from "./content";
import { getLearnedSkills, TOPIC_REQUIREMENTS } from "./progress";

export type { Recommendation };
export { recommendNextLinear };

// ---------------------------------------------------------------------------
// Cadet constants
// ---------------------------------------------------------------------------

const CADET_ID = "cadet";

/** Module IDs that belong to the Cadet Foundations section. */
const FOUNDATION_IDS = new Set(["radio-fundamentals", "first-contact"]);

/** Mapping from PracticeSkill → Cadet module ID for the weakest-skill fallback. */
const PRACTICE_SKILL_MODULE: Record<PracticeSkill, string> = {
  listening: "cadet-listening",
  readbacks: "cadet-readbacks",
  phraseology: "cadet-phraseology",
};

// ---------------------------------------------------------------------------
// Cadet interleaved recommendation
// ---------------------------------------------------------------------------

/**
 * Cadet-specific recommendation engine. Produces interleaved Foundation +
 * Core Practice suggestions based on what the user has genuinely learned.
 *
 * Priority order:
 *
 *  1. Continue any in-progress TOPIC (some but not all exercises done).
 *     Granularity is per-topic so finishing one topic inside Radio Fundamentals
 *     doesn't force the user to stay in that module until 100%.
 *
 *  2. Start the first Core Practice (Listening / Readbacks / Phraseology /
 *     Scenarios) topic whose real prerequisites are met.
 *     DEV_UNLOCK_ALL_* flags are ignored — real learned-skills check only.
 *
 *  3. Start the next Foundation (Radio Fundamentals / First Contact) topic
 *     that has not been touched yet.
 *
 *  4. Safety-net pass: any remaining incomplete topic across all Cadet modules.
 *
 *  5. Weakest-skill practice fallback (same as original recommendNext).
 */
function recommendNextCadetInterleaved(
  cadetLevel: Level,
  completed: Set<string>,
  skills: Record<PracticeSkill, number>,
): Recommendation | undefined {
  // Real learned skills — no dev bypass.
  const learnedSkills = getLearnedSkills([...completed]);

  const allModules = trainModules(cadetLevel);
  const coreModules = allModules.filter((m) => !FOUNDATION_IDS.has(m.id));
  const foundationModules = allModules.filter((m) => FOUNDATION_IDS.has(m.id));

  // ── Pass 1: Continue any in-progress TOPIC ─────────────────────────────
  // We iterate topic-by-topic so that a finished topic inside a Foundation
  // module doesn't prevent Core Practice from surfacing at the next session.
  for (const trainingModule of allModules) {
    if (trainingModule.topics) {
      for (const topic of trainingModule.topics) {
        const done = topic.exercises.filter((e) => completed.has(e.id)).length;
        if (done > 0 && done < topic.exercises.length) {
          const ex = topic.exercises.find((e) => !completed.has(e.id));
          if (ex) return { level: cadetLevel, module: trainingModule, topic, exercise: ex, reason: "continue" };
        }
      }
    } else {
      // Flat module (no topic grouping) — use module-level completion.
      const c = moduleCompletion(trainingModule, completed);
      if (c > 0 && c < 100) {
        const hit = firstIncompleteExercise(trainingModule, completed);
        if (hit) return { level: cadetLevel, module: trainingModule, exercise: hit.exercise, reason: "continue" };
      }
    }
  }

  // ── Pass 2: Start first unlocked Core Practice topic ───────────────────
  // "Unlocked" means ALL required skills in TOPIC_REQUIREMENTS are in
  // learnedSkills. No dev-unlock bypass.
  for (const trainingModule of coreModules) {
    if (!trainingModule.topics) continue;
    for (const topic of trainingModule.topics) {
      const reqs = TOPIC_REQUIREMENTS[topic.id] ?? [];
      if (!reqs.every((skill) => learnedSkills.has(skill))) continue;
      const ex = topic.exercises.find((e) => !completed.has(e.id));
      if (ex) return { level: cadetLevel, module: trainingModule, topic, exercise: ex, reason: "start" };
    }
  }

  // ── Pass 3: Start next Foundation topic not yet touched ────────────────
  for (const trainingModule of foundationModules) {
    const hit = firstIncompleteExercise(trainingModule, completed);
    if (hit) return { level: cadetLevel, module: trainingModule, topic: hit.topic, exercise: hit.exercise, reason: "start" };
  }

  // ── Pass 4: Safety net — any remaining incomplete Cadet content ─────────
  for (const trainingModule of allModules) {
    const hit = firstIncompleteExercise(trainingModule, completed);
    if (hit) return { level: cadetLevel, module: trainingModule, topic: hit.topic, exercise: hit.exercise, reason: "start" };
  }

  // ── Pass 5: Weakest-skill practice fallback ────────────────────────────
  const weakMod =
    allModules.find((m) => m.id === PRACTICE_SKILL_MODULE[weakestSkill(skills)]) ??
    allModules[0];
  if (weakMod) {
    const hit =
      firstIncompleteExercise(weakMod, completed) ??
      (weakMod.topics
        ? { topic: weakMod.topics[0], exercise: weakMod.topics[0].exercises[0] }
        : { exercise: weakMod.exercises[0] });
    if (hit?.exercise)
      return { level: cadetLevel, module: weakMod, topic: hit.topic, exercise: hit.exercise, reason: "practice" };
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for content.ts recommendNext
// ---------------------------------------------------------------------------

/**
 * Returns the next recommended Train exercise for the given level.
 *
 * - Cadet  → prerequisite-aware interleaved logic (see above).
 * - Others → original linear logic (recommendNextLinear).
 *
 * Signature is intentionally identical to content.ts recommendNext so
 * callers only need to change their import path.
 */
export function recommendNext(
  level: Level,
  completed: Set<string>,
  skills: Record<PracticeSkill, number>,
): Recommendation | undefined {
  if (level.id === CADET_ID) {
    return recommendNextCadetInterleaved(level, completed, skills);
  }
  return recommendNextLinear(level, completed, skills);
}
