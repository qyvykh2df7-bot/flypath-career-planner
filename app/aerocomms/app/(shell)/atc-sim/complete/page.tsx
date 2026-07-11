"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadResult, type AtcSessionResult } from "@/lib/aerocomms/atcSim";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 60,
        height: 60,
        color: filled ? "#FACC15" : "rgba(148,163,184,0.22)",
        filter: filled ? "drop-shadow(0 0 14px rgba(250,204,21,0.45))" : "none",
      }}
      fill="currentColor"
    >
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.77l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult] = useState<AtcSessionResult | null>(null);

  useEffect(() => {
    let active = true;
    const r = loadResult();
    if (!r || r.source !== "mission") { router.replace("/aerocomms/app/atc-sim"); return; }
    queueMicrotask(() => {
      if (active) setResult(r);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!result) return null;

  const breakdown: { label: string; value: number }[] = [
    { label: "Readbacks", value: result.breakdown.readbacks },
    { label: "Phraseology", value: result.breakdown.phraseology },
    { label: "Accuracy", value: result.breakdown.accuracy },
    { label: "Situational awareness", value: result.breakdown.situational },
    { label: "Timing", value: result.breakdown.timing },
  ];

  return (
    <section
      className="session-complete-screen relative -mx-4 -mt-6 -mb-24 flex flex-col overflow-hidden lg:-mx-8 lg:-mt-8 lg:-mb-16"
      style={{ height: "100dvh", paddingBottom: 96, background: "#020814" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 22%, rgba(250,204,21,0.06), transparent 40%), #020814",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-4">
        {/* Header */}
        <header className="shrink-0 text-center">
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#F8FAFC",
              lineHeight: 1.1,
            }}
          >
            Session Complete
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(148,163,184,0.88)",
              marginTop: 4,
            }}
          >
            Great job!
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col" style={{ gap: 10 }}>
          {/* Hero — no card, floats on background with glows */}
          <div
            className="relative shrink-0 text-center"
            style={{
              paddingTop: 22,
              paddingBottom: 18,
              background: "transparent",
              border: "none",
              boxShadow: "none",
              borderRadius: 0,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 42%, rgba(250,204,21,0.22), transparent 38%), radial-gradient(circle at 50% 72%, rgba(250,204,21,0.12), transparent 32%)",
              }}
            />

            <div className="relative flex items-center justify-center" style={{ gap: 16 }}>
              {[1, 2, 3].map((n) => (
                <StarIcon key={n} filled={n <= result.stars} />
              ))}
            </div>

            <div className="relative mt-4 flex items-baseline justify-center" style={{ gap: 5 }}>
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#F8FAFC",
                  letterSpacing: "-0.03em",
                }}
              >
                {result.score}
              </span>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "rgba(148,163,184,0.75)",
                }}
              >
                /100
              </span>
            </div>

            <p
              style={{
                marginTop: 8,
                fontSize: 17,
                fontWeight: 800,
                color: "#FACC15",
              }}
            >
              {result.label}
            </p>
          </div>

          {/* Breakdown card */}
          <div
            className="shrink-0"
            style={{
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.10)",
              background: "rgba(8,18,34,0.72)",
              padding: 15,
            }}
          >
            {breakdown.map((b, i) => (
              <div
                key={b.label}
                style={{
                  minHeight: 34,
                  paddingTop: i === 0 ? 0 : 8,
                  paddingBottom: 8,
                  borderTop: i !== 0 ? "1px solid rgba(148,163,184,0.08)" : "none",
                }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span style={{ fontSize: 13.5, color: "rgba(248,250,252,0.78)" }}>{b.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>{b.value}%</span>
                </div>
                <div
                  className="w-full overflow-hidden rounded-full"
                  style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full bg-[#FACC15] transition-all duration-700"
                    style={{ width: `${b.value}%`, opacity: 0.85 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* What went well */}
          <div className="shrink-0">
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#F8FAFC",
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              What went well
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.wentWell.map((line) => (
                <li key={line} className="flex items-start" style={{ gap: 10 }}>
                  <svg
                    viewBox="0 0 24 24"
                    className="shrink-0"
                    style={{ width: 16, height: 16, marginTop: 2, color: "#FACC15" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: 1.4,
                      color: "rgba(248,250,252,0.82)",
                    }}
                  >
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs — reserved space above bottom nav */}
          <div
            className="shrink-0"
            style={{ marginTop: "auto", paddingTop: 12, paddingBottom: 16 }}
          >
            <button
              onClick={() => router.push("/aerocomms/app/atc-sim/transcript")}
              className="flex w-full items-center justify-center text-[15px]"
              style={{
                height: 54,
                borderRadius: 14,
                background: "#FACC15",
                color: "#07111F",
                fontWeight: 800,
                letterSpacing: "0.04em",
                boxShadow: "0 16px 34px rgba(250,204,21,0.28), inset 0 1px 0 rgba(255,255,255,0.22)",
              }}
            >
              VIEW FULL TRANSCRIPT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
