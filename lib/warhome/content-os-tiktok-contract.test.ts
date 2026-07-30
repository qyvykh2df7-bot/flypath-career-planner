import { describe, expect, it } from "vitest";
import {
  extractTikTokHashtags,
  normalizeTikTokUrl,
  parseContentOsTikTokAnalysisOutput,
  parseContentOsTikTokManualImportForm,
  parseContentOsTikTokReviewForm,
} from "@/lib/warhome/content-os-tiktok-contract";

describe("Content OS TikTok contract", () => {
  it("normaliza URLs TikTok y rechaza otros hosts", () => {
    expect(
      normalizeTikTokUrl(
        "https://www.tiktok.com/@pilotfeliu/video/123?is_from_webapp=1#x",
      ),
    ).toBe("https://www.tiktok.com/@pilotfeliu/video/123");
    expect(normalizeTikTokUrl("https://evil.example/video/123")).toBeNull();
    expect(normalizeTikTokUrl("http://www.tiktok.com/video/123")).toBeNull();
  });

  it("deduplica hashtags derivados del caption", () => {
    expect(extractTikTokHashtags("#Piloto hola #piloto #Aviación")).toEqual([
      "piloto",
      "aviación",
    ]);
  });

  it("valida la importación manual y sus métricas", () => {
    const form = new FormData();
    form.set("shareUrl", "https://www.tiktok.com/@pilotfeliu/video/123");
    form.set("publishedOn", "2026-07-30");
    form.set("caption", "Vida de piloto #aviacion");
    form.set("durationSeconds", "45");
    form.set("views", "1000");
    form.set("saves", "12");
    expect(parseContentOsTikTokManualImportForm(form)).toMatchObject({
      durationSeconds: 45,
      views: 1000,
      saves: 12,
    });
    form.set("views", "-1");
    expect(parseContentOsTikTokManualImportForm(form)).toBeNull();
  });

  it("mantiene revisión humana con valores cerrados", () => {
    const form = new FormData();
    form.set("title", "Cómo es un día de vuelo");
    form.set("summary", "Resumen");
    form.set("hook", "Lo que nadie te cuenta");
    form.set("pillar", "pilot_life");
    form.set("objective", "community");
    form.set("relatedProduct", "");
    expect(parseContentOsTikTokReviewForm(form)).toMatchObject({
      pillar: "pilot_life",
      objective: "community",
      relatedProduct: null,
    });
    form.set("pillar", "politics");
    expect(parseContentOsTikTokReviewForm(form)).toBeNull();
  });

  it("rechaza IDs ausentes o duplicados en la salida IA", () => {
    const entry = {
      providerVideoId: "123",
      title: "Título",
      summary: "Resumen",
      hook: "Hook",
      pillar: "training",
      objective: "authority",
      relatedProduct: "career_planner",
    };
    expect(
      parseContentOsTikTokAnalysisOutput({ videos: [entry] }, ["123"]),
    ).toEqual([entry]);
    expect(
      parseContentOsTikTokAnalysisOutput(
        { videos: [entry, entry] },
        ["123", "456"],
      ),
    ).toBeNull();
  });
});
