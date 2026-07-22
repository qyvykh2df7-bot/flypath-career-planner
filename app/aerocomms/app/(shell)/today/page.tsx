"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState, type SkillStats } from "@/lib/aerocomms/appState";
import { PaywallContent } from "@/components/aerocomms/app/PaywallContent";
import {
  currentLevel,
  levelCompletion,
  moduleCompletion,
  modulesRemaining,
  nextLevel,
  screenType,
  type ExerciseType,
} from "@/lib/aerocomms/content";
import { recommendNext } from "@/lib/aerocomms/recommendation";
import { MISSIONS } from "@/lib/aerocomms/atcSim";
import { getPedagogicallyUnlockedMissions } from "@/lib/aerocomms/progress";

// ─── constants ──────────────────────────────────────────────────────────────

const SKILL_LABEL: Record<string, string> = {
  listening: "Listening",
  readbacks: "Readbacks",
  phraseology: "Phraseology",
};

const PRO_BENEFITS: { label: string; shortLabel: string; icon: React.ReactNode }[] = [
  {
    label: "All Missions & Scenarios",
    shortLabel: "Missions",
    icon: <path d="M10.5 4.5 21 3l-1.5 10.5-4-2.5-3 3.5-1-4.5zM3 21l6.5-6.5" />,
  },
  {
    label: "Advanced Feedback",
    shortLabel: "Feedback",
    icon: <path d="M21 12a8 8 0 1 1-4-6.9M9.5 11.5l2.5 2.5 6-6.5" />,
  },
  {
    label: "Detailed Analytics",
    shortLabel: "Analytics",
    icon: <path d="M4 20V10m5.5 10V4m5.5 16v-7m5 7V7" />,
  },
  {
    label: "Priority Support",
    shortLabel: "Priority",
    icon: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  },
  {
    label: "Advanced Ops & Airline Prep",
    shortLabel: "Advanced Ops",
    icon: <path d="M7 21h10M12 21v-4m-6.5-4.5L12 3l6.5 9.5a8 8 0 0 1-13 0" />,
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function minutesFor(type: ExerciseType | undefined): number {
  const screen = type ? screenType(type) : undefined;
  if (screen === "mission") return 6;
  if (screen === "scenario") return 5;
  return 4;
}

type TodayRec = {
  type: "train" | "atc-mission" | "replay-mission";
  title: string;
  subtitle: string;
  minutes: number;
  href: string;
  badge: string;
  ctaLabel: string;
};

/**
 * Picks the single most useful thing for the user to do right now.
 *
 * Priority:
 *  1. No Train progress at all → recommend Train (onboarding path).
 *  2. Unlocked ATC Sim mission not yet completed → recommend that mission.
 *  3. Mission with bestScore < 75 available for improvement → replay.
 *  4. Default: next Train exercise.
 */
function computeRec(
  completedExercises: string[],
  completedMissions: string[],
  missionResults: Record<string, { bestScore: number; bestStars: number }>,
  trainRec: { title: string; href: string; minutes: number; subtitle: string } | null,
): TodayRec {
  // 1. Fresh user — no exercises done yet → always push Train first.
  if (completedExercises.length === 0) {
    return {
      type: "train",
      title: trainRec?.title ?? "Start your training",
      subtitle: trainRec?.subtitle ?? "Begin with radio fundamentals.",
      minutes: trainRec?.minutes ?? 4,
      href: trainRec?.href ?? "/aerocomms/app/train",
      badge: "TRAIN",
      ctaLabel: "Start Training",
    };
  }

  // Build ordered list of unlocked missions from the canonical MISSIONS array
  // (preserves the intended level/difficulty order).
  const unlockedIds = new Set(getPedagogicallyUnlockedMissions(completedExercises));
  const unlockedMissions = MISSIONS.filter((m) => unlockedIds.has(m.id));

  // 2. First unlocked mission not yet completed.
  const nextNew = unlockedMissions.find((m) => !completedMissions.includes(m.id));
  if (nextNew) {
    return {
      type: "atc-mission",
      title: nextNew.title,
      subtitle: nextNew.description ?? nextNew.subtitle ?? "Put your skills into practice.",
      minutes: 6,
      href: `/aerocomms/app/atc-sim/missions/${nextNew.id}`,
      badge: "ATC SIM",
      ctaLabel: "Start Mission",
    };
  }

  // 3. Completed missions with bestScore < 75 → suggest the worst performer.
  const replayCandidate = unlockedMissions
    .filter((m) => completedMissions.includes(m.id))
    .map((m) => ({ mission: m, best: missionResults[m.id]?.bestScore ?? 0 }))
    .filter(({ best }) => best < 75)
    .sort((a, b) => a.best - b.best)[0];

  if (replayCandidate) {
    return {
      type: "replay-mission",
      title: replayCandidate.mission.title,
      subtitle: `Your best score: ${replayCandidate.best}. Can you do better?`,
      minutes: 6,
      href: `/aerocomms/app/atc-sim/missions/${replayCandidate.mission.id}`,
      badge: "REPLAY",
      ctaLabel: "Replay Mission",
    };
  }

  // 4. Default: next Train exercise.
  return {
    type: "train",
    title: trainRec?.title ?? "Keep training",
    subtitle: trainRec?.subtitle ?? "Continue building your radio skills.",
    minutes: trainRec?.minutes ?? 4,
    href: trainRec?.href ?? "/aerocomms/app/train",
    badge: "TRAIN",
    ctaLabel: trainRec ? "Continue Training" : "Open Train",
  };
}

/** Small relative-time label from a real session timestamp — no invented data. */
function timeAgoLabel(atMs: number): string {
  const minutes = Math.floor((Date.now() - atMs) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatIcon({ type }: { type: "fire" | "target" | "star" }) {
  if (type === "fire") {
    return (
      <span className="text-2xl leading-none drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]">🔥</span>
    );
  }
  if (type === "target") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#FACC15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1.5v3M22.5 12h-3" />
        <circle cx="12" cy="12" r="1" fill="#FACC15" stroke="none" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 drop-shadow-[0_0_6px_rgba(250,204,21,0.65)]"
      fill="#FACC15"
      stroke="#FACC15"
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.07 1.11-6.47-4.7-4.58 6.5-.95z" />
    </svg>
  );
}

export default function TodayPage() {
  const router = useRouter();
  const { state, access } = useAppState();

  // ── Dynamic greeting (client-side only to avoid SSR mismatch) ──────────────
  const [greeting, setGreeting] = useState("Good morning");
  const [proModalOpen, setProModalOpen] = useState(false);
  useEffect(() => {
    let active = true;
    const h = new Date().getHours();
    const nextGreeting = h >= 5 && h < 12
      ? "Good morning"
      : h >= 12 && h < 18
        ? "Good afternoon"
        : "Good evening";
    queueMicrotask(() => {
      if (active) setGreeting(nextGreeting);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!proModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [proModalOpen]);

  // ── Core data ──────────────────────────────────────────────────────────────
  const completed = new Set(state.completedExercises);
  const isPro = access.isPro;
  const practiceSkills = {
    listening: state.skills.listening,
    readbacks: state.skills.readbacks,
    phraseology: state.skills.phraseology,
  };

  const level = currentLevel(completed, isPro);

  // ── Train next exercise ────────────────────────────────────────────────────
  const trainNextRec = recommendNext(level, completed, practiceSkills, isPro);
  const trainRecData = trainNextRec
    ? {
        title: trainNextRec.exercise.title,
        subtitle:
          trainNextRec.exercise.description ??
          (trainNextRec.reason === "continue"
            ? `Continue ${trainNextRec.module.name}.`
            : trainNextRec.reason === "practice"
              ? "Sharpen your weakest skill."
              : trainNextRec.module.subtitle ?? "Build radio communication skills."),
        minutes: minutesFor(trainNextRec.exercise.type),
        href: `/aerocomms/app/session?exerciseId=${trainNextRec.exercise.id}&moduleId=${trainNextRec.module.id}&returnTo=/aerocomms/app/today`,
      }
    : null;

  // ── Next step context — module/topic name + progress (train recs only) ───────
  const nextStepContext = trainNextRec
    ? {
        section: trainNextRec.topic?.name ?? trainNextRec.module.name,
        pct: moduleCompletion(trainNextRec.module, completed),
      }
    : null;

  // ── Main recommendation (Train / ATC Sim / Replay) ─────────────────────────
  const todayRec = computeRec(
    state.completedExercises,
    state.completedMissions ?? [],
    state.missionResults ?? {},
    trainRecData,
  );

  // ── Focus area — only skills with real scored sessions (skillStats.count > 0) ──
  const zeroStat: SkillStats = { totalScore: 0, count: 0 };
  const skillStats = state.skillStats ?? {
    listening:   zeroStat,
    readbacks:   zeroStat,
    phraseology: zeroStat,
    confidence:  zeroStat,
  };

  const scoredFocusSkills = (
    [
      { key: "listening" as const,   value: state.skills.listening,   count: skillStats.listening.count },
      { key: "readbacks" as const,   value: state.skills.readbacks,   count: skillStats.readbacks.count },
      { key: "phraseology" as const, value: state.skills.phraseology, count: skillStats.phraseology.count },
    ] as const
  ).filter((s) => s.count > 0);

  const hasFocusData = scoredFocusSkills.length > 0;
  const focusSkill = hasFocusData
    ? scoredFocusSkills.reduce((min, s) => (s.value <= min.value ? s : min), scoredFocusSkills[0])
    : null;
  const weakLabel = focusSkill ? SKILL_LABEL[focusSkill.key] : "Start scored practice";
  const weakValue = focusSkill?.value;

  // ── Next unlock ring ──────────────────────────────────────────────────────
  const upcoming = nextLevel(level);
  const levelPct = levelCompletion(level, completed);
  const remaining = modulesRemaining(level, completed);
  const ringDash = `${(levelPct / 100) * 125.6} 126`;

  // ── Stats row ─────────────────────────────────────────────────────────────
  const hasAccuracyData = state.scoredCount > 0;
  const stats = [
    { label: "Streak",   value: String(state.streakDays), unit: "days", icon: "fire"   as const },
    {
      label: hasAccuracyData ? "Accuracy" : "Not scored yet",
      value: hasAccuracyData ? String(state.accuracy) : "—",
      unit:  hasAccuracyData ? "%" : "",
      icon:  "target" as const,
    },
    { label: "Sessions", value: String(state.sessionsCount), unit: "",  icon: "star"   as const },
  ];

  const dailyGoalMinutes = Number.parseInt(String(state.dailyGoal), 10) || 10;
  const dailyMinutes = Math.min(state.minutesToday ?? 0, dailyGoalMinutes);
  const dailyGoalPct =
    dailyGoalMinutes > 0 ? Math.min(100, Math.round((dailyMinutes / dailyGoalMinutes) * 100)) : 0;

  // ── Desktop-only: recent activity (real history, no invented data) ────────
  const recentActivity = state.history.slice(0, 3);

  return (
    <>
    {/* ══════════════════════════════════════════════════════════════════
        MOBILE (below lg) — unchanged approved app layout
        ══════════════════════════════════════════════════════════════════ */}
    <div className="flex h-full flex-col gap-2 lg:hidden">

      {/* 1. Header */}
      <header className="flex items-start justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, {state.name}</h1>
          <p className="text-xs text-slate-400">
            {state.experience ?? "Student Pilot"}
            <span className="mx-1.5 text-slate-600">·</span>
            <span className="font-medium text-[#FACC15]">{level.name}</span>
          </p>
        </div>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#FACC15] ring-2 ring-[#07111F]" />
        </button>
      </header>

      {/* 2. Hero recommendation card — dynamic Train / ATC Sim / Replay */}
      <section className="relative flex min-h-[252px] flex-1 flex-col overflow-hidden rounded-[22px] border border-[#FACC15]/15 bg-[#080F1C] px-5 py-3.5 shadow-[0_28px_64px_-24px_rgba(250,204,21,0.6)]">
        {/* background image — flipped so headset sits on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-x-[-1] bg-cover opacity-[0.78]"
          style={{
            backgroundImage: "url('/images/aerocomms/today.webp')",
            backgroundPosition: "65% center",
          }}
        />
        {/* minimal left + bottom gradients only — no full-card blue wash */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020B18]/80 via-[#020B18]/40 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#020B18]/40 to-transparent" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <span className="self-start rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FACC15] ring-1 ring-[#FACC15]/35">
            {todayRec.badge}
          </span>
          <h2 className="mt-1.5 max-w-[58%] text-[27px] font-extrabold leading-[1.05] drop-shadow-[0_2px_10px_rgba(2,11,24,0.85)]">{todayRec.title}</h2>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-300 drop-shadow-[0_1px_6px_rgba(2,11,24,0.8)]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {todayRec.minutes} min
          </div>
          <p className="mt-1 line-clamp-2 max-w-[58%] text-[13px] leading-[1.45] text-slate-400 drop-shadow-[0_1px_6px_rgba(2,11,24,0.8)]">
            {todayRec.subtitle}
          </p>
        </div>

        {/* Next Step — train recs only, integrated text above CTA */}
        {todayRec.type === "train" && nextStepContext && (
          <div className="relative z-10 mt-1.5 w-full shrink-0">
            <div className="flex w-full items-center justify-between gap-3">
              <span className="shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-[#FACC15] drop-shadow-[0_2px_8px_rgba(2,11,24,0.95)]">
                Next step
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white drop-shadow-[0_2px_8px_rgba(2,11,24,0.95)]">
                {nextStepContext.section}
              </span>
              {nextStepContext.pct > 0 && (
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#FDE047] drop-shadow-[0_2px_8px_rgba(2,11,24,0.95)]">
                  {nextStepContext.pct}%
                </span>
              )}
            </div>
            {nextStepContext.pct > 0 && (
              <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-[#FACC15] transition-all"
                  style={{ width: `${nextStepContext.pct}%` }}
                />
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push(todayRec.href)}
          className="relative z-10 mt-2 flex h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#FACC15] text-[15px] font-bold uppercase tracking-wide text-[#07111F] shadow-[0_16px_40px_-8px_rgba(250,204,21,0.8)] transition-colors hover:bg-[#EAB308] active:scale-[0.99]"
        >
          {todayRec.ctaLabel}
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </button>
      </section>

      {/* 3. Focus Area + Next Unlock */}
      <section className="grid w-full grid-cols-2 gap-3">
        <Link
          href="/aerocomms/app/progress"
          aria-label="Open progress details for your focus area"
          className="flex h-[155px] flex-col rounded-[20px] border border-white/[0.06] bg-[#0B1322]/95 p-[17px] shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-all hover:border-white/10 active:scale-[0.99]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">
            Focus Area
          </p>
          <p className="mt-1 text-[20px] font-semibold leading-tight">{weakLabel}</p>
          {hasFocusData && weakValue !== undefined ? (
            <>
              <div className="relative mt-auto">
                <svg viewBox="0 0 140 46" className="h-[52px] w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FACC15" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 34 L22 28 L44 31 L70 18 L92 22 L116 8 L140 4 L140 40 L0 40 Z" fill="url(#sparkFill)" />
                  <path d="M0 34 L22 28 L44 31 L70 18 L92 22 L116 8 L140 4" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="140" cy="4" r="3" fill="#FACC15" />
                </svg>
              </div>
              <p className="mt-0.5 text-[22px] font-bold leading-none text-[#FACC15]">
                {weakValue}% <span className="text-[13px] font-medium text-slate-500">current</span>
              </p>
            </>
          ) : (
            <div className="relative mt-auto shrink-0">
              <svg viewBox="0 0 140 46" className="h-[52px] w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 34 L22 28 L44 31 L70 18 L92 22 L116 8 L140 4 L140 40 L0 40 Z" fill="url(#sparkFill)" />
                <path d="M0 34 L22 28 L44 31 L70 18 L92 22 L116 8 L140 4" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="140" cy="4" r="3" fill="#FACC15" />
              </svg>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => router.push("/aerocomms/app/paywall")}
          className="flex h-[155px] flex-col rounded-[20px] border border-white/[0.06] bg-[#0B1322]/95 p-[17px] text-left shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-colors hover:border-white/10"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">
            Next Unlock
          </p>
          <p className="mt-1 text-[20px] font-semibold leading-tight">{upcoming?.name ?? "All levels"}</p>
          <div className="mt-auto flex flex-col items-center justify-center gap-1.5">
            <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
              <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                <circle cx="22" cy="22" r="20" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="2.5" />
                <circle cx="22" cy="22" r="20" fill="none" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={ringDash} />
              </svg>
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="11" width="15" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <p className="text-[14px] font-medium leading-tight text-slate-300">
              {remaining} {remaining === 1 ? "module" : "modules"} left
            </p>
          </div>
        </button>
      </section>

      {/* 4. Daily Goal */}
      <section className="flex h-[82px] shrink-0 items-center gap-3 rounded-[20px] border border-white/[0.06] bg-[#0B1322]/95 p-[17px] shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)] backdrop-blur-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FACC15]/20 bg-[#FACC15]/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#FACC15]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1" fill="#FACC15" stroke="none" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Daily Goal</p>
          <p className="mt-1 text-[17px] font-semibold leading-tight text-slate-100">
            {dailyMinutes} / {dailyGoalMinutes} min today
          </p>
          <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#FACC15]/90 transition-all"
              style={{ width: `${dailyGoalPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">Training time</p>
        </div>
      </section>

      {/* 5. Stats row */}
      <section className="flex shrink-0 items-stretch rounded-[20px] border border-white/[0.04] bg-[#0B1322] px-3 py-3 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)]">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-1 items-center justify-center gap-3 ${i < stats.length - 1 ? "border-r border-white/5" : ""}`}
          >
            <StatIcon type={stat.icon} />
            <div className="leading-tight">
              <p className="text-[12px] uppercase tracking-wider text-slate-500">{stat.label}</p>
              <p className="text-[20px] font-bold">
                {stat.value}
                {stat.unit && <span className="ml-0.5 text-sm font-medium text-slate-400">{stat.unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>

    {/* ══════════════════════════════════════════════════════════════════
        DESKTOP (lg and above) — web dashboard built from the same data
        ══════════════════════════════════════════════════════════════════ */}
    <div className="desktop-today-root relative hidden lg:block">
      {/* Fixed viewport wallpaper — behind nav (z-50) and content (z-10); does not scroll */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/aerocomms/fondoweb.webp')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[#07111F]/30"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 75%, rgba(7,17,31,0.35) 90%, #07111F 100%)",
        }}
      />

      <div className="relative z-10">
      <header className="mb-5">
        <h1 className="text-[32px] font-extrabold tracking-tight text-white drop-shadow-[0_1px_10px_rgba(2,11,24,0.65)]">
          {greeting}, {state.name}
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-200 drop-shadow-[0_1px_8px_rgba(2,11,24,0.55)]">
          Ready to <span className="font-semibold text-[#FACC15]">master the skies</span>.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* ── Left / center column (~65%) ── */}
        <div className="col-span-2 space-y-4">
          {/* Today's Plan — hero recommendation card */}
          <section className="relative flex min-h-[230px] flex-col overflow-hidden rounded-[24px] border border-[#FACC15]/15 bg-[#080F1C] px-8 py-7 shadow-[0_28px_64px_-24px_rgba(250,204,21,0.45)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 scale-x-[-1] bg-cover opacity-[0.65]"
              style={{ backgroundImage: "url('/images/aerocomms/today.webp')", backgroundPosition: "70% center" }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020B18]/92 via-[#020B18]/55 to-transparent" />

            <div className="relative z-10 flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#FACC15]">
                  Today&apos;s Plan
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#FACC15]/25 bg-[#FACC15]/8 text-[#FACC15]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                </span>
              </div>
              <span className="mt-3 self-start rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FACC15] ring-1 ring-[#FACC15]/35">
                {todayRec.badge}
              </span>
              <h2 className="mt-3 max-w-lg text-[30px] font-extrabold leading-[1.1] drop-shadow-[0_2px_10px_rgba(2,11,24,0.85)]">
                {todayRec.title}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-300">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {todayRec.minutes} min
              </div>
              <p className="mt-2 max-w-md text-[14px] leading-[1.5] text-slate-400">{todayRec.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => router.push(todayRec.href)}
              className="relative z-10 mt-6 flex h-[50px] w-fit min-w-[220px] items-center justify-center gap-2 rounded-[14px] bg-[#FACC15] px-6 text-[13.5px] font-bold uppercase tracking-wide text-[#07111F] shadow-[0_16px_40px_-8px_rgba(250,204,21,0.8)] transition-colors hover:bg-[#EAB308] active:scale-[0.99]"
            >
              {todayRec.ctaLabel}
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </button>
          </section>

          {/* Continue Training — slim resume card (real data only, when a train step exists) */}
          {trainNextRec && nextStepContext && (
            <section className="flex items-center gap-5 rounded-[18px] border border-white/[0.06] bg-[#0B1322]/95 px-6 py-4 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
                  <path d="M3 14a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6zm18 0a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v-6z" />
                </svg>
              </div>
              <div className="min-w-0 shrink-0 lg:max-w-[220px] xl:max-w-[280px]">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Continue where you left off</p>
                <p className="truncate text-[15px] font-semibold leading-tight text-white">{nextStepContext.section}</p>
              </div>
              {nextStepContext.pct > 0 && (
                <>
                  <div className="h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#FACC15]" style={{ width: `${nextStepContext.pct}%` }} />
                  </div>
                  <span className="shrink-0 text-[12px] font-medium text-slate-400">{nextStepContext.pct}% complete</span>
                </>
              )}
              <button
                type="button"
                onClick={() => router.push(trainRecData?.href ?? "/aerocomms/app/train")}
                className="shrink-0 rounded-[10px] border border-[#FACC15]/30 bg-[#FACC15]/10 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-[#FACC15] transition-colors hover:bg-[#FACC15]/18"
              >
                Resume
              </button>
            </section>
          )}

          {/* Train / Missions large access cards */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => router.push("/aerocomms/app/train")}
              className="group relative flex flex-col items-start overflow-hidden rounded-[20px] border border-white/[0.06] p-6 text-left shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)] transition-colors hover:border-[#38BDF8]/35"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 scale-x-[-1] bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/aerocomms/trainweb.webp')",
                }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px]" style={{ background: "rgba(56,189,248,0.12)", boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.28)" }}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#38BDF8" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
                    <path d="M3 14a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6zm18 0a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v-6z" />
                  </svg>
                </div>
                <p className="text-[17px] font-extrabold uppercase tracking-[0.06em] text-white">Train</p>
              </div>
              <p className="relative z-10 mt-3 max-w-[85%] text-[13px] leading-snug text-slate-400">
                Build your phraseology skills with structured lessons and exercises.
              </p>
              <span className="relative z-10 mt-5 flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide text-slate-200 transition-colors group-hover:border-[#38BDF8]/40 group-hover:text-[#38BDF8]">
                Go to Train
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/aerocomms/app/atc-sim")}
              className="group relative flex flex-col items-start overflow-hidden rounded-[20px] border border-white/[0.06] p-6 text-left shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)] transition-colors hover:border-[#FACC15]/35"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 scale-x-[-1] bg-cover bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/aerocomms/atcweb.webp')",
                  backgroundPosition: "center center",
                }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px]" style={{ background: "rgba(74,222,128,0.10)", boxShadow: "inset 0 0 0 1px rgba(74,222,128,0.28)" }}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#4ADE80" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4.5" />
                    <path d="M12 12 17.5 7" />
                    <circle cx="12" cy="12" r="1" fill="#4ADE80" stroke="none" />
                  </svg>
                </div>
                <p className="text-[17px] font-extrabold uppercase tracking-[0.06em] text-white">ATC Missions</p>
              </div>
              <p className="relative z-10 mt-3 max-w-[85%] text-[13px] leading-snug text-slate-400">
                Test your skills in realistic ATC scenarios and earn your wings.
              </p>
              <span className="relative z-10 mt-5 flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide text-slate-200 transition-colors group-hover:border-[#FACC15]/40 group-hover:text-[#FACC15]">
                Go to Missions
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* ── Right column (~35%) — unified Your Progress panel ── */}
        <div className="col-span-1">
          <section className="flex h-full flex-col rounded-[24px] border border-white/[0.06] bg-[#0B1322]/95 p-6 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.7)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FACC15]">Your Progress</p>

            {/* Current level — large badge like the reference design */}
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_0_14px_rgba(250,204,21,0.4)]" fill="none">
                  <path d="M32 6 14 13v13c0 12 7.5 20.5 18 24 10.5-3.5 18-12 18-24V13z" fill="rgba(250,204,21,0.12)" stroke="#FACC15" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="m24 31 5.5 5.5L41 25" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 22c-4 1-7 2.6-7 4.5C3 29.5 8 32 14 33M54 22c4 1 7 2.6 7 4.5 0 3-5 5.5-11 6.5" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase tracking-wider text-slate-500">Current Level</p>
                <p className="truncate text-[22px] font-extrabold leading-tight text-white">{level.name}</p>
                {upcoming && (
                  <p className="text-[12px] font-semibold text-[#FACC15]">Next: {upcoming.name}</p>
                )}
              </div>
            </div>

            {/* Progress to next level */}
            {upcoming && (
              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Progress</span>
                  <span className="text-[15px] font-bold tabular-nums text-white">{levelPct}<span className="text-[11px] font-semibold text-slate-400"> / 100%</span></span>
                </div>
                <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#FACC15] transition-all" style={{ width: `${levelPct}%` }} />
                </div>
              </div>
            )}

            {/* Quick metrics — value, label, mini sparkline per column */}
            <div className="mt-5 grid grid-cols-3 border-t border-white/[0.06] pt-4">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col items-center gap-1 px-1 text-center ${i < stats.length - 1 ? "border-r border-white/[0.06]" : ""}`}
                >
                  <p className="text-[19px] font-extrabold leading-none text-white">
                    {stat.value}
                    {stat.unit && <span className="ml-0.5 text-[10px] font-medium text-slate-400">{stat.unit}</span>}
                  </p>
                  <p className="text-[9px] uppercase leading-tight tracking-wider text-slate-500">{stat.label}</p>
                  <svg viewBox="0 0 60 16" className="mt-1 h-[14px] w-[52px]" preserveAspectRatio="none">
                    <path
                      d="M2 12 L12 9 L22 11 L32 6 L42 8 L52 3 L58 4"
                      fill="none"
                      stroke={i === 0 ? "#FB923C" : i === 1 ? "#4ADE80" : "#38BDF8"}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Skills</p>
              {/* Compact skill rows — no icon bubbles, just a label+bar per skill */}
              <div className="space-y-2.5">
                {(
                  [
                    {
                      name: "Listening",
                      value: state.skills.listening,
                      hasData: skillStats.listening.count > 0,
                    },
                    {
                      name: "Phraseology",
                      value: state.skills.phraseology,
                      hasData: skillStats.phraseology.count > 0,
                    },
                    {
                      name: "Readbacks",
                      value: state.skills.readbacks,
                      hasData: skillStats.readbacks.count > 0,
                    },
                    {
                      name: "Speaking",
                      value: state.skills.speaking ?? 0,
                      hasData: (skillStats.speaking?.count ?? 0) > 0,
                    },
                    {
                      name: "Confidence",
                      value: state.skills.confidence,
                      hasData: skillStats.confidence.count > 0,
                    },
                  ] as const
                ).map(({ name, value, hasData }) => {
                  const barColor = !hasData ? "#334155"
                    : value <= 75 ? "#f87171"
                    : value <= 85 ? "#fbbf24"
                    : "#FACC15";
                  return (
                    <div key={name} className="flex items-center gap-2.5">
                      <span className={`w-[82px] shrink-0 text-[11.5px] font-medium ${hasData ? "text-slate-300" : "text-slate-600"}`}>
                        {name}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                          {hasData && (
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${value}%`, background: barColor }}
                            />
                          )}
                        </div>
                        <span className={`w-[30px] shrink-0 text-right text-[11px] font-semibold tabular-nums ${hasData ? (value <= 75 ? "text-red-400" : value <= 85 ? "text-amber-400" : "text-[#FACC15]") : "text-slate-700"}`}>
                          {hasData ? `${value}%` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity — real session history only */}
            {recentActivity.length > 0 && (
              <div className="mt-5 border-t border-white/[0.06] pt-4">
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Recent Activity</p>
                <div className="space-y-2">
                  {recentActivity.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {s.score !== undefined ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/15 text-[#4ADE80]">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                              <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.07 1.11-6.47-4.7-4.58 6.5-.95z" />
                            </svg>
                          </span>
                        )}
                        <span className="truncate text-[12px] font-medium text-slate-200">{s.name}</span>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {s.score !== undefined ? `${s.score}%` : ""} {timeAgoLabel(s.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Pro CTA — full-width bottom banner below dashboard grid */}
      <section className="relative z-10 mt-4 flex min-h-[124px] w-full shrink-0 items-stretch overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0B1322]/90 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.75)] backdrop-blur-sm">
        {/* Thumbnail */}
        <div className="relative w-[120px] shrink-0 self-stretch overflow-hidden xl:w-[148px]">
          <Image
            src="/images/aerocomms/opsmission.webp"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1279px) 120px, 148px"
            className="object-cover object-[20%_center]"
          />
        </div>

        {/* Interior row: text(flex-1) | benefits(fixed) | button(fixed) */}
        <div className="flex min-w-0 flex-1 items-center py-3 pl-4 pr-4 xl:pl-6 xl:pr-5">

          {/* Text block — takes all spare width; description never truncated */}
          <div className="min-w-0 flex-1 pr-4 xl:pr-6">
            <p className="text-[19px] font-extrabold leading-tight text-white xl:text-[21px]">
              Go Pro. Fly Further.
            </p>
            <p className="mt-1.5 max-w-[340px] text-[11px] leading-snug text-slate-400 xl:text-[12px]">
              Get unlimited access to all missions, advanced analytics, detailed feedback and Airline Prep &amp; Advanced Ops levels.
            </p>
          </div>

          {/* Benefits row — plain gold icons with full two-line labels */}
          <div className="flex shrink-0 items-start gap-2.5 xl:gap-4">
            {PRO_BENEFITS.map(({ label, icon }) => (
              <span key={label} className="flex w-[58px] flex-col items-center gap-1.5 text-center xl:w-[66px]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 shrink-0 text-[#FACC15] xl:h-7 xl:w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icon}
                </svg>
                <span className="text-[8.5px] font-medium leading-[1.3] text-slate-300 xl:text-[9.5px]">
                  {label}
                </span>
              </span>
            ))}
          </div>

          {/* CTA — opens modal */}
          <div className="ml-4 flex shrink-0 items-center xl:ml-6">
            <button
              type="button"
              onClick={() => setProModalOpen(true)}
              className="flex h-[42px] shrink-0 items-center gap-2 whitespace-nowrap rounded-[11px] bg-[#FACC15] px-4 text-[11px] font-bold uppercase tracking-wide text-[#07111F] shadow-[0_10px_24px_-6px_rgba(250,204,21,0.6)] transition-colors hover:bg-[#EAB308] xl:h-[44px] xl:px-5 xl:text-[12px]"
            >
              Upgrade to Pro
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3 xl:h-3.5 xl:w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>

        </div>
      </section>
      </div>
    </div>

    {/* Desktop Pro upgrade modal — reuses PaywallContent, opened from bottom CTA only */}
    {proModalOpen && (
      <div
        className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/70 px-4 lg:flex"
        onClick={() => setProModalOpen(false)}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-[420px] overflow-y-auto rounded-[22px] border border-white/[0.08] bg-[#07111F] p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)]"
          onClick={(e) => e.stopPropagation()}
        >
          <PaywallContent
            onClose={() => setProModalOpen(false)}
          />
        </div>
      </div>
    )}
    </>
  );
}
