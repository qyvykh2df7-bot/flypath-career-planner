// AeroComms — Student Pilot Alpha catalog.
//
// Student Pilot content is built from reusable exercise and scenario contracts.
//
// ID convention: sp-{module-slug}.{topic-slug}.{block-type}
// Operational constants: PREFLIGHT_OP_STATE in studentPilotScenarios.ts
//
// No Cadet content lives here.

import { PREFLIGHT_SCENARIO_STEPS, TAXI_LINEUP_MISSION_STEPS, TAKEOFF_SCENARIO_STEPS, CIRCUIT_SCENARIO_STEPS, PARKING_SCENARIO_STEPS, ARRIVAL_SCENARIO_STEPS, LANDING_SCENARIO_STEPS } from "./studentPilotScenarios";
import type {
  Exercise,
  ExerciseContent,
  Module,
  SpAtisInfo,
  SpClearanceInfo,
  SpDataExtractionData,
  SpDataExtractionSection,
  SpFillBlankData,
  SpFillBlankSection,
  SpClearanceRound,
  SpClearanceSection,
  SpClearanceSegment,
  SpLessonExample,
  SpOption,
  SpReadbackRound,
  SpReadbackSection,
  SpListeningMultiData,
  Topic,
} from "./content";

/* ------------------------------------------------------------------ */
/* 1. Preflight & Initial Contact  (Batch 3 — real content)           */
/* ------------------------------------------------------------------ */

/**
 * Shared ATIS data used across all Preflight exercises.
 * G-ABCD at Brindale, runway 24, ATIS Information Alpha.
 */
const ALPHA_ATIS: SpAtisInfo = {
  informationLetter: "ALFA",
  runwayInUse: "24",
  wind: "220° / 10 KT",
  qnh: "1013",
  visibility: "10 KM+",
  tempDewpoint: "14 / 08°C",
};

/**
 * Display values for the Departure Clearance lesson panel only.
 * Does not alter ALPHA_CLEARANCE used elsewhere (e.g. Preflight Scenario).
 */
const LESSON_DEPARTURE_CLEARANCE: SpClearanceInfo = {
  callsign: "G-ABCD",
  runway: "24",
  squawk: "7621",
  departureDirection: "North",
  altitudeRestriction: "Not above 1,500 ft",
};

/**
 * Shared departure clearance data used across all Preflight exercises.
 */
const ALPHA_CLEARANCE: SpClearanceInfo = {
  callsign: "G-ABCD",
  runway: "24",
  squawk: "7621",
  departureDirection: "NORTH",
  altitudeRestriction: "NOT ABOVE 1,500 FT",
};

/* ------------------------------------------------------------------ */
/* ATIS audio text — one unique broadcast per listening exercise       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* ATIS audio — Runway and Information (6 questions, Alpha–Foxtrot)   */
/* Each question has its own unique ATIS broadcast.                    */
/* ------------------------------------------------------------------ */
const LSN_Q1 = "Brindale Information Alpha. Runway two four in use. Wind two three zero degrees, zero eight knots. QNH one zero one two. Visibility one zero kilometres or more.";
const LSN_Q2 = "Brindale Information Bravo. Runway zero six in use. Wind zero six zero degrees, zero six knots. QNH one zero zero eight. Visibility one zero kilometres or more.";
const LSN_Q3 = "Brindale Information Charlie. Runway zero six in use. Wind zero four zero degrees, one zero knots. QNH one zero one four. Visibility one zero kilometres or more.";
const LSN_Q4 = "Brindale Information Delta. Runway two four in use. Wind two one zero degrees, one two knots. QNH one zero zero nine. Visibility one zero kilometres or more.";
const LSN_Q5 = "Brindale Information Echo. Runway two four in use. Wind two zero zero degrees, zero nine knots. QNH one zero one five. Visibility one zero kilometres or more.";
const LSN_Q6 = "Brindale Information Foxtrot. Runway zero six in use. Wind zero five zero degrees, zero seven knots. QNH one zero one seven. Visibility one zero kilometres or more. Traffic information: one aircraft in the circuit.";

/* ------------------------------------------------------------------ */
/* ATIS audio — Complete the ATIS (6 rounds, Golf–Lima)               */
/* ------------------------------------------------------------------ */
const FIB_R1 = "Brindale Information Golf. Runway two four in use. Wind two two zero degrees, one zero knots. QNH one zero one zero. Visibility one zero kilometres or more.";
const FIB_R2 = "Brindale Information Hotel. Runway zero six in use. Wind zero three zero degrees, zero eight knots. QNH one zero one four. Visibility one zero kilometres or more.";
const FIB_R3 = "Brindale Information India. Runway two four in use. Wind one eight zero degrees, zero six knots. QNH one zero one one. Visibility one zero kilometres or more.";
const FIB_R4 = "Brindale Information Juliet. Runway zero six in use. Wind three five zero degrees, one four knots. QNH one zero zero seven. Visibility one zero kilometres or more.";
const FIB_R5 = "Brindale Information Kilo. Runway two four in use. Wind two two zero degrees, one one knots. QNH one zero two zero. Visibility one zero kilometres or more.";
const FIB_R6 = "Brindale Information Lima. Runway zero six in use. Wind zero four zero degrees, zero nine knots. QNH one zero one eight. Visibility one zero kilometres or more.";

/* ------------------------------------------------------------------ */
/* ATIS audio — Extract Operational Data (6 rounds, Mike–Romeo)       */
/* ------------------------------------------------------------------ */
const EXT_R1 = "Brindale Information Mike. Runway two four in use. Wind two three zero degrees, one zero knots. QNH one zero one two. Visibility one zero kilometres or more.";
const EXT_R2 = "Brindale Information November. Runway zero six in use. Wind zero six zero degrees, zero six knots. QNH one zero zero eight. Visibility one zero kilometres or more.";
const EXT_R3 = "Brindale Information Oscar. Runway two four in use. Wind two two zero degrees, zero eight knots. QNH one zero one four. Visibility one zero kilometres or more.";
const EXT_R4 = "Brindale Information Papa. Runway zero six in use. Wind three five zero degrees, one four knots. QNH one zero zero seven. Visibility one zero kilometres or more.";
const EXT_R5 = "Brindale Information Quebec. Runway two four in use. Wind two zero zero degrees, zero nine knots. QNH one zero two zero. Visibility one zero kilometres or more.";
const EXT_R6 = "Brindale Information Romeo. Runway zero six in use. Wind zero four zero degrees, zero nine knots. QNH one zero one seven. Visibility one zero kilometres or more.";

/* ------------------------------------------------------------------ */
/* Topic 1: ATIS — 4 section cards                                     */
/*   Card 1: lesson (1 screen)                                         */
/*   Card 2: Runway and Information  (6 listening MC questions)        */
/*   Card 3: Complete the ATIS       (6 fill-in-the-blanks rounds)     */
/*   Card 4: Extract Operational Data (6 data-extraction rounds)       */
/* ------------------------------------------------------------------ */
const atisActiveTopic: Topic = {
  id: "sp-preflight.atis-active-runway",
  name: "ATIS",
  description: "Listen, reconstruct and extract key ATIS values",
  unit: "exercises",
  exercises: [

    /* ── CARD 1 — Short explanation lesson (ID preserved) ───────────── */
    {
      id: "sp-preflight.atis-active-runway.visual-briefing",
      title: "Reading ATIS at Brindale",
      type: "Lesson",
      free: false,
      content: {
        blockType: "visual-briefing",
        phase: "preflight",
        spVisualMode: "atis",
        spAtisInfo: ALPHA_ATIS,
        spHighlightedFields: ["informationLetter", "runwayInUse", "qnh", "wind"],
        spVisualPanelPosition: "below",
        instruction: "Reading ATIS at Brindale",
        lessonBody: [
          "ATIS is a recorded airport broadcast you listen to before calling Ground.",
          "",
          "Listen for: information letter · runway in use · wind · QNH · visibility.",
          "",
          "Use the information letter in your first call — it confirms you have the current broadcast.",
        ].join("\n"),
      } satisfies ExerciseContent,
    },

    /* ── CARD 2 — Runway and Information — 6 listening MC questions ─────
     *
     * Each question has its own ATIS audio.
     * Correct-answer positions across 6 questions (varied):
     *   Q1 pos 2: Runway 24 of [Runway 09, Runway 24, Runway 06, Runway 15]
     *   Q2 pos 3: Bravo     of [Alpha, Delta, Bravo, Charlie]
     *   Q3 pos 4: Runway 06 of [Runway 24, Runway 09, Runway 15, Runway 06]
     *   Q4 pos 1: Delta     of [Delta, Echo, Foxtrot, Charlie]
     *   Q5 pos 3: Rwy 24—Echo of [Rwy 06—Echo, Rwy 24—Foxtrot, Rwy 24—Echo, Rwy 06—Foxtrot]
     *   Q6 pos 2: Foxtrot   of [Echo, Foxtrot, Golf, Delta]
     */
    {
      id: "sp-preflight.atis-active-runway.listening-choice",
      title: "Runway and Information",
      type: "Listening",
      free: false,
      content: {
        blockType: "listening-choice",
        phase: "preflight",
        spVisualMode: "none",
        spListeningMulti: {
          questions: [
            {
              id: "sp-preflight.atis-active-runway.listening-choice.q1",
              audioText: LSN_Q1, audioSpoken: LSN_Q1,
              prompt: "What is the runway in use?",
              options: [
                { id: "q1-rwy09", text: "Runway 09", feedback: "Runway 09 was not mentioned. The ATIS stated runway two four in use." },
                { id: "q1-rwy24", text: "Runway 24", feedback: "Correct. The ATIS stated runway two four in use." },
                { id: "q1-rwy06", text: "Runway 06", feedback: "Runway 06 was not mentioned. Listen again for the runway value." },
                { id: "q1-rwy15", text: "Runway 15", feedback: "Runway 15 was not mentioned. Listen for the runway in use." },
              ],
              correctOptionId: "q1-rwy24",
            },
            {
              id: "sp-preflight.atis-active-runway.listening-choice.q2",
              audioText: LSN_Q2, audioSpoken: LSN_Q2,
              prompt: "What is the ATIS information letter?",
              options: [
                { id: "q2-alpha",   text: "Alpha",   feedback: "Alpha was not the information letter. Listen to the very start of the broadcast." },
                { id: "q2-delta",   text: "Delta",   feedback: "Delta was not the information letter. The broadcast said Brindale Information Bravo." },
                { id: "q2-bravo",   text: "Bravo",   feedback: "Correct. This was Brindale Information Bravo." },
                { id: "q2-charlie", text: "Charlie", feedback: "Charlie was not the information letter. Listen for the letter at the start." },
              ],
              correctOptionId: "q2-bravo",
            },
            {
              id: "sp-preflight.atis-active-runway.listening-choice.q3",
              audioText: LSN_Q3, audioSpoken: LSN_Q3,
              prompt: "What is the runway in use?",
              options: [
                { id: "q3-rwy24", text: "Runway 24", feedback: "Runway 24 was not mentioned. The ATIS stated runway zero six in use." },
                { id: "q3-rwy09", text: "Runway 09", feedback: "Runway 09 was not mentioned. Listen again for the runway value." },
                { id: "q3-rwy15", text: "Runway 15", feedback: "Runway 15 was not mentioned. The broadcast stated runway zero six." },
                { id: "q3-rwy06", text: "Runway 06", feedback: "Correct. The ATIS stated runway zero six in use." },
              ],
              correctOptionId: "q3-rwy06",
            },
            {
              id: "sp-preflight.atis-active-runway.listening-choice.q4",
              audioText: LSN_Q4, audioSpoken: LSN_Q4,
              prompt: "What is the ATIS information letter?",
              options: [
                { id: "q4-delta",   text: "Delta",   feedback: "Correct. This was Brindale Information Delta." },
                { id: "q4-echo",    text: "Echo",    feedback: "Echo was not the information letter. Listen to the very first word after Brindale." },
                { id: "q4-foxtrot", text: "Foxtrot", feedback: "Foxtrot was not the information letter. The broadcast said Brindale Information Delta." },
                { id: "q4-charlie", text: "Charlie", feedback: "Charlie was not the information letter. Listen again for the letter at the start." },
              ],
              correctOptionId: "q4-delta",
            },
            {
              id: "sp-preflight.atis-active-runway.listening-choice.q5",
              audioText: LSN_Q5, audioSpoken: LSN_Q5,
              prompt: "Select the correct runway and information combination.",
              options: [
                { id: "q5-06-echo",    text: "Runway 06 — Info Echo",    feedback: "The runway was two four, not zero six. Listen again." },
                { id: "q5-24-foxtrot", text: "Runway 24 — Info Foxtrot", feedback: "The information letter was Echo, not Foxtrot." },
                { id: "q5-24-echo",    text: "Runway 24 — Info Echo",    feedback: "Correct. Runway two four in use, Information Echo." },
                { id: "q5-06-foxtrot", text: "Runway 06 — Info Foxtrot", feedback: "Neither the runway nor the information letter matches. Listen again." },
              ],
              correctOptionId: "q5-24-echo",
            },
            {
              id: "sp-preflight.atis-active-runway.listening-choice.q6",
              audioText: LSN_Q6, audioSpoken: LSN_Q6,
              prompt: "What is the ATIS information letter?",
              options: [
                { id: "q6-echo",    text: "Echo",    feedback: "Echo was not the information letter. Listen to the very first sentence again." },
                { id: "q6-foxtrot", text: "Foxtrot", feedback: "Correct. This was Brindale Information Foxtrot." },
                { id: "q6-golf",    text: "Golf",    feedback: "Golf was not the information letter. The broadcast said Brindale Information Foxtrot." },
                { id: "q6-delta",   text: "Delta",   feedback: "Delta was not the information letter. Listen carefully to the start of the ATIS." },
              ],
              correctOptionId: "q6-foxtrot",
            },
          ],
        } satisfies SpListeningMultiData,
      } satisfies ExerciseContent,
    },

    /* ── CARD 3 — Complete the ATIS — 6 fill-in-the-blanks rounds ───────
     *
     * Difficulty rises: 3 blanks → 4 → 5 → 5 (more distractors) → 6 → 6.
     * Token banks always have more tokens than blanks (distractors included).
     * Token order never matches blank order.
     */
    {
      id: "sp-preflight.atis-active-runway.fill-in-the-blanks",
      title: "Complete the ATIS",
      type: "Listening",
      free: false,
      content: {
        blockType: "fill-in-the-blanks",
        phase: "preflight",
        spVisualMode: "none",
        spFillBlankSection: {
          questions: [

            /* Round 1 — 3 blanks: letter, runway, QNH */
            {
              audioText: FIB_R1, audioSpoken: FIB_R1,
              instruction: "Listen and complete the ATIS",
              segments: [
                { type: "text",  text: "Brindale Information " },
                { type: "blank", blankId: "r1-letter" },
                { type: "text",  text: ".\nRunway "   },
                { type: "blank", blankId: "r1-runway" },
                { type: "text",  text: " in use.\nWind 220° / 10 KT.\nQNH " },
                { type: "blank", blankId: "r1-qnh"    },
                { type: "text",  text: "."             },
              ],
              tokens: [
                { id: "r1-t24",    text: "24"    },
                { id: "r1-t1010",  text: "1010"  },
                { id: "r1-tHotel", text: "Hotel" },
                { id: "r1-tGolf",  text: "Golf"  },
                { id: "r1-t06",    text: "06"    },
                { id: "r1-t1013",  text: "1013"  },
              ],
              correctAnswers: { "r1-letter": "r1-tGolf", "r1-runway": "r1-t24", "r1-qnh": "r1-t1010" },
            } satisfies SpFillBlankData,

            /* Round 2 — 4 blanks: letter, runway, wind-dir, QNH */
            {
              audioText: FIB_R2, audioSpoken: FIB_R2,
              instruction: "Listen and complete the ATIS",
              segments: [
                { type: "text",  text: "Brindale Information "  },
                { type: "blank", blankId: "r2-letter"   },
                { type: "text",  text: ".\nRunway "      },
                { type: "blank", blankId: "r2-runway"   },
                { type: "text",  text: " in use.\nWind " },
                { type: "blank", blankId: "r2-wind-dir" },
                { type: "text",  text: "° / 08 KT.\nQNH " },
                { type: "blank", blankId: "r2-qnh"      },
                { type: "text",  text: "."               },
              ],
              // Token order: numeric first, then words — does NOT match blank order
              tokens: [
                { id: "r2-t06",    text: "06"    },
                { id: "r2-t1014",  text: "1014"  },
                { id: "r2-tGolf",  text: "Golf"  },
                { id: "r2-tHotel", text: "Hotel" },
                { id: "r2-t040",   text: "040"   },
                { id: "r2-t030",   text: "030"   },
                { id: "r2-t24",    text: "24"    },
                { id: "r2-t1010",  text: "1010"  },
              ],
              correctAnswers: { "r2-letter": "r2-tHotel", "r2-runway": "r2-t06", "r2-wind-dir": "r2-t030", "r2-qnh": "r2-t1014" },
            } satisfies SpFillBlankData,

            /* Round 3 — 5 blanks: letter, runway, wind-dir, wind-spd, QNH */
            {
              audioText: FIB_R3, audioSpoken: FIB_R3,
              instruction: "Listen and complete the ATIS",
              segments: [
                { type: "text",  text: "Brindale Information "   },
                { type: "blank", blankId: "r3-letter"   },
                { type: "text",  text: ".\nRunway "       },
                { type: "blank", blankId: "r3-runway"   },
                { type: "text",  text: " in use.\nWind "  },
                { type: "blank", blankId: "r3-wind-dir" },
                { type: "text",  text: "° / "             },
                { type: "blank", blankId: "r3-wind-spd" },
                { type: "text",  text: " KT.\nQNH "      },
                { type: "blank", blankId: "r3-qnh"      },
                { type: "text",  text: "."               },
              ],
              tokens: [
                { id: "r3-t24",    text: "24"    },
                { id: "r3-t1011",  text: "1011"  },
                { id: "r3-tHotel", text: "Hotel" },
                { id: "r3-tIndia", text: "India" },
                { id: "r3-t180",   text: "180"   },
                { id: "r3-t12",    text: "12"    },
                { id: "r3-t190",   text: "190"   },
                { id: "r3-t6",     text: "6"     },
                { id: "r3-t06",    text: "06"    },
                { id: "r3-t1013",  text: "1013"  },
              ],
              correctAnswers: { "r3-letter": "r3-tIndia", "r3-runway": "r3-t24", "r3-wind-dir": "r3-t180", "r3-wind-spd": "r3-t6", "r3-qnh": "r3-t1011" },
            } satisfies SpFillBlankData,

            /* Round 4 — 5 blanks with more distractors */
            {
              audioText: FIB_R4, audioSpoken: FIB_R4,
              instruction: "Listen and complete the ATIS",
              segments: [
                { type: "text",  text: "Brindale Information "   },
                { type: "blank", blankId: "r4-letter"   },
                { type: "text",  text: ".\nRunway "       },
                { type: "blank", blankId: "r4-runway"   },
                { type: "text",  text: " in use.\nWind "  },
                { type: "blank", blankId: "r4-wind-dir" },
                { type: "text",  text: "° / "             },
                { type: "blank", blankId: "r4-wind-spd" },
                { type: "text",  text: " KT.\nQNH "      },
                { type: "blank", blankId: "r4-qnh"      },
                { type: "text",  text: "."               },
              ],
              tokens: [
                { id: "r4-t06",     text: "06"     },
                { id: "r4-t14",     text: "14"     },
                { id: "r4-t1007",   text: "1007"   },
                { id: "r4-tJuliet", text: "Juliet" },
                { id: "r4-t350",    text: "350"    },
                { id: "r4-tIndia",  text: "India"  },
                { id: "r4-t340",    text: "340"    },
                { id: "r4-t24",     text: "24"     },
                { id: "r4-t10",     text: "10"     },
                { id: "r4-t1013",   text: "1013"   },
                { id: "r4-t1010",   text: "1010"   },
              ],
              correctAnswers: { "r4-letter": "r4-tJuliet", "r4-runway": "r4-t06", "r4-wind-dir": "r4-t350", "r4-wind-spd": "r4-t14", "r4-qnh": "r4-t1007" },
            } satisfies SpFillBlankData,

            /* Round 5 — 6 blanks: letter, runway, wind-dir, wind-spd, QNH, visibility */
            {
              audioText: FIB_R5, audioSpoken: FIB_R5,
              instruction: "Listen and complete the ATIS",
              segments: [
                { type: "text",  text: "Brindale Information "   },
                { type: "blank", blankId: "r5-letter"   },
                { type: "text",  text: ".\nRunway "       },
                { type: "blank", blankId: "r5-runway"   },
                { type: "text",  text: " in use.\nWind "  },
                { type: "blank", blankId: "r5-wind-dir" },
                { type: "text",  text: "° / "             },
                { type: "blank", blankId: "r5-wind-spd" },
                { type: "text",  text: " KT.\nQNH "      },
                { type: "blank", blankId: "r5-qnh"      },
                { type: "text",  text: ".\nVisibility "   },
                { type: "blank", blankId: "r5-vis"      },
                { type: "text",  text: "."               },
              ],
              tokens: [
                { id: "r5-tKilo",   text: "Kilo"    },
                { id: "r5-t24",     text: "24"      },
                { id: "r5-t1020",   text: "1020"    },
                { id: "r5-t220",    text: "220"      },
                { id: "r5-t10km",   text: "10 km+"  },
                { id: "r5-t11",     text: "11"      },
                { id: "r5-t5km",    text: "5 km"    },
                { id: "r5-tJuliet", text: "Juliet"  },
                { id: "r5-t230",    text: "230"      },
                { id: "r5-t06",     text: "06"      },
                { id: "r5-t15",     text: "15"      },
                { id: "r5-t1013",   text: "1013"    },
              ],
              correctAnswers: { "r5-letter": "r5-tKilo", "r5-runway": "r5-t24", "r5-wind-dir": "r5-t220", "r5-wind-spd": "r5-t11", "r5-qnh": "r5-t1020", "r5-vis": "r5-t10km" },
            } satisfies SpFillBlankData,

            /* Round 6 — 6 blanks, slightly longer ATIS wording */
            {
              audioText: FIB_R6, audioSpoken: FIB_R6,
              instruction: "Listen and complete the ATIS",
              segments: [
                { type: "text",  text: "Brindale Information "   },
                { type: "blank", blankId: "r6-letter"   },
                { type: "text",  text: ".\nRunway "       },
                { type: "blank", blankId: "r6-runway"   },
                { type: "text",  text: " in use.\nWind "  },
                { type: "blank", blankId: "r6-wind-dir" },
                { type: "text",  text: "° / "             },
                { type: "blank", blankId: "r6-wind-spd" },
                { type: "text",  text: " KT.\nQNH "      },
                { type: "blank", blankId: "r6-qnh"      },
                { type: "text",  text: ".\nVisibility "   },
                { type: "blank", blankId: "r6-vis"      },
                { type: "text",  text: "."               },
              ],
              tokens: [
                { id: "r6-t06",    text: "06"      },
                { id: "r6-t1018",  text: "1018"    },
                { id: "r6-tLima",  text: "Lima"    },
                { id: "r6-t040",   text: "040"      },
                { id: "r6-t10km",  text: "10 km+"  },
                { id: "r6-t9",     text: "9"       },
                { id: "r6-t5km",   text: "5 km"    },
                { id: "r6-t24",    text: "24"      },
                { id: "r6-tKilo",  text: "Kilo"    },
                { id: "r6-t050",   text: "050"      },
                { id: "r6-t12",    text: "12"      },
                { id: "r6-t1013",  text: "1013"    },
              ],
              correctAnswers: { "r6-letter": "r6-tLima", "r6-runway": "r6-t06", "r6-wind-dir": "r6-t040", "r6-wind-spd": "r6-t9", "r6-qnh": "r6-t1018", "r6-vis": "r6-t10km" },
            } satisfies SpFillBlankData,

          ],
        } satisfies SpFillBlankSection,
      } satisfies ExerciseContent,
    },

    /* ── CARD 4 — Extract Operational Data — 6 data-extraction rounds ───
     *
     * Fields: Information, Runway, QNH, Wind (4 per round, 3–4 options each).
     * Correct-answer positions vary independently across fields and rounds.
     *
     * Info positions:  R1→2, R2→1, R3→4, R4→3, R5→2, R6→1
     * Runway positions: R1→1, R2→3, R3→2, R4→1, R5→3, R6→2
     * QNH positions:   R1→3, R2→2, R3→1, R4→4, R5→1, R6→3
     * Wind positions:  R1→2, R2→3, R3→3, R4→2, R5→4, R6→2
     */
    {
      id: "sp-preflight.atis-active-runway.data-extraction",
      title: "Extract Operational Data",
      type: "Listening",
      free: false,
      content: {
        blockType: "data-extraction",
        phase: "preflight",
        spVisualMode: "none",
        spDataExtractionSection: {
          questions: [

            /* Round 1 — Info Mike, RWY 24, QNH 1012, Wind 230/10 */
            {
              audioText: EXT_R1, audioSpoken: EXT_R1,
              instruction: "Listen and extract the key information",
              fields: [
                { id: "r1-info",   label: "Information", correctOptionId: "r1-mike",
                  options: [{ id: "r1-november", text: "November" }, { id: "r1-mike", text: "Mike" }, { id: "r1-papa", text: "Papa" }, { id: "r1-oscar", text: "Oscar" }] },
                { id: "r1-runway", label: "Runway",      correctOptionId: "r1-24",
                  options: [{ id: "r1-24", text: "24" }, { id: "r1-06", text: "06" }, { id: "r1-09", text: "09" }] },
                { id: "r1-qnh",    label: "QNH",         correctOptionId: "r1-1012",
                  options: [{ id: "r1-1008", text: "1008" }, { id: "r1-1016", text: "1016" }, { id: "r1-1012", text: "1012" }] },
                { id: "r1-wind",   label: "Wind",        correctOptionId: "r1-230-10",
                  options: [{ id: "r1-210-08", text: "210° / 8 KT" }, { id: "r1-230-10", text: "230° / 10 KT" }, { id: "r1-250-12", text: "250° / 12 KT" }] },
              ],
            } satisfies SpDataExtractionData,

            /* Round 2 — Info November, RWY 06, QNH 1008, Wind 060/6 */
            {
              audioText: EXT_R2, audioSpoken: EXT_R2,
              instruction: "Listen and extract the key information",
              fields: [
                { id: "r2-info",   label: "Information", correctOptionId: "r2-november",
                  options: [{ id: "r2-november", text: "November" }, { id: "r2-oscar", text: "Oscar" }, { id: "r2-mike", text: "Mike" }, { id: "r2-papa", text: "Papa" }] },
                { id: "r2-runway", label: "Runway",      correctOptionId: "r2-06",
                  options: [{ id: "r2-24", text: "24" }, { id: "r2-09", text: "09" }, { id: "r2-06", text: "06" }] },
                { id: "r2-qnh",    label: "QNH",         correctOptionId: "r2-1008",
                  options: [{ id: "r2-1013", text: "1013" }, { id: "r2-1008", text: "1008" }, { id: "r2-1015", text: "1015" }] },
                { id: "r2-wind",   label: "Wind",        correctOptionId: "r2-060-06",
                  options: [{ id: "r2-040-04", text: "040° / 4 KT" }, { id: "r2-080-08", text: "080° / 8 KT" }, { id: "r2-060-06", text: "060° / 6 KT" }] },
              ],
            } satisfies SpDataExtractionData,

            /* Round 3 — Info Oscar, RWY 24, QNH 1014, Wind 220/8 */
            {
              audioText: EXT_R3, audioSpoken: EXT_R3,
              instruction: "Listen and extract the key information",
              fields: [
                { id: "r3-info",   label: "Information", correctOptionId: "r3-oscar",
                  options: [{ id: "r3-mike", text: "Mike" }, { id: "r3-november", text: "November" }, { id: "r3-papa", text: "Papa" }, { id: "r3-oscar", text: "Oscar" }] },
                { id: "r3-runway", label: "Runway",      correctOptionId: "r3-24",
                  options: [{ id: "r3-06", text: "06" }, { id: "r3-24", text: "24" }, { id: "r3-09", text: "09" }] },
                { id: "r3-qnh",    label: "QNH",         correctOptionId: "r3-1014",
                  options: [{ id: "r3-1014", text: "1014" }, { id: "r3-1010", text: "1010" }, { id: "r3-1018", text: "1018" }] },
                { id: "r3-wind",   label: "Wind",        correctOptionId: "r3-220-08",
                  options: [{ id: "r3-200-05", text: "200° / 5 KT" }, { id: "r3-230-12", text: "230° / 12 KT" }, { id: "r3-220-08", text: "220° / 8 KT" }] },
              ],
            } satisfies SpDataExtractionData,

            /* Round 4 — Info Papa, RWY 06, QNH 1007, Wind 350/14 */
            {
              audioText: EXT_R4, audioSpoken: EXT_R4,
              instruction: "Listen and extract the key information",
              fields: [
                { id: "r4-info",   label: "Information", correctOptionId: "r4-papa",
                  options: [{ id: "r4-mike", text: "Mike" }, { id: "r4-oscar", text: "Oscar" }, { id: "r4-papa", text: "Papa" }, { id: "r4-november", text: "November" }] },
                { id: "r4-runway", label: "Runway",      correctOptionId: "r4-06",
                  options: [{ id: "r4-06", text: "06" }, { id: "r4-24", text: "24" }, { id: "r4-09", text: "09" }] },
                { id: "r4-qnh",    label: "QNH",         correctOptionId: "r4-1007",
                  options: [{ id: "r4-1013", text: "1013" }, { id: "r4-1010", text: "1010" }, { id: "r4-1015", text: "1015" }, { id: "r4-1007", text: "1007" }] },
                { id: "r4-wind",   label: "Wind",        correctOptionId: "r4-350-14",
                  options: [{ id: "r4-010-08", text: "010° / 8 KT" }, { id: "r4-350-14", text: "350° / 14 KT" }, { id: "r4-330-06", text: "330° / 6 KT" }] },
              ],
            } satisfies SpDataExtractionData,

            /* Round 5 — Info Quebec, RWY 24, QNH 1020, Wind 200/9 */
            {
              audioText: EXT_R5, audioSpoken: EXT_R5,
              instruction: "Listen and extract the key information",
              fields: [
                { id: "r5-info",   label: "Information", correctOptionId: "r5-quebec",
                  options: [{ id: "r5-romeo", text: "Romeo" }, { id: "r5-quebec", text: "Quebec" }, { id: "r5-sierra", text: "Sierra" }, { id: "r5-papa", text: "Papa" }] },
                { id: "r5-runway", label: "Runway",      correctOptionId: "r5-24",
                  options: [{ id: "r5-09", text: "09" }, { id: "r5-06", text: "06" }, { id: "r5-24", text: "24" }] },
                { id: "r5-qnh",    label: "QNH",         correctOptionId: "r5-1020",
                  options: [{ id: "r5-1020", text: "1020" }, { id: "r5-1014", text: "1014" }, { id: "r5-1017", text: "1017" }] },
                { id: "r5-wind",   label: "Wind",        correctOptionId: "r5-200-09",
                  options: [{ id: "r5-220-12", text: "220° / 12 KT" }, { id: "r5-180-06", text: "180° / 6 KT" }, { id: "r5-230-08", text: "230° / 8 KT" }, { id: "r5-200-09", text: "200° / 9 KT" }] },
              ],
            } satisfies SpDataExtractionData,

            /* Round 6 — Info Romeo, RWY 06, QNH 1017, Wind 040/9 */
            {
              audioText: EXT_R6, audioSpoken: EXT_R6,
              instruction: "Listen and extract the key information",
              fields: [
                { id: "r6-info",   label: "Information", correctOptionId: "r6-romeo",
                  options: [{ id: "r6-romeo", text: "Romeo" }, { id: "r6-quebec", text: "Quebec" }, { id: "r6-sierra", text: "Sierra" }, { id: "r6-november", text: "November" }] },
                { id: "r6-runway", label: "Runway",      correctOptionId: "r6-06",
                  options: [{ id: "r6-24", text: "24" }, { id: "r6-06", text: "06" }, { id: "r6-09", text: "09" }] },
                { id: "r6-qnh",    label: "QNH",         correctOptionId: "r6-1017",
                  options: [{ id: "r6-1013", text: "1013" }, { id: "r6-1010", text: "1010" }, { id: "r6-1017", text: "1017" }] },
                { id: "r6-wind",   label: "Wind",        correctOptionId: "r6-040-09",
                  options: [{ id: "r6-050-05", text: "050° / 5 KT" }, { id: "r6-040-09", text: "040° / 9 KT" }, { id: "r6-060-12", text: "060° / 12 KT" }] },
              ],
            } satisfies SpDataExtractionData,

          ],
        } satisfies SpDataExtractionSection,
      } satisfies ExerciseContent,
    },

  ],
};

