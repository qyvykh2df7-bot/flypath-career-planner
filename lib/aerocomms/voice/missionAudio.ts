import { getTtsProfile } from "./ttsProfiles";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Dedicated backend-TTS playback path for Missions/ATC Sim AUTOPLAY only.
 *
 * Why this exists (do not merge with serverTts.ts): serverTts.ts creates a brand
 * new `Audio()` element on every call, which is exactly right for click-triggered
 * playback (Train's play buttons, Missions' manual Replay) but gets rejected by
 * the browser's autoplay policy when triggered from a non-gesture context like a
 * mission-step-change effect (confirmed via a real Safari/Chrome NotAllowedError
 * in testing). The fix here is to reuse ONE persistent `<audio>` element that gets
 * "activated" once via a real user gesture (unlockMissionAudio, called from an
 * Enable Radio Audio tap) — once that specific element has played due to a user
 * gesture, browsers reliably allow subsequent programmatic `.src` changes and
 * `.play()` calls on the SAME element even from async/non-gesture contexts.
 */

export type MissionAudioOutcome = "played" | "fetch-failed" | "play-blocked" | "stopped";

type PendingPlayback = { resolve: (outcome: MissionAudioOutcome) => void };

let missionAudioEl: HTMLAudioElement | null = null;
let unlocked = false;
let currentObjectUrl: string | null = null;
let generation = 0;
let pending: PendingPlayback | null = null;

// ─── Dev-only latency instrumentation (Part G) ─────────────────────────────────
// RadioConversation marks this the instant a pilot recording stops (before STT/
// evaluation even run) via markMissionLatencyOrigin(); every subsequent
// `[mission:latency]` log in this file reports elapsed time since that moment, so
// the full recording-stop -> STT -> evaluate -> TTS -> play pipeline can be read
// off the console in one aligned timeline. Also correctly covers the "advance to
// next scripted ATC line" case (not just corrective retries) since that TTS call
// happens in the same synchronous turn right after the pilot's recording stopped.
let latencyOriginMs: number | null = null;

/** Pass an explicit `performance.now()`-scale timestamp when the true origin (e.g.
 * the actual moment recording stopped) is already known and slightly in the past —
 * otherwise defaults to right now. */
export function markMissionLatencyOrigin(atMs?: number): void {
  latencyOriginMs = atMs ?? performance.now();
}

function latencyElapsedLabel(): string {
  return latencyOriginMs === null ? "n/a" : `${Math.round(performance.now() - latencyOriginMs)}ms`;
}

// One-time, lazily-created object URL for a short (0.1s) local silent WAV clip —
// built at runtime from raw PCM bytes rather than embedding a large base64 blob in
// source. Real (zeroed) sample data is used rather than a zero-length data chunk,
// which some browsers treat as invalid/unplayable media. No network round trip is
// involved, so play() resolves near-instantly, keeping the unlock call as close to
// synchronous as possible within the triggering click handler (important for
// Safari's autoplay heuristics).
let silentClipUrl: string | null = null;

function getSilentClipUrl(): string {
  if (silentClipUrl) return silentClipUrl;
  const sampleRate = 8000;
  const numSamples = 800; // 0.1s
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);
  // Sample bytes are left at 0 (silence) — ArrayBuffer is zero-initialized.
  silentClipUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  return silentClipUrl;
}

// Below this many "spoken units" (words + extra units for digit-by-digit numbers,
// see wordUnitsFor), a line is short enough that even a modest playbackRate bump
// noticeably clips short words/numbers — so we blend the rate back toward 1.0x the
// shorter the line is. At/above LONG_LINE_UNITS the profile's full rate applies as-is.
const SHORT_LINE_UNITS = 3;
const LONG_LINE_UNITS = 10;

/** Real words plus one extra unit per digit — digit groups like "1013" are spoken
 * digit-by-digit ("one zero one three"), taking much longer than one plain word,
 * so they must count for more when judging how "short" a line really is. */
function wordUnitsFor(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const digits = (text.match(/\d/g) ?? []).length;
  return words + digits;
}

/**
 * Dampens playbackRate for short ATC transmissions (a bare readback, a short
 * instruction) so they are never sped up as aggressively as a full sentence —
 * avoids over-speeding/clipping short lines and numbers (see NUMBER_CLARITY_CLAUSE
 * in ttsProfiles.ts for the complementary style-instruction-side fix). Long lines
 * are unaffected and play at the profile's normal rate.
 */
function dampenRateForShortLine(baseRate: number, text: string): number {
  const units = wordUnitsFor(text);
  if (units >= LONG_LINE_UNITS) return baseRate;
  const t = Math.max(0, Math.min(1, (units - SHORT_LINE_UNITS) / (LONG_LINE_UNITS - SHORT_LINE_UNITS)));
  return 1.0 + (baseRate - 1.0) * t;
}

