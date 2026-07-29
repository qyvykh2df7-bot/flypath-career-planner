import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Comparador de escuelas de vuelo | FlyPath",
  description:
    "Compara escuelas de vuelo por ruta, costes, condiciones y señales de riesgo antes de tomar una decisión.",
  path: "/schools",
  imagePath: "/schools-hero-planning.webp",
  imageAlt: "Comparador de escuelas de vuelo de FlyPath",
});

export default function SchoolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
