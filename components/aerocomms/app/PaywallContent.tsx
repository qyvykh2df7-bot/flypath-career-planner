"use client";

import { useState } from "react";
import { startAeroCommsProCheckout } from "@/lib/aerocomms/pro-checkout-client";

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
  checkoutNotice?: "cancelled" | null;
}

export function PaywallContent({ onClose, checkoutNotice = null }: PaywallContentProps) {
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubscribe() {
    if (checkoutState === "loading") return;
    setCheckoutState("loading");
    setErrorMessage(null);

    const result = await startAeroCommsProCheckout();
    if (result.status === "redirect") {
      window.location.assign(result.url);
      return;
    }

    setCheckoutState("error");
    setErrorMessage(result.message);
  }

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

      {checkoutNotice === "cancelled" && (
        <p role="status" className="mt-4 text-sm text-slate-300">
          La suscripción no se ha completado.
        </p>
      )}

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
        <div className="rounded-2xl border border-[#FACC15]/50 bg-[#FACC15]/10 p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-400">Mensual</p>
          <p className="mt-1 text-lg font-bold">7,37 €</p>
          <p className="text-[11px] text-slate-500">al mes</p>
        </div>

        <button type="button" onClick={handleSubscribe} disabled={checkoutState === "loading"} className="primary-btn disabled:cursor-wait disabled:opacity-60">
          {checkoutState === "loading" ? "Abriendo suscripción..." : "Suscribirme a AeroComms Pro"}
        </button>
        {errorMessage && <p role="alert" className="text-center text-xs text-rose-300">{errorMessage}</p>}
        <p className="text-center text-[10px] text-slate-600">
          El acceso se activará tras confirmar tu suscripción.
        </p>
      </div>
    </div>
  );
}
