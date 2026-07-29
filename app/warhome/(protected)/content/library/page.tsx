import { ContentLibrary } from "@/components/warhome/content/ContentLibrary";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsLibrary } from "@/lib/warhome/content-os";
import type { ContentOsItem } from "@/lib/warhome/content-os-contract";

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
      {items ? <ContentLibrary items={items} /> : <ContentOsLoadError />}
    </div>
  );
}
