/**
 * AeroComms — Advanced Ops content catalog.
 *
 * Level 5. Abnormal and emergency communication under pressure: weather
 * deviations, diversions, PAN PAN, MAYDAY, high workload, difficult radio &
 * accents, and unexpected events. This is NOT another normal-IFR level — every
 * exercise lives inside a pressure, urgency, emergency or unexpected-event
 * context.
 *
 * Reuses the Student Pilot block renderer (SpSessionScreen) via the shared
 * ExerciseContent / blockType contract. Phraseology follows
 * docs/AeroComms_ICAO_Radiotelephony_Reference.md (decimal not point, full
 * callsign in readbacks, runway digit-by-digit, flight levels digit-by-digit,
 * headings as three digits, niner, Golf Alfa Bravo Charlie Delta, PAN PAN ×3,
 * MAYDAY ×3).
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
  WEATHER_DEVIATION_SCENARIO_STEPS,
  DIVERSION_SCENARIO_STEPS,
  PAN_PAN_SCENARIO_STEPS,
  MAYDAY_SCENARIO_STEPS,
  HIGH_WORKLOAD_SCENARIO_STEPS,
  DIFFICULT_RADIO_SCENARIO_STEPS,
  UNEXPECTED_EVENT_SCENARIO_STEPS,
} from "./advancedOpsScenarios";

/* ------------------------------------------------------------------ */
/* Shared builders (mirror the Airline Prep block contract)           */
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
/* MODULE 1 — Weather Deviations                                      */
/* ================================================================== */

const WX: StudentPilotPhase = "weather-deviation";

const wxAheadTopic: Topic = {
  id: "ao-weather.ahead",
  name: "Weather Ahead",
  description: "Report weather affecting the route and ask for a practical action.",
  unit: "exercises",
  exercises: [
    lessonExercise(WX, {
      id: "ao-weather.ahead.lesson",
      title: "Weather Ahead",
      description: "Report weather on the route and request an action.",
      lessonBody:
        "When weather threatens your route, do not just report it — say what you need. A useful weather call is short, names the problem and requests a practical action such as a deviation. Reporting weather without a request leaves ATC guessing your intentions.",
      points: [
        "Report weather that affects the route.",
        "Request a practical action — usually a deviation.",
        "Do not report weather without saying what you need.",
        "Keep it short and operational.",
      ],
      examples: [
        {
          label: "Weather report with request",
          atcText: "G-ABCD, weather ahead, request deviation right of track.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, weather ahead, request deviation right of track.",
          readback: "G-ABCD, weather ahead, request deviation right of track.",
        },
      ],
    }),
    choiceExercise(WX, {
      id: "ao-weather.ahead.identify-problem",
      title: "Identify the problem",
      description: "Classify the operational problem.",
      screenKicker: "Choice",
      instruction: "The route ahead is blocked by build-ups you cannot safely fly through.",
      question: "What is the operational problem?",
      options: [
        { id: "ip-weather", text: "Weather affecting the route", feedback: "Correct. Weather is blocking the route and you need an action to stay clear." },
        { id: "ip-traffic", text: "Traffic sequencing", feedback: "No — there is no traffic problem here; the route is blocked by weather." },
        { id: "ip-freq", text: "Radio frequency change", feedback: "No — nothing here is about frequencies; it is weather on the route." },
        { id: "ip-parking", text: "Parking instruction", feedback: "No — you are enroute facing weather, not parking." },
      ],
      correctId: "ip-weather",
    }),
    chipExercise(WX, {
      id: "ao-weather.ahead.build",
      title: "Build the weather report",
      description: "Order the parts of the weather report and request.",
      screenKicker: "Listening",
      headerInstruction: "Build the weather report and deviation request.",
      atcText: "G-ABCD, weather ahead, request deviation right of track.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, weather ahead, request deviation right of track.",
      prompt: "Order the call.",
      helperText: "Callsign · weather ahead · request deviation · direction.",
      expected: [
        { id: "wb-cs", text: "G-ABCD" },
        { id: "wb-wx", text: "weather ahead" },
        { id: "wb-req", text: "request deviation" },
        { id: "wb-dir", text: "right of track" },
      ],
      distractors: [
        { id: "wb-d-dir", text: "left of track" },
        { id: "wb-d-climb", text: "request climb" },
      ],
      expectedSentence: "G-ABCD, weather ahead, request deviation right of track.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, weather ahead, request deviation right of track.",
      correctFeedback: "Correct. Callsign, the problem, the request and the direction.",
      incorrectFeedback: "Order: callsign · weather ahead · request deviation · right of track.",
    }),
    choiceExercise(WX, {
      id: "ao-weather.ahead.missing-request",
      title: "Missing request detection",
      description: "Spot what the weather call is missing.",
      screenKicker: "Error detection",
      instruction: "Weather is blocking the route. Check the pilot's call.",
      question: "What is missing?",
      shownReadback: "G-ABCD, weather ahead.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mr-request", text: "The pilot reports weather but does not request an action.", feedback: "Correct. ATC needs to know what you want — a deviation, a re-route or a climb." },
        { id: "mr-cs", text: "The callsign is missing.", feedback: "G-ABCD is present. The request for an action is missing." },
        { id: "mr-wx", text: "The weather is not mentioned.", feedback: "Weather is mentioned. What is missing is the requested action." },
        { id: "mr-none", text: "Nothing is missing.", feedback: "The call states weather but requests no action." },
      ],
      correctId: "mr-request",
    }),
    readbackExercise(WX, {
      id: "ao-weather.ahead.trainer",
      title: "Weather report trainer",
      description: "Make the weather report and deviation request.",
      headerInstruction: "Weather is ahead on your route. Request a deviation right of track.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-weather.ahead.trainer.r1",
          atcText: "Weather is ahead on your route. Request deviation right of track.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, weather ahead, request deviation right of track.",
          expectedReadback: "G-ABCD, weather ahead, request deviation right of track.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, weather ahead, request deviation right of track.",
        },
      ],
    }),
  ],
};