/*
 * First Contact With Ground and Request Startup are no longer standalone topics.
 * Their skills are applied inside the Preflight Scenario (topic 3).
 * Call structure: "Brindale Ground, G-ABCD, Stand 3, request departure clearance, Information Alpha."
 * Startup readback: "Startup approved, runway 24, G-ABCD."
 */


/* ── Departure Clearance — chip-construction audio constants (CCL) ────
 *
 * Six complete ATC departure clearances with progressive complexity.
 * CCL_1 : RWY 24 · north                                     (3 elements)
 * CCL_2 : RWY 24 · north · 1,500 ft                          (4 elements)
 * CCL_3 : RWY 24 · north · 1,500 ft · 7621                   (5 elements)
 * CCL_4 : RWY 24 · east  · 1,800 ft · 2470 · report airborne (6 elements)
 * CCL_5 : RWY 06 · west  · 2,000 ft · 4312 · report passing  (6 elements)
 * CCL_6 : RWY 24 · north · 1,500 ft · 7621 · contact Tower   (6 elements)
 */
const CCL_1 =
  "Golf Alpha Bravo Charlie Delta, runway two four, cleared local Victor Fox Romeo flight, " +
  "departure to the north.";
/** RBK_1: simplified R1 for readback section — no VFR clearance prefix. */
const RBK_1 =
  "Golf Alpha Bravo Charlie Delta, runway two four, departure to the north.";
const CCL_2 =
  "Golf Alpha Bravo Charlie Delta, runway two four, departure to the north, " +
  "not above one thousand five hundred feet.";
const CCL_3 =
  "Golf Alpha Bravo Charlie Delta, runway two four, departure to the north, " +
  "not above one thousand five hundred feet, squawk seven six two one.";
const CCL_4 =
  "Golf Alpha Bravo Charlie Delta, runway two four, departure to the east, " +
  "not above one thousand eight hundred feet, squawk two four seven zero, report airborne.";
const CCL_5 =
  "Golf Alpha Bravo Charlie Delta, runway zero six, departure to the west, " +
  "not above two thousand feet, squawk four three one two, report passing one thousand feet.";
const CCL_6 =
  "Golf Alpha Bravo Charlie Delta, runway two four, departure to the north, " +
  "not above one thousand five hundred feet, squawk seven six two one, " +
  "after departure contact Tower one one eight decimal seven zero zero.";

/* --- Topic 2: Departure Clearance (3 cards) ---
 *
 * Approved element order (both sections):
 *   Runway → direction → altitude → squawk → additional instruction → callsign
 */
const departureClearanceTopic: Topic = {
  id: "sp-preflight.local-vfr-departure-clearance",
  name: "Departure Clearance",
  description: "Runway, direction, altitude restriction, squawk and readback",
  unit: "exercises",
  exercises: [

    /* ── CARD 1 — Your Departure Clearance — updated lesson ── */
    {
      id: "sp-preflight.local-vfr-departure-clearance.visual-briefing",
      title: "Your Departure Clearance",
      type: "Lesson",
      free: false,
      content: {
        blockType: "visual-briefing",
        phase: "preflight",
        spVisualMode: "clearance",
        spVisualPanelPosition: "below",
        spClearanceInfo: LESSON_DEPARTURE_CLEARANCE,
        spHighlightedFields: [],
        instruction: "Your Departure Clearance",
        lessonBody: [
          "A departure clearance tells you the runway, departure direction, altitude restriction and squawk.",
          "",
          "Read back every item in this order:",
          "Runway → direction → altitude → squawk → additional instruction → callsign.",
          "",
          "The ATIS information letter belongs in your first contact, not in the clearance readback.",
        ].join("\n"),
      } satisfies ExerciseContent,
    },

    /* ── CARD 2 — Understand the Clearance — 6 chip-sequence rounds ── */
    {
      id: "sp-preflight.local-vfr-departure-clearance.understand",
      title: "Understand the Clearance",
      type: "Listening",
      free: false,
      content: {
        blockType: "clearance-construction",
        phase: "preflight",
        spVisualMode: "none",
        spClearanceSection: {
          rounds: [

            {
              id: "sp-preflight.local-vfr-departure-clearance.understand.q1",
              atcText: "G-ABCD, runway 24, cleared local VFR flight, departure to the north.",
              atcSpoken: CCL_1,
              prompt: "Select the clearance elements in order.",
              expectedSegments: [
                { id: "u1-rwy24",   text: "Runway 24",       segmentType: "runway"    },
                { id: "u1-dir-n",   text: "Departure north",  segmentType: "direction" },
                { id: "u1-cs",      text: "G-ABCD",           segmentType: "callsign"  },
              ] satisfies SpClearanceSegment[],
              chipBank: [
                { id: "u1-d-rwy06", text: "Runway 06",        segmentType: "distractor" },
                { id: "u1-d-cs",    text: "G-ABDC",           segmentType: "distractor" },
                { id: "u1-rwy24",   text: "Runway 24",        segmentType: "runway"    },
                { id: "u1-d-dir-s", text: "Departure south",  segmentType: "distractor" },
                { id: "u1-cs",      text: "G-ABCD",           segmentType: "callsign"  },
                { id: "u1-d-sqk",   text: "Squawk 7621",      segmentType: "distractor" },
                { id: "u1-dir-n",   text: "Departure north",  segmentType: "direction" },
              ] satisfies SpClearanceSegment[],
              expectedSentence: "Runway 24, departure to the north, G-ABCD.",
              expectedSpoken: "Runway two four, departure to the north, Golf Alpha Bravo Charlie Delta.",
              interactionType: "chip-sequence",
            } satisfies SpClearanceRound,

            {
              id: "sp-preflight.local-vfr-departure-clearance.understand.q2",
              atcText: "G-ABCD, runway 24, departure to the north, not above 1,500 ft.",
              atcSpoken: CCL_2,
              prompt: "Select the clearance elements in order.",
              expectedSegments: [
                { id: "u2-rwy24",       text: "Runway 24",          segmentType: "runway"    },
                { id: "u2-dir-n",       text: "Departure north",    segmentType: "direction" },
                { id: "u2-alt-1500",    text: "Not above 1,500 ft", segmentType: "altitude"  },
                { id: "u2-cs",          text: "G-ABCD",             segmentType: "callsign"  },
              ] satisfies SpClearanceSegment[],
              chipBank: [
                { id: "u2-d-alt-2000",  text: "Not above 2,000 ft", segmentType: "distractor" },
                { id: "u2-rwy24",       text: "Runway 24",          segmentType: "runway"    },
                { id: "u2-d-dir-w",     text: "Departure west",     segmentType: "distractor" },
                { id: "u2-dir-n",       text: "Departure north",    segmentType: "direction" },
                { id: "u2-cs",          text: "G-ABCD",             segmentType: "callsign"  },
                { id: "u2-d-rwy06",     text: "Runway 06",          segmentType: "distractor" },
                { id: "u2-alt-1500",    text: "Not above 1,500 ft", segmentType: "altitude"  },
                { id: "u2-d-alt-below", text: "Not below 1,500 ft", segmentType: "distractor" },
              ] satisfies SpClearanceSegment[],
              expectedSentence: "Runway 24, departure to the north, not above 1,500 ft, G-ABCD.",
              expectedSpoken: "Runway two four, departure to the north, not above one thousand five hundred feet, Golf Alpha Bravo Charlie Delta.",
              interactionType: "chip-sequence",
            } satisfies SpClearanceRound,

            {
              id: "sp-preflight.local-vfr-departure-clearance.understand.q3",
              atcText: "G-ABCD, runway 24, departure to the north, not above 1,500 ft, squawk 7621.",
              atcSpoken: CCL_3,
              prompt: "Select all clearance elements in order.",
              expectedSegments: [
                { id: "u3-rwy24",       text: "Runway 24",          segmentType: "runway"    },
                { id: "u3-dir-n",       text: "Departure north",    segmentType: "direction" },
                { id: "u3-alt-1500",    text: "Not above 1,500 ft", segmentType: "altitude"  },
                { id: "u3-sqk7621",     text: "Squawk 7621",        segmentType: "squawk"    },
                { id: "u3-cs",          text: "G-ABCD",             segmentType: "callsign"  },
              ] satisfies SpClearanceSegment[],
              chipBank: [
                { id: "u3-d-sqk7216",   text: "Squawk 7216",        segmentType: "distractor" },
                { id: "u3-rwy24",       text: "Runway 24",          segmentType: "runway"    },
                { id: "u3-d-dir-s",     text: "Departure south",    segmentType: "distractor" },
                { id: "u3-dir-n",       text: "Departure north",    segmentType: "direction" },
                { id: "u3-d-rwy06",     text: "Runway 06",          segmentType: "distractor" },
                { id: "u3-alt-1500",    text: "Not above 1,500 ft", segmentType: "altitude"  },
                { id: "u3-sqk7621",     text: "Squawk 7621",        segmentType: "squawk"    },
                { id: "u3-cs",          text: "G-ABCD",             segmentType: "callsign"  },
                { id: "u3-d-alt-2000",  text: "Not above 2,000 ft", segmentType: "distractor" },
                { id: "u3-d-sqk7612",   text: "Squawk 7612",        segmentType: "distractor" },
              ] satisfies SpClearanceSegment[],
              expectedSentence: "Runway 24, departure to the north, not above 1,500 ft, squawk 7621, G-ABCD.",
              expectedSpoken: "Runway two four, departure to the north, not above one thousand five hundred feet, squawk seven six two one, Golf Alpha Bravo Charlie Delta.",
              interactionType: "chip-sequence",
            } satisfies SpClearanceRound,

            {
              id: "sp-preflight.local-vfr-departure-clearance.understand.q4",
              atcText: "G-ABCD, runway 24, departure to the east, not above 1,800 ft, squawk 2470, report airborne.",
              atcSpoken: CCL_4,
              prompt: "Select all clearance elements in order.",
              expectedSegments: [
                { id: "u4-rwy24",        text: "Runway 24",             segmentType: "runway"                 },
                { id: "u4-dir-e",        text: "Departure east",        segmentType: "direction"              },
                { id: "u4-alt-1800",     text: "Not above 1,800 ft",    segmentType: "altitude"               },
                { id: "u4-sqk2470",      text: "Squawk 2470",           segmentType: "squawk"                 },
                { id: "u4-rep-airborne", text: "Report airborne",       segmentType: "additional-instruction" },
                { id: "u4-cs",           text: "G-ABCD",                segmentType: "callsign"               },
              ] satisfies SpClearanceSegment[],
              chipBank: [
                { id: "u4-d-rwy06",      text: "Runway 06",             segmentType: "distractor" },
                { id: "u4-dir-e",        text: "Departure east",        segmentType: "direction"  },
                { id: "u4-d-sqk2740",    text: "Squawk 2740",           segmentType: "distractor" },
                { id: "u4-rwy24",        text: "Runway 24",             segmentType: "runway"     },
                { id: "u4-d-rep-final",  text: "Report final",          segmentType: "distractor" },
                { id: "u4-alt-1800",     text: "Not above 1,800 ft",    segmentType: "altitude"   },
                { id: "u4-sqk2470",      text: "Squawk 2470",           segmentType: "squawk"     },
                { id: "u4-d-dir-w",      text: "Departure west",        segmentType: "distractor" },
                { id: "u4-rep-airborne", text: "Report airborne",       segmentType: "additional-instruction" },
                { id: "u4-d-rep-pass",   text: "Report passing 1,000 ft", segmentType: "distractor" },
                { id: "u4-cs",           text: "G-ABCD",                segmentType: "callsign"   },
              ] satisfies SpClearanceSegment[],
              expectedSentence: "Runway 24, departure to the east, not above 1,800 ft, squawk 2470, report airborne, G-ABCD.",
              expectedSpoken: "Runway two four, departure to the east, not above one thousand eight hundred feet, squawk two four seven zero, report airborne, Golf Alpha Bravo Charlie Delta.",
              interactionType: "chip-sequence",
            } satisfies SpClearanceRound,

            {
              id: "sp-preflight.local-vfr-departure-clearance.understand.q5",
              atcText: "G-ABCD, runway 06, departure to the west, not above 2,000 ft, squawk 4312, report passing 1,000 ft.",
              atcSpoken: CCL_5,
              prompt: "Select all clearance elements in order.",
              expectedSegments: [
                { id: "u5-rwy06",         text: "Runway 06",              segmentType: "runway"                 },
                { id: "u5-dir-w",         text: "Departure west",         segmentType: "direction"              },
                { id: "u5-alt-2000",      text: "Not above 2,000 ft",     segmentType: "altitude"               },
                { id: "u5-sqk4312",       text: "Squawk 4312",            segmentType: "squawk"                 },
                { id: "u5-rep-pass1000",  text: "Report passing 1,000 ft",segmentType: "additional-instruction" },
                { id: "u5-cs",            text: "G-ABCD",                 segmentType: "callsign"               },
              ] satisfies SpClearanceSegment[],
              chipBank: [
                { id: "u5-rwy06",         text: "Runway 06",              segmentType: "runway"    },
                { id: "u5-d-rep-pass2k",  text: "Report passing 2,000 ft",segmentType: "distractor" },
                { id: "u5-dir-w",         text: "Departure west",         segmentType: "direction"  },
                { id: "u5-d-sqk4132",     text: "Squawk 4132",            segmentType: "distractor" },
                { id: "u5-d-rwy24",       text: "Runway 24",              segmentType: "distractor" },
                { id: "u5-alt-2000",      text: "Not above 2,000 ft",     segmentType: "altitude"   },
                { id: "u5-d-dir-n",       text: "Departure north",        segmentType: "distractor" },
                { id: "u5-sqk4312",       text: "Squawk 4312",            segmentType: "squawk"     },
                { id: "u5-rep-pass1000",  text: "Report passing 1,000 ft",segmentType: "additional-instruction" },
                { id: "u5-d-rep-airborne",text: "Report airborne",        segmentType: "distractor" },
                { id: "u5-cs",            text: "G-ABCD",                 segmentType: "callsign"   },
              ] satisfies SpClearanceSegment[],
              expectedSentence: "Runway 06, departure to the west, not above 2,000 ft, squawk 4312, report passing 1,000 ft, G-ABCD.",
              expectedSpoken: "Runway zero six, departure to the west, not above two thousand feet, squawk four three one two, report passing one thousand feet, Golf Alpha Bravo Charlie Delta.",
              interactionType: "chip-sequence",
            } satisfies SpClearanceRound,

            {
              id: "sp-preflight.local-vfr-departure-clearance.understand.q6",
              atcText: "G-ABCD, runway 24, departure to the north, not above 1,500 ft, squawk 7621, after departure contact Tower 118.700.",
              atcSpoken: CCL_6,
              prompt: "Select all clearance elements in order.",
              expectedSegments: [
                { id: "u6-rwy24",        text: "Runway 24",                   segmentType: "runway"                 },
                { id: "u6-dir-n",        text: "Departure north",             segmentType: "direction"              },
                { id: "u6-alt-1500",     text: "Not above 1,500 ft",          segmentType: "altitude"               },
                { id: "u6-sqk7621",      text: "Squawk 7621",                 segmentType: "squawk"                 },
                { id: "u6-contact-twr",  text: "Contact Tower 118.700",       segmentType: "additional-instruction" },
                { id: "u6-cs",           text: "G-ABCD",                      segmentType: "callsign"               },
              ] satisfies SpClearanceSegment[],
              chipBank: [
                { id: "u6-d-contact-gnd", text: "Contact Ground 121.600",     segmentType: "distractor" },
                { id: "u6-rwy24",         text: "Runway 24",                  segmentType: "runway"     },
                { id: "u6-d-rep-airborne",text: "Report airborne",            segmentType: "distractor" },
                { id: "u6-dir-n",         text: "Departure north",            segmentType: "direction"  },
                { id: "u6-d-contact-twr1",text: "Contact Tower 118.100",      segmentType: "distractor" },
                { id: "u6-alt-1500",      text: "Not above 1,500 ft",         segmentType: "altitude"   },
                { id: "u6-d-sqk7216",     text: "Squawk 7216",                segmentType: "distractor" },
                { id: "u6-sqk7621",       text: "Squawk 7621",                segmentType: "squawk"     },
                { id: "u6-d-dir-s",       text: "Departure south",            segmentType: "distractor" },
                { id: "u6-contact-twr",   text: "Contact Tower 118.700",      segmentType: "additional-instruction" },
                { id: "u6-d-rwy06",       text: "Runway 06",                  segmentType: "distractor" },
                { id: "u6-cs",            text: "G-ABCD",                     segmentType: "callsign"   },
              ] satisfies SpClearanceSegment[],
              expectedSentence: "Runway 24, departure to the north, not above 1,500 ft, squawk 7621, after departure contact Tower 118.700, G-ABCD.",
              expectedSpoken: "Runway two four, departure to the north, not above one thousand five hundred feet, squawk seven six two one, after departure contact Tower one one eight decimal seven zero zero, Golf Alpha Bravo Charlie Delta.",
              interactionType: "chip-sequence",
            } satisfies SpClearanceRound,

          ],
        } satisfies SpClearanceSection,
      } satisfies ExerciseContent,
    },

    /* ── CARD 3 — Read Back the Clearance — 6 simulated-readback rounds ── */
    {
      id: "sp-preflight.local-vfr-departure-clearance.readback",
      title: "Read Back the Clearance",
      type: "Readback",
      free: false,
      content: {
        blockType: "readback-construction",
        phase: "preflight",
        spVisualMode: "none",
        spReadbackSection: {
          rounds: [

            /* ── R1 · RWY 24 north — runway, direction, callsign ── */
            {
              id: "sp-preflight.local-vfr-departure-clearance.readback.r1",
              atcText: "G-ABCD, runway 24, departure to the north.",
              atcSpoken: RBK_1,
              runway: "24",
              departureDirection: "to the north",
              callsign: "G-ABCD",
              expectedReadback: "Runway 24, departure to the north, G-ABCD.",
              expectedReadbackSpoken:
                "Runway two four, departure to the north, Golf Alpha Bravo Charlie Delta.",
              expectedElements: {
                runway: "24",
                direction: "to the north",
                callsign: "G-ABCD",
              },
              interactionMode: "simulated-readback",
            } satisfies SpReadbackRound,

            /* ── R2 · RWY 24 north 1,500 ft — + altitude ── */
            {
              id: "sp-preflight.local-vfr-departure-clearance.readback.r2",
              atcText: "G-ABCD, runway 24, departure to the north, not above 1,500 feet.",
              atcSpoken: CCL_2,
              runway: "24",
              departureDirection: "to the north",
              altitudeRestriction: "1,500 feet",
              callsign: "G-ABCD",
              expectedReadback: "Runway 24, departure to the north, not above 1,500 feet, G-ABCD.",
              expectedReadbackSpoken:
                "Runway two four, departure to the north, not above one thousand five hundred feet, Golf Alpha Bravo Charlie Delta.",
              expectedElements: {
                runway: "24",
                direction: "to the north",
                altitude: "1,500 feet",
                callsign: "G-ABCD",
              },
              interactionMode: "simulated-readback",
            } satisfies SpReadbackRound,

            /* ── R3 · RWY 24 north 1,500 ft 7621 — + squawk ── */
            {
              id: "sp-preflight.local-vfr-departure-clearance.readback.r3",
              atcText:
                "G-ABCD, runway 24, departure to the north, not above 1,500 feet, squawk 7621.",
              atcSpoken: CCL_3,
              runway: "24",
              departureDirection: "to the north",
              altitudeRestriction: "1,500 feet",
              squawk: "7621",
              callsign: "G-ABCD",
              expectedReadback:
                "Runway 24, departure to the north, not above 1,500 feet, squawk 7621, G-ABCD.",
              expectedReadbackSpoken:
                "Runway two four, departure to the north, not above one thousand five hundred feet, squawk seven six two one, Golf Alpha Bravo Charlie Delta.",
              expectedElements: {
                runway: "24",
                direction: "to the north",
                altitude: "1,500 feet",
                squawk: "7621",
                callsign: "G-ABCD",
              },
              interactionMode: "simulated-readback",
            } satisfies SpReadbackRound,

            /* ── R4 · RWY 24 east 1,800 ft 2470 report airborne ── */
            {
              id: "sp-preflight.local-vfr-departure-clearance.readback.r4",
              atcText:
                "G-ABCD, runway 24, departure to the east, not above 1,800 feet, squawk 2470, report airborne.",
              atcSpoken: CCL_4,
              runway: "24",
              departureDirection: "to the east",
              altitudeRestriction: "1,800 feet",
              squawk: "2470",
              additionalInstruction: "report airborne",
              callsign: "G-ABCD",
              expectedReadback:
                "Runway 24, departure to the east, not above 1,800 feet, squawk 2470, report airborne, G-ABCD.",
              expectedReadbackSpoken:
                "Runway two four, departure to the east, not above one thousand eight hundred feet, squawk two four seven zero, report airborne, Golf Alpha Bravo Charlie Delta.",
              expectedElements: {
                runway: "24",
                direction: "to the east",
                altitude: "1,800 feet",
                squawk: "2470",
                additionalInstruction: "report airborne",
                callsign: "G-ABCD",
              },
              interactionMode: "simulated-readback",
            } satisfies SpReadbackRound,

            /* ── R5 · RWY 06 west 2,000 ft 4312 report passing 1,000 ft ── */
            {
              id: "sp-preflight.local-vfr-departure-clearance.readback.r5",
              atcText:
                "G-ABCD, runway 06, departure to the west, not above 2,000 feet, squawk 4312, report passing 1,000 feet.",
              atcSpoken: CCL_5,
              runway: "06",
              departureDirection: "to the west",
              altitudeRestriction: "2,000 feet",
              squawk: "4312",
              additionalInstruction: "report passing 1,000 feet",
              callsign: "G-ABCD",
              expectedReadback:
                "Runway 06, departure to the west, not above 2,000 feet, squawk 4312, report passing 1,000 feet, G-ABCD.",
              expectedReadbackSpoken:
                "Runway zero six, departure to the west, not above two thousand feet, squawk four three one two, report passing one thousand feet, Golf Alpha Bravo Charlie Delta.",
              expectedElements: {
                runway: "06",
                direction: "to the west",
                altitude: "2,000 feet",
                squawk: "4312",
                additionalInstruction: "report passing 1,000 feet",
                callsign: "G-ABCD",
              },
              interactionMode: "simulated-readback",
            } satisfies SpReadbackRound,

            /* ── R6 · RWY 24 north 1,500 ft 7621 contact Tower 118.700 ── */
            {
              id: "sp-preflight.local-vfr-departure-clearance.readback.r6",
              atcText:
                "G-ABCD, runway 24, departure to the north, not above 1,500 feet, squawk 7621, after departure contact Tower 118.700.",
              atcSpoken: CCL_6,
              runway: "24",
              departureDirection: "to the north",
              altitudeRestriction: "1,500 feet",
              squawk: "7621",
              additionalInstruction: "after departure contact Tower 118.700",
              callsign: "G-ABCD",
              expectedReadback:
                "Runway 24, departure to the north, not above 1,500 feet, squawk 7621, after departure contact Tower 118.700, G-ABCD.",
              expectedReadbackSpoken:
                "Runway two four, departure to the north, not above one thousand five hundred feet, squawk seven six two one, after departure contact Tower one one eight decimal seven zero zero, Golf Alpha Bravo Charlie Delta.",
              acceptedVariants: [
                "Runway 24, departure to the north, not above 1,500 feet, squawk 7621, after departure contact Tower 118.700, Golf Alpha Bravo Charlie Delta.",
              ],
              expectedElements: {
                runway: "24",
                direction: "to the north",
                altitude: "1,500 feet",
                squawk: "7621",
                additionalInstruction: "after departure contact Tower 118.700",
                callsign: "G-ABCD",
              },
              interactionMode: "simulated-readback",
            } satisfies SpReadbackRound,

          ],
        } satisfies SpReadbackSection,
      } satisfies ExerciseContent,
    },


  ],
};


