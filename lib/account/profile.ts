import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FlyPathAccountProfileResult =
  | { status: "authenticated"; account: { email: string | null; fullName: string | null } }
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
        email: session.account.email,
        fullName: profile?.full_name?.trim() || null,
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}

export function normalizeFlyPathProfileName(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length >= 1 && normalized.length <= 120 ? normalized : null;
}