const wxDeviationTopic: Topic = {
  id: "ao-weather.deviation",
  name: "Request Deviation",
  description: "Specify direction and reason, and read back an approved deviation.",
  unit: "exercises",
  exercises: [
    lessonExercise(WX, {
      id: "ao-weather.deviation.lesson",
      title: "Request Deviation",
      description: "How to request a deviation and read it back.",
      lessonBody:
        "A deviation request must specify a direction and a reason. Left or right matters — ATC separates you from other traffic based on it. If the deviation is approved, read it back accurately so both of you agree on the direction.",
      points: [
        "Specify the direction: left or right.",
        "Give the reason: due weather.",
        "Left and right are not interchangeable.",
        "If approved, read back the direction accurately.",
      ],
      examples: [
        {
          label: "Deviation request",
          atcText: "G-ABCD, request twenty degrees left due weather.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request twenty degrees left due weather.",
          readback: "Request twenty degrees left due weather, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WX, {
      id: "ao-weather.deviation.left-or-right",
      title: "Left or right deviation?",
      description: "Identify the deviation direction.",
      screenKicker: "Choice",
      instruction: "Listen to the deviation request.",
      question: "Which deviation is being requested?",
      atcDisplay: "Request twenty degrees left due weather.",
      atcSpoken: "Request twenty degrees left due weather.",
      atcHidden: true,
      options: [
        { id: "lr-left", text: "Left deviation", feedback: "Correct. Twenty degrees left due weather." },
        { id: "lr-right", text: "Right deviation", feedback: "No — the request was twenty degrees left, not right." },
        { id: "lr-climb", text: "Climb request", feedback: "No — this is a lateral deviation, not a climb." },
        { id: "lr-freq", text: "Frequency transfer", feedback: "No — no frequency was given; this is a deviation request." },
      ],
      correctId: "lr-left",
    }),
    chipExercise(WX, {
      id: "ao-weather.deviation.build",
      title: "Build the deviation request",
      description: "Order the parts of the deviation request.",
      screenKicker: "Listening",
      headerInstruction: "Build the deviation request.",
      atcText: "G-ABCD, request twenty degrees left due weather.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request twenty degrees left due weather.",
      prompt: "Order the call.",
      expected: [
        { id: "db-req", text: "Request twenty degrees left" },
        { id: "db-reason", text: "due weather" },
        { id: "db-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "db-d-dir", text: "Request twenty degrees right" },
        { id: "db-d-reason", text: "due traffic" },
      ],
      expectedSentence: "Request twenty degrees left due weather, G-ABCD.",
      expectedSpoken: "Request twenty degrees left due weather, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. The deviation, the reason and your callsign.",
      incorrectFeedback: "Order: request twenty degrees left · due weather · callsign.",
    }),
    choiceExercise(WX, {
      id: "ao-weather.deviation.wrong-direction",
      title: "Wrong direction detection",
      description: "Spot the incorrect deviation direction in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC approved a deviation right. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, deviation right approved.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, deviation right approved.",
      shownReadback: "Deviation left approved, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wd-dir", text: "Wrong deviation direction. ATC approved right.", feedback: "Correct. ATC approved a deviation right, but the pilot read back left — a separation risk." },
        { id: "wd-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The direction is wrong." },
        { id: "wd-word", text: "The word 'approved' is wrong.", feedback: '"Approved" is correct. The direction is wrong.' },
        { id: "wd-none", text: "Nothing is wrong.", feedback: "ATC approved right, but the pilot read back left." },
      ],
      correctId: "wd-dir",
    }),
    readbackExercise(WX, {
      id: "ao-weather.deviation.trainer",
      title: "Deviation readback trainer",
      description: "Read back the approved deviation.",
      headerInstruction: "Read back the deviation approval issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-weather.deviation.trainer.r1",
          atcText: "G-ABCD, deviation right approved.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, deviation right approved.",
          expectedReadback: "Deviation right approved, G-ABCD.",
          expectedReadbackSpoken: "Deviation right approved, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const wxUnableTopic: Topic = {
  id: "ao-weather.unable",
  name: "Unable Due Weather",
  description: "Refuse an unsafe instruction with a reason instead of complying.",
  unit: "exercises",
  exercises: [
    lessonExercise(WX, {
      id: "ao-weather.unable.lesson",
      title: "Unable Due Weather",
      description: "How and when to say unable due weather.",
      lessonBody:
        "If an instruction would take you into weather you cannot fly safely, say Unable and add the reason. You are not obliged to accept a clearance into unsafe weather. Unable is a normal, professional word — use it clearly rather than complying and hoping.",
      points: [
        "Use Unable when an instruction is unsafe because of weather.",
        "Add the reason: due weather.",
        "Do not accept a route into weather you cannot fly.",
        "Unable is professional, not a failure.",
      ],
      examples: [
        {
          label: "Unable due weather",
          atcText: "Unable due weather, G-ABCD.",
          atcSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
          readback: "Unable due weather, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WX, {
      id: "ao-weather.unable.choose-response",
      title: "Choose the correct response",
      description: "Pick the safe response to an unsafe heading.",
      screenKicker: "Choice",
      instruction: "ATC assigns a heading directly into weather you cannot avoid safely.",
      question: "What is the correct response?",
      options: [
        { id: "cr-unable", text: "Unable due weather, G-ABCD.", feedback: "Correct. Decline the unsafe instruction and give the reason." },
        { id: "cr-wilco", text: "Wilco, G-ABCD.", feedback: "No — Wilco accepts an instruction you cannot fly safely." },
        { id: "cr-standby", text: "Standby, G-ABCD.", feedback: "No — standby delays but does not decline an unsafe heading." },
        { id: "cr-land", text: "Cleared to land, G-ABCD.", feedback: "No — that is not even a pilot phrase here; say unable due weather." },
      ],
      correctId: "cr-unable",
    }),
    chipExercise(WX, {
      id: "ao-weather.unable.build",
      title: "Build the unable call",
      description: "Order the parts of the unable call.",
      screenKicker: "Listening",
      headerInstruction: "Build the unable call.",
      atcText: "Unable due weather, G-ABCD.",
      atcSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
      prompt: "Order the call.",
      expected: [
        { id: "ub-unable", text: "Unable" },
        { id: "ub-reason", text: "due weather" },
        { id: "ub-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ub-d-wilco", text: "Wilco" },
        { id: "ub-d-reason", text: "due traffic" },
      ],
      expectedSentence: "Unable due weather, G-ABCD.",
      expectedSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Unable, the reason and your callsign.",
      incorrectFeedback: "Order: unable · due weather · callsign.",
    }),
    choiceExercise(WX, {
      id: "ao-weather.unable.unsafe-compliance",
      title: "Unsafe compliance detection",
      description: "Spot the unsafe acceptance.",
      screenKicker: "Error detection",
      instruction: "Weather is blocking the assigned heading. Check the pilot's response.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, turn right heading 180.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero.",
      shownReadback: "Right heading 180, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "uc-accept", text: "The pilot accepts an unsafe instruction instead of saying unable.", feedback: "Correct. The heading leads into weather; the pilot should say unable due weather, not comply." },
        { id: "uc-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is accepting an unsafe heading." },
        { id: "uc-hdg", text: "The heading value is read back wrong.", feedback: "The value matches ATC. The issue is complying with an unsafe instruction." },
        { id: "uc-none", text: "Nothing is wrong.", feedback: "The heading leads into weather; the pilot should decline." },
      ],
      correctId: "uc-accept",
    }),
    readbackExercise(WX, {
      id: "ao-weather.unable.trainer",
      title: "Unable trainer",
      description: "Decline the unsafe route.",
      headerInstruction: "You cannot accept the route due weather. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-weather.unable.trainer.r1",
          atcText: "You cannot accept the assigned route due weather.",
          atcSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
          expectedReadback: "Unable due weather, G-ABCD.",
          expectedReadbackSpoken: "Unable due weather, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const wxRerouteTopic: Topic = {
  id: "ao-weather.reroute",
  name: "Return / Re-route Decision",
  description: "Decide between deviation, re-route or return, and state it clearly.",
  unit: "exercises",
  exercises: [
    lessonExercise(WX, {
      id: "ao-weather.reroute.lesson",
      title: "Return / Re-route Decision",
      description: "When a deviation is not enough.",
      lessonBody:
        "Sometimes a small deviation is enough; sometimes a re-route or a return is the safer choice. State your request clearly and include the route or destination if you know it, so ATC can act without a long exchange.",
      points: [
        "A deviation is not always enough.",
        "A re-route or return may be safer.",
        "State your request clearly.",
        "Include the route or destination if known.",
      ],
      examples: [
        {
          label: "Re-route request",
          atcText: "Request re-route via North Lake due weather, G-ABCD.",
          atcSpoken: "Request re-route via North Lake due weather, Golf Alfa Bravo Charlie Delta.",
          readback: "Request re-route via North Lake due weather, G-ABCD.",
        },
        {
          label: "Return request",
          atcText: "Request return to Brindale due weather, G-ABCD.",
          atcSpoken: "Request return to Brindale due weather, Golf Alfa Bravo Charlie Delta.",
          readback: "Request return to Brindale due weather, G-ABCD.",
        },
      ],
    }),
    choiceExercise(WX, {
      id: "ao-weather.reroute.return-or-continue",
      title: "Return or continue?",
      description: "Pick the safe course of action.",
      screenKicker: "Choice",
      instruction: "Weather blocks your route and there is no safe continuation ahead.",
      question: "What is the safe course of action?",
      options: [
        { id: "rc-reroute", text: "Request return or re-route", feedback: "Correct. With no safe way ahead, ask for a re-route or a return." },
        { id: "rc-silent", text: "Continue silently", feedback: "No — continuing into weather without a plan is unsafe." },
        { id: "rc-descend", text: "Descend below safe altitude", feedback: "No — never descend below a safe altitude to avoid weather." },
        { id: "rc-land", text: "Assume landing clearance", feedback: "No — you cannot assume a clearance; request a re-route or return." },
      ],
      correctId: "rc-reroute",
    }),
    chipExercise(WX, {
      id: "ao-weather.reroute.build",
      title: "Build the re-route request",
      description: "Order the parts of the re-route request.",
      screenKicker: "Listening",
      headerInstruction: "Build the re-route request.",
      atcText: "Request re-route via North Lake due weather, G-ABCD.",
      atcSpoken: "Request re-route via North Lake due weather, Golf Alfa Bravo Charlie Delta.",
      prompt: "Order the call.",
      helperText: "Request re-route · via fix · reason · callsign.",
      expected: [
        { id: "rb-req", text: "Request re-route via North Lake" },
        { id: "rb-reason", text: "due weather" },
        { id: "rb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rb-d-fix", text: "Request re-route via West Bridge" },
        { id: "rb-d-reason", text: "due traffic" },
      ],
      expectedSentence: "Request re-route via North Lake due weather, G-ABCD.",
      expectedSpoken: "Request re-route via North Lake due weather, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. The re-route, the reason and your callsign.",
      incorrectFeedback: "Order: request re-route via North Lake · due weather · callsign.",
    }),
    choiceExercise(WX, {
      id: "ao-weather.reroute.wrong-route",
      title: "Wrong route readback",
      description: "Spot the incorrect approved route in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC approved a route via West Bridge. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, route via West Bridge approved.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route via West Bridge approved.",
      shownReadback: "Route via North Lake, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wr-route", text: "Wrong approved route. ATC approved West Bridge.", feedback: "Correct. ATC approved West Bridge, but the pilot read back North Lake." },
        { id: "wr-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The route is wrong." },
        { id: "wr-word", text: "The word 'route' is wrong.", feedback: '"Route" is correct. The fix is wrong.' },
        { id: "wr-none", text: "Nothing is wrong.", feedback: "ATC approved West Bridge, not North Lake." },
      ],
      correctId: "wr-route",
    }),
    readbackExercise(WX, {
      id: "ao-weather.reroute.trainer",
      title: "Re-route trainer",
      description: "Read back the approved re-route.",
      headerInstruction: "Read back the re-route approval issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-weather.reroute.trainer.r1",
          atcText: "G-ABCD, route via West Bridge approved.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route via West Bridge approved.",
          expectedReadback: "Route via West Bridge, G-ABCD.",
          expectedReadbackSpoken: "Route via West Bridge, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const wxScenarioTopic: Topic = {
  id: "ao-weather.scenario",
  name: "Weather Deviation Scenario",
  description: "Deviate, then re-route when the weather worsens.",
  unit: "scenario",
  exercises: [
    scenarioExercise(WX, {
      id: "ao-weather.scenario.mission",
      title: "Deviating around weather",
      description: "Request a deviation, then say unable and re-route when the weather worsens.",
      instruction:
        "Weather builds ahead on your route. Request a deviation, read back the approval, then say unable and request a re-route when the original route is no longer safe.",
      heading: "Deviating around weather",
      completionNote:
        "You avoided unsafe weather and communicated the route change clearly.",
      steps: WEATHER_DEVIATION_SCENARIO_STEPS,
    }),
  ],
};

const weatherTopics: Topic[] = [
  wxAheadTopic,
  wxDeviationTopic,
  wxUnableTopic,
  wxRerouteTopic,
  wxScenarioTopic,
];

const weatherDeviations: Module = {
  id: "ao-weather",
  name: "Weather Deviations",
  subtitle: "Report weather, request deviations and re-route around unsafe conditions.",
  unit: "topics",
  topics: weatherTopics,
  exercises: weatherTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 2 — Diversions                                              */
/* ================================================================== */

const DIV: StudentPilotPhase = "diversion";

const divDecisionTopic: Topic = {
  id: "ao-diversions.decision",
  name: "Diversion Decision",
  description: "Decide to change destination and communicate the reason.",
  unit: "exercises",
  exercises: [
    lessonExercise(DIV, {
      id: "ao-diversions.decision.lesson",
      title: "Diversion Decision",
      description: "What a diversion is and how to communicate it.",
      lessonBody:
        "A diversion means changing your destination. Communicate the reason and the new intention together. Common reasons are weather, fuel, a technical issue or a runway becoming unavailable. State the new destination and the reason so ATC understands immediately.",
      points: [
        "A diversion changes your destination.",
        "Communicate the reason and the new intention.",
        "Reasons may include weather, fuel, technical or runway unavailable.",
        "State the new destination clearly.",
      ],
      examples: [
        {
          label: "Diversion request",
          atcText: "G-ABCD, request diversion to Hilltown due weather.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request diversion to Hilltown due weather.",
          readback: "G-ABCD, request diversion to Hilltown due weather.",
        },
      ],
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.decision.why-divert",
      title: "Why divert?",
      description: "Identify the reason to divert.",
      screenKicker: "Choice",
      instruction: "Destination weather is below your safe minima.",
      question: "What is driving the diversion?",
      options: [
        { id: "wd-weather", text: "Weather at destination", feedback: "Correct. The destination is below minima, so you divert." },
        { id: "wd-route", text: "Normal route update", feedback: "No — this is not a routine update; the destination is unusable." },
        { id: "wd-taxi", text: "Taxi instruction", feedback: "No — you are airborne facing weather, not taxiing." },
        { id: "wd-check", text: "Radio check", feedback: "No — this is an operational decision, not a radio check." },
      ],
      correctId: "wd-weather",
    }),
    chipExercise(DIV, {
      id: "ao-diversions.decision.build",
      title: "Build the diversion intention",
      description: "Order the parts of the diversion request.",
      screenKicker: "Listening",
      headerInstruction: "Build the diversion request.",
      atcText: "G-ABCD, request diversion to Hilltown due weather.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, request diversion to Hilltown due weather.",
      prompt: "Order the call.",
      helperText: "Callsign · request diversion · destination · reason.",
      expected: [
        { id: "dd-cs", text: "G-ABCD" },
        { id: "dd-req", text: "request diversion to Hilltown" },
        { id: "dd-reason", text: "due weather" },
      ],
      distractors: [
        { id: "dd-d-dest", text: "request diversion to Brindale" },
        { id: "dd-d-reason", text: "due traffic" },
      ],
      expectedSentence: "G-ABCD, request diversion to Hilltown due weather.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, request diversion to Hilltown due weather.",
      correctFeedback: "Correct. Callsign, the request with destination, and the reason.",
      incorrectFeedback: "Order: callsign · request diversion to Hilltown · due weather.",
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.decision.missing-reason",
      title: "Missing reason detection",
      description: "Spot what the diversion request is missing.",
      screenKicker: "Error detection",
      instruction: "Check the diversion request.",
      question: "What is missing?",
      shownReadback: "G-ABCD, request diversion to Hilltown.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mr-reason", text: "The reason for the diversion is missing.", feedback: "Correct. ATC needs to know why — due weather, fuel or technical." },
        { id: "mr-dest", text: "The destination is missing.", feedback: "Hilltown is stated. The reason is missing." },
        { id: "mr-cs", text: "The callsign is missing.", feedback: "G-ABCD is present. The reason is missing." },
        { id: "mr-none", text: "Nothing is missing.", feedback: "The request gives no reason for the diversion." },
      ],
      correctId: "mr-reason",
    }),
    readbackExercise(DIV, {
      id: "ao-diversions.decision.trainer",
      title: "Diversion intention trainer",
      description: "Request the diversion with a reason.",
      headerInstruction: "You need to divert to Hilltown because of weather. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-diversions.decision.trainer.r1",
          atcText: "You need to divert to Hilltown because of weather.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, request diversion to Hilltown due weather.",
          expectedReadback: "G-ABCD, request diversion to Hilltown due weather.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, request diversion to Hilltown due weather.",
        },
      ],
    }),
  ],
};

const divInformTopic: Topic = {
  id: "ao-diversions.inform",
  name: "Informing ATC",
  description: "State the diversion intention clearly and request routing.",
  unit: "exercises",
  exercises: [
    lessonExercise(DIV, {
      id: "ao-diversions.inform.lesson",
      title: "Informing ATC",
      description: "How to tell ATC your diversion intention.",
      lessonBody:
        "Tell ATC your diversion intention clearly and request routing if you need it. Include the new destination and avoid vague wording — phrases like \"maybe changing plan\" leave ATC unable to act. Be specific and operational.",
      points: [
        "State the diversion intention clearly.",
        "Request routing if needed.",
        "Include the new destination.",
        "Avoid vague wording.",
      ],
      examples: [
        {
          label: "Diversion call",
          atcText: "G-ABCD, diverting to Hilltown, request routing.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, diverting to Hilltown, request routing.",
          readback: "G-ABCD, diverting to Hilltown, request routing.",
        },
      ],
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.inform.best-call",
      title: "Best diversion call",
      description: "Pick the clearest diversion call.",
      screenKicker: "Choice",
      instruction: "You have decided to divert to Hilltown.",
      question: "Which call is best?",
      options: [
        { id: "bc-good", text: "G-ABCD, diverting to Hilltown, request routing.", feedback: "Correct. Clear intention, destination and a request ATC can act on." },
        { id: "bc-maybe", text: "G-ABCD, maybe changing plan.", feedback: "No — this is vague; ATC cannot act on \"maybe\"." },
        { id: "bc-landing", text: "G-ABCD, landing now.", feedback: "No — you are diverting, not on short final; this is misleading." },
        { id: "bc-parking", text: "G-ABCD, parking complete.", feedback: "No — that is unrelated to a diversion." },
      ],
      correctId: "bc-good",
    }),
    chipExercise(DIV, {
      id: "ao-diversions.inform.build",
      title: "Build the ATC call",
      description: "Order the parts of the diversion call.",
      screenKicker: "Listening",
      headerInstruction: "Build the diversion call to ATC.",
      atcText: "G-ABCD, diverting to Hilltown, request routing.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, diverting to Hilltown, request routing.",
      prompt: "Order the call.",
      expected: [
        { id: "ib-cs", text: "G-ABCD" },
        { id: "ib-div", text: "diverting to Hilltown" },
        { id: "ib-req", text: "request routing" },
      ],
      distractors: [
        { id: "ib-d-dest", text: "diverting to Brindale" },
        { id: "ib-d-req", text: "request landing" },
      ],
      expectedSentence: "G-ABCD, diverting to Hilltown, request routing.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, diverting to Hilltown, request routing.",
      correctFeedback: "Correct. Callsign, intention with destination, and the request.",
      incorrectFeedback: "Order: callsign · diverting to Hilltown · request routing.",
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.inform.wrong-destination",
      title: "Wrong destination detection",
      description: "Spot the incorrect destination in the call.",
      screenKicker: "Error detection",
      instruction: "Your new destination is Hilltown. Check the call.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, diverting to Brindale, request routing.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "wd-dest", text: "Wrong diversion destination. It should be Hilltown.", feedback: "Correct. You are diverting to Hilltown, but the call says Brindale." },
        { id: "wd-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The destination is wrong." },
        { id: "wd-req", text: "The request is wrong.", feedback: "Requesting routing is fine. The destination is wrong." },
        { id: "wd-none", text: "Nothing is wrong.", feedback: "The destination should be Hilltown, not Brindale." },
      ],
      correctId: "wd-dest",
    }),
    readbackExercise(DIV, {
      id: "ao-diversions.inform.trainer",
      title: "Diversion call trainer",
      description: "Make the diversion call to ATC.",
      headerInstruction: "You are diverting to Hilltown and need routing. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-diversions.inform.trainer.r1",
          atcText: "You are diverting to Hilltown and need routing.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, diverting to Hilltown, request routing.",
          expectedReadback: "G-ABCD, diverting to Hilltown, request routing.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, diverting to Hilltown, request routing.",
        },
      ],
    }),
  ],
};

const divRoutingTopic: Topic = {
  id: "ao-diversions.routing",
  name: "Routing to Alternate",
  description: "Read back the route and altitude to the alternate in full.",
  unit: "exercises",
  exercises: [
    lessonExercise(DIV, {
      id: "ao-diversions.routing.lesson",
      title: "Routing to Alternate",
      description: "How to read back routing to the alternate.",
      lessonBody:
        "ATC may give you a route and an altitude to the alternate. Read back the route and the restriction together. Do not omit the altitude — it is part of the clearance and keeps you separated from terrain and traffic.",
      points: [
        "ATC may give route and altitude to the alternate.",
        "Read back the route and the restriction.",
        "Do not omit the altitude.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Routing to alternate",
          atcText: "G-ABCD, route direct Hilltown, maintain two thousand feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route direct Hilltown, maintain two thousand feet.",
          readback: "Route direct Hilltown, maintain two thousand feet, G-ABCD.",
        },
      ],
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.routing.identify",
      title: "Identify assigned routing",
      description: "Extract the assigned routing.",
      screenKicker: "Choice",
      instruction: "Listen to the routing.",
      question: "What routing were you assigned?",
      atcDisplay: "Route direct Hilltown, maintain two thousand feet.",
      atcSpoken: "Route direct Hilltown, maintain two thousand feet.",
      atcHidden: true,
      options: [
        { id: "ri-hilltown", text: "Direct Hilltown", feedback: "Correct. Route direct Hilltown, maintain two thousand feet." },
        { id: "ri-brindale", text: "Direct Brindale", feedback: "No — the routing is direct Hilltown, your alternate." },
        { id: "ri-northlake", text: "Via North Lake", feedback: "No — it is direct Hilltown, not via North Lake." },
        { id: "ri-hold", text: "Hold at LAMSO", feedback: "No — this is a direct routing, not a hold." },
      ],
      correctId: "ri-hilltown",
    }),
    chipExercise(DIV, {
      id: "ao-diversions.routing.build",
      title: "Build the routing readback",
      description: "Order the parts of the routing readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the routing readback.",
      atcText: "G-ABCD, route direct Hilltown, maintain two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route direct Hilltown, maintain two thousand feet.",
      prompt: "Build the readback.",
      helperText: "Route direct · destination · altitude · callsign.",
      expected: [
        { id: "rrb-route", text: "Route direct Hilltown" },
        { id: "rrb-alt", text: "maintain two thousand feet" },
        { id: "rrb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rrb-d-dest", text: "Route direct Brindale" },
        { id: "rrb-d-alt", text: "maintain three thousand feet" },
      ],
      expectedSentence: "Route direct Hilltown, maintain two thousand feet, G-ABCD.",
      expectedSpoken: "Route direct Hilltown, maintain two thousand feet, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Route, altitude restriction and callsign.",
      incorrectFeedback: "Order: route direct Hilltown · maintain two thousand feet · callsign.",
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.routing.altitude-omitted",
      title: "Altitude restriction omitted",
      description: "Spot the missing altitude in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said route direct Hilltown, maintain two thousand feet. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, route direct Hilltown, maintain two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, route direct Hilltown, maintain two thousand feet.",
      shownReadback: "Route direct Hilltown, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ao-alt", text: "The altitude restriction is omitted.", feedback: "Correct. \"Maintain two thousand feet\" was dropped — read back the whole clearance." },
        { id: "ao-route", text: "The route is wrong.", feedback: "Direct Hilltown matches. The altitude was dropped." },
        { id: "ao-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The altitude was dropped." },
        { id: "ao-none", text: "Nothing is wrong.", feedback: "\"Maintain two thousand feet\" was not read back." },
      ],
      correctId: "ao-alt",
    }),
    readbackExercise(DIV, {
      id: "ao-diversions.routing.trainer",
      title: "Routing trainer",
      description: "Read back the routing and altitude.",
      headerInstruction: "Read back the routing to the alternate issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-diversions.routing.trainer.r1",
          atcText: "G-ABCD, route direct Hilltown, maintain two thousand feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, route direct Hilltown, maintain two thousand feet.",
          expectedReadback: "Route direct Hilltown, maintain two thousand feet, G-ABCD.",
          expectedReadbackSpoken: "Route direct Hilltown, maintain two thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const divUpdateTopic: Topic = {
  id: "ao-diversions.update",
  name: "Updating Intentions",
  description: "Update destination, route and estimate — drop the old destination.",
  unit: "exercises",
  exercises: [
    lessonExercise(DIV, {
      id: "ao-diversions.update.lesson",
      title: "Updating Intentions",
      description: "How to update intentions once the diversion begins.",
      lessonBody:
        "Once the diversion begins, update your destination, route and estimate. Do not keep reporting the old destination — it confuses ATC and other traffic. An estimate for the new field helps ATC plan your arrival.",
      points: [
        "Update destination, route and estimate.",
        "Do not keep reporting the old destination.",
        "Estimates help ATC plan.",
        "Keep the update short.",
      ],
      examples: [
        {
          label: "Updated intention",
          atcText: "G-ABCD, now diverting to Hilltown, estimating Hilltown at four zero.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, now diverting to Hilltown, estimating Hilltown at four zero.",
          readback: "G-ABCD, now diverting to Hilltown, estimating Hilltown at four zero.",
        },
      ],
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.update.what-changed",
      title: "What changed?",
      description: "Identify what the update changes.",
      screenKicker: "Choice",
      instruction: "Listen to the update.",
      question: "What has changed?",
      atcDisplay: "Now diverting to Hilltown.",
      atcSpoken: "Now diverting to Hilltown.",
      atcHidden: true,
      options: [
        { id: "wc-dest", text: "Destination changed to Hilltown", feedback: "Correct. You are now bound for Hilltown, not the original field." },
        { id: "wc-rwy", text: "Runway changed", feedback: "No — no runway was mentioned; the destination changed." },
        { id: "wc-freq", text: "Frequency changed", feedback: "No — no frequency was mentioned; the destination changed." },
        { id: "wc-cs", text: "Aircraft callsign changed", feedback: "No — the callsign is unchanged; the destination changed." },
      ],
      correctId: "wc-dest",
    }),
    chipExercise(DIV, {
      id: "ao-diversions.update.build",
      title: "Build the updated intention",
      description: "Order the parts of the updated intention.",
      screenKicker: "Listening",
      headerInstruction: "Build the updated intention call.",
      atcText: "G-ABCD, now diverting to Hilltown, estimating Hilltown at four zero.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, now diverting to Hilltown, estimating Hilltown at four zero.",
      prompt: "Order the call.",
      helperText: "Callsign · now diverting · destination · estimate.",
      expected: [
        { id: "ub-cs", text: "G-ABCD" },
        { id: "ub-div", text: "now diverting to Hilltown" },
        { id: "ub-est", text: "estimating Hilltown at four zero" },
      ],
      distractors: [
        { id: "ub-d-dest", text: "now diverting to Brindale" },
        { id: "ub-d-est", text: "estimating Brindale at four zero" },
      ],
      expectedSentence: "G-ABCD, now diverting to Hilltown, estimating Hilltown at four zero.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, now diverting to Hilltown, estimating Hilltown at four zero.",
      correctFeedback: "Correct. Callsign, the new destination and the estimate.",
      incorrectFeedback: "Order: callsign · now diverting to Hilltown · estimating Hilltown at four zero.",
    }),
    choiceExercise(DIV, {
      id: "ao-diversions.update.old-destination",
      title: "Old destination trap",
      description: "Spot the old destination in the update.",
      screenKicker: "Error detection",
      instruction: "Your new destination is Hilltown. Check the update.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, continuing to Brindale, estimating Brindale at four zero.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "od-old", text: "The pilot reports the old destination.", feedback: "Correct. You are diverting to Hilltown, but the update still names Brindale." },
        { id: "od-est", text: "The estimate time is wrong.", feedback: "The time is fine. The destination is the old one." },
        { id: "od-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The destination is the old one." },
        { id: "od-none", text: "Nothing is wrong.", feedback: "The update should name Hilltown, not Brindale." },
      ],
      correctId: "od-old",
    }),
    readbackExercise(DIV, {
      id: "ao-diversions.update.trainer",
      title: "Updated intention trainer",
      description: "Update your intentions with the new destination and estimate.",
      headerInstruction: "You are now diverting to Hilltown and estimate arrival at minute four zero. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-diversions.update.trainer.r1",
          atcText: "You are now diverting to Hilltown and estimate arrival at minute four zero.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, now diverting to Hilltown, estimating Hilltown at four zero.",
          expectedReadback: "G-ABCD, now diverting to Hilltown, estimating Hilltown at four zero.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, now diverting to Hilltown, estimating Hilltown at four zero.",
        },
      ],
    }),
  ],
};

