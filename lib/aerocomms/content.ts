// AeroComms content catalog — Level -> Module -> Exercise
// Encodes the curriculum from the Master Decisions file. Mock/static data only.

import { CADET_BANK } from "./cadetBank";
import { STUDENT_PILOT_MODULES, STUDENT_PILOT_SECTIONS } from "./studentPilotContent";
import { READY_FOR_RADIO_MODULES, READY_FOR_RADIO_SECTIONS } from "./readyForRadioContent";
import { AIRLINE_PREP_MODULES, AIRLINE_PREP_SECTIONS } from "./airlinePrepContent";
import { ADVANCED_OPS_MODULES, ADVANCED_OPS_SECTIONS } from "./advancedOpsContent";

export type ExerciseType =
  | "Lesson"
  | "Listening"
  | "Speaking"
  | "Readback"
  | "Phraseology"
  | "Scenario"
  | "Challenge"
  | "Interactive Demo"
  | "Choice"
  | "Mission";

/** Maps the many authoring labels onto the concrete exercise screen templates. */
export type ScreenType = "lesson" | "listening" | "speaking" | "readback" | "phraseology" | "scenario" | "mission";

export function screenType(type: ExerciseType): ScreenType {
  switch (type) {
    case "Lesson":
    case "Interactive Demo":
      return "lesson";
    case "Listening":
    case "Choice":
      return "listening";
    case "Speaking":
      return "speaking";
    case "Readback":
      return "readback";
    case "Phraseology":
      return "phraseology";
    case "Scenario":
    case "Challenge":
      return "scenario";
    case "Mission":
      return "mission";
  }
}

/** One drill inside an exercise (a single question / prompt / readback item). */
export interface Drill {
  atc?: string;
  prompt?: string;
  display?: string;
  situation?: string;
  options?: string[];
  correct?: string;
  expected?: string;
  feedback?: string;
  cue?: string;
  /** Callsign to display to the student before they listen (Numbers readback drills). */
  callsign?: string;
  /** Aviation spoken phrase for TTS when `atc` uses display figures (e.g. frequency readback). */
  atcSpoken?: string;
  /** Accepted phrasing variants for future SR comparison — all must include callsign when applicable. */
  acceptedVariants?: string[];
}

export interface Transmission {
  speaker: "atc" | "user";
  text?: string;
  /** TTS-safe spoken override for `text` when display and pronunciation differ. */
  textSpoken?: string;
  prompt?: string;
  expected?: string;
  /** Accepted phrasing variants for future STT comparison — all must include callsign when applicable. */
  acceptedVariants?: string[];
}

/** A single step inside a mixed Challenge exercise. Each step renders its own mini-screen. */
export type ChallengeStepKind = "listening" | "speaking" | "readback" | "phraseology";

export interface ChallengeStep {
  kind: ChallengeStepKind;
  instruction?: string;
  /** Listening / readback: what ATC says (and is spoken aloud). */
  atc?: string;
  /** TTS-safe spoken override for `atc` when display and pronunciation differ. */
  atcSpoken?: string;
  /** A text situation prompt (used by choice-style listening or phraseology). */
  situation?: string;
  /** Speaking: the callsign/value displayed to read. */
  display?: string;
  /** Speaking: a short prompt of what to say. */
  prompt?: string;
  /** Listening/choice options. */
  options?: string[];
  /** Correct option for listening/choice steps. */
  correct?: string;
  /** Phraseology "build the call" chips. */
  buildOptions?: string[];
  /** Speaking/readback/phraseology expected answer. */
  expected?: string;
  feedback?: string;
  /** Callsign shown to the student before a Numbers readback step. */
  callsign?: string;
  /** Accepted phrasing variants for future SR comparison — all must include callsign when applicable. */
  acceptedVariants?: string[];
}

/* ------------------------------------------------------------------ */
/* Student Pilot shared contracts (Alpha)                              */
/* ------------------------------------------------------------------ */

/** Student Pilot block (exercise) types — the pedagogical building blocks. */
export type StudentPilotBlockType =
  | "visual-briefing"
  | "key-calls"
  | "guided-practice"
  | "visual-interpretation"
  | "listening-readback"
  | "listening-choice"
  | "fill-in-the-blanks"
  | "data-extraction"
  | "speak-in-context"
  | "decision-point"
  | "section-scenario"
  | "clearance-construction"
  | "readback-construction"
  | "checkpoint"
  | "mission"
  | "aerodrome-chart"
  | "taxi-lesson";

/** Phase of flight a Student Pilot block belongs to. */
export type StudentPilotPhase =
  | "preflight"
  | "taxi"
  | "takeoff"
  | "circuit"
  | "arrival"
  | "landing"
  | "parking"
  | "mission"
  // Ready For Radio phases (VFR operations outside the local environment)
  | "cross-country"
  | "airspace"
  | "unfamiliar"
  | "workload"
  | "problem-solving"
  // Airline Prep phases (IFR / airline-style radio flow)
  | "ifr-clearance"
  | "sid-departure"
  | "enroute-ifr"
  | "star-descent"
  | "holding"
  | "approach-vectoring"
  | "missed-approach"
  // Advanced Ops phases (abnormal & emergency communication under pressure)
  | "weather-deviation"
  | "diversion"
  | "pan-pan"
  | "mayday"
  | "high-workload"
  | "difficult-radio"
  | "unexpected-event";

/** Reusable visual surface a Student Pilot block renders (Brindale scenes). */
export type StudentPilotVisualType =
  | "home-aerodrome-map"
  | "route-overlay"
  | "aircraft-marker"
  | "runway-holding-point"
  | "circuit-diagram"
  | "atis-clearance-panel"
  | "taxi-map";

