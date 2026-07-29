import { getCanonicalOrigin } from "@/lib/security/canonical-origin";

/** Canonical site URL for metadata, sitemap and Open Graph. */
export const SITE_URL = getCanonicalOrigin();

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL.replace(/\/$/, "")}${normalized}`;
}
