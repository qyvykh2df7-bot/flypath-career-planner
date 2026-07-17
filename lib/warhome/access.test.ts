import { describe, expect, it } from "vitest";
import {
  getWarhomeAccessDecision,
  WARHOME_LOGIN_PATH,
  WARHOME_PUBLIC_EXIT_PATH,
} from "./access";

describe("Warhome access decisions", () => {
  it("redirige usuarios no autenticados al login", () => {
    expect(getWarhomeAccessDecision({ status: "unauthenticated" })).toEqual({
      type: "redirect_to_login",
    });
    expect(WARHOME_LOGIN_PATH).toBe("/warhome/login");
  });

  it("rechaza un usuario autenticado sin registro administrativo sin invalidar su sesión", () => {
    expect(getWarhomeAccessDecision({ status: "not_admin", userId: "user-id" })).toEqual({
      type: "redirect_to_public_home",
    });
    expect(WARHOME_PUBLIC_EXIT_PATH).toBe("/");
  });

  it("rechaza un administrador inactivo sin invalidar su sesión", () => {
    expect(
      getWarhomeAccessDecision({ status: "inactive", userId: "user-id", role: "admin" }),
    ).toEqual({ type: "redirect_to_public_home" });
  });

  it("trata registros administrativos inválidos o no disponibles como acceso denegado", () => {
    expect(getWarhomeAccessDecision({ status: "invalid_admin_record", userId: "user-id" })).toEqual({
      type: "redirect_to_public_home",
    });
    expect(getWarhomeAccessDecision({ status: "unavailable" })).toEqual({
      type: "redirect_to_public_home",
    });
  });

  it("permite el acceso de un administrador activo", () => {
    expect(
      getWarhomeAccessDecision({
        status: "authorized",
        admin: { userId: "user-id", role: "owner" },
      }),
    ).toEqual({ type: "allow" });
  });
});
