import type { Metadata } from "next";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = {
  title: "Shop | FlyPath",
  description: "Guías, mentorías, clases y logbooks para avanzar como piloto con más criterio.",
  robots: { index: true, follow: true },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
