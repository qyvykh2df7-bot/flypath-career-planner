"use client";

export type QuickReply = "readback" | "say-again" | "unable" | "wilco";

type QuickReplyBarProps = {
  onRespond: () => void;
  onQuickReply: (reply: QuickReply) => void;
};

/**
 * Simplified mic-only bar — quick reply chips removed.
 * RadioConversation now inlines the mic directly; this component is kept
 * for backward-compatibility but no longer renders chips.
 */
export default function QuickReplyBar({ onRespond }: QuickReplyBarProps) {
  return (
    <div className="flex flex-col items-center" style={{ paddingTop: 10, paddingBottom: 6 }}>
      <p
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "rgba(250,204,21,0.92)",
          marginBottom: 12,
        }}
      >
        Tap to respond
      </p>
      <button
        type="button"
        onClick={onRespond}
        aria-label="Respond"
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FACC15",
          color: "#07111F",
          boxShadow:
            "0 0 0 8px rgba(250,204,21,0.12), 0 16px 40px -8px rgba(250,204,21,0.60)",
          cursor: "pointer",
        }}
      >
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
      </button>
    </div>
  );
}
