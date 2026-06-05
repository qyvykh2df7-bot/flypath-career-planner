import type { FlyPathProductId } from "@/lib/reporting/types/shared";

export const FLYPATH_PARTNER_DISCOUNT_CODE = "FLYPARTNER20";
export const FLYPATH_PARTNER_DISCOUNT_PERCENT = 20;

/** Productos FlyPath con descuento partner aplicable en el siguiente paso recomendado. */
const FLYPATH_PARTNER_DISCOUNT_ELIGIBLE = new Set<FlyPathProductId>([
  "guia",
  "mentoria",
  "ingles",
  "clases",
  "atpl",
]);

export function isFlyPathPartnerDiscountEligible(productId: string): boolean {
  return FLYPATH_PARTNER_DISCOUNT_ELIGIBLE.has(productId as FlyPathProductId);
}
