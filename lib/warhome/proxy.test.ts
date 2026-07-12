import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  getWarhomeAuthorizationForAuthenticatedUser: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("@/lib/warhome/auth", () => ({
  getWarhomeAuthorizationForAuthenticatedUser: mocks.getWarhomeAuthorizationForAuthenticatedUser,
}));

import { proxy } from "@/proxy";

const USER_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";

function request(pathname: string): NextRequest {
  return new NextRequest(`https://flypath.test${pathname}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  mocks.createServerClient.mockReturnValue({
    auth: {
      getUser: mocks.getUser,
      signOut: mocks.signOut,
    },
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.getWarhomeAuthorizationForAuthenticatedUser.mockResolvedValue({
    status: "authorized",
    admin: { userId: USER_ID, role: "owner" },
  });
});

describe("Warhome proxy", () => {
  it("redirige un usuario no autenticado al login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await proxy(request("/warhome"));

    expect(response.headers.get("location")).toBe("https://flypath.test/warhome/login");
  });

  it("rechaza y cierra sesión para un usuario sin permiso administrativo", async () => {
    mocks.getWarhomeAuthorizationForAuthenticatedUser.mockResolvedValue({
      status: "not_admin",
      userId: USER_ID,
    });

    const response = await proxy(request("/warhome"));

    expect(response.headers.get("location")).toBe("https://flypath.test/warhome/login");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rechaza y cierra sesión para un administrador inactivo", async () => {
    mocks.getWarhomeAuthorizationForAuthenticatedUser.mockResolvedValue({
      status: "inactive",
      userId: USER_ID,
      role: "admin",
    });

    const response = await proxy(request("/warhome"));

    expect(response.headers.get("location")).toBe("https://flypath.test/warhome/login");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("permite que un administrador activo continúe a Warhome", async () => {
    const response = await proxy(request("/warhome"));

    expect(response.headers.get("location")).toBeNull();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
