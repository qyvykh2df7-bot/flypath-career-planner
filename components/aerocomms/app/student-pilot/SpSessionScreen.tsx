"use client";

/**
 * AeroComms — Student Pilot session renderer (Batch 3).
 *
 * Block types handled:
 *   visual-briefing      → SpVisualBriefing  (panel position: above or below text)
 *   key-calls            → SpKeyCallsLesson
 *   visual-interpretation → SpChoiceScreen
 *   decision-point       → SpChoiceScreen
 *   listening-choice     → SpListeningChoice  (NEW)
 *   fill-in-the-blanks   → SpFillInTheBlanks  (NEW)
 *   data-extraction      → SpDataExtraction   (NEW)
 *   listening-readback   → SpListeningReadback
 *   speak-in-context     → SpSpeakInContext
 *   section-scenario     → SpSectionScenario
 *   checkpoint           → SpCheckpoint
 */

import React, { useEffect, useRef, useState } from "react";
import type {
  ExerciseContent,
  SpAtisInfo,
  SpClearanceInfo,
  SpClearanceRound,
  SpClearanceSection,
  SpClearanceSegment,
  SpReadbackRound,
  SpReadbackSection,
  SpCheckpointQuestion,
  SpDataExtractionData,
  SpDataExtractionSection,
  SpFillBlankData,
  SpFillBlankSection,
  SpListeningChoiceData,
  SpListeningMultiData,
  SpListeningMultiQuestion,
  SpOption,
  SpScenarioStep,
} from "@/lib/aerocomms/content";
import { AtisAndClearancePanel } from "./visuals/AtisAndClearancePanel";
import { BrindaleAerodromeChart } from "./visuals/BrindaleAerodromeChart";
import { CircuitDiagram } from "./visuals/CircuitDiagram";
import type { CircuitDiagramProps } from "./visuals/CircuitDiagram";
import type { ChartCropId } from "@/lib/aerocomms/brindaleChartV3";
import { SpLessonShell } from "./SpLessonShell";
import { SpListeningShell } from "./SpListeningShell";
import { VoiceRecorder } from "../voice/VoiceRecorder";
import { evaluatePhraseAnswer } from "@/lib/aerocomms/voice/evaluation";
import { getMaxDurationMsForExercise } from "@/lib/aerocomms/voice/sttMode";
import type { SttResult, VoiceEvaluationResult, VoiceUiState } from "@/lib/aerocomms/voice/types";
import { speak as speakServerFirst, stopSpeaking } from "@/lib/aerocomms/voice/voiceProvider";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

// Tracks the TTS profile for whichever exercise SpSessionScreen currently has
// mounted, so the shared speak() helper below (and the PlayButton it powers)
// can resolve the right voice without threading a prop through every one of
// its ~11 call sites. Set once per render in SpSessionScreen — safe because
// only one exercise screen is ever visible/interactive at a time. See
// resolveSpTtsProfileId for the exact Train-level → profile mapping.
let activeSpProfileId = "standard-atc";

/**
 * Resolves the TTS profile for a Student Pilot / Ready For Radio / Airline Prep /
 * Advanced Ops exercise. Falls back to "standard-atc" whenever unsure, per the
 * TTS Profiles v1 mapping:
 *   - ATIS-related content (any level)        -> atis-robot
 *   - Airline Prep (ap-*) / Advanced Ops (ao-*) -> fast-atc
 *   - Ready For Radio (rfr-*) high-workload module's listening/readback -> fast-atc
 *   - Ready For Radio (rfr-*) otherwise         -> standard-atc
 *   - Student Pilot (sp-*) / unrecognized       -> standard-atc
 */
function resolveSpTtsProfileId(exerciseId: string | undefined, content: ExerciseContent): string {
  const id = exerciseId ?? "";

  if (id.includes("atis") || content.spVisualMode === "atis") return "atis-robot";
  if (id.startsWith("ap-") || id.startsWith("ao-")) return "fast-atc";

  if (id.startsWith("rfr-")) {
    const isHighWorkloadModule = id.startsWith("rfr-workload.");
    const isListeningOrReadback =
      content.blockType === "clearance-construction" ||
      content.blockType === "readback-construction" ||
      content.blockType === "listening-choice";
    return isHighWorkloadModule && isListeningOrReadback ? "fast-atc" : "standard-atc";
  }

  return "standard-atc";
}

/** Prefers backend TTS (OpenAI, via the resolved profile) and falls back to browser speechSynthesis automatically. */
function speak(text: string) {
  void speakServerFirst(text, { profileId: activeSpProfileId });
}

/** Dark premium card. */
function SpCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-[#0B1322] p-4 ${className}`}>
      {children}
    </div>
  );
}

/** Prominent call/phrase chip. */
function CallChip({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] px-3.5 py-2.5 font-mono text-[14px] leading-relaxed text-slate-200">
      {text}
    </div>
  );
}

/** Green continue button. */
function ContinueButton({ onContinue, label = "Continue" }: { onContinue: () => void; label?: string }) {
  // lg:sticky — several SP blocks scroll the whole column with this button
  // in-flow; on short desktop viewports it pins to the visible bottom edge so
  // the primary action never needs scrolling. No-op on mobile and when the
  // content already fits.
  return (
    <button
      onClick={() => onContinue()}
      className="w-full rounded-2xl bg-[#FACC15] py-3.5 text-[16px] font-bold text-[#07111F] active:opacity-80 lg:sticky lg:bottom-0 lg:z-10"
    >
      {label}
    </button>
  );
}

/** Small inline play button — used inside lesson/readback cards. */
function PlayButton({ text, spoken, green = false }: { text: string; spoken?: string; green?: boolean }) {
  const [active, setActive] = useState(false);
  const idleClass = green
    ? "border-[#FACC15] bg-[#FACC15] text-[#07111F] hover:opacity-90 active:opacity-80"
    : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-200";
  return (
    <button
      onClick={() => {
        speak(spoken ?? text);
        setActive(true);
        setTimeout(() => setActive(false), 1800);
      }}
      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? "border-[#FACC15]/50 bg-[#FACC15]/10 text-[#FACC15]"
          : idleClass
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
      </svg>
      {active ? "Playing…" : "Play"}
    </button>
  );
}

/** Phases that use the approved green ATC Play button in Student Pilot. */
function spAtcPlayGreen(phase?: ExerciseContent["phase"]): boolean {
  return (
    phase === "taxi" ||
    phase === "takeoff" ||
    phase === "circuit" ||
    phase === "parking" ||
    phase === "arrival" ||
    phase === "landing" ||
    phase === "cross-country" ||
    phase === "airspace" ||
    phase === "unfamiliar" ||
    phase === "workload" ||
    phase === "problem-solving" ||
    phase === "ifr-clearance" ||
    phase === "sid-departure" ||
    phase === "enroute-ifr" ||
    phase === "star-descent" ||
    phase === "holding" ||
    phase === "approach-vectoring" ||
    phase === "missed-approach" ||
    phase === "weather-deviation" ||
    phase === "diversion" ||
    phase === "pan-pan" ||
    phase === "mayday" ||
    phase === "high-workload" ||
    phase === "difficult-radio" ||
    phase === "unexpected-event"
  );
}

// LargePlayButton has been replaced by SpListeningShell's internal SpCircularPlayButton.

/**
 * Compact Brindale chart crop shown as visual support inside taxi lessons,
 * decision-point exercises and the conversation mission. Reference only —
 * never interactive. Unknown crop ids fall back to the full chart.
 */
function SpChartCropPanel({
  crop,
  compact = false,
  className = "",
}: {
  crop?: string;
  compact?: boolean;
  className?: string;
}) {
  if (!crop) return null;
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-[#16243A] ${className}`}
      style={{ height: compact ? "clamp(120px, 20dvh, 160px)" : "clamp(180px, 30dvh, 240px)" }}
    >
      <BrindaleAerodromeChart
        crop={crop as ChartCropId}
        showLabels
        className="h-full w-full rounded-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      />
    </div>
  );
}

