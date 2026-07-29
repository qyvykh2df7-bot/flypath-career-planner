"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMicrophone } from "@/hooks/aerocomms/useMicrophone";
import { createVoiceProvider } from "@/lib/aerocomms/voice/voiceProvider";
import { transcribeAudioWithServer } from "@/lib/aerocomms/voice/serverStt";
import type { SttResult, VoiceUiState } from "@/lib/aerocomms/voice/types";

type VoiceRecorderMode = "browser" | "server";

type VoiceRecorderProps = {
  disabled?: boolean;
  /** "browser" (default) uses the Web Speech API. "server" records audio and sends it to /api/aerocomms/voice/transcribe. */
  mode?: VoiceRecorderMode;
  /** Server mode only — auto-stops the recording after this many ms. Defaults to 12s. */
  maxDurationMs?: number;
  /**
   * Server mode only — how long the mic must stay below the silence threshold (after
   * the user has clearly spoken) before auto-stopping. Defaults to 1200ms (Train's
   * original tuning). Missions passes a shorter ~900ms (see RadioConversation.tsx)
   * to reduce perceived latency between the pilot finishing a call and ATC
   * responding — still comfortably above normal mid-sentence pause length.
   */
  silenceDurationMs?: number;
  onStateChange?: (state: VoiceUiState) => void;
  onResult: (result: SttResult) => void;
  onError: (message: string) => void;
};

const DEFAULT_MAX_DURATION_MS = 12000;
// Silence auto-stop (server mode only) — RMS levels on a 0..1 normalized time-domain signal.
// SPEECH threshold marks "the user has started talking"; SILENCE threshold (set a little lower,
// for hysteresis) marks "quiet enough to count toward the silence timer". Ambiguous levels in
// between reset the silence timer rather than advancing it, so a brief dip mid-sentence doesn't
// cut the recording short.
const SPEECH_RMS_THRESHOLD = 0.025;
const SILENCE_RMS_THRESHOLD = 0.015;
const DEFAULT_SILENCE_DURATION_MS = 1200;
const SILENCE_ANALYSER_FFT_SIZE = 512;

type StopReason = "silence" | "maxDuration" | "manual";

// Safari prefers mp4/aac; Chrome/Firefox support webm/opus. Never assume a MIME type is supported —
// probe in priority order and let the browser pick its own default as a last resort.
function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

