import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWarhomeUsersDirectory: vi.fn(),
}));

vi.mock("@/lib/warhome/users", () => ({
  getWarhomeUsersDirectory: mocks.getWarhomeUsersDirectory,
  WARHOME_USERS_LOAD_ERROR_MESSAGE: "Mensaje genérico de carga.",
}));
vi.mock("@/components/warhome/WarhomeUserFilters", () => ({
  WarhomeUserFilters: () => null,
}));
vi.mock("@/components/warhome/WarhomeUsersTable", () => ({
  WarhomeUsersTable: () => null,
}));

import WarhomeUsersPage from "./page";

const directory = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  filters: {
    query: "",
    aerocommsStatus: null,
    lead: null,
    marketingStatus: null,
    emailConfirmation: null,
    profile: null,
  },
  sort: { field: "created_at", direction: "desc" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Warhome users page", () => {
  it("consulta el directorio server-only y renderiza sus controles", async () => {
    mocks.getWarhomeUsersDirectory.mockResolvedValue(directory);
    const markup = renderToStaticMarkup(
      await WarhomeUsersPage({ searchParams: Promise.resolve({ q: "pilot@example.com" }) }),
    );

    expect(mocks.getWarhomeUsersDirectory).toHaveBeenCalledWith({ q: "pilot@example.com" });
    expect(markup).toContain("Usuarios");
    expect(markup).toContain("Cuentas FlyPath y actividad disponible de AeroComms");
  });

  it("muestra un error genérico cuando la capa server-only falla", async () => {
    mocks.getWarhomeUsersDirectory.mockRejectedValue(new Error("internal database detail"));
    const markup = renderToStaticMarkup(
      await WarhomeUsersPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("No se ha podido cargar el directorio");
    expect(markup).toContain("Mensaje genérico de carga.");
    expect(markup).not.toContain("internal database detail");
  });
});
