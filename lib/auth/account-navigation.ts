import type { FlyPathClientAuthState } from "./types";

export function getFlyPathAccountNavigation(state: FlyPathClientAuthState): {
  href: "/login" | "/account";
  label: "Iniciar sesión" | "Mi cuenta" | "Cuenta";
} {
  if (state.status === "authenticated") return { href: "/account", label: "Mi cuenta" };
  if (state.status === "anonymous") return { href: "/login", label: "Iniciar sesión" };
  return { href: "/login", label: "Cuenta" };
}
