import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { linkVerifiedSchoolReviewsToAccount } from "@/lib/school-reviews/service";

const VERIFIED_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FlyPathIdentityBootstrapResult =
  | {
      status: "ready";
      profile: "existing" | "created";
      linkedLeads: number;
      leadLink: "completed" | "skipped_no_verified_email";
    }
  | {
      status: "partial";
      profile: "existing" | "created";
      reason: "lead_link_unavailable";
    }
  | { status: "unauthenticated" | "unavailable" };

function normalizeVerifiedEmail(email: string | undefined, confirmedAt: string | undefined): string | null {
  if (!email || !confirmedAt) return null;

  const normalized = email.trim().toLowerCase();
  return VERIFIED_EMAIL_PATTERN.test(normalized) ? normalized : null;
}

async function ensureFlyPathProfile(userId: string): Promise<"existing" | "created" | null> {
  const admin = getSupabaseAdmin();
  const { data: existingProfile, error: existingError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) return null;
  if (existingProfile) return "existing";

  const { error: insertError } = await admin
    .from("profiles")
    .insert({ user_id: userId });

  if (!insertError) return "created";

  // A concurrent bootstrap may have won the primary-key race. Confirming the
  // row makes this path idempotent without overwriting profile fields.
  const { data: racedProfile, error: racedError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (racedError || !racedProfile) return null;
  return "existing";
}

async function linkUnassignedLeadsByVerifiedEmail(userId: string, email: string): Promise<number | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("leads")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null)
    .select("id");

  if (error) return null;
  return data?.length ?? 0;
}

export async function bootstrapFlyPathIdentity(): Promise<FlyPathIdentityBootstrapResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) return { status: "unavailable" };
    if (!user) return { status: "unauthenticated" };

    const profile = await ensureFlyPathProfile(user.id);
    if (!profile) return { status: "unavailable" };

    const email = normalizeVerifiedEmail(user.email, user.email_confirmed_at ?? undefined);
    if (!email) {
      return {
        status: "ready",
        profile,
        linkedLeads: 0,
        leadLink: "skipped_no_verified_email",
      };
    }

    const linkedLeads = await linkUnassignedLeadsByVerifiedEmail(user.id, email);
    if (linkedLeads === null) {
      return { status: "partial", profile, reason: "lead_link_unavailable" };
    }

    // El vínculo de una opinión existente es auxiliar y nunca crea una opinión,
    // lead ni suscripción. Un despliegue previo a la migración debe seguir
    // permitiendo el bootstrap normal de la cuenta.
    try {
      await linkVerifiedSchoolReviewsToAccount(getSupabaseAdmin(), {
        userId: user.id,
        normalizedEmail: email,
      });
    } catch {
      // Se recupera en el siguiente bootstrap autenticado.
    }

    return { status: "ready", profile, linkedLeads, leadLink: "completed" };
  } catch {
    return { status: "unavailable" };
  }
}
