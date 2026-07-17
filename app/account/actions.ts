"use server";

import { revalidatePath } from "next/cache";
import { bootstrapFlyPathIdentity } from "@/lib/account/bootstrap";
import { normalizeFlyPathProfileName } from "@/lib/account/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateFlyPathProfileNameState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialUpdateFlyPathProfileNameState: UpdateFlyPathProfileNameState = {
  status: "idle",
  message: null,
};

export async function updateFlyPathProfileName(
  _previousState: UpdateFlyPathProfileNameState,
  formData: FormData,
): Promise<UpdateFlyPathProfileNameState> {
  const value = formData.get("full_name");
  const fullName = typeof value === "string" ? normalizeFlyPathProfileName(value) : null;

  if (!fullName) {
    return { status: "error", message: "Introduce un nombre válido." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "error", message: "No hemos podido guardar los cambios." };
    }

    const bootstrap = await bootstrapFlyPathIdentity();
    if (bootstrap.status === "unauthenticated" || bootstrap.status === "unavailable") {
      return { status: "error", message: "No hemos podido guardar los cambios." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);

    if (error) return { status: "error", message: "No hemos podido guardar los cambios." };

    revalidatePath("/account");
    return { status: "success", message: "Nombre actualizado." };
  } catch {
    return { status: "error", message: "No hemos podido guardar los cambios." };
  }
}
