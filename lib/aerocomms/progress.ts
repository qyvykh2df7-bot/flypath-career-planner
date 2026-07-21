/**
 * app/lib/progress.ts
 *
 * AeroComms Alpha — Skill & Unlock Engine
 *
 * All unlock logic is derived from a single source of truth:
 *   AppState.completedExercises  (stored in aerocomms.v2 localStorage blob)
 *
 * learnedSkills, completedTopics and unlock states are PURE FUNCTIONS.
 * Nothing extra is stored in localStorage.
 *
 * DEV FLAGS
 * ---------
 * DEV_UNLOCK_ALL_TRAIN       lives in content.ts (already used by isLevelUnlocked).
 * DEV_UNLOCK_ALL_MISSIONS    defined here — keeps ATC Sim Guided Missions open.
 *
 * They derive from NODE_ENV and are always false in production.
 */

import { LEVELS, topicCompletion, DEV_UNLOCK_ALL_TRAIN } from "./content";
import { isAeroCommsDevelopmentOverrideEnabled } from "./access";

// Re-export for convenience so callers can find all dev flags in one module.
export { DEV_UNLOCK_ALL_TRAIN };

// ---------------------------------------------------------------------------
// Dev flags
// ---------------------------------------------------------------------------

/**
 * TEMP (Alpha internal dev): bypass mission lock checks so all ATC Sim Missions
 * are accessible without completing Train prerequisites. Set to false before release.
 */
export const DEV_UNLOCK_ALL_MISSIONS = isAeroCommsDevelopmentOverrideEnabled();
export const AEROCOMMS_FREE_MISSION_ID = "cadet-first-contact";

// ---------------------------------------------------------------------------
// Skill type
// ---------------------------------------------------------------------------

/**
 * Aviation communication skill identifier.
 * Cadet-level skills are complete; SP+ are included as stubs for future mapping.
 */
export type AeroSkill =
  // Cadet — Foundations
  | "icao-alphabet"
  | "numbers"
  | "runway-numbers"
  | "callsigns"
  | "station-names"
  | "frequencies"
  | "basic-acknowledgements"
  | "clarification"
  | "correction"
  | "speak-slower"
  // Cadet — First Contact
  | "first-call-structure"
  | "radio-check"
  | "readability"
  | "atis"
  | "qnh"
  | "basic-requests"
  | "frequency-change"
  // Cadet — Operational
  | "taxi-clearance"
  | "hold-short"
  | "hold-position"
  | "ready-for-departure"
  | "line-up-and-wait"
  | "takeoff-clearance"
  | "report-final"
  | "landing-clearance"
  | "vacating-runway"
  | "taxi-to-stand"
  // Student Pilot (stub — mapped when SP content is stable)
  | "circuit-position-reports"
  | "traffic-sequencing"
  | "local-departure"
  | "surface-wind-readback"
  | "touch-and-go"
  | "joining-instructions"
  | "taxi-back-shutdown"
  // Ready For Radio (stub)
  | "frequency-handoff"
  | "squawk-assignment"
  | "enroute-position-reporting"
  | "controlled-airspace-transit"
  | "runway-change"
  | "unclear-instruction-recovery"
  // Airline Prep (stub)
  | "ifr-clearance"
  | "sid-readback"
  | "flight-level"
  | "push-and-start"
  | "busy-airport-taxi"
  | "departure-handover"
  | "star-arrival"
  | "approach-brief"
  | "radar-vectoring"
  // Advanced Ops (stub)
  | "weather-deviation-request"
  | "go-around-communication"
  | "pan-pan"
  | "mayday"
  | "lost-comms-radio-failure"
  | "high-workload-comms";

// ---------------------------------------------------------------------------
// TOPIC_SKILLS
// Maps topic ID → skills the topic teaches.
// Only Cadet is fully defined; higher levels will be added as content stabilises.
// Topic IDs use the slug convention from content.ts: `${moduleId}.${slug(topicName)}`
// ---------------------------------------------------------------------------

