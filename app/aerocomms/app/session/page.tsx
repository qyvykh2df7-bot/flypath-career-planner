"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/aerocomms/appState";
import { VoiceSpeakingScreen } from "@/components/aerocomms/app/voice/VoiceSpeakingScreen";
import { VoiceRecorder } from "@/components/aerocomms/app/voice/VoiceRecorder";
import { evaluatePhraseAnswer, evaluateSpokenAnswer } from "@/lib/aerocomms/voice/evaluation";
import type { SttResult, VoiceEvaluationResult, VoiceUiState } from "@/lib/aerocomms/voice/types";
import { isVoiceAlphaExercise } from "@/lib/aerocomms/voice/voiceConfig";
import { getMaxDurationMsForExercise, getSttModeForExercise } from "@/lib/aerocomms/voice/sttMode";
import { speak as speakServerFirst, stopSpeaking } from "@/lib/aerocomms/voice/voiceProvider";
import { cadetLevelProfileIdFromExerciseId } from "@/lib/aerocomms/voice/ttsProfiles";
import {
  ExerciseType,
  findExercise,
  isExerciseAccessible,
  screenType,
  type ChallengeStep,
  type ChallengeStepKind,
  type Drill,
  type Exercise,
  type ExerciseContent,
  type ScreenType,
  type Transmission,
} from "@/lib/aerocomms/content";
import { AeroCommsProGate } from "@/components/aerocomms/app/AeroCommsProGate";
import { SpSessionScreen } from "@/components/aerocomms/app/student-pilot/SpSessionScreen";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Desktop-only content width per screen type — keeps exercise panels from
// stretching edge-to-edge on wide viewports. Mobile is unaffected since these
// are all `lg:` classes layered onto an otherwise full-width flex column.
function desktopMaxWidthClass(screen: ScreenType): string {
  switch (screen) {
    case "lesson":
      return "lg:max-w-[960px]";
    case "listening":
      return "lg:max-w-[780px]";
    case "speaking":
    case "readback":
      return "lg:max-w-[720px]";
    case "phraseology":
      return "lg:max-w-[880px]";
    case "scenario":
      return "lg:max-w-[840px]";
    case "mission":
      return "lg:max-w-[900px]";
    default:
      return "lg:max-w-[860px]";
  }
}

// Tracks the exerciseId of whichever Cadet screen is currently mounted, so the
// shared speak() helper below can resolve the right TTS profile without every
// one of its ~25 call sites needing to be individually threaded with context.
// Set once per render in SessionInner (the only place exerciseId is known) —
// safe because only one exercise screen is ever visible/interactive at a time.
let activeCadetExerciseId: string | undefined;

/**
 * Shared Train (Cadet) TTS entry point. Prefers backend server TTS (OpenAI) via
 * voiceProvider, with automatic fallback to browser speechSynthesis if the
 * backend is unavailable or fails. Resolves a Cadet TTS profile from the active
 * exercise ID: cadet-level-N for Core Practice drills 1-6, cadet-clear for
 * general lessons/explanations/scenarios. Always stops any previous playback
 * (server or browser) before starting new speech — see voiceProvider.speak().
 */
function speak(text: string) {
  const profileId = cadetLevelProfileIdFromExerciseId(activeCadetExerciseId) ?? "cadet-clear";
  void speakServerFirst(text, { profileId });
}

/** Per-skill tallies for a single session — only skills actually evaluated. */
type SkillTally = { correct: number; total: number };

/** Structured result of a graded session, computed from real step results. */
interface SessionSummary {
  score: number;
  correctSteps: number;
  totalEvaluated: number;
  skillScores: Record<string, SkillTally>;
  weakArea: string | null;
}

/**
 * Maps ChallengeStep kinds to skill labels used for the blended Challenge score.
 * Speaking steps use real mic/STT/evaluation (feedback shown per turn) but are
 * intentionally excluded here: standalone Speaking exercises already feed the
 * dedicated Speaking skill axis, so Challenge speaking turns are practice-only
 * and do not double-count into Listening/Readbacks/Phraseology.
 */
const KIND_TO_SKILL: Partial<Record<string, string>> = {
  listening: "Listening",
  readback: "Readbacks",
  phraseology: "Phraseology",
};

/**
 * Builds a real SessionSummary from per-step correctness results.
 * Only skills present in evaluated steps appear in skillScores.
 */
function buildSessionSummary(steps: ChallengeStep[], results: boolean[]): SessionSummary {
  const skillScores: Record<string, SkillTally> = {};
  let totalEvaluated = 0;
  let correctSteps = 0;

  results.forEach((correct, i) => {
    const step = steps[i];
    if (!step) return;
    const skill = KIND_TO_SKILL[step.kind];
    if (!skill) return; // speaking: real STT/evaluation, but not part of this blended score
    totalEvaluated++;
    if (correct) correctSteps++;
    if (!skillScores[skill]) skillScores[skill] = { correct: 0, total: 0 };
    skillScores[skill].total++;
    if (correct) skillScores[skill].correct++;
  });

  // All-speaking session (no graded steps): treat as fully complete.
  if (totalEvaluated === 0) {
    totalEvaluated = Math.max(1, steps.length);
    correctSteps = totalEvaluated;
  }

  const score = Math.round((correctSteps / totalEvaluated) * 100);

  // Weak area: skill with the most errors (only set when errors exist).
  let weakArea: string | null = null;
  if (correctSteps < totalEvaluated) {
    let lowestPct = Infinity;
    for (const [skill, sr] of Object.entries(skillScores)) {
      if (sr.total === 0) continue;
      const pct = sr.correct / sr.total;
      if (pct < lowestPct) {
        lowestPct = pct;
        weakArea = skill;
      }
    }
  }

  return { score, correctSteps, totalEvaluated, skillScores, weakArea };
}

function normalize(t: string) {
  return t.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
}

/** Wrap matching aviation terms in green emphasis (longest match first). */
function highlightTerms(text: string, terms: string[]) {
  if (terms.length === 0) return text;
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  return parts.map((part, i) => {
    const match = sorted.some((t) => t.toLowerCase() === part.toLowerCase());
    return match ? (
      <span key={i} className="font-semibold text-[#FACC15]">
        {part}
      </span>
    ) : (
      part
    );
  });
}

const READABILITY_SCALE: { n: number; label: string; emphasis?: boolean }[] = [
  { n: 1, label: "unreadable" },
  { n: 2, label: "readable now and then" },
  { n: 3, label: "readable with difficulty" },
  { n: 4, label: "readable" },
  { n: 5, label: "loud and clear", emphasis: true },
];

function ReadabilityScaleList() {
  return (
    <div className="mt-2.5 space-y-1">
      {READABILITY_SCALE.map(({ n, label, emphasis }) => (
        <div
          key={n}
          className={`flex items-baseline gap-2 text-[15px] leading-snug ${emphasis ? "rounded-lg border border-[#FACC15]/25 bg-[#FACC15]/[0.08] px-2.5 py-1.5" : ""}`}
        >
          <span className="w-4 shrink-0 font-bold tabular-nums text-[#FACC15]">{n}</span>
          <span className={emphasis ? "font-semibold text-slate-100" : "text-slate-300"}>— {label}</span>
        </div>
      ))}
    </div>
  );
}

function HighlightedLessonExampleLine({ line, terms }: { line: string; terms: string[] }) {
  return (
    <p className="text-base font-medium leading-relaxed text-slate-200">{highlightTerms(line, terms)}</p>
  );
}

function AtisQnhLessonExampleFlow() {
  const terms = ["Information Bravo", "information Bravo", "QNH 1016"];
  const rows: { label: string; text: string }[] = [
    { label: "ATIS", text: "Information Bravo" },
    { label: "QNH", text: "1016" },
    { label: "Pilot", text: "Madrid Ground, Iberia 325, information Bravo, request startup." },
    { label: "ATC", text: "Iberia 325, QNH 1016." },
  ];
  return (
    <div className="mt-2 space-y-2">
      {rows.map(({ label, text }) => (
        <div key={`${label}-${text}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-0.5 text-base font-medium leading-snug text-slate-200">{highlightTerms(text, terms)}</p>
        </div>
      ))}
    </div>
  );
}

/* Deterministic, SSR-safe seeded shuffle for multiple-choice options.
 * Same seed -> same order on server and client, so no hydration mismatch and no Math.random in render. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns exactly 4 unique options (correct guaranteed present) in a deterministic, seed-based order. */
function shuffledOptions(rawOptions: string[] | undefined, correct: string | undefined, seed: string): string[] {
  const source = rawOptions ?? ["A", "B", "C", "D"];
  const unique: string[] = [];
  for (const opt of source) {
    if (opt != null && !unique.includes(opt)) unique.push(opt);
  }
  if (correct && !unique.includes(correct)) unique.unshift(correct);
  const four = unique.slice(0, 4);
  // Guarantee the correct answer survives the cap.
  if (correct && !four.includes(correct)) four[four.length - 1] = correct;
  const rng = mulberry32(hashSeed(seed));
  for (let i = four.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [four[i], four[j]] = [four[j], four[i]];
  }
  return four;
}

/**
 * Returns the working set of drills for a session. First paint uses a deterministic
 * capped slice so the round count (e.g. "Round 1 / 10") is identical on server and
 * client - avoiding both a hydration mismatch and a flash of the uncapped count.
 * After mount, the client reshuffles a slice of the SAME length so the count is stable
 * while the questions stay varied between attempts.
 */
function useDrillSet(drills: Drill[], cap = 10): Drill[] {
  const capped = drills.length > cap ? drills.slice(0, cap) : drills;
  const [order, setOrder] = useState<Drill[]>(capped);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (drills.length <= cap) {
        setOrder([...drills].sort(() => Math.random() - 0.5));
        return;
      }
      setOrder([...drills].sort(() => Math.random() - 0.5).slice(0, cap));
    });
    return () => {
      active = false;
    };
  }, [drills, cap]);
  return order;
}

// Full ICAO spelling alphabet with radio pronunciations (reference data, not graded content).
const ICAO_ALPHABET: ReadonlyArray<{ letter: string; word: string; say: string }> = [
  { letter: "A", word: "Alfa", say: "AL-fah" },
  { letter: "B", word: "Bravo", say: "BRAH-voh" },
  { letter: "C", word: "Charlie", say: "CHAR-lee" },
  { letter: "D", word: "Delta", say: "DELL-tah" },
  { letter: "E", word: "Echo", say: "ECK-oh" },
  { letter: "F", word: "Foxtrot", say: "FOKS-trot" },
  { letter: "G", word: "Golf", say: "GOLF" },
  { letter: "H", word: "Hotel", say: "hoh-TELL" },
  { letter: "I", word: "India", say: "IN-dee-ah" },
  { letter: "J", word: "Juliett", say: "JEW-lee-ETT" },
  { letter: "K", word: "Kilo", say: "KEY-loh" },
  { letter: "L", word: "Lima", say: "LEE-mah" },
  { letter: "M", word: "Mike", say: "MIKE" },
  { letter: "N", word: "November", say: "no-VEM-ber" },
  { letter: "O", word: "Oscar", say: "OSS-cah" },
  { letter: "P", word: "Papa", say: "pah-PAH" },
  { letter: "Q", word: "Quebec", say: "keh-BECK" },
  { letter: "R", word: "Romeo", say: "ROW-me-oh" },
  { letter: "S", word: "Sierra", say: "see-AIR-rah" },
  { letter: "T", word: "Tango", say: "TANG-go" },
  { letter: "U", word: "Uniform", say: "YOU-nee-form" },
  { letter: "V", word: "Victor", say: "VIK-tah" },
  { letter: "W", word: "Whiskey", say: "WISS-key" },
  { letter: "X", word: "X-ray", say: "ECKS-ray" },
  { letter: "Y", word: "Yankee", say: "YANG-key" },
  { letter: "Z", word: "Zulu", say: "ZOO-loo" },
];

// Aviation number pronunciation (digit, written word, spoken radio form, pronunciation guide).
const AVIATION_NUMBERS: ReadonlyArray<{ digit: string; word: string; radio: string; say: string }> = [
  { digit: "0", word: "Zero", radio: "zero", say: "ZE-ro" },
  { digit: "1", word: "One", radio: "one", say: "WUN" },
  { digit: "2", word: "Two", radio: "two", say: "TOO" },
  { digit: "3", word: "Three", radio: "tree", say: "TREE" },
  { digit: "4", word: "Four", radio: "four", say: "FOW-er" },
  { digit: "5", word: "Five", radio: "fife", say: "FIFE" },
  { digit: "6", word: "Six", radio: "six", say: "SIX" },
  { digit: "7", word: "Seven", radio: "seven", say: "SEV-en" },
  { digit: "8", word: "Eight", radio: "eight", say: "AIT" },
  { digit: "9", word: "Niner", radio: "niner", say: "NIN-er" },
];

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

function TopBar({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onClose}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <span className="h-9 w-9" />
    </div>
  );
}

function MicButton({ recording, done, disabled, onClick, size = "md" }: { recording: boolean; done: boolean; disabled?: boolean; onClick: () => void; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-28 w-28" : "h-20 w-20";
  const icon = size === "lg" ? "h-11 w-11" : "h-8 w-8";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mic-btn flex ${box} items-center justify-center rounded-full transition-all ${
        recording
          ? "scale-110 bg-[#FACC15] text-[#07111F]"
          : done
            ? "bg-[#FACC15]/20 text-[#FACC15] ring-1 ring-[#FACC15]/40"
            : "bg-[#FACC15] text-[#07111F] shadow-[0_16px_36px_-10px_rgba(250,204,21,0.75)] disabled:opacity-40"
      }`}
    >
      {done ? (
        <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5 9.5-11" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      )}
    </button>
  );
}

/** Large central round play button used by polished listening screens. */
function BigPlayButton({ onClick, label = "Play", size = "md" }: { onClick: () => void; label?: string; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-32 w-32" : "h-24 w-24";
  const icon = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`big-play-btn flex ${box} items-center justify-center rounded-full bg-[#FACC15] text-[#07111F] shadow-[0_16px_36px_-10px_rgba(250,204,21,0.75)] transition-transform active:scale-95`}
    >
      <svg viewBox="0 0 24 24" className={icon} fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}

// word -> radiotelephony pronunciation, derived from the ICAO alphabet reference table.
const ICAO_SAY: Record<string, string> = Object.fromEntries(ICAO_ALPHABET.map((l) => [l.word.toLowerCase(), l.say]));

function ReplayButton({ onClick, label = "Replay" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      </svg>
      {label}
    </button>
  );
}

function AtcPanel({ text, spoken, station = "ATC" }: { text: string; spoken?: string; station?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FACC15]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FACC15]" />
          {station}
        </span>
        <ReplayButton onClick={() => speak(spoken ?? text)} />
      </div>
      <p className="mt-3 text-lg font-semibold leading-snug">&ldquo;{text}&rdquo;</p>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className="primary-btn disabled:opacity-40">
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200"
    >
      {children}
    </button>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-slate-200">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-[#FACC15]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StepHeader({ title, sub, label }: { title: string; sub?: string; label: string }) {
  return (
    <div className="step-header mt-6">
      {sub && <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{sub}</p>}
      <h1 className="mt-1 text-2xl font-bold leading-tight">{title}</h1>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#FACC15]">{label}</p>
    </div>
  );
}

type IntroCard = { value: string; spoken: string; pronunciation: string; meaning?: string };
type IntroData = { text: string; rule?: string; cards?: IntroCard[]; note?: string; examples?: string[] };

/** Standard tappable lesson example card for Radio Fundamentals intro/lesson screens.
 *  stretch=true (default): card takes equal share of remaining height (good for 3 cards).
 *  stretch=false: card hugs its content (good for 2 cards to avoid huge empty space). */
function LessonExampleCard({
  value,
  spoken,
  pronunciation,
  category,
  note,
  stretch = true,
}: {
  value: string;
  spoken: string;
  pronunciation?: string;
  category?: string;
  note?: string;
  stretch?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => speak(spoken)}
      aria-label={`Replay ${spoken}`}
      className={`flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1322] to-[#0E1726] px-5 py-4 text-left transition-transform active:scale-[0.99] ${stretch ? "min-h-0 flex-1" : "shrink-0"}`}
    >
      {/* Top row: main value + Tap to replay */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {category && (
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{category}</p>
          )}
          <p className="text-[26px] font-bold leading-tight tracking-tight text-white tabular-nums">{value}</p>
        </div>
        <p className="shrink-0 pt-0.5 text-[11px] font-semibold text-[#FACC15]">Tap to replay</p>
      </div>
      {/* Spoken phrase */}
      <p className="mt-2 text-[17px] font-semibold leading-snug text-[#FACC15]">{spoken}</p>
      {/* Pronunciation / support */}
      {pronunciation && (
        <p className="mt-1 text-[13px] font-medium leading-snug text-slate-400">{pronunciation}</p>
      )}
      {note && <p className="mt-1 text-[12px] leading-snug text-slate-500">{note}</p>}
    </button>
  );
}

/** Full-screen mini-lesson shown before a drill session. Renders the drill (children) once started.
 *  Layout is intentionally compact so the whole lesson + Start button fit without scrolling. */
function IntroGate({ intro, title, children }: { intro: IntroData; title: string; children: React.ReactNode }) {
  const [started, setStarted] = useState(false);
  if (started) return <>{children}</>;
  const cards = intro.cards ?? [];
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StepHeader title={title} label="Quick lesson" />
      <p className="mt-2 text-sm leading-snug text-slate-300">{intro.text}</p>

      {intro.rule && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-3.5 py-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2zm-3 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9v1z" /></svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Rule</p>
            <p className="mt-0.5 text-[13px] leading-snug text-slate-200">{intro.rule}</p>
          </div>
        </div>
      )}

      {cards.length > 0 ? (
        <div className={`mt-3 flex flex-col gap-2 ${cards.length > 2 ? "min-h-0 flex-1" : "flex-1 justify-center"}`}>
          {cards.map((c) => (
            <LessonExampleCard
              key={c.value}
              value={c.value}
              spoken={c.spoken}
              pronunciation={c.pronunciation}
              category={c.meaning}
              stretch={cards.length > 2}
            />
          ))}
        </div>
      ) : (
        intro.examples && intro.examples.length > 0 && (
          <div className="mt-3 space-y-2">
            {intro.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => speak(ex.replace(/^.*=\s*/, ""))}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1322] px-4 py-3 text-left"
              >
                <span className="truncate text-[15px] font-semibold text-slate-200">{ex}</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#FACC15]" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </button>
            ))}
          </div>
        )
      )}

      {intro.note && <p className="mt-2 shrink-0 text-[11px] leading-snug text-slate-500">{intro.note}</p>}

      <div className="mt-3 shrink-0">
        <PrimaryButton onClick={() => setStarted(true)}>Start practice</PrimaryButton>
      </div>
    </div>
  );
}

