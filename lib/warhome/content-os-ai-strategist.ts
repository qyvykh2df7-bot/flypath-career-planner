import "server-only";

import OpenAI from "openai";
import {
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
} from "@/lib/warhome/content-os-contract";
import { PILOTFELIU_CONTENT_STRATEGY } from "@/lib/warhome/content-os-strategy-config";
import {
  CONTENT_OS_STRATEGY_FORMATS,
  CONTENT_OS_STRATEGY_PILLARS,
  CONTENT_OS_STRATEGY_PRIORITIES,
  CONTENT_OS_STRATEGY_PRODUCTS,
  CONTENT_OS_STRATEGY_LIMITS,
  getContentOsStrategyObjectiveTargets,
  parseContentOsStrategyOutput,
  type ContentOsStrategyContext,
  type ContentOsStrategyOutput,
} from "@/lib/warhome/content-os-strategy-contract";

const DEFAULT_CONTENT_OS_STRATEGIST_MODEL = "gpt-5.6-terra";

type ContentOsResponsesClient = {
  create: (input: Record<string, unknown>) => Promise<{ output_text?: string }>;
};

export class ContentOsStrategistUnavailableError extends Error {
  constructor() {
    super("Content OS strategist is unavailable");
    this.name = "ContentOsStrategistUnavailableError";
  }
}

function strategistInput(context: ContentOsStrategyContext): string {
  const targets = getContentOsStrategyObjectiveTargets(context.balance);
  return JSON.stringify({
    strategicContext: PILOTFELIU_CONTENT_STRATEGY,
    requestedMix: {
      percentages: context.balance,
      exactProposalCounts: targets,
    },
    existingContent: context.history.map((entry) => ({
      title: entry.title,
      objective: entry.objective,
      category: entry.category,
      status: entry.status,
      published: entry.published,
    })),
    proposalCount: CONTENT_OS_STRATEGY_LIMITS.proposalCount,
  });
}

const CONTENT_OS_STRATEGY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "suggestions"],
  properties: {
    summary: { type: "string", maxLength: 5_000 },
    suggestions: {
      type: "array",
      minItems: CONTENT_OS_STRATEGY_LIMITS.proposalCount,
      maxItems: CONTENT_OS_STRATEGY_LIMITS.proposalCount,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "idea",
          "hook",
          "explanation",
          "platforms",
          "format",
          "durationSeconds",
          "objective",
          "relatedProduct",
          "cta",
          "priority",
          "pillar",
        ],
        properties: {
          title: { type: "string", maxLength: 160 },
          idea: {
            type: "string",
            maxLength: CONTENT_OS_STRATEGY_LIMITS.idea,
          },
          hook: {
            type: "string",
            maxLength: CONTENT_OS_STRATEGY_LIMITS.hook,
          },
          explanation: {
            type: "string",
            maxLength: CONTENT_OS_STRATEGY_LIMITS.explanation,
          },
          platforms: {
            type: "array",
            minItems: 1,
            maxItems: CONTENT_OS_PLATFORMS.length,
            uniqueItems: true,
            items: {
              type: "string",
              enum: CONTENT_OS_PLATFORMS,
            },
          },
          format: {
            type: "string",
            enum: CONTENT_OS_STRATEGY_FORMATS,
          },
          durationSeconds: {
            type: "integer",
            minimum: CONTENT_OS_STRATEGY_LIMITS.durationSecondsMin,
            maximum: CONTENT_OS_STRATEGY_LIMITS.durationSecondsMax,
          },
          objective: {
            type: "string",
            enum: CONTENT_OS_OBJECTIVES,
          },
          relatedProduct: {
            type: ["string", "null"],
            enum: [...CONTENT_OS_STRATEGY_PRODUCTS, null],
          },
          cta: {
            type: "string",
            maxLength: CONTENT_OS_STRATEGY_LIMITS.cta,
          },
          priority: {
            type: "string",
            enum: CONTENT_OS_STRATEGY_PRIORITIES,
          },
          pillar: {
            type: "string",
            enum: CONTENT_OS_STRATEGY_PILLARS,
          },
        },
      },
    },
  },
} as const;

export async function generateContentOsStrategy(
  context: ContentOsStrategyContext,
  options: {
    client?: ContentOsResponsesClient;
    model?: string;
  } = {},
): Promise<{ model: string; output: ContentOsStrategyOutput }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model =
    options.model ??
    process.env.CONTENT_OS_STRATEGIST_MODEL?.trim() ??
    DEFAULT_CONTENT_OS_STRATEGIST_MODEL;
  if (!options.client && !apiKey) {
    throw new ContentOsStrategistUnavailableError();
  }

  const client =
    options.client ??
    (new OpenAI({ apiKey }).responses as unknown as ContentOsResponsesClient);

  let response: { output_text?: string };
  try {
    response = await client.create({
      model,
      store: false,
      instructions: [
        "Eres el AI Content Strategist privado de PilotFeliu dentro de FlyPath.",
        "Tu trabajo es proponer qué contenido crear; nunca crear calendario ni afirmar que una acción se ha ejecutado.",
        "Devuelve exactamente la cantidad y mezcla de objetivos indicada en exactProposalCounts.",
        "Usa los pilares, audiencias, productos y límites profesionales del contexto.",
        "Relaciona un producto solo cuando la conexión sea natural. No conviertas todas las propuestas en venta.",
        "Para Instagram distingue entre Instagram PilotFeliu e Instagram FlyPath según el enfoque.",
        "Evita títulos e ideas idénticos o sustancialmente repetidos respecto al contenido existente.",
        "Varía pilares, formatos, plataformas, duraciones y enfoques.",
        "El hook debe poder usarse como primera frase del contenido.",
        "La explicación debe justificar por qué la idea encaja con audiencia y objetivo.",
        "Devuelve todo el texto editorial en español.",
      ].join("\n"),
      input: strategistInput(context),
      text: {
        format: {
          type: "json_schema",
          name: "content_os_strategy_proposals",
          strict: true,
          schema: CONTENT_OS_STRATEGY_SCHEMA,
        },
      },
      max_output_tokens: 10_000,
    });
  } catch {
    throw new ContentOsStrategistUnavailableError();
  }

  if (!response.output_text) {
    throw new ContentOsStrategistUnavailableError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new ContentOsStrategistUnavailableError();
  }

  const output = parseContentOsStrategyOutput(parsed, context);
  if (!output) throw new ContentOsStrategistUnavailableError();
  return { model, output };
}