/* --- Topic 3: Preflight Scenario (1 exercise — end-of-module integration) --- */
const preflightScenarioTopic: Topic = {
  id: "sp-preflight.section-scenario",
  name: "Preflight Scenario",
  description: "Full sequence: ATIS → clearance → startup → report ready",
  unit: "exercises",
  exercises: [
    {
      id: "sp-preflight.section-scenario.section-scenario",
      title: "Preflight Scenario",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "preflight",
        scenarioKind: "section",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        spAtisInfo: ALPHA_ATIS,
        spClearanceInfo: ALPHA_CLEARANCE,
        instruction: "G-ABCD at Stand 3, Brindale. Complete the full preflight sequence: request aerodrome information, receive and read back the departure clearance, then report ready for engine start.",
        spScenarioSteps: PREFLIGHT_SCENARIO_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

/*
 * Checkpoint removed from active module. First contact and startup skills
 * are assessed through the Preflight Scenario (topic 3).
 */

/* Assemble the Preflight module — 3 topics */
const preflight: Module = {
  id: "sp-preflight",
  name: "Preflight & Initial Contact",
  subtitle: "Listen to ATIS, understand your departure clearance and complete the full preflight radio sequence.",
  unit: "topics",
  topics: [atisActiveTopic, departureClearanceTopic, preflightScenarioTopic],
  exercises: [
    ...atisActiveTopic.exercises,
    ...departureClearanceTopic.exercises,
    ...preflightScenarioTopic.exercises,
  ],
};

/* ------------------------------------------------------------------ */
/* 2. Taxi, Holding Point & Runway Entry  (blueprint v2 merged module) */
/* ------------------------------------------------------------------ */

/* ── Taxi module content builders ────────────────────────────────────
 *
 * All exercises map onto existing Student Pilot renderers — no new
 * interactive systems. Mechanics used:
 *   • taxi-lesson           — explanatory lesson with chart crop + ATC/readback example
 *   • clearance-construction — chip selection / ordering (Complete & Build)
 *   • readback-construction  — simulated readback trainer (mic)
 *   • decision-point         — multiple-choice comprehension / error detection
 *
 * Every operational ATC prompt carries displayText + spokenText
 * (G-ABCD → "Golf Alpha Bravo Charlie Delta", 36 → "three six", etc.).
 */

function taxiSegType(text: string): SpClearanceSegment["segmentType"] {
  if (text.startsWith("G-ABCD")) return "callsign";
  if (/runway/i.test(text)) return "runway";
  return "additional-instruction";
}

/** Interleave distractors and expected chips so the bank never spells the answer. */
function mixChips(expected: SpClearanceSegment[], distractors: SpClearanceSegment[]): SpClearanceSegment[] {
  const out: SpClearanceSegment[] = [];
  const n = Math.max(expected.length, distractors.length);
  for (let i = 0; i < n; i++) {
    if (distractors[i]) out.push(distractors[i]);
    if (expected[i]) out.push(expected[i]);
  }
  return out;
}

/** Chip selection / ordering exercise (clearance-construction, single round). */
function taxiChipExercise(opts: {
  id: string;
  title: string;
  description: string;
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
  screenKicker?: string;
  headerInstruction?: string;
}): Exercise {
  const expectedSegments: SpClearanceSegment[] = opts.expected.map((e) => ({
    id: e.id, text: e.text, spoken: e.spoken, segmentType: taxiSegType(e.text),
  }));
  const distractorSegments: SpClearanceSegment[] = opts.distractors.map((d) => ({
    id: d.id, text: d.text, segmentType: "distractor",
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
      phase: "taxi",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

/** Simulated readback trainer (readback-construction; one or more rounds). */
function taxiReadbackExercise(opts: {
  id: string;
  title: string;
  description: string;
  headerInstruction?: string;
  rounds: {
    id: string;
    atcText: string;
    atcSpoken: string;
    expectedReadback: string;
    expectedReadbackSpoken: string;
    runway?: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: r.runway ?? "-",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: r.runway ?? "-", direction: "-", callsign: "G-ABCD" },
    interactionMode: "simulated-readback",
  }));
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Readback",
    free: false,
    content: {
      blockType: "readback-construction",
      phase: "taxi",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

/** Multiple-choice comprehension / error-detection (decision-point). */
function taxiChoiceExercise(opts: {
  id: string;
  title: string;
  description: string;
  instruction: string;
  options: SpOption[];
  correctId: string;
  atcDisplay?: string;
  atcSpoken?: string;
  atcHidden?: boolean;
  shownReadback?: string;
  shownReadbackLabel?: string;
  chartCrop?: string;
  screenKicker?: string;
  question?: string;
  atcLabel?: string;
}): Exercise {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Choice",
    free: false,
    content: {
      blockType: "decision-point",
      phase: "taxi",
      spVisualMode: "none",
      instruction: opts.instruction,
      spQuestion: opts.question,
      spScreenKicker: opts.screenKicker,
      spAtcLabel: opts.atcLabel,
      spOptions: opts.options,
      spCorrectOptionId: opts.correctId,
      spAtcDisplay: opts.atcDisplay,
      spAtcSpoken: opts.atcSpoken,
      spAtcHidden: opts.atcHidden,
      spShownReadback: opts.shownReadback,
      spShownReadbackLabel: opts.shownReadbackLabel,
      spChartCrop: opts.chartCrop,
    } satisfies ExerciseContent,
  };
}

/** Explanatory taxi lesson with a chart crop, key points and worked example. */
function taxiLessonExercise(opts: {
  id: string;
  title: string;
  description: string;
  lessonBody: string;
  points: string[];
  examples: SpLessonExample[];
  chartCrop: string;
}): Exercise {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Lesson",
    free: false,
    content: {
      blockType: "taxi-lesson",
      phase: "taxi",
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: opts.chartCrop,
    } satisfies ExerciseContent,
  };
}

const aerodromeChartTopic: Topic = {
  id: "sp-taxi.aerodrome-chart",
  name: "Aerodrome Chart",
  description: "Read the chart and understand the ground layout before taxi.",
  unit: "lesson",
  exercises: [
    {
      id: "sp-taxi.aerodrome-chart.lesson",
      title: "Read the aerodrome chart",
      type: "Lesson",
      description: "Runways, aprons, taxiways and holding points explained.",
      free: false,
      content: {
        instruction:
          "Before taxi, understand the runways, aprons, taxiways and holding points you will hear in ATC instructions.",
        blockType: "aerodrome-chart",
        phase: "taxi",
      } satisfies ExerciseContent,
    },
  ],
};

/* ── Section 2 — Complex Taxi Clearances (1 lesson + 4 exercises) ───── */
const complexClearancesTopic: Topic = {
  id: "sp-taxi.complex-clearances",
  name: "Complex Taxi Clearances",
  description: "Understand and read back multi-part taxi clearances.",
  unit: "exercises",
  exercises: [
    taxiLessonExercise({
      id: "sp-taxi.complex-clearances.lesson",
      title: "Anatomy of a taxi clearance",
      description: "The parts of a taxi clearance and the readback order.",
      chartCrop: "apron",
      lessonBody:
        "A taxi clearance is built from predictable parts. Hear each part, then read them back in the same order, ending with your callsign.",
      points: [
        "Callsign — who the clearance is for (G-ABCD).",
        "Taxi instruction + holding point — where to taxi to (e.g. holding point B2).",
        "Taxiways — the route to follow (e.g. via Alfa, Delta and Bravo).",
        "Clearance limit / hold short — where you must stop.",
        "Read back the route and limit, then your callsign.",
      ],
      examples: [
        {
          label: "Taxi to a holding point",
          atcText: "G-ABCD, taxi to holding point B2 via Alfa, Delta and Bravo.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to holding point Bravo two via Alfa, Delta and Bravo.",
          readback: "Taxi to holding point B2 via Alfa, Delta and Bravo, G-ABCD.",
        },
        {
          label: "Taxi with hold short",
          atcText: "G-ABCD, taxi via Alfa and Bravo, hold short of runway 36 at B1.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi via Alfa and Bravo, hold short of runway three six at Bravo one.",
          readback: "Taxi via Alfa and Bravo, hold short of runway 36 at B1, G-ABCD.",
        },
      ],
    }),

    /* Ex 2 — Build the clearance (chips/ordering — merged Complete + Build readback) */
    taxiChipExercise({
      id: "sp-taxi.complex-clearances.build-the-clearance",
      title: "Build the clearance",
      description: "Listen to the clearance, then place the readback parts in order.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the clearance, then place the readback parts in order.",
      atcText: "G-ABCD, taxi to holding point B2 via Alfa, Delta and Bravo.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to holding point Bravo two via Alfa, Delta and Bravo.",
      prompt: "Build the correct readback.",
      helperText: "Listen to the clearance, then place the readback parts in order.",
      expected: [
        { id: "bc-dest", text: "Taxi to holding point B2" },
        { id: "bc-route", text: "via Alfa, Delta and Bravo" },
        { id: "bc-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bc-d-cross", text: "cross runway 36" },
        { id: "bc-d-hold", text: "hold short runway 36" },
        { id: "bc-d-charlie", text: "via Charlie" },
      ],
      expectedSentence: "Taxi to holding point B2 via Alfa, Delta and Bravo, G-ABCD.",
      expectedSpoken: "Taxi to holding point Bravo two via Alfa, Delta and Bravo, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Your readback includes the holding point, route and callsign.",
      incorrectFeedback: "Check the holding point, taxiways and callsign. Do not add instructions ATC did not give.",
    }),

    /* Ex 3 — Readback trainer (mic) */
    taxiReadbackExercise({
      id: "sp-taxi.complex-clearances.readback-trainer",
      title: "Readback trainer",
      description: "Listen, then read back the full clearance.",
      headerInstruction: "Listen to the clearance and say the complete readback.",
      rounds: [
        {
          id: "sp-taxi.complex-clearances.readback-trainer.r1",
          atcText: "G-ABCD, taxi via Alfa and Bravo, hold short of runway 36 at B1.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi via Alfa and Bravo, hold short of runway three six at Bravo one.",
          expectedReadback: "Taxi via Alfa and Bravo, hold short of runway 36 at B1, G-ABCD.",
          expectedReadbackSpoken: "Taxi via Alfa and Bravo, hold short of runway three six at Bravo one, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),

    /* Ex 4 — Missing item (error detection) */
    taxiChoiceExercise({
      id: "sp-taxi.complex-clearances.missing-item",
      title: "Missing item",
      description: "Spot what the pilot left out of the readback.",
      screenKicker: "Error detection",
      instruction: "Listen to the clearance and spot what the pilot left out.",
      question: "What is missing from the readback?",
      atcDisplay: "G-ABCD, taxi to holding point B2 via Alfa, Delta and Bravo.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to holding point Bravo two via Alfa, Delta and Bravo.",
      atcHidden: true,
      shownReadback: "Taxi to holding point B2 via Alfa and Bravo, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "mi-delta", text: "Delta", feedback: "Correct. The readback missed Delta, so the route is incomplete." },
        { id: "mi-bravo", text: "Bravo", feedback: "Bravo was read back correctly. Compare the taxiways: Alfa, Delta and Bravo." },
        { id: "mi-b2", text: "B2", feedback: "The holding point B2 was read back correctly. Look again at the taxiway list." },
        { id: "mi-alfa", text: "Alfa", feedback: "Alfa was read back correctly. The missing taxiway is between Alfa and Bravo." },
      ],
      correctId: "mi-delta",
    }),

    /* Ex 5 — Full clearance challenge (mic) */
    taxiReadbackExercise({
      id: "sp-taxi.complex-clearances.full-clearance-challenge",
      title: "Full clearance challenge",
      description: "The longest clearance in this section.",
      headerInstruction: "Listen to the full clearance and read it back completely.",
      rounds: [
        {
          id: "sp-taxi.complex-clearances.full-clearance-challenge.r1",
          atcText: "G-ABCD, taxi from Stand 3 via Alfa, Delta and Bravo, hold short of runway 36 at B2.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi from Stand three via Alfa, Delta and Bravo, hold short of runway three six at Bravo two.",
          expectedReadback: "Taxi from Stand 3 via Alfa, Delta and Bravo, hold short of runway 36 at B2, G-ABCD.",
          expectedReadbackSpoken: "Taxi from Stand three via Alfa, Delta and Bravo, hold short of runway three six at Bravo two, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),
  ],
};

/* ── Section 3 — Traffic & Taxi Changes (1 lesson + 5 exercises) ────── */
const trafficAndChangesTopic: Topic = {
  id: "sp-taxi.traffic-and-changes",
  name: "Traffic & Taxi Changes",
  description: "Respond to traffic, conditional instructions and revised routes.",
  unit: "exercises",
  exercises: [
    taxiLessonExercise({
      id: "sp-taxi.traffic-and-changes.lesson",
      title: "Traffic and conditional taxi instructions",
      description: "Give way, follow, behind… behind and revised routes.",
      chartCrop: "e-crossing",
      lessonBody:
        "While taxiing, ATC may link your movement to other traffic or change your route. Listen for the condition first, then act, then read it back.",
      points: [
        "Give way — stop and let the other aircraft pass first.",
        "Follow / after the aircraft passes — your move depends on that traffic.",
        "Behind… behind — a conditional clearance; the second “behind” is required.",
        "Revised route — the taxiways or clearance limit have changed.",
        "Continue taxi — resume once the condition is met.",
      ],
      examples: [
        {
          label: "Conditional crossing",
          atcText: "G-ABCD, behind the Cessna passing left to right, cross runway 36 behind.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, behind the Cessna passing left to right, cross runway three six behind.",
          readback: "Behind the Cessna passing left to right, cross runway 36 behind, G-ABCD.",
        },
      ],
    }),

    /* Ex 1 — Give way acknowledgement */
    taxiChoiceExercise({
      id: "sp-taxi.traffic-and-changes.give-way",
      title: "Give way acknowledgement",
      description: "Choose the correct acknowledgement.",
      screenKicker: "Choice",
      instruction: "Listen to the traffic instruction and choose the correct acknowledgement.",
      question: "How do you acknowledge this instruction?",
      atcDisplay: "G-ABCD, give way to the aircraft from your right.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, give way to the aircraft from your right.",
      atcHidden: true,
      options: [
        { id: "gw-correct", text: "Giving way, G-ABCD.", feedback: "Correct. You must give way before continuing." },
        { id: "gw-continue", text: "Continuing taxi, G-ABCD.", feedback: "No — you were told to give way, so you must stop and let the other aircraft pass first." },
        { id: "gw-cross", text: "Crossing runway 36, G-ABCD.", feedback: "No — there is no crossing clearance here. You were told to give way." },
        { id: "gw-ready", text: "Ready for departure, G-ABCD.", feedback: "No — that is a departure report, not a give-way acknowledgement." },
      ],
      correctId: "gw-correct",
    }),

    /* Ex 2 — Follow traffic (chips) */
    taxiChipExercise({
      id: "sp-taxi.traffic-and-changes.follow-traffic",
      title: "Follow traffic",
      description: "Build the readback for a follow instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the traffic instruction, then build your readback in order.",
      atcText: "G-ABCD, follow the Cessna ahead via Bravo.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, follow the Cessna ahead via Bravo.",
      prompt: "Build your readback in order.",
      expected: [
        { id: "ft-follow", text: "Following the Cessna ahead" },
        { id: "ft-via", text: "via Bravo" },
        { id: "ft-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ft-d-giveway", text: "Giving way to the Cessna" },
        { id: "ft-d-delta", text: "via Delta" },
        { id: "ft-d-behind", text: "behind the Cessna" },
      ],
      expectedSentence: "Following the Cessna ahead via Bravo, G-ABCD.",
      expectedSpoken: "Following the Cessna ahead via Bravo, Golf Alpha Bravo Charlie Delta.",
    }),

    /* Ex 3 — Behind… behind conditional clearance (ordering) */
    taxiChipExercise({
      id: "sp-taxi.traffic-and-changes.behind-behind",
      title: "Behind… behind clearance",
      description: "Order a conditional crossing readback.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the conditional clearance, then order both “behind” parts.",
      atcText: "G-ABCD, behind the Cessna passing left to right, cross runway 36 behind.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, behind the Cessna passing left to right, cross runway three six behind.",
      prompt: "Order the readback. Both “behind” parts are required.",
      expected: [
        { id: "bb-behind1", text: "Behind the Cessna" },
        { id: "bb-passing", text: "passing left to right" },
        { id: "bb-cross", text: "cross runway 36" },
        { id: "bb-behind2", text: "behind" },
        { id: "bb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bb-d-now", text: "cross runway 36 now" },
        { id: "bb-d-hold", text: "hold short" },
        { id: "bb-d-giveway", text: "give way" },
      ],
      expectedSentence: "Behind the Cessna passing left to right, cross runway 36 behind, G-ABCD.",
      expectedSpoken: "Behind the Cessna passing left to right, cross runway three six behind, Golf Alpha Bravo Charlie Delta.",
    }),

    /* Ex 4 — Revised taxi route (compare) */
    taxiChoiceExercise({
      id: "sp-taxi.traffic-and-changes.revised-route",
      title: "Revised taxi route",
      description: "Compare the original and revised clearances.",
      screenKicker: "Choice",
      instruction: "Compare the original clearance with the revised route and identify what changed.",
      question: "What changed?",
      shownReadback: "Taxi to holding point B1 via Alfa and Bravo.",
      shownReadbackLabel: "Original clearance",
      atcDisplay: "G-ABCD, revised taxi route, continue via Delta to holding point B2.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, revised taxi route, continue via Delta to holding point Bravo two.",
      atcHidden: true,
      atcLabel: "Revised clearance",
      options: [
        { id: "rr-both", text: "The route changed to Delta and the clearance limit changed to B2.", feedback: "Correct. Both the taxi route and the clearance limit changed." },
        { id: "rr-runway", text: "Only the runway in use changed.", feedback: "No runway change was given — look at the route and the holding point." },
        { id: "rr-squawk", text: "Only the squawk changed.", feedback: "No squawk is involved in a taxi route change." },
        { id: "rr-nothing", text: "Nothing changed.", feedback: "Both the route (now Delta) and the limit (now B2) changed." },
      ],
      correctId: "rr-both",
    }),

    /* Ex 5 — Readback trainer: traffic/change (mic) */
    taxiReadbackExercise({
      id: "sp-taxi.traffic-and-changes.readback-trainer",
      title: "Readback trainer: traffic change",
      description: "Read back a conditional taxi instruction.",
      headerInstruction: "Listen to the traffic instruction, then read it back with the condition first.",
      rounds: [
        {
          id: "sp-taxi.traffic-and-changes.readback-trainer.r1",
          atcText: "G-ABCD, after the aircraft passes, continue taxi via Bravo to holding point B1.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, after the aircraft passes, continue taxi via Bravo to holding point Bravo one.",
          expectedReadback: "After the aircraft passes, continue taxi via Bravo to holding point B1, G-ABCD.",
          expectedReadbackSpoken: "After the aircraft passes, continue taxi via Bravo to holding point Bravo one, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),
  ],
};

/* ── Section 4 — Runway Crossing (1 lesson + 5 exercises) ───────────── */
const runwayCrossingTopic: Topic = {
  id: "sp-taxi.runway-crossing",
  name: "Runway Crossing",
  description: "Understand explicit runway-crossing clearances and limits.",
  unit: "exercises",
  exercises: [
    taxiLessonExercise({
      id: "sp-taxi.runway-crossing.lesson",
      title: "Taxi to vs cross runway",
      description: "Why “taxi to” never authorises a crossing.",
      chartCrop: "d-crossing",
      lessonBody:
        "Taxiing to a holding point is not the same as crossing the runway. You may only cross when ATC explicitly clears you to cross.",
      points: [
        "“Taxi to holding point B1” — stop at B1. Crossing is NOT authorised.",
        "“Cross runway 36 at B1” — crossing IS authorised.",
        "A crossing clearance names the runway and the crossing point.",
        "After crossing, follow the new clearance limit (e.g. continue via Charlie).",
        "Never add a crossing to your readback unless ATC said it.",
      ],
      examples: [
        {
          label: "Crossing authorised",
          atcText: "G-ABCD, cross runway 36 at B1, continue via Charlie.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, cross runway three six at Bravo one, continue via Charlie.",
          readback: "Cross runway 36 at B1, continue via Charlie, G-ABCD.",
        },
      ],
    }),

    /* Ex 1 — Is crossing authorised? */
    taxiChoiceExercise({
      id: "sp-taxi.runway-crossing.is-crossing-authorised",
      title: "Is crossing authorised?",
      description: "Decide whether you may cross the runway.",
      screenKicker: "Choice",
      instruction: "Listen to the clearance and decide if you are cleared to cross the runway.",
      question: "Are you cleared to cross runway 36?",
      atcDisplay: "G-ABCD, taxi to holding point B1.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to holding point Bravo one.",
      atcHidden: true,
      chartCrop: "d-crossing",
      options: [
        { id: "ica-no", text: "No. Stop at B1 — crossing is not authorised.", feedback: "Correct. “Taxi to holding point B1” does not include a crossing clearance." },
        { id: "ica-yes-cross", text: "Yes, cross runway 36.", feedback: "No crossing was cleared. You must stop at B1." },
        { id: "ica-yes-lineup", text: "Yes, line up runway 36.", feedback: "No line-up was cleared either. Stop at B1." },
        { id: "ica-yes-continue", text: "Yes, continue without stopping.", feedback: "No — B1 is your clearance limit. Stop there." },
      ],
      correctId: "ica-no",
    }),

    /* Ex 2 — Complete crossing clearance (chips) */
    taxiChipExercise({
      id: "sp-taxi.runway-crossing.complete-crossing",
      title: "Complete crossing clearance",
      description: "Select runway, crossing point and continuation.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the crossing clearance, then build the readback in order.",
      atcText: "G-ABCD, cross runway 36 at B1, continue via Charlie.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, cross runway three six at Bravo one, continue via Charlie.",
      prompt: "Build the crossing readback in order.",
      expected: [
        { id: "ccx-cross", text: "Cross runway 36" },
        { id: "ccx-at", text: "at B1" },
        { id: "ccx-via", text: "continue via Charlie" },
        { id: "ccx-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ccx-d-05", text: "Cross runway 05" },
        { id: "ccx-d-c1", text: "at C1" },
        { id: "ccx-d-delta", text: "continue via Delta" },
      ],
      expectedSentence: "Cross runway 36 at B1, continue via Charlie, G-ABCD.",
      expectedSpoken: "Cross runway three six at Bravo one, continue via Charlie, Golf Alpha Bravo Charlie Delta.",
    }),

    /* Ex 3 — Readback crossing (mic) */
    taxiReadbackExercise({
      id: "sp-taxi.runway-crossing.readback-crossing",
      title: "Readback crossing",
      description: "Read back an authorised crossing.",
      headerInstruction: "Listen to the crossing clearance and read it back completely.",
      rounds: [
        {
          id: "sp-taxi.runway-crossing.readback-crossing.r1",
          atcText: "G-ABCD, cross runway 36 at B1, continue via Charlie.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, cross runway three six at Bravo one, continue via Charlie.",
          expectedReadback: "Cross runway 36 at B1, continue via Charlie, G-ABCD.",
          expectedReadbackSpoken: "Cross runway three six at Bravo one, continue via Charlie, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),

    /* Ex 4 — Incorrect readback detection */
    taxiChoiceExercise({
      id: "sp-taxi.runway-crossing.incorrect-readback",
      title: "Incorrect readback detection",
      description: "Find the error in the pilot's readback.",
      screenKicker: "Error detection",
      instruction: "Compare the clearance and readback, then identify the mistake.",
      question: "What is wrong with this readback?",
      atcDisplay: "G-ABCD, taxi to holding point B1.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to holding point Bravo one.",
      atcHidden: true,
      chartCrop: "d-crossing",
      shownReadback: "Taxi to holding point B1 and cross runway 36, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "ir-added", text: "The pilot added a runway crossing that ATC did not clear.", feedback: "Correct. Never add a runway crossing unless ATC explicitly clears it." },
        { id: "ir-hp", text: "The holding point is wrong.", feedback: "B1 matches the clearance — look at what else was added." },
        { id: "ir-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the extra instruction." },
        { id: "ir-none", text: "Nothing is wrong.", feedback: "There is an error: the pilot added an uncleared crossing." },
      ],
      correctId: "ir-added",
    }),

    /* Ex 5 — Cross and hold (mic) */
    taxiReadbackExercise({
      id: "sp-taxi.runway-crossing.cross-and-hold",
      title: "Cross and hold",
      description: "Read back a crossing with a new clearance limit.",
      headerInstruction: "Listen to the clearance and read back the crossing and new hold point.",
      rounds: [
        {
          id: "sp-taxi.runway-crossing.cross-and-hold.r1",
          atcText: "G-ABCD, cross runway 36 at B1 and hold at C1.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, cross runway three six at Bravo one and hold at Charlie one.",
          expectedReadback: "Cross runway 36 at B1 and hold at C1, G-ABCD.",
          expectedReadbackSpoken: "Cross runway three six at Bravo one and hold at Charlie one, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),
  ],
};

/* ── Section 5 — Holding Point & Runway Entry (1 lesson + 5 exercises) ─ */
const holdingPointAndEntryTopic: Topic = {
  id: "sp-taxi.holding-point-and-entry",
  name: "Holding Point & Runway Entry",
  description: "Move from the holding point to backtrack and line-up.",
  unit: "exercises",
  exercises: [
    taxiLessonExercise({
      id: "sp-taxi.holding-point-and-entry.lesson",
      title: "From holding point to line-up",
      description: "Hold short, enter, backtrack, line up and report ready.",
      chartCrop: "v-vertex",
      lessonBody:
        "At the holding point you wait until ATC clears you onto the runway. Runway entry, backtrack and line-up are always explicitly cleared. You then report ready — the take-off clearance comes later, in the next module.",
      points: [
        "Hold short — stop and wait at the holding point.",
        "Enter runway — only when ATC clears you onto the runway.",
        "Backtrack — taxi along the runway toward the threshold.",
        "Line up + report when ready — get into position and report.",
        "“Ready for departure” is your report — not a take-off clearance.",
      ],
      examples: [
        {
          label: "Entry, backtrack and line up",
          atcText: "G-ABCD, enter runway 36 at B2, backtrack and line up runway 36. Report when ready.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, enter runway three six at Bravo two, backtrack and line up runway three six. Report when ready.",
          readback: "Enter runway 36 at B2, backtrack and line up runway 36, report when ready, G-ABCD.",
        },
      ],
    }),

    /* Ex 1 — Hold short and report ready (2-round readback) */
    taxiReadbackExercise({
      id: "sp-taxi.holding-point-and-entry.hold-short-ready",
      title: "Hold short and report ready",
      description: "Acknowledge hold short, then report ready.",
      headerInstruction: "Listen to each instruction and read it back.",
      rounds: [
        {
          id: "sp-taxi.holding-point-and-entry.hold-short-ready.r1",
          atcText: "G-ABCD, hold short of runway 36.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, hold short of runway three six.",
          expectedReadback: "Holding short runway 36, G-ABCD.",
          expectedReadbackSpoken: "Holding short runway three six, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
        {
          id: "sp-taxi.holding-point-and-entry.hold-short-ready.r2",
          atcText: "G-ABCD, report when ready.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, report when ready.",
          expectedReadback: "Ready for departure, G-ABCD.",
          expectedReadbackSpoken: "Ready for departure, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),

    /* Ex 2 — Enter runway (ordering) */
    taxiChipExercise({
      id: "sp-taxi.holding-point-and-entry.enter-runway",
      title: "Enter runway",
      description: "Order the runway-entry readback.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the runway-entry clearance, then order the readback.",
      atcText: "G-ABCD, enter runway 36 at B2.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, enter runway three six at Bravo two.",
      prompt: "Order the runway-entry readback.",
      expected: [
        { id: "er-enter", text: "Enter runway 36" },
        { id: "er-at", text: "at B2" },
        { id: "er-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "er-d-lineup", text: "line up runway 36" },
        { id: "er-d-cross", text: "cross runway 36" },
        { id: "er-d-b1", text: "at B1" },
      ],
      expectedSentence: "Enter runway 36 at B2, G-ABCD.",
      expectedSpoken: "Enter runway three six at Bravo two, Golf Alpha Bravo Charlie Delta.",
    }),

    /* Ex 3 — Backtrack and line up (ordering) */
    taxiChipExercise({
      id: "sp-taxi.holding-point-and-entry.backtrack-line-up",
      title: "Backtrack and line up",
      description: "Order the full entry, backtrack and line-up readback.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the full clearance, then order the readback.",
      atcText: "G-ABCD, enter runway 36 at B2, backtrack and line up runway 36. Report when ready.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, enter runway three six at Bravo two, backtrack and line up runway three six. Report when ready.",
      prompt: "Order the full readback.",
      expected: [
        { id: "bl-enter", text: "Enter runway 36 at B2" },
        { id: "bl-backtrack", text: "backtrack" },
        { id: "bl-lineup", text: "and line up runway 36" },
        { id: "bl-report", text: "report when ready" },
        { id: "bl-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bl-d-cross", text: "cross runway 36" },
        { id: "bl-d-hold", text: "hold short" },
        { id: "bl-d-vacate", text: "vacate runway" },
      ],
      expectedSentence: "Enter runway 36 at B2, backtrack and line up runway 36, report when ready, G-ABCD.",
      expectedSpoken: "Enter runway three six at Bravo two, backtrack and line up runway three six, report when ready, Golf Alpha Bravo Charlie Delta.",
    }),

    /* Ex 4 — Missing report when ready (error detection) */
    taxiChoiceExercise({
      id: "sp-taxi.holding-point-and-entry.missing-report",
      title: "Missing report when ready",
      description: "Spot the omitted instruction.",
      screenKicker: "Error detection",
      instruction: "Listen to the clearance and compare it with the pilot readback.",
      question: "What is missing from the readback?",
      atcDisplay: "G-ABCD, enter runway 36 at B2, backtrack and line up runway 36. Report when ready.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, enter runway three six at Bravo two, backtrack and line up runway three six. Report when ready.",
      atcHidden: true,
      chartCrop: "v-vertex",
      shownReadback: "Enter runway 36 at B2, backtrack and line up runway 36, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "mr-report", text: "Report when ready.", feedback: "Correct. ATC asked you to report when ready, so the readback must include it." },
        { id: "mr-b2", text: "The holding point B2.", feedback: "B2 was read back correctly. Look at the instruction at the end of the clearance." },
        { id: "mr-runway", text: "The runway number.", feedback: "Runway 36 was read back. Look at what ATC asked you to do once ready." },
        { id: "mr-cs", text: "The callsign.", feedback: "The callsign G-ABCD is present. Something else is missing." },
      ],
      correctId: "mr-report",
    }),

    /* Ex 5 — Ready for departure (no audio choice) */
    taxiChoiceExercise({
      id: "sp-taxi.holding-point-and-entry.ready-for-departure",
      title: "Ready for departure",
      description: "Report correctly once lined up.",
      screenKicker: "Choice",
      instruction: "You are lined up and waiting. Choose the correct report.",
      question: "You are lined up on runway 36. What do you report?",
      chartCrop: "v-vertex",
      options: [
        { id: "rfd-correct", text: "Ready for departure, G-ABCD.", feedback: "Correct. The take-off clearance comes next, in the following module." },
        { id: "rfd-takeoff", text: "Cleared for take-off, G-ABCD.", feedback: "No — you never say that. A take-off clearance is issued by ATC, in the next module." },
        { id: "rfd-lining", text: "Lining up, G-ABCD.", feedback: "You are already lined up — now report that you are ready." },
        { id: "rfd-engine", text: "Ready for engine start, G-ABCD.", feedback: "That belongs at the stand, not at line-up. Report ready for departure." },
      ],
      correctId: "rfd-correct",
    }),
  ],
};

/* ── Section 6 — Taxi to Line-Up Mission (1 mission) ────────────────── */
const lineUpMissionTopic: Topic = {
  id: "sp-taxi.line-up-mission",
  name: "Taxi to Line-Up Scenario",
  description: "Complete a guided ground operation from stand to ready for departure.",
  unit: "scenario",
  exercises: [
    {
      id: "sp-taxi.line-up-mission.mission",
      title: "Taxi to Line-Up Scenario",
      description: "A continuous radio exchange from Stand 3 to line-up.",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "taxi",
        scenarioKind: "mission",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        instruction:
          "G-ORDA at Stand 3, Brindale. Taxi to the holding point, handle one traffic instruction, then enter, backtrack, line up and report ready for departure.",
        spScenarioKicker: "Scenario",
        spScenarioHeading: "Taxi to Line-Up Scenario",
        spScenarioCompletionNote: "Ground phase complete. G-ORDA is lined up on runway 36, ready for departure.",
        spScenarioSteps: TAXI_LINEUP_MISSION_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

const taxiTopics = [
  aerodromeChartTopic,
  complexClearancesTopic,
  trafficAndChangesTopic,
  runwayCrossingTopic,
  holdingPointAndEntryTopic,
  lineUpMissionTopic,
];

const taxi: Module = {
  id: "sp-taxi",
  name: "Taxi, Holding Point & Runway Entry",
  subtitle: "Taxi from stand to runway entry, backtrack, line up and report ready for departure.",
  unit: "topics",
  topics: taxiTopics,
  exercises: taxiTopics.flatMap((topic) => topic.exercises),
};

/* ------------------------------------------------------------------ */
/* 3. Takeoff & Initial Departure  (real content — 3 topics)          */
/* ------------------------------------------------------------------ */

/* ── Content builders for takeoff module ───────────────────────────── */

function toSegType(text: string): SpClearanceSegment["segmentType"] {
  if (text.startsWith("G-ABCD")) return "callsign";
  if (/runway/i.test(text)) return "runway";
  return "additional-instruction";
}

function toMixChips(
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

/** Chip/ordering exercise for takeoff module. */
function toChipExercise(opts: {
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
    id: e.id, text: e.text, spoken: e.spoken, segmentType: toSegType(e.text),
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
    chipBank: toMixChips(expectedSegments, distractorSegments),
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
      phase: "takeoff",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

/** Multiple-choice exercise for takeoff module. */
function toChoiceExercise(opts: {
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
      phase: "takeoff",
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

/** Simulated readback trainer for takeoff module. */
function toReadbackExercise(opts: {
  id: string;
  title: string;
  description: string;
  headerInstruction: string;
  rounds: {
    id: string;
    atcText: string;
    atcSpoken: string;
    expectedReadback: string;
    expectedReadbackSpoken: string;
    runway?: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: r.runway ?? "-",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: r.runway ?? "-", direction: "-", callsign: "G-ABCD" },
    interactionMode: "simulated-readback",
  }));
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Readback",
    free: false,
    content: {
      blockType: "readback-construction",
      phase: "takeoff",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

/** Explanatory lesson for takeoff module. */
function toLessonExercise(opts: {
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
      phase: "takeoff",
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: undefined,
      spVisualMode: "none",
    } satisfies ExerciseContent,
  };
}

/* ── Section 1 — Takeoff Clearance (1 lesson + 5 exercises) ────────── */
const takeoffClearanceTopic: Topic = {
  id: "sp-takeoff.takeoff-clearance",
  name: "Takeoff Clearance",
  description: "Read back the runway, wind and clearance.",
  unit: "exercises",
  exercises: [
    toLessonExercise({
      id: "sp-takeoff.takeoff-clearance.lesson",
      title: "Cleared for take-off",
      description: "The structure and readback of a takeoff clearance.",
      lessonBody:
        "A takeoff clearance confirms the runway and authorises you to start the takeoff roll.",
      points: [
        "Read back the runway.",
        'Read back "cleared for take-off".',
        "Add your callsign.",
        "Do not add anything ATC did not clear.",
      ],
      examples: [
        {
          label: "Takeoff clearance",
          atcText: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared for take-off.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees, eight knots, cleared for take-off.",
          readback: "Runway 36, cleared for take-off, G-ABCD.",
        },
      ],
    }),

    /* Ex 1 — Identify takeoff clearance */
    toChoiceExercise({
      id: "sp-takeoff.takeoff-clearance.identify-clearance",
      title: "Identify takeoff clearance",
      description: "Decide if ATC has cleared you for take-off.",
      screenKicker: "Choice",
      instruction: "Listen and decide if ATC has cleared you for take-off.",
      question: "Are you cleared for take-off?",
      atcDisplay: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared for take-off.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees, eight knots, cleared for take-off.",
      atcHidden: true,
      options: [
        { id: "itc-yes", text: 'Yes. ATC said "cleared for take-off".', feedback: '"Cleared for take-off" is the authorisation to begin the takeoff roll.' },
        { id: "itc-wind", text: "No. ATC only gave the wind.", feedback: 'ATC gave the wind, but also said "cleared for take-off" — that is the clearance.' },
        { id: "itc-runway", text: "No. ATC only confirmed the runway.", feedback: 'ATC confirmed the runway and also said "cleared for take-off".' },
        { id: "itc-taxi", text: "No. You must request taxi again.", feedback: 'You are already at the runway. "Cleared for take-off" authorises the takeoff roll.' },
      ],
      correctId: "itc-yes",
    }),

    /* Ex 2 — Complete the takeoff readback (chips) */
    toChipExercise({
      id: "sp-takeoff.takeoff-clearance.complete-readback",
      title: "Complete the takeoff readback",
      description: "Build the correct readback from the clearance.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the clearance and build the readback in order.",
      atcText: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared for take-off.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees, eight knots, cleared for take-off.",
      prompt: "Build the readback in order.",
      helperText: "Include the runway, the takeoff clearance and your callsign.",
      expected: [
        { id: "cr-runway", text: "Runway 36" },
        { id: "cr-cleared", text: "cleared for take-off" },
        { id: "cr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cr-d-05", text: "Runway 05" },
        { id: "cr-d-lineup", text: "line-up runway 36" },
        { id: "cr-d-taxi", text: "taxi to holding point" },
      ],
      expectedSentence: "Runway 36, cleared for take-off, G-ABCD.",
      expectedSpoken: "Runway three six, cleared for take-off, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. The readback includes the runway, the takeoff clearance and the callsign.",
      incorrectFeedback: "Check the order: runway · cleared for take-off · callsign.",
    }),

    /* Ex 3 — Build the takeoff readback (ordering) */
    toChipExercise({
      id: "sp-takeoff.takeoff-clearance.build-readback",
      title: "Build the takeoff readback",
      description: "Place the readback parts in the correct order.",
      screenKicker: "Listening",
      headerInstruction: "Place the readback parts in the correct order.",
      atcText: "G-ABCD, runway 36, cleared for take-off.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared for take-off.",
      prompt: "Order the readback parts.",
      expected: [
        { id: "br-runway", text: "Runway 36" },
        { id: "br-cleared", text: "cleared for take-off" },
        { id: "br-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "br-d-taxi", text: "taxi to holding point B2" },
        { id: "br-d-lineup", text: "line up runway 36" },
        { id: "br-d-ready", text: "ready for departure" },
      ],
      expectedSentence: "Runway 36, cleared for take-off, G-ABCD.",
      expectedSpoken: "Runway three six, cleared for take-off, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Keep the readback short and exact.",
      incorrectFeedback: "The readback is: runway · cleared for take-off · callsign.",
    }),

    /* Ex 4 — Wrong runway readback (error detection) */
    toChoiceExercise({
      id: "sp-takeoff.takeoff-clearance.wrong-runway",
      title: "Wrong runway readback",
      description: "Identify the mistake in the pilot readback.",
      screenKicker: "Error detection",
      instruction: "Compare the clearance and the readback, then identify the mistake.",
      question: "What is wrong with the readback?",
      atcDisplay: "G-ABCD, runway 36, cleared for take-off.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared for take-off.",
      atcHidden: true,
      shownReadback: "Runway 05, cleared for take-off, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "wr-runway", text: "The runway is wrong. ATC cleared runway 36.", feedback: "Correct. A runway mismatch must be corrected before takeoff." },
        { id: "wr-cleared", text: "The clearance phrase is wrong.", feedback: '"Cleared for take-off" is correct. The error is in the runway number.' },
        { id: "wr-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the runway number." },
        { id: "wr-nothing", text: "Nothing is wrong.", feedback: "The pilot read back runway 05. ATC cleared runway 36 — that is a mismatch." },
      ],
      correctId: "wr-runway",
    }),

    /* Ex 5 — Readback trainer */
    toReadbackExercise({
      id: "sp-takeoff.takeoff-clearance.readback-trainer",
      title: "Readback trainer",
      description: "Listen to the takeoff clearance and say the correct readback.",
      headerInstruction: "Listen to the takeoff clearance and say the complete readback.",
      rounds: [
        {
          id: "sp-takeoff.takeoff-clearance.readback-trainer.r1",
          atcText: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared for take-off.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees, eight knots, cleared for take-off.",
          expectedReadback: "Runway 36, cleared for take-off, G-ABCD.",
          expectedReadbackSpoken: "Runway three six, cleared for take-off, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),
  ],
};

/* ── Section 2 — Initial Climb & Heading (1 lesson + 5 exercises) ─── */
const initialClimbTopic: Topic = {
  id: "sp-takeoff.initial-climb",
  name: "Initial Climb & Heading",
  description: "Read back climb and heading instructions after takeoff.",
  unit: "exercises",
  exercises: [
    toLessonExercise({
      id: "sp-takeoff.initial-climb.lesson",
      title: "Initial climb instructions",
      description: "The first climb and heading instructions after takeoff.",
      lessonBody:
        "After takeoff, ATC may give a simple climb or heading instruction. Read it back exactly.",
      points: [
        "After departure means after becoming airborne.",
        "Left and right must be read back correctly.",
        "Heading numbers must be exact.",
        "Include your callsign.",
      ],
      examples: [
        {
          label: "Turn right heading",
          atcText: "G-ABCD, after departure turn right heading 090.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, after departure turn right heading zero niner zero.",
          readback: "After departure turn right heading 090, G-ABCD.",
        },
      ],
    }),

    /* Ex 1 — Straight ahead or turn? */
    toChoiceExercise({
      id: "sp-takeoff.initial-climb.straight-or-turn",
      title: "Straight ahead or turn?",
      description: "Identify the initial departure instruction.",
      screenKicker: "Choice",
      instruction: "Listen and identify the initial departure instruction.",
      question: "What should you do after takeoff?",
      atcDisplay: "G-ABCD, after departure climb straight ahead.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, after departure climb straight ahead.",
      atcHidden: true,
      options: [
        { id: "st-straight", text: "Climb straight ahead.", feedback: "Correct. ATC instructed you to climb straight ahead." },
        { id: "st-right", text: "Turn right heading 090.", feedback: 'No right turn was issued. ATC said "climb straight ahead".' },
        { id: "st-left", text: "Turn left heading 270.", feedback: 'No left turn was issued. ATC said "climb straight ahead".' },
        { id: "st-circuit", text: "Enter the circuit.", feedback: 'Circuit entry is not part of this instruction. ATC said "climb straight ahead".' },
      ],
      correctId: "st-straight",
    }),

    /* Ex 2 — Complete the heading instruction (chips) */
    toChipExercise({
      id: "sp-takeoff.initial-climb.complete-heading",
      title: "Complete the heading instruction",
      description: "Build the readback for a turn and heading instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the instruction and build the readback in order.",
      atcText: "G-ABCD, after departure turn right heading 090.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, after departure turn right heading zero niner zero.",
      prompt: "Build the readback in order.",
      helperText: "Include the direction, heading and callsign.",
      expected: [
        { id: "ch-after", text: "After departure" },
        { id: "ch-right", text: "turn right" },
        { id: "ch-hdg", text: "heading 090" },
        { id: "ch-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ch-d-left", text: "turn left" },
        { id: "ch-d-270", text: "heading 270" },
        { id: "ch-d-rwy", text: "runway 36" },
      ],
      expectedSentence: "After departure turn right heading 090, G-ABCD.",
      expectedSpoken: "After departure turn right heading zero niner zero, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Direction, heading and callsign are all included.",
      incorrectFeedback: "Check: after departure · turn right · heading 090 · callsign.",
    }),

    /* Ex 3 — Build the departure readback (ordering) */
    toChipExercise({
      id: "sp-takeoff.initial-climb.build-departure-readback",
      title: "Build the departure readback",
      description: "Place the departure readback parts in order.",
      screenKicker: "Listening",
      headerInstruction: "Place the departure readback parts in order.",
      atcText: "G-ABCD, after departure maintain runway heading.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, after departure maintain runway heading.",
      prompt: "Order the readback parts.",
      expected: [
        { id: "bdr-after", text: "After departure" },
        { id: "bdr-maintain", text: "maintain runway heading" },
        { id: "bdr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bdr-d-cleared", text: "cleared for take-off" },
        { id: "bdr-d-downwind", text: "report downwind" },
        { id: "bdr-d-taxi", text: "taxi via Bravo" },
      ],
      expectedSentence: "After departure maintain runway heading, G-ABCD.",
      expectedSpoken: "After departure maintain runway heading, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You read back the departure instruction without adding extra items.",
      incorrectFeedback: "Order: after departure · maintain runway heading · callsign.",
    }),

    /* Ex 4 — Left/right mismatch (error detection) */
    toChoiceExercise({
      id: "sp-takeoff.initial-climb.lr-mismatch",
      title: "Left/right mismatch",
      description: "Identify the direction error in the readback.",
      screenKicker: "Error detection",
      instruction: "Compare the clearance and readback, then identify the mistake.",
      question: "What is wrong with the readback?",
      atcDisplay: "G-ABCD, after departure turn left heading 270.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, after departure turn left heading two seven zero.",
      atcHidden: true,
      shownReadback: "After departure turn right heading 270, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "lr-dir", text: "The direction is wrong. ATC said left, not right.", feedback: "Correct. Left/right errors are critical and must be corrected." },
        { id: "lr-hdg", text: "The heading is wrong.", feedback: "Heading 270 matches the clearance. The error is in the direction." },
        { id: "lr-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the direction of turn." },
        { id: "lr-nothing", text: "Nothing is wrong.", feedback: "The pilot said right, but ATC said left. That is a critical mismatch." },
      ],
      correctId: "lr-dir",
    }),

    /* Ex 5 — Readback trainer */
    toReadbackExercise({
      id: "sp-takeoff.initial-climb.readback-trainer",
      title: "Readback trainer",
      description: "Listen to the departure instruction and say the full readback.",
      headerInstruction: "Listen to the departure instruction and say the full readback.",
      rounds: [
        {
          id: "sp-takeoff.initial-climb.readback-trainer.r1",
          atcText: "G-ABCD, after departure turn right heading 090, climb to 1500 feet.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, after departure turn right heading zero niner zero, climb to one thousand five hundred feet.",
          expectedReadback: "After departure turn right heading 090, climb to 1500 feet, G-ABCD.",
          expectedReadbackSpoken: "After departure turn right heading zero niner zero, climb to one thousand five hundred feet, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),
  ],
};

/* ── Section 3 — Takeoff Scenario (1 mission) ───────────────────────── */
const takeoffScenarioTopic: Topic = {
  id: "sp-takeoff.takeoff-scenario",
  name: "Takeoff Scenario",
  description: "Complete the takeoff and initial departure radio sequence.",
  unit: "scenario",
  exercises: [
    {
      id: "sp-takeoff.takeoff-scenario.mission",
      title: "Takeoff and initial departure",
      description: "Read back the takeoff clearance and the first departure instructions.",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "takeoff",
        scenarioKind: "mission",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        instruction:
          "G-ABCD is lined up on runway 36, ready for departure. Read back the takeoff clearance and the first departure instructions.",
        spScenarioKicker: "Scenario",
        spScenarioHeading: "Takeoff and initial departure",
        spScenarioCompletionNote: "Takeoff phase complete. G-ABCD has departed runway 36 and is established on heading 090.",
        spScenarioSteps: TAKEOFF_SCENARIO_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

const takeoffTopics: Topic[] = [
  takeoffClearanceTopic,
  initialClimbTopic,
  takeoffScenarioTopic,
];

const takeoff: Module = {
  id: "sp-takeoff",
  name: "Takeoff & Initial Departure",
  subtitle: "Takeoff clearance, initial climb and heading instruction.",
  unit: "topics",
  topics: takeoffTopics,
  exercises: takeoffTopics.flatMap((t) => t.exercises),
};

/* ------------------------------------------------------------------ */
/* 5. Circuit Operations  (real content — 8 topics)                    */
/* ------------------------------------------------------------------ */

/* ── Content builders for circuit module (mirror taxi/takeoff) ─────── */

function ciChoiceExercise(opts: {
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
      phase: "circuit",
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

function ciChipExercise(opts: {
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
    id: e.id, text: e.text, spoken: e.spoken, segmentType: toSegType(e.text),
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
    chipBank: toMixChips(expectedSegments, distractorSegments),
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
      phase: "circuit",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

function ciReadbackExercise(opts: {
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
    runway?: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: r.runway ?? "-",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: r.runway ?? "-", direction: "-", callsign: "G-ABCD" },
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
      phase: "circuit",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

function ciLessonExercise(opts: {
  id: string;
  title: string;
  description: string;
  lessonBody: string;
  points: string[];
  examples: SpLessonExample[];
  circuitVariant?: "overview" | "upwind-crosswind" | "downwind" | "base-final" | "extend-orbit";
}): Exercise {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    type: "Lesson",
    free: false,
    content: {
      blockType: "taxi-lesson",
      phase: "circuit",
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: undefined,
      spCircuitVariant: opts.circuitVariant,
      spVisualMode: "none",
    } satisfies ExerciseContent,
  };
}

/* ── Section 1 — Circuit Overview ───────────────────────────────────── */
const circuitOverviewTopic: Topic = {
  id: "sp-circuit.circuit-overview",
  name: "Circuit Overview",
  description: "Circuit shape, legs and position reports.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.circuit-overview.lesson",
      title: "Circuit shape and calls",
      description: "The standard circuit pattern and its position reports.",
      circuitVariant: "overview",
      lessonBody:
        "The circuit is a standard traffic pattern around the runway. ATC may ask you to report specific positions.",
      points: [
        "Upwind starts after takeoff.",
        "Crosswind and downwind position you for the circuit.",
        "Base and final bring you back towards the runway.",
        "Always include your callsign in reports and readbacks.",
      ],
      examples: [
        {
          label: "Circuit instruction",
          atcText: "G-ABCD, make left-hand circuits, report downwind.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, make left-hand circuits, report downwind.",
          readback: "Left-hand circuits, report downwind, G-ABCD.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.circuit-overview.identify-leg",
      title: "Identify circuit leg",
      description: "Choose the correct circuit leg.",
      screenKicker: "Choice",
      instruction: "Read the position and choose the correct leg.",
      question: "Which leg runs parallel to the runway, in the opposite direction to landing?",
      options: [
        { id: "il-downwind", text: "Downwind", feedback: "Correct. Downwind runs parallel to the runway in the opposite direction of landing." },
        { id: "il-upwind", text: "Upwind", feedback: "Upwind follows the runway direction just after takeoff." },
        { id: "il-base", text: "Base", feedback: "Base is the turning leg between downwind and final." },
        { id: "il-final", text: "Final", feedback: "Final is aligned with the runway for landing." },
      ],
      correctId: "il-downwind",
    }),

    ciChoiceExercise({
      id: "sp-circuit.circuit-overview.left-or-right",
      title: "Left-hand or right-hand?",
      description: "Identify the circuit direction.",
      screenKicker: "Choice",
      instruction: "Identify the circuit direction from the instruction.",
      question: "What type of circuit should you fly?",
      atcDisplay: "G-ABCD, make left-hand circuits.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, make left-hand circuits.",
      atcHidden: true,
      options: [
        { id: "lr-left", text: "Left-hand circuit", feedback: "Correct. In a left-hand circuit, all circuit turns are to the left." },
        { id: "lr-right", text: "Right-hand circuit", feedback: "ATC said left-hand. All turns would be left, not right." },
        { id: "lr-straight", text: "Straight-out departure", feedback: "No departure was instructed — ATC said make left-hand circuits." },
        { id: "lr-orbit", text: "Orbit right", feedback: "No orbit was instructed. ATC said make left-hand circuits." },
      ],
      correctId: "lr-left",
    }),

    ciChipExercise({
      id: "sp-circuit.circuit-overview.build-readback",
      title: "Build the circuit readback",
      description: "Order the circuit instruction readback.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the instruction and place the readback parts in order.",
      atcText: "G-ABCD, make left-hand circuits, report downwind.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, make left-hand circuits, report downwind.",
      prompt: "Order the readback parts.",
      expected: [
        { id: "cr-circuits", text: "Left-hand circuits" },
        { id: "cr-report", text: "report downwind" },
        { id: "cr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cr-d-cleared", text: "cleared for take-off" },
        { id: "cr-d-taxi", text: "taxi via Bravo" },
        { id: "cr-d-final", text: "report final" },
      ],
      expectedSentence: "Left-hand circuits, report downwind, G-ABCD.",
      expectedSpoken: "Left-hand circuits, report downwind, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You read back the circuit direction, report point and callsign.",
      incorrectFeedback: "Order: circuit direction · report point · callsign.",
    }),
  ],
};

/* ── Section 2 — Upwind & Crosswind ─────────────────────────────────── */
const upwindCrosswindTopic: Topic = {
  id: "sp-circuit.upwind-crosswind",
  name: "Upwind & Crosswind",
  description: "The first circuit positions after takeoff.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.upwind-crosswind.lesson",
      title: "Early circuit positions",
      description: "Upwind and crosswind after departure.",
      circuitVariant: "upwind-crosswind",
      lessonBody:
        "After takeoff, the first parts of the circuit are upwind and crosswind. These calls tell ATC where you are in the pattern.",
      points: [
        "Upwind follows the runway direction after takeoff.",
        "Crosswind is the first 90-degree turn in the circuit.",
        "Position reports must be short and clear.",
        "Use your callsign.",
      ],
      examples: [
        {
          label: "Crosswind report",
          atcText: "Crosswind, G-ABCD.",
          atcSpoken: "Crosswind, Golf Alpha Bravo Charlie Delta.",
          readback: "Crosswind, G-ABCD.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.upwind-crosswind.upwind-or-crosswind",
      title: "Upwind or crosswind?",
      description: "Identify the early circuit position.",
      screenKicker: "Choice",
      instruction: "Identify the early circuit position.",
      question: "The aircraft has just turned 90 degrees after departure. Which leg is it on?",
      options: [
        { id: "uc-crosswind", text: "Crosswind", feedback: "Correct. Crosswind is the first turn away from the runway direction." },
        { id: "uc-upwind", text: "Upwind", feedback: "Upwind is before the first turn, following the runway direction." },
        { id: "uc-downwind", text: "Downwind", feedback: "Downwind comes after crosswind, parallel to the runway." },
        { id: "uc-final", text: "Final", feedback: "Final is the last leg, aligned with the runway." },
      ],
      correctId: "uc-crosswind",
    }),

    ciReadbackExercise({
      id: "sp-circuit.upwind-crosswind.report-crosswind",
      title: "Report crosswind",
      description: "Make the crosswind position report.",
      headerInstruction: "You are established crosswind. Make the position report.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "sp-circuit.upwind-crosswind.report-crosswind.r1",
          atcText: "You are established crosswind in the circuit.",
          atcSpoken: "You are established crosswind in the circuit.",
          expectedReadback: "Crosswind, G-ABCD.",
          expectedReadbackSpoken: "Crosswind, Golf Alpha Bravo Charlie Delta.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.upwind-crosswind.wrong-position",
      title: "Wrong position report",
      description: "Spot the position-report error.",
      screenKicker: "Error detection",
      instruction: "The aircraft is on crosswind. Compare the position and the pilot report.",
      question: "What is wrong with the report?",
      shownReadback: "Downwind, G-ABCD.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "wp-mismatch", text: "The pilot reported downwind, but the aircraft is crosswind.", feedback: "Correct. Position reports must match the actual circuit leg." },
        { id: "wp-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the leg reported." },
        { id: "wp-runway", text: "The runway is missing.", feedback: "A crosswind report does not need a runway. The leg itself is wrong." },
        { id: "wp-none", text: "Nothing is wrong.", feedback: "The aircraft is crosswind, but the pilot reported downwind — that is a mismatch." },
      ],
      correctId: "wp-mismatch",
    }),
  ],
};

/* ── Section 3 — Downwind Reports ───────────────────────────────────── */
const downwindReportsTopic: Topic = {
  id: "sp-circuit.downwind-reports",
  name: "Downwind Reports",
  description: "The downwind position report and intention.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.downwind-reports.lesson",
      title: "Reporting downwind",
      description: "The most common circuit position report.",
      circuitVariant: "downwind",
      lessonBody:
        "Downwind is one of the most common circuit position reports. ATC uses it to sequence traffic.",
      points: [
        "Report downwind when established on the downwind leg.",
        "Keep the call short.",
        "Add runway or intention when required.",
        "Include your callsign.",
      ],
      examples: [
        {
          label: "Downwind report",
          atcText: "Downwind runway 36, touch and go, G-ABCD.",
          atcSpoken: "Downwind runway three six, touch and go, Golf Alpha Bravo Charlie Delta.",
          readback: "Downwind runway 36, touch and go, G-ABCD.",
        },
      ],
    }),

    ciReadbackExercise({
      id: "sp-circuit.downwind-reports.make-downwind-call",
      title: "Make the downwind call",
      description: "Make the downwind position report.",
      headerInstruction: "You are established downwind for runway 36. Make the position report.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "sp-circuit.downwind-reports.make-downwind-call.r1",
          atcText: "You are established downwind for runway 36.",
          atcSpoken: "You are established downwind for runway three six.",
          expectedReadback: "Downwind runway 36, G-ABCD.",
          expectedReadbackSpoken: "Downwind runway three six, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),

    ciChipExercise({
      id: "sp-circuit.downwind-reports.complete-report",
      title: "Complete downwind report",
      description: "Build the downwind position call.",
      screenKicker: "Listening",
      headerInstruction: "Build the downwind report in order.",
      atcText: "Downwind runway 36, touch and go, G-ABCD.",
      atcSpoken: "Downwind runway three six, touch and go, Golf Alpha Bravo Charlie Delta.",
      prompt: "Build the downwind report.",
      helperText: "Include position, runway, intention and callsign.",
      expected: [
        { id: "cd-pos", text: "Downwind runway 36" },
        { id: "cd-intent", text: "touch and go" },
        { id: "cd-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cd-d-05", text: "Downwind runway 05" },
        { id: "cd-d-full", text: "full stop" },
        { id: "cd-d-cs", text: "G-ACBD" },
      ],
      expectedSentence: "Downwind runway 36, touch and go, G-ABCD.",
      expectedSpoken: "Downwind runway three six, touch and go, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. The report includes position, runway, intention and callsign.",
      incorrectFeedback: "Order: downwind runway 36 · intention · callsign.",
    }),

    ciChoiceExercise({
      id: "sp-circuit.downwind-reports.missing-intention",
      title: "Missing intention",
      description: "Spot the omitted intention.",
      screenKicker: "Error detection",
      instruction: "The pilot intends a full stop landing. Check the downwind report.",
      question: "What is missing?",
      shownReadback: "Downwind runway 36, G-ABCD.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "mi-intent", text: "The pilot did not include full stop.", feedback: "Correct. If the intention is required, include full stop or touch and go." },
        { id: "mi-runway", text: "The runway is missing.", feedback: "Runway 36 is present. Something about the intention is missing." },
        { id: "mi-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the intention." },
        { id: "mi-none", text: "Nothing is missing.", feedback: "The intention (full stop) was required but not reported." },
      ],
      correctId: "mi-intent",
    }),
  ],
};

/* ── Section 4 — Base & Final Position Calls ────────────────────────── */
const baseFinalTopic: Topic = {
  id: "sp-circuit.base-final",
  name: "Base & Final Position Calls",
  description: "Base and final as position reports.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.base-final.lesson",
      title: "Base and final calls",
      description: "Base and final as position calls, not landing clearance.",
      circuitVariant: "base-final",
      lessonBody:
        "Base and final are position calls. They tell ATC where you are before landing or touch-and-go instructions.",
      points: [
        "Base is the turning leg between downwind and final.",
        "Final is aligned with the runway.",
        "Report final when instructed.",
        "Include the runway and your callsign.",
      ],
      examples: [
        {
          label: "Report final",
          atcText: "G-ABCD, report final runway 36.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, report final runway three six.",
          readback: "Report final runway 36, G-ABCD.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.base-final.base-or-final",
      title: "Base or final?",
      description: "Identify the circuit position.",
      screenKicker: "Choice",
      instruction: "Identify the circuit position.",
      question: "The aircraft is aligned with the runway on the last leg before landing. Which leg is it on?",
      options: [
        { id: "bf-final", text: "Final", feedback: "Correct. Final is aligned with the runway." },
        { id: "bf-base", text: "Base", feedback: "Base is the turning leg before final, not yet aligned with the runway." },
        { id: "bf-downwind", text: "Downwind", feedback: "Downwind is parallel to the runway, opposite the landing direction." },
        { id: "bf-crosswind", text: "Crosswind", feedback: "Crosswind is an early circuit leg after departure." },
      ],
      correctId: "bf-final",
    }),

    ciChipExercise({
      id: "sp-circuit.base-final.report-final-instruction",
      title: "Report final instruction",
      description: "Read back the report-final instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the instruction and complete the readback.",
      atcText: "G-ABCD, report final runway 36.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, report final runway three six.",
      prompt: "Build the readback.",
      helperText: "Include the report point, runway and callsign.",
      expected: [
        { id: "rf-report", text: "Report final runway 36" },
        { id: "rf-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rf-d-05", text: "Report final runway 05" },
        { id: "rf-d-downwind", text: "downwind" },
        { id: "rf-d-land", text: "cleared to land" },
      ],
      expectedSentence: "Report final runway 36, G-ABCD.",
      expectedSpoken: "Report final runway three six, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You read back the report point, runway and callsign.",
      incorrectFeedback: "Order: report final runway 36 · callsign.",
    }),

    ciChoiceExercise({
      id: "sp-circuit.base-final.wrong-runway-final",
      title: "Wrong runway on final",
      description: "Spot the runway error.",
      screenKicker: "Error detection",
      instruction: "Compare the instruction and the pilot report.",
      question: "What is wrong with the report?",
      atcDisplay: "G-ABCD, report final runway 36.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, report final runway three six.",
      atcHidden: true,
      shownReadback: "Final runway 05, G-ABCD.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "wf-runway", text: "The runway is wrong. ATC asked for final runway 36.", feedback: "Correct. Runway mismatches must be corrected." },
        { id: "wf-leg", text: "The leg is wrong.", feedback: "Final is correct. The error is in the runway number." },
        { id: "wf-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the runway number." },
        { id: "wf-none", text: "Nothing is wrong.", feedback: "The pilot reported runway 05, but ATC asked for runway 36." },
      ],
      correctId: "wf-runway",
    }),
  ],
};

/* ── Section 5 — Sequencing & Traffic ───────────────────────────────── */
const sequencingTrafficTopic: Topic = {
  id: "sp-circuit.sequencing-traffic",
  name: "Sequencing & Traffic",
  description: "Sequence number and traffic to follow.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.sequencing-traffic.lesson",
      title: "Traffic in the circuit",
      description: "Sequencing with other circuit traffic.",
      lessonBody:
        "ATC may sequence you with other aircraft in the circuit. Read back your number and the traffic you must follow.",
      points: [
        "Number one is first to land; number two follows.",
        "Read back your sequence number.",
        "Read back the traffic you must follow.",
        "Include your callsign.",
      ],
      examples: [
        {
          label: "Sequencing",
          atcText: "G-ABCD, number two, follow the Cessna on final.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, number two, follow the Cessna on final.",
          readback: "Number two, following the Cessna on final, G-ABCD.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.sequencing-traffic.number-in-sequence",
      title: "Number in sequence",
      description: "Identify your place in the sequence.",
      screenKicker: "Choice",
      instruction: "Listen and identify your place in the sequence.",
      question: "What number are you in the sequence?",
      atcDisplay: "G-ABCD, number two, follow the Cessna on final.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, number two, follow the Cessna on final.",
      atcHidden: true,
      options: [
        { id: "ns-two", text: "Number two", feedback: "Correct. You are number two behind the Cessna." },
        { id: "ns-one", text: "Number one", feedback: "ATC said number two — you follow the Cessna." },
        { id: "ns-three", text: "Number three", feedback: "ATC said number two, not number three." },
        { id: "ns-none", text: "Not sequenced", feedback: "You were sequenced — ATC said number two." },
      ],
      correctId: "ns-two",
    }),

    ciChipExercise({
      id: "sp-circuit.sequencing-traffic.follow-traffic",
      title: "Follow the traffic",
      description: "Read back the sequencing instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the instruction and complete the sequencing readback.",
      atcText: "G-ABCD, number two, follow the Cessna on final.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, number two, follow the Cessna on final.",
      prompt: "Build the sequencing readback.",
      helperText: "Include your number, the traffic to follow and your callsign.",
      expected: [
        { id: "ft-num", text: "Number two" },
        { id: "ft-follow", text: "following the Cessna" },
        { id: "ft-on", text: "on final" },
        { id: "ft-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ft-d-one", text: "Number one" },
        { id: "ft-d-piper", text: "following the Piper" },
        { id: "ft-d-downwind", text: "on downwind" },
      ],
      expectedSentence: "Number two, following the Cessna on final, G-ABCD.",
      expectedSpoken: "Number two, following the Cessna on final, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You included your sequence number and the traffic to follow.",
      incorrectFeedback: "Order: number two · following the Cessna · on final · callsign.",
    }),

    ciChoiceExercise({
      id: "sp-circuit.sequencing-traffic.incorrect-sequence",
      title: "Incorrect sequence readback",
      description: "Spot the sequencing error.",
      screenKicker: "Error detection",
      instruction: "Compare the instruction and the pilot readback.",
      question: "What is wrong with the readback?",
      atcDisplay: "G-ABCD, number two, follow the Cessna on final.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, number two, follow the Cessna on final.",
      atcHidden: true,
      shownReadback: "Number one, following the Cessna on final, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "is-num", text: "The sequence number is wrong. ATC said number two.", feedback: "Correct. Number one and number two are not interchangeable." },
        { id: "is-traffic", text: "The traffic is wrong.", feedback: "The Cessna on final is correct. The error is in the sequence number." },
        { id: "is-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the sequence number." },
        { id: "is-none", text: "Nothing is wrong.", feedback: "The pilot read back number one, but ATC said number two." },
      ],
      correctId: "is-num",
    }),
  ],
};

/* ── Section 6 — Extend Downwind & Orbit ────────────────────────────── */
const extendOrbitTopic: Topic = {
  id: "sp-circuit.extend-orbit",
  name: "Extend Downwind & Orbit",
  description: "Spacing instructions in the circuit.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.extend-orbit.lesson",
      title: "Spacing instructions",
      description: "Extend downwind and orbit for spacing.",
      circuitVariant: "extend-orbit",
      lessonBody:
        "When the circuit is busy, ATC may use spacing instructions to keep aircraft separated.",
      points: [
        "Extend downwind means continue the downwind leg.",
        "Orbit left or right adds spacing with a 360-degree turn.",
        "Read back the instruction and any sequence number.",
        "Read back the orbit direction exactly.",
      ],
      examples: [
        {
          label: "Extend downwind",
          atcText: "G-ABCD, extend downwind, number two.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, extend downwind, number two.",
          readback: "Extend downwind, number two, G-ABCD.",
        },
        {
          label: "Orbit for spacing",
          atcText: "G-ABCD, orbit left for spacing.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, orbit left for spacing.",
          readback: "Orbit left for spacing, G-ABCD.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.extend-orbit.extend-or-base",
      title: "Extend or turn base?",
      description: "Decide what to do next.",
      screenKicker: "Choice",
      instruction: "Listen and decide what to do next.",
      question: "What should you do?",
      atcDisplay: "G-ABCD, extend downwind.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, extend downwind.",
      atcHidden: true,
      options: [
        { id: "eb-continue", text: "Continue downwind. Do not turn base yet.", feedback: "Correct. Extend downwind means continue the downwind leg." },
        { id: "eb-base", text: "Turn base now.", feedback: "No — extend downwind means do not turn base yet." },
        { id: "eb-final", text: "Report final now.", feedback: "You are not on final yet. Continue downwind." },
        { id: "eb-leave", text: "Leave the circuit.", feedback: "No — you stay in the circuit and continue downwind." },
      ],
      correctId: "eb-continue",
    }),

    ciChipExercise({
      id: "sp-circuit.extend-orbit.complete-extend",
      title: "Complete extend downwind",
      description: "Read back the spacing instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the instruction and complete the spacing readback.",
      atcText: "G-ABCD, extend downwind, number two.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, extend downwind, number two.",
      prompt: "Build the spacing readback.",
      helperText: "Include the spacing instruction, sequence number and callsign.",
      expected: [
        { id: "ce-extend", text: "Extend downwind" },
        { id: "ce-num", text: "number two" },
        { id: "ce-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ce-d-base", text: "Extend base" },
        { id: "ce-d-one", text: "number one" },
        { id: "ce-d-final", text: "report final" },
      ],
      expectedSentence: "Extend downwind, number two, G-ABCD.",
      expectedSpoken: "Extend downwind, number two, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You read back the spacing instruction and sequence number.",
      incorrectFeedback: "Order: extend downwind · number two · callsign.",
    }),

    ciChoiceExercise({
      id: "sp-circuit.extend-orbit.orbit-mismatch",
      title: "Left/right orbit mismatch",
      description: "Spot the orbit-direction error.",
      screenKicker: "Error detection",
      instruction: "Compare the instruction and the readback.",
      question: "What is wrong with the readback?",
      atcDisplay: "G-ABCD, orbit left for spacing.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, orbit left for spacing.",
      atcHidden: true,
      shownReadback: "Orbit right for spacing, G-ABCD.",
      shownReadbackLabel: "Pilot read back",
      options: [
        { id: "om-dir", text: "The orbit direction is wrong. ATC said orbit left.", feedback: "Correct. Orbit direction must be read back accurately." },
        { id: "om-spacing", text: "The reason is wrong.", feedback: "For spacing is correct. The error is the orbit direction." },
        { id: "om-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the orbit direction." },
        { id: "om-none", text: "Nothing is wrong.", feedback: "The pilot read back orbit right, but ATC said orbit left." },
      ],
      correctId: "om-dir",
    }),
  ],
};

/* ── Section 7 — Touch And Go / Full Stop ───────────────────────────── */
const touchAndGoTopic: Topic = {
  id: "sp-circuit.touch-and-go",
  name: "Touch And Go / Full Stop",
  description: "State your touch-and-go or full-stop intention.",
  unit: "exercises",
  exercises: [
    ciLessonExercise({
      id: "sp-circuit.touch-and-go.lesson",
      title: "Touch-and-go or full stop",
      description: "State your intention in the circuit.",
      lessonBody:
        "In the circuit, you may report whether you intend a touch-and-go or a full stop.",
      points: [
        "Touch and go means land and take off again.",
        "Full stop means land and stop.",
        "State the intention when required.",
        "Keep the call short.",
      ],
      examples: [
        {
          label: "Touch and go",
          atcText: "Downwind runway 36, touch and go, G-ABCD.",
          atcSpoken: "Downwind runway three six, touch and go, Golf Alpha Bravo Charlie Delta.",
          readback: "Downwind runway 36, touch and go, G-ABCD.",
        },
      ],
    }),

    ciChoiceExercise({
      id: "sp-circuit.touch-and-go.identify-intention",
      title: "Touch-and-go or full stop?",
      description: "Identify the pilot intention.",
      screenKicker: "Choice",
      instruction: "Identify the pilot's intention.",
      question: "What is the pilot intending to do?",
      shownReadback: "Downwind runway 36, touch and go, G-ABCD.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "ii-tg", text: "Touch and go", feedback: "Correct. Touch and go means landing and taking off again." },
        { id: "ii-fs", text: "Full stop", feedback: "The pilot reported touch and go, not full stop." },
        { id: "ii-orbit", text: "Orbit", feedback: "No orbit was reported. The intention is touch and go." },
        { id: "ii-leave", text: "Leave the circuit", feedback: "The pilot is staying in the circuit for a touch and go." },
      ],
      correctId: "ii-tg",
    }),

    ciChipExercise({
      id: "sp-circuit.touch-and-go.build-intention",
      title: "Build the intention call",
      description: "Order the intention report.",
      screenKicker: "Listening",
      headerInstruction: "Place the report parts in the correct order.",
      atcText: "Downwind runway 36, touch and go, G-ABCD.",
      atcSpoken: "Downwind runway three six, touch and go, Golf Alpha Bravo Charlie Delta.",
      prompt: "Order the report parts.",
      expected: [
        { id: "bi-pos", text: "Downwind runway 36" },
        { id: "bi-intent", text: "touch and go" },
        { id: "bi-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bi-d-land", text: "cleared to land" },
        { id: "bi-d-taxi", text: "taxi via Bravo" },
        { id: "bi-d-num", text: "number two" },
      ],
      expectedSentence: "Downwind runway 36, touch and go, G-ABCD.",
      expectedSpoken: "Downwind runway three six, touch and go, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. The report includes position, runway, intention and callsign.",
      incorrectFeedback: "Order: downwind runway 36 · touch and go · callsign.",
    }),

    ciChoiceExercise({
      id: "sp-circuit.touch-and-go.wrong-intention",
      title: "Wrong intention detection",
      description: "Spot the wrong intention.",
      screenKicker: "Error detection",
      instruction: "The pilot intends a full stop landing. Compare it with the report.",
      question: "What is wrong with the report?",
      shownReadback: "Downwind runway 36, touch and go, G-ABCD.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "wi-intent", text: "The intention is wrong. The pilot should report full stop, not touch and go.", feedback: "Correct. Touch and go and full stop are different intentions." },
        { id: "wi-runway", text: "The runway is wrong.", feedback: "Runway 36 is correct. The error is the intention." },
        { id: "wi-cs", text: "The callsign is missing.", feedback: "The callsign G-ABCD is present. Look at the intention." },
        { id: "wi-none", text: "Nothing is wrong.", feedback: "The pilot planned a full stop but reported touch and go." },
      ],
      correctId: "wi-intent",
    }),
  ],
};

/* ── Section 8 — Circuit Scenario (1 mission) ───────────────────────── */
const circuitScenarioTopic: Topic = {
  id: "sp-circuit.circuit-scenario",
  name: "Circuit Scenario",
  description: "Fly one guided circuit with reports, sequencing and spacing.",
  unit: "scenario",
  exercises: [
    {
      id: "sp-circuit.circuit-scenario.mission",
      title: "Basic circuit",
      description: "Fly one guided circuit with position reports, sequencing and spacing.",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "circuit",
        scenarioKind: "mission",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        instruction:
          "Fly one guided left-hand circuit. Read back the circuit instruction, report downwind, follow the sequence, comply with spacing and report final.",
        spScenarioKicker: "Scenario",
        spScenarioHeading: "Basic circuit",
        spScenarioCompletionNote: "Circuit complete. Position reports, sequencing and spacing all handled correctly.",
        spScenarioSteps: CIRCUIT_SCENARIO_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

const circuitTopics: Topic[] = [
  circuitOverviewTopic,
  upwindCrosswindTopic,
  downwindReportsTopic,
  baseFinalTopic,
  sequencingTrafficTopic,
  extendOrbitTopic,
  touchAndGoTopic,
  circuitScenarioTopic,
];

const circuit: Module = {
  id: "sp-circuit",
  name: "Circuit Operations",
  subtitle: "Circuit shape, position calls, sequencing, spacing and intentions.",
  unit: "topics",
  topics: circuitTopics,
  exercises: circuitTopics.flatMap((t) => t.exercises),
};

/* ------------------------------------------------------------------ */
/* 6. Basic Arrival & Joining  (home aerodrome only — real content)   */
/* ------------------------------------------------------------------ */

/* Shared builders for the arrival module (phase: "arrival") ---------- */

function arLessonExercise(opts: {
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
      phase: "arrival",
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: undefined,
      spVisualMode: "none",
    } satisfies ExerciseContent,
  };
}

function arChipExercise(opts: {
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
    id: e.id, text: e.text, spoken: e.spoken, segmentType: toSegType(e.text),
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
    chipBank: toMixChips(expectedSegments, distractorSegments),
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
      phase: "arrival",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

function arChoiceExercise(opts: {
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
      phase: "arrival",
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

function arReadbackExercise(opts: {
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
    runway?: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: r.runway ?? "-",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: r.runway ?? "-", direction: "-", callsign: "G-ABCD" },
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
      phase: "arrival",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

/* ── Section 1 — Return To Home Aerodrome ───────────────────────────── */
const returnToAerodromeTopic: Topic = {
  id: "sp-arrival.return-to-aerodrome",
  name: "Return To Home Aerodrome",
  description: "Make the initial inbound call to Tower.",
  unit: "exercises",
  exercises: [
    arLessonExercise({
      id: "sp-arrival.return-to-aerodrome.lesson",
      title: "The inbound call",
      description: "How to call Tower when returning to the home aerodrome.",
      lessonBody:
        "When returning to the home aerodrome, call Tower with your position, altitude and intention. This is not a landing clearance — it starts the joining process.",
      points: [
        "Call Brindale Tower — not Ground.",
        "Include your callsign.",
        "State your position (e.g. five miles north).",
        "State your altitude (e.g. two thousand feet).",
        'Say "inbound to join" — this is your intention, not a clearance.',
      ],
      examples: [
        {
          label: "Initial inbound call",
          atcText: "Brindale Tower, G-ABCD, five miles north, two thousand feet, inbound to join.",
          atcSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, five miles north, two thousand feet, inbound to join.",
          readback: "Brindale Tower, G-ABCD, five miles north, two thousand feet, inbound to join.",
        },
      ],
    }),

    arChipExercise({
      id: "sp-arrival.return-to-aerodrome.build-arrival-call",
      title: "Build the arrival call",
      description: "Order the parts of the inbound call.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the inbound call in the correct order.",
      atcText: "Brindale Tower, G-ABCD, five miles north, two thousand feet, inbound to join.",
      atcSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, five miles north, two thousand feet, inbound to join.",
      prompt: "Order the call parts.",
      helperText: "Station · callsign · position · altitude · intention.",
      expected: [
        { id: "bac-station", text: "Brindale Tower" },
        { id: "bac-cs", text: "G-ABCD" },
        { id: "bac-pos", text: "five miles north" },
        { id: "bac-alt", text: "two thousand feet" },
        { id: "bac-int", text: "inbound to join" },
      ],
      distractors: [
        { id: "bac-d-gnd", text: "Brindale Ground" },
        { id: "bac-d-land", text: "request landing" },
        { id: "bac-d-south", text: "five miles south" },
      ],
      expectedSentence: "Brindale Tower, G-ABCD, five miles north, two thousand feet, inbound to join.",
      expectedSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, five miles north, two thousand feet, inbound to join.",
      correctFeedback: "Correct. The inbound call includes station, callsign, position, altitude and intention.",
      incorrectFeedback: "Order: station · callsign · position · altitude · intention.",
    }),

    arChoiceExercise({
      id: "sp-arrival.return-to-aerodrome.who-to-call",
      title: "Who do you call?",
      description: "Choose the correct station when returning to the aerodrome.",
      screenKicker: "Choice",
      instruction: "You are five miles north of Brindale, returning to land. Who do you call first?",
      question: "Which station do you call?",
      options: [
        { id: "wtc-tower", text: "Brindale Tower", feedback: "Correct. Tower controls the circuit and airfield traffic." },
        { id: "wtc-ground", text: "Brindale Ground", feedback: "Ground handles surface movement — call Tower first when inbound from the air." },
        { id: "wtc-atis", text: "Brindale Information", feedback: "Brindale Information is not the Tower frequency for this arrival call. Use Brindale Tower." },
        { id: "wtc-delivery", text: "Brindale Delivery", feedback: "Delivery is for pre-departure clearances, not arrivals." },
      ],
      correctId: "wtc-tower",
    }),

    arChoiceExercise({
      id: "sp-arrival.return-to-aerodrome.missing-callsign",
      title: "Missing callsign",
      description: "Spot the missing element in the inbound call.",
      screenKicker: "Error detection",
      instruction: "Check this inbound call for a missing element.",
      question: "What is missing?",
      shownReadback: "Brindale Tower, five miles north, two thousand feet, inbound to join.",
      shownReadbackLabel: "Pilot call",
      options: [
        { id: "mc-cs", text: "The callsign is missing.", feedback: "Correct. ATC cannot identify the aircraft without a callsign." },
        { id: "mc-pos", text: "The position is missing.", feedback: "Five miles north is present. Something else is missing." },
        { id: "mc-alt", text: "The altitude is missing.", feedback: "Two thousand feet is present. Look for what identifies the aircraft." },
        { id: "mc-int", text: "The intention is missing.", feedback: '"Inbound to join" is present. The aircraft cannot be identified without something else.' },
      ],
      correctId: "mc-cs",
    }),
  ],
};

/* ── Section 2 — Position, Altitude & Intentions ────────────────────── */
const positionAltitudeIntentionsTopic: Topic = {
  id: "sp-arrival.position-altitude-intentions",
  name: "Position, Altitude & Intentions",
  description: "Practise stating position, altitude and intention clearly.",
  unit: "exercises",
  exercises: [
    arLessonExercise({
      id: "sp-arrival.position-altitude-intentions.lesson",
      title: "Position, altitude and intention",
      description: "The three key pieces of information in an inbound report.",
      lessonBody:
        "Every inbound call includes three key pieces: where you are, how high you are, and what you intend to do. The position and altitude change each flight — learn to state them clearly in any combination.",
      points: [
        'Position — e.g. "six miles east" — tells ATC where to expect you.',
        'Altitude — e.g. "one thousand five hundred feet" — gives separation information.',
        '"Inbound to join" — your intention. Not a clearance request.',
        "Keep all three short and in order.",
      ],
      examples: [
        {
          label: "Position, altitude, intention",
          atcText: "G-ABCD, six miles east, one thousand five hundred feet, inbound to join.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, six miles east, one thousand five hundred feet, inbound to join.",
          readback: "G-ABCD, six miles east, one thousand five hundred feet, inbound to join.",
        },
      ],
    }),

    arChipExercise({
      id: "sp-arrival.position-altitude-intentions.complete-report",
      title: "Complete the arrival report",
      description: "Build the three key elements of the arrival report.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the three key elements: position · altitude · intention.",
      atcText: "Brindale Tower, G-ABCD, six miles east, one thousand five hundred feet, inbound to join.",
      atcSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, six miles east, one thousand five hundred feet, inbound to join.",
      prompt: "Build position, altitude and intention.",
      helperText: "Position · altitude · intention.",
      expected: [
        { id: "cr-pos", text: "six miles east" },
        { id: "cr-alt", text: "one thousand five hundred feet" },
        { id: "cr-int", text: "inbound to join" },
      ],
      distractors: [
        { id: "cr-d-west", text: "six miles west" },
        { id: "cr-d-alt", text: "two thousand feet" },
        { id: "cr-d-land", text: "request landing clearance" },
      ],
      expectedSentence: "six miles east, one thousand five hundred feet, inbound to join.",
      expectedSpoken: "six miles east, one thousand five hundred feet, inbound to join.",
      correctFeedback: "Correct. Position, altitude and intention in the right order.",
      incorrectFeedback: "Order: position · altitude · intention.",
    }),

    arChoiceExercise({
      id: "sp-arrival.position-altitude-intentions.position-or-altitude",
      title: "Position or altitude?",
      description: "Identify whether each part of the report is position or altitude.",
      screenKicker: "Choice",
      instruction: 'Which part of the call is the altitude?',
      question: 'In "G-ABCD, six miles east, one thousand five hundred feet, inbound to join" — which part is the altitude?',
      options: [
        { id: "poa-alt", text: "One thousand five hundred feet", feedback: "Correct. Altitude is always given in feet." },
        { id: "poa-pos", text: "Six miles east", feedback: 'That is the position. Altitude is the height above sea level — stated in feet.' },
        { id: "poa-int", text: "Inbound to join", feedback: 'That is the intention. Altitude uses feet: "one thousand five hundred feet".' },
        { id: "poa-cs", text: "G-ABCD", feedback: "That is the callsign. Altitude is stated in feet." },
      ],
      correctId: "poa-alt",
    }),

    arChoiceExercise({
      id: "sp-arrival.position-altitude-intentions.wrong-altitude",
      title: "Wrong altitude report",
      description: "Spot the incorrect altitude in the report.",
      screenKicker: "Error detection",
      instruction: "The aircraft is at one thousand five hundred feet. Check the report below.",
      question: "What is wrong?",
      shownReadback: "G-ABCD, six miles east, five hundred feet, inbound to join.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "wa-alt", text: "The altitude is wrong. The aircraft is at one thousand five hundred feet.", feedback: "Correct. Five hundred feet is far too low. Always report the correct altitude." },
        { id: "wa-pos", text: "The position is wrong.", feedback: "Six miles east is plausible. The altitude does not match." },
        { id: "wa-int", text: "The intention is wrong.", feedback: '"Inbound to join" is correct. The altitude is the issue.' },
        { id: "wa-none", text: "Nothing is wrong.", feedback: "The aircraft is at one thousand five hundred feet, not five hundred feet." },
      ],
      correctId: "wa-alt",
    }),
  ],
};

/* ── Section 3 — Reporting Point ────────────────────────────────────── */
const reportingPointTopic: Topic = {
  id: "sp-arrival.reporting-point",
  name: "Reporting Point",
  description: "Read back a report instruction and make the position report.",
  unit: "exercises",
  exercises: [
    arLessonExercise({
      id: "sp-arrival.reporting-point.lesson",
      title: "Reporting points",
      description: "What reporting points are and how to use them.",
      lessonBody:
        "ATC may ask you to report at a named point on the way in. This helps them sequence you. Read back the instruction, then make the position report when you reach the point. When you call, include: station · callsign · point name · altitude.",
      points: [
        "Read back exactly: Report [point name], G-ABCD.",
        "When you reach the point, call Tower yourself: station · callsign · point name · altitude.",
        "Example pilot report: Brindale Tower, G-ABCD, North Point, two thousand feet.",
        "Use the point name as ATC said it.",
        "Include your callsign in both the readback and the report.",
      ],
      examples: [
        {
          label: "ATC instruction — read back this",
          atcText: "G-ABCD, report North Point.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, report North Point.",
          readback: "Report North Point, G-ABCD.",
        },
      ],
    }),

    arChipExercise({
      id: "sp-arrival.reporting-point.read-back-point",
      title: "Read back the reporting point",
      description: "Build the readback of the report instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the readback of the report instruction.",
      atcText: "G-ABCD, report North Point.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, report North Point.",
      prompt: "Build the readback.",
      expected: [
        { id: "rbp-report", text: "Report North Point" },
        { id: "rbp-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rbp-d-east", text: "Report East Point" },
        { id: "rbp-d-south", text: "Report South Point" },
      ],
      expectedSentence: "Report North Point, G-ABCD.",
      expectedSpoken: "Report North Point, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Keep the readback short: report point · callsign.",
      incorrectFeedback: "Read back: Report North Point · callsign.",
    }),

    arChoiceExercise({
      id: "sp-arrival.reporting-point.which-point",
      title: "Which reporting point?",
      description: "Identify the correct reporting point from the ATC instruction.",
      screenKicker: "Listening",
      instruction: "Listen to the ATC instruction and identify the reporting point.",
      question: "Which point must you report?",
      atcDisplay: "G-ABCD, report North Point.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, report North Point.",
      atcHidden: true,
      options: [
        { id: "wp-north", text: "North Point", feedback: "Correct. ATC said report North Point." },
        { id: "wp-east", text: "East Point", feedback: "ATC said North Point, not East Point. Listen again." },
        { id: "wp-south", text: "South Point", feedback: "ATC said North Point, not South Point." },
        { id: "wp-west", text: "West Point", feedback: "ATC said North Point. Listen for the direction word." },
      ],
      correctId: "wp-north",
    }),

    arReadbackExercise({
      id: "sp-arrival.reporting-point.make-the-report",
      title: "Make the position report",
      description: "Report reaching North Point.",
      headerInstruction: "ATC asked you to report North Point. You have reached it at two thousand feet. Make the position report to Tower.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "sp-arrival.reporting-point.make-the-report.r1",
          atcText: "G-ABCD, report North Point.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, report North Point.",
          expectedReadback: "Brindale Tower, G-ABCD, North Point, two thousand feet.",
          expectedReadbackSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, North Point, two thousand feet.",
        },
      ],
    }),
  ],
};

/* ── Section 4 — Join Downwind / Base ───────────────────────────────── */
const joinDownwindBaseTopic: Topic = {
  id: "sp-arrival.join-downwind-base",
  name: "Join Downwind / Base",
  description: "Read back a joining instruction and enter the circuit.",
  unit: "exercises",
  exercises: [
    arLessonExercise({
      id: "sp-arrival.join-downwind-base.lesson",
      title: "Joining the circuit",
      description: "How to read back a joining instruction.",
      lessonBody:
        "ATC will tell you where to join the circuit — usually downwind or base. Read back the leg, the runway and the report point if given.",
      points: [
        "Join downwind means enter the circuit on the downwind leg.",
        "Join base means enter on the base leg — closer to the runway.",
        "Read back the join leg and the runway.",
        'If ATC adds "report downwind", include that in your readback.',
      ],
      examples: [
        {
          label: "Join downwind",
          atcText: "G-ABCD, join downwind runway 36, report downwind.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, join downwind runway three six, report downwind.",
          readback: "Join downwind runway 36, report downwind, G-ABCD.",
        },
        {
          label: "Join base",
          atcText: "G-ABCD, join base runway 36.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, join base runway three six.",
          readback: "Join base runway 36, G-ABCD.",
        },
      ],
    }),

    arChoiceExercise({
      id: "sp-arrival.join-downwind-base.downwind-or-base",
      title: "Join downwind or base?",
      description: "Identify the joining instruction.",
      screenKicker: "Listening",
      instruction: "Listen to the ATC instruction and identify the join leg.",
      question: "Where must you join the circuit?",
      atcDisplay: "G-ABCD, join downwind runway 36, report downwind.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, join downwind runway three six, report downwind.",
      atcHidden: true,
      options: [
        { id: "db-downwind", text: "Downwind", feedback: "Correct. ATC said join downwind." },
        { id: "db-base", text: "Base", feedback: "ATC said join downwind. Base is a different leg, closer to the runway." },
        { id: "db-final", text: "Final", feedback: "ATC did not clear you for final. You were told to join downwind." },
        { id: "db-upwind", text: "Upwind", feedback: "Upwind is after takeoff. ATC said join downwind." },
      ],
      correctId: "db-downwind",
    }),

    arChipExercise({
      id: "sp-arrival.join-downwind-base.build-joining-readback",
      title: "Build the joining readback",
      description: "Order the parts of the joining readback.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the joining instruction and build the readback.",
      atcText: "G-ABCD, join downwind runway 36, report downwind.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, join downwind runway three six, report downwind.",
      prompt: "Order the readback parts.",
      expected: [
        { id: "bjr-join", text: "Join downwind runway 36" },
        { id: "bjr-report", text: "report downwind" },
        { id: "bjr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bjr-d-base", text: "Join base runway 36" },
        { id: "bjr-d-final", text: "report final" },
        { id: "bjr-d-land", text: "cleared to land" },
      ],
      expectedSentence: "Join downwind runway 36, report downwind, G-ABCD.",
      expectedSpoken: "Join downwind runway three six, report downwind, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You read back the join leg, runway, report point and callsign.",
      incorrectFeedback: "Order: join leg · runway · report point · callsign.",
    }),

    arChoiceExercise({
      id: "sp-arrival.join-downwind-base.wrong-join-leg",
      title: "Wrong join leg",
      description: "Spot the incorrect join leg in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said join downwind. Check the pilot readback.",
      question: "What is wrong with the readback?",
      atcDisplay: "G-ABCD, join downwind runway 36, report downwind.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, join downwind runway three six, report downwind.",
      shownReadback: "Join base runway 36, report downwind, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wjl-leg", text: "The join leg is wrong. ATC said join downwind.", feedback: "Correct. The pilot read back base instead of downwind — a different circuit position." },
        { id: "wjl-runway", text: "The runway is wrong.", feedback: "Runway 36 matches. The join leg does not." },
        { id: "wjl-report", text: "The report point is wrong.", feedback: '"Report downwind" matches. The join leg is the issue.' },
        { id: "wjl-none", text: "Nothing is wrong.", feedback: "ATC said join downwind but the pilot read back join base. They are different legs." },
      ],
      correctId: "wjl-leg",
    }),
  ],
};

/* ── Section 5 — Arrival Scenario ───────────────────────────────────── */
const arrivalScenarioTopic: Topic = {
  id: "sp-arrival.arrival-scenario",
  name: "Arrival Scenario",
  description: "Inbound call through reporting point to joining instruction.",
  unit: "scenario",
  exercises: [
    {
      id: "sp-arrival.arrival-scenario.mission",
      title: "Inbound to circuit joined",
      description: "Make the inbound call, report North Point and read back the joining instruction.",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "arrival",
        scenarioKind: "mission",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        instruction:
          "You are five miles north of Brindale at two thousand feet. Make the inbound call, acknowledge the report instruction, report North Point and read back the joining instruction.",
        spScenarioKicker: "Scenario",
        spScenarioHeading: "Inbound to circuit joined",
        spScenarioCompletionNote:
          "Inbound call correct, reporting point acknowledged, position report made and joining instruction read back. You are integrated into the circuit.",
        spScenarioSteps: ARRIVAL_SCENARIO_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

const arrivalTopics: Topic[] = [
  returnToAerodromeTopic,
  positionAltitudeIntentionsTopic,
  reportingPointTopic,
  joinDownwindBaseTopic,
  arrivalScenarioTopic,
];

const arrival: Module = {
  id: "sp-arrival",
  name: "Basic Arrival & Joining",
  subtitle: "Return to the home aerodrome, report at a VFR point and join the circuit.",
  unit: "topics",
  topics: arrivalTopics,
  exercises: arrivalTopics.flatMap((t) => t.exercises),
};

/* ------------------------------------------------------------------ */
/* 7. Approach & Landing  (real content — final to runway vacated)    */
/* ------------------------------------------------------------------ */

/* Builders for the landing module (phase: "landing") ---------------- */

function ldLessonExercise(opts: {
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
      phase: "landing",
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: undefined,
      spVisualMode: "none",
    } satisfies ExerciseContent,
  };
}

function ldChipExercise(opts: {
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
    id: e.id, text: e.text, spoken: e.spoken, segmentType: toSegType(e.text),
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
    chipBank: toMixChips(expectedSegments, distractorSegments),
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
      phase: "landing",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

function ldChoiceExercise(opts: {
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
      phase: "landing",
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

function ldReadbackExercise(opts: {
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
    runway?: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: r.runway ?? "36",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: r.runway ?? "36", direction: "-", callsign: "G-ABCD" },
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
      phase: "landing",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

/* ── Section 1 — Report Final In Context ────────────────────────────── */
const reportFinalTopic: Topic = {
  id: "sp-landing.report-final",
  name: "Report Final In Context",
  description: "Report your position on final — this is not a landing clearance.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.report-final.lesson",
      title: "Reporting final",
      description: "Report your final position and wait for landing clearance.",
      lessonBody:
        "Reporting final tells ATC your position on approach. It does not mean you are cleared to land. You must wait for an explicit landing clearance before touching down.",
      points: [
        'Say "Brindale Tower, G-ABCD, final runway 36."',
        "Report final is a position report — not a clearance.",
        "Always include the runway number.",
        "Wait for ATC to respond. Do not assume clearance.",
      ],
      examples: [
        {
          label: "Final report",
          atcText: "Brindale Tower, G-ABCD, final runway 36.",
          atcSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, final runway three six.",
          readback: "Brindale Tower, G-ABCD, final runway 36.",
        },
      ],
    }),

    ldChipExercise({
      id: "sp-landing.report-final.make-final-call",
      title: "Make the final call",
      description: "Order the parts of the final report.",
      screenKicker: "Listening",
      headerInstruction: "Place the parts of the final report in the correct order.",
      atcText: "Brindale Tower, G-ABCD, final runway 36.",
      atcSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, final runway three six.",
      prompt: "Order the call parts.",
      helperText: "Station · callsign · position · runway.",
      expected: [
        { id: "mfc-station", text: "Brindale Tower" },
        { id: "mfc-cs", text: "G-ABCD" },
        { id: "mfc-pos", text: "final runway 36" },
      ],
      distractors: [
        { id: "mfc-d-gnd", text: "Brindale Ground" },
        { id: "mfc-d-rwy24", text: "final runway 24" },
        { id: "mfc-d-land", text: "cleared to land" },
      ],
      expectedSentence: "Brindale Tower, G-ABCD, final runway 36.",
      expectedSpoken: "Brindale Tower, Golf Alpha Bravo Charlie Delta, final runway three six.",
      correctFeedback: "Correct. Station, callsign and final position with runway.",
      incorrectFeedback: "Order: station · callsign · final runway.",
    }),

    ldChoiceExercise({
      id: "sp-landing.report-final.final-or-clearance",
      title: "Final call or landing clearance?",
      description: "Distinguish between a position report and a landing clearance.",
      screenKicker: "Choice",
      instruction: "You have just said: Brindale Tower, G-ABCD, final runway 36. What have you done?",
      question: "Is this a landing clearance?",
      options: [
        { id: "foc-pos", text: "No — I have reported my position. I still need clearance.", feedback: "Correct. A final report is a position report, not a clearance." },
        { id: "foc-clear", text: "Yes — I am now cleared to land.", feedback: "No. Reporting final is not a clearance. You must wait for ATC to issue cleared to land." },
        { id: "foc-ok", text: "Yes — ATC knows I am on final, so landing is authorised.", feedback: "ATC knows your position but has not cleared you. Cleared to land must be explicitly issued." },
        { id: "foc-roger", text: "Yes — if ATC does not respond I can land anyway.", feedback: "Never land without an explicit clearance. If in doubt, go around." },
      ],
      correctId: "foc-pos",
    }),

    ldChoiceExercise({
      id: "sp-landing.report-final.wrong-runway",
      title: "Wrong runway on final",
      description: "Spot the incorrect runway in the final call.",
      screenKicker: "Error detection",
      instruction: "You are cleared to use runway 36. Check this final call.",
      question: "What is wrong?",
      shownReadback: "Brindale Tower, G-ABCD, final runway 24.",
      shownReadbackLabel: "Pilot report",
      options: [
        { id: "wrr-rwy", text: "The runway is wrong. You are on final for runway 36.", feedback: "Correct. Runway 24 is a different runway. Always state the runway you are actually using." },
        { id: "wrr-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The runway does not match." },
        { id: "wrr-pos", text: "The position is wrong.", feedback: '"Final" is the correct position. The runway number is the issue.' },
        { id: "wrr-none", text: "Nothing is wrong.", feedback: "The expected runway is 36. The report states runway 24." },
      ],
      correctId: "wrr-rwy",
    }),
  ],
};

/* ── Section 2 — Continue Approach ──────────────────────────────────── */
const continueApproachTopic: Topic = {
  id: "sp-landing.continue-approach",
  name: "Continue Approach",
  description: "Continue approach is not a landing clearance.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.continue-approach.lesson",
      title: "Continue approach",
      description: "What continue approach means and what it does not mean.",
      lessonBody:
        "Continue approach means ATC wants you to keep flying the approach, but the runway is not yet available. This is not a landing clearance. You must wait for cleared to land.",
      points: [
        '"Continue approach" — keep going but do not land yet.',
        "The runway may still have traffic on it.",
        'You must receive "cleared to land" before touching down.',
        "If no clearance arrives, go around.",
      ],
      examples: [
        {
          label: "Continue approach",
          atcText: "G-ABCD, continue approach.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach.",
          readback: "Continue approach, G-ABCD.",
        },
      ],
    }),

    ldChoiceExercise({
      id: "sp-landing.continue-approach.cleared-or-not",
      title: "Cleared to land or not?",
      description: "Decide whether continue approach authorises landing.",
      screenKicker: "Choice",
      instruction: "ATC says: G-ABCD, continue approach. Are you cleared to land?",
      question: "Are you cleared to land?",
      atcDisplay: "G-ABCD, continue approach.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach.",
      atcHidden: true,
      options: [
        { id: "con-no", text: "No — I must wait for cleared to land.", feedback: "Correct. Continue approach is not a landing clearance." },
        { id: "con-yes", text: "Yes — continue approach means I can land.", feedback: 'No. "Continue approach" means keep flying the approach, not land. You need "cleared to land".' },
        { id: "con-maybe", text: "Maybe — if the runway looks clear I can land.", feedback: "Never land without an explicit clearance, even if the runway appears clear." },
        { id: "con-roger", text: "Yes — ATC said something so I can land.", feedback: 'ATC must specifically say "cleared to land". Any other message is not a clearance.' },
      ],
      correctId: "con-no",
    }),

    ldChipExercise({
      id: "sp-landing.continue-approach.read-back",
      title: "Read back continue approach",
      description: "Build the readback of the continue approach instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the readback.",
      atcText: "G-ABCD, continue approach.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach.",
      prompt: "Build the readback.",
      expected: [
        { id: "rca-cont", text: "Continue approach" },
        { id: "rca-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rca-d-land", text: "Cleared to land runway 36" },
        { id: "rca-d-ga", text: "Going around" },
      ],
      expectedSentence: "Continue approach, G-ABCD.",
      expectedSpoken: "Continue approach, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Short and clear: continue approach · callsign.",
      incorrectFeedback: "Readback: Continue approach · callsign.",
    }),

    ldChoiceExercise({
      id: "sp-landing.continue-approach.incorrect-assumption",
      title: "Incorrect assumption",
      description: "Identify the unsafe pilot response.",
      screenKicker: "Error detection",
      instruction: "ATC said continue approach. Check the pilot readback.",
      question: "Is the readback correct?",
      atcDisplay: "G-ABCD, continue approach.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach.",
      shownReadback: "Cleared to land runway 36, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ia-wrong", text: "No — the pilot read back a clearance that was not given.", feedback: "Correct. ATC said continue approach. Reading back cleared to land is an unsafe assumption." },
        { id: "ia-ok", text: "Yes — the readback is fine.", feedback: 'ATC said "continue approach", not "cleared to land". The readback is incorrect and unsafe.' },
        { id: "ia-part", text: "Partially — the callsign is wrong.", feedback: "The callsign is fine. The problem is that the pilot read back a clearance that was never issued." },
        { id: "ia-minor", text: "It is a minor error with no safety impact.", feedback: "Incorrectly reading back cleared to land is a significant safety error." },
      ],
      correctId: "ia-wrong",
    }),
  ],
};

/* ── Section 3 — Landing Clearance ──────────────────────────────────── */
const landingClearanceTopic: Topic = {
  id: "sp-landing.landing-clearance",
  name: "Landing Clearance",
  description: "Read back cleared to land with runway and callsign.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.landing-clearance.lesson",
      title: "Cleared to land",
      description: "How to read back a standard landing clearance.",
      lessonBody:
        "Landing clearance is issued by ATC with the runway, wind and the phrase cleared to land. Your readback must include the clearance, the runway number and your callsign.",
      points: [
        '"Cleared to land" — the only phrase that authorises landing.',
        "Include the runway in your readback.",
        "Wind information is noted but does not need to be read back in full.",
        "Callsign at the end.",
      ],
      examples: [
        {
          label: "ATC landing clearance",
          atcText: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared to land.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees eight knots, cleared to land.",
          readback: "Cleared to land runway 36, G-ABCD.",
        },
      ],
    }),

    ldChipExercise({
      id: "sp-landing.landing-clearance.complete-readback",
      title: "Complete the landing readback",
      description: "Build the readback of the landing clearance.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the correct readback.",
      atcText: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared to land.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees eight knots, cleared to land.",
      prompt: "Build the readback.",
      helperText: "Cleared to land · runway · callsign.",
      expected: [
        { id: "clr-clear", text: "Cleared to land runway 36" },
        { id: "clr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "clr-d-cont", text: "Continue approach" },
        { id: "clr-d-rwy24", text: "Cleared to land runway 24" },
        { id: "clr-d-wind", text: "wind 340 degrees 8 knots" },
      ],
      expectedSentence: "Cleared to land runway 36, G-ABCD.",
      expectedSpoken: "Cleared to land runway three six, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Cleared to land · runway 36 · callsign.",
      incorrectFeedback: "Readback: Cleared to land · runway · callsign.",
    }),

    ldChipExercise({
      id: "sp-landing.landing-clearance.build-readback",
      title: "Build the landing readback",
      description: "Order the parts of the landing clearance readback.",
      screenKicker: "Listening",
      headerInstruction: "Order the readback parts correctly.",
      atcText: "G-ABCD, runway 36, cleared to land.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared to land.",
      prompt: "Order the readback.",
      expected: [
        { id: "blr-clear", text: "Cleared to land" },
        { id: "blr-rwy", text: "runway 36" },
        { id: "blr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "blr-d-rwy24", text: "runway 24" },
        { id: "blr-d-ga", text: "Going around" },
      ],
      expectedSentence: "Cleared to land runway 36, G-ABCD.",
      expectedSpoken: "Cleared to land runway three six, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Cleared to land · runway · callsign in that order.",
      incorrectFeedback: "Order: Cleared to land · runway · callsign.",
    }),

    ldChoiceExercise({
      id: "sp-landing.landing-clearance.wrong-runway-readback",
      title: "Wrong runway readback",
      description: "Identify the incorrect runway in the landing readback.",
      screenKicker: "Error detection",
      instruction: "ATC cleared you for runway 36. Check the pilot readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, runway 36, cleared to land.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared to land.",
      shownReadback: "Cleared to land runway 24, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "wrr2-rwy", text: "The runway is wrong. ATC cleared runway 36.", feedback: "Correct. The pilot read back runway 24 instead of runway 36 — a critical error." },
        { id: "wrr2-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The runway number does not match." },
        { id: "wrr2-phrase", text: "The phrase is wrong.", feedback: '"Cleared to land" is correct. The runway number is the error.' },
        { id: "wrr2-none", text: "Nothing is wrong.", feedback: "ATC cleared runway 36. The readback states runway 24." },
      ],
      correctId: "wrr2-rwy",
    }),

    ldReadbackExercise({
      id: "sp-landing.landing-clearance.trainer",
      title: "Landing clearance trainer",
      description: "Practise reading back the landing clearance.",
      headerInstruction: "Read back the landing clearance issued by ATC.",
      cardLabel: "ATC clearance",
      contextRevealed: true,
      rounds: [
        {
          id: "sp-landing.landing-clearance.trainer.r1",
          atcText: "G-ABCD, runway 36, wind 340 degrees 8 knots, cleared to land.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, wind three four zero degrees eight knots, cleared to land.",
          expectedReadback: "Cleared to land runway 36, G-ABCD.",
          expectedReadbackSpoken: "Cleared to land runway three six, Golf Alpha Bravo Charlie Delta.",
          runway: "36",
        },
      ],
    }),
  ],
};

/* ── Section 4 — Traffic & Runway Occupied ───────────────────────────── */
const trafficRunwayOccupiedTopic: Topic = {
  id: "sp-landing.traffic-runway-occupied",
  name: "Traffic & Runway Occupied",
  description: "Recognise an occupied runway and expect continue approach.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.traffic-runway-occupied.lesson",
      title: "Runway occupied",
      description: "What to expect when traffic is vacating the runway.",
      lessonBody:
        "If the runway is still occupied by another aircraft, ATC will not issue a landing clearance yet. Instead you will receive continue approach. You must not land until cleared to land.",
      points: [
        '"Continue approach, traffic vacating runway" — the runway is not free yet.',
        "Wait for cleared to land before touching down.",
        "The vacating aircraft must be clear before ATC can clear you.",
        "Do not land without a clearance, even if the runway looks clear.",
      ],
      examples: [
        {
          label: "Runway occupied — continue approach",
          atcText: "G-ABCD, continue approach, traffic vacating runway.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach, traffic vacating runway.",
          readback: "Continue approach, G-ABCD.",
        },
      ],
    }),

    ldChoiceExercise({
      id: "sp-landing.traffic-runway-occupied.available-or-occupied",
      title: "Runway available or occupied?",
      description: "Decide whether you have a landing clearance.",
      screenKicker: "Choice",
      instruction: "ATC says: G-ABCD, continue approach, traffic vacating runway. Can you land?",
      question: "Do you have landing clearance?",
      atcDisplay: "G-ABCD, continue approach, traffic vacating runway.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach, traffic vacating runway.",
      atcHidden: true,
      options: [
        { id: "aoo-no", text: "No — the runway is occupied. I must wait for cleared to land.", feedback: "Correct. Traffic is vacating. You have not been cleared to land yet." },
        { id: "aoo-yes", text: "Yes — continue approach means I can land.", feedback: "Continue approach is not a clearance. The runway is occupied." },
        { id: "aoo-maybe", text: "Maybe — if the traffic clears before I arrive.", feedback: "You need an explicit cleared to land from ATC, regardless of what you see." },
        { id: "aoo-soon", text: "Not yet, but I can start the landing flare early.", feedback: "Do not commit to landing without a clearance." },
      ],
      correctId: "aoo-no",
    }),

    ldChipExercise({
      id: "sp-landing.traffic-runway-occupied.occupied-readback",
      title: "Complete the occupied runway readback",
      description: "Build the readback when the runway is occupied.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the ATC message and build the correct readback.",
      atcText: "G-ABCD, continue approach, traffic vacating runway.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach, traffic vacating runway.",
      prompt: "Build the readback.",
      expected: [
        { id: "orb-cont", text: "Continue approach" },
        { id: "orb-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "orb-d-land", text: "Cleared to land runway 36" },
        { id: "orb-d-traffic", text: "traffic vacating runway" },
        { id: "orb-d-ga", text: "Going around" },
      ],
      expectedSentence: "Continue approach, G-ABCD.",
      expectedSpoken: "Continue approach, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back continue approach and your callsign. The traffic information does not need to be repeated.",
      incorrectFeedback: "Readback: Continue approach · callsign.",
    }),

    ldChoiceExercise({
      id: "sp-landing.traffic-runway-occupied.unsafe-readback",
      title: "Unsafe readback detection",
      description: "Identify the unsafe pilot response to a runway occupied message.",
      screenKicker: "Error detection",
      instruction: "ATC said continue approach, runway occupied. Check the pilot readback.",
      question: "Is the readback safe?",
      atcDisplay: "G-ABCD, continue approach, runway occupied.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, continue approach, runway occupied.",
      shownReadback: "Cleared to land runway 36, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "urd-unsafe", text: "No — the pilot read back a clearance that was not given. Unsafe.", feedback: "Correct. ATC did not issue cleared to land. The readback is unsafe and incorrect." },
        { id: "urd-ok", text: "Yes — the readback is correct.", feedback: "ATC said continue approach. Reading back cleared to land when not issued is unsafe." },
        { id: "urd-minor", text: "It is a minor phrasing difference only.", feedback: "This is a safety-critical error. Cleared to land was not issued." },
        { id: "urd-fine", text: "Fine — the callsign is in the readback so it is correct.", feedback: "The callsign is not the issue. The clearance was never issued." },
      ],
      correctId: "urd-unsafe",
    }),
  ],
};

/* ── Section 5 — Late Clearance ──────────────────────────────────────── */
const lateClearanceTopic: Topic = {
  id: "sp-landing.late-clearance",
  name: "Late Clearance",
  description: "Receive a late landing clearance — or go around if none arrives.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.late-clearance.lesson",
      title: "Late landing clearance",
      description: "Landing clearance may arrive late — but must arrive before landing.",
      lessonBody:
        "ATC may issue landing clearance late in the approach. This is normal. If the clearance arrives, read it back clearly and land. If it does not arrive before touchdown, you must go around.",
      points: [
        "Late clearance is common at busy aerodromes.",
        "If cleared to land arrives late, read it back and land normally.",
        "If no clearance arrives before short final, initiate a go-around.",
        "Never land without cleared to land, even on a visual approach.",
      ],
      examples: [
        {
          label: "Late clearance",
          atcText: "G-ABCD, runway 36, cleared to land.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared to land.",
          readback: "Cleared to land runway 36, G-ABCD.",
        },
      ],
    }),

    ldChoiceExercise({
      id: "sp-landing.late-clearance.continue-or-land",
      title: "Continue or land?",
      description: "Decide the correct action based on the ATC message.",
      screenKicker: "Choice",
      instruction: "ATC now says: G-ABCD, runway 36, cleared to land. What do you do?",
      question: "What is the correct action?",
      atcDisplay: "G-ABCD, runway 36, cleared to land.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared to land.",
      atcHidden: true,
      options: [
        { id: "col-land", text: "Read back the clearance and land normally.", feedback: "Correct. ATC has now issued cleared to land. Read it back and continue to land." },
        { id: "col-ga", text: "Go around — it is too late.", feedback: "The clearance arrived. Read it back and land. Only go around if no clearance arrives." },
        { id: "col-cont", text: "Continue approach without reading back.", feedback: "You must always read back a landing clearance." },
        { id: "col-wait", text: "Wait for another clearance to confirm.", feedback: "One cleared to land is sufficient. Read it back and land." },
      ],
      correctId: "col-land",
    }),

    ldChoiceExercise({
      id: "sp-landing.late-clearance.what-changed",
      title: "Clearance received",
      description: "Recognise that a late clearance now authorises landing.",
      screenKicker: "Choice",
      instruction: "You have only received continue approach so far. ATC now transmits:",
      question: "What does this mean for you?",
      atcDisplay: "G-ABCD, runway 36, cleared to land.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, runway three six, cleared to land.",
      atcHidden: true,
      options: [
        { id: "wc-land", text: "You are now cleared to land. Read it back and land.", feedback: "Correct. Cleared to land has now been issued — even though it arrived late. Read it back and continue." },
        { id: "wc-cont", text: "You must still continue approach only.", feedback: "No — this is cleared to land. The status has changed from continue approach." },
        { id: "wc-ga", text: "You must go around — the clearance arrived too late.", feedback: "A go-around is only needed if no clearance arrives. One has arrived now." },
        { id: "wc-conf", text: "You need a second clearance to confirm.", feedback: "One cleared to land is sufficient. Read it back and land." },
      ],
      correctId: "wc-land",
    }),

    ldChoiceExercise({
      id: "sp-landing.late-clearance.no-clearance-decision",
      title: "No clearance decision",
      description: "Decide what to do when no landing clearance has been received.",
      screenKicker: "Choice",
      instruction: "You are on short final. You have only received continue approach. No landing clearance has been issued. What must you do?",
      question: "What is the correct action?",
      options: [
        { id: "ncd-ga", text: "Go around if no landing clearance is received.", feedback: "Correct. Without cleared to land, initiate a go-around." },
        { id: "ncd-land", text: "Land — the runway looks clear.", feedback: "Never land without an explicit clearance. Go around." },
        { id: "ncd-cont", text: "Continue and wait a few more seconds.", feedback: "If you are on short final with no clearance, initiate the go-around immediately." },
        { id: "ncd-slow", text: "Slow down and wait.", feedback: "On short final, slowing down is not safe. Go around if no clearance." },
      ],
      correctId: "ncd-ga",
    }),
  ],
};

/* ── Section 6 — Go Around ───────────────────────────────────────────── */
const goAroundTopic: Topic = {
  id: "sp-landing.go-around",
  name: "Go Around",
  description: "Respond to a go-around instruction clearly and immediately.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.go-around.lesson",
      title: "Go around",
      description: "How to respond to a go-around instruction.",
      lessonBody:
        "A go-around instruction from ATC is critical. Respond immediately, climb away and acknowledge with Going around. Do not argue or delay. You can also initiate a go-around yourself if safety requires it.",
      points: [
        '"G-ABCD, go around, I say again, go around" — respond immediately.',
        'Acknowledge with "Going around, G-ABCD."',
        "Do not use roger alone. Confirm the action.",
        "A go-around can be ATC-instructed or pilot-initiated.",
        "After the go-around, wait for further instructions.",
      ],
      examples: [
        {
          label: "ATC instructs go-around",
          atcText: "G-ABCD, go around, I say again, go around.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, go around, I say again, go around.",
          readback: "Going around, G-ABCD.",
        },
      ],
    }),

    ldChoiceExercise({
      id: "sp-landing.go-around.acknowledgement",
      title: "Go around acknowledgement",
      description: "Choose the correct response to a go-around instruction.",
      screenKicker: "Choice",
      instruction: "ATC says: G-ABCD, go around. What is the correct response?",
      question: "Which response is correct?",
      atcDisplay: "G-ABCD, go around, I say again, go around.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, go around, I say again, go around.",
      atcHidden: true,
      options: [
        { id: "gaa-going", text: "Going around, G-ABCD.", feedback: "Correct. Short, clear acknowledgement confirming the action and callsign." },
        { id: "gaa-roger", text: "Roger, G-ABCD.", feedback: '"Roger" confirms receipt but does not confirm the action. Use "Going around".' },
        { id: "gaa-cont", text: "Continuing approach, G-ABCD.", feedback: "ATC instructed a go-around. You must comply immediately." },
        { id: "gaa-wilco", text: "Wilco, G-ABCD.", feedback: '"Wilco" is sometimes used but "Going around" is the standard aviation response for this instruction.' },
      ],
      correctId: "gaa-going",
    }),

    ldChipExercise({
      id: "sp-landing.go-around.read-back",
      title: "Read back go around",
      description: "Build the go-around acknowledgement.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the go-around response.",
      atcText: "G-ABCD, go around, I say again, go around.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, go around, I say again, go around.",
      prompt: "Build the response.",
      expected: [
        { id: "rbga-going", text: "Going around" },
        { id: "rbga-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "rbga-d-cont", text: "Continuing approach" },
        { id: "rbga-d-roger", text: "Roger" },
        { id: "rbga-d-land", text: "Cleared to land runway 36" },
      ],
      expectedSentence: "Going around, G-ABCD.",
      expectedSpoken: "Going around, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Going around · callsign. Short and immediate.",
      incorrectFeedback: "Response: Going around · callsign.",
    }),

    ldChoiceExercise({
      id: "sp-landing.go-around.wrong-action",
      title: "Wrong action detection",
      description: "Identify the unsafe pilot response to a go-around instruction.",
      screenKicker: "Error detection",
      instruction: "ATC instructed a go-around. Check the pilot response.",
      question: "Is this response correct?",
      atcDisplay: "G-ABCD, go around.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, go around.",
      shownReadback: "Continuing to land, G-ABCD.",
      shownReadbackLabel: "Pilot response",
      options: [
        { id: "wad-wrong", text: "No — the pilot must go around immediately. Continuing to land is unsafe.", feedback: "Correct. A go-around instruction must be followed immediately. Continuing to land is non-compliant and unsafe." },
        { id: "wad-ok", text: "Yes — the runway looks clear so landing is acceptable.", feedback: "The runway status is not relevant. ATC issued a go-around instruction. It must be followed." },
        { id: "wad-minor", text: "It is a minor phrasing issue only.", feedback: "This is a safety-critical non-compliance. The pilot must go around." },
        { id: "wad-fine", text: "Fine — the callsign is correct.", feedback: "The callsign is correct but the action is not. The pilot must go around." },
      ],
      correctId: "wad-wrong",
    }),
  ],
};

/* ── Section 7 — Vacate Runway ───────────────────────────────────────── */
const vacateRunwayTopic: Topic = {
  id: "sp-landing.vacate-runway",
  name: "Vacate Runway",
  description: "Read back the vacate instruction and report runway vacated.",
  unit: "exercises",
  exercises: [
    ldLessonExercise({
      id: "sp-landing.vacate-runway.lesson",
      title: "Vacating the runway",
      description: "Follow the vacate instruction and report clear.",
      lessonBody:
        "After landing, ATC will tell you which way to vacate the runway. Read back the direction and taxiway. Once you are clear, report runway vacated. This completes your interaction with the runway.",
      points: [
        '"Vacate left via Delta" — read back direction and taxiway.',
        '"Runway vacated, G-ABCD" — report when clear of the runway.',
        "Taxi to parking is handled separately — see After Landing & Parking.",
        "Do not enter another runway without clearance.",
      ],
      examples: [
        {
          label: "Vacate instruction",
          atcText: "G-ABCD, vacate left via Delta.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, vacate left via Delta.",
          readback: "Vacate left via Delta, G-ABCD.",
        },
        {
          label: "Runway vacated report",
          atcText: "Runway vacated, G-ABCD.",
          atcSpoken: "Runway vacated, Golf Alpha Bravo Charlie Delta.",
          readback: "Runway vacated, G-ABCD.",
        },
      ],
    }),

    ldChipExercise({
      id: "sp-landing.vacate-runway.complete-vacate",
      title: "Complete the vacate instruction",
      description: "Build the readback of the vacate instruction.",
      screenKicker: "Listening",
      headerInstruction: "Listen and build the readback of the vacate instruction.",
      atcText: "G-ABCD, vacate left via Delta.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, vacate left via Delta.",
      prompt: "Build the readback.",
      expected: [
        { id: "cvr-vac", text: "Vacate left via Delta" },
        { id: "cvr-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cvr-d-right", text: "Vacate right via Delta" },
        { id: "cvr-d-alfa", text: "Vacate left via Alfa" },
      ],
      expectedSentence: "Vacate left via Delta, G-ABCD.",
      expectedSpoken: "Vacate left via Delta, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. Read back: vacate direction · taxiway · callsign.",
      incorrectFeedback: "Readback: Vacate left via Delta · callsign.",
    }),

    ldChoiceExercise({
      id: "sp-landing.vacate-runway.left-or-right",
      title: "Left or right vacate?",
      description: "Identify the incorrect vacate direction in the readback.",
      screenKicker: "Error detection",
      instruction: "ATC said vacate left. Check the pilot readback.",
      question: "What is wrong?",
      atcDisplay: "G-ABCD, vacate left via Delta.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, vacate left via Delta.",
      shownReadback: "Vacate right via Delta, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "lor-dir", text: "The direction is wrong. ATC said vacate left.", feedback: "Correct. The pilot read back right instead of left — a different exit from the runway." },
        { id: "lor-twi", text: "The taxiway is wrong.", feedback: "Delta matches. The direction is the error." },
        { id: "lor-cs", text: "The callsign is wrong.", feedback: "G-ABCD is correct. The vacate direction does not match." },
        { id: "lor-none", text: "Nothing is wrong.", feedback: "ATC said left. The pilot read back right." },
      ],
      correctId: "lor-dir",
    }),

    ldReadbackExercise({
      id: "sp-landing.vacate-runway.report-vacated",
      title: "Report runway vacated",
      description: "Report that you have vacated the runway.",
      headerInstruction: "ATC instructed you to vacate left via Delta. You have done so. Report runway vacated.",
      cardLabel: "ATC instruction",
      contextRevealed: true,
      rounds: [
        {
          id: "sp-landing.vacate-runway.report-vacated.r1",
          atcText: "G-ABCD, vacate left via Delta.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, vacate left via Delta.",
          expectedReadback: "Runway vacated, G-ABCD.",
          expectedReadbackSpoken: "Runway vacated, Golf Alpha Bravo Charlie Delta.",
        },
      ],
    }),
  ],
};

/* ── Section 8 — Landing Scenario ───────────────────────────────────── */
const landingScenarioTopic: Topic = {
  id: "sp-landing.landing-scenario",
  name: "Landing Scenario",
  description: "Final report through to runway vacated.",
  unit: "scenario",
  exercises: [
    {
      id: "sp-landing.landing-scenario.mission",
      title: "Final to runway vacated",
      description: "Report final, acknowledge continue approach, read back landing clearance and vacate the runway.",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "landing",
        scenarioKind: "mission",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        instruction:
          "You are on final for runway 36. Report final, acknowledge the continue approach, read back the landing clearance, follow the vacate instruction and report runway vacated.",
        spScenarioKicker: "Scenario",
        spScenarioHeading: "Final to runway vacated",
        spScenarioCompletionNote:
          "Final call correct, continue approach acknowledged, landing clearance read back, vacate instruction followed and runway vacated reported. You have vacated the runway.",
        spScenarioSteps: LANDING_SCENARIO_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

const landingTopics: Topic[] = [
  reportFinalTopic,
  continueApproachTopic,
  landingClearanceTopic,
  trafficRunwayOccupiedTopic,
  lateClearanceTopic,
  goAroundTopic,
  vacateRunwayTopic,
  landingScenarioTopic,
];

const landing: Module = {
  id: "sp-landing",
  name: "Approach & Landing",
  subtitle: "Final approach, landing clearance, go-around and vacate the runway.",
  unit: "topics",
  topics: landingTopics,
  exercises: landingTopics.flatMap((t) => t.exercises),
};

/* ------------------------------------------------------------------ */
/* 8. After Landing & Parking                                          */
/* ------------------------------------------------------------------ */

function pkChoiceExercise(opts: {
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
      phase: "parking",
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

function pkChipExercise(opts: {
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
    id: e.id, text: e.text, spoken: e.spoken, segmentType: toSegType(e.text),
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
    chipBank: toMixChips(expectedSegments, distractorSegments),
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
      phase: "parking",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spScreenKicker: opts.screenKicker,
      spClearanceSection: { rounds: [round] } satisfies SpClearanceSection,
    } satisfies ExerciseContent,
  };
}

function pkReadbackExercise(opts: {
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
    runway?: string;
  }[];
}): Exercise {
  const rounds: SpReadbackRound[] = opts.rounds.map((r) => ({
    id: r.id,
    atcText: r.atcText,
    atcSpoken: r.atcSpoken,
    runway: r.runway ?? "-",
    departureDirection: "-",
    callsign: "G-ABCD",
    expectedReadback: r.expectedReadback,
    expectedReadbackSpoken: r.expectedReadbackSpoken,
    expectedElements: { runway: r.runway ?? "-", direction: "-", callsign: "G-ABCD" },
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
      phase: "parking",
      spVisualMode: "none",
      instruction: opts.headerInstruction,
      spReadbackSection: { rounds } satisfies SpReadbackSection,
    } satisfies ExerciseContent,
  };
}

function pkLessonExercise(opts: {
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
      phase: "parking",
      instruction: opts.title,
      lessonBody: opts.lessonBody,
      spLessonPoints: opts.points,
      spLessonExamples: opts.examples,
      spChartCrop: undefined,
      spVisualMode: "none",
    } satisfies ExerciseContent,
  };
}

/* ── Section 1 — Taxi To Parking ────────────────────────────────────── */
const taxiToParkingTopic: Topic = {
  id: "sp-parking.taxi-to-parking",
  name: "Taxi To Parking",
  description: "Read back the taxi route to parking or a stand.",
  unit: "exercises",
  exercises: [
    pkLessonExercise({
      id: "sp-parking.taxi-to-parking.lesson",
      title: "Taxi to parking",
      description: "Reading the route to parking or a stand.",
      lessonBody:
        "After landing and vacating the runway, ATC may give you a taxi route to parking or a stand.",
      points: [
        "Read back the stand or parking destination.",
        "Read back the taxiways in order.",
        "Include your callsign.",
        "Do not add extra taxiways.",
      ],
      examples: [
        {
          label: "Taxi to parking",
          atcText: "G-ABCD, taxi to Stand 4 via Delta and Alfa.",
          atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to Stand four via Delta and Alfa.",
          readback: "Taxi to Stand 4 via Delta and Alfa, G-ABCD.",
        },
      ],
    }),

    pkChipExercise({
      id: "sp-parking.taxi-to-parking.complete-taxi",
      title: "Complete taxi to parking",
      description: "Complete the parking taxi readback.",
      screenKicker: "Listening",
      headerInstruction: "Listen to the taxi instruction and complete the readback.",
      atcText: "G-ABCD, taxi to Stand 4 via Delta and Alfa.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to Stand four via Delta and Alfa.",
      prompt: "Complete the readback.",
      expected: [
        { id: "ct-stand", text: "Taxi to Stand 4" },
        { id: "ct-via", text: "via Delta and Alfa" },
        { id: "ct-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "ct-d-stand2", text: "Taxi to Stand 2" },
        { id: "ct-d-bravo", text: "via Bravo and Charlie" },
        { id: "ct-d-cs", text: "G-ACBD" },
      ],
      expectedSentence: "Taxi to Stand 4 via Delta and Alfa, G-ABCD.",
      expectedSpoken: "Taxi to Stand four via Delta and Alfa, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. You included the stand, the taxiways and your callsign.",
      incorrectFeedback: "Order: stand · taxiways in order · callsign.",
    }),

    pkChipExercise({
      id: "sp-parking.taxi-to-parking.build-readback",
      title: "Build the parking readback",
      description: "Order the parking readback parts.",
      screenKicker: "Listening",
      headerInstruction: "Place the parking readback parts in the correct order.",
      atcText: "G-ABCD, taxi to Stand 4 via Delta and Alfa.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to Stand four via Delta and Alfa.",
      prompt: "Order the readback parts.",
      expected: [
        { id: "bp-stand", text: "Taxi to Stand 4" },
        { id: "bp-via", text: "via Delta and Alfa" },
        { id: "bp-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "bp-d-land", text: "cleared to land" },
        { id: "bp-d-giveway", text: "give way" },
        { id: "bp-d-hold", text: "hold short runway 36" },
      ],
      expectedSentence: "Taxi to Stand 4 via Delta and Alfa, G-ABCD.",
      expectedSpoken: "Taxi to Stand four via Delta and Alfa, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. The readback is short, complete and in the right order.",
      incorrectFeedback: "Order: stand · taxiways · callsign.",
    }),

    pkChoiceExercise({
      id: "sp-parking.taxi-to-parking.wrong-stand",
      title: "Wrong stand readback",
      description: "Identify the wrong stand in the readback.",
      screenKicker: "Error detection",
      instruction: "Compare the taxi instruction and the readback, then identify the mistake.",
      question: "What is wrong with the readback?",
      atcDisplay: "G-ABCD, taxi to Stand 4 via Delta and Alfa.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to Stand four via Delta and Alfa.",
      shownReadback: "Taxi to Stand 2 via Delta and Alfa, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "ws-stand", text: "The stand is wrong. ATC assigned Stand 4.", feedback: "Correct. The stand number must match the taxi instruction." },
        { id: "ws-via", text: "The taxiways are wrong.", feedback: "The taxiways Delta and Alfa match. Look at the stand number." },
        { id: "ws-cs", text: "The callsign is wrong.", feedback: "The callsign G-ABCD is correct. Look at the stand number." },
        { id: "ws-none", text: "Nothing is wrong.", feedback: "ATC assigned Stand 4, but the readback said Stand 2." },
      ],
      correctId: "ws-stand",
    }),

    pkChoiceExercise({
      id: "sp-parking.taxi-to-parking.missing-taxiway",
      title: "Missing taxiway",
      description: "Find the taxiway missing from the readback.",
      screenKicker: "Error detection",
      instruction: "Find the taxiway missing from the readback.",
      question: "What is missing?",
      atcDisplay: "G-ABCD, taxi to Stand 4 via Delta and Alfa.",
      atcSpoken: "Golf Alpha Bravo Charlie Delta, taxi to Stand four via Delta and Alfa.",
      shownReadback: "Taxi to Stand 4 via Delta, G-ABCD.",
      shownReadbackLabel: "Pilot readback",
      options: [
        { id: "mt-alfa", text: "Alfa", feedback: "Correct. The readback missed Alfa, so the taxi route is incomplete." },
        { id: "mt-delta", text: "Delta", feedback: "Delta was read back. A different taxiway is missing." },
        { id: "mt-stand", text: "The stand number", feedback: "Stand 4 was read back. A taxiway is missing." },
        { id: "mt-cs", text: "The callsign", feedback: "The callsign G-ABCD is present. A taxiway is missing." },
      ],
      correctId: "mt-alfa",
    }),
  ],
};

/* ── Section 2 — Parking Complete ───────────────────────────────────── */
const parkingCompleteTopic: Topic = {
  id: "sp-parking.parking-complete",
  name: "Parking Complete",
  description: "Close the operation once on stand or parking.",
  unit: "exercises",
  exercises: [
    pkLessonExercise({
      id: "sp-parking.parking-complete.lesson",
      title: "Parking complete",
      description: "Closing the operation once parked.",
      lessonBody:
        "Once parked, make a short final call to confirm the aircraft is on stand or parking complete.",
      points: [
        "Keep the call short.",
        "Use your callsign.",
        "Do not add unnecessary details.",
        "This closes the radio flow for the flight.",
      ],
      examples: [
        {
          label: "Final call",
          atcText: "Parking complete, G-ABCD.",
          atcSpoken: "Parking complete, Golf Alpha Bravo Charlie Delta.",
          readback: "Parking complete, G-ABCD.",
        },
      ],
    }),

    pkReadbackExercise({
      id: "sp-parking.parking-complete.make-call",
      title: "Make parking complete call",
      description: "Make the final parking call.",
      headerInstruction: "You are parked on stand. Make the final call.",
      cardLabel: "Situation",
      contextRevealed: true,
      rounds: [
        {
          id: "sp-parking.parking-complete.make-call.r1",
          atcText: "You are parked on Stand 4.",
          atcSpoken: "You are parked on Stand four.",
          expectedReadback: "Parking complete, G-ABCD.",
          expectedReadbackSpoken: "Parking complete, Golf Alpha Bravo Charlie Delta.",
        },
      ],
    }),

    pkChipExercise({
      id: "sp-parking.parking-complete.complete-final-call",
      title: "Complete final call",
      description: "Complete the final parking call.",
      screenKicker: "Listening",
      headerInstruction: "Complete the final parking call.",
      atcText: "Parking complete, G-ABCD.",
      atcSpoken: "Parking complete, Golf Alpha Bravo Charlie Delta.",
      prompt: "Complete the final call.",
      expected: [
        { id: "cf-complete", text: "Parking complete" },
        { id: "cf-cs", text: "G-ABCD" },
      ],
      distractors: [
        { id: "cf-d-cleared", text: "cleared" },
        { id: "cf-d-runway", text: "runway" },
        { id: "cf-d-cs", text: "G-ACBD" },
      ],
      expectedSentence: "Parking complete, G-ABCD.",
      expectedSpoken: "Parking complete, Golf Alpha Bravo Charlie Delta.",
      correctFeedback: "Correct. A simple parking complete call is enough.",
      incorrectFeedback: "Order: parking complete · callsign.",
    }),

    pkChoiceExercise({
      id: "sp-parking.parking-complete.choose-closing-call",
      title: "Choose clean closing call",
      description: "Choose the cleanest final radio call.",
      screenKicker: "Choice",
      instruction: "Choose the cleanest final radio call.",
      question: "Which call is best once parked?",
      options: [
        { id: "cc-clean", text: "Parking complete, G-ABCD.", feedback: "Correct. Keep the final call short and professional." },
        { id: "cc-long", text: "We are fully stopped and shutting down now, thank you, G-ABCD.", feedback: "Too long. Keep the final call short and professional." },
        { id: "cc-stack", text: "Taxi complete and landing complete and parking complete, G-ABCD.", feedback: "Too much. A single parking complete call is enough." },
        { id: "cc-clear", text: "Cleared to park, G-ABCD.", feedback: "You do not clear yourself. Report parking complete instead." },
      ],
      correctId: "cc-clean",
    }),
  ],
};

/* ── Section 3 — Parking Scenario ───────────────────────────────────── */
const parkingScenarioTopic: Topic = {
  id: "sp-parking.parking-scenario",
  name: "Parking Scenario",
  description: "Read back a parking taxi route and close the flight cleanly.",
  unit: "scenario",
  exercises: [
    {
      id: "sp-parking.parking-scenario.mission",
      title: "Runway vacated to parking complete",
      description: "Read back a parking taxi route and close the flight cleanly.",
      type: "Scenario",
      free: false,
      content: {
        blockType: "section-scenario",
        phase: "parking",
        scenarioKind: "mission",
        scenarioStyle: "conversation",
        spVisualMode: "none",
        instruction:
          "From runway vacated to parking complete. Read back the parking taxi route, accept the route correction and make the final parking call.",
        spScenarioKicker: "Scenario",
        spScenarioHeading: "Runway vacated to parking complete",
        spScenarioCompletionNote: "Parking route read back, stand confirmed, route correction understood and final parking call made.",
        spScenarioSteps: PARKING_SCENARIO_STEPS,
      } satisfies ExerciseContent,
    },
  ],
};

const parkingTopics: Topic[] = [
  taxiToParkingTopic,
  parkingCompleteTopic,
  parkingScenarioTopic,
];

const parking: Module = {
  id: "sp-parking",
  name: "After Landing & Parking",
  subtitle: "Taxi to parking, stand assignment and closing the flight.",
  unit: "topics",
  topics: parkingTopics,
  exercises: parkingTopics.flatMap((t) => t.exercises),
};

/* ------------------------------------------------------------------ */
/* Exports                                                             */
/* ------------------------------------------------------------------ */

export const STUDENT_PILOT_MODULES: Module[] = [
  preflight,
  taxi,
  takeoff,
  circuit,
  arrival,
  landing,
  parking,
];

/** Optional visual grouping for the Train level selector. */
export const STUDENT_PILOT_SECTIONS = [
  { title: "Ground & Departure", modules: [preflight, taxi, takeoff] },
  { title: "Circuit, Arrival & Landing", modules: [circuit, arrival, landing, parking] },
];
