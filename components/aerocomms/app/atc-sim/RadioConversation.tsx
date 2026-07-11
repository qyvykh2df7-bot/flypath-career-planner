"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildCorrectiveAtcResponse,
  buildUnrelatedAtcResponse,
  findMission,
  findMissingRequiredItems,
  formatClock,
  getEffectivePilotStepItems,
  isUnrelatedResponse,
  markMissionLatencyOrigin,
  resolveAtcProfileId,
  speakAtcAutoplay,
  speakAtcReplay,
  stopAtcSpeech,
  type AtcSessionDescriptor,
  type AtcStep,
  type TranscriptTurn,
} from "@/lib/aerocomms/atcSim";
import type { SttResult, VoiceUiState } from "@/lib/aerocomms/voice/types";
import { VoiceRecorder } from "../voice/VoiceRecorder";
import { AtcBubble, PilotBubble } from "./ConversationBubble";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Bounded failsafe for ATC autoplay — "ATC transmitting…" must never stay stuck. This
 * is a last-resort backstop for a genuinely hung TTS promise (e.g. a fetch that never
 * settles), NOT the normal way playback ends — the normal path is audio.onended
 * resolving the promise in missionAudio.ts's playMissionAudio, which fires at the
 * ACTUAL end of playback regardless of what this estimate guesses.
 *
 * v3 quality pass: this used to be tuned tight to expected speech duration (words /
 * 2.6 + 4s), which under-estimated lines with digit groups — "QNH 1013" counts as one
 * "word" via a naive split but is actually spoken as four digits ("one zero one
 * three"), taking much longer. When the timer fired before the real audio finished, it
 * falsely marked playback as failed and enabled "Continue"/the manual Play button early
 * — the reported "audio cuts off" symptom (the lingering old audio then got stopped by
 * whatever the pilot did next: replay, recording, or advancing). Fixed by (a) counting
 * each digit as its own extra spoken unit, and (b) using a much more generous cadence
 * and floor so this only fires for a genuine hang, never a normal-length line.
 */
/**
 * Thin module-level wrapper around performance.now() — kept OUTSIDE the component so
 * the read of an impure clock lives in one clearly side-effect-y utility (used only
 * for dev-only [mission:latency] console diagnostics, never for render output/state),
 * rather than an inline performance.now() call sitting directly in an event handler
 * defined in the component body (see handleVoiceResult / Part G latency logs).
 */
function latencyNowMs(): number {
  return performance.now();
}

/** Resolves the true "recording stopped" timestamp from an STT result. */
function resolveRecordingStoppedAt(stt: SttResult): number {
  const now = latencyNowMs();
  return stt.timing ? now - stt.timing.transcribeMs : now;
}

/** Milliseconds elapsed since `originMs` on the performance.now() clock, rounded. */
function elapsedMsSince(originMs: number): number {
  return Math.round(latencyNowMs() - originMs);
}

function atcAutoplaySafetyMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const digits = (text.match(/\d/g) ?? []).length;
  const units = words + digits;
  const estimatedMs = (units / 1.8) * 1000 + 6000; // generous cadence + fetch/network overhead
  return Math.min(22000, Math.max(10000, estimatedMs));
}

/**
 * Mission mic maxDuration tiers, based on the pilot step's expected read-back length.
 * This is a safety-net ceiling only — VoiceRecorder's silence auto-stop normally ends the
 * recording shortly after the pilot finishes speaking, well before this fires.
 */
const MISSION_SHORT_MAX_DURATION_MS = 8000;
const MISSION_NORMAL_MAX_DURATION_MS = 12000;
const MISSION_LONG_MAX_DURATION_MS = 15000;
const MISSION_SHORT_WORD_THRESHOLD = 6;
const MISSION_LONG_WORD_THRESHOLD = 14;

/**
 * Missions-only silence auto-stop tuning (Part H — latency pass v2). Train keeps
 * VoiceRecorder's original 1200ms default (readbacks/scenarios can have natural
 * pauses); Missions radio calls are short, single-breath transmissions where a
 * shorter silence window meaningfully cuts perceived ATC-response latency without
 * risking cutting off normal mid-call pauses (readback numbers, "over").
 */
