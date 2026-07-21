import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

export const CAREER_PLANNER_PREMIUM_SNAPSHOT_STORAGE_KEY = "flypath_career_planner_premium_snapshot_v1";
export const CAREER_PLANNER_PREMIUM_SNAPSHOT_MAX_SIZE = 128 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSafeJsonShape(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= 4_000;
  if (Array.isArray(value)) return value.length <= 100 && value.every((item) => hasSafeJsonShape(item, depth + 1));
  if (!isRecord(value)) return false;

  const entries = Object.entries(value);
  return entries.length <= 100 && entries.every(([key, item]) => key.length <= 120 && hasSafeJsonShape(item, depth + 1));
}

/**
 * The report remains local to the browser. This boundary only accepts the
 * existing serializable Planner snapshot and never persists it with the order.
 */
export function parseCareerPlannerPremiumSnapshot(value: unknown): ReportSnapshotV1 | null {
  if (!isRecord(value) || value.version !== "v1" || !hasSafeJsonShape(value)) return null;

  const requiredObjects = [
    value.metadata,
    value.profile,
    value.routeRecommendation,
    value.costs,
    value.readiness,
    value.risks,
    value.roadmap,
    value.schoolsSummary,
    value.flypathNextStep,
  ];
  if (!requiredObjects.every(isRecord)) return null;
  const profile = value.profile;
  const routeRecommendation = value.routeRecommendation;
  const schoolsSummary = value.schoolsSummary;
  const risks = value.risks;
  if (typeof value.generatedAt !== "string" || typeof value.disclaimer !== "string") return null;
  if (!isRecord(profile) || !isRecord(routeRecommendation) || !isRecord(schoolsSummary) || !isRecord(risks)) return null;
  if (typeof profile.nombre !== "string" || typeof routeRecommendation.recommended !== "string") return null;
  if (!Array.isArray(schoolsSummary.items) || !Array.isArray(risks.items)) return null;

  return value as ReportSnapshotV1;
}
