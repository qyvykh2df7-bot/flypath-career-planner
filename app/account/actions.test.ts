import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saveAuthenticatedFlyPathProfileName: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/account/update-profile-name", () => ({ saveAuthenticatedFlyPathProfileName: mocks.saveAuthenticatedFlyPathProfileName }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { updateFlyPathProfileName } from "./actions";
import { initialUpdateFlyPathProfileNameState } from "@/lib/account/profile-name-action-state";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveAuthenticatedFlyPathProfileName.mockResolvedValue({ status: "success", fullName: "Ana Pilot" });
});

describe("updateFlyPathProfileName", () => {
  it("valida el nombre antes de consultar Supabase", async () => {
    mocks.saveAuthenticatedFlyPathProfileName.mockResolvedValueOnce({ status: "invalid" });
    const formData = new FormData();
    formData.set("full_name", "   ");

    await expect(updateFlyPathProfileName(initialUpdateFlyPathProfileNameState, formData)).resolves.toEqual({
      status: "error",
      message: "Introduce un nombre válido.",
    });
    expect(mocks.saveAuthenticatedFlyPathProfileName).toHaveBeenCalledWith("   ");
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
    mocks.saveAuthenticatedFlyPathProfileName.mockResolvedValue({ status: "unavailable" });
    const formData = new FormData();
    formData.set("full_name", "Ana Pilot");

    await expect(updateFlyPathProfileName(initialUpdateFlyPathProfileNameState, formData)).resolves.toEqual({
      status: "error",
      message: "No hemos podido guardar los cambios.",
    });
  });
});
