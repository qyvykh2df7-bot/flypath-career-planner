/**
 * AeroComms — Airline Prep scenario steps.
 *
 * Seven capstone scenarios, one per module. Each is a short conversation-style
 * exchange (narrator / pilot-speak / atc-hidden / pilot-readback) reusing the
 * Student Pilot SpScenarioStep contract and the SpConversationScenario renderer.
 *
 * Spoken forms follow docs/AeroComms_ICAO_Radiotelephony_Reference.md:
 *   - G-ABCD → Golf Alfa Bravo Charlie Delta
 *   - runway 27 → runway two seven
 *   - FL180 → flight level one eight zero  (digit by digit)
 *   - heading 270 → heading two seven zero (three digits)
 *   - 124.700 → one two four decimal seven zero zero (decimal, never point)
 *   - squawk 4215 → squawk four two one fife
 *   - LAMSO 1A → LAMSO one Alfa
 */

import type { SpScenarioStep } from "./content";

/* ------------------------------------------------------------------ */
/* Module 1 — IFR Clearance Scenario                                   */
/* ------------------------------------------------------------------ */

export const IFR_CLEARANCE_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "apc0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are on stand at Brindale, ready to copy your IFR clearance to Madrid.",
  },
  {
    id: "apc1-pilot-request",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Brindale Delivery, EI-HGM, request IFR clearance to Madrid.",
    spoken: "Brindale Delivery, Echo India Hotel Golf Mike, request IFR clearance to Madrid.",
    expectedReadback: "Brindale Delivery, EI-HGM, request IFR clearance to Madrid.",
    readbackPrompt: "Request the clearance: station · callsign · request · destination.",
    micInstruction: "Request your IFR clearance from Brindale Delivery.",
  },
  {
    id: "apc2-atc-clearance",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "EI-HGM, cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215.",
    spoken: "Echo India Hotel Golf Mike, cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife.",
  },
  {
    id: "apc3-pilot-readback",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215, EI-HGM.",
    spoken: "Cleared to Madrid via LAMSO one Alfa departure, runway two seven, climb initially five thousand feet, squawk four two one fife, Echo India Hotel Golf Mike.",
    expectedReadback: "Cleared to Madrid via LAMSO 1A departure, runway 27, climb initially 5000 feet, squawk 4215, EI-HGM.",
    readbackPrompt: "Read back: destination · SID · runway · initial climb · squawk · callsign.",
    micInstruction: "Read back the full IFR clearance.",
  },
  {
    id: "apc4-atc-amended",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "EI-HGM, amended clearance, LAMSO 2A departure.",
    spoken: "Echo India Hotel Golf Mike, amended clearance, LAMSO two Alfa departure.",
  },
  {
    id: "apc5-pilot-amended",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "LAMSO 2A departure, EI-HGM.",
    spoken: "LAMSO two Alfa departure, Echo India Hotel Golf Mike.",
    expectedReadback: "LAMSO 2A departure, EI-HGM.",
    readbackPrompt: "Read back only the amended item: new SID · callsign.",
    micInstruction: "Read back the amended SID.",
  },
  {
    id: "apc6-atc-hold",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "EI-HGM, hold for release.",
    spoken: "Echo India Hotel Golf Mike, hold for release.",
  },
  {
    id: "apc7-pilot-hold",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Hold for release, EI-HGM.",
    spoken: "Hold for release, Echo India Hotel Golf Mike.",
    expectedReadback: "Hold for release, EI-HGM.",
    acceptedVariants: ["Wilco, EI-HGM"],
    readbackPrompt: "Read back the restriction: instruction · callsign.",
    micInstruction: "Read back the hold-for-release instruction.",
  },
  {
    id: "apc8-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "IFR clearance received, amended and held for release. You have not yet been released to depart.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 2 — SID Departure Scenario                                   */
/* ------------------------------------------------------------------ */

export const SID_DEPARTURE_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aps0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are airborne from runway 27, climbing on the LAMSO departure, passing 1500 feet.",
  },
  {
    id: "aps1-pilot-departure",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Departure, Ryanair 6AM, passing 1500 feet, climbing 5000 feet, Lamso departure.",
    spoken: "Departure, Ryanair Six Alfa Mike, passing one thousand five hundred feet, climbing five thousand feet, Lamso departure.",
    expectedReadback: "Departure, Ryanair 6AM, passing 1500 feet, climbing 5000 feet, Lamso departure.",
    readbackPrompt: "First call: station · callsign · passing altitude · climbing altitude.",
    micInstruction: "Make the first call to Departure.",
  },
  {
    id: "aps2-atc-climb",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Ryanair 6AM, climb FL80.",
    spoken: "Ryanair Six Alfa Mike, climb flight level eight zero.",
  },
  {
    id: "aps3-pilot-climb",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Climb FL80, Ryanair 6AM.",
    spoken: "Climb flight level eight zero, Ryanair Six Alfa Mike.",
    expectedReadback: "Climb FL80, Ryanair 6AM.",
    readbackPrompt: "Read back: climb · flight level · callsign.",
    micInstruction: "Read back the climb clearance.",
  },
  {
    id: "aps4-atc-heading",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Ryanair 6AM, turn left heading 270.",
    spoken: "Ryanair Six Alfa Mike, turn left heading two seven zero.",
  },
  {
    id: "aps5-pilot-heading",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Left heading 270,Ryanair 6AM.",
    spoken: "Left heading two seven zero, Ryanair Six Alfa Mike.",
    expectedReadback: "Left heading 270,Ryanair 6AM.",
    readbackPrompt: "Read back: turn direction · heading · callsign.",
    micInstruction: "Read back the heading instruction.",
  },
  {
    id: "aps6-atc-restriction",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Ryanair 6AM, maintain 5000 feet until advised.",
    spoken: "Ryanair Six Alfa Mike, maintain five thousand feet until advised.",
  },
  {
    id: "aps7-pilot-restriction",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Maintain 5000 feet until advised, Ryanair 6AM.",
    spoken: "Maintain five thousand feet until advised, Ryanair Six Alfa Mike.",
    expectedReadback: "Maintain 5000 feet until advised, Ryanair 6AM.",
    readbackPrompt: "Read back the restriction in full: level · until advised · callsign.",
    micInstruction: "Read back the level restriction.",
  },
  {
    id: "aps8-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Departure call made, climb and heading read back, level restriction acknowledged. You are established on the IFR departure.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 3 — Enroute IFR Scenario                                     */
/* ------------------------------------------------------------------ */

export const ENROUTE_IFR_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "ape0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are enroute IFR, level and on a flight-planned route towards LAMSO.",
  },
  {
    id: "ape1-atc-climb",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, climb FL180.",
    spoken: "Golf Alfa Bravo Charlie Delta, climb flight level one eight zero.",
  },
  {
    id: "ape2-pilot-climb",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Climb FL180, G-ABCD.",
    spoken: "Climb flight level one eight zero, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Climb FL180, G-ABCD.",
    readbackPrompt: "Read back: climb · flight level · callsign.",
    micInstruction: "Read back the level change.",
  },
  {
    id: "ape3-atc-direct",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, proceed direct LAMSO.",
    spoken: "Golf Alfa Bravo Charlie Delta, proceed direct LAMSO.",
  },
  {
    id: "ape4-pilot-direct",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Direct LAMSO, G-ABCD.",
    spoken: "Direct LAMSO, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Direct LAMSO, G-ABCD.",
    readbackPrompt: "Read back: direct · fix · callsign.",
    micInstruction: "Read back the direct routing.",
  },
  {
    id: "ape5-atc-freq",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, contact Madrid Control 124.700.",
    spoken: "Golf Alfa Bravo Charlie Delta, contact Madrid Control one two four decimal seven zero zero.",
  },
  {
    id: "ape6-pilot-freq",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Contact Madrid Control 124.700, G-ABCD.",
    spoken: "Contact Madrid Control one two four decimal seven zero zero, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Contact Madrid Control 124.700, G-ABCD.",
    readbackPrompt: "Read back: station · frequency · callsign.",
    micInstruction: "Read back the frequency transfer.",
  },
  {
    id: "ape7-atc-amend",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, after LAMSO proceed direct NARGO.",
    spoken: "Golf Alfa Bravo Charlie Delta, after LAMSO proceed direct NARGO.",
  },
  {
    id: "ape8-pilot-amend",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "After LAMSO direct NARGO, G-ABCD.",
    spoken: "After LAMSO direct NARGO, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "After LAMSO direct NARGO, G-ABCD.",
    readbackPrompt: "Read back the amended route: after fix · direct fix · callsign.",
    micInstruction: "Read back the route amendment.",
  },
  {
    id: "ape9-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Level change, direct routing, frequency transfer and route amendment all read back. You are established enroute IFR.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 4 — STAR & Descent Scenario                                  */
/* ------------------------------------------------------------------ */

export const STAR_DESCENT_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "apr0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are approaching the Madrid terminal area, ready for descent and arrival.",
  },
  {
    id: "apr1-atc-descend",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Iberia 275, descend FL120.",
    spoken: "Iberia Two Seven Five, descend flight level one two zero.",
  },
  {
    id: "apr2-pilot-descend",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Descend FL120, Iberia 275.",
    spoken: "Descend flight level one two zero, Iberia Two Seven Five.",
    expectedReadback: "Descend FL120, Iberia 275.",
    readbackPrompt: "Read back: descend · flight level · callsign.",
    micInstruction: "Read back the descent clearance.",
  },
  {
    id: "apr3-atc-star",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Iberia 275, cleared LAMSO 1A arrival.",
    spoken: "Iberia Two Seven Five, cleared LAMSO one Alfa arrival.",
  },
  {
    id: "apr4-pilot-star",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cleared LAMSO 1A arrival, Iberia 275.",
    spoken: "Cleared LAMSO one Alfa arrival, Iberia Two Seven Five.",
    expectedReadback: "Cleared LAMSO 1A arrival, Iberia 275.",
    readbackPrompt: "Read back: cleared · STAR · arrival · callsign.",
    micInstruction: "Read back the STAR clearance.",
  },
  {
    id: "apr5-atc-speed",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Iberia 275, reduce speed 220 knots.",
    spoken: "Iberia Two Seven Five, reduce speed two two zero knots.",
  },
  {
    id: "apr6-pilot-speed",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Speed 220 knots, Iberia 275.",
    spoken: "Speed two two zero knots, Iberia Two Seven Five.",
    expectedReadback: "Speed 220 knots, Iberia 275.",
    readbackPrompt: "Read back: speed · value · callsign.",
    micInstruction: "Read back the speed restriction.",
  },
  {
    id: "apr7-atc-cross",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Iberia 275, cross LAMSO at or above FL100.",
    spoken: "Iberia Two Seven Five, cross LAMSO at or above flight level one zero zero.",
  },
  {
    id: "apr8-pilot-cross",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cross LAMSO at or above FL100, Iberia 275.",
    spoken: "Cross LAMSO at or above flight level one zero zero, Iberia Two Seven Five.",
    expectedReadback: "Cross LAMSO at or above FL100, Iberia 275.",
    readbackPrompt: "Read back the crossing restriction in full: fix · at or above · level · callsign.",
    micInstruction: "Read back the level restriction.",
  },
  {
    id: "apr9-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Descent, STAR, speed and crossing restriction all read back. You are established on the STAR and descent profile.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 5 — Holding Scenario                                         */
/* ------------------------------------------------------------------ */

export const HOLDING_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "aph0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Arrivals are busy. ATC needs you to hold before continuing the approach.",
  },
  {
    id: "aph1-atc-hold",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Speedbird 6767, hold at LAMSO, maintain FL100, expect further clearance at two five.",
    spoken: "Speebird Six Seven Six Seven, hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five.",
  },
  {
    id: "aph2-pilot-hold",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Hold at LAMSO, maintain FL100, expect further clearance at two five, Speedbird 6767.",
    spoken: "Hold at LAMSO, maintain flight level one zero zero, expect further clearance at two five, Speebird Six Seven Six Seven.",
    expectedReadback: "Hold at LAMSO, maintain FL100, expect further clearance at two five, Speedbird 6767.",
    acceptedVariants: ["Hold at LAMSO, maintain FL100, roger, Speedbird 6767."],
    readbackPrompt: "Read back: fix · level · expected clearance time · callsign.",
    micInstruction: "Read back the holding instruction.",
  },
  {
    id: "aph3-atc-delay",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Speedbird 6767, delay expected.",
    spoken: "Speebird Six Seven Six Seven, expect delay.",
  },
  {
    id: "aph4-pilot-delay",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Delay expected, Speedbird 6767.",
    spoken: "Delay expected, Speebird Six Seven Six Seven.",
    expectedReadback: "Delay expected, Speedbird 6767.",
    acceptedVariants: ["Roger, Speedbird 6767"],
    readbackPrompt: "Acknowledge the delay: instruction · callsign.",
    micInstruction: "Acknowledge the expected delay.",
  },
  {
    id: "aph5-atc-leave",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Speedbird 6767, leave the hold, proceed direct NARGO.",
    spoken: "Speebird Six Seven Six Seven, leave the hold, proceed direct NARGO.",
  },
  {
    id: "aph6-pilot-leave",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Leave the hold, direct NARGO, Speedbird 6767.",
    spoken: "Leave the hold, direct NARGO, Speebird Six Seven Six Seven.",
    expectedReadback: "Leave the hold, direct NARGO, Speedbird 6767.",
    readbackPrompt: "Read back the onward clearance: leave hold · direct fix · callsign.",
    micInstruction: "Read back the onward clearance.",
  },
  {
    id: "aph7-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You entered, managed the delay and left the hold on an onward clearance.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 6 — Approach & Vectoring Scenario                            */
/* ------------------------------------------------------------------ */

export const APPROACH_VECTORING_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "apa0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You are being vectored for the ILS approach to runway 27.",
  },
  {
    id: "apa1-atc-vector",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, turn right heading 180, descend 3000 feet.",
    spoken: "Golf Alfa Bravo Charlie Delta, turn right heading one eight zero, descend three thousand feet.",
  },
  {
    id: "apa2-pilot-vector",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Right heading 180, descend 3000 feet, G-ABCD.",
    spoken: "Right heading one eight zero, descend three thousand feet, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Right heading 180, descend 3000 feet, G-ABCD.",
    readbackPrompt: "Read back both items: heading · altitude · callsign.",
    micInstruction: "Read back the vector and descent.",
  },
  {
    id: "apa3-atc-intercept",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, turn right heading 240, intercept localizer runway 27.",
    spoken: "Golf Alfa Bravo Charlie Delta, turn right heading two four zero, intercept localizer runway two seven.",
  },
  {
    id: "apa4-pilot-intercept",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Right heading 240, intercept localizer runway 27, G-ABCD.",
    spoken: "Right heading two four zero, intercept localizer runway two seven, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Right heading 240, intercept localizer runway 27, G-ABCD.",
    readbackPrompt: "Read back: heading · intercept localizer · runway · callsign.",
    micInstruction: "Read back the intercept instruction.",
  },
  {
    id: "apa5-atc-approach",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "G-ABCD, cleared ILS approach runway 27.",
    spoken: "Golf Alfa Bravo Charlie Delta, cleared ILS approach runway two seven.",
  },
  {
    id: "apa6-pilot-approach",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Cleared ILS approach runway 27, G-ABCD.",
    spoken: "Cleared ILS approach runway two seven, Golf Alfa Bravo Charlie Delta.",
    expectedReadback: "Cleared ILS approach runway 27, G-ABCD.",
    readbackPrompt: "Read back: cleared · approach type · runway · callsign.",
    micInstruction: "Read back the approach clearance.",
  },
  {
    id: "apa7-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "Vectored, established on the localizer and cleared for the approach. Landing clearance will come separately from Tower.",
  },
];

