export type TtsVoiceType = "controller" | "atis";

export type TtsNoiseType = "none" | "light-radio" | "moderate-radio" | "heavy-radio";

/**
 * Fields that change what OpenAI actually generates. These MUST be part of the
 * server-side cache key (app/api/aerocomms/voice/speak/route.ts) — changing any of them
 * produces different audio.
 */
export type TtsProfileCacheFields = {
  voiceType: TtsVoiceType;
  /**
   * OpenAI voice name for this profile (CONTROLLER_VOICE, currently "ash", for
   * controller profiles; "nova" for ATIS — see the CONTROLLER_VOICE constant
   * below to change the controller voice everywhere in one place). This is sent
   * as an explicit `voice` override to /api/aerocomms/voice/speak (see serverTts.ts),
   * which takes priority over the VOICE_TTS_VOICE_CONTROLLER / VOICE_TTS_VOICE_ATIS
   * env vars in app/api/aerocomms/voice/speak/route.ts's resolveVoice(). Resolution order
   * there is: explicit request `voice` (i.e. this field, for every current call
   * site) > env var for the resolved voiceType > hardcoded DEFAULT_CONTROLLER_VOICE
   * ("onyx") / DEFAULT_ATIS_VOICE ("nova"). In practice this means: to change the
   * base voice for ALL controller profiles, edit CONTROLLER_VOICE below (the
   * source of truth today) rather than only setting the env var — the env var
   * only takes effect for a request with no `profileId` and no explicit `voice`,
   * which no current call site makes.
   */
  voice: string;
  /** Natural-language style instruction sent to the TTS model (gpt-4o-mini-tts only). Tone/clarity only — see playbackRate for reliable pace control. */
  styleInstruction: string;
};

/**
 * Fields that only affect local client-side playback (speed, background noise).
 * These MUST NOT be part of the server cache key — they never reach OpenAI and
 * changing them does not change the generated audio file, so the same cached
 * audio can be reused and simply played back faster/slower/with-or-without noise.
 */
export type TtsProfilePlaybackFields = {
  /** Human-readable label for dev/debug UI — not sent to the model. */
  paceLabel: string;
  /**
   * HTMLAudioElement.playbackRate applied client-side. This is the reliable pace
   * control for Core Practice levels — styleInstruction alone did not produce a
   * consistent, audible speed difference across levels in browser testing.
   *
   * Product decision: playbackRate must never be below 1.00 for training exercises.
   * No exercise should ever play slower than normal speech — difficulty increases
   * by speeding up above normal as the level rises, not by slowing beginners down.
   * See the clamp in serverTts.ts (clampPlaybackRate), which enforces [1.00, 1.35].
   */
  playbackRate: number;
  /**
   * Synthetic noise overlay is disabled for now because it sounded unrealistic in
   * browser testing. Real radio/ambient samples or a better radio filter can be
   * added later. audioNoise.ts is kept in the codebase for that future work, but
   * all current profiles use "none" / 0 so it never actually runs.
   */
  noiseType: TtsNoiseType;
  /** 0..1 relative overlay volume, applied client-side only via audioNoise.ts. */
  noiseVolume: number;
};

export type TtsProfile = { id: string } & TtsProfileCacheFields & TtsProfilePlaybackFields;

function defineProfile(id: string, fields: TtsProfileCacheFields & TtsProfilePlaybackFields): TtsProfile {
  return { id, ...fields };
}

/**
 * Single source of truth for the base controller voice — change this ONE constant to
 * switch every controller-voiceType profile below at once (do not need to edit each
 * profile individually). Switched from "onyx" to "ash" in the v3 quality pass: onyx
 * ("deep and authoritative") consistently mumbled/clipped short number words (e.g.
 * "five" collapsing toward "fai") in testing, especially at raised playbackRate; ash
 * ("clear and articulate") reads numbers and callsigns more distinctly. See
 * app/api/aerocomms/voice/speak/route.ts for how this flows to the OpenAI request, and the
 * VOICE_TTS_VOICE_CONTROLLER doc comment on the `voice` field above for the full
 * resolution order.
 */
