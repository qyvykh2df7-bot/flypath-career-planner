import { ContentOsLoadError } from "@/components/warhome/content/ContentOsLoadError";
import { ContentOsPageHeader } from "@/components/warhome/content/ContentOsPageHeader";
import { ContentOsTabs } from "@/components/warhome/content/ContentOsTabs";
import { ContentTikTokIntegrationWorkspace } from "@/components/warhome/content/ContentTikTokIntegrationWorkspace";
import { getContentOsTikTokWorkspace } from "@/lib/warhome/content-os-tiktok";

const notices: Record<string, string> = {
  connected: "TikTok conectado. Ya puedes iniciar la primera sincronización.",
  cancelled: "La conexión con TikTok se ha cancelado.",
  error: "No se ha podido completar la conexión con TikTok.",
};

export default async function ContentOsTikTokIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok?: string }>;
}) {
  let workspace: Awaited<ReturnType<typeof getContentOsTikTokWorkspace>> | null =
    null;
  try {
    workspace = await getContentOsTikTokWorkspace();
  } catch {
    workspace = null;
  }
  const { tiktok } = await searchParams;

  return (
    <div className="mx-auto max-w-[1500px]">
      <ContentOsPageHeader
        title="TikTok Intelligence"
        description="Importación privada, métricas y análisis editorial con revisión humana."
      />
      <ContentOsTabs active="integrations" />
      {workspace ? (
        <ContentTikTokIntegrationWorkspace
          workspace={workspace}
          notice={tiktok ? notices[tiktok] ?? null : null}
        />
      ) : (
        <ContentOsLoadError />
      )}
    </div>
  );
}