function getAudioEl(): HTMLAudioElement {
  if (!missionAudioEl) {
    missionAudioEl = new Audio();
    missionAudioEl.preload = "auto";
  }
  return missionAudioEl;
}

/** Whether the shared mission audio element has been gesture-unlocked this session. */
export function isMissionAudioUnlocked(): boolean {
  return unlocked;
}

/**
 * Call synchronously (do not await anything before calling this) from inside a
 * real user gesture — e.g. an "Enable Radio Audio" button's onClick — before any
 * mission ATC autoplay is attempted. Plays a silent, local clip on the shared
 * mission `<audio>` element so later programmatic `.play()` calls on this SAME
 * element (from autoplay effects) are reliably allowed by the browser.
 */
export async function unlockMissionAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const audio = getAudioEl();
  try {
    audio.muted = false;
    audio.volume = 1;
    audio.src = getSilentClipUrl();
    await audio.play();
    audio.pause();
    unlocked = true;
    if (isDev) console.log("[mission:audio] unlocked via user gesture");
  } catch (err) {
    unlocked = false;
    if (isDev) console.warn("[mission:audio] unlock attempt failed — autoplay may need the manual Play fallback", err);
  }
  return unlocked;
}

/** Stops any current/pending mission autoplay audio. Safe to call any time, including when nothing is playing. */
export function stopMissionAudio(): void {
  generation++;
  if (missionAudioEl) {
    try {
      missionAudioEl.pause();
    } catch {
      // ignore — element may be in an invalid state
    }
  }
  if (currentObjectUrl) {
    try {
      URL.revokeObjectURL(currentObjectUrl);
    } catch {
      // ignore
    }
    currentObjectUrl = null;
  }
  if (pending) {
    const p = pending;
    pending = null;
    p.resolve("stopped");
  }
}

/**
 * Fetches backend OpenAI TTS audio for `text` and plays it on the shared mission
 * `<audio>` element. Never throws — always resolves to an outcome so the caller
 * (RadioConversation) can show a manual Play/Replay fallback instead of silently
 * playing the old browser voice. Deliberately has NO browser-speechSynthesis
 * fallback: that only happens for explicit manual taps (see atcSim.speakAtcReplay).
 */
export async function playMissionAudio(text: string, profileId: string): Promise<MissionAudioOutcome> {
  const trimmed = text.trim();
  if (!trimmed || typeof window === "undefined") return "fetch-failed";

  stopMissionAudio(); // bumps generation + resolves any prior pending call as "stopped"
  const myGeneration = generation;
  const profile = getTtsProfile(profileId);

  if (isDev) console.log(`[mission:latency] tts start (elapsed=${latencyElapsedLabel()})`);

  let response: Response;
  try {
    response = await fetch("/api/aerocomms/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        profileId,
      }),
    });
  } catch (err) {
    if (isDev) console.warn("[mission:audio] fetch failed", err);
    return "fetch-failed";
  }
  if (myGeneration !== generation) return "stopped";

  if (!response.ok) {
    if (isDev) console.warn(`[mission:audio] request failed (${response.status})`);
    return "fetch-failed";
  }

  const blob = await response.blob();
  if (myGeneration !== generation) return "stopped";
  if (blob.size === 0) {
    if (isDev) console.warn("[mission:audio] empty audio received");
    return "fetch-failed";
  }

  if (isDev) console.log(`[mission:latency] tts ready (elapsed=${latencyElapsedLabel()})`);

  const url = URL.createObjectURL(blob);
  currentObjectUrl = url;
  const audio = getAudioEl();
  audio.src = url;
  try {
    const rate = profile?.playbackRate;
    const clamped = typeof rate === "number" && Number.isFinite(rate) ? Math.min(1.35, Math.max(1.0, rate)) : 1.0;
    audio.playbackRate = dampenRateForShortLine(clamped, trimmed);
  } catch {
    // ignore — continue at whatever rate is already set
  }

  return new Promise<MissionAudioOutcome>((resolve) => {
    if (myGeneration !== generation) {
      resolve("stopped");
      return;
    }
    const finish = (outcome: MissionAudioOutcome) => {
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;
      if (pending?.resolve === finish) pending = null;
      resolve(outcome);
    };
    pending = { resolve: finish };
    audio.onplaying = () => {
      if (isDev) console.log(`[mission:latency] tts play (elapsed=${latencyElapsedLabel()})`);
    };
    audio.onended = () => {
      if (isDev) console.log("[mission:audio] autoplay finished");
      finish("played");
    };
    audio.onerror = () => {
      if (isDev) console.warn("[mission:audio] playback error");
      finish("play-blocked");
    };
    audio.play().catch((err: unknown) => {
      if (isDev) console.warn("[mission:audio] play() rejected (autoplay policy or playback error)", err);
      finish("play-blocked");
    });
  });
}
