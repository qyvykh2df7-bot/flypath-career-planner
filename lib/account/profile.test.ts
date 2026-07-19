import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getFlyPathSessionState: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  getFlyPathSessionState: mocks.getFlyPathSessionState,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getFlyPathAccountProfile } from "./profile";
import { normalizeFlyPathProfileName } from "./profile-name";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "pilot@example.com",
  email_confirmed_at: "2026-07-17T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

function setClient(profileResult: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(profileResult);
  mocks.createSupabaseServerClient.mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
    })),
  });
}

describe("getFlyPathAccountProfile", () => {
  beforeEach(() => {
    mocks.getFlyPathSessionState.mockResolvedValue({
      status: "authenticated",
      account: { id: user.id, email: user.email },
    });
  });

  it("devuelve solo el nombre y el email confirmado del perfil propio", async () => {
    setClient({ data: { full_name: "  Ana Pilot  " }, error: null });

    await expect(getFlyPathAccountProfile()).resolves.toEqual({
      status: "authenticated",
      account: { id: user.id, email: "pilot@example.com", fullName: "Ana Pilot" },
    });
  });

  it("permite un perfil inicial sin nombre", async () => {
    setClient({ data: null, error: null });

    await expect(getFlyPathAccountProfile()).resolves.toEqual({
      status: "authenticated",
      account: { id: user.id, email: "pilot@example.com", fullName: null },
    });
  });

  it("no consulta profiles cuando no hay una sesión válida", async () => {
    mocks.getFlyPathSessionState.mockResolvedValue({ status: "anonymous" });
    setClient({ data: null, error: null });

    await expect(getFlyPathAccountProfile()).resolves.toEqual({ status: "anonymous" });
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("no trata un error de identidad como una sesión anónima", async () => {
    mocks.getFlyPathSessionState.mockResolvedValue({ status: "unavailable" });
    setClient({ data: null, error: null });

    await expect(getFlyPathAccountProfile()).resolves.toEqual({ status: "unavailable" });
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("normaliza el nombre y rechaza texto vacío o excesivo", () => {
    expect(normalizeFlyPathProfileName("  Ana   Pilot ")).toBe("Ana Pilot");
    expect(normalizeFlyPathProfileName("   ")).toBeNull();
    expect(normalizeFlyPathProfileName("a".repeat(121))).toBeNull();
  });
});
