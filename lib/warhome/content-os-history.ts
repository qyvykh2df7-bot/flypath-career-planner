import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";
import { ContentOsDataError } from "@/lib/warhome/content-os";
import type { ContentOsHistoricalItemInput } from "@/lib/warhome/content-os-history-contract";
import { isContentOsUuid } from "@/lib/warhome/content-os-contract";

export async function importContentOsHistoricalItem(
  input: ContentOsHistoricalItemInput,
): Promise<string> {
  const adminUser = await requireWarhomeAdmin();
  const metrics = input.metrics
    ? {
        views: input.metrics.views,
        likes: input.metrics.likes,
        comments: input.metrics.comments,
        shares: input.metrics.shares,
        saves: input.metrics.saves,
        followers_gained: input.metrics.followersGained,
        leads_generated: input.metrics.leadsGenerated,
        sales_attributed: input.metrics.salesAttributed,
      }
    : null;
  const { data, error } = await getSupabaseAdmin().rpc(
    "import_content_os_historical_item",
    {
      p_admin_user_id: adminUser.userId,
      p_title: input.title,
      p_platform: input.platform,
      p_published_on: input.publishedOn,
      p_source_url: input.sourceUrl,
      p_description: input.description,
      p_hook: input.hook,
      p_cta: input.cta,
      p_content_pillar: input.contentPillar,
      p_objective: input.objective,
      p_related_product_key: input.relatedProductKey,
      p_metrics: metrics,
    },
  );
  if (error || typeof data !== "string" || !isContentOsUuid(data)) {
    throw new ContentOsDataError();
  }
  return data;
}
