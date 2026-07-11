"use client";

import { useState } from "react";
import { speakAtc } from "@/lib/aerocomms/atcSim";

type AtcBubbleProps = {
  text: string;
  spoken?: string;
  showActions?: boolean;
  /** Called when Replay is pressed — lets parent re-activate waveform */
  onReplay?: (text: string, spoken?: string) => void;
};

/** ATC transmission bubble — left-aligned. Transmission hidden by default. */
export function AtcBubble({ text, spoken, showActions = true, onReplay }: AtcBubbleProps) {
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex max-w-[84%] flex-col items-start" style={{ gap: 6 }}>
      <span
        style={{
          paddingLeft: 4,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#FACC15",
        }}
      >
        ATC
      </span>

      <div
        style={{
          width: "100%",
          borderRadius: 18,
          borderTopLeftRadius: 4,
          border: "1px solid rgba(250,204,21,0.14)",
          background: "rgba(10,24,40,0.90)",
          padding: "14px 16px",
          fontSize: 14,
          lineHeight: 1.55,
          color: revealed ? "#E8EFF6" : "rgba(100,116,139,0.9)",
          fontStyle: revealed ? "normal" : "italic",
          boxShadow: "0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(250,204,21,0.06)",
          transition: "color 0.2s ease",
        }}
      >
        {revealed ? text : "Transmission hidden — tap Show transmission"}
      </div>

      {showActions && (
        <div className="flex items-center" style={{ gap: 6, paddingLeft: 4 }}>
          {/* Replay */}
          <button
            type="button"
            onClick={() => {
              // Route through the parent's onReplay (RadioConversation.handleReplay) so
              // Replay plays exactly once, through the backend-TTS-first path. Only fall
              // back to a direct (plain browser) call if this bubble is ever used
              // without that wiring.
              if (onReplay) onReplay(text, spoken);
              else speakAtc(spoken ?? text);
              setPlaying(true);
              setTimeout(() => setPlaying(false), 1800);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 9,
              border: playing
                ? "1px solid rgba(250,204,21,0.50)"
                : "1px solid rgba(250,204,21,0.28)",
              background: playing
                ? "rgba(250,204,21,0.15)"
                : "rgba(250,204,21,0.07)",
              padding: "5px 10px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#FACC15",
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 12, height: 12 }}>
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            {playing ? "Playing…" : "Replay"}
          </button>

          {/* Show / Hide transmission */}
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 9,
              border: "1px solid rgba(148,163,184,0.14)",
              background: "rgba(148,163,184,0.05)",
              padding: "5px 10px",
              fontSize: 11.5,
              fontWeight: 700,
              color: revealed ? "rgba(226,232,240,0.82)" : "rgba(148,163,184,0.82)",
              transition: "color 0.2s ease",
            }}
          >
            {revealed ? "Hide transmission" : "Show transmission"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Pilot read-back bubble — right-aligned, dark green tint (WhatsApp right-side style). */
export function PilotBubble({ text }: { text: string }) {
  return (
    <div className="flex max-w-[84%] flex-col items-end self-end" style={{ gap: 6 }}>
      <span
        style={{
          paddingRight: 4,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.72)",
        }}
      >
        You
      </span>
      <div
        style={{
          borderRadius: 18,
          borderTopRightRadius: 4,
          background: "rgba(20,83,45,0.88)",
          border: "1px solid rgba(250,204,21,0.22)",
          padding: "14px 16px",
          fontSize: 14,
          lineHeight: 1.55,
          fontWeight: 500,
          color: "rgba(240,253,244,0.94)",
          boxShadow: "0 8px 24px -8px rgba(250,204,21,0.30)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
