import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { WarhomeUserFilters } from "./WarhomeUserFilters";
import {
  formatWarhomeUserDate,
  getWarhomeAeroCommsLabel,
  getWarhomeMarketingLabel,
  WarhomeUsersTable,
} from "./WarhomeUsersTable";
import { parseWarhomeUserListParameters, type WarhomeUserDirectoryItem } from "@/lib/warhome/users";

const USER_ID = "5a63c9bf-b72e-4c61-a23f-76b40bb91723";

function user(overrides: Partial<WarhomeUserDirectoryItem> = {}): WarhomeUserDirectoryItem {
  return {
    userId: USER_ID, email: "pilot@example.com", emailConfirmed: true,
    createdAt: "2026-07-12T10:00:00.000Z", lastSignInAt: "2026-07-13T10:00:00.000Z",
    fullName: "Piloto de prueba", profileIncomplete: false, hasAeroCommsProgress: true,
    sessionCount: 4, scoredSessionCount: 3, lastAeroCommsActivityAt: "2026-07-14T10:00:00.000Z",
    lastAeroCommsActivityDate: "2026-07-14", streakDays: 2, legacyImportedAt: null,
    resetAt: null, completedExerciseCount: 2, completedMissionCount: 1, hasLead: true,
    leadId: "2c0d0d42-f8ec-4fc3-bb19-64b8ad15d22e", marketingStatus: "subscribed",
    aerocommsStatus: "active", ...overrides,
  };
}

function tableMarkup(
  items: WarhomeUserDirectoryItem[],
  parameters = parseWarhomeUserListParameters({}),
  total = items.length,
  totalPages = 1,
) {
  return renderToStaticMarkup(createElement(WarhomeUsersTable, { items, parameters, total, totalPages }));
}

describe("WarhomeUsersTable", () => {
  it("muestra el listado, etiquetas operativas y enlace accesible al detalle", () => {
    const markup = tableMarkup([user()]);

    expect(markup).toContain("Piloto de prueba");
    expect(markup).toContain("pilot@example.com");
    expect(markup).toContain("Activo");
    expect(markup).toContain("Suscrito");
    expect(markup).toContain(`/warhome/users/${USER_ID}`);
    expect(markup).not.toContain("user_metadata");
    expect(markup).not.toContain("provider_data");
  });

  it("representa los valores ausentes con copy operativo", () => {
    const markup = tableMarkup([user({
      fullName: null, lastSignInAt: null, lastAeroCommsActivityAt: null, hasLead: false,
      leadId: null, marketingStatus: "not_applicable", aerocommsStatus: "not_synced",
      hasAeroCommsProgress: false, sessionCount: 0, scoredSessionCount: 0,
    })]);

    expect(markup).toContain("Sin nombre");
    expect(markup).toContain("Sin acceso registrado");
    expect(markup).toContain("Sin actividad");
    expect(markup).toContain("Sin lead");
    expect(markup).toContain("No aplicable");
    expect(markup).toContain("Sin sincronizar");
  });

  it("preserva búsqueda, filtros y orden en la paginación", () => {
    const parameters = parseWarhomeUserListParameters({
      q: "pilot@example.com", aerocomms: "active", lead: "linked", marketing: "subscribed",
      confirmed: "confirmed", profile: "complete", sort: "last_sign_in_at", direction: "asc", page: "2",
    });
    const markup = tableMarkup([user()], parameters, 41, 3);

    expect(markup).toContain("q=pilot%40example.com");
    expect(markup).toContain("aerocomms=active");
    expect(markup).toContain("sort=last_sign_in_at");
    expect(markup).toContain("page=3");
  });

  it("distingue directorio vacío de resultados vacíos por filtros", () => {
    expect(tableMarkup([])).toContain("No hay usuarios para mostrar");
    expect(tableMarkup([], parseWarhomeUserListParameters({ q: "nadie" }))).toContain("No hay usuarios con estos filtros");
  });

  it("expone etiquetas y fechas seguras", () => {
    expect(getWarhomeAeroCommsLabel("no_activity")).toBe("Sin actividad todavía");
    expect(getWarhomeMarketingLabel("not_applicable")).toBe("No aplicable");
    expect(formatWarhomeUserDate(null)).toBe("-");
    expect(formatWarhomeUserDate("not-a-date")).toBe("-");
  });

  it("renderiza todos los controles cerrados de búsqueda, filtros y orden", () => {
    const markup = renderToStaticMarkup(createElement(WarhomeUserFilters, {
      parameters: parseWarhomeUserListParameters({ aerocomms: "active", sort: "last_sign_in_at" }),
    }));

    for (const name of ["q", "aerocomms", "lead", "marketing", "confirmed", "profile", "sort", "direction"]) {
      expect(markup).toContain(`name=\"${name}\"`);
    }
    expect(markup).toContain("Limpiar");
  });
});
