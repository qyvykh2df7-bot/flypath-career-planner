import { notFound } from "next/navigation";
import { SchoolDetailBody } from "@/components/schools/SchoolDetailBody";
import { loadComparableSchoolBySlug } from "@/lib/schools/comparatorSchoolsSource";

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

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 text-[#0f1a33] sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        <SchoolDetailBody school={school} />
      </div>
    </main>
  );
}
