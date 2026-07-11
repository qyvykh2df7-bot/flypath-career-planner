export const ENABLE_VOICE_ALPHA_SLICE = true;

export const VOICE_ALPHA_EXERCISE_IDS = [
  // ── Radio Fundamentals › ICAO Alphabet ────────────────────────────────────
  "radio-fundamentals.icao-alphabet.repeat-letters-by-voice",
  "radio-fundamentals.icao-alphabet.spell-a-callsign",
  // ── Radio Fundamentals › Numbers ──────────────────────────────────────────
  "radio-fundamentals.numbers.say-the-number",
  "radio-fundamentals.numbers.altitudes",
  "radio-fundamentals.numbers.flight-levels",
  "radio-fundamentals.numbers.squawks",
  // ── Radio Fundamentals › Frequencies / Clarification ─────────────────────
  "radio-fundamentals.frequencies.listen-and-repeat-frequencies",
  "radio-fundamentals.clarification-correction.say-the-phrase",
  // ── First Contact ─────────────────────────────────────────────────────────
  "first-contact.the-4-ws.speak-the-call",
  "first-contact.radio-check-readability.say-the-radio-check",
  "first-contact.basic-atis-qnh.say-the-qnh-readback",
  "first-contact.basic-requests.speak-the-request",
  "first-contact.frequency-changes.speak-first-call",
  "first-contact.frequency-changes.frequency-readback",
] as const;

export type VoiceAlphaExerciseId = (typeof VOICE_ALPHA_EXERCISE_IDS)[number];

/**
 * Returns true when the exercise should be handled by the voice evaluation flow.
 * In addition to the explicit whitelist, all Cadet Readbacks drills (30 deterministic
 * drills across 5 groups × 6 levels) are voice-enabled via the module prefix.
 */
export function isVoiceAlphaExercise(exerciseId: string | undefined): boolean {
  if (!ENABLE_VOICE_ALPHA_SLICE || !exerciseId) return false;
  if ((VOICE_ALPHA_EXERCISE_IDS as readonly string[]).includes(exerciseId)) return true;
  // All cadet-readbacks drills are deterministic and voice-enabled.
  if (exerciseId.startsWith("cadet-readbacks.")) return true;
  return false;
}
