"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatClock, loadResult, type AtcSessionResult } from "@/lib/aerocomms/atcSim";

type Filter = "all" | "atc" | "you";

const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "atc", label: "ATC" },
  { id: "you", label: "You" },
];

export default function TranscriptPage() {
  const router = useRouter();
  const [result, setResult] = useState<AtcSessionResult | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r || r.source !== "mission") { router.replace("/aerocomms/app/atc-sim"); return; }
    setResult(r);
  }, [router]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!result) return null;

  const total = Math.max(result.durationSec, 1);

  const togglePlay = () => {
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    if (pos >= total) setPos(0);
    intervalRef.current = setInterval(() => {
      setPos((p) => {
        if (p >= total) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPlaying(false);
          return total;
        }
        return p + 1;
      });
    }, 1000);
  };

  const turns = result.transcript.filter((t) =>
    filter === "all" ? true : filter === "atc" ? t.speaker === "atc" : t.speaker === "pilot",
  );

  return (
    <section
      className="relative -mx-4 -mt-6 -mb-24 flex flex-col overflow-hidden lg:-mx-8 lg:-mt-8 lg:-mb-16"
      style={{ height: "100dvh", paddingBottom: 96, background: "#020814" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 18% 12%, rgba(96,165,250,0.06), transparent 34%), radial-gradient(circle at 50% 92%, rgba(250,204,21,0.07), transparent 38%), #020814",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-5">
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => router.push("/aerocomms/app/atc-sim/complete")}
            aria-label="Back"
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              background: "rgba(15,23,42,0.70)",
              color: "rgba(248,250,252,0.9)",
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#F8FAFC",
              lineHeight: 1.1,
            }}
          >
            Full Transcript
          </h1>
        </header>

        {/* Tabs */}
        <div
          className="flex shrink-0"
          style={{
            marginTop: 16,
            height: 38,
            borderRadius: 14,
            padding: 3,
            gap: 3,
            background: "rgba(8,18,34,0.78)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          {TABS.map((tab) => {
            const selected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className="flex flex-1 items-center justify-center rounded-[11px] transition-colors"
                style={{
                  fontSize: 12.5,
                  fontWeight: selected ? 850 : 750,
                  color: selected ? "#07111F" : "rgba(226,232,240,0.70)",
                  background: selected ? "#FACC15" : "transparent",
                  boxShadow: selected ? "0 0 18px rgba(250,204,21,0.18)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Transcript badge — blue premium panel, scrollable */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden backdrop-blur-sm"
          style={{
            marginTop: 14,
            borderRadius: 18,
            background: "rgba(14,35,58,0.72)",
            border: "1px solid rgba(96,165,250,0.18)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.26), 0 0 28px rgba(59,130,246,0.06)",
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ padding: "14px 14px" }}>
            {turns.map((turn, i) => (
              <div
                key={`${i}-${turn.time}`}
                className="flex"
                style={{
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < turns.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
                }}
              >
                <span
                  className="shrink-0 font-mono tabular-nums"
                  style={{
                    width: 44,
                    paddingTop: 2,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "rgba(148,163,184,0.68)",
                  }}
                >
                  {turn.time}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    style={{
                      display: "block",
                      fontSize: 10.5,
                      fontWeight: 850,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: turn.speaker === "atc" ? "#FACC15" : "rgba(250,204,21,0.90)",
                    }}
                  >
                    {turn.speaker === "atc" ? "ATC" : "You"}
                  </span>
                  <p
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      lineHeight: 1.45,
                      fontWeight: 550,
                      color: "rgba(248,250,252,0.90)",
                    }}
                  >
                    {turn.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock audio player — fixed above bottom nav */}
        <div
          className="flex shrink-0 items-center"
          style={{
            marginTop: 12,
            marginBottom: 8,
            height: 60,
            borderRadius: 18,
            padding: "10px 12px",
            gap: 12,
            background: "rgba(8,18,34,0.78)",
            border: "1px solid rgba(148,163,184,0.10)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.24)",
          }}
        >
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
              width: 44,
              height: 44,
              background: "#FACC15",
              color: "#07111F",
              boxShadow: "0 0 24px rgba(250,204,21,0.24)",
            }}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, marginLeft: 2 }}>
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div
              className="w-full overflow-hidden rounded-full"
              style={{ height: 4, background: "rgba(148,163,184,0.18)" }}
            >
              <div
                className="h-full rounded-full bg-[#FACC15] transition-all duration-300"
                style={{ width: `${(pos / total) * 100}%` }}
              />
            </div>
            <div
              className="flex justify-between font-mono tabular-nums"
              style={{ marginTop: 8, fontSize: 11, color: "rgba(226,232,240,0.62)" }}
            >
              <span>{formatClock(pos)}</span>
              <span>{formatClock(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
