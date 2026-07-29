import { ContentAiPlannerWorkspace } from "@/components/warhome/content/ContentAiPlannerWorkspace";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsPlannerWorkspace } from "@/lib/warhome/content-os-planning";

export default async function ContentOsPlannerPage() {
  let workspace: Awaited<
    ReturnType<typeof getContentOsPlannerWorkspace>
  > | null = null;
  try {
    workspace = await getContentOsPlannerWorkspace();
  } catch {
    workspace = null;
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <ContentOsPageHeader
        title="Planificador IA"
        description="Propuestas de dos semanas basadas en roster, ideas y contenidos pendientes."
      />
      <ContentOsTabs active="planner" />
      {workspace ? (
        <ContentAiPlannerWorkspace workspace={workspace} />
      ) : (
        <ContentOsLoadError />
      )}
    </div>
  );
}
