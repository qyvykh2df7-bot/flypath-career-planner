import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

import { bootstrapFlyPathIdentity } from "./bootstrap";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "pilot@example.com",
  email_confirmed_at: "2026-07-17T10:00:00.000Z",
};

function profileSelect(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue(result) })),
    })),
  };
}

function profileInsert(result: { error: unknown }) {
  return { insert: vi.fn().mockResolvedValue(result) };
}

function leadUpdate(result: { data: unknown[] | null; error: unknown }) {
  return {
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn(() => ({ select: vi.fn().mockResolvedValue(result) })),
      })),
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createSupabaseServerClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
});

describe("bootstrapFlyPathIdentity", () => {
  it("reutiliza un perfil existente y vincula un lead libre por email confirmado", async () => {
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileSelect({ data: { user_id: user.id }, error: null });
        return leadUpdate({ data: [{ id: "lead-id" }], error: null });
      }),
    });

    await expect(bootstrapFlyPathIdentity()).resolves.toEqual({
      status: "ready",
      profile: "existing",
      linkedLeads: 1,
      leadLink: "completed",
    });
  });

  it("crea un perfil vacío una sola vez cuando aún no existe", async () => {
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return from.mock.calls.filter(([name]) => name === "profiles").length === 1
          ? profileSelect({ data: null, error: null })
          : profileInsert({ error: null });
      }
      return leadUpdate({ data: [], error: null });
    });
    mocks.getSupabaseAdmin.mockReturnValue({ from });

    await expect(bootstrapFlyPathIdentity()).resolves.toMatchObject({
      status: "ready",
      profile: "created",
      linkedLeads: 0,
    });
  });

  it("resuelve la carrera de creación comprobando el perfil que creó otra ejecución", async () => {
    const profiles = [
      profileSelect({ data: null, error: null }),
      profileInsert({ error: { code: "23505" } }),
      profileSelect({ data: { user_id: user.id }, error: null }),
    ];
    let profileCall = 0;
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profiles[profileCall++];
        return leadUpdate({ data: [], error: null });
      }),
    });

    await expect(bootstrapFlyPathIdentity()).resolves.toMatchObject({
      status: "ready",
      profile: "existing",
    });
  });

  it("no reasigna un lead que ya pertenece a otra cuenta", async () => {
    const from = vi.fn((table: string) => {
      if (table === "profiles") return profileSelect({ data: { user_id: user.id }, error: null });
      return leadUpdate({ data: [], error: null });
    });
    mocks.getSupabaseAdmin.mockReturnValue({ from });

    await bootstrapFlyPathIdentity();

    const leadChain = from.mock.results.find((result) => result.value?.update)?.value;
    expect(leadChain.update).toHaveBeenCalledWith({ user_id: user.id });
    expect(leadChain.update.mock.results[0].value.eq).toHaveBeenCalledWith("email", "pilot@example.com");
    expect(leadChain.update.mock.results[0].value.eq.mock.results[0].value.is).toHaveBeenCalledWith(
      "user_id",
      null,
    );
  });

  it("permite que un perfil ya creado sobreviva a un fallo parcial del vínculo", async () => {
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileSelect({ data: { user_id: user.id }, error: null });
        return leadUpdate({ data: null, error: new Error("database unavailable") });
      }),
    });

    await expect(bootstrapFlyPathIdentity()).resolves.toEqual({
      status: "partial",
      profile: "existing",
      reason: "lead_link_unavailable",
    });
  });

  it("crea perfil pero no intenta vincular leads sin email confirmado usable", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { ...user, email_confirmed_at: null } }, error: null });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn(() => profileSelect({ data: { user_id: user.id }, error: null })),
    });

    await expect(bootstrapFlyPathIdentity()).resolves.toEqual({
      status: "ready",
      profile: "existing",
      linkedLeads: 0,
      leadLink: "skipped_no_verified_email",
    });
  });

  it("no crea perfiles ni leads cuando no hay sesión", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(bootstrapFlyPathIdentity()).resolves.toEqual({ status: "unauthenticated" });
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
