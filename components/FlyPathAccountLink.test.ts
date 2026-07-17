import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("FlyPathAccountLink", () => {
  it("usa el observador de sesión general y conserva su cleanup", () => {
    const source = readFileSync(resolve(process.cwd(), "components/FlyPathAccountLink.tsx"), "utf8");

    expect(source).toContain("initializeFlyPathAuthState(setState)");
    expect(source).not.toContain("admin_users");
    expect(source).not.toContain("getSupabaseAdmin");
  });
});
