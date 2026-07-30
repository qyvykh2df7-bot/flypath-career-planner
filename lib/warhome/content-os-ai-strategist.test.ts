import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ContentOsStrategistUnavailableError,
  generateContentOsStrategy,
} from "./content-os-ai-strategist";
import {
  CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
  type ContentOsStrategyContext,
} from "./content-os-strategy-contract";
import { DEFAULT_CONTENT_OS_BRAND_PROFILE } from "./content-os-brand-contract";

const context: ContentOsStrategyContext = {
  brand: DEFAULT_CONTENT_OS_BRAND_PROFILE,
  balance: CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
  history: [
    {
      title: "Vídeo histórico",
      objective: "authority",
      category: "aviation",
      platform: "youtube",
      hook: "Hook histórico",
      contentPillar: "training",
      relatedProductKey: "guide",
      contentOrigin: "historical",
      status: "published",
      published: true,
      metrics: {
        views: 12_000,
        likes: 800,
        comments: 40,
        shares: 75,
        saves: 120,
        followersGained: 90,
        leadsGenerated: 12,
        salesAttributed: 3,
      },
    },
  ],
};

const objectives = [
  "growth",
  "growth",
  "growth",
  "growth",
  "authority",
  "authority",
  "authority",
  "community",
  "community",
  "conversion",
] as const;

function output() {
  return {
    summary: "Propuesta estratégica revisable.",
    suggestions: objectives.map((objective, index) => ({
      title: `Idea ${index + 1}`,
      idea: `Desarrollo de la idea ${index + 1}`,
      hook: `Hook ${index + 1}`,
      explanation: "Explicación editorial.",
      platforms: ["tiktok_pilotfeliu"],
      format: "talking_head",
      durationSeconds: 60,
      objective,
      relatedProduct: objective === "conversion" ? "aerocomms" : null,
      cta: "CTA recomendado.",
      priority: "medium",
      pillar: objective === "conversion" ? "product_sales" : "pilot_life",
    })),
  };
}

describe("Content OS AI strategist", () => {
  it("genera JSON estructurado sin almacenar prompts o respuestas", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify(output()),
    });

    await expect(
      generateContentOsStrategy(context, {
        client: { create },
        model: "test-strategist",
      }),
    ).resolves.toEqual({
      model: "test-strategist",
      output: output(),
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        store: false,
        text: {
          format: expect.objectContaining({
            type: "json_schema",
            strict: true,
          }),
        },
      }),
    );
    const providerInput = JSON.parse(
      String((create.mock.calls[0]?.[0] as { input: string }).input),
    ) as {
      strategicContext: { brand: { name: string; tone: { avoid: string } } };
      existingContent: Array<{
        title: string;
        contentOrigin: string;
        metrics: { saves: number };
      }>;
    };
    expect(providerInput.strategicContext.brand.name).toBe("PilotFeliu");
    expect(providerInput.strategicContext.brand.tone.avoid).toContain(
      "Política",
    );
    expect(providerInput.existingContent[0]).toMatchObject({
      title: "Vídeo histórico",
      contentOrigin: "historical",
      metrics: { saves: 120 },
    });
    const request = create.mock.calls[0]?.[0] as {
      text: { format: { schema: unknown } };
    };
    expect(JSON.stringify(request.text.format.schema)).not.toContain(
      "uniqueItems",
    );
  });

  it("rechaza respuestas que no respetan el contrato editorial", async () => {
    const invalid = output();
    invalid.suggestions[0].objective = "conversion";

    await expect(
      generateContentOsStrategy(context, {
        client: {
          create: vi
            .fn()
            .mockResolvedValue({ output_text: JSON.stringify(invalid) }),
        },
        model: "test-strategist",
      }),
    ).rejects.toBeInstanceOf(ContentOsStrategistUnavailableError);
  });
});