const divScenarioTopic: Topic = {
  id: "ao-diversions.scenario",
  name: "Diversion Scenario",
  description: "Decide, inform, route and update a diversion.",
  unit: "scenario",
  exercises: [
    scenarioExercise(DIV, {
      id: "ao-diversions.scenario.mission",
      title: "Diverting to Hilltown",
      description: "Request the diversion, read back the routing, update intentions and take the handoff.",
      instruction:
        "Destination weather deteriorates. Request a diversion to Hilltown, read back the routing, update your intentions and read back the frequency transfer.",
      heading: "Diverting to Hilltown",
      completionNote:
        "You informed ATC and established the diversion plan.",
      steps: DIVERSION_SCENARIO_STEPS,
    }),
  ],
};

const diversionsTopics: Topic[] = [
  divDecisionTopic,
  divInformTopic,
  divRoutingTopic,
  divUpdateTopic,
  divScenarioTopic,
];

const diversions: Module = {
  id: "ao-diversions",
  name: "Diversions",
  subtitle: "Decide, communicate and manage a change of destination.",
  unit: "topics",
  topics: diversionsTopics,
  exercises: diversionsTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 3 — PAN PAN                                                 */
/* ================================================================== */

const PAN: StudentPilotPhase = "pan-pan";

const panWhenTopic: Topic = {
  id: "ao-panpan.when",
  name: "When to Use PAN PAN",
  description: "Recognise urgency and declare it early, without under-reporting.",
  unit: "exercises",
  exercises: [
    lessonExercise(PAN, {
      id: "ao-panpan.when.lesson",
      title: "When to Use PAN PAN",
      description: "When a situation is urgent but not distress.",
      lessonBody:
        "PAN PAN signals urgency — a serious problem that is not yet grave, imminent danger requiring MAYDAY. Declare it early and clearly. Under-reporting urgency, such as asking to return \"when convenient\", denies you the priority you may need.",
      points: [
        "PAN PAN is for urgency, not distress.",
        "Serious problem, but not immediate grave danger.",
        "Declare early and clearly.",
        "Do not under-report the urgency.",
      ],
      examples: [
        {
          label: "PAN PAN call",
          atcText: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
          atcSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
          readback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
        },
      ],
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.when.pan-or-normal",
      title: "PAN or normal call?",
      description: "Decide whether the situation needs PAN PAN.",
      screenKicker: "Choice",
      instruction: "The engine is running rough. The aircraft is controllable, but you need a priority return.",
      question: "What call is appropriate?",
      options: [
        { id: "pn-pan", text: "PAN PAN", feedback: "Correct. A serious but controllable problem needing priority is urgency — PAN PAN." },
        { id: "pn-normal", text: "Normal request only", feedback: "No — a rough engine needing priority is more than a normal request." },
        { id: "pn-check", text: "Radio check", feedback: "No — this is an urgency, not a radio check." },
        { id: "pn-parking", text: "Parking complete", feedback: "No — you are airborne with a problem, not parked." },
      ],
      correctId: "pn-pan",
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.when.urgency-vs-emergency",
      title: "Urgency vs emergency",
      description: "Place PAN PAN correctly between normal and MAYDAY.",
      screenKicker: "Choice",
      instruction: "Think about the meaning of the call.",
      question: "What is PAN PAN used for?",
      options: [
        { id: "ue-urgency", text: "Urgency — serious problem, not immediate grave danger", feedback: "Correct. PAN PAN is the urgency signal: serious, but not yet distress." },
        { id: "ue-distress", text: "Distress — grave and imminent danger", feedback: "No — that is MAYDAY territory. PAN PAN is for urgency, below the MAYDAY threshold." },
        { id: "ue-normal", text: "Routine operational request", feedback: "No — a routine request does not justify the urgency prefix." },
        { id: "ue-info", text: "Normal information update to ATC", feedback: "No — PAN PAN is not an information call; it declares a serious problem." },
      ],
      correctId: "ue-urgency",
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.when.under-reporting",
      title: "Unsafe under-reporting detection",
      description: "Spot the under-reported urgency.",
      screenKicker: "Error detection",
      instruction: "The engine is rough running and you need a priority return. Check the call.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, request return when convenient.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "ur-under", text: "The urgency is under-reported.", feedback: "Correct. \"When convenient\" hides the urgency; declare PAN PAN for a priority return." },
        { id: "ur-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is hiding the urgency." },
        { id: "ur-dest", text: "The destination is missing.", feedback: "The destination is not the issue; the urgency is not declared." },
        { id: "ur-none", text: "Nothing is wrong.", feedback: "A priority need stated as \"when convenient\" under-reports the urgency." },
      ],
      correctId: "ur-under",
    }),
    readbackExercise(PAN, {
      id: "ao-panpan.when.trainer",
      title: "PAN decision trainer",
      description: "Make the PAN PAN call.",
      headerInstruction: "Engine rough running, aircraft controllable, request priority return. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-panpan.when.trainer.r1",
          atcText: "Engine rough running, aircraft controllable, request priority return.",
          atcSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
          expectedReadback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
          expectedReadbackSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
        },
      ],
    }),
  ],
};

const panStructureTopic: Topic = {
  id: "ao-panpan.structure",
  name: "PAN PAN Call Structure",
  description: "Build the PAN PAN call with all its parts in order.",
  unit: "exercises",
  exercises: [
    lessonExercise(PAN, {
      id: "ao-panpan.structure.lesson",
      title: "PAN PAN Call Structure",
      description: "The parts of a PAN PAN call.",
      lessonBody:
        "A PAN PAN call has a clear structure: PAN PAN three times, the station, your callsign, the nature of the urgency and your intention or request. Keep the order so the controller can act without asking you to repeat under pressure.",
      points: [
        "PAN PAN, three times.",
        "Station, then callsign.",
        "Nature of the urgency.",
        "Intention or request.",
      ],
      examples: [
        {
          label: "PAN PAN structure",
          atcText: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
          atcSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
          readback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
        },
      ],
    }),
    chipExercise(PAN, {
      id: "ao-panpan.structure.build",
      title: "Build the PAN call",
      description: "Order the parts of the PAN PAN call.",
      screenKicker: "Listening",
      headerInstruction: "Build the PAN PAN call.",
      atcText: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
      atcSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
      prompt: "Order the call.",
      helperText: "PAN PAN ×3 · station · callsign · nature · request.",
      expected: [
        { id: "pb-pan", text: "PAN PAN, PAN PAN, PAN PAN" },
        { id: "pb-station", text: "Brindale Approach" },
        { id: "pb-cs", text: "G-ABCD" },
        { id: "pb-nature", text: "engine rough running" },
        { id: "pb-req", text: "request priority return" },
      ],
      distractors: [
        { id: "pb-d-mayday", text: "MAYDAY, MAYDAY, MAYDAY" },
        { id: "pb-d-req", text: "request return when convenient" },
      ],
      expectedSentence: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
      expectedSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
      correctFeedback: "Correct. PAN PAN ×3, station, callsign, nature and request.",
      incorrectFeedback: "Order: PAN PAN ×3 · station · callsign · nature · request.",
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.structure.missing-callsign",
      title: "Missing callsign detection",
      description: "Spot the missing callsign in the PAN call.",
      screenKicker: "Error detection",
      instruction: "Check the PAN PAN call.",
      question: "What is missing?",
      shownReadback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, engine rough running, request priority return.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mc-cs", text: "The callsign is missing.", feedback: "Correct. Without G-ABCD, ATC cannot identify who has the urgency." },
        { id: "mc-station", text: "The station is missing.", feedback: "Brindale Approach is present. The callsign is missing." },
        { id: "mc-nature", text: "The nature of the problem is missing.", feedback: "The nature is present. The callsign is missing." },
        { id: "mc-none", text: "Nothing is missing.", feedback: "There is no callsign in the call." },
      ],
      correctId: "mc-cs",
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.structure.missing-nature",
      title: "Missing nature of problem",
      description: "Spot the missing nature of the urgency.",
      screenKicker: "Error detection",
      instruction: "Check the PAN PAN call.",
      question: "What is missing?",
      shownReadback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, request priority return.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mn-nature", text: "The nature of the urgency is missing.", feedback: "Correct. ATC needs to know what is wrong — engine rough running." },
        { id: "mn-cs", text: "The callsign is missing.", feedback: "G-ABCD is present. The nature of the problem is missing." },
        { id: "mn-station", text: "The station is missing.", feedback: "Brindale Approach is present. The nature is missing." },
        { id: "mn-none", text: "Nothing is missing.", feedback: "The call does not say what the problem is." },
      ],
      correctId: "mn-nature",
    }),
    readbackExercise(PAN, {
      id: "ao-panpan.structure.trainer",
      title: "PAN call trainer",
      description: "Make the full PAN PAN call.",
      headerInstruction: "Make the full PAN PAN call to Brindale Approach.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-panpan.structure.trainer.r1",
          atcText: "Engine rough running. Make the full PAN PAN call.",
          atcSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
          expectedReadback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
          expectedReadbackSpoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
        },
      ],
    }),
  ],
};

