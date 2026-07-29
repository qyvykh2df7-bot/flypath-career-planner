import "server-only";

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  FLYPATH_SITE_NAME,
} from "@/lib/seo/public-metadata";

const title = "FlyPath — Formación de pilotos con criterio";
const description =
  "Herramientas, comparativas y formación para tomar decisiones con más criterio antes de pagar tu formación como piloto.";

export function createRootMetadata(origin = SITE_URL): Metadata {
  const homeUrl = new URL("/", origin).toString();
  const socialImage = new URL(DEFAULT_SOCIAL_IMAGE_PATH, origin).toString();

  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: homeUrl,
      siteName: FLYPATH_SITE_NAME,
      images: [{ url: socialImage, alt: "FlyPath" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
