import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, getSecurityHeaders } from "./http-headers";

describe("security headers", () => {
  it("sets closed production policies without unsafe eval or frame embedding", () => {
    const headers = Object.fromEntries(getSecurityHeaders({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" }).map((header) => [header.key, header.value]));
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
    expect(headers["Content-Security-Policy"]).not.toContain("*");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["Permissions-Policy"]).toContain("microphone=(self)");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("keeps unsafe eval limited to local development", () => {
    expect(buildContentSecurityPolicy({ NODE_ENV: "development" })).toContain("unsafe-eval");
    expect(buildContentSecurityPolicy({ NODE_ENV: "production" })).not.toContain("unsafe-eval");
  });
});
