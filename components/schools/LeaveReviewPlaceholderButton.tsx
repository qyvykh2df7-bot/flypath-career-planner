"use client";

import Link from "next/link";

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
  /** Estilo visual: `soft` (ficha) o `primary` (hero). */
  variant?: Variant;
  /** Slug público de la escuela, resuelto a school_id únicamente en servidor. */
  schoolSlug?: string;
};

/**
 * CTA aislado para abrir el formulario público. El slug solo preselecciona la
 * escuela: el backend resuelve siempre la FK canónica school_id en servidor.
 */
export function LeaveReviewPlaceholderButton({
  label = "Quiero dejar una opinión",
  variant = "soft",
  schoolSlug,
}: Props = {}) {
  const href = schoolSlug ? `/opiniones-escuelas?school=${encodeURIComponent(schoolSlug)}` : "/opiniones-escuelas";
  return <Link href={href} className={VARIANT_CLASSES[variant]}>{label}</Link>;
}
