"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/aerocomms/appState";

const BENEFITS = [
  "Full Cadet → Advanced Ops path",
  "All ATC Sim missions",
  "Mission result history",
  "All accents & difficulties",
  "Future content included",
];

interface PaywallContentProps {
  /** Called when the X / close action is triggered */
  onClose: () => void;
  /**
   * Called after a successful upgrade confirmation.
   * Defaults to pushing /today if not provided.
   */
  onSuccess?: () => void;
}

export function PaywallContent({ onClose, onSuccess }: PaywallContentProps) {
  const router = useRouter();
  const { upgrade } = useAppState();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

  const confirm = () => {
    upgrade();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/aerocomms/app/today");
    }
  };

  return (
    <div className="flex flex-col text-white">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FACC15]">AeroComms Pro</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight">Unlock the full flight deck.</h1>
      </div>

      <ul className="mt-6 space-y-2.5">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4 4 10-11" />
              </svg>
            </span>
            <span className="text-sm text-slate-200">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlan("monthly")}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              plan === "monthly"
                ? "border-[#FACC15]/50 bg-[#FACC15]/10"
                : "border-white/10 bg-[#0F172A]"
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-slate-400">Monthly</p>
            <p className="mt-1 text-lg font-bold">€9.99</p>
            <p className="text-[11px] text-slate-500">per month</p>
          </button>
          <button
            onClick={() => setPlan("yearly")}
            className={`relative rounded-2xl border p-4 text-left transition-colors ${
              plan === "yearly"
                ? "border-[#FACC15]/50 bg-[#FACC15]/10"
                : "border-white/10 bg-[#0F172A]"
            }`}
          >
            <span className="absolute right-3 top-3 rounded-full bg-[#FACC15] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#07111F]">
              Save 33%
            </span>
            <p className="text-xs uppercase tracking-wider text-slate-400">Yearly</p>
            <p className="mt-1 text-lg font-bold">€79.99</p>
            <p className="text-[11px] text-slate-500">per year</p>
          </button>
        </div>

        <button onClick={confirm} className="primary-btn">
          Unlock AeroComms Pro
        </button>
        <p className="text-center text-[10px] text-slate-600">
          Alpha preview · no real payment is processed
        </p>
      </div>
    </div>
  );
}
