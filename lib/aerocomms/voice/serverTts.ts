import { startNoiseOverlay } from "./audioNoise";
import { getTtsProfile } from "./ttsProfiles";

export type ServerTtsVoiceType = "controller" | "atis";

export type ServerTtsOptions = {
  /** Resolves voiceType/voice/styleInstruction/noise settings from ttsProfiles.ts. */
  profileId?: string;
  /** Selects a default voice from VOICE_TTS_VOICE_CONTROLLER / VOICE_TTS_VOICE_ATIS. Overrides the profile's voiceType if set. */
  voiceType?: ServerTtsVoiceType;
  /** Explicit OpenAI voice name — overrides profileId/voiceType defaults when set. */
  voice?: string;
  /** Explicit pace/style instruction — overrides the profile's styleInstruction when set. */
  styleInstruction?: string;
  /** Audio format returned by the server. Defaults to "mp3". */
  format?: "mp3" | "wav";
};

// Safe clamp range for HTMLAudioElement.playbackRate. Product decision: no training
// exercise should ever play slower than normal speech — difficulty increases by
// speeding up above normal, not by slowing beginners down. Minimum is 1.00.
const MIN_PLAYBACK_RATE = 1.0;
const MAX_PLAYBACK_RATE = 1.35;

function clampPlaybackRate(rate: number | undefined): number {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return MIN_PLAYBACK_RATE;
  return Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, rate));
}

type ActivePlayback = {
  audio: HTMLAudioElement;
  /** Resolves the pending speakWithServerTts() promise below — invoked by stopCurrentServerTts(). */
  resolve: () => void;
};

let current: ActivePlayback | null = null;
// Bumped on every speak/stop call. Lets a still-in-flight fetch/blob from an older
// speakWithServerTts() call detect it has been superseded and avoid starting stale
// playback after the fact (e.g. rapid double-tap on Play, or Stop while loading).
let generation = 0;

/**
 * Immediately stops any currently-playing (or in-flight/loading) server TTS audio:
 * pauses playback, resets/detaches the media element, and resolves the pending
 * speakWithServerTts() call for it so callers awaiting it don't hang. Object URL
 * revocation and noise-overlay teardown happen in that call's own `finally` block.
 *
 * Safe to call at any time, including when nothing is playing (no-op).
 */
export function stopCurrentServerTts(): void {
  generation++;
  const handle = current;
  current = null;
  if (!handle) return;

  try {
    handle.audio.pause();
    handle.audio.currentTime = 0;
  } catch {
    // ignore — element may already be detached/invalid
  }
  try {
    handle.audio.removeAttribute("src");
    handle.audio.load();
  } catch {
    // ignore — not supported/necessary in all environments
  }
  handle.resolve();
}

/** @deprecated Use stopCurrentServerTts — kept as an alias so existing call sites keep working. */
export function stopServerTts(): void {
  stopCurrentServerTts();
}

/**
 * Requests server-side TTS audio for `text` from /api/aerocomms/voice/speak and plays it
 * through an HTMLAudioElement, with an optional low-volume radio-noise overlay
 * resolved from `options.profileId` (see ttsProfiles.ts / audioNoise.ts).
 *
 * Always stops any previously playing/in-flight server TTS before starting new
 * speech (only one clip plays at a time). Throws on any failure (network,
 * non-2xx response, empty audio, playback error) so callers can fall back to
 * browser TTS — cancellation via stopCurrentServerTts() resolves instead of
 * throwing, since it is not a failure.
 *
 * Does not persist audio client-side beyond the temporary object URL used for
 * playback, and never touches the OpenAI API key (server-only).
 */
export async function speakWithServerTts(text: string, options: ServerTtsOptions = {}): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || typeof window === "undefined") return;

  stopCurrentServerTts();
  const myGeneration = generation;

  const profile = getTtsProfile(options.profileId);
  const voiceType = options.voiceType ?? profile?.voiceType;
  const voice = options.voice ?? profile?.voice;
  const styleInstruction = options.styleInstruction ?? profile?.styleInstruction;
  const noiseType = profile?.noiseType ?? "none";
  const noiseVolume = profile?.noiseVolume ?? 0;

  let response: Response;
  try {
    response = await fetch("/api/aerocomms/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        profileId: options.profileId,
        voiceType,
        voice,
        styleInstruction,
        format: options.format ?? "mp3",
      }),
    });
  } catch {
    throw new Error("Could not reach the voice service. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = "Voice synthesis failed. Please try again.";
    try {
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") {
        message = (data as { error: string }).error;
      }
    } catch {
      // ignore parse errors — fall back to the default message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (blob.size === 0) throw new Error("Received empty audio from the voice service.");

  // Superseded (stopped, or another speak() started) while we were awaiting the
  // network request above — don't start playback for a request nobody wants anymore.
  if (myGeneration !== generation) return;

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  // playbackRate is the reliable, audible pace control for Core Practice levels —
  // it never affects the cached audio itself, so the same clean TTS clip can be
  // reused and simply played back faster/slower per profile. Best-effort: if the
  // browser rejects the value for any reason, playback just continues at 1x.
  try {
    audio.playbackRate = clampPlaybackRate(profile?.playbackRate);
  } catch {
    // ignore — continue at normal speed
  }

  // Noise overlay is best-effort and never blocks/breaks TTS playback (see audioNoise.ts).
  // Disabled for all current profiles (noiseType: "none") — see ttsProfiles.ts.
  const noise = startNoiseOverlay(noiseType, noiseVolume);

  await new Promise<void>((resolve, reject) => {
    if (myGeneration !== generation) {
      // Superseded in the brief window between the check above and here.
      resolve();
      return;
    }

    const finish = (settle: () => void) => {
      if (current?.audio === audio) current = null;
      settle();
    };

    audio.onended = () => finish(resolve);
    audio.onerror = () => finish(() => reject(new Error("Audio playback failed.")));
    // stopCurrentServerTts() calls this to resolve (not reject) an externally-cancelled playback.
    current = { audio, resolve: () => finish(resolve) };

    audio.play().catch((err: unknown) => {
      finish(() => reject(err instanceof Error ? err : new Error("Audio playback failed.")));
    });
  }).finally(() => {
    try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    try { noise.stop(); } catch { /* ignore */ }
  });
}
