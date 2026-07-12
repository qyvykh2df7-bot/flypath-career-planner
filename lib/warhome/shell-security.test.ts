import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Warhome shell boundaries", () => {
  it("mantiene el logout disponible en el shell privado", () => {
    const sidebar = read("components/warhome/WarhomeSidebar.tsx");

    expect(sidebar).toContain("logoutWarhome");
    expect(sidebar).toContain("Cerrar sesión");
  });

  it("aplica el shell solo al grupo protegido y no al login", () => {
    const protectedLayout = read("app/warhome/(protected)/layout.tsx");
    const loginPage = read("app/warhome/login/page.tsx");

    expect(protectedLayout).toContain("WarhomeShell");
    expect(protectedLayout).toContain("getWarhomeAuthorization");
    expect(loginPage).not.toContain("WarhomeShell");
  });

  it("no muestra identificadores ni campos personales en el shell protegido", () => {
    const protectedSources = [
      "components/warhome/WarhomeHeader.tsx",
      "components/warhome/WarhomeSidebar.tsx",
      "components/warhome/WarhomeShell.tsx",
      "app/warhome/(protected)/page.tsx",
      "app/warhome/(protected)/leads/page.tsx",
    ].map(read);

    for (const source of protectedSources) {
      expect(source).not.toMatch(/user_?id/i);
      expect(source).not.toMatch(/e-?mail/i);
      expect(source).not.toMatch(/full_?name|phone|teléfono|mensaje/i);
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });
});
