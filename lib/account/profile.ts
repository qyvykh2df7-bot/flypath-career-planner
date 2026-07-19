import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { normalizeFlyPathProfileName } from "@/lib/account/profile-name";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FlyPathAccountProfileResult =
  | { status: "authenticated"; account: { id: string; email: string | null; fullName: string | null } }
  | { status: "anonymous" | "unavailable" };

export async function getFlyPathAccountProfile(): Promise<FlyPathAccountProfileResult> {
  try {
    const session = await getFlyPathSessionState();
    if (session.status !== "authenticated") return session;

    const supabase = await createSupabaseServerClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", session.account.id)
      .maybeSingle();

    if (profileError) return { status: "unavailable" };

    return {
      status: "authenticated",
      account: {
        id: session.account.id,
        email: session.account.email,
        fullName: profile?.full_name ? normalizeFlyPathProfileName(profile.full_name) : null,
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
