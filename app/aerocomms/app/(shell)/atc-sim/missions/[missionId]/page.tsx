"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  findMission,
  LEVELS,
  saveDescriptor,
  type AtcMission,
  type AtcSessionDescriptor,
} from "@/lib/aerocomms/atcSim";
import { useAppState } from "@/lib/aerocomms/appState";
import { getMissionUnlockState } from "@/lib/aerocomms/progress";
import MissionLevelImage from "@/components/aerocomms/app/atc-sim/MissionLevelImage";

function MissionDetailHeroFallback({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(170deg, #0A1A34 0%, #1a2a48 40%, #2d1a0e 70%, #1a0d04 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{ background: `linear-gradient(to top, ${accent}30 0%, transparent 100%)` }}
      />
      <svg viewBox="0 0 360 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect x="0" y="148" width="360" height="32" fill="#0D1C2E" />
        <path d="M0 150h360" stroke={accent} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="18 12" />
        <rect x="162" y="68" width="16" height="80" fill="#122035" />
        <rect x="154" y="56" width="32" height="20" rx="3" fill="#162840" />
        <rect x="156" y="58" width="28" height="14" rx="2" fill="#1E3A54" />
        <line x1="170" y1="56" x2="170" y2="38" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <circle cx="170" cy="36" r="4" fill={accent} fillOpacity="0.9" />
        <circle cx="170" cy="36" r="9" fill={accent} fillOpacity="0.15" />
        <g opacity="0.4">
          <circle cx="290" cy="65" r="44" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="290" cy="65" r="28" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="290" cy="65" r="13" fill="none" stroke={accent} strokeWidth="1.2" strokeOpacity="0.5" />
          <line x1="290" y1="65" x2="327" y2="40" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
        </g>
        <g transform="translate(55,60) rotate(-20)" opacity="0.55">
          <path d="M0-10 L2.5 0 L10 1.5 L2.5 3 L1.5 10 L0 8 L-1.5 10 L-2.5 3 L-10 1.5 L-2.5 0 Z" fill={accent} fillOpacity="0.8" />
        </g>
        <path d="M0 148h360" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
        <rect x="168" y="152" width="4" height="14" rx="2" fill="white" fillOpacity="0.2" />
        <rect x="176" y="152" width="4" height="14" rx="2" fill="white" fillOpacity="0.2" />
        <rect x="184" y="152" width="4" height="14" rx="2" fill="white" fillOpacity="0.2" />
      </svg>
    </>
  );
}

export default function MissionDetailPage() {
  const router = useRouter();
  const params = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<AtcMission | null>(null);
  const { state, access } = useAppState();
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const m = findMission(params.missionId);
    if (!m) { router.replace("/aerocomms/app/atc-sim/missions"); return; }
    // Unlock check uses the shared access contract plus real mission requirements.
    // m.locked is passed as legacyLocked for missions not yet in MISSION_REQS.
    const unlockState = getMissionUnlockState(m.id, state.completedExercises, m.locked, access.isPro);
    if (!unlockState.effectiveUnlocked) { router.replace("/aerocomms/app/atc-sim/missions"); return; }
    queueMicrotask(() => {
      if (active) setMission(m);
    });
    return () => {
      active = false;
    };
  }, [access.isPro, params.missionId, router, state.completedExercises]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const apply = () => {
      el.style.height = window.matchMedia("(max-width: 1023px)").matches
        ? "calc(100dvh - 120px)"
        : "";
    };
    apply();
    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mission]);

  if (!mission) return null;

  const accent = LEVELS[mission.level].accent;

  const start = () => {
    const descriptor: AtcSessionDescriptor = {
      source: "mission",
      title: mission.title,
      phaseBadge: mission.phaseBadge,
      missionId: mission.id,
      level: mission.level,
      config: { airport: "Small Airfield", phase: mission.phaseBadge, difficulty: mission.difficulty, traffic: "Low", weather: "Good VMC", voice: "Standard" },
      steps: mission.steps,
    };
    saveDescriptor(descriptor);
    router.push("/aerocomms/app/atc-sim/session");
  };

  const practiceBullets = mission.bullets.slice(0, 4);
  const hasContextBriefing =
    !!mission.context &&
    ((mission.context.whatYouKnow?.length ?? 0) > 0 || (mission.context.whatYouNeed?.length ?? 0) > 0);

  return (
    <div className="relative w-full lg:h-auto">
      <div ref={shellRef} className="mission-detail-shell flex h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-[24px] border border-[rgba(96,165,250,0.10)] bg-[#020B18] shadow-[0_24px_56px_rgba(0,0,0,0.38)] lg:h-auto">
        {/* ── 1. IMAGE — flexible: absorbs leftover card height so the button always
             lands near the card bottom, identical structure on every viewport ── */}
        <div className="mission-detail-image relative min-h-[110px] flex-[1_1_185px] overflow-hidden lg:h-[185px] lg:min-h-0 lg:flex-none">
          <MissionLevelImage
            level={mission.level}
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 1023px) 100vw, 760px"
            style={{ objectPosition: "center" }}
            fallback={<MissionDetailHeroFallback accent={accent} />}
          />

          <button
            type="button"
            onClick={() => router.push("/aerocomms/app/atc-sim/missions")}
            aria-label="Back"
            className="absolute left-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-[rgba(2,6,23,0.55)] text-[#E2E8F0] backdrop-blur-[8px]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[95px] lg:hidden"
            style={{
              background:
                "linear-gradient(to bottom, rgba(2,11,24,0) 0%, rgba(2,11,24,0.35) 35%, rgba(2,11,24,0.78) 70%, rgba(2,11,24,1) 100%)",
            }}
          />
          {/* Desktop — subtle fade into content block (#020B18) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[76px] lg:block"
          >
            <div
              className="absolute inset-0 backdrop-blur-[4px]"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0.55) 82%, black 100%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0.55) 82%, black 100%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020B18]/0 via-[#020B18]/22 to-[#020B18]" />
          </div>
        </div>

        {/* ── 2. CONTENT — natural height stack; hero above absorbs leftover space ── */}
        <div className="mission-detail-content flex flex-none flex-col px-4 pb-4 pt-5 lg:pb-3 lg:pt-12">
          <h1 className="mission-detail-title mb-3 shrink-0 text-[29px] font-black leading-[1.05] tracking-[-0.025em] text-white lg:mb-3.5">
            {mission.title}
          </h1>

          <div className="mission-detail-badges mb-3.5 flex shrink-0 flex-wrap items-center gap-2 lg:mb-3">
            {[
              { label: LEVELS[mission.level].short, colored: true },
              { label: mission.difficulty, colored: false },
              { label: mission.duration, colored: false },
            ].map(({ label, colored }) => (
              <span
                key={label}
                className="inline-flex h-[30px] items-center rounded-full px-3 text-[12.5px] font-extrabold"
                style={
                  colored
                    ? { background: `${accent}22`, color: accent, boxShadow: `0 0 0 1px ${accent}38` }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(226,232,240,0.78)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {label}
              </span>
            ))}
          </div>

          {/* Hidden on short-mobile — saves ~40px for checklist */}
          <p className="mission-detail-desc mb-4 line-clamp-2 shrink-0 text-[15px] leading-[1.45] text-[rgba(226,232,240,0.82)] lg:mb-5">
            {mission.description}
          </p>

          {hasContextBriefing && mission.context ? (
            <div className="mission-detail-context-card mb-4 shrink-0 rounded-[15px] border border-[rgba(96,165,250,0.12)] bg-[rgba(8,18,34,0.55)] p-4 lg:mx-auto lg:mb-0 lg:w-full lg:max-w-[820px]">
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
                <div>
                  <p className="mb-3 text-[14px] font-extrabold leading-snug text-white">
                    {mission.context.callsign}
                    {mission.context.station && (
                      <>
                        <span className="font-medium text-[rgba(148,163,184,0.45)]"> · </span>
                        <span className="text-[#FACC15]">{mission.context.station}</span>
                      </>
                    )}
                    {mission.context.frequency && (
                      <>
                        <span className="font-medium text-[rgba(148,163,184,0.45)]"> · </span>
                        <span className="text-[#FACC15]">{mission.context.frequency}</span>
                      </>
                    )}
                  </p>

                  {!!mission.context.whatYouKnow?.length && (
                    <>
                      <p className="mb-2 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-[rgba(148,163,184,0.60)]">
                        What you know
                      </p>
                      <ul className="flex flex-col gap-2">
                        {mission.context.whatYouKnow.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-[14px] leading-normal text-[rgba(203,213,225,0.90)]"
                          >
                            <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#FACC15]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {!!mission.context.whatYouNeed?.length && (
                  <div>
                    <p className="mb-2 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-[rgba(148,163,184,0.60)]">
                      Your task
                    </p>
                    <ul className="flex flex-col gap-2">
                      {mission.context.whatYouNeed.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-[14px] leading-normal text-[rgba(203,213,225,0.72)]"
                        >
                          <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[rgba(234,179,8,0.65)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          {mission.context && (
            <div className="mission-detail-card mb-4 shrink-0 rounded-[15px] border border-[rgba(96,165,250,0.12)] bg-[rgba(8,18,34,0.55)] p-3 lg:mb-0">
              <p className="mb-1.5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#FACC15]">
                Mission Briefing
              </p>
              <p className="mb-1 text-[14px] font-extrabold leading-snug text-white">
                {mission.context.callsign}
                {mission.context.aircraft
                  ? <span className="font-medium text-[rgba(203,213,225,0.78)]"> · {mission.context.aircraft}</span>
                  : null}
              </p>
              <p className="mb-1 line-clamp-1 text-[14px] leading-snug text-[rgba(203,213,225,0.85)]">
                {mission.context.location}
                {" · "}
                <span className="font-bold text-[#FACC15]">
                  {mission.context.station}{mission.context.frequency ? ` ${mission.context.frequency}` : ""}
                </span>
              </p>
              <p className="mission-detail-task line-clamp-2 text-[14px] leading-snug text-[rgba(203,213,225,0.72)]">
                <span className="font-semibold text-[rgba(148,163,184,0.85)]">Task: </span>
                {mission.context.initialTask}
              </p>
            </div>
          )}

          <div className="mission-detail-practice mt-1 shrink-0 lg:mt-0">
            <p className="mb-3 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-[#FACC15] lg:mb-3">
              You will practice
            </p>
            <ul className="flex flex-col gap-3 lg:gap-2.5">
              {practiceBullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-[15px] leading-normal text-[rgba(203,213,225,0.90)]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-[17px] w-[17px] shrink-0"
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          </div>
          )}

          <div className="mission-detail-button shrink-0 pt-4 lg:mx-auto lg:w-full lg:max-w-[820px] lg:pt-4">
            <button
              type="button"
              onClick={start}
              className="flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FACC15] text-[15px] font-black uppercase tracking-[0.04em] text-[#07111F] shadow-[0_16px_48px_-12px_rgba(250,204,21,0.55)]"
            >
              Start Mission
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
