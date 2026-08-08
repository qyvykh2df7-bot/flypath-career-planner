import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Pre-PPL | FlyPath",
  description: "Una guía de FlyPath para quienes quieren empezar su formación como piloto con una base más clara.",
  path: "/pre-ppl",
  imagePath: "/aerocomms/mockups/prepplhome.png",
  imageAlt: "Portada de Pre-PPL de FlyPath",
});

export default function PrePplLayout({ children }: { children: React.ReactNode }) {
  return children;
}
