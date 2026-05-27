/** Rutas seguras en /public para la capa editorial (export-friendly). */
export const REPORT_PREVIEW_IMAGES = {
  coverHero: "/hero-aircraft.jpg",
  routeAccent: "/pistaguia.png",
  schoolsHero: "/schools-hero-planning.jpg",
  actionAccent: "/clases.jpg",
} as const;

const SCHOOL_BANNER_BY_PROGRAMA: Record<string, string> = {
  integrado: "/school-card-bg/integrado.jpg",
  modular: "/school-card-bg/modular.jpg",
  cadet: "/school-card-bg/cadet-airline.jpg",
  mixto: "/school-card-bg/mixto.jpg",
};

export function schoolBannerSrc(programa: string): string | null {
  return SCHOOL_BANNER_BY_PROGRAMA[programa] ?? null;
}
