import { ContentIdeaWorkspace } from "@/components/warhome/content/ContentIdeaWorkspace";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsIdeas } from "@/lib/warhome/content-os";
import type { ContentOsIdea } from "@/lib/warhome/content-os-contract";

export default async function ContentOsIdeasPage() {
  let ideas: ContentOsIdea[] | null = null;
  try {
    ideas = await getContentOsIdeas();
  } catch {
    ideas = null;
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <ContentOsPageHeader
        title="Banco de ideas"
        description="Ideas, enfoques y oportunidades antes de convertirlas en piezas de contenido."
      />
      <ContentOsTabs active="ideas" />
      {ideas ? <ContentIdeaWorkspace ideas={ideas} /> : <ContentOsLoadError />}
    </div>
  );
}
