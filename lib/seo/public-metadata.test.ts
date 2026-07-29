import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createPublicPageMetadata } from "./public-metadata";

describe("public metadata", () => {
  it("defines one complete canonical and social contract for a public page", () => {
    const metadata = createPublicPageMetadata({
      title: "FlyPath — Tu copiloto durante toda la formación",
      description: "Planifica tu ruta antes de pagar.",
      path: "/",
      imagePath: "/herohome.webp",
      imageAlt: "FlyPath",
    });

    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/");
    expect(metadata.openGraph).toMatchObject({
      title: "FlyPath — Tu copiloto durante toda la formación",
      url: "http://localhost:3000/",
      siteName: "FlyPath",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "FlyPath — Tu copiloto durante toda la formación",
    });
    expect(metadata.openGraph?.images).toEqual([
      { url: "http://localhost:3000/herohome.webp", alt: "FlyPath" },
    ]);
    expect(metadata.twitter?.images).toEqual(["http://localhost:3000/herohome.webp"]);
  });
});
