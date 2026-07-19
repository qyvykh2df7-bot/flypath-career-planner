export const SCHOOL_REVIEW_RATING_FIELDS = [
  "general",
  "costs",
  "availability",
  "organization",
  "instructors",
  "support",
  "contract",
] as const;

export const SCHOOL_REVIEW_RELATIONSHIPS = [
  "current_student",
  "former_student",
  "completed_training",
  "transferred_school",
  "information_requester",
] as const;

export const SCHOOL_REVIEW_ANSWERS = ["yes", "no", "partial", "unknown"] as const;

export type SchoolReviewRelationship = (typeof SCHOOL_REVIEW_RELATIONSHIPS)[number];
export type SchoolReviewAnswer = (typeof SCHOOL_REVIEW_ANSWERS)[number];
export type SchoolReviewRatingField = (typeof SCHOOL_REVIEW_RATING_FIELDS)[number];

export type SchoolReviewRatings = Record<SchoolReviewRatingField, number>;

export type SchoolReviewSubmissionInput = {
  submissionId: string;
  schoolSlug: string;
  email?: string;
  isAnonymous: boolean;
  relationship: SchoolReviewRelationship;
  programPhase: string | null;
  approximateYear: number | null;
  ratings: SchoolReviewRatings;
  answers: {
    finalCost: SchoolReviewAnswer;
    contractBeforePayment: SchoolReviewAnswer;
    refundClarity: SchoolReviewAnswer;
    wouldChooseAgain: SchoolReviewAnswer;
  };
  bestPart: string;
  improvements: string;
  advice: string;
  consent: true;
};

export type SchoolReviewPublicDto = {
  reviewId: string;
  schoolId: string;
  displayAuthor: "Alumno verificado" | "Opinión anónima verificada";
  relationship: SchoolReviewRelationship;
  programPhase: string | null;
  approximateYear: number | null;
  ratings: SchoolReviewRatings;
  answers: SchoolReviewSubmissionInput["answers"];
  bestPart: string;
  improvements: string;
  advice: string;
  approvedAt: string;
};

export type SchoolReviewAggregates = {
  total: number;
  averageOverall: number | null;
  averages: Partial<SchoolReviewRatings>;
  distribution: Record<number, number>;
  wouldChooseAgainPercent: number | null;
};

/** A closed aggregate that can safely be rendered by public client components. */
export type PublicSchoolReviewSummary = {
  schoolSlug: string;
  total: number;
  averageOverall: number | null;
  distribution: Record<number, number>;
  wouldChooseAgainPercent: number | null;
};
