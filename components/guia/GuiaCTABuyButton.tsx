"use client";

import { useCallback, useEffect, useState } from "react";

const TOAST_MS = 2800;

export function GuiaCTABuyButton() {
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = useCallback(() => setToast("Compra digital próximamente"), []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast((t) => (t === toast ? null : t)), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2.5 text-[15px] text-white shadow-lg sm:right-5 sm:top-5"
        >
          {toast}
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
      >
        Comprar guía digital
      </button>
    </>
  );
}
