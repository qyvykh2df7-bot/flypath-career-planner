import Link from "next/link";

export const metadata = {
  title: "Pago en verificación | FlyPath",
  robots: { index: false, follow: false },
};

export default function CareerPlannerCheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1a33] px-6 py-12 text-white">
      <section className="w-full max-w-lg rounded-xl border border-white/10 bg-[#16223f] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.28)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6ae4f]">Career Planner Premium</p>
        <h1 className="mt-3 text-2xl font-semibold">Estamos verificando tu pago</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Te confirmaremos el acceso cuando el pago se valide de forma segura. Esta pantalla no habilita todavía el informe premium.
        </p>
        <Link href="/career-planner" className="mt-7 inline-flex rounded-lg border border-[#d6ae4f]/60 px-4 py-2 text-sm font-semibold text-[#f2ddaa] hover:border-[#d6ae4f]">
          Volver a Career Planner
        </Link>
      </section>
    </main>
  );
}