export const TOPIC_SKILLS: Readonly<Partial<Record<string, AeroSkill[]>>> = {
  // Radio Fundamentals
  "radio-fundamentals.icao-alphabet":            ["icao-alphabet"],
  "radio-fundamentals.numbers":                  ["numbers", "runway-numbers"],
  "radio-fundamentals.callsigns":                ["callsigns", "station-names"],
  "radio-fundamentals.frequencies":              ["frequencies"],
  "radio-fundamentals.basic-acknowledgements":   ["basic-acknowledgements"],
  "radio-fundamentals.clarification-correction": ["clarification", "correction", "speak-slower"],
  // First Contact
  "first-contact.the-4-ws":               ["first-call-structure"],
  "first-contact.radio-check-readability": ["radio-check", "readability"],
  "first-contact.basic-atis-qnh":          ["atis", "qnh"],
  "first-contact.basic-requests":          ["basic-requests"],
  "first-contact.frequency-changes":       ["frequency-change"],
  // Cadet Scenarios
  "cadet-scenarios.taxi-basics":      ["taxi-clearance", "hold-short", "hold-position"],
  "cadet-scenarios.departure-basics": ["ready-for-departure", "line-up-and-wait", "takeoff-clearance"],
  "cadet-scenarios.landing-basics":   ["report-final", "landing-clearance", "vacating-runway"],
  "cadet-scenarios.taxi-back-basics": ["taxi-to-stand"],
  // Note: cadet-listening, cadet-readbacks, cadet-phraseology reinforce existing
  // skills — they do not introduce new ones — so they are not in TOPIC_SKILLS.
};

// Derived at module load: skill → topic IDs that teach it (reverse of TOPIC_SKILLS).
const SKILL_SOURCE_TOPICS = new Map<AeroSkill, string[]>();
for (const [topicId, skills] of Object.entries(TOPIC_SKILLS)) {
  if (!skills) continue;
  for (const skill of skills) {
    const existing = SKILL_SOURCE_TOPICS.get(skill);
    if (existing) existing.push(topicId);
    else SKILL_SOURCE_TOPICS.set(skill, [topicId]);
  }
}

// ---------------------------------------------------------------------------
// TOPIC_REQUIREMENTS
// Maps topic ID → skills that must be learned before the topic is accessible.
// Empty array = open from day 1.
// ---------------------------------------------------------------------------

export const TOPIC_REQUIREMENTS: Readonly<Partial<Record<string, AeroSkill[]>>> = {
  // Radio Fundamentals — open chain (the first three have no prerequisites)
  "radio-fundamentals.icao-alphabet":            [],
  "radio-fundamentals.numbers":                  [],
  "radio-fundamentals.basic-acknowledgements":   [],
  "radio-fundamentals.callsigns":                ["icao-alphabet"],
  "radio-fundamentals.frequencies":              ["numbers"],
  "radio-fundamentals.clarification-correction": ["basic-acknowledgements"],
  // First Contact
  "first-contact.the-4-ws":               [],
  "first-contact.radio-check-readability": ["first-call-structure"],
  "first-contact.basic-atis-qnh":          ["numbers"],
  "first-contact.basic-requests":          ["first-call-structure", "atis", "qnh"],
  "first-contact.frequency-changes":       ["frequencies", "callsigns"],
  // Core Practice — Listening
  "cadet-listening.callsign-recognition":    ["callsigns"],
  "cadet-listening.frequency-recognition":   ["frequencies"],
  "cadet-listening.clearance-recognition":   ["taxi-clearance", "hold-short", "line-up-and-wait"],
  "cadet-listening.instruction-recognition": ["taxi-clearance", "basic-requests"],
  "cadet-listening.mixed-atc-listening":     ["taxi-clearance", "frequencies", "callsigns"],
  // Core Practice — Readbacks
  "cadet-readbacks.frequency-changes":   ["frequencies"],
  "cadet-readbacks.squawk-instructions": ["numbers"],
  "cadet-readbacks.heading-instructions":["numbers"],
  "cadet-readbacks.altitude-instructions":["numbers"],
  "cadet-readbacks.mixed-readbacks":     ["frequencies", "numbers", "basic-acknowledgements"],
  // Core Practice — Phraseology
  "cadet-phraseology.basic-radio-phrases":         ["basic-acknowledgements", "radio-check"],
  "cadet-phraseology.when-you-don-t-understand":   ["clarification", "correction"],
  "cadet-phraseology.reporting-frequency-phrases": ["frequency-change"],
  "cadet-phraseology.mixed-phraseology-challenge": ["frequency-change", "basic-acknowledgements"],
  // Scenarios
  "cadet-scenarios.taxi-basics":      ["basic-requests", "frequency-change"],
  "cadet-scenarios.departure-basics": ["taxi-clearance", "hold-short", "frequency-change"],
  "cadet-scenarios.landing-basics":   ["ready-for-departure", "takeoff-clearance"],
  "cadet-scenarios.taxi-back-basics": ["landing-clearance", "vacating-runway"],
};

