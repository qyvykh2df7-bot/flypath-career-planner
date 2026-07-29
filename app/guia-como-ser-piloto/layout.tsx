import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Guía Cómo ser piloto | FlyPath",
  description:
    "La guía de FlyPath «Cómo ser piloto» reúne en un solo documento lo que un futuro piloto debería saber antes de gastar miles de euros en formación.",
  path: "/guia-como-ser-piloto",
  imagePath: "/comoserpilotohero.webp",
  imageAlt: "Guía Cómo ser piloto de FlyPath",
});

export default function GuiaComoSerPilotoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
