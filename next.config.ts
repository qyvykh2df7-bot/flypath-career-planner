import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The purchased guide is intentionally outside /public. Include it only in
  // the traced server bundle of its protected download route.
  outputFileTracingIncludes: {
    "/api/commerce/guide/download": ["./private-assets/commerce/como-ser-piloto-guide.pdf"],
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
