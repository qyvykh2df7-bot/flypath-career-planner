type HeaderEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NODE_ENV?: string;
};

function configuredOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(environment: HeaderEnvironment = process.env): string {
  const supabaseOrigin = configuredOrigin(environment.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseWebSocketOrigin = supabaseOrigin?.replace(/^https:/, "wss:");
  const isDevelopment = environment.NODE_ENV === "development";
  const scriptSource = isDevelopment ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";
  const connectSources = ["'self'", supabaseOrigin, supabaseWebSocketOrigin].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSource}`,
    "style-src 'self' 'unsafe-inline'", // Next.js and next/font emit inline style tags without stable hashes.
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function getSecurityHeaders(environment: HeaderEnvironment = process.env) {
  const headers = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(environment) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), payment=(), usb=(), web-share=()" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ];

  if (environment.NODE_ENV === "production") {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }
  return headers;
}

export const INTERNAL_ROUTE_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];
