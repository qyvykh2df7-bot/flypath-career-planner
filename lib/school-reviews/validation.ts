import {
  SCHOOL_REVIEW_ANSWERS,
  SCHOOL_REVIEW_RATING_FIELDS,
  SCHOOL_REVIEW_RELATIONSHIPS,
  type SchoolReviewSubmissionInput,
} from "./contracts";

export const SCHOOL_REVIEW_REQUEST_MAX_BODY_SIZE = 16_384;
export const SCHOOL_REVIEW_TEXT_MIN_LENGTH = 20;
export const SCHOOL_REVIEW_TEXT_MAX_LENGTH = 3_000;
export const SCHOOL_REVIEW_PROGRAM_PHASE_MAX_LENGTH = 120;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SchoolReviewValidationError extends Error {
  constructor() {
    super("Invalid school review input");
    this.name = "SchoolReviewValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= maxLength ? normalized : null;
}

export function normalizeSchoolReviewEmail(value: unknown): string | null {
  const email = asTrimmedText(value, 320)?.toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

export function isSchoolReviewUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function parseRating(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10
    ? value
    : null;
}

function parseInput(value: unknown): SchoolReviewSubmissionInput | null {
  if (!isRecord(value) || !isSchoolReviewUuid(value.submissionId)) return null;
  const schoolSlug = asTrimmedText(value.schoolSlug, 120)?.toLowerCase();
  if (!schoolSlug || !SLUG_PATTERN.test(schoolSlug)) return null;
  if (typeof value.isAnonymous !== "boolean" || value.consent !== true) return null;
  if (!SCHOOL_REVIEW_RELATIONSHIPS.includes(value.relationship as never)) return null;
  if (!isRecord(value.ratings) || !isRecord(value.answers)) return null;

  const ratings = {} as SchoolReviewSubmissionInput["ratings"];
  for (const field of SCHOOL_REVIEW_RATING_FIELDS) {
    const rating = parseRating(value.ratings[field]);
    if (rating === null) return null;
    ratings[field] = rating;
  }

  const answerValues = {
    finalCost: value.answers.finalCost,
    contractBeforePayment: value.answers.contractBeforePayment,
    refundClarity: value.answers.refundClarity,
    wouldChooseAgain: value.answers.wouldChooseAgain,
  };
  if (!Object.values(answerValues).every((answer) => SCHOOL_REVIEW_ANSWERS.includes(answer as never))) {
    return null;
  }

  const bestPart = asTrimmedText(value.bestPart, SCHOOL_REVIEW_TEXT_MAX_LENGTH);
  const improvements = asTrimmedText(value.improvements, SCHOOL_REVIEW_TEXT_MAX_LENGTH);
  const advice = asTrimmedText(value.advice, SCHOOL_REVIEW_TEXT_MAX_LENGTH);
  if (
    !bestPart || !improvements || !advice ||
    bestPart.length < SCHOOL_REVIEW_TEXT_MIN_LENGTH ||
    improvements.length < SCHOOL_REVIEW_TEXT_MIN_LENGTH ||
    advice.length < SCHOOL_REVIEW_TEXT_MIN_LENGTH
  ) return null;

  const programPhaseRaw = value.programPhase;
  const programPhase = programPhaseRaw === null || programPhaseRaw === undefined
    ? null
    : asTrimmedText(programPhaseRaw, SCHOOL_REVIEW_PROGRAM_PHASE_MAX_LENGTH);
  if (programPhaseRaw !== null && programPhaseRaw !== undefined && !programPhase) return null;

  const approximateYear = value.approximateYear === null || value.approximateYear === undefined
    ? null
    : typeof value.approximateYear === "number" && Number.isInteger(value.approximateYear)
      && value.approximateYear >= 1950 && value.approximateYear <= 2100
      ? value.approximateYear
      : null;
  if (value.approximateYear !== null && value.approximateYear !== undefined && approximateYear === null) return null;

  const email = value.email === undefined ? undefined : normalizeSchoolReviewEmail(value.email);
  if (value.email !== undefined && !email) return null;

  return {
    submissionId: value.submissionId,
    schoolSlug,
    ...(email ? { email } : {}),
    isAnonymous: value.isAnonymous,
    relationship: value.relationship as SchoolReviewSubmissionInput["relationship"],
    programPhase,
    approximateYear,
    ratings,
    answers: answerValues as SchoolReviewSubmissionInput["answers"],
    bestPart,
    improvements,
    advice,
    consent: true,
  };
}

export function parseSchoolReviewSubmission(value: unknown): SchoolReviewSubmissionInput {
  const parsed = parseInput(value);
  if (!parsed) throw new SchoolReviewValidationError();
  return parsed;
}
