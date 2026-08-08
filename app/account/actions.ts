"use server";

import { revalidatePath } from "next/cache";
import { saveAuthenticatedFlyPathProfileName } from "@/lib/account/update-profile-name";
import type { UpdateFlyPathProfileNameState } from "@/lib/account/profile-name-action-state";

export async function updateFlyPathProfileName(
  _previousState: UpdateFlyPathProfileNameState,
  formData: FormData,
): Promise<UpdateFlyPathProfileNameState> {
  const value = formData.get("full_name");
  if (typeof value !== "string") {
    return { status: "error", message: "Introduce un nombre válido." };
  }

  const result = await saveAuthenticatedFlyPathProfileName(value);
  if (result.status === "invalid") {
    return { status: "error", message: "Introduce un nombre válido." };
  }
  if (result.status === "success") {
    revalidatePath("/account");
    return { status: "success", message: "Nombre actualizado." };
  }

  return { status: "error", message: "No hemos podido guardar los cambios." };
}
