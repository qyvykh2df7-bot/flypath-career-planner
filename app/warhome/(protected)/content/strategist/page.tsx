import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { ContentStrategistWorkspace } from "@/components/warhome/content/ContentStrategistWorkspace";
import { getContentOsStrategistWorkspace } from "@/lib/warhome/content-os-strategy";

export default async function ContentOsStrategistPage() {
  let workspace: Awaited<
    ReturnType<typeof getContentOsStrategistWorkspace>
  > | null = null;
  try {
    workspace = await getContentOsStrategistWorkspace();
  } catch {
    workspace = null;
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <ContentOsPageHeader
        title="AI Content Strategist"
        description="Propuestas de contenido basadas en marca, audiencia, productos e histórico."
      />
      <ContentOsTabs active="strategist" />
      {workspace ? (
        <ContentStrategistWorkspace workspace={workspace} />
      ) : (
        <ContentOsLoadError />
      )}
    </div>
  );
}
