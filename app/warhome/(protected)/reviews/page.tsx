import { AlertTriangle } from "lucide-react";
import { WarhomeReviewFilters } from "@/components/warhome/WarhomeReviewFilters";
import { WarhomeReviewsTable } from "@/components/warhome/WarhomeReviewsTable";
import { getWarhomeReviewsDirectory } from "@/lib/warhome/reviews";

export default async function WarhomeReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let directory = null;
  try { directory = await getWarhomeReviewsDirectory(await searchParams); } catch { directory = null; }
  if (!directory) return <div className="mx-auto max-w-[1440px]"><section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center"><AlertTriangle className="h-7 w-7 text-[#d6ae4f]" aria-hidden /><h2 className="mt-4 text-lg font-semibold text-white">No se han podido cargar las opiniones</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.</p></section></div>;
  return <div className="mx-auto max-w-[1440px]"><section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase text-[#d6ae4f]">Moderación</p><h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Opiniones</h2><p className="mt-3 text-[15px] leading-7 text-slate-400">Revisión privada de opiniones verificadas antes de su publicación.</p></div><p className="text-sm text-slate-500">{directory.total} {directory.total === 1 ? "opinión" : "opiniones"}</p></section><section className="mt-8 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d192a] shadow-[0_16px_36px_rgba(0,0,0,0.13)]"><WarhomeReviewFilters filters={directory.filters} /><WarhomeReviewsTable items={directory.items} filters={directory.filters} total={directory.total} totalPages={directory.totalPages} /></section></div>;
}
