import type { Metadata } from "next";

import { UnsubscribeConfirmationForm } from "@/components/email/UnsubscribeConfirmationForm";

export const metadata: Metadata = {
  title: "Gestionar preferencia de email | FlyPath",
  robots: { index: false, follow: false },
};

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;
  const opaqueToken = typeof token === "string" ? token : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081426] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-xl border border-white/[0.09] bg-[#0d192a] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6ae4f]">FlyPath</p>
        <h1 className="mt-3 text-2xl font-semibold">Gestionar preferencia de email</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Confirma que deseas dejar de recibir estas comunicaciones por email.
        </p>
        <UnsubscribeConfirmationForm token={opaqueToken} />
      </section>
    </main>
  );
}
