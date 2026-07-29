import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "./sitemap";

describe("public sitemap", () => {
  it("contains only canonical public URLs and includes valid school detail pages", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const paths = urls.map((url) => new URL(url).pathname);

    expect(paths).toContain("/schools/european-flyers");
    expect(paths).toContain("/opiniones-escuelas");
    expect(paths).not.toContain("/dashboard");
    expect(paths).not.toContain("/premium-report-thumb");
    expect(paths.some((path) => path.startsWith("/aerocomms/app"))).toBe(false);
    expect(paths.some((path) => path.startsWith("/review/"))).toBe(false);
    expect(paths).not.toContain("/login");
    expect(paths).not.toContain("/account");
    expect(paths).not.toContain("/warhome");
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => new URL(url).hostname === "localhost")).toBe(true);
  });
});
