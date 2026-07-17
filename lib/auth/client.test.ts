import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("client-only", () => ({}));
vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: mocks.createSupabaseBrowserClient,
}));

import { initializeFlyPathAuthState, signOutFlyPath } from "./client";

const USER_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
let authStateListener: ((event: unknown, session: unknown) => void) | null = null;

function authenticatedSession() {
  return {
    user: {
      id: USER_ID,
      email: "pilot@example.com",
      email_confirmed_at: "2026-07-17T12:00:00.000Z",
    },
  };
}

function deferred<T>() {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve: resolve! };
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
  authStateListener = null;
  mocks.createSupabaseBrowserClient.mockReturnValue({
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
  });
  mocks.getSession.mockResolvedValue({ data: { session: authenticatedSession() }, error: null });
  mocks.onAuthStateChange.mockImplementation((listener: (event: unknown, session: unknown) => void) => {
    authStateListener = listener;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe("FlyPath client session", () => {
  it("emite loading y después la sesión inicial autenticada", async () => {
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    expect(listener).toHaveBeenNthCalledWith(1, { status: "loading" });
    await flushAsyncWork();
    expect(listener).toHaveBeenNthCalledWith(2, {
      status: "authenticated",
      account: { id: USER_ID, email: "pilot@example.com" },
    });
  });

  it("emite anonymous cuando la sesión inicial no existe", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    await flushAsyncWork();
    expect(listener).toHaveBeenLastCalledWith({ status: "anonymous" });
  });

  it("emite unavailable si getSession falla y mantiene activa la suscripción", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: new Error("Unavailable") });
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    await flushAsyncWork();
    expect(listener).toHaveBeenLastCalledWith({ status: "unavailable" });

    authStateListener?.("SIGNED_IN", authenticatedSession());
    expect(listener).toHaveBeenLastCalledWith({
      status: "authenticated",
      account: { id: USER_ID, email: "pilot@example.com" },
    });
  });

  it("emite unavailable si getSession rechaza inesperadamente", async () => {
    mocks.getSession.mockRejectedValue(new Error("Network unavailable"));
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    await flushAsyncWork();
    expect(listener).toHaveBeenLastCalledWith({ status: "unavailable" });
  });

  it("actualiza SIGNED_IN, TOKEN_REFRESHED y USER_UPDATED con la sesión recibida", () => {
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    authStateListener?.("SIGNED_IN", authenticatedSession());
    authStateListener?.("TOKEN_REFRESHED", authenticatedSession());
    authStateListener?.("USER_UPDATED", authenticatedSession());

    expect(listener).toHaveBeenLastCalledWith({
      status: "authenticated",
      account: { id: USER_ID, email: "pilot@example.com" },
    });
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("actualiza SIGNED_OUT como estado anónimo", () => {
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    authStateListener?.("SIGNED_OUT", null);

    expect(listener).toHaveBeenLastCalledWith({ status: "anonymous" });
  });

  it("no deja que una respuesta inicial tardía sobrescriba un evento Auth más reciente", async () => {
    const initialSession = deferred<{ data: { session: ReturnType<typeof authenticatedSession> | null }; error: null }>();
    mocks.getSession.mockReturnValue(initialSession.promise);
    const listener = vi.fn();
    initializeFlyPathAuthState(listener);

    authStateListener?.("SIGNED_IN", authenticatedSession());
    initialSession.resolve({ data: { session: null }, error: null });
    await flushAsyncWork();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({
      status: "authenticated",
      account: { id: USER_ID, email: "pilot@example.com" },
    });
  });

  it("limpia la suscripción e ignora estados posteriores", async () => {
    const listener = vi.fn();
    const cleanup = initializeFlyPathAuthState(listener);

    cleanup();
    authStateListener?.("SIGNED_IN", authenticatedSession());
    await flushAsyncWork();

    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ status: "loading" });
  });

  it("solo cierra sesión cuando se invoca explícitamente", async () => {
    await expect(signOutFlyPath()).resolves.toBe(true);
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("no importa lógica server-only ni autorización de Warhome", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/auth/client.ts"), "utf8");

    expect(source).toContain('import "client-only"');
    expect(source).not.toContain("server-only");
    expect(source).not.toContain("getSupabaseAdmin");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("getWarhomeAuthorization");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
