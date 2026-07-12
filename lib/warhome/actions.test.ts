import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getWarhomeAuthorizationForAuthenticatedUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
  })),
}));
vi.mock("@/lib/warhome/auth", () => ({
  getWarhomeAuthorizationForAuthenticatedUser: mocks.getWarhomeAuthorizationForAuthenticatedUser,
}));

import {
  loginWarhome,
  logoutWarhome,
} from "./actions";

const USER_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const GENERIC_LOGIN_ERROR = "No hemos podido acceder. Comprueba tus credenciales.";
const initialWarhomeLoginState = { error: null };

function validLoginFormData(): FormData {
  const formData = new FormData();
  formData.set("email", "admin@example.com");
  formData.set("password", "not-a-real-password");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithPassword.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.getWarhomeAuthorizationForAuthenticatedUser.mockResolvedValue({
    status: "authorized",
    admin: { userId: USER_ID, role: "admin" },
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`redirect:${path}`);
  });
});

describe("Warhome login and logout actions", () => {
  it("muestra un error genérico ante un login fallido", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: new Error("Invalid login credentials") });

    await expect(loginWarhome(initialWarhomeLoginState, validLoginFormData())).resolves.toEqual({
      error: GENERIC_LOGIN_ERROR,
    });
    expect(mocks.getWarhomeAuthorizationForAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("cierra la sesión local cuando el usuario autenticado no es administrador", async () => {
    mocks.getWarhomeAuthorizationForAuthenticatedUser.mockResolvedValue({
      status: "not_admin",
      userId: USER_ID,
    });

    await expect(loginWarhome(initialWarhomeLoginState, validLoginFormData())).resolves.toEqual({
      error: GENERIC_LOGIN_ERROR,
    });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("redirige al área protegida cuando el administrador está activo", async () => {
    await expect(loginWarhome(initialWarhomeLoginState, validLoginFormData())).rejects.toThrow(
      "redirect:/warhome",
    );
  });

  it("invalida la sesión local al cerrar sesión", async () => {
    await expect(logoutWarhome()).rejects.toThrow("redirect:/warhome/login");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
