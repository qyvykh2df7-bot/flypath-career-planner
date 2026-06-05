/**
 * Checkout Stripe — Career Report Premium (informe gratuito → compra).
 * Sustituir placeholder por Payment Link real o `NEXT_PUBLIC_PREMIUM_REPORT_CHECKOUT_URL`.
 */

export const PREMIUM_REPORT_PRODUCT_NAME = "Career Report Premium";

export const PREMIUM_REPORT_PRICE_EUR = 5.95;

export const PREMIUM_REPORT_PRICE_LABEL = "5,95 €";

const STRIPE_CHECKOUT_PLACEHOLDER = "https://buy.stripe.com/REPLACE_WITH_PREMIUM_REPORT_CHECKOUT";

/** URL única de Stripe Checkout — no duplicar en componentes. */
export const PREMIUM_REPORT_CHECKOUT_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_PREMIUM_REPORT_CHECKOUT_URL?.trim()) ||
  STRIPE_CHECKOUT_PLACEHOLDER;

export const PREMIUM_REPORT_CHECKOUT_CTA_LABEL = `Desbloquear análisis premium · ${PREMIUM_REPORT_PRICE_LABEL}`;

/** Abre Stripe Checkout en una pestaña nueva (comparador, planner, informes). */
export function goToPremiumReportCheckout(): void {
  if (typeof window === "undefined") return;
  window.open(PREMIUM_REPORT_CHECKOUT_URL, "_blank", "noopener,noreferrer");
}