const MISSION_SILENCE_DURATION_MS = 900;

function missionMaxDurationMs(step: AtcStep): number {
  const text = step.expected ?? step.text ?? "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words > MISSION_LONG_WORD_THRESHOLD) return MISSION_LONG_MAX_DURATION_MS;
  if (words <= MISSION_SHORT_WORD_THRESHOLD) return MISSION_SHORT_MAX_DURATION_MS;
  return MISSION_NORMAL_MAX_DURATION_MS;
}

type RadioConversationProps = {
  descriptor: AtcSessionDescriptor;
  onComplete: (transcript: TranscriptTurn[], durationSec: number) => void;
  onExit: () => void;
};

/**
 * Waveform — always rendered, never removed from DOM.
 * active=true : fast energetic animation + full opacity
 * active=false: slow idle heartbeat at reduced opacity
 * large=true  : bigger bars (centered display above conversation)
 */
function Waveform({ active, large = false }: { active: boolean; large?: boolean }) {
  const heights = [4, 6, 10, 14, 18, 14, 10, 6, 4, 7, 13, 17, 13, 7, 4, 9, 15, 9, 4];
  const scale = large ? 1 : 0.55;
  return (
    <span
      className="flex items-end"
      style={{ gap: large ? 4 : 3, height: large ? 40 : undefined }}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="rounded-full bg-[#FACC15]"
          style={{
            width: large ? 4 : 3,
            height: active ? h * scale * 2 : h * scale * 1.1,
            opacity: active ? 0.94 : 0.52,
            animation: active
              ? `atcWave 0.7s ease-in-out ${i * 0.06}s infinite alternate`
              : `atcIdle 2.8s ease-in-out ${i * 0.15}s infinite alternate`,
            transition: "height 0.3s ease, opacity 0.3s ease",
          }}
        />
      ))}
      <style>{`
        @keyframes atcWave { from { transform: scaleY(0.3) } to { transform: scaleY(1) } }
        @keyframes atcIdle { from { transform: scaleY(0.55) } to { transform: scaleY(0.85) } }
      `}</style>
    </span>
  );
}

/** Normalize context text for duplicate comparison. */
function normalizeContextText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[·:—–\-.,/→]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip leading position phrasing so "You are at X" can match location "X". */
function stripPositionPrefix(text: string): string {
  return normalizeContextText(text)
    .replace(/^you are (at |on |in )?/, "")
    .replace(/^currently (at |on |in )?/, "")
    .trim();
}

/** Token overlap ratio — 1.0 means the shorter text is fully covered by shared words. */
function overlapRatio(a: string, b: string): number {
  const tokensA = normalizeContextText(a)
    .split(" ")
    .filter((t) => t.length > 2);
  const tokensB = normalizeContextText(b)
    .split(" ")
    .filter((t) => t.length > 2);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  let shared = 0;
  for (const token of tokensA) {
    if (setB.has(token)) shared++;
  }
  return shared / Math.min(tokensA.length, tokensB.length);
}

function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}

/** Drop whatYouKnow bullets already shown in the header (station + frequency). */
function filterStationFrequencyDuplicates(
  items: string[],
  station?: string,
  frequency?: string,
): string[] {
  const stationLine = normalizeContextText([station, frequency].filter(Boolean).join(" "));
  const freqDigits = frequency ? digitsOnly(frequency) : "";

  return items.filter((item) => {
    const normItem = normalizeContextText(item);

    if (stationLine) {
      const normStation = station ? normalizeContextText(station) : "";
      const mentionsStation = normStation.length > 0 && normItem.includes(normStation);
      const mentionsFreq = freqDigits.length >= 3 && digitsOnly(normItem).includes(freqDigits);

      if (overlapRatio(normItem, stationLine) >= 0.55) return false;
      if (mentionsStation && mentionsFreq && normItem.length <= stationLine.length + 12) return false;
      if (mentionsStation && !frequency && normItem.length <= normStation.length + 8) return false;
    }

    return true;
  });
}

