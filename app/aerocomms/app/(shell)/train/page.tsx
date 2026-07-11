"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useSyncExternalStore } from "react";
import { useAppState } from "@/lib/aerocomms/appState";
import {
  LEVELS,
  isLevelUnlocked,
  moduleCompletion,
  trainModules,
  trainSections,
  type Module,
} from "@/lib/aerocomms/content";
import { persistTrainLevelId, resolveTrainLevelIndex, trainHref, levelIndexFromId } from "@/lib/aerocomms/trainLevel";

const LEVEL_TRAIN_BACKGROUNDS: Record<string, string> = {
  cadet: "/images/aerocomms/cadetrain.webp",
  "student-pilot": "/images/aerocomms/studentrain.webp",
  "ready-for-radio": "/images/aerocomms/readytrain.webp?v=2",
  "airline-prep": "/images/aerocomms/airtrain.webp",
  "advanced-ops": "/images/aerocomms/adtrain.webp",
};

type ModuleStatus = "done" | "current" | "available" | "locked";

type ModuleIconKind =
  | "radio"
  | "mic"
  | "headphones"
  | "readback"
  | "phraseology"
  | "route"
  | "default";

function moduleIconKind(moduleId: string, moduleName: string): ModuleIconKind {
  const id = moduleId.toLowerCase();
  const name = moduleName.toLowerCase();
  if (id.includes("radio-fundamentals") || name.includes("radio fundamentals")) return "radio";
  if (id.includes("first-contact") || name.includes("first contact")) return "mic";
  if (id.includes("listening") || name === "listening") return "headphones";
  if (id.includes("readback") || name.includes("readback")) return "readback";
  if (id.includes("phraseology") || name.includes("phraseology")) return "phraseology";
  if (id.includes("scenario") || name.includes("scenario")) return "route";
  return "default";
}

function iconColorForStatus(status: ModuleStatus): string {
  if (status === "done" || status === "current") return "#FDE047";
  if (status === "locked") return "#64748B";
  return "#94A3B8";
}

function ModuleIconSvg({ kind, color, size = 19 }: { kind: ModuleIconKind; color: string; size?: number }) {
  const props = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "radio":
      return (
        <svg {...props}>
          <path d="M4.5 9.5a7.5 7.5 0 0 1 15 0" />
          <path d="M7 12.5a4.5 4.5 0 0 1 10 0" />
          <circle cx="12" cy="16" r="1.5" fill={color} stroke="none" />
          <path d="M12 17.5V21" />
        </svg>
      );
    case "mic":
      return (
        <svg {...props}>
          <path d="M12 1.75a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0v-7a3 3 0 0 0-3-3z" />
          <path d="M19 10.5a7 7 0 0 1-14 0" />
          <path d="M12 17.5v4.75" />
          <path d="M8.5 22.25h7" />
        </svg>
      );
    case "headphones":
      return (
        <svg {...props}>
          <path d="M3 14v5a2 2 0 0 0 2 2h1" />
          <path d="M21 14v5a2 2 0 0 1-2 2h-1" />
          <path d="M3 14a9 9 0 0 1 18 0" />
        </svg>
      );
    case "readback":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4.5V12h7.5" />
          <path d="M9.5 12.5l2 2 4-4" />
        </svg>
      );
    case "phraseology":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case "route":
      return (
        <svg {...props}>
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M8 17.5 14.5 7.5" />
          <path d="m14 5 2-2 2 2" />
          <path d="M16 5v3" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
          <path d="M4 5.5V20.5" />
        </svg>
      );
  }
}

