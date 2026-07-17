import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bootstrapFlyPathIdentity: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/account/bootstrap", () => ({ bootstrapFlyPathIdentity: mocks.bootstrapFlyPathIdentity }));
vi.mock("@/lib/account/profile", () => ({
  normalizeFlyPathProfileName: (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    return normalized.length >= 1 && normalized.length <= 120 ? normalized : null;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  initialUpdateFlyPathProfileNameState,
  updateFlyPathProfileName,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null });
  mocks.bootstrapFlyPathIdentity.mockResolvedValue({ status: "ready" });
  mocks.createSupabaseServerClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    })),
  });
});

describe("updateFlyPathProfileName", () => {
  it("valida el nombre antes de consultar Supabase", async () => {
    const formData = new FormData();
    formData.set("full_name", "   ");

    await expect(updateFlyPathProfileName(initialUpdateFlyPathProfileNameState, formData)).resolves.toEqual({
      status: "error",
      message: "Introduce un nombre válido.",
    });
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("guarda solo el nombre para el usuario autenticado", async () => {
    const formData = new FormData();
    formData.set("full_name", "  Ana  Pilot ");

    await expect(updateFlyPathProfileName(initialUpdateFlyPathProfileNameState, formData)).resolves.toEqual({
      status: "success",
      message: "Nombre actualizado.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("devuelve un error genérico si falla la identidad o el bootstrap", async () => {
    mocks.bootstrapFlyPathIdentity.mockResolvedValue({ status: "unavailable" });
    const formData = new FormData();
    formData.set("full_name", "Ana Pilot");

    await expect(updateFlyPathProfileName(initialUpdateFlyPathProfileNameState, formData)).resolves.toEqual({
      status: "error",
      message: "No hemos podido guardar los cambios.",
    });
  });
});
