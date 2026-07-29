import type { Metadata } from "next";
import { AeroCommsPage } from "@/components/aerocomms/AeroCommsPage";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "AeroComms — Entrenamiento ATC | FlyPath",
  description:
    "Practica listening, readbacks, fraseología y escenarios guiados de radio ATC. AeroComms es el entrenamiento de comunicaciones de FlyPath para futuros pilotos y student pilots.",
  path: "/aerocomms",
  imagePath: "/images/aerocomms/fondoweb.png",
  imageAlt: "AeroComms, entrenamiento ATC de FlyPath",
});

export default function AeroCommsRoute() {
  return <AeroCommsPage />;
}
