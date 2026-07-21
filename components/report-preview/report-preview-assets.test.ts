import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PREMIUM_PDF_PAGE_IMAGES } from "./report-preview-assets";

const PNG_SIGNATURE = "89504e470d0a1a0a";
const JPEG_SIGNATURE = "ffd8ff";

describe("premium PDF page assets", () => {
  it("uses only compatible PNG or JPEG paths instead of WebP browser assets", () => {
    expect(Object.values(PREMIUM_PDF_PAGE_IMAGES)).toEqual([
      "/hero-aircraft.jpg",
      "/mentoria.jpg",
      "/atardecer.jpg",
      "/premium-report/pistaguia.png",
      "/premium-report/clases.jpg",
      "/premium-report/cessnaguia.png",
      "/premium-report/acompanamiento.png",
    ]);
    expect(Object.values(PREMIUM_PDF_PAGE_IMAGES).some((asset) => asset.endsWith(".webp"))).toBe(false);
  });

  it("stores every premium PDF asset with matching PNG or JPEG binary content", () => {
    for (const assetPath of Object.values(PREMIUM_PDF_PAGE_IMAGES)) {
      const bytes = readFileSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));
      const signature = bytes.subarray(0, 8).toString("hex");
      expect(signature.startsWith(PNG_SIGNATURE) || signature.startsWith(JPEG_SIGNATURE)).toBe(true);
    }
  });
});
