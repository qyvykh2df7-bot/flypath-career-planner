export type SttMode = "browser" | "server";

export type SttModeContext = {
  exerciseId?: string;
  /** Coarse screen kind, when known. Kept for future content-specific overrides. */
  screenType?: "listening" | "speaking" | "readback" | "phraseology" | "scenario" | "mission" | string;
  /** The spoken answer the learner is expected to produce, if deterministic. */
  expected?: string;
  /** True for scenario / conversation turn-by-turn screens. */
  isScenario?: boolean;
  /** True for ATC-readback style turns (repeat back a transmission). */
  isReadback?: boolean;
};

/**
 * Every Train mic exercise uses server (backend) STT by default — short drills and long
 * readbacks/scenarios alike. Browser STT is not chosen here; it only ever runs as a fallback
 * inside VoiceRecorder itself, when server mode is unavailable on the device (no MediaRecorder
 * support) or the backend isn't configured (missing OPENAI_API_KEY).
 *
 * The context parameter is kept so call sites can still pass exercise details — useful if a
 * content-specific override is ever needed again — but the decision is intentionally
 * unconditional today.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ctx kept for API stability / future overrides.
export function getSttModeForExercise(ctx: SttModeContext): SttMode {
  return "server";
}

/** Long readback threshold, in words — above this a readback is treated like a scenario turn. */
const LONG_READBACK_WORD_THRESHOLD = 7;
/** Long phrase threshold, in words — above this a non-readback drill gets the "normal" duration tier. */
const LONG_PHRASE_WORD_THRESHOLD = 7;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Server-mode auto-stop safety net (VoiceRecorder's silence detector normally stops recording
 * well before this fires). Shorter drills get a shorter ceiling so a stuck/failed silence
 * detector still cuts off quickly instead of always waiting the full 12s.
 *
 * - ICAO / numbers / short phrase drills → 6000ms
 * - normal readbacks (and longer phraseology) → 8000ms
 * - scenarios / long readbacks → 12000ms
 */
export function getMaxDurationMsForExercise(ctx: SttModeContext): number {
  if (ctx.isScenario || ctx.screenType === "scenario") return 12000;

  const words = wordCount(ctx.expected ?? "");
  if (ctx.isReadback) return words > LONG_READBACK_WORD_THRESHOLD ? 12000 : 8000;
  return words > LONG_PHRASE_WORD_THRESHOLD ? 8000 : 6000;
}
