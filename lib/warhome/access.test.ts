import { describe, expect, it } from "vitest";
import { getWarhomeAccessDecision, WARHOME_LOGIN_PATH } from "./access";

describe("Warhome access decisions", () => {
  it("redirige usuarios no autenticados al login", () => {
    expect(getWarhomeAccessDecision({ status: "unauthenticated" })).toEqual({
      type: "redirect_to_login",
      invalidateSession: false,
    });
    expect(WARHOME_LOGIN_PATH).toBe("/warhome/login");
  });

  it("rechaza un usuario autenticado sin registro administrativo", () => {
    expect(getWarhomeAccessDecision({ status: "not_admin", userId: "user-id" })).toEqual({
      type: "redirect_to_login",
      invalidateSession: true,
    });
  });

  it("rechaza un administrador inactivo", () => {
    expect(
      getWarhomeAccessDecision({ status: "inactive", userId: "user-id", role: "admin" }),
    ).toEqual({ type: "redirect_to_login", invalidateSession: true });
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