function isLocationCovered(items: string[], location: string): boolean {
  const normLocation = normalizeContextText(location);
  return items.some((item) => {
    const stripped = stripPositionPrefix(item);
    return (
      overlapRatio(item, location) >= 0.65 ||
      overlapRatio(stripped, location) >= 0.65 ||
      normLocation.includes(stripped) ||
      stripped.includes(normLocation)
    );
  });
}

/** Build WHAT YOU KNOW: drop station/freq dupes, inject position when missing from bullets. */
function buildDisplayedWhatYouKnow(
  items: string[] | undefined,
  location?: string,
  station?: string,
  frequency?: string,
): string[] {
  const filtered = filterStationFrequencyDuplicates(items ?? [], station, frequency);
  if (!location || isLocationCovered(filtered, location)) return filtered;
  return [location, ...filtered];
}

export default function RadioConversation({ descriptor, onComplete, onExit }: RadioConversationProps) {
  const steps = descriptor.steps;
  const total = steps.length;

  const [active, setActive] = useState(0);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [atcSpeaking, setAtcSpeaking] = useState(false);
  // True when the last ATC autoplay attempt did not finish cleanly (blocked, network
  // failure, or safety timeout) — surfaces a manual "Play ATC" button instead of the
  // normal "tap to continue" flow, so the mission never silently falls back to the
  // old browser voice and never gets stuck waiting.
  const [atcPlaybackFailed, setAtcPlaybackFailed] = useState(false);
  // Real mic/STT for pilot turns — server STT with browser fallback, silence auto-stop and
  // dev timing logs all come from VoiceRecorder itself. voiceError surfaces STT failures
  // (permission denied, no speech detected, transcription error) so the pilot can just tap again.
  const [voiceState, setVoiceState] = useState<VoiceUiState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // v4 generic mission evaluator — set once a required-item retry has failed at least
  // `maxRetriesBeforeHint` times on the current pilot step, naming exactly what's
  // still missing so the pilot always has a concrete way to succeed (see commitPilot /
  // Part D anti-loop rule).
  const [retryHint, setRetryHint] = useState<string | null>(null);

  const secondsRef = useRef(0);
  const recordedRef = useRef<Set<string>>(new Set());
  // Per-step failed-attempt counter for the required-item retry flow — keyed by step id
  // so counts don't leak across steps/missions.
  const retryCountRef = useRef<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const isMountedRef = useRef(true);
  // Fixed visual timer for manual Replay/Play taps — decoupled from the actual
  // backend TTS promise (see handleReplay doc comment).
  const atcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bounded failsafe timer + generation guard for ATC AUTOPLAY specifically — this is
  // what guarantees "ATC transmitting…" can never stay stuck (see playAutoplayAtcLine).
  const atcSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atcSpeakGenRef = useRef(0);

  /* Timer */
  useEffect(() => {
    const t = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* Cancel speech + all timers on unmount (user leaves session mid-conversation). */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (atcTimerRef.current) clearTimeout(atcTimerRef.current);
      if (atcSafetyTimerRef.current) clearTimeout(atcSafetyTimerRef.current);
      // Invalidate any pending autoplay callback (plain counter ref, not a DOM node —
      // safe to bump on unmount regardless of when the effect closure captured it).
      atcSpeakGenRef.current += 1;
      stopAtcSpeech();
    };
  }, []);

  /*
   * Plays an ATC line for AUTOPLAY via backend OpenAI TTS. atcSpeaking/atcPlaybackFailed
   * are ALWAYS cleared by clearLock — either on the TTS promise settling (played/blocked/
   * failed) or on the bounded safety timer firing, whichever comes first. No code path can
   * leave "ATC transmitting…" stuck: the promise never throws (speakAtcAutoplay always
   * resolves to an outcome) and the safety timer is an independent backstop regardless.
   */
  const playAutoplayAtcLine = (text: string, profileId: string) => {
    setAtcSpeaking(true);
    setAtcPlaybackFailed(false);
    const myGen = ++atcSpeakGenRef.current;

    const clearLock = (failed: boolean, reason: string) => {
      if (atcSafetyTimerRef.current) {
        clearTimeout(atcSafetyTimerRef.current);
        atcSafetyTimerRef.current = null;
      }
      if (!isMountedRef.current || atcSpeakGenRef.current !== myGen) return;
      if (isDev) console.log(`[mission:atc:autoplay] clearing lock (${reason})`);
      setAtcSpeaking(false);
      setAtcPlaybackFailed(failed);
    };

    if (atcSafetyTimerRef.current) clearTimeout(atcSafetyTimerRef.current);
    atcSafetyTimerRef.current = setTimeout(() => clearLock(true, "safety timeout"), atcAutoplaySafetyMs(text));

    void speakAtcAutoplay(text, profileId)
      .then((outcome) => clearLock(outcome !== "played", `outcome=${outcome}`))
      .catch((err: unknown) => {
        if (isDev) console.warn("[mission:atc:autoplay] unexpected rejection", err);
        clearLock(true, "unexpected rejection");
      });
  };

  /* ATC step: add bubble + autoplay. Pilot step: stop any lingering ATC audio — a step
   * change is one of the explicitly-allowed triggers to stop audio (Part B), separate
   * from the display-only safety timer above, which must never stop audio by itself. */
  useEffect(() => {
    const step = steps[active];
    if (!step) return;
    if (step.speaker === "atc" && !recordedRef.current.has(step.id)) {
      recordedRef.current.add(step.id);
      const spoken = step.spoken ?? step.text;
      setTurns((t) => [
        ...t,
        { speaker: "atc", text: step.text, spoken, time: formatClock(secondsRef.current) },
      ]);
      playAutoplayAtcLine(spoken, resolveAtcProfileId(spoken, descriptor.level));
    } else if (step.speaker === "pilot") {
      atcSpeakGenRef.current += 1;
      if (atcSafetyTimerRef.current) {
        clearTimeout(atcSafetyTimerRef.current);
        atcSafetyTimerRef.current = null;
      }
      stopAtcSpeech();
      setAtcSpeaking(false);
      setAtcPlaybackFailed(false);
      setRetryHint(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* Auto-scroll to latest bubble */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const current = steps[active];
  const isPilotTurn = current?.speaker === "pilot";

  const finish = (finalTurns: TranscriptTurn[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (atcTimerRef.current) clearTimeout(atcTimerRef.current);
    if (atcSafetyTimerRef.current) clearTimeout(atcSafetyTimerRef.current);
    atcSpeakGenRef.current++;
    // Stops both autoplay's backend audio AND any manual Replay backend/browser audio.
    stopAtcSpeech();
    onComplete(finalTurns, secondsRef.current);
  };

  /* Pilot turn commit — v4 generic evaluator: every pilot step (hand-authored or
   * auto-derived, see getEffectivePilotStepItems) is gated by a required-item retry
   * flow before accepting/advancing. If the transcript is missing any required
   * concept, the step does NOT advance: a corrective ATC line is spoken/shown instead
   * (same autoplay path/voice as scripted ATC turns) and the pilot can answer again on
   * the SAME step (VoiceRecorder isn't remounted since `current.id` — its key — hasn't
   * changed). A transcript unrelated to the expected readback (no required items
   * matched at all, near-zero phrase overlap) gets a distinct "say again"/"unable to
   * understand" line instead of the specific "include X" wording (Part C). Both turns
   * are tagged isRetry (+ retryReason) so buildResult() scores the step from its final
   * accepted transcript with a penalty for the retries, while still keeping the full
   * back-and-forth in the displayed transcript. */
  const commitPilot = (text: string) => {
    const step = current;
    const callsign = missionCtx?.callsign ?? "Pilot";
    if (step) {
      const { requiredItems } = getEffectivePilotStepItems(step, missionCtx?.callsign);
      if (requiredItems.length > 0) {
        const missing = findMissingRequiredItems(text, requiredItems, missionCtx?.callsign);
        if (missing.length > 0) {
          const attempt = (retryCountRef.current[step.id] ?? 0) + 1;
          retryCountRef.current[step.id] = attempt;

          const unrelated = isUnrelatedResponse(text, step, requiredItems, missionCtx?.callsign);
          const corrective = unrelated
            ? buildUnrelatedAtcResponse(callsign, attempt)
            : buildCorrectiveAtcResponse(callsign, missing, attempt, step.correctionPrompts);
          const pilotTurn: TranscriptTurn = {
            speaker: "pilot",
            text,
            time: formatClock(secondsRef.current),
            isRetry: true,
            retryReason: unrelated ? "unrelated" : "missing-items",
          };
          const atcTurn: TranscriptTurn = {
            speaker: "atc",
            text: corrective.text,
            spoken: corrective.spoken,
            time: formatClock(secondsRef.current),
            isRetry: true,
            retryReason: unrelated ? "unrelated" : "missing-items",
          };
          setTurns((t) => [...t, pilotTurn, atcTurn]);
          const hintThreshold = step.maxRetriesBeforeHint ?? 2;
          setRetryHint(
            attempt >= hintThreshold
              ? unrelated
                ? "Hint: say your callsign and the message ATC is expecting from you."
                : `Hint: still missing — ${missing.map((m) => m.label).join(", ")}.`
              : null,
          );
          if (isDev) {
            console.log(
              `[mission:evaluator] step=${step.id} attempt=${attempt} unrelated=${unrelated} missing=${missing.map((m) => m.id).join(",")}`,
            );
            console.log("[mission:latency] evaluate done (outcome=retry)");
          }
          playAutoplayAtcLine(corrective.spoken, resolveAtcProfileId(corrective.spoken, descriptor.level));
          return;
        }
      }
    }
    if (isDev) console.log("[mission:latency] evaluate done (outcome=advance)");
    setRetryHint(null);
    const turn: TranscriptTurn = { speaker: "pilot", text, time: formatClock(secondsRef.current) };
    const nextTurns = [...turns, turn];
    setTurns(nextTurns);
    if (active >= total - 1) finish(nextTurns);
    else setActive(active + 1);
  };

  const atcNext = () => {
    if (active >= total - 1) finish(turns);
    else setActive(active + 1);
  };

  /* Replay from bubble — activates waveform again. User-triggered (click), so
   * unlike autoplay this can safely use backend OpenAI TTS (with automatic
   * browser fallback) — see speakAtcReplay(). Fire-and-forget: the waveform/
   * mic-lock timing intentionally stays on the same fixed timer as before,
   * independent of the backend TTS promise. Also doubles as the manual
   * "Play ATC" fallback handler when autoplay failed (see handleManualPlayAtc). */
  const handleReplay = (text: string, spoken?: string) => {
    // Invalidate any pending autoplay callback so it can't clobber this state right after.
    atcSpeakGenRef.current++;
    if (atcSafetyTimerRef.current) {
      clearTimeout(atcSafetyTimerRef.current);
      atcSafetyTimerRef.current = null;
    }
    const spokenText = spoken ?? text;
    speakAtcReplay(spokenText, resolveAtcProfileId(spokenText, descriptor.level));
    setAtcSpeaking(true);
    setAtcPlaybackFailed(false);
    if (atcTimerRef.current) clearTimeout(atcTimerRef.current);
    atcTimerRef.current = setTimeout(() => setAtcSpeaking(false), 2200);
  };

  /* Manual fallback shown when ATC autoplay didn't play cleanly — reuses the same
   * click-triggered backend-TTS path as bubble Replay (same voice, same guarantees). */
  const handleManualPlayAtc = () => {
    if (!current || current.speaker !== "atc") return;
    handleReplay(current.text, current.spoken);
  };

  /* ATC turns: tap to continue (no speech required — mic only captures pilot turns). */
  const handleContinue = () => {
    if (atcSpeaking || isPilotTurn) return;
    if (atcPlaybackFailed) {
      handleManualPlayAtc();
      return;
    }
    atcNext();
  };

  /* Pilot turns: commit the ACTUAL detected transcript (not the scripted line) so the
   * transcript/debrief screens reflect real performance. buildResult() evaluates each pilot
   * turn's transcript against its step's expected read-back (tolerant of aviation variants,
   * callsign/number normalization) once the session completes. */
  const handleVoiceResult = (stt: SttResult) => {
    if (!current || current.speaker !== "pilot") return;
    // Latency instrumentation (Part G). VoiceRecorder's onResult only fires once
    // server STT has already finished, `transcribeMs` after the recording actually
    // stopped — so the true "recording stopped" instant is `now - transcribeMs`,
    // not now. Anchoring [mission:latency]'s t=0 there (instead of "now") means every
    // downstream log (stt done, evaluate, tts) reports a real elapsed-since-recording-
    // stop number, giving one aligned timeline for the whole pipeline in the console.
    const recordingStoppedAt = resolveRecordingStoppedAt(stt);
    markMissionLatencyOrigin(recordingStoppedAt);
    if (isDev) {
      if (stt.timing) {
        const { recordingMs, transcribeMs, stopReason } = stt.timing;
        console.log(`[mission:latency] recording stopped (stopReason=${stopReason}, recordingMs=${recordingMs})`);
        console.log(`[mission:latency] stt start (elapsed=0ms)`);
        console.log(`[mission:latency] stt done (elapsed=${transcribeMs}ms)`);
      } else {
        console.log("[mission:latency] recording stopped (browser STT — no server timing available)");
      }
    }
    const transcript = stt.transcript.trim();
    if (!transcript) {
      setVoiceState("idle");
      setVoiceError("No speech detected. Tap to try again.");
      return;
    }
    setVoiceState("idle");
    setVoiceError(null);
    if (isDev) console.log(`[mission:latency] evaluate start (elapsed=${elapsedMsSince(recordingStoppedAt)}ms)`);
    commitPilot(transcript);
  };

  const handleVoiceStateChange = (state: VoiceUiState) => {
    setVoiceState(state);
    if (state === "requesting_permission") setVoiceError(null);
    // Voice overlap protection: never let ATC audio bleed into the pilot's mic recording.
    if (state === "recording") stopAtcSpeech();
  };

  const handleVoiceError = (message: string) => {
    setVoiceError(message);
  };

  const missionCtx =
    descriptor.source === "mission" && descriptor.missionId
      ? findMission(descriptor.missionId)?.context
      : undefined;

  const displayedWhatYouKnow = missionCtx
    ? buildDisplayedWhatYouKnow(
        missionCtx.whatYouKnow,
        missionCtx.location,
        missionCtx.station,
        missionCtx.frequency,
      )
    : [];

  // Only covers the ATC "tap to continue" state now — pilot turns render VoiceRecorder,
  // which shows its own live label ("Tap to speak" / "Recording... tap to stop" / etc).
  const showManualPlayAtc = !isPilotTurn && !atcSpeaking && atcPlaybackFailed;
  const continueLabel = atcSpeaking
    ? "ATC transmitting…"
    : showManualPlayAtc
    ? "Tap to hear ATC"
    : active >= total - 1
    ? "End of session"
    : "Ready — tap to continue";

  return (
    /*
     * 3-zone chat layout:
     *   Zone A (shrink-0): header + ATC status
     *   Zone B (flex-1, overflow-y-auto): scrollable conversation
     *   Zone C (shrink-0): fixed mic dock
     *
     * height: 100dvh + paddingBottom: 96px covers the bottom nav area.
     * NO overflow-hidden on this container — only Zone B scrolls.
     */
    <section
      className="relative -mx-4 -mt-6 -mb-24 flex flex-col overflow-hidden lg:-mx-8 lg:-mt-8 lg:-mb-16"
      style={{ height: "100dvh", minHeight: "100dvh", paddingBottom: 96, background: "#020814" }}
    >
      {/* Full-screen background image + dark overlay for legibility.
          Desktop: `lg:fixed` escapes the app shell's max-w-[1360px] content column so the
          image always covers the full browser viewport, with no dark side bands. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 lg:fixed lg:inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(2,8,20,0.32) 0%, rgba(2,8,20,0.48) 45%, rgba(2,8,20,0.70) 100%), url('/images/aerocomms/fondofreef.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ── Zone A: Header + ATC status (shrink-0, never scrolls) ── */}
      <div className="relative z-10 shrink-0 px-4 pt-5">
        <header className="flex items-center justify-between">
          <button
            onClick={onExit}
            aria-label="Exit session"
            className="flex items-center"
            style={{ gap: 5, fontSize: 13, fontWeight: 600, color: "rgba(226,232,240,0.72)" }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: 18, height: 18 }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Exit
          </button>

          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>
              {descriptor.title}
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                background: "rgba(250,204,21,0.14)",
                padding: "2px 10px",
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#FACC15",
              }}
            >
              {descriptor.phaseBadge}
            </span>
          </div>

          <span
            style={{
              minWidth: 44,
              textAlign: "right",
              fontFamily: "monospace",
              fontSize: 13,
              color: "rgba(148,163,184,0.9)",
            }}
          >
            {formatClock(seconds)}
          </span>
        </header>

        {/* Waveform — centered, no text labels, always visible */}
        <div
          className="flex justify-center"
          style={{
            marginTop: 10,
            marginBottom: 14,
            filter: atcSpeaking
              ? "drop-shadow(0 0 8px rgba(250,204,21,0.55))"
              : "none",
            transition: "filter 0.3s ease",
          }}
        >
          <Waveform active={atcSpeaking} large />
        </div>
      </div>

      {/* ── Zone B: Scrollable conversation — ONLY this zone scrolls ── */}
      <div
        ref={scrollRef}
        className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4"
        style={{ paddingTop: 12 }}
      >
        <div className="flex flex-col lg:mx-auto lg:w-full lg:max-w-[1040px]" style={{ gap: 12, paddingBottom: 16 }}>

          {/* ── Merged mission context card — callsign/station/freq header, what you know, your task ── */}
          {missionCtx && (
            <div
              className="mx-auto w-full lg:max-w-[760px]"
              style={{
                background: "rgba(8,15,30,0.72)",
                border: "1px solid rgba(250,204,21,0.16)",
                borderRadius: 14,
                padding: "11px 14px",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Desktop — centered callsign / station / frequency above both columns */}
              <div className="mb-3 hidden justify-center lg:flex">
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: "0 6px",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", flexShrink: 0 }}>
                    {missionCtx.callsign}
                  </span>
                  {missionCtx.station && (
                    <>
                      <span style={{ fontSize: 11, color: "rgba(148,163,184,0.40)", flexShrink: 0 }}>·</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#FACC15", minWidth: 0 }}>
                        {missionCtx.station}
                      </span>
                    </>
                  )}
                  {missionCtx.frequency && (
                    <>
                      <span style={{ fontSize: 11, color: "rgba(148,163,184,0.40)", flexShrink: 0 }}>·</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#FACC15", flexShrink: 0 }}>
                        {missionCtx.frequency}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                <div>
                  {/* Mobile — header stays in first column above What you know */}
                  <div
                    className="mb-2 flex flex-wrap items-baseline gap-x-1.5 lg:hidden"
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", flexShrink: 0 }}>
                      {missionCtx.callsign}
                    </span>
                    {missionCtx.station && (
                      <>
                        <span style={{ fontSize: 11, color: "rgba(148,163,184,0.40)", flexShrink: 0 }}>·</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#FACC15",
                            minWidth: 0,
                          }}
                        >
                          {missionCtx.station}
                        </span>
                      </>
                    )}
                    {missionCtx.frequency && (
                      <>
                        <span style={{ fontSize: 11, color: "rgba(148,163,184,0.40)", flexShrink: 0 }}>·</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#FACC15", flexShrink: 0 }}>
                          {missionCtx.frequency}
                        </span>
                      </>
                    )}
                  </div>

                  {displayedWhatYouKnow.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(148,163,184,0.60)", margin: "0 0 4px" }}>
                        What you know
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                        {displayedWhatYouKnow.map((item, idx) => (
                          <li key={idx} style={{ fontSize: 12, color: "rgba(203,213,225,0.85)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 5 }}>
                            <span style={{ color: "#FACC15", flexShrink: 0 }}>·</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {!!missionCtx.whatYouNeed?.length && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(148,163,184,0.60)", margin: "0 0 4px" }}>
                      Your task
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                      {missionCtx.whatYouNeed.map((item, idx) => (
                        <li key={idx} style={{ fontSize: 12, color: "rgba(203,213,225,0.65)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 5 }}>
                          <span style={{ color: "rgba(234,179,8,0.65)", flexShrink: 0 }}>·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {displayedWhatYouKnow.length === 0 && !missionCtx.whatYouNeed?.length && missionCtx.initialTask && (
                <p style={{ fontSize: 12, color: "rgba(203,213,225,0.65)", lineHeight: 1.4, margin: 0 }}>
                  {missionCtx.initialTask}
                </p>
              )}
            </div>
          )}

          {turns.map((turn, i) =>
            turn.speaker === "atc" ? (
              <AtcBubble
                key={`${i}-atc`}
                text={turn.text}
                spoken={turn.spoken ?? steps.find((s) => s.text === turn.text)?.spoken}
                onReplay={handleReplay}
              />
            ) : (
              <PilotBubble key={`${i}-pilot`} text={turn.text} />
            ),
          )}
        </div>
      </div>

      {/* ── Zone C: Response dock — transparent, mic floats over background glow ── */}
      <div
        className="relative z-10 shrink-0 flex flex-col items-center px-4"
        style={{
          paddingTop: 12,
          paddingBottom: 10,
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
      >
        {/* v3 required-item retry hint — shown after 2+ failed attempts on the same step,
            naming exactly what's still missing (Part D anti-infinite-loop mechanism). */}
        {isPilotTurn && retryHint && (
          <div
            style={{
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.28)",
              borderRadius: 10,
              padding: "7px 14px",
              marginBottom: 10,
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 12, color: "rgba(252,165,165,0.92)", lineHeight: 1.45, margin: 0 }}>{retryHint}</p>
          </div>
        )}

        {/* Step guidance hint — shown only when the active pilot step has a hint */}
        {isPilotTurn && current?.hint && (
          <div
            style={{
              background: "rgba(234,179,8,0.09)",
              border: "1px solid rgba(234,179,8,0.22)",
              borderRadius: 10,
              padding: "7px 14px",
              marginBottom: 10,
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "rgba(253,224,71,0.88)",
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {current.hint}
            </p>
          </div>
        )}

        {!atcSpeaking && isPilotTurn ? (
          <div className="flex flex-col items-center gap-2">
            <VoiceRecorder
              key={current.id}
              disabled={voiceState === "processing"}
              mode="server"
              maxDurationMs={missionMaxDurationMs(current)}
              silenceDurationMs={MISSION_SILENCE_DURATION_MS}
              onStateChange={handleVoiceStateChange}
              onResult={handleVoiceResult}
              onError={handleVoiceError}
            />
            {voiceError && (
              <p
                style={{
                  maxWidth: 280,
                  textAlign: "center",
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: "rgba(248,113,113,0.88)",
                }}
              >
                {voiceError}
              </p>
            )}
          </div>
        ) : (
          <>
            {showManualPlayAtc && (
              <p
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.4,
                  marginBottom: 6,
                  textAlign: "center",
                  maxWidth: 260,
                  color: "rgba(148,163,184,0.55)",
                }}
              >
                Radio audio didn&apos;t play automatically.
              </p>
            )}
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 12,
                letterSpacing: "0.02em",
                color: atcSpeaking ? "rgba(148,163,184,0.55)" : "rgba(226,232,240,0.55)",
                transition: "color 0.25s ease",
              }}
            >
              {continueLabel}
            </p>

            <button
              type="button"
              onClick={handleContinue}
              disabled={atcSpeaking}
              aria-label={showManualPlayAtc ? "Play ATC transmission" : "Continue"}
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: atcSpeaking ? "rgba(250,204,21,0.18)" : "rgba(250,204,21,0.32)",
                color: atcSpeaking ? "rgba(250,204,21,0.4)" : "#07111F",
                boxShadow: atcSpeaking
                  ? "none"
                  : "0 0 24px rgba(250,204,21,0.20), 0 12px 28px rgba(250,204,21,0.12)",
                cursor: atcSpeaking ? "not-allowed" : "pointer",
                transition: "background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease",
              }}
            >
              {showManualPlayAtc ? (
                <svg viewBox="0 0 24 24" style={{ width: 28, height: 28 }} fill="currentColor" stroke="none">
                  <path d="M7 5v14l12-7z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  style={{ width: 32, height: 32 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v3" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
