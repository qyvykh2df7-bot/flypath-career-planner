import { CircleGauge } from "lucide-react";
import { notFound } from "next/navigation";
import { WarhomeReviewDetail } from "@/components/warhome/WarhomeReviewDetail";
import { getWarhomeReviewDetail, WarhomeReviewNotFoundError } from "@/lib/warhome/reviews";

export default async function WarhomeReviewDetailPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  let detail = null;
  let missing = false;
  try { detail = await getWarhomeReviewDetail(reviewId); } catch (error) { missing = error instanceof WarhomeReviewNotFoundError; }
  if (missing) notFound();
  if (detail) return <WarhomeReviewDetail detail={detail} />;
  return <div className="mx-auto max-w-[1440px]"><section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center"><CircleGauge className="h-7 w-7 text-[#d6ae4f]" aria-hidden /><h2 className="mt-4 text-lg font-semibold text-white">No se ha podido cargar la opinión</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.</p></section></div>;
}