// ---------------------------------------------------------------------------
// MISSION_REQS
// Maps ATC Sim mission ID → required topics + skills.
// Cadet missions are complete; SP+ have placeholder structure for future use.
// ---------------------------------------------------------------------------

export interface MissionRequirements {
  requiredTopics: string[];
  requiredSkills: AeroSkill[];
}

export const MISSION_REQS: Readonly<Record<string, MissionRequirements>> = {
  // ── Cadet (fully defined) ─────────────────────────────────────────────────
  "cadet-first-contact": {
    requiredTopics: ["first-contact.radio-check-readability"],
    requiredSkills: ["radio-check", "readability", "first-call-structure"],
  },
  "cadet-taxi-hold-short": {
    requiredTopics: ["cadet-scenarios.taxi-basics"],
    requiredSkills: ["taxi-clearance", "hold-short", "frequency-change"],
  },
  "cadet-basic-readback": {
    requiredTopics: ["cadet-readbacks.mixed-readbacks"],
    requiredSkills: ["frequencies", "numbers", "basic-acknowledgements"],
  },
  "cadet-departure-tower": {
    requiredTopics: ["cadet-scenarios.departure-basics"],
    requiredSkills: ["ready-for-departure", "line-up-and-wait", "takeoff-clearance"],
  },
  // ── Student Pilot (topics TBD when SP content is stable) ─────────────────
  "sp-local-departure": {
    requiredTopics: [],
    requiredSkills: ["local-departure", "surface-wind-readback"],
  },
  "sp-circuit-flow": {
    requiredTopics: [],
    requiredSkills: ["circuit-position-reports", "report-final"],
  },
  "sp-arrival-landing": {
    requiredTopics: [],
    requiredSkills: ["landing-clearance", "report-final", "joining-instructions"],
  },
  "sp-taxi-back-shutdown": {
    requiredTopics: [],
    requiredSkills: ["vacating-runway", "taxi-to-stand"],
  },
  // ── Ready For Radio ───────────────────────────────────────────────────────
  "rfr-busy-circuit-recovery": {
    requiredTopics: [],
    requiredSkills: ["circuit-position-reports", "traffic-sequencing"],
  },
  "rfr-frequency-handover": {
    requiredTopics: [],
    requiredSkills: ["frequency-handoff", "squawk-assignment", "enroute-position-reporting"],
  },
  "rfr-runway-change": {
    requiredTopics: [],
    requiredSkills: ["frequency-handoff", "controlled-airspace-transit"],
  },
  "rfr-unclear-recovery": {
    requiredTopics: [],
    requiredSkills: ["clarification", "correction", "unclear-instruction-recovery"],
  },
  // ── Airline Prep ──────────────────────────────────────────────────────────
  "ap-ifr-clearance": {
    requiredTopics: [],
    requiredSkills: ["ifr-clearance", "sid-readback", "flight-level"],
  },
  "ap-busy-taxi": {
    requiredTopics: [],
    requiredSkills: ["busy-airport-taxi", "hold-short"],
  },
  "ap-departure-handover": {
    requiredTopics: [],
    requiredSkills: ["departure-handover", "flight-level", "frequency-handoff"],
  },
  "ap-approach-brief": {
    requiredTopics: [],
    requiredSkills: ["radar-vectoring", "flight-level", "approach-brief"],
  },
  // ── Advanced Ops ──────────────────────────────────────────────────────────
  "ao-weather-deviation": {
    requiredTopics: [],
    requiredSkills: ["weather-deviation-request", "enroute-position-reporting"],
  },
  "ao-go-around": {
    requiredTopics: [],
    requiredSkills: ["go-around-communication", "high-workload-comms"],
  },
  "ao-pan-pan": {
    requiredTopics: [],
    requiredSkills: ["pan-pan", "high-workload-comms"],
  },
  "ao-lost-comms": {
    requiredTopics: [],
    requiredSkills: ["lost-comms-radio-failure", "high-workload-comms"],
  },
};

// ---------------------------------------------------------------------------
// Human-readable display names (used in reason strings shown in lock UI)
// ---------------------------------------------------------------------------

