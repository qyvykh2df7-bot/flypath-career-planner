"use client";

import Link from "next/link";
import { useAppState, type SessionRecord, type SkillStats } from "@/lib/aerocomms/appState";
import {
  currentLevel,
  modulesRemaining,
  nextLevel,
  LEVELS,
} from "@/lib/aerocomms/content";
import { MISSIONS } from "@/lib/aerocomms/atcSim";
import {
  getLevelProgressSummary,
  type ProgressLevelSummary,
} from "@/lib/aerocomms/progressGroups";

// ─── helpers ────────────────────────────────────────────────────────────────

function performanceColor(value: number) {
  if (value <= 75) return "text-red-400";
  if (value <= 85) return "text-amber-400";
  return "text-[#FACC15]";
}

/**
 * A session record counts as "scored" if:
 * - isScored === true (new records), OR
 * - isScored is undefined (legacy record) AND source === "atc-mission"
 *   (ATC Sim missions always had a real score).
 * Old legacy Train records without isScored are treated as completion-only.
 */
function isRecordScored(s: SessionRecord): boolean {
  if (s.isScored !== undefined) return s.isScored;
  return s.source === "atc-mission";
}

function performanceBarColor(value: number): string {
  if (value <= 75) return "#f87171";
  if (value <= 85) return "#fbbf24";
  return "#FACC15";
}

function inferSource(s: SessionRecord): "train" | "atc-mission" {
  if (s.source === "atc-mission") return "atc-mission";
  if (s.detail?.includes("ATC Sim")) return "atc-mission";
  return "train";
}

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  "train":       { label: "Train",       cls: "bg-[#38BDF8]/15 text-[#38BDF8]" },
  "atc-mission": { label: "ATC Sim",     cls: "bg-[#FACC15]/15 text-[#FACC15]" },
};

// ─── icon components (inline SVG) ────────────────────────────────────────────

/** Icon bubble wrapper */
function IconBubble({
  children,
  color,
  size = 36,
}: {
  children: React.ReactNode;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[11px]"
      style={{
        width: size,
        height: size,
        background: `${color}18`,
        boxShadow: `inset 0 0 0 1px ${color}28`,
      }}
    >
      {children}
    </div>
  );
}

