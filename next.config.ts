import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
