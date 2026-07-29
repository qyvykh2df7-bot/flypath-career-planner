import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Opiniones de escuelas | FlyPath",
  description:
    "Consulta el estado de opiniones verificadas por escuela y ayuda a otros futuros pilotos compartiendo tu experiencia antes de una decisión.",
  path: "/opiniones-escuelas",
  imagePath: "/opiniones-escuelas-hero.webp",
  imageAlt: "Opiniones verificadas de escuelas de vuelo en FlyPath",
});

export default function OpinionesEscuelasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