/** Concrete content for an exercise, sourced from the Cadet exercise bank. */
export interface ExerciseContent {
  instruction?: string;
  lessonBody?: string;
  examples?: string[];
  buttonLabel?: string;
  drills?: Drill[];
  transmissions?: Transmission[];
  briefing?: string;
  skills?: string;
  /** Ordered mixed steps for Challenge exercises. */
  challengeSteps?: ChallengeStep[];
  /** Mission briefing requirements checklist (mock). */
  requirements?: string[];
  /** Opt into a specialised interactive lesson screen (e.g. the ICAO alphabet or numbers trainer). */
  interactive?: "alphabet" | "numbers";
  /** Optional short mini-lesson shown before a drill session starts. */
  intro?: {
    text: string;
    /** One short rule/reminder highlighted in a dedicated card. */
    rule?: string;
    /** Rich pronunciation example cards (value + spoken phrase + readable guide + optional meaning). */
    cards?: { value: string; spoken: string; pronunciation: string; meaning?: string }[];
    /** Optional small muted footnote (e.g. a real-world / regional variant). */
    note?: string;
    /** Legacy flat examples ("090 = zero niner zero"); used only when `cards` is absent. */
    examples?: string[];
  };
  /* --- Student Pilot foundation metadata (Alpha) --- */
  /** Student Pilot pedagogical block type. */
  blockType?: StudentPilotBlockType;
  /** Phase of flight this block belongs to. */
  phase?: StudentPilotPhase;
  /** Reusable Brindale visual surface this block renders. */
  visualType?: StudentPilotVisualType;
  /** Stable id of the reusable visual scene (see studentPilotVisuals.ts). */
  visualSceneId?: string;
  /** Marks an exercise as a Batch-1 foundation placeholder (no real content yet). */
  isFoundationPlaceholder?: boolean;
  /** Whether a scenario-style block is a section scenario or a mission. */
  scenarioKind?: "section" | "mission";
  /** Checkpoint grading mode (completion-only during Alpha). */
  checkpointKind?: "completion-only" | "scored";
  /** Mission rollout status (capstone First Solo is implemented last). */
  missionStatus?: "essential" | "implemented-last";

  /* --- Student Pilot Batch 3 — Preflight real content fields --- */
  /**
   * Which visual panel to display alongside this exercise.
   *   "atis"      — ATIS information panel only
   *   "clearance" — Local/VFR departure clearance panel only
   *   "combined"  — Both panels
   *   "map"       — Brindale aerodrome overview map
   *   "none"      — No panel
   */
  spVisualMode?: "atis" | "clearance" | "combined" | "map" | "none";
  /** ATIS data displayed via AtisAndClearancePanel in atis/combined mode. */
  spAtisInfo?: SpAtisInfo;
  /** Clearance data displayed via AtisAndClearancePanel in clearance/combined mode. */
  spClearanceInfo?: SpClearanceInfo;
  /** Field keys to highlight in the AtisAndClearancePanel (e.g. ["runwayInUse"]). */
  spHighlightedFields?: string[];
  /**
   * Where to position the visual panel relative to the lesson text in visual-briefing exercises.
   * "above" (default) = panel first, then text.
   * "below" = text first, then panel.
   */
  spVisualPanelPosition?: "above" | "below";
  /** Listening multiple-choice data (listening-choice block type). */
  spListeningChoice?: SpListeningChoiceData;
  /** Multi-question listening data (listening-choice with two+ sequential questions). */
  spListeningMulti?: SpListeningMultiData;
  /** Fill-in-the-blanks data — single round (fill-in-the-blanks block type). */
  spFillBlank?: SpFillBlankData;
  /** Fill-in-the-blanks section — six sequential rounds. */
  spFillBlankSection?: SpFillBlankSection;
  /** ATIS data-extraction data — single round (data-extraction block type). */
  spDataExtraction?: SpDataExtractionData;
  /** Data-extraction section — six sequential rounds. */
  spDataExtractionSection?: SpDataExtractionSection;
  /** Chip-sequencing clearance construction section (Understand the Clearance card). */
  spClearanceSection?: SpClearanceSection;
  /** Simulated readback section (Read Back the Clearance card). */
  spReadbackSection?: SpReadbackSection;
  /** Multiple-choice options for visual-interpretation, decision-point, and checkpoint questions. */
  spOptions?: SpOption[];
  /** ID of the correct option in spOptions. */
  spCorrectOptionId?: string;
  /** The full expected call text shown to the student after submitting (speak-in-context). */
  spExpectedCall?: string;
  /** TTS-safe spoken version of spExpectedCall. */
  spExpectedCallSpoken?: string;
  /** Situational context shown above the speaking prompt. */
  spCallContext?: string;
  /** Optional structural hints shown below the speaking prompt (one line each). */
  spCallHints?: string[];
  /** Ordered steps for the section scenario renderer. */
  spScenarioSteps?: SpScenarioStep[];
  /** "conversation" renders section-scenario as a Cadet-style continuous radio chat. */
  scenarioStyle?: "conversation";
  /** Questions for the checkpoint renderer (completion-only during Alpha). */
  spCheckpointQuestions?: SpCheckpointQuestion[];

  /* --- Taxi, Holding Point & Runway Entry (merged ground-movement module) --- */
  /**
   * Brindale chart crop id shown as visual support (reference only, never interactive).
   * Typed as string to avoid coupling content.ts to brindaleChartV3; the renderer
   * casts it to ChartCropId and falls back to the full chart when unknown.
   */
  spChartCrop?: string;
  /**
   * Circuit schematic variant shown inside a taxi-lesson block (Circuit Operations).
   * Renders the internal SVG CircuitDiagram — visual support only, non-interactive.
   */
  spCircuitVariant?: "overview" | "upwind-crosswind" | "downwind" | "base-final" | "extend-orbit";
  /** Lesson key points (3–5 short bullets) for the taxi-lesson block. */
  spLessonPoints?: string[];
  /** Worked ATC + readback example pair(s) shown inside a taxi-lesson block. */
  spLessonExamples?: SpLessonExample[];
  /** decision-point: ATC instruction display text (renders a Play card above the question). */
  spAtcDisplay?: string;
  /** TTS-safe spoken form of spAtcDisplay. */
  spAtcSpoken?: string;
  /** Hide spAtcDisplay behind dots until "Show transmission" is tapped (listening-first). */
  spAtcHidden?: boolean;
  /** A (often incorrect) readback string shown for error-detection questions. */
  spShownReadback?: string;
  /** Label above spShownReadback (e.g. "Pilot read back"). */
  spShownReadbackLabel?: string;
  /** Conversation scenario: small uppercase kicker label (defaults to Preflight). */
  spScenarioKicker?: string;
  /** Conversation scenario: main heading (defaults to "Preflight Scenario"). */
  spScenarioHeading?: string;
  /** Conversation scenario: completion note shown in the chat when finished. */
  spScenarioCompletionNote?: string;
  /** Conversation scenario: the student's callsign shown in the task card. */
  spScenarioCallsign?: string;
  /** decision-point: uppercase category label above the exercise title (e.g. "Error detection"). */
  spScreenKicker?: string;
  /** decision-point: question prompt when `instruction` is used as the header subtitle. */
  spQuestion?: string;
  /** decision-point: custom label for the ATC instruction card (default "ATC instruction"). */
  spAtcLabel?: string;
}

