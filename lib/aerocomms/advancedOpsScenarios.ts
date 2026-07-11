/**
 * AeroComms — Advanced Ops scenario steps.
 *
 * Seven capstone scenarios, one per module. Each is a short conversation-style
 * exchange (narrator / pilot-speak / atc-hidden / pilot-readback) reusing the
 * Student Pilot SpScenarioStep contract and the SpConversationScenario renderer.
 *
 * Advanced Ops is abnormal / emergency communication under pressure: weather
 * deviations, diversions, PAN PAN, MAYDAY, high workload, difficult radio and
 * unexpected events.
 *
 * Spoken forms follow docs/AeroComms_ICAO_Radiotelephony_Reference.md:
 *   - G-ABCD → Golf Alfa Bravo Charlie Delta
 *   - runway 27 → runway two seven
 *   - FL120 → flight level one two zero (digit by digit)
 *   - heading 270 → heading two seven zero (three digits)
 *   - heading 290 → heading two niner zero
 *   - 124.700 → one two four decimal seven (decimal, trailing zeros omitted)
 *   - PAN PAN → PAN PAN, PAN PAN, PAN PAN
 *   - MAYDAY → MAYDAY, MAYDAY, MAYDAY
 */

import type { SpScenarioStep } from "./content";

/* ------------------------------------------------------------------ */
/* Module 1 — Weather Deviation Scenario                               */
/* ------------------------------------------------------------------ */

