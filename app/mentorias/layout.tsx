import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

/**
 * `page.tsx` es Client Component y no puede exportar `metadata`.
 * Este layout server-only añade metadata básica sin tocar el árbol visual.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Mentorías | FlyPath",
  description:
    "Revisamos tu situación real —edad, presupuesto, tiempo, inglés y objetivos— para ayudarte a tomar la mejor decisión con criterio antes de comprometer miles de euros.",
  path: "/mentorias",
  imagePath: "/mentoria.jpg",
  imageAlt: "Mentorías FlyPath para futuros pilotos",
});

export default function MentoriasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
