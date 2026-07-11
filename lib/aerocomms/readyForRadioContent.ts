/**
 * AeroComms — Ready For Radio content catalog.
 *
 * Level 3. VFR operations OUTSIDE the local environment: cross-country flight
 * following, controlled-airspace decisions, unfamiliar aerodromes, radio
 * workload / corrections, and basic operational problem solving.
 *
 * Reuses the Student Pilot block renderer (SpSessionScreen) via the shared
 * ExerciseContent / blockType contract. Phraseology follows
 * docs/AeroComms_ICAO_Radiotelephony_Reference.md (decimal not point, full
 * callsign in readbacks, runway digit-by-digit, Golf Alfa Bravo Charlie Delta).
 *
 * Structure: 5 modules × (4 teaching sections + 1 scenario section).
 * Each teaching section = 1 lesson + 4 exercises. Each scenario section = 1 capstone.
 */

import type {
  Exercise,
  ExerciseContent,
  Module,
  Section,
  SpClearanceRound,
  SpClearanceSection,
  SpClearanceSegment,
  SpLessonExample,
  SpOption,
  SpReadbackRound,
  SpReadbackSection,
  SpScenarioStep,
  StudentPilotPhase,
  Topic,
} from "./content";
import {
  CROSS_COUNTRY_SCENARIO_STEPS,
  AIRSPACE_SCENARIO_STEPS,
  UNFAMILIAR_SCENARIO_STEPS,
  WORKLOAD_SCENARIO_STEPS,
  PROBLEM_SOLVING_SCENARIO_STEPS,
} from "./readyForRadioScenarios";

/* ------------------------------------------------------------------ */
/* Shared builders                                                     */
/* ------------------------------------------------------------------ */

function segType(text: string): SpClearanceSegment["segmentType"] {
  if (text.startsWith("G-ABCD")) return "callsign";
  if (/runway/i.test(text)) return "runway";
  return "additional-instruction";
}

/** Interleave distractors and expected chips into a stable, non-sequential bank. */
function mixChips(
  expected: SpClearanceSegment[],
  distractors: SpClearanceSegment[],
): SpClearanceSegment[] {
  const out: SpClearanceSegment[] = [];
  const n = Math.max(expected.length, distractors.length);
  for (let i = 0; i < n; i++) {
    if (distractors[i]) out.push(distractors[i]);
    if (expected[i]) out.push(expected[i]);
  }
  return out;
}

/** Explanatory lesson (Continue button). */
function lessonExercise(phase: StudentPilotPhase, opts: {
  id: string;
  title: string;
  description: string;
  lessonBody: string;
  points: string[];
  examples: SpLessonExample[];
}): Exercise {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Lesson",
    free: false,
    content: {
      blockType: "taxi-lesson",
      phase,
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: undefined,
      spVisualMode: "none",
    } satisfies ExerciseContent,
  };
}

/** Chip/ordering exercise (Check → feedback → Continue). */
function chipExercise(phase: StudentPilotPhase, opts: {
  id: string;
  title: string;
  description: string;
  screenKicker: string;
  headerInstruction: string;
  atcText: string;
  atcSpoken: string;
  prompt: string;
  expected: { id: string; text: string; spoken?: string }[];
  distractors: { id: string; text: string }[];
  expectedSentence: string;
  expectedSpoken: string;
  helperText?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
}): Exercise {
  const expectedSegments: SpClearanceSegment[] = opts.expected.map((e) => ({
    id: e.id, text: e.text, spoken: e.spoken, segmentType: segType(e.text),
  }));
  const distractorSegments: SpClearanceSegment[] = opts.distractors.map((d) => ({
    id: d.id, text: d.text, segmentType: "distractor" as const,
  }));
  const round: SpClearanceRound = {
    id: `${opts.id}.r1`,
    atcText: opts.atcText,
    atcSpoken: opts.atcSpoken,
    prompt: opts.prompt,
    expectedSegments,
    chipBank: mixChips(expectedSegments, distractorSegments),
    expectedSentence: opts.expectedSentence,
    expectedSpoken: opts.expectedSpoken,
    helperText: opts.helperText,
    correctFeedback: opts.correctFeedback,
    incorrectFeedback: opts.incorrectFeedback,
    interactionType: "chip-sequence",
  };
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Listening",
    free: false,
    content: {
      blockType: "clearance-construction",
      phase,
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

/** Multiple-choice / error-detection exercise (Check → feedback → Continue). */
function choiceExercise(phase: StudentPilotPhase, opts: {
  id: string;
  title: string;
  description: string;
  screenKicker: string;
  instruction: string;
  question?: string;
  atcDisplay?: string;
  atcSpoken?: string;
  atcHidden?: boolean;
  shownReadback?: string;
  shownReadbackLabel?: string;
  options: SpOption[];
  correctId: string;
}): Exercise {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Choice",
    free: false,
    content: {
      blockType: "decision-point",
      phase,
      spVisualMode: "none",
      spScreenKicker: opts.screenKicker,
      instruction: opts.instruction,
      spQuestion: opts.question,
      spAtcDisplay: opts.atcDisplay,
      spAtcSpoken: opts.atcSpoken,
      spAtcHidden: opts.atcHidden,
      spShownReadback: opts.shownReadback,
      spShownReadbackLabel: opts.shownReadbackLabel,
      spOptions: opts.options,
      spCorrectOptionId: opts.correctId,
    } satisfies ExerciseContent,
  };
}

/** Simulated readback / mic trainer (situation → Play → tap-to-speak → expected). */
function readbackExercise(phase: StudentPilotPhase, opts: {
  id: string;
  title: string;
  description: string;
  headerInstruction: string;
  cardLabel?: string;
  contextRevealed?: boolean;
  rounds: {
    id: string;
    atcText: string;
    atcSpoken: string;
    expectedReadback: string;
    expectedReadbackSpoken: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: "-",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: "-", direction: "-", callsign: "G-ABCD" },
    interactionMode: "simulated-readback",
    cardLabel: opts.cardLabel,
    contextRevealed: opts.contextRevealed,
  }));
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Readback",
    free: false,
    content: {
      blockType: "readback-construction",
      phase,
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

/** Capstone conversation scenario (mission-style). */
function scenarioExercise(phase: StudentPilotPhase, opts: {
  id: string;
  title: string;
  description: string;
  instruction: string;
  heading: string;
  completionNote: string;
  callsign: string;
  steps: SpScenarioStep[];
}): Exercise {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Scenario",
    free: false,
    content: {
      blockType: "section-scenario",
      phase,
      scenarioKind: "mission",
      scenarioStyle: "conversation",
      spVisualMode: "none",
      instruction: opts.instruction,
      spScenarioKicker: "Scenario",
      spScenarioHeading: opts.heading,
      spScenarioCompletionNote: opts.completionNote,
      spScenarioCallsign: opts.callsign,
      spScenarioSteps: opts.steps,
    } satisfies ExerciseContent,
  };
}

/* ================================================================== */
/* MODULE 1 — Cross-Country Flight Following                          */
/* ================================================================== */

const XC: StudentPilotPhase = "cross-country";

const xcOpeningTopic: Topic = {
  id: "rfr-cross-country.opening",
  name: "Opening a Cross-Country Flight",
  description: "Make a position-establishing call when leaving the local area.",
  unit: "exercises",
  exercises: [
    lessonExercise(XC, {
      id: "rfr-cross-country.opening.lesson",
      title: "Opening a Cross-Country Flight",
      description: "How to establish yourself on a cross-country flight.",
      lessonBody:
        "After leaving the local environment, your call must place you operationally: who you are, where you are, how high you are, and where you are going. This is not a radio check and it is not a landing call — it establishes your flight.",
      points: [
        "Station — call the right service (e.g. Brindale Information).",
        "Callsign — G-ABCD.",
        "Position — relative to your departure area (e.g. north of Brindale).",
        "Altitude — e.g. two thousand feet.",
        "Route / destination and intention — e.g. routing to Hilltown.",
      ],
      examples: [
        {
          label: "Opening call",
          atcText: "Brindale Information, G-ABCD, north of Brindale, two thousand feet, routing to Hilltown.",
          atcSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, north of Brindale, two thousand feet, routing to Hilltown.",
          readback: "Brindale Information, G-ABCD, north of Brindale, two thousand feet, routing to Hilltown.",
        },
      ],
    }),
    chipExercise(XC, {
      id: "rfr-cross-country.opening.build-opening-call",
      title: "Build the opening call",
      description: "Order the parts of the opening cross-country call.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the opening call in the correct order.",
      atcText: "Brindale Information, G-ABCD, north of Brindale, two thousand feet, routing to Hilltown.",
      atcSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, north of Brindale, two thousand feet, routing to Hilltown.",
      prompt: "Order the call parts.",
      helperText: "Station · callsign · position · altitude · route.",
      expected: [
        { id: "boc-station", text: "Brindale Information" },
        { id: "boc-cs", text: "G-ABCD" },
        { id: "boc-pos", text: "north of Brindale" },
        { id: "boc-alt", text: "two thousand feet" },
        { id: "boc-route", text: "routing to Hilltown" },
      ],
      distractors: [
        { id: "boc-d-check", text: "radio check" },
        { id: "boc-d-land", text: "cleared to land" },
        { id: "boc-d-south", text: "south of Brindale" },
      ],
      expectedSentence: "Brindale Information, G-ABCD, north of Brindale, two thousand feet, routing to Hilltown.",
      expectedSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, north of Brindale, two thousand feet, routing to Hilltown.",
      correctFeedback: "Correct. The opening call establishes who, where, how high and where to.",
      incorrectFeedback: "Order: station · callsign · position · altitude · route.",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.opening.what-is-missing",
      title: "What information is missing?",
      description: "Spot the missing element in the opening call.",
      screenKicker: "Error detection",
      instruction: "Check this opening call for a missing element.",
      question: "What is missing?",
      shownReadback: "Brindale Information, G-ABCD, two thousand feet, routing to Hilltown.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "wim-pos", text: "Position", feedback: "Correct. The call has no position relative to the departure area, so the station cannot place you." },
        { id: "wim-cs", text: "Callsign", feedback: "G-ABCD is present. Something else is missing." },
        { id: "wim-alt", text: "Altitude", feedback: "Two thousand feet is present. Look for what tells the station where you are." },
        { id: "wim-dest", text: "Destination", feedback: "Routing to Hilltown is present. The position is missing." },
      ],
      correctId: "wim-pos",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.opening.best-opening-call",
      title: "Choose the best opening call",
      description: "Select the correct opening cross-country call.",
      screenKicker: "Choice",
      instruction: "You are leaving the local area, routing to Hilltown. Which call is correct?",
      question: "Which is the best opening call?",
      options: [
        { id: "boc2-good", text: "Brindale Information, G-ABCD, north of Brindale, two thousand feet, routing to Hilltown.", feedback: "Correct. It establishes station, callsign, position, altitude and route." },
        { id: "boc2-check", text: "Brindale Information, G-ABCD, radio check.", feedback: "A radio check does not establish your flight. You need position, altitude and route." },
        { id: "boc2-land", text: "Brindale Information, G-ABCD, routing to Hilltown.", feedback: "Missing position and altitude. The station cannot place you without those." },
        { id: "boc2-part", text: "Brindale Information, north of Brindale.", feedback: "No callsign, altitude or route. Too little information." },
      ],
      correctId: "boc2-good",
    }),
    readbackExercise(XC, {
      id: "rfr-cross-country.opening.trainer",
      title: "Opening call trainer",
      description: "Make the opening cross-country call.",
      headerInstruction: "You are north of Brindale at two thousand feet, routing to Hilltown. Make the opening call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-cross-country.opening.trainer.r1",
          atcText: "You are north of Brindale, two thousand feet, routing to Hilltown.",
          atcSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, north of Brindale, two thousand feet, routing to Hilltown.",
          expectedReadback: "Brindale Information, G-ABCD, north of Brindale, two thousand feet, routing to Hilltown.",
          expectedReadbackSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, north of Brindale, two thousand feet, routing to Hilltown.",
        },
      ],
    }),
  ],
};