function FeedbackBox({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "good" }) {
  return (
    <div className="result-feedback rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">Feedback</p>
      <p className={`mt-1 text-sm font-medium ${tone === "good" ? "text-[#FACC15]" : "text-slate-300"}`}>{text}</p>
    </div>
  );
}

/** Richer post-check feedback: verdict, the expected answer and a short explanation. */
function ResultFeedback({ correct, expected, explanation }: { correct: boolean; expected?: string; explanation?: string }) {
  return (
    <div className={`result-feedback rounded-2xl border p-4 ${correct ? "border-[#FACC15]/30 bg-[#FACC15]/10" : "border-red-500/30 bg-red-500/10"}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${correct ? "bg-[#FACC15] text-[#07111F]" : "bg-red-500 text-white"}`}>
          {correct ? "\u2713" : "\u2715"}
        </span>
        <p className={`text-sm font-bold ${correct ? "text-[#FACC15]" : "text-red-300"}`}>{correct ? "Correct" : "Incorrect"}</p>
      </div>
      {expected && (
        <p className="mt-2 text-xs text-slate-400">
          Expected answer: <span className="font-semibold text-white">{expected}</span>
        </p>
      )}
      {explanation && <p className="mt-1 text-xs leading-relaxed text-slate-400">{explanation}</p>}
    </div>
  );
}

