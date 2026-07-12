import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

import {
  WARHOME_EMAIL_DELIVERY_STATUSES,
  WARHOME_EMAIL_DELIVERY_STATUS_LABELS,
  WARHOME_EMAIL_JOB_STATUSES,
  WARHOME_EMAIL_JOB_STATUS_LABELS,
  WARHOME_EMAIL_TEMPLATE_KEYS,
  WARHOME_EMAIL_TEMPLATE_LABELS,
  type WarhomeEmailFilters as WarhomeEmailFiltersData,
} from "@/lib/warhome/emails";

type WarhomeEmailFiltersProps = {
  filters: WarhomeEmailFiltersData;
};

export function WarhomeEmailFilters({ filters }: WarhomeEmailFiltersProps) {
  const hasFilters = Boolean(
    filters.query || filters.templateKey || filters.jobStatus || filters.deliveryStatus,
  );

  return (
    <form action="/warhome/emails" className="grid gap-3 border-b border-white/[0.07] p-4 xl:grid-cols-[minmax(14rem,1.3fr)_repeat(3,minmax(9rem,1fr))_auto] xl:items-end xl:p-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Buscar</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            name="q"
            type="search"
            defaultValue={filters.query}
            maxLength={80}
            placeholder="Nombre o email"
            className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15"
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Plantilla</span>
        <select name="template" defaultValue={filters.templateKey ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todas</option>
          {WARHOME_EMAIL_TEMPLATE_KEYS.map((templateKey) => (
            <option key={templateKey} value={templateKey}>{WARHOME_EMAIL_TEMPLATE_LABELS[templateKey]}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Estado del job</span>
        <select name="job_status" defaultValue={filters.jobStatus ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_EMAIL_JOB_STATUSES.map((status) => (
            <option key={status} value={status}>{WARHOME_EMAIL_JOB_STATUS_LABELS[status]}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Estado de entrega</span>
        <select name="delivery_status" defaultValue={filters.deliveryStatus ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_EMAIL_DELIVERY_STATUSES.map((status) => (
            <option key={status} value={status}>{WARHOME_EMAIL_DELIVERY_STATUS_LABELS[status]}</option>
          ))}
        </select>
      </label>
      <div className="flex min-h-10 items-center gap-2 xl:pb-0.5">
        <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/50">
          <Filter className="h-4 w-4" aria-hidden />
          Filtrar
        </button>
        {hasFilters ? (
          <Link href="/warhome/emails" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35">
            <X className="h-4 w-4" aria-hidden />
            Limpiar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
