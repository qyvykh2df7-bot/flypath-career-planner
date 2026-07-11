"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAppState } from "@/lib/aerocomms/appState";
import { LEVELS, MISSIONS, type AtcMission } from "@/lib/aerocomms/atcSim";
import { getPedagogicallyUnlockedMissions } from "@/lib/aerocomms/progress";
import MissionLibrary from "@/components/aerocomms/app/atc-sim/MissionLibrary";

function pickRecommendedMission(
  completedExercises: string[],
  completedMissions: string[],
): AtcMission | null {
  const unlockedIds = new Set(getPedagogicallyUnlockedMissions(completedExercises));
  const unlockedMissions = MISSIONS.filter((m) => unlockedIds.has(m.id));

  if (unlockedMissions.length === 0) return null;

  const nextNew = unlockedMissions.find((m) => !completedMissions.includes(m.id));
  if (nextNew) return nextNew;

  return unlockedMissions[0] ?? null;
}

export default function AtcSimPage() {
  const router = useRouter();
  const { state } = useAppState();

  const recommended = useMemo(
    () => pickRecommendedMission(state.completedExercises, state.completedMissions),
    [state.completedExercises, state.completedMissions],
  );

  return (
    /* Full-bleed home shell: breaks out of main padding so the bg covers the whole visible area.
       Mobile: fixed h-dvh frame with internal scroll (unchanged).
       Desktop (lg+): natural document flow — negative margins match layout.tsx's lg padding. */
    <section
      className="atc-sim-home relative -mx-4 -mt-6 -mb-24 flex h-dvh min-h-0 flex-col overflow-hidden lg:-mx-8 lg:-mt-8 lg:-mb-16 lg:h-auto lg:overflow-visible"
      style={{ background: "#020814" }}
    >
      {/* Full-viewport background — image + gradient fade, extends behind bottom nav.
          Desktop: `lg:fixed` escapes the app shell's max-w-[1360px] content column so the
          image always covers the full browser viewport, with no dark side bands. */}
      <div
        aria-hidden="true"
        className="atc-sim-home-bg pointer-events-none absolute inset-0 z-0 lg:fixed lg:inset-0"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(2,8,20,0.08) 0%, rgba(2,8,20,0.28) 30%, rgba(2,8,20,0.62) 62%, rgba(2,8,20,0.86) 82%, rgba(2,8,20,0.96) 100%), url('/images/aerocomms/atcsimfondo.webp')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 85%, rgba(250,204,21,0.05), transparent 35%)",
          }}
        />
        {/* Desktop-only: stronger dark overlay — the background photo is much more dominant
            at full page width than on a narrow mobile column, so readability needs extra contrast. */}
        <div className="absolute inset-0 hidden lg:block" style={{ background: "rgba(2,8,20,0.55)" }} />
      </div>

      {/* Scrollable content — header, Next Mission, Mission Library all scroll together */}
      <div className="atc-sim-home-content relative z-10 mx-auto flex min-h-0 w-full max-w-[1360px] flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pb-24 pt-6 lg:min-h-0 lg:flex-none lg:overflow-visible lg:px-8 lg:pb-16 lg:pt-8">
      {/* Centered content band — header + library share max-width on desktop */}
      <div className="lg:mx-auto lg:w-full lg:max-w-[1120px]">
      {/* ── 1. HEADER + NEXT MISSION — mobile: stacked; desktop: intro left, card right-aligned ── */}
      <div className="flex shrink-0 flex-col lg:w-full lg:flex-row lg:items-start lg:justify-between">
      <header className="relative shrink-0 pt-1 pb-2 lg:min-h-0 lg:shrink-0 lg:pb-0 lg:pt-1" style={{ minHeight: 112 }}>
        {/* Crown — mobile only (top-right of intro block) */}
        <span
          className="absolute right-1 top-0 text-[#F59E0B] lg:hidden"
          style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.5))" }}
        >
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
            <path d="M2 19l2-9 4.5 4L12 5l3.5 9L20 10l2 9H2z" />
          </svg>
        </span>

        <h1
          className="lg:text-[38px]"
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#F4F7FB",
          }}
        >
          Missions
        </h1>
        <div
          className="lg:max-w-none lg:text-[14px]"
          style={{
            fontSize: 13,
            lineHeight: 1.35,
            marginTop: 6,
            maxWidth: 200,
          }}
        >
          <span className="block text-[#9AA7B7] lg:whitespace-nowrap">
            Practice real radio communication.
          </span>
          <span className="block font-semibold text-[#FACC15]">
            Anytime. Anywhere.
          </span>
        </div>
      </header>

      {/* Next Mission — same row as intro, aligned to content container right edge on desktop */}
      <div className="mt-[18px] shrink-0 lg:mt-0 lg:w-[480px] lg:max-w-[480px] lg:shrink-0">
        <div className="mb-[10px] flex items-center justify-between">
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#FACC15",
              marginBottom: 0,
            }}
          >
            Next Mission
          </p>
          {/* Crown — desktop only, aligned with Next Mission label */}
          <span
            className="hidden shrink-0 text-[#F59E0B] lg:block"
            style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.5))" }}
          >
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
              <path d="M2 19l2-9 4.5 4L12 5l3.5 9L20 10l2 9H2z" />
            </svg>
          </span>
        </div>

        {recommended ? (
          <button
            type="button"
            onClick={() => router.push(`/aerocomms/app/atc-sim/missions/${recommended.id}`)}
            className="relative w-full overflow-hidden text-left"
            style={{
              borderRadius: 22,
              minHeight: 168,
              padding: 18,
              background: "linear-gradient(145deg, rgba(7,16,31,0.92) 0%, rgba(8,20,40,0.88) 100%)",
              border: "1px solid rgba(96,165,250,0.20)",
              boxShadow: "0 18px 42px rgba(0,0,0,0.30), 0 0 34px rgba(96,165,250,0.08)",
            }}
          >
            {/* Soft blue ambient glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: 22,
                background: "radial-gradient(circle at 85% 30%, rgba(96,165,250,0.14), transparent 38%)",
              }}
            />

            {/* Asterisk icon — right side, level accent */}
            <div
              className="pointer-events-none absolute flex items-center justify-center"
              style={{
                right: 18,
                top: 18,
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `${LEVELS[recommended.level].accent}1E`,
                border: `1px solid ${LEVELS[recommended.level].accent}33`,
              }}
            >
              <svg viewBox="0 0 24 24" style={{ height: 23, width: 23 }} fill="none" stroke={LEVELS[recommended.level].accent} strokeWidth={2} strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>

            <p
              style={{
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                color: "#F8FAFC",
                maxWidth: 220,
              }}
            >
              {recommended.title}
            </p>

            <div className="flex items-center" style={{ gap: 7, marginTop: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: LEVELS[recommended.level].accent,
                  background: `${LEVELS[recommended.level].accent}20`,
                  borderRadius: 999,
                  padding: "1px 7px",
                }}
              >
                {LEVELS[recommended.level].short}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1.2, color: "#8B98AA" }}>{recommended.difficulty}</span>
              <span style={{ fontSize: 12, lineHeight: 1.2, color: "#334155" }}>·</span>
              <span style={{ fontSize: 12, lineHeight: 1.2, color: "#8B98AA" }}>{recommended.duration}</span>
            </div>

            <p
              className="line-clamp-2"
              style={{
                fontSize: 12.5,
                lineHeight: 1.4,
                color: "#9AA7B7",
                marginTop: 8,
                maxWidth: 260,
              }}
            >
              {recommended.description}
            </p>

            {/* CTA — yellow identity, matches play/start mission across the app */}
            <div className="relative" style={{ marginTop: 16 }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute"
                style={{
                  left: 0,
                  right: 0,
                  bottom: 6,
                  height: 40,
                  background: "rgba(250,204,21,0.18)",
                  filter: "blur(20px)",
                  zIndex: 0,
                }}
              />
              <div
                className="relative text-[15px]"
                style={{
                  height: 48,
                  borderRadius: 13,
                  background: "#FACC15",
                  boxShadow: "0 14px 32px rgba(250,204,21,0.30), 0 0 40px rgba(250,204,21,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#07111F",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                START MISSION
                <svg viewBox="0 0 24 24" style={{ height: 16, width: 16 }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <div
            className="flex w-full flex-col"
            style={{
              borderRadius: 20,
              padding: "16px 16px 14px",
              gap: 10,
              background: "rgba(8,18,34,0.92)",
              border: "1px solid rgba(148,163,184,0.10)",
              boxShadow: "0 14px 32px rgba(0,0,0,0.24)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#F8FAFC",
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                Complete more Train lessons
              </p>
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: "#8B98AA",
                }}
              >
                Your first mission will appear here when you&apos;re ready.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/aerocomms/app/train")}
              className="text-[13px]"
              style={{
                height: 42,
                borderRadius: 12,
                background: "rgba(37,99,235,0.12)",
                border: "1px solid rgba(96,165,250,0.28)",
                color: "#DBEAFE",
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              Go to Train
            </button>
          </div>
        )}
      </div>
      </div>

      {/* ── 3. MISSION LIBRARY (full list, grouped by level, filterable) ── */}
      <div className="shrink-0" style={{ marginTop: 26 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#60A5FA",
            marginBottom: 6,
          }}
        >
          Mission Library
        </p>
        <p
          style={{
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "#F8FAFC",
          }}
        >
          Structured scenarios by level
        </p>
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.4,
            color: "#9AA7B7",
            marginTop: 4,
            marginBottom: 14,
          }}
        >
          Build confidence step by step.
        </p>

        <MissionLibrary />
      </div>
      </div>
      </div>
    </section>
  );
}
