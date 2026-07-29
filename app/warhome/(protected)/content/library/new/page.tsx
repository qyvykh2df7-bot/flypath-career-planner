import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContentItemForm } from "@/components/warhome/content/ContentItemForm";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";

export default function NewContentOsItemPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ContentOsPageHeader
        title="Nueva pieza"
        description="Define el contenido, su objetivo y las fechas previstas de producción."
      />
      <ContentOsTabs active="new" />
      <Link
        href="/warhome/content/library"
        className="mt-7 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a biblioteca
      </Link>
      <section className="mt-3 rounded-lg border border-white/[0.08] bg-[#0d192a] p-5 sm:p-6">
        <ContentItemForm />
      </section>
    </div>
  );
}
