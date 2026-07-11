/**
 * AeroComms — Airline Prep content catalog.
 *
 * Level 4. IFR / airline-style communications: the radio flow from IFR clearance
 * to missed approach. Seven modules covering IFR clearance & readback, SID &
 * initial departure, enroute IFR, STAR & descent, holding & delay, approach
 * clearance & vectoring, and missed approach & second plan.
 *
 * Radar vectoring is NOT a standalone module — it is integrated into SID &
 * Initial Departure, Approach Clearance & Vectoring and Missed Approach.
 *
 * Reuses the Student Pilot block renderer (SpSessionScreen) via the shared
 * ExerciseContent / blockType contract. Phraseology follows
 * docs/AeroComms_ICAO_Radiotelephony_Reference.md (decimal not point, full
 * callsign in readbacks, runway digit-by-digit, flight levels digit-by-digit,
 * headings as three digits, Golf Alfa Bravo Charlie Delta).
 *
 * Structure: 7 modules × (4 teaching sections + 1 scenario section).
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
  IFR_CLEARANCE_SCENARIO_STEPS,
  SID_DEPARTURE_SCENARIO_STEPS,
  ENROUTE_IFR_SCENARIO_STEPS,
  STAR_DESCENT_SCENARIO_STEPS,
  HOLDING_SCENARIO_STEPS,
  APPROACH_VECTORING_SCENARIO_STEPS,
  MISSED_APPROACH_SCENARIO_STEPS,
} from "./airlinePrepScenarios";

/* ------------------------------------------------------------------ */
/* Shared builders (mirror the Ready For Radio block contract)         */
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
      spScenarioSteps: opts.steps,
    } satisfies ExerciseContent,
  };
}

/* ================================================================== */
/* MODULE 1 — IFR Clearance & Readback                                */
/* ================================================================== */

const IFRC: StudentPilotPhase = "ifr-clearance";

const ifrcAnatomyTopic: Topic = {
  id: "ap-ifr-clearance.anatomy",
  name: "Clearance Anatomy",
  description: "Break an IFR clearance into its safety-critical parts.",
  unit: "exercises",
  exercises: [
    lessonExercise(IFRC, {
      id: "ap-ifr-clearance.anatomy.lesson",
      title: "Clearance Anatomy",
      description: "What an IFR clearance contains and what must be read back.",
      lessonBody:
        "An IFR clearance is delivered as one block but contains several safety-critical parts. Hear each one: the clearance limit (your destination), the SID, the runway, the initial climb, the squawk, and sometimes route or departure instructions. Your readback must capture the critical items — this is not the short VFR departure call.",
      points: [
        "Clearance limit / destination — e.g. cleared to Madrid.",
        "SID — e.g. LAMSO 1A departure.",
        "Runway — e.g. runway 27.",
        "Initial climb — e.g. climb initially 5000 feet.",
        "Squawk — e.g. squawk 4215.",
        "Read back the critical items, callsign last.",
      ],
      examples: [
        {
          label: "Full IFR clearance",
          atcText: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
          readback: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215, G-ABCD.",
        },
      ],
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.anatomy.clearance-limit",
      title: "Identify the clearance limit",
      description: "Find the clearance limit in the clearance.",
      screenKicker: "Choice",
      instruction: "Listen to the IFR clearance.",
      question: "What is the clearance limit?",
      atcDisplay: "G-ABCD, cleared to LAMSO, climb initially 5000 feet, squawk 4215.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to LAMSO, climb initially five thousand feet, squawk four two one fife.",
      atcHidden: true,
      options: [
        { id: "cl-lamso", text: "LAMSO", feedback: "Correct. LAMSO is the point you are cleared to." },
        { id: "cl-alt", text: "5000 feet", feedback: "5000 feet is the initial climb altitude, not the clearance limit." },
        { id: "cl-squawk", text: "4215", feedback: "4215 is the squawk code, not the clearance limit." },
        { id: "cl-callsign", text: "G-ABCD", feedback: "G-ABCD is the aircraft callsign, not the clearance limit." },
      ],
      correctId: "cl-lamso",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.anatomy.sid-runway",
      title: "Identify SID and runway",
      description: "Extract the SID and departure runway.",
      screenKicker: "Choice",
      instruction: "Listen to the IFR clearance.",
      question: "What SID and runway were assigned?",
      atcDisplay: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
      atcHidden: true,
      options: [
        { id: "sr-1a27", text: "LAMSO 1A departure, runway 27", feedback: "Correct. LAMSO 1A departure off runway 27." },
        { id: "sr-2a27", text: "LAMSO 2A departure, runway 27", feedback: "No — the SID was 1A, not 2A." },
        { id: "sr-1a36", text: "LAMSO 1A departure, runway 36", feedback: "No — the runway was 27, not 36." },
        { id: "sr-none", text: "No SID assigned", feedback: "A SID was assigned: LAMSO 1A departure." },
      ],
      correctId: "sr-1a27",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.anatomy.initial-climb",
      title: "Identify the initial climb",
      description: "Find the initial climb instruction.",
      screenKicker: "Choice",
      instruction: "Listen to the IFR clearance.",
      question: "What is the initial climb?",
      atcDisplay: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
      atcHidden: true,
      options: [
        { id: "ic-5000", text: "Climb initially 5000 feet", feedback: "Correct. The initial climb is 5000 feet." },
        { id: "ic-fl80", text: "Climb FL80", feedback: "No — the initial climb was an altitude, 5000 feet, not a flight level." },
        { id: "ic-2000", text: "Maintain 2000 feet", feedback: "No — there was no 2000 feet restriction in this clearance." },
        { id: "ic-none", text: "No altitude assigned", feedback: "An initial climb was assigned: 5000 feet." },
      ],
      correctId: "ic-5000",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.anatomy.parts-challenge",
      title: "Clearance parts challenge",
      description: "Decide what must be read back.",
      screenKicker: "Choice",
      instruction: "You have copied a full IFR clearance.",
      question: "Which items must be included in the readback?",
      options: [
        { id: "pc-all", text: "Destination, SID, runway, initial climb, squawk and callsign", feedback: "Correct. A full IFR clearance readback captures all the critical items, callsign last." },
        { id: "pc-dest", text: "Only destination and callsign", feedback: "Too little — the SID, runway, initial climb and squawk are all safety-critical." },
        { id: "pc-squawk", text: "Only the squawk", feedback: "The squawk alone is not enough; the whole clearance must be confirmed." },
        { id: "pc-wind", text: "Only runway and wind", feedback: "Wind is not part of an IFR clearance readback; the critical clearance items are." },
      ],
      correctId: "pc-all",
    }),
  ],
};

