import type { WarhomeAuthorizationResult } from "@/lib/warhome/auth";

export const WARHOME_HOME_PATH = "/warhome";
export const WARHOME_LOGIN_PATH = "/warhome/login";
export const WARHOME_PUBLIC_EXIT_PATH = "/";

export type WarhomeAccessDecision =
  | { type: "allow" }
  | { type: "redirect_to_login" }
  | { type: "redirect_to_public_home" };

export function getWarhomeAccessDecision(
  authorization: WarhomeAuthorizationResult,
): WarhomeAccessDecision {
  if (authorization.status === "authorized") return { type: "allow" };

  if (authorization.status === "unauthenticated") return { type: "redirect_to_login" };

  // La identidad de FlyPath sigue siendo válida aunque no tenga permiso de Warhome.
  return { type: "redirect_to_public_home" };
}
