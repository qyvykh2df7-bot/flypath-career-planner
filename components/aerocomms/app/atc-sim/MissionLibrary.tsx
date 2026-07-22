"use client";

// AeroComms — MissionLibrary
//
// Shared "filter chips + missions grouped by level" block. Extracted so it can
// be embedded directly on the Missions home screen and (if ever needed again)
// on a standalone listing route, without duplicating mission-card markup or
// unlock logic in two places.

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LEVEL_ORDER,
  LEVELS,
  missionsByLevel,
  type AtcLevelId,
  type AtcMission,
} from "@/lib/aerocomms/atcSim";
import { useAppState } from "@/lib/aerocomms/appState";
import { getMissionUnlockState } from "@/lib/aerocomms/progress";
import MissionLevelImage from "./MissionLevelImage";

function MissionCardIconFallback({ accent, locked }: { accent: string; locked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: 23, height: 23 }}
      fill="none"
      stroke={locked ? "#475569" : accent}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8.5 12 4l10 4.5-10 4.5z" />
      <path d="M6 10.5V15c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5" />
    </svg>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex items-center" style={{ gap: 2 }}>
      {[1, 2, 3].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          style={{ width: 15, height: 15 }}
          fill="currentColor"
          className={n <= count ? "text-[#FACC15]" : "text-[rgba(148,163,184,0.26)]"}
        >
          <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.77l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

function difficultyColor(difficulty: string, locked: boolean): string {
  if (locked) return "rgba(148,163,184,0.32)";
  if (difficulty === "Easy") return "#FACC15";
  if (difficulty === "Advanced") return "rgba(250,204,21,0.78)";
  return "rgba(226,232,240,0.68)";
}

function MissionCard({ m }: { m: AtcMission }) {
  const router = useRouter();
  const accent = LEVELS[m.level].accent;
  const { state, access } = useAppState();
  // Derive unlock state from the shared access contract plus real progress.
  // m.locked is passed as legacyLocked fallback for missions not yet in MISSION_REQS.
  const unlockState = getMissionUnlockState(m.id, state.completedExercises, m.locked, access.isPro);
  const isProLocked = unlockState.isProLocked;
  const isProgressLocked = unlockState.isProgressLocked;
  const isLocked = isProLocked || isProgressLocked;
  // Real completion/stars come from the user's saved mission results, not the static
  // catalog seed (m.completed / m.stars). A brand-new user must never see a mission as
  // "completed 3★" until they have actually flown it.
  const missionResult = state.missionResults?.[m.id];
  const isCompleted = (state.completedMissions?.includes(m.id) ?? false) || Boolean(missionResult?.completed);
  const earnedStars = missionResult?.bestStars ?? 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (isProLocked) {
          router.push("/aerocomms/app/paywall");
          return;
        }
        if (!isProgressLocked) router.push(`/aerocomms/app/atc-sim/missions/${m.id}`);
      }}
      aria-label={isProLocked ? `${m.title}: desbloquear AeroComms Pro` : m.title}
      className={`flex w-full items-center text-left transition-colors ${
        isLocked ? "hover:border-[#FACC15]/25" : "hover:border-[rgba(148,163,184,0.16)]"
      }`}
      style={{
        minHeight: 72,
        padding: "11px 13px",
        gap: 12,
        borderRadius: 18,
        background: isLocked ? "rgba(8,18,34,0.62)" : "rgba(8,18,34,0.82)",
        border: "1px solid rgba(148,163,184,0.10)",
      }}
    >
      {/* Level color accent stripe */}
      <div
        className="shrink-0 self-stretch rounded-full"
        style={{
          width: 3,
          opacity: isLocked ? 0.35 : 0.65,
          background: isLocked ? "#1E293B" : accent,
        }}
      />

      {/* Level preview */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          background: isLocked ? "rgba(30,41,59,0.5)" : `${accent}20`,
          border: isLocked ? "1px solid rgba(148,163,184,0.08)" : `1px solid ${accent}30`,
        }}
      >
        {!isLocked ? (
          <>
            <MissionLevelImage
              level={m.level}
              className="h-full w-full"
              sizes="44px"
              fallback={
                <div className="flex h-full w-full items-center justify-center">
                  <MissionCardIconFallback accent={accent} locked={false} />
                </div>
              }
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(2,8,20,0.35) 0%, transparent 55%)" }}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MissionCardIconFallback accent={accent} locked />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate"
          style={{
            fontSize: 15,
            fontWeight: 850,
            lineHeight: 1.15,
            color: isLocked ? "rgba(148,163,184,0.45)" : "#F8FAFC",
          }}
        >
          {m.title}
        </p>
        <div
          className="mt-1.5 flex flex-wrap items-center"
          style={{ gap: 8 }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.2,
              color: difficultyColor(m.difficulty, isLocked),
            }}
          >
            {m.difficulty}
          </span>
          <span style={{ color: "rgba(148,163,184,0.22)" }}>·</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.2,
              color: isLocked ? "rgba(148,163,184,0.32)" : "rgba(226,232,240,0.68)",
            }}
          >
            {m.duration}
          </span>
          {isCompleted && <Stars count={earnedStars} />}
        </div>
      </div>

      {/* State button */}
      {isLocked ? (
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: 34,
            height: 34,
            background: "rgba(15,23,42,0.72)",
            border: "1px solid rgba(148,163,184,0.10)",
            color: "rgba(226,232,240,0.45)",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="11" width="15" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      ) : (
        <span
          className="flex shrink-0 items-center justify-center rounded-full bg-[#FACC15] text-[#07111F]"
          style={{
            width: 38,
            height: 38,
            boxShadow: "0 0 22px rgba(250,204,21,0.24)",
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15, marginLeft: 2 }}>
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </span>
      )}
    </button>
  );
}