const TOPIC_DISPLAY_NAMES: Readonly<Partial<Record<string, string>>> = {
  "radio-fundamentals.icao-alphabet":            "ICAO Alphabet",
  "radio-fundamentals.numbers":                  "Numbers",
  "radio-fundamentals.callsigns":                "Callsigns",
  "radio-fundamentals.frequencies":              "Frequencies",
  "radio-fundamentals.basic-acknowledgements":   "Basic Acknowledgements",
  "radio-fundamentals.clarification-correction": "Clarification & Correction",
  "first-contact.the-4-ws":               "The 4 Ws",
  "first-contact.radio-check-readability": "Radio Check & Readability",
  "first-contact.basic-atis-qnh":          "Basic ATIS & QNH",
  "first-contact.basic-requests":          "Basic Requests",
  "first-contact.frequency-changes":       "Frequency Changes",
  "cadet-listening.callsign-recognition":  "Callsign Recognition",
  "cadet-listening.frequency-recognition": "Frequency Recognition",
  "cadet-listening.mixed-atc-listening":   "Mixed ATC Listening",
  "cadet-readbacks.mixed-readbacks":       "Mixed Readbacks",
  "cadet-scenarios.taxi-basics":      "Taxi Basics",
  "cadet-scenarios.departure-basics": "Departure Basics",
  "cadet-scenarios.landing-basics":   "Landing Basics",
  "cadet-scenarios.taxi-back-basics": "Taxi Back Basics",
};

function topicDisplayName(topicId: string): string {
  return (
    TOPIC_DISPLAY_NAMES[topicId] ??
    topicId.split(".").pop()?.replace(/-/g, " ") ??
    topicId
  );
}

