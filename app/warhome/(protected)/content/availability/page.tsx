import { ContentAvailabilityWorkspace } from "@/components/warhome/content/ContentAvailabilityWorkspace";
import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { getContentOsAvailability } from "@/lib/warhome/content-os-planning";

function defaultLocalDateTime(hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${String(hour).padStart(2, "0")}:00`;
}

export default async function ContentOsAvailabilityPage() {
  let slots: Awaited<ReturnType<typeof getContentOsAvailability>> | null = null;
  try {
    slots = await getContentOsAvailability();
  } catch {
    slots = null;
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <ContentOsPageHeader
        title="Roster y disponibilidad"
        description="Define manualmente trabajo, descanso, viajes y huecos de grabación."
      />
      <ContentOsTabs active="availability" />
      {slots ? (
        <ContentAvailabilityWorkspace
          slots={slots}
          defaultStartsAt={defaultLocalDateTime(10)}
          defaultEndsAt={defaultLocalDateTime(12)}
        />
      ) : (
        <ContentOsLoadError />
      )}
    </div>
  );
}