const xcRouteUpdatesTopic: Topic = {
  id: "rfr-cross-country.route-updates",
  name: "Route & Altitude Updates",
  description: "Give brief enroute position, altitude and routing updates.",
  unit: "exercises",
  exercises: [
    lessonExercise(XC, {
      id: "rfr-cross-country.route-updates.lesson",
      title: "Route & Altitude Updates",
      description: "Keep the station updated without repeating the whole opening call.",
      lessonBody:
        "Enroute you do not repeat the full opening call every time. You update position, altitude and routing when it adds value. Keep it brief and operational.",
      points: [
        "Update when it helps the station — not constantly.",
        "Include callsign, position, altitude and routing.",
        "Keep it short.",
        "Drop the station name once two-way contact is established and stable.",
      ],
      examples: [
        {
          label: "Overhead a feature",
          atcText: "G-ABCD, overhead North Lake, two thousand feet, routing eastbound.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, overhead North Lake, two thousand feet, routing eastbound.",
          readback: "G-ABCD, overhead North Lake, two thousand feet, routing eastbound.",
        },
        {
          label: "Passing a feature",
          atcText: "G-ABCD, passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
          readback: "G-ABCD, passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
        },
      ],
    }),
    chipExercise(XC, {
      id: "rfr-cross-country.route-updates.complete-update",
      title: "Complete the update",
      description: "Build the enroute update.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the enroute update in order.",
      atcText: "G-ABCD, overhead North Lake, two thousand feet, routing eastbound.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, overhead North Lake, two thousand feet, routing eastbound.",
      prompt: "Build the update.",
      helperText: "Position · altitude · route.",
      expected: [
        { id: "cu-pos", text: "overhead North Lake" },
        { id: "cu-alt", text: "two thousand feet" },
        { id: "cu-route", text: "routing eastbound" },
      ],
      distractors: [
        { id: "cu-d-pos", text: "overhead West Bridge" },
        { id: "cu-d-alt", text: "one thousand feet" },
        { id: "cu-d-west", text: "routing westbound" },
      ],
      expectedSentence: "overhead North Lake, two thousand feet, routing eastbound.",
      expectedSpoken: "overhead North Lake, two thousand feet, routing eastbound.",
      correctFeedback: "Correct. Position, altitude and route — short and clear.",
      incorrectFeedback: "Order: position · altitude · route.",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.route-updates.classify",
      title: "What should the update contain?",
      description: "Decide what a useful enroute update includes.",
      screenKicker: "Choice",
      instruction: "You have just reached a planned reporting point on the way to Hilltown.",
      question: "What should your enroute update contain?",
      options: [
        { id: "cl-full", text: "Position, altitude and routing, with your callsign.", feedback: "Correct. A useful update places you, your level and where you are going — concise and complete." },
        { id: "cl-min", text: 'Just your callsign and the word "passing".', feedback: "Too little. The station cannot place you without position, altitude and routing." },
        { id: "cl-open", text: "A full repeat of your original opening call.", feedback: "Too much. You do not re-establish the flight every time — update only what has changed." },
        { id: "cl-hdg", text: "Only your current heading in degrees.", feedback: "A heading alone does not give the station your position, level or destination." },
      ],
      correctId: "cl-full",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.route-updates.wrong-altitude",
      title: "Wrong altitude detection",
      description: "Spot the incorrect altitude in the update.",
      screenKicker: "Error detection",
      instruction: "You are at two thousand feet. Check the update below.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, overhead North Lake, one thousand five hundred feet, routing eastbound.",
      shownReadbackLabel: "Pilot update",
      options: [
        { id: "wa-alt", text: "The altitude is wrong. You are at two thousand feet.", feedback: "Correct. The update says one thousand five hundred feet, but you are at two thousand feet." },
        { id: "wa-pos", text: "The position is wrong.", feedback: "Overhead North Lake is correct. The altitude does not match." },
        { id: "wa-route", text: "The route is wrong.", feedback: "Routing eastbound is fine. The altitude is the issue." },
        { id: "wa-none", text: "Nothing is wrong.", feedback: "You are at two thousand feet, not one thousand five hundred feet." },
      ],
      correctId: "wa-alt",
    }),
    readbackExercise(XC, {
      id: "rfr-cross-country.route-updates.trainer",
      title: "Update call trainer",
      description: "Make an enroute update.",
      headerInstruction: "You are passing West Bridge at one thousand five hundred feet, routing to Hilltown. Make the update.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-cross-country.route-updates.trainer.r1",
          atcText: "You are passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
          expectedReadback: "G-ABCD, passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, passing West Bridge, one thousand five hundred feet, routing to Hilltown.",
        },
      ],
    }),
  ],
};

const xcEstimatesTopic: Topic = {
  id: "rfr-cross-country.estimates",
  name: "Estimates & Next Point",
  description: "Link radio with navigation by passing estimates for the next point.",
  unit: "exercises",
  exercises: [
    lessonExercise(XC, {
      id: "rfr-cross-country.estimates.lesson",
      title: "Estimates & Next Point",
      description: "How and why to pass an estimate for your next point.",
      lessonBody:
        "An estimate tells the station where you will be next and when. Use a simple time estimate and do not overload the call. This links radio work with your navigation planning.",
      points: [
        'Pass the next point and your estimated minute: "estimating Hilltown at two five".',
        '"Two five" means minute 25 when the hour is understood.',
        "Keep the estimate call short.",
        "Update the estimate if it changes significantly.",
      ],
      examples: [
        {
          label: "Estimate call",
          atcText: "G-ABCD, estimating Hilltown at two five.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, estimating Hilltown at two five.",
          readback: "G-ABCD, estimating Hilltown at two five.",
        },
      ],
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.estimates.understand",
      title: "Understand the estimate",
      description: "Interpret an estimate call.",
      screenKicker: "Listening",
      instruction: "Listen to the estimate call and interpret it.",
      question: 'What does "two five" mean here?',
      atcDisplay: "G-ABCD, estimating Hilltown at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, estimating Hilltown at two five.",
      atcHidden: true,
      options: [
        { id: "ue-min", text: "Estimated at minute 25", feedback: "Correct. The estimate is the minute past the hour." },
        { id: "ue-alt", text: "Altitude 2500 feet", feedback: "No — altitude would be stated in feet, e.g. two thousand five hundred feet." },
        { id: "ue-rwy", text: "Runway 25", feedback: "No — a runway would be stated as runway two five in a runway context." },
        { id: "ue-freq", text: "Frequency 125.000", feedback: "No — a frequency uses decimal, e.g. one two five decimal zero." },
      ],
      correctId: "ue-min",
    }),
    chipExercise(XC, {
      id: "rfr-cross-country.estimates.build",
      title: "Build the estimate report",
      description: "Order the parts of the estimate report.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the estimate report.",
      atcText: "G-ABCD, estimating Hilltown at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, estimating Hilltown at two five.",
      prompt: "Order the report.",
      expected: [
        { id: "be-cs", text: "G-ABCD" },
        { id: "be-est", text: "estimating Hilltown" },
        { id: "be-time", text: "at two five" },
      ],
      distractors: [
        { id: "be-d-point", text: "estimating North Lake" },
        { id: "be-d-time", text: "at three five" },
      ],
      expectedSentence: "G-ABCD, estimating Hilltown at two five.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, estimating Hilltown at two five.",
      correctFeedback: "Correct. Callsign, point and estimated minute.",
      incorrectFeedback: "Order: callsign · estimating point · time.",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.estimates.wrong-estimate",
      title: "Wrong estimate detection",
      description: "Spot the incorrect estimate.",
      screenKicker: "Error detection",
      instruction: "Your estimate for Hilltown is minute 25. Check the report below.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, estimating Hilltown at three five.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "we-time", text: "The estimate time is wrong. It should be two five.", feedback: "Correct. The report says three five but the estimate is minute 25." },
        { id: "we-point", text: "The point is wrong.", feedback: "Hilltown is correct. The estimated time does not match." },
        { id: "we-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The estimated time is the issue." },
        { id: "we-none", text: "Nothing is wrong.", feedback: "The estimate should be two five, not three five." },
      ],
      correctId: "we-time",
    }),
    readbackExercise(XC, {
      id: "rfr-cross-country.estimates.trainer",
      title: "Next point report",
      description: "Report your estimate for the next point.",
      headerInstruction: "Your next reporting point is Hilltown. Estimate it at minute 25. Make the report.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-cross-country.estimates.trainer.r1",
          atcText: "Your next point is Hilltown, estimated at minute 25.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, estimating Hilltown at two five.",
          expectedReadback: "G-ABCD, estimating Hilltown at two five.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, estimating Hilltown at two five.",
        },
      ],
    }),
  ],
};

const xcChangingPlanTopic: Topic = {
  id: "rfr-cross-country.changing-plan",
  name: "Changing Plan Enroute",
  description: "Request route changes clearly and read back what is approved.",
  unit: "exercises",
  exercises: [
    lessonExercise(XC, {
      id: "rfr-cross-country.changing-plan.lesson",
      title: "Changing Plan Enroute",
      description: "Request a route change and act only on what is approved.",
      lessonBody:
        "In VFR you may need to update your route — a direct routing or a small weather deviation. Be clear and brief, and do not change plan silently when communication is expected. Act only on what is approved.",
      points: [
        'Request direct routing: "request direct Hilltown".',
        'Request a weather deviation: "request ten degrees right due weather".',
        "Wait for approval before acting where a service is provided.",
        "Read back the approved route.",
      ],
      examples: [
        {
          label: "Direct routing request",
          atcText: "G-ABCD, request direct Hilltown.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request direct Hilltown.",
          readback: "G-ABCD, request direct Hilltown.",
        },
        {
          label: "Weather deviation request",
          atcText: "G-ABCD, request ten degrees right due weather.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request ten degrees right due weather.",
          readback: "G-ABCD, request ten degrees right due weather.",
        },
      ],
    }),
    chipExercise(XC, {
      id: "rfr-cross-country.changing-plan.request-direct",
      title: "Request direct routing",
      description: "Build a direct routing request.",
      screenKicker: "Listening",
      headerInstruction: "Build the direct routing request.",
      atcText: "G-ABCD, request direct Hilltown.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request direct Hilltown.",
      prompt: "Build the request.",
      expected: [
        { id: "rd-cs", text: "G-ABCD" },
        { id: "rd-req", text: "request direct Hilltown" },
      ],
      distractors: [
        { id: "rd-d-lake", text: "request direct North Lake" },
        { id: "rd-d-land", text: "request landing" },
      ],
      expectedSentence: "G-ABCD, request direct Hilltown.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, request direct Hilltown.",
      correctFeedback: "Correct. Callsign and a clear, brief request.",
      incorrectFeedback: "Build: callsign · request direct Hilltown.",
    }),
    chipExercise(XC, {
      id: "rfr-cross-country.changing-plan.weather-change",
      title: "Weather route change",
      description: "Build a weather deviation request.",
      screenKicker: "Listening",
      headerInstruction: "Build the weather deviation request.",
      atcText: "G-ABCD, request ten degrees right due weather.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request ten degrees right due weather.",
      prompt: "Build the request.",
      expected: [
        { id: "wc-cs", text: "G-ABCD" },
        { id: "wc-req", text: "request ten degrees right" },
        { id: "wc-reason", text: "due weather" },
      ],
      distractors: [
        { id: "wc-d-left", text: "request ten degrees left" },
        { id: "wc-d-traffic", text: "due traffic" },
      ],
      expectedSentence: "G-ABCD, request ten degrees right due weather.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, request ten degrees right due weather.",
      correctFeedback: "Correct. A brief deviation request with a reason.",
      incorrectFeedback: "Build: callsign · request ten degrees right · due weather.",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.changing-plan.approved-or-not",
      title: "Approved or not approved?",
      description: "Decide whether the route is approved.",
      screenKicker: "Choice",
      instruction: "You requested direct Hilltown. ATC replies:",
      question: "Can you route direct Hilltown?",
      atcDisplay: "G-ABCD, direct Hilltown approved.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, direct Hilltown approved.",
      atcHidden: true,
      options: [
        { id: "ap-yes", text: "Yes, direct Hilltown is approved.", feedback: "Correct. The route change has been approved — read it back and route direct." },
        { id: "ap-outside", text: "No, remain outside controlled airspace.", feedback: "That is a different instruction. Here the direct routing was approved." },
        { id: "ap-land", text: "No — you must read it back before routing direct.", feedback: "No — the readback confirms you understand, but the approval already exists. Route direct now and read it back." },
        { id: "ap-taxi", text: "No — remain on the original route until you pass the next waypoint.", feedback: "No — an approved route change takes effect immediately. Route direct Hilltown now." },
      ],
      correctId: "ap-yes",
    }),
    choiceExercise(XC, {
      id: "rfr-cross-country.changing-plan.wrong-route-readback",
      title: "Wrong route readback",
      description: "Spot the incorrect route in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC approved direct Hilltown. Check the pilot readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, direct Hilltown approved.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, direct Hilltown approved.",
      shownReadback: "Direct North Lake, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wrr-route", text: "The pilot read back the wrong route.", feedback: "Correct. ATC approved direct Hilltown, but the pilot read back direct North Lake." },
        { id: "wrr-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The route is the issue." },
        { id: "wrr-word", text: "The word 'direct' is wrong.", feedback: '"Direct" is correct. The destination in the readback is wrong.' },
        { id: "wrr-none", text: "Nothing is wrong.", feedback: "ATC approved direct Hilltown, not direct North Lake." },
      ],
      correctId: "wrr-route",
    }),
  ],
};

const xcScenarioTopic: Topic = {
  id: "rfr-cross-country.scenario",
  name: "Cross-Country Scenario",
  description: "Opening call through to an approved route change.",
  unit: "scenario",
  exercises: [
    scenarioExercise(XC, {
      id: "rfr-cross-country.scenario.mission",
      title: "Leaving the local area",
      description: "Open the flight, update position, pass an estimate and request a route change.",
      instruction:
        "You are leaving the local area routing to Hilltown. Open the flight, update your position, pass an estimate and request a route change due weather.",
      heading: "Leaving the local area",
      completionNote:
        "Opening call, position update, estimate and route change made. You are established on the updated cross-country route.",
      callsign: "G-ABCD",
      steps: CROSS_COUNTRY_SCENARIO_STEPS,
    }),
  ],
};

