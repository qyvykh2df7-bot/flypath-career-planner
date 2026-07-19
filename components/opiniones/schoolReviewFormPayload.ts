import type { SchoolReviewSubmissionInput } from "@/lib/school-reviews/contracts";
import {
  parseSchoolReviewSubmission,
  SchoolReviewValidationError,
  type SchoolReviewValidationField,
} from "@/lib/school-reviews/validation";

export type SchoolReviewFormPayloadResult =
  | { ok: true; payload: SchoolReviewSubmissionInput }
  | { ok: false; field: SchoolReviewValidationField };

export function buildSchoolReviewFormPayload(input: {
  data: FormData;
  submissionId: string;
  ratings: Record<string, number>;
  includeEmail: boolean;
}): SchoolReviewFormPayloadResult {
  const approximateYearText = String(input.data.get("approxYear") ?? "").trim();
  const rawPayload = {
    submissionId: input.submissionId,
    schoolSlug: String(input.data.get("schoolSlug") ?? "").trim(),
    ...(input.includeEmail
      ? { email: String(input.data.get("email") ?? "").trim() }
      : {}),
    isAnonymous: input.data.get("anonymous") === "on",
    relationship: String(input.data.get("relationship") ?? "").trim(),
    programPhase: String(input.data.get("programPhase") ?? "").trim() || null,
    approximateYear: approximateYearText ? Number(approximateYearText) : null,
    ratings: input.ratings,
    answers: {
      finalCost: input.data.get("finalCost"),
      contractBeforePayment: input.data.get("contractBeforePayment"),
      refundClarity: input.data.get("refundClarity"),
      wouldChooseAgain: input.data.get("wouldChooseAgain"),
    },
    bestPart: String(input.data.get("bestPart") ?? "").trim(),
    improvements: String(input.data.get("improvements") ?? "").trim(),
    advice: String(input.data.get("advice") ?? "").trim(),
    consent: input.data.get("acceptReview") === "on",
  };

  try {
    return { ok: true, payload: parseSchoolReviewSubmission(rawPayload) };
  } catch (error) {
    if (error instanceof SchoolReviewValidationError) {
      return { ok: false, field: error.field };
    }
    throw error;
  }
}