const CONTROLLER_VOICE = "ash";

/** Shared clause appended to every controller styleInstruction — the model tended to
 * clip/slur short number words (especially "five") when not explicitly told to fully
 * pronounce them, particularly at raised playbackRate. */
const NUMBER_CLARITY_CLAUSE =
  "Pronounce every digit and number fully and clearly — especially five, nine, three, four, and zero — never clip, slur, or swallow the ends of words.";

/**
 * Shared style instruction text for "standard" and "fast" ATC delivery — extracted to
 * named constants (v4: Missions-by-level pass) so the mission-level profiles below
 * (mission-student-atc, mission-rfr-atc, mission-advanced-atc) can reuse the exact
 * same wording at a different playbackRate without duplicating/drifting the prose.
 */
const STANDARD_ATC_STYLE = `Speak like a professional, alert air traffic controller on an active frequency: clear, concise, and confident, with a natural operational radio cadence — awake and slightly energetic, never sleepy, theatrical, or slow. ${NUMBER_CLARITY_CLAUSE}`;
const FAST_ATC_STYLE = `Speak like an experienced controller working a busy, high-workload frequency: efficient, firm, and fast-paced, with confident operational delivery — brisk but always clearly understandable, never rushed to the point of losing clarity. ${NUMBER_CLARITY_CLAUSE}`;

/**
 * Core Practice / Cadet Listening TTS profiles (TTS Profiles v3 — voice/clarity pass).
 *
 * v2's wording fixed the "sleepy" tone but v3 fixes a distinct, more serious problem
 * found in Missions testing: numbers (esp. "five") sounding clipped/garbled, and lines
 * occasionally feeling too fast to stay crisp. v3 changes:
 * - base voice switched to CONTROLLER_VOICE ("ash") — see doc comment above
 * - every controller styleInstruction now explicitly demands full, clear number
 *   pronunciation (NUMBER_CLARITY_CLAUSE)
 * - standard-atc/fast-atc playbackRate reduced (numbers were the first thing lost at
 *   the previous, higher rates) — see each profile's comment for old → new
 * - missionAudio.ts additionally dampens playbackRate further for very short lines
 *   client-side (a few words/a bare readback), independent of this file
 *
 * Level intent (speed is controlled by playbackRate, not styleInstruction):
 * Core Practice always starts at/above normal speed (never slower) and only
 * gets faster as the level increases.
 * - Level 1: 1.03x — alert, very clear, beginner-friendly
 * - Level 2: 1.06x — alert, clear, steady
 * - Level 3: 1.09x — normal-plus ATC pace
 * - Level 4: 1.12x — faster, confident
 * - Level 5: 1.16x — fast, efficient
 * - Level 6: 1.22x — realistic busy-frequency pace
 *
 * Background noise overlay is disabled for all current profiles (see
 * TtsProfilePlaybackFields.noiseType doc comment above).
 */