/** Circuit schematic shown inside Circuit Operations lessons. Visual support only. */
function SpCircuitDiagramPanel({
  variant,
  className = "",
}: {
  variant?: "overview" | "upwind-crosswind" | "downwind" | "base-final" | "extend-orbit";
  className?: string;
}) {
  if (!variant) return null;

  const props: CircuitDiagramProps = (() => {
    switch (variant) {
      case "upwind-crosswind":
        return {
          runway: "36",
          highlightedLeg: "crosswind",
          activeLeg: "upwind",
          showDirectionArrows: true,
          hiddenEntityIds: ["downwind-label", "base-label", "final-label"],
        };
      case "downwind":
        return {
          runway: "36",
          highlightedLeg: "downwind",
          showDirectionArrows: true,
          aircraft: [{ id: "ownship", leg: "downwind", legProgress: 0.5, isOwnShip: true }],
          hiddenEntityIds: ["upwind-label", "crosswind-label", "base-label", "final-label"],
        };
      case "base-final":
        return {
          runway: "36",
          highlightedLeg: "final",
          activeLeg: "base",
          showDirectionArrows: true,
          hiddenEntityIds: ["upwind-label", "crosswind-label", "downwind-label"],
        };
      case "extend-orbit":
        return {
          runway: "36",
          highlightedLeg: "downwind",
          showExtendPath: true,
          showOrbitMarker: true,
          showDirectionArrows: true,
          aircraft: [{ id: "ownship", leg: "downwind", legProgress: 0.55, isOwnShip: true }],
        };
      case "overview":
      default:
        return {
          runway: "36",
          showDirectionArrows: true,
        };
    }
  })();

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07111F] p-2 ${className}`}
    >
      <CircuitDiagram {...props} />
    </div>
  );
}

/** Builds AtisAndClearancePanel-compatible props. */
function toAtisInfo(a: SpAtisInfo) {
  return { informationLetter: a.informationLetter, runwayInUse: a.runwayInUse, wind: a.wind, qnh: a.qnh, visibility: a.visibility, tempDewpoint: a.tempDewpoint };
}
function toClearanceInfo(c: SpClearanceInfo) {
  return { callsign: c.callsign, runway: c.runway, squawk: c.squawk, departureDirection: c.departureDirection, altitudeRestriction: c.altitudeRestriction, frequency: c.frequency, frequencyLabel: c.frequencyLabel };
}

/** Visual panel used inside exercises (ATIS, clearance, or combined). */
function SpVisualPanel({
  mode,
  atis,
  clearance,
  highlighted,
  accent,
}: {
  mode: NonNullable<ExerciseContent["spVisualMode"]>;
  atis?: SpAtisInfo;
  clearance?: SpClearanceInfo;
  highlighted?: string[];
  /** Add a green accent ring (used on lesson example panels). */
  accent?: boolean;
}) {
  const accentClass = accent ? "ring-1 ring-[#FACC15]/30 rounded-2xl" : "";
  if (mode === "none") return null;
  if (mode === "atis" && atis) {
    return (
      <div className={accentClass}>
        <AtisAndClearancePanel mode="atis" atis={toAtisInfo(atis)} activeFields={highlighted} className="w-full" />
      </div>
    );
  }
  if (mode === "clearance" && clearance) {
    return (
      <div className={accentClass}>
        <AtisAndClearancePanel mode="clearance" clearance={toClearanceInfo(clearance)} activeFields={highlighted} className="w-full" />
      </div>
    );
  }
  if (mode === "combined" && atis && clearance) {
    return (
      <div className={accentClass}>
        <AtisAndClearancePanel mode="combined" atis={toAtisInfo(atis)} clearance={toClearanceInfo(clearance)} activeFields={highlighted} className="w-full" />
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Block renderers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Enlarged ATIS display panel for the "Reading ATIS at Brindale" lesson.
 * Uses larger fonts and more row spacing than the shared AtisAndClearancePanel
 * so it reads as the primary worked example on the lesson screen.
 * Isolated to this file — does not affect shared components or Departure Clearance.
 */
function LessonAtisPanel({
  atis,
  highlighted = [],
}: {
  atis: SpAtisInfo;
  highlighted?: string[];
}) {
  const isActive = (key: string) => highlighted.includes(key);
  const rows = [
    { key: "runwayInUse", label: "RWY in use", value: atis.runwayInUse },
    { key: "wind",        label: "Wind",        value: atis.wind        },
    { key: "qnh",         label: "QNH",         value: `${atis.qnh} hPa` },
    { key: "visibility",  label: "Visibility",  value: atis.visibility  },
    ...(atis.tempDewpoint
      ? [{ key: "tempDewpoint", label: "Temp / Dew", value: atis.tempDewpoint }]
      : []),
  ];

  return (
    <div className="relative rounded-2xl border border-white/[0.07] bg-[#08141F] px-5 py-4 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)]">
      {/* Scanline texture */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(255,255,255,0.5)0px,rgba(255,255,255,0.5)1px,transparent 1px,transparent 3px)",
        }}
      />
      {/* Panel header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Brindale ATIS
        </span>
        <span className="rounded bg-[#38BDF8]/10 px-2.5 py-0.5 font-mono text-[12px] font-bold text-[#38BDF8] ring-1 ring-[#38BDF8]/25">
          INFO {atis.informationLetter}
        </span>
      </div>
      <div className="mb-2 h-px bg-white/[0.06]" />
      {/* Field rows — larger labels (12 px) and values (16 px) */}
      {rows.map(({ key, label, value }) => (
        <div key={key} className="flex items-baseline justify-between gap-3 py-1.5">
          <span className="shrink-0 font-mono text-[12px] uppercase tracking-wider text-slate-500">
            {label}
          </span>
          <span
            className={`text-right font-mono text-[16px] font-semibold leading-snug ${
              isActive(key) ? "text-[#FACC15]" : "text-slate-200"
            }`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Enlarged departure clearance panel for the "Your Departure Clearance" lesson.
 * Mirrors LessonAtisPanel's typography scale (labels 12 px, values 16 px) with
 * a green accent for the callsign badge to match AeroComms clearance styling.
 * Isolated to this file — does not affect shared components or ATIS.
 */
function LessonClearancePanel({
  clearance,
  highlighted = [],
}: {
  clearance: SpClearanceInfo;
  highlighted?: string[];
}) {
  const isActive = (key: string) => highlighted.includes(key);
  const rows = [
    ...(clearance.runway
      ? [{ key: "runway", label: "Runway", value: clearance.runway }]
      : []),
    { key: "departureDirection", label: "Depart",    value: clearance.departureDirection  },
    { key: "altitudeRestriction",label: "Altitude",  value: clearance.altitudeRestriction },
    { key: "squawk",             label: "Squawk",    value: clearance.squawk              },
    ...(clearance.frequency
      ? [{ key: "frequency", label: clearance.frequencyLabel ?? "TWR Freq", value: clearance.frequency }]
      : []),
  ];

  return (
    <div className="relative rounded-2xl border border-white/[0.07] bg-[#08141F] px-4 py-3 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)]">
      {/* Scanline texture */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(255,255,255,0.5)0px,rgba(255,255,255,0.5)1px,transparent 1px,transparent 3px)",
        }}
      />
      {/* Panel header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Local VFR Clearance
        </span>
        <span className="rounded bg-[#FACC15]/10 px-2.5 py-0.5 font-mono text-[12px] font-bold text-[#FACC15] ring-1 ring-[#FACC15]/25">
          {clearance.callsign}
        </span>
      </div>
      <div className="mb-1.5 h-px bg-white/[0.06]" />
      {/* Field rows — labels 12 px, values 16 px */}
      {rows.map(({ key, label, value }) => (
        <div key={key} className="flex items-baseline justify-between gap-3 py-1">
          <span className="shrink-0 font-mono text-[12px] uppercase tracking-wider text-slate-500">
            {label}
          </span>
          <span
            className={`text-right font-mono text-[16px] font-semibold leading-snug ${
              isActive(key) ? "text-[#FACC15]" : "text-slate-200"
            }`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Visual Briefing — lesson screen using SpLessonShell for consistent visual hierarchy.
 *
 * spVisualPanelPosition:
 *   "below" (ATIS / Departure Clearance lesson) → explanation above, enlarged panel below.
 *   "above" (default) → panel provides context; shown above the compact explanation card.
 */
function SpVisualBriefing({
  title,
  content,
  onComplete,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const panelBelow = content.spVisualPanelPosition === "below";
  const isClearanceLesson = !!content.spClearanceInfo && !content.spAtisInfo;
  const paragraphs = (content.lessonBody ?? content.instruction ?? "").split("\n");
  const examples = content.examples ?? [];
  const hasPanel = content.spVisualMode && content.spVisualMode !== "none";

  const panel = hasPanel ? (
    <SpVisualPanel
      mode={content.spVisualMode!}
      atis={content.spAtisInfo}
      clearance={content.spClearanceInfo}
      highlighted={content.spHighlightedFields}
    />
  ) : null;

  const explanationNode = (
    <div className={isClearanceLesson ? "space-y-1" : "space-y-1.5"}>
      {paragraphs.map((p, i) =>
        p === "" ? (
          <div key={i} className={isClearanceLesson ? "h-0.5" : "h-1"} />
        ) : (
          <p key={i} className={`text-[14px] text-slate-300 ${isClearanceLesson ? "leading-snug" : "leading-relaxed"}`}>{p}</p>
        )
      )}
      {examples.length > 0 && (
        <div className="mt-3.5 space-y-2 border-t border-white/[0.06] pt-3">
          {examples.map((ex, i) => <CallChip key={i} text={ex} />)}
        </div>
      )}
    </div>
  );

  // Panel below: explanation first, then enlarged example panel.
  if (panelBelow) {
    // Prefer dedicated enlarged panels over the shared SpVisualPanel.
    const isClearance = !!content.spClearanceInfo && !content.spAtisInfo;
    const lessonExample = content.spAtisInfo
      ? <LessonAtisPanel atis={content.spAtisInfo} highlighted={content.spHighlightedFields} />
      : isClearance
        ? <LessonClearancePanel clearance={content.spClearanceInfo!} highlighted={content.spHighlightedFields} />
        : (panel ?? undefined);
    const exLabel = isClearance ? "Example clearance" : "Example ATIS";

    return (
      <SpLessonShell
        title={title}
        explanation={explanationNode}
        example={lessonExample}
        exampleLabel={exLabel}
        compact={isClearance}
        onContinue={onComplete}
      />
    );
  }

  // Panel above (default): clearance/context panels — type label + title + panel + explanation.
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#FACC15]">Lesson</p>
      <h1 className="mb-4 text-[22px] font-bold leading-tight tracking-tight text-slate-50">{title}</h1>
      {panel && <div className="mb-4">{panel}</div>}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0B1322] px-4 py-3.5">
        {explanationNode}
      </div>
      <div className="mt-auto pt-5">
        <ContinueButton onContinue={onComplete} />
      </div>
    </div>
  );
}

/** Key Calls — lesson with call structure breakdown. */
function SpKeyCallsLesson({
  title,
  content,
  onComplete,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const paragraphs = (content.lessonBody ?? "").split("\n");
  const examples = content.examples ?? [];
  const hasPanel = content.spVisualMode && content.spVisualMode !== "none";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
      {hasPanel && (
        <SpVisualPanel
          mode={content.spVisualMode!}
          atis={content.spAtisInfo}
          clearance={content.spClearanceInfo}
          highlighted={content.spHighlightedFields}
        />
      )}
      <SpCard>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">Key Calls</div>
        <h2 className="text-[15px] font-bold text-slate-100">{title}</h2>
        <div className="mt-2.5 space-y-1.5">
          {paragraphs.map((p, i) =>
            p === "" ? (
              <div key={i} className="h-1" />
            ) : (
              <p key={i} className={`text-[13.5px] leading-relaxed ${p.startsWith("  ") ? "font-mono text-slate-200 pl-1" : "text-slate-300"}`}>
                {p}
              </p>
            )
          )}
        </div>
      </SpCard>
      {examples.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Expected call</p>
          <div className="space-y-2">{examples.map((ex, i) => <CallChip key={i} text={ex} />)}</div>
        </div>
      )}
      <ContinueButton onContinue={onComplete} />
    </div>
  );
}

/** Choice screen — visual-interpretation and decision-point. */
function SpChoiceScreen({
  title,
  content,
  onComplete,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: (score?: number) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(!content.spAtcHidden);
  const options: SpOption[] = content.spOptions ?? [];
  const correctId = content.spCorrectOptionId;
  const displayTitle = title.includes(" · ") ? title.split(" · ").pop()! : title;
  const questionText = content.spQuestion ?? (content.spScreenKicker ? "" : content.instruction ?? "");
  const showOriginalFirst = content.spShownReadbackLabel === "Original clearance";

  const originalClearanceCard = content.spShownReadback ? (
    <SpCard>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {content.spShownReadbackLabel ?? "Pilot read back"}
      </p>
      <p className="text-[13.5px] leading-relaxed text-slate-200">&ldquo;{content.spShownReadback}&rdquo;</p>
    </SpCard>
  ) : null;

  const pilotReadbackCard = content.spShownReadback ? (
    <SpCard className="border-amber-400/20 bg-amber-400/[0.04]">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
        {content.spShownReadbackLabel ?? "Pilot read back"}
      </p>
      <p className="text-[13.5px] leading-relaxed text-slate-200">&ldquo;{content.spShownReadback}&rdquo;</p>
    </SpCard>
  ) : null;

  const atcCard = content.spAtcDisplay ? (
    <SpCard>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {content.spAtcLabel ?? "ATC instruction"}
      </p>
      {revealed ? (
        <p className="text-[14px] font-medium leading-relaxed text-slate-100">&ldquo;{content.spAtcDisplay}&rdquo;</p>
      ) : (
        <p className="font-mono text-base tracking-widest text-slate-600 select-none">{"•••• •• ••• •••••••"}</p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <PlayButton text={content.spAtcDisplay} spoken={content.spAtcSpoken} green={spAtcPlayGreen(content.phase)} />
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
    </SpCard>
  ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <div className="flex flex-col gap-4">
          {content.spScreenKicker && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#FACC15]">
                {content.spScreenKicker}
              </p>
              <h1 className="mb-1 text-[22px] font-bold leading-tight tracking-tight text-slate-50">
                {displayTitle}
              </h1>
              {content.instruction && (
                <p className="mb-1 text-[14px] leading-snug text-slate-200">{content.instruction}</p>
              )}
            </>
          )}

          <SpChartCropPanel crop={content.spChartCrop} />

          {showOriginalFirst ? originalClearanceCard : null}
          {atcCard}
          {!showOriginalFirst ? pilotReadbackCard : null}

          {content.spVisualMode && content.spVisualMode !== "none" && (
            <SpVisualPanel
              mode={content.spVisualMode}
              atis={content.spAtisInfo}
              clearance={content.spClearanceInfo}
              highlighted={checked ? content.spHighlightedFields : []}
            />
          )}
          {questionText && (
            <SpCard>
              <p className="text-[16px] font-semibold leading-snug text-slate-100">{questionText}</p>
            </SpCard>
          )}
          <div className="space-y-2.5">
            {options.map((opt) => {
              const isSel = selected === opt.id;
              const isCorrect = opt.id === correctId;
              let border = "border-white/10", bg = "bg-white/[0.03]", text = "text-white";
              if (checked && isSel && isCorrect) { border = "border-[#FACC15]/50"; bg = "bg-[#FACC15]/[0.08]"; text = "text-[#FACC15]"; }
              else if (checked && isSel && !isCorrect) { border = "border-amber-400/40"; bg = "bg-amber-400/[0.06]"; text = "text-amber-300"; }
              else if (checked && isCorrect) { border = "border-[#FACC15]/30"; bg = "bg-[#FACC15]/[0.04]"; }
              else if (!checked && isSel) { border = "border-white/25"; bg = "bg-white/[0.06]"; text = "text-white"; }
              return (
                <button
                  key={opt.id}
                  disabled={checked}
                  onClick={() => setSelected(opt.id)}
                  className={`flex min-h-[56px] w-full items-center justify-center rounded-2xl border ${border} ${bg} px-4 py-3.5 text-center transition-colors active:opacity-80`}
                >
                  <div className="w-full">
                    <p className={`text-base font-semibold leading-snug ${text}`}>{opt.text}</p>
                    {checked && isSel && opt.feedback && (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{opt.feedback}</p>
                    )}
                    {checked && !isSel && isCorrect && (
                      <p className="mt-1 text-[11px] text-[#FACC15]">✓ Correct answer</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] pt-3 pb-1">
        {!checked ? (
          <button
            type="button"
            disabled={selected === null}
            onClick={() => setChecked(true)}
            className={`w-full rounded-2xl py-3.5 text-[15px] font-bold transition-colors ${
              selected === null
                ? "cursor-not-allowed bg-white/[0.05] text-slate-500"
                : "bg-[#FACC15] text-[#07111F] active:opacity-80"
            }`}
          >
            Check
          </button>
        ) : (
          <ContinueButton
            onContinue={() => onComplete(correctId !== undefined ? (selected === correctId ? 100 : 0) : undefined)}
          />
        )}
      </div>
    </div>
  );
}

/** Listening & Readback — plays ATC transmission, student confirms readback chips. */
function SpListeningReadback({
  content,
  onComplete,
}: {
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const transmissions = content.transmissions ?? [];
  const atcTx = transmissions.find((t) => t.speaker === "atc");
  const userTx = transmissions.find((t) => t.speaker === "user");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
      {content.spVisualMode && content.spVisualMode !== "none" && (
        <SpVisualPanel mode={content.spVisualMode} atis={content.spAtisInfo} clearance={content.spClearanceInfo} highlighted={content.spHighlightedFields} />
      )}
      <SpCard>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">ATC says</p>
        <p className="text-[14px] font-medium leading-relaxed text-slate-100">{atcTx?.text}</p>
        <div className="mt-3">
          <PlayButton text={atcTx?.text ?? ""} spoken={atcTx?.textSpoken} />
        </div>
      </SpCard>
      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">Your readback</p>
        {userTx?.prompt && <p className="mb-2 text-[12px] text-slate-400">{userTx.prompt}</p>}
        {!confirmed ? (
          <button onClick={() => setConfirmed(true)} className="w-full rounded-2xl border border-white/10 bg-[#0B1322] p-3.5 text-left">
            <p className="text-[13.5px] leading-relaxed text-slate-300">{userTx?.expected ?? "Tap to confirm readback"}</p>
            <p className="mt-1 text-[11px] text-slate-500">Tap to confirm</p>
          </button>
        ) : (
          <SpCard className="border-[#FACC15]/25 bg-[#FACC15]/[0.06]">
            <p className="text-[13.5px] font-medium leading-relaxed text-slate-100">{userTx?.expected}</p>
            <p className="mt-1 text-[11px] font-bold text-[#FACC15]">✓ Readback confirmed</p>
          </SpCard>
        )}
      </div>
      {confirmed && <ContinueButton onContinue={onComplete} />}
    </div>
  );
}

/** Speak in Context — situation + structure hints + simulated speaking. */
function SpSpeakInContext({
  content,
  onComplete,
}: {
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
      {content.spVisualMode && content.spVisualMode !== "none" && (
        <SpVisualPanel mode={content.spVisualMode} atis={content.spAtisInfo} clearance={content.spClearanceInfo} highlighted={content.spHighlightedFields} />
      )}
      <SpCard>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Situation</p>
        <p className="text-[14px] leading-relaxed text-slate-200">{content.spCallContext}</p>
      </SpCard>
      {content.spCallHints && content.spCallHints.length > 0 && (
        <SpCard>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Structure</p>
          <div className="space-y-1.5">
            {content.spCallHints.map((hint, i) => (
              <p key={i} className="text-[13px] text-slate-300">
                <span className="mr-2 font-bold text-slate-500">{i + 1}.</span>{hint}
              </p>
            ))}
          </div>
        </SpCard>
      )}
      {!revealed ? (
        <button onClick={() => { speak(content.spExpectedCallSpoken ?? content.spExpectedCall ?? ""); setRevealed(true); }}
          className="w-full rounded-2xl bg-[#1E3A5F] py-3.5 text-[15px] font-bold text-[#38BDF8] ring-1 ring-[#38BDF8]/20 active:opacity-80">
          Speak
        </button>
      ) : (
        <SpCard className="border-[#FACC15]/25 bg-[#FACC15]/[0.06]">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FACC15]">Expected call</p>
          <p className="font-mono text-[14px] leading-relaxed text-slate-100">{content.spExpectedCall}</p>
          <div className="mt-3 flex items-center gap-2">
            <PlayButton text={content.spExpectedCall ?? ""} spoken={content.spExpectedCallSpoken} />
            <span className="text-[11px] text-slate-500">Listen to the call</span>
          </div>
        </SpCard>
      )}
      {revealed && <ContinueButton onContinue={onComplete} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New listening renderers (ATIS topic)                                */
/* ------------------------------------------------------------------ */

/**
 * Renders a single question's answer options inside a SpListeningShell.
 * Used by both SpListeningChoice (one question) and SpListeningMulti (two+ questions).
 */
function ListeningOptions({
  question,
  selected,
  checked,
  onSelect,
}: {
  question: Pick<SpListeningMultiQuestion, "prompt" | "options" | "correctOptionId">;
  selected: string | null;
  checked: boolean;
  onSelect: (id: string) => void;
}) {
  const correctId = question.correctOptionId;
  return (
    <>
      {/* Question card — 16 px text, high contrast */}
      <SpCard>
        <p className="text-[16px] font-semibold leading-snug text-white">{question.prompt}</p>
      </SpCard>

      {/* Answer options — 16 px, white, centered */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSel = selected === opt.id;
          const isCorr = opt.id === correctId;
          let border = "border-white/10";
          let bg = "bg-white/[0.03]";
          let textClass = "text-white";
          if (!checked && isSel) {
            border = "border-[#38BDF8]/40"; bg = "bg-[#38BDF8]/[0.08]"; textClass = "text-[#38BDF8]";
          } else if (checked && isSel && isCorr) {
            border = "border-[#FACC15]/50"; bg = "bg-[#FACC15]/[0.08]"; textClass = "text-[#FACC15]";
          } else if (checked && isSel && !isCorr) {
            border = "border-amber-400/40"; bg = "bg-amber-400/[0.06]"; textClass = "text-amber-300";
          } else if (checked && isCorr) {
            border = "border-[#FACC15]/30"; bg = "bg-[#FACC15]/[0.04]"; textClass = "text-[#FACC15]/70";
          }
          return (
            <button
              key={opt.id}
              disabled={checked}
              onClick={() => onSelect(opt.id)}
              className={`flex min-h-[56px] w-full items-center justify-center rounded-2xl border ${border} ${bg} px-4 text-center transition-colors active:opacity-80`}
            >
              <p className={`text-[16px] font-medium leading-snug ${textClass}`}>{opt.text}</p>
            </button>
          );
        })}
      </div>
    </>
  );
}

/**
 * Multi-question listening exercise.
 * Each question may have its own ATIS audio (per-question audioSpoken overrides
 * the parent-level audioSpoken when set). Shows "Question x of n" internally.
 */
function SpListeningMulti({
  title,
  data,
  onComplete,
  profileId,
}: {
  title: string;
  data: SpListeningMultiData;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const resultsRef = useRef<boolean[]>([]);

  const question = data.questions[qIdx];
  const total = data.questions.length;
  const isLast = qIdx === total - 1;
  const isCorrectAnswer = selected !== null && selected === question.correctOptionId;

  // Use per-question audio if set; fall back to shared parent-level audio.
  const questionAudio = question.audioSpoken ?? data.audioSpoken ?? "";

  const handleNext = () => {
    resultsRef.current = [...resultsRef.current, isCorrectAnswer];
    if (isLast) {
      const correctCount = resultsRef.current.filter(Boolean).length;
      onComplete(Math.round((correctCount / resultsRef.current.length) * 100));
    } else {
      setQIdx((i) => i + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  const feedbackNode = checked ? (
    <div className={`rounded-2xl border px-4 py-3 ${isCorrectAnswer ? "border-[#FACC15]/30 bg-[#FACC15]/[0.06]" : "border-amber-400/25 bg-amber-400/[0.05]"}`}>
      <p className={`text-[13px] font-semibold ${isCorrectAnswer ? "text-[#FACC15]" : "text-amber-300"}`}>
        {isCorrectAnswer
          ? "✓ Correct."
          : `Incorrect. ${question.options.find((o) => o.id === selected)?.feedback ?? ""}`}
      </p>
    </div>
  ) : undefined;

  return (
    <SpListeningShell
      title={title}
      instruction={`Question ${qIdx + 1} of ${total}`}
      audioSpoken={questionAudio}
      playLabel={data.playLabel ?? "Listen to the ATIS"}
      profileId={profileId}
      checkDisabled={selected === null}
      onCheck={() => setChecked(true)}
      feedbackNode={feedbackNode}
      showContinue={checked}
      onContinue={handleNext}
      continueLabel={isLast ? "Continue" : "Next Question"}
    >
      <ListeningOptions
        question={question}
        selected={selected}
        checked={checked}
        onSelect={(id) => { if (!checked) setSelected(id); }}
      />
    </SpListeningShell>
  );
}

/**
 * Listening Choice — circular Play button, question, one-column answers, Check step.
 * When spListeningMulti is present, delegates to SpListeningMulti (6 questions).
 * When spListeningChoice is present, renders a single-question exercise.
 * Uses SpListeningShell for consistent visual rhythm with Cadet.
 */
function SpListeningChoice({
  title,
  content,
  onComplete,
  profileId,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  const multiData: SpListeningMultiData | undefined = content.spListeningMulti;
  if (multiData) {
    return <SpListeningMulti title={title} data={multiData} onComplete={onComplete} profileId={profileId} />;
  }

  const data: SpListeningChoiceData | undefined = content.spListeningChoice;
  if (!data) return <div className="text-slate-400 p-4">No data for listening-choice exercise.</div>;

  return <SpSingleListeningChoice title={title} data={data} onComplete={onComplete} profileId={profileId} />;
}

function SpSingleListeningChoice({
  title,
  data,
  onComplete,
  profileId,
}: {
  title: string;
  data: SpListeningChoiceData;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const isCorrectAnswer = selected !== null && selected === data.correctOptionId;

  const feedbackNode = checked ? (
    <div className={`rounded-2xl border px-4 py-3 ${isCorrectAnswer ? "border-[#FACC15]/30 bg-[#FACC15]/[0.06]" : "border-amber-400/25 bg-amber-400/[0.05]"}`}>
      <p className={`text-[13px] font-semibold ${isCorrectAnswer ? "text-[#FACC15]" : "text-amber-300"}`}>
        {isCorrectAnswer
          ? "✓ Correct."
          : `Incorrect. ${data.options.find((o) => o.id === selected)?.feedback ?? ""}`}
      </p>
    </div>
  ) : undefined;

  return (
    <SpListeningShell
      title={title}
      instruction="Listen and select the correct answer."
      audioSpoken={data.audioSpoken}
      playLabel="Listen to the ATIS"
      profileId={profileId}
      checkDisabled={selected === null}
      onCheck={() => setChecked(true)}
      feedbackNode={feedbackNode}
      showContinue={checked}
      onContinue={() => onComplete(isCorrectAnswer ? 100 : 0)}
    >
      <ListeningOptions
        question={data}
        selected={selected}
        checked={checked}
        onSelect={(id) => { if (!checked) setSelected(id); }}
      />
    </SpListeningShell>
  );
}

/* ------------------------------------------------------------------ */
/* Fill-in-the-blanks                                                  */
/* ------------------------------------------------------------------ */

function BlankSlot({
  blankId,
  assignedTokenText,
  selectedToken,
  checked,
  isCorrect,
  onTap,
  onDragOver,
  onDrop,
}: {
  blankId: string;
  assignedTokenText: string | null;
  selectedToken: string | null;
  checked: boolean;
  isCorrect: boolean;
  onTap: (blankId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, blankId: string) => void;
}) {
  const filled = assignedTokenText !== null;
  const canReceive = !checked && selectedToken !== null;

  let border = filled ? "border-[#38BDF8]/40" : "border-dashed border-white/20";
  let bg = filled ? "bg-[#38BDF8]/[0.08]" : "bg-white/[0.03]";
  let text = "text-[#38BDF8]";

  if (checked && filled) {
    border = isCorrect ? "border-[#FACC15]/50" : "border-rose-400/50";
    bg = isCorrect ? "bg-[#FACC15]/[0.08]" : "bg-rose-400/[0.08]";
    text = isCorrect ? "text-[#FACC15]" : "text-rose-300";
  } else if (!checked && canReceive) {
    border = "border-[#FACC15]/40 border-dashed";
  }

  return (
    <button
      disabled={checked}
      onClick={() => onTap(blankId)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, blankId)}
      className={`inline-flex min-w-[60px] items-center justify-center rounded-lg border ${border} ${bg} px-2 py-0.5 text-center align-middle`}
    >
      <span className={`text-[16px] font-bold ${filled ? text : "text-slate-600"}`}>
        {filled ? assignedTokenText : "___"}
      </span>
    </button>
  );
}

function TokenChip({
  tokenId,
  text,
  used,
  selected,
  checked,
  onTap,
  onDragStart,
}: {
  tokenId: string;
  text: string;
  used: boolean;
  selected: boolean;
  checked: boolean;
  onTap: (tokenId: string) => void;
  onDragStart: (e: React.DragEvent, tokenId: string) => void;
}) {
  if (used) {
    return (
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 text-[16px] font-semibold text-slate-600 opacity-50">
        {text}
      </div>
    );
  }
  return (
    <button
      disabled={checked}
      draggable={!checked}
      onDragStart={(e) => onDragStart(e, tokenId)}
      onClick={() => onTap(tokenId)}
      className={`rounded-xl border px-3.5 py-2.5 text-[16px] font-semibold transition-colors active:opacity-80 ${
        selected
          ? "border-[#FACC15]/60 bg-[#FACC15]/[0.12] text-[#FACC15] ring-2 ring-[#FACC15]/30"
          : "border-white/15 bg-white/[0.06] text-slate-200 hover:border-white/25"
      }`}
    >
      {text}
    </button>
  );
}

/**
 * Single fill-in-the-blanks round — used by both the single-round and section renderers.
 * key={roundIdx} on this component resets all state between rounds.
 */
function SpFillInTheBlanksRound({
  question,
  questionNum,
  total,
  isLast,
  title,
  onComplete,
  profileId,
}: {
  question: SpFillBlankData;
  questionNum: number;
  total: number;
  isLast: boolean;
  title: string;
  /** Called with this round's real score (% of blanks filled correctly). */
  onComplete: (roundScore: number) => void;
  profileId: string;
}) {
  const data = question;
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const blankIds = data.segments.filter((s) => s.type === "blank").map((s) => s.blankId!);
  const usedTokenIds = new Set(Object.entries(assignments).filter(([, v]) => v !== null).map(([, v]) => v as string));
  const allFilled = blankIds.every((id) => assignments[id]);

  const getTokenText = (tid: string) => data.tokens.find((t) => t.id === tid)?.text ?? "";

  const handleTokenTap = (tokenId: string) => {
    if (checked) return;
    setSelectedToken((prev) => (prev === tokenId ? null : tokenId));
  };

  const handleBlankTap = (blankId: string) => {
    if (checked) return;
    if (selectedToken) {
      const newA = { ...assignments };
      // Return previously assigned token for this blank to pool
      for (const [bid, tid] of Object.entries(newA)) {
        if (tid === selectedToken) newA[bid] = null; // remove from other blanks
      }
      newA[blankId] = selectedToken;
      setAssignments(newA);
      setSelectedToken(null);
    } else if (assignments[blankId]) {
      // Tapping a filled blank with no selected token removes the token
      setAssignments((prev) => ({ ...prev, [blankId]: null }));
    }
  };

  const handleDragStart = (e: React.DragEvent, tokenId: string) => {
    e.dataTransfer.setData("tokenId", tokenId);
    setSelectedToken(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, blankId: string) => {
    e.preventDefault();
    const tokenId = e.dataTransfer.getData("tokenId");
    if (!tokenId) return;
    const newA = { ...assignments };
    for (const bid of Object.keys(newA)) {
      if (newA[bid] === tokenId) newA[bid] = null;
    }
    newA[blankId] = tokenId;
    setAssignments(newA);
  };

  // Render segments: split text on \n, render blank slots inline
  const renderSegments = () => {
    const lineGroups: React.ReactNode[][] = [[]];

    data.segments.forEach((seg, i) => {
      if (seg.type === "text") {
        const parts = (seg.text ?? "").split("\n");
        parts.forEach((part, pi) => {
          if (pi > 0) lineGroups.push([]);
          if (part) {
            lineGroups[lineGroups.length - 1].push(
              <span key={`t-${i}-${pi}`} className="text-slate-300">{part}</span>
            );
          }
        });
      } else if (seg.type === "blank" && seg.blankId) {
        const assignedId = assignments[seg.blankId] ?? null;
        const isCorrect = checked && assignments[seg.blankId] === data.correctAnswers[seg.blankId];
        lineGroups[lineGroups.length - 1].push(
          <BlankSlot
            key={`blank-${seg.blankId}`}
            blankId={seg.blankId}
            assignedTokenText={assignedId ? getTokenText(assignedId) : null}
            selectedToken={selectedToken}
            checked={checked}
            isCorrect={isCorrect}
            onTap={handleBlankTap}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        );
      }
    });

    return lineGroups.map((line, i) => (
      <div key={i} className="flex flex-wrap items-baseline gap-x-1 gap-y-2 leading-loose">
        {line}
      </div>
    ));
  };

  const allCorrect = checked && blankIds.every((id) => assignments[id] === data.correctAnswers[id]);
  const wrongCount = checked ? blankIds.filter((id) => assignments[id] !== data.correctAnswers[id]).length : 0;

  const feedbackNode = checked ? (
    <SpCard className={allCorrect ? "border-[#FACC15]/30 bg-[#FACC15]/[0.06]" : "border-amber-400/25 bg-amber-400/[0.05]"}>
      {allCorrect ? (
        <p className="text-[13px] font-semibold text-[#FACC15]">✓ All correct — great listening.</p>
      ) : (
        <p className="text-[13px] font-semibold text-amber-300">
          {wrongCount} answer{wrongCount > 1 ? "s" : ""} incorrect — highlighted above. Listen again and review.
        </p>
      )}
    </SpCard>
  ) : undefined;

  return (
    <SpListeningShell
      title={title}
      instruction={`Question ${questionNum} of ${total}`}
      audioSpoken={data.audioSpoken}
      playLabel="Listen to the ATIS"
      profileId={profileId}
      checkDisabled={!allFilled}
      onCheck={() => setChecked(true)}
      feedbackNode={feedbackNode}
      showContinue={checked}
      onContinue={() => onComplete(Math.round(((blankIds.length - wrongCount) / blankIds.length) * 100))}
      continueLabel={isLast ? "Continue" : "Next Question"}
    >
      {/* Transcript with blanks */}
      <SpCard>
        <div className="space-y-1 text-[16px]">{renderSegments()}</div>
      </SpCard>

      {/* Interaction hint */}
      {!checked && selectedToken && (
        <p className="text-center text-[11px] text-[#FACC15]">
          Tap a blank to place <strong>{getTokenText(selectedToken)}</strong>
        </p>
      )}
      {!checked && !selectedToken && (
        <p className="text-center text-[11px] text-slate-500">
          Tap a token, then tap a blank — or drag directly
        </p>
      )}

      {/* Token pool */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {data.tokens.map((token) => (
          <TokenChip
            key={token.id}
            tokenId={token.id}
            text={token.text}
            used={usedTokenIds.has(token.id)}
            selected={selectedToken === token.id}
            checked={checked}
            onTap={handleTokenTap}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </SpListeningShell>
  );
}

/** Section renderer: manages round index and remounts the round on advance. */
function SpFillInTheBlanksSection({
  title,
  data,
  onComplete,
  profileId,
}: {
  title: string;
  data: SpFillBlankSection;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  const [roundIdx, setRoundIdx] = useState(0);
  const total = data.questions.length;
  const isLast = roundIdx === total - 1;
  const scoresRef = useRef<number[]>([]);

  const handleRoundDone = (roundScore: number) => {
    scoresRef.current = [...scoresRef.current, roundScore];
    if (isLast) {
      const avg = Math.round(scoresRef.current.reduce((sum, s) => sum + s, 0) / scoresRef.current.length);
      onComplete(avg);
    } else {
      setRoundIdx((i) => i + 1);
    }
  };

  return (
    <SpFillInTheBlanksRound
      key={roundIdx}
      question={data.questions[roundIdx]}
      questionNum={roundIdx + 1}
      total={total}
      isLast={isLast}
      title={title}
      onComplete={handleRoundDone}
      profileId={profileId}
    />
  );
}

/**
 * Fill-in-the-blanks dispatcher.
 * Routes to section (6 rounds) or single-round based on content.
 */
function SpFillInTheBlanks({
  title,
  content,
  onComplete,
  profileId,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  if (content.spFillBlankSection) {
    return <SpFillInTheBlanksSection title={title} data={content.spFillBlankSection} onComplete={onComplete} profileId={profileId} />;
  }
  const single = content.spFillBlank;
  if (!single) return <div className="text-slate-400 p-4">No data for fill-in-the-blanks exercise.</div>;
  return (
    <SpFillInTheBlanksRound
      key="single"
      question={single}
      questionNum={1}
      total={1}
      isLast
      title={title}
      onComplete={(score) => onComplete(score)}
      profileId={profileId}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Data Extraction                                                     */
/* ------------------------------------------------------------------ */

/**
 * Single data-extraction round — used by both the single-round and section renderers.
 * key={roundIdx} on this component resets all state between rounds.
 */
function SpDataExtractionRound({
  question,
  questionNum,
  total,
  isLast,
  title,
  onComplete,
  profileId,
}: {
  question: SpDataExtractionData;
  questionNum: number;
  total: number;
  isLast: boolean;
  title: string;
  /** Called with this round's real score (% of fields extracted correctly). */
  onComplete: (roundScore: number) => void;
  profileId: string;
}) {
  const data = question;
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [checked, setChecked] = useState(false);

  const allSelected = data.fields.every((f) => selections[f.id] !== null && selections[f.id] !== undefined);

  const handleSelect = (fieldId: string, optId: string) => {
    if (checked) return;
    setSelections((prev) => ({ ...prev, [fieldId]: optId }));
  };

  const correctCount = checked
    ? data.fields.filter((f) => selections[f.id] === f.correctOptionId).length
    : 0;

  const feedbackNode = checked ? (
    <SpCard className={correctCount === data.fields.length ? "border-[#FACC15]/30 bg-[#FACC15]/[0.06]" : "border-amber-400/25 bg-amber-400/[0.05]"}>
      <p className={`text-[13px] font-semibold ${correctCount === data.fields.length ? "text-[#FACC15]" : "text-amber-300"}`}>
        {correctCount} / {data.fields.length} correct.
        {correctCount < data.fields.length
          ? " Incorrect fields are highlighted — listen again."
          : " All values extracted correctly."}
      </p>
    </SpCard>
  ) : undefined;

  return (
    <SpListeningShell
      title={title}
      instruction={`Question ${questionNum} of ${total}`}
      audioSpoken={data.audioSpoken}
      playLabel="Listen to the ATIS"
      profileId={profileId}
      checkDisabled={!allSelected}
      onCheck={() => setChecked(true)}
      feedbackNode={feedbackNode}
      showContinue={checked}
      onContinue={() => onComplete(Math.round((correctCount / data.fields.length) * 100))}
      continueLabel={isLast ? "Continue" : "Next Question"}
    >
      {/* Operational field cards — compact, all four visible without scroll */}
      <div className="space-y-2">
        {data.fields.map((field) => {
          const sel = selections[field.id] ?? null;
          const isCorrect = checked && sel === field.correctOptionId;
          const isWrong = checked && sel !== null && sel !== field.correctOptionId;

          const cardBorder = checked
            ? isCorrect
              ? "border-[#FACC15]/30 bg-[#FACC15]/[0.04]"
              : isWrong
              ? "border-rose-400/30 bg-rose-400/[0.04]"
              : "border-white/[0.07] bg-[#0B1322]"
            : "border-white/[0.07] bg-[#0B1322]";

          return (
            <div key={field.id} className={`rounded-2xl border p-3 ${cardBorder}`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[14px] font-bold uppercase tracking-wider ${
                  checked && isCorrect ? "text-[#FACC15]" : checked && isWrong ? "text-rose-300" : "text-slate-400"
                }`}>
                  {field.label}
                </span>
                {checked && (
                  <span className="text-[12px] font-semibold">
                    {isCorrect
                      ? <span className="text-[#FACC15]">✓</span>
                      : <span className="text-rose-400">✗</span>}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {field.options.map((opt) => {
                  const isOpt = sel === opt.id;
                  const isOptCorrect = opt.id === field.correctOptionId;
                  let border = "border-white/10", bg = "bg-white/[0.03]", text = "text-white";
                  if (!checked && isOpt)                { border = "border-[#38BDF8]/50"; bg = "bg-[#38BDF8]/[0.10]"; text = "text-[#38BDF8]"; }
                  if (checked && isOpt && isOptCorrect) { border = "border-[#FACC15]/50"; bg = "bg-[#FACC15]/[0.10]"; text = "text-[#FACC15]"; }
                  if (checked && isOpt && !isOptCorrect){ border = "border-rose-400/50";  bg = "bg-rose-400/[0.10]";  text = "text-rose-300"; }
                  if (checked && !isOpt && isOptCorrect){ border = "border-[#FACC15]/30"; bg = "bg-[#FACC15]/[0.04]"; text = "text-[#FACC15]"; }
                  return (
                    <button
                      key={opt.id}
                      disabled={checked}
                      onClick={() => handleSelect(field.id, opt.id)}
                      className={`rounded-xl border ${border} ${bg} px-3 py-1.5 text-[16px] font-semibold ${text} transition-colors active:opacity-80`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </SpListeningShell>
  );
}

/** Section renderer: manages round index and remounts the round on advance. */
function SpDataExtractionSection({
  title,
  data,
  onComplete,
  profileId,
}: {
  title: string;
  data: SpDataExtractionSection;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  const [roundIdx, setRoundIdx] = useState(0);
  const total = data.questions.length;
  const isLast = roundIdx === total - 1;
  const scoresRef = useRef<number[]>([]);

  const handleRoundDone = (roundScore: number) => {
    scoresRef.current = [...scoresRef.current, roundScore];
    if (isLast) {
      const avg = Math.round(scoresRef.current.reduce((sum, s) => sum + s, 0) / scoresRef.current.length);
      onComplete(avg);
    } else {
      setRoundIdx((i) => i + 1);
    }
  };

  return (
    <SpDataExtractionRound
      key={roundIdx}
      question={data.questions[roundIdx]}
      questionNum={roundIdx + 1}
      total={total}
      isLast={isLast}
      title={title}
      onComplete={handleRoundDone}
      profileId={profileId}
    />
  );
}

/**
 * Data Extraction dispatcher.
 * Routes to section (6 rounds) or single-round based on content.
 */
function SpDataExtraction({
  title,
  content,
  onComplete,
  profileId,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  if (content.spDataExtractionSection) {
    return <SpDataExtractionSection title={title} data={content.spDataExtractionSection} onComplete={onComplete} profileId={profileId} />;
  }
  const single = content.spDataExtraction;
  if (!single) return <div className="text-slate-400 p-4">No data for data-extraction exercise.</div>;
  return (
    <SpDataExtractionRound
      key="single"
      question={single}
      questionNum={1}
      total={1}
      isLast
      title={title}
      onComplete={onComplete}
      profileId={profileId}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Section Scenario                                                    */
/* ------------------------------------------------------------------ */

function StepBubble({
  step,
  isActive,
  isPast,
  onPlay,
}: {
  step: SpScenarioStep;
  isActive: boolean;
  isPast: boolean;
  onPlay?: () => void;
}) {
  const isPilot = step.speaker === "pilot";
  const isNarrator = step.speaker === "narrator";

  if (isNarrator) {
    return (
      <div className={`text-center transition-opacity ${isPast || isActive ? "opacity-100" : "opacity-0"}`}>
        <p className="text-[12px] italic leading-relaxed text-slate-400">{step.text}</p>
      </div>
    );
  }
  return (
    <div className={`flex flex-col gap-1 transition-opacity ${isPast || isActive ? "opacity-100" : "opacity-0"} ${isPilot ? "items-end" : "items-start"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${step.speaker === "atc" ? "text-[#38BDF8]" : "text-[#FACC15]"}`}>
        {step.speaker === "atc" ? "ATC" : "You"}
      </p>
      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${step.speaker === "atc" ? "rounded-tl-sm border border-[#38BDF8]/20 bg-[#0B1E30]" : "rounded-tr-sm border border-[#FACC15]/20 bg-[#1A1608]"}`}>
        <p className="text-[13.5px] leading-relaxed text-slate-200">{step.text}</p>
        {step.speaker === "atc" && onPlay && (
          <div className="mt-2"><PlayButton text={step.text} spoken={step.spoken} /></div>
        )}
      </div>
    </div>
  );
}

function ScenarioReadbackStep({
  step,
  onConfirm,
}: {
  step: SpScenarioStep;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="space-y-3">
      <SpCard>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Your turn</p>
        <p className="text-[12px] leading-relaxed text-slate-400">{step.readbackPrompt}</p>
        {!confirmed ? (
          <button onClick={() => { speak(step.spoken ?? step.text); setConfirmed(true); }}
            className="mt-3 w-full rounded-xl border border-[#FACC15]/20 bg-[#FACC15]/[0.06] py-2.5 text-[13.5px] font-medium text-slate-200 active:opacity-80">
            {step.expectedReadback ?? step.text}
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#FACC15]/30 bg-[#FACC15]/[0.08] px-3 py-2.5">
            <p className="text-[13.5px] text-slate-200">{step.expectedReadback ?? step.text}</p>
            <p className="mt-1 text-[11px] font-bold text-[#FACC15]">✓ Sent</p>
          </div>
        )}
      </SpCard>
      {confirmed && <ContinueButton onContinue={onConfirm} label="Next" />}
    </div>
  );
}

function SpSectionScenario({
  content,
  onComplete,
}: {
  content: ExerciseContent;
  onComplete: (score?: number) => void;
}) {
  // Delegate to conversation renderer for the Preflight scenario and any future
  // section-scenario blocks that opt in to the Cadet-style continuous chat.
  if (content.scenarioStyle === "conversation") {
    return <SpConversationScenario content={content} onComplete={onComplete} />;
  }

  // Linear scenario uses a tap-to-confirm readback (no mic/STT) — completion-only.
  return <SpLinearSectionScenario content={content} onComplete={() => onComplete()} />;
}

function SpLinearSectionScenario({
  content,
  onComplete,
}: {
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const steps: SpScenarioStep[] = content.spScenarioSteps ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const visualForStep = (idx: number): { mode: NonNullable<ExerciseContent["spVisualMode"]>; highlighted: string[] } => {
    for (let i = idx; i >= 0; i--) {
      const s = steps[i];
      if (s.visual) return { mode: s.visual, highlighted: s.highlightedFields ?? [] };
    }
    return { mode: content.spVisualMode ?? "atis", highlighted: [] };
  };
  const { mode: vm, highlighted: vh } = visualForStep(currentIdx);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentIdx]);

  const currentStep = steps[currentIdx];
  const isLast = currentIdx >= steps.length - 1;
  const isPilotStep = currentStep?.speaker === "pilot";

  const advance = () => {
    if (isLast) onComplete();
    else setCurrentIdx((i) => i + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
      <SpVisualPanel mode={vm} atis={content.spAtisInfo} clearance={content.spClearanceInfo} highlighted={vh} />
      <div className="space-y-3">
        {steps.map((step, idx) => {
          if (idx > currentIdx) return null;
          if (step.speaker === "pilot" && idx === currentIdx) return null;
          return <StepBubble key={step.id} step={step} isActive={idx === currentIdx} isPast={idx < currentIdx} onPlay={() => speak(step.spoken ?? step.text)} />;
        })}
        <div ref={bottomRef} />
      </div>
      {isPilotStep && currentStep ? (
        <ScenarioReadbackStep step={currentStep} onConfirm={advance} />
      ) : currentStep && !isPilotStep ? (
        <ContinueButton onContinue={advance} label={isLast ? "Complete" : "Next"} />
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Conversation Scenario — Cadet-style continuous radio chat.
 * Used when content.scenarioStyle === "conversation".
 *
 * Visual design mirrors Cadet ScenarioChatScreen:
 *   • Vertical chat list (ATC left, Pilot right)
 *   • ATC transmissions hidden initially — Play + Show transmission
 *   • Pilot steps use simulated mic (1.6 s) — expected revealed after attempt
 *   • Try again / Next footer actions after attempt
 *   • No chips; no fake voice analysis
 * ─────────────────────────────────────────────────────────────────────────────*/

/** ATC bubble with hidden text, Play button and Show transmission toggle. */
function ConvAtcBubble({
  step,
  revealed,
  onReveal,
}: {
  step: SpScenarioStep;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-[#0F172A] px-3.5 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#38BDF8]">ATC</p>
        {revealed ? (
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate-100">&ldquo;{step.text}&rdquo;</p>
        ) : (
          <p className="mt-0.5 font-mono text-base tracking-widest text-slate-600 select-none">
            {"•••• •••• •• ••• •••••••"}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => speak(step.spoken ?? step.text)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] px-3.5 py-1.5 text-sm font-bold text-[#07111F] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.6)] transition-transform active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          {!revealed && (
            <button
              type="button"
              onClick={onReveal}
              className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-300"
            >
              Show transmission
            </button>
          )}
        </div>
        {!revealed && (
          <p className="mt-1.5 text-[11px] text-slate-600">Listen first, then continue.</p>
        )}
      </div>
    </div>
  );
}

/** Completed pilot bubble shown after a successful mic attempt. */
function ConvPilotBubble({ step }: { step: SpScenarioStep }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-[#FACC15]/30 bg-[#FACC15]/15 px-3.5 py-2.5">
        <p className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">You</p>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-white">
          {step.expectedReadback ?? step.text}
        </p>
      </div>
    </div>
  );
}

/** Step-specific micro-instruction shown above the mic for each pilot step. */
const CONV_STEP_INSTRUCTION: Record<string, string> = {
  "s1-pilot-info-request":       "Request aerodrome information.",
  "s3-pilot-info-readback":      "Read back the aerodrome information.",
  "s4-pilot-clearance-request":  "Request departure clearance.",
  "s6-pilot-clearance-readback": "Read back the departure clearance.",
  "s8-pilot-ready":              "Report ready for engine start.",
  "s10-pilot-startup-readback":  "Read back the startup approval.",
};

/**
 * SpConversationScenario — Cadet-style continuous radio conversation renderer.
 * Dispatched from SpSectionScenario when content.scenarioStyle === "conversation".
 */
function SpConversationScenario({
  content,
  onComplete,
}: {
  content: ExerciseContent;
  onComplete: (score?: number) => void;
}) {
  const steps: SpScenarioStep[] = content.spScenarioSteps ?? [];
  const [stepIdx, setStepIdx] = useState(0);
  const [revealedSet, setRevealedSet] = useState<Set<string>>(new Set());
  const chatRef = useRef<HTMLDivElement>(null);
  // Real per-pilot-turn voice scores (evaluatePhraseAnswer), averaged on completion —
  // reported to onComplete so the scenario skill axes reflect actual pilot performance.
  const pilotScoresRef = useRef<number[]>([]);

  // Real mic/STT for pilot turns (deterministic expectedReadback/spoken text).
  const [voiceState, setVoiceState] = useState<VoiceUiState>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceEvaluationResult | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const micState: "idle" | "speaking" | "done" =
    voiceState === "requesting_permission" || voiceState === "recording" || voiceState === "processing"
      ? "speaking"
      : voiceResult
        ? "done"
        : "idle";

  const complete = stepIdx >= steps.length;
  const currentStep = complete ? undefined : steps[stepIdx];
  const isLastStep = stepIdx >= steps.length - 1;

  // Header / completion text — defaults preserve the Preflight scenario.
  const kicker = content.spScenarioKicker ?? "Preflight & Initial Contact";
  const heading = content.spScenarioHeading ?? "Preflight Scenario";
  const completionNote =
    content.spScenarioCompletionNote ?? "Preflight complete. G-ABCD is ready for engine start.";
  const scenarioCallsign = content.spScenarioCallsign;

  // Contextual chart crop — latest step (up to current) that defines one.
  const currentCrop = (() => {
    const upto = Math.min(stepIdx, steps.length - 1);
    for (let i = upto; i >= 0; i--) {
      if (steps[i]?.chartCrop) return steps[i].chartCrop;
    }
    return undefined;
  })();

  // Auto-scroll chat to bottom when messages arrive or mic state changes.
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [stepIdx, micState]);

  const resetVoice = () => {
    setVoiceState("idle");
    setVoiceResult(null);
    setVoiceTranscript("");
    setVoiceError(null);
  };

  const advance = () => {
    if (currentStep?.speaker === "pilot" && voiceResult) {
      pilotScoresRef.current = [...pilotScoresRef.current, voiceResult.score];
    }
    if (isLastStep) {
      if (pilotScoresRef.current.length > 0) {
        const avg = Math.round(
          pilotScoresRef.current.reduce((sum, s) => sum + s, 0) / pilotScoresRef.current.length,
        );
        onComplete(avg);
      } else {
        onComplete();
      }
    } else {
      setStepIdx((i) => i + 1);
      resetVoice();
    }
  };

  // Real STT result handler for the current pilot turn.
  const handleVoiceResult = (stt: SttResult) => {
    const step = steps[stepIdx];
    const expected = step?.spoken ?? step?.expectedReadback ?? step?.text ?? "";
    const acceptedVariants = [step?.expectedReadback, step?.text].filter(
      (v): v is string => !!v && v !== expected,
    );
    const evaluation = evaluatePhraseAnswer({
      transcript: stt.transcript,
      expected,
      acceptedVariants,
      confidence: stt.confidence,
    });
    setVoiceTranscript(stt.transcript);
    setVoiceResult(evaluation);
    setVoiceState("result");
  };

  // Which steps appear in the chat area.
  // Past steps always show. The current step shows if it's ATC/narrator, or pilot after done.
  const visibleSteps = steps.filter((step, i) => {
    if (i < stepIdx) return true;
    if (i === stepIdx) {
      if (step.speaker !== "pilot") return true;
      return micState === "done";
    }
    return false;
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

      {/* Header — mirrors Cadet ScenarioChatScreen */}
      <div className="mt-6 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">
          {kicker}
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{heading}</h1>
      </div>

      {/* Task card — mirrors Cadet ScenarioChatScreen task card */}
      <div className="mt-3 shrink-0 rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FACC15]">Task</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-100">
          {content.instruction ?? "Complete the full preflight radio sequence."}
        </p>
        {scenarioCallsign && (
          <div className="mt-3 border-t border-white/[0.06] pt-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Callsign</p>
            <p className="mt-0.5 font-mono text-base font-bold text-white">{scenarioCallsign}</p>
          </div>
        )}
      </div>

      {/* Contextual chart crop — reference only, updates with the current step */}
      {currentCrop && <SpChartCropPanel crop={currentCrop} compact className="mt-3 shrink-0" />}

      {/* Conversation — the only scrollable area; grows as messages are revealed */}
      <div ref={chatRef} className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {visibleSteps.map((step) => {
          if (step.speaker === "narrator") {
            return (
              <div key={step.id} className="py-1 text-center">
                <p className="text-[12px] italic leading-relaxed text-slate-400">{step.text}</p>
              </div>
            );
          }
          if (step.speaker === "atc") {
            return (
              <ConvAtcBubble
                key={step.id}
                step={step}
                revealed={revealedSet.has(step.id)}
                onReveal={() => setRevealedSet((s) => new Set([...s, step.id]))}
              />
            );
          }
          return <ConvPilotBubble key={step.id} step={step} />;
        })}

        {/* Simulated transmitting indicator */}
        {micState === "speaking" && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tr-sm border border-[#FACC15]/20 bg-[#FACC15]/[0.06] px-3.5 py-2.5">
              <p className="text-[13.5px] leading-relaxed text-slate-400">Transmitting…</p>
            </div>
          </div>
        )}

        {/* Completion note in chat */}
        {complete && (
          <p className="py-2 text-center text-sm font-medium text-slate-400">
            {completionNote}
          </p>
        )}
      </div>

      {/* Bottom action area — shrink-0, always visible */}
      <div className="mt-3 shrink-0">
        {complete ? (
          /* Scenario finished */
          <SpPrimaryButton
            onClick={() =>
              onComplete(
                pilotScoresRef.current.length > 0
                  ? Math.round(pilotScoresRef.current.reduce((sum, s) => sum + s, 0) / pilotScoresRef.current.length)
                  : undefined,
              )
            }
          >
            Finish
          </SpPrimaryButton>
        ) : currentStep?.speaker === "pilot" ? (
          micState === "done" ? (
            /* Post-attempt: real result + Try again / Next — mirrors Cadet readback footer */
            <div className="flex flex-col gap-3">
              {voiceResult && (
                <div className="rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Result</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${voiceResult.correct ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                      {voiceResult.correct ? "Correct" : "Try again"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-slate-300">Detected: <span className="font-medium text-white">&ldquo;{voiceTranscript || "—"}&rdquo;</span></p>
                  <p className="mt-1 text-[13px] font-medium text-[#FACC15]">Expected: &ldquo;{currentStep.expectedReadback ?? currentStep.text}&rdquo;</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">Score: {voiceResult.score}%</p>
                </div>
              )}
              <div className="flex gap-2.5">
                <SpGhostButton onClick={resetVoice}>Try again</SpGhostButton>
                <SpPrimaryButton onClick={advance}>
                  {isLastStep ? "Done" : "Next"}
                </SpPrimaryButton>
              </div>
            </div>
          ) : (
            /* Pre-attempt: micro-instruction + real mic/STT */
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-slate-400">
                {currentStep.micInstruction ?? CONV_STEP_INSTRUCTION[currentStep.id] ?? "Make your radio call."}
              </p>
              <VoiceRecorder
                disabled={voiceState === "processing"}
                mode="server"
                maxDurationMs={12000}
                onStateChange={setVoiceState}
                onResult={handleVoiceResult}
                onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
              />
              {voiceError && (
                <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-red-300">{voiceError}</p>
              )}
            </div>
          )
        ) : (
          /* ATC or narrator step: Continue advances the conversation */
          <SpPrimaryButton onClick={advance}>
            {isLastStep ? "Done" : "Continue"}
          </SpPrimaryButton>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Checkpoint                                                          */
/* ------------------------------------------------------------------ */

function CheckpointQuestion({
  question,
  questionNum,
  total,
  onAnswer,
}: {
  question: SpCheckpointQuestion;
  questionNum: number;
  total: number;
  onAnswer: (isCorrect: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#1E3A5F] px-2.5 py-0.5 text-[11px] font-bold text-[#38BDF8]">{questionNum} / {total}</span>
      </div>
      <SpCard>
        <p className="text-[16px] font-semibold leading-snug text-slate-100">{question.question}</p>
      </SpCard>
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSel = selected === opt.id;
          const isCorrect = opt.id === question.correctOptionId;
          let border = "border-white/10", bg = "bg-white/[0.03]", text = "text-white";
          if (answered && isSel && isCorrect) { border = "border-[#FACC15]/50"; bg = "bg-[#FACC15]/[0.08]"; text = "text-[#FACC15]"; }
          else if (answered && isSel)         { border = "border-amber-400/40";  bg = "bg-amber-400/[0.06]"; text = "text-amber-300"; }
          else if (answered && isCorrect)     { border = "border-[#FACC15]/30";  bg = "bg-[#FACC15]/[0.04]"; }
          return (
            <button key={opt.id} disabled={answered} onClick={() => { setSelected(opt.id); onAnswer(opt.id === question.correctOptionId); }}
              className={`flex min-h-[56px] w-full items-center justify-center rounded-2xl border ${border} ${bg} px-4 py-3.5 text-center transition-colors active:opacity-80`}>
              <p className={`text-base font-semibold leading-snug ${text}`}>{opt.text}</p>
            </button>
          );
        })}
      </div>
      {answered && question.feedback && (
        <SpCard className="border-[#38BDF8]/20 bg-[#38BDF8]/[0.05]">
          <p className="text-[13px] leading-relaxed text-slate-300">{question.feedback}</p>
        </SpCard>
      )}
    </div>
  );
}

function SpCheckpoint({
  content,
  onComplete,
}: {
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const questions: SpCheckpointQuestion[] = content.spCheckpointQuestions ?? [];
  const [qIdx, setQIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const done = qIdx >= questions.length;

  if (done) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
        <SpCard>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FACC15]/10 text-[#FACC15]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-[16px] font-bold text-slate-100">Checkpoint Complete</h2>
            <p className="mt-1 text-[13px] text-slate-400">{correct} / {questions.length} correct — preflight knowledge confirmed.</p>
          </div>
        </SpCard>
        <ContinueButton onContinue={onComplete} label="Complete Module" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
      {content.spVisualMode && content.spVisualMode !== "none" && (
        <SpVisualPanel mode={content.spVisualMode} atis={content.spAtisInfo} clearance={content.spClearanceInfo} highlighted={[]} />
      )}
      <CheckpointQuestion
        key={questions[qIdx].id}
        question={questions[qIdx]}
        questionNum={qIdx + 1}
        total={questions.length}
        onAnswer={(isCorrect) => setResults((r) => [...r, isCorrect])}
      />
      {results.length > qIdx && (
        <ContinueButton onContinue={() => setQIdx((i) => i + 1)} label={qIdx < questions.length - 1 ? "Next Question" : "See Results"} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main dispatcher                                                     */
/* ------------------------------------------------------------------ */

export interface SpSessionScreenProps {
  title: string;
  content: ExerciseContent;
  /**
   * Called when the exercise finishes. Blocks with real internal evaluation
   * (readback-construction, clearance-construction, listening-choice,
   * fill-in-the-blanks, data-extraction, decision-point/visual-interpretation,
   * section-scenario) report a real 0-100 score. Blocks with no genuine
   * right/wrong evaluation (lessons, tap-to-confirm blocks) call this with no
   * score — completion-only, matching the rest of the app's scoring rules.
   */
  onComplete: (score?: number) => void;
  /** 0-based index of this exercise within its topic (for "Exercise x of n"). */
  exerciseIndex?: number;
  /** Total exercises in the current topic. */
  exerciseTotal?: number;
  /** Full exercise ID (e.g. "rfr-workload.holding.trainer.r1") — used only to resolve the TTS profile (level/ATIS detection). Optional for backward compatibility. */
  exerciseId?: string;
}

/** Small unobtrusive "Exercise x of n" badge shown at the top of SP sessions. */
function ExerciseBadge({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex justify-end">
      <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
        Exercise {index + 1} of {total}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Readback Construction — visual mirror of Cadet ReadbackScreen (cadetReadbacks branch).
 * Simulated behaviour: tap mic → 1.6 s timeout → reveal expected readback.
 * No real microphone or speech recognition (Alpha placeholder).
 * ─────────────────────────────────────────────────────────────────────────────*/

/** Ghost outline button — mirrors Cadet GhostButton. */
function SpGhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200"
    >
      {children}
    </button>
  );
}

/** Primary green action button — mirrors Cadet PrimaryButton (global primary-btn CSS). */
function SpPrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="primary-btn disabled:opacity-40">
      {children}
    </button>
  );
}

/** One simulated readback round — mirrors Cadet ReadbackScreen cadetReadbacks branch exactly. */
function SpReadbackRoundRenderer({
  title,
  round,
  roundIdx,
  total,
  isLast,
  onComplete,
  headerInstruction,
}: {
  title: string;
  round: SpReadbackRound;
  roundIdx: number;
  total: number;
  isLast: boolean;
  /** Called with this round's real voice-evaluation score (0-100). */
  onComplete: (roundScore: number) => void;
  headerInstruction?: string;
}) {
  const [revealed, setRevealed] = useState(round.contextRevealed ?? false);

  // Real mic/STT for the readback attempt (deterministic expectedReadback/spoken text).
  const [voiceState, setVoiceState] = useState<VoiceUiState>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceEvaluationResult | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const done = !!voiceResult;
  const maxDurationMs = getMaxDurationMsForExercise({
    isReadback: true,
    expected: round.expectedReadbackSpoken || round.expectedReadback || "",
  });

  const handleVoiceResult = (stt: SttResult) => {
    const expected = round.expectedReadbackSpoken || round.expectedReadback;
    const acceptedVariants = [round.expectedReadback, ...(round.acceptedVariants ?? [])];
    const evaluation = evaluatePhraseAnswer({
      transcript: stt.transcript,
      expected,
      acceptedVariants,
      confidence: stt.confidence,
    });
    setVoiceTranscript(stt.transcript);
    setVoiceResult(evaluation);
    setVoiceState("result");
  };

  const tryAgain = () => {
    setVoiceState("idle");
    setVoiceResult(null);
    setVoiceTranscript("");
    setVoiceError(null);
    setRevealed(round.contextRevealed ?? false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header — mirrors Cadet StepHeader */}
      <div className="mt-6">
        {total > 1 && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Round {roundIdx + 1} / {total}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold leading-tight">{title}</h1>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#FACC15]">Readback Practice</p>
        {headerInstruction && (
          <p className="mt-2 text-[14px] leading-snug text-slate-400">{headerInstruction}</p>
        )}
      </div>

      {/* ATC transmission card — masked until Play or Show transmission */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{round.cardLabel ?? "ATC transmission"}</p>
        {revealed ? (
          <p className="mt-2 text-base font-semibold leading-snug text-white">&ldquo;{round.atcText}&rdquo;</p>
        ) : (
          <p className="mt-2 font-mono text-lg tracking-widest text-slate-600 select-none">{"•••• •• ••• •••••••"}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => speak(round.atcSpoken)}
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

      {/* Real mic/STT */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <VoiceRecorder
          disabled={voiceState === "processing"}
          mode="server"
          maxDurationMs={maxDurationMs}
          onStateChange={setVoiceState}
          onResult={handleVoiceResult}
          onError={(message) => { setVoiceError(message); setVoiceState("error"); }}
        />
        {voiceError && (
          <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-red-300">{voiceError}</p>
        )}
      </div>

      {/* Result — Detected / Expected / Score, revealed only after attempt */}
      {voiceResult && (
        <div className="mt-3 rounded-2xl border border-[#FACC15]/20 bg-[#0B1322] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Result</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${voiceResult.correct ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
              {voiceResult.correct ? "Correct" : "Try again"}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] text-slate-300">Detected: <span className="font-medium text-white">&ldquo;{voiceTranscript || "—"}&rdquo;</span></p>
          <p className="mt-1 text-base font-bold text-[#FACC15]">{round.expectedReadback}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">Score: {voiceResult.score}%</p>
        </div>
      )}

      {/* Footer — Try again + Next/Done, mirrors Cadet */}
      <div className="mt-auto flex gap-2.5 pt-4">
        <SpGhostButton onClick={tryAgain}>Try again</SpGhostButton>
        <SpPrimaryButton disabled={!done} onClick={() => onComplete(voiceResult?.score ?? 0)}>
          {isLast ? "Done" : "Next"}
        </SpPrimaryButton>
      </div>
    </div>
  );
}

/**
 * Readback Construction dispatcher.
 * Manages round progression; key={roundIdx} resets component state between rounds.
 * Real per-round voice score (evaluatePhraseAnswer) is averaged and reported to
 * onComplete so the readbacks skill axis reflects actual pilot performance.
 */
function SpReadbackConstruction({
  title,
  content,
  onComplete,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: (score?: number) => void;
}) {
  const section: SpReadbackSection = content.spReadbackSection!;
  const [roundIdx, setRoundIdx] = useState(0);
  const round = section.rounds[roundIdx];
  const isLast = roundIdx === section.rounds.length - 1;
  const scoresRef = useRef<number[]>([]);

  return (
    <SpReadbackRoundRenderer
      key={roundIdx}
      title={title}
      round={round}
      roundIdx={roundIdx}
      total={section.rounds.length}
      isLast={isLast}
      headerInstruction={content.instruction}
      onComplete={(roundScore) => {
        scoresRef.current = [...scoresRef.current, roundScore];
        if (isLast) {
          const avg = Math.round(scoresRef.current.reduce((sum, s) => sum + s, 0) / scoresRef.current.length);
          onComplete(avg);
        } else {
          setRoundIdx((i) => i + 1);
        }
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Clearance Construction — chip-sequencing renderer
 * Used for both "Understand the Clearance" and "Read Back the Clearance" cards.
 * Future-ready: SpClearanceRound.interactionType drives speak step on round 6.
 * ─────────────────────────────────────────────────────────────────────────────*/

/** Speak-aloud invitation shown inside Round 6 (chip-sequence-and-speak) feedback.
 * Simulated — no real microphone. Mirrors Cadet's cosmetic mic pattern. */
function SpSpeakInvitation({
  expectedSentence,
}: {
  expectedSentence: string;
}) {
  const [state, setState] = useState<"idle" | "listening" | "done">("idle");
  return (
    <div className="mt-2 rounded-xl border border-white/[0.07] bg-[#0B1322] px-4 py-3">
      <p className="mb-2 text-[13px] text-slate-400">
        {state === "done"
          ? "Compare your readback with the model above."
          : "Speak the readback aloud for extra practice."}
      </p>
      {state !== "done" ? (
        <button
          onClick={() => {
            setState("listening");
            setTimeout(() => setState("done"), 1500);
          }}
          disabled={state === "listening"}
          className={`w-full rounded-xl border py-3 text-[15px] font-semibold transition-colors active:opacity-80 ${
            state === "idle"
              ? "border-[#FACC15]/30 bg-[#FACC15]/[0.08] text-[#FACC15]"
              : "border-white/[0.08] bg-transparent text-slate-500"
          }`}
        >
          {state === "idle" ? "Tap to speak" : "Listening…"}
        </button>
      ) : (
        <p className="text-[14px] leading-relaxed text-slate-200">{expectedSentence}</p>
      )}
    </div>
  );
}

/** One chip-sequencing round — rendered with SpListeningShell. */
function SpClearanceRoundRenderer({
  title,
  round,
  questionNum,
  total,
  isLast,
  onComplete,
  screenKicker,
  headerInstruction,
  profileId,
}: {
  title: string;
  round: SpClearanceRound;
  questionNum: number;
  total: number;
  isLast: boolean;
  /** Called with this round's real score (100 if the chip sequence was correct, else 0). */
  onComplete: (roundScore: number) => void;
  screenKicker?: string;
  headerInstruction?: string;
  profileId: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const chipMap: Record<string, SpClearanceSegment> = Object.fromEntries(
    round.chipBank.map((c) => [c.id, c]),
  );
  const expectedIds = round.expectedSegments.map((s) => s.id);
  const isCorrect =
    selectedIds.length === expectedIds.length &&
    selectedIds.every((id, i) => id === expectedIds[i]);

  const addChip = (id: string) => {
    if (!checked) setSelectedIds((prev) => [...prev, id]);
  };
  const removeChip = (id: string) => {
    if (!checked) setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const unselected = round.chipBank.filter((c) => !selectedIds.includes(c.id));
  const selected = selectedIds.map((id) => chipMap[id]).filter(Boolean);

  const feedbackNode = checked ? (
    <div className="space-y-2">
      <div
        className={`rounded-2xl border px-4 py-3 ${
          isCorrect
            ? "border-[#FACC15]/30 bg-[#FACC15]/[0.06]"
            : "border-amber-400/25 bg-amber-400/[0.05]"
        }`}
      >
        <p
          className={`text-[13px] font-semibold ${
            isCorrect ? "text-[#FACC15]" : "text-amber-300"
          }`}
        >
          {isCorrect
            ? (round.correctFeedback ?? "Correct.")
            : (round.incorrectFeedback ?? "Not quite — review the expected order.")}
        </p>
        <p className="mt-1 text-[13px] text-slate-300">{round.expectedSentence}</p>
      </div>
      {/* ATC source text — revealed after Check */}
      <div className="rounded-xl border border-white/[0.06] bg-[#07121B] px-3 py-2.5">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          ATC issued
        </p>
        <p className="text-[13px] leading-snug text-slate-400">{round.atcText}</p>
      </div>
      {round.interactionType === "chip-sequence-and-speak" && (
        <SpSpeakInvitation expectedSentence={round.expectedSentence} />
      )}
    </div>
  ) : undefined;

  const displayTitle = title.includes(" · ") ? title.split(" · ").pop()! : title;

  return (
    <SpListeningShell
      typeLabel={screenKicker ?? "Listening"}
      title={displayTitle}
      instruction={
        headerInstruction ?? (total > 1 ? `Question ${questionNum} of ${total}` : undefined)
      }
      audioSpoken={round.atcSpoken}
      playLabel="Listen to the clearance"
      profileId={profileId}
      checkDisabled={selectedIds.length === 0}
      onCheck={() => setChecked(true)}
      feedbackNode={feedbackNode}
      showContinue={checked}
      onContinue={() => onComplete(isCorrect ? 100 : 0)}
      continueLabel={isLast ? "Continue" : "Next Question"}
    >
      {/* Short prompt */}
      <p className="mb-1 text-[14px] font-medium text-slate-200">{round.prompt}</p>
      {round.helperText && (
        <p className="mb-3 text-[13px] leading-snug text-slate-400">{round.helperText}</p>
      )}
      {!round.helperText && <div className="mb-2" />}

      {/* Answer area */}
      <div
        className={`mb-4 min-h-[56px] rounded-xl border border-dashed px-3 py-2.5 ${
          checked
            ? isCorrect
              ? "border-[#FACC15]/40 bg-[#FACC15]/[0.03]"
              : "border-amber-400/30 bg-amber-400/[0.03]"
            : "border-white/[0.15] bg-white/[0.02]"
        }`}
      >
        {selected.length === 0 ? (
          <p className="text-[13px] text-slate-600">Tap chips below to build your answer</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((chip) => (
              <button
                key={chip.id}
                onClick={() => removeChip(chip.id)}
                disabled={checked}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[15px] font-medium transition-colors active:opacity-75 ${
                  checked && isCorrect
                    ? "border-[#FACC15]/40 bg-[#FACC15]/[0.12] text-[#FACC15]"
                    : checked
                    ? "border-amber-400/30 bg-amber-400/[0.08] text-amber-200"
                    : "border-[#FACC15]/30 bg-[#FACC15]/[0.08] text-slate-100"
                }`}
              >
                {chip.text}
                {!checked && (
                  <span className="ml-0.5 text-[12px] text-slate-500">×</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chip bank — hidden after Check */}
      {!checked && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Available
          </p>
          <div className="flex flex-wrap gap-2 pb-2">
            {unselected.map((chip) => (
              <button
                key={chip.id}
                onClick={() => addChip(chip.id)}
                className="rounded-full border border-white/[0.12] bg-[#1A2A3A] px-3 py-1.5 text-[15px] font-medium text-slate-100 transition-colors active:bg-[#1A2A3A]/60 active:opacity-80"
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </SpListeningShell>
  );
}

/**
 * Clearance Construction dispatcher.
 * Manages round progression and resets state between rounds via key={roundIdx}.
 */
function SpClearanceConstruction({
  title,
  content,
  onComplete,
  profileId,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: (score?: number) => void;
  profileId: string;
}) {
  const section: SpClearanceSection = content.spClearanceSection!;
  const [roundIdx, setRoundIdx] = useState(0);
  const round = section.rounds[roundIdx];
  const isLast = roundIdx === section.rounds.length - 1;
  const scoresRef = useRef<number[]>([]);

  return (
    <SpClearanceRoundRenderer
      key={roundIdx}
      title={title}
      round={round}
      questionNum={roundIdx + 1}
      total={section.rounds.length}
      isLast={isLast}
      screenKicker={content.spScreenKicker}
      headerInstruction={content.instruction}
      profileId={profileId}
      onComplete={(roundScore) => {
        scoresRef.current = [...scoresRef.current, roundScore];
        if (isLast) {
          const avg = Math.round(scoresRef.current.reduce((sum, s) => sum + s, 0) / scoresRef.current.length);
          onComplete(avg);
        } else {
          setRoundIdx((i) => i + 1);
        }
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpAerodromeChartLesson
// Visual-first lesson that introduces Brindale Aerodrome Chart v3.
// Reference-only: no interactive elements, no audio, no chips.
// ─────────────────────────────────────────────────────────────────────────────

const AERODROME_CHART_BULLETS = [
  "Two runways form a V: RWY 18/36 and RWY 05/23.",
  "Main Apron is your usual starting point.",
  "Taxiways are the routes ATC may clear you to follow.",
  "Holding points and clearance limits tell you where to stop.",
] as const;

function SpAerodromeChartLesson({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">Aerodrome Chart</p>

      <h1 className="mb-1 text-[22px] font-bold leading-tight tracking-tight text-slate-50">
        Read the aerodrome chart
      </h1>
      <p className="mb-3 text-[13px] leading-snug text-slate-400">
        Before taxi, understand the runways, aprons, taxiways and holding points you will hear in ATC instructions.
      </p>

      {/* Full-bleed chart — uses nearly full mobile width */}
      <div
        className="-mx-6 mb-3 w-[calc(100%+3rem)] shrink-0 overflow-hidden border-y border-white/[0.08] bg-[#1D2C3D]"
        style={{ height: "clamp(380px, 58dvh, 500px)" }}
      >
        <BrindaleAerodromeChart
          crop="full-chart"
          showLabels
          className="h-full w-full rounded-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        />
      </div>

      <ul className="mb-4 space-y-2 rounded-2xl border border-white/[0.07] bg-[#0B1322] px-4 py-3">
        {AERODROME_CHART_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-300">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" aria-hidden />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-1">
        <ContinueButton onContinue={onComplete} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpTaxiLesson
// Explanatory taxi lesson: short text, compact chart crop, key points and a
// worked ATC + readback example. Mobile-first, listening/readback-first.
// Reference-only chart (no interaction). Reuses existing primitives.
// ─────────────────────────────────────────────────────────────────────────────

function SpTaxiLesson({
  title,
  content,
  onComplete,
}: {
  title: string;
  content: ExerciseContent;
  onComplete: () => void;
}) {
  const points = content.spLessonPoints ?? [];
  const examples = content.spLessonExamples ?? [];
  const body = content.lessonBody ?? content.instruction ?? "";
  const heading = content.instruction ?? title;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">Lesson</p>
      <h1 className="mb-2 text-[22px] font-bold leading-tight tracking-tight text-slate-50">{heading}</h1>
      {body && <p className="mb-3 text-[13.5px] leading-relaxed text-slate-300">{body}</p>}

      <SpCircuitDiagramPanel variant={content.spCircuitVariant} className="mb-3 shrink-0" />

      <SpChartCropPanel crop={content.spChartCrop} className="mb-3 shrink-0" />

      {points.length > 0 && (
        <ul className="mb-3 space-y-2 rounded-2xl border border-white/[0.07] bg-[#0B1322] px-4 py-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-300">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {examples.map((ex, i) => (
        <div key={i} className="mb-3 space-y-2.5 rounded-2xl border border-white/[0.07] bg-[#0B1322] p-4">
          {ex.label && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{ex.label}</p>
          )}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#38BDF8]">ATC</p>
            <p className="text-[13.5px] leading-relaxed text-slate-100">&ldquo;{ex.atcText}&rdquo;</p>
            <div className="mt-2"><PlayButton text={ex.atcText} spoken={ex.atcSpoken} green /></div>
          </div>
          {ex.readback && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Readback</p>
              <CallChip text={ex.readback} />
            </div>
          )}
        </div>
      ))}

      <div className="mt-auto pt-1">
        <ContinueButton onContinue={onComplete} />
      </div>
    </div>
  );
}

/**
 * Top-level Student Pilot session renderer.
 * Dispatches to the correct block renderer based on content.blockType.
 */

export function SpSessionScreen({
  title,
  content,
  onComplete,
  exerciseIndex,
  exerciseTotal,
  exerciseId,
}: SpSessionScreenProps) {
  // Keep the shared speak() helper's profile resolution in sync with this exercise,
  // and cancel any active TTS (server or browser) when the user leaves this
  // exercise (back, route change, exercise switch, unmount). Runs in an effect
  // (not directly during render) since it mutates a module-level variable — a
  // side effect that must not happen during render.
  //
  // Depends on exerciseId (not just spTtsProfileId): SpSessionScreen itself does
  // not remount between exercises (no key change on next-exercise navigation), so
  // the stop-on-change cleanup must fire on every exercise switch even when two
  // different exercises happen to resolve to the same TTS profile.
  const spTtsProfileId = resolveSpTtsProfileId(exerciseId, content);
  useEffect(() => {
    activeSpProfileId = spTtsProfileId;
    return () => stopSpeaking();
  }, [exerciseId, spTtsProfileId]);

  // These block types manage their own internal "Question x of 6" progress.
  // The external "Exercise x of n" badge is suppressed for all of them.
  const SELF_PROGRESS_TYPES = ["visual-briefing", "listening-choice", "fill-in-the-blanks", "data-extraction", "clearance-construction", "readback-construction", "aerodrome-chart", "taxi-lesson", "decision-point"];
  const showCounter =
    exerciseIndex !== undefined &&
    exerciseTotal !== undefined &&
    exerciseTotal > 1 &&
    !SELF_PROGRESS_TYPES.includes(content.blockType as string);

  const renderer = (() => {
    switch (content.blockType) {
      case "visual-briefing":   return <SpVisualBriefing title={title} content={content} onComplete={onComplete} />;
      case "key-calls":         return <SpKeyCallsLesson title={title} content={content} onComplete={onComplete} />;
      case "visual-interpretation":
      case "decision-point":    return <SpChoiceScreen title={title} content={content} onComplete={onComplete} />;
      case "listening-choice":  return <SpListeningChoice title={title} content={content} onComplete={onComplete} profileId={spTtsProfileId} />;
      case "fill-in-the-blanks":return <SpFillInTheBlanks title={title} content={content} onComplete={onComplete} profileId={spTtsProfileId} />;
      case "data-extraction":          return <SpDataExtraction title={title} content={content} onComplete={onComplete} profileId={spTtsProfileId} />;
      case "clearance-construction":   return <SpClearanceConstruction title={title} content={content} onComplete={onComplete} profileId={spTtsProfileId} />;
      case "readback-construction":    return <SpReadbackConstruction title={title} content={content} onComplete={onComplete} />;
      case "listening-readback":       return <SpListeningReadback content={content} onComplete={onComplete} />;
      case "speak-in-context":  return <SpSpeakInContext content={content} onComplete={onComplete} />;
      case "section-scenario":  return <SpSectionScenario content={content} onComplete={onComplete} />;
      case "checkpoint":        return <SpCheckpoint content={content} onComplete={onComplete} />;
      case "aerodrome-chart":   return <SpAerodromeChartLesson onComplete={onComplete} />;
      case "taxi-lesson":       return <SpTaxiLesson title={title} content={content} onComplete={onComplete} />;

      default:
        return (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-slate-400">Block type &quot;{content.blockType}&quot; is not yet implemented.</p>
            <ContinueButton onContinue={onComplete} label="Back" />
          </div>
        );
    }
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showCounter && <ExerciseBadge index={exerciseIndex!} total={exerciseTotal!} />}
      {renderer}
    </div>
  );
}