/** A worked ATC instruction + expected readback example shown inside a lesson. */
export interface SpLessonExample {
  /** Optional context label shown above the ATC line (e.g. "Hold short example"). */
  label?: string;
  /** ATC instruction display text (e.g. "G-ABCD, taxi to holding point B2 via Alfa, Delta and Bravo."). */
  atcText: string;
  /** TTS-safe spoken form of atcText. */
  atcSpoken?: string;
  /** Expected pilot readback display text. */
  readback?: string;
}

/* ------------------------------------------------------------------ */
/* Student Pilot Batch 3 shared content types                         */
/* ------------------------------------------------------------------ */

/** ATIS display data — mirrors studentPilotVisuals.AtisInfo for zero import coupling. */
export interface SpAtisInfo {
  informationLetter: string;
  runwayInUse: string;
  wind: string;
  qnh: string;
  visibility: string;
  tempDewpoint?: string;
}

/** Departure clearance data — mirrors studentPilotVisuals.ClearanceInfo. */
export interface SpClearanceInfo {
  callsign: string;
  /** Departure runway (e.g. "24"). Optional — shown in lesson panel and readback order. */
  runway?: string;
  squawk: string;
  departureDirection: string;
  altitudeRestriction: string;
  frequency?: string;
  frequencyLabel?: string;
}

/** A single multiple-choice option. */
export interface SpOption {
  id: string;
  text: string;
  /** Shown after the student selects this option. */
  feedback?: string;
}

/** A single step in a section scenario conversation. */
export interface SpScenarioStep {
  id: string;
  /** "atc" = ATC says it; "pilot" = student must respond; "narrator" = context note. */
  speaker: "atc" | "pilot" | "narrator";
  /** Display text for the message bubble. */
  text: string;
  /** TTS-safe spoken override (aviation pronunciation). */
  spoken?: string;
  /** For pilot steps: the full expected readback phrase. */
  expectedReadback?: string;
  /** Short prompt shown to the student before their mic attempt. */
  readbackPrompt?: string;
  /** Visual mode to show alongside this step (inherits previous if omitted). */
  visual?: "atis" | "clearance" | "combined" | "map" | "none";
  /** Fields to highlight in the current visual panel. */
  highlightedFields?: string[];
  /** ATC text masked behind dots until Play or Show transmission is pressed. */
  hiddenInitially?: boolean;
  /** Whether "Show transmission" toggle is shown inside the ATC bubble. Defaults to true when hiddenInitially is true. */
  allowReveal?: boolean;
  /** Structured expected elements for future voice validation. */
  expectedElements?: Record<string, string>;
  /** Interaction type hint used by the conversation renderer. */
  interactionType?: "atc-hidden" | "pilot-speak" | "pilot-readback" | "narrator" | "completion";
  /** Brindale chart crop id shown as contextual support for this step (conversation scenarios). */
  chartCrop?: string;
  /** Per-step micro-instruction shown above the mic on pilot steps (overrides defaults). */
  micInstruction?: string;
  /** Accepted phrasing variants for future STT comparison — all must include callsign when applicable. */
  acceptedVariants?: string[];
}

/** A single question in the completion-only checkpoint. */
export interface SpCheckpointQuestion {
  id: string;
  question: string;
  options: SpOption[];
  correctOptionId: string;
  /** Shown after any answer is submitted (completion-only — no wrong outcome). */
  feedback?: string;
}

/* ------------------------------------------------------------------ */
/* Student Pilot listening exercise data types (Batch 3 ATIS topics)  */
/* ------------------------------------------------------------------ */

/** Data for a listening-choice exercise: play audio, answer one question. */
export interface SpListeningChoiceData {
  /** Plain text of what is spoken (displayed after answering). */
  audioText: string;
  /** TTS-safe spoken override. */
  audioSpoken: string;
  /** Question shown to the student. */
  prompt: string;
  options: SpOption[];
  correctOptionId: string;
}

/** One question in a multi-question listening exercise. */
export interface SpListeningMultiQuestion {
  id: string;
  /**
   * Per-question audio text (overrides the parent-level audioText when present).
   * Set when each question in a section uses a different ATIS broadcast.
   */
  audioText?: string;
  /** TTS-safe spoken override for this question's audio. */
  audioSpoken?: string;
  prompt: string;
  options: SpOption[];
  correctOptionId: string;
}

/**
 * Data for a multi-question listening exercise.
 * Parent-level audio is shared across questions; per-question audio overrides it.
 * Used when block type is "listening-choice" and spListeningMulti is set.
 */
export interface SpListeningMultiData {
  /** Shared audio for all questions (used when a question has no audioSpoken). */
  audioText?: string;
  audioSpoken?: string;
  /** Label shown on the play button. Defaults to "Listen to the ATIS" when omitted. */
  playLabel?: string;
  questions: SpListeningMultiQuestion[];
}

/** Six-round fill-in-the-blanks section (fill-in-the-blanks block type). */
export interface SpFillBlankSection {
  questions: SpFillBlankData[];
}

/** Six-round data-extraction section (data-extraction block type). */
export interface SpDataExtractionSection {
  questions: SpDataExtractionData[];
}

/** One segment in a fill-in-the-blanks template. */
/* ------------------------------------------------------------------ */
/* Clearance construction (chip-sequencing) types                     */
/* ------------------------------------------------------------------ */

/**
 * A single selectable chip in a clearance construction exercise.
 * segmentType enables per-element feedback once SR is available.
 */
export interface SpClearanceSegment {
  id: string;
  text: string;
  /** TTS spoken form (falls back to text when absent). */
  spoken?: string;
  segmentType:
    | "runway"
    | "direction"
    | "altitude"
    | "squawk"
    | "additional-instruction"
    | "callsign"
    | "distractor";
}

/**
 * One chip-sequencing round in an Understand or Read-Back exercise.
 * expectedSegments define the correct order; chipBank contains all chips
 * (expected + distractors) in a pre-mixed stable order for display.
 */
export interface SpClearanceRound {
  id: string;
  /** ATC clearance display text (human-readable). */
  atcText: string;
  /** ATC clearance TTS spoken override. */
  atcSpoken: string;
  /** Short prompt shown above the chip bank. */
  prompt: string;
  /** Optional helper line shown below the prompt (e.g. listening guidance). */
  helperText?: string;
  /** Custom feedback when the chip sequence is correct (defaults to "Correct."). */
  correctFeedback?: string;
  /** Custom feedback when the chip sequence is wrong. */
  incorrectFeedback?: string;
  /** Correct segments in the required order — used for full-sequence validation. */
  expectedSegments: SpClearanceSegment[];
  /**
   * Pre-mixed bank of ALL chips (expected + distractors).
   * Stable order — deliberately non-sequential so the answer is not implied.
   */
  chipBank: SpClearanceSegment[];
  /** Complete expected sentence displayed in post-Check feedback. */
  expectedSentence: string;
  /** TTS form of expectedSentence — used for replay and optional speak step. */
  expectedSpoken: string;
  /** Accepted spelling/abbreviation variants for future SR element comparison. */
  acceptedVariants?: string[];
  /**
   * "chip-sequence"           — select chips only.
   * "chip-sequence-and-speak" — chip selection + cosmetic speak invitation.
   */
  interactionType: "chip-sequence" | "chip-sequence-and-speak";
}

