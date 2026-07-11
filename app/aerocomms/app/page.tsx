"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/aerocomms/appState";

export default function Home() {
  const router = useRouter();
  const { state } = useAppState();

  const enter = () => router.push(state.onboarded ? "/aerocomms/app/today" : "/aerocomms/app/onboarding");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#07111F] px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#FACC15]">AeroComms Alpha</p>

        <h1 className="mb-4 text-4xl font-bold leading-tight">Train your aviation radio skills.</h1>

        <p className="mb-8 text-slate-400">Listen. Speak. Get feedback. Build confidence.</p>

        <button onClick={enter} className="primary-btn">
          {state.onboarded ? "Continue Training" : "Enter AeroComms"}
        </button>
      </div>
    </main>
  );
}
