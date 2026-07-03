import type { Metadata } from "next";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = {
  title: "Opiniones de escuelas | FlyPath",
  description:
    "Consulta el estado de opiniones verificadas por escuela y ayuda a otros futuros pilotos compartiendo tu experiencia antes de una decisión.",
  robots: { index: true, follow: true },
};

export default function OpinionesEscuelasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
