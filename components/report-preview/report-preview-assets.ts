/**
 * Una imagen distinta por página visual del Report Preview.
 * Rutas en /public — export-friendly.
 */
export const REPORT_PAGE_IMAGES = {
  /** Ala / horizonte / vuelo */
  cover: "/hero-aircraft.jpg",
  /** Briefing / mentoría (sin logbook con texto visible) */
  executive: "/mentoria.jpg",
  /** Horizonte / pista / atardecer aeronáutico */
  route: "/atardecer.jpg",
  /** Cartas / guía / planificación de ruta */
  finances: "/pistaguia.png",
  /** Cabina / formación práctica */
  action: "/clases.webp",
  /** Avioneta / entrenamiento */
  schools: "/cessnaguia.webp",
  /** Acompañamiento / mentoría (distinto del resumen) */
  close: "/acompanamiento.jpg",
} as const;

export type ReportPageImageKey = keyof typeof REPORT_PAGE_IMAGES;

/** Variante de gradiente si falla la carga (cada página distinta). */
export type PlaceholderVariant = "horizon" | "slate" | "dusk" | "gold" | "navy" | "warm";

export const PAGE_PLACEHOLDER_VARIANT: Record<ReportPageImageKey, PlaceholderVariant> = {
  cover: "horizon",
  executive: "slate",
  route: "dusk",
  finances: "gold",
  action: "navy",
  schools: "warm",
  close: "gold",
};

/** Imagen eliminada por duplicado: close y executive compartían /mentoria.jpg */
export const REPORT_PREVIEW_REMOVED_DUPLICATES = [
  "executive + close → /mentoria.jpg (reemplazadas)",
] as const;

const SCHOOL_BANNER_BY_PROGRAMA: Record<string, string> = {
  integrado: "/school-card-bg/integrado.webp",
  modular: "/school-card-bg/modular.webp",
  cadet: "/school-card-bg/cadet-airline.webp",
  mixto: "/school-card-bg/mixto.webp",
};

export function schoolBannerSrc(programa: string): string | null {
  return SCHOOL_BANNER_BY_PROGRAMA[programa] ?? null;
}
