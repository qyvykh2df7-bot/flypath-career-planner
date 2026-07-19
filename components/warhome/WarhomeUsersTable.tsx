import Link from "next/link";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import {
  getWarhomeUsersUrl,
  type WarhomeAeroCommsStatus,
  type WarhomeMarketingStatus,
  type WarhomeUserDirectoryItem,
  type WarhomeUserListParameters,
} from "@/lib/warhome/users";

type WarhomeUsersTableProps = {
  items: WarhomeUserDirectoryItem[];
  parameters: WarhomeUserListParameters;
  total: number;
  totalPages: number;
};

export function formatWarhomeUserDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function getWarhomeAeroCommsLabel(status: WarhomeAeroCommsStatus): string {
  return {
    active: "Activo",
    no_activity: "Sin actividad todavía",
    not_synced: "Sin sincronizar",
  }[status];
}

export function getWarhomeMarketingLabel(status: WarhomeMarketingStatus): string {
  return {
    subscribed: "Suscrito",
    not_subscribed: "No suscrito",
    not_applicable: "No aplicable",
  }[status];
}

function statusClasses(status: WarhomeAeroCommsStatus | WarhomeMarketingStatus): string {
  if (status === "active" || status === "subscribed") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "not_synced" || status === "not_applicable") return "border-white/[0.08] bg-white/[0.04] text-slate-400";
  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

function hasActiveFilters(parameters: WarhomeUserListParameters): boolean {
  const { filters, sort } = parameters;
  return Boolean(
    filters.query || filters.aerocommsStatus || filters.lead || filters.marketingStatus ||
      filters.emailConfirmation || filters.profile || sort.field !== "created_at" || sort.direction !== "desc",
  );
}

export function WarhomeUsersTable({ items, parameters, total, totalPages }: WarhomeUsersTableProps) {
  if (!items.length) {
    const filtered = hasActiveFilters(parameters);
    return (
      <section className="flex min-h-72 flex-col items-center justify-center border-t border-white/[0.07] px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
          <UserRound className="h-6 w-6 text-[#e3bc62]" aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-white">
          {filtered ? "No hay usuarios con estos filtros" : "No hay usuarios para mostrar"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          {filtered ? "Ajusta los filtros para consultar otras cuentas." : "Las cuentas FlyPath aparecerán aquí cuando se creen."}
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[1240px] w-full border-collapse text-left">
          <caption className="sr-only">Listado de usuarios de FlyPath y AeroComms en Warhome</caption>
          <thead className="border-y border-white/[0.07] bg-white/[0.018] text-xs font-medium text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Nombre</th>
              <th scope="col" className="px-5 py-3.5">Email</th>
              <th scope="col" className="px-5 py-3.5">Cuenta creada</th>
              <th scope="col" className="px-5 py-3.5">Último acceso</th>
              <th scope="col" className="px-5 py-3.5">Estado AeroComms</th>
              <th scope="col" className="px-5 py-3.5">Sesiones</th>
              <th scope="col" className="px-5 py-3.5">Última actividad</th>
              <th scope="col" className="px-5 py-3.5">Lead</th>
              <th scope="col" className="px-5 py-3.5">Marketing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {items.map((user) => (
              <tr key={user.userId} className="transition hover:bg-white/[0.02]">
                <td className="px-5 py-4 text-sm font-medium text-slate-100">
                  <Link href={`/warhome/users/${user.userId}`} className="rounded-sm text-left transition hover:text-[#e3bc62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/45">
                    {user.fullName ?? <span className="text-slate-500">Sin nombre</span>}
                    <span className="sr-only">, ver ficha de usuario</span>
                  </Link>
                  {user.profileIncomplete ? <p className="mt-1 text-xs text-amber-100/75">Perfil incompleto</p> : null}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  <p>{user.email}</p>
                  {!user.emailConfirmed ? <p className="mt-1 text-xs text-slate-500">Email sin confirmar</p> : null}
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">{formatWarhomeUserDate(user.createdAt)}</td>
                <td className="px-5 py-4 text-sm text-slate-400">{user.lastSignInAt ? formatWarhomeUserDate(user.lastSignInAt) : "Sin acceso registrado"}</td>
                <td className="px-5 py-4"><span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${statusClasses(user.aerocommsStatus)}`}>{getWarhomeAeroCommsLabel(user.aerocommsStatus)}</span></td>
                <td className="px-5 py-4 text-sm text-slate-300">{user.sessionCount}</td>
                <td className="px-5 py-4 text-sm text-slate-400">{user.lastAeroCommsActivityAt ? formatWarhomeUserDate(user.lastAeroCommsActivityAt) : "Sin actividad"}</td>
                <td className="px-5 py-4 text-sm text-slate-400">{user.hasLead ? "Con lead" : "Sin lead"}</td>
                <td className="px-5 py-4"><span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${statusClasses(user.marketingStatus)}`}>{getWarhomeMarketingLabel(user.marketingStatus)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{total} {total === 1 ? "usuario" : "usuarios"} · Página {parameters.page} de {totalPages}</p>
        <nav aria-label="Paginación de usuarios" className="flex items-center gap-2">
          {parameters.page > 1 ? <Link href={getWarhomeUsersUrl(parameters, parameters.page - 1)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</Link> : <span aria-disabled="true" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 text-sm text-slate-600"><ChevronLeft className="h-4 w-4" aria-hidden />Anterior</span>}
          {parameters.page < totalPages ? <Link href={getWarhomeUsersUrl(parameters, parameters.page + 1)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-sm font-medium text-slate-300 transition hover:border-[#d6ae4f]/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/35">Siguiente<ChevronRight className="h-4 w-4" aria-hidden /></Link> : <span aria-disabled="true" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 text-sm text-slate-600">Siguiente<ChevronRight className="h-4 w-4" aria-hidden /></span>}
        </nav>
      </footer>
    </>
  );
}
