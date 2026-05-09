/**
 * Modo QA temporal para alternar vista “gratis” vs “premium” en desarrollo.
 * Usa solo la clave `flypath_qa_premium_mode` en localStorage.
 *
 * En producción no se muestra UI QA y el premium solo debe depender del pago real
 * (`premiumUnlocked`). Quitar este módulo / simplificar al conectar Stripe u otro pago real.
 */

export const QA_PREMIUM_MODE_STORAGE_KEY = "flypath_qa_premium_mode";

export type QaPremiumMode = "free" | "premium";

/**
 * Lectura inicial para hidratar estado en cliente.
 * En SSR (`window` ausente) devuelve `"premium"` como default en development builds.
 */
export function getInitialQaPremiumMode(): QaPremiumMode {
  if (typeof window === "undefined") return "premium";
  return window.localStorage.getItem(QA_PREMIUM_MODE_STORAGE_KEY) === "free"
    ? "free"
    : "premium";
}

export function setQaPremiumModeInStorage(mode: QaPremiumMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QA_PREMIUM_MODE_STORAGE_KEY, mode);
  } catch {
    /* quota / private mode */
  }
}

export function flipQaPremiumMode(mode: QaPremiumMode): QaPremiumMode {
  return mode === "premium" ? "free" : "premium";
}

/**
 * Comparador Conclusión FlyPath y futuros bloques premium del Planner:
 * solo desbloquea por QA cuando `NODE_ENV === "development"`.
 */
export function canSeePremiumForDevQa(
  premiumUnlocked: boolean,
  qaPremiumMode: QaPremiumMode,
): boolean {
  return (
    premiumUnlocked ||
    (process.env.NODE_ENV === "development" && qaPremiumMode === "premium")
  );
}
