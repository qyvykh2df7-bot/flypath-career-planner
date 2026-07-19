import { AlertTriangle } from "lucide-react";
import { WarhomeUserFilters } from "@/components/warhome/WarhomeUserFilters";
import { WarhomeUsersTable } from "@/components/warhome/WarhomeUsersTable";
import {
  getWarhomeUsersDirectory,
  WARHOME_USERS_LOAD_ERROR_MESSAGE,
  type WarhomeUsersDirectory,
} from "@/lib/warhome/users";

type WarhomeUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WarhomeUsersPage({ searchParams }: WarhomeUsersPageProps) {
  const resolvedSearchParams = await searchParams;
  let directory: WarhomeUsersDirectory | null = null;

  try {
    directory = await getWarhomeUsersDirectory(resolvedSearchParams);
  } catch {
    directory = null;
  }

  if (!directory) {
    return (
      <div className="mx-auto max-w-[1440px]">
        <section className="max-w-3xl"><p className="text-xs font-semibold uppercase text-[#d6ae4f]">Operación</p><h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Usuarios</h2></section>
        <section className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10"><AlertTriangle className="h-6 w-6 text-amber-100" aria-hidden /></span>
          <h2 className="mt-5 text-lg font-semibold text-white">No se ha podido cargar el directorio</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{WARHOME_USERS_LOAD_ERROR_MESSAGE}</p>
        </section>
      </div>
    );
  }

  const parameters = { filters: directory.filters, sort: directory.sort, page: directory.page };
  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-[#d6ae4f]">Operación</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Usuarios</h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-400">Cuentas FlyPath y actividad disponible de AeroComms. La relación comercial y el consentimiento de marketing se muestran por separado.</p>
        </div>
        <p className="text-sm text-slate-500">{directory.total} {directory.total === 1 ? "usuario" : "usuarios"}</p>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d192a] shadow-[0_16px_36px_rgba(0,0,0,0.13)]">
        <WarhomeUserFilters parameters={parameters} />
        <WarhomeUsersTable items={directory.items} parameters={parameters} total={directory.total} totalPages={directory.totalPages} />
      </section>
    </div>
  );
}
