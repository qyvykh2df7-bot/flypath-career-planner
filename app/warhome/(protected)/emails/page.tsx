import { AlertTriangle } from "lucide-react";

import { WarhomeEmailFilters } from "@/components/warhome/WarhomeEmailFilters";
import { WarhomeEmailMetrics } from "@/components/warhome/WarhomeEmailMetrics";
import { WarhomeEmailsTable } from "@/components/warhome/WarhomeEmailsTable";
import { getWarhomeEmailsDashboard, WARHOME_EMAILS_LOAD_ERROR_MESSAGE } from "@/lib/warhome/emails";

type WarhomeEmailsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WarhomeEmailsPage({ searchParams }: WarhomeEmailsPageProps) {
  const resolvedSearchParams = await searchParams;

  try {
    const dashboard = await getWarhomeEmailsDashboard(resolvedSearchParams);
    return (
      <div className="mx-auto max-w-[1440px]">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-[#d6ae4f]">Operación</p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Emails</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-400">Envíos operativos registrados por FlyPath, con estado de job y entrega.</p>
          </div>
          <p className="text-sm text-slate-500">{dashboard.totalResults} {dashboard.totalResults === 1 ? "resultado" : "resultados"}</p>
        </section>
        <div className="mt-8"><WarhomeEmailMetrics metrics={dashboard.metrics} /></div>
        <section className="mt-8 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d192a] shadow-[0_16px_36px_rgba(0,0,0,0.13)]">
          <WarhomeEmailFilters filters={dashboard.filters} />
          <WarhomeEmailsTable rows={dashboard.rows} filters={dashboard.filters} totalResults={dashboard.totalResults} totalPages={dashboard.totalPages} />
        </section>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-[1440px]">
        <section className="max-w-3xl"><p className="text-xs font-semibold uppercase text-[#d6ae4f]">Operación</p><h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Emails</h2></section>
        <section className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10"><AlertTriangle className="h-6 w-6 text-amber-100" aria-hidden /></span>
          <h2 className="mt-5 text-lg font-semibold text-white">No se ha podido cargar el listado</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{WARHOME_EMAILS_LOAD_ERROR_MESSAGE}</p>
        </section>
      </div>
    );
  }
}
