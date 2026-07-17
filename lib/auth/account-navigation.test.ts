import { describe, expect, it } from "vitest";

import { getFlyPathAccountNavigation } from "./account-navigation";

describe("FlyPath account navigation", () => {
  it("muestra inicio de sesión para visitantes anónimos", () => {
    expect(getFlyPathAccountNavigation({ status: "anonymous" })).toEqual({
      href: "/login",
      label: "Iniciar sesión",
    });
  });

  it("muestra la cuenta para una sesión autenticada", () => {
    expect(
      getFlyPathAccountNavigation({
        status: "authenticated",
        account: { id: "user-id", email: "pilot@example.com" },
      }),
    ).toEqual({ href: "/account", label: "Mi cuenta" });
  });

  it("mantiene un estado de hidratación neutro ante loading o unavailable", () => {
    expect(getFlyPathAccountNavigation({ status: "loading" })).toEqual({
      href: "/login",
      label: "Cuenta",
    });
    expect(getFlyPathAccountNavigation({ status: "unavailable" })).toEqual({
      href: "/login",
      label: "Cuenta",
    });
  });
});
