"use client";

/**
 * SpLessonShell — Student Pilot lesson screen layout.
 *
 * Layout:
 *   - Scrollable content area: type label, title, explanation card, optional
 *     worked-example panel (with green accent ring and label).
 *   - Sticky Continue footer: always visible at the bottom, never scrolls away.
 *
 * The Continue button is in a sticky `shrink-0` footer, matching the same pattern
 * as SpListeningShell so both lesson and listening screens have a consistent,
 * always-accessible primary action at the bottom.
 *
 * Intentionally isolated to Student Pilot. Do not import this into Cadet.
 * Do not create a cross-level shared shell.
 */

export interface SpLessonShellProps {
  /** Small uppercase type label, e.g. "Lesson". Defaults to "Lesson". */
  typeLabel?: string;
  /** Prominent lesson title rendered as <h1>. */
  title: string;
  /** Compact explanation rendered inside a dark card. */
  explanation: React.ReactNode;
  /**
   * Optional worked example shown below the explanation.
   * Receives a green accent ring and an optional label.
   */
  example?: React.ReactNode;
  /** Small label above the example. Defaults to "Example". */
  exampleLabel?: string;
  onContinue: () => void;
  continueLabel?: string;
  /** Tighter layout for no-scroll lessons (e.g. Departure Clearance). */
  compact?: boolean;
  className?: string;
}

export function SpLessonShell({
  typeLabel = "Lesson",
  title,
  explanation,
  example,
  exampleLabel = "Example",
  onContinue,
  continueLabel = "Continue",
  compact = false,
  className = "",
}: SpLessonShellProps) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      {/* ── Content area ──────────────────────────────────────────────── */}
      <div className={`min-h-0 flex-1 ${compact ? "overflow-hidden" : "overflow-y-auto"}`}>
        <div className={compact ? "pb-1" : "pb-2"}>
          {/* Exercise type label */}
          <p className={`text-[10px] font-bold uppercase tracking-wider text-[#FACC15] ${compact ? "mb-2" : "mb-3"}`}>
            {typeLabel}
          </p>

          {/* Prominent lesson title */}
          <h1 className={`font-bold leading-tight tracking-tight text-slate-50 ${compact ? "mb-2 text-[20px]" : "mb-3 text-[22px]"}`}>
            {title}
          </h1>

          {/* Compact explanation card */}
          <div className={`rounded-2xl border border-white/[0.07] bg-[#0B1322] ${compact ? "px-3.5 py-2.5" : "px-4 py-3.5"}`}>
            {explanation}
          </div>

          {/* Worked example — below explanation, green accent ring */}
          {example && (
            <div className={compact ? "mt-2" : "mt-3"}>
              <p className={`text-[10px] font-bold uppercase tracking-wider text-slate-500 ${compact ? "mb-1.5" : "mb-2"}`}>
                {exampleLabel}
              </p>
              <div className="overflow-hidden rounded-2xl ring-1 ring-[#FACC15]/30">
                {example}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Continue footer — always visible ───────────────────── */}
      <div className={`shrink-0 border-t border-white/[0.06] ${compact ? "pt-2 pb-1" : "pt-3 pb-1"}`}>
        <button
          onClick={onContinue}
          className="w-full rounded-2xl bg-[#FACC15] py-3.5 text-[16px] font-bold text-[#07111F] active:opacity-80"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