const panPriorityTopic: Topic = {
  id: "ao-panpan.priority",
  name: "Priority Request",
  description: "State clearly what you need after declaring urgency.",
  unit: "exercises",
  exercises: [
    lessonExercise(PAN, {
      id: "ao-panpan.priority.lesson",
      title: "Priority Request",
      description: "How to state your priority request.",
      lessonBody:
        "After declaring PAN PAN, state exactly what you need: a priority return, vectors, or landing priority. Keep the request clear and matched to your situation, so ATC can give you the help that fits.",
      points: [
        "After PAN PAN, state what you need.",
        "Examples: priority return, vectors, landing priority.",
        "Keep the request clear.",
        "Match the request to the situation.",
      ],
      examples: [
        {
          label: "Priority request",
          atcText: "Request priority return to Brindale, G-ABCD.",
          atcSpoken: "Request priority return to Brindale, Golf Alfa Bravo Charlie Delta.",
          readback: "Request priority return to Brindale, G-ABCD.",
        },
      ],
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.priority.request-return",
      title: "Request priority return",
      description: "Pick the request that matches the urgency.",
      screenKicker: "Choice",
      instruction: "You have declared PAN PAN and want to return to Brindale.",
      question: "Which request is correct?",
      options: [
        { id: "rr-return", text: "Request priority return to Brindale, G-ABCD.", feedback: "Correct. The request matches your urgency and destination." },
        { id: "rr-stand", text: "Request parking stand four.", feedback: "No — parking is not what you need with an engine problem in flight." },
        { id: "rr-check", text: "Request radio check.", feedback: "No — a radio check does not address the urgency." },
        { id: "rr-taxi", text: "Request taxi to holding point.", feedback: "No — you are airborne; you need a priority return." },
      ],
      correctId: "rr-return",
    }),
    chipExercise(PAN, {
      id: "ao-panpan.priority.build",
      title: "Build the priority request",
      description: "Order the parts of the priority request.",
      screenKicker: "Listening",
      headerInstruction: "Build the priority request.",
      atcText: "Request priority return to Brindale, G-ABCD.",
      atcSpoken: "Request priority return to Brindale, Golf Alfa Bravo Charlie Delta.",
      prompt: "Order the call.",
      expected: [
        { id: "prb-req", text: "Request priority return" },
        { id: "prb-dest", text: "to Brindale" },
        { id: "prb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "prb-d-dest", text: "to Hilltown" },
        { id: "prb-d-req", text: "request continue" },
      ],
      expectedSentence: "Request priority return to Brindale, G-ABCD.",
      expectedSpoken: "Request priority return to Brindale, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. The request, the destination and your callsign.",
      incorrectFeedback: "Order: request priority return · to Brindale · callsign.",
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.priority.wrong-request",
      title: "Wrong request detection",
      description: "Spot the request that does not match the urgency.",
      screenKicker: "Error detection",
      instruction: "Your urgency requires a return to Brindale. Check the call.",
      question: "What is wrong?",
      shownReadback: "Request continue to destination, G-ABCD.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "wr-mismatch", text: "The request does not match the urgency intention.", feedback: "Correct. You need a priority return, but the call requests to continue to destination." },
        { id: "wr-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The request contradicts the urgency." },
        { id: "wr-word", text: 'The word "request" is wrong.', feedback: '"Request" is fine. The intention is the opposite of what you need.' },
        { id: "wr-none", text: "Nothing is wrong.", feedback: "Continuing to destination does not match a priority-return urgency." },
      ],
      correctId: "wr-mismatch",
    }),
    readbackExercise(PAN, {
      id: "ao-panpan.priority.trainer",
      title: "Priority trainer",
      description: "Request the priority return.",
      headerInstruction: "You have declared PAN PAN and want a priority return to Brindale. Make the request.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-panpan.priority.trainer.r1",
          atcText: "You want a priority return to Brindale.",
          atcSpoken: "Request priority return to Brindale, Golf Alfa Bravo Charlie Delta.",
          expectedReadback: "Request priority return to Brindale, G-ABCD.",
          expectedReadbackSpoken: "Request priority return to Brindale, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const panUpdateTopic: Topic = {
  id: "ao-panpan.update",
  name: "Updating ATC During PAN",
  description: "Keep ATC informed with status, altitude and intentions.",
  unit: "exercises",
  exercises: [
    lessonExercise(PAN, {
      id: "ao-panpan.update.lesson",
      title: "Updating ATC During PAN",
      description: "How to update ATC after declaring urgency.",
      lessonBody:
        "After declaring urgency, update ATC as the situation changes. Include your status, altitude and intentions, and keep the calls short. A useful update lets ATC adjust its plan; \"problem stable\" alone tells them little.",
      points: [
        "Update ATC as the situation changes.",
        "Include status, altitude and intentions.",
        "Keep the calls short.",
        "Tell ATC if the problem worsens.",
      ],
      examples: [
        {
          label: "Status update",
          atcText: "G-ABCD, problem stable, maintaining two thousand feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, problem stable, maintaining two thousand feet.",
          readback: "G-ABCD, problem stable, maintaining two thousand feet.",
        },
      ],
    }),
    chipExercise(PAN, {
      id: "ao-panpan.update.build-stable",
      title: "Update the situation",
      description: "Order a stable-status update.",
      screenKicker: "Listening",
      headerInstruction: "Build the status update.",
      atcText: "G-ABCD, problem stable, maintaining two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, problem stable, maintaining two thousand feet.",
      prompt: "Order the call.",
      expected: [
        { id: "us-cs", text: "G-ABCD" },
        { id: "us-status", text: "problem stable" },
        { id: "us-alt", text: "maintaining two thousand feet" },
      ],
      distractors: [
        { id: "us-d-status", text: "problem worsening" },
        { id: "us-d-alt", text: "maintaining three thousand feet" },
      ],
      expectedSentence: "G-ABCD, problem stable, maintaining two thousand feet.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, problem stable, maintaining two thousand feet.",
      correctFeedback: "Correct. Callsign, status and altitude.",
      incorrectFeedback: "Order: callsign · problem stable · maintaining two thousand feet.",
    }),
    chipExercise(PAN, {
      id: "ao-panpan.update.build-worsening",
      title: "Build the update call",
      description: "Order a worsening-status update.",
      screenKicker: "Listening",
      headerInstruction: "Build the update when the problem worsens.",
      atcText: "G-ABCD, problem worsening, request immediate vectors to Brindale.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, problem worsening, request immediate vectors to Brindale.",
      prompt: "Order the call.",
      expected: [
        { id: "uw-cs", text: "G-ABCD" },
        { id: "uw-status", text: "problem worsening" },
        { id: "uw-req", text: "request immediate vectors to Brindale" },
      ],
      distractors: [
        { id: "uw-d-status", text: "problem stable" },
        { id: "uw-d-req", text: "request vectors when convenient" },
      ],
      expectedSentence: "G-ABCD, problem worsening, request immediate vectors to Brindale.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, problem worsening, request immediate vectors to Brindale.",
      correctFeedback: "Correct. Callsign, the worsening status and the request.",
      incorrectFeedback: "Order: callsign · problem worsening · request immediate vectors to Brindale.",
    }),
    choiceExercise(PAN, {
      id: "ao-panpan.update.more-useful",
      title: "Make the update useful",
      description: "Decide what would improve the update.",
      screenKicker: "Choice",
      instruction: "The pilot transmits a status update.",
      question: "What would make this update more useful?",
      shownReadback: "G-ABCD, problem stable.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mu-alt-int", text: "Add altitude and intention", feedback: "Correct. \"Problem stable\" is more useful with your altitude and what you intend to do." },
        { id: "mu-colour", text: "Add the aircraft colour", feedback: "No — colour does not help ATC manage the urgency." },
        { id: "mu-cs", text: "Repeat the callsign twice", feedback: "No — repeating the callsign adds nothing useful." },
        { id: "mu-nothing", text: "Nothing, it is complete", feedback: "It is thin — altitude and intention would help ATC plan." },
      ],
      correctId: "mu-alt-int",
    }),
    readbackExercise(PAN, {
      id: "ao-panpan.update.trainer",
      title: "Update trainer",
      description: "Update ATC with status and altitude.",
      headerInstruction: "The problem is stable and you are maintaining two thousand feet. Update ATC.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-panpan.update.trainer.r1",
          atcText: "The problem is stable and you are maintaining two thousand feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, problem stable, maintaining two thousand feet.",
          expectedReadback: "G-ABCD, problem stable, maintaining two thousand feet.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, problem stable, maintaining two thousand feet.",
        },
      ],
    }),
  ],
};

const panScenarioTopic: Topic = {
  id: "ao-panpan.scenario",
  name: "PAN PAN Scenario",
  description: "Declare urgency, take a priority return and update ATC.",
  unit: "scenario",
  exercises: [
    scenarioExercise(PAN, {
      id: "ao-panpan.scenario.mission",
      title: "Declaring a PAN PAN",
      description: "Make the PAN PAN call, read back the routing, update ATC and read back the expected runway.",
      instruction:
        "Engine rough running, aircraft controllable. Declare PAN PAN, read back the priority routing, update ATC and read back the expected runway.",
      heading: "Declaring a PAN PAN",
      completionNote:
        "Urgency declared and priority return established.",
      steps: PAN_PAN_SCENARIO_STEPS,
    }),
  ],
};

const panTopics: Topic[] = [
  panWhenTopic,
  panStructureTopic,
  panPriorityTopic,
  panUpdateTopic,
  panScenarioTopic,
];

const panPan: Module = {
  id: "ao-panpan",
  name: "PAN PAN",
  subtitle: "Declare urgency clearly and ask for the priority you need.",
  unit: "topics",
  topics: panTopics,
  exercises: panTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 4 — MAYDAY                                                  */
/* ================================================================== */

const MAY: StudentPilotPhase = "mayday";

const mayWhenTopic: Topic = {
  id: "ao-mayday.when",
  name: "When to Use MAYDAY",
  description: "Recognise distress and declare MAYDAY early and clearly.",
  unit: "exercises",
  exercises: [
    lessonExercise(MAY, {
      id: "ao-mayday.when.lesson",
      title: "When to Use MAYDAY",
      description: "When a situation is distress, not just urgency.",
      lessonBody:
        "MAYDAY is for distress — grave and imminent danger. Use it clearly and early; do not down-grade a life-threatening emergency to PAN PAN. Keep the first call short so the essential information gets through.",
      points: [
        "MAYDAY is for distress / grave and imminent danger.",
        "Use it clearly and early.",
        "Do not under-declare a life-threatening emergency.",
        "Keep the first call short.",
      ],
      examples: [
        {
          label: "MAYDAY call",
          atcText: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
          atcSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
          readback: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
        },
      ],
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.when.mayday-or-pan",
      title: "MAYDAY or PAN?",
      description: "Decide the correct level of declaration.",
      screenKicker: "Choice",
      instruction: "Engine failure and a forced landing are required.",
      question: "What call is appropriate?",
      options: [
        { id: "mp-mayday", text: "MAYDAY", feedback: "Correct. Engine failure with a forced landing is grave and imminent danger — MAYDAY." },
        { id: "mp-pan", text: "PAN PAN", feedback: "No — a forced landing is distress, not just urgency; this is MAYDAY." },
        { id: "mp-normal", text: "Normal request", feedback: "No — this is a life-threatening emergency, not a normal request." },
        { id: "mp-check", text: "Radio check", feedback: "No — this is distress, not a radio check." },
      ],
      correctId: "mp-mayday",
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.when.severity",
      title: "Emergency severity decision",
      description: "Place MAYDAY correctly above PAN PAN and normal calls.",
      screenKicker: "Choice",
      instruction: "Consider which situation is distress.",
      question: "Which situation is most appropriate for MAYDAY?",
      options: [
        { id: "es-forced", text: "Immediate grave danger requiring emergency action — forced landing", feedback: "Correct. Grave and imminent danger is distress — MAYDAY." },
        { id: "es-urgent", text: "Urgent but controllable — engine rough running, priority return needed", feedback: "No — a controllable situation with priority needed is urgency: declare PAN PAN, not MAYDAY." },
        { id: "es-caution", text: "Minor technical caution, aircraft stable, no immediate danger", feedback: "No — a stable caution warrants an advisory and a safe-option request, not a distress call." },
        { id: "es-divert", text: "Routine diversion due weather at destination", feedback: "No — a planned diversion is not distress; it does not require MAYDAY." },
      ],
      correctId: "es-forced",
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.when.under-declared",
      title: "Under-declared emergency detection",
      description: "Spot the under-declared emergency.",
      screenKicker: "Error detection",
      instruction: "There is an engine failure and a forced landing is required. Check the call.",
      question: "What is wrong?",
      shownReadback: "PAN PAN, PAN PAN, PAN PAN, request priority return.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "ud-under", text: "The emergency is under-declared; MAYDAY is more appropriate.", feedback: "Correct. A forced landing is distress — declare MAYDAY, not PAN PAN." },
        { id: "ud-cs", text: "The callsign is missing.", feedback: "The callsign matters, but the bigger issue is under-declaring distress as urgency." },
        { id: "ud-station", text: "The station is wrong.", feedback: "The station is not the issue; the severity is under-declared." },
        { id: "ud-none", text: "Nothing is wrong.", feedback: "A forced landing should be a MAYDAY, not a PAN PAN." },
      ],
      correctId: "ud-under",
    }),
    readbackExercise(MAY, {
      id: "ao-mayday.when.trainer",
      title: "MAYDAY decision trainer",
      description: "Make the MAYDAY call.",
      headerInstruction: "Engine failure. You are at two thousand feet and preparing for a forced landing. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-mayday.when.trainer.r1",
          atcText: "Engine failure. Two thousand feet, preparing for a forced landing.",
          atcSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
          expectedReadback: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
          expectedReadbackSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
        },
      ],
    }),
  ],
};

const mayStructureTopic: Topic = {
  id: "ao-mayday.structure",
  name: "MAYDAY Call Structure",
  description: "Build the MAYDAY call with all its parts in order.",
  unit: "exercises",
  exercises: [
    lessonExercise(MAY, {
      id: "ao-mayday.structure.lesson",
      title: "MAYDAY Call Structure",
      description: "The parts of a MAYDAY call.",
      lessonBody:
        "A MAYDAY call has a clear structure: MAYDAY three times, the station, your callsign, the nature of the emergency, position or altitude if possible, and your intention. Keeping the structure means the controller gets the essentials even under heavy workload.",
      points: [
        "MAYDAY, three times.",
        "Station, then callsign.",
        "Nature of the emergency.",
        "Position or altitude, then intention.",
      ],
      examples: [
        {
          label: "MAYDAY structure",
          atcText: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
          atcSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
          readback: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
        },
      ],
    }),
    chipExercise(MAY, {
      id: "ao-mayday.structure.build",
      title: "Build the MAYDAY call",
      description: "Order the parts of the MAYDAY call.",
      screenKicker: "Listening",
      headerInstruction: "Build the MAYDAY call.",
      atcText: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
      atcSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
      prompt: "Order the call.",
      helperText: "MAYDAY ×3 · station · callsign · nature · altitude · intention.",
      expected: [
        { id: "mb-mayday", text: "MAYDAY, MAYDAY, MAYDAY" },
        { id: "mb-station", text: "Brindale Approach" },
        { id: "mb-cs", text: "G-ABCD" },
        { id: "mb-nature", text: "engine failure" },
        { id: "mb-alt", text: "two thousand feet" },
        { id: "mb-int", text: "forced landing" },
      ],
      distractors: [
        { id: "mb-d-pan", text: "PAN PAN, PAN PAN, PAN PAN" },
        { id: "mb-d-alt", text: "three thousand feet" },
      ],
      expectedSentence: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
      expectedSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
      correctFeedback: "Correct. MAYDAY ×3, station, callsign, nature, altitude and intention.",
      incorrectFeedback: "Order: MAYDAY ×3 · station · callsign · nature · altitude · intention.",
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.structure.missing-position",
      title: "Missing position detection",
      description: "Spot the missing position/altitude in the MAYDAY call.",
      screenKicker: "Error detection",
      instruction: "Check the MAYDAY call.",
      question: "What is missing?",
      shownReadback: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, forced landing.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mp-pos", text: "Position/altitude information is missing.", feedback: "Correct. Add the altitude — two thousand feet — so ATC can locate and help you." },
        { id: "mp-nature", text: "The nature of the emergency is missing.", feedback: "The nature is present — engine failure. The altitude is missing." },
        { id: "mp-cs", text: "The callsign is missing.", feedback: "G-ABCD is present. The altitude/position is missing." },
        { id: "mp-none", text: "Nothing is missing.", feedback: "There is no altitude or position in the call." },
      ],
      correctId: "mp-pos",
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.structure.missing-nature",
      title: "Missing nature of emergency",
      description: "Spot the missing nature of the emergency.",
      screenKicker: "Error detection",
      instruction: "Check the MAYDAY call.",
      question: "What is missing?",
      shownReadback: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, two thousand feet, forced landing.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mn-nature", text: "The nature of the emergency is missing.", feedback: "Correct. ATC needs to know what is wrong — engine failure." },
        { id: "mn-alt", text: "The altitude is missing.", feedback: "Two thousand feet is present. The nature of the emergency is missing." },
        { id: "mn-cs", text: "The callsign is missing.", feedback: "G-ABCD is present. The nature is missing." },
        { id: "mn-none", text: "Nothing is missing.", feedback: "The call does not say what the emergency is." },
      ],
      correctId: "mn-nature",
    }),
    readbackExercise(MAY, {
      id: "ao-mayday.structure.trainer",
      title: "MAYDAY call trainer",
      description: "Make the full MAYDAY call.",
      headerInstruction: "Make the full MAYDAY call to Brindale Approach.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-mayday.structure.trainer.r1",
          atcText: "Engine failure, two thousand feet, forced landing. Make the full MAYDAY call.",
          atcSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
          expectedReadback: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, G-ABCD, engine failure, two thousand feet, forced landing.",
          expectedReadbackSpoken: "MAYDAY, MAYDAY, MAYDAY, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
        },
      ],
    }),
  ],
};

