import { BrowserSttAdapter } from "./browserStt";
import { BrowserTtsAdapter } from "./browserTts";
import { speakWithServerTts, stopCurrentServerTts, type ServerTtsOptions } from "./serverTts";
import type { SttAdapter, TtsAdapter, TtsOptions } from "./types";

// STT provider behavior — unchanged from before the TTS foundation was added.
export type VoiceProvider = {
  id: "browser";
  stt: SttAdapter;
  tts: TtsAdapter;
};

export function createVoiceProvider(): VoiceProvider {
  return {
    id: "browser",
    stt: new BrowserSttAdapter(),
    tts: new BrowserTtsAdapter(),
  };
}

/* ------------------------------------------------------------------ */
/* TTS provider behavior (new)                                        */
/* ------------------------------------------------------------------ */

export type TtsMode = "server" | "browser";

/** Preferred TTS mode for call sites opted into the new provider. Server TTS falls
 *  back to browser automatically on any failure — this only controls what is tried first. */
export const DEFAULT_TTS_MODE: TtsMode = "server";

export type SpeakOptions = ServerTtsOptions & Pick<TtsOptions, "lang" | "rate" | "pitch" | "volume">;

/**
 * Stops all TTS playback started through this provider — both server TTS (and its
 * noise overlay, if any) and browser speechSynthesis. Safe to call any time,
 * including when nothing is speaking, and safe on the server (no-ops via guards
 * in stopCurrentServerTts/BrowserTtsAdapter.cancel).
 *
 * Intended for lifecycle cleanup: call this when the exercise/screen changes,
 * on component unmount, or when the user navigates away — see the Train TTS
 * call sites in app/session/page.tsx and app/components/student-pilot/
 * SpSessionScreen.tsx (and SpListeningShell.tsx) for reference usage.
 */
export function stopSpeaking(): void {
  stopCurrentServerTts();
  try {
    new BrowserTtsAdapter().cancel();
  } catch {
    // ignore — speechSynthesis unavailable/unsupported
  }
}

/**
 * Preferred entry point for NEW TTS call sites (Voice TTS Foundation).
 *
 * Tries server TTS first (OpenAI — higher-quality aviation voice), and falls back
 * to the existing BrowserTtsAdapter (speechSynthesis) if the backend is not
 * configured or the request fails for any reason. This is additive and opt-in per
 * call site — Train's local `speak()` helpers (Cadet in app/session/page.tsx,
 * Student Pilot/RFR/Airline Prep/Advanced Ops in SpSessionScreen.tsx and
 * SpListeningShell.tsx) all delegate to this function. Missions/ATC Sim and
 * onboarding are intentionally not connected yet.
 *
 * Always stops any previous speech (server or browser) before starting new speech.
 */
export async function speak(text: string, options: SpeakOptions = {}, mode: TtsMode = DEFAULT_TTS_MODE): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  stopSpeaking();

  if (mode === "server") {
    try {
      await speakWithServerTts(trimmed, {
        profileId: options.profileId,
        voiceType: options.voiceType,
        voice: options.voice,
        styleInstruction: options.styleInstruction,
        format: options.format,
      });
      return;
    } catch {
      // Server TTS unavailable/failed — fall back to browser speech synthesis below.
    }
  }

  const browserTts = new BrowserTtsAdapter();
  await browserTts.speak(trimmed, {
    lang: options.lang,
    rate: options.rate,
    pitch: options.pitch,
    volume: options.volume,
  });
}
