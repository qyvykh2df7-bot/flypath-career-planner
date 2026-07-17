export const DEFAULT_FLYPATH_LOGIN_DESTINATION = "/";

const ALLOWED_FLYPATH_LOGIN_DESTINATIONS = new Set([
  "/",
  "/account",
  "/aerocomms",
  "/career-planner",
  "/mentorias",
  "/schools",
]);

export function getSafeFlyPathLoginNext(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/")) {
    return DEFAULT_FLYPATH_LOGIN_DESTINATION;
  }

  if (
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    /^\/%2f/i.test(value) ||
    /^\/%5c/i.test(value)
  ) {
    return DEFAULT_FLYPATH_LOGIN_DESTINATION;
  }

  try {
    const url = new URL(value, "https://flypath.local");

    return ALLOWED_FLYPATH_LOGIN_DESTINATIONS.has(url.pathname)
      ? url.pathname
      : DEFAULT_FLYPATH_LOGIN_DESTINATION;
  } catch {
    return DEFAULT_FLYPATH_LOGIN_DESTINATION;
  }
}

export function createFlyPathLoginVerifyHref(next: string | string[] | undefined): string {
  return `/login/verify?next=${encodeURIComponent(getSafeFlyPathLoginNext(next))}`;
}

export function createFlyPathLoginHref(next: string | string[] | undefined): string {
  return `/login?next=${encodeURIComponent(getSafeFlyPathLoginNext(next))}`;
}
