/** Canonical site URL for metadata, sitemap and Open Graph. */
export const SITE_URL = "https://flypath.es";

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL.replace(/\/$/, "")}${normalized}`;
}
