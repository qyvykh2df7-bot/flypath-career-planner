import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolDetailBody } from "@/components/schools/SchoolDetailBody";
import { getPublicSchoolReviewSummaries } from "@/lib/school-reviews/public";
import { createSchoolDetailMetadata } from "@/lib/schools/school-detail-metadata";
import { loadComparableSchoolBySlug } from "@/lib/schools/school-detail-source";

/** SSR para poder leer Supabase en runtime cuando el flag está activo. */
export const dynamic = "force-dynamic";

type SchoolDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SchoolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return createSchoolDetailMetadata(await loadComparableSchoolBySlug(slug));
}

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  const { slug } = await params;
  const school = await loadComparableSchoolBySlug(slug);
  if (!school) notFound();

  // A failed non-essential public aggregate must never prevent the school file from loading.
  let reviewSummary = null;
  try {
    reviewSummary = (await getPublicSchoolReviewSummaries([school.slug]))[0] ?? null;
  } catch {
    reviewSummary = null;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 text-[#0f1a33] sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        <SchoolDetailBody school={school} reviewSummary={reviewSummary} />
      </div>
    </main>
  );
}
