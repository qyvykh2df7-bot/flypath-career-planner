import { notFound } from "next/navigation";
import { SchoolDetailBody } from "@/components/schools/SchoolDetailBody";
import { getPublicSchoolReviewSummaries } from "@/lib/school-reviews/public";
import { loadComparableSchoolBySlug } from "@/lib/schools/school-detail-source";

/** SSR para poder leer Supabase en runtime cuando el flag está activo. */
export const dynamic = "force-dynamic";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
