import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("internal SEO headers", () => {
  it("sets noindex headers for internal previews and the AeroComms app", async () => {
    const rules = await nextConfig.headers?.();
    const sources = new Map(rules?.map((rule) => [rule.source, rule.headers]));

    for (const source of ["/dashboard", "/premium-report-thumb", "/aerocomms/app/:path*"]) {
      expect(sources.get(source)).toContainEqual({
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive",
      });
    }
  });
});
