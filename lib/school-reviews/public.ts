import "server-only";

import type { PublicSchoolReviewSummary, SchoolReviewAggregates, SchoolReviewPublicDto } from "./contracts";
import {
  calculateSchoolReviewAggregates,
  SchoolReviewDataError,
  toPublicSchoolReview,
} from "./service";
import { getComparableSchools } from "@/lib/schools/schoolUtils";
import { localSlugFromSupabaseSlug, resolveSupabaseSlugForLocal } from "@/lib/schools/schoolSlugAliases";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PUBLIC_REVIEW_PAGE_SIZE = 10;
const MAX_PUBLIC_REVIEW_PAGE = 1_000;
const MAX_PUBLIC_SCHOOL_SUMMARIES = 24;

const PUBLIC_REVIEW_SELECT =
  "review_id,school_id,is_anonymous,relationship,program_phase,approximate_year,rating_general,rating_costs,rating_availability,rating_organization,rating_instructors,rating_support,rating_contract,final_cost_answer,contract_before_payment_answer,refund_clarity_answer,would_choose_again_answer,best_part,improvements,advice,approved_at";
const PUBLIC_REVIEW_AGGREGATE_SELECT =
  "school_id,rating_general,rating_costs,rating_availability,rating_organization,rating_instructors,rating_support,rating_contract,would_choose_again_answer";
const RATING_KEYS = ["general", "costs", "availability", "organization", "instructors", "support", "contract"] as const;

export type PublicSchoolReviewPage = {
  school: { slug: string; name: string };
  reviews: SchoolReviewPublicDto[];
  aggregates: SchoolReviewAggregates;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return getComparableSchools().some((school) => school.slug === slug) ? slug : null;
}

export function normalizePublicReviewPage(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, MAX_PUBLIC_REVIEW_PAGE) : 1;
}

function emptyAggregates(): SchoolReviewAggregates {
  return calculateSchoolReviewAggregates([]);
}

/** Aggregates scan only numeric/closed fields, never public review text or private identity. */
function calculateApprovedReviewAggregateRows(rows: readonly unknown[]): SchoolReviewAggregates {
  const distribution = emptyAggregates().distribution;
  const sums: Partial<Record<(typeof RATING_KEYS)[number], number>> = {};
  let total = 0;
  let wouldChooseAgain = 0;
  for (const value of rows) {
    const row = asRecord(value);
    if (!row) continue;
    const ratings = RATING_KEYS.map((key) => row[`rating_${key}`]);
    if (!ratings.every((rating) => typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 10)) continue;
    total += 1;
    for (const [index, key] of RATING_KEYS.entries()) {
      const rating = ratings[index] as number;
      sums[key] = (sums[key] ?? 0) + rating;
    }
    distribution[ratings[0] as number] += 1;
    if (row.would_choose_again_answer === "yes") wouldChooseAgain += 1;
  }
  if (!total) return { total: 0, averageOverall: null, averages: {}, distribution, wouldChooseAgainPercent: null };
  const averages = Object.fromEntries(RATING_KEYS.map((key) => [key, Number(((sums[key] ?? 0) / total).toFixed(2))])) as SchoolReviewAggregates["averages"];
  return { total, averageOverall: averages.general ?? null, averages, distribution, wouldChooseAgainPercent: Number(((wouldChooseAgain / total) * 100).toFixed(1)) };
}

async function getPublicSchool(localSlug: string): Promise<{ schoolId: string; slug: string; name: string }> {
  const localSchool = getComparableSchools().find((school) => school.slug === localSlug);
  if (!localSchool) throw new SchoolReviewDataError();
  const { data, error } = await getSupabaseAdmin()
    .from("schools")
    .select("school_id,slug,name")
    .eq("slug", resolveSupabaseSlugForLocal(localSlug))
    .maybeSingle();
  const row = asRecord(data);
  if (error || !row || typeof row.school_id !== "string") throw new SchoolReviewDataError();
  return { schoolId: row.school_id, slug: localSlug, name: typeof row.name === "string" ? row.name : localSchool.name };
}

