import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({ from: mocks.from }),
}));

import {
  getWarhomeAuthorization,
  requireWarhomeAdmin,
  WarhomeAuthorizationError,
} from "./auth";

const USER_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";

function configureAdminRecord(record: unknown, error: unknown = null): void {
  mocks.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: record, error }),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  configureAdminRecord(null);
});

describe("Warhome authorization", () => {
  it("rechaza un usuario no autenticado sin consultar roles", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getWarhomeAuthorization()).resolves.toEqual({ status: "unauthenticated" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rechaza un usuario autenticado sin registro administrativo", async () => {
    await expect(getWarhomeAuthorization()).resolves.toEqual({
      status: "not_admin",
      userId: USER_ID,
    });
  });

  it("rechaza un administrador inactivo", async () => {
    configureAdminRecord({ role: "admin", is_active: false });

    await expect(getWarhomeAuthorization()).resolves.toEqual({
      status: "inactive",
      userId: USER_ID,
      role: "admin",
    });
  });

  it("autoriza un administrador activo", async () => {
    configureAdminRecord({ role: "owner", is_active: true });

    await expect(getWarhomeAuthorization()).resolves.toEqual({
      status: "authorized",
      admin: { userId: USER_ID, role: "owner" },
    });
  });

  it("rechaza un rol no permitido y requireWarhomeAdmin falla de forma controlada", async () => {
    configureAdminRecord({ role: "viewer", is_active: true });

    await expect(getWarhomeAuthorization()).resolves.toEqual({
      status: "invalid_admin_record",
      userId: USER_ID,
    });
    await expect(requireWarhomeAdmin()).rejects.toEqual(
      expect.objectContaining<Partial<WarhomeAuthorizationError>>({
        name: "WarhomeAuthorizationError",
        status: "invalid_admin_record",
      }),
    );
  });
});
