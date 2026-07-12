import type { WarhomeAuthorizationResult } from "@/lib/warhome/auth";

export const WARHOME_HOME_PATH = "/warhome";
export const WARHOME_LOGIN_PATH = "/warhome/login";

export type WarhomeAccessDecision =
  | { type: "allow" }
  | { type: "redirect_to_login"; invalidateSession: boolean };

export function getWarhomeAccessDecision(
  authorization: WarhomeAuthorizationResult,
): WarhomeAccessDecision {
  if (authorization.status === "authorized") return { type: "allow" };

  return {
    type: "redirect_to_login",
    invalidateSession: authorization.status !== "unauthenticated",
  };
}
