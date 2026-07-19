import "server-only";

import { bootstrapFlyPathIdentity } from "@/lib/account/bootstrap";
import { normalizeFlyPathProfileName } from "@/lib/account/profile-name";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SaveFlyPathProfileNameResult =
  | { status: "success"; fullName: string }
  | { status: "invalid" | "unavailable" };

/** Saves a name only for the authenticated cookie session's own profile. */
export async function saveAuthenticatedFlyPathProfileName(
  value: string,
): Promise<SaveFlyPathProfileNameResult> {
  const fullName = normalizeFlyPathProfileName(value);
  if (!fullName) return { status: "invalid" };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { status: "unavailable" };

    const bootstrap = await bootstrapFlyPathIdentity();
    if (bootstrap.status === "unauthenticated" || bootstrap.status === "unavailable") {
      return { status: "unavailable" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);

    if (error) return { status: "unavailable" };
    return { status: "success", fullName };
  } catch {
    return { status: "unavailable" };
  }
}
