import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, MailWarning, Send } from "lucide-react";

import {
  getWarhomeEmailsDisplayState,
  getWarhomeEmailsUrl,
  WARHOME_EMAIL_DELIVERY_STATUS_LABELS,
  WARHOME_EMAIL_JOB_STATUS_LABELS,
  WARHOME_EMAIL_TEMPLATE_LABELS,
  type WarhomeEmailFilters,
  type WarhomeEmailListRow,
} from "@/lib/warhome/emails";

type WarhomeEmailsTableProps = {
  rows: WarhomeEmailListRow[];
  filters: WarhomeEmailFilters;
  totalResults: number;
  totalPages: number;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusClasses(status: string): string {
  if (status === "sent" || status === "accepted" || status === "delivered") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "failed" || status === "bounced") return "border-rose-400/20 bg-rose-400/10 text-rose-100";
  if (status === "cancelled") return "border-white/[0.08] bg-white/[0.04] text-slate-400";
  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

export function WarhomeEmailsTable({ rows, filters, totalResults, totalPages }: WarhomeEmailsTableProps) {
  const displayState = getWarhomeEmailsDisplayState(rows, filters);
  if (displayState !== "table") {
    const filtered = displayState === "filtered_empty";
    return (
      <section className="flex min-h-72 flex-col items-center justify-center border-t border-white/[0.07] px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
          <MailWarning className="h-6 w-6 text-[#e3bc62]" aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-white">
          {filtered ? "No hay envíos con estos filtros" : "No hay emails operativos registrados"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          {filtered ? "Ajusta los filtros para consultar otros envíos." : "Los nuevos envíos operativos aparecerán aquí cuando se registren."}
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left">
          <caption className="sr-only">Listado de emails operativos de FlyPath Warhome</caption>
          <thead className="border-y border-white/[0.07] bg-white/[0.018] text-xs font-medium text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Fecha</th>
              <th scope="col" className="px-5 py-3.5">Destinatario</th>
              <th scope="col" className="px-5 py-3.5">Plantilla</th>
              <th scope="col" className="px-5 py-3.5">Estado del envío</th>
              <th scope="col" className="px-5 py-3.5">Estado de entrega</th>
              <th scope="col" className="px-5 py-3.5">Intentos</th>
              <th scope="col" className="px-5 py-3.5">Proveedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((row, index) => {
              const delivery = row.delivery;
              const recipient = delivery?.recipientEmail ?? row.leadEmail;
              const date = delivery?.attemptedAt ?? row.sentAt ?? row.failedAt ?? row.createdAt;
              return (
                <tr key={`${row.templateKey}-${row.createdAt}-${index}`} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-sm text-slate-400">{formatDate(date)}</td>
                  <td className="px-5 py-4 text-sm text-slate-200">
                    <p>{recipient}</p>
                    {recipient !== row.leadEmail ? <p className="mt-1 text-xs text-slate-500">Lead: {row.leadName ?? "Sin nombre"} · {row.leadEmail}</p> : row.leadName ? <p className="mt-1 text-xs text-slate-500">{row.leadName}</p> : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{WARHOME_EMAIL_TEMPLATE_LABELS[row.templateKey]}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${statusClasses(row.jobStatus)}`}>{WARHOME_EMAIL_JOB_STATUS_LABELS[row.jobStatus]}</span>
                    {row.lastError ? <p className="mt-1.5 text-xs text-slate-500">{row.lastError}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    {delivery ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                        <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${statusClasses(delivery.status)}`}>{WARHOME_EMAIL_DELIVERY_STATUS_LABELS[delivery.status]}</span>
                        {delivery.hasProviderMessageId ? <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-label="ID del proveedor registrado" /> : null}
                      </div>
                    ) : <span className="text-sm text-slate-500">Sin entrega registrada</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{delivery ? `${delivery.attemptNumber} / ${row.maxAttempts}` : `${row.attemptCount} / ${row.maxAttempts}`}</td>
                  <td className="px-5 py-4 text-sm text-slate-400">{delivery?.provider ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{totalResults} {totalResults === 1 ? "resultado" : "resultados"} · Página {filters.page} de {totalPages}</p>
        <nav aria-label="Paginación de emails" className="flex items-center gap-2">
          {filters.page > 1 ? <Link href={getWarhomeEmailsUrl(filters, filters.page - 1)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/30 hover:text-white"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</Link> : <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 text-sm text-slate-600"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</span>}
          {filters.page < totalPages ? <Link href={getWarhomeEmailsUrl(filters, filters.page + 1)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/30 hover:text-white">Siguiente<ChevronRight className="h-4 w-4" aria-hidden /></Link> : <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 text-sm text-slate-600">Siguiente<ChevronRight className="h-4 w-4" aria-hidden /></span>}
        </nav>
      </footer>
    </>
  );
}
