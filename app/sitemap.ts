import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.9 },
  { path: "/atpl-planner", changeFrequency: "weekly", priority: 0.85 },
  { path: "/shop", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guia-como-ser-piloto", changeFrequency: "monthly", priority: 0.85 },
  { path: "/mentorias", changeFrequency: "monthly", priority: 0.85 },
  { path: "/ingles-aeronautico", changeFrequency: "monthly", priority: 0.85 },
  { path: "/clases-ppl-atpl", changeFrequency: "monthly", priority: 0.85 },
  { path: "/schools", changeFrequency: "weekly", priority: 0.8 },
  { path: "/opiniones-escuelas", changeFrequency: "weekly", priority: 0.75 },
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

  return [...staticEntries, ...postEntries];
}
