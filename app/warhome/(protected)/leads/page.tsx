import { UsersRound } from "lucide-react";

export default function WarhomeLeadsPage() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase text-[#d6ae4f]">Operación</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Leads</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-400">
          El listado real se conectará en el siguiente bloque del Warhome MVP.
        </p>
      </section>

      <section className="mt-9 min-h-72 rounded-lg border border-dashed border-white/[0.12] bg-[#0c1828] px-6 py-14 text-center sm:px-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#d6ae4f]/20 bg-[#d6ae4f]/10">
          <UsersRound className="h-6 w-6 text-[#e3bc62]" aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-white">Listado de leads</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
          Esta superficie está preparada para recibir búsqueda, filtros y datos reales sin mostrar
          información ficticia durante esta fase.
        </p>
      </section>
    </div>
  );
}
