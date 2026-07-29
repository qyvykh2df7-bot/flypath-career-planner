import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";
import type { SchoolEntry } from "@/types/schools";

export function createSchoolDetailMetadata(school: SchoolEntry | undefined): Metadata {
  if (!school) {
    return {
      robots: { index: false, follow: false },
      alternates: { canonical: null },
      openGraph: null,
      twitter: null,
    };
  }

  return createPublicPageMetadata({
    title: `${school.name} | Escuela de vuelo | FlyPath`,
    description: school.shortDescription,
    path: `/schools/${school.slug}`,
    imagePath: "/schools-hero-planning.webp",
    imageAlt: `Información de ${school.name} en FlyPath`,
  });
}
