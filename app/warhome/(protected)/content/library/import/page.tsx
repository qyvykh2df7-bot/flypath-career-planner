import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContentHistoricalImportForm } from "@/components/warhome/content/ContentHistoricalImportForm";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsBrandProfile } from "@/lib/warhome/content-os-brand";

export default async function ImportContentOsHistoricalItemPage() {
  const brandProfile = await getContentOsBrandProfile();

  return (
    <div className="mx-auto max-w-5xl">
      <ContentOsPageHeader
        title="Importar contenido publicado"
        description="Añade publicaciones anteriores y sus métricas a la biblioteca histórica."
      />
      <ContentOsTabs active="library" />
      <Link
        href="/warhome/content/library"
        className="mt-7 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a biblioteca
      </Link>
      <div className="mt-3">
        <ContentHistoricalImportForm
          contentPillars={brandProfile.contentPillars}
        />
      </div>
    </div>
  );
}
