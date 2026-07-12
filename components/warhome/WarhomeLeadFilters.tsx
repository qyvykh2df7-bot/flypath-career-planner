import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import {
  WARHOME_LEAD_FUNNEL_STAGES,
  WARHOME_LEAD_SOURCE_LABELS,
  WARHOME_LEAD_SOURCES,
  WARHOME_LEAD_STAGE_LABELS,
  WARHOME_LEAD_STATUSES,
  WARHOME_LEAD_STATUS_LABELS,
  type WarhomeLeadFilters,
} from "@/lib/warhome/leads";

type WarhomeLeadFiltersProps = {
  filters: WarhomeLeadFilters;
};

export function WarhomeLeadFilters({ filters }: WarhomeLeadFiltersProps) {
  const hasFilters = Boolean(filters.query || filters.source || filters.funnelStage || filters.status);

  return (
    <form action="/warhome/leads" className="grid gap-3 border-b border-white/[0.07] p-4 lg:grid-cols-[minmax(15rem,1.35fr)_repeat(3,minmax(10rem,1fr))_auto] lg:items-end lg:p-5">
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
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Fuente</span>
        <select
          name="source"
          defaultValue={filters.source ?? ""}
          className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15"
        >
          <option value="">Todas</option>
          {WARHOME_LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {WARHOME_LEAD_SOURCE_LABELS[source]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Etapa</span>
        <select
          name="stage"
          defaultValue={filters.funnelStage ?? ""}
          className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15"
        >
          <option value="">Todas</option>
          {WARHOME_LEAD_FUNNEL_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {WARHOME_LEAD_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Estado</span>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15"
        >
          <option value="">Todos</option>
          {WARHOME_LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {WARHOME_LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex min-h-10 items-center gap-2 lg:pb-0.5">
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/50"
        >
          <Filter className="h-4 w-4" aria-hidden />
          Filtrar
        </button>
        {hasFilters ? (
          <Link
            href="/warhome/leads"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"
          >
            <X className="h-4 w-4" aria-hidden />
            Limpiar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
