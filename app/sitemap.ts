import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import { getComparableSchools } from "@/lib/schools/schoolUtils";

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/career-planner", changeFrequency: "weekly", priority: 0.95 },
  { path: "/escuelas", changeFrequency: "weekly", priority: 0.88 },
  { path: "/aerocomms", changeFrequency: "weekly", priority: 0.88 },
  { path: "/recursos", changeFrequency: "weekly", priority: 0.85 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.9 },
  { path: "/shop", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guia-como-ser-piloto", changeFrequency: "monthly", priority: 0.85 },
  { path: "/pre-ppl", changeFrequency: "monthly", priority: 0.85 },
  { path: "/mentorias", changeFrequency: "monthly", priority: 0.85 },
  { path: "/schools", changeFrequency: "weekly", priority: 0.8 },
  { path: "/opiniones-escuelas", changeFrequency: "weekly", priority: 0.75 },
  { path: "/contacto", changeFrequency: "yearly", priority: 0.4 },
  { path: "/politica-de-privacidad", changeFrequency: "yearly", priority: 0.3 },
  { path: "/politica-de-cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terminos-y-condiciones", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => {
    const parsed = new Date(post.date);
    return {
      url: `${base}/blog/${post.slug}`,
      lastModified: Number.isNaN(parsed.getTime()) ? now : parsed,
      changeFrequency: "monthly" as const,
      priority: post.featured ? 0.8 : 0.7,
    };
  });

  const schoolEntries: MetadataRoute.Sitemap = getComparableSchools().map((school) => {
    const parsed = new Date(school.lastUpdatedAt);
    return {
      url: `${base}/schools/${school.slug}`,
      lastModified: Number.isNaN(parsed.getTime()) ? now : parsed,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    };
  });

  return [...staticEntries, ...schoolEntries, ...postEntries];
}
