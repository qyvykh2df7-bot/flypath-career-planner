"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppState, type Experience } from "@/lib/aerocomms/appState";

const EXPERIENCES: Experience[] = ["No Experience", "Student Pilot", "Pilot", "Airline Pilot"];
const GOALS = ["Learn Radio Basics", "Build Confidence", "Prepare For Airline Interviews", "Stay Sharp"];
const TIMES = ["5 min/day", "10 min/day", "20 min/day", "30+ min/day"];

const RADIO_PHRASE = "Iberia 325, radio check.";

function speak(text: string) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    // speech not available
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setOnboarding, completeOnboarding } = useAppState();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [experience, setExperience] = useState<Experience | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [repeated, setRepeated] = useState(false);

  const totalSteps = 6;

  const finish = () => {
    setOnboarding({
      name: name.trim() || "Pilot",
      experience,
      goal,
      dailyGoal: time ?? "10 min/day",
    });
    completeOnboarding();
    router.push("/aerocomms/app/today");
  };

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));

  return (
    <main className="flex min-h-dvh flex-col bg-[#07111F] px-6 pb-8 pt-10 text-white">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#FACC15]" : "bg-white/10"}`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        {step === 0 && (
          <div className="flex flex-1 flex-col">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FACC15]">AeroComms</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">Your AI copilot for aviation radio.</h1>
            <p className="mt-4 text-slate-400">
              Listen, speak, get feedback and build confidence through short daily missions.
            </p>
            <div className="mt-auto">
              <button onClick={next} className="primary-btn">Get Started</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-2xl font-bold">What&apos;s your name?</h1>
            <p className="mt-2 text-sm text-slate-400">We&apos;ll use it to personalize Today.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jorge"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-4 text-lg outline-none focus:border-[#FACC15]/50"
            />
            <div className="mt-auto">
              <button onClick={next} disabled={!name.trim()} className="primary-btn disabled:opacity-40">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <Choice
            title="Your experience"
            subtitle="This adjusts recommendations, not access."
            options={EXPERIENCES}
            selected={experience}
            onSelect={(v) => setExperience(v as Experience)}
            onNext={next}
          />
        )}

        {step === 3 && (
          <Choice
            title="Your goal"
            subtitle="What do you want to achieve?"
            options={GOALS}
            selected={goal}
            onSelect={setGoal}
            onNext={next}
          />
        )}

        {step === 4 && (
          <Choice
            title="Time available"
            subtitle="Set a daily training goal."
            options={TIMES}
            selected={time}
            onSelect={setTime}
            onNext={next}
          />
        )}

        {step === 5 && (
          <div className="flex flex-1 flex-col">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FACC15]">First Radio Call</p>
            <h1 className="mt-3 text-2xl font-bold">Your turn on the radio.</h1>
            <p className="mt-2 text-sm text-slate-400">Listen, then read it back. No score, just confidence.</p>

            <div className="mt-6 rounded-2xl border border-[#FACC15]/20 bg-[#0F172A] p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-500">ATC</p>
              <p className="mt-2 text-xl font-bold">&ldquo;{RADIO_PHRASE}&rdquo;</p>
              <button
                onClick={() => speak(RADIO_PHRASE)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                </svg>
                Play ATC
              </button>
            </div>

            <button
              onClick={() => setRepeated(true)}
              className={`mt-5 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition-colors ${
                repeated ? "bg-[#FACC15]/15 text-[#FACC15] ring-1 ring-[#FACC15]/40" : "bg-white/5 text-white ring-1 ring-white/10"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {repeated ? "Nice readback!" : "Hold to speak"}
            </button>

            <div className="mt-auto">
              <button onClick={finish} className="primary-btn">
                {repeated ? "Enter AeroComms" : "Skip for now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Choice({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onNext,
}: {
  title: string;
  subtitle: string;
  options: readonly string[];
  selected: string | null;
  onSelect: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      <div className="mt-5 space-y-2.5">
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-colors ${
                active ? "border-[#FACC15]/50 bg-[#FACC15]/10 text-white" : "border-white/10 bg-[#0F172A] text-slate-200"
              }`}
            >
              {opt}
              <span className={`h-4 w-4 rounded-full border-2 ${active ? "border-[#FACC15] bg-[#FACC15]" : "border-white/20"}`} />
            </button>
          );
        })}
      </div>
      <div className="mt-auto">
        <button onClick={onNext} disabled={!selected} className="primary-btn disabled:opacity-40">
          Continue
        </button>
      </div>
    </div>
  );
}
