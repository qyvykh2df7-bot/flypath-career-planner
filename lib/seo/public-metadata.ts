import "server-only";

import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const FLYPATH_SITE_NAME = "FlyPath";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/herohome.webp";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
};

/** Builds the complete public SEO contract from the configured canonical origin. */
export function createPublicPageMetadata({
  title,
  description,
  path,
  imagePath = DEFAULT_SOCIAL_IMAGE_PATH,
  imageAlt = title,
  type = "website",
  robots = { index: true, follow: true },
}: PublicPageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(imagePath);

  return {
    title,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type,
      url: canonical,
      siteName: FLYPATH_SITE_NAME,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