/** Six-round clearance construction exercise (Understand the Clearance card). */
export interface SpClearanceSection {
  rounds: SpClearanceRound[];
}

/* ------------------------------------------------------------------ */
/* Readback construction types (Read Back the Clearance card)          */
/* ------------------------------------------------------------------ */

/** Per-element breakdown of a clearance readback for future SR comparison. */
export interface SpReadbackElements {
  runway: string;
  direction: string;
  altitude?: string;
  squawk?: string;
  additionalInstruction?: string;
  callsign: string;
}

/**
 * One round in the Read Back the Clearance section.
 * Mirrors the Cadet "listen → tap mic → reveal model" (Case C) pattern.
 * Structured for future element-level speech-recognition feedback.
 */
export interface SpReadbackRound {
  id: string;
  /** ATC clearance display text. */
  atcText: string;
  /** ATC clearance TTS spoken override. */
  atcSpoken: string;
  /** Structural clearance elements — used in element checklist and future SR. */
  runway: string;
  departureDirection: string;
  altitudeRestriction?: string;
  squawk?: string;
  additionalInstruction?: string;
  callsign: string;
  /** Full expected pilot readback (hidden until after attempt). */
  expectedReadback: string;
  /** TTS spoken form of expected readback. */
  expectedReadbackSpoken: string;
  /** Accepted phrasing/spelling variants for future SR element comparison. */
  acceptedVariants?: string[];
  /** Per-element breakdown for checklist and future SR matching. */
  expectedElements: SpReadbackElements;
  /**
   * "simulated-readback" — tap-to-speak, no real audio capture or analysis (Alpha).
   * Reserved for future modes once SR is integrated.
   */
  interactionMode: "simulated-readback";
  /** Override the prompt card label (default "ATC transmission"). e.g. "Situation". */
  cardLabel?: string;
  /** When true the prompt card text is shown immediately (pilot-initiated reports). */
  contextRevealed?: boolean;
}

/** Six-round simulated readback section (Read Back the Clearance card). */
export interface SpReadbackSection {
  rounds: SpReadbackRound[];
}

export interface SpFillBlankSegment {
  type: "text" | "blank";
  /** Literal text to display (type === "text"). */
  text?: string;
  /** Unique blank identifier (type === "blank"). */
  blankId?: string;
}

/** Data for a fill-in-the-blanks exercise: play audio, drag/tap tokens into blanks. */
export interface SpFillBlankData {
  audioText: string;
  audioSpoken: string;
  instruction: string;
  /** Ordered mix of text and blank segments that form the template. */
  segments: SpFillBlankSegment[];
  /** Pool of draggable/tappable answer tokens. */
  tokens: Array<{ id: string; text: string }>;
  /** Map of blankId → correct tokenId. */
  correctAnswers: Record<string, string>;
}

/** One selectable field in an ATIS data-extraction exercise. */
export interface SpDataExtractionField {
  id: string;
  label: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
}

/** Data for a data-extraction exercise: play audio, select correct value per field. */
export interface SpDataExtractionData {
  audioText: string;
  audioSpoken: string;
  instruction: string;
  fields: SpDataExtractionField[];
}

export interface Exercise {
  id: string;
  title: string;
  type: ExerciseType;
  description?: string;
  free: boolean;
  content?: ExerciseContent;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  goal?: string;
  exercises: Exercise[];
  /** Noun for the items inside the topic ("steps" or "drills"). */
  unit?: string;
}

export interface Module {
  id: string;
  name: string;
  exercises: Exercise[];
  /** Optional grouping: a module organized as topics, each with its own internal path. */
  topics?: Topic[];
  /** Short descriptive subtitle shown in the Train list. */
  subtitle?: string;
  /** Noun used for the count label (e.g. "drill groups", "scenarios", "missions"). */
  unit?: string;
  /** When true, module is excluded from Train navigation and Train progress (lives in ATC Sim). */
  trainExcluded?: boolean;
}

export interface Section {
  title: string;
  modules: Module[];
}