function DebriefView({ title, summary, recommended, isMission, onDone, onRetry }: { title: string; summary: SessionSummary; recommended: string; isMission?: boolean; onDone: () => void; onRetry: () => void }) {
  const { score, correctSteps, totalEvaluated, skillScores, weakArea } = summary;
  const skillEntries = Object.entries(skillScores);
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-7 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FACC15]">{isMission ? "Mission Complete" : "Debrief"}</p>
        <p className="mt-4 text-6xl font-bold">{score}%</p>
        <p className="mt-1 text-sm text-slate-400">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{correctSteps}/{totalEvaluated} correct</p>
      </div>
      {skillEntries.length > 0 && (
        <div className="mt-7 space-y-3">
          {skillEntries.map(([skill, sr]) => (
            <ScoreBar key={skill} label={skill} value={Math.round((sr.correct / sr.total) * 100)} />
          ))}
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Weak area</p>
          {weakArea ? (
            <p className="mt-1 text-sm font-semibold">{weakArea}</p>
          ) : (
            <>
              <p className="mt-1 text-sm font-semibold text-[#FACC15]">None</p>
              <p className="mt-0.5 text-xs text-slate-500">All answers correct</p>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Recommended next</p>
          <p className="mt-1 text-sm font-semibold">{recommended}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2.5 pt-6">
        <PrimaryButton onClick={onDone}>Continue</PrimaryButton>
        <GhostButton onClick={onRetry}>Retry</GhostButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen templates                                                    */
/* ------------------------------------------------------------------ */

function AlphabetTrainer({ title, content, onComplete }: { title: string; content?: ExerciseContent; onComplete: () => void }) {
  const [sel, setSel] = useState(0);
  const item = ICAO_ALPHABET[sel];

  // Intentionally left on browser speechSynthesis: this queues 26 short utterances
  // back-to-back. Migrating it would mean either 26 sequential backend requests
  // (slow, chatty) or synthesizing one long joined clip (new cache/route shape).
  // Neither is a safe minimal change here — every other alphabet play/replay
  // above already uses backend TTS via speak().
  const playFull = () => {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      ICAO_ALPHABET.forEach(({ word }) => {
        const utt = new SpeechSynthesisUtterance(word);
        utt.rate = 0.95;
        utt.lang = "en-GB";
        window.speechSynthesis.speak(utt);
      });
    } catch {
      // unavailable
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StepHeader title={title} label="Lesson" />
      <p className="mt-3 [@media(max-height:760px)]:mt-1 text-sm leading-relaxed text-slate-400">
        {content?.lessonBody ?? "Pilots spell with standard words to avoid confusion. Tap a letter to hear it."}
      </p>

      {/* Letter grid */}
      <div className="mt-4 [@media(max-height:760px)]:mt-2 grid grid-cols-6 gap-1.5 [@media(max-height:760px)]:gap-1">
        {ICAO_ALPHABET.map((l, i) => (
          <button
            key={l.letter}
            type="button"
            onClick={() => {
              setSel(i);
              speak(l.word);
            }}
            className={`flex h-10 [@media(max-height:760px)]:h-8 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
              i === sel
                ? "border-[#FACC15]/60 bg-[#FACC15]/20 text-[#FACC15]"
                : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
            }`}
          >
            {l.letter}
          </button>
        ))}
      </div>

      {/* Large pronunciation trainer display - tap to replay the voice */}
      <button
        type="button"
        onClick={() => speak(item.word)}
        aria-label={`Replay ${item.word}`}
        className="mt-4 [@media(max-height:760px)]:mt-2 flex flex-col items-center justify-center rounded-3xl border border-[#FACC15]/20 bg-gradient-to-br from-[#0B1220] to-[#0F172A] px-4 py-6 [@media(max-height:760px)]:py-3 text-center transition-transform active:scale-[0.98]"
      >
        <span className="text-5xl font-bold leading-none text-[#FACC15]">{item.letter}</span>
        <span className="mt-3 [@media(max-height:760px)]:mt-1 text-4xl font-bold leading-none tracking-tight text-white">{item.word}</span>
        <span className="mt-3 [@media(max-height:760px)]:mt-1 text-xl font-semibold tracking-wide text-slate-300">{item.say}</span>
        <span className="mt-3 [@media(max-height:760px)]:mt-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#FACC15]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          Tap to replay
        </span>
      </button>

      <div className="mt-3 [@media(max-height:760px)]:mt-2">
        <GhostButton onClick={playFull}>Play full alphabet</GhostButton>
      </div>

      <div className="mt-auto [@media(max-height:760px)]:mt-3 pt-5 [@media(max-height:760px)]:pt-2">
        <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
      </div>
    </div>
  );
}

function NumbersTrainer({ title, content, onComplete }: { title: string; content?: ExerciseContent; onComplete: () => void }) {
  const [sel, setSel] = useState(0);
  const item = AVIATION_NUMBERS[sel];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StepHeader title={title} label="Lesson" />
      <p className="mt-2 text-sm leading-snug text-slate-400">
        {content?.lessonBody ?? "On the radio, numbers are spoken digit by digit. Tap a number to hear it."}
      </p>

      {/* Digit grid - 3 columns, large touch targets */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {AVIATION_NUMBERS.map((n, i) => (
          <button
            key={n.digit}
            type="button"
            onClick={() => {
              setSel(i);
              speak(n.radio);
            }}
            className={`flex h-12 items-center justify-center rounded-2xl border text-2xl font-bold transition-colors ${
              i === sel
                ? "border-[#FACC15]/60 bg-[#FACC15]/20 text-[#FACC15]"
                : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
            }`}
          >
            {n.digit}
          </button>
        ))}
      </div>

      {/* Large trainer display - number + spoken word + pronunciation, tap anywhere to replay */}
      <button
        type="button"
        onClick={() => speak(item.radio)}
        aria-label={`Replay ${item.radio}`}
        className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl border border-[#FACC15]/20 bg-gradient-to-br from-[#0B1220] to-[#0F172A] px-4 py-4 text-center transition-transform active:scale-[0.98]"
      >
        <span className="text-5xl font-bold leading-none text-[#FACC15]">{item.digit}</span>
        <span className="mt-3 text-3xl font-bold uppercase leading-none tracking-tight text-white">{item.radio}</span>
        <span className="mt-2 text-base font-medium leading-none text-slate-400">{item.say}</span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#FACC15]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          Tap to replay
        </span>
      </button>

      <div className="mt-3 shrink-0">
        <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
      </div>
    </div>
  );
}

/** Renders a station lesson example line: green station name, white description (Who am I calling? lesson only). */
function StationExampleLine({ line }: { line: string }) {
  const colonIdx = line.indexOf(":");
  if (colonIdx < 0) {
    return <p className="text-lg font-semibold leading-snug text-white">{line}</p>;
  }
  const station = line.slice(0, colonIdx);
  const rest = line.slice(colonIdx);
  return (
    <p className="text-lg font-semibold leading-snug">
      <span className="text-[#FACC15]">{station}</span>
      <span className="text-white">{rest}</span>
    </p>
  );
}

function ContactMonitorExample({ verb, rest, meaning }: { verb: "Contact" | "Monitor"; rest: string; meaning: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1322] px-4 py-3">
      <p className="text-base font-semibold leading-relaxed text-white">
        <span className="text-[#FACC15]">{verb}</span> {rest}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{meaning}</p>
    </div>
  );
}

function LessonScreen({ title, content, description, callsigns, frequencies, acknowledgements, clarificationCorrection, stationSelection, the4Ws, contactVsMonitor, radioCheckLesson, atisQnhLesson, onComplete }: { title: string; content?: ExerciseContent; description?: string; callsigns?: boolean; frequencies?: boolean; acknowledgements?: boolean; clarificationCorrection?: boolean; stationSelection?: boolean; the4Ws?: boolean; contactVsMonitor?: boolean; radioCheckLesson?: boolean; atisQnhLesson?: boolean; onComplete: () => void }) {
  const body = content?.lessonBody ?? description ?? "Standard radio procedures keep communication clear and avoid confusion.";
  const examples = content?.examples ?? [];

  // Polished Callsigns lesson: Why card + 2 example callsign type cards.
  if (callsigns) {
    const callsignCards = [
      {
        type: "Airline callsign",
        value: "Iberia 325",
        spoken: "Iberia tree two fife",
        note: "Used by airline and commercial traffic.",
      },
      {
        type: "Registration callsign",
        value: "EC-ABC",
        spoken: "Echo Charlie Alfa Bravo Charlie",
        note: "Used by general aviation or aircraft registration callsigns.",
      },
    ];
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        {/* Why this matters */}
        <div className="mt-3 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
          <p className="mt-1 text-sm leading-snug text-slate-200">{body}</p>
        </div>
        {/* Two callsign type example cards */}
        <div className="mt-3 flex flex-1 flex-col justify-center gap-2">
          {callsignCards.map((c) => (
            <LessonExampleCard
              key={c.value}
              category={c.type}
              value={c.value}
              spoken={c.spoken}
              note={c.note}
              stretch={false}
            />
          ))}
        </div>
        <div className="mt-3 shrink-0">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Polished Frequencies lesson: Why + Rule + three tappable example cards (no visible Play controls).
  if (frequencies) {
    const freqCards = [
      {
        value: "118.100",
        spoken: "one one eight decimal one",
        pronunciation: "WUN WUN AIT DAY-see-mal WUN",
      },
      {
        value: "121.750",
        spoken: "one two one decimal seven fife zero",
        pronunciation: "WUN TOO WUN DAY-see-mal SEV-en FIFE ZE-ro",
      },
      {
        value: "122.985",
        spoken: "one two two decimal niner eight fife",
        pronunciation: "WUN TOO TOO DAY-see-mal NIN-er AIT FIFE",
      },
    ];
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        {/* Why this matters */}
        <div className="mt-2 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-3.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-200">
            Frequencies move you from one controller to another. You must hear them and read them back accurately.
          </p>
        </div>
        {/* Rule */}
        <div className="mt-1.5 flex items-start gap-2 rounded-2xl border border-white/10 bg-[#0B1322] px-3.5 py-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2zm-3 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9v1z" /></svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Rule</p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-200">
              Use &ldquo;decimal&rdquo;, never &ldquo;point&rdquo;. Omit unnecessary trailing zeros after the decimal.
            </p>
          </div>
        </div>
        {/* Three large tappable example cards */}
        <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
          {freqCards.map((c) => (
            <LessonExampleCard
              key={c.value}
              value={c.value}
              spoken={c.spoken}
              pronunciation={c.pronunciation}
            />
          ))}
        </div>
        <div className="mt-2 shrink-0">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Basic Acknowledgements lesson: compact definition cards on one page.
  if (acknowledgements) {
    const ackItems = [
      { term: "Roger",    meaning: "Message received.",              note: "Not yes. Not I will comply." },
      { term: "Wilco",    meaning: "I understand and will comply.",  note: "Already includes Roger. Never say \"Roger Wilco\"." },
      { term: "Affirm",   meaning: "Yes.",                          note: null },
      { term: "Negative", meaning: "No.",                           note: null },
      { term: "Standby",  meaning: "Wait — I will come back to you.", note: "Use when you need a moment or ATC needs to hold." },
      { term: "Unable",   meaning: "I cannot comply.",              note: "Use when you cannot follow an instruction or request." },
    ];
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        <p className="mt-2 shrink-0 text-sm leading-snug text-slate-300">
          Use these short replies to acknowledge, comply, answer yes or no, or signal you cannot comply.
        </p>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
          {ackItems.map((item) => (
            <div
              key={item.term}
              className="flex min-h-0 flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1322] to-[#0E1726] px-5 py-3"
            >
              <p className="text-[22px] font-bold leading-tight text-white">{item.term}</p>
              <p className="mt-1 text-[14px] font-semibold leading-snug text-[#FACC15]">{item.meaning}</p>
              {item.note && (
                <p className="mt-0.5 text-[12px] leading-snug text-slate-400">{item.note}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 shrink-0">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Clarification & Correction lesson: 4 phrase cards (Say again, Confirm, Correction, Speak slower).
  if (clarificationCorrection) {
    const clarItems = [
      { term: "Say again",    meaning: "Ask ATC to repeat a transmission.",      example: "\"Say again.\"",                  note: null },
      { term: "Confirm",      meaning: "Check that information is correct.",     example: "\"Confirm frequency 121.805?\"",   note: null },
      { term: "Correction",   meaning: "Fix something you said incorrectly.",    example: "\"Correction, stand 24.\"",        note: "Say the correct value right after." },
      { term: "Speak slower", meaning: "Ask ATC to speak more slowly.",          example: "\"Speak slower, please.\"",        note: null },
    ];
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        <p className="mt-2 shrink-0 text-sm leading-snug text-slate-300">
          Sometimes you will not understand a transmission, need to confirm information, correct yourself, or ask ATC to slow down.
        </p>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
          {clarItems.map((item) => (
            <div
              key={item.term}
              className="flex min-h-0 flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1322] to-[#0E1726] px-5 py-3"
            >
              <p className="text-[22px] font-bold leading-tight text-white">{item.term}</p>
              <p className="mt-1 text-[14px] font-semibold leading-snug text-[#FACC15]">{item.meaning}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-slate-400">{item.example}</p>
              {item.note && (
                <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{item.note}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 shrink-0">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // The 4 Ws consolidated lesson: 4 compact W rows + full call card, no audio button.
  if (the4Ws) {
    const wRows = [
      { q: "Who am I calling?", label: "Station",  example: "Madrid Ground" },
      { q: "Who am I?",         label: "Callsign", example: "EC-ABC" },
      { q: "Where am I?",       label: "Position", example: "at stand 12" },
      { q: "What do I want?",   label: "Request",  example: "request startup" },
    ];
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        <div className="mt-2 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-3.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-200">Every first call follows the same formula: Station + Callsign + Position + Request.</p>
        </div>
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5">
          {wRows.map((w) => (
            <div key={w.q} className="flex min-h-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#0B1322] px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{w.q}</p>
                <p className="mt-0.5 text-base font-bold leading-tight text-[#FACC15]">{w.label}</p>
                <p className="mt-0.5 text-sm text-slate-300">{w.example}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-white/20 bg-[#0B1322] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Full call</p>
            <p className="mt-1 text-base font-semibold leading-snug text-white">Madrid Ground, EC-ABC, at stand 12, request startup.</p>
          </div>
        </div>
        <div className="mt-2 shrink-0">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Contact vs Monitor lesson: two stacked examples, no Play button.
  if (contactVsMonitor) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        <div className="mt-3 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
          <p className="mt-1 text-sm leading-snug text-slate-200">{body}</p>
        </div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Example</p>
          <div className="mt-2 flex flex-col gap-2">
            <ContactMonitorExample verb="Contact" rest="Tower 118.100" meaning="change and call" />
            <ContactMonitorExample verb="Monitor" rest="Tower 118.100" meaning="change and listen" />
          </div>
        </div>
        <div className="mt-3 shrink-0">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Radio Check & Readability lesson: structured body + readability scale + highlighted examples.
  if (radioCheckLesson) {
    const exampleTerms = ["radio check", "readability five"];
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        <div className="mt-3 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
          <p className="mt-2 text-base leading-relaxed text-slate-200">
            {highlightTerms("A radio check is a short call used to check if the station can hear you clearly.", ["radio check"])}
          </p>
          <p className="mt-3 text-[15px] font-medium leading-snug text-slate-300">
            {highlightTerms("ATC replies with a readability number:", ["readability"])}
          </p>
          <ReadabilityScaleList />
          <p className="mt-3 text-base leading-relaxed text-slate-200">
            {highlightTerms("In Cadet, focus on readability five.", ["readability five"])}
          </p>
        </div>
        {examples.length > 0 && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0B1322] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Example</p>
            <div className="mt-2.5 space-y-2">
              {examples.map((l) => (
                <HighlightedLessonExampleLine key={l} line={l} terms={exampleTerms} />
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto shrink-0 pt-4">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Basic ATIS & QNH lesson: compact body + short example exchange (fits iPhone without scroll).
  if (atisQnhLesson) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} label="Lesson" />
        <div className="mt-2 rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
          <div className="mt-1.5 space-y-1.5 text-[15px] leading-snug text-slate-200">
            <p>{highlightTerms("ATIS gives pilots airport information before departure or arrival.", ["ATIS"])}</p>
            <p>{highlightTerms("Each update has a letter, such as Information Bravo.", ["Information Bravo"])}</p>
            <p>{highlightTerms("QNH is the pressure setting given by ATC or ATIS.", ["QNH", "ATIS"])}</p>
            <p className="text-slate-300">In Cadet, recognise it and read it back.</p>
          </div>
        </div>
        <div className="mt-2 rounded-2xl border border-white/10 bg-[#0B1322] px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Example</p>
          <AtisQnhLessonExampleFlow />
        </div>
        <div className="mt-auto shrink-0 pt-3">
          <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title={title} label="Lesson" />
      <div className="mt-6 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Why this matters</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{content?.instruction ? content.instruction + " " : ""}{body}</p>
      </div>
      {examples.length > 0 && (
        <div className="mt-3 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Example</p>
            <ReplayButton onClick={() => speak(examples.join(". "))} label="Play" />
          </div>
          <div className="mt-2 space-y-1">
            {examples.map((l) =>
              stationSelection ? (
                <StationExampleLine key={l} line={l} />
              ) : (
                <p key={l} className="text-sm font-medium text-slate-200">{l}</p>
              ),
            )}
          </div>
        </div>
      )}
      <div className="mt-auto pt-6">
        <PrimaryButton onClick={onComplete}>{content?.buttonLabel ?? "Continue to practice"}</PrimaryButton>
      </div>
    </div>
  );
}

const FALLBACK_LISTENING: Drill = { atc: "Alfa", options: ["A", "E", "R", "H"], correct: "A", feedback: "Correct." };

function ListeningScreen({ title, content, onComplete, icao, numbers, callsigns, frequencies, stationSelection, exerciseId }: { title: string; content?: ExerciseContent; onComplete: (score?: number) => void; icao?: boolean; numbers?: boolean; callsigns?: boolean; frequencies?: boolean; stationSelection?: boolean; exerciseId?: string }) {
  const cadetListening = (exerciseId ?? "").startsWith("cadet-listening.");
  const polished = icao || numbers || callsigns || frequencies;
  const drills = useDrillSet(content?.drills?.length ? content.drills : [FALLBACK_LISTENING]);
  const [di, setDi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const drill = drills[di];
  const options = shuffledOptions(drill.options, drill.correct, `${exerciseId ?? "listening"}:${di}:${drill.correct ?? ""}`);
  const correctIdx = Math.max(0, options.findIndex((o) => o === drill.correct));
  // Accumulates per-drill correctness for aggregate score. undefined = drill had no MCQ data.
  const resultsRef = useRef<(boolean | undefined)[]>([]);

  // TTS playback cancellation — every Play/Replay button in this screen now goes
  // through backend TTS (speak()). Stops any in-progress server/browser speech
  // when the round advances or this screen unmounts, so audio never keeps
  // talking after the user has moved on.
  useEffect(() => {
    return () => stopSpeaking();
  }, [di]);

  // Also stop speech on hard navigation/tab-hide (browser back, close tab, app
  // backgrounded) — client-side route changes are already covered by the unmount
  // cleanup above.
  useEffect(() => {
    const handleHide = () => stopSpeaking();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") stopSpeaking();
    };
    window.addEventListener("pagehide", handleHide);
    window.addEventListener("beforeunload", handleHide);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", handleHide);
      window.removeEventListener("beforeunload", handleHide);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopSpeaking();
    };
  }, []);

  const next = () => {
    // Record correctness for the current drill before resetting state.
    const hasEval = !!drill.correct && !!drill.options?.length;
    resultsRef.current[di] = hasEval ? selected === correctIdx : undefined;

    if (di + 1 >= drills.length) {
      // All drills done — compute aggregate score from evaluable drills.
      const evaluable = (resultsRef.current.filter((r) => r !== undefined)) as boolean[];
      if (evaluable.length > 0) {
        const correctCount = evaluable.filter(Boolean).length;
        return onComplete(Math.round((correctCount / evaluable.length) * 100));
      }
      return onComplete(); // no MCQ data → completion-only fallback
    }
    setDi(di + 1);
    setSelected(null);
    setChecked(false);
  };

  const optionClass = (i: number) => {
    const isCorrect = checked && i === correctIdx;
    const isWrong = checked && i === selected && i !== correctIdx;
    return isCorrect
      ? "border-[#FACC15]/60 bg-[#FACC15]/15 text-[#FACC15]"
      : isWrong
        ? "border-red-500/50 bg-red-500/10 text-red-300"
        : selected === i
          ? "border-[#FACC15]/50 bg-white/[0.06] text-white"
          : "border-white/10 bg-white/5 text-slate-200";
  };

  // Polished variant (ICAO Alphabet + Numbers): large central Play, single-column tall options.
  if (polished && !drill.situation) {
    return (
      <div className="flex flex-1 flex-col">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Listening Practice" />
        <div className="mt-6 flex flex-col items-center">
          <BigPlayButton onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} />
          <p className="mt-3 text-sm text-slate-400">{content?.instruction ?? (numbers ? "Listen to the instruction" : callsigns ? "Listen to the callsign" : frequencies ? "Listen and select the frequency" : "Listen to the ICAO word")}</p>
          {checked && (
            <button onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} className="mt-2 text-xs font-medium text-slate-500 underline-offset-2 hover:underline">
              Replay
            </button>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          {options.map((opt, i) => (
            <button
              key={opt}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`flex min-h-[60px] items-center justify-center rounded-2xl border px-4 text-2xl font-bold transition-colors ${optionClass(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={drill.feedback} />}
        </div>
        <div className="mt-auto flex gap-2.5 pt-6">
          {!checked ? (
            <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
          ) : (
            <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
          )}
        </div>
      </div>
    );
  }

  // Station selection: large situation text + vertical full-width options.
  if (stationSelection && drill.situation) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Listening Practice" />
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
          <p className="mt-2 text-lg font-semibold leading-snug text-white">{drill.situation}</p>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-300">Which station?</p>
        <div className="mt-2 flex flex-col gap-2.5">
          {options.map((opt, i) => (
            <button
              key={opt}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`flex min-h-[58px] items-center justify-center rounded-2xl border px-4 text-base font-bold transition-colors ${optionClass(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {checked && (
            <ResultFeedback
              correct={selected === correctIdx}
              expected={options[correctIdx]}
              explanation={drill.feedback}
            />
          )}
        </div>
        <div className="mt-auto flex gap-2.5 pt-4">
          {!checked ? (
            <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
          ) : (
            <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
          )}
        </div>
      </div>
    );
  }

  // Cadet Listening: large centered Play, readable instruction, vertical full-width options.
  // TTS Profiles v1: Cadet Listening groups use exercise IDs ending "drill-1".."drill-6",
  // which double as the group's built-in difficulty level — speak() (shared helper
  // above) maps that straight to the matching cadet-level-N voice/pace profile,
  // falling back to "cadet-clear" for non-leveled Cadet content.
  if (cadetListening && !drill.situation) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Listening Practice" />
        <div className="mt-4 flex flex-col items-center">
          <BigPlayButton onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} />
          <p className="mt-3 px-2 text-center text-base leading-relaxed text-slate-200">
            {content?.instruction ?? "Listen and select what you heard."}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {options.map((opt, i) => (
            <button
              key={opt}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`flex min-h-[58px] w-full items-center justify-center rounded-2xl border px-4 py-3 text-base font-semibold transition-colors ${optionClass(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-3">
          {checked && (
            <ResultFeedback
              correct={selected === correctIdx}
              expected={options[correctIdx]}
              explanation={drill.feedback}
            />
          )}
        </div>
        <div className="mt-auto flex gap-2.5 pt-4">
          {!checked ? (
            <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
          ) : (
            <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Listening Practice" />
      {content?.instruction && <p className="mt-3 text-sm text-slate-400">{content.instruction}</p>}
      {drill.situation ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
          <p className="mt-2 text-base font-semibold">{drill.situation}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">ATC audio</p>
          <div className="mt-3 flex gap-2">
            <ReplayButton onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} label="Play" />
            <ReplayButton onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} label="Replay" />
          </div>
        </div>
      )}
      <p className="mt-5 text-sm font-semibold text-slate-300">{drill.situation ? "Which station?" : "What did you hear?"}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            disabled={checked}
            onClick={() => setSelected(i)}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${optionClass(i)}`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {checked && (
          <ResultFeedback
            correct={selected === correctIdx}
            expected={options[correctIdx]}
            explanation={drill.feedback}
          />
        )}
      </div>
      <div className="mt-auto flex gap-2.5 pt-6">
        {!checked ? (
          <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
        ) : (
          <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        )}
      </div>
    </div>
  );
}

function SpeakingScreen({ title, content, onComplete, icao, frequencies, stationSelection }: { title: string; content?: ExerciseContent; onComplete: () => void; icao?: boolean; frequencies?: boolean; stationSelection?: boolean }) {
  const drills = useDrillSet(content?.drills?.length ? content.drills : [{ prompt: title, expected: title } as Drill]);
  const [di, setDi] = useState(0);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  // Frequencies: whether the prompt has been revealed for this round.
  const [freqRevealed, setFreqRevealed] = useState(false);
  const drill = drills[di];

  const handleMic = () => {
    if (done || recording) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setDone(true);
    }, 1400);
  };

  const next = () => {
    if (di + 1 >= drills.length) return onComplete();
    setDi(di + 1);
    setDone(false);
    setFreqRevealed(false);
  };

  // Polished ICAO Alphabet variant: large target, no replay, larger + higher mic.
  if (icao) {
    // `cue` (the letter) means recall mode: show only the letter, hide the word until after speaking.
    const target = drill.cue ?? drill.display ?? drill.prompt ?? "";
    const say = ICAO_SAY[(drill.prompt ?? drill.expected ?? "").toLowerCase()];
    const prompt = drill.cue ? "Say the ICAO word for this letter" : drill.display ? "Spell this callsign" : "Say this ICAO word";
    return (
      <div className="flex flex-1 flex-col">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Say it" />
        <p className="mt-4 text-center text-sm text-slate-400">{prompt}</p>
        <p className={`mt-2 text-center font-bold tracking-tight text-white ${drill.cue ? "text-7xl" : "text-5xl"}`}>{target}</p>

        <div className="mt-7 flex flex-col items-center gap-4">
          <MicButton recording={recording} done={done} onClick={handleMic} size="lg" />
          <p className="text-sm text-slate-400">{done ? "Nice." : recording ? "Transmitting..." : "Hold to speak"}</p>
        </div>

        {done && (
          <div className="mt-5 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            {drill.expected && <p className="text-2xl font-bold text-[#FACC15]">{drill.expected}</p>}
            {say && <p className="mt-1 text-base font-semibold tracking-wide text-slate-300">Pronunciation: {say}</p>}
            {!drill.expected && <p className="text-sm font-medium text-[#FACC15]">{drill.feedback ?? "Good. Clear and readable."}</p>}
          </div>
        )}

        <div className="mt-auto flex gap-2.5 pt-6">
          <GhostButton onClick={() => setDone(false)}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Polished Frequencies Listen & Repeat: hidden prompt, small Play in card, large mic outside.
  if (frequencies) {
    const spoken = drill.expected ?? "";
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Listen & Repeat" />
        {/* Frequency card */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Frequency</p>
            {freqRevealed && (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                Transcript revealed · score reduced
              </span>
            )}
          </div>
          {freqRevealed ? (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">{drill.prompt}</p>
              <p className="mt-1.5 text-sm font-semibold text-[#FACC15]">{spoken}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-medium text-slate-400">Frequency hidden</p>
              <p className="mt-1 font-mono text-3xl tracking-widest text-slate-600 select-none">{"•••.•••"}</p>
            </>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => speak(spoken)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#07111F] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.6)] transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
            {!freqRevealed && (
              <button
                type="button"
                onClick={() => setFreqRevealed(true)}
                className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-300"
              >
                Show frequency
              </button>
            )}
          </div>
          {!freqRevealed && <p className="mt-2 text-[11px] text-slate-600">Listen first. Reveal costs score.</p>}
        </div>
        {/* Mic outside card */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <MicButton recording={recording} done={done} onClick={handleMic} size="lg" />
          <p className="text-sm text-slate-400">{done ? "Good." : recording ? "Transmitting..." : "Hold to speak and repeat the frequency."}</p>
        </div>
        {/* Expected after mic */}
        {done && (
          <div className="mt-3 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Spoken form</p>
            <p className="mt-1.5 text-lg font-bold text-[#FACC15]">{spoken}</p>
            {drill.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{drill.feedback}</p>}
            {freqRevealed && <p className="mt-2 text-[11px] font-medium text-amber-400">Assisted — score reduced</p>}
          </div>
        )}
        <div className="mt-auto flex gap-2.5 pt-4">
          <GhostButton onClick={() => { setDone(false); setFreqRevealed(false); }}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // The 4 Ws speak drills: large centred mic, situation card, revealed answer — aligned with First Contact style.
  if (stationSelection && drill.situation) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Speak the Call" />
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
          <p className="mt-2 text-base font-semibold leading-relaxed text-white">{drill.situation}</p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <MicButton recording={recording} done={done} onClick={handleMic} size="lg" />
          <p className="text-sm text-slate-400">
            {done ? "Good." : recording ? "Transmitting..." : "Hold to speak."}
          </p>
        </div>
        {done && (
          <div className="mt-5 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected</p>
            {drill.expected && <p className="mt-1.5 text-base font-bold text-[#FACC15]">{drill.expected}</p>}
            {drill.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{drill.feedback}</p>}
          </div>
        )}
        <div className="mt-auto flex gap-2.5 pt-4">
          <GhostButton onClick={() => setDone(false)}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Listen & Repeat" />
      {content?.instruction && <p className="mt-3 text-sm text-slate-400">{content.instruction}</p>}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
        {drill.display ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spell this callsign</p>
            <p className="mt-2 text-2xl font-bold tracking-wide">{drill.display}</p>
          </>
        ) : drill.situation ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
            <p className="mt-2 text-base font-semibold">{drill.situation}</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Listen</p>
              <ReplayButton onClick={() => speak(drill.prompt ?? "")} />
            </div>
            <p className="mt-2 text-lg font-semibold">&ldquo;{drill.prompt}&rdquo;</p>
          </>
        )}
      </div>
      <div className="mt-3 min-h-[64px] rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Your turn</p>
        {done ? (
          <>
            {drill.expected && <p className="mt-1 text-sm font-medium text-[#FACC15]">Expected: &ldquo;{drill.expected}&rdquo;</p>}
            <p className={`text-sm ${drill.expected ? "mt-1 text-xs text-slate-400" : "mt-1 font-medium text-[#FACC15]"}`}>{drill.feedback ?? "Good. Clear and readable."}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-400">{recording ? "Transmitting..." : "Hold to speak."}</p>
        )}
      </div>
      <div className="mt-auto flex flex-col items-center gap-4 pt-6">
        <MicButton recording={recording} done={done} onClick={handleMic} />
        <div className="flex w-full gap-2.5">
          <GhostButton onClick={() => setDone(false)}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ReadbackScreen({ title, content, onComplete, numbers, frequencies, cadetReadbacks, frequencyChanges }: { title: string; content?: ExerciseContent; onComplete: () => void; numbers?: boolean; frequencies?: boolean; cadetReadbacks?: boolean; frequencyChanges?: boolean }) {
  const drills = useDrillSet(content?.drills?.length ? content.drills : [{ atc: "Iberia 325, contact Tower 118.100.", expected: "Tower 118.100, Iberia 325." } as Drill]);
  const [di, setDi] = useState(0);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  // Numbers-specific: whether the ATC transcript has been revealed for this round.
  const [revealed, setRevealed] = useState(false);
  const drill = drills[di];

  const handleMic = () => {
    if (done || recording) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setDone(true);
    }, 1600);
  };

  const next = () => {
    if (di + 1 >= drills.length) return onComplete();
    setDi(di + 1);
    setDone(false);
    setRevealed(false);
  };

  // Cadet Readbacks and First Contact Frequency Changes: polished hidden/revealed ATC card + large mic.
  // Callsign is already embedded in the ATC transmission for both.
  if (cadetReadbacks || frequencyChanges) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Readback Practice" />

        {/* ATC transmission card (hidden or revealed) */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">ATC transmission</p>
          {revealed ? (
            <p className="mt-2 text-base font-semibold leading-snug text-white">&ldquo;{drill.atc}&rdquo;</p>
          ) : (
            <p className="mt-2 font-mono text-lg tracking-widest text-slate-600 select-none">{"•••• •• ••• •••••••"}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#07111F] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.6)] transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
            {!revealed && (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-300"
              >
                Show transmission
              </button>
            )}
          </div>
          {!revealed && <p className="mt-2 text-[11px] text-slate-600">Listen first, then read it back.</p>}
        </div>

        {/* Mic */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <MicButton recording={recording} done={done} onClick={handleMic} size="lg" />
          <p className="text-sm text-slate-400">
            {done ? "Read back complete." : recording ? "Transmitting..." : "Hold to speak and read it back."}
          </p>
        </div>

        {/* Expected readback after mic */}
        {done && (
          <div className="mt-3 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected readback</p>
            <p className="mt-1.5 text-lg font-bold text-[#FACC15]">{drill.expected}</p>
            {drill.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{drill.feedback}</p>}
          </div>
        )}

        <div className="mt-auto flex gap-2.5 pt-4">
          <GhostButton onClick={() => { setDone(false); setRevealed(false); }}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }

  // Polished Numbers / Frequencies readback: hidden ATC transcript, reveal option, assisted badge.
  // Frequencies shows the callsign badge; Numbers does not (callsigns are taught later).
  if (numbers || frequencies) {
    const callsign = drill.callsign ?? "Iberia 325";
    const spokenAtc = drill.atcSpoken ?? drill.atc ?? "";
    const transcriptMask = frequencies ? "•••••• •••••••• •••.•••" : "•••• •• ••• •••••••";
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Readback Practice" />

        {/* Callsign — shown only for Frequencies (callsigns not yet taught in Numbers) */}
        {frequencies && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0B1322] px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Your callsign</span>
            <span className="ml-auto text-base font-bold text-white">{callsign}</span>
          </div>
        )}

        {/* ATC transmission card (hidden or revealed) */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">ATC transmission</p>
            {revealed && (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                Transcript revealed · score reduced
              </span>
            )}
          </div>
          {revealed ? (
            <p className="mt-2 text-base font-semibold leading-snug text-white">&ldquo;{drill.atc}&rdquo;</p>
          ) : (
            <p className="mt-2 font-mono text-lg tracking-widest text-slate-600 select-none">{transcriptMask}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => speak(spokenAtc)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#07111F] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.6)] transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
            {!revealed && (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-300"
              >
                Show transmission
              </button>
            )}
          </div>
          {!revealed && <p className="mt-2 text-[11px] text-slate-600">Listen first. Reveal costs score.</p>}
        </div>

        {/* Mic outside card */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <MicButton recording={recording} done={done} onClick={handleMic} size="lg" />
          <p className="text-sm text-slate-400">
            {done ? "Read back complete." : recording ? "Transmitting..." : "Hold to speak and read it back."}
          </p>
        </div>

        {/* Expected readback after mic */}
        {done && (
          <div className="mt-3 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected readback</p>
            <p className="mt-1.5 text-lg font-bold text-[#FACC15]">{drill.expected}</p>
            {drill.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{drill.feedback}</p>}
            {revealed && <p className="mt-2 text-[11px] font-medium text-amber-400">Assisted — score reduced</p>}
          </div>
        )}

        <div className="mt-auto flex gap-2.5 pt-4">
          <GhostButton onClick={() => { setDone(false); setRevealed(false); }}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label="Readback Practice" />
      {content?.instruction && <p className="mt-3 text-sm text-slate-400">{content.instruction}</p>}
      <div className="mt-4">
        <AtcPanel text={drill.atc ?? ""} />
      </div>
      <div className="mt-3 min-h-[64px] rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Your readback</p>
        {done ? (
          <>
            <p className="mt-1 text-sm font-medium text-[#FACC15]">Expected: &ldquo;{drill.expected}&rdquo;</p>
            {drill.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{drill.feedback}</p>}
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-400">{recording ? "Transmitting..." : "Hold to speak and read it back."}</p>
        )}
      </div>
      <div className="mt-auto flex flex-col items-center gap-4 pt-6">
        <MicButton recording={recording} done={done} onClick={handleMic} />
        <div className="flex w-full gap-2.5">
          <GhostButton onClick={() => setDone(false)}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function PhraseologyScreen({ title, content, buildTheCall, basicRequests, frequencyChanges, cadetPhraseology, firstContactPractice, exerciseId, onComplete }: { title: string; content?: ExerciseContent; buildTheCall?: boolean; basicRequests?: boolean; frequencyChanges?: boolean; cadetPhraseology?: boolean; firstContactPractice?: boolean; exerciseId?: string; onComplete: (score?: number) => void }) {
  const drills = useDrillSet(content?.drills?.length ? content.drills : [{ situation: "Make the call.", expected: "Madrid Ground, Iberia 325, request startup." } as Drill]);
  const [di, setDi] = useState(0);
  const drill = drills[di];
  // Build: has chips to order AND a full expected answer
  const isBuild = !!drill.options?.length && !!drill.expected;
  // MCQ: has correct answer + options, no audio, no build expected
  const isChoice = !!drill.correct && !!drill.options?.length && !drill.atc;
  // Audio: has ATC transmission + options + correct answer
  const isAudio = !!drill.atc && !!drill.correct && !!drill.options?.length;
  const largeUi = buildTheCall || basicRequests || frequencyChanges || cadetPhraseology || firstContactPractice;
  const polishedSituation = basicRequests || frequencyChanges || cadetPhraseology || firstContactPractice;

  const [built, setBuilt] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  // For MCQ / Audio choice modes
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  // Real mic/STT for drills that show a mic (no options — speak the call).
  const [voiceState, setVoiceState] = useState<VoiceUiState>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceEvaluationResult | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recording = voiceState === "requesting_permission" || voiceState === "recording" || voiceState === "processing";
  const sttMode = getSttModeForExercise({ exerciseId, expected: drill.expected ?? "" });
  const maxDurationMs = getMaxDurationMsForExercise({ exerciseId, expected: drill.expected ?? "" });

  // Accumulates per-drill correctness: true/false for evaluable drills, undefined for speaking-only.
  const resultsRef = useRef<(boolean | undefined)[]>([]);

  const choiceOptions = (isChoice || isAudio) ? shuffledOptions(drill.options, drill.correct, `${exerciseId ?? title}:${di}:${drill.correct ?? ""}`) : [];
  const choiceCorrectIdx = choiceOptions.findIndex((o) => o === drill.correct);

  const optionClass = (i: number) => {
    const isCorrectOpt = checked && i === choiceCorrectIdx;
    const isWrongOpt = checked && i === selected && i !== choiceCorrectIdx;
    return isCorrectOpt
      ? "border-[#FACC15]/60 bg-[#FACC15]/15 text-[#FACC15]"
      : isWrongOpt
        ? "border-red-500/50 bg-red-500/10 text-red-300"
        : selected === i
          ? "border-[#FACC15]/50 bg-white/[0.06] text-white"
          : "border-white/10 bg-white/5 text-slate-200";
  };

  const reset = () => {
    setBuilt([]);
    setDone(false);
    setSelected(null);
    setChecked(false);
    setVoiceState("idle");
    setVoiceResult(null);
    setVoiceTranscript("");
    setVoiceError(null);
  };

  const next = () => {
    // Record correctness for this drill before advancing.
    // undefined = speaking-only (no mic result yet), not evaluable.
    let drillResult: boolean | undefined;
    if (isChoice || isAudio) {
      drillResult = selected !== null ? selected === choiceCorrectIdx : undefined;
    } else if (isBuild) {
      // correct reflects the last Check state (user may have retried).
      drillResult = isBuild && done && normalize(built.join(", ")) === normalize(drill.expected ?? "");
    } else if (voiceResult) {
      drillResult = voiceResult.correct;
    }
    resultsRef.current[di] = drillResult;

    if (di + 1 >= drills.length) {
      const evaluable = resultsRef.current.filter((r): r is boolean => r !== undefined);
      if (evaluable.length > 0) {
        const correctCount = evaluable.filter(Boolean).length;
        return onComplete(Math.round((correctCount / evaluable.length) * 100));
      }
      return onComplete(); // all drills were speaking-only → completion-only
    }
    setDi(di + 1);
    reset();
  };

  // Real STT result handler for mic-enabled speak drills (no build/MCQ options).
  const handleVoiceResult = (stt: SttResult) => {
    const expected = drill.expected ?? "";
    const isPhrase = expected.trim().split(/\s+/).length > 1 || expected.replace(/[^a-zA-Z]/g, "").length > 8;
    const evalInput = {
      transcript: stt.transcript,
      expected,
      confidence: stt.confidence,
      acceptedVariants: drill.acceptedVariants,
      drillFeedback: drill.feedback,
    };
    const evaluation = isPhrase ? evaluatePhraseAnswer(evalInput) : evaluateSpokenAnswer(evalInput);
    setVoiceTranscript(stt.transcript);
    setVoiceResult(evaluation);
    setVoiceState("result");
    setDone(true);
  };

  const correct = isBuild && done && normalize(built.join(", ")) === normalize(drill.expected ?? "");

  return (
    <div className={`flex flex-1 flex-col ${cadetPhraseology ? "min-h-0" : ""}`}>
      <StepHeader title={title} sub={drills.length > 1 ? `Round ${di + 1} / ${drills.length}` : undefined} label={basicRequests ? "Basic Requests" : firstContactPractice ? "Practice" : "Phraseology"} />

      {/* Situation card — hidden for audio drills (no situation text, only atc) */}
      {!isAudio && (
        <div className="mt-4 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
          <p className={`mt-1.5 ${polishedSituation ? "text-base font-semibold leading-relaxed text-white" : isBuild ? (largeUi ? "text-base font-semibold leading-relaxed text-white" : "text-sm leading-relaxed text-slate-300") : `text-slate-300 ${largeUi ? "text-base font-medium leading-relaxed" : "text-sm leading-relaxed"}`}`}>{drill.situation ?? content?.instruction ?? "Make the call."}</p>
        </div>
      )}

      {/* Audio+Choice: hear ATC, pick the correct response */}
      {isAudio && cadetPhraseology ? (
        <>
          <div className="mt-5 flex flex-col items-center gap-3">
            <BigPlayButton onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} />
            {checked && (
              <button onClick={() => speak(drill.atcSpoken ?? drill.atc ?? "")} className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline">
                Replay
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-sm text-slate-400">Listen then choose the correct response.</p>
          <div className="mt-4 flex flex-col gap-2.5">
            {choiceOptions.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[58px] w-full items-center justify-center rounded-2xl border px-4 py-3 text-base font-semibold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {checked && (
            <div className="mt-3">
              <ResultFeedback correct={selected === choiceCorrectIdx} expected={choiceOptions[choiceCorrectIdx]} explanation={drill.feedback} />
            </div>
          )}
          <div className="mt-auto flex gap-2.5 pt-4">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
            )}
          </div>
        </>
      ) : isChoice && (cadetPhraseology || firstContactPractice) ? (
        /* MCQ: text situation + single-column option buttons */
        <>
          <div className="mt-4 flex flex-col gap-2.5">
            {choiceOptions.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[58px] w-full items-center justify-center rounded-2xl border px-4 py-3 text-base font-semibold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {checked && (
            <div className="mt-3">
              <ResultFeedback correct={selected === choiceCorrectIdx} expected={choiceOptions[choiceCorrectIdx]} explanation={drill.feedback} />
            </div>
          )}
          <div className="mt-auto flex gap-2.5 pt-4">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
            )}
          </div>
        </>
      ) : isBuild ? (
        <>
          <div className={`mt-4 rounded-2xl border bg-[#0B1322] ${cadetPhraseology ? "min-h-[84px] border-white/10 p-4" : "min-h-[52px] border-dashed border-white/15 p-3"}`}>
            {cadetPhraseology && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Your call</p>
            )}
            <p className={`${cadetPhraseology ? "mt-2 text-base font-medium leading-relaxed text-white" : "text-sm font-semibold"}`}>
              {built.length ? built.join(", ") : (
                <span className={cadetPhraseology ? "font-normal text-slate-500" : "text-slate-500"}>
                  {cadetPhraseology ? "Tap the parts in the correct order." : "Tap the parts in order..."}
                </span>
              )}
            </p>
          </div>
          <div className={`flex flex-wrap ${cadetPhraseology ? "mt-4 gap-2.5" : "mt-3 gap-2"}`}>
            {drill.options!.map((chip, i) => {
              const used = built.includes(chip);
              return (
                <button
                  key={`${chip}-${i}`}
                  disabled={used || done}
                  onClick={() => setBuilt((b) => [...b, chip])}
                  className={`rounded-full border font-medium transition-colors ${cadetPhraseology ? "px-5 py-3 text-base" : largeUi ? "px-4 py-2 text-base" : "px-3.5 py-1.5 text-sm"} ${used ? "border-white/5 bg-white/[0.03] text-slate-600" : "border-white/10 bg-white/5 text-slate-200"}`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            {done && (
              <FeedbackBox tone={correct ? "good" : "neutral"} text={correct ? "Correct phraseology. Clear and standard." : `Expected: ${drill.expected}`} />
            )}
          </div>
          <div className={`mt-auto flex gap-2.5 ${cadetPhraseology ? "pt-4" : "pt-6"}`}>
            {!done ? (
              <>
                <GhostButton onClick={() => setBuilt([])}>Reset</GhostButton>
                <PrimaryButton disabled={built.length === 0} onClick={() => setDone(true)}>Check</PrimaryButton>
              </>
            ) : (
              <>
                <GhostButton onClick={reset}>Try again</GhostButton>
                <PrimaryButton onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
              </>
            )}
          </div>
        </>
      ) : (cadetPhraseology || basicRequests || frequencyChanges || firstContactPractice) ? (
        <>
          <div className="mt-5 flex flex-col items-center gap-2">
            <VoiceRecorder
              disabled={voiceState === "processing"}
              mode={sttMode}
              maxDurationMs={maxDurationMs}
              onStateChange={setVoiceState}
              onResult={handleVoiceResult}
              onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
            />
          </div>
          {voiceError && (
            <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
          )}
          {voiceResult && (
            <div className="mt-4 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Result</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${voiceResult.correct ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                  {voiceResult.correct ? "Correct" : "Try again"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">Detected: <span className="font-medium text-white">&ldquo;{voiceTranscript || "—"}&rdquo;</span></p>
              <p className="mt-1 text-base font-medium leading-relaxed text-[#FACC15]">Expected: &ldquo;{drill.expected}&rdquo;</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Score: {voiceResult.score}%</p>
            </div>
          )}
          <div className="mt-auto flex gap-2.5 pt-4">
            <GhostButton onClick={reset}>Try again</GhostButton>
            <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 min-h-[60px] rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Your call</p>
            {voiceResult ? (
              <>
                <p className={`mt-1 font-medium text-white ${largeUi ? "text-base" : "text-sm"}`}>Detected: &ldquo;{voiceTranscript || "—"}&rdquo;</p>
                <p className={`mt-1 font-medium text-[#FACC15] ${largeUi ? "text-base" : "text-sm"}`}>Expected: &ldquo;{drill.expected}&rdquo; · Score {voiceResult.score}%</p>
              </>
            ) : (
              <p className={`mt-1 text-slate-400 ${largeUi ? "text-base" : "text-sm"}`}>{recording ? "Transmitting..." : "Hold to speak the call."}</p>
            )}
          </div>
          {voiceError && (
            <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
          )}
          <div className="mt-auto flex flex-col items-center gap-4 pt-6">
            <VoiceRecorder
              disabled={voiceState === "processing"}
              mode={sttMode}
              maxDurationMs={maxDurationMs}
              onStateChange={setVoiceState}
              onResult={handleVoiceResult}
              onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
            />
            <div className="flex w-full gap-2.5">
              <GhostButton onClick={reset}>Try again</GhostButton>
              <PrimaryButton disabled={!done} onClick={next}>{di + 1 >= drills.length ? "Done" : "Next"}</PrimaryButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const FALLBACK_TX: Transmission[] = [
  { speaker: "atc", text: "Iberia 325, Madrid Ground, readability five." },
  { speaker: "user", prompt: "Acknowledge the radio check.", expected: "Readability five, Iberia 325." },
];

function FlowScreen({ title, content, isMission, cadetScenario, scenarioGroupName, onComplete }: { title: string; content?: ExerciseContent; isMission?: boolean; cadetScenario?: boolean; scenarioGroupName?: string; onComplete: () => void }) {
  const tx = content?.transmissions?.length ? content.transmissions : FALLBACK_TX;
  const [phase, setPhase] = useState<"briefing" | "flow">(isMission ? "briefing" : "flow");
  const [step, setStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const t = tx[step];
  const isUser = t.speaker === "user";
  const userCardLabel = cadetScenario
    ? (t.prompt && /^read back/i.test(t.prompt) ? "Your readback" : "Your task")
    : "Your transmission";

  const handleMic = () => {
    if (done || recording) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setDone(true);
    }, 1400);
  };

  const next = () => {
    if (step + 1 >= tx.length) return onComplete();
    setStep(step + 1);
    setDone(false);
  };

  if (phase === "briefing") {
    return (
      <div className="flex flex-1 flex-col">
        <StepHeader title={title} label="Cadet Micro Mission" />
        <div className="mt-6 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Objective</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{content?.briefing ?? "Complete the radio exchange."}</p>
        </div>
        <div className="mt-3 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Skills trained</p>
          <p className="mt-1 text-sm font-semibold">{content?.skills ?? "Listening - Phraseology - Readbacks"}</p>
        </div>
        <div className="mt-3 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Requirements</p>
          <ul className="mt-2 space-y-1.5">
            {(content?.requirements ?? ["Radio Checks", "Basic Requests"]).map((req) => (
              <li key={req} className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4 4 10-11" />
                  </svg>
                </span>
                {req}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-6">
          <PrimaryButton onClick={() => setPhase("flow")}>Start Mission</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader
        title={title}
        sub={cadetScenario ? `Step ${step + 1} / ${tx.length}` : `${isMission ? "Phase" : "Transmission"} ${step + 1} / ${tx.length}`}
        label={cadetScenario ? (scenarioGroupName ?? "Scenario").toUpperCase() : isMission ? "Mission" : "Scenario"}
      />
      <div className="mt-5">
        {isUser ? (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{userCardLabel}</p>
            <p className="mt-2 text-base font-semibold">{t.prompt ?? "Make your call."}</p>
          </div>
        ) : (
          <AtcPanel text={t.text ?? ""} spoken={t.textSpoken} />
        )}
      </div>

      {isUser ? (
        <>
          <div className="mt-3 min-h-[60px] rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Live feedback</p>
            {done ? (
              <p className="mt-1 text-sm font-medium text-[#FACC15]">Expected: &ldquo;{t.expected}&rdquo;</p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">{recording ? "Transmitting..." : "Hold to speak."}</p>
            )}
          </div>
          <div className="mt-auto flex flex-col items-center gap-4 pt-6">
            <MicButton recording={recording} done={done} onClick={handleMic} />
            <PrimaryButton disabled={!done} onClick={next}>{step + 1 >= tx.length ? "End" : "Continue"}</PrimaryButton>
          </div>
        </>
      ) : (
        <div className="mt-auto flex gap-2.5 pt-6">
          <GhostButton onClick={() => speak(t.textSpoken ?? t.text ?? "")}>Replay</GhostButton>
          <PrimaryButton onClick={next}>{step + 1 >= tx.length ? "End" : "Continue"}</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scenario chat flow (Cadet -> Scenarios)                             */
/* ------------------------------------------------------------------ */

/** One-screen, chat-style guided radio exchange for Cadet Scenarios.
 *  ATC bubbles auto-appear on the left; the simulated mic reveals the pilot's
 *  expected call on the right. No real STT/AI - the mic just advances the script. */
function ScenarioChatScreen({ title, content, groupName, onComplete }: { title: string; content?: ExerciseContent; groupName: string; onComplete: (score?: number) => void }) {
  const tx = content?.transmissions?.length ? content.transmissions : FALLBACK_TX;
  const task = content?.instruction ?? "Complete the radio exchange.";
  const [revealed, setRevealed] = useState(0);
  // Real mic/STT per pilot turn — each user transmission has a deterministic `expected`
  // (and optional `acceptedVariants`), evaluated the same way as other voice screens.
  const [voiceState, setVoiceState] = useState<VoiceUiState>("idle");
  const [evalResult, setEvalResult] = useState<VoiceEvaluationResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scoresRef = useRef<number[]>([]);
  // Ref on the scrollable chat container for reliable internal scroll (avoids scrollIntoView
  // trying to scroll the document when we want only the chat pane to move).
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const pending = revealed < tx.length ? tx[revealed] : undefined;
  const recording = voiceState === "requesting_permission" || voiceState === "recording" || voiceState === "processing";
  const awaitingPilot = pending?.speaker === "user" && !recording && !evalResult;
  const complete = revealed >= tx.length;

  // Auto-reveal ATC messages (with a short simulated delay); pilot messages wait for the mic.
  useEffect(() => {
    if (revealed >= tx.length) return;
    if (tx[revealed].speaker !== "atc") return;
    const id = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 350 : 650);
    return () => clearTimeout(id);
  }, [revealed, tx]);

  // Scroll the chat container to the bottom whenever a new message appears or recording state changes.
  // Uses scrollTop = scrollHeight so only the inner container moves, not the page.
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [revealed, recording, evalResult]);

  const handleVoiceResult = (stt: SttResult) => {
    if (!pending?.expected) { setVoiceState("idle"); return; }
    const evaluation = evaluatePhraseAnswer({
      transcript: stt.transcript,
      expected: pending.expected,
      confidence: stt.confidence,
      acceptedVariants: pending.acceptedVariants,
    });
    setTranscript(stt.transcript);
    setEvalResult(evaluation);
    setVoiceState("result");
  };

  const tryAgain = () => {
    setEvalResult(null);
    setTranscript("");
    setVoiceError(null);
    setVoiceState("idle");
  };

  // Advances to the next turn — records the score for this turn (if any) so the
  // scenario reports real progress rather than a completion-only pass.
  const continueTurn = () => {
    if (evalResult) scoresRef.current.push(evalResult.score);
    setEvalResult(null);
    setTranscript("");
    setVoiceError(null);
    setVoiceState("idle");
    setRevealed((r) => r + 1);
  };

  const finish = () => {
    if (scoresRef.current.length === 0) { onComplete(undefined); return; }
    const avg = Math.round(scoresRef.current.reduce((sum, v) => sum + v, 0) / scoresRef.current.length);
    onComplete(avg);
  };

  const shown = tx.slice(0, revealed);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header: group name (green) + scenario title */}
      <div className="mt-6 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">{groupName}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{title}</h1>
      </div>

      {/* Task card */}
      <div className="mt-3 shrink-0 rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Task</p>
        <p className="mt-1 text-base leading-relaxed text-slate-100">{task}</p>
      </div>

      {/* Conversation — the only scrollable area. flex-1 min-h-0 constrains it inside the bounded
          parent (h-dvh main) so messages stack upward as new ones arrive. */}
      <div ref={chatContainerRef} className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {shown.map((m, i) =>
          m.speaker === "atc" ? (
            <div key={i} className="flex justify-start">
              <div className="max-w-[82%] rounded-2xl rounded-tl-md border border-white/10 bg-[#0F172A] px-3.5 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">ATC</p>
                <p className="mt-0.5 text-base leading-relaxed text-slate-100">{m.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[82%] rounded-2xl rounded-tr-md border border-[#FACC15]/30 bg-[#FACC15]/15 px-3.5 py-2.5">
                <p className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">You</p>
                <p className="mt-0.5 text-base leading-relaxed text-white">{m.expected}</p>
              </div>
            </div>
          ),
        )}
        {recording && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tr-md border border-[#FACC15]/20 bg-[#FACC15]/[0.06] px-3.5 py-2.5">
              <p className="text-base leading-relaxed text-slate-400">Transmitting…</p>
            </div>
          </div>
        )}
        {evalResult && pending?.expected && (
          <div className="flex justify-end">
            <div className="max-w-[86%] rounded-2xl rounded-tr-md border border-[#FACC15]/30 bg-[#FACC15]/[0.08] px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Result</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${evalResult.correct ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                  {evalResult.correct ? "Correct" : "Try again"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">Detected: <span className="font-medium text-white">&ldquo;{transcript || "—"}&rdquo;</span></p>
              <p className="mt-1 text-sm leading-relaxed text-white">Expected: &ldquo;{pending.expected}&rdquo;</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Score: {evalResult.score}%</p>
            </div>
          </div>
        )}
        {complete && (
          <p className="pt-1 text-center text-base leading-relaxed font-medium text-slate-500">Scenario complete</p>
        )}
      </div>

      {/* Bottom action — shrink-0 keeps mic/continue pinned at the bottom of the flex column */}
      <div className="mt-3 shrink-0 flex flex-col items-center gap-2">
        {complete ? (
          <PrimaryButton onClick={finish}>Continue</PrimaryButton>
        ) : evalResult ? (
          <div className="flex w-full gap-2.5">
            <GhostButton onClick={tryAgain}>Try again</GhostButton>
            <PrimaryButton onClick={continueTurn}>Continue</PrimaryButton>
          </div>
        ) : (
          <>
            <VoiceRecorder
              disabled={!awaitingPilot}
              mode="server"
              maxDurationMs={12000}
              onStateChange={setVoiceState}
              onResult={handleVoiceResult}
              onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
            />
            {voiceState !== "unsupported" ? (
              <p className="text-xs text-slate-400">
                {recording ? "Transmitting…" : awaitingPilot ? "Hold to speak your call." : "ATC is speaking…"}
              </p>
            ) : (
              <GhostButton onClick={continueTurn}>Continue without voice</GhostButton>
            )}
            {voiceError && <p className="text-xs text-red-300">{voiceError}</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive Frequency Demo (FREQ-02)                                */
/* ------------------------------------------------------------------ */

type DemoItem = { value: string; spoken: string };

function parseDemoItems(content?: ExerciseContent): DemoItem[] {
  const items = (content?.examples ?? [])
    .map((line) => {
      const [value, spoken] = line.split(/\s*=\s*/);
      return value && spoken ? { value: value.trim(), spoken: spoken.trim() } : null;
    })
    .filter((x): x is DemoItem => x !== null);
  return items.length ? items : [{ value: "118.100", spoken: "one one eight decimal one" }];
}

function InteractiveFrequencyDemo({ title, content, onComplete }: { title: string; content?: ExerciseContent; onComplete: () => void }) {
  const items = parseDemoItems(content);
  const [di, setDi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeChar, setActiveChar] = useState(-1);
  const item = items[di];
  const chars = item.value.split("");
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cancel speech (server + browser) and clear char-highlight interval on unmount.
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      stopSpeaking();
    };
  }, []);

  const play = () => {
    if (playing) return;
    setPlaying(true);
    speak(item.spoken);
    let i = 0;
    setActiveChar(0);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    demoIntervalRef.current = setInterval(() => {
      i += 1;
      if (i >= chars.length) {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
        setActiveChar(-1);
        setPlaying(false);
        return;
      }
      setActiveChar(i);
    }, 380);
  };

  const next = () => {
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    demoIntervalRef.current = null;
    if (di + 1 >= items.length) return onComplete();
    setDi(di + 1);
    setActiveChar(-1);
    setPlaying(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StepHeader title={title} sub={items.length > 1 ? `Frequency ${di + 1} / ${items.length}` : undefined} label="Interactive Demo" />
      {content?.instruction && <p className="mt-2 shrink-0 text-sm text-slate-400">{content.instruction}</p>}

      <div className="mt-3 flex min-h-0 flex-1 flex-col items-center">
        <div className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-0.5">
            {chars.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className={`font-mono text-5xl font-bold tabular-nums transition-all duration-200 ${
                  activeChar === i ? "scale-110 text-[#FACC15] drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" : playing ? "text-slate-500" : "text-white"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-base font-medium text-slate-300">&ldquo;{item.spoken}&rdquo;</p>
        </div>
        <div className="flex min-h-0 flex-1 w-full items-center justify-center pb-10">
          <BigPlayButton onClick={play} label={playing ? "Playing" : "Play"} size="lg" />
        </div>
      </div>

      <div className="shrink-0 pt-2">
        <PrimaryButton onClick={next}>{content?.buttonLabel && di + 1 >= items.length ? content.buttonLabel : di + 1 >= items.length ? "Continue" : "Next frequency"}</PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Challenge flow (mixed steps + mini debrief)                         */
/* ------------------------------------------------------------------ */

function ChallengeFlowScreen({ title, content, onComplete, icao, numbers, callsigns, acknowledgements, stationSelection, basicRequests, frequencyChanges, clarificationCorrection, firstContactPractice, exerciseId }: { title: string; content?: ExerciseContent; onComplete: (summary: SessionSummary) => void; icao?: boolean; numbers?: boolean; callsigns?: boolean; acknowledgements?: boolean; stationSelection?: boolean; basicRequests?: boolean; frequencyChanges?: boolean; clarificationCorrection?: boolean; firstContactPractice?: boolean; exerciseId?: string }) {
  const steps: ChallengeStep[] = content?.challengeSteps?.length
    ? content.challengeSteps
    : (content?.transmissions ?? [])
        .filter((t) => t.speaker === "user")
        .map((t) => ({ kind: "speaking" as const, prompt: t.prompt, expected: t.expected }));
  const safeSteps: ChallengeStep[] = steps.length ? steps : [{ kind: "speaking", prompt: "Make your call.", expected: "" }];

  const [si, setSi] = useState(0);
  const step = safeSteps[si];

  // shared per-step state
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const [built, setBuilt] = useState<string[]>([]);
  // Numbers readback steps: whether the ATC transcript has been revealed for this step.
  const [stepRevealed, setStepRevealed] = useState(false);
  // Accumulates per-step correctness results across the whole session.
  const resultsRef = useRef<boolean[]>([]);

  // Real mic/STT for speaking + readback steps (deterministic expected answers only).
  const [voiceState, setVoiceState] = useState<VoiceUiState>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceEvaluationResult | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const sttMode = getSttModeForExercise({
    exerciseId,
    expected: step.expected ?? "",
    isReadback: step.kind === "readback",
  });
  const maxDurationMs = getMaxDurationMsForExercise({
    exerciseId,
    expected: step.expected ?? "",
    isReadback: step.kind === "readback",
  });

  const reset = () => {
    setSelected(null);
    setChecked(false);
    setDone(false);
    setBuilt([]);
    setStepRevealed(false);
    setVoiceState("idle");
    setVoiceResult(null);
    setVoiceTranscript("");
    setVoiceError(null);
  };

  const next = (correct: boolean = true) => {
    resultsRef.current = [...resultsRef.current, correct];
    if (si + 1 >= safeSteps.length) return onComplete(buildSessionSummary(safeSteps, resultsRef.current));
    setSi(si + 1);
    reset();
  };

  // Real STT result handler for speaking/readback steps (deterministic expected answers only).
  const handleVoiceResult = (stt: SttResult) => {
    const expected = step.expected ?? "";
    const isPhrase = expected.trim().split(/\s+/).length > 1 || expected.replace(/[^a-zA-Z]/g, "").length > 8;
    const evalInput = {
      transcript: stt.transcript,
      expected,
      confidence: stt.confidence,
      acceptedVariants: step.acceptedVariants,
      drillFeedback: step.feedback,
    };
    const evaluation = isPhrase ? evaluatePhraseAnswer(evalInput) : evaluateSpokenAnswer(evalInput);
    setVoiceTranscript(stt.transcript);
    setVoiceResult(evaluation);
    setVoiceState("result");
    setDone(true);
  };

  const stepLabel: Record<ChallengeStepKind, string> = {
    listening: "Listening",
    speaking: "Speaking",
    readback: "Readback",
    phraseology: "Phraseology",
  };

  const header = (
    <StepHeader title={title} sub={`Step ${si + 1} / ${safeSteps.length}`} label={`Challenge \u00b7 ${stepLabel[step.kind]}`} />
  );

  // LISTENING / multiple choice
  if (step.kind === "listening") {
    const options = shuffledOptions(step.options, step.correct, `${exerciseId ?? "challenge"}:${si}:${step.correct ?? ""}`);
    const correctIdx = Math.max(0, options.findIndex((o) => o === step.correct));
    const optionClass = (i: number) => {
      const isCorrect = checked && i === correctIdx;
      const isWrong = checked && i === selected && i !== correctIdx;
      return isCorrect
        ? "border-[#FACC15]/60 bg-[#FACC15]/15 text-[#FACC15]"
        : isWrong
          ? "border-red-500/50 bg-red-500/10 text-red-300"
          : selected === i
            ? "border-[#FACC15]/50 bg-white/[0.06] text-white"
            : "border-white/10 bg-white/5 text-slate-200";
    };

    // Polished Callsigns classification variant: large callsign display + 2 big vertical type buttons.
    if (callsigns && step.situation) {
      const callsignValue = step.situation;
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {header}
          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Identify the callsign type</p>
          {/* Large callsign display card */}
          <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1322] to-[#0E1726] px-5 py-6 text-center">
            <p className="text-4xl font-bold tracking-tight text-white">{callsignValue}</p>
          </div>
          {/* Two tall classification buttons */}
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
            {options.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-0 flex-1 items-center justify-center rounded-2xl border px-4 text-lg font-bold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={step.feedback} />}
          </div>
          <div className="mt-3 flex gap-2.5">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            )}
          </div>
        </div>
      );
    }

    // Polished ICAO / Numbers / Callsigns audio variant: large central Play, single-column tall options.
    if ((icao || numbers || callsigns) && !step.situation) {
      return (
        <div className="flex flex-1 flex-col">
          {header}
          <div className="mt-6 flex flex-col items-center">
            <BigPlayButton onClick={() => speak(step.atcSpoken ?? step.atc ?? "")} />
            <p className="mt-3 text-sm text-slate-400">{step.instruction ?? "Listen and select what you heard"}</p>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            {options.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[60px] items-center justify-center rounded-2xl border px-4 text-2xl font-bold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={step.feedback} />}
          </div>
          <div className="mt-auto flex gap-2.5 pt-6">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            )}
          </div>
        </div>
      );
    }
    // Acknowledgements variant: situation card + large vertical single-column options.
    if (acknowledgements && step.situation) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {header}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
            <p className="mt-2 text-lg font-semibold leading-snug text-white">{step.situation}</p>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-300">Which acknowledgement?</p>
          <div className="mt-2 flex flex-col gap-2.5">
            {options.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[58px] items-center justify-center rounded-2xl border px-4 text-xl font-bold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={step.feedback} />}
          </div>
          <div className="mt-auto flex gap-2.5 pt-4">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            )}
          </div>
        </div>
      );
    }

    // Station selection: large situation text + vertical full-width options.
    if (stationSelection && step.situation) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {header}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
            <p className="mt-2 text-lg font-semibold leading-snug text-white">{step.situation}</p>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-300">Which station?</p>
          <div className="mt-2 flex flex-col gap-2.5">
            {options.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[58px] items-center justify-center rounded-2xl border px-4 text-base font-bold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={step.feedback} />}
          </div>
          <div className="mt-auto flex gap-2.5 pt-4">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            )}
          </div>
        </div>
      );
    }

    // Clarification & Correction: single-column options, larger tap targets, 16px situation text.
    if (clarificationCorrection && step.situation) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {header}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
            <p className="mt-2 text-base font-semibold leading-relaxed text-white">{step.situation}</p>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {options.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[64px] w-full items-center justify-center rounded-2xl border px-5 py-4 text-base font-semibold transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={step.feedback} />}
          </div>
          <div className="mt-auto flex gap-2.5 pt-4">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            )}
          </div>
        </div>
      );
    }

    // Frequency Changes, Basic Requests, and First Contact Practice: large white situation + vertical single-column options.
    if ((frequencyChanges || basicRequests || firstContactPractice) && step.situation) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {header}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
            <p className="mt-2 text-base font-semibold leading-relaxed text-white">{step.situation}</p>
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {options.map((opt, i) => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex min-h-[58px] items-center justify-center rounded-2xl border px-4 py-3 text-base font-medium transition-colors ${optionClass(i)}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {checked && <ResultFeedback correct={selected === correctIdx} expected={options[correctIdx]} explanation={step.feedback} />}
          </div>
          <div className="mt-auto flex gap-2.5 pt-4">
            {!checked ? (
              <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col">
        {header}
        {step.instruction && <p className="mt-3 text-sm text-slate-400">{step.instruction}</p>}
        {step.situation ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
            <p className={`mt-2 ${basicRequests ? "text-base font-semibold leading-relaxed text-white" : "text-base font-semibold"}`}>{step.situation}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">ATC audio</p>
            <div className="mt-3 flex gap-2">
              <ReplayButton onClick={() => speak(step.atcSpoken ?? step.atc ?? "")} label="Play" />
              <ReplayButton onClick={() => speak(step.atcSpoken ?? step.atc ?? "")} label="Replay" />
            </div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {options.map((opt, i) => {
            const isCorrect = checked && i === correctIdx;
            const isWrong = checked && i === selected && i !== correctIdx;
            return (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  isCorrect
                    ? "border-[#FACC15]/60 bg-[#FACC15]/15 text-[#FACC15]"
                    : isWrong
                      ? "border-red-500/50 bg-red-500/10 text-red-300"
                      : selected === i
                        ? "border-[#FACC15]/50 bg-white/[0.06] text-white"
                        : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          {checked && (
            <ResultFeedback
              correct={selected === correctIdx}
              expected={options[correctIdx]}
              explanation={step.feedback}
            />
          )}
        </div>
        <div className="mt-auto flex gap-2.5 pt-6">
          {!checked ? (
            <PrimaryButton disabled={selected === null} onClick={() => setChecked(true)}>Check</PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => next(selected === correctIdx)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
          )}
        </div>
      </div>
    );
  }

  // PHRASEOLOGY build-the-call
  if (step.kind === "phraseology" && step.buildOptions?.length) {
    const correct = done && normalize(built.join(", ")) === normalize(step.expected ?? "");
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <div className="mt-4 rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Situation</p>
          <p className={`mt-1.5 ${basicRequests || firstContactPractice ? "text-base font-semibold leading-relaxed text-white" : "text-sm leading-relaxed text-slate-300"}`}>{step.situation ?? step.instruction ?? "Build the call."}</p>
        </div>
        <div className="mt-4 min-h-[52px] rounded-2xl border border-dashed border-white/15 bg-[#0B1322] p-3">
          <p className="text-sm font-semibold">{built.length ? built.join(", ") : <span className="text-slate-500">Tap the parts in order...</span>}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {step.buildOptions.map((chip, i) => {
            const used = built.includes(chip);
            return (
              <button
                key={`${chip}-${i}`}
                disabled={used || done}
                onClick={() => setBuilt((b) => [...b, chip])}
                className={`rounded-full border font-medium transition-colors ${basicRequests || firstContactPractice ? "px-4 py-2 text-base" : "px-3.5 py-1.5 text-sm"} ${used ? "border-white/5 bg-white/[0.03] text-slate-600" : "border-white/10 bg-white/5 text-slate-200"}`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          {done && (
            <ResultFeedback
              correct={correct}
              expected={step.expected}
              explanation={correct ? step.feedback ?? "Clear and standard phraseology." : "Tap the parts in the correct order to match the expected call."}
            />
          )}
        </div>
        <div className="mt-auto flex gap-2.5 pt-6">
          {!done ? (
            <>
              <GhostButton onClick={() => setBuilt([])}>Reset</GhostButton>
              <PrimaryButton disabled={built.length === 0} onClick={() => setDone(true)}>Check</PrimaryButton>
            </>
          ) : (
            <>
              <GhostButton onClick={reset}>Try again</GhostButton>
              <PrimaryButton onClick={() => next(correct)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
            </>
          )}
        </div>
      </div>
    );
  }

  // READBACK (ATC prompt -> hold to speak -> reveal expected)
  if (step.kind === "readback") {
    // Polished Numbers variant: hidden transcript, reveal option, assisted badge.
    if (numbers) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {header}
          {/* ATC transmission */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">ATC transmission</p>
              {stepRevealed && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Transcript revealed · score reduced</span>}
            </div>
            {stepRevealed ? (
              <p className="mt-2 text-base font-semibold leading-snug text-white">&ldquo;{step.atc}&rdquo;</p>
            ) : (
              <p className="mt-2 font-mono text-lg tracking-widest text-slate-600 select-none">{"•••• •• ••• •••••••"}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => speak(step.atcSpoken ?? step.atc ?? "")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#07111F] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.6)] transition-transform active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Play
              </button>
              {!stepRevealed && (
                <button onClick={() => setStepRevealed(true)} className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-300">
                  Show transmission
                </button>
              )}
            </div>
            {!stepRevealed && <p className="mt-2 text-[11px] text-slate-600">Listen first. Reveal costs score.</p>}
          </div>
          {/* Mic */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <VoiceRecorder
              disabled={voiceState === "processing"}
              mode={sttMode}
              maxDurationMs={maxDurationMs}
              onStateChange={setVoiceState}
              onResult={handleVoiceResult}
              onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
            />
          </div>
          {voiceError && (
            <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
          )}
          {/* Result after mic */}
          {voiceResult && (
            <div className="mt-4 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Detected</p>
              <p className="mt-1 text-sm font-medium text-white">&ldquo;{voiceTranscript || "—"}&rdquo;</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected readback</p>
              <p className="mt-1.5 text-lg font-bold text-[#FACC15]">{step.expected}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Score: {voiceResult.score}%</p>
              {step.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.feedback}</p>}
              {stepRevealed && <p className="mt-2 text-[11px] font-medium text-amber-400">Assisted — score reduced</p>}
            </div>
          )}
          <div className="mt-auto flex gap-2.5 pt-4">
            <GhostButton onClick={reset}>Try again</GhostButton>
            <PrimaryButton disabled={!done} onClick={() => next(!!voiceResult?.correct && !stepRevealed)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col">
        {header}
        {step.instruction && <p className="mt-3 text-sm text-slate-400">{step.instruction}</p>}
        <div className="mt-4">
          <AtcPanel text={step.atc ?? ""} />
        </div>
        <div className="mt-3 min-h-[64px] rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Your readback</p>
          {voiceResult ? (
            <>
              <p className="mt-1 text-sm font-medium text-white">Detected: &ldquo;{voiceTranscript || "—"}&rdquo;</p>
              <p className="mt-1 text-sm font-medium text-[#FACC15]">Expected: &ldquo;{step.expected}&rdquo; · Score {voiceResult.score}%</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">Hold to speak and read it back.</p>
          )}
        </div>
        {voiceError && (
          <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
        )}
        <div className="mt-auto flex flex-col items-center gap-4 pt-6">
          <VoiceRecorder
            disabled={voiceState === "processing"}
            mode={sttMode}
            maxDurationMs={maxDurationMs}
            onStateChange={setVoiceState}
            onResult={handleVoiceResult}
            onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
          />
          <div className="flex w-full gap-2.5">
            <GhostButton onClick={reset}>Try again</GhostButton>
            <PrimaryButton disabled={!done} onClick={() => next(!!voiceResult?.correct)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  // SPEAKING (default): display/prompt -> hold to speak -> reveal expected
  // Polished ICAO variant: large prompt + larger mic + revealed expected.
  if (icao) {
    const target = step.display ?? step.prompt ?? "Make your call.";
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <p className="mt-4 text-center text-sm text-slate-400">{step.display ? "Spell this callsign" : "Say this"}</p>
        <p className="mt-2 text-center text-4xl font-bold tracking-tight text-white">{target}</p>
        <div className="mt-7 flex flex-col items-center gap-2">
          <VoiceRecorder
            disabled={voiceState === "processing"}
            mode={sttMode}
            maxDurationMs={maxDurationMs}
            onStateChange={setVoiceState}
            onResult={handleVoiceResult}
            onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
          />
        </div>
        {voiceError && (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
        )}
        {voiceResult && step.expected && (
          <div className="mt-5 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            <p className="text-sm text-slate-300">Detected: <span className="font-medium text-white">&ldquo;{voiceTranscript || "—"}&rdquo;</span></p>
            <p className="mt-1 text-xl font-bold text-[#FACC15]">{step.expected}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Score: {voiceResult.score}%</p>
            {step.feedback && <p className="mt-1 text-xs text-slate-400">{step.feedback}</p>}
          </div>
        )}
        <div className="mt-auto flex gap-2.5 pt-6">
          <GhostButton onClick={reset}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={() => next(!!voiceResult?.correct)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }
  // Frequency Changes and First Contact Practice speaking: large centred mic + 16px situation card.
  if (frequencyChanges || firstContactPractice) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        {step.instruction && <p className="mt-3 text-sm text-slate-400">{step.instruction}</p>}
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Your task</p>
          <p className="mt-2 text-base font-semibold leading-relaxed text-white">{step.prompt ?? "Make your call."}</p>
        </div>
        <div className="mt-5 flex flex-col items-center gap-2">
          <VoiceRecorder
            disabled={voiceState === "processing"}
            mode={sttMode}
            maxDurationMs={maxDurationMs}
            onStateChange={setVoiceState}
            onResult={handleVoiceResult}
            onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
          />
        </div>
        {voiceError && (
          <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
        )}
        {voiceResult && step.expected && (
          <div className="mt-4 result-feedback rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Detected</p>
            <p className="mt-1 text-sm font-medium text-white">&ldquo;{voiceTranscript || "—"}&rdquo;</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected</p>
            <p className="mt-1.5 text-base font-bold text-[#FACC15]">{step.expected}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Score: {voiceResult.score}%</p>
            {step.feedback && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.feedback}</p>}
          </div>
        )}
        <div className="mt-auto flex gap-2.5 pt-4">
          <GhostButton onClick={reset}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={() => next(!!voiceResult?.correct)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {header}
      {step.instruction && <p className="mt-3 text-sm text-slate-400">{step.instruction}</p>}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
        {step.display ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Spell / say</p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-wide">{step.display}</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Your task</p>
              {step.prompt && <ReplayButton onClick={() => speak(step.prompt ?? "")} label="Hear" />}
            </div>
            <p className="mt-2 text-base font-semibold">{step.prompt ?? "Make your call."}</p>
          </>
        )}
      </div>
      <div className="mt-3 min-h-[64px] rounded-2xl border border-white/[0.04] bg-[#0B1322] p-4">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Your turn</p>
        {voiceResult ? (
          <>
            <p className={`mt-1 font-medium text-white ${basicRequests ? "text-base" : "text-sm"}`}>Detected: &ldquo;{voiceTranscript || "—"}&rdquo;</p>
            <p className={`mt-1 font-medium text-[#FACC15] ${basicRequests ? "text-base" : "text-sm"}`}>{step.expected ? `Expected: \u201c${step.expected}\u201d \u00b7 Score ${voiceResult.score}%` : step.feedback ?? "Good. Clear and readable."}</p>
          </>
        ) : (
          <p className={`mt-1 text-slate-400 ${basicRequests ? "text-base" : "text-sm"}`}>Hold to speak.</p>
        )}
      </div>
      {voiceError && (
        <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200">{voiceError}</div>
      )}
      <div className="mt-auto flex flex-col items-center gap-4 pt-6">
        <VoiceRecorder
          disabled={voiceState === "processing"}
          mode={sttMode}
          maxDurationMs={maxDurationMs}
          onStateChange={setVoiceState}
          onResult={handleVoiceResult}
          onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
        />
        <div className="flex w-full gap-2.5">
          <GhostButton onClick={reset}>Try again</GhostButton>
          <PrimaryButton disabled={!done} onClick={() => next(!!voiceResult?.correct)}>{si + 1 >= safeSteps.length ? "Finish" : "Next"}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Student Pilot foundation placeholder (Batch 1)                      */
/* ------------------------------------------------------------------ */

const SP_BLOCK_LABELS: Record<string, string> = {
  "visual-briefing": "Visual Briefing",
  "key-calls": "Key Calls",
  "guided-practice": "Guided Practice",
  "visual-interpretation": "Visual Interpretation",
  "listening-readback": "Listening & Readback",
  "speak-in-context": "Speak in Context",
  "decision-point": "Decision Point",
  "section-scenario": "Section Scenario",
  checkpoint: "Checkpoint",
  mission: "Mission",
};

function humanise(s?: string) {
  if (!s) return undefined;
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Internal Alpha placeholder for Student Pilot foundation exercises. Shows the
 * module / topic / block / visual metadata and a clear "content pending" state
 * instead of the misleading generic Cadet-style fallback drills. No real
 * training content and no maps live here (visual renderers arrive in a later batch).
 */
function StudentPilotFoundationScreen({
  title,
  content,
  moduleName,
  topicName,
  onClose,
}: {
  title: string;
  content?: ExerciseContent;
  moduleName?: string;
  topicName?: string;
  onClose: () => void;
}) {
  const meta: { label: string; value: string }[] = [];
  if (moduleName) meta.push({ label: "Module", value: moduleName });
  if (topicName) meta.push({ label: "Topic", value: topicName });
  if (content?.blockType) meta.push({ label: "Block", value: SP_BLOCK_LABELS[content.blockType] ?? content.blockType });
  if (content?.phase) meta.push({ label: "Phase", value: humanise(content.phase)! });
  if (content?.visualType) meta.push({ label: "Visual", value: humanise(content.visualType)! });
  if (content?.visualSceneId) meta.push({ label: "Scene", value: content.visualSceneId });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38BDF8]/10 text-[#38BDF8] ring-1 ring-[#38BDF8]/30">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7l9-4 9 4-9 4-9-4z" />
            <path d="M3 7v6l9 4 9-4V7" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
          {content?.instruction ?? "Student Pilot content foundation — module content pending."}
        </p>
        <span className="mt-3 rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
          Internal Alpha placeholder
        </span>

        {meta.length > 0 && (
          <div className="mt-6 w-full max-w-sm space-y-1.5 rounded-2xl border border-white/[0.06] bg-[#0B1322] p-4 text-left">
            {meta.map((m) => (
              <div key={m.label} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="shrink-0 text-slate-500">{m.label}</span>
                <span className="text-right font-medium text-slate-200">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pt-4">
        <PrimaryButton onClick={onClose}>Back</PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Session controller                                                  */
/* ------------------------------------------------------------------ */

function SessionInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { access, recordSession } = useAppState();

  const exerciseId = params.get("exerciseId") ?? undefined;

  // Keep the shared speak() helper's profile resolution in sync with whichever
  // exercise is currently rendered (see activeCadetExerciseId declaration above),
  // and stop any active TTS (server or browser) when the exercise changes or the
  // user leaves the session (back button, route change, exercise switch, unmount).
  // Runs in an effect (not directly during render) since it mutates a
  // module-level variable — a side effect that must not happen during render.
  useEffect(() => {
    activeCadetExerciseId = exerciseId;
    return () => stopSpeaking();
  }, [exerciseId]);

  const found = exerciseId ? findExercise(exerciseId) : undefined;

  const type = (found?.exercise.type ?? (params.get("type") as ExerciseType) ?? "Readback") as ExerciseType;
  const title = found?.exercise.title ?? params.get("title") ?? "Training Session";
  const description = found?.exercise.description;
  const content = found?.exercise.content;
  const minutes = Number(params.get("minutes") ?? 5);
  const moduleId = params.get("moduleId") ?? found?.module.id ?? undefined;
  const returnTo = params.get("returnTo") ?? "/aerocomms/app/today";

  const screen = screenType(type);
  // Route on the raw exercise type for the specialised templates; keep screenType for the rest.
  const isDemo = type === "Interactive Demo";
  const isChallenge = type === "Challenge";
  const isAlphabet = content?.interactive === "alphabet";
  const isNumbers = content?.interactive === "numbers";
  // Polished UI variant for the ICAO Alphabet topic sessions only.
  const icao = (exerciseId ?? "").startsWith("radio-fundamentals.icao-alphabet.");
  // Polished UI variant for the Numbers topic drill sessions.
  const numbers = (exerciseId ?? "").startsWith("radio-fundamentals.numbers.");
  // Polished UI variant for the Callsigns topic sessions.
  const callsigns = (exerciseId ?? "").startsWith("radio-fundamentals.callsigns.");
  // Polished UI variant for the Frequencies topic sessions.
  const frequencies = (exerciseId ?? "").startsWith("radio-fundamentals.frequencies.");
  // Polished UI variant for the Basic Acknowledgements topic sessions.
  const acknowledgements = (exerciseId ?? "").startsWith("radio-fundamentals.basic-acknowledgements.");
  // Clarification & Correction: covers the lesson card layout AND the practice challenge.
  const clarificationCorrection = (exerciseId ?? "").startsWith("radio-fundamentals.clarification-correction.");
  // Polished UI variant for First Contact station selection (The 4 Ws lessons).
  const stationSelection = (exerciseId ?? "").startsWith("first-contact.the-4-ws.");
  // Larger situation text + option pills for Build the Call.
  const buildTheCall = exerciseId === "first-contact.the-4-ws.build-the-call";
  // Custom 4-W cards lesson layout for the consolidated The 4 Ws lesson page.
  const the4Ws = exerciseId === "first-contact.the-4-ws.the-4-ws";
  // Larger situation text + option pills for Basic Requests phraseology/challenge exercises.
  const basicRequests = (exerciseId ?? "").startsWith("first-contact.basic-requests.");
  // Polished UI variant for new First Contact prerequisite lessons (Radio Check & ATIS/QNH).
  const radioCheckReadability = (exerciseId ?? "").startsWith("first-contact.radio-check-readability.");
  const basicAtisQnh = (exerciseId ?? "").startsWith("first-contact.basic-atis-qnh.");
  const firstContactPractice = radioCheckReadability || basicAtisQnh;
  const radioCheckLesson = exerciseId === "first-contact.radio-check-readability.what-is-a-radio-check";
  const atisQnhLesson = exerciseId === "first-contact.basic-atis-qnh.what-is-atis-and-qnh";
  const contactVsMonitor = exerciseId === "first-contact.frequency-changes.contact-vs-monitor";
  const frequencyChanges = (exerciseId ?? "").startsWith("first-contact.frequency-changes.");
  const cadetReadbacks = (exerciseId ?? "").startsWith("cadet-readbacks.");
  const cadetPhraseology = (exerciseId ?? "").startsWith("cadet-phraseology.");
  const cadetScenarios = (exerciseId ?? "").startsWith("cadet-scenarios.");
  const [debrief, setDebrief] = useState<SessionSummary | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  if (found && !isExerciseAccessible(found.exercise, found.level, new Set(), access.isPro)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#07111F] px-6 text-white">
        <div className="w-full max-w-lg">
          <AeroCommsProGate description="Este ejercicio forma parte del contenido Pro. Puedes seguir practicando el tramo Free de Cadet o desbloquear el acceso completo." />
        </div>
      </main>
    );
  }

  const close = () => router.push(returnTo);

  // Next exercise inside the same topic / drill group / flat module.
  const nextExercise: Exercise | undefined = (() => {
    if (!found) return undefined;
    const list = found.topic ? found.topic.exercises : found.module.exercises;
    const candidate = list[found.index + 1];
    return candidate && isExerciseAccessible(candidate, found.level, new Set(), access.isPro)
      ? candidate
      : undefined;
  })();

  const goNext = () => {
    if (nextExercise && found) {
      const q = new URLSearchParams({ exerciseId: nextExercise.id, moduleId: found.module.id, returnTo });
      router.push(`/aerocomms/app/session?${q.toString()}`);
    } else {
      // No next exercise: return to where the user came from (module/topic page or Today).
      router.push(returnTo);
    }
  };

  const record = (score?: number, isScored = false, typeOverride?: ExerciseType) => {
    const recordedType = typeOverride ?? type;
    recordSession({ name: title, score, isScored, minutes, moduleId, exerciseId, type: recordedType, detail: `${recordedType} \u00b7 ${minutes} min` });
  };

  const completeAndReturn = () => {
    record(undefined, false);   // completion-only: no score, no skills update
    goNext();
  };

  const completeWithDebrief = (summary: SessionSummary) => {
    record(summary.score, true); // real scored session
    setDebrief(summary);
  };

  // Real Student Pilot, Ready For Radio and Airline Prep exercises (no isFoundationPlaceholder).
  // All use the shared block renderer (SpSessionScreen) via ExerciseContent.blockType.
  const isStudentPilot = /^(sp|rfr|ap|ao)-/.test(exerciseId ?? "") && !content?.isFoundationPlaceholder;

  let body: React.ReactNode;
  if (debrief !== null) {
    body = (
      <DebriefView
        title={title}
        summary={debrief}
        isMission={screen === "mission"}
        recommended={nextExercise?.title ?? (found ? found.module.name : "Continue training")}
        onDone={goNext}
        onRetry={() => {
          setDebrief(null);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  } else if (isStudentPilot && content) {
    // Student Pilot Batch 3: route to the dedicated SP session renderer.
    body = (
      <SpSessionScreen
        key={retryKey}
        title={title}
        content={content}
        exerciseId={exerciseId}
        exerciseIndex={found?.index}
        exerciseTotal={found?.topic?.exercises.length ?? found?.module.exercises.length}
        onComplete={(score) => {
          if (score !== undefined) {
            record(score, true);
            goNext();
          } else {
            completeAndReturn();
          }
        }}
      />
    );
  } else if (content?.isFoundationPlaceholder) {
    // Foundation placeholder for SP modules not yet implemented.
    body = (
      <StudentPilotFoundationScreen
        title={title}
        content={content}
        moduleName={found?.module.name}
        topicName={found?.topic?.name}
        onClose={close}
      />
    );
  } else if (isAlphabet) {
    body = <AlphabetTrainer key={retryKey} title={title} content={content} onComplete={completeAndReturn} />;
  } else if (isNumbers) {
    body = <NumbersTrainer key={retryKey} title={title} content={content} onComplete={completeAndReturn} />;
  } else if (isDemo) {
    body = <InteractiveFrequencyDemo key={retryKey} title={title} content={content} onComplete={completeAndReturn} />;
  } else if (isChallenge) {
    body = <ChallengeFlowScreen key={retryKey} title={title} content={content} icao={icao} numbers={numbers} callsigns={callsigns} acknowledgements={acknowledgements} stationSelection={stationSelection} basicRequests={basicRequests} frequencyChanges={frequencyChanges} clarificationCorrection={clarificationCorrection} firstContactPractice={firstContactPractice} exerciseId={exerciseId} onComplete={completeWithDebrief} />;
  } else {
    switch (screen) {
      case "lesson":
        body = <LessonScreen key={retryKey} title={title} content={content} description={description} callsigns={callsigns} frequencies={frequencies} acknowledgements={acknowledgements} clarificationCorrection={clarificationCorrection} stationSelection={stationSelection} the4Ws={the4Ws} contactVsMonitor={contactVsMonitor} radioCheckLesson={radioCheckLesson} atisQnhLesson={atisQnhLesson} onComplete={completeAndReturn} />;
        break;
      case "listening":
        body = <ListeningScreen key={retryKey} title={title} content={content} icao={icao} numbers={numbers} callsigns={callsigns} frequencies={frequencies} stationSelection={stationSelection} exerciseId={exerciseId} onComplete={(score) => { if (score !== undefined) { record(score, true); goNext(); } else { completeAndReturn(); } }} />;
        break;
      case "speaking":
        body = isVoiceAlphaExercise(exerciseId)
          ? (
            <VoiceSpeakingScreen
              key={retryKey}
              title={title}
              content={content}
              onComplete={(score) => {
                if (score !== undefined) {
                  record(score, true);
                  goNext();
                } else {
                  completeAndReturn();
                }
              }}
            />
          )
          : <SpeakingScreen key={retryKey} title={title} content={content} icao={icao} frequencies={frequencies} stationSelection={stationSelection} onComplete={completeAndReturn} />;
        break;
      case "readback":
        body = isVoiceAlphaExercise(exerciseId)
          ? (
            <VoiceSpeakingScreen
              key={retryKey}
              title={title}
              content={content}
              onComplete={(score) => {
                if (score !== undefined) {
                  record(score, true);
                  goNext();
                } else {
                  completeAndReturn();
                }
              }}
            />
          )
          : <ReadbackScreen key={retryKey} title={title} content={content} numbers={numbers} frequencies={frequencies} cadetReadbacks={cadetReadbacks} frequencyChanges={frequencyChanges} onComplete={completeAndReturn} />;
        break;
      case "phraseology":
        body = <PhraseologyScreen key={retryKey} title={title} content={content} buildTheCall={buildTheCall} basicRequests={basicRequests} frequencyChanges={frequencyChanges} cadetPhraseology={cadetPhraseology} firstContactPractice={firstContactPractice} exerciseId={exerciseId} onComplete={(score) => { if (score !== undefined) { record(score, true); goNext(); } else { completeAndReturn(); } }} />;
        break;
      case "scenario":
        body = cadetScenarios
          ? (
            <ScenarioChatScreen
              key={retryKey}
              title={title}
              content={content}
              groupName={found?.topic?.name ?? "Scenario"}
              onComplete={(score) => {
                if (score !== undefined) {
                  record(score, true);
                  goNext();
                } else {
                  completeAndReturn();
                }
              }}
            />
          )
          : <FlowScreen key={retryKey} title={title} content={content} onComplete={completeAndReturn} />;
        break;
      case "mission":
        body = <FlowScreen key={retryKey} title={title} content={content} isMission onComplete={completeAndReturn} />;
        break;
    }
  }

  // Sections with a mini-lesson show it first (Start button), then the drill - without affecting scoring.
  if (debrief === null && content?.intro) {
    body = (
      <IntroGate key={`intro-${retryKey}`} intro={content.intro} title={title}>
        {body}
      </IntroGate>
    );
  }

  return (
    <main className="train-session flex h-dvh flex-col overflow-hidden bg-[#07111F] px-6 pb-safe pt-6 text-white">
      <div className={`flex min-h-0 w-full flex-1 flex-col lg:mx-auto ${desktopMaxWidthClass(screen)}`}>
        <TopBar label={type} onClose={close} />
        {body}
      </div>
    </main>
  );
}

function SessionGate() {
  const params = useSearchParams();
  // Remount the whole session when the exercise changes so all step state resets cleanly.
  const key = params.get("exerciseId") ?? params.get("type") ?? "session";
  return <SessionInner key={key} />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#07111F]" />}>
      <SessionGate />
    </Suspense>
  );
}
