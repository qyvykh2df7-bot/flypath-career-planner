import { describe, expect, it } from "vitest";

import { parseSchoolReviewSubmission } from "@/lib/school-reviews/validation";

import { buildSchoolReviewFormPayload } from "./schoolReviewFormPayload";

const submissionId = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const ratings = {
  general: 8,
  costs: 6,
  availability: 8,
  organization: 8,
  instructors: 10,
  support: 6,
  contract: 8,
};

function createCompleteFormData(): FormData {
  const data = new FormData();
  data.set("email", " Pilot@Example.com ");
  data.set("schoolSlug", "adventia-usal");
  data.set("relationship", "former_student");
  data.set("programPhase", "ATPL integrado");
  data.set("approxYear", "2024");
  data.set("finalCost", "partial");
  data.set("contractBeforePayment", "yes");
  data.set("refundClarity", "unknown");
  data.set("wouldChooseAgain", "yes");
  data.set("bestPart", "La planificación de las clases fue clara y el seguimiento docente fue constante.");
  data.set("improvements", "Mejoraría la comunicación de cambios de calendario y los costes externos previstos.");
  data.set("advice", "Pide por escrito el calendario, todas las tasas y las condiciones antes de hacer pagos.");
  data.set("anonymous", "on");
  data.set("acceptReview", "on");
  return data;
}

describe("school review form payload", () => {
  it("builds the complete anonymous form payload accepted by the API parser", () => {
    const result = buildSchoolReviewFormPayload({
      data: createCompleteFormData(),
      submissionId,
      ratings,
      includeEmail: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(parseSchoolReviewSubmission(result.payload)).toEqual(result.payload);
    expect(result.payload.email).toBe("pilot@example.com");
    expect(result.payload.consent).toBe(true);
  });

  it("includes a valid bestPart in the payload accepted by the API", () => {
    const data = createCompleteFormData();
    data.set("bestPart", "El acompañamiento del equipo docente fue constante durante toda la formación.");

    const result = buildSchoolReviewFormPayload({ data, submissionId, ratings, includeEmail: true });

    expect(result).toMatchObject({
      ok: true,
      payload: { bestPart: "El acompañamiento del equipo docente fue constante durante toda la formación." },
    });
  });

  it("accepts a short but non-empty bestPart", () => {
    const data = createCompleteFormData();
    data.set("bestPart", "Muy bien");

    expect(buildSchoolReviewFormPayload({ data, submissionId, ratings, includeEmail: true })).toMatchObject({
      ok: true,
      payload: { bestPart: "Muy bien" },
    });
  });

  it.each(["", "   "])("rejects an empty bestPart value: %j", (bestPart) => {
    const data = createCompleteFormData();
    data.set("bestPart", bestPart);

    expect(buildSchoolReviewFormPayload({ data, submissionId, ratings, includeEmail: true })).toEqual({
      ok: false,
      field: "bestPart",
    });
  });

  it("omits the browser email for an authenticated submission", () => {
    const result = buildSchoolReviewFormPayload({
      data: createCompleteFormData(),
      submissionId,
      ratings,
      includeEmail: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.email).toBeUndefined();
  });

  it.each([
    ["finalCost", "answers.finalCost"],
    ["contractBeforePayment", "answers.contractBeforePayment"],
    ["refundClarity", "answers.refundClarity"],
    ["wouldChooseAgain", "answers.wouldChooseAgain"],
    ["bestPart", "bestPart"],
    ["improvements", "improvements"],
    ["advice", "advice"],
    ["acceptReview", "consent"],
  ])("rejects a form missing %s before fetch", (formField, validationField) => {
    const data = createCompleteFormData();
    data.delete(formField);

    expect(buildSchoolReviewFormPayload({ data, submissionId, ratings, includeEmail: true })).toEqual({
      ok: false,
      field: validationField,
    });
  });

  it("requires the guest email but not an email supplied by an authenticated browser", () => {
    const data = createCompleteFormData();
    data.delete("email");

    expect(buildSchoolReviewFormPayload({ data, submissionId, ratings, includeEmail: true })).toEqual({
      ok: false,
      field: "email",
    });
    expect(buildSchoolReviewFormPayload({ data, submissionId, ratings, includeEmail: false }).ok).toBe(true);
  });
});