/** Given missing skills, return the display names of the topics that teach them. */
function teachingTopicNamesFor(missingSkills: AeroSkill[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const skill of missingSkills) {
    for (const topicId of SKILL_SOURCE_TOPICS.get(skill) ?? []) {
      if (!seen.has(topicId)) {
        seen.add(topicId);
        names.push(topicDisplayName(topicId));
      }
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// UnlockState — return type for all unlock check functions
// ---------------------------------------------------------------------------

export interface UnlockState {
  /** True when all prerequisites are met (regardless of dev flags). */
  realUnlocked: boolean;
  /**
   * True when the item is accessible right now.
   * effectiveUnlocked = realUnlocked OR the relevant DEV flag is true.
   */
  effectiveUnlocked: boolean;
  /** True when realUnlocked is false — this item would be locked in production. */
  wouldBeLocked: boolean;
  /** Topic IDs whose completion is required but missing. */
  missingTopics: string[];
  /** Skill IDs required but not yet learned. */
  missingSkills: AeroSkill[];
  /** Human-readable reason shown in lock UI, e.g. "Complete Taxi Basics to unlock". */
  reason: string;
}

// ---------------------------------------------------------------------------
// Core derived-state functions
// All are pure functions over completedExercises[]. No side effects.
// ---------------------------------------------------------------------------

/**
 * Returns the set of completed topic IDs derived from completedExercises.
 * A topic is complete when topicCompletion() returns 100%.
 */
export function getCompletedTopics(completedExercises: string[]): Set<string> {
  const completedSet = new Set(completedExercises);
  const result = new Set<string>();
  for (const level of LEVELS) {
    for (const trainingModule of level.modules) {
      if (!trainingModule.topics) continue;
      for (const topic of trainingModule.topics) {
        if (topicCompletion(topic, completedSet) === 100) {
          result.add(topic.id);
        }
      }
    }
  }
  return result;
}

/**
 * Returns the set of learned skill IDs derived from completedExercises.
 * Derived via TOPIC_SKILLS — never stored in localStorage.
 */
export function getLearnedSkills(completedExercises: string[]): Set<AeroSkill> {
  const completedTopics = getCompletedTopics(completedExercises);
  const result = new Set<AeroSkill>();
  for (const topicId of completedTopics) {
    const skills = TOPIC_SKILLS[topicId];
    if (skills) {
      for (const skill of skills) result.add(skill);
    }
  }
  return result;
}

/**
 * Returns the unlock state for a Train topic.
 * effectiveUnlocked respects DEV_UNLOCK_ALL_TRAIN so Train always stays open in dev.
 * Topics with no entry in TOPIC_REQUIREMENTS are treated as open (no prerequisites).
 */
export function getTopicUnlockState(
  topicId: string,
  completedExercises: string[],
): UnlockState {
  const requirements = TOPIC_REQUIREMENTS[topicId] ?? [];
  const learnedSkills = getLearnedSkills(completedExercises);
  const missingSkills = requirements.filter((s) => !learnedSkills.has(s));
  const realUnlocked = missingSkills.length === 0;
  const effectiveUnlocked = DEV_UNLOCK_ALL_TRAIN || realUnlocked;
  const wouldBeLocked = !realUnlocked;
  const reason = wouldBeLocked
    ? (() => {
        const teachers = teachingTopicNamesFor(missingSkills);
        return teachers.length > 0
          ? `Complete ${teachers.join(", ")} to unlock`
          : `Requires: ${missingSkills.join(", ")}`;
      })()
    : "";
  return {
    realUnlocked,
    effectiveUnlocked,
    wouldBeLocked,
    missingTopics: [],
    missingSkills,
    reason,
  };
}

/**
 * Returns the unlock state for an ATC Sim Guided Mission.
 * effectiveUnlocked respects DEV_UNLOCK_ALL_MISSIONS so missions stay open in dev.
 *
 * @param legacyLocked - Fallback from the mission data (`m.locked`). Used only when the
 *   mission has no entry in MISSION_REQS (i.e. no requirements have been authored yet).
 *   Once a mission is added to MISSION_REQS, legacyLocked is ignored.
 */
export function getMissionUnlockState(
  missionId: string,
  completedExercises: string[],
  legacyLocked = false,
  isPro = false,
  developmentOverride = isAeroCommsDevelopmentOverrideEnabled(),
): UnlockState {
  const isFreeMission = missionId === AEROCOMMS_FREE_MISSION_ID;
  const reqs = MISSION_REQS[missionId];
  if (!reqs) {
    // No requirements defined. Fall back to the legacy locked field from mission data.
    const realUnlocked = !legacyLocked;
    const effectiveUnlocked = developmentOverride || (isPro && realUnlocked);
    return {
      realUnlocked,
      effectiveUnlocked,
      wouldBeLocked: !effectiveUnlocked,
      missingTopics: [],
      missingSkills: [],
      reason: legacyLocked ? "Mission not yet available" : isPro ? "" : "AeroComms Pro required",
    };
  }

  const completedTopics = getCompletedTopics(completedExercises);
  const learnedSkills = getLearnedSkills(completedExercises);

  const missingTopics = reqs.requiredTopics.filter((t) => !completedTopics.has(t));
  const missingSkills = reqs.requiredSkills.filter((s) => !learnedSkills.has(s));
  const realUnlocked = isFreeMission || (missingTopics.length === 0 && missingSkills.length === 0);
  const effectiveUnlocked = developmentOverride || (isFreeMission ? realUnlocked : isPro && realUnlocked);
  const wouldBeLocked = !effectiveUnlocked;

  const reason = wouldBeLocked
    ? (() => {
        if (!isFreeMission && !isPro) return "AeroComms Pro required";
        if (missingTopics.length > 0) {
          return `Complete ${missingTopics.map(topicDisplayName).join(", ")} to unlock`;
        }
        if (missingSkills.length > 0) {
          const teachers = teachingTopicNamesFor(missingSkills);
          return teachers.length > 0
            ? `Complete ${teachers.join(", ")} to unlock`
            : `Requires: ${missingSkills.join(", ")}`;
        }
        return "";
      })()
    : "";

  return {
    realUnlocked,
    effectiveUnlocked,
    wouldBeLocked,
    missingTopics,
    missingSkills,
    reason,
  };
}

/**
 * Returns the human-readable missing requirements string for a topic or mission.
 * Returns "" when already unlocked.
 */
export function getMissingRequirements(
  id: string,
  completedExercises: string[],
): string {
  if (id in MISSION_REQS) {
    return getMissionUnlockState(id, completedExercises).reason;
  }
  return getTopicUnlockState(id, completedExercises).reason;
}

/**
 * Returns the list of mission IDs whose effectiveUnlocked is true.
 * In dev mode (DEV_UNLOCK_ALL_MISSIONS = true) this returns all defined missions.
 */
export function getUnlockedMissions(completedExercises: string[], isPro = false): string[] {
  return Object.keys(MISSION_REQS).filter(
    (id) => getMissionUnlockState(id, completedExercises, false, isPro).effectiveUnlocked,
  );
}

/**
 * Returns the list of mission IDs that are pedagogically unlocked — i.e. the
 * user has genuinely met all required topics and skills in MISSION_REQS.
 *
 * Unlike getUnlockedMissions, this deliberately ignores DEV_UNLOCK_ALL_MISSIONS
 * so that Today recommendations reflect actual learning progress, not the dev
 * bypass. ATC Sim can still use getUnlockedMissions for full dev access.
 */
export function getPedagogicallyUnlockedMissions(completedExercises: string[]): string[] {
  return Object.keys(MISSION_REQS).filter(
    (id) => getMissionUnlockState(id, completedExercises).realUnlocked,
  );
}
