import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Shop | FlyPath",
  description: "Guías, mentorías, clases y logbooks para avanzar como piloto con más criterio.",
  path: "/shop",
  imagePath: "/shop.webp",
  imageAlt: "Recursos de la Shop de FlyPath",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
