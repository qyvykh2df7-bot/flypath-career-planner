"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAppState } from "@/lib/aerocomms/appState";
import { currentLevel } from "@/lib/aerocomms/content";

// ─── types ───────────────────────────────────────────────────────────────────

type Row = {
  label: string;
  value?: string;
  icon: ReactNode;
  iconColor?: string;
  pro?: boolean;
  toggle?: boolean;
  toggleOn?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

// ─── sub-components ──────────────────────────────────────────────────────────

function IconBubble({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
      style={{
        background: `${color}16`,
        boxShadow: `inset 0 0 0 1px ${color}28`,
      }}
    >
      {children}
    </div>
  );
}

function SettingsIcon({ paths, color = "#94A3B8" }: { paths: ReactNode; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={17}
      height={17}
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}

function SettingsGroup({
  title,
  rows,
  accentColor = "#FACC15",
}: {
  title: string;
  rows: Row[];
  accentColor?: string;
}) {
  return (
    <section>
      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: accentColor }}
      >
        {title}
      </p>
      <div className="overflow-hidden rounded-[18px] border border-white/[0.05] bg-[#0B1322]">
        {rows.map((row, i) => (
          <button
            key={row.label}
            type="button"
            onClick={row.onClick}
            className={`flex w-full items-center gap-3 px-3.5 text-left transition-colors active:bg-white/[0.03] ${
              i < rows.length - 1 ? "border-b border-white/[0.04]" : ""
            }`}
            style={{ minHeight: 52 }}
          >
            <IconBubble color={row.danger ? "#f87171" : (row.iconColor ?? "#64748B")}>
              {row.icon}
            </IconBubble>

            <span className={`flex-1 text-[13px] font-medium ${row.danger ? "text-red-400" : "text-slate-200"}`}>
              {row.label}
            </span>

            {row.pro && (
              <span className="rounded bg-[#FACC15]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FACC15]">
                Pro
              </span>
            )}
            {row.value && (
              <span className="text-[12px] font-medium text-slate-400">{row.value}</span>
            )}

            {row.toggle ? (
              <span
                className={`flex h-[22px] w-[40px] items-center rounded-full px-0.5 transition-colors ${
                  row.toggleOn ? "bg-[#FACC15]" : "bg-white/15"
                }`}
              >
                <span
                  className={`h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
                    row.toggleOn ? "translate-x-[18px]" : ""
                  }`}
                />
              </span>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { state, setNotifications, cycleDailyGoal, cycleDifficulty, resetProgressOnly } =
    useAppState();
  // Subscription UI mapping (reads state.subscription only — never hardcoded):
  //   "pro"  → badge "Pro" + "AeroComms Pro Active" (no upgrade CTA)
  //   "free" → badge "Free" + "Upgrade to AeroComms Pro" button → /paywall
  const isPro    = state.subscription === "pro";
  const initial  = (state.name?.[0] ?? "J").toUpperCase();

  // Dynamic level — derived from real completedExercises, never hardcoded
  const completed = new Set(state.completedExercises);
  const level     = currentLevel(completed, isPro);

  const handleResetProgress = () => {
    const confirmed = window.confirm(
      "Reset all training and mission progress?\n\nThis keeps your profile, preferences and settings.",
    );
    if (confirmed) resetProgressOnly();
  };

  // ── Preference rows ───────────────────────────────────────────────────────
  const preferences: Row[] = [
    {
      label:      "Audio Settings",
      value:      "On",
      iconColor:  "#38BDF8",
      onClick:    () => alert("Audio settings coming soon."),
      icon: (
        <SettingsIcon color="#38BDF8" paths={
          <>
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
          </>
        } />
      ),
    },
    {
      label:      "ATC Accent",
      value:      "Standard",
      iconColor:  "#A855F7",
      pro:        !isPro,
      onClick:    () => { if (!isPro) router.push("/aerocomms/app/paywall"); },
      icon: (
        <SettingsIcon color="#A855F7" paths={
          <>
            <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
            <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
          </>
        } />
      ),
    },
    {
      label:      "Difficulty",
      value:      state.difficulty,
      iconColor:  "#FACC15",
      onClick:    cycleDifficulty,
      icon: (
        <SettingsIcon color="#FACC15" paths={
          <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
        } />
      ),
    },
    {
      label:      "Daily Goal",
      value:      state.dailyGoal,
      iconColor:  "#FACC15",
      onClick:    cycleDailyGoal,
      icon: (
        <SettingsIcon color="#FACC15" paths={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        } />
      ),
    },
    {
      label:      "Notifications",
      toggle:     true,
      toggleOn:   state.notifications,
      iconColor:  "#64748B",
      onClick:    () => setNotifications(!state.notifications),
      icon: (
        <SettingsIcon paths={
          <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </>
        } />
      ),
    },
  ];

  // ── Support rows ──────────────────────────────────────────────────────────
  const support: Row[] = [
    {
      label:     "Help",
      iconColor: "#38BDF8",
      onClick:   () => alert("Help center coming soon."),
      icon: (
        <SettingsIcon color="#38BDF8" paths={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3M12 17h.01" />
          </>
        } />
      ),
    },
    {
      label:     "Send Feedback",
      iconColor: "#FACC15",
      onClick:   () => alert("Feedback form coming soon."),
      icon: (
        <SettingsIcon color="#FACC15" paths={
          <path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5z" />
        } />
      ),
    },
    {
      label:     "About AeroComms",
      iconColor: "#64748B",
      onClick:   () => alert("AeroComms Alpha · v1.0\nBuilt for pilots."),
      icon: (
        <SettingsIcon paths={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v4h1" />
          </>
        } />
      ),
    },
  ];

  // ── Alpha tools rows ──────────────────────────────────────────────────────
  const alphaTools: Row[] = [
    {
      label:   "Reset Progress",
      danger:  true,
      onClick: handleResetProgress,
      icon: (
        <SettingsIcon color="#f87171" paths={
          <>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </>
        } />
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:h-auto lg:mx-auto lg:max-w-2xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 lg:mb-2">
        <h1 className="text-xl font-bold tracking-tight lg:text-[28px]">Profile</h1>
        <p className="text-xs text-slate-400 lg:text-sm">Settings &amp; subscription</p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1 lg:min-h-0 lg:flex-none lg:overflow-visible lg:space-y-4">

        {/* ── Identity card ───────────────────────────────────────────────── */}
        <section
          className="overflow-hidden rounded-[20px] border border-[#FACC15]/15 p-4 shadow-[0_12px_40px_-16px_rgba(250,204,21,0.25)] lg:p-6"
          style={{ background: "linear-gradient(135deg, #0C1A28 0%, #0A1119 100%)" }}
        >
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div
              className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] text-[22px] font-extrabold text-[#FACC15]"
              style={{
                background: "rgba(250,204,21,0.12)",
                boxShadow: "inset 0 0 0 1.5px rgba(250,204,21,0.28)",
              }}
            >
              {initial}
            </div>

            {/* Name + level */}
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-tight text-white">{state.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {state.experience ?? "Student Pilot"} · {level.name}
              </p>
            </div>

            {/* Subscription badge */}
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                isPro
                  ? "bg-[#FACC15]/15 text-[#FACC15] ring-1 ring-[#FACC15]/30"
                  : "bg-white/5 text-slate-400 ring-1 ring-white/10"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>

          {/* Upgrade CTA */}
          {!isPro ? (
            <button
              type="button"
              onClick={() => router.push("/aerocomms/app/paywall")}
              className="mt-3.5 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#FACC15] text-[13px] font-bold uppercase tracking-wide text-[#07111F] shadow-[0_14px_32px_-10px_rgba(250,204,21,0.65)] transition-colors hover:bg-[#EAB308] active:scale-[0.99]"
            >
              <svg viewBox="0 0 20 20" width={16} height={16} fill="currentColor">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
              </svg>
              Upgrade to AeroComms Pro
            </button>
          ) : (
            <div className="mt-3.5 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] border border-[#FACC15]/25 bg-[#FACC15]/8 text-[13px] font-bold uppercase tracking-wide text-[#FACC15]">
              <svg viewBox="0 0 20 20" width={15} height={15} fill="currentColor">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              AeroComms Pro Active
            </div>
          )}
        </section>

        <SettingsGroup title="Preferences" rows={preferences} />
        <SettingsGroup title="Support" rows={support} />
        <SettingsGroup title="Alpha Tools" rows={alphaTools} accentColor="#FB923C" />

        <p className="pb-1 pt-1 text-center text-[10px] text-slate-700">
          AeroComms Alpha · v1.0
        </p>
      </div>
    </div>
  );
}
