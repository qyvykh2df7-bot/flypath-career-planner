import { describe, expect, it } from "vitest";
import {
  getClassSubtopicCatalog,
  getClassSubtopicsForSubject,
  normalizeClassTrainingType,
} from "./class-session-subtopics";

describe("class-session-subtopics", () => {
  it("devuelve subtemas PPL para Navegación", () => {
    const subtopics = getClassSubtopicsForSubject({
      mode: "ppl",
      subjectId: "ppl-navigation",
    });
    expect(subtopics).toContain("GNSS");
    expect(subtopics).toContain("Navegación DR");
  });

  it("mantiene catálogo ATPL con entradas", () => {
    const catalog = getClassSubtopicCatalog("atpl");
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.some((item) => item.id === "atpl-air-law")).toBe(true);
  });

  it("normaliza trainingType legado a ATPL por defecto", () => {
    expect(normalizeClassTrainingType(undefined)).toBe("atpl");
    expect(normalizeClassTrainingType("ppl")).toBe("ppl");
  });
});

