"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RadioConversation from "@/components/aerocomms/app/atc-sim/RadioConversation";
import { useAppState } from "@/lib/aerocomms/appState";
import {
  buildResult,
  findMission,
  loadDescriptor,
  saveResult,
  unlockMissionRadioAudio,
  type AtcSessionDescriptor,
  type TranscriptTurn,
} from "@/lib/aerocomms/atcSim";

/**
 * Shown once per mission session, before RadioConversation mounts. Tapping Enable
 * Radio Audio is the required user gesture that unlocks the shared mission audio
 * element (see missionAudio.ts) so ATC autoplay can use backend OpenAI TTS instead
 * of being blocked by the browser's autoplay policy.
 */
function EnableRadioAudioGate({
  title,
  phaseBadge,
  onEnable,
}: {
  title: string;
  phaseBadge?: string;
  onEnable: () => void;
}) {
  return (
    <section
      className="relative -mx-4 -mt-6 -mb-24 flex flex-col items-center justify-center overflow-hidden px-6 lg:-mx-8 lg:-mt-8 lg:-mb-16"
      style={{ height: "100dvh", minHeight: "100dvh", paddingBottom: 96, background: "#020814" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 lg:fixed lg:inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(2,8,20,0.40) 0%, rgba(2,8,20,0.58) 45%, rgba(2,8,20,0.82) 100%), url('/images/aerocomms/fondofreef.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center" style={{ maxWidth: 300 }}>
        {phaseBadge && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              background: "rgba(250,204,21,0.14)",
              padding: "3px 12px",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#FACC15",
              marginBottom: 14,
            }}
          >
            {phaseBadge}
          </span>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F8FAFC", marginBottom: 10, lineHeight: 1.2 }}>
          {title}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "rgba(203,213,225,0.78)", marginBottom: 32 }}>
          Turn on radio audio to hear ATC transmissions during this mission.
        </p>
        <button
          type="button"
          onClick={onEnable}
          className="text-[15px]"
          style={{
            display: "flex",
            width: "100%",
            height: 58,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 16,
            background: "#FACC15",
            color: "#07111F",
            fontWeight: 900,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            boxShadow: "0 16px 48px -12px rgba(250,204,21,0.55)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: 20, height: 20 }}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18 6a9 9 0 0 1 0 12" />
          </svg>
          Enable Radio Audio
        </button>
      </div>
    </section>
  );
}

export default function AtcSessionPage() {
  const router = useRouter();
  const { recordMissionResult } = useAppState();
  const [descriptor, setDescriptor] = useState<AtcSessionDescriptor | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const d = loadDescriptor();
    if (!d || d.source !== "mission" || !d.missionId) {
      router.replace("/aerocomms/app/atc-sim");
      return;
    }
    setDescriptor(d);
  }, [router]);

  if (!descriptor) return null;

  // Must be triggered synchronously from this real click — see unlockMissionRadioAudio
  // doc comment. Proceeds to the mission either way: if the unlock attempt fails,
  // RadioConversation degrades gracefully to a manual "Play ATC" button instead of
  // getting stuck or falling back to the old browser voice.
  const handleEnableAudio = () => {
    void (async () => {
      await unlockMissionRadioAudio();
      setAudioUnlocked(true);
    })();
  };

  if (!audioUnlocked) {
    return <EnableRadioAudioGate title={descriptor.title} phaseBadge={descriptor.phaseBadge} onEnable={handleEnableAudio} />;
  }

  const handleComplete = (transcript: TranscriptTurn[], durationSec: number) => {
    if (finishedRef.current) return;
    const missionId = descriptor.missionId;
    if (!missionId) {
      router.replace("/aerocomms/app/atc-sim");
      return;
    }
    finishedRef.current = true;
    const result = buildResult(descriptor, transcript, durationSec);
    // Persist result to sessionStorage so Complete + Transcript screens can read it.
    saveResult(result);

    const minutes = Math.max(1, Math.round(durationSec / 60));

    // Use the single mission action — updates missionResults, completedMissions,
    // history (source: "atc-mission"), skills (full mission boost), stats.
    // findMission gives us title/level from the canonical data.
    const mission = findMission(missionId);
    recordMissionResult({
      missionId,
      title: mission?.title ?? descriptor.title,
      level: descriptor.level ?? mission?.level ?? "cadet",
      score: result.score,
      stars: result.stars,
      minutes,
    });

    router.replace("/aerocomms/app/atc-sim/complete");
  };

  return <RadioConversation descriptor={descriptor} onComplete={handleComplete} onExit={() => router.push("/aerocomms/app/atc-sim")} />;
}
