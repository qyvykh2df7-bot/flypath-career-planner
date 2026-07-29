import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Career Planner | FlyPath",
  description:
    "Planifica tu camino según tu perfil, presupuesto, tiempo, escuelas candidatas y riesgos antes de pagar matrícula.",
  path: "/career-planner",
  imagePath: "/hero-aircraft.jpg",
  imageAlt: "Career Planner de FlyPath",
});

export default function CareerPlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
