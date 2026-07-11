"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadDescriptor, type AtcSessionDescriptor } from "@/lib/aerocomms/atcSim";

const EXPECT = [
  "Realistic radio communication with ATC.",
  "Dynamic situations and real instructions.",
  "You choose how to respond.",
  "Feedback and score at the end.",
];

type RowData = { label: string; value: string; iconPath: string };

export default function BriefingPage() {
  const router = useRouter();
  const [descriptor, setDescriptor] = useState<AtcSessionDescriptor | null>(null);

  useEffect(() => {
    const d = loadDescriptor();
    if (!d || d.source !== "mission") {
      router.replace("/aerocomms/app/atc-sim");
      return;
    }
    setDescriptor(d);
  }, [router]);

  if (!descriptor) return null;

  const rows: RowData[] = [
    { label: "Airport", value: descriptor.config.airport, iconPath: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
    { label: "Phase", value: descriptor.config.phase, iconPath: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" },
    { label: "Difficulty", value: descriptor.config.difficulty, iconPath: "M3 17l6-6 4 4 8-8" },
    { label: "Traffic", value: descriptor.config.traffic, iconPath: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
    { label: "Weather", value: descriptor.config.weather, iconPath: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" },
    { label: "ATC voice", value: descriptor.config.voice, iconPath: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4" },
  ];

  return (
    <section
      className="session-briefing-screen relative -mx-4 -mt-6 -mb-24 flex h-full min-h-0 flex-col overflow-hidden pb-24 lg:-mx-8 lg:-mt-8 lg:-mb-16"
      style={{ minHeight: "100dvh", background: "#020814" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 80% 0%, rgba(250,204,21,0.06), transparent 32%), #020814",
        }}
      />

      <div
        className="session-briefing-content relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-6"
        style={{ minHeight: "calc(100dvh - 6rem)" }}
      >
        <div className="session-briefing-body shrink-0">
          {/* Header */}
          <header className="flex items-center gap-3">
            <button
              onClick={() => router.push("/aerocomms/app/atc-sim")}
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
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#F8FAFC",
                }}
              >
                Session Briefing
              </h1>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: "rgba(226,232,240,0.72)",
                  marginTop: 2,
                }}
              >
                Review your session details
              </p>
            </div>
          </header>

          {/* Details card */}
          <div
            style={{
              marginTop: 24,
              background: "rgba(8,18,34,0.82)",
              border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: 19,
              padding: "15px 16px",
              boxShadow: "0 18px 42px rgba(0,0,0,0.26)",
            }}
          >
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="flex items-center"
                style={{
                  minHeight: 52,
                  gap: 12,
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(148,163,184,0.10)" : "none",
                }}
              >
                <span
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: "rgba(148,163,184,0.08)",
                    color: "rgba(248,250,252,0.86)",
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 21, height: 21 }} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={row.iconPath} />
                  </svg>
                </span>
                <span
                  className="flex-1"
                  style={{
                    fontSize: 13,
                    fontWeight: 650,
                    color: "rgba(226,232,240,0.68)",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 800,
                    color: "#F8FAFC",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* What to expect */}
          <section>
            <p
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#FACC15",
                marginTop: 24,
                marginBottom: 14,
              }}
            >
              What to expect
            </p>
            <ul>
              {EXPECT.map((line) => (
                <li
                  key={line}
                  className="flex items-start"
                  style={{ gap: 13, marginBottom: 15 }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="shrink-0"
                    style={{ width: 17, height: 17, marginTop: 2, color: "#FACC15" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.42,
                      fontWeight: 650,
                      color: "rgba(248,250,252,0.86)",
                    }}
                  >
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* CTAs — pinned toward bottom */}
        <div className="session-briefing-footer shrink-0" style={{ marginTop: "auto", paddingTop: 18, paddingBottom: 4 }}>
          <button
            onClick={() => router.push("/aerocomms/app/atc-sim/session")}
            className="flex w-full items-center justify-center gap-2 text-[15px]"
            style={{
              height: 52,
              borderRadius: 14,
              background: "#FACC15",
              color: "#07111F",
              fontWeight: 800,
              letterSpacing: "0.05em",
              boxShadow: "0 16px 34px rgba(250,204,21,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            START SESSION
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/aerocomms/app/atc-sim")}
            className="w-full text-center"
            style={{
              marginTop: 15,
              fontSize: 13.5,
              fontWeight: 750,
              color: "rgba(250,204,21,0.86)",
            }}
          >
            Back to Missions
          </button>
        </div>
      </div>
    </section>
  );
}
