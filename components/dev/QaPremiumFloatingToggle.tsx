"use client";

import type { QaPremiumMode } from "@/lib/qaPremiumMode";

type Props = {
  mode: QaPremiumMode;
  onToggle: () => void;
  /**
   * `true` cuando el hook `useQaPremiumMode` ya leyó `localStorage` tras montar.
   * Hasta entonces no renderizamos el botón para evitar hydration mismatch
   * (el HTML del servidor se renderiza con el modo por defecto, y el primer
   * render del cliente puede diferir si en `localStorage` hay otro valor).
   */
  hydrated: boolean;
};

/**
 * QA temporal: quitar al conectar pago real.
 *
 * Píldora fija al viewport (misma idea que el Planner manual en `app/page.tsx`).
 */
export function QaPremiumFloatingToggle({ mode, onToggle, hydrated }: Props) {
  if (process.env.NODE_ENV !== "development") return null;
  if (!hydrated) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-4 right-4 z-[9999] inline-flex w-auto max-w-[calc(100vw-2rem)] shrink-0 items-center justify-center rounded-full border border-[#c9a454]/50 bg-[#0f1a33] px-4 py-2 text-xs font-semibold text-[#f2ddaa] shadow-lg transition hover:bg-[#152547] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
      aria-label={
        mode === "premium"
          ? "Alternar a modo gratis para revisión QA"
          : "Alternar a modo premium para revisión QA"
      }
    >
      {mode === "premium" ? "QA: ver modo gratis" : "QA: ver premium"}
    </button>
  );
}