const FILTERS: { id: AtcLevelId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cadet", label: "Cadet" },
  { id: "student-pilot", label: "Student Pilot" },
  { id: "rfr", label: "Ready For Radio" },
  { id: "airline-prep", label: "Airline Prep" },
  { id: "advanced-ops", label: "Advanced Ops" },
];

export default function MissionLibrary() {
  const [filter, setFilter] = useState<AtcLevelId | "all">("all");
  const visibleLevels = filter === "all" ? LEVEL_ORDER : [filter];

  return (
    <div>
      {/* Filter chips — horizontal scroll on mobile, wraps on desktop */}
      <div
        className="-mx-4 flex shrink-0 overflow-x-auto px-4 pb-3 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
        style={{ gap: 8, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="shrink-0 rounded-full transition-colors"
              style={{
                height: 34,
                paddingLeft: 14,
                paddingRight: 14,
                fontSize: 12.5,
                fontWeight: isActive ? 850 : 750,
                color: isActive ? "#07111F" : "rgba(226,232,240,0.72)",
                background: isActive ? "#FACC15" : "rgba(8,18,34,0.78)",
                border: isActive ? "1px solid transparent" : "1px solid rgba(148,163,184,0.12)",
                boxShadow: isActive ? "0 0 18px rgba(250,204,21,0.18)" : "none",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Mission groups */}
      <div className="flex flex-col" style={{ gap: 18 }}>
        {visibleLevels.map((levelId) => {
          const missions = missionsByLevel(levelId);
          if (missions.length === 0) return null;
          return (
            <section key={levelId}>
              <p
                className="uppercase"
                style={{
                  marginBottom: 9,
                  fontSize: 11.5,
                  fontWeight: 850,
                  letterSpacing: "0.16em",
                  color: LEVELS[levelId].accent,
                }}
              >
                {LEVELS[levelId].label} Missions
              </p>
              <div className="flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-3" style={{ gap: 8 }}>
                {missions.map((m) => <MissionCard key={m.id} m={m} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