const crossCountryTopics: Topic[] = [
  xcOpeningTopic,
  xcRouteUpdatesTopic,
  xcEstimatesTopic,
  xcChangingPlanTopic,
  xcScenarioTopic,
];

const crossCountry: Module = {
  id: "rfr-cross-country",
  name: "Cross-Country Flight Following",
  subtitle: "Open, update and replan a VFR cross-country flight.",
  unit: "topics",
  topics: crossCountryTopics,
  exercises: crossCountryTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 2 — Airspace Decisions                                      */
/* ================================================================== */

const AS: StudentPilotPhase = "airspace";

const asRequestTransitTopic: Topic = {
  id: "rfr-airspace.request-transit",
  name: "Requesting Controlled Airspace Transit",
  description: "Ask permission to cross controlled airspace — requesting is not clearance.",
  unit: "exercises",
  exercises: [
    lessonExercise(AS, {
      id: "rfr-airspace.request-transit.lesson",
      title: "Requesting Controlled Airspace Transit",
      description: "How to request a zone transit.",
      lessonBody:
        "A transit request asks permission to cross controlled airspace. Include who you are, where you are and what you want. Requesting is not clearance — you must wait for a clearance before entering.",
      points: [
        "Include station, callsign, position, altitude and request.",
        "Requesting is not the same as being cleared.",
        "Do not enter controlled airspace until cleared.",
        'Example: "Brindale Approach, G-ABCD, five miles north, two thousand feet, request zone transit."',
      ],
      examples: [
        {
          label: "Transit request",
          atcText: "Brindale Approach, G-ABCD, five miles north, two thousand feet, request zone transit.",
          atcSpoken: "Brindale Approach, Golf Alfa Bravo Charlie Delta, five miles north, two thousand feet, request zone transit.",
          readback: "Brindale Approach, G-ABCD, five miles north, two thousand feet, request zone transit.",
        },
      ],
    }),
    chipExercise(AS, {
      id: "rfr-airspace.request-transit.build",
      title: "Build the transit request",
      description: "Order the parts of the transit request.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the transit request in the correct order.",
      atcText: "Brindale Approach, G-ABCD, five miles north, two thousand feet, request zone transit.",
      atcSpoken: "Brindale Approach, Golf Alfa Bravo Charlie Delta, five miles north, two thousand feet, request zone transit.",
      prompt: "Order the request.",
      helperText: "Station · callsign · position · altitude · request.",
      expected: [
        { id: "bt-station", text: "Brindale Approach" },
        { id: "bt-cs", text: "G-ABCD" },
        { id: "bt-pos", text: "five miles north" },
        { id: "bt-alt", text: "two thousand feet" },
        { id: "bt-req", text: "request zone transit" },
      ],
      distractors: [
        { id: "bt-d-ground", text: "Brindale Ground" },
        { id: "bt-d-land", text: "request landing" },
        { id: "bt-d-south", text: "five miles south" },
      ],
      expectedSentence: "Brindale Approach, G-ABCD, five miles north, two thousand feet, request zone transit.",
      expectedSpoken: "Brindale Approach, Golf Alfa Bravo Charlie Delta, five miles north, two thousand feet, request zone transit.",
      correctFeedback: "Correct. Station, callsign, position, altitude and request.",
      incorrectFeedback: "Order: station · callsign · position · altitude · request.",
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.request-transit.what-pilot-wants",
      title: "What does the pilot want?",
      description: "Interpret the transit request.",
      screenKicker: "Choice",
      instruction: "Listen to the request and interpret it.",
      question: "What does the pilot want?",
      atcDisplay: "G-ABCD, request zone transit.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request zone transit.",
      atcHidden: true,
      options: [
        { id: "wp-cross", text: "To request permission to cross controlled airspace", feedback: "Correct. A zone transit request asks permission to cross controlled airspace." },
        { id: "wp-leaving", text: "To report leaving controlled airspace", feedback: "No — that is a position report once already inside, not a request to cross." },
        { id: "wp-traffic", text: "To request traffic information only", feedback: "No — a transit request asks to enter the airspace, not just for traffic information." },
        { id: "wp-join", text: "To request joining information at the destination", feedback: "No — joining information is for arriving at an aerodrome, not crossing a zone enroute." },
      ],
      correctId: "wp-cross",
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.request-transit.missing-position",
      title: "Missing position in request",
      description: "Spot the missing element in the request.",
      screenKicker: "Error detection",
      instruction: "Check this transit request for a missing element.",
      question: "What is missing?",
      shownReadback: "Brindale Approach, G-ABCD, two thousand feet, request zone transit.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mp-pos", text: "Position", feedback: "Correct. Without a position the controller cannot assess the transit." },
        { id: "mp-cs", text: "Callsign", feedback: "G-ABCD is present. Something else is missing." },
        { id: "mp-alt", text: "Altitude", feedback: "Two thousand feet is present. The position is missing." },
        { id: "mp-req", text: "Request", feedback: '"Request zone transit" is present. The position is missing.' },
      ],
      correctId: "mp-pos",
    }),
    readbackExercise(AS, {
      id: "rfr-airspace.request-transit.trainer",
      title: "Transit request trainer",
      description: "Make the transit request.",
      headerInstruction: "You are five miles north of Brindale at two thousand feet. Request a zone transit.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-airspace.request-transit.trainer.r1",
          atcText: "You are five miles north of Brindale, two thousand feet, and want to cross controlled airspace.",
          atcSpoken: "Brindale Approach, Golf Alfa Bravo Charlie Delta, five miles north, two thousand feet, request zone transit.",
          expectedReadback: "Brindale Approach, G-ABCD, five miles north, two thousand feet, request zone transit.",
          expectedReadbackSpoken: "Brindale Approach, Golf Alfa Bravo Charlie Delta, five miles north, two thousand feet, request zone transit.",
        },
      ],
    }),
  ],
};