// Headphones — Listening
function IcoHeadphones({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

// Rotate-ccw — Readbacks
function IcoReadback({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// Message-square — Phraseology
function IcoPhraseology({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Shield-check — Confidence
function IcoConfidence({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Mic — Speaking
function IcoMic({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// Book — Train source
function IcoBook({ size = 16, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

// Small radio — ATC Sim source
function IcoRadioSmall({ size = 16, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10c0 3.866-3.134 7-7 7s-7-3.134-7-7" />
      <line x1="12" y1="17" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

const SESSION_ICONS: Record<string, (color: string) => React.ReactNode> = {
  "train":       (c) => <IcoBook       size={16} color={c} />,
  "atc-mission": (c) => <IcoRadioSmall size={16} color={c} />,
};

const SESSION_ICON_COLOR: Record<string, string> = {
  "train":       "#38BDF8",
  "atc-mission": "#FACC15",
};

// ─── sub-components ─────────────────────────────────────────────────────────

/** Overall ring — UNCHANGED */
function OverallRing({ value }: { value: number }) {
  const r    = 40;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative h-[96px] w-[96px] shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#FACC15" strokeOpacity="0.06" strokeWidth="14" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke="#FACC15"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold leading-none tracking-tight text-white">{value}%</span>
        <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Overall</span>
      </div>
    </div>
  );
}

/** Horizontal progress bar */
function Bar({ pct, color, h = 5 }: { pct: number; color: string; h?: number }) {
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-white/[0.07]"
      style={{ height: h }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

/** One skill row — always visible; never shows a fake 0% bar. */
function SkillRow({
  name,
  icon,
  value,
  hasData,
  pendingLabel,
  tag,
}: {
  name: string;
  icon: React.ReactNode;
  value?: number;
  hasData: boolean;
  pendingLabel?: string;
  tag?: string;
}) {
  const iconColor = hasData && value !== undefined ? performanceBarColor(value) : "#475569";

  return (
    <div className="flex items-center gap-3.5">
      <IconBubble color={iconColor} size={40}>
        {icon}
      </IconBubble>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className={`text-[12px] font-medium ${hasData ? "text-slate-200" : "text-slate-500"}`}>
            {name}
            {tag && (
              <span className="ml-1.5 text-[9px] font-normal uppercase tracking-wide text-slate-500">
                {tag}
              </span>
            )}
          </span>
          {hasData && value !== undefined ? (
            <span className={`shrink-0 text-[12px] font-bold ${performanceColor(value)}`}>
              {value}%
            </span>
          ) : (
            <span className="shrink-0 text-right text-[10px] font-medium text-slate-600">
              {pendingLabel}
            </span>
          )}
        </div>
        {hasData && value !== undefined && (
          <Bar pct={value} color={performanceBarColor(value)} h={5} />
        )}
      </div>
    </div>
  );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { state } = useAppState();

  const completed = new Set(state.completedExercises);
  const isPro     = state.subscription === "pro";

  // ── Train stats — Progress Groups used internally, never shown as lists ──
  const level     = currentLevel(completed, isPro);
  const upcoming  = nextLevel(level);
  const remaining = modulesRemaining(level, completed);

  const levelSummaries: ProgressLevelSummary[] = LEVELS
    .map((l) => getLevelProgressSummary(l.id, { completedExercises: completed }))
    .filter((s): s is ProgressLevelSummary => Boolean(s));

  const trainPct = levelSummaries.length > 0
    ? Math.round(levelSummaries.reduce((sum, s) => sum + s.progressPercent, 0) / levelSummaries.length)
    : 0;

  // ── Missions progress (same calculation as before) ─────────────────────────
  const atcPct = MISSIONS.length > 0
    ? Math.round((state.completedMissions.length / MISSIONS.length) * 100)
    : 0;

  const overallPct = Math.round((trainPct + atcPct) / 2);
  const hasAccuracyData = state.scoredCount > 0;

  // ── Skills — always show all 5; only render bars when real data exists ────
  const zeroStat: SkillStats = { totalScore: 0, count: 0 };
  const skillStats = state.skillStats ?? {
    listening:   zeroStat,
    readbacks:   zeroStat,
    phraseology: zeroStat,
    speaking:    zeroStat,
    confidence:  zeroStat,
  };

  const listeningHasData   = skillStats.listening.count > 0;
  const readbacksHasData   = skillStats.readbacks.count > 0;
  const phraseologyHasData = skillStats.phraseology.count > 0;
  const speakingHasData    = (skillStats.speaking?.count ?? 0) > 0;
  const confidenceHasData  = skillStats.confidence.count > 0;

  const stageNote = upcoming
    ? `${remaining} ${remaining === 1 ? "module" : "modules"} to ${upcoming.name}`
    : "Top stage reached";

  const sessions = state.history.slice(0, 2);

  return (
    <div className="flex h-full min-h-0 flex-col lg:h-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="mb-3 shrink-0 lg:mb-6">
        <h1 className="text-xl font-bold tracking-tight lg:text-[28px]">Progress</h1>
        <p className="text-xs text-slate-400 lg:text-sm">Track your training performance.</p>
      </header>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-1 lg:min-h-0 lg:flex-none lg:overflow-visible lg:space-y-0">

        {/* ── Desktop dashboard grid — same cards, arranged in columns ────── */}
        <div className="space-y-2.5 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">

        {/* ── 1. Overall Progress — hero card ─────────────────────────────── */}
        <section
          className="overflow-hidden rounded-[20px] border border-white/[0.06] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.7)] lg:col-span-2 lg:row-span-1"
          style={{ background: "linear-gradient(135deg, #0D1828 0%, #0A1119 60%, #091118 100%)" }}
        >
          {/* top bar: label + stage badge */}
          <div className="flex items-center justify-between px-4 pt-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FACC15]">
              Overall Progress
            </p>
            <span className="rounded-full bg-[#FACC15]/10 px-2 py-0.5 text-[10px] font-bold text-[#FACC15]">
              {level.name}
            </span>
          </div>

          {/* ring (hero) + breakdown (secondary) */}
          <div className="flex items-center gap-5 px-4 pb-3.5 pt-2.5">
            {/* The OverallRing — unchanged */}
            <OverallRing value={overallPct} />

            <div className="min-w-0 flex-1">
              {/* stage note — primary text in this column */}
              <p className="mb-2.5 text-[11px] font-medium text-slate-400">{stageNote}</p>

              {/* Train breakdown — secondary */}
              <div className="mb-1.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Train</span>
                  <span className="text-[11px] font-semibold text-[#38BDF8]">{trainPct}%</span>
                </div>
                <Bar pct={trainPct} color="#38BDF8" h={4} />
              </div>

              {/* Missions breakdown — secondary */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Missions</span>
                  <span className="text-[11px] font-semibold text-[#FACC15]">{atcPct}%</span>
                </div>
                <Bar pct={atcPct} color="#FACC15" h={4} />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Quick metrics ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 lg:col-span-2 lg:gap-4">

          {/* Sessions */}
          <div className="rounded-[18px] border border-white/[0.04] bg-[#0B1322] px-3 py-3">
            <div className="flex items-center gap-2">
              <IconBubble color="#38BDF8" size={30}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#38BDF8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </IconBubble>
              <p className="text-[20px] font-extrabold leading-none text-[#38BDF8]">
                {state.sessionsCount ?? 0}
              </p>
            </div>
            <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Sessions</p>
          </div>

          {/* Accuracy */}
          <div className="rounded-[18px] border border-white/[0.04] bg-[#0B1322] px-3 py-3">
            <div className="flex items-center gap-2">
              <IconBubble color="#FACC15" size={30}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#FACC15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </IconBubble>
              <p
                className={`text-[20px] font-extrabold leading-none ${
                  hasAccuracyData ? performanceColor(state.accuracy ?? 0) : "text-slate-600"
                }`}
              >
                {hasAccuracyData ? `${state.accuracy ?? 0}%` : "—"}
              </p>
            </div>
            <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              {hasAccuracyData ? "Accuracy" : "Not scored yet"}
            </p>
          </div>

          {/* Streak */}
          <div className="rounded-[18px] border border-white/[0.04] bg-[#0B1322] px-3 py-3">
            <div className="flex items-center gap-2">
              <IconBubble color="#FACC15" size={30}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#FACC15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </IconBubble>
              <p className="text-[20px] font-extrabold leading-none text-[#FACC15]">
                {state.streakDays ?? 0}d
              </p>
            </div>
            <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Streak</p>
          </div>

        </div>

        {/* ── 3. Skills — always 5 skills, primary section ─────────────────── */}
        <section className="rounded-[20px] border border-white/[0.04] bg-[#0B1322] px-4 py-3.5 lg:row-span-2 lg:self-start lg:px-5 lg:py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FACC15]">Skills</p>
          <div className="space-y-3.5">
            <SkillRow
              name="Listening"
              icon={<IcoHeadphones size={22} color={listeningHasData ? performanceBarColor(state.skills.listening) : "#475569"} />}
              value={state.skills.listening}
              hasData={listeningHasData}
              pendingLabel="No scored sessions yet"
            />
            <SkillRow
              name="Phraseology"
              icon={<IcoPhraseology size={22} color={phraseologyHasData ? performanceBarColor(state.skills.phraseology) : "#475569"} />}
              value={state.skills.phraseology}
              hasData={phraseologyHasData}
              pendingLabel="No scored sessions yet"
            />
            <SkillRow
              name="Readbacks"
              icon={<IcoReadback size={22} color={readbacksHasData ? performanceBarColor(state.skills.readbacks) : "#475569"} />}
              value={state.skills.readbacks}
              hasData={readbacksHasData}
              pendingLabel="Complete readback exercises to build this score"
            />
            <SkillRow
              name="Speaking"
              icon={<IcoMic size={22} color={speakingHasData ? performanceBarColor(state.skills.speaking ?? 0) : "#475569"} />}
              value={state.skills.speaking ?? 0}
              hasData={speakingHasData}
              pendingLabel="Complete voice exercises to build speaking score"
            />
            <SkillRow
              name="Confidence"
              icon={<IcoConfidence size={22} color={confidenceHasData ? performanceBarColor(state.skills.confidence) : "#475569"} />}
              value={state.skills.confidence}
              hasData={confidenceHasData}
              pendingLabel="Complete missions to build confidence"
              tag={confidenceHasData ? "Missions · Alpha" : undefined}
            />
          </div>

          {/* Desktop-only: compact Pro CTA — fills otherwise empty space under Skills */}
          {!isPro && (
            <div className="mt-5 hidden rounded-[14px] border border-[#FACC15]/20 bg-[#FACC15]/5 p-3.5 lg:block">
              <p className="text-[12px] font-bold text-white">Unlock advanced analytics</p>
              <p className="mt-1 text-[10.5px] leading-snug text-slate-400">
                Deeper skill breakdowns and mission-by-mission history with Pro.
              </p>
              <Link
                href="/aerocomms/app/paywall"
                className="mt-3 flex h-[34px] w-full items-center justify-center rounded-[9px] bg-[#FACC15] text-[10.5px] font-bold uppercase tracking-wide text-[#07111F] transition-colors hover:bg-[#EAB308]"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
        </section>

        {/* ── 4. Recent Sessions — max 2 ───────────────────────────────────── */}
        <section className="space-y-2 lg:col-span-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#FACC15]">Recent Sessions</p>

          {sessions.length === 0 ? (
            <div className="rounded-[18px] border border-white/[0.04] bg-[#0B1322] px-4 py-3 text-[12px] text-slate-400">
              No sessions yet. Complete an exercise or mission to see it here.
            </div>
          ) : (
            <>
              {sessions.map((s) => {
                const src        = inferSource(s);
                const badge      = SOURCE_BADGE[src];
                const iconColor  = SESSION_ICON_COLOR[src] ?? "#94A3B8";
                const iconFn     = SESSION_ICONS[src];
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-[18px] border border-white/[0.04] bg-[#0B1322] px-3 py-2.5"
                  >
                    {/* source icon bubble */}
                    <IconBubble color={iconColor} size={34}>
                      {iconFn?.(iconColor) ?? null}
                    </IconBubble>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-slate-100">{s.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {s.detail ? (
                          <span className="truncate text-[10px] text-slate-500">{s.detail}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      {isRecordScored(s) && s.score !== undefined ? (
                        <span className={`text-[14px] font-bold ${performanceColor(s.score)}`}>{s.score}</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#FACC15]">✓ Complete</span>
                      )}
                      {s.stars != null && (
                        <span className="text-[10px] text-[#FACC15]">{s.stars}★</span>
                      )}
                    </div>
                  </div>
                );
              })}

            </>
          )}
        </section>

        </div>
      </div>
    </div>
  );
}
