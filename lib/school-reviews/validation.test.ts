import { describe, expect, it } from "vitest";

import { parseSchoolReviewSubmission, SchoolReviewValidationError } from "./validation";

const validInput = {
  submissionId: "4d3c2b1a-1234-4abc-8def-1234567890ab",
  schoolSlug: "adventia-usal",
  email: " PILOT@Example.com ",
  isAnonymous: true,
  relationship: "former_student",
  programPhase: "ATPL integrado",
  approximateYear: 2024,
  ratings: { general: 8, costs: 7, availability: 8, organization: 7, instructors: 9, support: 7, contract: 6 },
  answers: { finalCost: "partial", contractBeforePayment: "yes", refundClarity: "unknown", wouldChooseAgain: "yes" },
  bestPart: "La planificación de las clases fue clara y el seguimiento docente fue constante.",
  improvements: "Mejoraría la comunicación de cambios de calendario y los costes externos previstos.",
  advice: "Pide por escrito el calendario, todas las tasas y las condiciones antes de hacer pagos.",
  consent: true,
};

describe("school review submission validation", () => {
  it("normalizes the private email and preserves only the closed contract", () => {
    expect(parseSchoolReviewSubmission(validInput)).toMatchObject({
      email: "pilot@example.com",
      schoolSlug: "adventia-usal",
      ratings: { general: 8, contract: 6 },
    });
  });

  it.each([
    ["invalid score", { ratings: { ...validInput.ratings, general: 11 } }],
    ["non-integer score", { ratings: { ...validInput.ratings, costs: 7.5 } }],
    ["unknown relationship", { relationship: "other" }],
    ["invalid answer", { answers: { ...validInput.answers, finalCost: "maybe" } }],
    ["invalid year", { approximateYear: 1900 }],
    ["invalid email", { email: "not-an-email" }],
    ["missing consent", { consent: false }],
  ])("rejects %s", (_, override) => {
    expect(() => parseSchoolReviewSubmission({ ...validInput, ...override })).toThrow(SchoolReviewValidationError);
  });

  const requiredFields: Array<[
    string,
    (input: Record<string, unknown>) => void,
  ]> = [
    ["submissionId", (input) => delete input.submissionId],
    ["schoolSlug", (input) => delete input.schoolSlug],
    ["isAnonymous", (input) => delete input.isAnonymous],
    ["consent", (input) => delete input.consent],
    ["relationship", (input) => delete input.relationship],
    ["ratings", (input) => delete input.ratings],
    ...(["general", "costs", "availability", "organization", "instructors", "support", "contract"] as const)
      .map((field) => [
        `ratings.${field}`,
        (input: Record<string, unknown>) => {
          delete (input.ratings as Record<string, unknown>)[field];
        },
      ] as [string, (input: Record<string, unknown>) => void]),
    ["answers", (input) => delete input.answers],
    ...(["finalCost", "contractBeforePayment", "refundClarity", "wouldChooseAgain"] as const)
      .map((field) => [
        `answers.${field}`,
        (input: Record<string, unknown>) => {
          delete (input.answers as Record<string, unknown>)[field];
        },
      ] as [string, (input: Record<string, unknown>) => void]),
    ["bestPart", (input) => delete input.bestPart],
    ["improvements", (input) => delete input.improvements],
    ["advice", (input) => delete input.advice],
  ];

  it.each(requiredFields)("identifies a missing required %s field", (field, removeField) => {
    const input = structuredClone(validInput) as unknown as Record<string, unknown>;
    removeField(input);

    try {
      parseSchoolReviewSubmission(input);
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SchoolReviewValidationError);
      expect((error as SchoolReviewValidationError).field).toBe(field);
    }
  });

  it.each(["bestPart", "improvements", "advice"] as const)("accepts short non-empty %s text", (field) => {
    const input = { ...validInput, [field]: "Muy bien" };
    expect(parseSchoolReviewSubmission(input)[field]).toBe("Muy bien");
  });

  it.each(["bestPart", "improvements", "advice"] as const)("rejects blank %s text", (field) => {
    const input = { ...validInput, [field]: "   " };
    expect(() => parseSchoolReviewSubmission(input)).toThrow(SchoolReviewValidationError);
  });
});
