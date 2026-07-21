import Link from "next/link";

export const metadata = { title: "Pago cancelado | FlyPath", robots: { index: false, follow: false } };

export default function GuideCheckoutCancelPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#0f1a33] px-6 py-12 text-white"><section className="w-full max-w-lg rounded-xl border border-white/10 bg-[#16223f] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.28)] sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6ae4f]">Guía Cómo ser Piloto</p><h1 className="mt-3 text-2xl font-semibold">No se realizó el pago</h1><p className="mt-3 text-sm leading-6 text-slate-300">Puedes volver a la guía cuando quieras. No se ha concedido ninguna descarga.</p><Link href="/guia-como-ser-piloto" className="mt-7 inline-flex rounded-lg border border-[#d6ae4f]/60 px-4 py-2 text-sm font-semibold text-[#f2ddaa] hover:border-[#d6ae4f]">Volver a la guía</Link></section></main>;
}
