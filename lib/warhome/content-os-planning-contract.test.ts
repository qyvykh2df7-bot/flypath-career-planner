import { describe, expect, it } from "vitest";
import {
  contentOsAvailabilitySlotsConflict,
  parseContentOsAvailabilityForm,
  parseContentOsPlanningOutput,
  type ContentOsAiPlanningContext,
} from "./content-os-planning-contract";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const context: ContentOsAiPlanningContext = {
  periodStart: "2026-08-03",
  periodEnd: "2026-08-16",
  availability: [],
  ideas: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Errores al elegir escuela",
      platform: "tiktok_pilotfeliu",
      objective: "authority",
      status: "approved",
    },
  ],
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

describe("Content OS planning contract", () => {
  it("normaliza una franja manual en Europe/Madrid", () => {
    expect(
      parseContentOsAvailabilityForm(
        formData({
          availabilityType: "recording_available",
          startsAt: "2026-08-04T10:00",
          endsAt: "2026-08-04T12:30",
          notes: "Luz natural",
        }),
      ),
    ).toEqual({
      availabilityType: "recording_available",
      startsAt: "2026-08-04T08:00:00.000Z",
      endsAt: "2026-08-04T10:30:00.000Z",
      timezone: "Europe/Madrid",
      notes: "Luz natural",
    });
  });

  it("rechaza tipos cerrados, rangos inversos y franjas desproporcionadas", () => {
    const base = {
      availabilityType: "work",
      startsAt: "2026-08-04T10:00",
      endsAt: "2026-08-04T12:00",
      notes: "",
    };
    expect(
      parseContentOsAvailabilityForm(
        formData({ ...base, availabilityType: "holiday" }),
      ),
    ).toBeNull();
    expect(
      parseContentOsAvailabilityForm(
        formData({ ...base, endsAt: "2026-08-04T09:00" }),
      ),
    ).toBeNull();
    expect(
      parseContentOsAvailabilityForm(
        formData({ ...base, endsAt: "2026-09-20T09:00" }),
      ),
    ).toBeNull();
  });

  it("acepta una propuesta estructurada con referencias conocidas", () => {
    const result = parseContentOsPlanningOutput(
      {
        summary: "Dos bloques para avanzar esta semana.",
        suggestions: [
          {
            title: "Grabar vídeo pendiente",
            eventType: "record",
            startsAt: "2026-08-04T10:00:00+02:00",
            endsAt: "2026-08-04T11:30:00+02:00",
            contentItemId: "22222222-2222-4222-8222-222222222222",
            contentIdeaId: null,
            notes: "Usar Sony",
          },
        ],
      },
      context,
    );

    expect(result).toMatchObject({
      summary: "Dos bloques para avanzar esta semana.",
      suggestions: [
        {
          eventType: "record",
          startsAt: "2026-08-04T08:00:00.000Z",
          contentItemId: "22222222-2222-4222-8222-222222222222",
        },
      ],
    });
  });

  it("rechaza IDs inventados, bloques sin contenido y fechas fuera del periodo", () => {
    const base = {
      title: "Grabar",
      eventType: "record",
      startsAt: "2026-08-04T10:00:00+02:00",
      endsAt: "2026-08-04T11:00:00+02:00",
      contentItemId: "22222222-2222-4222-8222-222222222222",
      contentIdeaId: null,
      notes: null,
    };
    expect(
      parseContentOsPlanningOutput(
        {
          summary: "Plan",
          suggestions: [
            {
              ...base,
              contentItemId: "33333333-3333-4333-8333-333333333333",
            },
          ],
        },
        context,
      ),
    ).toBeNull();
    expect(
      parseContentOsPlanningOutput(
        {
          summary: "Plan",
          suggestions: [{ ...base, contentItemId: null }],
        },
        context,
      ),
    ).toBeNull();
    expect(
      parseContentOsPlanningOutput(
        {
          summary: "Plan",
          suggestions: [
            {
              ...base,
              startsAt: "2026-08-20T10:00:00+02:00",
              endsAt: "2026-08-20T11:00:00+02:00",
            },
          ],
        },
        context,
      ),
    ).toBeNull();
  });

  it("rechaza eventos internos de una misma propuesta que se solapan", () => {
    const event = {
      title: "Grabar vídeo pendiente",
      eventType: "record",
      startsAt: "2026-08-04T10:00:00+02:00",
      endsAt: "2026-08-04T11:00:00+02:00",
      contentItemId: "22222222-2222-4222-8222-222222222222",
      contentIdeaId: null,
      notes: null,
    };

    expect(
      parseContentOsPlanningOutput(
        {
          summary: "Plan con conflicto.",
          suggestions: [
            event,
            {
              ...event,
              title: "Editar vídeo pendiente",
              eventType: "edit",
              startsAt: "2026-08-04T10:30:00+02:00",
              endsAt: "2026-08-04T11:30:00+02:00",
            },
          ],
        },
        context,
      ),
    ).toBeNull();
  });

  it("rechaza solapamientos claros del roster y permite grabar durante descanso", () => {
    const work = {
      availabilityType: "work" as const,
      startsAt: "2026-08-04T08:00:00.000Z",
      endsAt: "2026-08-04T12:00:00.000Z",
    };
    const rest = {
      availabilityType: "rest" as const,
      startsAt: "2026-08-04T08:00:00.000Z",
      endsAt: "2026-08-04T12:00:00.000Z",
    };
    const recording = {
      availabilityType: "recording_available" as const,
      startsAt: "2026-08-04T09:00:00.000Z",
      endsAt: "2026-08-04T10:00:00.000Z",
    };

    expect(contentOsAvailabilitySlotsConflict(work, recording)).toBe(true);
    expect(contentOsAvailabilitySlotsConflict(rest, recording)).toBe(false);
    expect(contentOsAvailabilitySlotsConflict(recording, recording)).toBe(true);
  });
});