function ModuleGlyph({
  moduleId,
  moduleName,
  status,
}: {
  moduleId: string;
  moduleName: string;
  status: ModuleStatus;
}) {
  const kind = moduleIconKind(moduleId, moduleName);
  const color = iconColorForStatus(status);

  if (status === "done") {
    return (
      <svg viewBox="0 0 24 24" width={19} height={19} fill="none" stroke="#FACC15" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" />
      </svg>
    );
  }

  if (status === "locked") {
    return (
      <svg viewBox="0 0 24 24" width={19} height={19} fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="11" width="15" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  return <ModuleIconSvg kind={kind} color={color} size={19} />;
}

function StatusLabel({ status }: { status: ModuleStatus }) {
  if (status === "done")    return <span className="rounded-full bg-[#FACC15]/18 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FDE047]">Done</span>;
  if (status === "current") return <span className="rounded-full bg-[#FACC15]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FDE047]">Current</span>;
  if (status === "locked")  return <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">Locked</span>;
  return <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">Start</span>;
}

// ─── progress bar ────────────────────────────────────────────────────────────

function ModuleProgressBar({ percent, status }: { percent: number; status: ModuleStatus }) {
  if (status === "locked") {
    return <div className="mt-2.5 h-[4px] w-full overflow-hidden rounded-full bg-white/[0.03]" />;
  }

  if (status === "done") {
    return (
      <div className="mt-2.5 h-[4px] w-full overflow-hidden rounded-full bg-[#FACC15]/20">
        <div className="h-full w-full rounded-full bg-[#FACC15]" />
      </div>
    );
  }

  if (status === "current") {
    return (
      <div className="mt-2.5 h-[5px] w-full overflow-hidden rounded-full bg-[#FACC15]/15">
        <div
          className="h-full rounded-full bg-[#FDE047] transition-all duration-500"
          style={{ width: `${Math.max(percent, 8)}%` }}
        />
      </div>
    );
  }

  if (percent === 0) {
    return <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]" />;
  }

  return (
    <div className="mt-2.5 h-[4px] w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-[#FACC15]/80 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ─── module card ─────────────────────────────────────────────────────────────

function TrainModuleCard({
  moduleId,
  title,
  status,
  completion,
  countLabel,
  onClick,
  disabled,
}: {
  moduleId: string;
  title: string;
  status: ModuleStatus;
  completion: number;
  countLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const isCurrent = status === "current";
  const isLocked  = status === "locked";
  const isDone    = status === "done";

  const content = (
    <>
      {/* Icon bubble */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-[11px]"
        style={{
          background: isCurrent
            ? "rgba(253,224,71,0.16)"
            : isDone
            ? "rgba(250,204,21,0.12)"
            : isLocked
            ? "rgba(255,255,255,0.02)"
            : "rgba(255,255,255,0.05)",
          boxShadow: isCurrent
            ? "inset 0 0 0 1px rgba(253,224,71,0.35)"
            : isDone
            ? "inset 0 0 0 1px rgba(250,204,21,0.28)"
            : isLocked
            ? "inset 0 0 0 1px rgba(255,255,255,0.05)"
            : "inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        <ModuleGlyph moduleId={moduleId} moduleName={title} status={status} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 self-center">
        <p
          className={`line-clamp-2 text-[14px] font-semibold leading-snug ${
            isLocked ? "text-slate-500" : "text-white"
          }`}
        >
          {title}
        </p>
        <ModuleProgressBar percent={completion} status={status} />
      </div>

      {/* Status + count */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-1 self-stretch pl-1 py-0.5">
        <StatusLabel status={status} />
        {countLabel ? (
          <span className="whitespace-nowrap text-[10px] text-slate-500">{countLabel}</span>
        ) : null}
      </div>
    </>
  );

  const baseClass = `flex w-full shrink-0 items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left transition-all lg:rounded-[16px] lg:px-4 lg:py-4 ${
    isCurrent
      ? "border-[#FDE047]/30 bg-[#0C1A2A] shadow-[0_0_0_1px_rgba(253,224,71,0.10),0_8px_24px_-10px_rgba(0,0,0,0.5)]"
      : isDone
      ? "border-[#FACC15]/12 bg-[#0B1322]"
      : "border-white/[0.05] bg-[#0B1322]"
  } ${isLocked ? "opacity-50" : ""} min-h-[78px] lg:min-h-[84px]`;

  if (disabled || !onClick) {
    return <div aria-disabled="true" className={baseClass}>{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} hover:border-white/10 active:scale-[0.99] lg:hover:border-[#FACC15]/35 lg:hover:shadow-[0_12px_28px_-14px_rgba(250,204,21,0.35)]`}
    >
      {content}
    </button>
  );
}

// ─── section header ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-0.5 lg:gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FACC15] lg:text-[11px]">{title}</p>
      <div className="h-px flex-1 bg-[#FACC15]/12" />
    </div>
  );
}

// ─── scenario teaser ─────────────────────────────────────────────────────────

function AtcSimTeaserCard({ body }: { body: string }) {
  return (
    <div
      className="rounded-[18px] border border-[#D97706]/15 bg-[#0B1322] px-3.5 py-3.5"
      style={{ opacity: 0.85 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            background: "rgba(217,119,6,0.10)",
            boxShadow: "inset 0 0 0 1px rgba(217,119,6,0.20)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] text-[#D4A855]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="11" width="15" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-300">Ready for a full scenario?</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{body}</p>
        </div>
      </div>
    </div>
  );
}

// ─── level progress indicator ────────────────────────────────────────────────

function LevelProgress({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all ${
            i === current ? "h-[5px] w-5 bg-[#FACC15]" : "h-[5px] w-[5px] bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

/** True only after client hydration — avoids SSR/client markup mismatch. */
function useIsClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ─── hydration-safe skeleton ─────────────────────────────────────────────────

/** Stable placeholder — no localStorage, sessionStorage, or appState. */
function TrainPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <section className="relative overflow-hidden rounded-[20px] border border-[#FACC15]/15 bg-[#0C1A28] px-4 py-3.5 shadow-[0_8px_32px_-12px_rgba(250,204,21,0.18)]">
        <div className="flex items-center justify-between gap-2">
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/5" aria-hidden />
          <div className="flex flex-1 flex-col items-center gap-1.5 px-2">
            <div className="h-5 w-24 rounded bg-white/10" aria-hidden />
            <div className="h-3 w-32 rounded bg-white/5" aria-hidden />
          </div>
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/5" aria-hidden />
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {Array.from({ length: LEVELS.length }, (_, i) => (
            <span key={i} className="h-[5px] w-[5px] rounded-full bg-white/15" />
          ))}
        </div>
      </section>
      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1 space-y-4 pb-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[78px] rounded-[18px] border border-white/[0.05] bg-[#0B1322]" aria-hidden />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── page content ────────────────────────────────────────────────────────────

function TrainPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { state }    = useAppState();
  const mounted      = useIsClientMounted();
  const urlLevel     = searchParams.get("level");
  // Before mount: URL only (stable SSR + hydration). After mount: URL or sessionStorage.
  const index        = mounted
    ? resolveTrainLevelIndex(urlLevel)
    : levelIndexFromId(urlLevel);

  useEffect(() => {
    if (!mounted) return;
    persistTrainLevelId(LEVELS[index].id);
  }, [mounted, index]);

  if (!mounted) {
    return <TrainPageSkeleton />;
  }

  const selectLevel = (newIndex: number) => {
    const levelId = LEVELS[newIndex].id;
    persistTrainLevelId(levelId);
    router.replace(trainHref(levelId), { scroll: false });
  };

  const level     = LEVELS[index];
  const levelBackground = LEVEL_TRAIN_BACKGROUNDS[level.id];
  const canPrev   = index > 0;
  const canNext   = index < LEVELS.length - 1;
  const isPro     = state.subscription === "pro";
  const completed = new Set(state.completedExercises);
  const unlocked  = isLevelUnlocked(level, completed, isPro);
  const currentModuleId = trainModules(level).find((m) => moduleCompletion(m, completed) < 100)?.id;

  const statusFor = (mod: Module): ModuleStatus => {
    const c = moduleCompletion(mod, completed);
    if (c === 100) return "done";
    if (!unlocked) return "locked";
    if (mod.id === currentModuleId) return "current";
    return "available";
  };

  const countLabel = (mod: Module) =>
    mod.topics
      ? `${mod.topics.length} ${mod.unit ?? "topics"}`
      : `${mod.exercises.length} ${mod.unit ?? "exercises"}`;

  const renderModule = (mod: Module) => {
    const status     = statusFor(mod);
    const completion = moduleCompletion(mod, completed);
    return (
      <TrainModuleCard
        key={mod.id}
        moduleId={mod.id}
        title={mod.name}
        status={status}
        completion={completion}
        countLabel={countLabel(mod)}
        onClick={() => router.push(`/aerocomms/app/module/${mod.id}`)}
      />
    );
  };

  const sections = trainSections(level);

  const atcSimTeaserBody =
    level.id === "cadet"
      ? "Cadet missions unlock in ATC Sim after the required practice."
      : level.id === "student-pilot"
      ? "Student Pilot missions unlock in ATC Sim after the required practice."
      : level.id === "ready-for-radio"
      ? "Ready For Radio missions unlock in ATC Sim after the required practice."
      : level.id === "airline-prep"
      ? "Airline Prep missions unlock in ATC Sim after the required practice."
      : level.id === "advanced-ops"
      ? "Advanced Ops missions unlock in ATC Sim after the required practice."
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:h-auto lg:gap-6">

      {/* ── Level selector ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[20px] border border-[#FACC15]/15 px-4 py-3.5 shadow-[0_8px_32px_-12px_rgba(250,204,21,0.18)] lg:rounded-[24px] lg:px-8 lg:py-6">
        {levelBackground && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${levelBackground}')` }}
          />
        )}

        <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          {/* Prev */}
          <button
            type="button"
            onClick={() => canPrev && selectLevel(index - 1)}
            disabled={!canPrev}
            aria-label="Previous level"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors enabled:hover:bg-white/10 disabled:opacity-25 lg:h-10 lg:w-10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          {/* Level info */}
          <div className="min-w-0 flex-1 text-center">
            <div className="flex items-center justify-center gap-1.5">
              {!unlocked && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4.5" y="11" width="15" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              )}
              <h2 className="text-[18px] font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(2,11,24,0.9)] lg:text-[26px]">{level.name}</h2>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-300 drop-shadow-[0_1px_6px_rgba(2,11,24,0.9)] lg:mt-1 lg:text-[13px]">{level.tagline}</p>
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() => canNext && selectLevel(index + 1)}
            disabled={!canNext}
            aria-label="Next level"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors enabled:hover:bg-white/10 disabled:opacity-25 lg:h-10 lg:w-10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* Level progress dots */}
        <LevelProgress total={LEVELS.length} current={index} />
        </div>
      </section>

      {/* ── Modules grouped by section ─────────────────────────────────── */}
      <section className="flex min-h-0 flex-1 flex-col gap-2 lg:min-h-0 lg:flex-none lg:gap-4">
        {!unlocked && (
          <p className="text-[11px] text-slate-500 lg:text-[13px]">
            {level.preview
              ? "Preview available · Pro to unlock"
              : `Complete ${LEVELS[index - 1]?.name ?? "previous level"} to unlock`}
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-1 lg:min-h-0 lg:flex-none lg:overflow-visible lg:space-y-6">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-2 lg:space-y-3">
              <SectionHeader title={sec.title} />
              <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
                {sec.modules.map(renderModule)}
              </div>
            </div>
          ))}

          {atcSimTeaserBody && (
            <div className="lg:max-w-md">
              <AtcSimTeaserCard body={atcSimTeaserBody} />
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

// ─── page wrapper (Suspense for useSearchParams) ─────────────────────────────

export default function TrainPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 flex-col gap-3">
          <section className="rounded-[20px] border border-[#FACC15]/15 bg-[#0C1A28] px-4 py-3.5">
            <div className="h-[72px]" />
          </section>
        </div>
      }
    >
      <TrainPageContent />
    </Suspense>
  );
}