const asClearedTransitTopic: Topic = {
  id: "rfr-airspace.cleared-transit",
  name: "Cleared to Transit",
  description: "Only a clearance allows entry — read back route and callsign.",
  unit: "exercises",
  exercises: [
    lessonExercise(AS, {
      id: "rfr-airspace.cleared-transit.lesson",
      title: "Cleared to Transit",
      description: "Recognise and read back a transit clearance.",
      lessonBody:
        "Only a clearance allows you to enter controlled airspace. Read back the route and any restriction, with your callsign. Do not confuse a request with an approval.",
      points: [
        '"Cleared to transit" authorises entry.',
        "Read back the route (e.g. via North Lake).",
        "Include your callsign.",
        "A request alone never allows entry.",
      ],
      examples: [
        {
          label: "Transit clearance",
          atcText: "G-ABCD, cleared to transit controlled airspace via North Lake.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit controlled airspace via North Lake.",
          readback: "Cleared to transit via North Lake, G-ABCD.",
        },
      ],
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.cleared-transit.can-you-enter",
      title: "Can you enter?",
      description: "Decide whether the clearance allows entry.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "Can you enter controlled airspace?",
      atcDisplay: "G-ABCD, cleared to transit controlled airspace via North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit controlled airspace via North Lake.",
      atcHidden: true,
      options: [
        { id: "ce-yes", text: "Yes, you are cleared to enter via North Lake.", feedback: "Correct. A transit clearance authorises entry via the stated route." },
        { id: "ce-ack", text: "No — this only acknowledges your request; wait for clearance.", feedback: 'No — "cleared to transit" is the clearance itself, not just an acknowledgement.' },
        { id: "ce-report", text: "Only after you report leaving controlled airspace.", feedback: "No — you report leaving when you exit, not as a condition of entry." },
        { id: "ce-reposition", text: "No — you must report your position again before entering.", feedback: "No — the clearance authorises entry now via North Lake; no further position report is required first." },
      ],
      correctId: "ce-yes",
    }),
    chipExercise(AS, {
      id: "rfr-airspace.cleared-transit.build-readback",
      title: "Build the readback",
      description: "Order the parts of the transit readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the transit clearance readback.",
      atcText: "G-ABCD, cleared to transit controlled airspace via North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit controlled airspace via North Lake.",
      prompt: "Build the readback.",
      expected: [
        { id: "br-clear", text: "Cleared to transit via North Lake" },
        { id: "br-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "br-d-hill", text: "Cleared to transit via Hilltown" },
        { id: "br-d-outside", text: "Remain outside controlled airspace" },
      ],
      expectedSentence: "Cleared to transit via North Lake, G-ABCD.",
      expectedSpoken: "Cleared to transit via North Lake, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Clearance, route and callsign.",
      incorrectFeedback: "Read back: cleared to transit via North Lake · callsign.",
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.cleared-transit.wrong-route",
      title: "Wrong route detection",
      description: "Spot the incorrect route in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC cleared transit via North Lake. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cleared to transit via North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit via North Lake.",
      shownReadback: "Cleared to transit via Hilltown, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wr-route", text: "The route is wrong. ATC said via North Lake.", feedback: "Correct. The pilot read back via Hilltown instead of via North Lake." },
        { id: "wr-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The route is the issue." },
        { id: "wr-clear", text: "The clearance word is wrong.", feedback: '"Cleared to transit" is correct. The route is wrong.' },
        { id: "wr-none", text: "Nothing is wrong.", feedback: "ATC said via North Lake, not via Hilltown." },
      ],
      correctId: "wr-route",
    }),
    readbackExercise(AS, {
      id: "rfr-airspace.cleared-transit.trainer",
      title: "Transit clearance trainer",
      description: "Read back the transit clearance.",
      headerInstruction: "Read back the transit clearance issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-airspace.cleared-transit.trainer.r1",
          atcText: "G-ABCD, cleared to transit controlled airspace via North Lake.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit controlled airspace via North Lake.",
          expectedReadback: "Cleared to transit via North Lake, G-ABCD.",
          expectedReadbackSpoken: "Cleared to transit via North Lake, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const asRemainOutsideTopic: Topic = {
  id: "rfr-airspace.remain-outside",
  name: "Remain Outside Controlled Airspace",
  description: "Recognise a remain-outside instruction and decide what to do.",
  unit: "exercises",
  exercises: [
    lessonExercise(AS, {
      id: "rfr-airspace.remain-outside.lesson",
      title: "Remain Outside Controlled Airspace",
      description: "What remain outside means and how to act on it.",
      lessonBody:
        "Remain outside controlled airspace means do not enter. Read it back, then continue outside, hold or route around. This is a decision point — do not enter without a clearance.",
      points: [
        '"Remain outside controlled airspace" — do not enter.',
        "Read back the instruction with your callsign.",
        "Stay outside and wait for clearance, or route around.",
        "Never enter on a request alone.",
      ],
      examples: [
        {
          label: "Remain outside",
          atcText: "G-ABCD, remain outside controlled airspace.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace.",
          readback: "Remain outside controlled airspace, G-ABCD.",
        },
      ],
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.remain-outside.can-you-enter",
      title: "Can you enter?",
      description: "Decide whether you may enter.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "Can you enter controlled airspace?",
      atcDisplay: "G-ABCD, remain outside controlled airspace.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace.",
      atcHidden: true,
      options: [
        { id: "ce2-no", text: "No, you must remain outside.", feedback: "Correct. You must not enter controlled airspace." },
        { id: "ce2-request", text: "Yes — your transit request counts as approval.", feedback: "No — a request never authorises entry. You were told to remain outside." },
        { id: "ce2-readback", text: "Yes — once you read the instruction back you may enter.", feedback: "No — reading it back confirms you heard it; it does not change it into a clearance." },
        { id: "ce2-limit", text: "Yes, if you stay not above two thousand feet.", feedback: "No — no transit was approved; an altitude limit only applies to a clearance you do not have." },
      ],
      correctId: "ce2-no",
    }),
    chipExercise(AS, {
      id: "rfr-airspace.remain-outside.read-back",
      title: "Read back remain outside",
      description: "Build the remain-outside readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback.",
      atcText: "G-ABCD, remain outside controlled airspace.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace.",
      prompt: "Build the readback.",
      expected: [
        { id: "ro-instr", text: "Remain outside controlled airspace" },
        { id: "ro-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ro-d-clear", text: "Cleared to transit via North Lake" },
        { id: "ro-d-enter", text: "Entering controlled airspace" },
      ],
      expectedSentence: "Remain outside controlled airspace, G-ABCD.",
      expectedSpoken: "Remain outside controlled airspace, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back the restriction and your callsign.",
      incorrectFeedback: "Read back: remain outside controlled airspace · callsign.",
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.remain-outside.unsafe-decision",
      title: "Unsafe decision detection",
      description: "Identify the unsafe action after a remain-outside instruction.",
      screenKicker: "Error detection",
      instruction: "ATC said remain outside controlled airspace. Check the pilot decision.",
      question: "Is this decision safe?",
      atcDisplay: "G-ABCD, remain outside controlled airspace.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace.",
      shownReadback: "Entering controlled airspace now, G-ABCD.",
      shownReadbackLabel: "Pilot decision",
      options: [
        { id: "ud-unsafe", text: "Unsafe — there is no clearance to enter.", feedback: "Correct. ATC instructed remain outside. Entering without a clearance is unsafe." },
        { id: "ud-ok", text: "Safe — the pilot requested transit earlier.", feedback: "A request does not authorise entry. The instruction was remain outside." },
        { id: "ud-minor", text: "A minor issue only.", feedback: "Entering controlled airspace without clearance is a serious breach." },
        { id: "ud-fine", text: "Fine — the callsign is included.", feedback: "The callsign is not the issue. Entering without clearance is unsafe." },
      ],
      correctId: "ud-unsafe",
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.remain-outside.what-to-do",
      title: "What should you do?",
      description: "Choose the correct action.",
      screenKicker: "Choice",
      instruction: "You requested transit but ATC instructed you to remain outside controlled airspace.",
      question: "What should you do?",
      options: [
        { id: "wd-wait", text: "Stay outside and wait for further clearance or route around.", feedback: "Correct. Remain outside until cleared, or route around the airspace." },
        { id: "wd-edge", text: "Continue your original track through the zone after reading it back.", feedback: "No — reading it back does not authorise entry. Stay outside or route around." },
        { id: "wd-creep", text: "Enter slowly, staying not above two thousand feet.", feedback: "No — there is no clearance and no altitude limit applies. Entering is not authorised." },
        { id: "wd-climb", text: "Climb above the controlled airspace without telling the station.", feedback: "No — do not change level silently. Stay outside and wait for clearance or route around." },
      ],
      correctId: "wd-wait",
    }),
  ],
};

const asRestrictionsTopic: Topic = {
  id: "rfr-airspace.restrictions",
  name: "Transit Restrictions",
  description: "Read back route and altitude restrictions accurately.",
  unit: "exercises",
  exercises: [
    lessonExercise(AS, {
      id: "rfr-airspace.restrictions.lesson",
      title: "Transit Restrictions",
      description: "Restrictions are safety-critical — read them back clearly.",
      lessonBody:
        "A transit clearance may include route and altitude restrictions. Restrictions are safety-critical. Read them back clearly. \"Not above\" means a maximum altitude.",
      points: [
        "A clearance may add an altitude restriction.",
        '"Not above two thousand feet" means a maximum.',
        "Read back the route and the restriction.",
        "Include your callsign.",
      ],
      examples: [
        {
          label: "Restricted transit",
          atcText: "G-ABCD, cleared to transit via North Lake, not above two thousand feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit via North Lake, not above two thousand feet.",
          readback: "Cleared to transit via North Lake, not above two thousand feet, G-ABCD.",
        },
      ],
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.restrictions.identify",
      title: "Identify the restriction",
      description: "Identify the altitude restriction.",
      screenKicker: "Choice",
      instruction: "ATC transmits a restricted transit clearance.",
      question: "What is the altitude restriction?",
      atcDisplay: "G-ABCD, cleared to transit via North Lake, not above two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit via North Lake, not above two thousand feet.",
      atcHidden: true,
      options: [
        { id: "ir-above", text: "Not above two thousand feet", feedback: "Correct. The maximum altitude is two thousand feet." },
        { id: "ir-below", text: "Not below two thousand feet", feedback: 'No — the clearance said "not above", a maximum.' },
        { id: "ir-climb", text: "Climb to three thousand feet", feedback: "No — there was no climb instruction." },
        { id: "ir-descend", text: "Descend to one thousand feet", feedback: "No — there was no descent instruction." },
      ],
      correctId: "ir-above",
    }),
    chipExercise(AS, {
      id: "rfr-airspace.restrictions.build-readback",
      title: "Build restricted transit readback",
      description: "Order the parts of the restricted transit readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the restricted transit readback.",
      atcText: "G-ABCD, cleared to transit via North Lake, not above two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit via North Lake, not above two thousand feet.",
      prompt: "Build the readback.",
      expected: [
        { id: "brt-clear", text: "Cleared to transit via North Lake" },
        { id: "brt-restr", text: "not above two thousand feet" },
        { id: "brt-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "brt-d-below", text: "not below two thousand feet" },
        { id: "brt-d-hill", text: "via Hilltown" },
      ],
      expectedSentence: "Cleared to transit via North Lake, not above two thousand feet, G-ABCD.",
      expectedSpoken: "Cleared to transit via North Lake, not above two thousand feet, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Clearance, route, restriction and callsign.",
      incorrectFeedback: "Order: clearance · route · restriction · callsign.",
    }),
    choiceExercise(AS, {
      id: "rfr-airspace.restrictions.altitude-mismatch",
      title: "Altitude restriction mismatch",
      description: "Spot the incorrect restriction in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said not above two thousand feet. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cleared to transit via North Lake, not above two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit via North Lake, not above two thousand feet.",
      shownReadback: "Cleared to transit via North Lake, not above three thousand feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "am-restr", text: "Wrong altitude restriction. ATC said not above two thousand feet.", feedback: "Correct. The pilot read back three thousand feet instead of two thousand feet — a safety-critical error." },
        { id: "am-route", text: "The route is wrong.", feedback: "Via North Lake matches. The altitude restriction is wrong." },
        { id: "am-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The altitude restriction is the issue." },
        { id: "am-none", text: "Nothing is wrong.", feedback: "ATC said not above two thousand feet, not three thousand feet." },
      ],
      correctId: "am-restr",
    }),
    readbackExercise(AS, {
      id: "rfr-airspace.restrictions.trainer",
      title: "Route + altitude trainer",
      description: "Read back the restricted transit clearance.",
      headerInstruction: "Read back the restricted transit clearance issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-airspace.restrictions.trainer.r1",
          atcText: "G-ABCD, cleared to transit via North Lake, not above two thousand feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to transit via North Lake, not above two thousand feet.",
          expectedReadback: "Cleared to transit via North Lake, not above two thousand feet, G-ABCD.",
          expectedReadbackSpoken: "Cleared to transit via North Lake, not above two thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const asScenarioTopic: Topic = {
  id: "rfr-airspace.scenario",
  name: "Airspace Scenario",
  description: "Request, remain outside, then transit with a restriction.",
  unit: "scenario",
  exercises: [
    scenarioExercise(AS, {
      id: "rfr-airspace.scenario.mission",
      title: "Crossing controlled airspace",
      description: "Request transit, comply with remain outside, then read back a restricted clearance.",
      instruction:
        "You are five miles north of Brindale at two thousand feet and want to cross controlled airspace. Request transit, comply with remain outside, then read back the clearance and restriction.",
      heading: "Crossing controlled airspace",
      completionNote:
        "Transit requested, remain-outside complied with, clearance and restriction read back. You have a valid transit clearance.",
      callsign: "G-ERBO",
      steps: AIRSPACE_SCENARIO_STEPS,
    }),
  ],
};

const airspaceTopics: Topic[] = [
  asRequestTransitTopic,
  asClearedTransitTopic,
  asRemainOutsideTopic,
  asRestrictionsTopic,
  asScenarioTopic,
];

const airspace: Module = {
  id: "rfr-airspace",
  name: "Airspace Decisions",
  subtitle: "Request, read back and comply with controlled-airspace instructions.",
  unit: "topics",
  topics: airspaceTopics,
  exercises: airspaceTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 3 — Unfamiliar Aerodrome Operations                         */
/* ================================================================== */

const UA: StudentPilotPhase = "unfamiliar";

const uaFirstCallTopic: Topic = {
  id: "rfr-unfamiliar-aerodrome.first-call",
  name: "First Call to an Unfamiliar Aerodrome",
  description: "Make a first call that requests joining information at a new aerodrome.",
  unit: "exercises",
  exercises: [
    lessonExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.first-call.lesson",
      title: "First Call to an Unfamiliar Aerodrome",
      description: "How to make first contact with a new station.",
      lessonBody:
        "On first contact at an unfamiliar aerodrome, request joining or airfield information. Include position, altitude and intention, use the station name correctly, and do not assume the runway or circuit — you need that information from the new station.",
      points: [
        "Use the correct station name (e.g. Hilltown Radio).",
        "Include position, altitude and intention.",
        "Request joining information — do not assume the runway or circuit.",
        "This is not a home rejoin: everything is new.",
      ],
      examples: [
        {
          label: "First call",
          atcText: "Hilltown Radio, G-ABCD, ten miles west, two thousand feet, inbound to land, request joining information.",
          atcSpoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, ten miles west, two thousand feet, inbound to land, request joining information.",
          readback: "Hilltown Radio, G-ABCD, ten miles west, two thousand feet, inbound to land, request joining information.",
        },
      ],
    }),
    chipExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.first-call.build",
      title: "Build the first call",
      description: "Order the parts of the first call.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the first call in the correct order.",
      atcText: "Hilltown Radio, G-ABCD, ten miles west, two thousand feet, inbound to land, request joining information.",
      atcSpoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, ten miles west, two thousand feet, inbound to land, request joining information.",
      prompt: "Order the call.",
      helperText: "Station · callsign · position · altitude · intention · request.",
      expected: [
        { id: "bf-station", text: "Hilltown Radio" },
        { id: "bf-cs", text: "G-ABCD" },
        { id: "bf-pos", text: "ten miles west" },
        { id: "bf-alt", text: "two thousand feet" },
        { id: "bf-int", text: "inbound to land" },
        { id: "bf-req", text: "request joining information" },
      ],
      distractors: [
        { id: "bf-d-land", text: "cleared to land" },
        { id: "bf-d-east", text: "ten miles east" },
      ],
      expectedSentence: "Hilltown Radio, G-ABCD, ten miles west, two thousand feet, inbound to land, request joining information.",
      expectedSpoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, ten miles west, two thousand feet, inbound to land, request joining information.",
      correctFeedback: "Correct. Station, callsign, position, altitude, intention and request.",
      incorrectFeedback: "Order: station · callsign · position · altitude · intention · request.",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.first-call.what-makes-unfamiliar",
      title: "What makes it unfamiliar?",
      description: "Understand why this differs from a home rejoin.",
      screenKicker: "Choice",
      instruction: "You are inbound to an aerodrome you have never flown to before.",
      question: "Why is this not the same as a home aerodrome rejoin?",
      options: [
        { id: "wu-info", text: "You need runway, circuit and joining information from a new station.", feedback: "Correct. At an unfamiliar aerodrome you must request the information you already know at home." },
        { id: "wu-assume", text: "You can assume the same runway and circuit as your home field.", feedback: "No — never assume. The runway and circuit may be completely different." },
        { id: "wu-straight", text: "You can join straight in without requesting anything.", feedback: "No — request joining information before committing to a join." },
        { id: "wu-confirm", text: "You already know the layout, so you just confirm it.", feedback: "No — this is a new field; you do not yet know the runway, circuit or QNH." },
      ],
      correctId: "wu-info",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.first-call.missing-intention",
      title: "Missing intention",
      description: "Spot the missing element in the first call.",
      screenKicker: "Error detection",
      instruction: "Check this first call for a missing element.",
      question: "What is missing?",
      shownReadback: "Hilltown Radio, G-ABCD, ten miles west, two thousand feet.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mi-int", text: "Intention / request", feedback: "Correct. The call gives no intention or request, so the station does not know what you want." },
        { id: "mi-cs", text: "Callsign", feedback: "G-ABCD is present. The intention/request is missing." },
        { id: "mi-pos", text: "Position", feedback: "Ten miles west is present. The intention/request is missing." },
        { id: "mi-alt", text: "Altitude", feedback: "Two thousand feet is present. The intention/request is missing." },
      ],
      correctId: "mi-int",
    }),
    readbackExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.first-call.trainer",
      title: "First call trainer",
      description: "Make the first call to the unfamiliar aerodrome.",
      headerInstruction: "You are ten miles west of Hilltown at two thousand feet, inbound to land. Request joining information.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-unfamiliar-aerodrome.first-call.trainer.r1",
          atcText: "You are ten miles west of Hilltown, two thousand feet, inbound to land.",
          atcSpoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, ten miles west, two thousand feet, inbound to land, request joining information.",
          expectedReadback: "Hilltown Radio, G-ABCD, ten miles west, two thousand feet, inbound to land, request joining information.",
          expectedReadbackSpoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, ten miles west, two thousand feet, inbound to land, request joining information.",
        },
      ],
    }),
  ],
};

