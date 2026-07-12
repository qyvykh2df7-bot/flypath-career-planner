import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { WarhomeLoginForm } from "./WarhomeLoginForm";

export const metadata: Metadata = {
  title: "Warhome | FlyPath",
  robots: { index: false, follow: false },
};

export default function WarhomeLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071226] px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f1a33] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex items-center gap-3">
          <Image
            src="/flypath-logo-white.webp"
            alt="FlyPath"
            width={540}
            height={162}
            className="h-auto w-32 object-contain object-left"
            sizes="128px"
            priority
          />
          <span className="h-7 w-px bg-white/15" aria-hidden />
          <span className="text-sm font-semibold tracking-[0.12em] text-[#f1d485]">WARHOME</span>
        </div>
        <div className="mt-8 flex h-10 w-10 items-center justify-center rounded-lg border border-[#d6ae4f]/30 bg-[#d6ae4f]/10">
          <ShieldCheck className="h-5 w-5 text-[#f1d485]" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Acceso interno</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Inicia sesión con una cuenta administrativa autorizada.
        </p>
        <WarhomeLoginForm />
      </section>
    </main>
  );
}
