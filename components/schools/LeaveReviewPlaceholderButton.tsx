"use client";

import { useCallback, useEffect, useState } from "react";

const TOAST_TIMEOUT_MS = 2300;

const VARIANT_CLASSES = {
  /** Estilo suave (cream + texto marrón dorado). Por defecto, usado en la ficha
      individual de escuela tras un párrafo descriptivo (incluye `mt-3`). */
  soft:
    "mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#c9a454]/45 bg-[#fffdf6] px-4 py-2 text-[15px] font-semibold text-[#7a5a16] transition hover:border-[#c9a454]/70 hover:bg-[#fff8e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55",
  /** CTA primario dorado (página `/school-reviews`, hero). Sin margen propio:
      el caller controla su layout (flex row con el CTA secundario). */
  primary:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[15px] font-semibold text-[#0f1a33] shadow-md transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/55",
} as const;

type Variant = keyof typeof VARIANT_CLASSES;

type Props = {
  /** Texto del botón. Por defecto: "Quiero dejar una opinión". */
  label?: string;
  /** Texto que se mostrará en el toast al pulsar. */
  toastMessage?: string;
  /** Estilo visual: `soft` (ficha) o `primary` (hero). */
  variant?: Variant;
};

/**
 * Botón placeholder de la sección "Opiniones verificadas" / página de reviews.
 * Marca la funcionalidad como en preparación: al pulsar muestra un toast local
 * FlyPath y NO abre formulario, NO navega y NO conecta con Supabase ni con
 * ningún backend de reviews.
 *
 * Encapsulado como Client Component aislado para no forzar a sus consumers
 * (ficha individual SSR, página `/school-reviews` SSR) a ser cliente.
 */
export function LeaveReviewPlaceholderButton({
  label = "Quiero dejar una opinión",
  toastMessage = "Sistema de reviews próximamente",
  variant = "soft",
}: Props = {}) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => {
      setToast((current) => (current === toast ? null : current));
    }, TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleClick = useCallback(() => {
    setToast(toastMessage);
  }, [toastMessage]);

  return (
    <>
      <button type="button" onClick={handleClick} className={VARIANT_CLASSES[variant]}>
        {label}
      </button>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-3 z-50 rounded-lg border border-[#c9a454]/35 bg-[#0f1a33] px-4 py-2 text-[15px] text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