export interface Level {
  id: string;
  name: string;
  tagline: string;
  /** Free users get a limited preview of this level (some exercises free). */
  preview: boolean;
  modules: Module[];
  /** Optional visual grouping of modules into sections (e.g. Foundations / Core Practice / Missions). */
  sections?: Section[];
  missions: string[];
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Step = readonly [ExerciseType, string, string?];
type Spec = Step;

function makeModule(id: string, name: string, specs: Step[], opts?: { subtitle?: string; unit?: string }): Module {
  return {
    id,
    name,
    subtitle: opts?.subtitle,
    unit: opts?.unit,
    exercises: specs.map(([type, title, description]) => ({
      id: `${id}.${type.toLowerCase()}.${slug(title)}`,
      title,
      type,
      description,
      free: false,
    })),
  };
}

function makeTopic(
  moduleId: string,
  name: string,
  opts: { description: string; goal?: string; unit?: string },
  steps: Step[],
): Topic {
  const topicId = `${moduleId}.${slug(name)}`;
  return {
    id: topicId,
    name,
    description: opts.description,
    goal: opts.goal,
    unit: opts.unit,
    exercises: steps.map(([type, title, description]) => ({
      id: `${topicId}.${slug(title)}`,
      title,
      type,
      description,
      free: false,
    })),
  };
}

/** A drill group is a topic made of N identical-type drills (e.g. Listening Letters -> 6 drills). */
function makeDrillGroup(
  moduleId: string,
  name: string,
  opts: { description: string; goal?: string },
  type: ExerciseType,
  count: number,
  stepTitlePrefix = "Drill",
): Topic {
  const topicId = `${moduleId}.${slug(name)}`;
  return {
    id: topicId,
    name,
    description: opts.description,
    goal: opts.goal,
    unit: "levels",
    exercises: Array.from({ length: count }, (_, i) => ({
      id: `${topicId}.drill-${i + 1}`,
      title: `${stepTitlePrefix} ${i + 1}`,
      type,
      free: false,
    })),
  };
}

function makeTopicModule(
  id: string,
  name: string,
  topics: Topic[],
  opts?: { subtitle?: string; unit?: string },
): Module {
  return { id, name, subtitle: opts?.subtitle, unit: opts?.unit, topics, exercises: topics.flatMap((t) => t.exercises) };
}

/* ------------------------------------------------------------------ */
/* CADET                                                               */
/* ------------------------------------------------------------------ */

const cadetRadioFundamentals = makeTopicModule(
  "radio-fundamentals",
  "Radio Fundamentals",
  [
    makeTopic(
      "radio-fundamentals",
      "ICAO Alphabet",
      {
        description: "Learn the spelling alphabet",
        goal: "Learn to hear, understand, pronounce and use the ICAO spelling alphabet in radio calls.",
      },
      [
        ["Lesson", "Learn the Alphabet", "Understand why pilots use standard spelling words."],
        ["Listening", "Listen and Identify Letters", "Hear ICAO words and select the correct letter."],
        ["Speaking", "Repeat Letters by Voice", "Listen to ICAO words and repeat them using the mic."],
        ["Listening", "Decode Callsigns", "Hear a callsign spelled by ATC and identify it."],
        ["Speaking", "Spell a Callsign", "Spell a callsign using the ICAO alphabet."],
        ["Challenge", "Mini Radio Challenge", "Combine listening, speaking and callsign spelling."],
      ],
    ),
    makeTopic(
      "radio-fundamentals",
      "Numbers",
      {
        description: "Headings, altitudes, flight levels, squawks and times",
        goal: "Understand and speak numbers in aviation radio.",
      },
      [
        ["Lesson", "Basic Numbers", "Learn aviation number pronunciation."],
        ["Listening", "Headings", "Identify headings such as 090, 180, 270."],
        ["Readback", "Altitudes", "Understand and read back altitude instructions."],
        ["Readback", "Flight Levels", "Understand flight level instructions."],
        ["Readback", "Squawks", "Understand transponder code instructions."],
        ["Listening", "Times", "Understand time references."],
        ["Speaking", "Say the Number", "Say headings, flight levels and altitudes in aviation format."],
        ["Challenge", "Mini Challenge", "Mixed number recognition and readback."],
      ],
    ),
    makeTopic(
      "radio-fundamentals",
      "Callsigns",
      {
        description: "Airline callsigns, registrations and structure",
        goal: "Understand airline callsigns, aircraft registrations and callsign structure.",
      },
      [
        ["Lesson", "Callsign Basics", "How callsigns are formed and used."],
        ["Listening", "Airline Callsigns", "Recognise common airline callsigns."],
        ["Listening", "Aircraft Registrations", "Recognise aircraft registrations."],
        ["Challenge", "Callsign Structure Challenge", "Combine the pieces of a full callsign."],
      ],
    ),
    makeTopic(
      "radio-fundamentals",
      "Frequencies",
      {
        description: "Hear, read and repeat VHF frequencies",
        goal: "Hear, read and repeat VHF frequencies correctly.",
      },
      [
        ["Lesson", "Frequency Basics", "How VHF frequencies are spoken."],
        ["Interactive Demo", "Visual Frequency Demo", "See and hear how a frequency is read."],
        ["Speaking", "Listen and Repeat Frequencies", "Repeat frequencies using the mic."],
        ["Listening", "Frequency Listening Challenge", "Recognise the frequency you hear."],
      ],
    ),
    makeTopic(
      "radio-fundamentals",
      "Basic Acknowledgements",
      {
        description: "Roger, Wilco, Affirm and Negative",
        goal: "Use the basic acknowledgements correctly.",
      },
      [
        ["Lesson", "Basic Acknowledgements", "Roger, Wilco, Affirm and Negative together."],
        ["Challenge", "Acknowledgement Practice", "Choose the correct acknowledgement."],
      ],
    ),
    makeTopic(
      "radio-fundamentals",
      "Clarification & Correction",
      {
        description: "Say again, Confirm, Correction and Speak slower",
        goal: "Ask for clarification, confirm information, correct yourself and ask ATC to slow down.",
      },
      [
        ["Lesson", "Clarification & Correction", "Learn the four clarification phrases."],
        ["Challenge", "Clarification Practice", "Choose the right phrase for each situation."],
        ["Speaking", "Say the Phrase", "Say the correct clarification phrase by voice."],
      ],
    ),
  ],
  { subtitle: "ICAO, numbers, callsigns, frequencies, acknowledgements, clarification" },
);

const cadetFirstContact = makeTopicModule(
  "first-contact",
  "First Contact",
  [
    makeTopic(
      "first-contact",
      "The 4 Ws",
      { description: "Station, callsign, position, request", goal: "Build your first radio call using the four key parts." },
      [
        ["Lesson", "The 4 Ws", "Learn all four parts together."],
        ["Phraseology", "Build the Call", "Tap the parts to build a full first call."],
        ["Speaking", "Speak the Call", "Say a complete first call."],
      ],
    ),
    makeTopic(
      "first-contact",
      "Radio Check & Readability",
      { description: "Confirm your radio works, readability five", goal: "Make a correct radio check call and understand the ATC readability response." },
      [
        ["Lesson", "What is a Radio Check", "Learn what a radio check is and the readability scale."],
        ["Phraseology", "Identify a Radio Check", "Recognise the correct radio check call."],
        ["Phraseology", "Build the Radio Check Call", "Put the radio check call in order."],
        ["Phraseology", "Readability Scale", "Understand what ATC means by each readability number."],
        ["Phraseology", "Ask for a Radio Check", "Say the complete radio check call."],
        ["Speaking", "Say the Radio Check", "Make a complete radio check call by voice."],
        ["Challenge", "Radio Check Mini Challenge", "Handle a complete radio check exchange."],
      ],
    ),
    makeTopic(
      "first-contact",
      "Basic ATIS & QNH",
      { description: "Information Bravo, QNH, pre-departure basics", goal: "Understand ATIS information and read back QNH before startup or taxi." },
      [
        ["Lesson", "What is ATIS and QNH", "Learn what ATIS, Information Bravo and QNH mean."],
        ["Phraseology", "Information Bravo", "Understand Information Bravo and how to use it."],
        ["Phraseology", "What is QNH?", "Identify QNH as a pressure setting."],
        ["Phraseology", "QNH Readback", "Read back the QNH given by ATC."],
        ["Phraseology", "Startup with Information Bravo", "Make a complete startup request with Information Bravo."],
        ["Speaking", "Say the QNH Readback", "Read back the QNH given by ATC using your voice."],
        ["Challenge", "ATIS and QNH Mini Challenge", "Handle a pre-departure exchange with Information Bravo and QNH."],
      ],
    ),
    makeTopic(
      "first-contact",
      "Basic Requests",
      { description: "Startup, taxi, information", goal: "Make the common Cadet requests." },
      [
        ["Phraseology", "Request Startup", "Ask Ground for startup, read back QNH."],
        ["Phraseology", "Request Taxi", "Ask Ground for taxi."],
        ["Phraseology", "Request Information", "Ask for information."],
        ["Challenge", "Mixed Request Challenge", "Pick and build the right request."],
        ["Speaking", "Speak the Request", "Make startup and taxi requests by voice."],
      ],
    ),
    makeTopic(
      "first-contact",
      "Frequency Changes",
      { description: "Contact, monitor, readback frequency", goal: "Change frequency and check in correctly." },
      [
        ["Lesson", "Contact vs Monitor", "The difference between contact and monitor."],
        ["Readback", "Frequency Readback", "Read back a frequency change."],
        ["Phraseology", "First Call on New Frequency", "Check in on the new frequency."],
        ["Challenge", "Mini Challenge", "Handle a full frequency change."],
        ["Speaking", "Speak First Call", "Check in on the new frequency by voice."],
      ],
    ),
  ],
  { subtitle: "Build your first radio call: station, callsign, position, request" },
);

const cadetListening = makeTopicModule(
  "cadet-listening",
  "Listening",
  [
    makeDrillGroup("cadet-listening", "Callsign Recognition", { description: "Catch the callsign in a real ATC call", goal: "Identify which callsign ATC addressed." }, "Listening", 6, "Level"),
    makeDrillGroup("cadet-listening", "Frequency Recognition", { description: "Extract the frequency from a full instruction", goal: "Pick out frequencies inside real calls." }, "Listening", 6, "Level"),
    makeDrillGroup("cadet-listening", "Clearance Recognition", { description: "Identify takeoff, line up, hold and cross", goal: "Tell clearance types apart by ear." }, "Listening", 6, "Level"),
    makeDrillGroup("cadet-listening", "Instruction Recognition", { description: "Identify taxi, hold, squawk and contact calls", goal: "Recognise simple ATC instructions quickly." }, "Listening", 6, "Level"),
    makeDrillGroup("cadet-listening", "Mixed ATC Listening", { description: "Mixed recognition from real ATC calls", goal: "Handle mixed ATC listening under pressure." }, "Listening", 6, "Level"),
  ],
  { subtitle: "Callsigns, frequencies, clearances, instructions, mixed", unit: "topics" },
);

const cadetReadbacks = makeTopicModule(
  "cadet-readbacks",
  "Readbacks",
  [
    makeDrillGroup("cadet-readbacks", "Frequency Changes", { description: "Read back frequency changes with your callsign", goal: "Read back frequency changes correctly." }, "Readback", 6, "Level"),
    makeDrillGroup("cadet-readbacks", "Squawk Instructions", { description: "Read back transponder codes with your callsign", goal: "Read back squawk codes accurately." }, "Readback", 6, "Level"),
    makeDrillGroup("cadet-readbacks", "Heading Instructions", { description: "Read back headings with your callsign", goal: "Read back assigned headings correctly." }, "Readback", 6, "Level"),
    makeDrillGroup("cadet-readbacks", "Altitude Instructions", { description: "Read back basic climb and descend calls", goal: "Read back altitude instructions correctly." }, "Readback", 6, "Level"),
    makeDrillGroup("cadet-readbacks", "Mixed Readbacks", { description: "Mixed contextual readbacks with your callsign", goal: "Read back mixed instructions under pressure." }, "Readback", 6, "Level"),
  ],
  { subtitle: "Frequencies, squawks, headings, altitudes, mixed", unit: "topics" },
);

const cadetPhraseology = makeTopicModule(
  "cadet-phraseology",
  "Phraseology",
  [
    makeDrillGroup("cadet-phraseology", "Basic Radio Phrases", { description: "Radio check, readability, roger, wilco, affirm, negative, standby", goal: "Use basic radio phrases accurately." }, "Phraseology", 5, "Level"),
    makeDrillGroup("cadet-phraseology", "When You Don't Understand", { description: "Say again, confirm, correction and speak slower", goal: "Ask for clarification correctly." }, "Phraseology", 5, "Level"),
    makeDrillGroup("cadet-phraseology", "Reporting & Frequency Phrases", { description: "Contact, monitor, report ready, report final, report established", goal: "Report and change frequency correctly." }, "Phraseology", 5, "Level"),
    makeDrillGroup("cadet-phraseology", "Mixed Phraseology Challenge", { description: "Mixed contextual phraseology under pressure", goal: "Use the right phraseology under pressure." }, "Phraseology", 5, "Level"),
  ],
  { subtitle: "Basic phrases, clarification, reporting, mixed challenge", unit: "topics" },
);

const cadetScenarios = makeTopicModule(
  "cadet-scenarios",
  "Scenarios",
  [
    makeTopic(
      "cadet-scenarios",
      "Taxi Basics",
      { description: "Request taxi, taxi to holding point, hold position", goal: "Handle a basic taxi exchange step by step.", unit: "situations" },
      [
        ["Scenario", "Request Taxi", "Request taxi from Ground and read back."],
        ["Scenario", "Taxi to Holding Point", "Read back a taxi-to-holding-point clearance."],
        ["Scenario", "Hold Position", "Acknowledge a hold instruction."],
      ],
    ),
    makeTopic(
      "cadet-scenarios",
      "Departure Basics",
      { description: "Ready for departure, line up and wait, cleared for takeoff", goal: "Work through a basic departure exchange.", unit: "situations" },
      [
        ["Scenario", "Ready for Departure", "Report ready for departure."],
        ["Scenario", "Line Up and Wait", "Read back line up and wait."],
        ["Scenario", "Cleared for Takeoff", "Read back a takeoff clearance."],
      ],
    ),
    makeTopic(
      "cadet-scenarios",
      "Landing Basics",
      { description: "Report final, cleared to land, runway vacated", goal: "Work through a basic landing exchange.", unit: "situations" },
      [
        ["Scenario", "Report Final", "Report final to Tower."],
        ["Scenario", "Cleared to Land", "Read back a landing clearance."],
        ["Scenario", "Runway Vacated", "Report the runway vacated."],
      ],
    ),
    makeTopic(
      "cadet-scenarios",
      "Taxi Back Basics",
      { description: "Taxi to parking, frequency change, parking complete", goal: "Complete a basic taxi back exchange.", unit: "situations" },
      [
        ["Scenario", "Taxi to Parking", "Request and read back taxi to parking."],
        ["Scenario", "Frequency Change After Landing", "Change frequency after landing."],
        ["Scenario", "Parking Complete", "Close out the radio exchange."],
      ],
    ),
  ],
  { subtitle: "Taxi, departure, landing and taxi back basics", unit: "topics" },
);

const cadet: Level = {
  id: "cadet",
  name: "Cadet",
  tagline: "Learn radio fundamentals",
  preview: true,
  missions: ["First Solo Radio Mission"],
  modules: [
    cadetRadioFundamentals,
    cadetFirstContact,
    cadetListening,
    cadetReadbacks,
    cadetPhraseology,
    cadetScenarios,
  ],
  sections: [
    { title: "Foundations", modules: [cadetRadioFundamentals, cadetFirstContact] },
    { title: "Core Practice", modules: [cadetListening, cadetReadbacks, cadetPhraseology, cadetScenarios] },
  ],
};

/* ------------------------------------------------------------------ */
/* STUDENT PILOT                                                       */
/* ------------------------------------------------------------------ */

function flightModule(id: string, name: string, listening: string[], readbacks: string[], phraseology: string[], scenarios: string[], mission: string): Module {
  const specs: Spec[] = [
    ...listening.map((t) => ["Listening", t] as Spec),
    ...readbacks.map((t) => ["Readback", t] as Spec),
    ...phraseology.map((t) => ["Phraseology", t] as Spec),
    ...scenarios.map((t) => ["Scenario", t] as Spec),
    ["Mission", mission],
  ];
  return makeModule(id, name, specs);
}

// Student Pilot Alpha catalog lives in studentPilotContent.ts (approved nine-module,
// topic-driven, phase-of-flight structure from student-pilot-blueprint-v2.md).
// Batch 1 = architecture + foundation placeholders only (no real exercise bank yet).
const studentPilot: Level = {
  id: "student-pilot",
  name: "Student Pilot",
  tagline: "Guided local VFR operations at Brindale",
  preview: false,
  missions: ["Circuit Training", "Touch & Go Session", "Local Training Flight", "First Solo"],
  modules: STUDENT_PILOT_MODULES,
  sections: STUDENT_PILOT_SECTIONS,
};

/* ------------------------------------------------------------------ */
/* READY FOR RADIO                                                     */
/* ------------------------------------------------------------------ */

// Ready For Radio Alpha catalog lives in readyForRadioContent.ts (VFR operations
// outside the local environment: cross-country, airspace decisions, unfamiliar
// aerodromes, radio workload/corrections and operational problem solving).
const readyForRadio: Level = {
  id: "ready-for-radio",
  name: "Ready For Radio",
  tagline: "Communicate with autonomy on VFR flights away from home",
  preview: false,
  missions: ["Cross-Country Navigation", "Controlled Airspace Transit", "Arrival at Unfamiliar Airfield", "VFR Diversion"],
  modules: READY_FOR_RADIO_MODULES,
  sections: READY_FOR_RADIO_SECTIONS,
};

/* ------------------------------------------------------------------ */
/* AIRLINE PREP                                                        */
/* ------------------------------------------------------------------ */

// Airline Prep Alpha catalog lives in airlinePrepContent.ts (IFR / airline-style
// radio flow: IFR clearance, SID & departure, enroute IFR, STAR & descent,
// holding, approach & vectoring, missed approach & second plan). Radar vectors
// are integrated into SID, Approach and Missed Approach — not a standalone module.
const airlinePrep: Level = {
  id: "airline-prep",
  name: "Airline Prep",
  tagline: "Follow IFR / airline-style comms",
  preview: false,
  missions: ["IFR Departure", "SID Departure", "Enroute IFR", "STAR Arrival", "Holding", "ILS Approach", "Missed Approach"],
  modules: AIRLINE_PREP_MODULES,
  sections: AIRLINE_PREP_SECTIONS,
};

/* ------------------------------------------------------------------ */
/* ADVANCED OPS                                                        */
/* ------------------------------------------------------------------ */

// Advanced Ops Alpha catalog lives in advancedOpsContent.ts (abnormal &
// emergency communication under pressure: weather deviations, diversions, PAN
// PAN, MAYDAY, high workload, difficult radio & accents, unexpected events).
const advancedOps: Level = {
  id: "advanced-ops",
  name: "Advanced Ops",
  tagline: "Communicate under pressure",
  preview: false,
  missions: ["Weather Diversion", "Diversion", "PAN PAN", "MAYDAY", "High Workload", "Difficult Radio", "Unexpected Event"],
  modules: ADVANCED_OPS_MODULES,
  sections: ADVANCED_OPS_SECTIONS,
};

/* ------------------------------------------------------------------ */
/* GATING + EXPORTS                                                    */
/* ------------------------------------------------------------------ */

/**
 * TEMP (Alpha internal dev): bypass Train progress locks and freemium exercise gates
 * so all Train levels (Cadet, Student Pilot, Ready For Radio, future levels) can be
 * reviewed without Pro or prior-level completion. Set to false before release.
 */
export const DEV_UNLOCK_ALL_TRAIN = true;

// Free tier: ~30% of each Cadet module, plus a small preview of Student Pilot.
function applyGating(level: Level) {
  if (level.id === "cadet") {
    for (const m of level.modules) {
      const freeCount = Math.max(1, Math.ceil(m.exercises.length * 0.3));
      m.exercises.forEach((ex, i) => {
        ex.free = i < freeCount;
      });
    }
  } else if (level.id === "student-pilot") {
    // Preview: first two exercises of the first module.
    level.modules[0]?.exercises.forEach((ex, i) => {
      ex.free = i < 2;
    });
  }
}

// Attach the concrete Cadet exercise content (the exercise bank) by id.
function attachContent(level: Level) {
  for (const module of level.modules) {
    for (const ex of module.exercises) {
      const c = CADET_BANK[ex.id];
      if (c) ex.content = c;
    }
  }
}

export const LEVELS: Level[] = [cadet, studentPilot, readyForRadio, airlinePrep, advancedOps];
LEVELS.forEach(applyGating);
attachContent(cadet);

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function findModule(moduleId: string): { level: Level; module: Module } | undefined {
  for (const level of LEVELS) {
    const module = level.modules.find((m) => m.id === moduleId);
    if (module) return { level, module };
  }
  return undefined;
}

export function findExercise(exerciseId: string):
  | { level: Level; module: Module; topic?: Topic; exercise: Exercise; index: number; total: number }
  | undefined {
  for (const level of LEVELS) {
    for (const module of level.modules) {
      if (module.topics) {
        for (const topic of module.topics) {
          const idx = topic.exercises.findIndex((e) => e.id === exerciseId);
          if (idx >= 0) {
            return { level, module, topic, exercise: topic.exercises[idx], index: idx, total: topic.exercises.length };
          }
        }
      } else {
        const idx = module.exercises.findIndex((e) => e.id === exerciseId);
        if (idx >= 0) {
          return { level, module, exercise: module.exercises[idx], index: idx, total: module.exercises.length };
        }
      }
    }
  }
  return undefined;
}

export function findTopic(topicId: string): { level: Level; module: Module; topic: Topic } | undefined {
  for (const level of LEVELS) {
    for (const module of level.modules) {
      const topic = module.topics?.find((t) => t.id === topicId);
      if (topic) return { level, module, topic };
    }
  }
  return undefined;
}

export function topicCompletion(topic: Topic, completed: Set<string>): number {
  if (topic.exercises.length === 0) return 0;
  const done = topic.exercises.filter((e) => completed.has(e.id)).length;
  return Math.round((done / topic.exercises.length) * 100);
}

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

/** Modules that appear in Train navigation and count toward Train level progress. */
export function trainModules(level: Level): Module[] {
  return level.modules.filter((m) => !m.trainExcluded);
}

/** Section groupings for Train, excluding trainExcluded modules and empty sections. */
export function trainSections(level: Level): Section[] {
  const raw = level.sections ?? [{ title: "Modules", modules: trainModules(level) }];
  return raw
    .map((sec) => ({ ...sec, modules: sec.modules.filter((m) => !m.trainExcluded) }))
    .filter((sec) => sec.modules.length > 0);
}

export function moduleCompletion(module: Module, completed: Set<string>): number {
  if (module.exercises.length === 0) return 0;
  const done = module.exercises.filter((e) => completed.has(e.id)).length;
  return Math.round((done / module.exercises.length) * 100);
}

export function levelCompletion(level: Level, completed: Set<string>): number {
  const all = trainModules(level).flatMap((m) => m.exercises);
  if (all.length === 0) return 0;
  const done = all.filter((e) => completed.has(e.id)).length;
  return Math.round((done / all.length) * 100);
}

/** A level is accessible (browsable with full content) if previous level is complete or user is Pro. Cadet is always accessible. */
export function isLevelUnlocked(level: Level, completed: Set<string>, isPro: boolean): boolean {
  if (DEV_UNLOCK_ALL_TRAIN) return true;
  const idx = levelIndex(level.id);
  if (idx <= 0) return true;
  if (isPro) return true;
  const prev = LEVELS[idx - 1];
  return levelCompletion(prev, completed) === 100;
}

/** Whether a specific exercise can be played without Pro. */
export function isExerciseAccessible(exercise: Exercise, level: Level, completed: Set<string>, isPro: boolean): boolean {
  if (DEV_UNLOCK_ALL_TRAIN) return true;
  if (isPro) return true;
  if (exercise.free) return true;
  return isLevelUnlocked(level, completed, isPro);
}

/* ------------------------------------------------------------------ */
/* RECOMMENDATION + SKILLS                                             */
/* ------------------------------------------------------------------ */

export type PracticeSkill = "listening" | "readbacks" | "phraseology";

const SKILL_MODULE: Record<PracticeSkill, string> = {
  listening: "cadet-listening",
  readbacks: "cadet-readbacks",
  phraseology: "cadet-phraseology",
};

/** The level the user is actively working on: first unlocked level that is not complete. */
export function currentLevel(completed: Set<string>, isPro: boolean): Level {
  for (const level of LEVELS) {
    if (isLevelUnlocked(level, completed, isPro) && levelCompletion(level, completed) < 100) return level;
  }
  return LEVELS[0];
}

export function nextLevel(level: Level): Level | undefined {
  return LEVELS[levelIndex(level.id) + 1];
}

export function modulesRemaining(level: Level, completed: Set<string>): number {
  return trainModules(level).filter((m) => moduleCompletion(m, completed) < 100).length;
}

export function firstIncompleteExercise(module: Module, completed: Set<string>): { topic?: Topic; exercise: Exercise } | undefined {
  if (module.topics) {
    for (const topic of module.topics) {
      const ex = topic.exercises.find((e) => !completed.has(e.id));
      if (ex) return { topic, exercise: ex };
    }
    return undefined;
  }
  const ex = module.exercises.find((e) => !completed.has(e.id));
  return ex ? { exercise: ex } : undefined;
}

export function weakestSkill(skills: Record<PracticeSkill, number>): PracticeSkill {
  let key: PracticeSkill = "listening";
  (Object.keys(SKILL_MODULE) as PracticeSkill[]).forEach((k) => {
    if (skills[k] < skills[key]) key = k;
  });
  return key;
}

export type Recommendation = {
  level: Level;
  module: Module;
  topic?: Topic;
  exercise: Exercise;
  reason: "continue" | "start" | "practice";
};

/**
 * Picks the next thing to train, from real progress:
 * 1) continue an in-progress module, 2) start the next not-started module,
 * 3) if the level is complete, practise the weakest skill.
 */
export function recommendNext(level: Level, completed: Set<string>, skills: Record<PracticeSkill, number>): Recommendation | undefined {
  for (const module of trainModules(level)) {
    const c = moduleCompletion(module, completed);
    if (c > 0 && c < 100) {
      const hit = firstIncompleteExercise(module, completed);
      if (hit) return { level, module, topic: hit.topic, exercise: hit.exercise, reason: "continue" };
    }
  }
  for (const module of trainModules(level)) {
    if (moduleCompletion(module, completed) === 0) {
      const hit = firstIncompleteExercise(module, completed);
      if (hit) return { level, module, topic: hit.topic, exercise: hit.exercise, reason: "start" };
    }
  }
  const skillMod = trainModules(level).find((m) => m.id === SKILL_MODULE[weakestSkill(skills)]) ?? trainModules(level)[0];
  if (skillMod) {
    const hit =
      firstIncompleteExercise(skillMod, completed) ??
      (skillMod.topics ? { topic: skillMod.topics[0], exercise: skillMod.topics[0].exercises[0] } : { exercise: skillMod.exercises[0] });
    if (hit?.exercise) return { level, module: skillMod, topic: hit.topic, exercise: hit.exercise, reason: "practice" };
  }
  return undefined;
}

/** Module to open when the user wants to practise a given skill. */
export function moduleForSkill(level: Level, skill: PracticeSkill): Module | undefined {
  return level.modules.find((m) => m.id === SKILL_MODULE[skill]);
}
