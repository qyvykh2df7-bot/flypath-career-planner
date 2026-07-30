import { ContentBrandProfileForm } from "@/components/warhome/content/ContentBrandProfileForm";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsBrandProfile } from "@/lib/warhome/content-os-brand";
import type { ContentOsBrandProfile } from "@/lib/warhome/content-os-brand-contract";

export default async function ContentOsBrandPage() {
  let profile: ContentOsBrandProfile | null = null;
  try {
    profile = await getContentOsBrandProfile();
  } catch {
    profile = null;
  }

  return (
    <div className="mx-auto max-w-[1300px]">
      <ContentOsPageHeader
        title="Brand DNA"
        description="Contexto estratégico que guía las propuestas del AI Content Strategist."
      />
      <ContentOsTabs active="brand" />
      {profile ? (
        <ContentBrandProfileForm profile={profile} />
      ) : (
        <ContentOsLoadError />
      )}
    </div>
  );
}
