import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import { WARHOME_REVIEW_STATUSES, type WarhomeReviewFilters } from "@/lib/warhome/reviews";

const STATUS_LABELS: Record<(typeof WARHOME_REVIEW_STATUSES)[number], string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  hidden: "Oculta",
  deletion_requested: "Solicitud de eliminación",
};

export function WarhomeReviewFilters({ filters }: { filters: WarhomeReviewFilters }) {
  const active = Boolean(filters.query || filters.status);
  return <form action="/warhome/reviews" className="grid gap-3 border-b border-white/[0.07] p-4 lg:grid-cols-[minmax(16rem,1.4fr)_minmax(14rem,1fr)_auto] lg:items-end lg:p-5"><label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">Buscar</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden /><input name="q" type="search" defaultValue={filters.query} maxLength={80} placeholder="Escuela o email privado" className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15" /></span></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">Estado</span><select name="status" defaultValue={filters.status ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15"><option value="">Todos</option>{WARHOME_REVIEW_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label><div className="flex min-h-10 items-center gap-2"><button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/50"><Filter className="h-4 w-4" aria-hidden />Aplicar</button>{active ? <Link href="/warhome/reviews" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white"><X className="h-4 w-4" aria-hidden />Limpiar</Link> : null}</div></form>;
}
