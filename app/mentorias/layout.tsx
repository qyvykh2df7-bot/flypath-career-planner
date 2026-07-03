import type { Metadata } from "next";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = {
  title: "Mentorías | FlyPath",
  description:
    "Revisamos tu situación real —edad, presupuesto, tiempo, inglés y objetivos— para ayudarte a tomar la mejor decisión con criterio antes de comprometer miles de euros.",
  robots: { index: true, follow: true },
};

export default function MentoriasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
