import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const clientFiles = [
  "lib/supabase/browser.ts",
  "app/warhome/login/WarhomeLoginForm.tsx",
  "components/warhome/WarhomeHeader.tsx",
  "components/warhome/WarhomeLeadActivity.tsx",
  "components/warhome/WarhomeEmailFilters.tsx",
  "components/warhome/WarhomeEmailsTable.tsx",
  "components/warhome/WarhomeLeadsTable.tsx",
  "components/warhome/WarhomeUserFilters.tsx",
  "components/warhome/WarhomeUsersTable.tsx",
  "components/warhome/WarhomeUserDetail.tsx",
  "components/warhome/WarhomeNavItem.tsx",
  "components/warhome/WarhomeSidebar.tsx",
  "app/warhome/(protected)/leads/[leadId]/page.tsx",
  "app/warhome/(protected)/emails/page.tsx",
  "app/warhome/(protected)/users/page.tsx",
  "app/warhome/(protected)/users/[userId]/page.tsx",
];

describe("Warhome client security", () => {
  it("no incluye la service role key en módulos de cliente", () => {
    for (const file of clientFiles) {
      const source = readFileSync(path.join(root, file), "utf8");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(source).not.toContain("getSupabaseAdmin");
    }
  });
});
