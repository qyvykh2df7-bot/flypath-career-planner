import "server-only";

import OpenAI from "openai";
import {
  parseContentOsPlanningOutput,
  type ContentOsAiPlanningContext,
  type ContentOsAiPlanningOutput,
  type ContentOsAiPlanningSuggestion,
} from "@/lib/warhome/content-os-planning-contract";

const DEFAULT_CONTENT_OS_PLANNER_MODEL = "gpt-5.6-terra";

type ContentOsResponsesClient = {
  create: (input: Record<string, unknown>) => Promise<{ output_text?: string }>;
};

export class ContentOsPlannerUnavailableError extends Error {
  constructor() {
    super("Content OS planner is unavailable");
    this.name = "ContentOsPlannerUnavailableError";
  }
}

function overlaps(
  startsAt: string,
  endsAt: string,
  slotStartsAt: string,
  slotEndsAt: string,
): boolean {
  return (
    new Date(startsAt).getTime() < new Date(slotEndsAt).getTime() &&
    new Date(endsAt).getTime() > new Date(slotStartsAt).getTime()
  );
}

function isInside(
  suggestion: ContentOsAiPlanningSuggestion,
  startsAt: string,
  endsAt: string,
): boolean {
  return (
    new Date(suggestion.startsAt).getTime() >= new Date(startsAt).getTime() &&
    new Date(suggestion.endsAt).getTime() <= new Date(endsAt).getTime()
  );
}

export function proposalFitsContentOsAvailability(
  suggestion: ContentOsAiPlanningSuggestion,
  context: ContentOsAiPlanningContext,
): boolean {
  const blocked = context.availability.some(
    (slot) =>
      (slot.availabilityType === "work" ||
        slot.availabilityType === "travel") &&
      overlaps(
        suggestion.startsAt,
        suggestion.endsAt,
        slot.startsAt,
        slot.endsAt,
      ),
  );
  if (blocked) return false;

  return context.availability.some(
    (slot) =>
      (slot.availabilityType === "rest" ||
        slot.availabilityType === "recording_available") &&
      isInside(suggestion, slot.startsAt, slot.endsAt),
  );
}

function plannerInput(context: ContentOsAiPlanningContext): string {
  return JSON.stringify({
    period: {
      start: context.periodStart,
      end: context.periodEnd,
      timezone: "Europe/Madrid",
    },
    availability: context.availability.map((slot) => ({
      type: slot.availabilityType,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      notes: slot.notes,
    })),
    ideas: context.ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      platform: idea.platform,
      objective: idea.objective,
      status: idea.status,
    })),
    pendingContent: context.items.map((item) => ({
      id: item.id,
      title: item.title,
      platform: item.platform,
      objective: item.objective,
      status: item.status,
    })),
  });
}

const CONTENT_OS_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "suggestions"],
  properties: {
    summary: { type: "string", maxLength: 5000 },
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "eventType",
          "startsAt",
          "endsAt",
          "contentItemId",
          "contentIdeaId",
          "notes",
        ],
        properties: {
          title: { type: "string", maxLength: 160 },
          eventType: { type: "string", enum: ["record", "edit", "publish"] },
          startsAt: { type: "string" },
          endsAt: { type: "string" },
          contentItemId: { type: ["string", "null"] },
          contentIdeaId: { type: ["string", "null"] },
          notes: { type: ["string", "null"], maxLength: 5000 },
        },
      },
    },
  },
} as const;

export async function generateContentOsPlanningProposal(
  context: ContentOsAiPlanningContext,
  options: {
    client?: ContentOsResponsesClient;
    model?: string;
  } = {},
): Promise<{ model: string; output: ContentOsAiPlanningOutput }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model =
    options.model ??
    process.env.CONTENT_OS_PLANNER_MODEL?.trim() ??
    DEFAULT_CONTENT_OS_PLANNER_MODEL;

  if (!options.client && !apiKey) throw new ContentOsPlannerUnavailableError();

  const client =
    options.client ??
    (new OpenAI({ apiKey }).responses as unknown as ContentOsResponsesClient);

  let response: { output_text?: string };
  try {
    response = await client.create({
      model,
      store: false,
      instructions: [
        "Eres el asistente planificador privado de Content OS PilotFeliu.",
        "Genera una propuesta editorial concreta para el periodo indicado.",
        "Solo puedes usar IDs de ideas y contenidos incluidos en el contexto.",
        "Cada bloque debe referenciar al menos una idea o contenido.",
        "Programa únicamente dentro de franjas rest o recording_available.",
        "Nunca programes sobre work o travel.",
        "Usa horas ISO 8601 con offset de Europe/Madrid.",
        "Combina grabación, edición y publicación cuando el estado del contenido lo permita.",
        "No afirmes que el calendario se ha modificado: esto es solo una propuesta revisable.",
        "Devuelve texto en español.",
      ].join("\n"),
      input: plannerInput(context),
      text: {
        format: {
          type: "json_schema",
          name: "content_os_planning_proposal",
          strict: true,
          schema: CONTENT_OS_PLAN_SCHEMA,
        },
      },
      max_output_tokens: 4_000,
    });
  } catch {
    throw new ContentOsPlannerUnavailableError();
  }

  if (!response.output_text) throw new ContentOsPlannerUnavailableError();

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new ContentOsPlannerUnavailableError();
  }

  const output = parseContentOsPlanningOutput(parsed, context);
  if (
    !output ||
    output.suggestions.some(
      (suggestion) => !proposalFitsContentOsAvailability(suggestion, context),
    )
  ) {
    throw new ContentOsPlannerUnavailableError();
  }

  return { model, output };
}
