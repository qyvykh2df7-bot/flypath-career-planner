import { ContentCalendar } from "@/components/warhome/content/ContentCalendar";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsCalendarWorkspace } from "@/lib/warhome/content-os";
import { parseContentOsCalendarParameters } from "@/lib/warhome/content-os-contract";

type ContentOsCalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContentOsCalendarPage({
  searchParams,
}: ContentOsCalendarPageProps) {
  const parameters = parseContentOsCalendarParameters(await searchParams);
  let workspace: Awaited<ReturnType<typeof getContentOsCalendarWorkspace>> | null = null;

  try {
    workspace = await getContentOsCalendarWorkspace(parameters);
  } catch {
    workspace = null;
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <ContentOsPageHeader
        title="Content OS"
        description="Calendario editorial y operación de contenido de PilotFeliu."
        action={
          workspace
            ? { href: "/warhome/content/library/new", label: "Nueva pieza" }
            : undefined
        }
      />
      <ContentOsTabs active="calendar" />
      {workspace ? (
        <ContentCalendar
          events={workspace.events}
          items={workspace.items}
          parameters={parameters}
        />
      ) : (
        <ContentOsLoadError />
      )}
    </div>
  );
}
