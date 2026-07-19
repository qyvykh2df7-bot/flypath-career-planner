import { describe, expect, it } from "vitest";
import {
  getActiveWarhomeNavigationId,
  getWarhomePageDetails,
  WARHOME_NAVIGATION,
} from "./navigation";

describe("Warhome navigation", () => {
  it("marca Resumen, Leads, Usuarios y Emails según el pathname", () => {
    expect(getActiveWarhomeNavigationId("/warhome")).toBe("summary");
    expect(getActiveWarhomeNavigationId("/warhome/leads")).toBe("leads");
    expect(getActiveWarhomeNavigationId("/warhome/leads/example")).toBe("leads");
    expect(getActiveWarhomeNavigationId("/warhome/users")).toBe("users");
    expect(getActiveWarhomeNavigationId("/warhome/users/example")).toBe("users");
    expect(getActiveWarhomeNavigationId("/warhome/emails")).toBe("emails");
  });

  it("expone títulos estables para las rutas disponibles", () => {
    expect(getWarhomePageDetails("/warhome").title).toBe("Resumen");
    expect(getWarhomePageDetails("/warhome/leads").title).toBe("Leads");
    expect(getWarhomePageDetails("/warhome/users").title).toBe("Usuarios");
    expect(getWarhomePageDetails("/warhome/emails").title).toBe("Emails");
  });

  it("mantiene los módulos deshabilitados sin enlaces a rutas inexistentes", () => {
    const disabledItems = WARHOME_NAVIGATION.filter(
      (item) => item.availability !== "available",
    );

    expect(disabledItems.map((item) => item.id)).toEqual([
      "notes",
      "settings",
      "analytics",
      "products",
      "content",
      "campaigns",
      "agents",
      "tasks",
    ]);
    expect(disabledItems.every((item) => item.href === null)).toBe(true);
  });
});
