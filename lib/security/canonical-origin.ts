import "server-only";

export type CanonicalOriginEnvironment = {
  FLYPATH_CANONICAL_ORIGIN?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

export class CanonicalOriginError extends Error {
  constructor(public readonly kind: "missing" | "invalid") {
    super("Canonical origin is unavailable");
  }
}

function isLocalhost(url: URL) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
}

/**
 * Resolves every server-generated public URL from one explicit configuration
 * value. Preview deployments intentionally use the configured canonical origin
 * too; this prevents untrusted deployment hosts from being reflected into
 * confirmation and payment links.
 */
export function getCanonicalOrigin(environment: CanonicalOriginEnvironment = process.env): string {
  const isDevelopment = environment.NODE_ENV === "development" || environment.NODE_ENV === "test";
  const configured = environment.FLYPATH_CANONICAL_ORIGIN?.trim();

  if (!configured) {
    if (isDevelopment) return "http://localhost:3000";
    throw new CanonicalOriginError("missing");
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new CanonicalOriginError("invalid");
  }

  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new CanonicalOriginError("invalid");
  }

  if (url.protocol === "https:") return url.origin;
  if (isDevelopment && url.protocol === "http:" && isLocalhost(url)) return url.origin;
  throw new CanonicalOriginError("invalid");
}

export function toCanonicalUrl(path: string, environment?: CanonicalOriginEnvironment): string {
  if (!path.startsWith("/")) throw new CanonicalOriginError("invalid");
  return new URL(path, getCanonicalOrigin(environment)).toString();
}