const uaRequestInfoTopic: Topic = {
  id: "rfr-unfamiliar-aerodrome.request-info",
  name: "Request Joining Information",
  description: "Joining information is not a landing clearance.",
  unit: "exercises",
  exercises: [
    lessonExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.request-info.lesson",
      title: "Request Joining Information",
      description: "What joining information is and how to ask for it.",
      lessonBody:
        "Joining information is not a landing clearance. It gives runway, circuit, QNH or joining method. Keep the request simple.",
      points: [
        '"Request joining information" or "request airfield information".',
        "It provides runway, circuit and QNH — not a landing clearance.",
        "Keep the request short.",
        "Acknowledge the information when it is passed.",
      ],
      examples: [
        {
          label: "Joining information request",
          atcText: "G-ABCD, request joining information.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request joining information.",
          readback: "G-ABCD, request joining information.",
        },
      ],
    }),
    chipExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.request-info.build",
      title: "Request joining information",
      description: "Build the joining information request.",
      screenKicker: "Listening",
      headerInstruction: "Build the joining information request.",
      atcText: "G-ABCD, request joining information.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request joining information.",
      prompt: "Build the request.",
      expected: [
        { id: "ri-cs", text: "G-ABCD" },
        { id: "ri-req", text: "request joining information" },
      ],
      distractors: [
        { id: "ri-d-land", text: "cleared to land" },
        { id: "ri-d-taxi", text: "request taxi" },
      ],
      expectedSentence: "G-ABCD, request joining information.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, request joining information.",
      correctFeedback: "Correct. A short, clear request.",
      incorrectFeedback: "Build: callsign · request joining information.",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.request-info.info-or-clearance",
      title: "Airfield info or clearance?",
      description: "Decide whether airfield information is a clearance.",
      screenKicker: "Choice",
      instruction: "The station passes: Runway 27, left-hand circuit, QNH 1016.",
      question: "Is this a landing clearance?",
      atcDisplay: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
      atcHidden: true,
      options: [
        { id: "ioc-info", text: "No, it is airfield / joining information.", feedback: "Correct. Runway, circuit and QNH are information, not a clearance to land." },
        { id: "ioc-readback", text: "Yes — once you read it back you are cleared to land.", feedback: "No — reading back information does not create a landing clearance." },
        { id: "ioc-joinland", text: "Yes, it authorises you to join and land.", feedback: "No — it tells you how the circuit works; a landing clearance is separate." },
        { id: "ioc-enter", text: "No, but it clears you into the circuit to land.", feedback: "No — it is information only. Joining and landing are authorised separately." },
      ],
      correctId: "ioc-info",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.request-info.choose-request",
      title: "Choose the correct request",
      description: "Select the right request for the situation.",
      screenKicker: "Choice",
      instruction: "You are inbound to an unfamiliar aerodrome and need runway / circuit information.",
      question: "Which request is correct?",
      options: [
        { id: "cr-info", text: "G-ABCD, request joining information.", feedback: "Correct. This asks for the runway, circuit and QNH you need." },
        { id: "cr-land", text: "G-ABCD, request landing clearance.", feedback: "Joining information is not the same as a landing clearance. Request the information first, then land when cleared." },
        { id: "cr-stand", text: "G-ABCD, inbound to land, runway 27.", feedback: "You are assuming the runway — request the information first, do not assume which runway is in use." },
        { id: "cr-lineup", text: "G-ABCD, request traffic information.", feedback: "Traffic information tells you about other aircraft, not the runway, circuit or QNH you need for joining." },
      ],
      correctId: "cr-info",
    }),
    readbackExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.request-info.trainer",
      title: "Information request trainer",
      description: "Request joining information.",
      headerInstruction: "You are inbound and need runway and circuit information. Make the request.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-unfamiliar-aerodrome.request-info.trainer.r1",
          atcText: "You need the runway, circuit and QNH for the unfamiliar aerodrome.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request joining information.",
          expectedReadback: "G-ABCD, request joining information.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, request joining information.",
        },
      ],
    }),
  ],
};

const uaRunwayCircuitQnhTopic: Topic = {
  id: "rfr-unfamiliar-aerodrome.runway-circuit-qnh",
  name: "Runway, Circuit & QNH Update",
  description: "Extract runway, circuit direction and QNH and acknowledge them.",
  unit: "exercises",
  exercises: [
    lessonExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.runway-circuit-qnh.lesson",
      title: "Runway, Circuit & QNH Update",
      description: "Extract each item and acknowledge clearly.",
      lessonBody:
        "Unfamiliar aerodromes may pass runway, circuit direction and QNH together. Extract each item and acknowledge clearly. Do not treat this as a landing clearance.",
      points: [
        "Runway — e.g. runway 27.",
        "Circuit direction — e.g. left-hand circuit.",
        "QNH — read digit by digit, e.g. QNH 1016.",
        "Acknowledge with your callsign; it is not a landing clearance.",
      ],
      examples: [
        {
          label: "Airfield information",
          atcText: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
          readback: "Runway 27, left-hand circuit, QNH 1016, G-ABCD.",
        },
      ],
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.runway-circuit-qnh.extract-runway",
      title: "Extract the runway",
      description: "Identify the runway from the information.",
      screenKicker: "Listening",
      instruction: "Listen to the airfield information.",
      question: "Which runway is in use?",
      atcDisplay: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
      atcHidden: true,
      options: [
        { id: "er-27", text: "Runway 27", feedback: "Correct. The station passed runway two seven." },
        { id: "er-25", text: "Runway 25", feedback: "No — the station said two seven, not two five." },
        { id: "er-29", text: "Runway 29", feedback: "No — the station said two seven, not two niner." },
        { id: "er-09", text: "Runway 09", feedback: "No — the reciprocal of runway 27 is 09, but the station passed runway two seven." },
      ],
      correctId: "er-27",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.runway-circuit-qnh.extract-circuit",
      title: "Confirm the airfield information",
      description: "Hold all three items from the airfield information.",
      screenKicker: "Listening",
      instruction: "Listen to the airfield information.",
      question: "Which summary matches exactly what was passed?",
      atcDisplay: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
      atcHidden: true,
      options: [
        { id: "ec-correct", text: "Runway 27, left-hand circuit, QNH 1016.", feedback: "Correct. All three items match what the station passed." },
        { id: "ec-circuit", text: "Runway 27, right-hand circuit, QNH 1016.", feedback: "No — the circuit was left-hand, not right-hand." },
        { id: "ec-rwy", text: "Runway 09, left-hand circuit, QNH 1016.", feedback: "No — the runway was 27, not 09." },
        { id: "ec-qnh", text: "Runway 27, left-hand circuit, QNH 1006.", feedback: "No — the QNH was 1016, not 1006." },
      ],
      correctId: "ec-correct",
    }),
    chipExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.runway-circuit-qnh.build-ack",
      title: "Build the acknowledgement",
      description: "Order the parts of the acknowledgement.",
      screenKicker: "Listening",
      headerInstruction: "Build the acknowledgement of the airfield information.",
      atcText: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
      prompt: "Build the acknowledgement.",
      expected: [
        { id: "ba-rwy", text: "Runway 27" },
        { id: "ba-circuit", text: "left-hand circuit" },
        { id: "ba-qnh", text: "QNH 1016" },
        { id: "ba-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ba-d-rwy", text: "Runway 36" },
        { id: "ba-d-qnh", text: "QNH 1011" },
      ],
      expectedSentence: "Runway 27, left-hand circuit, QNH 1016, G-ABCD.",
      expectedSpoken: "Runway two seven, left-hand circuit, QNH one zero one six, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Runway, circuit, QNH and callsign.",
      incorrectFeedback: "Order: runway · circuit · QNH · callsign.",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.runway-circuit-qnh.wrong-qnh",
      title: "Wrong QNH detection",
      description: "Spot the incorrect QNH in the readback.",
      screenKicker: "Error detection",
      instruction: "The station passed QNH 1016. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
      shownReadback: "Runway 27, left-hand circuit, QNH 1011, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wq-qnh", text: "Wrong QNH. The station passed 1016.", feedback: "Correct. The pilot read back QNH 1011 instead of 1016." },
        { id: "wq-rwy", text: "The runway is wrong.", feedback: "Runway 27 matches. The QNH is wrong." },
        { id: "wq-circuit", text: "The circuit is wrong.", feedback: "Left-hand matches. The QNH is wrong." },
        { id: "wq-none", text: "Nothing is wrong.", feedback: "The QNH should be 1016, not 1011." },
      ],
      correctId: "wq-qnh",
    }),
  ],
};

const uaJoinTopic: Topic = {
  id: "rfr-unfamiliar-aerodrome.joining",
  name: "Joining Instruction with Limited Familiarity",
  description: "Read back the joining instruction without adding a landing clearance.",
  unit: "exercises",
  exercises: [
    lessonExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.joining.lesson",
      title: "Joining Instruction with Limited Familiarity",
      description: "How to read back a joining instruction at a new aerodrome.",
      lessonBody:
        "The joining instruction tells you how to enter the circuit. The runway and report point matter. Read back the leg, runway and report instruction — do not add a landing clearance you have not received.",
      points: [
        "Identify the join leg (e.g. left base).",
        "Read back the runway and report point.",
        "Include your callsign.",
        "Do not add cleared to land.",
      ],
      examples: [
        {
          label: "Joining instruction",
          atcText: "G-ABCD, join left base runway 27, report base.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, join left base runway two seven, report base.",
          readback: "Join left base runway 27, report base, G-ABCD.",
        },
      ],
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.joining.base-or-downwind",
      title: "Join base or downwind?",
      description: "Identify the joining leg.",
      screenKicker: "Listening",
      instruction: "Listen to the joining instruction.",
      question: "Where must you join?",
      atcDisplay: "G-ABCD, join left base runway 27, report base.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, join left base runway two seven, report base.",
      atcHidden: true,
      options: [
        { id: "bd-base", text: "Join left base", feedback: "Correct. The instruction is join left base." },
        { id: "bd-downwind", text: "Join downwind", feedback: "No — the instruction is join left base." },
        { id: "bd-final", text: "Report final", feedback: "No — you were told to join left base and report base." },
        { id: "bd-vacate", text: "Vacate runway", feedback: "No — you are joining, not vacating." },
      ],
      correctId: "bd-base",
    }),
    chipExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.joining.build-readback",
      title: "Build the joining readback",
      description: "Order the parts of the joining readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the joining readback.",
      atcText: "G-ABCD, join left base runway 27, report base.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, join left base runway two seven, report base.",
      prompt: "Build the readback.",
      expected: [
        { id: "jr-join", text: "Join left base runway 27" },
        { id: "jr-report", text: "report base" },
        { id: "jr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "jr-d-down", text: "Join downwind runway 27" },
        { id: "jr-d-land", text: "cleared to land" },
      ],
      expectedSentence: "Join left base runway 27, report base, G-ABCD.",
      expectedSpoken: "Join left base runway two seven, report base, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Join leg, runway, report point and callsign.",
      incorrectFeedback: "Order: join leg · runway · report point · callsign.",
    }),
    choiceExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.joining.wrong-runway",
      title: "Wrong runway detection",
      description: "Spot the incorrect runway in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said join left base runway 27. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, join left base runway 27, report base.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, join left base runway two seven, report base.",
      shownReadback: "Join left base runway 36, report base, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wrn-rwy", text: "Wrong runway. ATC said runway 27.", feedback: "Correct. The pilot read back runway 36 instead of runway 27." },
        { id: "wrn-leg", text: "The join leg is wrong.", feedback: "Left base matches. The runway is wrong." },
        { id: "wrn-report", text: "The report point is wrong.", feedback: "Report base matches. The runway is wrong." },
        { id: "wrn-none", text: "Nothing is wrong.", feedback: "ATC said runway 27, not runway 36." },
      ],
      correctId: "wrn-rwy",
    }),
    readbackExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.joining.trainer",
      title: "Unfamiliar join trainer",
      description: "Read back the joining instruction.",
      headerInstruction: "Read back the joining instruction issued by the station.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-unfamiliar-aerodrome.joining.trainer.r1",
          atcText: "G-ABCD, join left base runway 27, report base.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, join left base runway two seven, report base.",
          expectedReadback: "Join left base runway 27, report base, G-ABCD.",
          expectedReadbackSpoken: "Join left base runway two seven, report base, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const uaScenarioTopic: Topic = {
  id: "rfr-unfamiliar-aerodrome.scenario",
  name: "Unfamiliar Aerodrome Scenario",
  description: "First call through to joining the circuit at a new aerodrome.",
  unit: "scenario",
  exercises: [
    scenarioExercise(UA, {
      id: "rfr-unfamiliar-aerodrome.scenario.mission",
      title: "Arriving at Hilltown",
      description: "Make the first call, read back airfield information and the joining instruction, then report base.",
      instruction:
        "You are inbound to Hilltown for the first time. Make the first call, read back the airfield information and joining instruction, then report base.",
      heading: "Arriving at Hilltown",
      completionNote:
        "First call made, airfield information and joining instruction read back, base reported. You have joined the circuit at an unfamiliar aerodrome.",
      callsign: "G-ABCD",
      steps: UNFAMILIAR_SCENARIO_STEPS,
    }),
  ],
};

const unfamiliarTopics: Topic[] = [
  uaFirstCallTopic,
  uaRequestInfoTopic,
  uaRunwayCircuitQnhTopic,
  uaJoinTopic,
  uaScenarioTopic,
];

