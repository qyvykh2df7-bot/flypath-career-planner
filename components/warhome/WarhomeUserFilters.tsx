import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import {
  WARHOME_AEROCOMMS_STATUSES,
  WARHOME_MARKETING_STATUSES,
  WARHOME_USER_CONFIRMATION_FILTERS,
  WARHOME_USER_LEAD_FILTERS,
  WARHOME_USER_PROFILE_FILTERS,
  WARHOME_USER_SORT_DIRECTIONS,
  WARHOME_USER_SORT_FIELDS,
  type WarhomeUserListParameters,
} from "@/lib/warhome/users";

type WarhomeUserFiltersProps = {
  parameters: WarhomeUserListParameters;
};

const AEROCOMMS_LABELS = {
  not_synced: "Sin sincronizar",
  no_activity: "Sin actividad todavía",
  active: "Activo",
} as const;

const LEAD_LABELS = {
  linked: "Con lead",
  no_lead: "Sin lead",
} as const;

const MARKETING_LABELS = {
  subscribed: "Suscrito",
  not_subscribed: "No suscrito",
  not_applicable: "No aplicable",
} as const;

const CONFIRMATION_LABELS = {
  confirmed: "Confirmado",
  unconfirmed: "Sin confirmar",
} as const;

const PROFILE_LABELS = {
  incomplete: "Incompleto",
  complete: "Completo",
} as const;

const SORT_FIELD_LABELS = {
  created_at: "Fecha de creación",
  last_sign_in_at: "Último acceso",
  last_aerocomms_activity_at: "Última actividad",
} as const;

const SORT_DIRECTION_LABELS = {
  desc: "Más reciente primero",
  asc: "Más antiguo primero",
} as const;

export function WarhomeUserFilters({ parameters }: WarhomeUserFiltersProps) {
  const { filters, sort } = parameters;
  const hasFilters = Boolean(
    filters.query ||
      filters.aerocommsStatus ||
      filters.lead ||
      filters.marketingStatus ||
      filters.emailConfirmation ||
      filters.profile ||
      sort.field !== "created_at" ||
      sort.direction !== "desc",
  );

  return (
    <form
      action="/warhome/users"
      className="grid gap-3 border-b border-white/[0.07] p-4 2xl:grid-cols-[minmax(15rem,1.35fr)_repeat(5,minmax(9rem,1fr))_minmax(11rem,1.1fr)_minmax(11rem,1.1fr)_auto] 2xl:items-end 2xl:p-5"
    >
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
        <span className="mb-1.5 block text-xs font-medium text-slate-400">AeroComms</span>
        <select name="aerocomms" defaultValue={filters.aerocommsStatus ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_AEROCOMMS_STATUSES.map((status) => <option key={status} value={status}>{AEROCOMMS_LABELS[status]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Lead</span>
        <select name="lead" defaultValue={filters.lead ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_USER_LEAD_FILTERS.map((value) => <option key={value} value={value}>{LEAD_LABELS[value]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Marketing</span>
        <select name="marketing" defaultValue={filters.marketingStatus ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_MARKETING_STATUSES.map((status) => <option key={status} value={status}>{MARKETING_LABELS[status]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Email</span>
        <select name="confirmed" defaultValue={filters.emailConfirmation ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_USER_CONFIRMATION_FILTERS.map((value) => <option key={value} value={value}>{CONFIRMATION_LABELS[value]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Perfil</span>
        <select name="profile" defaultValue={filters.profile ?? ""} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          <option value="">Todos</option>
          {WARHOME_USER_PROFILE_FILTERS.map((value) => <option key={value} value={value}>{PROFILE_LABELS[value]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Orden</span>
        <select name="sort" defaultValue={sort.field} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          {WARHOME_USER_SORT_FIELDS.map((value) => <option key={value} value={value}>{SORT_FIELD_LABELS[value]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Dirección</span>
        <select name="direction" defaultValue={sort.direction} className="min-h-10 w-full rounded-lg border border-white/[0.09] bg-[#091524] px-3 text-sm text-slate-200 outline-none focus:border-[#d6ae4f]/50 focus:ring-2 focus:ring-[#d6ae4f]/15">
          {WARHOME_USER_SORT_DIRECTIONS.map((value) => <option key={value} value={value}>{SORT_DIRECTION_LABELS[value]}</option>)}
        </select>
      </label>
      <div className="flex min-h-10 items-center gap-2 2xl:pb-0.5">
        <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#d6ae4f] px-4 text-sm font-semibold text-[#091524] transition hover:bg-[#e3bc62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/50">
          <Filter className="h-4 w-4" aria-hidden />
          Aplicar
        </button>
        {hasFilters ? (
          <Link href="/warhome/users" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35">
            <X className="h-4 w-4" aria-hidden />
            Limpiar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
