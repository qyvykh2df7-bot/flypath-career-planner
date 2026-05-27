import { highestRiskLevel } from "@/lib/reporting/domain/risk-engine";
import type {
  ReportSnapshotRisk,
  ReportSnapshotSchoolSummaryItem,
  ReportSnapshotV1,
} from "@/lib/reporting/types/report-snapshot";

type BuildReportSnapshotInput = {
  generatedAt: string;
  disclaimer: string;
  metadata: ReportSnapshotV1["metadata"];
  profile: ReportSnapshotV1["profile"];
  routeRecommendation: ReportSnapshotV1["routeRecommendation"];
  costs: ReportSnapshotV1["costs"];
  readiness: ReportSnapshotV1["readiness"];
  risks: ReportSnapshotRisk[];
  roadmap: ReportSnapshotV1["roadmap"];
  schoolsSummary: {
    total: number;
    verifiedCount: number;
    pendingCount: number;
    bestSchoolName: string | null;
    items: ReportSnapshotSchoolSummaryItem[];
  };
  flypathNextStep: ReportSnapshotV1["flypathNextStep"];
};

export function buildReportSnapshot(
  input: BuildReportSnapshotInput,
): ReportSnapshotV1 {
  return {
    version: "v1",
    generatedAt: input.generatedAt,
    metadata: input.metadata,
    disclaimer: input.disclaimer,
    profile: input.profile,
    routeRecommendation: input.routeRecommendation,
    costs: input.costs,
    readiness: input.readiness,
    risks: {
      items: input.risks,
      highestLevel: highestRiskLevel(input.risks),
    },
    roadmap: input.roadmap,
    schoolsSummary: input.schoolsSummary,
    flypathNextStep: input.flypathNextStep,
  };
}