const unfamiliarAerodrome: Module = {
  id: "rfr-unfamiliar-aerodrome",
  name: "Unfamiliar Aerodrome Operations",
  subtitle: "Arrive at a new aerodrome and request the information you need.",
  unit: "topics",
  topics: unfamiliarTopics,
  exercises: unfamiliarTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 4 — Radio Workload & Corrections                            */
/* ================================================================== */

const WL: StudentPilotPhase = "workload";

const wlLongerTopic: Topic = {
  id: "rfr-workload.longer-instructions",
  name: "Longer Instructions",
  description: "Identify route, restriction and report point in a long instruction.",
  unit: "exercises",
  exercises: [
    lessonExercise(WL, {
      id: "rfr-workload.longer-instructions.lesson",
      title: "Longer Instructions",
      description: "Break a long instruction into its key items.",
      lessonBody:
        "Ready For Radio introduces longer instructions. Identify the route, the restriction and the report instruction. Do not reply only with Roger — read back the key items concisely.",
      points: [
        "Pick out the route (e.g. via North Lake).",
        "Pick out the restriction (e.g. remain outside controlled airspace).",
        "Pick out the report point (e.g. report Hilltown).",
        "Keep the readback concise, with your callsign.",
      ],
      examples: [
        {
          label: "Long instruction",
          atcText: "G-ABCD, route via North Lake, remain outside controlled airspace, report Hilltown.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake, remain outside controlled airspace, report Hilltown.",
          readback: "Route via North Lake, remain outside controlled airspace, report Hilltown, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WL, {
      id: "rfr-workload.longer-instructions.key-items",
      title: "Identify the key items",
      description: "Identify the safety-critical items.",
      screenKicker: "Choice",
      instruction: "ATC transmits a long instruction.",
      question: "Which items are safety-critical and must be read back?",
      atcDisplay: "G-ABCD, route via North Lake, remain outside controlled airspace, report Hilltown.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake, remain outside controlled airspace, report Hilltown.",
      atcHidden: true,
      options: [
        { id: "ki-all", text: "Route, restriction and report point", feedback: "Correct. All three are safety-critical and belong in the readback." },
        { id: "ki-route", text: "Only the route", feedback: "The restriction and report point also matter." },
        { id: "ki-restr", text: "Only the restriction", feedback: "The route and report point also matter." },
        { id: "ki-cs", text: "Only the callsign", feedback: "The callsign is required, but the route, restriction and report point are the safety-critical items." },
      ],
      correctId: "ki-all",
    }),
    chipExercise(WL, {
      id: "rfr-workload.longer-instructions.build-readback",
      title: "Build the priority readback",
      description: "Order the parts of the priority readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the concise priority readback.",
      atcText: "G-ABCD, route via North Lake, remain outside controlled airspace, report Hilltown.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake, remain outside controlled airspace, report Hilltown.",
      prompt: "Build the readback.",
      expected: [
        { id: "pr-route", text: "Route via North Lake" },
        { id: "pr-restr", text: "remain outside controlled airspace" },
        { id: "pr-report", text: "report Hilltown" },
        { id: "pr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "pr-d-roger", text: "Roger" },
        { id: "pr-d-hill", text: "report West Bridge" },
      ],
      expectedSentence: "Route via North Lake, remain outside controlled airspace, report Hilltown, G-ABCD.",
      expectedSpoken: "Route via North Lake, remain outside controlled airspace, report Hilltown, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Route, restriction, report point and callsign — no filler.",
      incorrectFeedback: "Order: route · restriction · report point · callsign.",
    }),
    choiceExercise(WL, {
      id: "rfr-workload.longer-instructions.missing-restriction",
      title: "Missing restriction detection",
      description: "Spot the missing item in the readback.",
      screenKicker: "Error detection",
      instruction: "Compare the readback with the instruction.",
      question: "What is missing?",
      atcDisplay: "G-ABCD, route via North Lake, remain outside controlled airspace, report Hilltown.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake, remain outside controlled airspace, report Hilltown.",
      shownReadback: "Route via North Lake, report Hilltown, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mr-restr", text: "The restriction: remain outside controlled airspace.", feedback: "Correct. The safety-critical restriction was dropped from the readback." },
        { id: "mr-route", text: "The route.", feedback: "Via North Lake is present. The restriction is missing." },
        { id: "mr-report", text: "The report point.", feedback: "Report Hilltown is present. The restriction is missing." },
        { id: "mr-cs", text: "The callsign.", feedback: "G-ABCD is present. The restriction is missing." },
      ],
      correctId: "mr-restr",
    }),
    readbackExercise(WL, {
      id: "rfr-workload.longer-instructions.trainer",
      title: "Long instruction trainer",
      description: "Read back a long instruction concisely.",
      headerInstruction: "Read back the full instruction concisely, with your callsign.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-workload.longer-instructions.trainer.r1",
          atcText: "G-ABCD, route via North Lake, remain outside controlled airspace, report Hilltown.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake, remain outside controlled airspace, report Hilltown.",
          expectedReadback: "Route via North Lake, remain outside controlled airspace, report Hilltown, G-ABCD.",
          expectedReadbackSpoken: "Route via North Lake, remain outside controlled airspace, report Hilltown, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const wlPriorityTopic: Topic = {
  id: "rfr-workload.prioritising",
  name: "Prioritising the Readback",
  description: "Read back what matters — Roger is not enough for an instruction.",
  unit: "exercises",
  exercises: [
    lessonExercise(WL, {
      id: "rfr-workload.prioritising.lesson",
      title: "Prioritising the Readback",
      description: "Decide what must be read back and what can be left out.",
      lessonBody:
        "Not every word needs to be repeated. Restrictions, clearances, route, altitude, runway and report points matter most. Roger is not enough for an instruction that requires a readback.",
      points: [
        "Read back restrictions, clearances, route, altitude, runway and report points.",
        "Roger is not a readback.",
        "Keep it concise but complete on the critical items.",
        "Always include the callsign.",
      ],
      examples: [
        {
          label: "Too vague",
          atcText: "Roger, G-ABCD.",
          atcSpoken: "Roger, Golf Alfa Bravo Charlie Delta.",
          readback: "Remain outside controlled airspace, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WL, {
      id: "rfr-workload.prioritising.what-readback",
      title: "What must be read back?",
      description: "Identify what to read back.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "What must be read back?",
      atcDisplay: "G-ABCD, remain outside controlled airspace and report North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace and report North Lake.",
      atcHidden: true,
      options: [
        { id: "wrb-both", text: "Remain outside controlled airspace and report North Lake", feedback: "Correct. Both the restriction and the report point are read back, with your callsign." },
        { id: "wrb-roger", text: "Only Roger", feedback: "Roger does not confirm the restriction or report point." },
        { id: "wrb-cs", text: "Only the callsign", feedback: "The callsign alone does not confirm the instruction." },
        { id: "wrb-station", text: "Only the station name", feedback: "The station name does not confirm the instruction." },
      ],
      correctId: "wrb-both",
    }),
    choiceExercise(WL, {
      id: "rfr-workload.prioritising.too-vague",
      title: "Readback too vague",
      description: "Spot a readback that is too vague.",
      screenKicker: "Error detection",
      instruction: "ATC gave a restriction. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, remain outside controlled airspace.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace.",
      shownReadback: "Roger, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "tv-vague", text: "Too vague — a restriction must be read back in full.", feedback: "Correct. Remain outside controlled airspace is safety-critical and must be read back." },
        { id: "tv-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is that Roger does not confirm the restriction." },
        { id: "tv-fine", text: "It is acceptable — Roger with the callsign confirms ATC was heard.", feedback: "Roger confirms you heard the transmission, but it does not confirm the restriction. Restrictions must be read back in full." },
        { id: "tv-extra", text: "It has too much detail — Roger alone is enough for a simple message.", feedback: "A remain-outside restriction is not simple — it is safety-critical and must be read back in full." },
      ],
      correctId: "tv-vague",
    }),
    chipExercise(WL, {
      id: "rfr-workload.prioritising.build-concise",
      title: "Build the concise readback",
      description: "Order the parts of the concise readback.",
      screenKicker: "Listening",
      headerInstruction: "Build a concise readback of the instruction.",
      atcText: "G-ABCD, remain outside controlled airspace, report North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, remain outside controlled airspace, report North Lake.",
      prompt: "Build the readback.",
      expected: [
        { id: "bc-restr", text: "Remain outside controlled airspace" },
        { id: "bc-report", text: "report North Lake" },
        { id: "bc-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bc-d-roger", text: "Roger" },
        { id: "bc-d-hill", text: "report Hilltown" },
      ],
      expectedSentence: "Remain outside controlled airspace, report North Lake, G-ABCD.",
      expectedSpoken: "Remain outside controlled airspace, report North Lake, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Restriction, report point and callsign — concise and complete.",
      incorrectFeedback: "Order: restriction · report point · callsign.",
    }),
    choiceExercise(WL, {
      id: "rfr-workload.prioritising.priority-challenge",
      title: "Readback priority challenge",
      description: "Choose the best readback.",
      screenKicker: "Choice",
      instruction: "ATC said: remain outside controlled airspace, report North Lake.",
      question: "Which readback is best?",
      options: [
        { id: "pc-good", text: "Remain outside controlled airspace, report North Lake, G-ABCD.", feedback: "Correct. It confirms both critical items and the callsign." },
        { id: "pc-roger", text: "Roger, G-ABCD.", feedback: "Roger does not confirm the restriction or report point." },
        { id: "pc-report", text: "Report North Lake.", feedback: "Missing the restriction and callsign." },
        { id: "pc-outside", text: "Outside, G-ABCD.", feedback: "Too vague — read back the full restriction and report point." },
      ],
      correctId: "pc-good",
    }),
  ],
};

const wlCorrectionTopic: Topic = {
  id: "rfr-workload.correction",
  name: "Correction After Readback",
  description: "When ATC corrects one item, read back only the corrected item.",
  unit: "exercises",
  exercises: [
    lessonExercise(WL, {
      id: "rfr-workload.correction.lesson",
      title: "Correction After Readback",
      description: "How to handle a correction from ATC.",
      lessonBody:
        "ATC may correct one item after your readback. Listen for the changed item, read back the corrected instruction only, and do not continue with the old instruction.",
      points: [
        '"Correction" signals a changed item.',
        "Identify what changed (e.g. the reporting point).",
        "Read back only the corrected item, with your callsign.",
        "Do not keep using the old instruction.",
      ],
      examples: [
        {
          label: "Correction",
          atcText: "G-ABCD, correction, report West Bridge, not North Lake.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, report West Bridge, not North Lake.",
          readback: "Report West Bridge, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WL, {
      id: "rfr-workload.correction.understand",
      title: "Understand the correction",
      description: "Identify the corrected item.",
      screenKicker: "Choice",
      instruction: "ATC transmits a correction.",
      question: "What should you now report?",
      atcDisplay: "G-ABCD, correction, report West Bridge, not North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, report West Bridge, not North Lake.",
      atcHidden: true,
      options: [
        { id: "uc-west", text: "Report West Bridge", feedback: "Correct. The corrected reporting point is West Bridge." },
        { id: "uc-north", text: "Report North Lake", feedback: "No — North Lake is the old point that was corrected." },
        { id: "uc-final", text: "Report final", feedback: "No — the correction changed the reporting point to West Bridge." },
        { id: "uc-land", text: "Request landing", feedback: "No — this is a correction to the reporting point." },
      ],
      correctId: "uc-west",
    }),
    chipExercise(WL, {
      id: "rfr-workload.correction.build-readback",
      title: "Build the corrected readback",
      description: "Order the parts of the corrected readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the corrected readback.",
      atcText: "G-ABCD, correction, report West Bridge, not North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, report West Bridge, not North Lake.",
      prompt: "Build the readback.",
      expected: [
        { id: "cb-report", text: "Report West Bridge" },
        { id: "cb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cb-d-north", text: "Report North Lake" },
        { id: "cb-d-both", text: "Report West Bridge and North Lake" },
      ],
      expectedSentence: "Report West Bridge, G-ABCD.",
      expectedSpoken: "Report West Bridge, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back only the corrected item, with your callsign.",
      incorrectFeedback: "Read back only the corrected item: report West Bridge · callsign.",
    }),
    choiceExercise(WL, {
      id: "rfr-workload.correction.wrong-correction",
      title: "Wrong correction detection",
      description: "Spot the old reporting point kept in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC corrected the reporting point to West Bridge. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, correction, report West Bridge, not North Lake.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, report West Bridge, not North Lake.",
      shownReadback: "Report North Lake, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wc2-old", text: "The pilot kept the old reporting point.", feedback: "Correct. ATC corrected it to West Bridge, but the pilot read back North Lake." },
        { id: "wc2-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The reporting point is the issue." },
        { id: "wc2-word", text: "The word 'report' is wrong.", feedback: '"Report" is correct. The reporting point is wrong.' },
        { id: "wc2-none", text: "Nothing is wrong.", feedback: "ATC corrected the point to West Bridge, not North Lake." },
      ],
      correctId: "wc2-old",
    }),
    readbackExercise(WL, {
      id: "rfr-workload.correction.trainer",
      title: "Correction trainer",
      description: "Read back a correction.",
      headerInstruction: "Read back the corrected instruction, with your callsign.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-workload.correction.trainer.r1",
          atcText: "G-ABCD, correction, report West Bridge, not North Lake.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, report West Bridge, not North Lake.",
          expectedReadback: "Report West Bridge, G-ABCD.",
          expectedReadbackSpoken: "Report West Bridge, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const wlChangedTopic: Topic = {
  id: "rfr-workload.changed-instruction",
  name: "Changed Instruction",
  description: "A changed instruction replaces the old one — read back the new one.",
  unit: "exercises",
  exercises: [
    lessonExercise(WL, {
      id: "rfr-workload.changed-instruction.lesson",
      title: "Changed Instruction",
      description: "How to handle an instruction that replaces a previous one.",
      lessonBody:
        "A changed instruction replaces the previous one. Do not read back the old instruction. Identify what changed: route, altitude, report point or restriction.",
      points: [
        '"Instead" signals a replacement.',
        "Read back the new instruction only.",
        "Identify what changed.",
        "Include your callsign.",
      ],
      examples: [
        {
          label: "Changed route",
          atcText: "G-ABCD, route via North Lake instead.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake instead.",
          readback: "Route via North Lake, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WL, {
      id: "rfr-workload.changed-instruction.changed-or-repeated",
      title: "Instruction changed or repeated?",
      description: "Decide whether the instruction changed.",
      screenKicker: "Choice",
      instruction: "You were routing direct Hilltown. ATC now transmits:",
      question: "What has happened?",
      atcDisplay: "G-ABCD, route via North Lake instead.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake instead.",
      atcHidden: true,
      options: [
        { id: "cor-changed", text: "The route has changed — fly via North Lake.", feedback: "Correct. \"Instead\" replaces the previous route with via North Lake." },
        { id: "cor-same", text: "The instruction is unchanged; continue direct Hilltown.", feedback: 'No — "instead" replaces the old route. Continuing direct Hilltown would be wrong.' },
        { id: "cor-either", text: "You may choose either route.", feedback: "No — the new instruction replaces the old one; route via North Lake." },
        { id: "cor-both", text: "You must fly direct Hilltown, then via North Lake.", feedback: "No — the new route replaces the old one; do not fly both." },
      ],
      correctId: "cor-changed",
    }),
    chipExercise(WL, {
      id: "rfr-workload.changed-instruction.build-readback",
      title: "Build the new readback",
      description: "Order the parts of the new readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback of the new route.",
      atcText: "G-ABCD, route via North Lake instead.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake instead.",
      prompt: "Build the readback.",
      expected: [
        { id: "cn-route", text: "Route via North Lake" },
        { id: "cn-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cn-d-hill", text: "Direct Hilltown" },
        { id: "cn-d-east", text: "Route via East Lake" },
      ],
      expectedSentence: "Route via North Lake, G-ABCD.",
      expectedSpoken: "Route via North Lake, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back the new route only, with your callsign.",
      incorrectFeedback: "Read back the new route: route via North Lake · callsign.",
    }),
    choiceExercise(WL, {
      id: "rfr-workload.changed-instruction.old-trap",
      title: "Old instruction trap",
      description: "Spot the old instruction kept in the readback.",
      screenKicker: "Error detection",
      instruction: "You were routing direct Hilltown. ATC changed it. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, route via North Lake instead.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake instead.",
      shownReadback: "Direct Hilltown, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ot-old", text: "The pilot read back the old instruction.", feedback: "Correct. ATC changed the route to via North Lake, but the pilot read back direct Hilltown." },
        { id: "ot-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The pilot kept the old route." },
        { id: "ot-word", text: "The word 'direct' is fine.", feedback: "The issue is that the old route was kept instead of the new one." },
        { id: "ot-none", text: "Nothing is wrong.", feedback: "ATC changed the route to via North Lake." },
      ],
      correctId: "ot-old",
    }),
    readbackExercise(WL, {
      id: "rfr-workload.changed-instruction.trainer",
      title: "Changed instruction trainer",
      description: "Read back a changed instruction.",
      headerInstruction: "Read back the changed route, with your callsign.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-workload.changed-instruction.trainer.r1",
          atcText: "G-ABCD, route via North Lake instead.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route via North Lake instead.",
          expectedReadback: "Route via North Lake, G-ABCD.",
          expectedReadbackSpoken: "Route via North Lake, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const wlScenarioTopic: Topic = {
  id: "rfr-workload.scenario",
  name: "Workload Scenario",
  description: "A long instruction, a correction and a changed instruction in sequence.",
  unit: "scenario",
  exercises: [
    scenarioExercise(WL, {
      id: "rfr-workload.scenario.mission",
      title: "Handling the workload",
      description: "Read back a long instruction, then a correction, then a changed instruction.",
      instruction:
        "You are enroute with a flight information service. Read back a long instruction, then a correction, then a changed instruction — without keeping outdated information.",
      heading: "Handling the workload",
      completionNote:
        "You handled a long instruction, a correction and a changed instruction without reading back outdated information.",
      callsign: "G-ETAS",
      steps: WORKLOAD_SCENARIO_STEPS,
    }),
  ],
};

const workloadTopics: Topic[] = [
  wlLongerTopic,
  wlPriorityTopic,
  wlCorrectionTopic,
  wlChangedTopic,
  wlScenarioTopic,
];

const workload: Module = {
  id: "rfr-workload",
  name: "Radio Workload & Corrections",
  subtitle: "Manage long instructions, corrections and changed instructions.",
  unit: "topics",
  topics: workloadTopics,
  exercises: workloadTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 5 — Operational Problem Solving                             */
/* ================================================================== */

const PS: StudentPilotPhase = "problem-solving";

const psUnableTopic: Topic = {
  id: "rfr-problem-solving.unable",
  name: "Unable to Comply",
  description: "Use Unable when you cannot safely comply.",
  unit: "exercises",
  exercises: [
    lessonExercise(PS, {
      id: "rfr-problem-solving.unable.lesson",
      title: "Unable to Comply",
      description: "How and when to say Unable.",
      lessonBody:
        "Use Unable when you cannot safely comply with an instruction. Add a short reason if it helps. Do not accept instructions you cannot comply with, and keep it concise.",
      points: [
        '"Unable" means you cannot safely comply.',
        'Add a short reason when useful: "unable due weather".',
        "Never accept an instruction you cannot safely follow.",
        "Include your callsign.",
      ],
      examples: [
        {
          label: "Unable with reason",
          atcText: "Unable due weather, G-ABCD.",
          atcSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
          readback: "Unable due weather, G-ABCD.",
        },
      ],
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.unable.choose-response",
      title: "Choose the correct response",
      description: "Select the correct response when you cannot comply.",
      screenKicker: "Choice",
      instruction: "ATC gives an instruction you cannot safely comply with due weather.",
      question: "What is the correct response?",
      options: [
        { id: "ucr-unable", text: "Unable due weather, G-ABCD.", feedback: "Correct. State Unable with a short reason and your callsign." },
        { id: "ucr-wilco", text: "Wilco, G-ABCD.", feedback: "Wilco means you will comply — but you cannot safely do so." },
        { id: "ucr-standby", text: "Standby, G-ABCD.", feedback: "Standby only delays your reply; it does not tell ATC you cannot comply." },
        { id: "ucr-roger", text: "Roger, G-ABCD.", feedback: "Roger acknowledges but does not decline an instruction you cannot follow." },
      ],
      correctId: "ucr-unable",
    }),
    chipExercise(PS, {
      id: "rfr-problem-solving.unable.add-reason",
      title: "Add the reason",
      description: "Build the Unable call with a reason.",
      screenKicker: "Listening",
      headerInstruction: "Build the Unable call with a reason.",
      atcText: "Unable due weather, G-ABCD.",
      atcSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
      prompt: "Build the call.",
      expected: [
        { id: "ar-unable", text: "Unable" },
        { id: "ar-reason", text: "due weather" },
        { id: "ar-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ar-d-wilco", text: "Wilco" },
        { id: "ar-d-traffic", text: "due traffic" },
      ],
      expectedSentence: "Unable due weather, G-ABCD.",
      expectedSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Unable, a short reason and your callsign.",
      incorrectFeedback: "Build: Unable · due weather · callsign.",
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.unable.unsafe-compliance",
      title: "Unsafe compliance detection",
      description: "Spot acceptance of an instruction that cannot be complied with.",
      screenKicker: "Error detection",
      instruction: "Weather blocks the route. ATC instructs route direct Hilltown. Check the pilot reply.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, route direct Hilltown.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route direct Hilltown.",
      shownReadback: "Wilco, G-ABCD.",
      shownReadbackLabel: "Pilot reply",
      options: [
        { id: "uc-accept", text: "The pilot accepts an instruction they cannot safely comply with.", feedback: "Correct. Weather blocks the route, so the pilot should reply Unable, not Wilco." },
        { id: "uc-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is accepting an unsafe instruction." },
        { id: "uc-word", text: "Wilco is the wrong word for Roger.", feedback: "The real issue is that the pilot cannot comply and should say Unable." },
        { id: "uc-none", text: "Nothing is wrong.", feedback: "The route is blocked by weather — the pilot should reply Unable." },
      ],
      correctId: "uc-accept",
    }),
    readbackExercise(PS, {
      id: "rfr-problem-solving.unable.trainer",
      title: "Unable trainer",
      description: "Reply Unable with a reason.",
      headerInstruction: "You cannot accept the route due weather. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-problem-solving.unable.trainer.r1",
          atcText: "You cannot accept the route due weather.",
          atcSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
          expectedReadback: "Unable due weather, G-ABCD.",
          expectedReadbackSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const psUncertainPositionTopic: Topic = {
  id: "rfr-problem-solving.uncertain-position",
  name: "Uncertain Position",
  description: "If unsure of position, say so clearly and request assistance.",
  unit: "exercises",
  exercises: [
    lessonExercise(PS, {
      id: "rfr-problem-solving.uncertain-position.lesson",
      title: "Uncertain Position",
      description: "How to communicate an uncertain position.",
      lessonBody:
        "If you are unsure of your position, say so clearly. Include your last known position, altitude and a request for assistance. This is not an emergency declaration unless it escalates — do not hide uncertainty.",
      points: [
        "State that you are unsure of position.",
        "Give your last known position and altitude.",
        "Request assistance.",
        "Do not hide uncertainty.",
      ],
      examples: [
        {
          label: "Uncertain position",
          atcText: "G-ABCD, unsure of position, last known position North Lake, two thousand feet, request assistance.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, unsure of position, last known position North Lake, two thousand feet, request assistance.",
          readback: "G-ABCD, unsure of position, last known position North Lake, two thousand feet, request assistance.",
        },
      ],
    }),
    chipExercise(PS, {
      id: "rfr-problem-solving.uncertain-position.ask-assistance",
      title: "Ask for assistance",
      description: "Build a short uncertain-position call.",
      screenKicker: "Listening",
      headerInstruction: "Build the short uncertain-position call.",
      atcText: "G-ABCD, unsure of position, request assistance.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, unsure of position, request assistance.",
      prompt: "Build the call.",
      expected: [
        { id: "aa-cs", text: "G-ABCD" },
        { id: "aa-unsure", text: "unsure of position" },
        { id: "aa-req", text: "request assistance" },
      ],
      distractors: [
        { id: "aa-d-land", text: "request landing" },
        { id: "aa-d-roger", text: "Roger" },
      ],
      expectedSentence: "G-ABCD, unsure of position, request assistance.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, unsure of position, request assistance.",
      correctFeedback: "Correct. State the problem and request assistance.",
      incorrectFeedback: "Build: callsign · unsure of position · request assistance.",
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.uncertain-position.what-to-include",
      title: "What information should you include?",
      description: "Identify the useful information for the call.",
      screenKicker: "Choice",
      instruction: "You are unsure of your position and want help.",
      question: "What information should you include?",
      options: [
        { id: "wi-all", text: "Last known position, altitude and a request for assistance.", feedback: "Correct. These let the station help you find your position." },
        { id: "wi-min", text: "Only that you are unsure, nothing more.", feedback: "Too little — add your last known position, altitude and a request for assistance." },
        { id: "wi-fuel", text: "Your departure time and fuel remaining.", feedback: "Not the priority here. The station needs your last known position and altitude first." },
        { id: "wi-dest", text: "Only your intended destination.", feedback: "The destination does not help locate you. Give last known position and altitude." },
      ],
      correctId: "wi-all",
    }),
    chipExercise(PS, {
      id: "rfr-problem-solving.uncertain-position.build-full",
      title: "Build the uncertain position call",
      description: "Build the full uncertain-position call.",
      screenKicker: "Listening",
      headerInstruction: "Build the full uncertain-position call.",
      atcText: "G-ABCD, unsure of position, last known position North Lake, two thousand feet, request assistance.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, unsure of position, last known position North Lake, two thousand feet, request assistance.",
      prompt: "Build the full call.",
      expected: [
        { id: "bf2-cs", text: "G-ABCD" },
        { id: "bf2-unsure", text: "unsure of position" },
        { id: "bf2-pos", text: "last known position North Lake" },
        { id: "bf2-alt", text: "two thousand feet" },
        { id: "bf2-req", text: "request assistance" },
      ],
      distractors: [
        { id: "bf2-d-pos", text: "last known position West Bridge" },
        { id: "bf2-d-land", text: "request landing" },
      ],
      expectedSentence: "G-ABCD, unsure of position, last known position North Lake, two thousand feet, request assistance.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, unsure of position, last known position North Lake, two thousand feet, request assistance.",
      correctFeedback: "Correct. Callsign, uncertainty, last known position, altitude and request.",
      incorrectFeedback: "Order: callsign · unsure of position · last known position · altitude · request.",
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.uncertain-position.missing-info",
      title: "Missing key info detection",
      description: "Identify what would make the call more useful.",
      screenKicker: "Error detection",
      instruction: "Check this uncertain-position call.",
      question: "What would make this call more useful?",
      shownReadback: "G-ABCD, unsure of position.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mki-add", text: "Last known position, altitude and request assistance.", feedback: "Correct. These let the station help locate you." },
        { id: "mki-cs", text: "A different callsign.", feedback: "The callsign is fine. The call needs position, altitude and a request." },
        { id: "mki-roger", text: "Adding Roger.", feedback: "Roger adds nothing. The call needs position, altitude and a request." },
        { id: "mki-none", text: "Nothing — it is complete.", feedback: "It lacks last known position, altitude and a request for assistance." },
      ],
      correctId: "mki-add",
    }),
  ],
};

const psNextStationTopic: Topic = {
  id: "rfr-problem-solving.next-station",
  name: "Unable to Reach Next Station",
  description: "Report a contact problem to the station you can still reach.",
  unit: "exercises",
  exercises: [
    lessonExercise(PS, {
      id: "rfr-problem-solving.next-station.lesson",
      title: "Unable to Reach Next Station",
      description: "What to do when you cannot contact the next station.",
      lessonBody:
        "If you cannot contact the next station, report it to the current or previous station while you are still in contact. Do not disappear silently, use the station name and callsign, and do not invent a clearance.",
      points: [
        "Report the problem to the station you can still reach.",
        "Do not go silent.",
        "Use the station name and your callsign.",
        "Never invent a clearance.",
      ],
      examples: [
        {
          label: "Report unable to contact",
          atcText: "Brindale Information, G-ABCD, unable to contact Hilltown Radio.",
          atcSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, unable to contact Hilltown Radio.",
          readback: "Brindale Information, G-ABCD, unable to contact Hilltown Radio.",
        },
      ],
    }),
    chipExercise(PS, {
      id: "rfr-problem-solving.next-station.report-unable",
      title: "Report unable to contact",
      description: "Build the message to the current station.",
      screenKicker: "Listening",
      headerInstruction: "Build the report to the station you can still reach.",
      atcText: "Brindale Information, G-ABCD, unable to contact Hilltown Radio.",
      atcSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, unable to contact Hilltown Radio.",
      prompt: "Build the report.",
      expected: [
        { id: "ru-station", text: "Brindale Information" },
        { id: "ru-cs", text: "G-ABCD" },
        { id: "ru-msg", text: "unable to contact Hilltown Radio" },
      ],
      distractors: [
        { id: "ru-d-station", text: "Hilltown Radio" },
        { id: "ru-d-land", text: "request landing" },
      ],
      expectedSentence: "Brindale Information, G-ABCD, unable to contact Hilltown Radio.",
      expectedSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, unable to contact Hilltown Radio.",
      correctFeedback: "Correct. Tell the station you can still reach.",
      incorrectFeedback: "Build: current station · callsign · unable to contact Hilltown Radio.",
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.next-station.what-not-to-do",
      title: "What should you not do?",
      description: "Identify the action to avoid.",
      screenKicker: "Choice",
      instruction: "You cannot contact Hilltown Radio. Which action would be incorrect?",
      question: "Which action is incorrect?",
      options: [
        { id: "wnd-invent", text: "Continue as if contact was established and do not report the problem.", feedback: "Correct — this is the incorrect action. You must not continue silently. Report the problem to the station you can still reach." },
        { id: "wnd-report", text: "Report to the previous station that you cannot contact Hilltown Radio.", feedback: "This is the correct action — report the problem while you still have contact." },
        { id: "wnd-retry", text: "Try the Hilltown Radio frequency again.", feedback: "Reasonable — try again if workload permits before returning to the previous station." },
        { id: "wnd-return", text: "Return to Brindale Information and report the contact failure.", feedback: "This is a valid and correct action." },
      ],
      correctId: "wnd-invent",
    }),
    readbackExercise(PS, {
      id: "rfr-problem-solving.next-station.trainer",
      title: "Message to current station",
      description: "Report the contact problem to the station you can still reach.",
      headerInstruction: "You are still with Brindale Information but cannot contact Hilltown Radio. Make the report.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "rfr-problem-solving.next-station.trainer.r1",
          atcText: "You are still with Brindale Information but cannot contact Hilltown Radio.",
          atcSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, unable to contact Hilltown Radio.",
          expectedReadback: "Brindale Information, G-ABCD, unable to contact Hilltown Radio.",
          expectedReadbackSpoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, unable to contact Hilltown Radio.",
        },
      ],
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.next-station.wrong-station",
      title: "Wrong station detection",
      description: "Spot the message sent to the wrong station.",
      screenKicker: "Error detection",
      instruction: "You cannot contact Hilltown Radio. Check the pilot call.",
      question: "What is wrong?",
      shownReadback: "Hilltown Radio, G-ABCD, unable to contact Hilltown Radio.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "ws-station", text: "The message should go to the station you can still contact.", feedback: "Correct. Calling Hilltown Radio makes no sense if you cannot reach it — call Brindale Information." },
        { id: "ws-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The wrong station is being called." },
        { id: "ws-msg", text: "The message text is wrong.", feedback: "The content is fine — it is being sent to the wrong station." },
        { id: "ws-none", text: "Nothing is wrong.", feedback: "You cannot reach Hilltown Radio, so address the station you can still contact." },
      ],
      correctId: "ws-station",
    }),
  ],
};

const psWeatherReturnTopic: Topic = {
  id: "rfr-problem-solving.weather-return",
  name: "Weather Change / Request Return",
  description: "Communicate deteriorating weather early and request a safe option.",
  unit: "exercises",
  exercises: [
    lessonExercise(PS, {
      id: "rfr-problem-solving.weather-return.lesson",
      title: "Weather Change / Request Return",
      description: "How to act when weather deteriorates.",
      lessonBody:
        "If weather deteriorates, communicate early. Request a route change or a return. Do not continue into unsafe VFR conditions, and keep the call simple.",
      points: [
        "Communicate early — do not wait until trapped.",
        "Request a route change or a return.",
        "Do not press on into unsafe VFR conditions.",
        "Keep the call simple, with your callsign.",
      ],
      examples: [
        {
          label: "Request return",
          atcText: "G-ABCD, unable to maintain VFR due weather, request return to Brindale.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, unable to maintain VFR due weather, request return to Brindale.",
          readback: "G-ABCD, unable to maintain VFR due weather, request return to Brindale.",
        },
      ],
    }),
    chipExercise(PS, {
      id: "rfr-problem-solving.weather-return.request-return",
      title: "Request return due weather",
      description: "Build the request-return call.",
      screenKicker: "Listening",
      headerInstruction: "Build the request-return call.",
      atcText: "G-ABCD, unable to maintain VFR due weather, request return to Brindale.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, unable to maintain VFR due weather, request return to Brindale.",
      prompt: "Build the call.",
      expected: [
        { id: "rr-cs", text: "G-ABCD" },
        { id: "rr-unable", text: "unable to maintain VFR due weather" },
        { id: "rr-req", text: "request return to Brindale" },
      ],
      distractors: [
        { id: "rr-d-hill", text: "request return to Hilltown" },
        { id: "rr-d-land", text: "cleared to land" },
      ],
      expectedSentence: "G-ABCD, unable to maintain VFR due weather, request return to Brindale.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, unable to maintain VFR due weather, request return to Brindale.",
      correctFeedback: "Correct. State the problem and request a safe option.",
      incorrectFeedback: "Build: callsign · unable to maintain VFR due weather · request return to Brindale.",
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.weather-return.weather-or-nav",
      title: "Weather or navigation problem?",
      description: "Classify the problem in the transmission.",
      screenKicker: "Choice",
      instruction: "A pilot transmits: Unable to maintain VFR due weather.",
      question: "What kind of problem is this, and what is the right response?",
      options: [
        { id: "won-weather", text: "A weather problem — request a route change or return.", feedback: "Correct. VFR cannot be maintained, so request a route change or a return early." },
        { id: "won-nav", text: "A navigation problem — request a position fix.", feedback: "No — the issue is weather, not navigation. Request a route change or return." },
        { id: "won-radio", text: "A radio problem — request a radio check.", feedback: "No — the radio is working; the problem is the weather ahead." },
        { id: "won-traffic", text: "A traffic problem — request traffic information.", feedback: "No — this is about weather, not traffic." },
      ],
      correctId: "won-weather",
    }),
    chipExercise(PS, {
      id: "rfr-problem-solving.weather-return.build-request",
      title: "Build the request",
      description: "Build a concise return request.",
      screenKicker: "Listening",
      headerInstruction: "Build the concise return request.",
      atcText: "Request return to Brindale due weather, G-ABCD.",
      atcSpoken: "Request return to Brindale due weather, Golf Alfa Bravo Charlie Delta.",
      prompt: "Build the request.",
      expected: [
        { id: "brq-req", text: "Request return to Brindale" },
        { id: "brq-reason", text: "due weather" },
        { id: "brq-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "brq-d-hill", text: "Request return to Hilltown" },
        { id: "brq-d-traffic", text: "due traffic" },
      ],
      expectedSentence: "Request return to Brindale due weather, G-ABCD.",
      expectedSpoken: "Request return to Brindale due weather, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. A clear request with a reason and your callsign.",
      incorrectFeedback: "Build: request return to Brindale · due weather · callsign.",
    }),
    choiceExercise(PS, {
      id: "rfr-problem-solving.weather-return.unsafe-continuation",
      title: "Unsafe continuation detection",
      description: "Spot continuation into unsafe conditions.",
      screenKicker: "Error detection",
      instruction: "Weather is deteriorating and VFR cannot be maintained. Check the pilot decision.",
      question: "What is wrong?",
      shownReadback: "Continuing to Hilltown, G-ABCD.",
      shownReadbackLabel: "Pilot decision",
      options: [
        { id: "ucon-unsafe", text: "Unsafe continuation despite deteriorating weather.", feedback: "Correct. VFR cannot be maintained, so continuing to Hilltown is unsafe — request a return or route change." },
        { id: "ucon-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is pressing on into unsafe weather." },
        { id: "ucon-word", text: "The word 'continuing' is informal.", feedback: "The real issue is continuing into conditions where VFR cannot be maintained." },
        { id: "ucon-none", text: "Nothing is wrong.", feedback: "VFR cannot be maintained — continuing is unsafe." },
      ],
      correctId: "ucon-unsafe",
    }),
  ],
};

const psScenarioTopic: Topic = {
  id: "rfr-problem-solving.scenario",
  name: "Problem Solving Scenario",
  description: "Deviate, request return and declare an uncertain position.",
  unit: "scenario",
  exercises: [
    scenarioExercise(PS, {
      id: "rfr-problem-solving.scenario.mission",
      title: "Weather and uncertainty",
      description: "Request a deviation, then a return, then declare an uncertain position.",
      instruction:
        "You are enroute to Hilltown with weather deteriorating. Request a deviation, then a return, then declare an uncertain position and request assistance.",
      heading: "Weather and uncertainty",
      completionNote:
        "You communicated the problem clearly and requested a safe option at each stage.",
      callsign: "G-ABCD",
      steps: PROBLEM_SOLVING_SCENARIO_STEPS,
    }),
  ],
};

const problemSolvingTopics: Topic[] = [
  psUnableTopic,
  psUncertainPositionTopic,
  psNextStationTopic,
  psWeatherReturnTopic,
  psScenarioTopic,
];

const problemSolving: Module = {
  id: "rfr-problem-solving",
  name: "Operational Problem Solving",
  subtitle: "Handle basic VFR problems clearly and request a safe option.",
  unit: "topics",
  topics: problemSolvingTopics,
  exercises: problemSolvingTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* EXPORTS                                                            */
/* ================================================================== */

export const READY_FOR_RADIO_MODULES: Module[] = [
  crossCountry,
  airspace,
  unfamiliarAerodrome,
  workload,
  problemSolving,
];

export const READY_FOR_RADIO_SECTIONS: Section[] = [
  { title: "VFR Operations", modules: READY_FOR_RADIO_MODULES },
];
