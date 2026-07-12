import { LogOut, ShieldCheck } from "lucide-react";
import { logoutWarhome } from "@/lib/warhome/actions";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";

export default async function WarhomePage() {
  const admin = await requireWarhomeAdmin();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071226] px-5 py-10 text-white">
      <section className="w-full max-w-xl rounded-xl border border-white/10 bg-[#0f1a33] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d6ae4f]/30 bg-[#d6ae4f]/10">
          <ShieldCheck className="h-5 w-5 text-[#f1d485]" aria-hidden />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-[#f1d485]">FLYPATH WARHOME</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acceso autorizado</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          La zona interna está preparada para los siguientes módulos del MVP.
        </p>
        <dl className="mt-6 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-slate-400">Rol</dt>
            <dd className="rounded-md border border-[#d6ae4f]/25 bg-[#d6ae4f]/10 px-2.5 py-1 font-medium capitalize text-[#f1d485]">
              {admin.role}
            </dd>
          </div>
        </dl>
        <form action={logoutWarhome} className="mt-7">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#d6ae4f]/45 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ae4f]/45"
            type="submit"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
