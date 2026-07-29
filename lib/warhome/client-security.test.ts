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
  "components/warhome/WarhomeReviewFilters.tsx",
  "components/warhome/WarhomeReviewsTable.tsx",
  "components/warhome/WarhomeReviewDetail.tsx",
  "components/warhome/WarhomeNavItem.tsx",
  "components/warhome/WarhomeSidebar.tsx",
  "components/warhome/content/ContentCalendar.tsx",
  "components/warhome/content/ContentCalendarEventModal.tsx",
  "components/warhome/content/ContentCalendarEventForm.tsx",
  "components/warhome/content/content-calendar-utils.ts",
  "components/warhome/content/ContentIdeaWorkspace.tsx",
  "components/warhome/content/ContentAvailabilityWorkspace.tsx",
  "components/warhome/content/ContentAiPlannerWorkspace.tsx",
  "components/warhome/content/ContentItemForm.tsx",
  "components/warhome/content/ContentMetricsPanel.tsx",
  "app/warhome/(protected)/leads/[leadId]/page.tsx",
  "app/warhome/(protected)/emails/page.tsx",
  "app/warhome/(protected)/users/page.tsx",
  "app/warhome/(protected)/users/[userId]/page.tsx",
  "app/warhome/(protected)/reviews/page.tsx",
  "app/warhome/(protected)/reviews/[reviewId]/page.tsx",
  "app/warhome/(protected)/content/page.tsx",
  "app/warhome/(protected)/content/ideas/page.tsx",
  "app/warhome/(protected)/content/availability/page.tsx",
  "app/warhome/(protected)/content/planner/page.tsx",
  "app/warhome/(protected)/content/library/page.tsx",
  "app/warhome/(protected)/content/library/[contentId]/page.tsx",
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
