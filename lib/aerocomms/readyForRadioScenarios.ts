/**
 * AeroComms — Ready For Radio scenario steps.
 *
 * Five capstone scenarios, one per module. Each is a short conversation-style
 * exchange (narrator / pilot-speak / atc-hidden / pilot-readback) reusing the
 * Student Pilot SpScenarioStep contract and the SpConversationScenario renderer.
 *
 * Spoken forms follow docs/AeroComms_ICAO_Radiotelephony_Reference.md:
 *   - G-ABCD → Golf Alfa Bravo Charlie Delta
 *   - runway 27 → runway two seven
 *   - QNH 1016 → QNH one zero one six
 *   - frequencies use decimal, never point
 */

import type { SpScenarioStep } from "./content";

/* ------------------------------------------------------------------ */
/* Module 1 — Cross-Country Scenario                                   */
/* ------------------------------------------------------------------ */

export const CROSS_COUNTRY_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "xc0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are leaving the local area after departure from Brindale, routing to Hilltown.",
  },
  {
    id: "xc1-pilot-open",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Information, G-ABCD, north of Brindale, routing to Hilltown.",
    spoken: "Brindale Information, Golf Alfa Bravo Charlie Delta, north of Brindale, routing to Hilltown.",
    expectedReadback: "Brindale Information, G-ABCD, north of Brindale, routing to Hilltown.",
    readbackPrompt: "Make the opening call: station · callsign · position · altitude · routing.",
    micInstruction: "Open the cross-country flight with Brindale Information.",
  },
  {
    id: "xc2-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are now overhead North Lake. Report your position and estimated to Hilltown.",
  },
  {
    id: "xc3-pilot-update",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, overhead North Lake, estimating Hilltown at two five.",
    spoken: "Golf Alfa Bravo Charlie Delta, overhead North Lake, estimating Hilltown at two five.",
    expectedReadback: "G-ABCD, overhead North Lake, estimating Hilltown at two five.",
    readbackPrompt: "Update: callsign · position · altitude · routing.",
    micInstruction: "Give an enroute position update.",
  },
  {
    id: "xc5-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Weather builds ahead. You want to route direct Hilltown.",
  },
  {
    id: "xc6-pilot-request",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, request direct Hilltown due weather.",
    spoken: "Golf Alfa Bravo Charlie Delta, request direct Hilltown due weather.",
    expectedReadback: "G-ABCD, request direct Hilltown due weather.",
    readbackPrompt: "Request the route change with a reason.",
    micInstruction: "Request direct routing due weather.",
  },
  {
    id: "xc7-atc-approved",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, direct Hilltown approved.",
    spoken: "Golf Alfa Bravo Charlie Delta, direct Hilltown approved.",
  },
  {
    id: "xc8-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Direct Hilltown, G-ABCD.",
    spoken: "Direct Hilltown, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Direct Hilltown, G-ABCD.",
    readbackPrompt: "Read back the approved route: route · callsign.",
    micInstruction: "Read back the approved direct routing.",
  },
  {
    id: "xc9-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Opening call, position update, estimate and route change all made. You are established on the updated cross-country route.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 2 — Airspace Scenario                                        */
/* ------------------------------------------------------------------ */

export const AIRSPACE_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "as0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are five miles north of Brindale at two thousand feet and want to cross controlled airspace.",
  },
  {
    id: "as1-pilot-request",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Approach, G-ERBO, five miles north, two thousand feet, request zone transit.",
    spoken: "Brindale Approach, Golf Echo Romeo Bravo Oscar, five miles north, two thousand feet, request zone transit.",
    expectedReadback: "Brindale Approach, G-ERBO, five miles north, two thousand feet, request zone transit.",
    readbackPrompt: "Request transit: station · callsign · position · altitude · request.",
    micInstruction: "Request a zone transit from Brindale Approach.",
  },
  {
    id: "as2-atc-remain",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ERBO, roger, remain outside controlled airspace.",
    spoken: "Golf Echo Romeo Bravo Oscar, remain outside controlled airspace.",
  },
  {
    id: "as3-pilot-remain",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Remain outside controlled airspace, G-ERBO.",
    spoken: "Remain outside controlled airspace, Golf Echo Romeo Bravo Oscar.",
    expectedReadback: "Remain outside controlled airspace, G-ERBO.",
    acceptedVariants: ["Wilco, G-ERBO"],
    readbackPrompt: "Read back the restriction: instruction · callsign.",
    micInstruction: "Read back the remain-outside instruction.",
  },
  {
    id: "as4-atc-cleared",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ERBO, cleared to transit controlled airspace via North Lake, not above two thousand feet.",
    spoken: "Golf Echo Romeo Bravo Oscar, cleared to transit controlled airspace via North Lake, not above two thousand feet.",
  },
  {
    id: "as5-pilot-cleared",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cleared to transit via North Lake, not above two thousand feet, G-ERBO.",
    spoken: "Cleared to transit via North Lake, not above two thousand feet, Golf Echo Romeo Bravo Oscar.",
    expectedReadback: "Cleared to transit via North Lake, not above two thousand feet, G-ERBO.",
    readbackPrompt: "Read back: clearance · route · restriction · callsign.",
    micInstruction: "Read back the transit clearance and restriction.",
  },
  {
    id: "as6-atc-report",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ERBO, report leaving controlled airspace.",
    spoken: "Golf Echo Romeo Bravo Oscar, report leaving controlled airspace.",
  },
  {
    id: "as7-pilot-report",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Report leaving controlled airspace, G-ERBO.",
    spoken: "Report leaving controlled airspace, Golf Echo Romeo Bravo Oscar.",
    expectedReadback: "Report leaving controlled airspace, G-ERBO.",
    acceptedVariants: ["Wilco, G-ERBO"],
    readbackPrompt: "Read back the report instruction: instruction · callsign.",
    micInstruction: "Read back the report instruction.",
  },
  {
    id: "as8-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Transit requested, remain-outside complied with, clearance and restriction read back. You have entered controlled airspace with a valid transit clearance and restriction.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 3 — Unfamiliar Aerodrome Scenario                            */
/* ------------------------------------------------------------------ */

export const UNFAMILIAR_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "ua0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are inbound to Hilltown for the first time, request joining information.",
  },
  {
    id: "ua1-pilot-first",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Hilltown Radio, G-ABCD, request joining information.",
    spoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, request joining information.",
    expectedReadback: "Hilltown Radio, G-ABCD, request joining information.",
    readbackPrompt: "First call: station · callsign · position · altitude · intention · request.",
    micInstruction: "Make the first call to Hilltown Radio.",
  },
  {
    id: "ua2-atc-info",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, runway 27, left-hand circuit, QNH 1016.",
    spoken: "Golf Alfa Bravo Charlie Delta, runway two seven, left-hand circuit, QNH one zero one six.",
  },
  {
    id: "ua3-pilot-info",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Runway 27, left-hand circuit, QNH 1016, G-ABCD.",
    spoken: "Runway two seven, left-hand circuit, QNH one zero one six, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Runway 27, left-hand circuit, QNH 1016, G-ABCD.",
    readbackPrompt: "Read back: runway · circuit · QNH · callsign.",
    micInstruction: "Read back the airfield information.",
  },
  {
    id: "ua4-atc-join",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, join left base runway 27, report base.",
    spoken: "Golf Alfa Bravo Charlie Delta, join left base runway two seven, report base.",
  },
  {
    id: "ua5-pilot-join",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Join left base runway 27, report base, G-ABCD.",
    spoken: "Join left base runway two seven, report base, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Join left base runway 27, report base, G-ABCD.",
    acceptedVariants: ["Join left base runway 27, wilco, G-ABCD."],
    readbackPrompt: "Read back: join leg · runway · report point · callsign.",
    micInstruction: "Read back the joining instruction.",
  },
  {
    id: "ua6-pilot-base",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Hilltown Radio, G-ABCD, left base runway 27.",
    spoken: "Hilltown Radio, Golf Alfa Bravo Charlie Delta, left base runway two seven.",
    expectedReadback: "Hilltown Radio, G-ABCD, left base runway 27.",
    acceptedVariants: ["G-ABCD, left base runway 27."],
    readbackPrompt: "Report base: station · callsign · position · runway.",
    micInstruction: "Report base as instructed.",
  },
  {
    id: "ua7-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "First call made, airfield information and joining instruction read back, base reported. You have joined the circuit at an unfamiliar aerodrome.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 4 — Workload Scenario                                        */
/* ------------------------------------------------------------------ */

export const WORKLOAD_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "wl0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are enroute with a flight information service. Listen carefully — instructions will be long and may change.",
  },
  {
    id: "wl1-atc-long",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ETAS, route via North Lake, remain outside controlled airspace, report Hilltown.",
    spoken: "Golf Echo Tango Alfa Sierra, route via North Lake, remain outside controlled airspace, report Hilltown.",
  },
  {
    id: "wl2-pilot-long",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Route via North Lake, remain outside controlled airspace, report Hilltown, G-ETAS.",
    spoken: "Route via North Lake, remain outside controlled airspace, report Hilltown, Golf Echo Tango Alfa Sierra.",
    expectedReadback: "Route via North Lake, remain outside controlled airspace, report Hilltown, G-ETAS.",
    acceptedVariants: ["Route via North Lake, remain outside controlled airspace, wilco, G-ETAS."],
    readbackPrompt: "Read back route · restriction · report point · callsign.",
    micInstruction: "Read back the full instruction concisely.",
  },
  {
    id: "wl3-atc-correction",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ETAS, correction, report West Bridge, not Hilltown.",
    spoken: "Golf Echo Tango Alfa Sierra, correction, report West Bridge, not Hilltown.",
  },
  {
    id: "wl4-pilot-correction",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Report West Bridge, G-ETAS.",
    spoken: "Report West Bridge, Golf Echo Tango Alfa Sierra.",
    expectedReadback: "Report West Bridge, G-ETAS.",
    readbackPrompt: "Read back only the corrected item: report point · callsign.",
    micInstruction: "Read back the corrected reporting point.",
  },
  {
    id: "wl5-atc-changed",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ETAS, route via East Lake instead.",
    spoken: "Golf Echo Tango Alfa Sierra, route via East Lake instead.",
  },
  {
    id: "wl6-pilot-changed",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Route via East Lake, G-ETAS.",
    spoken: "Route via East Lake, Golf Echo Tango Alfa Sierra.",
    expectedReadback: "Route via East Lake, G-ETAS.",
    readbackPrompt: "Read back the new route: route · callsign.",
    micInstruction: "Read back the changed route.",
  },
  {
    id: "wl7-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You handled a long instruction, a correction and a changed instruction without reading back outdated information.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 5 — Problem Solving Scenario                                 */
/* ------------------------------------------------------------------ */

export const PROBLEM_SOLVING_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "ps0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are enroute to Hilltown. Weather is deteriorating ahead.",
  },
  {
    id: "ps1-pilot-deviate",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, request ten degrees right due weather.",
    spoken: "Golf Alfa Bravo Charlie Delta, request ten degrees right due weather.",
    expectedReadback: "G-ABCD, request ten degrees right due weather.",
    acceptedVariants: ["G-ABCD, request ten degrees right due to weather."],
    readbackPrompt: "Request a small deviation with a reason.",
    micInstruction: "Request a heading deviation due weather.",
  },
  {
    id: "ps2-atc-route",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, route via North Lake if able.",
    spoken: "Golf Alfa Bravo Charlie Delta, route via North Lake if able.",
  },
  {
    id: "ps3-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You cannot maintain VFR on the route ahead.",
  },
  {
    id: "ps4-pilot-unable",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, unable to maintain VFR due weather.",
    spoken: "Golf Alfa Bravo Charlie Delta, unable to maintain VFR due weather.",
    expectedReadback: "G-ABCD, unable to maintain VFR due weather.",
    acceptedVariants: ["G-ABCD, unable to maintain VFR due to weather."],
    readbackPrompt: "State the problem and request a safe option.",
    micInstruction: "Report unable to maintain VFR and request return.",
  },
  {
    id: "ps5-atc-return",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, route back to Brindale via West Bridge.",
    spoken: "Golf Alfa Bravo Charlie Delta, route back to Brindale via West Bridge.",
  },
  {
    id: "ps6-pilot-return",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Route back to Brindale via West Bridge, G-ABCD.",
    spoken: "Route back to Brindale via West Bridge, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Route back to Brindale via West Bridge, G-ABCD.",
    readbackPrompt: "Read back the return route: route · callsign.",
    micInstruction: "Read back the return route.",
  },
  {
    id: "ps7-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are unsure of your exact position near West Bridge, request assistance.",
  },
  {
    id: "ps8-pilot-unsure",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "G-ABCD, unsure of position, request assistance.",
    spoken: "Golf Alfa Bravo Charlie Delta, unsure of position, request assistance.",
    expectedReadback: "G-ABCD, unsure of position, request assistance.",
    readbackPrompt: "State uncertainty: callsign · unsure · last known position · altitude · request.",
    micInstruction: "Declare uncertain position and request assistance.",
  },
  {
    id: "ps9-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You communicated the problem clearly and requested a safe option at each stage.",
  },
];
