"use client";

import { useEffect, useState } from "react";
import { speak as speakServerFirst, stopSpeaking } from "@/lib/aerocomms/voice/voiceProvider";

/**
 * SpListeningShell — Student Pilot listening exercise screen layout.
 *
 * Layout:
 *   - Scrollable content area: type label, title, instruction, circular Play button,
 *     children (answer content), feedback.
 *   - Sticky footer: Check button (while answering) or Continue button (after feedback).
 *     The footer is always visible — the learner never needs to scroll to reach it.
 *
 * The circular play button matches Cadet's BigPlayButton: h-24 w-24, rounded-full,
 * bg-[#FACC15], green shadow, active:scale-95.
 *
 * Intentionally isolated to Student Pilot. Do not import this into Cadet.
 */

/** Prefers backend TTS (with the given profile) and falls back to browser speechSynthesis automatically. */
function speak(text: string, profileId: string) {
  void speakServerFirst(text, { profileId });
}

/**
 * Large circular play button — matches Cadet BigPlayButton style.
 * After first play, shows a "Play again" text link below.
 */
function SpCircularPlayButton({
  audioSpoken,
  label = "Listen to the ATIS",
  profileId,
}: {
  audioSpoken: string;
  label?: string;
  profileId: string;
}) {
  const [played, setPlayed] = useState(false);

  // Cancel any active TTS (server or browser) when the user leaves this listening exercise.
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handlePlay = () => {
    speak(audioSpoken, profileId);
    setPlayed(true);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handlePlay}
        aria-label={played ? "Play again" : label}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FACC15] text-[#07111F] shadow-[0_16px_36px_-10px_rgba(250,204,21,0.75)] transition-transform active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      {played ? (
        <button
          onClick={handlePlay}
          className="text-[12px] font-medium text-slate-400 hover:text-slate-200 active:opacity-80"
        >
          Play again
        </button>
      ) : (
        <p className="text-[12px] text-slate-500">{label}</p>
      )}
    </div>
  );
}

export interface SpListeningShellProps {
  /** Small uppercase type label, e.g. "Listening". */
  typeLabel?: string;
  /** Prominent exercise title rendered as <h1>. */
  title: string;
  /** Short instruction or context (1–2 lines). */
  instruction?: string;
  /** Audio text sent to TTS when the Play button is tapped. */
  audioSpoken: string;
  /** Small label below the play button. */
  playLabel?: string;
  /** TTS profile id (see app/lib/voice/ttsProfiles.ts) — resolved by the caller from Train level/content. Defaults to "standard-atc". */
  profileId?: string;
  /** Answer area: question + options, blanks + tokens, or field cards. */
  children: React.ReactNode;
  /** Disables the Check button until the learner has made a selection. */
  checkDisabled?: boolean;
  /** Called when Check is tapped. */
  onCheck: () => void;
  checkLabel?: string;
  /**
   * Feedback content shown after Check.
   * When truthy the Check button is replaced by the Continue button in the footer.
   */
  feedbackNode?: React.ReactNode;
  /** Whether to show the Continue button (true when feedbackNode is shown). */
  showContinue?: boolean;
  onContinue: () => void;
  continueLabel?: string;
  className?: string;
}

export function SpListeningShell({
  typeLabel = "Listening",
  title,
  instruction,
  audioSpoken,
  playLabel = "Listen to the ATIS",
  profileId = "standard-atc",
  children,
  checkDisabled = false,
  onCheck,
  checkLabel = "Check",
  feedbackNode,
  showContinue = false,
  onContinue,
  continueLabel = "Continue",
  className = "",
}: SpListeningShellProps) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      {/* ── Scrollable content area ───────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="pb-3">
          {/* Exercise type label */}
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#FACC15]">
            {typeLabel}
          </p>

          {/* Prominent title */}
          <h1 className="mb-1 text-[22px] font-bold leading-tight tracking-tight text-slate-50">
            {title}
          </h1>

          {/* Short instruction */}
          {instruction && (
            <p className="mb-4 text-[14px] leading-snug text-slate-400">{instruction}</p>
          )}

          {/* Circular Play button — centred, matches Cadet BigPlayButton */}
          <div className="mb-4 flex justify-center">
            <SpCircularPlayButton audioSpoken={audioSpoken} label={playLabel} profileId={profileId} />
          </div>

          {/* Answer content slot */}
          <div className="space-y-3">{children}</div>

          {/* Feedback — inside the scroll area so it doesn't push the footer */}
          {feedbackNode && <div className="mt-4">{feedbackNode}</div>}
        </div>
      </div>

      {/* ── Sticky action footer — always visible ─────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.06] pt-3 pb-1">
        {!feedbackNode ? (
          <button
            disabled={checkDisabled}
            onClick={onCheck}
            className={`w-full rounded-2xl py-3.5 text-[15px] font-bold transition-colors ${
              checkDisabled
                ? "cursor-not-allowed bg-white/[0.05] text-slate-500"
                : "bg-[#FACC15] text-[#07111F] active:opacity-80"
            }`}
          >
            {checkLabel}
          </button>
        ) : showContinue ? (
          <button
            onClick={onContinue}
            className="w-full rounded-2xl bg-[#FACC15] py-3.5 text-[16px] font-bold text-[#07111F] active:opacity-80"
          >
            {continueLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
