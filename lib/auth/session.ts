import "server-only";

import { AuthInvalidJwtError, isAuthSessionMissingError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toFlyPathAccount, type FlyPathSessionState } from "./types";

export async function getFlyPathSessionState(): Promise<FlyPathSessionState> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (
      !user &&
      (!error || isAuthSessionMissingError(error) || error instanceof AuthInvalidJwtError)
    ) {
      return { status: "anonymous" };
    }
    if (error) return { status: "unavailable" };
    if (!user) return { status: "anonymous" };

    return { status: "authenticated", account: toFlyPathAccount(user) };
  } catch {
    return { status: "unavailable" };
  }
}
