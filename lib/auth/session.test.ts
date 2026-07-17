import { readFileSync } from "node:fs";
import path from "node:path";
import { AuthInvalidJwtError, AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getFlyPathSessionState } from "./session";

const USER_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createSupabaseServerClient.mockResolvedValue({
    auth: {
      getUser: mocks.getUser,
      getSession: mocks.getSession,
      signOut: mocks.signOut,
    },
  });
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: USER_ID,
        email: "pilot@example.com",
        email_confirmed_at: "2026-07-17T12:00:00.000Z",
      },
    },
    error: null,
  });
});

describe("FlyPath server session", () => {
  it("devuelve una cuenta mínima para un usuario autenticado y validado", async () => {
    await expect(getFlyPathSessionState()).resolves.toEqual({
      status: "authenticated",
      account: { id: USER_ID, email: "pilot@example.com" },
    });
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("devuelve anonymous cuando no existe sesión válida", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getFlyPathSessionState()).resolves.toEqual({ status: "anonymous" });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("trata una sesión ausente de Supabase como anonymous, no como un fallo de infraestructura", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    await expect(getFlyPathSessionState()).resolves.toEqual({ status: "anonymous" });
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("trata un JWT inválido como una sesión anónima", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthInvalidJwtError("Invalid token"),
    });

    await expect(getFlyPathSessionState()).resolves.toEqual({ status: "anonymous" });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("devuelve unavailable sin detalles cuando getUser falla", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Unavailable") });

    await expect(getFlyPathSessionState()).resolves.toEqual({ status: "unavailable" });
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("mantiene el helper general separado de Warhome y del service role", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/auth/session.ts"), "utf8");

    expect(source).toContain('import "server-only"');
    expect(source).toContain("auth.getUser()");
    expect(source).not.toContain("auth.getSession()");
    expect(source).not.toContain("getSupabaseAdmin");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("signOut(");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("getAuthenticatedFlyPathAccount");
  });
});
