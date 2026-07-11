"use client";

import { useEffect, useMemo, useState } from "react";
import type { Drill, ExerciseContent } from "@/lib/aerocomms/content";
import { evaluatePhraseAnswer, evaluateSpokenAnswer } from "@/lib/aerocomms/voice/evaluation";
import { createVoiceProvider } from "@/lib/aerocomms/voice/voiceProvider";
import { getMaxDurationMsForExercise, getSttModeForExercise } from "@/lib/aerocomms/voice/sttMode";
import type { SttResult, VoiceEvaluationResult, VoiceUiState } from "@/lib/aerocomms/voice/types";
import { VoiceRecorder } from "./VoiceRecorder";

type VoiceSpeakingScreenProps = {
  title: string;
  content?: ExerciseContent;
  onComplete: (score?: number) => void;
};

const FALLBACK_DRILL: Drill = { cue: "A", prompt: "Alfa", expected: "Alfa" };

/** Fisher-Yates shuffle — returns a new array, never mutates the source. */
function shuffleAndPick<T>(arr: ReadonlyArray<T>, count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function browserMicSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export function VoiceSpeakingScreen({ title, content, onComplete }: VoiceSpeakingScreenProps) {
  const provider = useMemo(() => createVoiceProvider(), []);
  const [index, setIndex] = useState(0);
  // "idle" is browser-API-free so SSR and first client render produce identical HTML.
  // useEffect below updates to "unsupported" if the browser lacks STT support.
  const [state, setState] = useState<VoiceUiState>("idle");
  const [result, setResult] = useState<VoiceEvaluationResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState(0);
  // mounted=false on server and first client render → stable pre-mount placeholder.
  // Both capability flags start true (same on server and client) and are updated after mount.
  const [mounted, setMounted] = useState(false);
  const [browserSttOk, setBrowserSttOk] = useState(true);
  const [serverSttOk, setServerSttOk] = useState(true);
  // Drills start as [FALLBACK_DRILL] on server and first client render (no Math.random during SSR).
  // Randomized on the client inside useEffect so server and client initial HTML match exactly.
  const [drills, setDrills] = useState<Drill[]>([FALLBACK_DRILL]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMounted(true);
      const micOk = browserMicSupported();
      const browserOk = micOk && provider.stt.isSupported();
      const serverOk = micOk && typeof MediaRecorder !== "undefined";
      setBrowserSttOk(browserOk);
      setServerSttOk(serverOk);
      if (!micOk) setState("unsupported");
      // Shuffle and pick 10 drills client-side only — Math.random() never runs during SSR,
      // so server and client produce identical first-render HTML (no hydration mismatch).
      // content is captured at mount time from the closure; it is stable for the session.
      const source = content?.drills?.length ? content.drills : [FALLBACK_DRILL];
      setDrills(shuffleAndPick(source, 10));
    });
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); // provider is the stable mount trigger; content captured via closure

  const drill = drills[index] ?? FALLBACK_DRILL;
  const expected = drill.expected ?? drill.prompt ?? "";
  // drill.atc is the ATC instruction for Readback-type drills routed here via voice whitelist.
  const cue = drill.cue ?? drill.display ?? drill.atc ?? drill.prompt ?? "";
  // Phrase evaluator: multi-word expected, OR single non-ICAO word (>8 letters, e.g. "Correction.").
  // Letter evaluator: reserved for single-word ICAO alphabet practice (e.g. "Alfa", "Bravo").
  const isPhraseExercise =
    expected.trim().split(/\s+/).length > 1 ||
    expected.replace(/[^a-zA-Z]/g, "").length > 8;
  // drill.atc marks ATC-readback style drills (repeat back a transmission) routed here via the voice whitelist.
  const sttMode = getSttModeForExercise({ expected, isReadback: !!drill.atc });
  const maxDurationMs = getMaxDurationMsForExercise({ expected, isReadback: !!drill.atc });
  // VoiceRecorder itself falls back from server to browser STT when server mode is unavailable
  // or not configured, so this screen only needs to hide the mic entirely when neither works.
  const canUseVoice = serverSttOk || browserSttOk;

  const handleResult = (stt: SttResult) => {
    const evalInput = {
      transcript: stt.transcript,
      expected,
      confidence: stt.confidence,
      acceptedVariants: drill.acceptedVariants,
      drillFeedback: drill.feedback,
    };
    const evaluation = isPhraseExercise
      ? evaluatePhraseAnswer(evalInput)
      : evaluateSpokenAnswer(evalInput);
    setTranscript(stt.transcript);
    setResult(evaluation);
    setBestScore((current) => Math.max(current, evaluation.score));
    setState("result");
  };

  const handleTryAgain = () => {
    provider.stt.cancel();
    setResult(null);
    setTranscript("");
    setError(null);
    setState(canUseVoice ? "idle" : "unsupported");
  };

  const handleNext = () => {
    const nextScores = result ? [...scores, Math.max(bestScore, result.score)] : scores;
    if (index + 1 >= drills.length) {
      if (nextScores.length === 0) {
        onComplete(undefined);
        return;
      }
      const score = Math.round(nextScores.reduce((sum, value) => sum + value, 0) / nextScores.length);
      onComplete(score);
      return;
    }

    setScores(nextScores);
    setIndex((current) => current + 1);
    setResult(null);
    setTranscript("");
    setError(null);
    setBestScore(0);
    setState(canUseVoice ? "idle" : "unsupported");
  };

  const handleUnsupportedNext = () => {
    if (index + 1 >= drills.length) {
      onComplete(undefined);
      return;
    }
    setIndex((current) => current + 1);
  };

  const stateLabel =
    state === "requesting_permission"
      ? "Requesting microphone..."
      : state === "recording"
        ? "Listening..."
        : state === "processing"
          ? "Processing..."
          : state === "unsupported"
            ? "Voice unavailable"
            : state === "error"
              ? "Try again"
              : "Hold to speak";

  return (
    <div className="flex flex-1 flex-col min-h-0">

      {/* ── Fixed header: label, title, prompt, cue letter ── */}
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Speaking</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">{title}</h1>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
            {index + 1} / {drills.length}
          </span>
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">
          {content?.instruction ?? "Say the ICAO word for this letter"}
        </p>
        <p className={`mt-2 text-center font-bold tracking-tight text-white ${
          cue.length <= 4  ? "text-7xl" :
          cue.length <= 9  ? "text-5xl" :
          cue.length <= 18 ? "text-3xl" :
          "text-xl leading-snug"
        }`}>{cue}</p>
      </div>

      {/* ── Fixed mic area ── */}
      <div className="mt-7 shrink-0 flex flex-col items-center gap-4">
        {!mounted ? (
          // Pre-mount neutral placeholder — identical on server and first client render.
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              disabled
              className="grid h-24 w-24 place-items-center rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-600 opacity-60 transition-transform"
              aria-label="Loading..."
            >
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
                <path d="M19 11a7 7 0 0 1-14 0" />
                <path d="M12 18v3" />
                <path d="M8 21h8" />
              </svg>
            </button>
            <p className="text-sm font-medium text-slate-500">Hold to speak</p>
          </div>
        ) : canUseVoice ? (
          <VoiceRecorder
            disabled={state === "processing"}
            mode={sttMode}
            maxDurationMs={maxDurationMs}
            onStateChange={setState}
            onResult={handleResult}
            onError={(message) => {
              setError(message);
              setState("error");
            }}
          />
        ) : (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-4 text-center">
            <p className="text-sm font-semibold text-amber-300">Voice recognition is not supported in this browser yet.</p>
            <p className="mt-2 text-sm text-slate-300">Expected word: <span className="font-bold text-[#FACC15]">{expected}</span></p>
          </div>
        )}
        {mounted && canUseVoice && <p className="text-sm text-slate-400">{stateLabel}</p>}
      </div>

      {/* ── Scrollable result area — flex-1 + overflow-y-auto so the result card
           never pushes the bottom buttons out of view on any iPhone size ── */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Result</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${result.correct ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                {result.correct ? "Correct" : "Try again"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detected</p>
                <p className="mt-1 text-base font-bold text-white">{transcript || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expected</p>
                <p className="mt-1 text-base font-bold text-[#FACC15]">{result.expectedToken}</p>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between rounded-xl bg-white/[0.04] px-4 py-3">
              <span className="text-sm font-semibold text-slate-300">Score</span>
              <span className="text-2xl font-black text-white">{result.score}%</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.feedback}</p>
            {result.lowConfidenceWarning && (
              <p className="mt-2 text-xs font-medium text-amber-300">Low recognition confidence. This warning does not reduce your score.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom buttons — shrink-0 keeps them always visible on any screen size ── */}
      <div className="shrink-0 flex gap-2.5 pt-4">
        {!mounted ? (
          // Pre-mount: single disabled placeholder button — stable on server and client.
          <button
            type="button"
            disabled
            className="w-full rounded-2xl bg-[#FACC15]/40 px-4 py-3 text-sm font-black text-[#07111F] opacity-50"
          >
            Next
          </button>
        ) : canUseVoice ? (
          <>
            <button
              type="button"
              onClick={handleTryAgain}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-200"
            >
              Try again
            </button>
            <button
              type="button"
              disabled={!result}
              onClick={handleNext}
              className="flex-1 rounded-2xl bg-[#FACC15] px-4 py-3 text-sm font-black text-[#07111F] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {index + 1 >= drills.length ? "Done" : "Next"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleUnsupportedNext}
            className="w-full rounded-2xl bg-[#FACC15] px-4 py-3 text-sm font-black text-[#07111F]"
          >
            {index + 1 >= drills.length ? "Complete without score" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
