import { describe, expect, it } from "vitest";
import {
  CONTENT_OS_LIMITS,
  contentOsMadridLocalDateTimeToIso,
  getLatestContentOsMetrics,
  getContentOsAdjacentDate,
  parseContentOsCalendarEventForm,
  parseContentOsCalendarParameters,
  parseContentOsIdeaForm,
  parseContentOsItemForm,
  parseContentOsMetricForm,
  type ContentOsMetricSnapshot,
} from "./content-os-contract";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const validIdea = {
  title: "Tres errores al elegir escuela",
  description: "Una pieza práctica desde experiencia personal.",
  category: "aviation",
  platform: "tiktok_pilotfeliu",
  objective: "authority",
  status: "new",
};

const validItem = {
  title: "Lo que preguntaría hoy a una escuela",
  platform: "youtube",
  objective: "conversion",
  category: "aviation",
  hook: "Antes de pagar, pregunta esto.",
  script: "Guion completo.",
  cta: "Compara tus opciones en FlyPath.",
  notes: "",
  status: "draft",
  plannedRecordingOn: "2026-08-03",
  plannedPublishOn: "2026-08-10",
};

describe("Content OS contract", () => {
  it("normaliza una idea con valores cerrados", () => {
    expect(parseContentOsIdeaForm(formData(validIdea))).toEqual(validIdea);
  });

  it("rechaza estados, plataformas y textos inválidos", () => {
    expect(parseContentOsIdeaForm(formData({ ...validIdea, platform: "linkedin" }))).toBeNull();
    expect(parseContentOsIdeaForm(formData({ ...validIdea, title: " " }))).toBeNull();
    expect(parseContentOsIdeaForm(formData({ ...validIdea, status: "automatic" }))).toBeNull();
    expect(
      parseContentOsIdeaForm(
        formData({ ...validIdea, title: "a".repeat(CONTENT_OS_LIMITS.ideaTitle + 1) }),
      ),
    ).toBeNull();
  });

  it("valida la ficha completa y el orden de sus fechas", () => {
    expect(parseContentOsItemForm(formData(validItem))).toEqual({
      ...validItem,
      category: "aviation",
      notes: null,
    });
    expect(
      parseContentOsItemForm(
        formData({
          ...validItem,
          plannedRecordingOn: "2026-08-11",
          plannedPublishOn: "2026-08-10",
        }),
      ),
    ).toBeNull();
    expect(parseContentOsItemForm(formData({ ...validItem, hook: "" }))).toBeNull();
    expect(
      parseContentOsItemForm(
        formData({ ...validItem, script: "a".repeat(CONTENT_OS_LIMITS.itemScript + 1) }),
      ),
    ).toBeNull();
  });

  it("interpreta datetime-local como Europe/Madrid de forma estable", () => {
    expect(contentOsMadridLocalDateTimeToIso("2026-07-29T10:15")).toBe(
      "2026-07-29T08:15:00.000Z",
    );
    expect(contentOsMadridLocalDateTimeToIso("2026-01-29T10:15")).toBe(
      "2026-01-29T09:15:00.000Z",
    );
    expect(contentOsMadridLocalDateTimeToIso("not-a-date")).toBeNull();
  });

  it("valida bloques de calendario y limita su duración", () => {
    const event = {
      title: "Grabar vídeo",
      contentItemId: "",
      eventType: "record",
      startsAt: "2026-07-29T10:00",
      endsAt: "2026-07-29T11:30",
      notes: "",
    };
    expect(parseContentOsCalendarEventForm(formData(event))).toEqual({
      title: "Grabar vídeo",
      contentItemId: null,
      eventType: "record",
      startsAt: "2026-07-29T08:00:00.000Z",
      endsAt: "2026-07-29T09:30:00.000Z",
      timezone: "Europe/Madrid",
      notes: null,
    });
    expect(
      parseContentOsCalendarEventForm(
        formData({ ...event, endsAt: "2026-07-30T12:00" }),
      ),
    ).toBeNull();
    expect(
      parseContentOsCalendarEventForm(
        formData({ ...event, notes: "a".repeat(CONTENT_OS_LIMITS.calendarNotes + 1) }),
      ),
    ).toBeNull();
  });

  it("normaliza vista semanal y mensual ignorando parámetros inválidos", () => {
    const week = parseContentOsCalendarParameters({
      view: "unknown",
      date: "2026-07-29",
    });
    expect(week.view).toBe("week");
    expect(week.rangeStart).toBe("2026-07-27");
    expect(week.days).toHaveLength(7);
    expect(getContentOsAdjacentDate(week, "next")).toBe("2026-08-05");

    const month = parseContentOsCalendarParameters({
      view: "month",
      date: "2026-08-12",
    });
    expect(month.view).toBe("month");
    expect(month.days.length % 7).toBe(0);
    expect(month.days[0]).toBe("2026-07-27");
    expect(month.days.at(-1)).toBe("2026-09-06");
  });

  it("acepta métricas no negativas y rechaza negativos o fechas imposibles", () => {
    const values = {
      recordedOn: "2026-07-29",
      views: "1200",
      likes: "80",
      comments: "12",
      shares: "9",
      saves: "7",
      followersGained: "18",
      leadsGenerated: "3",
      salesAttributed: "1",
    };
    expect(parseContentOsMetricForm(formData(values))).toEqual({
      recordedOn: "2026-07-29",
      views: 1200,
      likes: 80,
      comments: 12,
      shares: 9,
      saves: 7,
      followersGained: 18,
      leadsGenerated: 3,
      salesAttributed: 1,
    });
    expect(parseContentOsMetricForm(formData({ ...values, views: "-1" }))).toBeNull();
    expect(
      parseContentOsMetricForm(
        formData({ ...values, views: String(CONTENT_OS_LIMITS.metricValue + 1) }),
      ),
    ).toBeNull();
    expect(
      parseContentOsMetricForm(formData({ ...values, recordedOn: "2026-02-31" })),
    ).toBeNull();
  });

  it("usa el snapshot más reciente sin inflar métricas acumuladas", () => {
    const base = {
      contentItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      createdAt: "2026-07-29T10:00:00.000Z",
      updatedAt: "2026-07-29T10:00:00.000Z",
    };
    const metrics: ContentOsMetricSnapshot[] = [
      {
        ...base,
        id: "11111111-1111-4111-8111-111111111111",
        recordedOn: "2026-07-28",
        views: 100,
        likes: 10,
        comments: 2,
        shares: 3,
        saves: 2,
        followersGained: 4,
        leadsGenerated: 1,
        salesAttributed: 0,
      },
      {
        ...base,
        id: "22222222-2222-4222-8222-222222222222",
        recordedOn: "2026-07-29",
        views: 150,
        likes: 20,
        comments: 4,
        shares: 5,
        saves: 4,
        followersGained: 6,
        leadsGenerated: 2,
        salesAttributed: 1,
      },
    ];
    expect(getLatestContentOsMetrics(metrics)).toEqual({
      views: 150,
      likes: 20,
      comments: 4,
      shares: 5,
      saves: 4,
      followersGained: 6,
      leadsGenerated: 2,
      salesAttributed: 1,
    });
  });
});
