import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ContentOsPlannerUnavailableError,
  generateContentOsPlanningProposal,
  proposalFitsContentOsAvailability,
} from "./content-os-ai-planner";
import type { ContentOsAiPlanningContext } from "./content-os-planning-contract";

const context: ContentOsAiPlanningContext = {
  periodStart: "2026-08-03",
  periodEnd: "2026-08-16",
  availability: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      availabilityType: "recording_available",
      startsAt: "2026-08-04T08:00:00.000Z",
      endsAt: "2026-08-04T12:00:00.000Z",
      timezone: "Europe/Madrid",
      notes: null,
      createdAt: "2026-08-01T08:00:00.000Z",
      updatedAt: "2026-08-01T08:00:00.000Z",
    },
  ],
  ideas: [],
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Vídeo pendiente",
      platform: "youtube",
      objective: "growth",
      status: "production",
    },
  ],
};

const suggestion = {
  title: "Grabar vídeo pendiente",
  eventType: "record" as const,
  startsAt: "2026-08-04T09:00:00.000Z",
  endsAt: "2026-08-04T10:00:00.000Z",
  contentItemId: "22222222-2222-4222-8222-222222222222",
  contentIdeaId: null,
  notes: null,
};

describe("Content OS AI planner", () => {
  it("genera salida estructurada sin modificar calendario", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        summary: "Plan revisable.",
        suggestions: [suggestion],
      }),
    });

    await expect(
      generateContentOsPlanningProposal(context, {
        client: { create },
        model: "test-planner",
      }),
    ).resolves.toEqual({
      model: "test-planner",
      output: {
        summary: "Plan revisable.",
        suggestions: [suggestion],
      },
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
  });

  it("rechaza propuestas fuera de disponibilidad o sobre trabajo", async () => {
    expect(
      proposalFitsContentOsAvailability(
        {
          ...suggestion,
          startsAt: "2026-08-04T13:00:00.000Z",
          endsAt: "2026-08-04T14:00:00.000Z",
        },
        context,
      ),
    ).toBe(false);

    const workContext: ContentOsAiPlanningContext = {
      ...context,
      availability: [
        ...context.availability,
        {
          ...context.availability[0],
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          availabilityType: "work",
          startsAt: "2026-08-04T09:30:00.000Z",
          endsAt: "2026-08-04T11:00:00.000Z",
        },
      ],
    };
    expect(proposalFitsContentOsAvailability(suggestion, workContext)).toBe(false);
  });

  it("falla de forma controlada ante respuesta inválida", async () => {
    await expect(
      generateContentOsPlanningProposal(context, {
        client: {
          create: vi.fn().mockResolvedValue({ output_text: '{"summary":""}' }),
        },
        model: "test-planner",
      }),
    ).rejects.toBeInstanceOf(ContentOsPlannerUnavailableError);
  });
});
