import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createRootMetadata } from "./root-metadata";

describe("root metadata", () => {
  it("uses the configured canonical origin for metadataBase and global social URLs", () => {
    const metadata = createRootMetadata("https://www.flypath.es");

    expect(metadata.metadataBase?.toString()).toBe("https://www.flypath.es/");
    expect(metadata.openGraph).toMatchObject({
      url: "https://www.flypath.es/",
      siteName: "FlyPath",
    });
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://www.flypath.es/herohome.webp", alt: "FlyPath" },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://www.flypath.es/herohome.webp"],
    });
  });
});
