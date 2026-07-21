export const AEROCOMMS_PRO_CHECKOUT_RETURN_PATH = "/aerocomms/app/today";

export type AeroCommsProCheckoutReturnState = "inactive" | "verifying" | "confirmed";

/**
 * The redirect itself never authorizes Pro. Only the refreshed server access
 * snapshot may move the return UI from verifying to confirmed.
 */
export function getAeroCommsProCheckoutReturnState(
  checkout: string | null,
  isPro: boolean,
): AeroCommsProCheckoutReturnState {
  if (checkout !== "processing") return "inactive";
  return isPro ? "confirmed" : "verifying";
}
