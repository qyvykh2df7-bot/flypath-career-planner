import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/warhome/(protected)/content/actions", () => ({
  CONTENT_OS_INITIAL_ACTION_STATE: { status: "idle", message: null },
  createContentOsAvailabilityAction: vi.fn(),
  updateContentOsAvailabilityAction: vi.fn(),
  deleteContentOsAvailabilityAction: vi.fn(),
  createContentOsAiProposalAction: vi.fn(),
  reviewContentOsAiProposalAction: vi.fn(),
}));

import { ContentAiPlannerWorkspace } from "./ContentAiPlannerWorkspace";
import { ContentAvailabilityWorkspace } from "./ContentAvailabilityWorkspace";

describe("Content OS planning workspaces", () => {
  it("muestra roster manual con sus cuatro tipos cerrados", () => {
    const markup = renderToStaticMarkup(
      createElement(ContentAvailabilityWorkspace, {
        slots: [],
        defaultStartsAt: "2026-08-04T10:00",
        defaultEndsAt: "2026-08-04T12:00",
      }),
    );

    expect(markup).toContain("Todavía no hay roster");
    for (const label of [
      "Trabajo",
      "Descanso / día libre",
      "Viaje",
      "Disponible para grabación",
    ]) {
      expect(markup).toContain(label);
    }
  });

  it("deja claro que una propuesta IA requiere aprobación manual", () => {
    const markup = renderToStaticMarkup(
      createElement(ContentAiPlannerWorkspace, {
        workspace: {
          periodStart: "2026-08-03",
          periodEnd: "2026-08-16",
          availability: [],
          ideas: [],
          items: [],
          proposals: [],
        },
      }),
    );

    expect(markup).toContain("Siempre requiere aprobación");
    expect(markup).toContain(
      "Ningún bloque entra en el calendario hasta que lo apruebes.",
    );
    expect(markup).toContain("Sin propuestas todavía");
  });
});
