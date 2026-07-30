import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { DEFAULT_CONTENT_OS_BRAND_PROFILE } from "@/lib/warhome/content-os-brand-contract";
import {
  analyzeContentOsTikTokVideos,
  ContentOsTikTokAnalysisError,
} from "@/lib/warhome/content-os-tiktok-ai";

const video = {
  providerVideoId: "123",
  shareUrl: "https://www.tiktok.com/@pilot/video/123",
  caption: "Tres errores al elegir escuela",
  hashtags: [],
  durationSeconds: 45,
  views: 1000,
  likes: 100,
  comments: 10,
  shares: 5,
};

describe("Content OS TikTok AI analysis", () => {
  it("usa salida estructurada y no almacena la respuesta en OpenAI", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        videos: [
          {
            providerVideoId: "123",
            title: "Errores al elegir escuela",
            summary: "Tres criterios prácticos.",
            hook: "No elijas escuela sin mirar esto",
            pillar: "training",
            objective: "authority",
            relatedProduct: "career_planner",
          },
        ],
      }),
    });
    const result = await analyzeContentOsTikTokVideos(
      DEFAULT_CONTENT_OS_BRAND_PROFILE,
      [video],
      { client: { create }, model: "test-model" },
    );
    expect(result.analyses).toHaveLength(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        store: false,
        text: expect.objectContaining({
          format: expect.objectContaining({ type: "json_schema", strict: true }),
        }),
      }),
    );
  });

  it("rechaza una clasificación fuera del contrato", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        videos: [
          {
            providerVideoId: "123",
            title: "Título",
            summary: "Resumen",
            hook: "Hook",
            pillar: "politics",
            objective: "growth",
            relatedProduct: null,
          },
        ],
      }),
    });
    await expect(
      analyzeContentOsTikTokVideos(DEFAULT_CONTENT_OS_BRAND_PROFILE, [video], {
        client: { create },
      }),
    ).rejects.toBeInstanceOf(ContentOsTikTokAnalysisError);
  });
});