/** Public projection backed by the server-only client. Aggregates always use every approved review. */
export async function getPublicSchoolReviewPage(
  schoolSlugValue: unknown,
  pageValue: unknown,
): Promise<PublicSchoolReviewPage | null> {
  const schoolSlug = normalizeSlug(schoolSlugValue);
  if (!schoolSlug) return null;
  const page = normalizePublicReviewPage(pageValue);
  const school = await getPublicSchool(schoolSlug);
  const from = (page - 1) * PUBLIC_REVIEW_PAGE_SIZE;
  const [pageResult, aggregateResult] = await Promise.all([
    getSupabaseAdmin().from("school_reviews").select(PUBLIC_REVIEW_SELECT, { count: "exact" }).eq("school_id", school.schoolId).eq("status", "approved").order("approved_at", { ascending: false }).range(from, from + PUBLIC_REVIEW_PAGE_SIZE - 1),
    getSupabaseAdmin().from("school_reviews").select(PUBLIC_REVIEW_AGGREGATE_SELECT).eq("school_id", school.schoolId).eq("status", "approved"),
  ]);
  if (pageResult.error || aggregateResult.error || !Array.isArray(pageResult.data) || !Array.isArray(aggregateResult.data) || typeof pageResult.count !== "number") throw new SchoolReviewDataError();
  const total = pageResult.count;
  const totalPages = Math.max(1, Math.ceil(total / PUBLIC_REVIEW_PAGE_SIZE));
  const normalizedPage = Math.min(page, totalPages);
  let pageRows = pageResult.data;
  if (normalizedPage !== page) {
    const correctedFrom = (normalizedPage - 1) * PUBLIC_REVIEW_PAGE_SIZE;
    const corrected = await getSupabaseAdmin().from("school_reviews").select(PUBLIC_REVIEW_SELECT).eq("school_id", school.schoolId).eq("status", "approved").order("approved_at", { ascending: false }).range(correctedFrom, correctedFrom + PUBLIC_REVIEW_PAGE_SIZE - 1);
    if (corrected.error || !Array.isArray(corrected.data)) throw new SchoolReviewDataError();
    pageRows = corrected.data;
  }
  return {
    school: { slug: school.slug, name: school.name },
    reviews: pageRows.map(toPublicSchoolReview).filter((review): review is SchoolReviewPublicDto => review !== null),
    aggregates: calculateApprovedReviewAggregateRows(aggregateResult.data),
    page: normalizedPage,
    pageSize: PUBLIC_REVIEW_PAGE_SIZE,
    total,
    totalPages,
  };
}

/** One aggregate query for the comparator; zero-review schools are included deliberately. */
export async function getPublicSchoolReviewSummaries(values: readonly string[]): Promise<PublicSchoolReviewSummary[]> {
  const requested = [...new Set(values.map(normalizeSlug).filter((value): value is string => value !== null))]
    .slice(0, MAX_PUBLIC_SCHOOL_SUMMARIES);
  if (!requested.length) return [];

  const dbSlugs = requested.map(resolveSupabaseSlugForLocal);
  const { data: schoolRows, error: schoolsError } = await getSupabaseAdmin()
    .from("schools")
    .select("school_id,slug,name")
    .in("slug", dbSlugs);
  if (schoolsError || !Array.isArray(schoolRows)) throw new SchoolReviewDataError();

  const schools = schoolRows
    .map(asRecord)
    .filter((row): row is Record<string, unknown> => row !== null && typeof row.school_id === "string" && typeof row.slug === "string");
  const ids = schools.map((school) => school.school_id as string);
  if (!ids.length) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("school_reviews")
    .select(PUBLIC_REVIEW_AGGREGATE_SELECT)
    .in("school_id", ids)
    .eq("status", "approved");
  if (error || !Array.isArray(data)) throw new SchoolReviewDataError();

  const bySchool = new Map<string, unknown[]>();
  for (const review of data) {
    const row = asRecord(review);
    if (!row || typeof row.school_id !== "string") continue;
    const collection = bySchool.get(row.school_id) ?? [];
    collection.push(row);
    bySchool.set(row.school_id, collection);
  }
  const requestedSet = new Set(requested);
  return schools.flatMap((school) => {
    const id = school.school_id as string;
    const dbSlug = school.slug as string;
    const localSlug = localSlugFromSupabaseSlug(dbSlug) ?? dbSlug;
    if (!requestedSet.has(localSlug)) return [];
    const aggregates = calculateApprovedReviewAggregateRows(bySchool.get(id) ?? []);
    return [{
      schoolSlug: localSlug,
      total: aggregates.total,
      averageOverall: aggregates.averageOverall,
      distribution: aggregates.distribution,
      wouldChooseAgainPercent: aggregates.wouldChooseAgainPercent,
    }];
  });
}

export function getEmptyPublicSchoolReviewSummary(schoolSlug: string): PublicSchoolReviewSummary {
  const aggregates = emptyAggregates();
  return {
    schoolSlug,
    total: 0,
    averageOverall: null,
    distribution: aggregates.distribution,
    wouldChooseAgainPercent: null,
  };
}