const mayDetailsTopic: Topic = {
  id: "ao-mayday.details",
  name: "Position / Altitude / Souls / Fuel",
  description: "Pass the details that help ATC manage the emergency.",
  unit: "exercises",
  exercises: [
    lessonExercise(MAY, {
      id: "ao-mayday.details.lesson",
      title: "Position / Altitude / Souls / Fuel",
      description: "What details to pass after the first call.",
      lessonBody:
        "After the first emergency call, provide useful details if workload permits: position, altitude, persons on board, fuel endurance and intentions. These help ATC and rescue services plan. Pass them only when you can, after flying the aircraft.",
      points: [
        "Position and altitude.",
        "Persons on board.",
        "Fuel endurance.",
        "Intentions — pass when workload permits.",
      ],
      examples: [
        {
          label: "Emergency details",
          atcText: "G-ABCD, two persons on board, fuel endurance one hour.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, two persons on board, fuel endurance one hour.",
          readback: "G-ABCD, two persons on board, fuel endurance one hour.",
        },
      ],
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.details.identify",
      title: "Identify critical info",
      description: "Pick the details that help ATC.",
      screenKicker: "Choice",
      instruction: "You have declared a MAYDAY.",
      question: "Which details help ATC during an emergency?",
      options: [
        { id: "ci-all", text: "Position, altitude, persons on board and fuel endurance", feedback: "Correct. These let ATC and rescue services plan their response." },
        { id: "ci-stand", text: "Parking stand only", feedback: "No — a parking stand does not help in an airborne emergency." },
        { id: "ci-colour", text: "Aircraft colour only", feedback: "No — colour alone is not the critical information." },
        { id: "ci-lunch", text: "Lunch preference", feedback: "No — that is irrelevant to the emergency." },
      ],
      correctId: "ci-all",
    }),
    chipExercise(MAY, {
      id: "ao-mayday.details.build",
      title: "Build the emergency details call",
      description: "Order the parts of the details call.",
      screenKicker: "Listening",
      headerInstruction: "Build the emergency details call.",
      atcText: "G-ABCD, two persons on board, fuel endurance one hour.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, two persons on board, fuel endurance one hour.",
      prompt: "Order the call.",
      expected: [
        { id: "db-cs", text: "G-ABCD" },
        { id: "db-pob", text: "two persons on board" },
        { id: "db-fuel", text: "fuel endurance one hour" },
      ],
      distractors: [
        { id: "db-d-pob", text: "four persons on board" },
        { id: "db-d-fuel", text: "fuel endurance two hours" },
      ],
      expectedSentence: "G-ABCD, two persons on board, fuel endurance one hour.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, two persons on board, fuel endurance one hour.",
      correctFeedback: "Correct. Callsign, persons on board and fuel endurance.",
      incorrectFeedback: "Order: callsign · two persons on board · fuel endurance one hour.",
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.details.wrong-fuel",
      title: "Wrong fuel endurance detection",
      description: "Spot the incorrect fuel endurance.",
      screenKicker: "Error detection",
      instruction: "Your fuel endurance is one hour. Check the call.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, two persons on board, fuel endurance two hours.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "wf-fuel", text: "Wrong fuel endurance. It is one hour.", feedback: "Correct. The call says two hours, but your endurance is one hour — critical for rescue planning." },
        { id: "wf-pob", text: "The persons on board is wrong.", feedback: "Two persons matches. The fuel endurance is wrong." },
        { id: "wf-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The fuel endurance is wrong." },
        { id: "wf-none", text: "Nothing is wrong.", feedback: "The endurance is one hour, not two." },
      ],
      correctId: "wf-fuel",
    }),
    readbackExercise(MAY, {
      id: "ao-mayday.details.trainer",
      title: "Emergency details trainer",
      description: "Pass the persons on board and fuel endurance.",
      headerInstruction: "You have two persons on board and one hour fuel endurance. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-mayday.details.trainer.r1",
          atcText: "Two persons on board, one hour fuel endurance.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, two persons on board, fuel endurance one hour.",
          expectedReadback: "G-ABCD, two persons on board, fuel endurance one hour.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, two persons on board, fuel endurance one hour.",
        },
      ],
    }),
  ],
};

