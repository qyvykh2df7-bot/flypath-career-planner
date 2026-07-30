import { describe, expect, it } from "vitest";
import { parseContentOsHistoricalItemForm } from "./content-os-history-contract";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  title: "Tres errores al elegir escuela",
  platform: "tiktok_pilotfeliu",
  publishedOn: "2026-07-20",
  sourceUrl: "https://www.tiktok.com/@pilotfeliu/video/123",
  description: "Contenido ya publicado.",
  hook: "No pagues una escuela sin revisar esto.",
  cta: "Compara antes de decidir.",
  contentPillar: "schools_and_decisions",
  objective: "authority",
  relatedProductKey: "career_planner",
  views: "12000",
  likes: "800",
  comments: "40",
  shares: "75",
  saves: "120",
  followersGained: "90",
  leadsGenerated: "12",
  salesAttributed: "3",
};

describe("Content OS historical import contract", () => {
  it("acepta un contenido publicado con métricas y estado implícito publicado", () => {
    expect(parseContentOsHistoricalItemForm(form(valid))).toEqual({
      title: valid.title,
      platform: "tiktok_pilotfeliu",
      publishedOn: "2026-07-20",
      sourceUrl: valid.sourceUrl,
      description: valid.description,
      hook: valid.hook,
      cta: valid.cta,
      contentPillar: valid.contentPillar,
      objective: "authority",
      relatedProductKey: "career_planner",
      metrics: {
        recordedOn: "2026-07-20",
        views: 12000,
        likes: 800,
        comments: 40,
        shares: 75,
        saves: 120,
        followersGained: 90,
        leadsGenerated: 12,
        salesAttributed: 3,
      },
    });
  });

  it("permite otras plataformas y métricas vacías sin relajar la URL", () => {
    const minimal = form({
      title: "Publicación histórica",
      platform: "other",
      publishedOn: "2026-07-20",
    });
    expect(parseContentOsHistoricalItemForm(minimal)).toMatchObject({
      platform: "other",
      metrics: null,
      objective: null,
    });

    const unsafe = form({ ...valid, sourceUrl: "javascript:alert(1)" });
    expect(parseContentOsHistoricalItemForm(unsafe)).toBeNull();
  });
});