/* ------------------------------------------------------------------ */
/* Module 7 — Missed Approach Scenario                                 */
/* ------------------------------------------------------------------ */

export const MISSED_APPROACH_SCENARIO_STEPS: SpScenarioStep[] = [
  {
    id: "apm0-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "The approach cannot be continued. ATC instructs a missed approach.",
  },
  {
    id: "apm1-atc-missed",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Easy 612, execute missed approach, climb 3000 feet.",
    spoken: "Easy Six One Two, execute missed approach, climb three thousand feet.",
  },
  {
    id: "apm2-pilot-missed",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Executing missed approach, climb 3000 feet, Easy 612",
    spoken: "Executing missed approach, climb three thousand feet, Easy Six One Two.",
    expectedReadback: "Executing missed approach, climb 3000 feet, Easy 612",
    acceptedVariants: ["Go Around, Easy 612"],
    readbackPrompt: "Read back: executing missed approach · climb altitude · callsign.",
    micInstruction: "Read back the missed approach instruction.",
  },
  {
    id: "apm3-atc-climb",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Easy 612, climb 4000 feet, turn left heading 090.",
    spoken: "Easy Six One Two, climb four thousand feet, turn left heading zero niner zero.",
  },
  {
    id: "apm4-pilot-climb",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Climb 4000 feet, left heading 090, Easy 612.",
    spoken: "Climb four thousand feet, left heading zero niner zero, Easy Six One Two.",
    expectedReadback: "Climb 4000 feet, left heading 090, Easy 612.",
    readbackPrompt: "Read back both items: climb altitude · heading · callsign.",
    micInstruction: "Read back the climb and heading.",
  },
  {
    id: "apm5-atc-contact",
    speaker: "atc",
    interactionType: "atc-hidden",
    hiddenInitially: true,
    allowReveal: true,
    text: "Easy 612, contact Approach 124.700.",
    spoken: "Easy Six One Two, contact Approach one two four decimal seven zero zero.",
  },
  {
    id: "apm6-pilot-contact",
    speaker: "pilot",
    interactionType: "pilot-readback",
    text: "Contact Approach 124.700, Easy 612.",
    spoken: "Contact Approach one two four decimal seven zero zero, Easy Six One Two.",
    expectedReadback: "Contact Approach 124.700, Easy 612.",
    readbackPrompt: "Read back: station · frequency · callsign.",
    micInstruction: "Read back the frequency transfer.",
  },
  {
    id: "apm7-pilot-second",
    speaker: "pilot",
    interactionType: "pilot-speak",
    text: "Approach, Easy 612, 4000 thosend feet, heading 090, ready for approach.",
    spoken: "Approach, Easy Six One Two, four thousand feet, heading zero niner zero, ready for approach.",
    expectedReadback: "Approach, Easy 612, 4000 thosend feet, heading 090, ready for approach.",
    readbackPrompt: "State your intention: callsign · request · second approach.",
    micInstruction: "Request a second approach.",
  },
  {
    id: "apm8-narrator",
    speaker: "narrator",
    interactionType: "narrator",
    text: "You handled the missed approach, climb, heading and handoff, then requested a second plan.",
  },
];