/** Root-mean-square of a time-domain byte buffer, normalized to roughly 0..1. */
function computeRms(data: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    const normalized = (data[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / data.length);
}

// Mic icon reused in both loading placeholder and real button.
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

export function VoiceRecorder({
  disabled,
  mode = "browser",
  maxDurationMs = DEFAULT_MAX_DURATION_MS,
  silenceDurationMs = DEFAULT_SILENCE_DURATION_MS,
  onStateChange,
  onResult,
  onError,
}: VoiceRecorderProps) {
  const mic = useMicrophone();
  const provider = useMemo(() => createVoiceProvider(), []);
  const [active, setActive] = useState(false);
  // Server mode only: distinguishes "capturing audio" (tap-to-stop available) from
  // "uploading/transcribing" (button disabled, prevents double submit).
  const [serverPhase, setServerPhase] = useState<"idle" | "recording" | "uploading">("idle");
  // mounted=false on both server and first client render — guarantees identical HTML.
  const [mounted, setMounted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Silence auto-stop bookkeeping (server mode only) — plain refs since they're read/written
  // every animation frame and must never trigger a re-render.
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceRafRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const silenceStartedAtRef = useRef<number | null>(null);
  const stopReasonRef = useRef<StopReason>("manual");
  const recordingStartedAtRef = useRef(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const stopSilenceMonitor = () => {
    if (silenceRafRef.current !== null) {
      cancelAnimationFrame(silenceRafRef.current);
      silenceRafRef.current = null;
    }
    analyserRef.current = null;
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close().catch(() => { /* ignore */ });
    }
  };

  // Stop any in-flight recording/timers/audio analysis if the component unmounts mid-turn.
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      stopSilenceMonitor();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try { recorder.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  // Render a neutral, browser-API-free placeholder until mount so SSR and hydration match.
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled
          className="grid h-24 w-24 place-items-center rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-600 opacity-60 transition-transform"
          aria-label="Loading..."
        >
          <MicIcon />
        </button>
        <p className="text-sm font-medium text-slate-500">Hold to speak</p>
      </div>
    );
  }

  // After mount: safe to read browser APIs. Browser mode needs SpeechRecognition support;
  // server mode needs MediaRecorder support. Both need microphone access either way.
  const serverCapable = mic.isSupported && typeof MediaRecorder !== "undefined";
  const browserCapable = mic.isSupported && provider.stt.isSupported();
  // Every Train mic exercise requests "server" by default. Browser STT only kicks in when
  // MediaRecorder is unavailable on this device; it never bypasses server quotas on failure.
  const effectiveMode: VoiceRecorderMode =
    mode === "server" && !serverCapable && browserCapable ? "browser" : mode;
  const unsupported = effectiveMode === "server" ? !serverCapable : !browserCapable;

  const setVoiceState = (state: VoiceUiState) => {
    onStateChange?.(state);
  };

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const stopServerRecording = (reason: StopReason) => {
    clearAutoStopTimer();
    stopSilenceMonitor();
    stopReasonRef.current = reason;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  // Server mode only — watches mic volume via an AnalyserNode and stops the recording once the
  // user has clearly spoken and then gone quiet for silenceDurationMs. Best-effort: if the Web
  // Audio API is unavailable or throws, we simply skip silence detection and rely on the
  // maxDuration timer (already scheduled independently) as the safety net.
  const startSilenceMonitor = (stream: MediaStream) => {
    try {
      const AudioContextCtor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const audioContext = new AudioContextCtor();
      // iOS Safari can start a freshly-created AudioContext in "suspended" state even when
      // triggered from a user gesture chain — resume() is a harmless no-op otherwise.
      void audioContext.resume().catch(() => { /* ignore */ });

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = SILENCE_ANALYSER_FFT_SIZE;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      hasSpokenRef.current = false;
      silenceStartedAtRef.current = null;

      const buffer = new Uint8Array(analyser.fftSize);
      const tick = () => {
        const currentAnalyser = analyserRef.current;
        if (!currentAnalyser) return; // monitor was stopped
        currentAnalyser.getByteTimeDomainData(buffer);
        const rms = computeRms(buffer);
        const now = performance.now();

        if (rms >= SPEECH_RMS_THRESHOLD) {
          hasSpokenRef.current = true;
          silenceStartedAtRef.current = null;
        } else if (hasSpokenRef.current && rms < SILENCE_RMS_THRESHOLD) {
          if (silenceStartedAtRef.current === null) {
            silenceStartedAtRef.current = now;
          } else if (now - silenceStartedAtRef.current >= silenceDurationMs) {
            stopServerRecording("silence");
            return; // recorder.onstop takes over from here
          }
        } else {
          // Ambiguous band, or silence before the user has spoken yet — require a full
          // continuous silenceDurationMs below threshold, so reset any partial timer.
          silenceStartedAtRef.current = null;
        }

        silenceRafRef.current = requestAnimationFrame(tick);
      };
      silenceRafRef.current = requestAnimationFrame(tick);
    } catch {
      // Silence detection is best-effort only — maxDuration remains the safety net.
    }
  };

  const handleBrowserStart = async () => {
    if (disabled || active) return;
    if (unsupported) {
      setVoiceState("unsupported");
      return;
    }

    setActive(true);
    setVoiceState("requesting_permission");
    const stream = await mic.start();
    if (!stream) {
      setActive(false);
      setVoiceState(mic.status === "unsupported" ? "unsupported" : "error");
      onError(mic.error ?? "Microphone permission was not granted.");
      return;
    }

    setVoiceState("recording");
    try {
      const result = await provider.stt.transcribeOnce({ lang: "en-GB", timeoutMs: 6500 });
      setVoiceState("processing");
      onResult(result);
    } catch (error) {
      setVoiceState("error");
      onError(error instanceof Error ? error.message : "Voice recognition failed.");
    } finally {
      provider.stt.cancel();
      mic.stop();
      setActive(false);
    }
  };

  const handleServerStart = async () => {
    if (disabled || serverPhase !== "idle") return;
    if (unsupported) {
      setVoiceState("unsupported");
      return;
    }

    setActive(true);
    setServerPhase("recording");
    setVoiceState("requesting_permission");
    const stream = await mic.start();
    if (!stream) {
      setActive(false);
      setServerPhase("idle");
      setVoiceState(mic.status === "unsupported" ? "unsupported" : "error");
      onError(mic.error ?? "Microphone permission was not granted.");
      return;
    }

    const mimeType = pickAudioMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      mic.stop();
      setActive(false);
      setServerPhase("idle");
      setVoiceState("error");
      onError("Could not start audio recording on this device.");
      return;
    }

    chunksRef.current = [];
    mediaRecorderRef.current = recorder;
    stopReasonRef.current = "manual";

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      clearAutoStopTimer();
      stopSilenceMonitor();
      mic.stop();
      mediaRecorderRef.current = null;
      const recordingMs = Math.round(performance.now() - recordingStartedAtRef.current);
      const stopReason = stopReasonRef.current;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
      chunksRef.current = [];

      if (blob.size === 0) {
        setActive(false);
        setServerPhase("idle");
        setVoiceState("error");
        onError("No audio captured. Please try again.");
        return;
      }

      setServerPhase("uploading");
      setVoiceState("processing");
      const transcribeStartedAt = performance.now();
      try {
        const { transcript } = await transcribeAudioWithServer(blob, { language: "en" });
        const transcribeMs = Math.round(performance.now() - transcribeStartedAt);
        if (process.env.NODE_ENV !== "production") {
          const blobKB = (blob.size / 1024).toFixed(1);
          // Dev-only latency diagnostics: no API key, audio, or full transcript is ever logged.
          console.debug(
            `[voice] server STT — stop=${stopReason} recordingMs=${recordingMs} blobKB=${blobKB} transcribeMs=${transcribeMs} transcriptLength=${transcript.length}`,
          );
        }
        setActive(false);
        setServerPhase("idle");
        onResult({ transcript, timing: { recordingMs, transcribeMs, stopReason } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Voice recognition failed.";
        setActive(false);
        setServerPhase("idle");
        setVoiceState("error");
        onError(message);
      }
    };

    setVoiceState("recording");
    recordingStartedAtRef.current = performance.now();
    recorder.start();
    startSilenceMonitor(stream);
    autoStopTimerRef.current = setTimeout(() => stopServerRecording("maxDuration"), maxDurationMs);
  };

  const handleClick = () => {
    if (effectiveMode === "server") {
      if (serverPhase === "recording") {
        stopServerRecording("manual");
      } else if (serverPhase === "idle") {
        void handleServerStart();
      }
      return;
    }
    void handleBrowserStart();
  };

  const isServerUploading = effectiveMode === "server" && serverPhase === "uploading";
  const isServerRecording = effectiveMode === "server" && serverPhase === "recording";
  // Server mode stays clickable while recording so the button doubles as "tap to stop";
  // uploading disables it to prevent a double submit while the transcript is in flight.
  const clickBlocked = disabled || unsupported || isServerUploading || (effectiveMode === "browser" && active);

  const label = unsupported
    ? "Voice unavailable"
    : effectiveMode === "server"
      ? isServerUploading
        ? "Processing audio..."
        : isServerRecording
          ? "Recording... tap to stop"
          : "Tap to speak"
      : active
        ? "Listening..."
        : "Hold to speak";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={clickBlocked}
        onClick={handleClick}
        className={`grid h-24 w-24 place-items-center rounded-full border transition-transform active:scale-95 ${
          active
            ? "border-[#FACC15]/60 bg-[#FACC15]/20 text-[#FACC15] shadow-[0_0_36px_rgba(250,204,21,0.22)]"
            : unsupported
              ? "border-slate-700 bg-slate-800/60 text-slate-500"
              : "border-[#FACC15]/35 bg-[#FACC15] text-[#07111F] shadow-[0_18px_44px_-18px_rgba(250,204,21,0.8)]"
        }`}
        aria-label={label}
      >
        <MicIcon />
      </button>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      {unsupported && (
        <p className="max-w-xs text-center text-xs leading-relaxed text-amber-300">
          Voice recognition is not supported in this browser yet.
        </p>
      )}
    </div>
  );
}
