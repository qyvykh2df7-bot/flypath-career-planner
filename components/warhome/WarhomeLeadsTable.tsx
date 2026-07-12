import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, UsersRound } from "lucide-react";
import {
  getWarhomeLeadsDisplayState,
  getWarhomeLeadsUrl,
  WARHOME_EMAIL_SUBSCRIPTION_LABELS,
  WARHOME_LEAD_SOURCE_LABELS,
  WARHOME_LEAD_STAGE_LABELS,
  WARHOME_LEAD_STATUS_LABELS,
  type WarhomeLeadFilters,
  type WarhomeLeadListRow,
} from "@/lib/warhome/leads";

type WarhomeLeadsTableProps = {
  rows: WarhomeLeadListRow[];
  filters: WarhomeLeadFilters;
  totalResults: number;
  totalPages: number;
};

function formatLeadDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusClasses(status: WarhomeLeadListRow["status"]): string {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "archived") return "border-white/[0.08] bg-white/[0.04] text-slate-400";
  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

export function WarhomeLeadsTable({
  rows,
  filters,
  totalResults,
  totalPages,
}: WarhomeLeadsTableProps) {
  if (getWarhomeLeadsDisplayState(rows) === "empty") {
    return (
      <section className="flex min-h-72 flex-col items-center justify-center border-t border-white/[0.07] px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
          <UsersRound className="h-6 w-6 text-[#e3bc62]" aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-white">No hay leads para mostrar</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          Ajusta los filtros o vuelve más tarde cuando haya nuevas captaciones registradas.
        </p>
      </section>
    );
  }

  const previousPage = filters.page - 1;
  const nextPage = filters.page + 1;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <caption className="sr-only">Listado de leads de FlyPath Warhome</caption>
          <thead className="border-y border-white/[0.07] bg-white/[0.018] text-xs font-medium text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Nombre</th>
              <th scope="col" className="px-5 py-3.5">Email</th>
              <th scope="col" className="px-5 py-3.5">Fuente</th>
              <th scope="col" className="px-5 py-3.5">Interés principal</th>
              <th scope="col" className="px-5 py-3.5">Etapa</th>
              <th scope="col" className="px-5 py-3.5">Estado</th>
              <th scope="col" className="px-5 py-3.5">Fecha de alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((lead) => (
              <tr key={lead.id} className="transition hover:bg-white/[0.02]">
                <td className="px-5 py-4 text-sm font-medium text-slate-100">
                  {lead.fullName ?? <span className="text-slate-500">Sin nombre</span>}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">{lead.email}</td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  {WARHOME_LEAD_SOURCE_LABELS[lead.latestSource]}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  {lead.primaryInterest ?? <span className="text-slate-500">Sin interés</span>}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  {WARHOME_LEAD_STAGE_LABELS[lead.funnelStage]}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={`rounded border px-2 py-1 text-xs font-medium ${statusClasses(lead.status)}`}>
                      {WARHOME_LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    {lead.emailSubscriptionStatus ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Mail className="h-3.5 w-3.5" aria-hidden />
                        {WARHOME_EMAIL_SUBSCRIPTION_LABELS[lead.emailSubscriptionStatus]}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">{formatLeadDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {totalResults} {totalResults === 1 ? "resultado" : "resultados"} · Página {filters.page} de {totalPages}
        </p>
        <nav aria-label="Paginación de leads" className="flex items-center gap-2">
          {filters.page > 1 ? (
            <Link
              href={getWarhomeLeadsUrl(filters, previousPage)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </Link>
          ) : (
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 text-sm text-slate-600" aria-disabled="true">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </span>
          )}
          {filters.page < totalPages ? (
            <Link
              href={getWarhomeLeadsUrl(filters, nextPage)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 text-sm text-slate-600" aria-disabled="true">
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </nav>
      </footer>
    </>
  );
}
