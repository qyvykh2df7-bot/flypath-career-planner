"use client";

import { useCallback, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/aerocomms/appState";
import {
  AEROCOMMS_PRO_CHECKOUT_RETURN_PATH,
  getAeroCommsProCheckoutReturnState,
} from "@/lib/aerocomms/pro-checkout-return";

const REFRESH_INTERVAL_MS = 2500;
const CONFIRMED_REDIRECT_DELAY_MS = 1400;

/**
 * Ephemeral post-Checkout UI. The entitlement remains the sole access source;
 * this component only refreshes the server-rendered access snapshot while the
 * Stripe webhook is being processed.
 */
export function AeroCommsProCheckoutReturn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { access } = useAppState();
  const [isRefreshing, startRefresh] = useTransition();
  const returnState = getAeroCommsProCheckoutReturnState(searchParams.get("checkout"), access.isPro);

  const refreshAccess = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router, startRefresh]);

  useEffect(() => {
    if (returnState !== "verifying") return;

    refreshAccess();
    const interval = window.setInterval(refreshAccess, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [returnState, refreshAccess]);

  useEffect(() => {
    if (returnState !== "confirmed") return;

    const timeout = window.setTimeout(() => {
      router.replace(AEROCOMMS_PRO_CHECKOUT_RETURN_PATH);
    }, CONFIRMED_REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [returnState, router]);

  if (returnState === "inactive") return null;

  const confirmed = returnState === "confirmed";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="aerocomms-pro-checkout-title"
        aria-describedby="aerocomms-pro-checkout-description"
        className="w-full max-w-sm rounded-[22px] border border-white/[0.1] bg-[#07111F] p-6 text-center shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)]"
      >
        {confirmed ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <h2 id="aerocomms-pro-checkout-title" className="mt-4 text-xl font-bold text-white">AeroComms Pro activado</h2>
            <p id="aerocomms-pro-checkout-description" className="mt-2 text-sm text-slate-300">
              Tu acceso ya está disponible. Te llevamos a tu panel.
            </p>
            <button
              type="button"
              onClick={() => router.replace(AEROCOMMS_PRO_CHECKOUT_RETURN_PATH)}
              className="primary-btn mt-6 w-full"
            >
              Entrar en AeroComms
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#FACC15]/20 border-t-[#FACC15]" aria-hidden="true" />
            <h2 id="aerocomms-pro-checkout-title" className="mt-4 text-xl font-bold text-white">Verificando tu suscripción...</h2>
            <p id="aerocomms-pro-checkout-description" className="mt-2 text-sm text-slate-300">
              Stripe está confirmando el pago. Tu acceso se activará automáticamente cuando llegue el entitlement.
            </p>
            <button type="button" onClick={refreshAccess} disabled={isRefreshing} className="primary-btn mt-6 w-full disabled:cursor-wait disabled:opacity-60">
              {isRefreshing ? "Actualizando..." : "Actualizar estado"}
            </button>
            <button
              type="button"
              onClick={() => router.replace(AEROCOMMS_PRO_CHECKOUT_RETURN_PATH)}
              className="mt-3 text-sm text-slate-400 underline underline-offset-4"
            >
              Seguir usando AeroComms Free
            </button>
          </>
        )}
      </section>
    </div>
  );
}
