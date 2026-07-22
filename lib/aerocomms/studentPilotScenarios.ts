// AeroComms — Student Pilot Alpha section-scenario & mission contracts.
//
// Batch 3: The Preflight section scenario now has a real conversation script.
// All other scenarios remain foundation placeholders.

import type { SpScenarioStep, StudentPilotPhase } from "./content";

/* ------------------------------------------------------------------ */
/* Section scenarios (one per teaching module)                         */
/* ------------------------------------------------------------------ */

export interface SectionScenarioMeta {
  id: string;
  /** Owning module id (e.g. "sp-preflight"). */
  moduleId: string;
  title: string;
  phase: StudentPilotPhase;
  /** One-line summary of the guided radio flow this scenario will cover. */
  summary: string;
  /** True for placeholder scenarios not yet implemented. Omit for real scenarios. */
  isFoundationPlaceholder?: true;
}

/* ------------------------------------------------------------------ */
/* Preflight section scenario — real content (Batch 3)                */
/* ------------------------------------------------------------------ */

/**
 * Operational state used throughout the Preflight section scenario
 * and referenced by all Preflight exercises.
 */
export const PREFLIGHT_OP_STATE = {
  callsign: "G-ABCD",
  callsignSpoken: "Golf Alpha Bravo Charlie Delta",
  stand: "Stand 3",
  aerodrome: "Brindale",
  runway: "24",
  runwaySpoken: "two four",
  atis: "Information Alpha",
  atisSpoken: "Information Alpha",
  qnh: "1013",
  qnhSpoken: "one zero one three",
  wind: "220° / 10 KT",
  windSpoken: "two two zero degrees, one zero knots",
  squawk: "7621",
  squawkSpoken: "seven six two one",
  departureDir: "NORTH",
  altRestriction: "NOT ABOVE 1,500 FT",
  altRestrictionSpoken: "not above one thousand five hundred feet",
  gndFreq: "121.600",
  gndFreqSpoken: "one two one decimal six zero zero",
} as const;

/**
 * Approved 10-step Preflight conversation script.
 *
 * Sequence:
 *   1 · Pilot requests aerodrome information
 *   2 · ATC provides information letter, runway, wind, QNH  (hidden)
 *   3 · Pilot reads back information letter, runway, QNH
 *   4 · Pilot requests departure clearance (includes ATIS letter)
 *   5 · ATC issues moderately complex clearance  (hidden)
 *   6 · Pilot reads back full clearance in approved order
 *   7 · ATC: "readback correct — advise when ready for engine start"  (hidden)
 *   8 · Pilot reports ready for engine start
 *   9 · ATC: "startup approved"  (hidden)
 *  10 · Pilot reads back startup approval
 *
 * Station: Brindale Ground throughout.
 * All ATC transmissions are hidden initially — learner must press Play.
 * Pilot steps use the simulated readback mic (no real speech recognition).
 */
