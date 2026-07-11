import type { TtsNoiseType } from "./ttsProfiles";

export type NoiseOverlayHandle = {
  stop: () => void;
};

const NOOP_HANDLE: NoiseOverlayHandle = { stop: () => {} };
const NOISE_BUFFER_SECONDS = 2;

let sharedContext: AudioContext | null = null;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;

  if (!sharedContext || sharedContext.state === "closed") {
    try {
      sharedContext = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedContext;
}

/** Bandpass center frequency per noise type — lower/narrower = more "radio-like" static. */
function filterFrequencyFor(noiseType: TtsNoiseType): number {
  switch (noiseType) {
    case "light-radio":
      return 2400;
    case "moderate-radio":
      return 2000;
    case "heavy-radio":
      return 1600;
    default:
      return 2400;
  }
}

function filterQFor(noiseType: TtsNoiseType): number {
  return noiseType === "heavy-radio" ? 0.9 : 0.6;
}

/**
 * Starts a low-volume looping radio-static overlay (Web Audio API) intended to play
 * underneath backend TTS audio for the duration of playback. Best-effort / enhancement
 * only: if Web Audio is unavailable (older Safari, restricted context, etc.) or setup
 * fails for any reason, this returns a no-op handle and clean TTS playback continues
 * completely unaffected.
 */
export function startNoiseOverlay(noiseType: TtsNoiseType, noiseVolume: number): NoiseOverlayHandle {
  if (noiseType === "none" || noiseVolume <= 0) return NOOP_HANDLE;

  const ctx = getAudioContext();
  if (!ctx) return NOOP_HANDLE;

  try {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * NOISE_BUFFER_SECONDS));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFrequencyFor(noiseType);
    filter.Q.value = filterQFor(noiseType);

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, noiseVolume));

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    if (ctx.state === "suspended") {
      // Best-effort resume — some browsers suspend contexts until a user gesture;
      // the Play button click that triggers TTS playback counts as that gesture.
      void ctx.resume().catch(() => {
        // ignore — if it can't resume, the overlay simply stays silent
      });
    }

    source.start();

    let stopped = false;
    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        try {
          source.stop();
        } catch {
          // ignore — may already be stopped
        }
        try {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {
          // ignore — already disconnected
        }
      },
    };
  } catch {
    return NOOP_HANDLE;
  }
}
