const LEAD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLeadEmail(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || !LEAD_EMAIL_REGEX.test(normalized)) {
    return null;
  }
  return normalized;
}
