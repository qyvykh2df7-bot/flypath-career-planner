import type { Metadata } from "next";

import { MarketingConfirmationForm } from "@/components/email/MarketingConfirmationForm";

export const metadata: Metadata = {
  title: "Confirmar suscripción | FlyPath",
  robots: { index: false, follow: false },
};

type MarketingConfirmationPageProps = { searchParams: Promise<{ token?: string | string[] }> };

export default async function MarketingConfirmationPage({ searchParams }: MarketingConfirmationPageProps) {
  const { token } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081426] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-xl border border-white/[0.09] bg-[#0d192a] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6ae4f]">FlyPath</p>
        <h1 className="mt-3 text-2xl font-semibold">Confirma tu suscripción</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">Confirma que deseas recibir novedades y recursos de FlyPath por email.</p>
        <MarketingConfirmationForm token={typeof token === "string" ? token : ""} />
      </section>
    </main>
  );
}
