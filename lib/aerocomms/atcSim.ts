/**
 * AeroComms — ATC Sim Alpha data layer.
 *
 * Templated / mocked radio sessions for Guided Missions.
 * No real AI. Mission steps/context are static template data carried between screens
 * through sessionStorage. ATC voice (v3): both autoplay and manual Replay use backend
 * OpenAI TTS. Autoplay plays on a gesture-unlocked persistent audio element (see
 * missionAudio.ts) so it isn't blocked by the browser's autoplay policy; manual
 * Replay/Play uses voiceProvider (with automatic browser-speechSynthesis fallback,
 * acceptable only for that explicit user tap). See the TTS v3 section below. Pilot
 * turns use real server STT (VoiceRecorder) — buildResult() below scores the actual
 * detected transcripts against each step's expected read-back.
 */

import { evaluatePhraseAnswer, expandRegistrationCallsigns } from "./voice/evaluation";
import {
  isMissionAudioUnlocked,
  markMissionLatencyOrigin,
  playMissionAudio,
  stopMissionAudio,
  unlockMissionAudio,
  type MissionAudioOutcome,
} from "./voice/missionAudio";
import { deriveConceptItems, findMissingConceptItems, type ConceptId, type ConceptItem } from "./voice/missionConcepts";
import { speak as speakWithProvider, stopSpeaking as stopProviderSpeech } from "./voice/voiceProvider";

export type { ConceptId, ConceptItem, StepKind } from "./voice/missionConcepts";
export { markMissionLatencyOrigin };

export type AtcSpeaker = "atc" | "pilot";

export type AtcStep = {
  id: string;
  speaker: AtcSpeaker;
  /** Display text shown in the conversation bubble / transcript. */
  text: string;
  /** Phonetic text fed to TTS for ATC transmissions. */
  spoken?: string;
  /** Expected pilot read-back (display) for pilot turns. */
  expected?: string;
  /** Phonetic version of the expected read-back. */
  expectedSpoken?: string;
  /**
   * Optional guidance hint shown in Zone C (mic dock) when this pilot step is active.
   * Only set when the next action is not obvious from the preceding ATC message.
   * Explains operational intent — does NOT always give the full phrase.
   */
  hint?: string;
  /**
   * Pilot-step-only (v4 generic mission evaluator). Concepts (see ConceptItem in
   * missionConcepts.ts) the pilot's transcript MUST include before the step is
   * accepted — e.g. callsign, request/intent, ATIS information code, runway. If any
   * is missing, the step does not advance: a corrective ATC line is shown instead
   * (see buildCorrectiveAtcResponse) and the pilot can answer again on the same step
   * (see RadioConversation.commitPilot). Hand-author this for extra precision/custom
   * correction prompts; if left unset, getEffectivePilotStepItems() below derives a
   * reasonable default from `expected` automatically (see missionConcepts.ts's
   * deriveConceptItems) — every pilot step across every mission gets SOME gating.
   */
  requiredItems?: ConceptItem[];
  /**
   * Pilot-step-only (v4). Concepts that improve realism/completeness but do NOT block
   * advancement if missing — a miss here reduces the step's score in buildResult()
   * instead of triggering a retry. Same derive-if-unset behavior as requiredItems.
   */
  softItems?: ConceptItem[];
  /**
   * Optional hand-authored ATC corrective lines cycled through by retry attempt
   * (index 0 for the first miss, index 1+ for repeated misses — last entry repeats).
   * If unset, a generic corrective line is generated from the specific missing
   * item(s) (see buildCorrectiveAtcResponse), which is usually clearer since it names
   * exactly what's missing — this is mainly for steps that want a specific scripted
   * ATC phrasing instead.
   */
  correctionPrompts?: string[];
  /**
   * After this many failed attempts on this step, an explicit on-screen hint naming
   * the missing item(s) is shown (in addition to the spoken corrective line already
   * played on every failed attempt). Defaults to 2 if unset.
   */
  maxRetriesBeforeHint?: number;
};

export type AtcLevelId = "cadet" | "student-pilot" | "rfr" | "airline-prep" | "advanced-ops";

export type AtcConfig = {
  airport: string;
  phase: string;
  difficulty: string;
  traffic: string;
  weather: string;
  voice: string;
};

export type AtcSessionSource = "mission";

/** Pending session descriptor stored before the conversation starts. */
export type AtcSessionDescriptor = {
  source: AtcSessionSource;
  title: string;
  phaseBadge: string;
  config: AtcConfig;
  steps: AtcStep[];
  missionId?: string;
  level?: AtcLevelId;
};

export type TranscriptTurn = {
  speaker: AtcSpeaker;
  text: string;
  /** mm:ss timestamp. */
  time: string;
  /**
   * Phonetic text for ATC turns (mirrors AtcStep.spoken) — used for the transcript
   * bubble's Replay button so a dynamically-generated corrective line (which has no
   * matching AtcStep to look up) still replays with correct callsign pronunciation
   * instead of falling back to the raw display text.
   */
  spoken?: string;
  /**
   * True for a pilot attempt that was missing required items (or unrelated) and its
   * corrective ATC reply (v4 retry/reconduct flow — see AtcStep.requiredItems). Kept
   * in the full transcript shown on the debrief/transcript screen for a realistic
   * back-and-forth, but excluded from buildResult()'s per-step content scoring so a
   * corrected step still counts as exactly one logical step — retries instead reduce
   * that step's score as attempts/penalties (see buildResult). Absent/false for every
   * normal turn.
   */
  isRetry?: boolean;
  /**
   * Why a retry pilot turn was rejected — "missing-items" (on-topic but missing a
   * required concept) vs "unrelated" (transcript didn't relate to the expected
   * readback at all). Only set when isRetry is true on a pilot turn; drives both the
   * corrective ATC wording (say-again vs "confirm X") and a stronger scoring penalty
   * for unrelated answers. Undefined for non-retry turns.
   */
  retryReason?: "missing-items" | "unrelated";
};

export type AtcBreakdown = {
  readbacks: number;
  phraseology: number;
  accuracy: number;
  situational: number;
  timing: number;
};

/** Completed-session result stored for the Complete + Transcript screens. */
export type AtcSessionResult = {
  title: string;
  source: AtcSessionSource;
  missionId?: string;
  level?: AtcLevelId;
  score: number;
  stars: number;
  label: string;
  breakdown: AtcBreakdown;
  wentWell: string[];
  transcript: TranscriptTurn[];
  durationSec: number;
};

/* ------------------------------------------------------------------ */
/* Level metadata                                                      */
/* ------------------------------------------------------------------ */

export type LevelMeta = {
  id: AtcLevelId;
  short: string;
  label: string;
  /** Tailwind hex accent for badges / glows. */
  accent: string;
};

export const LEVELS: Record<AtcLevelId, LevelMeta> = {
  cadet: { id: "cadet", short: "Cadet", label: "Cadet", accent: "#FACC15" },
  "student-pilot": { id: "student-pilot", short: "Student Pilot", label: "Student Pilot", accent: "#3B82F6" },
  rfr: { id: "rfr", short: "RFR", label: "Ready For Radio", accent: "#A855F7" },
  "airline-prep": { id: "airline-prep", short: "Airline Prep", label: "Airline Prep", accent: "#D4A24E" },
  "advanced-ops": { id: "advanced-ops", short: "Advanced Ops", label: "Advanced Ops", accent: "#EF4444" },
};

export const LEVEL_ORDER: AtcLevelId[] = ["cadet", "student-pilot", "rfr", "airline-prep", "advanced-ops"];

/** Alpha: one shared mission visual per level (individual imageKey reserved for future use). */
export const MISSION_LEVEL_IMAGES: Readonly<Record<AtcLevelId, string>> = {
  cadet: "/images/aerocomms/cadetmission.png",
  "student-pilot": "/images/aerocomms/studentmission.png",
  rfr: "/images/aerocomms/readymission.png",
  "airline-prep": "/images/aerocomms/airmission.png",
  "advanced-ops": "/images/aerocomms/opsmission.png",
};

export function getMissionLevelImage(level: AtcLevelId): string {
  return MISSION_LEVEL_IMAGES[level];
}

/* ------------------------------------------------------------------ */
/* Guided Missions catalog                                             */
/* ------------------------------------------------------------------ */

/** Operational context shown in Mission Detail briefing and Radio Conversation strip. */
export type MissionContext = {
  callsign: string;
  aircraft?: string;
  location: string;
  station: string;
  frequency?: string;
  initialTask: string;
  /**
   * Information the user already has before the first call (ATIS collected, QNH known, etc.).
   * Shown in the in-mission context card at the top of the conversation zone.
   */
  whatYouKnow?: string[];
  /**
   * Information the user does NOT have yet and must request from ATC.
   * Shown in the in-mission context card to set expectations.
   */
  whatYouNeed?: string[];
};

export type AtcMission = {
  id: string;
  title: string;
  /** Short tagline shown below title in card and detail view. */
  subtitle?: string;
  level: AtcLevelId;
  difficulty: string;
  duration: string;
  description: string;
  bullets: string[];
  locked: boolean;
  completed: boolean;
  stars: number;
  phaseBadge: string;
  steps: AtcStep[];
  /** Key for future per-mission image mapping (Alpha uses level images via getMissionLevelImage). */
  imageKey?: string;
  /** Operational context shown in Mission Detail and Radio Conversation briefing strip. */
  context?: MissionContext;
};

const mission = (m: AtcMission): AtcMission => m;

