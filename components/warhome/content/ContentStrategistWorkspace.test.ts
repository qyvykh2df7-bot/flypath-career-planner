import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/warhome/(protected)/content/actions", () => ({
  CONTENT_OS_INITIAL_ACTION_STATE: { status: "idle", message: null },
  createContentOsStrategyProposalsAction: vi.fn(),
  reviewContentOsStrategyProposalAction: vi.fn(),
}));

import { ContentStrategistWorkspace } from "./ContentStrategistWorkspace";

describe("Content OS strategist workspace", () => {
  it("muestra el balance inicial y deja claro que exige revisión manual", () => {
    const markup = renderToStaticMarkup(
      createElement(ContentStrategistWorkspace, {
        workspace: {
          proposals: [],
          historyCount: 12,
          publishedCount: 4,
          defaultBalance: {
            growth: 40,
            authority: 30,
            community: 20,
            conversion: 10,
          },
        },
      }),
    );

    expect(markup).toContain("Balance de objetivos");
    expect(markup).toContain('value="40"');
    expect(markup).toContain("Ideas revisables, nunca calendario");
    expect(markup).toContain("Sin propuestas estratégicas");
  });

  it("ofrece guardar o rechazar una propuesta sin enviarla al calendario", () => {
    const markup = renderToStaticMarkup(
      createElement(ContentStrategistWorkspace, {
        workspace: {
          historyCount: 0,
          publishedCount: 0,
          defaultBalance: {
            growth: 40,
            authority: 30,
            community: 20,
            conversion: 10,
          },
          proposals: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              title: "Errores al elegir escuela",
              idea: "Una lista práctica basada en experiencia.",
              hook: "Antes de pagar, revisa estas tres cosas.",
              explanation: "Aporta autoridad y ayuda a futuros pilotos.",
              platforms: ["tiktok_pilotfeliu"],
              format: "list",
              durationSeconds: 60,
              objective: "authority",
              relatedProduct: "career_planner",
              cta: "Compara tus opciones antes de decidir.",
              priority: "high",
              pillar: "schools_and_decisions",
              proposalStatus: "proposed",
              modelName: "test-strategist",
              createdAt: "2026-07-30T10:00:00.000Z",
              reviewedAt: null,
            },
          ],
        },
      }),
    );

    expect(markup).toContain("Guardar en banco");
    expect(markup).toContain("Rechazar");
    expect(markup).not.toContain("Añadir al calendario");
  });
});