const ifrcReadbackTopic: Topic = {
  id: "ap-ifr-clearance.readback",
  name: "Full IFR Clearance Readback",
  description: "Read back a full IFR clearance, structured and complete.",
  unit: "exercises",
  exercises: [
    lessonExercise(IFRC, {
      id: "ap-ifr-clearance.readback.lesson",
      title: "Full IFR Clearance Readback",
      description: "How to read back a complete IFR clearance.",
      lessonBody:
        "A full IFR clearance readback must be structured and complete. Do not omit the squawk, SID or initial climb — these are the items ATC is checking. Keep the readback controlled and in a logical order, with your callsign at the end.",
      points: [
        "Read back destination, SID, runway, initial climb and squawk.",
        "Do not drop the squawk — it is frequently missed.",
        "Keep the order logical and the delivery controlled.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Clearance readback",
          atcText: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
          readback: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215, G-ABCD.",
        },
      ],
    }),
    chipExercise(IFRC, {
      id: "ap-ifr-clearance.readback.build",
      title: "Build the clearance readback",
      description: "Order the parts of the IFR clearance readback.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the clearance readback in the correct order.",
      atcText: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
      prompt: "Order the readback.",
      helperText: "Destination · SID · runway · initial climb · squawk · callsign.",
      expected: [
        { id: "br-dest", text: "Cleared to Madrid" },
        { id: "br-sid", text: "via LAMSO 1A departure" },
        { id: "br-rwy", text: "runway 27" },
        { id: "br-climb", text: "climb initially 5000 feet" },
        { id: "br-squawk", text: "squawk 4215" },
        { id: "br-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "br-d-sid", text: "via LAMSO 2A departure" },
        { id: "br-d-squawk", text: "squawk 4251" },
      ],
      expectedSentence: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215, G-ABCD.",
      expectedSpoken: "Cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Destination, SID, runway, initial climb, squawk and callsign.",
      incorrectFeedback: "Order: destination · SID · runway · initial climb · squawk · callsign.",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.readback.missing-squawk",
      title: "Missing squawk detection",
      description: "Spot the omitted item in the readback.",
      screenKicker: "Error detection",
      instruction: "Compare the readback with the clearance.",
      question: "What is missing?",
      atcDisplay: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
      shownReadback: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ms-squawk", text: "The squawk is missing.", feedback: "Correct. Squawk 4215 was dropped from the readback." },
        { id: "ms-sid", text: "The SID is missing.", feedback: "The SID is present — LAMSO 1A departure. The squawk is missing." },
        { id: "ms-climb", text: "The initial climb is missing.", feedback: "The climb is present — 5000 feet. The squawk is missing." },
        { id: "ms-none", text: "Nothing is missing.", feedback: "The squawk 4215 was not read back." },
      ],
      correctId: "ms-squawk",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.readback.wrong-sid",
      title: "Wrong SID readback",
      description: "Spot the incorrect SID in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC assigned LAMSO 1A departure. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
      shownReadback: "Cleared to Madrid via LAMSO 2A departure, runway 27, climb initially 5000 feet, squawk 4215, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wsid-sid", text: "Wrong SID. ATC assigned LAMSO 1A departure.", feedback: "Correct. The pilot read back LAMSO 2A departure instead of 1A." },
        { id: "wsid-rwy", text: "The runway is wrong.", feedback: "Runway 27 matches. The SID is wrong." },
        { id: "wsid-squawk", text: "The squawk is wrong.", feedback: "Squawk 4215 matches. The SID is wrong." },
        { id: "wsid-none", text: "Nothing is wrong.", feedback: "ATC assigned LAMSO 1A departure, not 2A." },
      ],
      correctId: "wsid-sid",
    }),
    readbackExercise(IFRC, {
      id: "ap-ifr-clearance.readback.trainer",
      title: "Full clearance trainer",
      description: "Read back the full IFR clearance.",
      headerInstruction: "Read back the full IFR clearance issued by Delivery.",
      cardLabel: "ATC clearance",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-ifr-clearance.readback.trainer.r1",
          atcText: "G-ABCD, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
          expectedReadback: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215, G-ABCD.",
          expectedReadbackSpoken: "Cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const ifrcRevisionsTopic: Topic = {
  id: "ap-ifr-clearance.revisions",
  name: "Clearance Revisions",
  description: "Handle an amended clearance — read back only what changed.",
  unit: "exercises",
  exercises: [
    lessonExercise(IFRC, {
      id: "ap-ifr-clearance.revisions.lesson",
      title: "Clearance Revisions",
      description: "How to handle an amended IFR clearance.",
      lessonBody:
        "ATC may amend part of the clearance before departure. Identify what changed. The new item replaces the old one — read back the new item, and do not read back the old one.",
      points: [
        '"Amended clearance" signals a change.',
        "Identify what changed (e.g. the SID).",
        "Read back the new item, with your callsign.",
        "Do not read back the superseded item.",
      ],
      examples: [
        {
          label: "Amended clearance",
          atcText: "G-ABCD, amended clearance, LAMSO 2A departure, runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, amended clearance, LAMSO two Alfa departure, runway two seven.",
          readback: "LAMSO 2A departure, runway 27, G-ABCD.",
        },
      ],
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.revisions.understand",
      title: "Understand the amended clearance",
      description: "Identify what changed.",
      screenKicker: "Choice",
      instruction: "Your original clearance had LAMSO 1A departure. ATC now transmits:",
      question: "What changed?",
      atcDisplay: "G-ABCD, amended clearance, LAMSO 2A departure, runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, amended clearance, LAMSO two Alfa departure, runway two seven.",
      atcHidden: true,
      options: [
        { id: "uac-sid", text: "The SID changed to LAMSO 2A", feedback: "Correct. The departure was amended from 1A to LAMSO 2A." },
        { id: "uac-squawk", text: "The squawk changed", feedback: "No — the squawk was not mentioned in the amendment." },
        { id: "uac-dest", text: "The destination changed", feedback: "No — the destination is unchanged; the SID changed." },
        { id: "uac-rwy", text: "The runway changed to 36", feedback: "No — the runway is still 27; the SID changed." },
      ],
      correctId: "uac-sid",
    }),
    chipExercise(IFRC, {
      id: "ap-ifr-clearance.revisions.build",
      title: "Build the amended readback",
      description: "Order the parts of the amended readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback of the amended clearance.",
      atcText: "G-ABCD, amended clearance, LAMSO 2A departure, runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, amended clearance, LAMSO two Alfa departure, runway two seven.",
      prompt: "Build the readback.",
      expected: [
        { id: "ab-sid", text: "LAMSO 2A departure" },
        { id: "ab-rwy", text: "runway 27" },
        { id: "ab-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ab-d-sid", text: "LAMSO 1A departure" },
        { id: "ab-d-rwy", text: "runway 36" },
      ],
      expectedSentence: "LAMSO 2A departure, runway 27, G-ABCD.",
      expectedSpoken: "LAMSO two Alfa departure, runway two seven, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back the amended SID and runway with your callsign.",
      incorrectFeedback: "Order: amended SID · runway · callsign.",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.revisions.old-trap",
      title: "Old clearance trap",
      description: "Spot the superseded SID in the readback.",
      screenKicker: "Error detection",
      instruction: "Your original SID was LAMSO 1A. ATC amended it. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, amended clearance, LAMSO 2A departure.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, amended clearance, LAMSO two Alfa departure.",
      shownReadback: "LAMSO 1A departure, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ot-old", text: "The pilot read back the old SID.", feedback: "Correct. ATC amended it to LAMSO 2A, but the pilot read back the original 1A." },
        { id: "ot-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The pilot kept the superseded SID." },
        { id: "ot-word", text: "The word 'departure' is wrong.", feedback: '"Departure" is correct. The SID number is the issue.' },
        { id: "ot-none", text: "Nothing is wrong.", feedback: "The amendment was LAMSO 2A, not 1A." },
      ],
      correctId: "ot-old",
    }),
    readbackExercise(IFRC, {
      id: "ap-ifr-clearance.revisions.trainer",
      title: "Revision trainer",
      description: "Read back an amended climb.",
      headerInstruction: "Read back the amended clearance issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-ifr-clearance.revisions.trainer.r1",
          atcText: "G-ABCD, amended clearance, climb initially 6000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, amended clearance, climb initially six thousand feet.",
          expectedReadback: "Climb initially 6000 feet, G-ABCD.",
          expectedReadbackSpoken: "Climb initially six thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const ifrcHoldForReleaseTopic: Topic = {
  id: "ap-ifr-clearance.hold-for-release",
  name: "Hold for Release",
  description: "A clearance is not a release — do not depart until released.",
  unit: "exercises",
  exercises: [
    lessonExercise(IFRC, {
      id: "ap-ifr-clearance.hold-for-release.lesson",
      title: "Hold for Release",
      description: "What hold for release means and how to act on it.",
      lessonBody:
        "Hold for release means you have an IFR clearance but cannot depart yet. Do not begin the departure until you are released. Read back the restriction clearly. This is not a takeoff clearance.",
      points: [
        "You have a clearance but are not released to depart.",
        "Do not start the departure until released.",
        "Read back the restriction with your callsign.",
        "This is not a takeoff clearance.",
      ],
      examples: [
        {
          label: "Hold for release",
          atcText: "G-ABCD, IFR clearance valid, hold for release.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, IFR clearance valid, hold for release.",
          readback: "Hold for release, G-ABCD.",
        },
      ],
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.hold-for-release.can-you-depart",
      title: "Hold for release or cleared?",
      description: "Decide whether you may depart.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "Can you depart now?",
      atcDisplay: "G-ABCD, hold for release.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold for release.",
      atcHidden: true,
      options: [
        { id: "cd-no", text: "No, wait until released.", feedback: "Correct. You hold until ATC releases you, even though the clearance is valid." },
        { id: "cd-takeoff", text: "Yes, you are cleared for takeoff.", feedback: "No — a release is not a takeoff clearance, and you have neither yet." },
        { id: "cd-taxi", text: "Yes, start the takeoff roll.", feedback: "No — hold for release means do not begin the departure." },
        { id: "cd-climb", text: "Yes, climb immediately.", feedback: "No — you must wait until released." },
      ],
      correctId: "cd-no",
    }),
    chipExercise(IFRC, {
      id: "ap-ifr-clearance.hold-for-release.build",
      title: "Read back hold for release",
      description: "Build the hold-for-release readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback.",
      atcText: "G-ABCD, hold for release.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold for release.",
      prompt: "Build the readback.",
      expected: [
        { id: "hr-instr", text: "Hold for release" },
        { id: "hr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "hr-d-takeoff", text: "Cleared for takeoff" },
        { id: "hr-d-released", text: "Released for departure" },
      ],
      expectedSentence: "Hold for release, G-ABCD.",
      expectedSpoken: "Hold for release, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back the restriction and your callsign.",
      incorrectFeedback: "Read back: hold for release · callsign.",
    }),
    choiceExercise(IFRC, {
      id: "ap-ifr-clearance.hold-for-release.unsafe-departure",
      title: "Unsafe departure detection",
      description: "Identify the unsafe action after hold for release.",
      screenKicker: "Error detection",
      instruction: "ATC said hold for release. Check the pilot decision.",
      question: "Is this decision safe?",
      atcDisplay: "G-ABCD, hold for release.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold for release.",
      shownReadback: "Departing now, G-ABCD.",
      shownReadbackLabel: "Pilot decision",
      options: [
        { id: "ud-unsafe", text: "Unsafe — you have not been released.", feedback: "Correct. Hold for release means do not depart until released. Departing now is unsafe." },
        { id: "ud-ok", text: "Safe — the clearance is valid.", feedback: "A valid clearance is not a release. You must wait." },
        { id: "ud-minor", text: "A minor issue only.", feedback: "Departing without a release is a serious breach, not minor." },
        { id: "ud-fine", text: "Fine — the callsign is included.", feedback: "The callsign is not the issue. You have not been released." },
      ],
      correctId: "ud-unsafe",
    }),
    readbackExercise(IFRC, {
      id: "ap-ifr-clearance.hold-for-release.trainer",
      title: "Release instruction trainer",
      description: "Read back the release.",
      headerInstruction: "Read back the release issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-ifr-clearance.hold-for-release.trainer.r1",
          atcText: "G-ABCD, released for departure.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, released for departure.",
          expectedReadback: "Released for departure, G-ABCD.",
          expectedReadbackSpoken: "Released for departure, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const ifrcScenarioTopic: Topic = {
  id: "ap-ifr-clearance.scenario",
  name: "IFR Clearance Scenario",
  description: "Request, read back, amend and hold an IFR clearance.",
  unit: "scenario",
  exercises: [
    scenarioExercise(IFRC, {
      id: "ap-ifr-clearance.scenario.mission",
      title: "Copying the IFR clearance",
      description: "Request the clearance, read it back, handle an amendment and a hold for release.",
      instruction:
        "You are on stand at Brindale. Request your IFR clearance to Madrid, read it back in full, read back the amendment, then read back hold for release.",
      heading: "Copying the IFR clearance",
      completionNote:
        "IFR clearance requested, read back, amended and held for release. You have a valid clearance but are not yet released.",
      steps: IFR_CLEARANCE_SCENARIO_STEPS,
    }),
  ],
};

const ifrClearanceTopics: Topic[] = [
  ifrcAnatomyTopic,
  ifrcReadbackTopic,
  ifrcRevisionsTopic,
  ifrcHoldForReleaseTopic,
  ifrcScenarioTopic,
];

const ifrClearance: Module = {
  id: "ap-ifr-clearance",
  name: "IFR Clearance & Readback",
  subtitle: "Copy, read back and amend a full IFR clearance.",
  unit: "topics",
  topics: ifrClearanceTopics,
  exercises: ifrClearanceTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 2 — SID & Initial Departure                                 */
/* ================================================================== */

const SID: StudentPilotPhase = "sid-departure";

const sidContactTopic: Topic = {
  id: "ap-sid-departure.contact",
  name: "Contact Departure",
  description: "Make the first IFR call to Departure after takeoff.",
  unit: "exercises",
  exercises: [
    lessonExercise(SID, {
      id: "ap-sid-departure.contact.lesson",
      title: "Contact Departure",
      description: "How to make the first call to Departure after takeoff.",
      lessonBody:
        "After takeoff you check in with Departure. This is not a radio check — give your callsign, the altitude you are passing and the altitude you are climbing to, so the controller can place you on the departure. Include the climbing altitude every time.",
      points: [
        "Call Departure with your callsign.",
        "State the altitude you are passing.",
        "State the altitude you are climbing to.",
        "This is an operational check-in, not a radio check.",
      ],
      examples: [
        {
          label: "First Departure call",
          atcText: "Departure, G-ABCD, passing 1500 feet, climbing 5000 feet.",
          atcSpoken: "Departure, Golf Alfa Bravo Charlie Delta, passing one thousand five hundred feet, climbing five thousand feet.",
          readback: "Departure, G-ABCD, passing 1500 feet, climbing 5000 feet.",
        },
      ],
    }),
    chipExercise(SID, {
      id: "ap-sid-departure.contact.build",
      title: "Build the first Departure call",
      description: "Order the parts of the first Departure call.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the first Departure call in the correct order.",
      atcText: "Departure, G-ABCD, passing 1500 feet, climbing 5000 feet.",
      atcSpoken: "Departure, Golf Alfa Bravo Charlie Delta, passing one thousand five hundred feet, climbing five thousand feet.",
      prompt: "Order the call.",
      helperText: "Station · callsign · passing altitude · climbing altitude.",
      expected: [
        { id: "fd-station", text: "Departure" },
        { id: "fd-cs", text: "G-ABCD" },
        { id: "fd-passing", text: "passing 1500 feet" },
        { id: "fd-climbing", text: "climbing 5000 feet" },
      ],
      distractors: [
        { id: "fd-d-passing", text: "passing 2500 feet" },
        { id: "fd-d-climbing", text: "descending 5000 feet" },
      ],
      expectedSentence: "Departure, G-ABCD, passing 1500 feet, climbing 5000 feet.",
      expectedSpoken: "Departure, Golf Alfa Bravo Charlie Delta, passing one thousand five hundred feet, climbing five thousand feet.",
      correctFeedback: "Correct. Station, callsign, passing altitude and climbing altitude.",
      incorrectFeedback: "Order: station · callsign · passing altitude · climbing altitude.",
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.contact.missing-passing",
      title: "Missing passing altitude",
      description: "Spot the missing element in the Departure call.",
      screenKicker: "Error detection",
      instruction: "Check this first Departure call.",
      question: "What is missing?",
      shownReadback: "Departure, G-ABCD, climbing 5000 feet.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mp-passing", text: "The passing altitude.", feedback: "Correct. Without the passing altitude, Departure cannot place you on the climb." },
        { id: "mp-cs", text: "The callsign.", feedback: "G-ABCD is present. The passing altitude is missing." },
        { id: "mp-climb", text: "The climbing altitude.", feedback: "Climbing 5000 feet is present. The passing altitude is missing." },
        { id: "mp-none", text: "Nothing is missing.", feedback: "The passing altitude was not stated." },
      ],
      correctId: "mp-passing",
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.contact.climbing-to-what",
      title: "Climbing to what?",
      description: "Interpret the climb in the call.",
      screenKicker: "Choice",
      instruction: "Listen to the Departure call.",
      question: "What altitude is the aircraft climbing to?",
      atcDisplay: "Departure, G-ABCD, passing 1500 feet, climbing 5000 feet.",
      atcSpoken: "Departure, Golf Alfa Bravo Charlie Delta, passing one thousand five hundred feet, climbing five thousand feet.",
      atcHidden: true,
      options: [
        { id: "cw-5000", text: "Climbing 5000 feet", feedback: "Correct. Passing 1500 feet, climbing to 5000 feet." },
        { id: "cw-1500", text: "Maintaining 1500 feet", feedback: "No — 1500 feet is the passing altitude, not the target." },
        { id: "cw-desc", text: "Descending 5000 feet", feedback: "No — the aircraft is climbing, not descending." },
        { id: "cw-fl180", text: "Cleared FL180", feedback: "No — no flight level was mentioned in this call." },
      ],
      correctId: "cw-5000",
    }),
    readbackExercise(SID, {
      id: "ap-sid-departure.contact.trainer",
      title: "Departure call trainer",
      description: "Make the first call to Departure.",
      headerInstruction: "You are passing 1500 feet, climbing 5000 feet. Make the first call to Departure.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-sid-departure.contact.trainer.r1",
          atcText: "You are passing 1500 feet, climbing 5000 feet.",
          atcSpoken: "Departure, Golf Alfa Bravo Charlie Delta, passing one thousand five hundred feet, climbing five thousand feet.",
          expectedReadback: "Departure, G-ABCD, passing 1500 feet, climbing 5000 feet.",
          expectedReadbackSpoken: "Departure, Golf Alfa Bravo Charlie Delta, passing one thousand five hundred feet, climbing five thousand feet.",
        },
      ],
    }),
  ],
};

const sidClimbTopic: Topic = {
  id: "ap-sid-departure.climb",
  name: "SID Climb Instructions",
  description: "Read back climb instructions to a flight level.",
  unit: "exercises",
  exercises: [
    lessonExercise(SID, {
      id: "ap-sid-departure.climb.lesson",
      title: "SID Climb Instructions",
      description: "How to read back a climb to a flight level.",
      lessonBody:
        "Departure may issue a new climb instruction. Read back the altitude or flight level with your callsign. Flight levels are spoken digit by digit. Do not confuse an altitude in feet with a flight level.",
      points: [
        "Read back the cleared level with your callsign.",
        "Flight levels are spoken digit by digit: flight level eight zero.",
        "An altitude (feet) and a flight level are different.",
        "Confirm exactly what was assigned.",
      ],
      examples: [
        {
          label: "Climb to a flight level",
          atcText: "G-ABCD, climb FL80.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level eight zero.",
          readback: "Climb FL80, G-ABCD.",
        },
      ],
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.climb.identify-level",
      title: "Identify the cleared level",
      description: "Extract the assigned level.",
      screenKicker: "Choice",
      instruction: "Listen to the climb instruction.",
      question: "What level were you cleared to?",
      atcDisplay: "G-ABCD, climb FL80.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level eight zero.",
      atcHidden: true,
      options: [
        { id: "il-fl80", text: "FL80", feedback: "Correct. Climb flight level eight zero." },
        { id: "il-5000", text: "5000 feet", feedback: "No — this was a flight level, FL80, not an altitude in feet." },
        { id: "il-fl180", text: "FL180", feedback: "No — the level was eight zero, not one eight zero." },
        { id: "il-rwy", text: "Runway 27", feedback: "No — this is a climb instruction, not a runway." },
      ],
      correctId: "il-fl80",
    }),
    chipExercise(SID, {
      id: "ap-sid-departure.climb.build",
      title: "Build the climb readback",
      description: "Order the parts of the climb readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the climb readback.",
      atcText: "G-ABCD, climb FL80.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level eight zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "cb-climb", text: "Climb FL80" },
        { id: "cb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cb-d-fl", text: "Climb FL100" },
        { id: "cb-d-alt", text: "Climb 8000 feet" },
      ],
      expectedSentence: "Climb FL80, G-ABCD.",
      expectedSpoken: "Climb flight level eight zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Climb, flight level and callsign.",
      incorrectFeedback: "Read back: climb FL80 · callsign.",
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.climb.wrong-level",
      title: "Wrong level detection",
      description: "Spot the incorrect flight level in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said climb FL80. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, climb FL80.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level eight zero.",
      shownReadback: "Climb FL100, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wl-level", text: "Wrong flight level. ATC said FL80.", feedback: "Correct. The pilot read back FL100 instead of FL80." },
        { id: "wl-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The flight level is wrong." },
        { id: "wl-word", text: "The word 'climb' is wrong.", feedback: '"Climb" is correct. The flight level is wrong.' },
        { id: "wl-none", text: "Nothing is wrong.", feedback: "ATC said FL80, not FL100." },
      ],
      correctId: "wl-level",
    }),
    readbackExercise(SID, {
      id: "ap-sid-departure.climb.trainer",
      title: "Climb instruction trainer",
      description: "Read back the climb to a flight level.",
      headerInstruction: "Read back the climb instruction issued by Departure.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-sid-departure.climb.trainer.r1",
          atcText: "G-ABCD, climb FL80.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level eight zero.",
          expectedReadback: "Climb FL80, G-ABCD.",
          expectedReadbackSpoken: "Climb flight level eight zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const sidHeadingTopic: Topic = {
  id: "ap-sid-departure.heading",
  name: "Heading After Departure",
  description: "Read back assigned headings (radar vectors) after departure.",
  unit: "exercises",
  exercises: [
    lessonExercise(SID, {
      id: "ap-sid-departure.heading.lesson",
      title: "Heading After Departure",
      description: "How to read back an assigned heading, sometimes with a climb.",
      lessonBody:
        "After departure ATC may vector you with an assigned heading. Headings are read back as three digits. A heading is often combined with a climb instruction — read back both. This is radar vectoring applied to the departure.",
      points: [
        "Headings are read back as three digits: heading two seven zero.",
        "Include the turn direction (left / right).",
        "A heading may be combined with a climb — read back both.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Heading with climb",
          atcText: "G-ABCD, turn left heading 270, climb FL80.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, climb flight level eight zero.",
          readback: "Left heading 270, climb FL80, G-ABCD.",
        },
      ],
    }),
    chipExercise(SID, {
      id: "ap-sid-departure.heading.build",
      title: "Turn heading readback",
      description: "Build the heading readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the heading readback.",
      atcText: "G-ABCD, turn left heading 270.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "th-hdg", text: "Left heading 270" },
        { id: "th-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "th-d-right", text: "Right heading 270" },
        { id: "th-d-hdg", text: "Left heading 290" },
      ],
      expectedSentence: "Left heading 270, G-ABCD.",
      expectedSpoken: "Left heading two seven zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Turn direction, heading and callsign.",
      incorrectFeedback: "Read back: left heading 270 · callsign.",
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.heading.heading-or-altitude",
      title: "Heading or altitude?",
      description: "Classify the instruction.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "What kind of instruction is this?",
      atcDisplay: "G-ABCD, turn left heading 270.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero.",
      atcHidden: true,
      options: [
        { id: "ha-hdg", text: "A heading instruction", feedback: "Correct. This is a radar heading — turn left heading 270." },
        { id: "ha-alt", text: "An altitude restriction", feedback: "No — no altitude was given; this is a heading." },
        { id: "ha-freq", text: "A frequency change", feedback: "No — no frequency was given; this is a heading." },
        { id: "ha-route", text: "A departure routing instruction", feedback: "No — this is a radar heading, not a route assignment." },
      ],
      correctId: "ha-hdg",
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.heading.wrong-heading",
      title: "Wrong heading detection",
      description: "Spot the incorrect heading in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said turn left heading 270. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, turn left heading 270.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero.",
      shownReadback: "Left heading 290, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wh-hdg", text: "Wrong heading. ATC said heading 270.", feedback: "Correct. The pilot read back 290 instead of 270." },
        { id: "wh-dir", text: "The turn direction is wrong.", feedback: "Left matches. The heading value is wrong." },
        { id: "wh-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The heading is wrong." },
        { id: "wh-none", text: "Nothing is wrong.", feedback: "ATC said heading 270, not 290." },
      ],
      correctId: "wh-hdg",
    }),
    readbackExercise(SID, {
      id: "ap-sid-departure.heading.trainer",
      title: "Heading + climb trainer",
      description: "Read back a heading combined with a climb.",
      headerInstruction: "Read back the vector and climb issued by Departure.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-sid-departure.heading.trainer.r1",
          atcText: "G-ABCD, turn left heading 270, climb FL80.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, climb flight level eight zero.",
          expectedReadback: "Left heading 270, climb FL80, G-ABCD.",
          expectedReadbackSpoken: "Left heading two seven zero, climb flight level eight zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const sidRestrictionsTopic: Topic = {
  id: "ap-sid-departure.restrictions",
  name: "Departure Restrictions",
  description: "Read back level restrictions on the departure in full.",
  unit: "exercises",
  exercises: [
    lessonExercise(SID, {
      id: "ap-sid-departure.restrictions.lesson",
      title: "Departure Restrictions",
      description: "How to read back a level restriction on the departure.",
      lessonBody:
        "A SID or departure may include level constraints. Read back the restriction in full. Do not drop qualifiers like \"until advised\" or \"not above\" — they change the meaning and are safety-critical.",
      points: [
        "Departure restrictions may cap or hold your level.",
        '"Maintain 5000 feet until advised" holds you until ATC releases the climb.',
        "Read back the whole restriction, including the qualifier.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Level restriction",
          atcText: "G-ABCD, maintain 5000 feet until advised.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, maintain five thousand feet until advised.",
          readback: "Maintain 5000 feet until advised, G-ABCD.",
        },
      ],
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.restrictions.identify",
      title: "Identify the restriction",
      description: "Identify the level restriction.",
      screenKicker: "Choice",
      instruction: "ATC transmits a departure restriction.",
      question: "What is the restriction?",
      atcDisplay: "G-ABCD, maintain 5000 feet until advised.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, maintain five thousand feet until advised.",
      atcHidden: true,
      options: [
        { id: "ir-maintain", text: "Maintain 5000 feet until advised", feedback: "Correct. Hold 5000 feet until ATC advises further climb." },
        { id: "ir-unrestricted", text: "Climb unrestricted", feedback: "No — there is a restriction: maintain 5000 feet until advised." },
        { id: "ir-descend", text: "Descend to 5000 feet", feedback: "No — you maintain 5000 feet; there was no descent." },
        { id: "ir-land", text: "Cleared to land", feedback: "No — you are departing; this is a level restriction." },
      ],
      correctId: "ir-maintain",
    }),
    chipExercise(SID, {
      id: "ap-sid-departure.restrictions.build",
      title: "Build the restricted climb readback",
      description: "Order the parts of the restriction readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback of the restriction.",
      atcText: "G-ABCD, maintain 5000 feet until advised.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, maintain five thousand feet until advised.",
      prompt: "Build the readback.",
      expected: [
        { id: "rb-maintain", text: "Maintain 5000 feet" },
        { id: "rb-until", text: "until advised" },
        { id: "rb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rb-d-alt", text: "Maintain 6000 feet" },
        { id: "rb-d-now", text: "climb now" },
      ],
      expectedSentence: "Maintain 5000 feet until advised, G-ABCD.",
      expectedSpoken: "Maintain five thousand feet until advised, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Level, qualifier and callsign — the restriction in full.",
      incorrectFeedback: "Order: maintain 5000 feet · until advised · callsign.",
    }),
    choiceExercise(SID, {
      id: "ap-sid-departure.restrictions.omitted",
      title: "Restriction omitted detection",
      description: "Spot the missing qualifier in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said maintain 5000 feet until advised. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, maintain 5000 feet until advised.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, maintain five thousand feet until advised.",
      shownReadback: "Maintain 5000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ro-until", text: '"Until advised" is missing.', feedback: "Correct. Dropping \"until advised\" changes the meaning — the qualifier must be read back." },
        { id: "ro-alt", text: "The altitude is wrong.", feedback: "5000 feet matches. The qualifier was dropped." },
        { id: "ro-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The qualifier was dropped." },
        { id: "ro-none", text: "Nothing is wrong.", feedback: '"Until advised" was not read back.' },
      ],
      correctId: "ro-until",
    }),
    readbackExercise(SID, {
      id: "ap-sid-departure.restrictions.trainer",
      title: "SID restriction trainer",
      description: "Read back the level restriction.",
      headerInstruction: "Read back the departure restriction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-sid-departure.restrictions.trainer.r1",
          atcText: "G-ABCD, maintain 5000 feet until advised.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, maintain five thousand feet until advised.",
          expectedReadback: "Maintain 5000 feet until advised, G-ABCD.",
          expectedReadbackSpoken: "Maintain five thousand feet until advised, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const sidScenarioTopic: Topic = {
  id: "ap-sid-departure.scenario",
  name: "SID Departure Scenario",
  description: "Check in, climb, take a vector and hold a restriction.",
  unit: "scenario",
  exercises: [
    scenarioExercise(SID, {
      id: "ap-sid-departure.scenario.mission",
      title: "Flying the SID",
      description: "Contact Departure, read back a climb, a heading and a level restriction.",
      instruction:
        "You are airborne off runway 27. Check in with Departure, then read back the climb, the heading and the level restriction.",
      heading: "Flying the SID",
      completionNote:
        "Departure call made, climb and vector read back, level restriction acknowledged. You are established on the IFR departure.",
      steps: SID_DEPARTURE_SCENARIO_STEPS,
    }),
  ],
};

const sidDepartureTopics: Topic[] = [
  sidContactTopic,
  sidClimbTopic,
  sidHeadingTopic,
  sidRestrictionsTopic,
  sidScenarioTopic,
];

const sidDeparture: Module = {
  id: "ap-sid-departure",
  name: "SID & Initial Departure",
  subtitle: "Check in with Departure and fly the SID with vectors and restrictions.",
  unit: "topics",
  topics: sidDepartureTopics,
  exercises: sidDepartureTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 3 — Enroute IFR                                             */
/* ================================================================== */

const ENR: StudentPilotPhase = "enroute-ifr";

const enrLevelChangesTopic: Topic = {
  id: "ap-enroute-ifr.level-changes",
  name: "Flight Level Changes",
  description: "Read back enroute climbs and descents to flight levels.",
  unit: "exercises",
  exercises: [
    lessonExercise(ENR, {
      id: "ap-enroute-ifr.level-changes.lesson",
      title: "Flight Level Changes",
      description: "How to read back enroute level changes.",
      lessonBody:
        "Enroute IFR uses flight levels. Read back each climb or descent with your callsign. Flight levels are spoken digit by digit — flight level one eight zero, not eighteen thousand. Do not confuse a flight level with an altitude or a heading.",
      points: [
        "Read back the assigned flight level with your callsign.",
        "Flight levels are digit by digit: flight level one eight zero.",
        "Distinguish a flight level from an altitude in feet.",
        "Confirm climb or descend exactly as instructed.",
      ],
      examples: [
        {
          label: "Enroute climb",
          atcText: "G-ABCD, climb FL180.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level one eight zero.",
          readback: "Climb FL180, G-ABCD.",
        },
      ],
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.level-changes.identify",
      title: "Identify the assigned flight level",
      description: "Extract the assigned flight level.",
      screenKicker: "Choice",
      instruction: "Listen to the level change.",
      question: "What flight level were you assigned?",
      atcDisplay: "G-ABCD, climb FL180.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level one eight zero.",
      atcHidden: true,
      options: [
        { id: "il-fl180", text: "FL180", feedback: "Correct. Climb flight level one eight zero." },
        { id: "il-1800", text: "1800 feet", feedback: "No — this is a flight level, FL180, not an altitude." },
        { id: "il-rwy18", text: "Runway 18", feedback: "No — this is a flight level, not a runway." },
        { id: "il-hdg180", text: "Heading 180", feedback: "No — this is a flight level, not a heading." },
      ],
      correctId: "il-fl180",
    }),
    chipExercise(ENR, {
      id: "ap-enroute-ifr.level-changes.build",
      title: "Build the level change readback",
      description: "Order the parts of the level change readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the level change readback.",
      atcText: "G-ABCD, climb FL180.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb flight level one eight zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "lc-climb", text: "Climb FL180" },
        { id: "lc-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "lc-d-fl", text: "Climb FL120" },
        { id: "lc-d-desc", text: "Descend FL180" },
      ],
      expectedSentence: "Climb FL180, G-ABCD.",
      expectedSpoken: "Climb flight level one eight zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Climb, flight level and callsign.",
      incorrectFeedback: "Read back: climb FL180 · callsign.",
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.level-changes.wrong-level",
      title: "Wrong flight level detection",
      description: "Spot the incorrect flight level in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said descend FL120. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, descend FL120.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
      shownReadback: "Descend FL100, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wl-level", text: "Wrong flight level. ATC said FL120.", feedback: "Correct. The pilot read back FL100 instead of FL120." },
        { id: "wl-dir", text: "It should be climb, not descend.", feedback: "Descend matches. The flight level is wrong." },
        { id: "wl-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The flight level is wrong." },
        { id: "wl-none", text: "Nothing is wrong.", feedback: "ATC said FL120, not FL100." },
      ],
      correctId: "wl-level",
    }),
    readbackExercise(ENR, {
      id: "ap-enroute-ifr.level-changes.trainer",
      title: "Level change trainer",
      description: "Read back an enroute descent.",
      headerInstruction: "Read back the level change issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-enroute-ifr.level-changes.trainer.r1",
          atcText: "G-ABCD, descend FL120.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
          expectedReadback: "Descend FL120, G-ABCD.",
          expectedReadbackSpoken: "Descend flight level one two zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const enrDirectTopic: Topic = {
  id: "ap-enroute-ifr.direct",
  name: "Direct Routing",
  description: "Read back a direct-to-fix clearance accurately.",
  unit: "exercises",
  exercises: [
    lessonExercise(ENR, {
      id: "ap-enroute-ifr.direct.lesson",
      title: "Direct Routing",
      description: "How to read back a clearance direct to a fix.",
      lessonBody:
        "ATC may clear you direct to a waypoint or fix. Read back the fix accurately — fix names are easy to confuse, so listen carefully and do not substitute a similar-sounding name.",
      points: [
        '"Proceed direct LAMSO" clears you direct to that fix.',
        "Read back the fix name exactly.",
        "Similar names (LARSO, LUMSO, LAMOS) are traps.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Direct routing",
          atcText: "G-ABCD, proceed direct LAMSO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, proceed direct LAMSO.",
          readback: "Direct LAMSO, G-ABCD.",
        },
      ],
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.direct.to-fix",
      title: "Direct to which fix?",
      description: "Identify the cleared fix.",
      screenKicker: "Choice",
      instruction: "Listen to the direct routing.",
      question: "Which fix are you cleared direct to?",
      atcDisplay: "G-ABCD, proceed direct LAMSO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, proceed direct LAMSO.",
      atcHidden: true,
      options: [
        { id: "tf-lamso", text: "LAMSO", feedback: "Correct. Proceed direct LAMSO." },
        { id: "tf-larso", text: "LARSO", feedback: "No — listen again, the fix is LAMSO." },
        { id: "tf-lumso", text: "LUMSO", feedback: "No — the fix is LAMSO." },
        { id: "tf-lamos", text: "LAMOS", feedback: "No — the fix is LAMSO." },
      ],
      correctId: "tf-lamso",
    }),
    chipExercise(ENR, {
      id: "ap-enroute-ifr.direct.build",
      title: "Build the direct readback",
      description: "Order the parts of the direct readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the direct routing readback.",
      atcText: "G-ABCD, proceed direct LAMSO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, proceed direct LAMSO.",
      prompt: "Build the readback.",
      expected: [
        { id: "db-direct", text: "Direct LAMSO" },
        { id: "db-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "db-d-fix", text: "Direct NARGO" },
        { id: "db-d-larso", text: "Direct LARSO" },
      ],
      expectedSentence: "Direct LAMSO, G-ABCD.",
      expectedSpoken: "Direct LAMSO, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Direct, the fix and your callsign.",
      incorrectFeedback: "Read back: direct LAMSO · callsign.",
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.direct.wrong-waypoint",
      title: "Wrong waypoint detection",
      description: "Spot the incorrect fix in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said proceed direct LAMSO. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, proceed direct LAMSO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, proceed direct LAMSO.",
      shownReadback: "Direct LARSO, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ww-fix", text: "Wrong waypoint. ATC said LAMSO.", feedback: "Correct. The pilot read back LARSO instead of LAMSO." },
        { id: "ww-word", text: "The word 'direct' is wrong.", feedback: '"Direct" is correct. The fix name is wrong.' },
        { id: "ww-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The fix name is wrong." },
        { id: "ww-none", text: "Nothing is wrong.", feedback: "ATC said LAMSO, not LARSO." },
      ],
      correctId: "ww-fix",
    }),
    readbackExercise(ENR, {
      id: "ap-enroute-ifr.direct.trainer",
      title: "Direct routing trainer",
      description: "Read back the direct routing.",
      headerInstruction: "Read back the direct routing issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-enroute-ifr.direct.trainer.r1",
          atcText: "G-ABCD, proceed direct LAMSO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, proceed direct LAMSO.",
          expectedReadback: "Direct LAMSO, G-ABCD.",
          expectedReadbackSpoken: "Direct LAMSO, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const enrFrequencyTopic: Topic = {
  id: "ap-enroute-ifr.frequency",
  name: "Enroute Frequency Transfer",
  description: "Read back a sector handoff: station and frequency.",
  unit: "exercises",
  exercises: [
    lessonExercise(ENR, {
      id: "ap-enroute-ifr.frequency.lesson",
      title: "Enroute Frequency Transfer",
      description: "How to read back a sector handoff.",
      lessonBody:
        "An enroute frequency transfer is a sector handoff between control units — this is not basic frequency training. Read back the station and the frequency. Frequencies use decimal, never point.",
      points: [
        "A handoff transfers you to the next control sector.",
        "Read back the station and the frequency.",
        "Frequencies use decimal: one two four decimal seven zero zero.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Sector handoff",
          atcText: "G-ABCD, contact Madrid Control 124.700.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Madrid Control one two four decimal seven zero zero.",
          readback: "Contact Madrid Control 124.700, G-ABCD.",
        },
      ],
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.frequency.contact-next",
      title: "Contact next control sector",
      description: "Identify the station and frequency.",
      screenKicker: "Choice",
      instruction: "Listen to the handoff.",
      question: "Which station and frequency were given?",
      atcDisplay: "G-ABCD, contact Madrid Control 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Madrid Control one two four decimal seven zero zero.",
      atcHidden: true,
      options: [
        { id: "cn-madrid", text: "Madrid Control 124.700", feedback: "Correct. Contact Madrid Control on one two four decimal seven zero zero." },
        { id: "cn-tower", text: "Brindale Tower 118.100", feedback: "No — the handoff was to Madrid Control, not Brindale Tower." },
        { id: "cn-radio", text: "Hilltown Radio 123.455", feedback: "No — the station was Madrid Control on 124.700." },
        { id: "cn-ground", text: "Ground 121.700", feedback: "No — you are enroute; the handoff was to Madrid Control." },
      ],
      correctId: "cn-madrid",
    }),
    chipExercise(ENR, {
      id: "ap-enroute-ifr.frequency.build",
      title: "Read back frequency + station",
      description: "Order the parts of the handoff readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the handoff readback.",
      atcText: "G-ABCD, contact Madrid Control 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Madrid Control one two four decimal seven zero zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "fb-station", text: "Contact Madrid Control" },
        { id: "fb-freq", text: "124.700" },
        { id: "fb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "fb-d-freq", text: "124.750" },
        { id: "fb-d-station", text: "Contact Brindale Tower" },
      ],
      expectedSentence: "Contact Madrid Control 124.700, G-ABCD.",
      expectedSpoken: "Contact Madrid Control one two four decimal seven zero zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Station, frequency and callsign.",
      incorrectFeedback: "Order: contact Madrid Control · 124.700 · callsign.",
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.frequency.wrong-frequency",
      title: "Wrong frequency detection",
      description: "Spot the incorrect frequency in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said contact Madrid Control 124.700. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, contact Madrid Control 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Madrid Control one two four decimal seven zero zero.",
      shownReadback: "Contact Madrid Control 124.750, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wf-freq", text: "Wrong frequency. ATC said 124.700.", feedback: "Correct. The pilot read back 124.750 instead of 124.700." },
        { id: "wf-station", text: "The station is wrong.", feedback: "Madrid Control matches. The frequency is wrong." },
        { id: "wf-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The frequency is wrong." },
        { id: "wf-none", text: "Nothing is wrong.", feedback: "ATC said 124.700, not 124.750." },
      ],
      correctId: "wf-freq",
    }),
    readbackExercise(ENR, {
      id: "ap-enroute-ifr.frequency.trainer",
      title: "Frequency handoff trainer",
      description: "Read back the sector handoff.",
      headerInstruction: "Read back the frequency transfer issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-enroute-ifr.frequency.trainer.r1",
          atcText: "G-ABCD, contact Madrid Control 124.700.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Madrid Control one two four decimal seven zero zero.",
          expectedReadback: "Contact Madrid Control 124.700, G-ABCD.",
          expectedReadbackSpoken: "Contact Madrid Control one two four decimal seven zero zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const enrAmendmentTopic: Topic = {
  id: "ap-enroute-ifr.amendment",
  name: "Route Amendment",
  description: "Read back an amended enroute route and drop the old one.",
  unit: "exercises",
  exercises: [
    lessonExercise(ENR, {
      id: "ap-enroute-ifr.amendment.lesson",
      title: "Route Amendment",
      description: "How to handle a route amendment enroute.",
      lessonBody:
        "ATC may amend your route enroute. Read back the new route or fix sequence. The amendment replaces the old route — do not continue on the old route once it has been changed.",
      points: [
        '"After LAMSO proceed direct NARGO" amends the route.',
        "Read back the new route or fix sequence.",
        "Do not continue with the old route.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Route amendment",
          atcText: "G-ABCD, after LAMSO proceed direct NARGO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, after LAMSO proceed direct NARGO.",
          readback: "After LAMSO direct NARGO, G-ABCD.",
        },
      ],
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.amendment.identify",
      title: "Identify the amended route",
      description: "Identify the new route.",
      screenKicker: "Choice",
      instruction: "Listen to the route amendment.",
      question: "What is the amended route?",
      atcDisplay: "G-ABCD, after LAMSO proceed direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, after LAMSO proceed direct NARGO.",
      atcHidden: true,
      options: [
        { id: "ar-lamso-nargo", text: "After LAMSO direct NARGO", feedback: "Correct. Continue to LAMSO, then route direct NARGO." },
        { id: "ar-nargo-lamso", text: "After NARGO direct LAMSO", feedback: "No — the order is reversed; it is after LAMSO direct NARGO." },
        { id: "ar-lamso-only", text: "Direct LAMSO only", feedback: "No — the amendment adds a leg after LAMSO direct NARGO." },
        { id: "ar-hold", text: "Hold at LAMSO", feedback: "No — there was no hold; route direct NARGO after LAMSO." },
      ],
      correctId: "ar-lamso-nargo",
    }),
    chipExercise(ENR, {
      id: "ap-enroute-ifr.amendment.build",
      title: "Build the amended route readback",
      description: "Order the parts of the amended route readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the amended route readback.",
      atcText: "G-ABCD, after LAMSO proceed direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, after LAMSO proceed direct NARGO.",
      prompt: "Build the readback.",
      expected: [
        { id: "amb-after", text: "After LAMSO" },
        { id: "amb-direct", text: "direct NARGO" },
        { id: "amb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "amb-d-after", text: "After NARGO" },
        { id: "amb-d-direct", text: "direct LAMSO" },
      ],
      expectedSentence: "After LAMSO direct NARGO, G-ABCD.",
      expectedSpoken: "After LAMSO direct NARGO, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. After the first fix, direct the next, with your callsign.",
      incorrectFeedback: "Order: after LAMSO · direct NARGO · callsign.",
    }),
    choiceExercise(ENR, {
      id: "ap-enroute-ifr.amendment.old-route-trap",
      title: "Old route trap",
      description: "Spot the incomplete/old route in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC amended the route to after LAMSO direct NARGO. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, after LAMSO proceed direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, after LAMSO proceed direct NARGO.",
      shownReadback: "Direct LAMSO, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ort-old", text: "The pilot kept the old/incomplete route.", feedback: "Correct. The amendment was after LAMSO direct NARGO, but the pilot read back direct LAMSO only." },
        { id: "ort-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The amended route was not read back." },
        { id: "ort-word", text: "The word 'direct' is wrong.", feedback: '"Direct" is fine. The amended leg to NARGO is missing.' },
        { id: "ort-none", text: "Nothing is wrong.", feedback: "The amendment after LAMSO direct NARGO was not read back." },
      ],
      correctId: "ort-old",
    }),
    readbackExercise(ENR, {
      id: "ap-enroute-ifr.amendment.trainer",
      title: "Route amendment trainer",
      description: "Read back the amended route.",
      headerInstruction: "Read back the route amendment issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-enroute-ifr.amendment.trainer.r1",
          atcText: "G-ABCD, after LAMSO proceed direct NARGO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, after LAMSO proceed direct NARGO.",
          expectedReadback: "After LAMSO direct NARGO, G-ABCD.",
          expectedReadbackSpoken: "After LAMSO direct NARGO, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const enrScenarioTopic: Topic = {
  id: "ap-enroute-ifr.scenario",
  name: "Enroute IFR Scenario",
  description: "Level change, direct, handoff and route amendment.",
  unit: "scenario",
  exercises: [
    scenarioExercise(ENR, {
      id: "ap-enroute-ifr.scenario.mission",
      title: "Cruising IFR",
      description: "Read back a level change, a direct routing, a frequency transfer and a route amendment.",
      instruction:
        "You are enroute IFR towards LAMSO. Read back the level change, the direct routing, the frequency transfer and the route amendment.",
      heading: "Cruising IFR",
      completionNote:
        "Level change, direct routing, frequency transfer and route amendment all read back. You are established enroute IFR.",
      steps: ENROUTE_IFR_SCENARIO_STEPS,
    }),
  ],
};

const enrouteIfrTopics: Topic[] = [
  enrLevelChangesTopic,
  enrDirectTopic,
  enrFrequencyTopic,
  enrAmendmentTopic,
  enrScenarioTopic,
];

const enrouteIfr: Module = {
  id: "ap-enroute-ifr",
  name: "Enroute IFR",
  subtitle: "Manage levels, directs, handoffs and route amendments in the cruise.",
  unit: "topics",
  topics: enrouteIfrTopics,
  exercises: enrouteIfrTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 4 — STAR & Descent Management                               */
/* ================================================================== */

const STAR: StudentPilotPhase = "star-descent";

const starDescentTopic: Topic = {
  id: "ap-star-descent.descent",
  name: "Descent Clearance",
  description: "Read back a descent clearance to a flight level.",
  unit: "exercises",
  exercises: [
    lessonExercise(STAR, {
      id: "ap-star-descent.descent.lesson",
      title: "Descent Clearance",
      description: "How to read back a descent clearance.",
      lessonBody:
        "A descent clearance assigns a flight level or altitude. Read it back clearly with your callsign, and do not descend below the assigned level until further cleared.",
      points: [
        "Read back the assigned level with your callsign.",
        "Do not descend below the cleared level.",
        "Flight levels are digit by digit.",
        "Confirm descend exactly as instructed.",
      ],
      examples: [
        {
          label: "Descent clearance",
          atcText: "G-ABCD, descend FL120.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
          readback: "Descend FL120, G-ABCD.",
        },
      ],
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.descent.identify",
      title: "Identify the cleared level",
      description: "Extract the cleared level.",
      screenKicker: "Choice",
      instruction: "Listen to the descent clearance.",
      question: "What level were you cleared to?",
      atcDisplay: "G-ABCD, descend FL120.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
      atcHidden: true,
      options: [
        { id: "id-fl120", text: "FL120", feedback: "Correct. Descend flight level one two zero." },
        { id: "id-fl180", text: "FL180", feedback: "No — the level was one two zero, not one eight zero." },
        { id: "id-1200", text: "1200 feet", feedback: "No — this is a flight level, FL120, not an altitude." },
        { id: "id-hdg", text: "Heading 120", feedback: "No — this is a descent to a flight level, not a heading." },
      ],
      correctId: "id-fl120",
    }),
    chipExercise(STAR, {
      id: "ap-star-descent.descent.build",
      title: "Build the descent readback",
      description: "Order the parts of the descent readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the descent readback.",
      atcText: "G-ABCD, descend FL120.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "ddb-desc", text: "Descend FL120" },
        { id: "ddb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ddb-d-fl", text: "Descend FL100" },
        { id: "ddb-d-climb", text: "Climb FL120" },
      ],
      expectedSentence: "Descend FL120, G-ABCD.",
      expectedSpoken: "Descend flight level one two zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Descend, flight level and callsign.",
      incorrectFeedback: "Read back: descend FL120 · callsign.",
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.descent.wrong-level",
      title: "Wrong cleared level detection",
      description: "Spot the incorrect level in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said descend FL120. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, descend FL120.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
      shownReadback: "Descend FL100, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "dwl-level", text: "Wrong cleared level. ATC said FL120.", feedback: "Correct. The pilot read back FL100 instead of FL120 — a descent below the cleared level." },
        { id: "dwl-dir", text: "It should be climb, not descend.", feedback: "Descend matches. The level is wrong." },
        { id: "dwl-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The level is wrong." },
        { id: "dwl-none", text: "Nothing is wrong.", feedback: "ATC said FL120, not FL100." },
      ],
      correctId: "dwl-level",
    }),
    readbackExercise(STAR, {
      id: "ap-star-descent.descent.trainer",
      title: "Descent trainer",
      description: "Read back the descent clearance.",
      headerInstruction: "Read back the descent clearance issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-star-descent.descent.trainer.r1",
          atcText: "G-ABCD, descend FL120.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
          expectedReadback: "Descend FL120, G-ABCD.",
          expectedReadbackSpoken: "Descend flight level one two zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const starStarTopic: Topic = {
  id: "ap-star-descent.star",
  name: "STAR Clearance",
  description: "Read back a STAR clearance without confusing it with a SID.",
  unit: "exercises",
  exercises: [
    lessonExercise(STAR, {
      id: "ap-star-descent.star.lesson",
      title: "STAR Clearance",
      description: "How to read back a standard arrival clearance.",
      lessonBody:
        "A STAR clearance assigns a published arrival route. Read back the STAR exactly. Do not confuse an arrival (STAR) with a departure (SID) — the same name can exist for both.",
      points: [
        '"Cleared LAMSO 1A arrival" assigns the arrival route.',
        "Read back the STAR name and the word arrival.",
        "An arrival (STAR) is not a departure (SID).",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "STAR clearance",
          atcText: "G-ABCD, cleared LAMSO 1A arrival.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared LAMSO one Alfa arrival.",
          readback: "Cleared LAMSO 1A arrival, G-ABCD.",
        },
      ],
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.star.identify",
      title: "Identify the STAR",
      description: "Identify the assigned arrival.",
      screenKicker: "Choice",
      instruction: "Listen to the arrival clearance.",
      question: "Which arrival were you cleared on?",
      atcDisplay: "G-ABCD, cleared LAMSO 1A arrival.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared LAMSO one Alfa arrival.",
      atcHidden: true,
      options: [
        { id: "si-arrival", text: "LAMSO 1A arrival", feedback: "Correct. Cleared on the LAMSO 1A arrival." },
        { id: "si-departure", text: "LAMSO 1A departure", feedback: "No — this is an arrival (STAR), not a departure (SID)." },
        { id: "si-nargo", text: "NARGO 1A arrival", feedback: "No — the arrival is LAMSO 1A, not NARGO 1A." },
        { id: "si-ils", text: "ILS runway 27", feedback: "No — that is an approach, not the STAR you were cleared on." },
      ],
      correctId: "si-arrival",
    }),
    chipExercise(STAR, {
      id: "ap-star-descent.star.build",
      title: "Build the STAR readback",
      description: "Order the parts of the STAR readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the STAR clearance readback.",
      atcText: "G-ABCD, cleared LAMSO 1A arrival.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared LAMSO one Alfa arrival.",
      prompt: "Build the readback.",
      expected: [
        { id: "sb-clear", text: "Cleared LAMSO 1A arrival" },
        { id: "sb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "sb-d-dep", text: "Cleared LAMSO 1A departure" },
        { id: "sb-d-star", text: "Cleared LAMSO 2A arrival" },
      ],
      expectedSentence: "Cleared LAMSO 1A arrival, G-ABCD.",
      expectedSpoken: "Cleared LAMSO one Alfa arrival, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Cleared, the STAR and your callsign.",
      incorrectFeedback: "Read back: cleared LAMSO 1A arrival · callsign.",
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.star.wrong-star",
      title: "Wrong STAR detection",
      description: "Spot the incorrect STAR in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC cleared LAMSO 1A arrival. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cleared LAMSO 1A arrival.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared LAMSO one Alfa arrival.",
      shownReadback: "Cleared LAMSO 2A arrival, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "sws-star", text: "Wrong STAR. ATC said LAMSO 1A arrival.", feedback: "Correct. The pilot read back LAMSO 2A arrival instead of 1A." },
        { id: "sws-type", text: "It should be departure, not arrival.", feedback: "Arrival is correct. The STAR number is wrong." },
        { id: "sws-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The STAR number is wrong." },
        { id: "sws-none", text: "Nothing is wrong.", feedback: "ATC said LAMSO 1A arrival, not 2A." },
      ],
      correctId: "sws-star",
    }),
    readbackExercise(STAR, {
      id: "ap-star-descent.star.trainer",
      title: "STAR clearance trainer",
      description: "Read back the STAR clearance.",
      headerInstruction: "Read back the arrival clearance issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-star-descent.star.trainer.r1",
          atcText: "G-ABCD, cleared LAMSO 1A arrival.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared LAMSO one Alfa arrival.",
          expectedReadback: "Cleared LAMSO 1A arrival, G-ABCD.",
          expectedReadbackSpoken: "Cleared LAMSO one Alfa arrival, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const starSpeedTopic: Topic = {
  id: "ap-star-descent.speed",
  name: "Speed Restrictions",
  description: "Read back assigned speeds on arrival.",
  unit: "exercises",
  exercises: [
    lessonExercise(STAR, {
      id: "ap-star-descent.speed.lesson",
      title: "Speed Restrictions",
      description: "How to read back a speed restriction.",
      lessonBody:
        "Arrivals often include speed control. Read back the assigned speed with your callsign. Do not confuse a speed in knots with a heading, level or runway — listen for the word knots.",
      points: [
        '"Reduce speed 220 knots" assigns a speed.',
        "Read back the speed with your callsign.",
        "Speed in knots is not a heading or a flight level.",
        "A speed may be combined with a descent.",
      ],
      examples: [
        {
          label: "Speed restriction",
          atcText: "G-ABCD, reduce speed 220 knots.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, reduce speed two two zero knots.",
          readback: "Speed 220 knots, G-ABCD.",
        },
      ],
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.speed.identify",
      title: "Identify the speed restriction",
      description: "Extract the assigned speed.",
      screenKicker: "Choice",
      instruction: "Listen to the speed restriction.",
      question: "What speed were you assigned?",
      atcDisplay: "G-ABCD, reduce speed 220 knots.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, reduce speed two two zero knots.",
      atcHidden: true,
      options: [
        { id: "spi-220", text: "220 knots", feedback: "Correct. Reduce speed to 220 knots." },
        { id: "spi-hdg", text: "Heading 220", feedback: "No — this is a speed in knots, not a heading." },
        { id: "spi-fl", text: "FL220", feedback: "No — this is a speed, not a flight level." },
        { id: "spi-rwy", text: "Runway 22", feedback: "No — this is a speed restriction, not a runway." },
      ],
      correctId: "spi-220",
    }),
    chipExercise(STAR, {
      id: "ap-star-descent.speed.build",
      title: "Build the speed readback",
      description: "Order the parts of the speed readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the speed readback.",
      atcText: "G-ABCD, reduce speed 220 knots.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, reduce speed two two zero knots.",
      prompt: "Build the readback.",
      expected: [
        { id: "spb-speed", text: "Speed 220 knots" },
        { id: "spb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "spb-d-speed", text: "Speed 200 knots" },
        { id: "spb-d-hdg", text: "Heading 220" },
      ],
      expectedSentence: "Speed 220 knots, G-ABCD.",
      expectedSpoken: "Speed two two zero knots, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Speed, value in knots and callsign.",
      incorrectFeedback: "Read back: speed 220 knots · callsign.",
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.speed.wrong-speed",
      title: "Wrong speed detection",
      description: "Spot the incorrect speed in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said reduce speed 220 knots. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, reduce speed 220 knots.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, reduce speed two two zero knots.",
      shownReadback: "Speed 200 knots, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "swp-speed", text: "Wrong speed. ATC said 220 knots.", feedback: "Correct. The pilot read back 200 knots instead of 220 knots." },
        { id: "swp-word", text: "The word 'speed' is wrong.", feedback: '"Speed" is correct. The value is wrong.' },
        { id: "swp-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The speed value is wrong." },
        { id: "swp-none", text: "Nothing is wrong.", feedback: "ATC said 220 knots, not 200 knots." },
      ],
      correctId: "swp-speed",
    }),
    readbackExercise(STAR, {
      id: "ap-star-descent.speed.trainer",
      title: "Speed + descent trainer",
      description: "Read back a descent combined with a speed.",
      headerInstruction: "Read back the descent and speed issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-star-descent.speed.trainer.r1",
          atcText: "G-ABCD, descend FL100, reduce speed 220 knots.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one zero zero, reduce speed two two zero knots.",
          expectedReadback: "Descend FL100, speed 220 knots, G-ABCD.",
          expectedReadbackSpoken: "Descend flight level one zero zero, speed two two zero knots, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const starLevelRestrictionsTopic: Topic = {
  id: "ap-star-descent.level-restrictions",
  name: "Level Restrictions on Arrival",
  description: "Read back crossing restrictions precisely.",
  unit: "exercises",
  exercises: [
    lessonExercise(STAR, {
      id: "ap-star-descent.level-restrictions.lesson",
      title: "Level Restrictions on Arrival",
      description: "How to read back a crossing restriction.",
      lessonBody:
        "Arrival clearances may include crossing restrictions. \"At or above\" sets a minimum; \"at or below\" sets a maximum — they are not the same. Read back the restriction precisely, including the fix.",
      points: [
        '"At or above FL100" means a minimum level at the fix.',
        '"At or below" would mean a maximum — different meaning.',
        "Read back the fix and the restriction in full.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Crossing restriction",
          atcText: "G-ABCD, cross LAMSO at or above FL100.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cross LAMSO at or above flight level one zero zero.",
          readback: "Cross LAMSO at or above FL100, G-ABCD.",
        },
      ],
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.level-restrictions.at-or-above",
      title: "At or above / at or below",
      description: "Interpret the crossing restriction.",
      screenKicker: "Choice",
      instruction: "ATC transmits a crossing restriction.",
      question: "What does this restriction mean?",
      atcDisplay: "G-ABCD, cross LAMSO at or above FL100.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cross LAMSO at or above flight level one zero zero.",
      atcHidden: true,
      options: [
        { id: "aoa-min", text: "Minimum FL100 at LAMSO", feedback: "Correct. \"At or above\" sets a minimum — be at FL100 or higher at LAMSO." },
        { id: "aoa-max", text: "Maximum FL100 at LAMSO", feedback: 'No — "at or above" is a minimum, not a maximum.' },
        { id: "aoa-below", text: "Descend below FL100 before LAMSO", feedback: "No — you must be at or above FL100, not below it." },
        { id: "aoa-none", text: "No level restriction", feedback: "There is a restriction: at or above FL100 at LAMSO." },
      ],
      correctId: "aoa-min",
    }),
    chipExercise(STAR, {
      id: "ap-star-descent.level-restrictions.build",
      title: "Build the restriction readback",
      description: "Order the parts of the crossing restriction readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the crossing restriction readback.",
      atcText: "G-ABCD, cross LAMSO at or above FL100.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cross LAMSO at or above flight level one zero zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "lrb-cross", text: "Cross LAMSO" },
        { id: "lrb-restr", text: "at or above FL100" },
        { id: "lrb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "lrb-d-restr", text: "at or below FL100" },
        { id: "lrb-d-fix", text: "Cross NARGO" },
      ],
      expectedSentence: "Cross LAMSO at or above FL100, G-ABCD.",
      expectedSpoken: "Cross LAMSO at or above flight level one zero zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Fix, restriction and callsign.",
      incorrectFeedback: "Order: cross LAMSO · at or above FL100 · callsign.",
    }),
    choiceExercise(STAR, {
      id: "ap-star-descent.level-restrictions.omitted",
      title: "Restriction omitted detection",
      description: "Spot the missing restriction in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said cross LAMSO at or above FL100. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cross LAMSO at or above FL100.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cross LAMSO at or above flight level one zero zero.",
      shownReadback: "Cross LAMSO, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "lro-restr", text: "The level restriction is omitted.", feedback: "Correct. \"At or above FL100\" was dropped — the safety-critical restriction must be read back." },
        { id: "lro-fix", text: "The fix is wrong.", feedback: "LAMSO matches. The restriction was dropped." },
        { id: "lro-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The restriction was dropped." },
        { id: "lro-none", text: "Nothing is wrong.", feedback: "\"At or above FL100\" was not read back." },
      ],
      correctId: "lro-restr",
    }),
    readbackExercise(STAR, {
      id: "ap-star-descent.level-restrictions.trainer",
      title: "STAR restriction trainer",
      description: "Read back the crossing restriction.",
      headerInstruction: "Read back the crossing restriction issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-star-descent.level-restrictions.trainer.r1",
          atcText: "G-ABCD, cross LAMSO at or above FL100.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cross LAMSO at or above flight level one zero zero.",
          expectedReadback: "Cross LAMSO at or above FL100, G-ABCD.",
          expectedReadbackSpoken: "Cross LAMSO at or above flight level one zero zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const starScenarioTopic: Topic = {
  id: "ap-star-descent.scenario",
  name: "STAR & Descent Scenario",
  description: "Descent, STAR, speed and crossing restriction.",
  unit: "scenario",
  exercises: [
    scenarioExercise(STAR, {
      id: "ap-star-descent.scenario.mission",
      title: "Flying the arrival",
      description: "Read back a descent, a STAR clearance, a speed restriction and a crossing restriction.",
      instruction:
        "You are approaching the Madrid terminal area. Read back the descent, the STAR clearance, the speed restriction and the crossing restriction.",
      heading: "Flying the arrival",
      completionNote:
        "Descent, STAR, speed and crossing restriction all read back. You are established on the STAR and descent profile.",
      steps: STAR_DESCENT_SCENARIO_STEPS,
    }),
  ],
};

const starDescentTopics: Topic[] = [
  starDescentTopic,
  starStarTopic,
  starSpeedTopic,
  starLevelRestrictionsTopic,
  starScenarioTopic,
];

const starDescentManagement: Module = {
  id: "ap-star-descent",
  name: "STAR & Descent Management",
  subtitle: "Manage descent, arrival routes, speed and level restrictions.",
  unit: "topics",
  topics: starDescentTopics,
  exercises: starDescentTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 5 — Holding & Delay Management                              */
/* ================================================================== */

const HOLD: StudentPilotPhase = "holding";

const holdAnatomyTopic: Topic = {
  id: "ap-holding.anatomy",
  name: "Hold Instruction Anatomy",
  description: "Break a hold instruction into fix, level and time.",
  unit: "exercises",
  exercises: [
    lessonExercise(HOLD, {
      id: "ap-holding.anatomy.lesson",
      title: "Hold Instruction Anatomy",
      description: "What a hold instruction contains and what to read back.",
      lessonBody:
        "A hold instruction includes the fix, the level, and often an expected further clearance time. Identify what must be read back. This level is about the radio — you do not need to work out the entry procedure here.",
      points: [
        "A hold names a fix to hold over.",
        "It assigns a level to maintain.",
        "It often gives an expected further clearance time.",
        "Read back fix, level and time — entry geometry comes later.",
      ],
      examples: [
        {
          label: "Hold instruction",
          atcText: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
          readback: "Hold at LAMSO, maintain FL100, expect further clearance at two five, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.anatomy.fix",
      title: "Identify the holding fix",
      description: "Find the holding fix.",
      screenKicker: "Choice",
      instruction: "Listen to the hold instruction.",
      question: "What is the holding fix?",
      atcDisplay: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
      atcHidden: true,
      options: [
        { id: "hf-lamso", text: "LAMSO", feedback: "Correct. Hold at LAMSO." },
        { id: "hf-nargo", text: "NARGO", feedback: "No — the holding fix is LAMSO." },
        { id: "hf-hill", text: "Hilltown", feedback: "No — the holding fix is LAMSO." },
        { id: "hf-madrid", text: "Madrid", feedback: "No — Madrid is the destination; the holding fix is LAMSO." },
      ],
      correctId: "hf-lamso",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.anatomy.level",
      title: "Identify the level",
      description: "Find the holding level.",
      screenKicker: "Choice",
      instruction: "Listen to the hold instruction.",
      question: "What level must you maintain in the hold?",
      atcDisplay: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
      atcHidden: true,
      options: [
        { id: "hl-fl100", text: "FL100", feedback: "Correct. Maintain flight level one zero zero." },
        { id: "hl-fl120", text: "FL120", feedback: "No — the level was one zero zero, not one two zero." },
        { id: "hl-1000", text: "1000 feet", feedback: "No — this is a flight level, FL100, not an altitude." },
        { id: "hl-rwy", text: "Runway 10", feedback: "No — this is a level, not a runway." },
      ],
      correctId: "hl-fl100",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.anatomy.time",
      title: "Identify the expected clearance time",
      description: "Find the expected further clearance time.",
      screenKicker: "Choice",
      instruction: "Listen to the hold instruction.",
      question: "What is the expected further clearance time?",
      atcDisplay: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
      atcHidden: true,
      options: [
        { id: "ht-25", text: "Two five", feedback: "Correct. Expect further clearance at two five." },
        { id: "ht-15", text: "One five", feedback: "No — the time was two five, not one five." },
        { id: "ht-35", text: "Three five", feedback: "No — the time was two five, not three five." },
        { id: "ht-none", text: "No time given", feedback: "A time was given: expect further clearance at two five." },
      ],
      correctId: "ht-25",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.anatomy.parts-challenge",
      title: "Holding parts challenge",
      description: "Decide what must be read back.",
      screenKicker: "Choice",
      instruction: "You have copied a hold instruction.",
      question: "Which items must be read back?",
      options: [
        { id: "hp-all", text: "Fix, level and expected clearance time", feedback: "Correct. Read back the fix, the level and the expected further clearance time." },
        { id: "hp-fix", text: "Only the fix", feedback: "Too little — the level and the time are also part of the hold." },
        { id: "hp-cs", text: "Only the callsign", feedback: "The callsign alone is not a readback of the hold." },
        { id: "hp-rwy", text: "Only the runway", feedback: "No runway is part of a hold instruction." },
      ],
      correctId: "hp-all",
    }),
  ],
};

const holdEnteringTopic: Topic = {
  id: "ap-holding.entering",
  name: "Entering the Hold",
  description: "Read back the hold fix, level and expected clearance time.",
  unit: "exercises",
  exercises: [
    lessonExercise(HOLD, {
      id: "ap-holding.entering.lesson",
      title: "Entering the Hold",
      description: "How to read back a hold instruction.",
      lessonBody:
        "Read back the hold fix and level, and include the expected further clearance time if it was given. You do not need to explain the entry method on the radio at this level — read back the instruction accurately.",
      points: [
        "Read back the fix and the level.",
        "Include the expected further clearance time if given.",
        "Do not narrate the entry method on the radio.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Hold readback",
          atcText: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
          readback: "Hold at LAMSO, maintain FL100, expect further clearance at two five, G-ABCD.",
        },
      ],
    }),
    chipExercise(HOLD, {
      id: "ap-holding.entering.build",
      title: "Build the hold readback",
      description: "Order the parts of the hold readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the hold instruction readback.",
      atcText: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
      prompt: "Build the readback.",
      helperText: "Fix · level · expected clearance time · callsign.",
      expected: [
        { id: "heb-fix", text: "Hold at LAMSO" },
        { id: "heb-level", text: "maintain FL100" },
        { id: "heb-time", text: "expect further clearance at two five" },
        { id: "heb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "heb-d-fix", text: "Hold at NARGO" },
        { id: "heb-d-level", text: "maintain FL120" },
      ],
      expectedSentence: "Hold at LAMSO, maintain FL100, expect further clearance at two five, G-ABCD.",
      expectedSpoken: "Hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Fix, level, expected clearance time and callsign.",
      incorrectFeedback: "Order: fix · level · expected clearance time · callsign.",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.entering.wrong-fix",
      title: "Wrong fix detection",
      description: "Spot the incorrect holding fix in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said hold at LAMSO. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, hold at LAMSO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO.",
      shownReadback: "Hold at NARGO, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ewf-fix", text: "Wrong holding fix. ATC said LAMSO.", feedback: "Correct. The pilot read back NARGO instead of LAMSO." },
        { id: "ewf-word", text: "The word 'hold' is wrong.", feedback: '"Hold" is correct. The fix is wrong.' },
        { id: "ewf-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The fix is wrong." },
        { id: "ewf-none", text: "Nothing is wrong.", feedback: "ATC said LAMSO, not NARGO." },
      ],
      correctId: "ewf-fix",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.entering.wrong-level",
      title: "Wrong level detection",
      description: "Spot the incorrect level in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said maintain FL100. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, maintain FL100.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, maintain flight level one zero zero.",
      shownReadback: "Maintain FL120, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ewl-level", text: "Wrong level. ATC said FL100.", feedback: "Correct. The pilot read back FL120 instead of FL100." },
        { id: "ewl-word", text: "The word 'maintain' is wrong.", feedback: '"Maintain" is correct. The level is wrong.' },
        { id: "ewl-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The level is wrong." },
        { id: "ewl-none", text: "Nothing is wrong.", feedback: "ATC said FL100, not FL120." },
      ],
      correctId: "ewl-level",
    }),
    readbackExercise(HOLD, {
      id: "ap-holding.entering.trainer",
      title: "Hold instruction trainer",
      description: "Read back the full hold instruction.",
      headerInstruction: "Read back the hold instruction issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-holding.entering.trainer.r1",
          atcText: "G-ABCD, hold at LAMSO, maintain FL100, expect further clearance at two five.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
          expectedReadback: "Hold at LAMSO, maintain FL100, expect further clearance at two five, G-ABCD.",
          expectedReadbackSpoken: "Hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const holdEfcTopic: Topic = {
  id: "ap-holding.efc",
  name: "Expected Approach Time",
  description: "Read back the expected further clearance / approach time.",
  unit: "exercises",
  exercises: [
    lessonExercise(HOLD, {
      id: "ap-holding.efc.lesson",
      title: "Expected Approach Time",
      description: "How to handle expected further clearance / approach times.",
      lessonBody:
        "An expected approach time or expected further clearance time helps you manage the delay. Read back the time. Do not confuse it with an altitude or a runway — it is a clock time.",
      points: [
        "An expected further clearance / approach time is a time.",
        "It lets you plan the delay.",
        "Read back the time with your callsign.",
        "It is not a level or a runway.",
      ],
      examples: [
        {
          label: "Expected further clearance",
          atcText: "G-ABCD, expect further clearance at two five.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, expect further clearance at two five.",
          readback: "Expect further clearance at two five, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.efc.understand",
      title: "Understand EFC / EAT",
      description: "Interpret the expected further clearance.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: 'What does "expect further clearance at two five" refer to?',
      atcDisplay: "G-ABCD, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, expect further clearance at two five.",
      atcHidden: true,
      options: [
        { id: "eu-time", text: "A time", feedback: "Correct. It is a clock time — when to expect onward clearance." },
        { id: "eu-rwy", text: "A runway", feedback: "No — two five here is a time, not a runway." },
        { id: "eu-hdg", text: "A heading", feedback: "No — it is a time, not a heading." },
        { id: "eu-fl", text: "A flight level", feedback: "No — it is a time, not a flight level." },
      ],
      correctId: "eu-time",
    }),
    chipExercise(HOLD, {
      id: "ap-holding.efc.build",
      title: "Build the EFC acknowledgement",
      description: "Order the parts of the EFC readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback of the expected further clearance.",
      atcText: "G-ABCD, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, expect further clearance at two five.",
      prompt: "Build the readback.",
      expected: [
        { id: "efb-efc", text: "Expect further clearance at two five" },
        { id: "efb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "efb-d-time", text: "Expect further clearance at three five" },
        { id: "efb-d-fl", text: "Maintain FL100" },
      ],
      expectedSentence: "Expect further clearance at two five, G-ABCD.",
      expectedSpoken: "Expect further clearance at two five, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. The time and your callsign.",
      incorrectFeedback: "Read back: expect further clearance at two five · callsign.",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.efc.wrong-time",
      title: "Wrong time detection",
      description: "Spot the incorrect time in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said expect further clearance at two five. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, expect further clearance at two five.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, expect further clearance at two five.",
      shownReadback: "Expect further clearance at three five, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ewt-time", text: "Wrong time. ATC said two five.", feedback: "Correct. The pilot read back three five instead of two five." },
        { id: "ewt-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The time is wrong." },
        { id: "ewt-phrase", text: "The phrase should be 'approach time'.", feedback: "The phrase is fine. The time value is wrong." },
        { id: "ewt-none", text: "Nothing is wrong.", feedback: "ATC said two five, not three five." },
      ],
      correctId: "ewt-time",
    }),
    readbackExercise(HOLD, {
      id: "ap-holding.efc.trainer",
      title: "Delay trainer",
      description: "Read back the delay / expected further clearance.",
      headerInstruction: "Read back the delay information issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-holding.efc.trainer.r1",
          atcText: "G-ABCD, delay expected, expect further clearance at two five.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, delay expected, expect further clearance at two five.",
          expectedReadback: "Expect further clearance at two five, G-ABCD.",
          expectedReadbackSpoken: "Expect further clearance at two five, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const holdLeavingTopic: Topic = {
  id: "ap-holding.leaving",
  name: "Leaving the Hold",
  description: "Read back the onward clearance and drop the hold.",
  unit: "exercises",
  exercises: [
    lessonExercise(HOLD, {
      id: "ap-holding.leaving.lesson",
      title: "Leaving the Hold",
      description: "How to handle the clearance out of the hold.",
      lessonBody:
        "When ATC clears you onward, the new clearance replaces the hold. Read back the new route or approach instruction. Do not keep holding once you have been cleared to leave.",
      points: [
        '"Leave the hold, proceed direct NARGO" ends the hold.',
        "Read back the onward route or approach instruction.",
        "Do not continue holding after being cleared onward.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Onward clearance",
          atcText: "G-ABCD, leave the hold, proceed direct NARGO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, leave the hold, proceed direct NARGO.",
          readback: "Leave the hold, direct NARGO, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.leaving.cleared",
      title: "Cleared to leave the hold?",
      description: "Interpret the onward clearance.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "What are you cleared to do?",
      atcDisplay: "G-ABCD, leave the hold, proceed direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, leave the hold, proceed direct NARGO.",
      atcHidden: true,
      options: [
        { id: "lc-leave", text: "Leave the hold and proceed direct NARGO", feedback: "Correct. The hold is over — route direct NARGO." },
        { id: "lc-continue", text: "Continue holding", feedback: "No — you are cleared to leave the hold." },
        { id: "lc-descend", text: "Descend without clearance", feedback: "No — no descent was given; route direct NARGO." },
        { id: "lc-ground", text: "Contact Ground", feedback: "No — no frequency change; leave the hold direct NARGO." },
      ],
      correctId: "lc-leave",
    }),
    chipExercise(HOLD, {
      id: "ap-holding.leaving.build",
      title: "Build the onward clearance readback",
      description: "Order the parts of the onward clearance readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the onward clearance readback.",
      atcText: "G-ABCD, leave the hold, proceed direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, leave the hold, proceed direct NARGO.",
      prompt: "Build the readback.",
      expected: [
        { id: "lb-leave", text: "Leave the hold" },
        { id: "lb-direct", text: "direct NARGO" },
        { id: "lb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "lb-d-direct", text: "direct LAMSO" },
        { id: "lb-d-cont", text: "continue holding" },
      ],
      expectedSentence: "Leave the hold, direct NARGO, G-ABCD.",
      expectedSpoken: "Leave the hold, direct NARGO, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Leave the hold, direct the fix, callsign.",
      incorrectFeedback: "Order: leave the hold · direct NARGO · callsign.",
    }),
    choiceExercise(HOLD, {
      id: "ap-holding.leaving.old-trap",
      title: "Old holding instruction trap",
      description: "Spot the pilot who kept holding.",
      screenKicker: "Error detection",
      instruction: "ATC cleared you to leave the hold direct NARGO. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, leave the hold, proceed direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, leave the hold, proceed direct NARGO.",
      shownReadback: "Continuing hold at LAMSO, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "lot-old", text: "The pilot kept the old holding instruction.", feedback: "Correct. You were cleared onward direct NARGO, but the pilot kept holding at LAMSO." },
        { id: "lot-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The pilot failed to act on the onward clearance." },
        { id: "lot-fix", text: "The fix NARGO is wrong.", feedback: "NARGO was the cleared fix; the pilot ignored it and kept holding." },
        { id: "lot-none", text: "Nothing is wrong.", feedback: "You were cleared to leave the hold; continuing to hold is incorrect." },
      ],
      correctId: "lot-old",
    }),
    readbackExercise(HOLD, {
      id: "ap-holding.leaving.trainer",
      title: "Leave hold trainer",
      description: "Read back the onward clearance.",
      headerInstruction: "Read back the onward clearance issued by Control.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-holding.leaving.trainer.r1",
          atcText: "G-ABCD, leave the hold, proceed direct NARGO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, leave the hold, proceed direct NARGO.",
          expectedReadback: "Leave the hold, direct NARGO, G-ABCD.",
          expectedReadbackSpoken: "Leave the hold, direct NARGO, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const holdScenarioTopic: Topic = {
  id: "ap-holding.scenario",
  name: "Holding Scenario",
  description: "Enter, manage the delay and leave the hold.",
  unit: "scenario",
  exercises: [
    scenarioExercise(HOLD, {
      id: "ap-holding.scenario.mission",
      title: "Managing the hold",
      description: "Read back the hold instruction, acknowledge a delay and read back the onward clearance.",
      instruction:
        "Arrivals are busy. Read back the hold instruction, acknowledge the delay, then read back the clearance out of the hold.",
      heading: "Managing the hold",
      completionNote:
        "You entered, managed the delay and left the hold on an onward clearance.",
      steps: HOLDING_SCENARIO_STEPS,
    }),
  ],
};

const holdingTopics: Topic[] = [
  holdAnatomyTopic,
  holdEnteringTopic,
  holdEfcTopic,
  holdLeavingTopic,
  holdScenarioTopic,
];

const holdingDelay: Module = {
  id: "ap-holding",
  name: "Holding & Delay Management",
  subtitle: "Read back hold instructions, manage delay and leave the hold.",
  unit: "topics",
  topics: holdingTopics,
  exercises: holdingTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 6 — Approach Clearance & Vectoring                          */
/* ================================================================== */

const APP: StudentPilotPhase = "approach-vectoring";

const appClearanceTopic: Topic = {
  id: "ap-approach-vectoring.clearance",
  name: "Approach Clearance",
  description: "Read back an approach clearance — not a landing clearance.",
  unit: "exercises",
  exercises: [
    lessonExercise(APP, {
      id: "ap-approach-vectoring.clearance.lesson",
      title: "Approach Clearance",
      description: "How to read back an approach clearance.",
      lessonBody:
        "An approach clearance authorises you to fly the instrument approach. It is not a landing clearance. Read back the approach type and the runway with your callsign.",
      points: [
        '"Cleared ILS approach runway 27" authorises the approach.',
        "This is not a clearance to land.",
        "Read back the approach type and runway.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Approach clearance",
          atcText: "G-ABCD, cleared ILS approach runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
          readback: "Cleared ILS approach runway 27, G-ABCD.",
        },
      ],
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.clearance.cleared-for",
      title: "Cleared for which approach?",
      description: "Identify the approach type and runway.",
      screenKicker: "Choice",
      instruction: "Listen to the approach clearance.",
      question: "What were you cleared for?",
      atcDisplay: "G-ABCD, cleared ILS approach runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
      atcHidden: true,
      options: [
        { id: "cf-ils27", text: "ILS approach runway 27", feedback: "Correct. Cleared the ILS approach to runway 27." },
        { id: "cf-rnav27", text: "RNAV approach runway 27", feedback: "No — the approach type was ILS, not RNAV." },
        { id: "cf-ils36", text: "ILS approach runway 36", feedback: "No — the runway was 27, not 36." },
        { id: "cf-land", text: "Cleared to land runway 27", feedback: "No — an approach clearance is not a landing clearance." },
      ],
      correctId: "cf-ils27",
    }),
    chipExercise(APP, {
      id: "ap-approach-vectoring.clearance.build",
      title: "Build the approach clearance readback",
      description: "Order the parts of the approach clearance readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the approach clearance readback.",
      atcText: "G-ABCD, cleared ILS approach runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
      prompt: "Build the readback.",
      expected: [
        { id: "acb-clear", text: "Cleared ILS approach" },
        { id: "acb-rwy", text: "runway 27" },
        { id: "acb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "acb-d-type", text: "Cleared RNAV approach" },
        { id: "acb-d-rwy", text: "runway 36" },
      ],
      expectedSentence: "Cleared ILS approach runway 27, G-ABCD.",
      expectedSpoken: "Cleared ILS approach runway two seven, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Cleared, approach type, runway and callsign.",
      incorrectFeedback: "Order: cleared ILS approach · runway 27 · callsign.",
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.clearance.wrong-type",
      title: "Wrong approach type detection",
      description: "Spot the incorrect approach type in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC cleared the ILS approach runway 27. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cleared ILS approach runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
      shownReadback: "Cleared RNAV approach runway 27, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "awt-type", text: "Wrong approach type. ATC said ILS.", feedback: "Correct. The pilot read back RNAV instead of the ILS approach." },
        { id: "awt-rwy", text: "The runway is wrong.", feedback: "Runway 27 matches. The approach type is wrong." },
        { id: "awt-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The approach type is wrong." },
        { id: "awt-none", text: "Nothing is wrong.", feedback: "ATC cleared the ILS, not the RNAV approach." },
      ],
      correctId: "awt-type",
    }),
    readbackExercise(APP, {
      id: "ap-approach-vectoring.clearance.trainer",
      title: "Approach clearance trainer",
      description: "Read back the approach clearance.",
      headerInstruction: "Read back the approach clearance issued by Approach.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-approach-vectoring.clearance.trainer.r1",
          atcText: "G-ABCD, cleared ILS approach runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
          expectedReadback: "Cleared ILS approach runway 27, G-ABCD.",
          expectedReadbackSpoken: "Cleared ILS approach runway two seven, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const appVectorsTopic: Topic = {
  id: "ap-approach-vectoring.vectors",
  name: "Vectors to Final",
  description: "Read back radar vectors (heading and altitude) to final.",
  unit: "exercises",
  exercises: [
    lessonExercise(APP, {
      id: "ap-approach-vectoring.vectors.lesson",
      title: "Vectors to Final",
      description: "How to read back radar vectors to final.",
      lessonBody:
        "Vectors are heading instructions used to sequence and position you for the approach. Read back the heading, and the altitude if one is included. This is why radar vectors are not a standalone module — they support the approach.",
      points: [
        "A vector is an assigned heading.",
        "Read back the heading and any altitude given.",
        "Include the turn direction (left / right).",
        "Vectors sequence you onto the approach.",
      ],
      examples: [
        {
          label: "Vector with descent",
          atcText: "G-ABCD, turn right heading 180, descend 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero, descend three thousand feet.",
          readback: "Right heading 180, descend 3000 feet, G-ABCD.",
        },
      ],
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.vectors.heading",
      title: "Heading assignment",
      description: "Identify the assigned heading.",
      screenKicker: "Choice",
      instruction: "Listen to the vector.",
      question: "What heading were you assigned?",
      atcDisplay: "G-ABCD, turn right heading 180.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero.",
      atcHidden: true,
      options: [
        { id: "vh-r180", text: "Right heading 180", feedback: "Correct. Turn right heading 180." },
        { id: "vh-l180", text: "Left heading 180", feedback: "No — the turn was to the right, not left." },
        { id: "vh-r280", text: "Right heading 280", feedback: "No — the heading was 180, not 280." },
        { id: "vh-fl180", text: "Descend FL180", feedback: "No — this is a heading, not a flight level." },
      ],
      correctId: "vh-r180",
    }),
    chipExercise(APP, {
      id: "ap-approach-vectoring.vectors.build",
      title: "Build the heading readback",
      description: "Order the parts of the heading readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the heading readback.",
      atcText: "G-ABCD, turn right heading 180.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "vb-hdg", text: "Right heading 180" },
        { id: "vb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "vb-d-dir", text: "Left heading 180" },
        { id: "vb-d-hdg", text: "Right heading 280" },
      ],
      expectedSentence: "Right heading 180, G-ABCD.",
      expectedSpoken: "Right heading one eight zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Turn direction, heading and callsign.",
      incorrectFeedback: "Read back: right heading 180 · callsign.",
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.vectors.wrong-heading",
      title: "Wrong heading detection",
      description: "Spot the incorrect heading in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said turn right heading 180. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, turn right heading 180.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero.",
      shownReadback: "Right heading 280, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "vwh-hdg", text: "Wrong heading. ATC said 180.", feedback: "Correct. The pilot read back 280 instead of 180." },
        { id: "vwh-dir", text: "The turn direction is wrong.", feedback: "Right matches. The heading value is wrong." },
        { id: "vwh-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The heading is wrong." },
        { id: "vwh-none", text: "Nothing is wrong.", feedback: "ATC said heading 180, not 280." },
      ],
      correctId: "vwh-hdg",
    }),
    readbackExercise(APP, {
      id: "ap-approach-vectoring.vectors.trainer",
      title: "Heading + altitude trainer",
      description: "Read back a vector with a descent.",
      headerInstruction: "Read back the vector and descent issued by Approach.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-approach-vectoring.vectors.trainer.r1",
          atcText: "G-ABCD, turn right heading 180, descend 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero, descend three thousand feet.",
          expectedReadback: "Right heading 180, descend 3000 feet, G-ABCD.",
          expectedReadbackSpoken: "Right heading one eight zero, descend three thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const appInterceptTopic: Topic = {
  id: "ap-approach-vectoring.intercept",
  name: "Intercept Localizer",
  description: "Read back the intercept instruction onto final approach.",
  unit: "exercises",
  exercises: [
    lessonExercise(APP, {
      id: "ap-approach-vectoring.intercept.lesson",
      title: "Intercept Localizer",
      description: "How to read back the localizer intercept.",
      lessonBody:
        "An intercept instruction positions the aircraft onto the final approach course. Read back the heading, the localizer/final approach course and the runway. This is not a clearance to land.",
      points: [
        "An intercept positions you on the final approach course.",
        "Read back heading, localizer and runway.",
        "This is not landing clearance.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Intercept localizer",
          atcText: "G-ABCD, turn right heading 240, intercept localizer runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading two four zero, intercept localizer runway two seven.",
          readback: "Right heading 240, intercept localizer runway 27, G-ABCD.",
        },
      ],
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.intercept.instruction",
      title: "Intercept instruction",
      description: "Identify the intercept instruction.",
      screenKicker: "Choice",
      instruction: "Listen to the instruction.",
      question: "What were you instructed to do?",
      atcDisplay: "G-ABCD, turn right heading 240, intercept localizer runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading two four zero, intercept localizer runway two seven.",
      atcHidden: true,
      options: [
        { id: "ii-loc27", text: "Intercept localizer runway 27", feedback: "Correct. Intercept the localizer for runway 27." },
        { id: "ii-rwy36", text: "Intercept runway 36", feedback: "No — the localizer was for runway 27, not 36." },
        { id: "ii-land", text: "Cleared to land", feedback: "No — an intercept is not a landing clearance." },
        { id: "ii-vacate", text: "Vacate runway", feedback: "No — you are intercepting the localizer, not vacating." },
      ],
      correctId: "ii-loc27",
    }),
    chipExercise(APP, {
      id: "ap-approach-vectoring.intercept.build",
      title: "Build the intercept readback",
      description: "Order the parts of the intercept readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the intercept readback.",
      atcText: "G-ABCD, turn right heading 240, intercept localizer runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading two four zero, intercept localizer runway two seven.",
      prompt: "Build the readback.",
      expected: [
        { id: "ib-hdg", text: "Right heading 240" },
        { id: "ib-loc", text: "intercept localizer runway 27" },
        { id: "ib-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ib-d-hdg", text: "Left heading 240" },
        { id: "ib-d-loc", text: "intercept localizer runway 36" },
      ],
      expectedSentence: "Right heading 240, intercept localizer runway 27, G-ABCD.",
      expectedSpoken: "Right heading two four zero, intercept localizer runway two seven, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Heading, intercept localizer, runway and callsign.",
      incorrectFeedback: "Order: right heading 240 · intercept localizer runway 27 · callsign.",
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.intercept.wrong-runway",
      title: "Wrong localizer / runway detection",
      description: "Spot the incorrect runway in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said intercept localizer runway 27. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, intercept localizer runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, intercept localizer runway two seven.",
      shownReadback: "Intercept localizer runway 36, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "iwr-rwy", text: "Wrong runway/localizer. ATC said runway 27.", feedback: "Correct. The pilot read back runway 36 instead of 27." },
        { id: "iwr-word", text: "The word 'intercept' is wrong.", feedback: '"Intercept localizer" is correct. The runway is wrong.' },
        { id: "iwr-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The runway is wrong." },
        { id: "iwr-none", text: "Nothing is wrong.", feedback: "ATC said runway 27, not 36." },
      ],
      correctId: "iwr-rwy",
    }),
    readbackExercise(APP, {
      id: "ap-approach-vectoring.intercept.trainer",
      title: "Intercept trainer",
      description: "Read back the intercept instruction.",
      headerInstruction: "Read back the intercept instruction issued by Approach.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-approach-vectoring.intercept.trainer.r1",
          atcText: "G-ABCD, turn right heading 240, intercept localizer runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading two four zero, intercept localizer runway two seven.",
          expectedReadback: "Right heading 240, intercept localizer runway 27, G-ABCD.",
          expectedReadbackSpoken: "Right heading two four zero, intercept localizer runway two seven, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const appVsLandingTopic: Topic = {
  id: "ap-approach-vectoring.vs-landing",
  name: "Approach vs Landing Clearance",
  description: "Approach clearance is not landing clearance.",
  unit: "exercises",
  exercises: [
    lessonExercise(APP, {
      id: "ap-approach-vectoring.vs-landing.lesson",
      title: "Approach vs Landing Clearance",
      description: "Why an approach clearance is not a landing clearance.",
      lessonBody:
        "Being cleared for the ILS approach is not a clearance to land. Landing clearance comes separately, from Tower. Do not assume you are cleared to land just because you are cleared for the approach.",
      points: [
        "Cleared ILS approach authorises the approach only.",
        "Landing clearance comes separately from Tower.",
        "Do not assume cleared to land.",
        "Fly the approach and wait for the landing clearance.",
      ],
      examples: [
        {
          label: "Approach clearance",
          atcText: "G-ABCD, cleared ILS approach runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
          readback: "Cleared ILS approach runway 27, G-ABCD.",
        },
      ],
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.vs-landing.is-landing",
      title: "Is this landing clearance?",
      description: "Decide whether this is a landing clearance.",
      screenKicker: "Choice",
      instruction: "ATC transmits:",
      question: "Is this a landing clearance?",
      atcDisplay: "G-ABCD, cleared ILS approach runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
      atcHidden: true,
      options: [
        { id: "il-no", text: "No, this is approach clearance, not landing clearance.", feedback: "Correct. You are cleared for the approach; landing clearance comes separately." },
        { id: "il-land", text: "Yes, cleared to land.", feedback: "No — an approach clearance does not authorise landing." },
        { id: "il-vacate", text: "Yes, cleared to vacate.", feedback: "No — there is no vacate instruction, and it is not a landing clearance." },
        { id: "il-takeoff", text: "Yes, cleared for takeoff.", feedback: "No — you are arriving; this is an approach clearance." },
      ],
      correctId: "il-no",
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.vs-landing.safe-interpretation",
      title: "Choose the safe interpretation",
      description: "Pick the correct action after the approach clearance.",
      screenKicker: "Choice",
      instruction: "You are cleared ILS approach runway 27.",
      question: "What should you do?",
      options: [
        { id: "si-fly", text: "Fly the approach, but wait for landing clearance.", feedback: "Correct. Continue the approach and expect a separate landing clearance from Tower." },
        { id: "si-land", text: "Land without further clearance.", feedback: "No — you still need a landing clearance from Tower." },
        { id: "si-vacate", text: "Vacate the runway now.", feedback: "No — you are inbound on the approach, not on the runway." },
        { id: "si-cancel", text: "Cancel IFR automatically.", feedback: "No — an approach clearance does not cancel IFR." },
      ],
      correctId: "si-fly",
    }),
    choiceExercise(APP, {
      id: "ap-approach-vectoring.vs-landing.unsafe-assumption",
      title: "Unsafe assumption detection",
      description: "Spot the pilot who assumed a landing clearance.",
      screenKicker: "Error detection",
      instruction: "ATC cleared the ILS approach runway 27. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cleared ILS approach runway 27.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
      shownReadback: "Cleared to land runway 27, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ua-assume", text: "The pilot assumed a landing clearance.", feedback: "Correct. ATC cleared the approach, not the landing — the pilot read back cleared to land." },
        { id: "ua-rwy", text: "The runway is wrong.", feedback: "Runway 27 matches. The pilot wrongly assumed landing clearance." },
        { id: "ua-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The pilot wrongly assumed landing clearance." },
        { id: "ua-none", text: "Nothing is wrong.", feedback: "Approach clearance is not landing clearance — the readback is unsafe." },
      ],
      correctId: "ua-assume",
    }),
    readbackExercise(APP, {
      id: "ap-approach-vectoring.vs-landing.trainer",
      title: "Approach vs landing trainer",
      description: "Read back the approach clearance correctly.",
      headerInstruction: "Read back the approach clearance issued by Approach.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-approach-vectoring.vs-landing.trainer.r1",
          atcText: "G-ABCD, cleared ILS approach runway 27.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
          expectedReadback: "Cleared ILS approach runway 27, G-ABCD.",
          expectedReadbackSpoken: "Cleared ILS approach runway two seven, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const appScenarioTopic: Topic = {
  id: "ap-approach-vectoring.scenario",
  name: "Approach & Vectoring Scenario",
  description: "Vectors, intercept and approach clearance.",
  unit: "scenario",
  exercises: [
    scenarioExercise(APP, {
      id: "ap-approach-vectoring.scenario.mission",
      title: "Vectored to the ILS",
      description: "Read back a vector with descent, an intercept instruction and the approach clearance.",
      instruction:
        "You are being vectored for the ILS to runway 27. Read back the vector and descent, the intercept instruction, then the approach clearance.",
      heading: "Vectored to the ILS",
      completionNote:
        "Vectored, established on the localizer and cleared for the approach. Landing clearance will come separately from Tower.",
      steps: APPROACH_VECTORING_SCENARIO_STEPS,
    }),
  ],
};

const approachVectoringTopics: Topic[] = [
  appClearanceTopic,
  appVectorsTopic,
  appInterceptTopic,
  appVsLandingTopic,
  appScenarioTopic,
];

const approachVectoring: Module = {
  id: "ap-approach-vectoring",
  name: "Approach Clearance & Vectoring",
  subtitle: "Take vectors, intercept the localizer and read back the approach clearance.",
  unit: "topics",
  topics: approachVectoringTopics,
  exercises: approachVectoringTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 7 — Missed Approach & Second Plan                           */
/* ================================================================== */

const MISS: StudentPilotPhase = "missed-approach";

const missInstructionTopic: Topic = {
  id: "ap-missed-approach.instruction",
  name: "Missed Approach Instruction",
  description: "Read back the missed approach instruction and climb.",
  unit: "exercises",
  exercises: [
    lessonExercise(MISS, {
      id: "ap-missed-approach.instruction.lesson",
      title: "Missed Approach Instruction",
      description: "How to read back a missed approach instruction.",
      lessonBody:
        "A missed approach may be instructed by ATC, or flown by you when the approach cannot be continued. Read back the missed approach instruction clearly, including the climb or heading if one is assigned. This is the IFR missed approach flow, not a basic VFR go-around.",
      points: [
        '"Execute missed approach" starts the missed approach.',
        "Read back the instruction and the assigned climb.",
        "Include a heading if one is given.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Missed approach",
          atcText: "G-ABCD, execute missed approach, climb 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, execute missed approach, climb three thousand feet.",
          readback: "Executing missed approach, climb 3000 feet, G-ABCD.",
        },
      ],
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.instruction.identify",
      title: "Identify the missed approach instruction",
      description: "Identify the instruction.",
      screenKicker: "Choice",
      instruction: "Listen to the instruction.",
      question: "What were you instructed to do?",
      atcDisplay: "G-ABCD, execute missed approach, climb 3000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, execute missed approach, climb three thousand feet.",
      atcHidden: true,
      options: [
        { id: "mi-exec", text: "Execute missed approach", feedback: "Correct. Execute the missed approach and climb 3000 feet." },
        { id: "mi-cont", text: "Continue approach", feedback: "No — you were told to execute the missed approach, not continue." },
        { id: "mi-land", text: "Cleared to land", feedback: "No — this is a missed approach, not a landing clearance." },
        { id: "mi-vacate", text: "Vacate runway", feedback: "No — you are going around, not vacating a runway." },
      ],
      correctId: "mi-exec",
    }),
    chipExercise(MISS, {
      id: "ap-missed-approach.instruction.build",
      title: "Build the missed approach readback",
      description: "Order the parts of the missed approach readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the missed approach readback.",
      atcText: "G-ABCD, execute missed approach, climb 3000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, execute missed approach, climb three thousand feet.",
      prompt: "Build the readback.",
      expected: [
        { id: "mb-exec", text: "Executing missed approach" },
        { id: "mb-climb", text: "climb 3000 feet" },
        { id: "mb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "mb-d-climb", text: "climb 2000 feet" },
        { id: "mb-d-cont", text: "continuing approach" },
      ],
      expectedSentence: "Executing missed approach, climb 3000 feet, G-ABCD.",
      expectedSpoken: "Executing missed approach, climb three thousand feet, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Executing missed approach, climb and callsign.",
      incorrectFeedback: "Order: executing missed approach · climb 3000 feet · callsign.",
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.instruction.wrong-altitude",
      title: "Wrong altitude detection",
      description: "Spot the incorrect climb in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said climb 3000 feet. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, execute missed approach, climb 3000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, execute missed approach, climb three thousand feet.",
      shownReadback: "Executing missed approach, climb 2000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mwa-alt", text: "Wrong missed approach altitude. ATC said 3000 feet.", feedback: "Correct. The pilot read back 2000 feet instead of 3000 feet." },
        { id: "mwa-word", text: "It should say 'continue', not 'missed approach'.", feedback: "Missed approach is correct. The altitude is wrong." },
        { id: "mwa-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The altitude is wrong." },
        { id: "mwa-none", text: "Nothing is wrong.", feedback: "ATC said 3000 feet, not 2000 feet." },
      ],
      correctId: "mwa-alt",
    }),
    readbackExercise(MISS, {
      id: "ap-missed-approach.instruction.trainer",
      title: "Missed approach trainer",
      description: "Read back the missed approach instruction.",
      headerInstruction: "Read back the missed approach instruction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-missed-approach.instruction.trainer.r1",
          atcText: "G-ABCD, execute missed approach, climb 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, execute missed approach, climb three thousand feet.",
          expectedReadback: "Executing missed approach, climb 3000 feet, G-ABCD.",
          expectedReadbackSpoken: "Executing missed approach, climb three thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const missClimbHeadingTopic: Topic = {
  id: "ap-missed-approach.climb-heading",
  name: "Climb and Heading After Missed",
  description: "Read back the climb and heading after the missed approach.",
  unit: "exercises",
  exercises: [
    lessonExercise(MISS, {
      id: "ap-missed-approach.climb-heading.lesson",
      title: "Climb and Heading After Missed",
      description: "How to read back a two-part climb and heading.",
      lessonBody:
        "After the missed approach, ATC will usually give you a climb and a heading to reposition you. Read back both — do not omit the heading or the altitude. This is radar vectoring applied to the missed approach.",
      points: [
        "Expect a climb and a heading after the missed approach.",
        "Read back both items.",
        "Headings are three digits: heading zero niner zero.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Climb and heading",
          atcText: "G-ABCD, climb 4000 feet, turn left heading 090.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, climb four thousand feet, turn left heading zero niner zero.",
          readback: "Climb 4000 feet, left heading 090, G-ABCD.",
        },
      ],
    }),
    chipExercise(MISS, {
      id: "ap-missed-approach.climb-heading.build",
      title: "Climb + heading readback",
      description: "Order the parts of the climb and heading readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the climb and heading readback.",
      atcText: "G-ABCD, climb 4000 feet, turn left heading 090.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb four thousand feet, turn left heading zero niner zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "chb-climb", text: "Climb 4000 feet" },
        { id: "chb-hdg", text: "left heading 090" },
        { id: "chb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "chb-d-climb", text: "Climb 3000 feet" },
        { id: "chb-d-hdg", text: "left heading 190" },
      ],
      expectedSentence: "Climb 4000 feet, left heading 090, G-ABCD.",
      expectedSpoken: "Climb four thousand feet, left heading zero niner zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Climb, heading and callsign.",
      incorrectFeedback: "Order: climb 4000 feet · left heading 090 · callsign.",
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.climb-heading.wrong-heading",
      title: "Wrong heading detection",
      description: "Spot the incorrect heading in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said turn left heading 090. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, turn left heading 090.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading zero niner zero.",
      shownReadback: "Left heading 190, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mwh-hdg", text: "Wrong heading. ATC said 090.", feedback: "Correct. The pilot read back 190 instead of 090." },
        { id: "mwh-dir", text: "The turn direction is wrong.", feedback: "Left matches. The heading value is wrong." },
        { id: "mwh-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The heading is wrong." },
        { id: "mwh-none", text: "Nothing is wrong.", feedback: "ATC said heading 090, not 190." },
      ],
      correctId: "mwh-hdg",
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.climb-heading.wrong-level",
      title: "Wrong level detection",
      description: "Spot the incorrect altitude in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said climb 4000 feet. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, climb 4000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, climb four thousand feet.",
      shownReadback: "Climb 3000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mwl-alt", text: "Wrong altitude. ATC said 4000 feet.", feedback: "Correct. The pilot read back 3000 feet instead of 4000 feet." },
        { id: "mwl-word", text: "The word 'climb' is wrong.", feedback: '"Climb" is correct. The altitude is wrong.' },
        { id: "mwl-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The altitude is wrong." },
        { id: "mwl-none", text: "Nothing is wrong.", feedback: "ATC said 4000 feet, not 3000 feet." },
      ],
      correctId: "mwl-alt",
    }),
    readbackExercise(MISS, {
      id: "ap-missed-approach.climb-heading.trainer",
      title: "Two-part instruction trainer",
      description: "Read back the climb and heading.",
      headerInstruction: "Read back the climb and heading issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-missed-approach.climb-heading.trainer.r1",
          atcText: "G-ABCD, climb 4000 feet, turn left heading 090.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, climb four thousand feet, turn left heading zero niner zero.",
          expectedReadback: "Climb 4000 feet, left heading 090, G-ABCD.",
          expectedReadbackSpoken: "Climb four thousand feet, left heading zero niner zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const missContactTopic: Topic = {
  id: "ap-missed-approach.contact",
  name: "Contact After Missed Approach",
  description: "Read back the handoff after the missed approach.",
  unit: "exercises",
  exercises: [
    lessonExercise(MISS, {
      id: "ap-missed-approach.contact.lesson",
      title: "Contact After Missed Approach",
      description: "How to read back the handoff after a missed approach.",
      lessonBody:
        "After the missed approach, ATC may transfer you back to Approach or to Departure to be re-sequenced. Read back the station and the frequency. This is an operational handoff, not basic frequency training.",
      points: [
        "Expect a handoff to Approach or Departure.",
        "Read back the station and the frequency.",
        "Frequencies use decimal.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Handoff after missed",
          atcText: "G-ABCD, contact Approach 124.700.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Approach one two four decimal seven zero zero.",
          readback: "Contact Approach 124.700, G-ABCD.",
        },
      ],
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.contact.frequency",
      title: "Frequency after missed",
      description: "Identify the station and frequency.",
      screenKicker: "Choice",
      instruction: "Listen to the handoff.",
      question: "Which station and frequency were given?",
      atcDisplay: "G-ABCD, contact Approach 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Approach one two four decimal seven zero zero.",
      atcHidden: true,
      options: [
        { id: "mcf-app", text: "Approach 124.700", feedback: "Correct. Contact Approach on one two four decimal seven zero zero." },
        { id: "mcf-gnd", text: "Ground 121.700", feedback: "No — the handoff was to Approach, not Ground." },
        { id: "mcf-twr", text: "Tower 118.100", feedback: "No — the handoff was to Approach, not Tower." },
        { id: "mcf-del", text: "Delivery 121.900", feedback: "No — the handoff was to Approach, not Delivery." },
      ],
      correctId: "mcf-app",
    }),
    chipExercise(MISS, {
      id: "ap-missed-approach.contact.build",
      title: "Build the handoff readback",
      description: "Order the parts of the handoff readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the handoff readback.",
      atcText: "G-ABCD, contact Approach 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Approach one two four decimal seven zero zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "mcb-station", text: "Contact Approach" },
        { id: "mcb-freq", text: "124.700" },
        { id: "mcb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "mcb-d-station", text: "Contact Ground" },
        { id: "mcb-d-freq", text: "124.750" },
      ],
      expectedSentence: "Contact Approach 124.700, G-ABCD.",
      expectedSpoken: "Contact Approach one two four decimal seven zero zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Station, frequency and callsign.",
      incorrectFeedback: "Order: contact Approach · 124.700 · callsign.",
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.contact.wrong-station",
      title: "Wrong station detection",
      description: "Spot the incorrect station in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said contact Approach 124.700. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, contact Approach 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Approach one two four decimal seven zero zero.",
      shownReadback: "Contact Ground 124.700, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mws-station", text: "Wrong station. ATC said Approach.", feedback: "Correct. The pilot read back Ground instead of Approach." },
        { id: "mws-freq", text: "The frequency is wrong.", feedback: "124.700 matches. The station is wrong." },
        { id: "mws-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The station is wrong." },
        { id: "mws-none", text: "Nothing is wrong.", feedback: "ATC said Approach, not Ground." },
      ],
      correctId: "mws-station",
    }),
    readbackExercise(MISS, {
      id: "ap-missed-approach.contact.trainer",
      title: "Missed approach handoff trainer",
      description: "Read back the handoff.",
      headerInstruction: "Read back the frequency transfer issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-missed-approach.contact.trainer.r1",
          atcText: "G-ABCD, contact Approach 124.700.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, contact Approach one two four decimal seven zero zero.",
          expectedReadback: "Contact Approach 124.700, G-ABCD.",
          expectedReadbackSpoken: "Contact Approach one two four decimal seven zero zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const missSecondPlanTopic: Topic = {
  id: "ap-missed-approach.second-plan",
  name: "Second Approach / Alternate Intention",
  description: "State a clear intention: second approach or alternate.",
  unit: "exercises",
  exercises: [
    lessonExercise(MISS, {
      id: "ap-missed-approach.second-plan.lesson",
      title: "Second Approach / Alternate Intention",
      description: "How to state your intention after a missed approach.",
      lessonBody:
        "After a missed approach you may request another approach, or advise that you are going to your alternate. Keep the request clear and brief. This is normal decision-making, not emergency handling.",
      points: [
        '"Request second approach" asks to try again.',
        '"Unable second approach, request alternate" commits to the alternate.',
        "State a clear, single intention.",
        "This is not an emergency call.",
      ],
      examples: [
        {
          label: "Request second approach",
          atcText: "Pilot intends to try the approach again.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request second approach.",
          readback: "G-ABCD, request second approach.",
        },
        {
          label: "Request alternate",
          atcText: "Pilot will not attempt again and diverts.",
          atcSpoken: "Unable second approach, request alternate, Golf Alfa Bravo Charlie Delta.",
          readback: "Unable second approach, request alternate, G-ABCD.",
        },
      ],
    }),
    chipExercise(MISS, {
      id: "ap-missed-approach.second-plan.request-second",
      title: "Request second approach",
      description: "Build the request for a second approach.",
      screenKicker: "Listening",
      headerInstruction: "Build the request for a second approach.",
      atcText: "G-ABCD, request second approach.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request second approach.",
      prompt: "Build the request.",
      expected: [
        { id: "rs-cs", text: "G-ABCD" },
        { id: "rs-req", text: "request second approach" },
      ],
      distractors: [
        { id: "rs-d-alt", text: "request alternate" },
        { id: "rs-d-unable", text: "unable second approach" },
      ],
      expectedSentence: "G-ABCD, request second approach.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, request second approach.",
      correctFeedback: "Correct. Callsign and a clear request for a second approach.",
      incorrectFeedback: "Build: callsign · request second approach.",
    }),
    chipExercise(MISS, {
      id: "ap-missed-approach.second-plan.request-alternate",
      title: "Unable second approach / request alternate",
      description: "Build the alternate intention call.",
      screenKicker: "Listening",
      headerInstruction: "Build the call advising the alternate.",
      atcText: "G-ABCD, unable second approach, request alternate.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, unable second approach, request alternate.",
      prompt: "Build the call.",
      expected: [
        { id: "ra-unable", text: "Unable second approach" },
        { id: "ra-req", text: "request alternate" },
        { id: "ra-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ra-d-second", text: "request second approach" },
        { id: "ra-d-cont", text: "continuing approach" },
      ],
      expectedSentence: "Unable second approach, request alternate, G-ABCD.",
      expectedSpoken: "Unable second approach, request alternate, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Unable, the request for the alternate and your callsign.",
      incorrectFeedback: "Build: unable second approach · request alternate · callsign.",
    }),
    readbackExercise(MISS, {
      id: "ap-missed-approach.second-plan.intention-trainer",
      title: "Build the intention call",
      description: "State your intention to try another approach.",
      headerInstruction: "You are ready to try another approach. Make the intention call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ap-missed-approach.second-plan.intention-trainer.r1",
          atcText: "You are ready to try another approach.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request second approach.",
          expectedReadback: "G-ABCD, request second approach.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, request second approach.",
        },
      ],
    }),
    choiceExercise(MISS, {
      id: "ap-missed-approach.second-plan.wrong-intention",
      title: "Wrong intention detection",
      description: "Spot the call that does not match the intention.",
      screenKicker: "Error detection",
      instruction: "The pilot intends to request a second approach. Check the call made.",
      question: "What is wrong?",
      shownReadback: "Unable second approach, request alternate, G-ABCD.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "wi-intent", text: "Wrong intention. The pilot wanted a second approach.", feedback: "Correct. The pilot intended a second approach but transmitted an alternate request — the calls are opposite." },
        { id: "wi-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The intention stated is the opposite of what was planned." },
        { id: "wi-alt-ok", text: "Requesting the alternate is correct after a missed approach.", feedback: "Not here — the pilot intended a second approach, not the alternate. The call states the opposite intention." },
        { id: "wi-none", text: "Nothing is wrong.", feedback: "The pilot wanted a second approach but requested the alternate instead." },
      ],
      correctId: "wi-intent",
    }),
  ],
};

const missScenarioTopic: Topic = {
  id: "ap-missed-approach.scenario",
  name: "Missed Approach Scenario",
  description: "Missed approach, climb, heading, handoff and second plan.",
  unit: "scenario",
  exercises: [
    scenarioExercise(MISS, {
      id: "ap-missed-approach.scenario.mission",
      title: "Going around",
      description: "Read back the missed approach, the climb and heading, the handoff, then request a second approach.",
      instruction:
        "The approach cannot be continued. Read back the missed approach instruction, the climb and heading, the handoff, then request a second approach.",
      heading: "Going around",
      completionNote:
        "You handled the missed approach, climb, heading and handoff, then requested a second plan.",
      steps: MISSED_APPROACH_SCENARIO_STEPS,
    }),
  ],
};

const missedApproachTopics: Topic[] = [
  missInstructionTopic,
  missClimbHeadingTopic,
  missContactTopic,
  missSecondPlanTopic,
  missScenarioTopic,
];

const missedApproach: Module = {
  id: "ap-missed-approach",
  name: "Missed Approach & Second Plan",
  subtitle: "Fly the IFR missed approach, take vectors and request a second plan.",
  unit: "topics",
  topics: missedApproachTopics,
  exercises: missedApproachTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* EXPORTS                                                            */
/* ================================================================== */

export const AIRLINE_PREP_MODULES: Module[] = [
  ifrClearance,
  sidDeparture,
  enrouteIfr,
  starDescentManagement,
  holdingDelay,
  approachVectoring,
  missedApproach,
];

export const AIRLINE_PREP_SECTIONS: Section[] = [
  { title: "IFR Operations", modules: AIRLINE_PREP_MODULES },
];
