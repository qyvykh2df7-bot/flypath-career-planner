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
    ["short text", { bestPart: "Muy bien" }],
    ["invalid year", { approximateYear: 1900 }],
    ["invalid email", { email: "not-an-email" }],
    ["missing consent", { consent: false }],
  ])("rejects %s", (_, override) => {
    expect(() => parseSchoolReviewSubmission({ ...validInput, ...override })).toThrow(SchoolReviewValidationError);
  });
});
