import { FLYPATH_PRODUCT_HREF } from "@/lib/reporting/domain/flypath-next-step-engine";
import type { FlyPathProductId } from "@/lib/reporting/types/shared";

/** Rutas internas FlyPath para CTAs del report preview (solo lectura del catálogo). */
const EXTRA_PRODUCT_HREF: Partial<Record<FlyPathProductId, string>> = {
  escuelas: "/schools",
};

export function flypathProductHref(productId: string): string | null {
  if (productId in EXTRA_PRODUCT_HREF) {
    return EXTRA_PRODUCT_HREF[productId as FlyPathProductId] ?? null;
  }
  if (productId in FLYPATH_PRODUCT_HREF) {
    return FLYPATH_PRODUCT_HREF[productId as keyof typeof FLYPATH_PRODUCT_HREF];
  }
  return null;
}