export const TTS_PROFILES: Record<string, TtsProfile> = {
  "cadet-clear": defineProfile("cadet-clear", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like an alert, confident flight instructor giving a first radio call to a new student: clear, warm, and encouraging, but awake and crisp — never slow, sleepy, or monotone. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Alert, teaching tone",
    playbackRate: 1.03,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "cadet-level-1": defineProfile("cadet-level-1", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like an alert, friendly instructor teaching a first radio call: clear and simple, confident and awake — not sleepy or drawn out. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Level 1 — alert, very clear",
    playbackRate: 1.03,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "cadet-level-2": defineProfile("cadet-level-2", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like a confident flight instructor at a comfortable, steady pace: clear, warm, and alert — brisk and awake, never sluggish. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Level 2 — clear, alert",
    playbackRate: 1.06,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "cadet-level-3": defineProfile("cadet-level-3", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like a professional, alert air traffic controller: clear, businesslike, and confident, with a normal operational radio cadence. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Level 3 — normal-plus ATC pace",
    playbackRate: 1.09,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "cadet-level-4": defineProfile("cadet-level-4", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like a professional, alert air traffic controller working a normal-to-busy frequency: clear, confident, and slightly brisk — awake and on top of the traffic. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Level 4 — confident, brisk",
    playbackRate: 1.12,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "cadet-level-5": defineProfile("cadet-level-5", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like a busy, professional air traffic controller: efficient and confident, with a faster operational cadence, but still fully intelligible. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Level 5 — fast, efficient",
    playbackRate: 1.16,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "cadet-level-6": defineProfile("cadet-level-6", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction:
      `Speak like an experienced controller on a busy, realistic frequency: fast, firm, and efficient, with real operational radio energy — brisk but always understandable. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "Level 6 — realistic busy-frequency pace",
    playbackRate: 1.22,
    noiseType: "none",
    noiseVolume: 0,
  }),
  // playbackRate reduced from 1.08 — numbers (esp. "five") were the first casualty of even
  // this modest speedup once combined with the previous "onyx" voice. See module doc comment.
  "standard-atc": defineProfile("standard-atc", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction: STANDARD_ATC_STYLE,
    paceLabel: "Standard ATC pace",
    playbackRate: 1.04,
    noiseType: "none",
    noiseVolume: 0,
  }),
  // playbackRate reduced from 1.20 — same reasoning as standard-atc, but fast-atc keeps a
  // clearly brisker pace than standard-atc rather than dropping all the way to it.
  "fast-atc": defineProfile("fast-atc", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction: FAST_ATC_STYLE,
    paceLabel: "Fast ATC pace",
    playbackRate: 1.13,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "atis-robot": defineProfile("atis-robot", {
    voiceType: "atis",
    voice: "nova",
    styleInstruction:
      `Speak like an automated ATIS recording: steady, even, and radio-like, with a consistent robotic broadcast rhythm — clearly enunciated and alert, not sleepy, drowsy, or overly dramatic. ${NUMBER_CLARITY_CLAUSE}`,
    paceLabel: "ATIS recorded broadcast",
    playbackRate: 1.05,
    noiseType: "none",
    noiseVolume: 0,
  }),
  // ── Missions-by-level profiles (v4) ──────────────────────────────────────────────
  // Cadet missions reuse "standard-atc" directly (already ~1.04) and Airline Prep
  // reuses "fast-atc" directly (already ~1.13) — both already land in the requested
  // range for those levels, so no new profile is needed for them (see
  // resolveAtcProfileId in atcSim.ts). These three cover the levels in between/above
  // that need a genuinely different rate, reusing the exact same style prose as
  // standard-atc/fast-atc so there's no wording to keep in sync by hand.
  "mission-student-atc": defineProfile("mission-student-atc", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction: STANDARD_ATC_STYLE,
    paceLabel: "Mission — Student Pilot pace",
    playbackRate: 1.07,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "mission-rfr-atc": defineProfile("mission-rfr-atc", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction: STANDARD_ATC_STYLE,
    paceLabel: "Mission — Ready For Radio pace",
    playbackRate: 1.1,
    noiseType: "none",
    noiseVolume: 0,
  }),
  "mission-advanced-atc": defineProfile("mission-advanced-atc", {
    voiceType: "controller",
    voice: CONTROLLER_VOICE,
    styleInstruction: FAST_ATC_STYLE,
    paceLabel: "Mission — Advanced Ops pace",
    playbackRate: 1.18,
    noiseType: "none",
    noiseVolume: 0,
  }),
};

export function getTtsProfile(profileId: string | undefined | null): TtsProfile | undefined {
  if (!profileId) return undefined;
  return TTS_PROFILES[profileId];
}

/**
 * Cadet Listening exercise IDs end in "drill-N" (N = 1..6), which is the group's
 * built-in difficulty level (see app/lib/cadetBank.ts). Maps that to the matching
 * cadet-level-N TTS profile. Returns undefined for non-leveled exercises.
 */
export function cadetLevelProfileIdFromExerciseId(exerciseId: string | undefined | null): string | undefined {
  if (!exerciseId) return undefined;
  const match = /drill-([1-6])$/.exec(exerciseId);
  if (!match) return undefined;
  return `cadet-level-${match[1]}`;
}
