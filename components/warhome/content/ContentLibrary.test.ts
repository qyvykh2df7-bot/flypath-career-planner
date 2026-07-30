import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ContentOsItem } from "@/lib/warhome/content-os-contract";
import { ContentLibrary } from "./ContentLibrary";

function item(
  id: string,
  title: string,
  contentOrigin: ContentOsItem["contentOrigin"],
): ContentOsItem {
  return {
    id,
    sourceIdeaId: null,
    title,
    summary: contentOrigin === "historical" ? "Descripción histórica" : null,
    platform: "youtube",
    objective: "authority",
    category: "aviation",
    hook: contentOrigin === "historical" ? "" : "Hook futuro",
    script: contentOrigin === "historical" ? "" : "Guion",
    cta: contentOrigin === "historical" ? "" : "CTA",
    notes: null,
    contentOrigin,
    sourceUrl: null,
    contentPillar: null,
    relatedProductKey: null,
    status: contentOrigin === "historical" ? "published" : "draft",
    plannedRecordingOn: null,
    plannedPublishOn: null,
    publishedAt:
      contentOrigin === "historical" ? "2026-07-20T00:00:00.000Z" : null,
    proposalSource: "manual",
    proposalStatus: "approved",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    metricTotals: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      followersGained: 0,
      leadsGenerated: 0,
      salesAttributed: 0,
    },
  };
}

describe("Content OS library", () => {
  it("separa contenido futuro e histórico publicado", () => {
    const markup = renderToStaticMarkup(
      createElement(ContentLibrary, {
        items: [
          item(
            "11111111-1111-4111-8111-111111111111",
            "Pieza futura",
            "planned",
          ),
          item(
            "22222222-2222-4222-8222-222222222222",
            "Vídeo histórico",
            "historical",
          ),
        ],
      }),
    );

    expect(markup).toContain("En producción");
    expect(markup).toContain("Histórico publicado");
    expect(markup).toContain("Pieza futura");
    expect(markup).toContain("Vídeo histórico");
  });
});
