import type { NextConfig } from "next";
import { getSecurityHeaders, INTERNAL_ROUTE_HEADERS } from "./lib/security/http-headers";

const nextConfig: NextConfig = {
  // The purchased guide is intentionally outside /public. Include it only in
  // the traced server bundle of its protected download route.
  outputFileTracingIncludes: {
    "/api/commerce/guide/download": ["./private-assets/commerce/como-ser-piloto-guide.pdf"],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: getSecurityHeaders() },
      { source: "/dashboard", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/premium-report-thumb", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/aerocomms/app/:path*", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/review/:path*", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/free-report-preview", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/parents-report-preview", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/report-preview", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/supabase-parity-audit", headers: INTERNAL_ROUTE_HEADERS },
      { source: "/supabase-test", headers: INTERNAL_ROUTE_HEADERS },
    ];
  },
  async redirects() {
    const plannerQueryRedirects = ["schools", "start", "source", "review", "tab", "from"].map(
      (key) => ({
        source: "/",
        has: [{ type: "query" as const, key }],
        destination: "/career-planner",
        permanent: false,
      }),
    );
    return plannerQueryRedirects;
  },
};

export default nextConfig;
