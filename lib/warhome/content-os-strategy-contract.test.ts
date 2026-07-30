import { describe, expect, it } from "vitest";
import {
  CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
  getContentOsStrategyObjectiveTargets,
  parseContentOsStrategyBalanceForm,
  parseContentOsStrategyOutput,
  type ContentOsStrategyContext,
} from "./content-os-strategy-contract";
import { DEFAULT_CONTENT_OS_BRAND_PROFILE } from "./content-os-brand-contract";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const context: ContentOsStrategyContext = {
  brand: DEFAULT_CONTENT_OS_BRAND_PROFILE,
  balance: CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
  history: [
    {
      title: "Cómo elegir escuela de vuelo",
      objective: "authority",
      category: "aviation",
      platform: "youtube",
      hook: "Hook histórico",
      contentPillar: "training",
      relatedProductKey: null,
      contentOrigin: "historical",
      status: "published",
      published: true,
      metrics: null,
    },
  ],
};

const objectives = [
  "growth",
  "growth",
  "growth",
  "growth",
  "authority",
  "authority",
  "authority",
  "community",
  "community",
  "conversion",
] as const;

function validOutput() {
  return {
    summary: "Una mezcla editorial equilibrada.",
    suggestions: objectives.map((objective, index) => ({
      title: `Propuesta estratégica ${index + 1}`,
      idea: `Idea concreta ${index + 1}`,
      hook: `Hook ${index + 1}`,
      explanation: "Encaja con la audiencia y amplía el histórico.",
      platforms:
        index % 2 === 0
          ? ["tiktok_pilotfeliu", "instagram_pilotfeliu"]
          : ["youtube"],
      format: index % 2 === 0 ? "talking_head" : "tutorial",
      durationSeconds: index % 2 === 0 ? 45 : 480,
      objective,
      relatedProduct: objective === "conversion" ? "career_planner" : null,
      cta: "Comparte tu experiencia.",
      priority: index < 3 ? "high" : "medium",
      pillar: index % 2 === 0 ? "pilot_life" : "aviation_career",
    })),
  };
}

describe("Content OS strategy contract", () => {
  it("acepta una generación válida con clasificación y producto opcional", () => {
    const result = parseContentOsStrategyOutput(validOutput(), context);

    expect(result?.suggestions).toHaveLength(10);
    expect(result?.suggestions[0]).toMatchObject({
      objective: "growth",
      platforms: ["tiktok_pilotfeliu", "instagram_pilotfeliu"],
    });
    expect(result?.suggestions[9]).toMatchObject({
      objective: "conversion",
      relatedProduct: "career_planner",
    });
  });

  it("rechaza una idea básica duplicada respecto al histórico", () => {
    const output = validOutput();
    output.suggestions[0].title = "  CÓMO   ELEGIR escuela de vuelo ";

    expect(parseContentOsStrategyOutput(output, context)).toBeNull();
  });

  it("rechaza una mezcla que no respeta el balance solicitado", () => {
    const output = validOutput();
    output.suggestions[9].objective = "growth";

    expect(parseContentOsStrategyOutput(output, context)).toBeNull();
  });

  it("rechaza plataformas duplicadas aunque el schema del proveedor no las bloquee", () => {
    const output = validOutput();
    output.suggestions[0].platforms = [
      "tiktok_pilotfeliu",
      "tiktok_pilotfeliu",
    ];

    expect(parseContentOsStrategyOutput(output, context)).toBeNull();
  });

  it("valida un balance configurable que suma cien", () => {
    expect(
      parseContentOsStrategyBalanceForm(
        formData({
          growth: "40",
          authority: "30",
          community: "20",
          conversion: "10",
        }),
      ),
    ).toEqual(CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE);
    expect(
      parseContentOsStrategyBalanceForm(
        formData({
          growth: "40",
          authority: "30",
          community: "20",
          conversion: "9",
        }),
      ),
    ).toBeNull();
  });

  it("convierte porcentajes en diez propuestas sin perder ninguna", () => {
    expect(
      getContentOsStrategyObjectiveTargets(
        CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE,
      ),
    ).toEqual({
      growth: 4,
      community: 2,
      authority: 3,
      conversion: 1,
    });
  });
});
