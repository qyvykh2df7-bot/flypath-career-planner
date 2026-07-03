import type { Metadata } from "next";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = {
  title: "Career Planner | FlyPath",
  description:
    "Planifica tu camino según tu perfil, presupuesto, tiempo, escuelas candidatas y riesgos antes de pagar matrícula.",
  robots: { index: true, follow: true },
};

export default function CareerPlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