export const PREFLIGHT_SCENARIO_STEPS: SpScenarioStep[] = [

  /* ── S0 — Narrator context ─────────────────────────────────────────── */
  {
    id: "s0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD at Stand 3, Brindale. Make first contact with Ground and request aerodrome information.",
  },

  /* ── S1 — Pilot: request aerodrome information ─────────────────────── */
  {
    id: "s1-pilot-info-request",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Ground, G-ABCD, Stand 3, request aerodrome information.",
    spoken: "Brindale Ground, Golf Alpha Bravo Charlie Delta, Stand Three, request aerodrome information.",
    expectedReadback: "Brindale Ground, G-ABCD, Stand 3, request aerodrome information.",
    readbackPrompt: "First call to Ground. Include: station · callsign · position · request.",
    acceptedVariants: ["Brindale Ground, G-ABCD, Stand 3, request weather information"],
    expectedElements: {
      station: "Brindale Ground",
      callsign: "G-ABCD",
      position: "Stand 3",
      request: "request aerodrome information",
    },
  },

  /* ── S2 — ATC: provides aerodrome information (hidden) ─────────────── */
  {
    id: "s2-atc-info",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, information Bravo, runway 24 in use, wind 230 degrees 8 knots, QNH 1011.",
    spoken: "Golf Alpha Bravo Charlie Delta, information Bravo, runway two four in use, wind two three zero degrees, eight knots, QNH one zero one one.",
  },

  /* ── S3 — Pilot: reads back aerodrome information ──────────────────── */
  {
    id: "s3-pilot-info-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Information Bravo, runway 24, QNH 1011, G-ABCD.",
    spoken: "Information Bravo, runway two four, QNH one zero one one, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Information Bravo, runway 24, QNH 1011, G-ABCD.",
    readbackPrompt: "Read back: information letter · runway · QNH · callsign.",
    expectedElements: {
      informationLetter: "Bravo",
      runway: "24",
      qnh: "1011",
      callsign: "G-ABCD",
    },
  },

  /* ── S4 — Pilot: requests departure clearance ──────────────────────── */
  {
    id: "s4-pilot-clearance-request",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Ground, G-ABCD, Stand 3, information Bravo, request departure clearance.",
    spoken: "Brindale Ground, Golf Alpha Bravo Charlie Delta, Stand Three, information Bravo, request departure clearance.",
    expectedReadback: "Brindale Ground, G-ABCD, Stand 3, information Bravo, request departure clearance.",
    readbackPrompt: "Request departure clearance. Include: station · callsign · position · ATIS letter · request.",
    acceptedVariants: ["G-ABCD, Stand 3, information Bravo, request departure clearance."],
    expectedElements: {
      station: "Brindale Ground",
      callsign: "G-ABCD",
      position: "Stand 3",
      informationLetter: "Bravo",
      request: "request departure clearance",
    },
  },

  /* ── S5 — ATC: issues moderately complex clearance (hidden) ─────────── */
  {
    id: "s5-atc-clearance",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, runway 24, cleared local VFR flight, departure to the north, not above 2,000 feet, squawk 4312, report passing 1,000 feet, after departure contact Tower 118.700.",
    spoken:
      "Golf Alpha Bravo Charlie Delta, runway two four, cleared local V F R flight, departure to the north, " +
      "not above two thousand feet, squawk four three one two, report passing one thousand feet, " +
      "after departure contact Tower one one eight decimal seven zero zero.",
  },

  /* ── S6 — Pilot: reads back full clearance ─────────────────────────── */
  {
    id: "s6-pilot-clearance-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Runway 24, departure to the north, not above 2,000 feet, squawk 4312, report passing 1,000 feet, after departure contact Tower 118.700, G-ABCD.",
    spoken:
      "Runway two four, departure to the north, not above two thousand feet, squawk four three one two, " +
      "report passing one thousand feet, after departure contact Tower one one eight decimal seven zero zero, " +
      "Golf Alpha Bravo Charlie Delta.",
    expectedReadback:
      "Runway 24, departure to the north, not above 2,000 feet, squawk 4312, report passing 1,000 feet, after departure contact Tower 118.700, G-ABCD.",
    readbackPrompt: "Read back full clearance. Order: runway · direction · altitude · squawk · report · contact · callsign.",
    expectedElements: {
      runway: "24",
      departureDirection: "to the north",
      altitudeRestriction: "not above 2,000 feet",
      squawk: "4312",
      reportInstruction: "report passing 1,000 feet",
      contactInstruction: "after departure contact Tower 118.700",
      callsign: "G-ABCD",
    },
  },

  /* ── S7 — ATC: readback correct, advise when ready (hidden) ─────────── */
  {
    id: "s7-atc-readback-correct",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, readback correct. Advise when ready for engine start.",
    spoken: "Golf Alpha Bravo Charlie Delta, readback correct. Advise when ready for engine start.",
  },

  /* ── S8 — Pilot: reports ready for engine start ────────────────────── */
  {
    id: "s8-pilot-ready",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Ready for engine start, G-ABCD.",
    spoken: "Ready for engine start, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Ready for engine start, G-ABCD.",
    readbackPrompt: "Report ready for engine start. Include: ready report · callsign.",
    expectedElements: {
      readyReport: "ready for engine start",
      callsign: "G-ABCD",
    },
  },

  /* ── S9 — ATC: startup approved (hidden) ───────────────────────────── */
  {
    id: "s9-atc-startup",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, startup approved.",
    spoken: "Golf Alpha Bravo Charlie Delta, startup approved.",
  },

  /* ── S10 — Pilot: reads back startup approval ───────────────────────── */
  {
    id: "s10-pilot-startup-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Startup approved, G-ABCD.",
    spoken: "Startup approved, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Startup approved, G-ABCD.",
    readbackPrompt: "Read back the startup approval. Include: approval · callsign.",
    expectedElements: {
      approval: "startup approved",
      callsign: "G-ABCD",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Taxi to Line-Up mission — real conversation content                 */
/* ------------------------------------------------------------------ */

/**
 * Approved Taxi to Line-Up mission script (Module 2 capstone).
 *
 * Continuous, realistic ground operation from Stand 3 to line-up:
 *   1 · Pilot requests taxi
 *   2 · ATC taxi clearance (hidden)            → 3 · Pilot reads back
 *   4 · Traffic / change event (hidden)        → 5 · Pilot reads back
 *   6 · Arrival at holding point (hidden)      → 7 · Pilot reads back
 *   8 · Runway entry / backtrack / line-up     → 9 · Pilot reads back
 *  10 · Pilot reports ready for departure
 *
 * One realistic variation (give way) — not a replay of every module skill.
 * Ends with "Ready for departure, G-ABCD." No take-off clearance.
 * Station: Brindale Ground throughout. Chart crops update per step.
 */
export const TAXI_LINEUP_MISSION_STEPS: SpScenarioStep[] = [

  {
    id: "t0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD at Stand 3, Brindale, ready to taxi. Complete the ground phase from the stand to line-up.",
    chartCrop: "apron",
  },

  /* 1 · Pilot requests taxi */
  {
    id: "t1-pilot-request-taxi",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Ground, G-ORDA, Stand 3, ready to taxi.",
    spoken: "Brindale Ground, Golf Oscar Romeo Delta Alfa, Stand three, ready to taxi.",
    expectedReadback: "Brindale Ground, G-ORDA, Stand 3, ready to taxi.",
    readbackPrompt: "Request taxi. Include: station · callsign · position · request.",
    micInstruction: "Request taxi from Ground.",
    acceptedVariants: ["Brindale Ground, G-ORDA, Stand 3, request taxi."],
    chartCrop: "apron",
  },

  /* 2 · ATC taxi clearance (hidden) */
  {
    id: "t2-atc-taxi-clearance",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ORDA, taxi to holding point B2 via Alfa, Delta and Bravo.",
    spoken: "Golf Oscar Romeo Delta Alfa, taxi to holding point Bravo two via Alfa, Delta and Bravo.",
    chartCrop: "apron",
  },

  /* 3 · Pilot reads back taxi clearance */
  {
    id: "t3-pilot-taxi-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Taxi to holding point B2 via Alfa, Delta and Bravo, G-ORDA.",
    spoken: "Taxi to holding point Bravo two via Alfa, Delta and Bravo, Golf Oscar Romeo Delta Alfa.",
    expectedReadback: "Taxi to holding point B2 via Alfa, Delta and Bravo, G-ORDA.",
    readbackPrompt: "Read back: destination · route · callsign.",
    micInstruction: "Read back the taxi clearance.",
    chartCrop: "apron",
  },

  /* 4 · Traffic / change event (hidden) */
  {
    id: "t4-atc-give-way",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ORDA, give way to the Cessna from your right, then continue taxi.",
    spoken: "Golf Oscar Romeo Delta Alfa, give way to the Cessna from your right, then continue taxi.",
    chartCrop: "e-crossing",
  },

  /* 5 · Pilot reads back give way */
  {
    id: "t5-pilot-give-way-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Giving way to the Cessna from my right, then continue taxi, G-ORDA.",
    spoken: "Giving way to the Cessna from my right, then continue taxi, Golf Oscar Romeo Delta Alfa.",
    expectedReadback: "Giving way to the Cessna from my right, then continue taxi, G-ORDA.",
    readbackPrompt: "Acknowledge the give-way instruction before continuing.",
    micInstruction: "Read back the give-way instruction.",
    chartCrop: "e-crossing",
  },

  /* 6 · Arrival at holding point (hidden) */
  {
    id: "t6-atc-hold-short",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ORDA, hold short runway 36 at B2.",
    spoken: "Golf Oscar Romeo Delta Alfa, hold short runway three six at Bravo two.",
    chartCrop: "v-vertex",
  },

  /* 7 · Pilot reads back hold short */
  {
    id: "t7-pilot-hold-short-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Holding short runway 36 at B2, G-ORDA.",
    spoken: "Holding short runway three six at Bravo two, Golf Oscar Romeo Delta Alfa.",
    expectedReadback: "Holding short runway 36 at B2, G-ORDA.",
    readbackPrompt: "Read back the hold-short instruction with the holding point.",
    micInstruction: "Read back hold short runway 36 at B2.",
    acceptedVariants: ["Hold short runway 36 at B2. G-ORDA"],
    chartCrop: "v-vertex",
  },

  /* 8 · Runway entry / backtrack / line-up (hidden) */
  {
    id: "t8-atc-entry-backtrack-lineup",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ORDA, enter runway 36 at B2, backtrack and line up runway 36. Report when ready.",
    spoken: "Golf Oscar Romeo Delta Alfa, enter runway three six at Bravo two, backtrack and line up runway three six. Report when ready.",
    chartCrop: "v-vertex",
  },

  /* 9 · Pilot reads back entry / backtrack / line-up */
  {
    id: "t9-pilot-entry-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Enter runway 36 at B2, backtrack and line up runway 36, report when ready, G-ORDA.",
    spoken: "Enter runway three six at Bravo two, backtrack and line up runway three six, report when ready, Golf Oscar Romeo Delta Alfa.",
    expectedReadback: "Enter runway 36 at B2, backtrack and line up runway 36, report when ready, G-ORDA.",
    readbackPrompt: "Read back: runway entry · backtrack · line up · report when ready · callsign.",
    micInstruction: "Read back the entry, backtrack and line-up.",
    acceptedVariants: ["Enter runway 36 at B2, backtrack and line up runway 36, wilco, G-ORDA."],
    chartCrop: "v-vertex",
  },

  /* 10 · Pilot reports ready for departure */
  {
    id: "t10-pilot-ready",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Ready for departure, G-ORDA.",
    spoken: "Ready for departure, Golf Oscar Romeo Delta Alfa.",
    expectedReadback: "Ready for departure, G-ORDA.",
    readbackPrompt: "Report ready. The take-off clearance comes in the next module.",
    micInstruction: "Report ready for departure.",
    chartCrop: "v-vertex",
  },
];

/* ------------------------------------------------------------------ */
/* Takeoff & Initial Departure mission steps                           */
/* ------------------------------------------------------------------ */

export const TAKEOFF_SCENARIO_STEPS: SpScenarioStep[] = [

  {
    id: "to0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD is lined up on runway 36, ready for departure.",
  },

  /* Step 1 · Pilot reports ready */
  {
    id: "to1-pilot-ready",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Ready for departure, G-ABCD.",
    spoken: "Ready for departure, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Ready for departure, G-ABCD.",
    readbackPrompt: "Report ready for departure.",
    micInstruction: "Report ready for departure.",
  },

  /* Step 2 · ATC takeoff clearance (hidden) */
  {
    id: "to2-atc-takeoff",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared for take-off.",
    spoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees, eight knots, cleared for take-off.",
  },

  /* Step 3 · Pilot reads back takeoff clearance */
  {
    id: "to3-pilot-takeoff-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Runway 36, cleared for take-off, G-ABCD.",
    spoken: "Runway three six, cleared for take-off, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Runway 36, cleared for take-off, G-ABCD.",
    readbackPrompt: "Read back: runway · cleared for take-off · callsign.",
    micInstruction: "Read back the takeoff clearance.",
  },

  /* Step 4 · ATC initial climb (hidden) */
  {
    id: "to4-atc-initial-climb",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, after departure climb straight ahead.",
    spoken: "Golf Alpha Bravo Charlie Delta, after departure climb straight ahead.",
  },

  /* Step 5 · Pilot reads back initial climb */
  {
    id: "to5-pilot-climb-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "After departure climb straight ahead, G-ABCD.",
    spoken: "After departure climb straight ahead, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "After departure climb straight ahead, G-ABCD.",
    readbackPrompt: "Read back: after departure · climb straight ahead · callsign.",
    micInstruction: "Read back the initial climb instruction.",
  },

  /* Step 6 · ATC heading instruction (hidden) */
  {
    id: "to6-atc-heading",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, turn right heading 090.",
    spoken: "Golf Alpha Bravo Charlie Delta, turn right heading zero niner zero.",
  },

  /* Step 7 · Pilot reads back heading */
  {
    id: "to7-pilot-heading-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Turn right heading 090, G-ABCD.",
    spoken: "Turn right heading zero niner zero, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Turn right heading 090, G-ABCD.",
    readbackPrompt: "Read back: turn · direction · heading · callsign.",
    micInstruction: "Read back the heading instruction.",
  },

  {
    id: "to8-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Takeoff clearance read back correctly. Runway confirmed. Initial climb and heading instruction acknowledged.",
  },
];

/* ------------------------------------------------------------------ */
/* Circuit Operations mission steps                                    */
/* ------------------------------------------------------------------ */

export const CIRCUIT_SCENARIO_STEPS: SpScenarioStep[] = [

  {
    id: "ci0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD has departed runway 36. Fly one guided left-hand circuit with position reports, sequencing and spacing.",
  },

  /* 1 · ATC circuit instruction (hidden) */
  {
    id: "ci1-atc-circuit",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-AMER, make left-hand circuits, report downwind.",
    spoken: "Golf Alpha Mike Echo Romeo, make left-hand circuits, report downwind.",
  },

  /* 2 · Pilot reads back circuit instruction */
  {
    id: "ci2-pilot-circuit-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Left-hand circuits, report downwind, G-AMER.",
    spoken: "Left-hand circuits, report downwind, Golf Alpha Mike Echo Romeo.",
    expectedReadback: "Left-hand circuits, report downwind, G-AMER.",
    readbackPrompt: "Read back: circuit direction · report point · callsign.",
    micInstruction: "Read back the circuit instruction.",
    acceptedVariants: ["Left-hand circuits, wilco, G-AMER."],
  },

  /* 3 · Pilot downwind report */
  {
    id: "ci3-pilot-downwind",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Left downwind runway 36, request touch and go, G-AMER.",
    spoken: "Left downwind runway three six, request touch and go, Golf Alpha Mike Echo Romeo.",
    expectedReadback: "Left downwind runway 36, request touch and go, G-AMER.",
    readbackPrompt: "Make the downwind report with your intention.",
    micInstruction: "Report downwind with your intention.",
  },

  /* 4 · ATC sequencing (hidden) */
  {
    id: "ci4-atc-sequence",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-AMER, roger, number two, follow the Cessna on final.",
    spoken: "Golf Alpha Mike Echo Romeo, roger, number two, follow the Cessna on final.",
  },

  /* 5 · Pilot reads back sequencing */
  {
    id: "ci5-pilot-sequence-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Number two, following the Cessna on final, G-AMER.",
    spoken: "Number two, following the Cessna on final, Golf Alpha Mike Echo Romeo.",
    expectedReadback: "Number two, following the Cessna on final, G-AMER.",
    readbackPrompt: "Read back: sequence number · traffic to follow · callsign.",
    micInstruction: "Read back the sequencing instruction.",
    acceptedVariants: ["Number two, wilco G-AMER"],
  },

  /* 6 · ATC spacing (hidden) */
  {
    id: "ci6-atc-spacing",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-AMER, extend downwind.",
    spoken: "Golf Alpha Mike Echo Romeo, extend downwind.",
  },

  /* 7 · Pilot reads back spacing */
  {
    id: "ci7-pilot-spacing-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Extend downwind, G-AMER.",
    spoken: "Extend downwind, Golf Alpha Mike Echo Romeo.",
    expectedReadback: "Extend downwind, G-AMER.",
    readbackPrompt: "Read back the spacing instruction.",
    micInstruction: "Read back the spacing instruction.",
    acceptedVariants: ["Wilco, G-AMER"],
  },

  /* 8 · ATC report final (hidden) */
  {
    id: "ci8-atc-report-final",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-AMER, report final runway 36.",
    spoken: "Golf Alpha Mike Echo Romeo, report final runway three six.",
  },

  /* 9 · Pilot reads back report final */
  {
    id: "ci9-pilot-report-final-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Report final runway 36, G-AMER.",
    spoken: "Report final runway three six, Golf Alpha Mike Echo Romeo.",
    expectedReadback: "Report final runway 36, G-AMER.",
    readbackPrompt: "Read back: report point · runway · callsign.",
    micInstruction: "Read back the report-final instruction.",
    acceptedVariants: ["Wilco, G-AMER"],
  },

  /* 10 · Pilot final report */
  {
    id: "ci10-pilot-final",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Final runway 36, G-AMER.",
    spoken: "Final runway three six, Golf Alpha Mike Echo Romeo.",
    expectedReadback: "Final runway 36, G-AMER.",
    readbackPrompt: "Make the final position report.",
    micInstruction: "Report final.",
  },

  {
    id: "ci11-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Circuit direction understood, downwind report made, sequence read back, spacing followed and final report made.",
  },
];

/* ------------------------------------------------------------------ */
/* After Landing & Parking mission steps                               */
/* ------------------------------------------------------------------ */

export const PARKING_SCENARIO_STEPS: SpScenarioStep[] = [

  {
    id: "pk0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD has vacated runway 36 and is ready to taxi to parking.",
  },

  /* 1 · ATC taxi to stand (hidden) */
  {
    id: "pk1-atc-taxi-stand",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, taxi to Stand 4 via Delta and Alfa.",
    spoken: "Golf Alpha Bravo Charlie Delta, taxi to Stand four via Delta and Alfa.",
  },

  /* 2 · Pilot reads back taxi to stand */
  {
    id: "pk2-pilot-taxi-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Taxi to Stand 4 via Delta and Alfa, G-ABCD.",
    spoken: "Taxi to Stand four via Delta and Alfa, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Taxi to Stand 4 via Delta and Alfa, G-ABCD.",
    readbackPrompt: "Read back: stand · taxiways in order · callsign.",
    micInstruction: "Read back the taxi to parking instruction.",
  },

  /* 3 · ATC route correction (hidden) */
  {
    id: "pk3-atc-route-correction",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, continue via Bravo to Stand 4.",
    spoken: "Golf Alpha Bravo Charlie Delta, continue via Bravo to Stand four, report on stand.",
  },

  /* 4 · Pilot reads back route correction */
  {
    id: "pk4-pilot-correction-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Continue via Bravo to Stand 4, wilco, G-ABCD.",
    spoken: "Continue via Bravo to Stand four, wilco, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Continue via Bravo to Stand 4, wilco, G-ABCD.",
    readbackPrompt: "Read back: continue via taxiway · stand · callsign.",
    micInstruction: "Read back the route correction.",
    acceptedVariants: ["Continue via Bravo to Stand 4, report on stand, G-ABCD."],
  },

  /* 5 · Pilot parking complete */
  {
    id: "pk5-pilot-parking-complete",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Parking complete, G-ABCD.",
    spoken: "Parking complete, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Parking complete, G-ABCD.",
    readbackPrompt: "Make the final parking complete call.",
    micInstruction: "Make the parking complete call.",
    acceptedVariants: ["On Stand, G-ABCD"],
  },

  {
    id: "pk6-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Parking route read back correctly, stand confirmed, route correction understood and final parking call made.",
  },
];

/* ------------------------------------------------------------------ */
/* Approach & Landing scenario steps                                   */
/* ------------------------------------------------------------------ */

export const LANDING_SCENARIO_STEPS: SpScenarioStep[] = [

  {
    id: "ls0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD is on final approach to runway 36. The aircraft ahead is vacating the runway.",
  },

  /* 1 · Pilot: report final */
  {
    id: "ls1-pilot-final",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Tower, G-ARDA, final runway 36.",
    spoken: "Brindale Tower, Golf Alpha Romeo Delta Alfa, final runway three six.",
    expectedReadback: "Brindale Tower, G-ARDA, final runway 36.",
    readbackPrompt: "Report final: station · callsign · position · runway.",
    micInstruction: "Report final to Brindale Tower.",
  },

  /* 2 · ATC: continue approach (hidden) */
  {
    id: "ls2-atc-continue",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ARDA, continue approach, traffic vacating runway.",
    spoken: "Golf Alpha Romeo Delta Alfa, continue approach, traffic vacating runway.",
  },

  /* 3 · Pilot reads back continue approach */
  {
    id: "ls3-pilot-continue",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Continue approach, G-ARDA.",
    spoken: "Continue approach, Golf Alpha Romeo Delta Alfa.",
    expectedReadback: "Continue approach, G-ARDA.",
    readbackPrompt: "Read back: continue approach · callsign.",
    micInstruction: "Read back the continue approach instruction.",
  },

  /* 4 · ATC: landing clearance (hidden) */
  {
    id: "ls4-atc-cleared",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ARDA, runway 36, wind 340 degrees 8 knots, cleared to land.",
    spoken: "Golf Alpha Romeo Delta Alfa, runway three six, wind three four zero degrees eight knots, cleared to land.",
  },

  /* 5 · Pilot reads back landing clearance */
  {
    id: "ls5-pilot-cleared",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cleared to land runway 36, G-ARDA.",
    spoken: "Cleared to land runway three six, Golf Alpha Romeo Delta Alfa.",
    expectedReadback: "Cleared to land runway 36, G-ARDA.",
    readbackPrompt: "Read back: cleared to land · runway · callsign.",
    micInstruction: "Read back the landing clearance.",
  },

  /* 6 · ATC: vacate instruction (hidden) */
  {
    id: "ls6-atc-vacate",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ARDA, vacate left via Delta.",
    spoken: "Golf Alpha Romeo Delta Alfa, vacate left via Delta.",
  },

  /* 7 · Pilot reads back vacate */
  {
    id: "ls7-pilot-vacate",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Vacate left via Delta, G-ARDA.",
    spoken: "Vacate left via Delta, Golf Alpha Romeo Delta Alfa.",
    expectedReadback: "Vacate left via Delta, G-ARDA.",
    readbackPrompt: "Read back: vacate direction · taxiway · callsign.",
    micInstruction: "Read back the vacate instruction.",
    acceptedVariants: ["Vacating left via delta, G-ARDA"],
  },

  /* 8 · Pilot: runway vacated report */
  {
    id: "ls8-pilot-vacated",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Runway vacated, G-ARDA.",
    spoken: "Runway vacated, Golf Alpha Romeo Delta Alfa.",
    expectedReadback: "Runway vacated, G-ARDA.",
    readbackPrompt: "Report runway vacated: message · callsign.",
    micInstruction: "Report that you have vacated the runway.",
  },

  {
    id: "ls9-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Final call correct, continue approach read back, landing clearance acknowledged, vacate instruction followed and runway vacated reported. You have vacated the runway.",
  },
];

/* ------------------------------------------------------------------ */
/* Basic Arrival & Joining scenario steps                              */
/* ------------------------------------------------------------------ */

export const ARRIVAL_SCENARIO_STEPS: SpScenarioStep[] = [

  {
    id: "ar0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "G-ABCD is five miles north of Brindale at two thousand feet, returning to the home aerodrome.",
  },

  /* 1 · Pilot initial inbound call */
  {
    id: "ar1-pilot-inbound",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Tower, G-ABCD, five miles north, two thousand feet, inbound to join.",
    spoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, five miles north, two thousand feet, inbound to join.",
    expectedReadback: "Brindale Tower, G-ABCD, five miles north, two thousand feet, inbound to join.",
    readbackPrompt: "Make the initial inbound call: station · callsign · position · altitude · intention.",
    micInstruction: "Call Brindale Tower with your position and intention.",
  },

  /* 2 · ATC: report North Point (hidden) */
  {
    id: "ar2-atc-report-point",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, report North Point.",
    spoken: "Golf Alpha Bravo Charlie Delta, report North Point.",
  },

  /* 3 · Pilot reads back report instruction */
  {
    id: "ar3-pilot-report-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Report North Point, G-ABCD.",
    spoken: "Report North Point, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Report North Point, G-ABCD.",
    readbackPrompt: "Read back the reporting instruction: report point · callsign.",
    micInstruction: "Read back the report instruction.",
    acceptedVariants: ["Wilco, G-ABCD"],
  },

  /* 4 · Pilot reports North Point */
  {
    id: "ar4-pilot-at-point",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Tower, G-ABCD, North Point, two thousand feet.",
    spoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, North Point, two thousand feet.",
    expectedReadback: "Brindale Tower, G-ABCD, North Point, two thousand feet.",
    readbackPrompt: "Report at North Point: station · callsign · position · altitude.",
    micInstruction: "Report reaching North Point.",
    acceptedVariants: ["G-ABCD, North Point, two thousand feet."],
  },

  /* 5 · ATC: join downwind (hidden) */
  {
    id: "ar5-atc-join",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, join downwind runway 36, report downwind.",
    spoken: "Golf Alpha Bravo Charlie Delta, join downwind runway three six, report downwind.",
  },

  /* 6 · Pilot reads back joining instruction */
  {
    id: "ar6-pilot-join-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Join downwind runway 36, report downwind, G-ABCD.",
    spoken: "Join downwind runway three six, report downwind, Golf Alpha Bravo Charlie Delta.",
    expectedReadback: "Join downwind runway 36, report downwind, G-ABCD.",
    readbackPrompt: "Read back: join leg · runway · report point · callsign.",
    micInstruction: "Read back the joining instruction.",
    acceptedVariants: ["Join downwind runway 36, wilco, G-ABCD."],
  },

  {
    id: "ar7-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Inbound call made, reporting point acknowledged, joining instruction read back correctly. You are integrated into the circuit.",
  },
];

export const SECTION_SCENARIOS: Record<string, SectionScenarioMeta> = {
  "sp-preflight.section-scenario.section-scenario": {
    id: "sp-preflight.section-scenario.section-scenario",
    moduleId: "sp-preflight",
    title: "Preflight Scenario",
    phase: "preflight",
    summary: "ATIS → first contact → departure clearance → startup → report ready for taxi.",
  },
  "sp-taxi.section-scenario.section-scenario": {
    id: "sp-taxi.section-scenario.section-scenario",
    moduleId: "sp-taxi",
    title: "Stand to holding point",
    phase: "taxi",
    summary: "Read and follow a taxi clearance from the stand to holding point A1.",
    isFoundationPlaceholder: true,
  },
  "sp-takeoff.section-scenario.section-scenario": {
    id: "sp-takeoff.section-scenario.section-scenario",
    moduleId: "sp-takeoff",
    title: "Takeoff to initial departure",
    phase: "takeoff",
    summary: "Takeoff clearance, initial climb/heading, and remain-in-circuit intention.",
    isFoundationPlaceholder: true,
  },
  "sp-circuit.section-scenario.section-scenario": {
    id: "sp-circuit.section-scenario.section-scenario",
    moduleId: "sp-circuit",
    title: "One guided circuit",
    phase: "circuit",
    summary: "Fly and report a full left-hand circuit with sequencing and traffic.",
    isFoundationPlaceholder: true,
  },
  "sp-arrival.section-scenario.section-scenario": {
    id: "sp-arrival.section-scenario.section-scenario",
    moduleId: "sp-arrival",
    title: "Arrival call to joining instruction",
    phase: "arrival",
    summary: "Inbound call from a reporting point through a join-downwind/base instruction.",
    isFoundationPlaceholder: true,
  },
  "sp-landing.section-scenario.section-scenario": {
    id: "sp-landing.section-scenario.section-scenario",
    moduleId: "sp-landing",
    title: "Final to landing or go-around",
    phase: "landing",
    summary: "Report final, manage clearance status, land or go around, then vacate.",
    isFoundationPlaceholder: true,
  },
  "sp-parking.section-scenario.section-scenario": {
    id: "sp-parking.section-scenario.section-scenario",
    moduleId: "sp-parking",
    title: "Runway vacated to stand",
    phase: "parking",
    summary: "Switch to Ground, taxi from the exit, give way and report parking complete.",
    isFoundationPlaceholder: true,
  },
};
