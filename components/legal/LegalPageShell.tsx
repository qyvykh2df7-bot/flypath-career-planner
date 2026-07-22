import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeFooter } from "@/components/home/HomeFooter";

type LegalPageShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  eyebrow,
  description,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#0f1a33]">
      <FlyPathPlatformHeader pageTitle={title} currentModuleId="" />
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7a5a16] transition hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a FlyPath
        </Link>
        <header className="mt-8 border-b border-slate-200 pb-8 sm:mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a5802a]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f1a33] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
          <p className="mt-4 text-sm text-slate-500">Última actualización: {updatedAt}</p>
        </header>
        <article className="mt-9 text-base leading-7 text-slate-600 [&_a]:text-[#7a5a16] [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-[#0f1a33] [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[#0f1a33] [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </article>
      </main>
      <HomeFooter />
    </div>
  );
}
