import "client-only";

import { normalizeFlyPathOtpEmail } from "./otp";

const PENDING_FLYPATH_OTP_EMAIL_KEY = "flypath.auth.pending_otp_email.v1";

let fallbackPendingEmail: string | null = null;

function getSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function savePendingFlyPathOtpEmail(value: string): void {
  const email = normalizeFlyPathOtpEmail(value);
  if (!email) return;

  fallbackPendingEmail = email;

  try {
    getSessionStorage()?.setItem(PENDING_FLYPATH_OTP_EMAIL_KEY, email);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function getPendingFlyPathOtpEmail(): string | null {
  try {
    const storedEmail = getSessionStorage()?.getItem(PENDING_FLYPATH_OTP_EMAIL_KEY);
    const email = storedEmail ? normalizeFlyPathOtpEmail(storedEmail) : null;

    if (email) {
      fallbackPendingEmail = email;
      return email;
    }
  } catch {
    // The in-memory fallback still supports the current navigation.
  }

  return fallbackPendingEmail;
}

export function clearPendingFlyPathOtpEmail(): void {
  fallbackPendingEmail = null;

  try {
    getSessionStorage()?.removeItem(PENDING_FLYPATH_OTP_EMAIL_KEY);
  } catch {
    // Clearing a restricted storage area is best-effort.
  }
}
