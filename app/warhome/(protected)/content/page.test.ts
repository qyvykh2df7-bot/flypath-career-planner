import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContentOsCalendarWorkspace: vi.fn(),
}));

vi.mock("@/lib/warhome/content-os", () => ({
  getContentOsCalendarWorkspace: mocks.getContentOsCalendarWorkspace,
}));
vi.mock("@/components/warhome/content/ContentCalendar", () => ({
  ContentCalendar: ({ parameters }: { parameters: { view: string } }) =>
    createElement("div", null, `Calendario ${parameters.view}`),
}));

import ContentOsCalendarPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Content OS calendar page", () => {
  it("normaliza parámetros y consulta la capa server-only", async () => {
    mocks.getContentOsCalendarWorkspace.mockResolvedValue({ events: [], items: [] });
    const markup = renderToStaticMarkup(
      await ContentOsCalendarPage({
        searchParams: Promise.resolve({ view: "month", date: "2026-08-12" }),
      }),
    );

    expect(mocks.getContentOsCalendarWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ view: "month", anchorDate: "2026-08-12" }),
    );
    expect(markup).toContain("Content OS");
    expect(markup).toContain("Calendario month");
  });

  it("muestra un error genérico sin filtrar el detalle interno", async () => {
    mocks.getContentOsCalendarWorkspace.mockRejectedValue(
      new Error("relation content_ideas does not exist"),
    );
    const markup = renderToStaticMarkup(
      await ContentOsCalendarPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("No se ha podido cargar Content OS");
    expect(markup).not.toContain("relation content_ideas");
  });
});