export const MISSIONS: AtcMission[] = [

  /* ─────────────────── CADET (3) ─────────────────── */

  mission({
    id: "cadet-first-contact",
    title: "Ground Operations",
    subtitle: "Cold start to holding point",
    level: "cadet",
    difficulty: "Easy",
    duration: "8–12 min",
    description: "Make your first call and radio check, request start-up, then taxi to the holding point and hold short before contacting Tower.",
    bullets: ["Initial call & radio check", "Start-up request & read-back", "Taxi clearance read-back", "Hold short & frequency change"],
    locked: false,
    completed: true,
    stars: 3,
    phaseBadge: "GROUND",
    imageKey: "cadet-first-contact",
    context: { callsign: "G-ABCD", aircraft: "Cessna 172", location: "Brindale Apron, Stand 5", station: "Brindale Ground", frequency: "121.705", initialTask: "From first call and radio check through start-up and taxi to the holding point", whatYouKnow: ["Information Alpha collected — ATIS current", "QNH 1013", "Runway 27 in use", "You are at Stand 5, Brindale Apron"], whatYouNeed: ["Start-up approval (from Ground)", "Taxi clearance and route to the holding point"] },
    steps: [
      { id: "go-1", speaker: "pilot", text: "Brindale Ground, G-ABCD, radio check 121.705.", expected: "Brindale Ground, G-ABCD, radio check.", expectedSpoken: "Brindale Ground, Golf Alfa Bravo Charlie Delta, radio check.", hint: "First: open the channel. Make your radio check — include your callsign and the frequency you are calling on." },
      { id: "go-2", speaker: "atc", text: "G-ABCD, Brindale Ground, readability five.", spoken: "Golf Alfa Bravo Charlie Delta, Brindale Ground, readability fife." },
      { id: "go-3", speaker: "pilot", text: "Readability five, G-ABCD.", expected: "Readability five, G-ABCD.", expectedSpoken: "Readability fife, Golf Alfa Bravo Charlie Delta." },
      { id: "go-4", speaker: "atc", text: "G-ABCD, pass your message.", spoken: "Golf Alfa Bravo Charlie Delta, pass your message." },
      {
        id: "go-5",
        speaker: "pilot",
        text: "G-ABCD, request start-up, information Alpha, QNH 1013.",
        expected: "G-ABCD, request start-up, information Alpha, QNH 1013.",
        expectedSpoken: "Golf Alfa Bravo Charlie Delta, request start-up, information Alpha, Q N H one zero one tree.",
        hint: "ATC wants your message. Request start-up — include your ATIS letter and QNH.",
        // Flagship "startup request" example (v4 generic evaluator — Part B). Previously
        // this step advanced to the scripted "information Alpha correct" ATC line even
        // if the pilot never said it. Now all required items below must be present or
        // ATC asks for what's missing instead (see buildCorrectiveAtcResponse).
        requiredItems: [
          { id: "callsign", concept: "callsign", label: "your callsign", expectedValue: "G-ABCD" },
          {
            id: "startup-intent",
            concept: "request-intent",
            label: "your start-up request",
            // Broad variant list covers real-world STT variation: "startup" one word vs
            // two ("start up"), "ready for startup", and common Safari STT mishearings of
            // "request" ("quest startup", "test startup"). The word "startup" alone (without
            // any "request" prefix) is sufficient to express startup intent — ICAO phrasing
            // is important but startup intent itself is unambiguous from the word "startup".
            variants: [
              "request start up", "request startup",
              "requesting start up", "requesting startup",
              "start up", "startup",
              "ready for start up", "ready for startup",
              "quest startup", "quest start up",
              "test startup", "test start up",
              "start up please", "startup please",
            ],
          },
          { id: "atis-info", concept: "atis-info", label: "Information Alpha", expectedValue: "Alpha" },
        ],
        softItems: [{ id: "qnh", concept: "qnh", label: "QNH readback", expectedValue: "1013" }],
      },
      { id: "go-6", speaker: "atc", text: "G-ABCD, information Alpha correct, QNH 1013, start-up approved.", spoken: "Golf Alfa Bravo Charlie Delta, information Alpha correct, Q N H one zero one tree, start-up approved." },
      { id: "go-7", speaker: "pilot", text: "Information Alpha, QNH 1013, start-up approved, G-ABCD.", expected: "Information Alpha, QNH 1013, start-up approved, G-ABCD.", expectedSpoken: "Information Alpha, Q N H one zero one tree, start-up approved, Golf Alfa Bravo Charlie Delta." },
      { id: "go-8", speaker: "pilot", text: "Brindale Ground, G-ABCD, request taxi, runway 27.", expected: "G-ABCD, request taxi.", expectedSpoken: "Golf Alfa Bravo Charlie Delta, request taxi.", hint: "Start-up is complete. Now request taxi — include your callsign and the runway." },
      { id: "go-9", speaker: "atc", text: "G-ABCD, taxi to holding point Alpha via taxiway Bravo, QNH 1013.", spoken: "Golf Alfa Bravo Charlie Delta, taxi to holding point Alpha via taxiway Bravo, Q N H one zero one tree." },
      { id: "go-10", speaker: "pilot", text: "Taxi to holding point Alpha via Bravo, QNH 1013, G-ABCD.", expected: "Taxi to holding point Alpha via Bravo, QNH 1013, G-ABCD.", expectedSpoken: "Taxi to holding point Alpha via Bravo, Q N H one zero one tree, Golf Alfa Bravo Charlie Delta." },
      { id: "go-11", speaker: "atc", text: "G-ABCD, hold short of runway 27.", spoken: "Golf Alfa Bravo Charlie Delta, hold short of runway two seven." },
      { id: "go-12", speaker: "pilot", text: "Hold short of runway 27, G-ABCD.", expected: "Hold short of runway 27, G-ABCD.", expectedSpoken: "Hold short of runway two seven, Golf Alfa Bravo Charlie Delta." },
      { id: "go-13", speaker: "atc", text: "G-ABCD, contact Tower 118.100.", spoken: "Golf Alfa Bravo Charlie Delta, contact Tower one one eight decimal one." },
      {
        id: "go-14",
        speaker: "pilot",
        text: "Contact Tower 118.100, G-ABCD.",
        expected: "Contact Tower 118.100, G-ABCD.",
        expectedSpoken: "Contact Tower one one eight decimal one, Golf Alfa Bravo Charlie Delta.",
        // Flagship "frequency change" example (Part B).
        requiredItems: [
          { id: "callsign", concept: "callsign", label: "your callsign", expectedValue: "G-ABCD" },
          { id: "frequency", concept: "frequency", label: "the new frequency", expectedValue: "118.100" },
        ],
        softItems: [{ id: "changing-to", concept: "frequency", label: "acknowledging the frequency change", variants: ["contact", "changing to"] }],
      },
    ],
  }),

  mission({
    id: "cadet-departure-tower",
    title: "First Departure",
    subtitle: "Ready to airborne, with your first read-backs",
    level: "cadet",
    difficulty: "Normal",
    duration: "8–12 min",
    description: "Report ready, line up and depart, change to Radar, then handle your first airborne read-backs: squawk, QNH, heading and altitude.",
    bullets: ["Ready & line-up", "Takeoff clearance read-back", "Departure frequency change", "Squawk, QNH, heading & altitude read-backs"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "TOWER",
    imageKey: "cadet-departure-tower",
    context: { callsign: "G-LOFT", aircraft: "Cessna 152", location: "Holding point Alpha, runway 22", station: "Stapleford Tower", frequency: "122.805", initialTask: "Report ready, depart, and handle your first airborne read-backs with Radar", whatYouKnow: ["You are at holding point Alpha, runway 22", "Stapleford Tower: 122.805", "Stansted Radar will be your next frequency"], whatYouNeed: ["Line-up and takeoff clearance (from Tower)", "Radar frequency + squawk, QNH, heading and altitude (from Stansted Radar)"] },
    steps: [
      { id: "fd-1", speaker: "pilot", text: "Stapleford Tower, G-LOFT, holding point Alpha, runway 22, ready for departure.", expected: "Stapleford Tower, G-LOFT, holding point Alpha, runway 22, ready for departure.", expectedSpoken: "Stapleford Tower, Golf Lima Oscar Foxtrot Tango, holding point Alpha, runway two two, ready for departure.", hint: "Report ready. Include your callsign, current position, runway, and that you are ready for departure." },
      { id: "fd-2", speaker: "atc", text: "G-LOFT, line up runway 22 and wait.", spoken: "Golf Lima Oscar Foxtrot Tango, line up runway two two and wait." },
      {
        id: "fd-3",
        speaker: "pilot",
        text: "Line up runway 22 and wait, G-LOFT.",
        expected: "Line up runway 22 and wait, G-LOFT.",
        expectedSpoken: "Line up runway two two and wait, Golf Lima Oscar Foxtrot Tango.",
        // Flagship "line up" example (Part B).
        requiredItems: [
          { id: "callsign", concept: "callsign", label: "your callsign", expectedValue: "G-LOFT" },
          { id: "lineup-ack", concept: "instruction-ack", label: "line up acknowledgement", variants: ["line up", "lined up"] },
          { id: "runway", concept: "runway", label: "the runway", expectedValue: "22" },
        ],
        softItems: [{ id: "lineup-exact", concept: "instruction-ack", label: '"line up and wait" phrasing', variants: ["line up and wait"] }],
      },
      { id: "fd-4", speaker: "atc", text: "G-LOFT, surface wind 220 degrees 8 knots, runway 22 cleared for takeoff.", spoken: "Golf Lima Oscar Foxtrot Tango, surface wind two two zero degrees eight knots, runway two two cleared for takeoff." },
      {
        id: "fd-5",
        speaker: "pilot",
        text: "Cleared for takeoff runway 22, G-LOFT.",
        expected: "Cleared for takeoff runway 22, G-LOFT.",
        expectedSpoken: "Cleared for takeoff runway two two, Golf Lima Oscar Foxtrot Tango.",
        // Flagship "takeoff clearance" example (Part B).
        requiredItems: [
          { id: "callsign", concept: "callsign", label: "your callsign", expectedValue: "G-LOFT" },
          {
            id: "takeoff-clearance",
            concept: "clearance-readback",
            label: "takeoff clearance readback",
            variants: ["cleared for takeoff", "cleared take off"],
          },
          { id: "runway", concept: "runway", label: "the runway", expectedValue: "22" },
        ],
      },
      { id: "fd-6", speaker: "atc", text: "G-LOFT, contact Stansted Radar 123.800, good day.", spoken: "Golf Lima Oscar Foxtrot Tango, contact Stansted Radar one two tree decimal eight, good day." },
      { id: "fd-7", speaker: "pilot", text: "Contact Stansted Radar 123.800, good day, G-LOFT.", expected: "Contact 123.800, G-LOFT.", expectedSpoken: "Contact one two tree decimal eight, Golf Lima Oscar Foxtrot Tango." },
      { id: "fd-8", speaker: "pilot", text: "Stansted Radar, G-LOFT, passing 1000 feet, climbing 3000 feet.", expected: "Stansted Radar, G-LOFT.", expectedSpoken: "Stansted Radar, Golf Lima Oscar Foxtrot Tango.", hint: "You're on the new frequency. Check in with Radar — report airborne, your passing altitude, and your cleared climbing altitude." },
      { id: "fd-9", speaker: "atc", text: "G-LOFT, Stansted Radar, identified, squawk 4271.", spoken: "Golf Lima Oscar Foxtrot Tango, Stansted Radar, identified, squawk four two seven one." },
      { id: "fd-10", speaker: "pilot", text: "Squawk 4271, G-LOFT.", expected: "Squawk 4271, G-LOFT.", expectedSpoken: "Squawk four two seven one, Golf Lima Oscar Foxtrot Tango." },
      { id: "fd-11", speaker: "atc", text: "G-LOFT, QNH 1009.", spoken: "Golf Lima Oscar Foxtrot Tango, Q N H one zero zero niner." },
      { id: "fd-12", speaker: "pilot", text: "QNH 1009, G-LOFT.", expected: "QNH 1009, G-LOFT.", expectedSpoken: "Q N H one zero zero niner, Golf Lima Oscar Foxtrot Tango." },
      { id: "fd-13", speaker: "atc", text: "G-LOFT, turn right heading 270.", spoken: "Golf Lima Oscar Foxtrot Tango, turn right heading two seven zero." },
      { id: "fd-14", speaker: "pilot", text: "Turn right heading 270, G-LOFT.", expected: "Turn right heading 270, G-LOFT.", expectedSpoken: "Turn right heading two seven zero, Golf Lima Oscar Foxtrot Tango." },
      { id: "fd-15", speaker: "atc", text: "G-LOFT, climb altitude 4000 feet.", spoken: "Golf Lima Oscar Foxtrot Tango, climb altitude four thousand feet." },
      { id: "fd-16", speaker: "pilot", text: "Climb altitude 4000 feet, G-LOFT.", expected: "Climb altitude 4000 feet, G-LOFT.", expectedSpoken: "Climb altitude four thousand feet, Golf Lima Oscar Foxtrot Tango." },
    ],
  }),

  mission({
    id: "cadet-first-arrival",
    title: "First Arrival",
    subtitle: "Inbound, join, land and vacate",
    level: "cadet",
    difficulty: "Normal",
    duration: "8–10 min",
    description: "Make your inbound call, read back the joining instruction, report final, land and vacate the runway.",
    bullets: ["Inbound call", "Joining instruction read-back", "Report final", "Landing clearance & vacate"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "ARRIVAL",
    imageKey: "cadet-first-arrival",
    context: { callsign: "G-CMSA", aircraft: "Cessna 172", location: "5 miles south of Compton", station: "Compton Tower", frequency: "118.450", initialTask: "Join, report final, land and vacate the runway", whatYouKnow: ["You are 5 miles south of Compton", "Information Bravo collected", "Compton Tower: 118.450"], whatYouNeed: ["Joining instructions and QNH (from Tower)", "Landing clearance (from Tower)", "Vacate direction and Ground frequency (from Tower)"] },
    steps: [
      { id: "fa-1", speaker: "pilot", text: "Compton Tower, G-CMSA, 5 miles south, inbound, information Bravo.", expected: "Compton Tower, G-CMSA, 5 miles south, inbound to land, information Bravo.", expectedSpoken: "Compton Tower, Golf Charlie Mike Sierra Alfa, fife miles south, inbound to land, information Bravo.", hint: "Make your inbound call — include your callsign, distance and direction from the field, intention to land, and ATIS letter." },
      { id: "fa-2", speaker: "atc", text: "G-CMSA, join right base runway 24, QNH 1014.", spoken: "Golf Charlie Mike Sierra Alfa, join right base runway two four, Q N H one zero one four." },
      { id: "fa-3", speaker: "pilot", text: "Join right base runway 24, QNH 1014, G-CMSA.", expected: "Join right base runway 24, QNH 1014, G-CMSA.", expectedSpoken: "Join right base runway two four, Q N H one zero one four, Golf Charlie Mike Sierra Alfa." },
      { id: "fa-4", speaker: "atc", text: "G-CMSA, report final runway 24.", spoken: "Golf Charlie Mike Sierra Alfa, report final runway two four." },
      { id: "fa-5", speaker: "pilot", text: "Report final runway 24, G-CMSA.", expected: "Wilco, G-CMSA.", expectedSpoken: "Wilco, Golf Charlie Mike Sierra Alfa." },
      { id: "fa-6", speaker: "pilot", text: "G-CMSA, final runway 24.", expected: "G-CMSA, final runway 24.", expectedSpoken: "Golf Charlie Mike Sierra Alfa, final runway two four.", hint: "You've acknowledged the \"report final\" instruction. Now self-report when you are established on final — don't wait for ATC to prompt you again." },
      { id: "fa-7", speaker: "atc", text: "G-CMSA, surface wind 240 degrees 6 knots, runway 24 cleared to land.", spoken: "Golf Charlie Mike Sierra Alfa, surface wind two four zero degrees six knots, runway two four cleared to land." },
      {
        id: "fa-8",
        speaker: "pilot",
        text: "Cleared to land runway 24, G-CMSA.",
        expected: "Cleared to land runway 24, G-CMSA.",
        expectedSpoken: "Cleared to land runway two four, Golf Charlie Mike Sierra Alfa.",
        // Flagship "landing clearance" example (Part B).
        requiredItems: [
          { id: "callsign", concept: "callsign", label: "your callsign", expectedValue: "G-CMSA" },
          {
            id: "landing-clearance",
            concept: "clearance-readback",
            label: "landing clearance readback",
            variants: ["cleared to land", "cleared land"],
          },
          { id: "runway", concept: "runway", label: "the runway", expectedValue: "24" },
        ],
      },
      { id: "fa-9", speaker: "atc", text: "G-CMSA, vacate left when able, contact Ground 121.800.", spoken: "Golf Charlie Mike Sierra Alfa, vacate left when able, contact Ground one two one decimal eight." },
      { id: "fa-10", speaker: "pilot", text: "Vacate left, contact Ground 121.800, G-CMSA.", expected: "Vacate left, contact Ground 121.800, G-CMSA.", expectedSpoken: "Vacate left, contact Ground one two one decimal eight, Golf Charlie Mike Sierra Alfa." },
    ],
  }),

  /* ─────────────────── STUDENT PILOT (2) ─────────────────── */

  mission({
    id: "sp-local-departure",
    title: "Local VFR Flight",
    subtitle: "Depart, fly the circuit and touch-and-go",
    level: "student-pilot",
    difficulty: "Normal",
    duration: "10–14 min",
    description: "Taxi and depart on a local VFR flight, then fly the circuit with position reports and sequencing to a touch-and-go.",
    bullets: ["Local departure & taxi", "Takeoff clearance", "Circuit position reports", "Sequencing & touch-and-go"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "DEPARTURE",
    imageKey: "sp-local-departure",
    context: { callsign: "EI-DOC", aircraft: "Cessna 172", location: "Weston Apron", station: "Weston Tower", frequency: "122.500", initialTask: "Depart on a local VFR flight, fly the circuit and complete a touch-and-go", whatYouKnow: ["Information Alpha collected — ATIS current", "QNH 1015", "Runway 25 in use", "You are at Weston Apron"], whatYouNeed: ["Taxi clearance and route (from Ground)", "Takeoff clearance and circuit instructions (from Tower)", "Touch-and-go clearance (from Tower)"] },
    steps: [
      { id: "lv-1", speaker: "pilot", text: "Weston Ground, EI-DOC, request taxi, information Alpha.", expected: "Weston Ground, EI-DOC, request taxi for local flight, information Alpha.", expectedSpoken: "Weston Ground, Echo India Delta Oscar Charlie, request taxi for local flight, information Alpha.", hint: "Request taxi for a local VFR flight. Include your callsign and ATIS letter." },
      { id: "lv-2", speaker: "atc", text: "EI-DOC, taxi to holding point Alpha via taxiway Bravo, QNH 1015, runway 25.", spoken: "Echo India Delta Oscar Charlie, taxi to holding point Alpha via taxiway Bravo, Q N H one zero one fife, runway two fife." },
      {
        id: "lv-3",
        speaker: "pilot",
        text: "Taxi to holding point Alpha via Bravo, QNH 1015, EI-DOC.",
        expected: "Taxi to holding point Alpha via Bravo, QNH 1015, runway 25, EI-DOC.",
        expectedSpoken: "Taxi to holding point Alpha via Bravo, Q N H one zero one fife, runway two fife, Echo India Delta Oscar Charlie.",
        // Flagship "taxi clearance readback" example (Part B).
        requiredItems: [
          { id: "callsign", concept: "callsign", label: "your callsign", expectedValue: "EI-DOC" },
          {
            id: "taxi-readback",
            concept: "clearance-readback",
            label: "your taxi clearance readback",
            variants: ["taxi to holding point", "taxi to holding"],
          },
          { id: "holding-point", concept: "holding-point", label: "the holding point", expectedValue: "Alpha" },
          { id: "runway", concept: "runway", label: "the runway", expectedValue: "25" },
          { id: "route", concept: "taxi-route", label: "the taxiway route", variants: ["via bravo", "via taxiway bravo"] },
        ],
        softItems: [{ id: "qnh", concept: "qnh", label: "QNH readback", expectedValue: "1015" }],
      },
      { id: "lv-4", speaker: "atc", text: "EI-DOC, line up runway 25 and wait.", spoken: "Echo India Delta Oscar Charlie, line up runway two fife and wait." },
      { id: "lv-5", speaker: "pilot", text: "Line up runway 25 and wait, EI-DOC.", expected: "Line up and wait runway 25, EI-DOC.", expectedSpoken: "Line up and wait runway two fife, Echo India Delta Oscar Charlie." },
      { id: "lv-6", speaker: "atc", text: "EI-DOC, surface wind 250 degrees 8 knots, runway 25 cleared for takeoff.", spoken: "Echo India Delta Oscar Charlie, surface wind two fife zero degrees eight knots, runway two fife cleared for takeoff." },
      { id: "lv-7", speaker: "pilot", text: "Cleared for takeoff runway 25, EI-DOC.", expected: "Cleared for takeoff runway 25, EI-DOC.", expectedSpoken: "Cleared for takeoff runway two fife, Echo India Delta Oscar Charlie." },
      { id: "lv-8", speaker: "atc", text: "EI-DOC, make left-hand circuits, report downwind.", spoken: "Echo India Delta Oscar Charlie, make left-hand circuits, report downwind." },
      { id: "lv-9", speaker: "pilot", text: "Left-hand circuits, report downwind, EI-DOC.", expected: "Left-hand circuits, wilco, EI-DOC.", expectedSpoken: "Left-hand circuits, wilco, Echo India Delta Oscar Charlie." },
      { id: "lv-10", speaker: "pilot", text: "EI-DOC, left downwind runway 25, request touch and go.", expected: "EI-DOC, left downwind runway 25, touch and go.", expectedSpoken: "Echo India Delta Oscar Charlie, left downwind runway two fife, touch and go.", hint: "You're in the circuit. Self-report your downwind position — include the runway and your intentions (touch and go)." },
      { id: "lv-11", speaker: "atc", text: "EI-DOC, number two, follow the PA-28 on base, report final.", spoken: "Echo India Delta Oscar Charlie, number two, follow the Piper on base, report final." },
      { id: "lv-12", speaker: "pilot", text: "Number two, report final, EI-DOC.", expected: "Number two, wilco, EI-DOC.", expectedSpoken: "Number two, wilco, Echo India Delta Oscar Charlie." },
      { id: "lv-13", speaker: "pilot", text: "EI-DOC, final runway 25.", expected: "EI-DOC, final runway 25.", expectedSpoken: "Echo India Delta Oscar Charlie, final runway two fife." },
      { id: "lv-14", speaker: "atc", text: "EI-DOC, runway 25 cleared touch and go.", spoken: "Echo India Delta Oscar Charlie, runway two fife cleared touch and go." },
      { id: "lv-15", speaker: "pilot", text: "Cleared touch and go runway 25, EI-DOC.", expected: "Cleared touch and go runway 25, EI-DOC.", expectedSpoken: "Cleared touch and go runway two fife, Echo India Delta Oscar Charlie." },
    ],
  }),

  mission({
    id: "sp-arrival-landing",
    title: "Arrival to Stand",
    subtitle: "Inbound, land, then taxi to the stand",
    level: "student-pilot",
    difficulty: "Normal",
    duration: "10–14 min",
    description: "Join and land, then change to Ground and taxi to the stand, handling a give-way to crossing traffic on the way in.",
    bullets: ["Inbound & joining", "Landing clearance", "Vacate & contact Ground", "Give-way & taxi to stand"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "ARRIVAL",
    imageKey: "sp-arrival-landing",
    context: { callsign: "EC-MFS", aircraft: "Diamond DA40", location: "5 miles north of Sabadell", station: "Sabadell Tower", frequency: "120.800", initialTask: "Join, land, then taxi to stand handling a give-way on the way in", whatYouKnow: ["Information Bravo collected", "You are 5 miles north of Sabadell", "Sabadell Tower: 120.800"], whatYouNeed: ["Joining instructions and QNH (from Tower)", "Landing clearance", "Vacate direction and Ground frequency (from Tower)", "Taxi routing to the stand (from Ground)"] },
    steps: [
      { id: "as-1", speaker: "pilot", text: "Sabadell Tower, EC-MFS, 5 miles north, inbound to land, information Bravo.", expected: "Sabadell Tower, EC-MFS, 5 miles north, inbound to land, information Bravo.", expectedSpoken: "Sabadell Tower, Echo Charlie Mike Foxtrot Sierra, fife miles north, inbound to land, information Bravo.", hint: "Make your inbound call — include your callsign, position, intention to land, and ATIS letter." },
      { id: "as-2", speaker: "atc", text: "EC-MFS, join right base runway 30, QNH 1014.", spoken: "Echo Charlie Mike Foxtrot Sierra, join right base runway tree zero, Q N H one zero one four." },
      { id: "as-3", speaker: "pilot", text: "Join right base runway 30, QNH 1014, EC-MFS.", expected: "Wilco, runway 30, QNH 1014, EC-MFS.", expectedSpoken: "Wilco, runway tree zero, Q N H one zero one four, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-4", speaker: "atc", text: "EC-MFS, number two, report final.", spoken: "Echo Charlie Mike Foxtrot Sierra, number two, report final." },
      { id: "as-5", speaker: "pilot", text: "Report final, number two, EC-MFS.", expected: "Wilco, number two, EC-MFS.", expectedSpoken: "Wilco, number two, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-5b", speaker: "atc", text: "EC-MFS, continue approach, number one now vacating, report final.", spoken: "Echo Charlie Mike Foxtrot Sierra, continue approach, number one now vacating, report final." },
      { id: "as-5c", speaker: "pilot", text: "Continue approach, report final, EC-MFS.", expected: "Continue approach, wilco, EC-MFS.", expectedSpoken: "Continue approach, wilco, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-6", speaker: "pilot", text: "EC-MFS, final runway 30.", expected: "EC-MFS, final runway 30.", expectedSpoken: "Echo Charlie Mike Foxtrot Sierra, final runway tree zero." },
      { id: "as-7", speaker: "atc", text: "EC-MFS, runway 30 cleared to land, surface wind 300 degrees 8 knots.", spoken: "Echo Charlie Mike Foxtrot Sierra, runway tree zero cleared to land, surface wind tree zero zero degrees eight knots." },
      { id: "as-8", speaker: "pilot", text: "Cleared to land runway 30, EC-MFS.", expected: "Cleared to land runway 30, EC-MFS.", expectedSpoken: "Cleared to land runway tree zero, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-9", speaker: "atc", text: "EC-MFS, vacate via Alpha, contact Ground 121.700.", spoken: "Echo Charlie Mike Foxtrot Sierra, vacate via Alpha, contact Ground one two one decimal seven." },
      { id: "as-10", speaker: "pilot", text: "Vacate via Alpha, contact Ground 121.700, EC-MFS.", expected: "Vacate via Alpha, contact Ground 121.700, EC-MFS.", expectedSpoken: "Vacate via Alpha, contact Ground one two one decimal seven, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-11", speaker: "pilot", text: "Sabadell Ground, EC-MFS, runway vacated.", expected: "Sabadell Ground, EC-MFS, runway vacated, request taxi to stand.", expectedSpoken: "Sabadell Ground, Echo Charlie Mike Foxtrot Sierra, runway vacated, request taxi to stand.", hint: "You've switched to Ground. Check in — report that you've vacated the runway and request taxi to the stand." },
      { id: "as-12", speaker: "atc", text: "EC-MFS, taxi to stand 8 via Bravo, give way to the company Cessna crossing right to left.", spoken: "Echo Charlie Mike Foxtrot Sierra, taxi to stand eight via Bravo, give way to the company Cessna crossing right to left." },
      { id: "as-13", speaker: "pilot", text: "Taxi to stand 8 via Bravo, giving way to the Cessna, EC-MFS.", expected: "Taxi to stand 8 via Bravo, wilco, EC-MFS.", expectedSpoken: "Taxi to stand eight via Bravo, wilco, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-14", speaker: "atc", text: "EC-MFS, traffic clear, continue to stand 8.", spoken: "Echo Charlie Mike Foxtrot Sierra, traffic clear, continue to stand eight." },
      { id: "as-15", speaker: "pilot", text: "Continue to stand 8, EC-MFS.", expected: "Continue to stand 8, EC-MFS.", expectedSpoken: "Continue to stand eight, Echo Charlie Mike Foxtrot Sierra." },
      { id: "as-16", speaker: "pilot", text: "EC-MFS, on stand 8, closing down.", expected: "EC-MFS, on stand 8, closing down.", expectedSpoken: "Echo Charlie Mike Foxtrot Sierra, on stand eight, closing down.", hint: "You're at the stand. Report on stand and that you are closing down." },
    ],
  }),

  /* ─────────────────── READY FOR RADIO (3) ─────────────────── */

  mission({
    id: "rfr-busy-circuit-recovery",
    title: "Busy Circuit",
    subtitle: "Sequencing, traffic and a missed call to clarify",
    level: "rfr",
    difficulty: "Advanced",
    duration: "10–14 min",
    description: "Manage a busy circuit: handle sequencing and traffic, clarify a blocked instruction with say again, then extend, re-sequence and recover to final.",
    bullets: ["Traffic sequencing", "Say-again / clarification", "Extend downwind", "Re-sequence & report final"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "CIRCUIT",
    imageKey: "rfr-busy-circuit-recovery",
    context: { callsign: "EI-GAR", aircraft: "Piper PA-28", location: "Downwind runway 16 at Cork", station: "Cork Tower", frequency: "119.300", initialTask: "Manage sequencing and traffic, clarify an unclear instruction, and recover to final", whatYouKnow: ["You are downwind runway 16 at Cork", "Cork Tower: 119.300", "Intentions: touch and go"], whatYouNeed: ["Sequencing and traffic instructions (from Tower)", "Touch-and-go clearance — one instruction may be blocked and need clarification"] },
    steps: [
      { id: "bc-1", speaker: "pilot", text: "Cork Tower, EI-GAR, downwind runway 16, touch and go.", expected: "Cork Tower, EI-GAR, downwind runway 16, request touch and go.", expectedSpoken: "Cork Tower, Echo India Golf Alfa Romeo, downwind runway one six, request touch and go.", hint: "Report your downwind position. Include your callsign, runway, and intentions." },
      { id: "bc-2", speaker: "atc", text: "EI-GAR, number two, follow the Cessna on base, report traffic in sight.", spoken: "Echo India Golf Alfa Romeo, number two, follow the Cessna on base, report traffic in sight." },
      { id: "bc-3", speaker: "pilot", text: "Number two, looking for traffic, EI-GAR.", expected: "Number two, wilco, EI-GAR.", expectedSpoken: "Number two, wilco, Echo India Golf Alfa Romeo." },
      { id: "bc-4", speaker: "pilot", text: "EI-GAR, traffic in sight.", expected: "EI-GAR, traffic in sight.", expectedSpoken: "Echo India Golf Alfa Romeo, traffic in sight." },
      { id: "bc-5", speaker: "atc", text: "EI-GAR, extend downwind, number — report final.", spoken: "Echo India Golf Alfa Romeo, extend downwind, number — report final." },
      { id: "bc-6", speaker: "pilot", text: "EI-GAR, say again your last instruction.", expected: "Say again, EI-GAR.", expectedSpoken: "Say again, Echo India Golf Alfa Romeo.", hint: "ATC's transmission was blocked or unclear. Ask them to say again." },
      { id: "bc-7", speaker: "atc", text: "EI-GAR, extend downwind, you are now number one, report final.", spoken: "Echo India Golf Alfa Romeo, extend downwind, you are now number one, report final." },
      { id: "bc-8", speaker: "pilot", text: "Extend downwind, number one, report final, EI-GAR.", expected: "Extend downwind, number one, wilco, EI-GAR.", expectedSpoken: "Extend downwind, number one, wilco, Echo India Golf Alfa Romeo." },
      { id: "bc-9", speaker: "atc", text: "EI-GAR, traffic now on short final, continue extending downwind.", spoken: "Echo India Golf Alfa Romeo, traffic now on short final, continue extending downwind." },
      { id: "bc-10", speaker: "pilot", text: "Continue extending downwind, EI-GAR.", expected: "Wilco, EI-GAR.", expectedSpoken: "Wilco, Echo India Golf Alfa Romeo." },
      { id: "bc-11", speaker: "pilot", text: "EI-GAR, final runway 16.", expected: "EI-GAR, final runway 16.", expectedSpoken: "Echo India Golf Alfa Romeo, final runway one six." },
      { id: "bc-12", speaker: "atc", text: "EI-GAR, runway 16 cleared touch and go.", spoken: "Echo India Golf Alfa Romeo, runway one six cleared touch and go." },
      { id: "bc-13", speaker: "pilot", text: "Cleared touch and go runway 16, EI-GAR.", expected: "Cleared touch and go runway 16, EI-GAR.", expectedSpoken: "Cleared touch and go runway one six, Echo India Golf Alfa Romeo." },
    ],
  }),

  mission({
    id: "rfr-frequency-handover",
    title: "Radar Handover",
    subtitle: "Approach check-in, vectors and handoff to Tower",
    level: "rfr",
    difficulty: "Normal",
    duration: "10–14 min",
    description: "Run a full radar-service arc: check in on Approach, take a squawk and QNH, fly vectors, report the field in sight and hand over to Tower.",
    bullets: ["Approach check-in", "Squawk & QNH read-back", "Radar vectors", "Field in sight & handoff"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "APPROACH",
    imageKey: "rfr-frequency-handover",
    context: { callsign: "G-CIRP", aircraft: "Diamond DA40", location: "Leaving Norwich control zone", station: "Norwich Approach", frequency: "119.350", initialTask: "Handle handovers, squawk and position reporting", whatYouKnow: ["You are leaving the Norwich control zone at 2500 feet VFR", "Norwich Approach: 119.350"], whatYouNeed: ["Squawk code and QNH (from Approach)", "Radar vectors to Norwich", "Tower frequency (from Approach when cleared"]  },
    steps: [
      { id: "fh-1", speaker: "pilot", text: "Norwich Approach, G-CIRP, 2500 feet, VFR.", expected: "Norwich Approach, G-CIRP, with you, 2500 feet, VFR.", expectedSpoken: "Norwich Approach, Golf Charlie India Romeo Papa, with you, two thousand fife hundred feet, V F R.", hint: "Check in with Approach. Report that you're with them, your current altitude, and your flight rules." },
      { id: "fh-2", speaker: "atc", text: "G-CIRP, Norwich Approach, radar contact, squawk 4523, QNH 1015.", spoken: "Golf Charlie India Romeo Papa, Norwich Approach, radar contact, squawk four fife two tree, Q N H one zero one fife." },
      { id: "fh-3", speaker: "pilot", text: "Squawk 4523, QNH 1015, G-CIRP.", expected: "Squawk 4523, QNH 1015, G-CIRP.", expectedSpoken: "Squawk four fife two tree, Q N H one zero one fife, Golf Charlie India Romeo Papa." },
      { id: "fh-4", speaker: "atc", text: "G-CIRP, turn left heading 180, descend altitude 1500 feet.", spoken: "Golf Charlie India Romeo Papa, turn left heading one eight zero, descend altitude one thousand fife hundred feet." },
      { id: "fh-5", speaker: "pilot", text: "Left heading 180, descend 1500 feet, G-CIRP.", expected: "Left heading 180, descend 1500 feet, G-CIRP.", expectedSpoken: "Left heading one eight zero, descend one thousand fife hundred feet, Golf Charlie India Romeo Papa." },
      { id: "fh-5b", speaker: "atc", text: "G-CIRP, traffic 10 o'clock, 5 miles, southwestbound, altitude 2000 feet, not a factor.", spoken: "Golf Charlie India Romeo Papa, traffic one zero o'clock, fife miles, southwestbound, altitude two thousand feet, not a factor." },
      { id: "fh-5c", speaker: "pilot", text: "Looking for traffic, G-CIRP.", expected: "Roger, G-CIRP.", expectedSpoken: "Roger, Golf Charlie India Romeo Papa." },
      { id: "fh-6", speaker: "atc", text: "G-CIRP, 5 miles north of Norwich, report airfield in sight.", spoken: "Golf Charlie India Romeo Papa, fife miles north of Norwich, report airfield in sight." },
      { id: "fh-7", speaker: "pilot", text: "Wilco, G-CIRP.", expected: "Wilco, G-CIRP.", expectedSpoken: "Wilco, Golf Charlie India Romeo Papa." },
      { id: "fh-8", speaker: "pilot", text: "G-CIRP, airfield in sight.", expected: "G-CIRP, airfield in sight.", expectedSpoken: "Golf Charlie India Romeo Papa, airfield in sight.", hint: "Self-report when the airfield is in sight — don't wait for ATC to ask again." },
      { id: "fh-9", speaker: "atc", text: "G-CIRP, contact Tower 124.250.", spoken: "Golf Charlie India Romeo Papa, contact Tower one two four decimal two fife zero." },
      { id: "fh-10", speaker: "pilot", text: "Contact Tower 124.250, G-CIRP.", expected: "Contact Tower 124.250, G-CIRP.", expectedSpoken: "Contact Tower one two four decimal two fife zero, Golf Charlie India Romeo Papa." },
    ],
  }),

  mission({
    id: "rfr-runway-change",
    title: "Adapt the Plan",
    subtitle: "Runway change, confirm and adapt your approach",
    level: "rfr",
    difficulty: "Advanced",
    duration: "10–14 min",
    description: "Brief for one runway, then handle a mid-approach runway change: confirm you are able, adapt the join and work revised spacing to land.",
    bullets: ["Expect runway report", "Mid-approach runway change", "Confirm & adapt", "Revised spacing to land"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "ARRIVAL",
    imageKey: "rfr-runway-change",
    context: { callsign: "EC-LAA", aircraft: "Tecnam P2008", location: "Inbound to Valencia", station: "Valencia Tower", frequency: "118.550", initialTask: "Confirm a runway change, adapt your approach and handle revised spacing to land", whatYouKnow: ["Information Alpha collected", "You are 5 miles south of Valencia", "Valencia Tower: 118.550"], whatYouNeed: ["Expected runway (from Tower — may change mid-approach)", "Confirmation of runway change and ability check", "Revised joining and landing clearance"] },
    steps: [
      { id: "adp-1", speaker: "pilot", text: "Valencia Tower, EC-LAA, 5 miles south, inbound to land, information Alpha.", expected: "Valencia Tower, EC-LAA, 5 miles south, inbound to land, information Alpha.", expectedSpoken: "Valencia Tower, Echo Charlie Lima Alfa Alfa, fife miles south, inbound to land, information Alpha.", hint: "Report inbound. Include position, intention, and your ATIS letter." },
      { id: "adp-2", speaker: "atc", text: "EC-LAA, expect runway 12, report 3 miles.", spoken: "Echo Charlie Lima Alfa Alfa, expect runway one two, report tree miles." },
      { id: "adp-3", speaker: "pilot", text: "Expect runway 12, will report 3 miles, EC-LAA.", expected: "Expect runway 12, wilco, EC-LAA.", expectedSpoken: "Expect runway one two, wilco, Echo Charlie Lima Alfa Alfa." },
      { id: "adp-4", speaker: "pilot", text: "Valencia Tower, EC-LAA, 3 miles south.", expected: "Valencia Tower, EC-LAA, 3 miles south.", expectedSpoken: "Valencia Tower, Echo Charlie Lima Alfa Alfa, tree miles south.", hint: "Tower asked you to report at 3 miles. Self-report your current position now." },
      { id: "adp-5", speaker: "atc", text: "EC-LAA, runway changed, now runway 30, surface wind 290 degrees 12 knots, are you able runway 30?", spoken: "Echo Charlie Lima Alfa Alfa, runway changed, now runway tree zero, surface wind two niner zero degrees one two knots, are you able runway tree zero?" },
      { id: "adp-6", speaker: "pilot", text: "Affirm, able runway 30, EC-LAA.", expected: "Affirm, EC-LAA.", expectedSpoken: "Affirm, Echo Charlie Lima Alfa Alfa.", hint: "ATC changed the runway and asked if you can accept it. Confirm whether you are able." },
      { id: "adp-7", speaker: "atc", text: "EC-LAA, join final runway 30, number two, follow the Airbus on final.", spoken: "Echo Charlie Lima Alfa Alfa, join final runway tree zero, number two, follow the Airbus on final." },
      { id: "adp-8", speaker: "pilot", text: "Join final runway 30, number two, EC-LAA.", expected: "Join final runway 30, number two, EC-LAA.", expectedSpoken: "Join final runway tree zero, number two, Echo Charlie Lima Alfa Alfa." },
      { id: "adp-9", speaker: "atc", text: "EC-LAA, reduce speed, extend slightly for spacing.", spoken: "Echo Charlie Lima Alfa Alfa, reduce speed, extend slightly for spacing." },
      { id: "adp-10", speaker: "pilot", text: "Wilco, EC-LAA.", expected: "Reducing speed, extending for spacing, EC-LAA.", expectedSpoken: "Reducing speed, extending for spacing, Echo Charlie Lima Alfa Alfa." },
      { id: "adp-11", speaker: "pilot", text: "EC-LAA, final runway 30.", expected: "EC-LAA, final runway 30.", expectedSpoken: "Echo Charlie Lima Alfa Alfa, final runway tree zero." },
      { id: "adp-12", speaker: "atc", text: "EC-LAA, runway 30 cleared to land, surface wind 290 degrees 12 knots.", spoken: "Echo Charlie Lima Alfa Alfa, runway tree zero cleared to land, surface wind two niner zero degrees one two knots." },
      { id: "adp-13", speaker: "pilot", text: "Cleared to land runway 30, EC-LAA.", expected: "Cleared to land runway 30, EC-LAA.", expectedSpoken: "Cleared to land runway tree zero, Echo Charlie Lima Alfa Alfa." },
    ],
  }),

  /* ─────────────────── AIRLINE PREP (3) ─────────────────── */

  mission({
    id: "ap-ifr-clearance",
    title: "Clearance & Taxi",
    subtitle: "IFR clearance, push and complex taxi out",
    level: "airline-prep",
    difficulty: "Advanced",
    duration: "12–16 min",
    description: "Copy and read back an IFR clearance with a correction, request push and start, then handle a complex multi-part taxi with a give-way before the Tower handoff.",
    bullets: ["IFR clearance & read-back", "Correction handling", "Push & start", "Complex taxi, give way & Tower handoff"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "CLEARANCE",
    imageKey: "ap-ifr-clearance",
    context: { callsign: "SHAMROCK 21", aircraft: "Boeing 737", location: "Stand 24 at Dublin", station: "Dublin Delivery / Ground", frequency: "121.875", initialTask: "Copy your IFR clearance, then taxi to the holding point through a busy airport", whatYouKnow: ["You are at Stand 24, Dublin Airport", "Departing to London Heathrow", "Delivery: 121.875 → Ground: 121.800 → Tower: 118.600"], whatYouNeed: ["IFR clearance items: SID, initial level, squawk (from Delivery — expect one correction)", "Push and start approval (from Ground)", "Taxi route and any give-ways (from Ground)"] },
    steps: [
      { id: "ct-1", speaker: "pilot", text: "Dublin Delivery, SHAMROCK 21, request IFR clearance to London Heathrow.", expected: "Delivery, SHAMROCK 21, request IFR clearance to London Heathrow.", expectedSpoken: "Delivery, Shamrock two one, request I F R clearance to London Heathrow.", hint: "Request your IFR clearance from Delivery. Include your callsign and destination." },
      { id: "ct-2", speaker: "atc", text: "SHAMROCK 21, cleared to London Heathrow via BRIDA 2 Charlie departure, climb FL80, squawk 6213.", spoken: "Shamrock two one, cleared to London Heathrow via Brida two Charlie departure, climb flight level eight zero, squawk six two one tree." },
      { id: "ct-3", speaker: "pilot", text: "Cleared London Heathrow, BRIDA 2 Charlie departure, climb FL80, squawk 6213, SHAMROCK 21.", expected: "Cleared London Heathrow, BRIDA 2 Charlie departure, climb FL80, squawk 6213, SHAMROCK 21.", expectedSpoken: "Cleared London Heathrow, Brida two Charlie departure, climb flight level eight zero, squawk six two one tree, Shamrock two one." },
      { id: "ct-4", speaker: "atc", text: "SHAMROCK 21, correction, squawk 6231.", spoken: "Shamrock two one, correction, squawk six two tree one." },
      { id: "ct-5", speaker: "pilot", text: "Squawk 6231, SHAMROCK 21.", expected: "Squawk 6231, SHAMROCK 21.", expectedSpoken: "Squawk six two tree one, Shamrock two one." },
      { id: "ct-6", speaker: "atc", text: "SHAMROCK 21, readback correct, contact Ground 121.800 for push and start.", spoken: "Shamrock two one, readback correct, contact Ground one two one decimal eight for push and start." },
      { id: "ct-7", speaker: "pilot", text: "Contact Ground 121.800, SHAMROCK 21.", expected: "Contact Ground 121.800, SHAMROCK 21.", expectedSpoken: "Contact Ground one two one decimal eight, Shamrock two one." },
      { id: "ct-8", speaker: "pilot", text: "Dublin Ground, SHAMROCK 21, stand 24, request push and start.", expected: "Ground, SHAMROCK 21, stand 24, request push and start.", expectedSpoken: "Ground, Shamrock two one, stand two four, request push and start.", hint: "You've switched to Ground. Check in — include your stand number and request push and start." },
      { id: "ct-9", speaker: "atc", text: "SHAMROCK 21, push and start approved, face south.", spoken: "Shamrock two one, push and start approved, face south." },
      { id: "ct-10", speaker: "pilot", text: "Push and start approved, face south, SHAMROCK 21.", expected: "Push and start approved, facing south, SHAMROCK 21.", expectedSpoken: "Push and start approved, facing south, Shamrock two one." },
      { id: "ct-11", speaker: "pilot", text: "Dublin Ground, SHAMROCK 21, request taxi.", expected: "Dublin Ground, SHAMROCK 21, request taxi.", expectedSpoken: "Dublin Ground, Shamrock two one, request taxi.", hint: "Push and start is complete. Request taxi — your callsign and request are all that's needed." },
      { id: "ct-12", speaker: "atc", text: "SHAMROCK 21, taxi to holding point Bravo 2 via Sierra and November, hold short of runway 16.", spoken: "Shamrock two one, taxi to holding point Bravo two via Sierra and November, hold short of runway one six." },
      { id: "ct-13", speaker: "pilot", text: "Taxi to holding point Bravo 2 via Sierra and November, hold short of runway 16, SHAMROCK 21.", expected: "Taxi to holding point Bravo 2 via Sierra and November, hold short of runway 16, SHAMROCK 21.", expectedSpoken: "Taxi to holding point Bravo two via Sierra and November, hold short of runway one six, Shamrock two one." },
      { id: "ct-14", speaker: "atc", text: "SHAMROCK 21, hold position, give way to company Boeing 737 crossing left to right.", spoken: "Shamrock two one, hold position, give way to company Boeing seven three seven crossing left to right." },
      { id: "ct-15", speaker: "pilot", text: "Hold position, giving way to the company traffic, SHAMROCK 21.", expected: "Hold position, give way to the company traffic, SHAMROCK 21.", expectedSpoken: "Hold position, give way to the company traffic, Shamrock two one." },
      { id: "ct-16", speaker: "atc", text: "SHAMROCK 21, continue to holding point Bravo 2, contact Tower 118.600.", spoken: "Shamrock two one, continue to holding point Bravo two, contact Tower one one eight decimal six." },
      { id: "ct-17", speaker: "pilot", text: "Continue to holding point Bravo 2, contact Tower 118.600, SHAMROCK 21.", expected: "Continue to holding point Bravo 2, contact Tower 118.600, SHAMROCK 21.", expectedSpoken: "Continue to holding point Bravo two, contact Tower one one eight decimal six, Shamrock two one." },
    ],
  }),

  mission({
    id: "ap-departure-handover",
    title: "Airline Departure",
    subtitle: "Takeoff, departure handoff and initial climb",
    level: "airline-prep",
    difficulty: "Advanced",
    duration: "12–16 min",
    description: "Line up and depart from a busy hub, hand over from Tower to Departure and fly the initial climb, heading and speed restrictions.",
    bullets: ["Line-up & takeoff clearance", "Tower to Departure handoff", "Climb instruction", "Heading & speed restriction"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "DEPARTURE",
    imageKey: "ap-departure-handover",
    context: { callsign: "SPEEDBIRD 318", aircraft: "Airbus A320", location: "Holding point B2 at Heathrow", station: "Heathrow Tower", frequency: "118.700", initialTask: "Take off, contact Departure and fly the initial SID constraints", whatYouKnow: ["You are at holding point B2, Heathrow — runway 27L in use", "Heathrow Tower: 118.700 → London Departure: 120.400", "SID: COMPTON departure"], whatYouNeed: ["Line-up and takeoff clearance (from Tower)", "Initial climb, heading and speed (from Departure)", "SID altitude constraint at COMPTON (from Departure)"] },
    steps: [
      { id: "dh-1", speaker: "atc", text: "SPEEDBIRD 318, line up runway 27L and wait.", spoken: "Speedbird tree one eight, line up runway two seven left and wait." },
      { id: "dh-2", speaker: "pilot", text: "Line up runway 27L and wait, SPEEDBIRD 318.", expected: "Line up and wait runway 27L, SPEEDBIRD 318.", expectedSpoken: "Line up and wait runway two seven left, Speedbird tree one eight." },
      { id: "dh-3", speaker: "atc", text: "SPEEDBIRD 318, runway 27L cleared for takeoff, wind 270 degrees 12 knots.", spoken: "Speedbird tree one eight, runway two seven left cleared for takeoff, wind two seven zero degrees one two knots." },
      { id: "dh-4", speaker: "pilot", text: "Cleared for takeoff runway 27L, SPEEDBIRD 318.", expected: "Cleared for takeoff runway 27L, SPEEDBIRD 318.", expectedSpoken: "Cleared for takeoff runway two seven left, Speedbird tree one eight." },
      { id: "dh-5", speaker: "atc", text: "SPEEDBIRD 318, contact London Departure 120.400.", spoken: "Speedbird tree one eight, contact London Departure one two zero decimal four." },
      { id: "dh-6", speaker: "pilot", text: "Contact Departure 120.400, SPEEDBIRD 318.", expected: "Contact Departure 120.400, SPEEDBIRD 318.", expectedSpoken: "Contact Departure one two zero decimal four, Speedbird tree one eight." },
      { id: "dh-7", speaker: "pilot", text: "London Departure, SPEEDBIRD 318, climbing 3000 feet.", expected: "Departure, SPEEDBIRD 318, airborne runway 27L, climbing 3000 feet.", expectedSpoken: "Departure, Speedbird tree one eight, airborne runway two seven left, climbing three thousand feet.", hint: "You're on Departure frequency. Check in — report airborne, your departure runway, and your cleared climbing level." },
      { id: "dh-8", speaker: "atc", text: "SPEEDBIRD 318, identified, climb FL80, fly heading 300, speed 250 knots.", spoken: "Speedbird tree one eight, identified, climb flight level eight zero, fly heading tree zero zero, speed two fife zero knots." },
      { id: "dh-9", speaker: "pilot", text: "Climb FL80, heading 300, speed 250 knots, SPEEDBIRD 318.", expected: "Climb FL80, heading 300, speed 250 knots, SPEEDBIRD 318.", expectedSpoken: "Climb flight level eight zero, heading tree zero zero, speed two fife zero knots, Speedbird tree one eight." },
      { id: "dh-10", speaker: "atc", text: "SPEEDBIRD 318, on passing FL80, climb FL240, cross COMPTON at FL130.", spoken: "Speedbird tree one eight, on passing flight level eight zero, climb flight level two four zero, cross Compton at flight level one tree zero." },
      { id: "dh-11", speaker: "pilot", text: "On passing FL80, climb FL240, cross COMPTON at FL130, SPEEDBIRD 318.", expected: "On passing FL80, climb FL240, cross COMPTON at FL130, SPEEDBIRD 318.", expectedSpoken: "On passing flight level eight zero, climb flight level two four zero, cross Compton at flight level one tree zero, Speedbird tree one eight." },
    ],
  }),

  mission({
    id: "ap-approach-brief",
    title: "Airline Arrival",
    subtitle: "STAR, hold, vectors and the ILS approach",
    level: "airline-prep",
    difficulty: "Advanced",
    duration: "12–16 min",
    description: "Fly the full arrival: check in and descend, run the STAR, absorb a short hold for delay, then take vectors and the ILS approach clearance.",
    bullets: ["Arrival check-in & descent", "STAR clearance", "Hold & delay", "Vectors & ILS approach clearance"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "APPROACH",
    imageKey: "ap-approach-brief",
    context: { callsign: "VUELING 843", aircraft: "Airbus A320", location: "Arrival into Barcelona", station: "Barcelona Approach", frequency: "119.105", initialTask: "Fly the arrival: descent and STAR, a short hold, vectors and the ILS clearance", whatYouKnow: ["Information Kilo collected", "Currently at FL120", "Barcelona Approach: 119.105", "CASPE 1A arrival expected"], whatYouNeed: ["Initial descent clearance (from Approach)", "STAR clearance (from Approach)", "Hold clearance or vectors (from Approach)", "ILS approach clearance (from Approach)"] },
    steps: [
      { id: "aa-1", speaker: "pilot", text: "Barcelona Approach, VUELING 843, FL120, information Kilo.", expected: "Barcelona Approach, VUELING 843, with you, FL120, information Kilo.", expectedSpoken: "Barcelona Approach, Vueling eight four tree, with you, flight level one two zero, information Kilo.", hint: "Check in with Approach. Report that you're with them, your current flight level, and the information letter." },
      { id: "aa-2", speaker: "atc", text: "VUELING 843, Barcelona Approach, identified, descend FL80, speed 250 knots.", spoken: "Vueling eight four tree, Barcelona Approach, identified, descend flight level eight zero, speed two fife zero knots." },
      { id: "aa-3", speaker: "pilot", text: "Descend FL80, speed 250 knots, VUELING 843.", expected: "Descend FL80, speed 250 knots, VUELING 843.", expectedSpoken: "Descend flight level eight zero, speed two fife zero knots, Vueling eight four tree." },
      { id: "aa-4", speaker: "atc", text: "VUELING 843, cleared CASPE 1A arrival, descend FL70.", spoken: "Vueling eight four tree, cleared Caspe one Alfa arrival, descend flight level seven zero." },
      { id: "aa-5", speaker: "pilot", text: "Cleared CASPE 1A arrival, descend FL70, VUELING 843.", expected: "Cleared CASPE 1A arrival, descend FL70, VUELING 843.", expectedSpoken: "Cleared Caspe one Alfa arrival, descend flight level seven zero, Vueling eight four tree." },
      { id: "aa-6", speaker: "atc", text: "VUELING 843, hold at CASPE, maintain FL70, expect approach in 5 minutes.", spoken: "Vueling eight four tree, hold at Caspe, maintain flight level seven zero, expect approach in fife minutes." },
      { id: "aa-7", speaker: "pilot", text: "Hold at CASPE, maintain FL70, expect approach in 5 minutes, VUELING 843.", expected: "Hold at CASPE, maintain FL70, roger, VUELING 843.", expectedSpoken: "Hold at Caspe, maintain flight level seven zero, roger, Vueling eight four tree." },
      { id: "aa-8", speaker: "atc", text: "VUELING 843, leave the hold, turn left heading 180 for vectors.", spoken: "Vueling eight four tree, leave the hold, turn left heading one eight zero for vectors." },
      { id: "aa-9", speaker: "pilot", text: "Leave the hold, left heading 180, VUELING 843.", expected: "Left heading 180, VUELING 843.", expectedSpoken: "Left heading one eight zero, Vueling eight four tree." },
      { id: "aa-10", speaker: "atc", text: "VUELING 843, reduce speed 180 knots, descend altitude 3000 feet.", spoken: "Vueling eight four tree, reduce speed one eight zero knots, descend altitude three thousand feet." },
      { id: "aa-11", speaker: "pilot", text: "Speed 180 knots, descend 3000 feet, VUELING 843.", expected: "Speed 180 knots, descend 3000 feet, VUELING 843.", expectedSpoken: "Speed one eight zero knots, descend three thousand feet, Vueling eight four tree." },
      { id: "aa-12", speaker: "atc", text: "VUELING 843, turn right heading 240, cleared ILS approach runway 25L.", spoken: "Vueling eight four tree, turn right heading two four zero, cleared I L S approach runway two fife left." },
      { id: "aa-13", speaker: "pilot", text: "Right heading 240, cleared ILS approach runway 25L, VUELING 843.", expected: "Right heading 240, cleared ILS approach runway 25L, VUELING 843.", expectedSpoken: "Right heading two four zero, cleared I L S approach runway two fife left, Vueling eight four tree." },
    ],
  }),

  /* ─────────────────── ADVANCED OPS (4) ─────────────────── */

  mission({
    id: "ao-weather-deviation",
    title: "Weather & Diversion",
    subtitle: "Deviate around weather, then divert",
    level: "advanced-ops",
    difficulty: "Advanced",
    duration: "12–16 min",
    description: "Request a weather deviation, manage traffic, then make a diversion decision when the route ahead becomes unviable: state intentions, take new routing and a handoff.",
    bullets: ["Weather deviation request", "Traffic awareness", "Divert decision & intentions", "New routing & handoff"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "ENROUTE",
    imageKey: "ao-weather-deviation",
    context: { callsign: "NORWEGIAN 622", aircraft: "Boeing 737", location: "FL180 enroute, convective weather ahead", station: "Shannon Control", frequency: "127.500", initialTask: "Request a weather deviation, then divert when the route becomes unviable", whatYouKnow: ["You are at FL180 enroute with convective weather visible ahead", "Shannon Control: 127.500", "138 persons on board, fuel 6 tonnes"], whatYouNeed: ["Deviation approval (from Control)", "Diversion clearance and new routing if weather blocks the route"] },
    steps: [
      { id: "wd-1", speaker: "pilot", text: "Shannon Control, NORWEGIAN 622, request 20 degrees right for weather.", expected: "Shannon Control, NORWEGIAN 622, request 20 degrees right for weather.", expectedSpoken: "Shannon Control, Norwegian six two two, request two zero degrees right for weather.", hint: "Request a weather deviation — state the direction and degrees of track offset you need." },
      { id: "wd-2", speaker: "atc", text: "NORWEGIAN 622, approved, deviation 20 degrees right, report back on route.", spoken: "Norwegian six two two, approved, deviation two zero degrees right, report back on route." },
      { id: "wd-3", speaker: "pilot", text: "Deviation approved, 20 degrees right, wilco, NORWEGIAN 622.", expected: "Deviation approved, 20 degrees right, will report back on route, NORWEGIAN 622.", expectedSpoken: "Deviation approved, two zero degrees right, will report back on route, Norwegian six two two." },
      { id: "wd-4", speaker: "atc", text: "NORWEGIAN 622, traffic 12 o'clock, 10 miles, opposite direction, FL200, not a factor.", spoken: "Norwegian six two two, traffic one two o'clock, one zero miles, opposite direction, flight level two zero zero, not a factor." },
      { id: "wd-5", speaker: "pilot", text: "Looking for traffic, NORWEGIAN 622.", expected: "Roger, NORWEGIAN 622.", expectedSpoken: "Roger, Norwegian six two two." },
      { id: "wd-6", speaker: "pilot", text: "Shannon Control, NORWEGIAN 622, weather now blocking the route ahead, request diversion to Shannon.", expected: "Shannon Control, NORWEGIAN 622, weather now blocking the route ahead, request diversion to Shannon.", expectedSpoken: "Shannon Control, Norwegian six two two, weather now blocking the route ahead, request diversion to Shannon.", hint: "The route ahead is now blocked. Request a diversion — state the reason and your intended divert destination." },
      { id: "wd-7", speaker: "atc", text: "NORWEGIAN 622, roger, cleared to divert Shannon, descend FL120, route direct SHA.", spoken: "Norwegian six two two, roger, cleared to divert Shannon, descend flight level one two zero, route direct Sierra Hotel Alfa." },
      { id: "wd-8", speaker: "pilot", text: "Cleared to divert Shannon, descend FL120, direct SHA, NORWEGIAN 622.", expected: "Cleared to divert Shannon, descend FL120, direct SHA, NORWEGIAN 622.", expectedSpoken: "Cleared to divert Shannon, descend flight level one two zero, direct Sierra Hotel Alfa, Norwegian six two two." },
      { id: "wd-9", speaker: "pilot", text: "NORWEGIAN 622, diverting Shannon, 138 persons on board, fuel 6 tonnes.", expected: "NORWEGIAN 622, diverting Shannon, 138 persons on board, fuel 6 tonnes.", expectedSpoken: "Norwegian six two two, diverting Shannon, one tree eight persons on board, fuel six tonnes.", hint: "Diversion cleared. Broadcast your intentions and pass key safety details: souls on board and fuel state." },
      { id: "wd-10", speaker: "atc", text: "NORWEGIAN 622, roger, contact Shannon Approach 121.400.", spoken: "Norwegian six two two, roger, contact Shannon Approach one two one decimal four." },
      { id: "wd-11", speaker: "pilot", text: "Contact Shannon Approach 121.400, NORWEGIAN 622.", expected: "Contact Shannon Approach 121.400, NORWEGIAN 622.", expectedSpoken: "Contact Shannon Approach one two one decimal four, Norwegian six two two." },
    ],
  }),

  mission({
    id: "ao-go-around",
    title: "Go-Around",
    subtitle: "Balked landing, climb out and re-sequence",
    level: "advanced-ops",
    difficulty: "Advanced",
    duration: "10–14 min",
    description: "Execute a go-around, read back climb instructions and recover into the approach sequence.",
    bullets: ["Go-around announcement", "Climb to safety altitude", "Radar vector for re-sequence", "Expect approach clearance"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "APPROACH",
    imageKey: "ao-go-around",
    context: { callsign: "RYANAIR 734", aircraft: "Boeing 737", location: "Short final runway 28L at Dublin", station: "Dublin Tower", frequency: "118.600", initialTask: "Announce go-around and follow climb instructions", whatYouKnow: ["You are on short final runway 28L at Dublin", "Dublin Tower: 118.600"], whatYouNeed: ["Go-around climb and heading instructions (from Tower)", "Re-sequencing and approach clearance for second attempt"] },
    steps: [
      { id: "ga-1", speaker: "atc", text: "RYANAIR 734, runway 28L cleared to land, surface wind 270 degrees 15 knots.", spoken: "Ryanair seven tree four, runway two eight left cleared to land, surface wind two seven zero degrees one fife knots." },
      { id: "ga-2", speaker: "pilot", text: "Cleared to land runway 28L, RYANAIR 734.", expected: "Cleared to land runway 28L, RYANAIR 734.", expectedSpoken: "Cleared to land runway two eight left, Ryanair seven tree four." },
      { id: "ga-3", speaker: "atc", text: "RYANAIR 734, go around, I say again, go around, aircraft on runway.", spoken: "Ryanair seven tree four, go around, I say again, go around, aircraft on runway." },
      { id: "ga-4", speaker: "pilot", text: "Going around, RYANAIR 734.", expected: "Go around, RYANAIR 734.", expectedSpoken: "Go around, Ryanair seven tree four." },
      { id: "ga-5", speaker: "atc", text: "RYANAIR 734, climb to 3000 feet, runway heading.", spoken: "Ryanair seven tree four, climb to three thousand feet, runway heading." },
      { id: "ga-6", speaker: "pilot", text: "Climb 3000 feet, runway heading, RYANAIR 734.", expected: "Climb 3000 feet, runway heading, RYANAIR 734.", expectedSpoken: "Climb three thousand feet, runway heading, Ryanair seven tree four." },
      { id: "ga-7", speaker: "atc", text: "RYANAIR 734, turn left heading 180, number two in sequence.", spoken: "Ryanair seven tree four, turn left heading one eight zero, number two in sequence." },
      { id: "ga-8", speaker: "pilot", text: "Left heading 180, number two, RYANAIR 734.", expected: "Left heading 180, number two, RYANAIR 734.", expectedSpoken: "Left heading one eight zero, number two, Ryanair seven tree four." },
      { id: "ga-9", speaker: "atc", text: "RYANAIR 734, expect ILS runway 28L, report established.", spoken: "Ryanair seven tree four, expect I L S runway two eight left, report established." },
      { id: "ga-10", speaker: "pilot", text: "Wilco, expect ILS runway 28L, RYANAIR 734.", expected: "Wilco, expect ILS runway 28L, RYANAIR 734.", expectedSpoken: "Wilco, expect I L S runway two eight left, Ryanair seven tree four." },
    ],
  }),

  mission({
    id: "ao-pan-pan",
    title: "PAN PAN",
    subtitle: "Declare urgency and coordinate a priority return",
    level: "advanced-ops",
    difficulty: "Advanced",
    duration: "12–16 min",
    description: "Declare PAN PAN for a technical issue, pass essential details and coordinate a priority return.",
    bullets: ["PAN PAN call structure", "Nature of problem & intentions", "Priority clearance read-back", "Souls and fuel"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "PAN PAN",
    imageKey: "ao-pan-pan",
    context: { callsign: "IBERIA 315", aircraft: "Airbus A320", location: "Enroute to Madrid", station: "Madrid Control", frequency: "126.750", initialTask: "Declare PAN PAN and state intentions", whatYouKnow: ["Engine number 1 is rough-running — urgency situation", "You are enroute to Madrid on Madrid Control: 126.750", "120 persons on board, fuel 8 tonnes"], whatYouNeed: ["Priority clearance for immediate return to Madrid (from Control)", "ILS approach and Tower handoff (from Control)"] },
    steps: [
      { id: "pp-1", speaker: "pilot", text: "PAN PAN, PAN PAN, PAN PAN, IBERIA 315, rough-running engine, request immediate return.", expected: "PAN PAN, PAN PAN, PAN PAN, Madrid Control, IBERIA 315, rough-running engine, request immediate return.", expectedSpoken: "PAN PAN, PAN PAN, PAN PAN, Madrid Control, Iberia tree one fife, rough-running engine, request immediate return.", hint: "Declare the urgency. Say PAN PAN three times, then state your callsign, the nature of the problem, and your immediate request." },
      { id: "pp-2", speaker: "atc", text: "IBERIA 315, PAN PAN acknowledged, pass details.", spoken: "Iberia tree one fife, PAN PAN acknowledged, pass details." },
      { id: "pp-3", speaker: "pilot", text: "IBERIA 315, rough-running engine number 1, returning to Madrid, 120 persons on board, fuel 8 tonnes.", expected: "IBERIA 315, rough-running engine number 1, returning to Madrid, 120 persons on board, fuel 8 tonnes.", expectedSpoken: "Iberia tree one fife, rough-running engine number one, returning to Madrid, one two zero persons on board, fuel eight tonnes.", hint: "ATC acknowledged — now pass full details: nature of fault, intended destination, souls on board, and fuel state." },
      { id: "pp-4", speaker: "atc", text: "IBERIA 315, turn left heading 180, descend FL80, expedite.", spoken: "Iberia tree one fife, turn left heading one eight zero, descend flight level eight zero, expedite." },
      { id: "pp-5", speaker: "pilot", text: "Left heading 180, descend FL80, expedite, IBERIA 315.", expected: "Left heading 180, descend FL80, IBERIA 315.", expectedSpoken: "Left heading one eight zero, descend flight level eight zero, Iberia tree one fife." },
      { id: "pp-6", speaker: "atc", text: "IBERIA 315, you are number one for runway 32L, ILS approach, QNH 1013.", spoken: "Iberia tree one fife, you are number one for runway tree two left, I L S approach, Q N H one zero one tree." },
      { id: "pp-7", speaker: "pilot", text: "Number one, runway 32L, ILS approach, QNH 1013, IBERIA 315.", expected: "Number one, runway 32L, ILS approach, QNH 1013, IBERIA 315.", expectedSpoken: "Number one, runway tree two left, I L S approach, Q N H one zero one tree, Iberia tree one fife." },
      { id: "pp-8", speaker: "atc", text: "IBERIA 315, contact Tower 118.450, emergency services standing by.", spoken: "Iberia tree one fife, contact Tower one one eight decimal four fife zero, emergency services standing by." },
      { id: "pp-9", speaker: "pilot", text: "Contact Tower 118.450, IBERIA 315.", expected: "Contact Tower 118.450, IBERIA 315.", expectedSpoken: "Contact Tower one one eight decimal four fife zero, Iberia tree one fife." },
      { id: "pp-10", speaker: "pilot", text: "Madrid Tower, IBERIA 315, PAN PAN, 10 miles north, ILS runway 32L.", expected: "Tower, IBERIA 315, PAN PAN, 10 miles north, ILS runway 32L.", expectedSpoken: "Tower, Iberia tree one fife, PAN PAN, one zero miles north, I L S runway tree two left.", hint: "Check in with Tower. Maintain your PAN PAN status — include your position and approach type." },
    ],
  }),

  mission({
    id: "ao-lost-comms",
    title: "Radio Failure / Lost Comms",
    subtitle: "Blind calls, squawk 7600 and last clearance confirmation",
    level: "advanced-ops",
    difficulty: "Advanced",
    duration: "12–16 min",
    description: "Manage a radio failure scenario with blind transmissions and last-clearance confirmation when comms are restored.",
    bullets: ["Blind transmission technique", "Last clearance confirmation", "Squawk 7600 procedure", "Comms restoration"],
    locked: false,
    completed: false,
    stars: 0,
    phaseBadge: "ENROUTE",
    imageKey: "ao-lost-comms",
    context: { callsign: "EASY 62K", aircraft: "Airbus A320", location: "Enroute over northern France", station: "Paris Control", frequency: "133.700", initialTask: "Recover communication and confirm last clearance", whatYouKnow: ["You are over northern France at FL120, routing direct NEVIL", "Paris Control: 133.700", "Last clearance: direct NEVIL, squawk 4571"], whatYouNeed: ["ATC will go silent — attempt radio check, then transmit blind on 7600", "Last clearance confirmation when contact is restored"] },
    steps: [
      { id: "lc-1", speaker: "pilot", text: "Paris Control, EASY 62K, FL120, direct NEVIL.", expected: "Paris Control, EASY 62K, FL120, to NEVIL.", expectedSpoken: "Paris Control, Easy six two kilo, flight level one two zero, to Nevil.", hint: "Check in normally with Control — report your flight level and routing." },
      { id: "lc-2", speaker: "atc", text: "EASY 62K, Paris Control, identified, maintain FL120, continue direct NEVIL.", spoken: "Easy six two kilo, Paris Control, identified, maintain flight level one two zero, continue direct Nevil." },
      { id: "lc-3", speaker: "pilot", text: "Maintain FL120, direct NEVIL, EASY 62K.", expected: "Maintain FL120, direct NEVIL, EASY 62K.", expectedSpoken: "Maintain flight level one two zero, direct Nevil, Easy six two kilo." },
      { id: "lc-4", speaker: "pilot", text: "Paris Control, EASY 62K, radio check, how do you read?", expected: "Paris Control, EASY 62K, radio check.", expectedSpoken: "Paris Control, Easy six two kilo, radio check.", hint: "ATC has gone silent. Attempt a radio check to see if they can read you." },
      { id: "lc-5", speaker: "pilot", text: "EASY 62K, transmitting blind, maintaining FL120, direct NEVIL, squawking 7600.", expected: "EASY 62K, transmitting blind, maintaining FL120, direct NEVIL, squawking 7600.", expectedSpoken: "Easy six two kilo, transmitting blind, maintaining flight level one two zero, direct Nevil, squawking seven six zero zero.", hint: "No response. Transmit blind — state you are transmitting blind, your position and intentions, and that you are squawking 7600." },
      { id: "lc-6", speaker: "atc", text: "EASY 62K, EASY 62K, you have been unreadable, state position and last clearance.", spoken: "Easy six two kilo, Easy six two kilo, you have been unreadable, state position and last clearance." },
      { id: "lc-7", speaker: "pilot", text: "EASY 62K, position NEVIL 15 miles, FL120, last clearance direct NEVIL, squawk 4571.", expected: "EASY 62K, position NEVIL 15 miles, FL120, last clearance direct NEVIL, squawk 4571.", expectedSpoken: "Easy six two kilo, position Nevil fife teen miles, flight level one two zero, last clearance direct Nevil, squawk four fife seven one.", hint: "Comms restored. State your position, current level, and your last received clearance. Include the squawk you were assigned." },
      { id: "lc-8", speaker: "atc", text: "EASY 62K, confirmed, squawk 4571, descend FL80.", spoken: "Easy six two kilo, confirmed, squawk four fife seven one, descend flight level eight zero." },
      { id: "lc-9", speaker: "pilot", text: "Squawk 4571, descend FL80, EASY 62K.", expected: "Squawk 4571, descend FL80, EASY 62K.", expectedSpoken: "Squawk four fife seven one, descend flight level eight zero, Easy six two kilo." },
      { id: "lc-10", speaker: "atc", text: "EASY 62K, resume direct NEVIL, expect ILS approach, well recovered.", spoken: "Easy six two kilo, resume direct Nevil, expect I L S approach, well recovered." },
    ],
  }),

];

export function missionsByLevel(level: AtcLevelId): AtcMission[] {
  return MISSIONS.filter((m) => m.level === level);
}

export function findMission(id: string): AtcMission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** The single mission surfaced on the home "Recommended for you" card. */
export const RECOMMENDED_MISSION_ID = "cadet-first-contact";

/* ------------------------------------------------------------------ */
/* Scoring (mock)                                                      */
/* ------------------------------------------------------------------ */

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  return "Keep Practicing";
}

function starsForScore(score: number): number {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  return 1;
}

/* ------------------------------------------------------------------ */
/* Mission evaluator (v4): concept-aware required/soft items + retry   */
/* ------------------------------------------------------------------ */

/** Resolves a mission descriptor's callsign for evaluator/scoring use. */
function callsignForDescriptor(descriptor: AtcSessionDescriptor): string | undefined {
  if (descriptor.source === "mission" && descriptor.missionId) {
    return findMission(descriptor.missionId)?.context?.callsign;
  }
  return undefined;
}

/**
 * Effective required/soft concept items for a pilot step — a hand-authored
 * `requiredItems`/`softItems` on the step wins if either is present; otherwise both
 * are auto-derived from the step's canonical `expected` text (see missionConcepts.ts's
 * deriveConceptItems). This is what gives EVERY pilot step across EVERY mission
 * required/soft item gating by default, without hand-authoring 90+ step definitions —
 * specific steps (see the flagship examples below) still override for extra precision.
 */
export function getEffectivePilotStepItems(
  step: AtcStep,
  callsign: string | undefined,
): { requiredItems: ConceptItem[]; softItems: ConceptItem[] } {
  if (step.requiredItems || step.softItems) {
    return { requiredItems: step.requiredItems ?? [], softItems: step.softItems ?? [] };
  }
  return deriveConceptItems(step.expected ?? step.text, callsign);
}

/**
 * Returns the required items NOT found anywhere in the pilot's transcript — see
 * missionConcepts.ts's findMissingConceptItems for the concept-aware matching
 * (keyword-anchored value search, not bare word-matching — e.g. a callsign spelled
 * "...Alpha Bravo Charlie Delta" never satisfies an unrelated "Information Alpha"
 * requirement just because "Alpha" appears in the transcript).
 */
export function findMissingRequiredItems(
  transcript: string,
  items: ConceptItem[] | undefined,
  callsign?: string,
): ConceptItem[] {
  return findMissingConceptItems(transcript, items, callsign);
}

/**
 * Whether a transcript is "unrelated" to the expected readback rather than just
 * missing one or two required items — i.e. NONE of the step's required items were
 * found AND the overall phrase-overlap score against the expected readback is very
 * low. Drives the distinct "say again" / "unable to understand" corrective wording
 * (Part C) instead of the specific "include X" wording used for a partial miss.
 */
export function isUnrelatedResponse(transcript: string, step: AtcStep, requiredItems: ConceptItem[], callsign: string | undefined): boolean {
  const matchedCount = requiredItems.length - findMissingConceptItems(transcript, requiredItems, callsign).length;
  if (matchedCount > 0) return false;
  const expected = step.expectedSpoken || step.expected || step.text;
  const overlapScore = evaluatePhraseAnswer({ transcript, expected }).score;
  return overlapScore < 15;
}

function titleCaseIcaoWords(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function spokenCallsignFor(callsign: string): string {
  return titleCaseIcaoWords(expandRegistrationCallsigns(callsign));
}

/**
 * Concept-specific corrective phrasing (v5 evaluator fix — Part C) used ONLY when
 * exactly one concept is missing — more natural/specific than the generic "include X"
 * fallback below, and matches the exact product-specified wording for the three most
 * common single misses on a request-type step (missing callsign, missing ATIS/info
 * code, missing request intent). Falls through to the generic template for every other
 * concept and for any multi-item miss (no single specific line reads naturally there).
 */
const SINGLE_MISS_CORRECTION: Partial<Record<ConceptId, (callsign: string, spokenCallsign: string) => { text: string; spoken: string }>> = {
  callsign: () => ({ text: "Station calling, say again callsign.", spoken: "Station calling, say again callsign." }),
  "atis-info": (callsign, spokenCallsign) => ({
    text: `${callsign}, say again information received.`,
    spoken: `${spokenCallsign}, say again information received.`,
  }),
  "request-intent": (callsign, spokenCallsign) => ({
    text: `${callsign}, say again your request.`,
    spoken: `${spokenCallsign}, say again your request.`,
  }),
};

/**
 * Builds a corrective ATC line naming exactly what the pilot left out, instead of the
 * scripted "correct" response. Uses a concept-specific line (see SINGLE_MISS_CORRECTION)
 * when exactly one concept is missing; otherwise falls back to a generic line that
 * escalates from a gentle "say again" on the first miss to a firmer, more explicit
 * "negative" on repeated misses — this escalation plus the always-specific missing-item
 * list is the anti-infinite-loop mechanism (see Part D): the pilot is always told
 * precisely what to add, so the step is always answerable. Prefers a step's
 * hand-authored `correctionPrompts` (cycled by attempt, last entry repeating) if
 * present, for steps that want specific scripted ATC phrasing.
 *
 * Returns both a display `text` (raw callsign, e.g. "G-ABCD", matching how every other
 * step's display text is written) and a `spoken` variant with the callsign expanded to
 * its ICAO-spelled form (e.g. "Golf Alfa Bravo Charlie Delta") for correct TTS
 * pronunciation — same convention as every scripted AtcStep's text/spoken pair.
 */
export function buildCorrectiveAtcResponse(
  callsign: string,
  missing: ConceptItem[],
  attempt: number,
  correctionPrompts?: string[],
): { text: string; spoken: string } {
  if (correctionPrompts && correctionPrompts.length > 0) {
    const text = correctionPrompts[Math.min(attempt - 1, correctionPrompts.length - 1)];
    return { text, spoken: text };
  }

  const spokenCallsign = spokenCallsignFor(callsign);

  if (missing.length === 1) {
    const specific = SINGLE_MISS_CORRECTION[missing[0].concept];
    if (specific) return specific(callsign, spokenCallsign);
  }

  const labels = missing.map((m) => m.label);
  const labelList =
    labels.length <= 1 ? (labels[0] ?? "the missing information") : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

  if (attempt <= 1) {
    return {
      text: `${callsign}, say again — include ${labelList}.`,
      spoken: `${spokenCallsign}, say again — include ${labelList}.`,
    };
  }
  return {
    text: `${callsign}, negative. You must include ${labelList}. Read back your message again.`,
    spoken: `${spokenCallsign}, negative. You must include ${labelList}. Read back your message again.`,
  };
}

/**
 * Builds a corrective ATC line for a transcript that didn't relate to the expected
 * readback at all (Part C: unrelated answers should get "say again"/"clarify", not the
 * specific "include X" wording used for a partial/missing-item miss).
 */
export function buildUnrelatedAtcResponse(callsign: string, attempt: number): { text: string; spoken: string } {
  const spokenCallsign = spokenCallsignFor(callsign);
  const text = attempt <= 1 ? `${callsign}, say again.` : `${callsign}, unable to understand. Say again your request.`;
  const spoken = attempt <= 1 ? `${spokenCallsign}, say again.` : `${spokenCallsign}, unable to understand. Say again your request.`;
  return { text, spoken };
}

// ─── Scoring penalties (v4) ──────────────────────────────────────────────────────
// Deliberately simple, additive point penalties rather than a new scoring model —
// per product guidance, prefer simple real scoring over fake-looking precision.
const SOFT_MISS_PENALTY = 6;
const RETRY_PENALTY = 10;
const MAX_RETRY_PENALTY_ATTEMPTS = 3; // caps the retry penalty at 3 retries' worth
const UNRELATED_EXTRA_PENALTY = 8;
const HINT_PENALTY = 5;
const DEFAULT_HINT_THRESHOLD = 2; // matches AtcStep.maxRetriesBeforeHint's default

type StepAttempt = { finalTranscript: string; retryCount: number; hadUnrelated: boolean };

/**
 * Groups the flat turn list back into one attempt-record per logical pilot step: any
 * isRetry pilot turns immediately preceding a normal (non-retry) pilot turn are that
 * step's failed attempts. Steps are strictly sequential in this app (no branching), so
 * consecutive retries always belong to whichever step's accepted turn follows them. If
 * the session ended mid-retry (user exited before succeeding on the last step), the
 * trailing retries have no following accepted turn and are dropped — groups.length
 * will then be less than pilotSteps.length, and buildResult() falls back to its stable
 * turn-count estimate exactly as it already did before retries existed.
 */
function groupPilotAttempts(transcript: TranscriptTurn[]): StepAttempt[] {
  const groups: StepAttempt[] = [];
  let pendingRetries = 0;
  let pendingUnrelated = false;
  for (const turn of transcript) {
    if (turn.speaker !== "pilot") continue;
    if (turn.isRetry) {
      pendingRetries += 1;
      if (turn.retryReason === "unrelated") pendingUnrelated = true;
      continue;
    }
    groups.push({ finalTranscript: turn.text, retryCount: pendingRetries, hadUnrelated: pendingUnrelated });
    pendingRetries = 0;
    pendingUnrelated = false;
  }
  return groups;
}

/**
 * Scores a completed mission session from the ACTUAL detected transcripts, using the
 * same tolerant phrase evaluator Train uses (accepts aviation variants, callsign/
 * number normalization) PLUS v4 interaction-quality penalties: missed soft items,
 * retries needed to correct a missing required item, an extra penalty for unrelated
 * answers, and a small penalty once a step needed a hint. Each pilot step's FINAL
 * accepted transcript is scored against its expected read-back — pilot attempts land
 * in `transcript` in the same order as pilot steps in `descriptor.steps` (see
 * groupPilotAttempts). Falls back to a stable turn-count estimate only if that
 * alignment doesn't hold (e.g. a legacy/replayed result, or a session that ended
 * mid-retry).
 *
 * STT confidence is intentionally not scored: the server STT path (Whisper
 * transcription) used throughout this app does not return a per-utterance confidence
 * value today, so adding one here would mean inventing a fake number rather than
 * using real data (see AGENTS.md — prefer simple real scoring over fake precision).
 */
export function buildResult(
  descriptor: AtcSessionDescriptor,
  transcript: TranscriptTurn[],
  durationSec: number,
): AtcSessionResult {
  const callsign = callsignForDescriptor(descriptor);
  const pilotSteps = descriptor.steps.filter((s) => s.speaker === "pilot");
  const attemptGroups = groupPilotAttempts(transcript);

  let score: number;
  if (pilotSteps.length > 0 && attemptGroups.length === pilotSteps.length) {
    const perStepScores = pilotSteps.map((step, i) => {
      const group = attemptGroups[i];
      const expected = step.expectedSpoken || step.expected || step.text;
      const base = evaluatePhraseAnswer({ transcript: group.finalTranscript, expected }).score;

      const { softItems } = getEffectivePilotStepItems(step, callsign);
      const missingSoft = findMissingConceptItems(group.finalTranscript, softItems, callsign);

      let stepScore = base;
      stepScore -= missingSoft.length * SOFT_MISS_PENALTY;
      stepScore -= Math.min(group.retryCount, MAX_RETRY_PENALTY_ATTEMPTS) * RETRY_PENALTY;
      if (group.hadUnrelated) stepScore -= UNRELATED_EXTRA_PENALTY;
      if (group.retryCount >= (step.maxRetriesBeforeHint ?? DEFAULT_HINT_THRESHOLD)) stepScore -= HINT_PENALTY;
      return Math.max(0, Math.min(100, Math.round(stepScore)));
    });
    score = Math.round(perStepScores.reduce((sum, s) => sum + s, 0) / perStepScores.length);
  } else {
    const stepCount = pilotSteps.length || 1;
    score = Math.min(98, 82 + (stepCount % 4) * 2); // 82..88, stable per script
  }

  const breakdown: AtcBreakdown = {
    readbacks: Math.min(100, score + 5),
    phraseology: Math.max(60, score - 2),
    accuracy: Math.min(100, score + 3),
    situational: Math.max(60, score - 7),
    timing: Math.max(60, score - 1),
  };
  return {
    title: descriptor.title,
    source: descriptor.source,
    missionId: descriptor.missionId,
    level: descriptor.level,
    score,
    stars: starsForScore(score),
    label: scoreLabel(score),
    breakdown,
    wentWell: ["Good readbacks", "Kept situational awareness", "Clear, standard phraseology"],
    transcript,
    durationSec,
  };
}

/* ------------------------------------------------------------------ */
/* Session persistence (sessionStorage, no backend)                    */
/* ------------------------------------------------------------------ */

const DESCRIPTOR_KEY = "aerocomms.atcsim.descriptor";
const RESULT_KEY = "aerocomms.atcsim.result";

function readJSON<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / availability errors
  }
}

export function saveDescriptor(d: AtcSessionDescriptor) {
  writeJSON(DESCRIPTOR_KEY, d);
}

export function loadDescriptor(): AtcSessionDescriptor | null {
  return readJSON<AtcSessionDescriptor>(DESCRIPTOR_KEY);
}

export function saveResult(r: AtcSessionResult) {
  writeJSON(RESULT_KEY, r);
}

export function loadResult(): AtcSessionResult | null {
  return readJSON<AtcSessionResult>(RESULT_KEY);
}

/* ------------------------------------------------------------------ */
/* TTS v3 — both autoplay and manual Replay use backend OpenAI TTS.     */
/* Autoplay plays on a gesture-unlocked persistent <audio> element (see */
/* missionAudio.ts) so it is not blocked by the browser's autoplay      */
/* policy (confirmed via a real Safari/Chrome NotAllowedError when      */
/* autoplay previously tried a fresh per-call <audio> element outside   */
/* a click handler). Manual Replay/Play uses voiceProvider (backend     */
/* first, automatic browser fallback) since it always runs inside a     */
/* click handler. Old plain browser speechSynthesis is kept ONLY as an  */
/* internal last-resort default for callers that don't wire onReplay.   */
/* ------------------------------------------------------------------ */

/**
 * Resolves the TTS profile for an ATC transmission (autoplay or Replay — both use the
 * same mapping so the voice never changes between them). Mission ATC voice speed now
 * scales by mission level/difficulty (v4):
 *   - explicit ATIS/broadcast-style text -> atis-robot (no mission currently
 *     scripts a full ATIS broadcast, but this keeps the mapping future-proof)
 *   - Cadet / Ground basic -> standard-atc (~1.04x — already in the target range,
 *     no dedicated mission-level profile needed)
 *   - Student Pilot -> mission-student-atc (~1.07x)
 *   - Ready For Radio -> mission-rfr-atc (~1.10x)
 *   - Airline Prep -> fast-atc (~1.13x — already in the target range)
 *   - Advanced Ops -> mission-advanced-atc (~1.18x)
 * Every profile above still goes through missionAudio.ts's dampenRateForShortLine, so
 * short/numeric-heavy lines are never over-sped regardless of level.
 */
export function resolveAtcProfileId(text: string, level?: AtcLevelId): string {
  if (/\batis\b/i.test(text) || /automatic terminal information/i.test(text)) {
    return "atis-robot";
  }
  switch (level) {
    case "student-pilot":
      return "mission-student-atc";
    case "rfr":
      return "mission-rfr-atc";
    case "airline-prep":
      return "fast-atc";
    case "advanced-ops":
      return "mission-advanced-atc";
    case "cadet":
    default:
      return "standard-atc";
  }
}

/**
 * Must be called synchronously inside a real user gesture (e.g. an "Enable
 * Radio Audio" button's onClick) before a mission's ATC autoplay begins. See
 * missionAudio.ts for why this is needed and how it works. Resolves to whether
 * the unlock succeeded — callers should proceed with the mission either way
 * (playback degrades gracefully to a manual Play/Replay button if not).
 */
export async function unlockMissionRadioAudio(): Promise<boolean> {
  return unlockMissionAudio();
}

/** Whether the mission audio element has been gesture-unlocked this session. */
export function isMissionRadioAudioUnlocked(): boolean {
  return isMissionAudioUnlocked();
}

/**
 * Plays an ATC line for AUTOPLAY using backend OpenAI TTS on the gesture-
 * unlocked mission audio element. Never throws and never falls back to the
 * old browser voice — always resolves to an outcome so the caller
 * (RadioConversation) can show a manual Play/Replay option if playback was
 * blocked or failed, instead of silently playing a different-sounding voice.
 */
export async function speakAtcAutoplay(text: string, profileId: string): Promise<MissionAudioOutcome> {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log(
      `[mission:atc:autoplay] requesting profile=${profileId} words=${text.trim().split(/\s+/).filter(Boolean).length}`,
    );
  }
  // Clear out any manual-Replay-path audio first so the two paths never overlap.
  stopProviderSpeech();
  const outcome = await playMissionAudio(text, profileId);
  if (isDev) console.log(`[mission:atc:autoplay] outcome=${outcome}`);
  return outcome;
}

/**
 * Speaks an ATC transmission for a user-triggered Replay/Play tap (including
 * the manual fallback button shown when autoplay fails) — same OpenAI voice/
 * profile as autoplay. Runs inside a click handler, so the browser's autoplay
 * policy reliably allows playback: safe to use backend OpenAI TTS with
 * automatic browser-speechSynthesis fallback if the backend fails (acceptable
 * only for this explicit manual tap, dev-logged when it happens).
 *
 * Fire-and-forget by design: callers must NOT await this to gate the mic or
 * the "ATC transmitting…" UI — that timing stays on the fixed waveform timer
 * (see RadioConversation.tsx), independent of this promise.
 */
export function speakAtcReplay(text: string, profileId: string = "standard-atc") {
  const isDev = process.env.NODE_ENV !== "production";
  // Clear out any autoplay-path audio first so the two paths never overlap.
  stopMissionAudio();
  if (isDev) {
    console.log(
      `[mission:atc:replay] requesting backend TTS profile=${profileId} words=${text.trim().split(/\s+/).filter(Boolean).length}`,
    );
  }
  void speakWithProvider(text, { profileId })
    .then(() => {
      if (isDev) console.log("[mission:atc:replay] playback finished (backend or last-resort browser fallback)");
    })
    .catch((err: unknown) => {
      if (isDev) console.warn("[mission:atc:replay] failed unexpectedly", err);
    });
}

/**
 * Internal last-resort plain browser speechSynthesis call. Not used by the
 * normal autoplay or Replay paths (see module doc comment above) — kept only
 * as a defensive fallback for ConversationBubble's Replay button in case it's
 * ever rendered without the onReplay handler wired up.
 */
export function speakAtc(text: string) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.lang = "en-GB";
    window.speechSynthesis.speak(u);
  } catch {
    // unavailable
  }
}

/**
 * Cancel ALL active ATC/TTS speech — gesture-unlocked autoplay audio, backend/
 * browser Replay audio, and legacy plain browser speechSynthesis. Safe to call
 * from cleanup effects on unmount, or any time nothing is playing (no-op).
 */
export function stopAtcSpeech() {
  stopMissionAudio();
  stopProviderSpeech();
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
