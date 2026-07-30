import "server-only";

import OpenAI from "openai";
import { CONTENT_OS_OBJECTIVES } from "@/lib/warhome/content-os-contract";
import { CONTENT_OS_STRATEGY_PRODUCTS } from "@/lib/warhome/content-os-strategy-contract";
import {
  CONTENT_OS_TIKTOK_ANALYSIS_PILLARS,
  CONTENT_OS_TIKTOK_LIMITS,
  parseContentOsTikTokAnalysisOutput,
  type ContentOsTikTokAnalysis,
  type ContentOsTikTokAnalysisInput,
} from "@/lib/warhome/content-os-tiktok-contract";
import type { ContentOsBrandProfile } from "@/lib/warhome/content-os-brand-contract";

const DEFAULT_MODEL = "gpt-5.6-terra";

type ResponsesClient = {
  create: (input: Record<string, unknown>) => Promise<{ output_text?: string }>;
};

export class ContentOsTikTokAnalysisError extends Error {
  constructor() {
    super("Content OS TikTok analysis is unavailable");
    this.name = "ContentOsTikTokAnalysisError";
  }
}

function schema(videoCount: number) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["videos"],
    properties: {
      videos: {
        type: "array",
        minItems: videoCount,
        maxItems: videoCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "providerVideoId",
            "title",
            "summary",
            "hook",
            "pillar",
            "objective",
            "relatedProduct",
          ],
          properties: {
            providerVideoId: {
              type: "string",
              maxLength: CONTENT_OS_TIKTOK_LIMITS.providerId,
            },
            title: { type: "string", maxLength: 160 },
            summary: { type: "string", maxLength: 5_000 },
            hook: { type: "string", maxLength: 1_000 },
            pillar: {
              type: "string",
              enum: CONTENT_OS_TIKTOK_ANALYSIS_PILLARS,
            },
            objective: {
              type: "string",
              enum: CONTENT_OS_OBJECTIVES,
            },
            relatedProduct: {
              type: ["string", "null"],
              enum: [...CONTENT_OS_STRATEGY_PRODUCTS, null],
            },
          },
        },
      },
    },
  } as const;
}

export async function analyzeContentOsTikTokVideos(
  brand: ContentOsBrandProfile,
  videos: ContentOsTikTokAnalysisInput[],
  options: { client?: ResponsesClient; model?: string } = {},
): Promise<{ model: string; analyses: ContentOsTikTokAnalysis[] }> {
  if (
    videos.length < 1 ||
    videos.length > CONTENT_OS_TIKTOK_LIMITS.analysisBatch
  ) {
    throw new ContentOsTikTokAnalysisError();
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model =
    options.model ??
    process.env.CONTENT_OS_TIKTOK_ANALYSIS_MODEL?.trim() ??
    DEFAULT_MODEL;
  if (!options.client && !apiKey) throw new ContentOsTikTokAnalysisError();
  const client =
    options.client ??
    (new OpenAI({ apiKey }).responses as unknown as ResponsesClient);

  let response: { output_text?: string };
  try {
    response = await client.create({
      model,
      store: false,
      instructions: [
        "Clasifica contenido TikTok histórico de PilotFeliu para revisión humana.",
        "Solo dispones de caption, URL, duración y métricas; no afirmes haber visto u oído el vídeo.",
        "Genera título interno, resumen y hook útiles a partir de los datos disponibles.",
        "Elige exactamente un pilar y un objetivo de los valores permitidos.",
        "Relaciona un producto solo cuando el caption o el contexto lo justifiquen.",
        "Respeta los límites profesionales y editoriales del Brand DNA.",
        "No publiques, no programes y no ejecutes ninguna acción.",
        "Devuelve texto editorial en español.",
      ].join("\n"),
      input: JSON.stringify({
        brand: {
          name: brand.brandName,
          description: brand.brandDescription,
          audiences: brand.audiences,
          products: brand.products,
          contentPillars: brand.contentPillars,
          objectives: brand.objectives,
          tone: {
            style: brand.toneStyle,
            personality: brand.tonePersonality,
            communication: brand.toneCommunication,
            avoid: brand.toneAvoid,
          },
        },
        videos,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "content_os_tiktok_analysis",
          strict: true,
          schema: schema(videos.length),
        },
      },
      max_output_tokens: Math.min(10_000, 900 * videos.length),
    });
  } catch {
    throw new ContentOsTikTokAnalysisError();
  }
  if (!response.output_text) throw new ContentOsTikTokAnalysisError();

  let value: unknown;
  try {
    value = JSON.parse(response.output_text);
  } catch {
    throw new ContentOsTikTokAnalysisError();
  }
  const analyses = parseContentOsTikTokAnalysisOutput(
    value,
    videos.map((video) => video.providerVideoId),
  );
  if (!analyses) throw new ContentOsTikTokAnalysisError();
  return { model, analyses };
}