export const WEATHER_DEVIATION_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aow0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Weather builds ahead on your route. You need to keep clear of it.",
  },
  {
    id: "aow1-pilot-deviation",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, weather ahead, request deviation right of track.",
    spoken: "Golf Alfa Bravo Charlie Delta, weather ahead, request deviation right of track.",
    expectedReadback: "G-ABCD, weather ahead, request deviation right of track.",
    readbackPrompt: "Report and request: callsign · weather ahead · request deviation · direction.",
    micInstruction: "Report the weather and request a deviation right of track.",
  },
  {
    id: "aow2-atc-approved",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, deviation to the right approved.",
    spoken: "Golf Alfa Bravo Charlie Delta, deviation right approved.",
  },
  {
    id: "aow3-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Deviation to the right approved, G-ABCD.",
    spoken: "Deviation to the right approved, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Deviation to the right approved, G-ABCD.",
    readbackPrompt: "Read back: deviation · direction · approved · callsign.",
    micInstruction: "Read back the approved deviation.",
  },
  {
    id: "aow4-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "The weather worsens and the original route is no longer safe.",
  },
  {
    id: "aow5-pilot-reroute",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, unable due weather, request re-route via West Bridge.",
    spoken: "Golf Alfa Bravo Charlie Delta, unable due weather, request re-route via West Bridge.",
    expectedReadback: "G-ABCD, unable due weather, request re-route via West Bridge.",
    readbackPrompt: "State: callsign · unable due weather · request re-route · via fix.",
    micInstruction: "Say unable due weather and request a re-route via West Bridge.",
  },
  {
    id: "aow6-atc-route",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, route via West Bridge approved.",
    spoken: "Golf Alfa Bravo Charlie Delta, route via West Bridge approved.",
  },
  {
    id: "aow7-pilot-route",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Route via West Bridge, G-ABCD.",
    spoken: "Route via West Bridge, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Route via West Bridge, G-ABCD.",
    readbackPrompt: "Read back: route · via fix · callsign.",
    micInstruction: "Read back the approved re-route.",
  },
  {
    id: "aow8-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "You avoided unsafe weather and communicated the route change clearly.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 2 — Diversion Scenario                                       */
/* ------------------------------------------------------------------ */

export const DIVERSION_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aod0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Destination weather deteriorates below your safe minima. You decide to divert.",
  },
  {
    id: "aod1-pilot-request",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Vueling 789, request diversion to Hilltown due to weather.",
    spoken: "Vueling Seven Eight Nine, request diversion to Hilltown due to weather.",
    expectedReadback: "Vueling 789, request diversion to Hilltown due to weather.",
    readbackPrompt: "Request: callsign · request diversion · destination · reason.",
    micInstruction: "Request a diversion to Hilltown and give the reason.",
  },
  {
    id: "aod2-atc-route",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Vueling 789, route direct Hilltown, maintain two thousand feet.",
    spoken: "Vueling Seven Eight Nine, route direct Hilltown, maintain two thousand feet.",
  },
  {
    id: "aod3-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Route direct Hilltown, maintain two thousand feet, Vueling 789.",
    spoken: "Route direct Hilltown, maintain two thousand feet, Vueling Seven Eight Nine.",
    expectedReadback: "Route direct Hilltown, maintain two thousand feet, Vueling 789.",
    readbackPrompt: "Read back: route direct · destination · altitude · callsign.",
    micInstruction: "Read back the routing and altitude.",
  },
  {
    id: "aod4-pilot-update",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Vueling 789, now diverting to Hilltown, estimating Hilltown at four zero.",
    spoken: "Vueling Seven Eight Nine, now diverting to Hilltown, estimating Hilltown at four zero.",
    expectedReadback: "Vueling 789, now diverting to Hilltown, estimating Hilltown at four zero.",
    readbackPrompt: "Update: callsign · now diverting · destination · estimate.",
    micInstruction: "Update your intentions with the new destination and estimate.",
  },
  {
    id: "aod5-atc-contact",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Vueling 789, contact Hilltown Radio 123.455.",
    spoken: "Vueling Seven Eight Nine, contact Hilltown Radio one two three decimal four fife fife.",
  },
  {
    id: "aod6-pilot-contact",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Contact Hilltown Radio 123.455, Vueling 789.",
    spoken: "Contact Hilltown Radio one two three decimal four fife fife, Vueling Seven Eight Nine.",
    expectedReadback: "Contact Hilltown Radio 123.455, Vueling 789.",
    readbackPrompt: "Read back: contact · station · frequency · callsign.",
    micInstruction: "Read back the frequency transfer.",
  },
  {
    id: "aod7-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "You informed ATC and established the diversion plan.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 3 — PAN PAN Scenario                                         */
/* ------------------------------------------------------------------ */

export const PAN_PAN_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aop0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "The engine is running rough. The aircraft is controllable, but you need a priority return.",
  },
  {
    id: "aop1-pilot-pan",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
    spoken: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, Golf Alfa Bravo Charlie Delta, engine rough running, request priority return.",
    expectedReadback: "PAN PAN, PAN PAN, PAN PAN, Brindale Approach, G-ABCD, engine rough running, request priority return.",
    readbackPrompt: "PAN PAN ×3 · station · callsign · nature · request.",
    micInstruction: "Make the PAN PAN urgency call.",
  },
  {
    id: "aop2-atc-route",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, roger PAN PAN, route direct Brindale, maintain two thousand feet.",
    spoken: "Golf Alfa Bravo Charlie Delta, roger PAN PAN, route direct Brindale, maintain two thousand feet.",
  },
  {
    id: "aop3-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Direct Brindale, maintain two thousand feet, G-ABCD.",
    spoken: "Direct Brindale, maintain two thousand feet, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Direct Brindale, maintain two thousand feet, G-ABCD.",
    readbackPrompt: "Read back: route direct · destination · altitude · callsign.",
    micInstruction: "Read back the routing and altitude.",
  },
  {
    id: "aop4-pilot-update",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, problem stable, maintaining two thousand feet.",
    spoken: "Golf Alfa Bravo Charlie Delta, problem stable, maintaining two thousand feet.",
    expectedReadback: "G-ABCD, problem stable, maintaining two thousand feet.",
    readbackPrompt: "Update: callsign · status · altitude.",
    micInstruction: "Update ATC: the problem is stable and you are maintaining two thousand feet.",
  },
  {
    id: "aop5-atc-runway",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, expect runway 27.",
    spoken: "Golf Alfa Bravo Charlie Delta, expect runway two seven.",
  },
  {
    id: "aop6-pilot-runway",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Expect runway 27, G-ABCD.",
    spoken: "Expect runway two seven, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Expect runway 27, G-ABCD.",
    readbackPrompt: "Read back: expect · runway · callsign.",
    micInstruction: "Read back the expected runway.",
  },
  {
    id: "aop7-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "Urgency declared and priority return established.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 4 — MAYDAY Scenario                                          */
/* ------------------------------------------------------------------ */

export const MAYDAY_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aom0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "The engine has failed. A forced landing is required. This is a distress situation.",
  },
  {
    id: "aom1-pilot-mayday",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "MAYDAY, MAYDAY, MAYDAY, G-ABCD, engine failure, two thousand feet, forced landing.",
    spoken: "MAYDAY, MAYDAY, MAYDAY, Golf Alfa Bravo Charlie Delta, engine failure, two thousand feet, forced landing.",
    expectedReadback: "MAYDAY, MAYDAY, MAYDAY, G-ABCD, engine failure, two thousand feet, forced landing.",
    readbackPrompt: "MAYDAY ×3 · station · callsign · nature · altitude · intention.",
    micInstruction: "Make the MAYDAY distress call.",
  },
  {
    id: "aom2-atc-vector",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, roger MAYDAY, heading 180, descend 1500 feet if able.",
    spoken: "Golf Alfa Bravo Charlie Delta, roger MAYDAY, heading one eight zero, descend one thousand five hundred feet if able.",
  },
  {
    id: "aom3-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Heading 180, descend 1500 feet if able, G-ABCD.",
    spoken: "Heading one eight zero, descend one thousand five hundred feet if able, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Heading 180, descend 1500 feet if able, G-ABCD.",
    readbackPrompt: "Read back: heading · descend · altitude · if able · callsign.",
    micInstruction: "Read back the emergency vector and descent.",
  },
  {
    id: "aom4-pilot-details",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, two persons on board, fuel endurance one hour.",
    spoken: "Golf Alfa Bravo Charlie Delta, two persons on board, fuel endurance one hour.",
    expectedReadback: "G-ABCD, two persons on board, fuel endurance one hour.",
    readbackPrompt: "Details: callsign · persons on board · fuel endurance.",
    micInstruction: "Pass the persons on board and fuel endurance.",
  },
  {
    id: "aom5-atc-services",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, emergency services alerted.",
    spoken: "Golf Alfa Bravo Charlie Delta, emergency services alerted.",
  },
  {
    id: "aom6-pilot-ack",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Emergency services alerted, G-ABCD.",
    spoken: "Emergency services alerted, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Emergency services alerted, G-ABCD.",
    acceptedVariants: ["Roger, G-ABCD"],
    readbackPrompt: "Acknowledge: emergency services alerted · callsign.",
    micInstruction: "Acknowledge that emergency services are alerted.",
  },
  {
    id: "aom7-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "Emergency declared and critical information transmitted.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 5 — High Workload Scenario                                   */
/* ------------------------------------------------------------------ */

export const HIGH_WORKLOAD_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aoh0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "A busy sector. Instructions come quickly and change. Keep your readbacks complete.",
  },
  {
    id: "aoh1-atc-multi",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, turn left heading 270, descend 3000 feet, contact Approach 124.700.",
    spoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven.",
  },
  {
    id: "aoh2-pilot-multi",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Left heading 270, descend 3000 feet, contact Approach 124.700, G-ABCD.",
    spoken: "Left heading two seven zero, descend three thousand feet, contact Approach one two four decimal seven, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Left heading 270, descend 3000 feet, contact Approach 124.700, G-ABCD.",
    readbackPrompt: "Read back all three: heading · altitude · frequency · callsign.",
    micInstruction: "Read back the heading, altitude and frequency.",
  },
  {
    id: "aoh3-atc-correction",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, correction, heading 290, not 270.",
    spoken: "Golf Alfa Bravo Charlie Delta, correction, heading two niner zero, not two seven zero.",
  },
  {
    id: "aoh4-pilot-correction",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Heading 290, G-ABCD.",
    spoken: "Heading two niner zero, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Heading 290, G-ABCD.",
    readbackPrompt: "Read back the new heading only: heading · callsign.",
    micInstruction: "Read back the corrected heading.",
  },
  {
    id: "aoh5-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Workload increases and you cannot process the next instruction safely.",
  },
  {
    id: "aoh6-pilot-standby",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Standby, high workload, G-ABCD.",
    spoken: "Standby, high workload, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Standby, high workload, G-ABCD.",
    readbackPrompt: "Buy time safely: standby · high workload · callsign.",
    micInstruction: "Tell ATC to standby because of high workload.",
  },
  {
    id: "aoh7-atc-standby",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, standby.",
    spoken: "Golf Alfa Bravo Charlie Delta, standby.",
  },
  {
    id: "aoh8-pilot-standby-ack",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Standby, G-ABCD.",
    spoken: "Standby, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Standby, G-ABCD.",
    readbackPrompt: "Acknowledge: standby · callsign.",
    micInstruction: "Acknowledge the standby.",
  },
  {
    id: "aoh9-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "You handled the workload without accepting unsafe or unclear instructions.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 6 — Difficult Radio Scenario                                 */
/* ------------------------------------------------------------------ */

export const DIFFICULT_RADIO_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aor0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "The frequency is busy and the signal is poor. Read back only what you understood.",
  },
  {
    id: "aor1-atc-instruction",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, turn left heading 270, descend 3000 feet.",
    spoken: "Golf Alfa Bravo Charlie Delta, turn left heading two seven zero, descend three thousand feet.",
  },
  {
    id: "aor2-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Left heading 270, descend 3000 feet, G-ABCD.",
    spoken: "Left heading two seven zero, descend three thousand feet, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Left heading 270, descend 3000 feet, G-ABCD.",
    readbackPrompt: "Read back: heading · altitude · callsign.",
    micInstruction: "Read back the heading and descent.",
  },
  {
    id: "aor3-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "The next transmission is broken and the heading is unreadable.",
  },
  {
    id: "aor4-pilot-sayagain",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Say again heading, G-ABCD.",
    spoken: "Say again heading, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Say again heading, G-ABCD.",
    readbackPrompt: "Ask for the specific item: say again · heading · callsign.",
    micInstruction: "Ask ATC to say again the heading only.",
  },
  {
    id: "aor5-atc-heading",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, heading 290.",
    spoken: "Golf Alfa Bravo Charlie Delta, heading two niner zero.",
  },
  {
    id: "aor6-pilot-heading",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Heading 290, G-ABCD.",
    spoken: "Heading two niner zero, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Heading 290, G-ABCD.",
    readbackPrompt: "Read back: heading · callsign.",
    micInstruction: "Read back the heading now that it is clear.",
  },
  {
    id: "aor7-atc-other",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCE, climb 4000 feet.",
    spoken: "Golf Alfa Bravo Charlie Echo, climb four thousand feet.",
  },
  {
    id: "aor8-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "That last call was for G-ABCE, not you. You avoided guessing and did not respond to the wrong callsign.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 7 — Unexpected Event Scenario                                */
/* ------------------------------------------------------------------ */

export const UNEXPECTED_EVENT_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aou0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Your approach plan changes without warning. Do not continue a cancelled or unsafe plan.",
  },
  {
    id: "aou1-atc-runway",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, runway 27 unavailable, expect holding.",
    spoken: "Golf Alfa Bravo Charlie Delta, runway two seven unavailable, expect holding.",
  },
  {
    id: "aou2-pilot-runway",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Runway 27 unavailable, expect holding, G-ABCD.",
    spoken: "Runway two seven unavailable, expect holding, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Runway 27 unavailable, expect holding, G-ABCD.",
    readbackPrompt: "Read back: runway · unavailable · expect holding · callsign.",
    micInstruction: "Read back that the runway is unavailable and you expect holding.",
  },
  {
    id: "aou3-atc-cancel",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, cancel previous clearance, route direct NARGO.",
    spoken: "Golf Alfa Bravo Charlie Delta, cancel previous clearance, route direct NARGO.",
  },
  {
    id: "aou4-pilot-cancel",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cancel previous clearance, direct NARGO, G-ABCD.",
    spoken: "Cancel previous clearance, direct NARGO, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Cancel previous clearance, direct NARGO, G-ABCD.",
    readbackPrompt: "Read back: cancel previous clearance · direct fix · callsign.",
    micInstruction: "Read back the cancelled clearance and the new routing.",
  },
  {
    id: "aou5-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "A technical caution appears. The aircraft remains stable.",
  },
  {
    id: "aou6-pilot-caution",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, technical caution, request holding.",
    spoken: "Golf Alfa Bravo Charlie Delta, technical caution, request holding.",
    expectedReadback: "G-ABCD, technical caution, request holding.",
    readbackPrompt: "Advise and request: callsign · technical caution · request holding.",
    micInstruction: "Advise the technical caution and request holding.",
  },
  {
    id: "aou7-atc-hold",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, hold at NARGO, maintain 4000 feet.",
    spoken: "Golf Alfa Bravo Charlie Delta, hold at NARGO, maintain four thousand feet.",
  },
  {
    id: "aou8-pilot-hold",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Hold at NARGO, maintain 4000 feet, G-ABCD.",
    spoken: "Hold at NARGO, maintain four thousand feet, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Hold at NARGO, maintain 4000 feet, G-ABCD.",
    readbackPrompt: "Read back: hold at fix · maintain altitude · callsign.",
    micInstruction: "Read back the hold and altitude.",
  },
  {
    id: "aou9-narrator",
    speaker: "narrator",
    interactionType: "completion",
    text: "You managed an unexpected operational change without continuing an unsafe or cancelled plan.",
  },
];
