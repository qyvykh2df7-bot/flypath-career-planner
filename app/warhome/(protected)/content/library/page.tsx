import { ContentLibrary } from "@/components/warhome/content/ContentLibrary";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsLibrary } from "@/lib/warhome/content-os";
import type { ContentOsItem } from "@/lib/warhome/content-os-contract";
import Link from "next/link";
import { Upload } from "lucide-react";

export default async function ContentOsLibraryPage() {
  let items: ContentOsItem[] | null = null;
  try {
    items = await getContentOsLibrary();
  } catch {
    items = null;
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <ContentOsPageHeader
        title="Biblioteca"
        description="Piezas en preparación, programadas y publicadas con su historial operativo."
        action={
          items ? { href: "/warhome/content/library/new", label: "Nueva pieza" } : undefined
        }
      />
      <ContentOsTabs active="library" />
      {items ? (
        <div className="mt-6 flex justify-end">
          <Link
            href="/warhome/content/library/import"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-sm font-semibold text-slate-200 transition hover:border-[#d6ae4f]/35 hover:text-white"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Importar contenido publicado
          </Link>
        </div>
      ) : null}
      {items ? <ContentLibrary items={items} /> : <ContentOsLoadError />}
    </div>
  );
}
