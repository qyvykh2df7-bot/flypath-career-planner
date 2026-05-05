export type RouteType = "integrated" | "modular" | "university_plus_license";
export type DataStatus = "demo" | "verified" | "partial" | "unknown";
export type DataConfidence = "high" | "medium" | "low";
export type YesNoOptionalUnknown = "yes" | "no" | "optional" | "unknown";
export type YesNoPartialUnknown = "yes" | "no" | "partial" | "unknown";
export type Availability = "high" | "medium" | "low" | "unknown";
export type EmploymentClaimsType =
  | "none"
  | "vague"
  | "clear_non_guaranteed"
  | "guaranteed_claimed"
  | "unknown";

export type UniversityTrack = {
  universityName: string;
  degreeType: string;
  degreeName: string;
  academicDurationYears: number;
  ects: number;
  licenseIncludedMode: string;
  actualLicenseOutcome: string;
  partnerAto: string;
  academicCostEUR: number;
  flightCostEUR: number;
  totalEstimatedCostEUR: number;
  class1FailurePolicy: string;
};

export type SchoolScores = {
  documentTransparency: number;
  costClarity: number;
  financialRisk: number;
  commercialRisk: number;
  operationalSolidity: number;
  dataConfidenceScore: number;
};

export type SchoolEntry = {
  id: string;
  slug: string;
  name: string;
  routeType: RouteType;
  country: string;
  city: string;
  baseAirport: string;
  atoName: string;
  associatedUniversity?: string;
  shortDescription: string;
  dataStatus: DataStatus;
  lastUpdatedAt: string;
  dataConfidence: DataConfidence;

  advertisedPriceEUR: number;
  flypathEstimatedRealCostEUR: number;
  depositOrEnrollmentFeeEUR: number;
  paymentScheduleSummary: string;
  refundPolicySummary: string;
  contractAvailableBeforePayment: YesNoPartialUnknown;
  financingAvailable: "yes" | "no" | "unknown";

  mccJocIncluded: YesNoOptionalUnknown;
  advancedUprtIncluded: YesNoOptionalUnknown;
  examFeesIncluded: "yes" | "no" | "unknown";
  skillTestsIncluded: "yes" | "no" | "unknown";
  trainingMaterialsIncluded: "yes" | "no" | "unknown";
  accommodationIncluded: YesNoOptionalUnknown;

  fleetSummary: string;
  aircraftAvailability: Availability;
  studentAircraftRatio?: string;
  instructorStudentRatio?: string;
  languageOfInstruction: string;
  programDurationMonths: number;
  class1Requirement: string;

  jobSupportSummary: string;
  employmentClaimsType: EmploymentClaimsType;

  scores: SchoolScores;
  redFlags: string[];
  pendingData: string[];
  keyQuestions: string[];

  universityTrack?: UniversityTrack;
};
