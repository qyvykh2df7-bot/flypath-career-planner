import "client-only";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;

export type FlyPathOtpRequestResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid_email" | "unavailable" };

export function normalizeFlyPathOtpEmail(value: string): string | null {
  const email = value.trim().toLowerCase();

  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return null;
  }

  return email;
}

export async function requestFlyPathLoginOtp(rawEmail: string): Promise<FlyPathOtpRequestResult> {
  const email = normalizeFlyPathOtpEmail(rawEmail);
  if (!email) return { ok: false, reason: "invalid_email" };

  try {
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return { ok: false, reason: "unavailable" };

    return { ok: true, email };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