const mayInstructionsTopic: Topic = {
  id: "ao-mayday.instructions",
  name: "ATC Emergency Instructions",
  description: "Read back emergency vectors and altitudes when able.",
  unit: "exercises",
  exercises: [
    lessonExercise(MAY, {
      id: "ao-mayday.instructions.lesson",
      title: "ATC Emergency Instructions",
      description: "How to handle ATC instructions during an emergency.",
      lessonBody:
        "ATC may give a heading, an altitude or traffic information during an emergency. Read back instructions if you are able — but aviate first. ATC will often add \"if able\", recognising that flying the aircraft comes before the radio.",
      points: [
        "ATC may give heading, altitude or traffic information.",
        "Read back instructions if able.",
        "Aviate first; communicate when you can.",
        '"If able" recognises your workload.',
      ],
      examples: [
        {
          label: "Emergency vector",
          atcText: "G-ABCD, heading 180, descend 1500 feet if able.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, heading one eight zero, descend one thousand five hundred feet if able.",
          readback: "Heading 180, descend 1500 feet if able, G-ABCD.",
        },
      ],
    }),
    chipExercise(MAY, {
      id: "ao-mayday.instructions.build-vector",
      title: "Read back emergency heading/altitude",
      description: "Order the emergency vector readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the emergency vector readback.",
      atcText: "G-ABCD, heading 180, descend 1500 feet if able.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, heading one eight zero, descend one thousand five hundred feet if able.",
      prompt: "Build the readback.",
      expected: [
        { id: "bv-hdg", text: "Heading 180" },
        { id: "bv-desc", text: "descend 1500 feet if able" },
        { id: "bv-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bv-d-hdg", text: "Heading 090" },
        { id: "bv-d-desc", text: "climb 1500 feet" },
      ],
      expectedSentence: "Heading 180, descend 1500 feet if able, G-ABCD.",
      expectedSpoken: "Heading one eight zero, descend one thousand five hundred feet if able, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Heading, descent with \"if able\", and callsign.",
      incorrectFeedback: "Order: heading 180 · descend 1500 feet if able · callsign.",
    }),
    chipExercise(MAY, {
      id: "ao-mayday.instructions.build-maintain",
      title: "Build readback",
      description: "Order a heading-and-maintain readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback.",
      atcText: "G-ABCD, heading 090, maintain two thousand feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, heading zero niner zero, maintain two thousand feet.",
      prompt: "Build the readback.",
      expected: [
        { id: "bm-hdg", text: "Heading 090" },
        { id: "bm-alt", text: "maintain two thousand feet" },
        { id: "bm-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bm-d-hdg", text: "Heading 180" },
        { id: "bm-d-alt", text: "maintain three thousand feet" },
      ],
      expectedSentence: "Heading 090, maintain two thousand feet, G-ABCD.",
      expectedSpoken: "Heading zero niner zero, maintain two thousand feet, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Heading, altitude and callsign.",
      incorrectFeedback: "Order: heading 090 · maintain two thousand feet · callsign.",
    }),
    choiceExercise(MAY, {
      id: "ao-mayday.instructions.wrong-heading",
      title: "Wrong heading/altitude detection",
      description: "Spot the incorrect heading in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said heading 180, descend 1500 feet if able. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, heading 180, descend 1500 feet if able.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, heading one eight zero, descend one thousand five hundred feet if able.",
      shownReadback: "Heading 090, descend 1500 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wh-hdg", text: "Wrong heading. ATC said heading 180.", feedback: "Correct. The pilot read back 090 instead of 180." },
        { id: "wh-alt", text: "The altitude is wrong.", feedback: "1500 feet matches. The heading is wrong." },
        { id: "wh-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The heading is wrong." },
        { id: "wh-none", text: "Nothing is wrong.", feedback: "ATC said heading 180, not 090." },
      ],
      correctId: "wh-hdg",
    }),
    readbackExercise(MAY, {
      id: "ao-mayday.instructions.trainer",
      title: "Emergency instruction trainer",
      description: "Read back the emergency vector and descent.",
      headerInstruction: "Read back the emergency instruction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-mayday.instructions.trainer.r1",
          atcText: "G-ABCD, heading 180, descend 1500 feet if able.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, heading one eight zero, descend one thousand five hundred feet if able.",
          expectedReadback: "Heading 180, descend 1500 feet if able, G-ABCD.",
          expectedReadbackSpoken: "Heading one eight zero, descend one thousand five hundred feet if able, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const mayScenarioTopic: Topic = {
  id: "ao-mayday.scenario",
  name: "MAYDAY Scenario",
  description: "Declare distress, take vectors and pass critical details.",
  unit: "scenario",
  exercises: [
    scenarioExercise(MAY, {
      id: "ao-mayday.scenario.mission",
      title: "Declaring a MAYDAY",
      description: "Make the MAYDAY call, read back the emergency vector, pass details and acknowledge ATC.",
      instruction:
        "Engine failure, forced landing required. Declare MAYDAY, read back the emergency vector, pass persons on board and fuel, then acknowledge ATC.",
      heading: "Declaring a MAYDAY",
      completionNote:
        "Emergency declared and critical information transmitted.",
      steps: MAYDAY_SCENARIO_STEPS,
    }),
  ],
};

const maydayTopics: Topic[] = [
  mayWhenTopic,
  mayStructureTopic,
  mayDetailsTopic,
  mayInstructionsTopic,
  mayScenarioTopic,
];

const mayday: Module = {
  id: "ao-mayday",
  name: "MAYDAY",
  subtitle: "Declare distress, pass critical information and work with ATC.",
  unit: "topics",
  topics: maydayTopics,
  exercises: maydayTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 5 — High Workload Operations                                */
/* ================================================================== */

const HWL: StudentPilotPhase = "high-workload";

const hwlMultipleTopic: Topic = {
  id: "ao-workload.multiple",
  name: "Multiple Instructions",
  description: "Capture heading, altitude and frequency in one readback.",
  unit: "exercises",
  exercises: [
    lessonExercise(HWL, {
      id: "ao-workload.multiple.lesson",
      title: "Multiple Instructions",
      description: "How to handle a stacked instruction.",
      lessonBody:
        "Under high workload, a single transmission may stack a heading, an altitude and a frequency. Capture all of the critical items and read them all back. An incomplete readback under pressure is where errors hide.",
      points: [
        "One transmission may stack heading, altitude and frequency.",
        "Capture all the critical items.",
        "Read them all back, callsign last.",
        "Avoid incomplete readbacks.",
      ],
      examples: [
        {
          label: "Stacked instruction",
          atcText: "G-ABCD, turn left heading 270, descend 3000 feet, contact Approach 124.700.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven.",
          readback: "Left heading 270, descend 3000 feet, contact Approach 124.700, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HWL, {
      id: "ao-workload.multiple.identify-items",
      title: "Identify all critical items",
      description: "List the items that must be read back.",
      screenKicker: "Choice",
      instruction: "Listen to the stacked instruction.",
      question: "Which items must be read back?",
      atcDisplay: "Turn left heading 270, descend 3000 feet, contact Approach 124.700.",
      atcSpoken: "Turn left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven.",
      atcHidden: true,
      options: [
        { id: "ii-all", text: "Heading, altitude and frequency", feedback: "Correct. All three are safety-critical and must be read back." },
        { id: "ii-hdg", text: "Only heading", feedback: "No — the altitude and frequency are also critical." },
        { id: "ii-freq", text: "Only frequency", feedback: "No — the heading and altitude are also critical." },
        { id: "ii-cs", text: "Only callsign", feedback: "No — the callsign goes last, but the three instructions must be read back." },
      ],
      correctId: "ii-all",
    }),
    chipExercise(HWL, {
      id: "ao-workload.multiple.build",
      title: "Build the full readback",
      description: "Order the parts of the full readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the full readback.",
      atcText: "G-ABCD, turn left heading 270, descend 3000 feet, contact Approach 124.700.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven.",
      prompt: "Build the readback.",
      helperText: "Heading · altitude · frequency · callsign.",
      expected: [
        { id: "mfb-hdg", text: "Left heading 270" },
        { id: "mfb-alt", text: "descend 3000 feet" },
        { id: "mfb-freq", text: "contact Approach 124.700" },
        { id: "mfb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "mfb-d-hdg", text: "Right heading 270" },
        { id: "mfb-d-freq", text: "contact Approach 124.750" },
      ],
      expectedSentence: "Left heading 270, descend 3000 feet, contact Approach 124.700, G-ABCD.",
      expectedSpoken: "Left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Heading, altitude, frequency and callsign — all of it.",
      incorrectFeedback: "Order: left heading 270 · descend 3000 feet · contact Approach 124.700 · callsign.",
    }),
    choiceExercise(HWL, {
      id: "ao-workload.multiple.missing-frequency",
      title: "Missing frequency detection",
      description: "Spot the missing frequency transfer.",
      screenKicker: "Error detection",
      instruction: "ATC gave heading, altitude and a frequency. Check the readback.",
      question: "What is missing?",
      atcDisplay: "Turn left heading 270, descend 3000 feet, contact Approach 124.700.",
      atcSpoken: "Turn left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven.",
      shownReadback: "Left heading 270, descend 3000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mf-freq", text: "The frequency transfer is missing.", feedback: "Correct. \"Contact Approach 124.700\" was dropped from the readback." },
        { id: "mf-hdg", text: "The heading is missing.", feedback: "The heading is present. The frequency transfer is missing." },
        { id: "mf-alt", text: "The altitude is missing.", feedback: "The altitude is present. The frequency transfer is missing." },
        { id: "mf-none", text: "Nothing is missing.", feedback: "The frequency transfer was not read back." },
      ],
      correctId: "mf-freq",
    }),
    readbackExercise(HWL, {
      id: "ao-workload.multiple.trainer",
      title: "Multi-instruction trainer",
      description: "Read back the stacked instruction.",
      headerInstruction: "Read back the full instruction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-workload.multiple.trainer.r1",
          atcText: "G-ABCD, turn left heading 270, descend 3000 feet, contact Approach 124.700.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven.",
          expectedReadback: "Left heading 270, descend 3000 feet, contact Approach 124.700, G-ABCD.",
          expectedReadbackSpoken: "Left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const hwlRapidTopic: Topic = {
  id: "ao-workload.rapid",
  name: "Rapid Instruction Change",
  description: "Handle a correction without reading back stale information.",
  unit: "exercises",
  exercises: [
    lessonExercise(HWL, {
      id: "ao-workload.rapid.lesson",
      title: "Rapid Instruction Change",
      description: "How to handle a quick correction.",
      lessonBody:
        "Amended instructions replace the previous ones. When ATC says \"correction\", identify what changed and read back only the new value. Reading back stale information after a correction is a common high-workload error.",
      points: [
        '"Correction" signals an amended instruction.',
        "Identify what changed.",
        "Read back the new value, not the old one.",
        "Do not read back stale information.",
      ],
      examples: [
        {
          label: "Correction",
          atcText: "G-ABCD, correction, heading 290, not 270.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, heading two niner zero, not two seven zero.",
          readback: "Heading 290, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HWL, {
      id: "ao-workload.rapid.what-changed",
      title: "What changed?",
      description: "Identify the corrected value.",
      screenKicker: "Choice",
      instruction: "Listen to the correction.",
      question: "What changed?",
      atcDisplay: "Correction, heading 290, not 270.",
      atcSpoken: "Correction, heading two niner zero, not two seven zero.",
      atcHidden: true,
      options: [
        { id: "wc-hdg", text: "Heading changed to 290", feedback: "Correct. The heading was corrected from 270 to 290." },
        { id: "wc-alt", text: "Altitude changed", feedback: "No — no altitude was mentioned; the heading changed." },
        { id: "wc-freq", text: "Frequency changed", feedback: "No — no frequency was mentioned; the heading changed." },
        { id: "wc-cs", text: "Callsign changed", feedback: "No — the callsign is unchanged; the heading changed." },
      ],
      correctId: "wc-hdg",
    }),
    chipExercise(HWL, {
      id: "ao-workload.rapid.build",
      title: "Build the new readback",
      description: "Order the parts of the corrected readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback of the corrected heading.",
      atcText: "G-ABCD, correction, heading 290, not 270.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, heading two niner zero, not two seven zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "rb-hdg", text: "Heading 290" },
        { id: "rb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rb-d-hdg", text: "Heading 270" },
        { id: "rb-d-hdg2", text: "Heading 190" },
      ],
      expectedSentence: "Heading 290, G-ABCD.",
      expectedSpoken: "Heading two niner zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back the new heading only, with your callsign.",
      incorrectFeedback: "Read back: heading 290 · callsign.",
    }),
    choiceExercise(HWL, {
      id: "ao-workload.rapid.old-trap",
      title: "Old instruction trap",
      description: "Spot the stale heading in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC corrected the heading to 290. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, correction, heading 290, not 270.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, heading two niner zero, not two seven zero.",
      shownReadback: "Heading 270, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ot-old", text: "The pilot read back the old heading.", feedback: "Correct. ATC corrected to 290, but the pilot read back the original 270." },
        { id: "ot-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The heading is the stale one." },
        { id: "ot-word", text: "The word 'heading' is wrong.", feedback: '"Heading" is correct. The value is the old one.' },
        { id: "ot-none", text: "Nothing is wrong.", feedback: "The correction was 290, not 270." },
      ],
      correctId: "ot-old",
    }),
    readbackExercise(HWL, {
      id: "ao-workload.rapid.trainer",
      title: "Rapid change trainer",
      description: "Read back the corrected heading.",
      headerInstruction: "Read back the correction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-workload.rapid.trainer.r1",
          atcText: "G-ABCD, correction, heading 290, not 270.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, correction, heading two niner zero, not two seven zero.",
          expectedReadback: "Heading 290, G-ABCD.",
          expectedReadbackSpoken: "Heading two niner zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const hwlPriorityTopic: Topic = {
  id: "ao-workload.priority",
  name: "Aviate / Navigate / Communicate",
  description: "Keep control first and buy time on the radio when overloaded.",
  unit: "exercises",
  exercises: [
    lessonExercise(HWL, {
      id: "ao-workload.priority.lesson",
      title: "Aviate / Navigate / Communicate",
      description: "Priorities under pressure.",
      lessonBody:
        "Under pressure, keep aircraft control first, then navigate, then communicate. Say standby if you need a moment, or unable if workload prevents compliance. Avoid long explanations — short, honest phraseology keeps you and ATC safe.",
      points: [
        "Aviate first, then navigate, then communicate.",
        "Use standby to buy a moment.",
        "Use unable if workload prevents compliance.",
        "Avoid long explanations.",
      ],
      examples: [
        {
          label: "Buying time",
          atcText: "Standby, high workload, G-ABCD.",
          atcSpoken: "Standby, high workload, Golf Alfa Bravo Charlie Delta.",
          readback: "Standby, high workload, G-ABCD.",
        },
        {
          label: "Declining when overloaded",
          atcText: "Unable due workload, G-ABCD.",
          atcSpoken: "Unable due workload, Golf Alfa Bravo Charlie Delta.",
          readback: "Unable due workload, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HWL, {
      id: "ao-workload.priority.choose-priority",
      title: "Choose priority",
      description: "Pick the correct priority under pressure.",
      screenKicker: "Choice",
      instruction: "You receive a complex instruction while handling an aircraft control issue.",
      question: "What is the correct priority?",
      options: [
        { id: "cp-aviate", text: "Aviate first, then communicate when able.", feedback: "Correct. Fly the aircraft first; the readback can wait a moment." },
        { id: "cp-readback", text: "Read back everything before flying the aircraft", feedback: "No — never prioritise the radio over aircraft control." },
        { id: "cp-ignore", text: "Ignore ATC permanently", feedback: "No — you communicate when able, not never." },
        { id: "cp-freq", text: "Change frequency immediately", feedback: "No — changing frequency adds workload and loses ATC." },
      ],
      correctId: "cp-aviate",
    }),
    choiceExercise(HWL, {
      id: "ao-workload.priority.best-response",
      title: "Best radio response under pressure",
      description: "Pick the best response when overloaded.",
      screenKicker: "Choice",
      instruction: "You cannot process the instruction right now because of workload.",
      question: "What is the best radio response?",
      options: [
        { id: "br-standby", text: "Standby, high workload, G-ABCD.", feedback: "Correct. It honestly buys you a moment without accepting anything unsafe." },
        { id: "br-wilco", text: "Wilco, G-ABCD.", feedback: "No — Wilco means \"will comply\"; accepting when you cannot safely process the instruction hides the problem." },
        { id: "br-unable", text: "Unable due workload, G-ABCD.", feedback: "Close — Unable is professional, but it permanently declines the instruction. Standby keeps the option open while you manage the load." },
        { id: "br-confirm", text: "Confirm instruction, G-ABCD.", feedback: "No — asking to confirm an instruction you did not process adds workload; say standby first, then clarify when ready." },
      ],
      correctId: "br-standby",
    }),
    choiceExercise(HWL, {
      id: "ao-workload.priority.overloaded",
      title: "Overloaded response detection",
      description: "Spot the unsafe acceptance under workload.",
      screenKicker: "Error detection",
      instruction: "High workload, you cannot process the full instruction. Check the response.",
      question: "What is wrong?",
      shownReadback: "Wilco, G-ABCD.",
      shownReadbackLabel: "Pilot response",
      options: [
        { id: "ov-accept", text: "The pilot accepts without understanding or being able to comply.", feedback: "Correct. Wilco means \"will comply\" — say standby or unable instead when overloaded." },
        { id: "ov-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is accepting when overloaded." },
        { id: "ov-word", text: 'The word "Wilco" is mispronounced.', feedback: "Pronunciation is not the issue; accepting when you cannot comply is." },
        { id: "ov-none", text: "Nothing is wrong.", feedback: "Wilco accepts an instruction the pilot cannot yet comply with." },
      ],
      correctId: "ov-accept",
    }),
    readbackExercise(HWL, {
      id: "ao-workload.priority.trainer",
      title: "Priority trainer",
      description: "Buy time safely under workload.",
      headerInstruction: "You cannot safely process the instruction yet due workload. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-workload.priority.trainer.r1",
          atcText: "You cannot process the instruction yet due workload.",
          atcSpoken: "Standby, high workload, Golf Alfa Bravo Charlie Delta.",
          expectedReadback: "Standby, high workload, G-ABCD.",
          expectedReadbackSpoken: "Standby, high workload, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const hwlConflictTopic: Topic = {
  id: "ao-workload.conflict",
  name: "Conflicting Instructions",
  description: "Confirm an unclear or conflicting instruction instead of guessing.",
  unit: "exercises",
  exercises: [
    lessonExercise(HWL, {
      id: "ao-workload.conflict.lesson",
      title: "Conflicting Instructions",
      description: "How to handle a conflicting or unclear instruction.",
      lessonBody:
        "If an instruction seems to conflict with a previous one, or is unclear, confirm it — do not guess. A short confirmation phrase removes the doubt quickly without adding workload for either you or the controller.",
      points: [
        "If an instruction conflicts or is unclear, confirm it.",
        "Do not guess a safety-critical instruction.",
        "Use short confirmation phraseology.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Confirmation",
          atcText: "Confirm heading 270 and maintain 3000 feet, G-ABCD.",
          atcSpoken: "Confirm heading two seven zero and maintain three thousand feet, Golf Alfa Bravo Charlie Delta.",
          readback: "Confirm heading 270 and maintain 3000 feet, G-ABCD.",
        },
      ],
    }),
    choiceExercise(HWL, {
      id: "ao-workload.conflict.detect",
      title: "Detect conflict",
      description: "Decide what to do with a conflicting instruction.",
      screenKicker: "Choice",
      instruction: "ATC gives a heading that conflicts with a previous immediate turn instruction.",
      question: "What should you do?",
      options: [
        { id: "dc-confirm", text: "Ask for confirmation", feedback: "Correct. Resolve the conflict by confirming, not by guessing." },
        { id: "dc-guess", text: "Guess the instruction", feedback: "No — guessing a safety-critical instruction is unsafe." },
        { id: "dc-ignore", text: "Ignore both instructions", feedback: "No — ignoring ATC is unsafe; confirm what is intended." },
        { id: "dc-ground", text: "Change to Ground", feedback: "No — changing frequency does not resolve the conflict." },
      ],
      correctId: "dc-confirm",
    }),
    chipExercise(HWL, {
      id: "ao-workload.conflict.build",
      title: "Build the clarification call",
      description: "Order the parts of the clarification call.",
      screenKicker: "Listening",
      headerInstruction: "Build the clarification call.",
      atcText: "Confirm heading 270 and maintain 3000 feet, G-ABCD.",
      atcSpoken: "Confirm heading two seven zero and maintain three thousand feet, Golf Alfa Bravo Charlie Delta.",
      prompt: "Order the call.",
      expected: [
        { id: "cb-confirm", text: "Confirm heading 270" },
        { id: "cb-and", text: "and maintain 3000 feet" },
        { id: "cb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cb-d-hdg", text: "Confirm heading 290" },
        { id: "cb-d-alt", text: "and maintain 2000 feet" },
      ],
      expectedSentence: "Confirm heading 270 and maintain 3000 feet, G-ABCD.",
      expectedSpoken: "Confirm heading two seven zero and maintain three thousand feet, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Confirm both items and add your callsign.",
      incorrectFeedback: "Order: confirm heading 270 · and maintain 3000 feet · callsign.",
    }),
    choiceExercise(HWL, {
      id: "ao-workload.conflict.unsafe-acceptance",
      title: "Unsafe acceptance detection",
      description: "Spot the acceptance of a contradictory instruction.",
      screenKicker: "Error detection",
      instruction: "The instruction appears contradictory. Check the response.",
      question: "What is wrong?",
      shownReadback: "Wilco, G-ABCD.",
      shownReadbackLabel: "Pilot response",
      options: [
        { id: "ua-accept", text: "The pilot accepts without clarifying.", feedback: "Correct. A contradictory instruction must be confirmed, not accepted with Wilco." },
        { id: "ua-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is accepting without clarifying." },
        { id: "ua-word", text: "The word 'Wilco' is too informal.", feedback: "Formality is not the issue; the instruction should be confirmed first." },
        { id: "ua-none", text: "Nothing is wrong.", feedback: "A contradictory instruction needs confirmation before acceptance." },
      ],
      correctId: "ua-accept",
    }),
    readbackExercise(HWL, {
      id: "ao-workload.conflict.trainer",
      title: "Clarification trainer",
      description: "Confirm the conflicting instruction.",
      headerInstruction: "The instruction is unclear. Confirm the heading and altitude.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-workload.conflict.trainer.r1",
          atcText: "The instruction is unclear. Confirm heading 270 and maintain 3000 feet.",
          atcSpoken: "Confirm heading two seven zero and maintain three thousand feet, Golf Alfa Bravo Charlie Delta.",
          expectedReadback: "Confirm heading 270 and maintain 3000 feet, G-ABCD.",
          expectedReadbackSpoken: "Confirm heading two seven zero and maintain three thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const hwlScenarioTopic: Topic = {
  id: "ao-workload.scenario",
  name: "High Workload Scenario",
  description: "Handle stacked instructions, a correction and an overload.",
  unit: "scenario",
  exercises: [
    scenarioExercise(HWL, {
      id: "ao-workload.scenario.mission",
      title: "Working a busy sector",
      description: "Read back a stacked instruction, handle a correction and buy time when overloaded.",
      instruction:
        "A busy sector. Read back the stacked instruction, read back the correction, then say standby when the workload is too high.",
      heading: "Working a busy sector",
      completionNote:
        "You handled the workload without accepting unsafe or unclear instructions.",
      steps: HIGH_WORKLOAD_SCENARIO_STEPS,
    }),
  ],
};

const hwlTopics: Topic[] = [
  hwlMultipleTopic,
  hwlRapidTopic,
  hwlPriorityTopic,
  hwlConflictTopic,
  hwlScenarioTopic,
];

const highWorkload: Module = {
  id: "ao-workload",
  name: "High Workload Operations",
  subtitle: "Manage stacked instructions, fast changes and overload safely.",
  unit: "topics",
  topics: hwlTopics,
  exercises: hwlTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 6 — Difficult Radio & Accents                               */
/* ================================================================== */

const DRA: StudentPilotPhase = "difficult-radio";

const draFastTopic: Topic = {
  id: "ao-difficult-radio.fast",
  name: "Fast Transmission",
  description: "Extract the key items from a fast transmission and read them back.",
  unit: "exercises",
  exercises: [
    lessonExercise(DRA, {
      id: "ao-difficult-radio.fast.lesson",
      title: "Fast Transmission",
      description: "How to handle a fast transmission.",
      lessonBody:
        "Fast transmissions are common on busy frequencies. Do not panic — extract the key items, read back only what you correctly understood, and ask for a specific repeat if you missed something. Accuracy beats speed.",
      points: [
        "Extract the key items from the fast call.",
        "Do not panic.",
        "Read back only what you correctly understood.",
        "Ask for a specific repeat if needed.",
      ],
      examples: [
        {
          label: "Fast transmission",
          atcText: "G-ABCD, turn left heading 270, descend 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet.",
          readback: "Left heading 270, descend 3000 feet, G-ABCD.",
        },
      ],
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.fast.extract",
      title: "Extract the key item",
      description: "Pull the heading out of a fast call.",
      screenKicker: "Choice",
      instruction: "Listen to the fast transmission.",
      question: "What heading was assigned?",
      atcDisplay: "G-ABCD, turn left heading 270, descend 3000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet.",
      atcHidden: true,
      options: [
        { id: "ex-270", text: "270", feedback: "Correct. Turn left heading 270." },
        { id: "ex-290", text: "290", feedback: "No — the heading was two seven zero, not two niner zero." },
        { id: "ex-170", text: "170", feedback: "No — the heading was two seven zero, not one seven zero." },
        { id: "ex-3000", text: "3000", feedback: "No — 3000 is the altitude, not the heading." },
      ],
      correctId: "ex-270",
    }),
    chipExercise(DRA, {
      id: "ao-difficult-radio.fast.build",
      title: "Build readback from fast call",
      description: "Order the parts of the readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback from the fast call.",
      atcText: "G-ABCD, turn left heading 270, descend 3000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet.",
      prompt: "Build the readback.",
      expected: [
        { id: "fb-hdg", text: "Left heading 270" },
        { id: "fb-alt", text: "descend 3000 feet" },
        { id: "fb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "fb-d-hdg", text: "Left heading 290" },
        { id: "fb-d-alt", text: "descend 2000 feet" },
      ],
      expectedSentence: "Left heading 270, descend 3000 feet, G-ABCD.",
      expectedSpoken: "Left heading two seven zero, descend three thousand feet, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Heading, altitude and callsign.",
      incorrectFeedback: "Order: left heading 270 · descend 3000 feet · callsign.",
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.fast.wrong-item",
      title: "Wrong extracted item detection",
      description: "Spot the wrong heading extracted from the fast call.",
      screenKicker: "Error detection",
      instruction: "ATC said left heading 270, descend 3000 feet. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "Left heading 270, descend 3000 feet.",
      atcSpoken: "Left heading two seven zero, descend three thousand feet.",
      shownReadback: "Left heading 290, descend 3000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wi-hdg", text: "Wrong heading extracted. ATC said 270.", feedback: "Correct. The pilot heard 290 instead of 270 in the fast call." },
        { id: "wi-alt", text: "The altitude is wrong.", feedback: "3000 feet matches. The heading was misheard." },
        { id: "wi-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The heading was misheard." },
        { id: "wi-none", text: "Nothing is wrong.", feedback: "ATC said 270, not 290." },
      ],
      correctId: "wi-hdg",
    }),
    readbackExercise(DRA, {
      id: "ao-difficult-radio.fast.trainer",
      title: "Fast transmission trainer",
      description: "Read back the fast instruction.",
      headerInstruction: "Read back the fast instruction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-difficult-radio.fast.trainer.r1",
          atcText: "G-ABCD, turn left heading 270, descend 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet.",
          expectedReadback: "Left heading 270, descend 3000 feet, G-ABCD.",
          expectedReadbackSpoken: "Left heading two seven zero, descend three thousand feet, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const draBrokenTopic: Topic = {
  id: "ao-difficult-radio.broken",
  name: "Noisy / Broken Transmission",
  description: "Ask for a specific item again instead of guessing.",
  unit: "exercises",
  exercises: [
    lessonExercise(DRA, {
      id: "ao-difficult-radio.broken.lesson",
      title: "Noisy / Broken Transmission",
      description: "How to handle a broken transmission.",
      lessonBody:
        "When noise blocks part of a transmission, do not guess a safety-critical item. Ask for the specific item again — \"say again heading\", \"say again altitude\". A targeted request is faster and safer than a full repeat or a guess.",
      points: [
        "Do not guess unclear safety-critical items.",
        "Ask for the specific item again.",
        'Use "say again heading", "say again altitude".',
        "A targeted request is faster than a full repeat.",
      ],
      examples: [
        {
          label: "Targeted say again",
          atcText: "Say again heading, G-ABCD.",
          atcSpoken: "Say again heading, Golf Alfa Bravo Charlie Delta.",
          readback: "Say again heading, G-ABCD.",
        },
      ],
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.broken.understood",
      title: "What did you understand?",
      description: "Decide what to do when the heading was blocked.",
      screenKicker: "Choice",
      instruction: "You heard the callsign and altitude, but the heading was blocked by noise.",
      question: "What should you do?",
      options: [
        { id: "wu-again", text: "Ask again for the heading", feedback: "Correct. Request the specific item that was blocked — the heading." },
        { id: "wu-guess", text: "Guess the heading", feedback: "No — never guess a safety-critical item." },
        { id: "wu-ignore", text: "Ignore the instruction", feedback: "No — ignoring it leaves you uncleared; ask again." },
        { id: "wu-random", text: "Read back a random heading", feedback: "No — reading back a guess is unsafe and misleading." },
      ],
      correctId: "wu-again",
    }),
    chipExercise(DRA, {
      id: "ao-difficult-radio.broken.build",
      title: "Request repetition properly",
      description: "Order the parts of the say-again call.",
      screenKicker: "Listening",
      headerInstruction: "Build the say-again call for the blocked item.",
      atcText: "Say again heading, G-ABCD.",
      atcSpoken: "Say again heading, Golf Alfa Bravo Charlie Delta.",
      prompt: "Order the call.",
      expected: [
        { id: "bb-say", text: "Say again heading" },
        { id: "bb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bb-d-repeat", text: "Repeat heading" },
        { id: "bb-d-alt", text: "Say again altitude" },
      ],
      expectedSentence: "Say again heading, G-ABCD.",
      expectedSpoken: "Say again heading, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Say again the specific item, with your callsign.",
      incorrectFeedback: "Use \"say again heading\" — not \"repeat\".",
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.broken.guessing",
      title: "Guessing detection",
      description: "Spot the guessed safety-critical item.",
      screenKicker: "Error detection",
      instruction: "The heading was unreadable due to noise. Check the response.",
      question: "What is wrong?",
      shownReadback: "Heading 270, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "gd-guess", text: "The pilot guessed a safety-critical item.", feedback: "Correct. The heading was unreadable; the pilot should say again, not read back a guess." },
        { id: "gd-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is guessing the heading." },
        { id: "gd-word", text: "The word 'heading' is wrong.", feedback: '"Heading" is fine; the issue is guessing the value.' },
        { id: "gd-none", text: "Nothing is wrong.", feedback: "The heading was unreadable, so reading back a value is a guess." },
      ],
      correctId: "gd-guess",
    }),
    readbackExercise(DRA, {
      id: "ao-difficult-radio.broken.trainer",
      title: "Broken transmission trainer",
      description: "Ask for the blocked heading again.",
      headerInstruction: "You did not understand the assigned heading. Make the say-again call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-difficult-radio.broken.trainer.r1",
          atcText: "The heading was blocked by noise.",
          atcSpoken: "Say again heading, Golf Alfa Bravo Charlie Delta.",
          expectedReadback: "Say again heading, G-ABCD.",
          expectedReadbackSpoken: "Say again heading, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const draAccentTopic: Topic = {
  id: "ao-difficult-radio.accent",
  name: "Accent Variation",
  description: "Focus on the structured key items through accent variation.",
  unit: "exercises",
  exercises: [
    lessonExercise(DRA, {
      id: "ao-difficult-radio.accent.lesson",
      title: "Accent Variation",
      description: "How to work through accent variation.",
      lessonBody:
        "Accents change how words sound, but the structure of a clearance stays the same. Focus on the key items — callsign, runway, heading, altitude, flight level — and ask again if you are unsure. Do not let an unfamiliar accent push you into guessing.",
      points: [
        "Accents change sound, not structure.",
        "Focus on callsign, runway, heading, altitude, level.",
        "Ask again if unsure.",
        "Do not guess to avoid asking.",
      ],
      examples: [
        {
          label: "Through an accent",
          atcText: "G-ABCD, descend FL120.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
          readback: "Descend FL120, G-ABCD.",
        },
      ],
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.accent.identify",
      title: "Identify the flight level",
      description: "Extract the level through the accent.",
      screenKicker: "Choice",
      instruction: "Listen carefully to the instruction.",
      question: "What were you assigned?",
      atcDisplay: "G-ABCD, descend FL120.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
      atcHidden: true,
      options: [
        { id: "ai-fl120", text: "FL120", feedback: "Correct. Descend flight level one two zero." },
        { id: "ai-fl100", text: "FL100", feedback: "No — the level was one two zero, not one zero zero." },
        { id: "ai-hdg120", text: "Heading 120", feedback: "No — this is a flight level, not a heading." },
        { id: "ai-rwy12", text: "Runway 12", feedback: "No — this is a flight level, not a runway." },
      ],
      correctId: "ai-fl120",
    }),
    chipExercise(DRA, {
      id: "ao-difficult-radio.accent.build",
      title: "Build correct readback",
      description: "Order the parts of the readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the readback.",
      atcText: "G-ABCD, descend FL120.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
      prompt: "Build the readback.",
      expected: [
        { id: "ab-desc", text: "Descend FL120" },
        { id: "ab-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ab-d-fl", text: "Descend FL100" },
        { id: "ab-d-climb", text: "Climb FL120" },
      ],
      expectedSentence: "Descend FL120, G-ABCD.",
      expectedSpoken: "Descend flight level one two zero, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Descend, flight level and callsign.",
      incorrectFeedback: "Read back: descend FL120 · callsign.",
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.accent.similar-sound",
      title: "Similar sound trap",
      description: "Spot the similar-sounding wrong flight level.",
      screenKicker: "Error detection",
      instruction: "ATC said descend FL120. Check the readback.",
      question: "What is wrong?",
      atcDisplay: "Descend FL120.",
      atcSpoken: "Descend flight level one two zero.",
      shownReadback: "Descend FL100, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ss-fl", text: "Similar sounding but wrong flight level. ATC said FL120.", feedback: "Correct. FL100 and FL120 sound alike; ATC said one two zero." },
        { id: "ss-dir", text: "It should be climb, not descend.", feedback: "Descend matches. The flight level is wrong." },
        { id: "ss-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The flight level is wrong." },
        { id: "ss-none", text: "Nothing is wrong.", feedback: "ATC said FL120, not FL100." },
      ],
      correctId: "ss-fl",
    }),
    readbackExercise(DRA, {
      id: "ao-difficult-radio.accent.trainer",
      title: "Accent comprehension trainer",
      description: "Read back the level through the accent.",
      headerInstruction: "Read back the instruction issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-difficult-radio.accent.trainer.r1",
          atcText: "G-ABCD, descend FL120.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, descend flight level one two zero.",
          expectedReadback: "Descend FL120, G-ABCD.",
          expectedReadbackSpoken: "Descend flight level one two zero, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const draCallsignTopic: Topic = {
  id: "ao-difficult-radio.callsign",
  name: "Similar Callsigns",
  description: "Respond only to your own callsign, not a similar one.",
  unit: "exercises",
  exercises: [
    lessonExercise(DRA, {
      id: "ao-difficult-radio.callsign.lesson",
      title: "Similar Callsigns",
      description: "How to avoid taking another aircraft's instruction.",
      lessonBody:
        "Similar callsigns on the frequency are a real hazard. Listen for your full callsign before acting, and do not respond to an instruction addressed to another aircraft. If you are unsure whether a call was for you, confirm before acting.",
      points: [
        "Do not respond to another aircraft's call.",
        "Listen for your full callsign.",
        "If unsure, confirm before acting.",
        "Your callsign is G-ABCD — G-ABCE is someone else.",
      ],
      examples: [
        {
          label: "Not your callsign",
          atcText: "G-ABCE, descend 3000 feet.",
          atcSpoken: "Golf Alfa Bravo Charlie Echo, descend three thousand feet.",
          readback: "Not for G-ABCD — do not respond.",
        },
      ],
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.callsign.was-it-for-you",
      title: "Was it for you?",
      description: "Decide whether the call was for you.",
      screenKicker: "Choice",
      instruction: "Your callsign is G-ABCD.",
      question: "Was this call for you?",
      atcDisplay: "G-ABCE, descend 3000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Echo, descend three thousand feet.",
      atcHidden: true,
      options: [
        { id: "wf-no", text: "No, it was for G-ABCE.", feedback: "Correct. The call addressed G-ABCE, not your G-ABCD." },
        { id: "wf-yes", text: "Yes, respond immediately", feedback: "No — that call was for G-ABCE, a different aircraft." },
        { id: "wf-all", text: "It was for all aircraft", feedback: "No — it named a specific callsign, G-ABCE." },
        { id: "wf-weather", text: "It was a weather report", feedback: "No — it was a descent instruction for G-ABCE." },
      ],
      correctId: "wf-no",
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.callsign.identify",
      title: "Identify addressed callsign",
      description: "Pick the addressed callsign.",
      screenKicker: "Choice",
      instruction: "Listen to the call.",
      question: "Which callsign was addressed?",
      atcDisplay: "G-ABCD, turn left heading 270.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero.",
      atcHidden: true,
      options: [
        { id: "id-abcd", text: "G-ABCD", feedback: "Correct. The call addressed G-ABCD — that is you." },
        { id: "id-abce", text: "G-ABCE", feedback: "No — the call said Golf Alfa Bravo Charlie Delta." },
        { id: "id-abdc", text: "G-ABDC", feedback: "No — the call said Golf Alfa Bravo Charlie Delta." },
        { id: "id-abdd", text: "G-ABDD", feedback: "No — the call said Golf Alfa Bravo Charlie Delta." },
      ],
      correctId: "id-abcd",
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.callsign.wrong-response",
      title: "Wrong callsign response detection",
      description: "Spot the response to the wrong callsign.",
      screenKicker: "Error detection",
      instruction: "Your callsign is G-ABCD. ATC called G-ABCE. Check the response.",
      question: "What is wrong?",
      atcDisplay: "G-ABCE, climb 4000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Echo, climb four thousand feet.",
      shownReadback: "Climb 4000 feet, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wr-resp", text: "The pilot responded to the wrong callsign.", feedback: "Correct. The instruction was for G-ABCE; G-ABCD should not respond." },
        { id: "wr-alt", text: "The altitude is wrong.", feedback: "The altitude matches the call, but the call was not for you." },
        { id: "wr-word", text: "The word 'climb' is wrong.", feedback: '"Climb" matches; the problem is the call was for G-ABCE.' },
        { id: "wr-none", text: "Nothing is wrong.", feedback: "G-ABCD took an instruction addressed to G-ABCE." },
      ],
      correctId: "wr-resp",
    }),
    choiceExercise(DRA, {
      id: "ao-difficult-radio.callsign.discrimination",
      title: "Callsign discrimination",
      description: "Decide whether to respond.",
      screenKicker: "Choice",
      instruction: "Your callsign is G-ABCD. ATC calls G-ABCE.",
      question: "What is the correct action?",
      atcDisplay: "G-ABCE, climb 4000 feet.",
      atcSpoken: "Golf Alfa Bravo Charlie Echo, climb four thousand feet.",
      atcHidden: true,
      options: [
        { id: "cd-no", text: "Do not respond unless ATC calls G-ABCD.", feedback: "Correct. Only act on calls addressed to your own callsign." },
        { id: "cd-respond", text: "Respond as G-ABCD and comply.", feedback: "No — that instruction was for G-ABCE." },
        { id: "cd-climb", text: "Climb anyway to be safe.", feedback: "No — climbing on another aircraft's clearance is unsafe." },
        { id: "cd-confirm-all", text: "Ask ATC to confirm every call from now on.", feedback: "No — simply act only on your own callsign; confirm only if genuinely unsure." },
      ],
      correctId: "cd-no",
    }),
  ],
};

const draScenarioTopic: Topic = {
  id: "ao-difficult-radio.scenario",
  name: "Difficult Radio Scenario",
  description: "Read back, ask again for a blocked item and ignore another callsign.",
  unit: "scenario",
  exercises: [
    scenarioExercise(DRA, {
      id: "ao-difficult-radio.scenario.mission",
      title: "Working a difficult frequency",
      description: "Read back an instruction, ask again for a blocked heading and avoid responding to a similar callsign.",
      instruction:
        "The frequency is busy and the signal is poor. Read back the instruction, ask again for the blocked heading, then recognise the last call was not for you.",
      heading: "Working a difficult frequency",
      completionNote:
        "You avoided guessing and did not respond to the wrong callsign.",
      steps: DIFFICULT_RADIO_SCENARIO_STEPS,
    }),
  ],
};

const draTopics: Topic[] = [
  draFastTopic,
  draBrokenTopic,
  draAccentTopic,
  draCallsignTopic,
  draScenarioTopic,
];

const difficultRadio: Module = {
  id: "ao-difficult-radio",
  name: "Difficult Radio & Accents",
  subtitle: "Decide and read back accurately when the radio is imperfect.",
  unit: "topics",
  topics: draTopics,
  exercises: draTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* MODULE 7 — Unexpected Events                                       */
/* ================================================================== */

const UNX: StudentPilotPhase = "unexpected-event";

const unxRunwayTopic: Topic = {
  id: "ao-unexpected.runway",
  name: "Runway Closure / Unavailable",
  description: "Acknowledge a runway becoming unavailable and stop the old plan.",
  unit: "exercises",
  exercises: [
    lessonExercise(UNX, {
      id: "ao-unexpected.runway.lesson",
      title: "Runway Closure / Unavailable",
      description: "How to react when the runway becomes unavailable.",
      lessonBody:
        "A runway becoming unavailable changes your plan immediately. Acknowledge it and wait for or request new instructions. Do not continue as previously cleared — the approach or landing you were set up for is no longer valid.",
      points: [
        "An unavailable runway changes the plan.",
        "Acknowledge and wait for or request instructions.",
        "Do not continue as previously cleared.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Runway unavailable",
          atcText: "G-ABCD, runway 27 unavailable, expect holding.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven unavailable, expect holding.",
          readback: "Runway 27 unavailable, expect holding, G-ABCD.",
        },
      ],
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.runway.understand",
      title: "Understand runway unavailable",
      description: "Interpret the runway status.",
      screenKicker: "Choice",
      instruction: "ATC transmits a runway status change.",
      question: "What does this mean?",
      atcDisplay: "Runway 27 unavailable.",
      atcSpoken: "Runway two seven unavailable.",
      atcHidden: true,
      options: [
        { id: "un-plan", text: "The previous runway plan is no longer available.", feedback: "Correct. Runway 27 is out; expect new instructions and do not continue as set." },
        { id: "un-land", text: "You are cleared to land", feedback: "No — the runway is unavailable, the opposite of a landing clearance." },
        { id: "un-takeoff", text: "You are cleared for takeoff", feedback: "No — the runway is unavailable; nothing is cleared." },
        { id: "un-parking", text: "Parking is complete", feedback: "No — this is about the runway, not parking." },
      ],
      correctId: "un-plan",
    }),
    chipExercise(UNX, {
      id: "ao-unexpected.runway.build",
      title: "Build the acknowledgement",
      description: "Order the parts of the acknowledgement.",
      screenKicker: "Listening",
      headerInstruction: "Build the acknowledgement.",
      atcText: "G-ABCD, runway 27 unavailable.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven unavailable.",
      prompt: "Build the readback.",
      expected: [
        { id: "rb-rwy", text: "Runway 27 unavailable" },
        { id: "rb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rb-d-rwy", text: "Runway 36 unavailable" },
        { id: "rb-d-land", text: "Cleared to land runway 27" },
      ],
      expectedSentence: "Runway 27 unavailable, G-ABCD.",
      expectedSpoken: "Runway two seven unavailable, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Acknowledge the runway status with your callsign.",
      incorrectFeedback: "Read back: runway 27 unavailable · callsign.",
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.runway.unsafe-continuation",
      title: "Unsafe continuation detection",
      description: "Spot the unsafe continuation after runway unavailable.",
      screenKicker: "Error detection",
      instruction: "ATC said runway 27 is unavailable. Check the response.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, runway 27 unavailable.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven unavailable.",
      shownReadback: "Continuing approach runway 27, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "uc-continue", text: "Unsafe continuation after runway unavailable.", feedback: "Correct. The runway is out; continuing the approach to it is unsafe." },
        { id: "uc-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is continuing to an unavailable runway." },
        { id: "uc-rwy", text: "The runway number is wrong.", feedback: "The number matches; the problem is continuing despite it being unavailable." },
        { id: "uc-none", text: "Nothing is wrong.", feedback: "You cannot continue the approach to an unavailable runway." },
      ],
      correctId: "uc-continue",
    }),
    readbackExercise(UNX, {
      id: "ao-unexpected.runway.trainer",
      title: "Runway unavailable trainer",
      description: "Read back the runway status and holding.",
      headerInstruction: "Read back the runway status issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-unexpected.runway.trainer.r1",
          atcText: "G-ABCD, runway 27 unavailable, expect holding.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, runway two seven unavailable, expect holding.",
          expectedReadback: "Runway 27 unavailable, expect holding, G-ABCD.",
          expectedReadbackSpoken: "Runway two seven unavailable, expect holding, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const unxUnstableTopic: Topic = {
  id: "ao-unexpected.unstable",
  name: "Approach Unstable / Unable Continue",
  description: "Say unable to continue and request vectors instead of forcing it.",
  unit: "exercises",
  exercises: [
    lessonExercise(UNX, {
      id: "ao-unexpected.unstable.lesson",
      title: "Approach Unstable / Unable Continue",
      description: "How to break off an approach you cannot continue.",
      lessonBody:
        "If you cannot continue the approach safely, say so and request what you need — vectors, a missed approach, or instructions. Do not force a continuation. Breaking off early and asking for help is the safe, professional choice.",
      points: [
        "If unable to continue safely, say unable.",
        "Request vectors, a missed approach or instructions.",
        "Do not force a continuation.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "Unable to continue",
          atcText: "G-ABCD, unable to continue approach, request vectors.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, unable to continue approach, request vectors.",
          readback: "G-ABCD, unable to continue approach, request vectors.",
        },
      ],
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.unstable.build-declare",
      title: "Safest action when approach is unstable",
      description: "Decide the safest radio action when you cannot continue.",
      screenKicker: "Choice",
      instruction: "The approach is unstable and continuing would be unsafe.",
      question: "What is the safest radio action?",
      options: [
        { id: "sa-unable", text: "Advise unable to continue and request vectors or instructions.", feedback: "Correct. Declare unable, stop the approach and ask ATC for vectors or an alternative." },
        { id: "sa-continue", text: "Continue approach without advising ATC.", feedback: "No — continuing an unstable approach without advising ATC is unsafe; say unable and request help." },
        { id: "sa-land", text: "Assume landing clearance is still valid and continue.", feedback: "No — a landing clearance does not oblige you to land if the approach is unsafe; say unable." },
        { id: "sa-freq", text: "Switch frequency without instruction to find alternative guidance.", feedback: "No — do not change frequency without instruction; advise ATC on the current frequency first." },
      ],
      correctId: "sa-unable",
    }),
    chipExercise(UNX, {
      id: "ao-unexpected.unstable.build-call",
      title: "Build the call",
      description: "Order an unable-to-continue call ending with the callsign.",
      screenKicker: "Listening",
      headerInstruction: "Build the call with the callsign last.",
      atcText: "Unable to continue approach, request vectors, G-ABCD.",
      atcSpoken: "Unable to continue approach, request vectors, Golf Alfa Bravo Charlie Delta.",
      prompt: "Order the call.",
      expected: [
        { id: "bc-unable", text: "Unable to continue approach" },
        { id: "bc-req", text: "request vectors" },
        { id: "bc-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bc-d-cont", text: "Continuing approach" },
        { id: "bc-d-req", text: "request landing clearance" },
      ],
      expectedSentence: "Unable to continue approach, request vectors, G-ABCD.",
      expectedSpoken: "Unable to continue approach, request vectors, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Unable to continue, the request and your callsign.",
      incorrectFeedback: "Order: unable to continue approach · request vectors · callsign.",
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.unstable.wrong-intention",
      title: "Wrong intention detection",
      description: "Spot the forced continuation.",
      screenKicker: "Error detection",
      instruction: "The approach is unstable and you cannot continue. Check the response.",
      question: "What is wrong?",
      shownReadback: "Continuing approach, G-ABCD.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "wi-force", text: "The pilot continues despite being unable.", feedback: "Correct. An unstable approach should be broken off — say unable and request vectors." },
        { id: "wi-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is forcing the continuation." },
        { id: "wi-word", text: "The word 'approach' is wrong.", feedback: '"Approach" is fine; the issue is continuing an unstable one.' },
        { id: "wi-none", text: "Nothing is wrong.", feedback: "An unstable approach should not be continued." },
      ],
      correctId: "wi-force",
    }),
    readbackExercise(UNX, {
      id: "ao-unexpected.unstable.trainer",
      title: "Unable approach trainer",
      description: "Break off the approach and request vectors.",
      headerInstruction: "The approach is unstable and you need vectors. Make the call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-unexpected.unstable.trainer.r1",
          atcText: "The approach is unstable and you need vectors.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, unable to continue approach, request vectors.",
          expectedReadback: "G-ABCD, unable to continue approach, request vectors.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, unable to continue approach, request vectors.",
        },
      ],
    }),
  ],
};

const unxTechnicalTopic: Topic = {
  id: "ao-unexpected.technical",
  name: "Technical Caution",
  description: "Advise a non-critical technical issue and request a safe option.",
  unit: "exercises",
  exercises: [
    lessonExercise(UNX, {
      id: "ao-unexpected.technical.lesson",
      title: "Technical Caution",
      description: "How to handle a non-critical technical issue.",
      lessonBody:
        "Not every technical issue is a PAN or a MAYDAY. For a non-critical caution, describe the issue and request a safe option such as holding. Keep escalation in reserve — if the severity increases, you can upgrade to PAN PAN or MAYDAY.",
      points: [
        "Not every technical issue is PAN or MAYDAY.",
        "Describe the issue and request a safe option.",
        "Hold or delay can buy time to assess.",
        "Escalate if the severity increases.",
      ],
      examples: [
        {
          label: "Technical caution",
          atcText: "G-ABCD, technical caution, request holding.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, technical caution, request holding.",
          readback: "G-ABCD, technical caution, request holding.",
        },
      ],
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.technical.level",
      title: "Normal / PAN / MAYDAY?",
      description: "Choose the right level of response.",
      screenKicker: "Choice",
      instruction: "A non-critical technical caution appears. The aircraft remains stable.",
      question: "What is the right response?",
      options: [
        { id: "lv-advise", text: "Advise ATC and request a safe option", feedback: "Correct. A stable, non-critical caution warrants an advisory and a request, not a distress call." },
        { id: "lv-mayday", text: "Declare MAYDAY immediately", feedback: "No — MAYDAY is for grave, imminent danger, not a stable caution." },
        { id: "lv-ignore", text: "Ignore it", feedback: "No — advise ATC so they can help if it develops." },
        { id: "lv-parking", text: "Report parking complete", feedback: "No — that is unrelated to an airborne caution." },
      ],
      correctId: "lv-advise",
    }),
    chipExercise(UNX, {
      id: "ao-unexpected.technical.build",
      title: "Build the technical advisory",
      description: "Order the parts of the technical advisory.",
      screenKicker: "Listening",
      headerInstruction: "Build the technical advisory call.",
      atcText: "G-ABCD, technical caution, request holding.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, technical caution, request holding.",
      prompt: "Order the call.",
      expected: [
        { id: "tb-cs", text: "G-ABCD" },
        { id: "tb-caution", text: "technical caution" },
        { id: "tb-req", text: "request holding" },
      ],
      distractors: [
        { id: "tb-d-mayday", text: "MAYDAY, MAYDAY, MAYDAY" },
        { id: "tb-d-req", text: "request immediate landing" },
      ],
      expectedSentence: "G-ABCD, technical caution, request holding.",
      expectedSpoken: "Golf Alfa Bravo Charlie Delta, technical caution, request holding.",
      correctFeedback: "Correct. Callsign, the caution and a sensible request.",
      incorrectFeedback: "Order: callsign · technical caution · request holding.",
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.technical.over-declaration",
      title: "Over-declaration detection",
      description: "Spot the over-declaration for a minor caution.",
      screenKicker: "Error detection",
      instruction: "A minor caution appears, the aircraft is stable, no immediate danger. Check the call.",
      question: "What is wrong?",
      shownReadback: "MAYDAY, MAYDAY, MAYDAY, engine failure.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "od-over", text: "Over-declaration for the described situation.", feedback: "Correct. A stable, minor caution does not justify a MAYDAY — advise and request a safe option." },
        { id: "od-under", text: "It should be a stronger declaration.", feedback: "No — the situation is minor; MAYDAY over-declares it." },
        { id: "od-cs", text: "The callsign is missing.", feedback: "The bigger issue is over-declaring a minor caution as distress." },
        { id: "od-none", text: "Nothing is wrong.", feedback: "MAYDAY is far too strong for a stable, minor caution." },
      ],
      correctId: "od-over",
    }),
    readbackExercise(UNX, {
      id: "ao-unexpected.technical.trainer",
      title: "Technical caution trainer",
      description: "Advise the caution and request holding.",
      headerInstruction: "You have a stable technical caution. Advise ATC and request holding.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-unexpected.technical.trainer.r1",
          atcText: "A stable technical caution. Advise ATC and request holding.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, technical caution, request holding.",
          expectedReadback: "G-ABCD, technical caution, request holding.",
          expectedReadbackSpoken: "Golf Alfa Bravo Charlie Delta, technical caution, request holding.",
        },
      ],
    }),
  ],
};

const unxRerouteTopic: Topic = {
  id: "ao-unexpected.reroute",
  name: "ATC Reroute / Sudden Change",
  description: "Drop a cancelled clearance and read back the new routing.",
  unit: "exercises",
  exercises: [
    lessonExercise(UNX, {
      id: "ao-unexpected.reroute.lesson",
      title: "ATC Reroute / Sudden Change",
      description: "How to handle a cancelled clearance.",
      lessonBody:
        "An unexpected ATC change replaces your previous clearance. When ATC says \"cancel previous clearance\", identify the new route, hold or instruction and read it back. Do not continue the old clearance once it has been cancelled.",
      points: [
        '"Cancel previous clearance" replaces the old one.',
        "Identify the new route, hold or instruction.",
        "Read back the new clearance.",
        "Do not continue the cancelled clearance.",
      ],
      examples: [
        {
          label: "Sudden reroute",
          atcText: "G-ABCD, cancel previous clearance, route direct NARGO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cancel previous clearance, route direct NARGO.",
          readback: "Cancel previous clearance, direct NARGO, G-ABCD.",
        },
      ],
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.reroute.identify",
      title: "Identify sudden change",
      description: "Interpret the sudden reroute.",
      screenKicker: "Choice",
      instruction: "Listen to the sudden change.",
      question: "What does this mean?",
      atcDisplay: "Cancel previous clearance, route direct NARGO.",
      atcSpoken: "Cancel previous clearance, route direct NARGO.",
      atcHidden: true,
      options: [
        { id: "si-new", text: "Previous clearance cancelled; route direct NARGO", feedback: "Correct. Drop the old clearance and route direct NARGO." },
        { id: "si-continue", text: "Continue previous clearance", feedback: "No — the previous clearance was cancelled." },
        { id: "si-land", text: "Cleared to land", feedback: "No — this is a reroute, not a landing clearance." },
        { id: "si-ground", text: "Switch to Ground", feedback: "No — no frequency change was given; it is a reroute." },
      ],
      correctId: "si-new",
    }),
    chipExercise(UNX, {
      id: "ao-unexpected.reroute.build",
      title: "Build the reroute readback",
      description: "Order the parts of the reroute readback.",
      screenKicker: "Listening",
      headerInstruction: "Build the reroute readback.",
      atcText: "G-ABCD, cancel previous clearance, route direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cancel previous clearance, route direct NARGO.",
      prompt: "Build the readback.",
      helperText: "Cancel previous clearance · direct fix · callsign.",
      expected: [
        { id: "rb-cancel", text: "Cancel previous clearance" },
        { id: "rb-direct", text: "direct NARGO" },
        { id: "rb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rb-d-fix", text: "direct LAMSO" },
        { id: "rb-d-cont", text: "continue previous clearance" },
      ],
      expectedSentence: "Cancel previous clearance, direct NARGO, G-ABCD.",
      expectedSpoken: "Cancel previous clearance, direct NARGO, Golf Alfa Bravo Charlie Delta.",
      correctFeedback: "Correct. Cancel the old, route the new fix, with your callsign.",
      incorrectFeedback: "Order: cancel previous clearance · direct NARGO · callsign.",
    }),
    choiceExercise(UNX, {
      id: "ao-unexpected.reroute.old-trap",
      title: "Old clearance trap",
      description: "Spot the kept cancelled clearance.",
      screenKicker: "Error detection",
      instruction: "ATC cancelled the previous clearance and routed direct NARGO. Check the response.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, cancel previous clearance, route direct NARGO.",
      atcSpoken: "Golf Alfa Bravo Charlie Delta, cancel previous clearance, route direct NARGO.",
      shownReadback: "Continuing previous clearance, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ot-keep", text: "The pilot keeps the cancelled clearance.", feedback: "Correct. The previous clearance was cancelled; the pilot must route direct NARGO." },
        { id: "ot-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The problem is keeping the cancelled clearance." },
        { id: "ot-word", text: "The word 'previous' is wrong.", feedback: '"Previous" is fine; the issue is continuing the cancelled clearance.' },
        { id: "ot-none", text: "Nothing is wrong.", feedback: "The previous clearance was cancelled; it cannot be continued." },
      ],
      correctId: "ot-keep",
    }),
    readbackExercise(UNX, {
      id: "ao-unexpected.reroute.trainer",
      title: "Sudden change trainer",
      description: "Read back the cancelled clearance and new routing.",
      headerInstruction: "Read back the sudden reroute issued by ATC.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "ao-unexpected.reroute.trainer.r1",
          atcText: "G-ABCD, cancel previous clearance, route direct NARGO.",
          atcSpoken: "Golf Alfa Bravo Charlie Delta, cancel previous clearance, route direct NARGO.",
          expectedReadback: "Cancel previous clearance, direct NARGO, G-ABCD.",
          expectedReadbackSpoken: "Cancel previous clearance, direct NARGO, Golf Alfa Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

const unxScenarioTopic: Topic = {
  id: "ao-unexpected.scenario",
  name: "Unexpected Event Scenario",
  description: "Handle a runway closure, a cancelled clearance and a technical caution.",
  unit: "scenario",
  exercises: [
    scenarioExercise(UNX, {
      id: "ao-unexpected.scenario.mission",
      title: "Handling the unexpected",
      description: "Read back a runway closure, a cancelled clearance, then advise a caution and read back the hold.",
      instruction:
        "Your plan changes without warning. Read back the runway closure, the cancelled clearance, then advise a technical caution and read back the hold.",
      heading: "Handling the unexpected",
      completionNote:
        "You managed an unexpected operational change without continuing an unsafe or cancelled plan.",
      steps: UNEXPECTED_EVENT_SCENARIO_STEPS,
    }),
  ],
};

const unxTopics: Topic[] = [
  unxRunwayTopic,
  unxUnstableTopic,
  unxTechnicalTopic,
  unxRerouteTopic,
  unxScenarioTopic,
];

const unexpectedEvents: Module = {
  id: "ao-unexpected",
  name: "Unexpected Events",
  subtitle: "React to runway closures, cancelled clearances and sudden changes.",
  unit: "topics",
  topics: unxTopics,
  exercises: unxTopics.flatMap((t) => t.exercises),
};

/* ================================================================== */
/* EXPORTS                                                            */
/* ================================================================== */

export const ADVANCED_OPS_MODULES: Module[] = [
  weatherDeviations,
  diversions,
  panPan,
  mayday,
  highWorkload,
  difficultRadio,
  unexpectedEvents,
];

export const ADVANCED_OPS_SECTIONS: Section[] = [
  { title: "Abnormal & Emergency Operations", modules: ADVANCED_OPS_MODULES },
];
